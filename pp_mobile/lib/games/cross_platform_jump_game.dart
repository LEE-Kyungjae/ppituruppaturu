import 'dart:math';
import 'package:flame/components.dart';
import 'package:flame/events.dart';
import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/websocket_manager.dart';
import '../services/cross_platform_game_manager.dart';

class CrossPlatformJumpGame extends FlameGame with HasTapDetectors, HasCollisionDetection {
  late LocalPlayerComponent localPlayer;
  late ScoreComponent scoreDisplay;
  late ConnectionStatusComponent connectionStatus;
  late List<PlatformComponent> platforms;
  late Map<String, RemotePlayerComponent> remotePlayers;

  late WebSocketManager wsManager;
  late CrossPlatformGameManager gameManager;

  int score = 0;
  double spawnTimer = 0.0;
  final double spawnInterval = 1.5;
  final Random random = Random();

  bool isConnectedToServer = false;
  String? roomId;
  String playerUsername = 'MobilePlayer${Random().nextInt(1000)}';

  @override
  Color backgroundColor() => const Color(0xFF87CEEB);

  @override
  Future<void> onLoad() async {
    await super.onLoad();

    // Initialize cross-platform managers
    wsManager = WebSocketManager();
    gameManager = CrossPlatformGameManager(wsManager);

    // Setup game state listeners
    _setupGameStateListeners();

    // Create local player
    localPlayer = LocalPlayerComponent(gameManager: gameManager);
    await add(localPlayer);

    // Create UI components
    scoreDisplay = ScoreComponent();
    await add(scoreDisplay);

    connectionStatus = ConnectionStatusComponent(wsManager: wsManager);
    await add(connectionStatus);

    // Initialize platforms and remote players
    platforms = [];
    remotePlayers = {};

    await _createInitialPlatforms();

    // Attempt to connect to server
    _connectToServer();
  }

  void _setupGameStateListeners() {
    // Listen for game state changes
    gameManager.gameStateStream.listen((gameState) {
      _syncGameState(gameState);
    });

    // Listen for new players joining
    gameManager.playerJoinStream.listen((playerState) {
      _addRemotePlayer(playerState);
    });

    // Listen for players leaving
    gameManager.playerLeaveStream.listen((username) {
      _removeRemotePlayer(username);
    });

    // Listen for cross-platform events
    gameManager.crossPlatformEventStream.listen((event) {
      _handleCrossPlatformEvent(event);
    });

    // Listen for WebSocket connection changes
    wsManager.connectionStream.listen((state) {
      isConnectedToServer = state == ConnectionState.connected;
      connectionStatus.updateConnectionState(state);

      if (state == ConnectionState.connected) {
        _joinCrossPlatformGame();
      }
    });
  }

  Future<void> _connectToServer() async {
    try {
      // Try to connect to local development server first
      String serverUrl = 'ws://localhost:8082';

      final connected = await wsManager.connect(
        serverUrl: serverUrl,
        username: playerUsername,
        roomId: 'physics_jump_room',
      );

      if (connected) {
        debugPrint('Connected to game server');
      } else {
        debugPrint('Failed to connect to game server');
      }
    } catch (e) {
      debugPrint('Connection error: $e');
    }
  }

  Future<void> _joinCrossPlatformGame() async {
    roomId = 'physics_jump_${DateTime.now().millisecondsSinceEpoch}';

    final joined = await gameManager.joinCrossPlatformGame(
      gameId: roomId!,
      gameType: 'physics_jump',
      username: playerUsername,
      initialGameData: {
        'position': {'x': localPlayer.position.x, 'y': localPlayer.position.y},
        'velocity': {'x': 0, 'y': 0},
        'onGround': false,
      },
    );

    if (joined) {
      debugPrint('Joined cross-platform game: $roomId');
    }
  }

  @override
  void update(double dt) {
    super.update(dt);

    // Camera follows local player
    camera.viewfinder.position = Vector2(localPlayer.position.x, localPlayer.position.y - 200);

    // Spawn new platforms
    spawnTimer += dt;
    if (spawnTimer >= spawnInterval) {
      _spawnPlatform();
      spawnTimer = 0;
    }

    // Update score based on height
    final currentScore = ((-localPlayer.position.y) / 100).floor();
    if (currentScore > score) {
      score = currentScore;
      scoreDisplay.updateScore(score);

      // Send score update to other players
      if (isConnectedToServer) {
        wsManager.sendScoreUpdate(score);
      }
    }

    // Update local player state for cross-platform sync
    if (isConnectedToServer && gameManager.isInCrossPlatformGame) {
      gameManager.updateLocalPlayerState(
        position: {
          'x': localPlayer.position.x,
          'y': localPlayer.position.y,
        },
        gameData: {
          'velocity': {
            'x': localPlayer.velocity.x,
            'y': localPlayer.velocity.y,
          },
          'onGround': localPlayer.onGround,
          'score': score,
        },
        score: score,
      );
    }

    // Game over check
    if (localPlayer.position.y > 1000) {
      _gameOver();
    }
  }

