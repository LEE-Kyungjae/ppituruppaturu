import 'dart:math';
import 'package:flame/components.dart';
import 'package:flame/events.dart';
import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:vibration/vibration.dart';

class SimpleJumpGame extends FlameGame {
  late PlayerComponent player;
  late ScoreComponent scoreDisplay;
  late List<PlatformComponent> platforms;
  
  int score = 0;
  double spawnTimer = 0.0;
  final double spawnInterval = 1.5;
  final Random random = Random();
  final AudioPlayer audioPlayer = AudioPlayer();
  
  @override
  Color backgroundColor() => const Color(0xFF87CEEB);
  
  @override
  Future<void> onLoad() async {
    await super.onLoad();
    
    // 플레이어 생성
    player = PlayerComponent();
    await add(player);
    
    // 점수 표시
    scoreDisplay = ScoreComponent();
    await add(scoreDisplay);
    
    // 초기 플랫폼들
    platforms = [];
    await _createInitialPlatforms();
  }
  
  @override
  void update(double dt) {
    super.update(dt);
    
    // 카메라가 플레이어를 따라가도록
    camera.viewfinder.position = Vector2(player.position.x, player.position.y - 200);
    
    // 새 플랫폼 스폰
    spawnTimer += dt;
    if (spawnTimer >= spawnInterval) {
      _spawnPlatform();
      spawnTimer = 0;
    }
    
    // 점수 업데이트 (높이 기반)
    final currentScore = ((-player.position.y) / 100).floor();
    if (currentScore > score) {
      score = currentScore;
      scoreDisplay.updateScore(score);
      _playSound('collect');
    }
    
    // 게임오버 체크
    if (player.position.y > 800) {
      _gameOver();
    }
  }
  
  
  Future<void> _createInitialPlatforms() async {
    // 바닥 플랫폼
    final groundPlatform = PlatformComponent(Vector2(size.x / 2, size.y - 50));
    platforms.add(groundPlatform);
    await add(groundPlatform);
    
    // 초기 플랫폼들
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
      
      // 오래된 플랫폼 제거
      if (platforms.length > 20) {
        final oldPlatform = platforms.removeAt(0);
        oldPlatform.removeFromParent();
      }
    }
  }
  
  void _gameOver() async {
    _playSound('gameover');
    await _vibrate();
    
    final gameOverComponent = GameOverComponent(score: score, game: this);
    await add(gameOverComponent);
    pauseEngine();
  }
  
  void resetGame() {
    score = 0;
    scoreDisplay.updateScore(score);
    player.position = Vector2(size.x / 2, size.y - 150);
    player.velocity = Vector2.zero();
    resumeEngine();
    
    children.whereType<GameOverComponent>().forEach((component) {
      component.removeFromParent();
    });
  }
  
  Future<void> _playSound(String soundName) async {
    try {
      await audioPlayer.play(AssetSource('audio/$soundName.wav'));
    } catch (e) {
      print('Sound playback failed: $e');
    }
  }
  
  Future<void> _vibrate() async {
    if (await Vibration.hasVibrator() ?? false) {
      Vibration.vibrate(duration: 300);
    }
  }
}

class PlayerComponent extends PositionComponent {
  Vector2 velocity = Vector2.zero();
  final double jumpForce = -400;
  final double gravity = 800;
  final double playerSize = 30;
  bool onGround = false;
  late SimpleJumpGame game;
  
  @override
  Future<void> onLoad() async {
    game = parent as SimpleJumpGame;
    position = Vector2(game.size.x / 2, game.size.y - 150);
    size = Vector2.all(playerSize);
  }
  
  @override
  void update(double dt) {
    super.update(dt);
    
    // 중력 적용
    velocity.y += gravity * dt;
    
    // 위치 업데이트
    position += velocity * dt;
    
    // 화면 경계 처리
    if (position.x < playerSize / 2) {
      position.x = playerSize / 2;
    } else if (position.x > game.size.x - playerSize / 2) {
      position.x = game.size.x - playerSize / 2;
    }
    
    // 플랫폼 충돌 체크
    _checkPlatformCollisions();
  }
  
  @override
  void render(Canvas canvas) {
    final paint = Paint()
      ..color = Colors.red
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(Offset.zero, playerSize / 2, paint);
    
    // 테두리
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = 2;
    paint.color = Colors.red.shade800;
    canvas.drawCircle(Offset.zero, playerSize / 2, paint);
    
    // 눈
    paint.style = PaintingStyle.fill;
    paint.color = Colors.white;
    canvas.drawCircle(const Offset(-8, -5), 4, paint);
    canvas.drawCircle(const Offset(8, -5), 4, paint);
    
    paint.color = Colors.black;
    canvas.drawCircle(const Offset(-8, -5), 2, paint);
    canvas.drawCircle(const Offset(8, -5), 2, paint);
  }
  
  void jump() {
    if (onGround || velocity.y > -100) {
      velocity.y = jumpForce;
      onGround = false;
      game._playSound('jump');
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
    
    // 테두리
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
      position: Vector2(20, 50),
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

class GameOverComponent extends PositionComponent {
  final int score;
  final SimpleJumpGame game;
  
  GameOverComponent({required this.score, required this.game});
  
  @override
  Future<void> onLoad() async {
    // 반투명 배경
    final background = RectangleComponent(
      size: game.size,
      paint: Paint()..color = Colors.black.withValues(alpha: 0.7),
    );
    add(background);
    
    // 게임오버 텍스트
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
    
    // 점수 표시
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
    
    // 재시작 안내
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