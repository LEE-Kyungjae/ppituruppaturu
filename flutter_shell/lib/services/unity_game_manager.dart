import 'package:flutter/services.dart';
import 'dart:async';

class UnityGameManager {
  static const MethodChannel _channel = MethodChannel('ppituru.game/unity');
  static const EventChannel _eventChannel = EventChannel('ppituru.game/unity_events');

  static final StreamController<GameEvent> _gameEventController =
      StreamController<GameEvent>.broadcast();

  static bool _isInitialized = false;
  static StreamSubscription? _eventSubscription;

  static bool get isInitialized => _isInitialized;
  static Stream<GameEvent> get gameEvents => _gameEventController.stream;

  static Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Set up method call handler for Unity messages
      _channel.setMethodCallHandler(_handleUnityMessage);

      // Subscribe to Unity events
      _eventSubscription = _eventChannel.receiveBroadcastStream().listen(
        (dynamic event) {
          _handleUnityEvent(event);
        },
        onError: (error) {
          print('[UnityGameManager] Event stream error: $error');
        },
      );

      // Test connection
      await testConnection();

      _isInitialized = true;
      print('[UnityGameManager] Initialized successfully');
    } catch (e) {
      print('[UnityGameManager] Initialization failed: $e');
      throw UnityInitializationException('Failed to initialize Unity: $e');
    }
  }

  static Future<void> dispose() async {
    await _eventSubscription?.cancel();
    _eventSubscription = null;
    _gameEventController.close();
    _isInitialized = false;
  }

  static Future<bool> testConnection() async {
    try {
      final result = await _channel.invokeMethod('test_connection');
      return result == true;
    } catch (e) {
      print('[UnityGameManager] Connection test failed: $e');
      return false;
    }
  }

  static Future<bool> startGame({
    required String playerName,
    GameConfig? config,
  }) async {
    if (!_isInitialized) {
      throw UnityNotInitializedException();
    }

    try {
      final Map<String, dynamic> params = {
        'player_name': playerName,
        'config': config?.toJson() ?? GameConfig.defaultConfig().toJson(),
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      };

      final result = await _channel.invokeMethod('start_game', params);

      if (result == true) {
        print('[UnityGameManager] Game started for player: $playerName');
        return true;
      } else {
        print('[UnityGameManager] Failed to start game');
        return false;
      }
    } catch (e) {
      print('[UnityGameManager] Error starting game: $e');
      return false;
    }
  }

  static Future<void> pauseGame() async {
    if (!_isInitialized) return;

    try {
      await _channel.invokeMethod('pause_game');
      print('[UnityGameManager] Game paused');
    } catch (e) {
      print('[UnityGameManager] Error pausing game: $e');
    }
  }

  static Future<void> resumeGame() async {
    if (!_isInitialized) return;

    try {
      await _channel.invokeMethod('resume_game');
      print('[UnityGameManager] Game resumed');
    } catch (e) {
      print('[UnityGameManager] Error resuming game: $e');
    }
  }

  static Future<void> endGame() async {
    if (!_isInitialized) return;

    try {
      await _channel.invokeMethod('end_game');
      print('[UnityGameManager] Game ended');
    } catch (e) {
      print('[UnityGameManager] Error ending game: $e');
    }
  }

  static Future<GameState?> getGameState() async {
    if (!_isInitialized) return null;

    try {
      final result = await _channel.invokeMethod('get_game_state');
      if (result != null) {
        return GameState.fromJson(Map<String, dynamic>.from(result));
      }
      return null;
    } catch (e) {
      print('[UnityGameManager] Error getting game state: $e');
      return null;
    }
  }

  static Future<GameResult?> getGameResult() async {
    if (!_isInitialized) return null;

    try {
      final result = await _channel.invokeMethod('get_game_result');
      if (result != null) {
        return GameResult.fromJson(Map<String, dynamic>.from(result));
      }
      return null;
    } catch (e) {
      print('[UnityGameManager] Error getting game result: $e');
      return null;
    }
  }

  static Future<void> updatePlayerName(String name) async {
    if (!_isInitialized) return;

    try {
      await _channel.invokeMethod('update_player_name', {'name': name});
      print('[UnityGameManager] Player name updated: $name');
    } catch (e) {
      print('[UnityGameManager] Error updating player name: $e');
    }
  }

  static Future<void> sendHeartbeat() async {
    if (!_isInitialized) return;

    try {
      await _channel.invokeMethod('send_heartbeat');
    } catch (e) {
      print('[UnityGameManager] Heartbeat failed: $e');
    }
  }

  static Future<void> _handleUnityMessage(MethodCall call) async {
    try {
      switch (call.method) {
        case 'game_started':
          _handleGameStarted(call.arguments);
          break;

        case 'game_ended':
          _handleGameEnded(call.arguments);
          break;

        case 'score_updated':
          _handleScoreUpdated(call.arguments);
          break;

        case 'game_state_changed':
          _handleGameStateChanged(call.arguments);
          break;

        case 'unity_test':
          _handleUnityTest(call.arguments);
          break;

        case 'unity_heartbeat':
          _handleUnityHeartbeat(call.arguments);
          break;

        default:
          print('[UnityGameManager] Unknown method: ${call.method}');
      }
    } catch (e) {
      print('[UnityGameManager] Error handling Unity message: $e');
    }
  }

  static void _handleUnityEvent(dynamic event) {
    try {
      if (event is Map<String, dynamic>) {
        final gameEvent = GameEvent.fromJson(event);
        _gameEventController.add(gameEvent);
      }
    } catch (e) {
      print('[UnityGameManager] Error handling Unity event: $e');
    }
  }

  static void _handleGameStarted(dynamic arguments) {
    print('[UnityGameManager] Game started: $arguments');

    final event = GameEvent(
      type: GameEventType.gameStarted,
      data: arguments ?? {},
      timestamp: DateTime.now(),
    );

    _gameEventController.add(event);
  }

  static void _handleGameEnded(dynamic arguments) {
    print('[UnityGameManager] Game ended: $arguments');

    final event = GameEvent(
      type: GameEventType.gameEnded,
      data: arguments ?? {},
      timestamp: DateTime.now(),
    );

    _gameEventController.add(event);
  }

  static void _handleScoreUpdated(dynamic arguments) {
    print('[UnityGameManager] Score updated: $arguments');

    final event = GameEvent(
      type: GameEventType.scoreUpdated,
      data: arguments ?? {},
      timestamp: DateTime.now(),
    );

    _gameEventController.add(event);
  }

  static void _handleGameStateChanged(dynamic arguments) {
    print('[UnityGameManager] Game state changed: $arguments');

    final event = GameEvent(
      type: GameEventType.stateChanged,
      data: arguments ?? {},
      timestamp: DateTime.now(),
    );

    _gameEventController.add(event);
  }

  static void _handleUnityTest(dynamic arguments) {
    print('[UnityGameManager] Unity test: $arguments');
  }

  static void _handleUnityHeartbeat(dynamic arguments) {
    // Heartbeat - no need to log
  }
}