  @override
  bool onTapDown(TapDownInfo info) {
    if (localPlayer.onGround || localPlayer.velocity.y > -100) {
      localPlayer.jump();

      // Send jump action to other players
      if (isConnectedToServer) {
        gameManager.sendCrossPlatformAction(
          action: 'jump',
          actionData: {
            'position': {
              'x': localPlayer.position.x,
              'y': localPlayer.position.y,
            },
            'timestamp': DateTime.now().millisecondsSinceEpoch,
          },
        );
      }

      HapticFeedback.lightImpact();
    }
    return true;
  }

  Future<void> _createInitialPlatforms() async {
    // Ground platform
    final groundPlatform = PlatformComponent(Vector2(size.x / 2, size.y - 50));
    platforms.add(groundPlatform);
    await add(groundPlatform);

    // Initial platforms
    for (int i = 1; i <= 10; i++) {
      final platform = PlatformComponent(Vector2(
        50 + random.nextDouble() * (size.x - 100),
        size.y - 100 - (i * 120),
      ));
      platforms.add(platform);
      await add(platform);
    }
  }

  void _spawnPlatform() {
    if (platforms.isNotEmpty) {
      final highestPlatform = platforms.reduce((a, b) =>
        a.position.y < b.position.y ? a : b);

      final newPlatform = PlatformComponent(Vector2(
        50 + random.nextDouble() * (size.x - 100),
        highestPlatform.position.y - 120,
      ));

      platforms.add(newPlatform);
      add(newPlatform);

      // Remove old platforms
      if (platforms.length > 20) {
        final oldPlatform = platforms.removeAt(0);
        oldPlatform.removeFromParent();
      }
    }
  }

  void _syncGameState(CrossPlatformGameState gameState) {
    // Update remote players
    for (final playerState in gameState.players.values) {
      if (playerState.username != playerUsername) {
        _updateRemotePlayer(playerState);
      }
    }

    // Sync shared game data if needed
    if (gameState.sharedGameData.isNotEmpty) {
      _handleSharedGameData(gameState.sharedGameData);
    }
  }

  void _addRemotePlayer(PlayerState playerState) {
    if (playerState.username == playerUsername) return;

    if (!remotePlayers.containsKey(playerState.username)) {
      final remotePlayer = RemotePlayerComponent(
        username: playerState.username,
        platform: playerState.platform,
      );

      remotePlayers[playerState.username] = remotePlayer;
      add(remotePlayer);

      debugPrint('Added remote player: ${playerState.username} (${playerState.platform})');
    }

    _updateRemotePlayer(playerState);
  }

  void _updateRemotePlayer(PlayerState playerState) {
    final remotePlayer = remotePlayers[playerState.username];
    if (remotePlayer != null) {
      remotePlayer.updateFromPlayerState(playerState);
    }
  }

  void _removeRemotePlayer(String username) {
    final remotePlayer = remotePlayers.remove(username);
    if (remotePlayer != null) {
      remotePlayer.removeFromParent();
      debugPrint('Removed remote player: $username');
    }
  }

  void _handleCrossPlatformEvent(Map<String, dynamic> event) {
    final action = event['action'];
    final from = event['from'];

    switch (action) {
      case 'jump':
        final remotePlayer = remotePlayers[from];
        if (remotePlayer != null) {
          remotePlayer.playJumpAnimation();
        }
        break;

      case 'score_update':
        // Handle score updates from other players
        break;

      case 'game_event':
        // Handle custom game events
        _handleCustomGameEvent(event['actionData']);
        break;
    }
  }

  void _handleSharedGameData(Map<String, dynamic> sharedData) {
    // Handle shared game state like synchronized platforms, power-ups, etc.
    if (sharedData.containsKey('platforms')) {
      // Sync platform states across all players
    }
  }

