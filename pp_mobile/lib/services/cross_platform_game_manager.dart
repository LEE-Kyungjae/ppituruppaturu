import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'websocket_manager.dart';

enum GamePlatform { mobile, web, desktop }
enum GameSyncState { synced, syncing, outOfSync, error }

class PlayerState {
  final String username;
  final GamePlatform platform;
  final Map<String, dynamic> position;
  final Map<String, dynamic> gameData;
  final int score;
  final DateTime lastUpdate;
  final bool isActive;

  PlayerState({
    required this.username,
    required this.platform,
    required this.position,
    required this.gameData,
    required this.score,
    required this.lastUpdate,
    this.isActive = true,
  });

  factory PlayerState.fromJson(Map<String, dynamic> json) {
    return PlayerState(
      username: json['username'],
      platform: GamePlatform.values.firstWhere(
        (p) => p.toString().split('.').last == json['platform'],
        orElse: () => GamePlatform.mobile,
      ),
      position: Map<String, dynamic>.from(json['position'] ?? {}),
      gameData: Map<String, dynamic>.from(json['gameData'] ?? {}),
      score: json['score'] ?? 0,
      lastUpdate: DateTime.fromMillisecondsSinceEpoch(json['lastUpdate'] ?? 0),
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'platform': platform.toString().split('.').last,
      'position': position,
      'gameData': gameData,
      'score': score,
      'lastUpdate': lastUpdate.millisecondsSinceEpoch,
      'isActive': isActive,
    };
  }

  PlayerState copyWith({
    String? username,
    GamePlatform? platform,
    Map<String, dynamic>? position,
    Map<String, dynamic>? gameData,
    int? score,
    DateTime? lastUpdate,
    bool? isActive,
  }) {
    return PlayerState(
      username: username ?? this.username,
      platform: platform ?? this.platform,
      position: position ?? this.position,
      gameData: gameData ?? this.gameData,
      score: score ?? this.score,
      lastUpdate: lastUpdate ?? this.lastUpdate,
      isActive: isActive ?? this.isActive,
    );
  }
}

class CrossPlatformGameState {
  final String gameId;
  final String gameType;
  final Map<String, PlayerState> players;
  final Map<String, dynamic> sharedGameData;
  final DateTime lastUpdate;
  final GameSyncState syncState;

  CrossPlatformGameState({
    required this.gameId,
    required this.gameType,
    required this.players,
    required this.sharedGameData,
    required this.lastUpdate,
    this.syncState = GameSyncState.synced,
  });

