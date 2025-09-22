import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:math';

import '../../core/providers.dart';
import '../../widgets/cyberpunk_button.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with TickerProviderStateMixin {
  late AnimationController _backgroundController;
  late AnimationController _formController;
  late AnimationController _glitchController;

  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _showGlitch = false;
  String _glitchText = 'LOGIN';

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _startGlitchEffect();
  }

  void _initializeAnimations() {
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat();

    _formController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _glitchController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );

    _formController.forward();
  }

  void _startGlitchEffect() {
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _showGlitch = true;
          _glitchText = ['L0G1N', 'L#GIN', 'LO61N', 'LOGIN'][Random().nextInt(4)];
        });

        _glitchController.forward().then((_) {
          _glitchController.reset();
          if (mounted) {
            setState(() {
              _showGlitch = false;
              _glitchText = 'LOGIN';
            });
          }
        });

        // Repeat glitch effect
        _startGlitchEffect();
      }
    });
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    _formController.dispose();
    _glitchController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_usernameController.text.isEmpty || _passwordController.text.isEmpty) {
      _showErrorMessage('All fields are required');
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // TODO: Implement actual login logic
      await Future.delayed(const Duration(seconds: 2)); // Simulate network call

      // For demo purposes, always succeed
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/home');
      }
    } catch (e) {
      _showErrorMessage('Login failed: ${e.toString()}');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _demoLogin() async {
    setState(() {
      _isLoading = true;
    });

    try {
      await Future.delayed(const Duration(seconds: 1));

      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/home');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showErrorMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(
            fontFamily: 'monospace',
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFFFF0080),
        behavior: SnackBarBehavior.floating,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.zero,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          _buildAnimatedBackground(),
          _buildLoginForm(),
          if (_showGlitch) _buildGlitchOverlay(),
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
            painter: LoginBackgroundPainter(_backgroundController.value),
            size: Size.infinite,
          ),
        );
      },
    );
  }

  Widget _buildLoginForm() {
    return AnimatedBuilder(
      animation: _formController,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, (1 - _formController.value) * 100),
          child: Opacity(
            opacity: _formController.value,
            child: SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 400),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildLogo(),
                        const SizedBox(height: 48),
                        _buildLoginCard(),
                        const SizedBox(height: 24),
                        _buildSocialLogin(),
                        const SizedBox(height: 32),
                        _buildFooter(),
                      ],
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

  Widget _buildLogo() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF00FFFF), width: 2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF00FFFF).withOpacity(0.5),
                blurRadius: 30,
              ),
            ],
          ),
          child: Text(
            _showGlitch ? _glitchText : 'LOGIN',
            style: const TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.w900,
              fontFamily: 'monospace',
              color: Colors.white,
              letterSpacing: 4,
            ),
          ),
        ),

        const SizedBox(height: 16),

        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFFF0080).withOpacity(0.2),
            border: Border.all(color: const Color(0xFFFF0080), width: 1),
          ),
          child: const Text(
            'NEURAL AUTHENTICATION REQUIRED',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
              color: Color(0xFFFF0080),
              letterSpacing: 1,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoginCard() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        border: Border.all(color: const Color(0xFF808080), width: 1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF00FFFF).withOpacity(0.1),
            blurRadius: 20,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'ACCESS TERMINAL',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
              color: Color(0xFF00FFFF),
              letterSpacing: 2,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 24),

          _buildInputField(
            controller: _usernameController,
            label: 'USERNAME',
            hint: 'Enter your neural ID',
            icon: Icons.person,
          ),

          const SizedBox(height: 16),

          _buildInputField(
            controller: _passwordController,
            label: 'PASSWORD',
            hint: 'Enter security key',
            icon: Icons.lock,
            isPassword: true,
          ),

          const SizedBox(height: 24),

          CyberpunkButton(
            text: 'AUTHENTICATE',
            onPressed: _isLoading ? null : _login,
            color: const Color(0xFF00FFFF),
            width: double.infinity,
            height: 50,
            fontSize: 16,
            isLoading: _isLoading,
          ),

          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: Container(
                  height: 1,
                  color: const Color(0xFF808080),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'OR',
                  style: TextStyle(
                    fontFamily: 'monospace',
                    color: Color(0xFF808080),
                    fontSize: 12,
                  ),
                ),
              ),
              Expanded(
                child: Container(
                  height: 1,
                  color: const Color(0xFF808080),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          CyberpunkButton(
            text: 'DEMO ACCESS',
            onPressed: _isLoading ? null : _demoLogin,
            color: const Color(0xFFFFFF00),
            width: double.infinity,
            height: 50,
            fontSize: 16,
            isLoading: _isLoading,
          ),
        ],
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool isPassword = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
            color: Color(0xFF00FFFF),
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF808080), width: 1),
          ),
          child: TextField(
            controller: controller,
            obscureText: isPassword,
            style: const TextStyle(
              fontFamily: 'monospace',
              color: Colors.white,
              fontSize: 14,
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(
                fontFamily: 'monospace',
                color: Color(0xFF404040),
                fontSize: 12,
              ),
              prefixIcon: Icon(
                icon,
                color: const Color(0xFF808080),
                size: 20,
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
              filled: true,
              fillColor: const Color(0xFF0A0A0A),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSocialLogin() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.6),
        border: Border.all(color: const Color(0xFF404040), width: 1),
      ),
      child: Column(
        children: [
          const Text(
            'EXTERNAL AUTHENTICATION',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
              color: Color(0xFF808080),
              letterSpacing: 1,
            ),
          ),

          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: CyberpunkButton(
                  text: 'KAKAO',
                  onPressed: () {
                    // TODO: Implement Kakao login
                  },
                  color: const Color(0xFFFFFF00),
                  height: 40,
                  fontSize: 12,
                ),
              ),

              const SizedBox(width: 12),

              Expanded(
                child: CyberpunkButton(
                  text: 'GOOGLE',
                  onPressed: () {
                    // TODO: Implement Google login
                  },
                  color: const Color(0xFFFF0080),
                  height: 40,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'NEW USER?',
              style: TextStyle(
                fontSize: 12,
                fontFamily: 'monospace',
                color: Color(0xFF808080),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {
                // TODO: Navigate to registration
              },
              child: const Text(
                'CREATE NEURAL_ID',
                style: TextStyle(
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: Color(0xFF00FFFF),
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 16),

        const Text(
          'v1.0.0-EXPERIMENTAL | NEURAL_NET_ACTIVE',
          style: TextStyle(
            fontSize: 10,
            fontFamily: 'monospace',
            color: Color(0xFF404040),
          ),
        ),
      ],
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
}

// Custom painter for login background
class LoginBackgroundPainter extends CustomPainter {
  final double animation;

  LoginBackgroundPainter(this.animation);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5;

    // Draw animated circuit board pattern
    paint.color = const Color(0xFF00FFFF).withOpacity(0.1);

    final gridSize = 60.0;
    final offset = animation * gridSize * 0.5;

    // Vertical lines
    for (double x = offset % gridSize; x < size.width + gridSize; x += gridSize) {
      canvas.drawLine(
        Offset(x, 0),
        Offset(x, size.height),
        paint,
      );
    }

    // Horizontal lines
    for (double y = offset % gridSize; y < size.height + gridSize; y += gridSize) {
      canvas.drawLine(
        Offset(0, y),
        Offset(size.width, y),
        paint,
      );
    }

    // Draw animated data streams
    paint.color = const Color(0xFFFF0080).withOpacity(0.3);
    paint.strokeWidth = 1;

    for (int i = 0; i < 5; i++) {
      final y = (size.height / 5) * i + sin(animation * 2 + i) * 20;
      final path = Path();
      path.moveTo(0, y);

      for (double x = 0; x < size.width; x += 20) {
        path.lineTo(x, y + sin((x / 50) + animation * 3) * 10);
      }

      canvas.drawPath(path, paint);
    }

    // Draw random access points
    paint.style = PaintingStyle.fill;
    paint.color = const Color(0xFF00FFFF).withOpacity(0.6);

    final random = Random(42);
    for (int i = 0; i < 8; i++) {
      final x = random.nextDouble() * size.width;
      final y = random.nextDouble() * size.height;
      final pulse = sin(animation * 4 + i) * 0.5 + 0.5;

      canvas.drawCircle(
        Offset(x, y),
        2 + pulse * 3,
        paint,
      );
    }
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
    final paint = Paint()..style = PaintingStyle.fill;
    final random = Random(42);

    // Draw glitch rectangles
    for (int i = 0; i < 15; i++) {
      paint.color = [
        const Color(0xFFFF0080),
        const Color(0xFF00FFFF),
        const Color(0xFFFFFF00),
      ][i % 3].withOpacity(animation * 0.3);

      canvas.drawRect(
        Rect.fromLTWH(
          random.nextDouble() * size.width,
          random.nextDouble() * size.height,
          random.nextDouble() * 200,
          random.nextDouble() * 3,
        ),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}