  void _handleCustomGameEvent(Map<String, dynamic> eventData) {
    // Handle custom cross-platform game events
    debugPrint('Custom game event: $eventData');
  }

  void _gameOver() {
    pauseEngine();

    // Send game end event
    if (isConnectedToServer) {
      gameManager.sendCrossPlatformAction(
        action: 'game_end',
        actionData: {
          'finalScore': score,
          'reason': 'fell_off_screen',
        },
      );
    }

    final gameOverComponent = GameOverComponent(
      score: score,
      game: this,
      isConnected: isConnectedToServer,
      playerCount: gameManager.playerCount,
    );
    add(gameOverComponent);
  }

  void resetGame() {
    score = 0;
    scoreDisplay.updateScore(score);
    localPlayer.position = Vector2(size.x / 2, size.y - 150);
    localPlayer.velocity = Vector2.zero();
    localPlayer.onGround = false;
    resumeEngine();

    // Remove game over component
    children.whereType<GameOverComponent>().forEach((component) {
      component.removeFromParent();
    });

    // Rejoin cross-platform game
    if (isConnectedToServer) {
      _joinCrossPlatformGame();
    }
  }

  @override
  void onRemove() {
    // Clean up connections
    gameManager.leaveCrossPlatformGame();
    wsManager.disconnect();
    super.onRemove();
  }
}

class LocalPlayerComponent extends PositionComponent {
  Vector2 velocity = Vector2.zero();
  final double jumpForce = -400;
  final double gravity = 800;
  final double playerSize = 30;
  bool onGround = false;

  final CrossPlatformGameManager gameManager;
  late CrossPlatformJumpGame game;

  LocalPlayerComponent({required this.gameManager});

  @override
  Future<void> onLoad() async {
    game = parent as CrossPlatformJumpGame;
    position = Vector2(game.size.x / 2, game.size.y - 150);
    size = Vector2.all(playerSize);
  }

  @override
  void update(double dt) {
    super.update(dt);

    // Apply gravity
    velocity.y += gravity * dt;

    // Update position
    position += velocity * dt;

    // Screen boundaries
    if (position.x < playerSize / 2) {
      position.x = playerSize / 2;
    } else if (position.x > game.size.x - playerSize / 2) {
      position.x = game.size.x - playerSize / 2;
    }

    // Platform collision check
    _checkPlatformCollisions();
  }

  @override
  void render(Canvas canvas) {
    final paint = Paint()
      ..color = Colors.blue
      ..style = PaintingStyle.fill;

    // Draw player as a circle with mobile indicator
    canvas.drawCircle(Offset.zero, playerSize / 2, paint);

    // Border
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = 2;
    paint.color = Colors.blue.shade800;
    canvas.drawCircle(Offset.zero, playerSize / 2, paint);

    // Mobile icon indicator
    paint.style = PaintingStyle.fill;
    paint.color = Colors.white;
    final iconRect = Rect.fromCenter(center: Offset.zero, width: 16, height: 20);
    canvas.drawRRect(
      RRect.fromRectAndRadius(iconRect, const Radius.circular(2)),
      paint,
    );

    // Eyes
    paint.color = Colors.black;
    canvas.drawCircle(const Offset(-6, -8), 2, paint);
    canvas.drawCircle(const Offset(6, -8), 2, paint);
  }

  void jump() {
    if (onGround || velocity.y > -100) {
      velocity.y = jumpForce;
      onGround = false;
    }
  }

  void _checkPlatformCollisions() {
    onGround = false;

    for (final platform in game.platforms) {
      if (_isCollidingWith(platform) && velocity.y > 0) {
        position.y = platform.position.y - platform.height / 2 - playerSize / 2;
        velocity.y = 0;
        onGround = true;
        break;
      }
    }
  }

  bool _isCollidingWith(PlatformComponent platform) {
    final playerRect = Rect.fromCenter(
      center: Offset(position.x, position.y),
      width: playerSize,
      height: playerSize,
    );

    final platformRect = Rect.fromCenter(
      center: Offset(platform.position.x, platform.position.y),
      width: platform.width,
      height: platform.height,
    );

    return playerRect.overlaps(platformRect);
  }
}

class RemotePlayerComponent extends PositionComponent {
  final String username;
  final GamePlatform platform;
  final double playerSize = 25;

  Vector2 targetPosition = Vector2.zero();
  Vector2 velocity = Vector2.zero();
  bool isJumping = false;
  double jumpAnimationTimer = 0;

