import 'package:flutter/material.dart';
import 'dart:math';

import '../core/providers.dart';
import 'cyberpunk_button.dart';

class GameHUD extends StatefulWidget {
  final GameSession gameSession;
  final VoidCallback onPause;
  final VoidCallback onResume;
  final VoidCallback onExit;

  const GameHUD({
    super.key,
    required this.gameSession,
    required this.onPause,
    required this.onResume,
    required this.onExit,
  });

  @override
  State<GameHUD> createState() => _GameHUDState();
}

class _GameHUDState extends State<GameHUD>
    with TickerProviderStateMixin {
  late AnimationController _hudController;
  late AnimationController _alertController;
  bool _showPauseMenu = false;
  bool _isAlertVisible = false;
  String _alertMessage = '';

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
  }

  void _initializeAnimations() {
    _hudController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _alertController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _hudController.forward();
  }

  @override
  void dispose() {
    _hudController.dispose();
    _alertController.dispose();
    super.dispose();
  }

  void _showAlert(String message) {
    setState(() {
      _alertMessage = message;
      _isAlertVisible = true;
    });
    _alertController.forward().then((_) {
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          _alertController.reverse().then((_) {
            setState(() {
              _isAlertVisible = false;
            });
          });
        }
      });
    });
  }

  void _togglePause() {
    setState(() {
      _showPauseMenu = !_showPauseMenu;
    });

    if (_showPauseMenu) {
      widget.onPause();
    } else {
      widget.onResume();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Main HUD
        _buildMainHUD(),

        // Pause menu overlay
        if (_showPauseMenu) _buildPauseMenu(),

        // Alert overlay
        if (_isAlertVisible) _buildAlert(),
      ],
    );
  }

  Widget _buildMainHUD() {
    return AnimatedBuilder(
      animation: _hudController,
      builder: (context, child) {
        return Opacity(
          opacity: _hudController.value,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildTopHUD(),
                  Expanded(child: _buildSideHUD()),
                  _buildBottomHUD(),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildTopHUD() {
    final currentState = widget.gameSession.currentState;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        border: Border.all(color: const Color(0xFF00FFFF), width: 1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF00FFFF).withOpacity(0.3),
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        children: [
          // Score
          _buildHUDItem(
            'SCORE',
            '${currentState?.score ?? 0}',
            const Color(0xFFFFFF00),
          ),

          const SizedBox(width: 24),

          // Paint coverage
          _buildHUDItem(
            'COVERAGE',
            '${(currentState?.paintCoverage ?? 0).toStringAsFixed(1)}%',
            const Color(0xFFFF0080),
          ),

          const SizedBox(width: 24),

          // Game time
          _buildHUDItem(
            'TIME',
            _formatTime(currentState?.gameTime ?? 0),
            const Color(0xFF00FF00),
          ),

          const Spacer(),

          // Pause button
          CyberpunkButton(
            text: '⏸',
            onPressed: _togglePause,
            color: const Color(0xFFFFFFFF),
            width: 40,
            height: 40,
            fontSize: 16,
          ),
        ],
      ),
    );
  }

  Widget _buildSideHUD() {
    return Row(
      children: [
        // Left side - Player info
        Container(
          width: 200,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.7),
            border: Border.all(color: const Color(0xFF808080), width: 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.gameSession.playerName ?? 'UNKNOWN',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              _buildStatusBar('HEALTH', 100, 100, const Color(0xFF00FF00)),
              const SizedBox(height: 4),
              _buildStatusBar('PAINT', 45, 50, const Color(0xFF00FFFF)),
              const SizedBox(height: 4),
              _buildStatusBar('ENERGY', 80, 100, const Color(0xFFFFFF00)),
            ],
          ),
        ),

        const Spacer(),

        // Right side - Minimap/Radar
        Container(
          width: 150,
          height: 150,
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.8),
            border: Border.all(color: const Color(0xFF00FFFF), width: 1),
          ),
          child: CustomPaint(
            painter: MinimapPainter(),
            child: const Center(
              child: Text(
                'RADAR',
                style: TextStyle(
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: Color(0xFF808080),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomHUD() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        border: Border.all(color: const Color(0xFF808080), width: 1),
      ),
      child: Row(
        children: [
          // Controls info
          const Text(
            'WASD: MOVE | MOUSE: AIM | CLICK: PAINT | ESC: PAUSE',
            style: TextStyle(
              fontSize: 12,
              fontFamily: 'monospace',
              color: Color(0xFFCCCCCC),
            ),
          ),

          const Spacer(),

          // Connection status
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xFF00FF00),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0xFF00FF00),
                      blurRadius: 4,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'CONNECTED',
                style: TextStyle(
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: Color(0xFF00FF00),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHUDItem(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontFamily: 'monospace',
            color: Color(0xFF808080),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBar(String label, int current, int max, Color color) {
    final percentage = current / max;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontFamily: 'monospace',
                color: Color(0xFF808080),
              ),
            ),
            Text(
              '$current/$max',
              style: TextStyle(
                fontSize: 10,
                fontFamily: 'monospace',
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Container(
          height: 6,
          decoration: BoxDecoration(
            border: Border.all(color: color, width: 1),
          ),
          child: LinearProgressIndicator(
            value: percentage,
            backgroundColor: Colors.transparent,
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }

  Widget _buildPauseMenu() {
    return Container(
      color: Colors.black.withOpacity(0.9),
      child: Center(
        child: Container(
          width: 400,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Colors.black,
            border: Border.all(color: const Color(0xFF00FFFF), width: 2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF00FFFF).withOpacity(0.5),
                blurRadius: 30,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'GAME PAUSED',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                  color: Colors.white,
                ),
              ),

              const SizedBox(height: 32),

              CyberpunkButton(
                text: '▶ RESUME',
                onPressed: _togglePause,
                color: const Color(0xFF00FF00),
                width: double.infinity,
                height: 50,
                fontSize: 16,
              ),

              const SizedBox(height: 16),

              CyberpunkButton(
                text: '⚙ SETTINGS',
                onPressed: () {
                  // TODO: Show settings
                },
                color: const Color(0xFFFFFF00),
                width: double.infinity,
                height: 50,
                fontSize: 16,
              ),

              const SizedBox(height: 16),

              CyberpunkButton(
                text: '🚪 EXIT GAME',
                onPressed: () {
                  _showExitConfirmation();
                },
                color: const Color(0xFFFF0080),
                width: double.infinity,
                height: 50,
                fontSize: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAlert() {
    return AnimatedBuilder(
      animation: _alertController,
      builder: (context, child) {
        return Positioned(
          top: 100,
          left: 0,
          right: 0,
          child: Transform.translate(
            offset: Offset(0, (1 - _alertController.value) * -50),
            child: Opacity(
              opacity: _alertController.value,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF0080).withOpacity(0.9),
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFF0080).withOpacity(0.8),
                        blurRadius: 20,
                      ),
                    ],
                  ),
                  child: Text(
                    _alertMessage,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'monospace',
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _showExitConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.black,
        title: const Text(
          'EXIT CONFIRMATION',
          style: TextStyle(
            color: Color(0xFFFF0080),
            fontFamily: 'monospace',
            fontWeight: FontWeight.bold,
          ),
        ),
        content: const Text(
          'Are you sure you want to exit?\nYour progress will be lost.',
          style: TextStyle(
            color: Colors.white,
            fontFamily: 'monospace',
          ),
        ),
        actions: [
          CyberpunkButton(
            text: 'CANCEL',
            onPressed: () => Navigator.of(context).pop(),
            color: const Color(0xFF808080),
          ),
          const SizedBox(width: 16),
          CyberpunkButton(
            text: 'EXIT',
            onPressed: () {
              Navigator.of(context).pop();
              widget.onExit();
            },
            color: const Color(0xFFFF0080),
          ),
        ],
      ),
    );
  }

  String _formatTime(double seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toInt().toString().padLeft(2, '0')}';
  }
}

// Custom painter for minimap
class MinimapPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    // Draw grid
    paint.color = const Color(0xFF00FFFF).withOpacity(0.3);

    for (int i = 0; i <= 5; i++) {
      double x = (size.width / 5) * i;
      double y = (size.height / 5) * i;

      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    // Draw player position (center)
    paint.style = PaintingStyle.fill;
    paint.color = const Color(0xFF00FF00);

    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2),
      4,
      paint,
    );

    // Draw some random targets
    paint.color = const Color(0xFFFF0080);
    final random = Random(42); // Fixed seed for consistency

    for (int i = 0; i < 3; i++) {
      canvas.drawCircle(
        Offset(
          random.nextDouble() * size.width,
          random.nextDouble() * size.height,
        ),
        2,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}