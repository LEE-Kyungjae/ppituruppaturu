import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;

enum ConnectionState {
  disconnected,
  connecting,
  connected,
  reconnecting,
  error
}

enum GameEventType {
  playerJoin,
  playerLeave,
  gameState,
  playerAction,
  scoreUpdate,
  gameEnd,
  ping,
  pong,
  roomJoin,
  roomLeave,
  roomUpdate
}

class GameMessage {
  final GameEventType type;
  final Map<String, dynamic> data;
  final int timestamp;
  final String? from;
  final String? to;
  final String? roomId;

  GameMessage({
    required this.type,
    required this.data,
    required this.timestamp,
    this.from,
    this.to,
    this.roomId,
  });

  factory GameMessage.fromJson(Map<String, dynamic> json) {
    return GameMessage(
      type: GameEventType.values.firstWhere(
        (e) => e.toString().split('.').last == json['type'],
        orElse: () => GameEventType.gameState,
      ),
      data: Map<String, dynamic>.from(json['data'] ?? {}),
      timestamp: json['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
      from: json['from'],
      to: json['to'],
      roomId: json['roomId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type.toString().split('.').last,
      'data': data,
      'timestamp': timestamp,
      if (from != null) 'from': from,
      if (to != null) 'to': to,
      if (roomId != null) 'roomId': roomId,
    };
  }
}

class WebSocketManager extends ChangeNotifier {
  static final WebSocketManager _instance = WebSocketManager._internal();
  factory WebSocketManager() => _instance;
  WebSocketManager._internal();

  WebSocketChannel? _channel;
  ConnectionState _connectionState = ConnectionState.disconnected;
  Timer? _pingTimer;
  Timer? _reconnectTimer;

  String? _serverUrl;
  String? _username;
  String? _roomId;
  String? _authToken;

  int _reconnectAttempts = 0;
  final int _maxReconnectAttempts = 5;
  final Duration _reconnectDelay = const Duration(seconds: 2);
  final Duration _pingInterval = const Duration(seconds: 30);

  // Message handlers
  final Map<GameEventType, List<Function(GameMessage)>> _messageHandlers = {};
  final StreamController<GameMessage> _messageController = StreamController.broadcast();
  final StreamController<ConnectionState> _connectionController = StreamController.broadcast();

  // Performance metrics
  int _messagesSent = 0;
  int _messagesReceived = 0;
  DateTime? _lastPingTime;
  Duration? _latency;

  // Getters
  ConnectionState get connectionState => _connectionState;
  String? get username => _username;
  String? get roomId => _roomId;
  Stream<GameMessage> get messageStream => _messageController.stream;
  Stream<ConnectionState> get connectionStream => _connectionController.stream;
  int get messagesSent => _messagesSent;
  int get messagesReceived => _messagesReceived;
  Duration? get latency => _latency;
  bool get isConnected => _connectionState == ConnectionState.connected;

  Future<bool> connect({
    required String serverUrl,
    required String username,
    String? authToken,
    String? roomId,
  }) async {
    if (_connectionState == ConnectionState.connecting ||
        _connectionState == ConnectionState.connected) {
      return true;
    }

    _serverUrl = serverUrl;
    _username = username;
    _authToken = authToken;
    _roomId = roomId;

    return _attemptConnection();
  }

  Future<bool> _attemptConnection() async {
    try {
      _setConnectionState(ConnectionState.connecting);

      // Build WebSocket URL with authentication
      final uri = Uri.parse(_serverUrl!);
      final wsUri = uri.replace(
        scheme: uri.scheme == 'https' ? 'wss' : 'ws',
        path: '/ws',
        queryParameters: {
          'username': _username!,
          if (_authToken != null) 'token': _authToken!,
          if (_roomId != null) 'room': _roomId!,
        },
      );

      debugPrint('Connecting to WebSocket: $wsUri');

      _channel = WebSocketChannel.connect(wsUri);

      // Set up message listener
      _channel!.stream.listen(
        _onMessage,
        onError: _onError,
        onDone: _onDisconnected,
      );

      // Send initial connection message
      await _sendMessage(GameMessage(
        type: GameEventType.playerJoin,
        data: {
          'username': _username!,
          'platform': Platform.isAndroid ? 'android' : 'ios',
          'version': '1.0.0',
        },
        timestamp: DateTime.now().millisecondsSinceEpoch,
      ));

      _setConnectionState(ConnectionState.connected);
      _startPing();
      _reconnectAttempts = 0;

      debugPrint('WebSocket connected successfully');
      return true;
    } catch (e) {
      debugPrint('WebSocket connection failed: $e');
      _setConnectionState(ConnectionState.error);
      _scheduleReconnect();
      return false;
    }
  }

  void _onMessage(dynamic message) {
    try {
      _messagesReceived++;
      final data = jsonDecode(message.toString());
      final gameMessage = GameMessage.fromJson(data);

      // Handle ping/pong for latency calculation
      if (gameMessage.type == GameEventType.pong && _lastPingTime != null) {
        _latency = DateTime.now().difference(_lastPingTime!);
        _lastPingTime = null;
      }

      // Notify message handlers
      final handlers = _messageHandlers[gameMessage.type] ?? [];
      for (final handler in handlers) {
        try {
          handler(gameMessage);
        } catch (e) {
          debugPrint('Message handler error: $e');
        }
      }

      // Add to message stream
      _messageController.add(gameMessage);
    } catch (e) {
      debugPrint('Error parsing message: $e');
    }
  }

  void _onError(error) {
    debugPrint('WebSocket error: $error');
    _setConnectionState(ConnectionState.error);
    _scheduleReconnect();
  }

  void _onDisconnected() {
    debugPrint('WebSocket disconnected');
    _setConnectionState(ConnectionState.disconnected);
    _stopPing();
    _scheduleReconnect();
  }

  void _setConnectionState(ConnectionState state) {
    if (_connectionState != state) {
      _connectionState = state;
      _connectionController.add(state);
      notifyListeners();
    }
  }

  void _startPing() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(_pingInterval, (timer) {
      if (_connectionState == ConnectionState.connected) {
        _lastPingTime = DateTime.now();
        _sendMessage(GameMessage(
          type: GameEventType.ping,
          data: {'timestamp': _lastPingTime!.millisecondsSinceEpoch},
          timestamp: _lastPingTime!.millisecondsSinceEpoch,
        ));
      }
    });
  }

  void _stopPing() {
    _pingTimer?.cancel();
    _pingTimer = null;
  }

  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      debugPrint('Max reconnection attempts reached');
      return;
    }

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectDelay, () {
      if (_connectionState != ConnectionState.connected) {
        _reconnectAttempts++;
        _setConnectionState(ConnectionState.reconnecting);
        debugPrint('Reconnection attempt $_reconnectAttempts');
        _attemptConnection();
      }
    });
  }

  Future<void> _sendMessage(GameMessage message) async {
    if (_channel == null || _connectionState != ConnectionState.connected) {
      debugPrint('Cannot send message: not connected');
      return;
    }

    try {
      final jsonString = jsonEncode(message.toJson());
      _channel!.sink.add(jsonString);
      _messagesSent++;
    } catch (e) {
      debugPrint('Error sending message: $e');
    }
  }

  // Public message sending methods
  Future<void> sendPlayerAction({
    required String action,
    required Map<String, dynamic> actionData,
  }) async {
    await _sendMessage(GameMessage(
      type: GameEventType.playerAction,
      data: {
        'action': action,
        'actionData': actionData,
        'username': _username,
      },
      timestamp: DateTime.now().millisecondsSinceEpoch,
      from: _username,
      roomId: _roomId,
    ));
  }

  Future<void> sendGameState(Map<String, dynamic> gameState) async {
    await _sendMessage(GameMessage(
      type: GameEventType.gameState,
      data: gameState,
      timestamp: DateTime.now().millisecondsSinceEpoch,
      from: _username,
      roomId: _roomId,
    ));
  }

  Future<void> sendScoreUpdate(int score) async {
    await _sendMessage(GameMessage(
      type: GameEventType.scoreUpdate,
      data: {
        'score': score,
        'username': _username,
      },
      timestamp: DateTime.now().millisecondsSinceEpoch,
      from: _username,
      roomId: _roomId,
    ));
  }

  Future<void> joinRoom(String roomId) async {
    _roomId = roomId;
    await _sendMessage(GameMessage(
      type: GameEventType.roomJoin,
      data: {
        'roomId': roomId,
        'username': _username,
      },
      timestamp: DateTime.now().millisecondsSinceEpoch,
      from: _username,
    ));
  }

  Future<void> leaveRoom() async {
    if (_roomId != null) {
      await _sendMessage(GameMessage(
        type: GameEventType.roomLeave,
        data: {
          'roomId': _roomId,
          'username': _username,
        },
        timestamp: DateTime.now().millisecondsSinceEpoch,
        from: _username,
      ));
      _roomId = null;
    }
  }

  // Message handler registration
  void addMessageHandler(GameEventType type, Function(GameMessage) handler) {
    _messageHandlers.putIfAbsent(type, () => []).add(handler);
  }

  void removeMessageHandler(GameEventType type, Function(GameMessage) handler) {
    _messageHandlers[type]?.remove(handler);
  }

  void clearMessageHandlers([GameEventType? type]) {
    if (type != null) {
      _messageHandlers[type]?.clear();
    } else {
      _messageHandlers.clear();
    }
  }

  // Cross-platform game synchronization
  Future<void> syncWithWebGame() async {
    if (_connectionState != ConnectionState.connected) {
      debugPrint('Cannot sync: not connected');
      return;
    }

    await _sendMessage(GameMessage(
      type: GameEventType.gameState,
      data: {
        'action': 'request_sync',
        'platform': 'mobile',
        'username': _username,
      },
      timestamp: DateTime.now().millisecondsSinceEpoch,
      from: _username,
      roomId: _roomId,
    ));
  }

  // Clean up
  void disconnect() {
    _stopPing();
    _reconnectTimer?.cancel();

    if (_channel != null) {
      // Send leave message before closing
      if (_connectionState == ConnectionState.connected) {
        _sendMessage(GameMessage(
          type: GameEventType.playerLeave,
          data: {
            'username': _username,
            'reason': 'user_disconnect',
          },
          timestamp: DateTime.now().millisecondsSinceEpoch,
          from: _username,
        ));
      }

      _channel!.sink.close(status.goingAway);
      _channel = null;
    }

    _setConnectionState(ConnectionState.disconnected);
    clearMessageHandlers();
  }

  @override
  void dispose() {
    disconnect();
    _messageController.close();
    _connectionController.close();
    super.dispose();
  }

  // Debug information
  Map<String, dynamic> getDebugInfo() {
    return {
      'connectionState': _connectionState.toString(),
      'serverUrl': _serverUrl,
      'username': _username,
      'roomId': _roomId,
      'messagesSent': _messagesSent,
      'messagesReceived': _messagesReceived,
      'latency': _latency?.inMilliseconds,
      'reconnectAttempts': _reconnectAttempts,
      'activeHandlers': _messageHandlers.keys.map((k) => k.toString()).toList(),
    };
  }
}