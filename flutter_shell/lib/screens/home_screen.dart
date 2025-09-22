import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_unity_widget/flutter_unity_widget.dart';

import '../core/providers.dart';
import '../services/unity_game_manager.dart';
import '../widgets/game_hud.dart';
import '../widgets/cyberpunk_button.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with TickerProviderStateMixin {
  UnityWidgetController? _unityController;
  bool _isUnityLoaded = false;
  bool _showGameView = false;

  late AnimationController _backgroundController;
  late AnimationController _menuController;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
  }

  void _initializeAnimations() {
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 10),
      vsync: this,
    )..repeat();

    _menuController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _menuController.forward();
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    _menuController.dispose();
    super.dispose();
  }

  void _onUnityCreated(UnityWidgetController controller) {
    _unityController = controller;
    setState(() {
      _isUnityLoaded = true;
    });
  }

  void _startGame() async {
    final user = ref.read(currentUserProvider);
    final playerName = user?.username ?? 'Anonymous';

    final success = await ref.read(gameSessionProvider.notifier).startGame(playerName);

    if (success) {
      setState(() {
        _showGameView = true;
      });
    } else {
      _showErrorDialog('Failed to start game. Please try again.');
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.black,
        title: const Text(
          'ERROR',
          style: TextStyle(
            color: Color(0xFFFF0080),
            fontFamily: 'monospace',
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Text(
          message,
          style: const TextStyle(
            color: Colors.white,
            fontFamily: 'monospace',
          ),
        ),
        actions: [
          CyberpunkButton(
            text: 'OK',
            onPressed: () => Navigator.of(context).pop(),
            color: const Color(0xFF00FFFF),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final gameSession = ref.watch(gameSessionProvider);
    final user = ref.watch(currentUserProvider);

    if (_showGameView && _isUnityLoaded) {
      return _buildGameView(gameSession);
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          _buildAnimatedBackground(),
          _buildMainMenu(user),
          if (!_isUnityLoaded) _buildUnityLoader(),
        ],
      ),
    );
  }

  Widget _buildAnimatedBackground() {
    return AnimatedBuilder(
      animation: _backgroundController,
      builder: (context, child) {
        return Container(
          decoration: const BoxDecoration(
            gradient: RadialGradient(
              center: Alignment.center,
              radius: 1.5,
              colors: [
                Color(0xFF1a0033),
                Color(0xFF000000),
              ],
            ),
          ),
          child: CustomPaint(
            painter: CyberpunkBackgroundPainter(_backgroundController.value),
            size: Size.infinite,
          ),
        );
      },
    );
  }

  Widget _buildMainMenu(user) {
    return AnimatedBuilder(
      animation: _menuController,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, (1 - _menuController.value) * 100),
          child: Opacity(
            opacity: _menuController.value,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    _buildHeader(user),
                    Expanded(child: _buildGameMenu()),
                    _buildFooter(),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(user) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF00FFFF), width: 2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF00FFFF).withOpacity(0.3),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Row(
        children: [
          // User avatar
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFF0080), Color(0xFF00FFFF)],
              ),
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: const Icon(
              Icons.person,
              color: Colors.white,
              size: 30,
            ),
          ),

          const SizedBox(width: 16),

          // User info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.username ?? 'ANONYMOUS',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      Icons.circle,
                      color: Color(0xFF00FF00),
                      size: 8,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'NEURAL_LINK_ACTIVE',
                      style: TextStyle(
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: Color(0xFF00FF00),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Status indicators
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _buildStatusIndicator('UNITY', _isUnityLoaded, const Color(0xFF00FFFF)),
              _buildStatusIndicator('AI', true, const Color(0xFFFF0080)),
              _buildStatusIndicator('NET', true, const Color(0xFF00FF00)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusIndicator(String label, bool active, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontFamily: 'monospace',
              color: Color(0xFF808080),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: active ? color : const Color(0xFF404040),
              shape: BoxShape.circle,
              boxShadow: active
                  ? [
                      BoxShadow(
                        color: color,
                        blurRadius: 4,
                      ),
                    ]
                  : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGameMenu() {
    return Center(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Game logo
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFFF0080), width: 2),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFFF0080).withOpacity(0.5),
                    blurRadius: 30,
                  ),
                ],
              ),
              child: const Text(
                'PAINT REALITY',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'monospace',
                  color: Colors.white,
                  letterSpacing: 4,
                ),
              ),
            ),

            const SizedBox(height: 48),

            // Game description
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.8),
                border: Border.all(color: const Color(0xFF808080), width: 1),
              ),
              child: const Text(
                'Unity 3D 물리 엔진과 AI 생성 텍스처가 결합된\n혁신적인 페인트 전쟁 게임.\n\n현실의 벽을 부수고 가상세계에 색깔을 칠해라.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  fontFamily: 'monospace',
                  color: Color(0xFFCCCCCC),
                  height: 1.5,
                ),
              ),
            ),

            const SizedBox(height: 48),

            // Game controls
            Column(
              children: [
                CyberpunkButton(
                  text: '⚡ START GAME',
                  onPressed: _isUnityLoaded ? _startGame : null,
                  color: const Color(0xFF00FFFF),
                  width: double.infinity,
                  height: 60,
                  fontSize: 18,
                ),

                const SizedBox(height: 16),

                Row(
                  children: [
                    Expanded(
                      child: CyberpunkButton(
                        text: '🎯 TUTORIAL',
                        onPressed: () {
                          // TODO: Show tutorial
                        },
                        color: const Color(0xFFFF0080),
                        height: 50,
                      ),
                    ),

                    const SizedBox(width: 16),

                    Expanded(
                      child: CyberpunkButton(
                        text: '⚙️ SETTINGS',
                        onPressed: () {
                          // TODO: Show settings
                        },
                        color: const Color(0xFFFFFF00),
                        height: 50,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                CyberpunkButton(
                  text: '📊 LEADERBOARD',
                  onPressed: () {
                    // TODO: Show leaderboard
                  },
                  color: const Color(0xFF808080),
                  width: double.infinity,
                  height: 50,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'v1.0.0-EXPERIMENTAL',
            style: TextStyle(
              fontSize: 10,
              fontFamily: 'monospace',
              color: Color(0xFF808080),
            ),
          ),
          AnimatedBuilder(
            animation: _backgroundController,
            builder: (context, child) {
              return Text(
                'UPTIME: ${(_backgroundController.value * 1000).toInt()}ms',
                style: const TextStyle(
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: Color(0xFF00FF00),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildUnityLoader() {
    return Container(
      color: Colors.black.withOpacity(0.9),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00FFFF)),
            ),
            SizedBox(height: 16),
            Text(
              'LOADING UNITY ENGINE...',
              style: TextStyle(
                fontSize: 14,
                fontFamily: 'monospace',
                color: Color(0xFF00FFFF),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGameView(GameSession gameSession) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Unity game view
          if (_unityController != null)
            UnityWidget(
              onUnityCreated: _onUnityCreated,
              onUnityMessage: (message) {
                print('Unity message: $message');
              },
            ),

          // Game HUD overlay
          GameHUD(
            gameSession: gameSession,
            onPause: () {
              ref.read(gameSessionProvider.notifier).pauseGame();
            },
            onResume: () {
              ref.read(gameSessionProvider.notifier).resumeGame();
            },
            onExit: () {
              setState(() {
                _showGameView = false;
              });
              ref.read(gameSessionProvider.notifier).endGame();
            },
          ),
        ],
      ),
    );
  }
}

// Custom painter for cyberpunk background
class CyberpunkBackgroundPainter extends CustomPainter {
  final double animation;

  CyberpunkBackgroundPainter(this.animation);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5;

    // Draw animated grid
    paint.color = const Color(0xFF00FFFF).withOpacity(0.1);

    final gridSize = 40.0;
    final offset = animation * gridSize;

    for (double x = -gridSize + (offset % gridSize); x < size.width + gridSize; x += gridSize) {
      canvas.drawLine(
        Offset(x, 0),
        Offset(x, size.height),
        paint,
      );
    }

    for (double y = -gridSize + (offset % gridSize); y < size.height + gridSize; y += gridSize) {
      canvas.drawLine(
        Offset(0, y),
        Offset(size.width, y),
        paint,
      );
    }

    // Draw animated circuit paths
    paint.color = const Color(0xFFFF0080).withOpacity(0.3);
    paint.strokeWidth = 1;

    final path1 = Path();
    path1.moveTo(0, size.height * 0.2);
    path1.quadraticBezierTo(
      size.width * 0.3,
      size.height * 0.2 + (animation * 2 % 1) * 50,
      size.width * 0.6,
      size.height * 0.2,
    );
    path1.quadraticBezierTo(
      size.width * 0.8,
      size.height * 0.2 - (animation * 3 % 1) * 30,
      size.width,
      size.height * 0.2,
    );

    canvas.drawPath(path1, paint);

    paint.color = const Color(0xFFFFFF00).withOpacity(0.2);
    final path2 = Path();
    path2.moveTo(0, size.height * 0.8);
    path2.quadraticBezierTo(
      size.width * 0.4,
      size.height * 0.8 - (animation * 1.5 % 1) * 40,
      size.width * 0.7,
      size.height * 0.8,
    );
    path2.quadraticBezierTo(
      size.width * 0.9,
      size.height * 0.8 + (animation * 2.5 % 1) * 20,
      size.width,
      size.height * 0.8,
    );

    canvas.drawPath(path2, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}