// Data classes
class GameConfig {
  final double playerSpeed;
  final double jumpForce;
  final int maxHealth;
  final double paintRange;
  final double paintRadius;
  final int maxPaintShots;

  const GameConfig({
    required this.playerSpeed,
    required this.jumpForce,
    required this.maxHealth,
    required this.paintRange,
    required this.paintRadius,
    required this.maxPaintShots,
  });

  factory GameConfig.defaultConfig() {
    return const GameConfig(
      playerSpeed: 5.0,
      jumpForce: 10.0,
      maxHealth: 100,
      paintRange: 10.0,
      paintRadius: 1.0,
      maxPaintShots: 50,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'player_speed': playerSpeed,
      'jump_force': jumpForce,
      'max_health': maxHealth,
      'paint_range': paintRange,
      'paint_radius': paintRadius,
      'max_paint_shots': maxPaintShots,
    };
  }

  factory GameConfig.fromJson(Map<String, dynamic> json) {
    return GameConfig(
      playerSpeed: (json['player_speed'] ?? 5.0).toDouble(),
      jumpForce: (json['jump_force'] ?? 10.0).toDouble(),
      maxHealth: json['max_health'] ?? 100,
      paintRange: (json['paint_range'] ?? 10.0).toDouble(),
      paintRadius: (json['paint_radius'] ?? 1.0).toDouble(),
      maxPaintShots: json['max_paint_shots'] ?? 50,
    );
  }
}

