import 'package:dio/dio.dart';
import 'dart:io';

import 'auth_service.dart';

class ApiService {
  final Dio _dio;
  final AuthService _authService;

  ApiService({
    required Dio dio,
    required AuthService authService,
  }) : _dio = dio,
        _authService = authService {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    // Request interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Add common headers
          options.headers['Content-Type'] = 'application/json';
          options.headers['Accept'] = 'application/json';
          options.headers['User-Agent'] = 'PittuRu-Flutter/1.0.0';

          print('[API] ${options.method} ${options.path}');
          if (options.data != null) {
            print('[API] Request data: ${options.data}');
          }

          handler.next(options);
        },
        onResponse: (response, handler) {
          print('[API] Response [${response.statusCode}]: ${response.data}');
          handler.next(response);
        },
        onError: (error, handler) async {
          print('[API] Error [${error.response?.statusCode}]: ${error.message}');

          // Handle token refresh for 401 errors
          if (error.response?.statusCode == 401) {
            final refreshed = await _authService.refreshToken();
            if (refreshed) {
              // Retry the original request
              try {
                final options = error.requestOptions;
                final response = await _dio.fetch(options);
                handler.resolve(response);
                return;
              } catch (e) {
                // If retry fails, continue with original error
              }
            }
          }

          handler.next(error);
        },
      ),
    );
  }

  // Game API endpoints
  Future<ApiResponse<List<GameSession>>> getGameSessions({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.get('/games/sessions', queryParameters: {
        'page': page,
        'limit': limit,
      });

      final sessions = (response.data['sessions'] as List)
          .map((json) => GameSession.fromJson(json))
          .toList();

      return ApiResponse.success(sessions);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  Future<ApiResponse<GameSession>> createGameSession({
    required String playerName,
    Map<String, dynamic>? gameConfig,
  }) async {
    try {
      final response = await _dio.post('/games/sessions', data: {
        'player_name': playerName,
        'game_config': gameConfig ?? {},
      });

      final session = GameSession.fromJson(response.data['session']);
      return ApiResponse.success(session);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  Future<ApiResponse<GameSession>> updateGameSession({
    required String sessionId,
    required Map<String, dynamic> gameData,
  }) async {
    try {
      final response = await _dio.put('/games/sessions/$sessionId', data: gameData);

      final session = GameSession.fromJson(response.data['session']);
      return ApiResponse.success(session);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  Future<ApiResponse<GameResult>> submitGameResult({
    required String sessionId,
    required Map<String, dynamic> result,
  }) async {
    try {
      final response = await _dio.post('/games/sessions/$sessionId/result', data: result);

      final gameResult = GameResult.fromJson(response.data['result']);
      return ApiResponse.success(gameResult);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  Future<ApiResponse<void>> endGameSession(String sessionId) async {
    try {
      await _dio.delete('/games/sessions/$sessionId');
      return ApiResponse.success(null);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  // Leaderboard API endpoints
  Future<ApiResponse<List<LeaderboardEntry>>> getLeaderboard({
    String type = 'global',
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await _dio.get('/leaderboard/$type', queryParameters: {
        'page': page,
        'limit': limit,
      });

      final entries = (response.data['entries'] as List)
          .map((json) => LeaderboardEntry.fromJson(json))
          .toList();

      return ApiResponse.success(entries);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  Future<ApiResponse<UserStats>> getUserStats([String? userId]) async {
    try {
      final endpoint = userId != null ? '/users/$userId/stats' : '/users/me/stats';
      final response = await _dio.get(endpoint);

      final stats = UserStats.fromJson(response.data['stats']);
      return ApiResponse.success(stats);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  // Assets API endpoints
  Future<ApiResponse<List<AssetInfo>>> getAssets({
    String? category,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (category != null) queryParams['category'] = category;

      final response = await _dio.get('/assets', queryParameters: queryParams);

      final assets = (response.data['assets'] as List)
          .map((json) => AssetInfo.fromJson(json))
          .toList();

      return ApiResponse.success(assets);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  Future<ApiResponse<String>> uploadAsset({
    required File file,
    required String category,
    String? description,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path),
        'category': category,
        if (description != null) 'description': description,
        if (metadata != null) 'metadata': metadata,
      });

      final response = await _dio.post('/assets/upload', data: formData);

      final assetUrl = response.data['asset_url'] as String;
      return ApiResponse.success(assetUrl);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  // Admin API endpoints
  Future<ApiResponse<SystemInfo>> getSystemInfo() async {
    try {
      final response = await _dio.get('/admin/system');

      final systemInfo = SystemInfo.fromJson(response.data);
      return ApiResponse.success(systemInfo);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  Future<ApiResponse<List<User>>> getUsers({
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (search != null) queryParams['search'] = search;

      final response = await _dio.get('/admin/users', queryParameters: queryParams);

      final users = (response.data['users'] as List)
          .map((json) => User.fromMap(json))
          .toList();

      return ApiResponse.success(users);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  // Utility methods
  Future<ApiResponse<Map<String, dynamic>>> health() async {
    try {
      final response = await _dio.get('/health');
      return ApiResponse.success(response.data as Map<String, dynamic>);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> version() async {
    try {
      final response = await _dio.get('/version');
      return ApiResponse.success(response.data as Map<String, dynamic>);
    } catch (e) {
      return ApiResponse.failure(_handleError(e));
    }
  }

  String _handleError(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
          return 'Connection timeout';
        case DioExceptionType.receiveTimeout:
          return 'Response timeout';
        case DioExceptionType.sendTimeout:
          return 'Request timeout';
        case DioExceptionType.connectionError:
          return 'Network connection error';
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          final message = error.response?.data?['message'] ?? 'Unknown error';

          switch (statusCode) {
            case 400:
              return 'Bad request: $message';
            case 401:
              return 'Unauthorized access';
            case 403:
              return 'Access forbidden';
            case 404:
              return 'Resource not found';
            case 422:
              return 'Validation error: $message';
            case 429:
              return 'Too many requests';
            case 500:
              return 'Internal server error';
            case 502:
              return 'Bad gateway';
            case 503:
              return 'Service unavailable';
            default:
              return 'HTTP $statusCode: $message';
          }
        case DioExceptionType.cancel:
          return 'Request cancelled';
        case DioExceptionType.unknown:
          return 'Unknown network error';
        default:
          return 'Request failed';
      }
    }
    return error.toString();
  }
}

// API Response wrapper
class ApiResponse<T> {
  final bool isSuccess;
  final T? data;
  final String? error;

  ApiResponse._({
    required this.isSuccess,
    this.data,
    this.error,
  });

  factory ApiResponse.success(T data) {
    return ApiResponse._(isSuccess: true, data: data);
  }

  factory ApiResponse.failure(String error) {
    return ApiResponse._(isSuccess: false, error: error);
  }
}

// Data models
class GameSession {
  final String id;
  final String playerName;
  final DateTime createdAt;
  final DateTime? endedAt;
  final Map<String, dynamic> gameData;
  final bool isActive;

  GameSession({
    required this.id,
    required this.playerName,
    required this.createdAt,
    this.endedAt,
    required this.gameData,
    required this.isActive,
  });

  factory GameSession.fromJson(Map<String, dynamic> json) {
    return GameSession(
      id: json['id'],
      playerName: json['player_name'],
      createdAt: DateTime.parse(json['created_at']),
      endedAt: json['ended_at'] != null ? DateTime.parse(json['ended_at']) : null,
      gameData: json['game_data'] ?? {},
      isActive: json['is_active'] ?? false,
    );
  }
}

class GameResult {
  final String id;
  final String sessionId;
  final int score;
  final double gameTime;
  final bool victory;
  final Map<String, dynamic> stats;
  final DateTime createdAt;

  GameResult({
    required this.id,
    required this.sessionId,
    required this.score,
    required this.gameTime,
    required this.victory,
    required this.stats,
    required this.createdAt,
  });

  factory GameResult.fromJson(Map<String, dynamic> json) {
    return GameResult(
      id: json['id'],
      sessionId: json['session_id'],
      score: json['score'],
      gameTime: (json['game_time'] as num).toDouble(),
      victory: json['victory'],
      stats: json['stats'] ?? {},
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

class LeaderboardEntry {
  final String userId;
  final String username;
  final int score;
  final int rank;
  final DateTime achievedAt;

  LeaderboardEntry({
    required this.userId,
    required this.username,
    required this.score,
    required this.rank,
    required this.achievedAt,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      userId: json['user_id'],
      username: json['username'],
      score: json['score'],
      rank: json['rank'],
      achievedAt: DateTime.parse(json['achieved_at']),
    );
  }
}

class UserStats {
  final int totalGames;
  final int wins;
  final int losses;
  final int highScore;
  final double averageScore;
  final double totalPlayTime;
  final Map<String, dynamic> achievements;

  UserStats({
    required this.totalGames,
    required this.wins,
    required this.losses,
    required this.highScore,
    required this.averageScore,
    required this.totalPlayTime,
    required this.achievements,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) {
    return UserStats(
      totalGames: json['total_games'],
      wins: json['wins'],
      losses: json['losses'],
      highScore: json['high_score'],
      averageScore: (json['average_score'] as num).toDouble(),
      totalPlayTime: (json['total_play_time'] as num).toDouble(),
      achievements: json['achievements'] ?? {},
    );
  }

  double get winRate => totalGames > 0 ? wins / totalGames : 0.0;
}

class AssetInfo {
  final String id;
  final String url;
  final String category;
  final String? description;
  final Map<String, dynamic> metadata;
  final DateTime createdAt;

  AssetInfo({
    required this.id,
    required this.url,
    required this.category,
    this.description,
    required this.metadata,
    required this.createdAt,
  });

  factory AssetInfo.fromJson(Map<String, dynamic> json) {
    return AssetInfo(
      id: json['id'],
      url: json['url'],
      category: json['category'],
      description: json['description'],
      metadata: json['metadata'] ?? {},
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

class SystemInfo {
  final String version;
  final DateTime uptime;
  final Map<String, dynamic> stats;
  final bool healthy;

  SystemInfo({
    required this.version,
    required this.uptime,
    required this.stats,
    required this.healthy,
  });

  factory SystemInfo.fromJson(Map<String, dynamic> json) {
    return SystemInfo(
      version: json['version'],
      uptime: DateTime.parse(json['uptime']),
      stats: json['stats'] ?? {},
      healthy: json['healthy'] ?? false,
    );
  }
}

// Import User model
class User {
  final String id;
  final String username;
  final String email;
  final String? avatar;
  final DateTime createdAt;
  final Map<String, dynamic> metadata;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.avatar,
    required this.createdAt,
    this.metadata = const {},
  });

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'],
      username: map['username'],
      email: map['email'],
      avatar: map['avatar'],
      createdAt: DateTime.parse(map['created_at']),
      metadata: map['metadata'] ?? {},
    );
  }

  factory User.fromJson(String json) {
    final map = Map<String, dynamic>.from(
      // This would typically use a JSON parser
      {} // Placeholder
    );
    return User.fromMap(map);
  }

  String toJson() {
    // This would typically use a JSON serializer
    return '{}'; // Placeholder
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'avatar': avatar,
      'created_at': createdAt.toIso8601String(),
      'metadata': metadata,
    };
  }
}