  RemotePlayerComponent({
    required this.username,
    required this.platform,
  });

  @override
  Future<void> onLoad() async {
    size = Vector2.all(playerSize);
  }

  @override
  void update(double dt) {
    super.update(dt);

    // Smooth interpolation to target position
    final diff = targetPosition - position;
    if (diff.length > 5) {
      position += diff * dt * 5; // Smooth following
    }

    // Jump animation
    if (isJumping) {
      jumpAnimationTimer += dt;
      if (jumpAnimationTimer > 0.5) {
        isJumping = false;
        jumpAnimationTimer = 0;
      }
    }
  }

  @override
  void render(Canvas canvas) {
    final paint = Paint()
      ..color = _getPlatformColor()
      ..style = PaintingStyle.fill;

    // Scale effect for jump animation
    final scale = isJumping ? 1.0 + (0.2 * sin(jumpAnimationTimer * 10)) : 1.0;
    canvas.save();
    canvas.scale(scale);

    // Draw player
    canvas.drawCircle(Offset.zero, playerSize / 2, paint);

    // Border
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = 2;
    paint.color = _getPlatformColor().withOpacity(0.8);
    canvas.drawCircle(Offset.zero, playerSize / 2, paint);

    // Platform indicator
    paint.style = PaintingStyle.fill;
    paint.color = Colors.white;

    switch (platform) {
      case GamePlatform.web:
        // Web icon (computer)
        final rect = Rect.fromCenter(center: const Offset(0, -2), width: 12, height: 8);
        canvas.drawRect(rect, paint);
        break;
      case GamePlatform.desktop:
        // Desktop icon (monitor)
        final rect = Rect.fromCenter(center: const Offset(0, -2), width: 14, height: 10);
        canvas.drawRect(rect, paint);
        break;
      case GamePlatform.mobile:
        // Mobile icon (phone)
        final rect = Rect.fromCenter(center: Offset.zero, width: 8, height: 12);
        canvas.drawRRect(
          RRect.fromRectAndRadius(rect, const Radius.circular(1)),
          paint,
        );
        break;
    }

    canvas.restore();

    // Username label
    final textPainter = TextPainter(
      text: TextSpan(
        text: username,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          shadows: [
            Shadow(offset: Offset(1, 1), blurRadius: 2, color: Colors.black),
          ],
        ),
      ),
      textDirection: TextDirection.ltr,
    );

    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(-textPainter.width / 2, playerSize / 2 + 5),
    );
  }

  Color _getPlatformColor() {
    switch (platform) {
      case GamePlatform.web:
        return Colors.green;
      case GamePlatform.desktop:
        return Colors.purple;
      case GamePlatform.mobile:
        return Colors.orange;
    }
  }

  void updateFromPlayerState(PlayerState playerState) {
    targetPosition = Vector2(
      playerState.position['x']?.toDouble() ?? 0,
      playerState.position['y']?.toDouble() ?? 0,
    );

    if (playerState.gameData['velocity'] != null) {
      velocity = Vector2(
        playerState.gameData['velocity']['x']?.toDouble() ?? 0,
        playerState.gameData['velocity']['y']?.toDouble() ?? 0,
      );
    }
  }

  void playJumpAnimation() {
    isJumping = true;
    jumpAnimationTimer = 0;
  }
}

// ... (PlatformComponent, ScoreComponent remain the same as previous version)

class ConnectionStatusComponent extends PositionComponent {
  final WebSocketManager wsManager;
  late TextComponent statusText;
  late RectangleComponent statusIndicator;

  ConnectionState currentState = ConnectionState.disconnected;

  ConnectionStatusComponent({required this.wsManager});

  @override
  Future<void> onLoad() async {
    position = Vector2(20, 20);

    statusIndicator = RectangleComponent(
      size: Vector2(12, 12),
      paint: Paint()..color = Colors.red,
    );
    add(statusIndicator);

    statusText = TextComponent(
      text: 'Disconnected',
      position: Vector2(20, 0),
      textRenderer: TextPaint(
        style: const TextStyle(
          fontSize: 12,
          color: Colors.white,
          fontWeight: FontWeight.bold,
          shadows: [
            Shadow(offset: Offset(1, 1), blurRadius: 2, color: Colors.black),
          ],
        ),
      ),
    );
    add(statusText);
  }

