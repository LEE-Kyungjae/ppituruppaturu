import 'package:flutter/material.dart';

class CyberpunkButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final Color color;
  final double? width;
  final double? height;
  final double fontSize;
  final IconData? icon;
  final bool isLoading;

  const CyberpunkButton({
    super.key,
    required this.text,
    this.onPressed,
    this.color = const Color(0xFF00FFFF),
    this.width,
    this.height = 50,
    this.fontSize = 14,
    this.icon,
    this.isLoading = false,
  });

  @override
  State<CyberpunkButton> createState() => _CyberpunkButtonState();
}

class _CyberpunkButtonState extends State<CyberpunkButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _glowAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _glowAnimation = Tween<double>(
      begin: 0.3,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEnabled = widget.onPressed != null && !widget.isLoading;

    return GestureDetector(
      onTapDown: isEnabled ? (_) => setState(() => _isPressed = true) : null,
      onTapUp: isEnabled ? (_) => setState(() => _isPressed = false) : null,
      onTapCancel: isEnabled ? () => setState(() => _isPressed = false) : null,
      onTap: widget.onPressed,
      child: AnimatedBuilder(
        animation: _glowAnimation,
        builder: (context, child) {
          return Container(
            width: widget.width,
            height: widget.height,
            decoration: BoxDecoration(
              color: Colors.black,
              border: Border.all(
                color: isEnabled ? widget.color : const Color(0xFF404040),
                width: 2,
              ),
              boxShadow: isEnabled
                  ? [
                      BoxShadow(
                        color: widget.color.withOpacity(_glowAnimation.value * 0.5),
                        blurRadius: _isPressed ? 15 : 10,
                        spreadRadius: _isPressed ? 3 : 1,
                      ),
                      if (_isPressed)
                        BoxShadow(
                          color: widget.color.withOpacity(0.8),
                          blurRadius: 25,
                          spreadRadius: 5,
                        ),
                    ]
                  : null,
            ),
            child: Transform.scale(
              scale: _isPressed ? 0.95 : 1.0,
              child: Container(
                decoration: BoxDecoration(
                  gradient: _isPressed
                      ? LinearGradient(
                          colors: [
                            widget.color.withOpacity(0.2),
                            Colors.transparent,
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : null,
                ),
                child: Center(
                  child: widget.isLoading
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(widget.color),
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (widget.icon != null) ...[
                              Icon(
                                widget.icon,
                                color: isEnabled ? widget.color : const Color(0xFF404040),
                                size: widget.fontSize + 2,
                              ),
                              const SizedBox(width: 8),
                            ],
                            Text(
                              widget.text,
                              style: TextStyle(
                                fontSize: widget.fontSize,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                                color: isEnabled ? widget.color : const Color(0xFF404040),
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}