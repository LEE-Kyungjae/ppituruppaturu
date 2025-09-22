import 'dart:async';
import 'dart:math';

import 'api_service.dart';
import 'unity_game_manager.dart' hide GameResult;

class GameService {
  final ApiService _apiService;

  GameService({required ApiService apiService}) : _apiService = apiService;

  // Game session management
  Future<String?> createGameSession(String playerName) async {
    try {
      final response = await _apiService.createGameSession(
        playerName: playerName,
        gameConfig: _getDefaultGameConfig(),
      );

      if (response.isSuccess) {
        return response.data!.id;
      } else {
        print('[GameService] Failed to create session: ${response.error}');
        return null;
      }
    } catch (e) {
      print('[GameService] Create session error: $e');
      return null;
    }
  }

  Future<bool> updateGameSession(String sessionId, Map<String, dynamic> gameData) async {
    try {
      final response = await _apiService.updateGameSession(
        sessionId: sessionId,
        gameData: gameData,
      );

      return response.isSuccess;
    } catch (e) {
      print('[GameService] Update session error: $e');
      return false;
    }
  }

  Future<bool> endGameSession(String sessionId) async {
    try {
      final response = await _apiService.endGameSession(sessionId);
      return response.isSuccess;
    } catch (e) {
      print('[GameService] End session error: $e');
      return false;
    }
  }

  Future<bool> submitGameResult(String sessionId, GameResult result) async {
    try {
      final response = await _apiService.submitGameResult(
        sessionId: sessionId,
        result: result.toMap(),
      );

      if (response.isSuccess) {
        // Process achievements, leaderboard updates, etc.
        await _processGameResult(response.data!);
        return true;
      }

      return false;
    } catch (e) {
      print('[GameService] Submit result error: $e');
      return false;
    }
  }

  // Leaderboard and stats
  Future<List<LeaderboardEntry>> getLeaderboard({
    String type = 'global',
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await _apiService.getLeaderboard(
        type: type,
        page: page,
        limit: limit,
      );

      return response.isSuccess ? response.data! : [];
    } catch (e) {
      print('[GameService] Get leaderboard error: $e');
      return [];
    }
  }

  Future<UserStats?> getUserStats([String? userId]) async {
    try {
      final response = await _apiService.getUserStats(userId);
      return response.isSuccess ? response.data : null;
    } catch (e) {
      print('[GameService] Get user stats error: $e');
      return null;
    }
  }

  // Game configuration
  Map<String, dynamic> _getDefaultGameConfig() {
    return {
      'player_speed': 5.0,
      'jump_force': 10.0,
      'max_health': 100,
      'paint_range': 10.0,
      'paint_radius': 1.0,
      'max_paint_shots': 50,
      'gravity': -9.81,
      'target_coverage': 80.0,
      'time_limit': 300, // 5 minutes
      'difficulty': 'normal',
    };
  }

  GameConfig createGameConfig({
    double? playerSpeed,
    double? jumpForce,
    int? maxHealth,
    double? paintRange,
    double? paintRadius,
    int? maxPaintShots,
  }) {
    return GameConfig(
      playerSpeed: playerSpeed ?? 5.0,
      jumpForce: jumpForce ?? 10.0,
      maxHealth: maxHealth ?? 100,
      paintRange: paintRange ?? 10.0,
      paintRadius: paintRadius ?? 1.0,
      maxPaintShots: maxPaintShots ?? 50,
    );
  }

  // Game analytics and metrics
  Future<void> trackGameEvent({
    required String sessionId,
    required String eventType,
    required Map<String, dynamic> eventData,
  }) async {
    try {
      // Track game events for analytics
      await _apiService.updateGameSession(
        sessionId: sessionId,
        gameData: {
        'events': [
          {
            'type': eventType,
            'data': eventData,
            'timestamp': DateTime.now().toIso8601String(),
          }
        ]
        },
      );
    } catch (e) {
      print('[GameService] Track event error: $e');
    }
  }

  // Achievement system
  Future<List<Achievement>> checkAchievements(GameResult result) async {
    final achievements = <Achievement>[];

    try {
      // Check various achievement conditions
      if (result.victory && result.gameTime < 60) {
        achievements.add(Achievement(
          id: 'speed_painter',
          name: 'Speed Painter',
          description: 'Complete a game in under 1 minute',
          type: AchievementType.speed,
        ));
      }

      if (result.score > 1000) {
        achievements.add(Achievement(
          id: 'high_scorer',
          name: 'High Scorer',
          description: 'Score over 1000 points in a single game',
          type: AchievementType.score,
        ));
      }

      final paintCoverage = result.stats['paint_coverage'] as double? ?? 0.0;
      if (paintCoverage >= 95.0) {
        achievements.add(Achievement(
          id: 'perfectionist',
          name: 'Perfectionist',
          description: 'Achieve 95% paint coverage',
          type: AchievementType.completion,
        ));
      }

      // Save achievements to backend
      if (achievements.isNotEmpty) {
        await _saveAchievements(achievements);
      }

      return achievements;
    } catch (e) {
      print('[GameService] Check achievements error: $e');
      return [];
    }
  }

  Future<void> _saveAchievements(List<Achievement> achievements) async {
    // Implementation would save to backend
    print('[GameService] Unlocked ${achievements.length} achievements');
  }

