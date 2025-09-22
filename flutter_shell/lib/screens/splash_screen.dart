import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:math';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _glitchController;
  late AnimationController _logoController;
  late AnimationController _loadingController;
  late AnimationController _particleController;

  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  late Animation<double> _loadingProgress;
  late Animation<double> _particleRotation;

  Timer? _glitchTimer;
  bool _showGlitch = false;
  String _currentText = 'PITTU';
  List<String> _glitchTexts = ['P1TTU', 'P!TTU', 'P#TTU', 'PITTU'];
  int _loadingStep = 0;
  List<String> _loadingSteps = [
    'INITIALIZING NEURAL NETWORK...',
    'LOADING AI ASSETS...',
    'CONNECTING TO UNITY CORE...',
    'ESTABLISHING PLATFORM BRIDGE...',
    'REALITY BREACH IN PROGRESS...',
    'WELCOME TO PITTURU'
  ];

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _startGlitchEffect();
    _startLoadingSequence();
  }

  void _initializeAnimations() {
    // Logo animation
    _logoController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );

    _logoScale = Tween<double>(
      begin: 0.5,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _logoController,
      curve: Curves.elasticOut,
    ));

    _logoOpacity = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _logoController,
      curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
    ));

    // Glitch animation
    _glitchController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );

    // Loading animation
    _loadingController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _loadingProgress = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _loadingController,
      curve: Curves.easeInOut,
    ));

    // Particle animation
    _particleController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat();

    _particleRotation = Tween<double>(
      begin: 0.0,
      end: 2 * pi,
    ).animate(_particleController);

    _logoController.forward();
  }

  void _startGlitchEffect() {
    _glitchTimer = Timer.periodic(const Duration(milliseconds: 2000), (timer) {
      if (mounted) {
        setState(() {
          _showGlitch = true;
          _currentText = _glitchTexts[Random().nextInt(_glitchTexts.length)];
        });

        _glitchController.forward().then((_) {
          _glitchController.reset();
          if (mounted) {
            setState(() {
              _showGlitch = false;
              _currentText = 'PITTU';
            });
          }
        });
      }
    });
  }

  void _startLoadingSequence() {
    Timer.periodic(const Duration(milliseconds: 800), (timer) {
      if (mounted && _loadingStep < _loadingSteps.length) {
        setState(() {
          _loadingStep++;
        });
        _loadingController.forward().then((_) {
          _loadingController.reset();
        });

        if (_loadingStep >= _loadingSteps.length) {
          timer.cancel();
          // Navigate to main screen after loading
          Future.delayed(const Duration(milliseconds: 1000), () {
            if (mounted) {
              // This would normally navigate to the main app
              // Navigator.of(context).pushReplacementNamed('/home');
            }
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _logoController.dispose();
    _glitchController.dispose();
    _loadingController.dispose();
    _particleController.dispose();
    _glitchTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Animated background
          _buildAnimatedBackground(),

          // Floating particles
          _buildFloatingParticles(),

          // Main content
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo section
                AnimatedBuilder(
                  animation: _logoController,
                  builder: (context, child) {
                    return Opacity(
                      opacity: _logoOpacity.value,
                      child: Transform.scale(
                        scale: _logoScale.value,
                        child: _buildLogo(),
                      ),
                    );
                  },
                ),

                const SizedBox(height: 60),

                // Loading section
                _buildLoadingSection(),

                const SizedBox(height: 40),

                // System status
                _buildSystemStatus(),
              ],
            ),
          ),

          // Glitch overlay
          if (_showGlitch) _buildGlitchOverlay(),

          // Corner decorations
          _buildCornerDecorations(),
        ],
      ),
    );
  }

  Widget _buildAnimatedBackground() {
    return Container(
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment.center,
          radius: 1.0,
          colors: [
            Color(0xFF1a0033),
            Color(0xFF000000),
          ],
        ),
      ),
      child: AnimatedBuilder(
        animation: _particleController,
        builder: (context, child) {
          return CustomPaint(
            painter: BackgroundParticlePainter(_particleRotation.value),
            size: Size.infinite,
          );
        },
      ),
    );
  }

  Widget _buildFloatingParticles() {
    return AnimatedBuilder(
      animation: _particleController,
      builder: (context, child) {
        return Stack(
          children: List.generate(15, (index) {
            final offset = Offset(
              (index * 50.0 + _particleRotation.value * 30) % MediaQuery.of(context).size.width,
              (index * 80.0 + sin(_particleRotation.value + index) * 100) % MediaQuery.of(context).size.height,
            );

            return Positioned(
              left: offset.dx,
              top: offset.dy,
              child: Container(
                width: 2 + (index % 3),
                height: 2 + (index % 3),
                decoration: BoxDecoration(
                  color: [
                    const Color(0xFF00FFFF),
                    const Color(0xFFFF0080),
                    const Color(0xFFFFFF00),
                  ][index % 3].withOpacity(0.6),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: [
                        const Color(0xFF00FFFF),
                        const Color(0xFFFF0080),
                        const Color(0xFFFFFF00),
                      ][index % 3],
                      blurRadius: 4,
                    ),
                  ],
                ),
              ),
            );
          }),
        );
      },
    );
  }

  Widget _buildLogo() {
    return Column(
      children: [
        // Main logo text
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF00FFFF), width: 2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF00FFFF).withOpacity(0.5),
                blurRadius: 20,
                spreadRadius: 2,
              ),
            ],
          ),
          child: RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: _showGlitch ? _currentText : 'PITTU',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'monospace',
                    foreground: Paint()
                      ..shader = const LinearGradient(
                        colors: [
                          Color(0xFFFF0080),
                          Color(0xFF00FFFF),
                          Color(0xFFFFFF00),
                        ],
                      ).createShader(const Rect.fromLTWH(0, 0, 200, 70)),
                  ),
                ),
                const TextSpan(
                  text: 'RU',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'monospace',
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Subtitle
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFFF0080).withOpacity(0.2),
            border: Border.all(color: const Color(0xFFFF0080), width: 1),
          ),
          child: const Text(
            'EXPERIMENTAL GAME LAB',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
              color: Color(0xFFFF0080),
              letterSpacing: 2,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoadingSection() {
    return Column(
      children: [
        // Loading bar
        Container(
          width: 300,
          height: 4,
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF00FFFF), width: 1),
          ),
          child: AnimatedBuilder(
            animation: _loadingController,
            builder: (context, child) {
              return LinearProgressIndicator(
                value: _loadingStep / _loadingSteps.length,
                backgroundColor: Colors.transparent,
                valueColor: AlwaysStoppedAnimation<Color>(
                  const Color(0xFF00FFFF).withOpacity(0.8),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 16),

        // Loading text
        SizedBox(
          height: 30,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: _loadingStep > 0
                ? Text(
                    key: ValueKey(_loadingStep),
                    _loadingSteps[_loadingStep - 1],
                    style: const TextStyle(
                      fontSize: 14,
                      fontFamily: 'monospace',
                      color: Color(0xFF00FFFF),
                      letterSpacing: 1,
                    ),
                  )
                : const SizedBox(),
          ),
        ),

        const SizedBox(height: 8),

        // Progress percentage
        Text(
          '${((_loadingStep / _loadingSteps.length) * 100).toInt()}%',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
            color: Color(0xFFFFFF00),
          ),
        ),
      ],
    );
  }

  Widget _buildSystemStatus() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF808080), width: 1),
        color: Colors.black.withOpacity(0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStatusLine('> SYSTEM_STATUS:', 'EXPERIMENTAL', const Color(0xFFFFFF00)),
          _buildStatusLine('> UNITY_CORE:', 'LOADING...', const Color(0xFF00FFFF)),
          _buildStatusLine('> AI_ASSETS:', 'GENERATING...', const Color(0xFFFF0080)),
          _buildStatusLine('> REALITY_BREACH:', '${Random().nextInt(100)}%', const Color(0xFF00FF00)),
        ],
      ),
    );
  }

  Widget _buildStatusLine(String label, String value, Color color) {
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
          Text(
            value,
            style: TextStyle(
              fontSize: 10,
              fontFamily: 'monospace',
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlitchOverlay() {
    return AnimatedBuilder(
      animation: _glitchController,
      builder: (context, child) {
        return Container(
          color: Colors.white.withOpacity(_glitchController.value * 0.1),
          child: CustomPaint(
            painter: GlitchPainter(_glitchController.value),
            size: Size.infinite,
          ),
        );
      },
    );
  }

  Widget _buildCornerDecorations() {
    return Stack(
      children: [
        // Top left
        const Positioned(
          top: 50,
          left: 20,
          child: Text(
            '01001000 01100101',
            style: TextStyle(
              fontSize: 8,
              fontFamily: 'monospace',
              color: Color(0xFF00FFFF),
            ),
          ),
        ),

        // Top right
        const Positioned(
          top: 50,
          right: 20,
          child: Text(
            'NEURAL_NET_ACTIVE',
            style: TextStyle(
              fontSize: 8,
              fontFamily: 'monospace',
              color: Color(0xFFFF0080),
            ),
          ),
        ),

        // Bottom left
        const Positioned(
          bottom: 50,
          left: 20,
          child: Text(
            'v1.0.0-EXPERIMENTAL',
            style: TextStyle(
              fontSize: 8,
              fontFamily: 'monospace',
              color: Color(0xFF808080),
            ),
          ),
        ),

        // Bottom right
        Positioned(
          bottom: 50,
          right: 20,
          child: AnimatedBuilder(
            animation: _particleController,
            builder: (context, child) {
              return Text(
                'UPTIME: ${(_particleController.value * 100).toInt()}s',
                style: const TextStyle(
                  fontSize: 8,
                  fontFamily: 'monospace',
                  color: Color(0xFF00FF00),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// Custom painter for background particles
class BackgroundParticlePainter extends CustomPainter {
  final double animation;

  BackgroundParticlePainter(this.animation);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5;

    // Draw grid lines
    paint.color = const Color(0xFF00FFFF).withOpacity(0.1);

    for (int i = 0; i < size.width; i += 50) {
      canvas.drawLine(
        Offset(i.toDouble(), 0),
        Offset(i.toDouble(), size.height),
        paint,
      );
    }

    for (int i = 0; i < size.height; i += 50) {
      canvas.drawLine(
        Offset(0, i.toDouble()),
        Offset(size.width, i.toDouble()),
        paint,
      );
    }

    // Draw animated circuit lines
    paint.color = const Color(0xFFFF0080).withOpacity(0.3);
    paint.strokeWidth = 1;

    final path = Path();
    path.moveTo(0, size.height * 0.3);
    path.quadraticBezierTo(
      size.width * 0.5,
      size.height * 0.3 + sin(animation * 2) * 20,
      size.width,
      size.height * 0.3,
    );

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

// Custom painter for glitch effect
class GlitchPainter extends CustomPainter {
  final double animation;

  GlitchPainter(this.animation);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.fill;

    final random = Random(42); // Fixed seed for consistent glitch

    // Draw random colored rectangles for glitch effect
    for (int i = 0; i < 10; i++) {
      paint.color = [
        const Color(0xFFFF0080),
        const Color(0xFF00FFFF),
        const Color(0xFFFFFF00),
      ][i % 3].withOpacity(animation * 0.3);

      canvas.drawRect(
        Rect.fromLTWH(
          random.nextDouble() * size.width,
          random.nextDouble() * size.height,
          random.nextDouble() * 100,
          random.nextDouble() * 5,
        ),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}