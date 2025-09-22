import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';

import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart' hide User;
import '../services/game_service.dart';
import '../services/unity_game_manager.dart' hide GameResult;

// Core providers
final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('SharedPreferences provider must be overridden');
});

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio();

  // Configure base URL
  dio.options.baseUrl = 'https://ppituruppaturu.com/api';
  dio.options.connectTimeout = const Duration(seconds: 10);
  dio.options.receiveTimeout = const Duration(seconds: 10);

  // Add interceptors
  dio.interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
    logPrint: (object) => print('[HTTP] $object'),
  ));

  return dio;
});

// Service providers
final authServiceProvider = Provider<AuthService>((ref) {
  final dio = ref.watch(dioProvider);
  final prefs = ref.watch(sharedPreferencesProvider);
  return AuthService(dio: dio, prefs: prefs);
});

final apiServiceProvider = Provider<ApiService>((ref) {
  final dio = ref.watch(dioProvider);
  final authService = ref.watch(authServiceProvider);
  return ApiService(dio: dio, authService: authService);
});

final gameServiceProvider = Provider<GameService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return GameService(apiService: apiService);
});

// State providers
final authStateProvider = StreamProvider<User?>((ref) {
  final authService = ref.watch(authServiceProvider);
  return authService.authStateStream;
});

final currentUserProvider = Provider<User?>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.maybeWhen(
    data: (user) => user,
    orElse: () => null,
  );
});

// Unity integration providers
final unityGameStateProvider = StreamProvider<GameState?>((ref) {
  return UnityGameManager.gameEvents
      .where((event) => event.type == GameEventType.stateChanged)
      .map((event) => GameState.fromJson(event.data))
      .handleError((error) {
        print('[Provider] Unity game state error: $error');
      });
});

final gameEventsProvider = StreamProvider<GameEvent>((ref) {
  return UnityGameManager.gameEvents;
});

// Game session provider
final gameSessionProvider = StateNotifierProvider<GameSessionNotifier, GameSession>((ref) {
  final gameService = ref.watch(gameServiceProvider);
  return GameSessionNotifier(gameService);
});

// Game session state
class GameSession {
  final String? sessionId;
  final String? playerName;
  final GameState? currentState;
  final bool isActive;
  final DateTime? startTime;
  final DateTime? endTime;

  const GameSession({
    this.sessionId,
    this.playerName,
    this.currentState,
    this.isActive = false,
    this.startTime,
    this.endTime,
  });

  GameSession copyWith({
    String? sessionId,
    String? playerName,
    GameState? currentState,
    bool? isActive,
    DateTime? startTime,
    DateTime? endTime,
  }) {
    return GameSession(
      sessionId: sessionId ?? this.sessionId,
      playerName: playerName ?? this.playerName,
      currentState: currentState ?? this.currentState,
      isActive: isActive ?? this.isActive,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
    );
  }
}

class GameSessionNotifier extends StateNotifier<GameSession> {
  final GameService _gameService;

  GameSessionNotifier(this._gameService) : super(const GameSession()) {
    _listenToUnityEvents();
  }

  void _listenToUnityEvents() {
    UnityGameManager.gameEvents.listen((event) {
      switch (event.type) {
        case GameEventType.gameStarted:
          _handleGameStarted(event);
          break;
        case GameEventType.gameEnded:
          _handleGameEnded(event);
          break;
        case GameEventType.stateChanged:
          _handleStateChanged(event);
          break;
        default:
          break;
      }
    });
  }

  Future<bool> startGame(String playerName) async {
    try {
      final sessionId = await _gameService.createGameSession(playerName);

      state = state.copyWith(
        sessionId: sessionId,
        playerName: playerName,
        isActive: true,
        startTime: DateTime.now(),
      );

      final success = await UnityGameManager.startGame(playerName: playerName);

      if (!success) {
        state = state.copyWith(isActive: false);
        return false;
      }

      return true;
    } catch (e) {
      print('[GameSessionNotifier] Error starting game: $e');
      return false;
    }
  }

  Future<void> endGame() async {
    if (!state.isActive) return;

    try {
      await UnityGameManager.endGame();

      if (state.sessionId != null) {
        await _gameService.endGameSession(state.sessionId!);
      }

      state = state.copyWith(
        isActive: false,
        endTime: DateTime.now(),
      );
    } catch (e) {
      print('[GameSessionNotifier] Error ending game: $e');
    }
  }

  Future<void> pauseGame() async {
    if (!state.isActive) return;
    await UnityGameManager.pauseGame();
  }

  Future<void> resumeGame() async {
    if (!state.isActive) return;
    await UnityGameManager.resumeGame();
  }

  void _handleGameStarted(GameEvent event) {
    print('[GameSessionNotifier] Game started: ${event.data}');
  }

  void _handleGameEnded(GameEvent event) {
    final result = GameResult.fromJson(event.data);

    if (state.sessionId != null) {
      _gameService.submitGameResult(state.sessionId!, result);
    }

    state = state.copyWith(
      isActive: false,
      endTime: DateTime.now(),
    );
  }

  void _handleStateChanged(GameEvent event) {
    final gameState = GameState.fromJson(event.data);
    state = state.copyWith(currentState: gameState);
  }
}

// UI state providers
final isLoadingProvider = StateProvider<bool>((ref) => false);

final errorMessageProvider = StateProvider<String?>((ref) => null);

final navigationIndexProvider = StateProvider<int>((ref) => 0);

final themeProvider = StateProvider<ThemeMode>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  final themeIndex = prefs.getInt('theme_mode') ?? 0;
  return ThemeMode.values[themeIndex];
});

// Settings providers
final settingsProvider = Provider<AppSettings>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return AppSettings.fromPreferences(prefs);
});

class AppSettings {
  final bool soundEnabled;
  final bool musicEnabled;
  final double volume;
  final String language;
  final bool notificationsEnabled;

  const AppSettings({
    this.soundEnabled = true,
    this.musicEnabled = true,
    this.volume = 0.8,
    this.language = 'en',
    this.notificationsEnabled = true,
  });

  factory AppSettings.fromPreferences(SharedPreferences prefs) {
    return AppSettings(
      soundEnabled: prefs.getBool('sound_enabled') ?? true,
      musicEnabled: prefs.getBool('music_enabled') ?? true,
      volume: prefs.getDouble('volume') ?? 0.8,
      language: prefs.getString('language') ?? 'en',
      notificationsEnabled: prefs.getBool('notifications_enabled') ?? true,
    );
  }

  Future<void> saveToPreferences(SharedPreferences prefs) async {
    await prefs.setBool('sound_enabled', soundEnabled);
    await prefs.setBool('music_enabled', musicEnabled);
    await prefs.setDouble('volume', volume);
    await prefs.setString('language', language);
    await prefs.setBool('notifications_enabled', notificationsEnabled);
  }

  AppSettings copyWith({
    bool? soundEnabled,
    bool? musicEnabled,
    double? volume,
    String? language,
    bool? notificationsEnabled,
  }) {
    return AppSettings(
      soundEnabled: soundEnabled ?? this.soundEnabled,
      musicEnabled: musicEnabled ?? this.musicEnabled,
      volume: volume ?? this.volume,
      language: language ?? this.language,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
    );
  }
}