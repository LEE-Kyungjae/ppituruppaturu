import 'dart:convert';

class User {
  final String id;
  final String username;
  final String email;
  final String? avatar;
  final DateTime createdAt;
  final DateTime? lastLoginAt;
  final UserRole role;
  final UserStatus status;
  final Map<String, dynamic> metadata;

  // Game-specific fields
  final int totalGames;
  final int totalWins;
  final int highScore;
  final double totalPlayTime;
  final List<String> achievements;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.avatar,
    required this.createdAt,
    this.lastLoginAt,
    this.role = UserRole.player,
    this.status = UserStatus.active,
    this.metadata = const {},
    this.totalGames = 0,
    this.totalWins = 0,
    this.highScore = 0,
    this.totalPlayTime = 0.0,
    this.achievements = const [],
  });

  // Computed properties
  double get winRate => totalGames > 0 ? totalWins / totalGames : 0.0;
  int get totalLosses => totalGames - totalWins;
  double get averageScore => totalGames > 0 ? highScore / totalGames : 0.0;
  bool get hasAchievements => achievements.isNotEmpty;

  // Factory constructors
  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'] ?? '',
      username: map['username'] ?? '',
      email: map['email'] ?? '',
      avatar: map['avatar'],
      createdAt: map['created_at'] != null
          ? DateTime.parse(map['created_at'])
          : DateTime.now(),
      lastLoginAt: map['last_login_at'] != null
          ? DateTime.parse(map['last_login_at'])
          : null,
      role: UserRole.fromString(map['role'] ?? 'player'),
      status: UserStatus.fromString(map['status'] ?? 'active'),
      metadata: Map<String, dynamic>.from(map['metadata'] ?? {}),
      totalGames: map['total_games'] ?? 0,
      totalWins: map['total_wins'] ?? 0,
      highScore: map['high_score'] ?? 0,
      totalPlayTime: (map['total_play_time'] ?? 0.0).toDouble(),
      achievements: List<String>.from(map['achievements'] ?? []),
    );
  }

  factory User.fromJson(String jsonString) {
    final map = json.decode(jsonString) as Map<String, dynamic>;
    return User.fromMap(map);
  }

  factory User.demo() {
    return User(
      id: 'demo_user_001',
      username: 'DemoPlayer',
      email: 'demo@pitturu.com',
      avatar: null,
      createdAt: DateTime.now().subtract(const Duration(days: 30)),
      lastLoginAt: DateTime.now(),
      role: UserRole.player,
      status: UserStatus.active,
      metadata: {
        'is_demo': true,
        'preferred_theme': 'cyberpunk',
      },
      totalGames: 42,
      totalWins: 28,
      highScore: 1337,
      totalPlayTime: 180.5, // 3 hours
      achievements: [
        'first_win',
        'speed_painter',
        'perfectionist',
      ],
    );
  }

  // Conversion methods
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'avatar': avatar,
      'created_at': createdAt.toIso8601String(),
      'last_login_at': lastLoginAt?.toIso8601String(),
      'role': role.value,
      'status': status.value,
      'metadata': metadata,
      'total_games': totalGames,
      'total_wins': totalWins,
      'high_score': highScore,
      'total_play_time': totalPlayTime,
      'achievements': achievements,
    };
  }

  String toJson() {
    return json.encode(toMap());
  }

  // Copy with method
  User copyWith({
    String? id,
    String? username,
    String? email,
    String? avatar,
    DateTime? createdAt,
    DateTime? lastLoginAt,
    UserRole? role,
    UserStatus? status,
    Map<String, dynamic>? metadata,
    int? totalGames,
    int? totalWins,
    int? highScore,
    double? totalPlayTime,
    List<String>? achievements,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      avatar: avatar ?? this.avatar,
      createdAt: createdAt ?? this.createdAt,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
      role: role ?? this.role,
      status: status ?? this.status,
      metadata: metadata ?? this.metadata,
      totalGames: totalGames ?? this.totalGames,
      totalWins: totalWins ?? this.totalWins,
      highScore: highScore ?? this.highScore,
      totalPlayTime: totalPlayTime ?? this.totalPlayTime,
      achievements: achievements ?? this.achievements,
    );
  }

  // Utility methods
  bool hasAchievement(String achievementId) {
    return achievements.contains(achievementId);
  }

  User addAchievement(String achievementId) {
    if (!hasAchievement(achievementId)) {
      return copyWith(
        achievements: [...achievements, achievementId],
      );
    }
    return this;
  }

  User updateStats({
    int? newGames,
    int? newWins,
    int? newHighScore,
    double? additionalPlayTime,
  }) {
    return copyWith(
      totalGames: totalGames + (newGames ?? 0),
      totalWins: totalWins + (newWins ?? 0),
      highScore: newHighScore != null && newHighScore > highScore
          ? newHighScore
          : highScore,
      totalPlayTime: totalPlayTime + (additionalPlayTime ?? 0.0),
    );
  }

  String get displayName => username.isNotEmpty ? username : email.split('@').first;

  String get avatarUrl {
    if (avatar != null && avatar!.isNotEmpty) {
      return avatar!;
    }
    // Generate default avatar based on username
    final hash = username.hashCode.abs();
    return 'https://api.dicebear.com/7.x/pixel-art/png?seed=$hash&size=128';
  }

  String get gameRank {
    if (totalGames < 5) return 'Rookie';
    if (winRate >= 0.8 && totalGames >= 50) return 'Master';
    if (winRate >= 0.7 && totalGames >= 30) return 'Expert';
    if (winRate >= 0.6 && totalGames >= 20) return 'Veteran';
    if (winRate >= 0.5 && totalGames >= 10) return 'Skilled';
    return 'Amateur';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is User && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'User(id: $id, username: $username, email: $email, games: $totalGames, wins: $totalWins)';
  }
}