  // Game state management
  GameState createInitialGameState({
    required String playerName,
    GameConfig? config,
  }) {
    return GameState(
      state: 'initializing',
      score: 0,
      gameTime: 0.0,
      playerName: playerName,
      paintCoverage: 0.0,
    );
  }

  GameState updateGameState(GameState currentState, Map<String, dynamic> updates) {
    return GameState(
      state: updates['state'] ?? currentState.state,
      score: updates['score'] ?? currentState.score,
      gameTime: updates['game_time'] ?? currentState.gameTime,
      playerName: updates['player_name'] ?? currentState.playerName,
      paintCoverage: updates['paint_coverage'] ?? currentState.paintCoverage,
    );
  }

  // Game validation
  bool validateGameResult(GameResult result) {
    // Validate game result for anti-cheat
    try {
      // Check if score is reasonable
      if (result.score < 0 || result.score > 10000) {
        return false;
      }

      // Check if game time is reasonable
      if (result.gameTime < 5 || result.gameTime > 3600) {
        return false;
      }

      // Check paint coverage bounds
      final paintCoverage = result.stats['paint_coverage'] as double? ?? 0.0;
      if (paintCoverage < 0 || paintCoverage > 100) {
        return false;
      }

      // Additional validation rules
      final paintShots = result.stats['paint_shots_used'] as int? ?? 0;
      final maxShots = result.stats['max_paint_shots'] as int? ?? 50;
      if (paintShots > maxShots) {
        return false;
      }

      return true;
    } catch (e) {
      print('[GameService] Validation error: $e');
      return false;
    }
  }

  // Multiplayer support
  Future<List<GameSession>> findMultiplayerGames() async {
    try {
      final response = await _apiService.getGameSessions(limit: 10);
      return response.isSuccess ? response.data! : [];
    } catch (e) {
      print('[GameService] Find multiplayer games error: $e');
      return [];
    }
  }

  Future<bool> joinMultiplayerGame(String sessionId) async {
    try {
      final response = await _apiService.updateGameSession(
        sessionId: sessionId,
        gameData: {
        'action': 'join',
        'timestamp': DateTime.now().toIso8601String(),
      });
      return response.isSuccess;
    } catch (e) {
      print('[GameService] Join multiplayer game error: $e');
      return false;
    }
  }

  // Asset management
  Future<List<AssetInfo>> getGameAssets({String? category}) async {
    try {
      final response = await _apiService.getAssets(category: category);
      return response.isSuccess ? response.data! : [];
    } catch (e) {
      print('[GameService] Get assets error: $e');
      return [];
    }
  }

  // Game utilities
  int calculateScore({
    required double paintCoverage,
    required double gameTime,
    required int paintShotsUsed,
    required int maxPaintShots,
    required bool victory,
  }) {
    if (!victory) return 0;

    int baseScore = (paintCoverage * 10).round();

    // Time bonus (faster = better)
    int timeBonus = max(0, (300 - gameTime).round()); // 300 second baseline

    // Efficiency bonus (fewer shots = better)
    double efficiency = 1.0 - (paintShotsUsed / maxPaintShots);
    int efficiencyBonus = (efficiency * 100).round();

    // Perfect coverage bonus
    int perfectBonus = paintCoverage >= 100.0 ? 200 : 0;

    return baseScore + timeBonus + efficiencyBonus + perfectBonus;
  }

  double calculateDifficulty(UserStats? userStats) {
    if (userStats == null) return 1.0;

    // Adaptive difficulty based on user performance
    final winRate = userStats.winRate;
    final avgScore = userStats.averageScore;

    if (winRate > 0.8 && avgScore > 500) {
      return 1.5; // Hard
    } else if (winRate > 0.6 && avgScore > 300) {
      return 1.2; // Medium-Hard
    } else if (winRate > 0.4 && avgScore > 150) {
      return 1.0; // Normal
    } else {
      return 0.8; // Easy
    }
  }

  // Process game result for achievements, stats, etc.
  Future<void> _processGameResult(GameResult result) async {
    try {
      // Check for achievements
      await checkAchievements(result);

      // Update leaderboards if high score
      // This would be handled by the backend typically

      // Track analytics
      await trackGameEvent(
        sessionId: result.sessionId,
        eventType: 'game_completed',
        eventData: {
          'score': result.score,
          'victory': result.victory,
          'game_time': result.gameTime,
          'stats': result.stats,
        },
      );
    } catch (e) {
      print('[GameService] Process result error: $e');
    }
  }
}

// Achievement system
class Achievement {
  final String id;
  final String name;
  final String description;
  final AchievementType type;
  final DateTime? unlockedAt;

  Achievement({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    this.unlockedAt,
  });
}

enum AchievementType {
  score,
  speed,
  completion,
  efficiency,
  special,
}

// Extend existing GameResult class with additional methods
extension GameResultExtension on GameResult {
  Map<String, dynamic> toMap() {
    return {
      'score': score,
      'game_time': gameTime,
      'victory': victory,
      'stats': stats,
    };
  }

  bool get isPerfectGame {
    final coverage = stats['paint_coverage'] as double? ?? 0.0;
    return victory && coverage >= 100.0;
  }

  bool get isSpeedRun {
    return victory && gameTime < 60.0;
  }

  bool get isEfficient {
    final shotsUsed = stats['paint_shots_used'] as int? ?? 0;
    final maxShots = stats['max_paint_shots'] as int? ?? 50;
    return shotsUsed <= maxShots * 0.5; // Used less than 50% of shots
  }
}