  void updateConnectionState(ConnectionState state) {
    currentState = state;

    switch (state) {
      case ConnectionState.connected:
        statusIndicator.paint.color = Colors.green;
        statusText.text = 'Connected (${wsManager.messagesSent}/${wsManager.messagesReceived})';
        break;
      case ConnectionState.connecting:
        statusIndicator.paint.color = Colors.yellow;
        statusText.text = 'Connecting...';
        break;
      case ConnectionState.reconnecting:
        statusIndicator.paint.color = Colors.orange;
        statusText.text = 'Reconnecting...';
        break;
      case ConnectionState.error:
        statusIndicator.paint.color = Colors.red;
        statusText.text = 'Connection Error';
        break;
      case ConnectionState.disconnected:
        statusIndicator.paint.color = Colors.red;
        statusText.text = 'Disconnected';
        break;
    }
  }
}

class GameOverComponent extends PositionComponent {
  final int score;
  final CrossPlatformJumpGame game;
  final bool isConnected;
  final int playerCount;

  GameOverComponent({
    required this.score,
    required this.game,
    required this.isConnected,
    required this.playerCount,
  });

  @override
  Future<void> onLoad() async {
    // Semi-transparent background
    final background = RectangleComponent(
      size: game.size,
      paint: Paint()..color = Colors.black.withOpacity(0.7),
    );
    add(background);

    // Game Over text
    final gameOverText = TextComponent(
      text: 'GAME OVER',
      position: game.size / 2,
      anchor: Anchor.center,
      textRenderer: TextPaint(
        style: const TextStyle(
          fontSize: 48,
          color: Colors.white,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
    add(gameOverText);

    // Score
    final scoreText = TextComponent(
      text: 'Final Score: $score',
      position: Vector2(game.size.x / 2, game.size.y / 2 + 60),
      anchor: Anchor.center,
      textRenderer: TextPaint(
        style: const TextStyle(
          fontSize: 24,
          color: Colors.white,
        ),
      ),
    );
    add(scoreText);

    // Connection status
    if (isConnected) {
      final connectionText = TextComponent(
        text: 'Playing with $playerCount players',
        position: Vector2(game.size.x / 2, game.size.y / 2 + 90),
        anchor: Anchor.center,
        textRenderer: TextPaint(
          style: const TextStyle(
            fontSize: 16,
            color: Colors.green,
          ),
        ),
      );
      add(connectionText);
    } else {
      final connectionText = TextComponent(
        text: 'Offline Mode',
        position: Vector2(game.size.x / 2, game.size.y / 2 + 90),
        anchor: Anchor.center,
        textRenderer: TextPaint(
          style: const TextStyle(
            fontSize: 16,
            color: Colors.orange,
          ),
        ),
      );
      add(connectionText);
    }

    // Restart instruction
    final restartText = TextComponent(
      text: 'Tap to Restart',
      position: Vector2(game.size.x / 2, game.size.y / 2 + 120),
      anchor: Anchor.center,
      textRenderer: TextPaint(
        style: const TextStyle(
          fontSize: 20,
          color: Colors.yellow,
        ),
      ),
    );
    add(restartText);
  }
}

// Reuse PlatformComponent and ScoreComponent from the original game
class PlatformComponent extends PositionComponent {
  @override
  final double width = 100;
  @override
  final double height = 20;

  PlatformComponent(Vector2 pos) {
    position = pos;
    size = Vector2(width, height);
  }

  @override
  void render(Canvas canvas) {
    final paint = Paint()
      ..color = Colors.brown
      ..style = PaintingStyle.fill;

    final rect = Rect.fromCenter(
      center: Offset.zero,
      width: width,
      height: height,
    );

    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, const Radius.circular(10)),
      paint,
    );

    // Border
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = 2;
    paint.color = Colors.brown.shade800;
    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, const Radius.circular(10)),
      paint,
    );
  }
}

class ScoreComponent extends PositionComponent {
  late TextComponent scoreText;

  @override
  Future<void> onLoad() async {
    scoreText = TextComponent(
      text: 'Score: 0',
      position: Vector2(20, 80),
      textRenderer: TextPaint(
        style: const TextStyle(
          fontSize: 24,
          color: Colors.white,
          fontWeight: FontWeight.bold,
          shadows: [
            Shadow(
              offset: Offset(1, 1),
              blurRadius: 2,
              color: Colors.black,
            ),
          ],
        ),
      ),
    );
    add(scoreText);
  }

  void updateScore(int score) {
    scoreText.text = 'Score: $score';
  }
}