// User role enum
enum UserRole {
  player('player'),
  moderator('moderator'),
  admin('admin'),
  developer('developer');

  const UserRole(this.value);
  final String value;

  static UserRole fromString(String value) {
    switch (value.toLowerCase()) {
      case 'moderator':
        return UserRole.moderator;
      case 'admin':
        return UserRole.admin;
      case 'developer':
        return UserRole.developer;
      default:
        return UserRole.player;
    }
  }

  bool get isAdmin => this == UserRole.admin || this == UserRole.developer;
  bool get isModerator => isAdmin || this == UserRole.moderator;
  bool get canModerate => isModerator;
  bool get canAdminister => isAdmin;
}

// User status enum
enum UserStatus {
  active('active'),
  inactive('inactive'),
  suspended('suspended'),
  banned('banned');

  const UserStatus(this.value);
  final String value;

  static UserStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'inactive':
        return UserStatus.inactive;
      case 'suspended':
        return UserStatus.suspended;
      case 'banned':
        return UserStatus.banned;
      default:
        return UserStatus.active;
    }
  }

  bool get canPlay => this == UserStatus.active;
  bool get isRestricted => this == UserStatus.suspended || this == UserStatus.banned;
}

// User preferences model
class UserPreferences {
  final bool soundEnabled;
  final bool musicEnabled;
  final double volume;
  final String language;
  final String theme;
  final bool notificationsEnabled;
  final Map<String, dynamic> gameSettings;

  UserPreferences({
    this.soundEnabled = true,
    this.musicEnabled = true,
    this.volume = 0.8,
    this.language = 'en',
    this.theme = 'cyberpunk',
    this.notificationsEnabled = true,
    this.gameSettings = const {},
  });

  factory UserPreferences.fromMap(Map<String, dynamic> map) {
    return UserPreferences(
      soundEnabled: map['sound_enabled'] ?? true,
      musicEnabled: map['music_enabled'] ?? true,
      volume: (map['volume'] ?? 0.8).toDouble(),
      language: map['language'] ?? 'en',
      theme: map['theme'] ?? 'cyberpunk',
      notificationsEnabled: map['notifications_enabled'] ?? true,
      gameSettings: Map<String, dynamic>.from(map['game_settings'] ?? {}),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'sound_enabled': soundEnabled,
      'music_enabled': musicEnabled,
      'volume': volume,
      'language': language,
      'theme': theme,
      'notifications_enabled': notificationsEnabled,
      'game_settings': gameSettings,
    };
  }

  UserPreferences copyWith({
    bool? soundEnabled,
    bool? musicEnabled,
    double? volume,
    String? language,
    String? theme,
    bool? notificationsEnabled,
    Map<String, dynamic>? gameSettings,
  }) {
    return UserPreferences(
      soundEnabled: soundEnabled ?? this.soundEnabled,
      musicEnabled: musicEnabled ?? this.musicEnabled,
      volume: volume ?? this.volume,
      language: language ?? this.language,
      theme: theme ?? this.theme,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      gameSettings: gameSettings ?? this.gameSettings,
    );
  }
}