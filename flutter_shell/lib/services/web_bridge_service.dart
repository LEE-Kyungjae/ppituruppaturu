import 'dart:async';
import 'dart:convert';
import 'dart:html' as html;

/// 웹 프론트엔드와 Flutter 웹 간의 메시지 패싱을 처리하는 서비스
class WebBridgeService {
  static final WebBridgeService _instance = WebBridgeService._internal();
  factory WebBridgeService() => _instance;
  WebBridgeService._internal();

  final StreamController<WebMessage> _messageController = StreamController<WebMessage>.broadcast();
  late StreamSubscription _messageSubscription;
  bool _isInitialized = false;

  /// 웹 브리지에서 오는 메시지 스트림
  Stream<WebMessage> get messageStream => _messageController.stream;

  /// 브리지 초기화
  void initialize() {
    if (_isInitialized) return;

    // PostMessage 이벤트 리스너 등록
    _messageSubscription = html.window.onMessage.listen((html.MessageEvent event) {
      _handleIncomingMessage(event);
    });

    // Flutter 앱 준비 완료 신호 전송
    _sendToWeb(WebMessage(
      type: 'flutter_ready',
      data: {'timestamp': DateTime.now().millisecondsSinceEpoch},
      timestamp: DateTime.now().millisecondsSinceEpoch,
    ));

    _isInitialized = true;
    print('[WebBridge] Service initialized');
  }

  /// 메시지 수신 처리
  void _handleIncomingMessage(html.MessageEvent event) {
    try {
      final data = event.data;

      if (data is Map<String, dynamic>) {
        final message = WebMessage.fromJson(data);

        // 시스템 메시지 처리
        if (message.type == 'web_bridge_ready') {
          print('[WebBridge] Web bridge ready');
          return;
        }

        if (message.type == 'heartbeat') {
          _sendToWeb(WebMessage(
            type: 'heartbeat_response',
            data: {'timestamp': DateTime.now().millisecondsSinceEpoch},
            timestamp: DateTime.now().millisecondsSinceEpoch,
          ));
          return;
        }

        // 일반 메시지를 스트림으로 전달
        _messageController.add(message);
        print('[WebBridge] Received message: ${message.type}');
      }
    } catch (e) {
      print('[WebBridge] Error handling message: $e');
    }
  }

  /// 웹으로 메시지 전송
  void _sendToWeb(WebMessage message) {
    try {
      final messageData = message.toJson();
      html.window.parent?.postMessage(messageData, '*');
      print('[WebBridge] Sent message: ${message.type}');
    } catch (e) {
      print('[WebBridge] Error sending message: $e');
    }
  }

  /// 게임 시작 요청 전송
  void requestGameStart(String playerName, Map<String, dynamic>? config) {
    _sendToWeb(WebMessage(
      type: 'start_game_request',
      data: {
        'playerName': playerName,
        'config': config ?? {},
      },
      timestamp: DateTime.now().millisecondsSinceEpoch,
    ));
  }

  /// 게임 일시정지 요청
  void requestGamePause() {
    _sendToWeb(WebMessage(
      type: 'pause_game',
      data: {},
      timestamp: DateTime.now().millisecondsSinceEpoch,
    ));
  }

  /// 게임 재개 요청
  void requestGameResume() {
    _sendToWeb(WebMessage(
      type: 'resume_game',
      data: {},
      timestamp: DateTime.now().millisecondsSinceEpoch,
    ));
  }

  /// 플레이어 입력 전송
  void sendPlayerInput(Map<String, dynamic> input) {
    _sendToWeb(WebMessage(
      type: 'player_input',
      data: input,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    ));
  }

  /// 게임 설정 업데이트 요청
  void updateGameSettings(Map<String, dynamic> settings) {
    _sendToWeb(WebMessage(
      type: 'update_settings',
      data: settings,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    ));
  }

  /// 멀티플레이어 이벤트 전송
  void sendMultiplayerEvent(String eventType, Map<String, dynamic> eventData) {
    _sendToWeb(WebMessage(
      type: 'multiplayer_event',
      data: {
        'eventType': eventType,
        'eventData': eventData,
      },
      timestamp: DateTime.now().millisecondsSinceEpoch,
    ));
  }

  /// 통계 요청
  void requestStatistics() {
    _sendToWeb(WebMessage(
      type: 'request_statistics',
      data: {},
      timestamp: DateTime.now().millisecondsSinceEpoch,
    ));
  }

  /// 리더보드 요청
  void requestLeaderboard(String type, int page, int limit) {
    _sendToWeb(WebMessage(
      type: 'request_leaderboard',
      data: {
        'type': type,
        'page': page,
        'limit': limit,
      },
      timestamp: DateTime.now().millisecondsSinceEpoch,
    ));
  }

  /// 서비스 정리
  void dispose() {
    if (_isInitialized) {
      _sendToWeb(WebMessage(
        type: 'flutter_disconnected',
        data: {'timestamp': DateTime.now().millisecondsSinceEpoch},
        timestamp: DateTime.now().millisecondsSinceEpoch,
      ));

      _messageSubscription.cancel();
      _messageController.close();
      _isInitialized = false;
    }
  }
}

/// 웹 메시지 데이터 모델
class WebMessage {
  final String type;
  final Map<String, dynamic> data;
  final int timestamp;
  final String? sessionId;

  WebMessage({
    required this.type,
    required this.data,
    required this.timestamp,
    this.sessionId,
  });

  factory WebMessage.fromJson(Map<String, dynamic> json) {
    return WebMessage(
      type: json['type'] ?? '',
      data: json['data'] ?? {},
      timestamp: json['timestamp'] ?? 0,
      sessionId: json['sessionId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'data': data,
      'timestamp': timestamp,
      if (sessionId != null) 'sessionId': sessionId,
    };
  }
}

/// 게임 이벤트 타입 열거형
enum WebGameEventType {
  gameStarted('game_started'),
  gameStateUpdate('game_state_update'),
  gameResult('game_result'),
  gamePaused('game_paused'),
  gameResumed('game_resumed'),
  gameEnded('game_ended'),
  playerJoined('player_joined'),
  playerLeft('player_left'),
  statisticsUpdate('statistics_update'),
  leaderboardUpdate('leaderboard_update'),
  achievementUnlocked('achievement_unlocked');

  const WebGameEventType(this.value);
  final String value;
}

/// 웹 브리지 상태 열거형
enum WebBridgeStatus {
  disconnected,
  connecting,
  connected,
  error
}

/// 웹 브리지 확장 기능
extension WebBridgeExtensions on WebBridgeService {
  /// 특정 타입의 메시지만 필터링하는 스트림
  Stream<WebMessage> messagesOfType(String messageType) {
    return messageStream.where((message) => message.type == messageType);
  }

  /// 게임 이벤트만 필터링하는 스트림
  Stream<WebMessage> get gameEventStream {
    final gameEventTypes = WebGameEventType.values.map((e) => e.value).toSet();
    return messageStream.where((message) => gameEventTypes.contains(message.type));
  }

  /// 시스템 메시지만 필터링하는 스트림
  Stream<WebMessage> get systemMessageStream {
    const systemTypes = {
      'web_bridge_ready',
      'flutter_ready',
      'heartbeat',
      'heartbeat_response',
      'flutter_disconnected'
    };
    return messageStream.where((message) => systemTypes.contains(message.type));
  }
}

/// 싱글톤 인스턴스 접근
final webBridge = WebBridgeService();