  factory CrossPlatformGameState.fromJson(Map<String, dynamic> json) {
    final playersMap = <String, PlayerState>{};
    if (json['players'] != null) {
      for (final entry in (json['players'] as Map<String, dynamic>).entries) {
        playersMap[entry.key] = PlayerState.fromJson(entry.value);
      }
    }

    return CrossPlatformGameState(
      gameId: json['gameId'] ?? '',
      gameType: json['gameType'] ?? '',
      players: playersMap,
      sharedGameData: Map<String, dynamic>.from(json['sharedGameData'] ?? {}),
      lastUpdate: DateTime.fromMillisecondsSinceEpoch(json['lastUpdate'] ?? 0),
      syncState: GameSyncState.values.firstWhere(
        (s) => s.toString().split('.').last == json['syncState'],
        orElse: () => GameSyncState.synced,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    final playersMap = <String, dynamic>{};
    for (final entry in players.entries) {
      playersMap[entry.key] = entry.value.toJson();
    }

    return {
      'gameId': gameId,
      'gameType': gameType,
      'players': playersMap,
      'sharedGameData': sharedGameData,
      'lastUpdate': lastUpdate.millisecondsSinceEpoch,
      'syncState': syncState.toString().split('.').last,
    };
  }
}

class CrossPlatformGameManager extends ChangeNotifier {
  final WebSocketManager _wsManager;

  CrossPlatformGameState? _currentGameState;
  PlayerState? _localPlayer;
  Timer? _syncTimer;
  Timer? _stateUpdateTimer;

  final Duration _syncInterval = const Duration(seconds: 1);
  final Duration _stateUpdateInterval = const Duration(milliseconds: 100);

  // Event streams
  final StreamController<CrossPlatformGameState> _gameStateController =
      StreamController.broadcast();
  final StreamController<PlayerState> _playerJoinController =
      StreamController.broadcast();
  final StreamController<String> _playerLeaveController =
      StreamController.broadcast();
  final StreamController<Map<String, dynamic>> _crossPlatformEventController =
      StreamController.broadcast();

  // Performance tracking
  int _syncMessagesSent = 0;
  int _syncMessagesReceived = 0;
  Duration? _avgSyncLatency;
  final List<Duration> _syncLatencies = [];

  CrossPlatformGameManager(this._wsManager) {
    _setupMessageHandlers();
  }

  // Getters
  CrossPlatformGameState? get currentGameState => _currentGameState;
  PlayerState? get localPlayer => _localPlayer;
  Stream<CrossPlatformGameState> get gameStateStream => _gameStateController.stream;
  Stream<PlayerState> get playerJoinStream => _playerJoinController.stream;
  Stream<String> get playerLeaveStream => _playerLeaveController.stream;
  Stream<Map<String, dynamic>> get crossPlatformEventStream =>
      _crossPlatformEventController.stream;

  bool get isInCrossPlatformGame => _currentGameState != null;
  int get playerCount => _currentGameState?.players.length ?? 0;
  List<PlayerState> get remotePlayers =>
      _currentGameState?.players.values
          .where((p) => p.username != _localPlayer?.username)
          .toList() ?? [];

  void _setupMessageHandlers() {
    _wsManager.addMessageHandler(GameEventType.gameState, _handleGameState);
    _wsManager.addMessageHandler(GameEventType.playerJoin, _handlePlayerJoin);
    _wsManager.addMessageHandler(GameEventType.playerLeave, _handlePlayerLeave);
    _wsManager.addMessageHandler(GameEventType.playerAction, _handlePlayerAction);
    _wsManager.addMessageHandler(GameEventType.roomUpdate, _handleRoomUpdate);
  }

  Future<bool> joinCrossPlatformGame({
    required String gameId,
    required String gameType,
    required String username,
    Map<String, dynamic>? initialGameData,
  }) async {
    try {
      if (!_wsManager.isConnected) {
        debugPrint('Cannot join cross-platform game: WebSocket not connected');
        return false;
      }

      // Create local player state
      _localPlayer = PlayerState(
        username: username,
        platform: GamePlatform.mobile,
        position: {'x': 0, 'y': 0},
        gameData: initialGameData ?? {},
        score: 0,
        lastUpdate: DateTime.now(),
      );

      // Join the game room
      await _wsManager.joinRoom(gameId);

      // Send initial game state
      await _wsManager.sendGameState({
        'action': 'join_cross_platform',
        'gameId': gameId,
        'gameType': gameType,
        'playerState': _localPlayer!.toJson(),
        'platform': 'mobile',
      });

      // Start sync timers
      _startSyncTimers();

      debugPrint('Joined cross-platform game: $gameId');
      return true;
    } catch (e) {
      debugPrint('Error joining cross-platform game: $e');
      return false;
    }
  }

  Future<void> leaveCrossPlatformGame() async {
    if (_currentGameState == null) return;

    try {
      // Send leave message
      await _wsManager.sendGameState({
        'action': 'leave_cross_platform',
        'gameId': _currentGameState!.gameId,
        'playerState': _localPlayer?.toJson(),
      });

      await _wsManager.leaveRoom();
    } catch (e) {
      debugPrint('Error leaving cross-platform game: $e');
    }

    _stopSyncTimers();
    _currentGameState = null;
    _localPlayer = null;
    notifyListeners();
  }

  void updateLocalPlayerState({
    Map<String, dynamic>? position,
    Map<String, dynamic>? gameData,
    int? score,
  }) {
    if (_localPlayer == null) return;

    _localPlayer = _localPlayer!.copyWith(
      position: position ?? _localPlayer!.position,
      gameData: {..._localPlayer!.gameData, ...?gameData},
      score: score ?? _localPlayer!.score,
      lastUpdate: DateTime.now(),
    );

    // Update in current game state
    if (_currentGameState != null) {
      final updatedPlayers = Map<String, PlayerState>.from(_currentGameState!.players);
      updatedPlayers[_localPlayer!.username] = _localPlayer!;

      _currentGameState = CrossPlatformGameState(
        gameId: _currentGameState!.gameId,
        gameType: _currentGameState!.gameType,
        players: updatedPlayers,
        sharedGameData: _currentGameState!.sharedGameData,
        lastUpdate: DateTime.now(),
        syncState: GameSyncState.syncing,
      );

      notifyListeners();
    }
  }

  Future<void> sendCrossPlatformAction({
    required String action,
    required Map<String, dynamic> actionData,
    String? targetPlayer,
  }) async {
    if (_currentGameState == null) return;

    await _wsManager.sendPlayerAction(
      action: action,
      actionData: {
        ...actionData,
        'gameId': _currentGameState!.gameId,
        'platform': 'mobile',
        'targetPlayer': targetPlayer,
      },
    );

    _crossPlatformEventController.add({
      'action': action,
      'data': actionData,
      'from': _localPlayer?.username,
      'targetPlayer': targetPlayer,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });
  }

  void _handleGameState(GameMessage message) {
    try {
      final data = message.data;

      if (data['action'] == 'sync_response') {
        _handleSyncResponse(data);
      } else if (data['action'] == 'state_update') {
        _handleStateUpdate(data);
      }

      _syncMessagesReceived++;
    } catch (e) {
      debugPrint('Error handling game state: $e');
    }
  }

  void _handleSyncResponse(Map<String, dynamic> data) {
    if (data['gameState'] != null) {
      _currentGameState = CrossPlatformGameState.fromJson(data['gameState']);
      _currentGameState = CrossPlatformGameState(
        gameId: _currentGameState!.gameId,
        gameType: _currentGameState!.gameType,
        players: _currentGameState!.players,
        sharedGameData: _currentGameState!.sharedGameData,
        lastUpdate: _currentGameState!.lastUpdate,
        syncState: GameSyncState.synced,
      );

      _gameStateController.add(_currentGameState!);
      notifyListeners();
    }
  }

  void _handleStateUpdate(Map<String, dynamic> data) {
    if (_currentGameState == null) return;

    final updatedPlayers = Map<String, PlayerState>.from(_currentGameState!.players);

    if (data['playerState'] != null) {
      final playerState = PlayerState.fromJson(data['playerState']);
      updatedPlayers[playerState.username] = playerState;
    }

    if (data['sharedGameData'] != null) {
      _currentGameState = CrossPlatformGameState(
        gameId: _currentGameState!.gameId,
        gameType: _currentGameState!.gameType,
        players: updatedPlayers,
        sharedGameData: {..._currentGameState!.sharedGameData, ...data['sharedGameData']},
        lastUpdate: DateTime.now(),
        syncState: GameSyncState.synced,
      );
    } else {
      _currentGameState = CrossPlatformGameState(
        gameId: _currentGameState!.gameId,
        gameType: _currentGameState!.gameType,
        players: updatedPlayers,
        sharedGameData: _currentGameState!.sharedGameData,
        lastUpdate: DateTime.now(),
        syncState: GameSyncState.synced,
      );
    }

    _gameStateController.add(_currentGameState!);
    notifyListeners();
  }

  void _handlePlayerJoin(GameMessage message) {
    if (message.data['playerState'] != null) {
      final playerState = PlayerState.fromJson(message.data['playerState']);
      _playerJoinController.add(playerState);

      // Add to current game state if we're in a game
      if (_currentGameState != null) {
        final updatedPlayers = Map<String, PlayerState>.from(_currentGameState!.players);
        updatedPlayers[playerState.username] = playerState;

        _currentGameState = CrossPlatformGameState(
          gameId: _currentGameState!.gameId,
          gameType: _currentGameState!.gameType,
          players: updatedPlayers,
          sharedGameData: _currentGameState!.sharedGameData,
          lastUpdate: DateTime.now(),
          syncState: GameSyncState.synced,
        );

        notifyListeners();
      }
    }
  }

  void _handlePlayerLeave(GameMessage message) {
    final username = message.data['username'];
    if (username != null) {
      _playerLeaveController.add(username);

      // Remove from current game state if we're in a game
      if (_currentGameState != null) {
        final updatedPlayers = Map<String, PlayerState>.from(_currentGameState!.players);
        updatedPlayers.remove(username);

        _currentGameState = CrossPlatformGameState(
          gameId: _currentGameState!.gameId,
          gameType: _currentGameState!.gameType,
          players: updatedPlayers,
          sharedGameData: _currentGameState!.sharedGameData,
          lastUpdate: DateTime.now(),
          syncState: GameSyncState.synced,
        );

        notifyListeners();
      }
    }
  }

  void _handlePlayerAction(GameMessage message) {
    _crossPlatformEventController.add({
      'action': message.data['action'],
      'actionData': message.data['actionData'],
      'from': message.from,
      'timestamp': message.timestamp,
      'platform': message.data['platform'],
    });
  }

  void _handleRoomUpdate(GameMessage message) {
    // Handle room-specific updates
    if (message.data['gameState'] != null) {
      _handleSyncResponse(message.data);
    }
  }

  void _startSyncTimers() {
    _stopSyncTimers();

    // Regular sync with server
    _syncTimer = Timer.periodic(_syncInterval, (_) => _requestSync());

    // Local state updates
    _stateUpdateTimer = Timer.periodic(_stateUpdateInterval, (_) => _sendStateUpdate());
  }

  void _stopSyncTimers() {
    _syncTimer?.cancel();
    _stateUpdateTimer?.cancel();
    _syncTimer = null;
    _stateUpdateTimer = null;
  }

  Future<void> _requestSync() async {
    if (_currentGameState == null || !_wsManager.isConnected) return;

    final startTime = DateTime.now();

    await _wsManager.sendGameState({
      'action': 'request_sync',
      'gameId': _currentGameState!.gameId,
      'platform': 'mobile',
      'timestamp': startTime.millisecondsSinceEpoch,
    });

    _syncMessagesSent++;
  }

  Future<void> _sendStateUpdate() async {
    if (_localPlayer == null || _currentGameState == null || !_wsManager.isConnected) {
      return;
    }

    await _wsManager.sendGameState({
      'action': 'state_update',
      'gameId': _currentGameState!.gameId,
      'playerState': _localPlayer!.toJson(),
      'platform': 'mobile',
    });
  }

  // Performance monitoring
  Map<String, dynamic> getPerformanceMetrics() {
    return {
      'syncMessagesSent': _syncMessagesSent,
      'syncMessagesReceived': _syncMessagesReceived,
      'avgSyncLatency': _avgSyncLatency?.inMilliseconds,
      'playerCount': playerCount,
      'isInGame': isInCrossPlatformGame,
      'syncState': _currentGameState?.syncState.toString(),
    };
  }

  @override
  void dispose() {
    _stopSyncTimers();
    leaveCrossPlatformGame();
    _gameStateController.close();
    _playerJoinController.close();
    _playerLeaveController.close();
    _crossPlatformEventController.close();
    super.dispose();
  }
}