class GameState {
  final String state;
  final int score;
  final double gameTime;
  final String playerName;
  final double paintCoverage;

  const GameState({
    required this.state,
    required this.score,
    required this.gameTime,
    required this.playerName,
    required this.paintCoverage,
  });

  factory GameState.fromJson(Map<String, dynamic> json) {
    return GameState(
      state: json['state'] ?? 'Unknown',
      score: json['score'] ?? 0,
      gameTime: (json['game_time'] ?? 0.0).toDouble(),
      playerName: json['player_name'] ?? '',
      paintCoverage: (json['paint_coverage'] ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'state': state,
      'score': score,
      'game_time': gameTime,
      'player_name': playerName,
      'paint_coverage': paintCoverage,
    };
  }
}

class GameResult {
  final bool victory;
  final int score;
  final double gameTime;
  final String playerName;
  final double paintCoverage;
  final Map<String, dynamic> stats;

  const GameResult({
    required this.victory,
    required this.score,
    required this.gameTime,
    required this.playerName,
    required this.paintCoverage,
    required this.stats,
  });

  factory GameResult.fromJson(Map<String, dynamic> json) {
    return GameResult(
      victory: json['victory'] ?? false,
      score: json['score'] ?? 0,
      gameTime: (json['game_time'] ?? 0.0).toDouble(),
      playerName: json['player_name'] ?? '',
      paintCoverage: (json['paint_coverage'] ?? 0.0).toDouble(),
      stats: Map<String, dynamic>.from(json['stats'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'victory': victory,
      'score': score,
      'game_time': gameTime,
      'player_name': playerName,
      'paint_coverage': paintCoverage,
      'stats': stats,
    };
  }
}

enum GameEventType {
  gameStarted,
  gameEnded,
  scoreUpdated,
  stateChanged,
  paintShot,
  paintHit,
  playerMoved,
  error,
}

class GameEvent {
  final GameEventType type;
  final Map<String, dynamic> data;
  final DateTime timestamp;

  const GameEvent({
    required this.type,
    required this.data,
    required this.timestamp,
  });

  factory GameEvent.fromJson(Map<String, dynamic> json) {
    return GameEvent(
      type: _parseEventType(json['type']),
      data: Map<String, dynamic>.from(json['data'] ?? {}),
      timestamp: DateTime.fromMillisecondsSinceEpoch(
        json['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
      ),
    );
  }

  static GameEventType _parseEventType(String? type) {
    switch (type) {
      case 'game_started': return GameEventType.gameStarted;
      case 'game_ended': return GameEventType.gameEnded;
      case 'score_updated': return GameEventType.scoreUpdated;
      case 'state_changed': return GameEventType.stateChanged;
      case 'paint_shot': return GameEventType.paintShot;
      case 'paint_hit': return GameEventType.paintHit;
      case 'player_moved': return GameEventType.playerMoved;
      case 'error': return GameEventType.error;
      default: return GameEventType.error;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type.toString().split('.').last,
      'data': data,
      'timestamp': timestamp.millisecondsSinceEpoch,
    };
  }
}

// Exceptions
class UnityInitializationException implements Exception {
  final String message;
  const UnityInitializationException(this.message);

  @override
  String toString() => 'UnityInitializationException: $message';
}

class UnityNotInitializedException implements Exception {
  const UnityNotInitializedException();

  @override
  String toString() => 'Unity is not initialized. Call UnityGameManager.initialize() first.';
}