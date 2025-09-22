import 'package:flutter/material.dart';

class AppTheme {
  // Cyberpunk color palette
  static const Color primaryCyan = Color(0xFF00FFFF);
  static const Color primaryPink = Color(0xFFFF0080);
  static const Color primaryYellow = Color(0xFFFFFF00);
  static const Color primaryGreen = Color(0xFF00FF00);
  static const Color primaryPurple = Color(0xFF8000FF);

  static const Color backgroundBlack = Color(0xFF000000);
  static const Color backgroundDark = Color(0xFF0A0A0A);
  static const Color backgroundGray = Color(0xFF1A1A1A);

  static const Color textWhite = Color(0xFFFFFFFF);
  static const Color textGray = Color(0xFF808080);
  static const Color textDark = Color(0xFF404040);

  // Light theme (Cyberpunk style)
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,

      // Color scheme
      colorScheme: const ColorScheme.dark(
        primary: primaryCyan,
        secondary: primaryPink,
        tertiary: primaryYellow,
        background: backgroundBlack,
        surface: backgroundGray,
        onPrimary: backgroundBlack,
        onSecondary: textWhite,
        onBackground: textWhite,
        onSurface: textWhite,
        error: primaryPink,
      ),

      // App bar theme
      appBarTheme: const AppBarTheme(
        backgroundColor: backgroundBlack,
        foregroundColor: textWhite,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          fontFamily: 'monospace',
          color: primaryCyan,
          letterSpacing: 2,
        ),
      ),

      // Text theme
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 57,
          fontWeight: FontWeight.w900,
          fontFamily: 'monospace',
          color: textWhite,
          letterSpacing: -1,
        ),
        displayMedium: TextStyle(
          fontSize: 45,
          fontWeight: FontWeight.w900,
          fontFamily: 'monospace',
          color: textWhite,
          letterSpacing: -0.5,
        ),
        displaySmall: TextStyle(
          fontSize: 36,
          fontWeight: FontWeight.w900,
          fontFamily: 'monospace',
          color: textWhite,
        ),
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          fontFamily: 'monospace',
          color: textWhite,
        ),
        headlineMedium: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          fontFamily: 'monospace',
          color: textWhite,
        ),
        headlineSmall: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          fontFamily: 'monospace',
          color: textWhite,
        ),
        titleLarge: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          fontFamily: 'monospace',
          color: textWhite,
        ),
        titleMedium: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          fontFamily: 'monospace',
          color: textWhite,
        ),
        titleSmall: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          fontFamily: 'monospace',
          color: textWhite,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          fontFamily: 'monospace',
          color: textWhite,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          fontFamily: 'monospace',
          color: textWhite,
        ),
        bodySmall: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          fontFamily: 'monospace',
          color: textGray,
        ),
        labelLarge: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          fontFamily: 'monospace',
          color: textWhite,
          letterSpacing: 1,
        ),
        labelMedium: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          fontFamily: 'monospace',
          color: textWhite,
          letterSpacing: 1,
        ),
        labelSmall: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          fontFamily: 'monospace',
          color: textGray,
          letterSpacing: 1,
        ),
      ),

      // Button theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryCyan,
          foregroundColor: backgroundBlack,
          elevation: 0,
          shadowColor: primaryCyan,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
            letterSpacing: 1,
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.zero,
          ),
        ).copyWith(
          overlayColor: MaterialStateProperty.all(primaryCyan.withOpacity(0.2)),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryCyan,
          side: const BorderSide(color: primaryCyan, width: 2),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
            letterSpacing: 1,
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.zero,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryCyan,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
            letterSpacing: 1,
          ),
        ),
      ),

      // Input decoration theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: backgroundGray,
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.zero,
          borderSide: BorderSide(color: primaryCyan, width: 2),
        ),
        enabledBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.zero,
          borderSide: BorderSide(color: textGray, width: 1),
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.zero,
          borderSide: BorderSide(color: primaryCyan, width: 2),
        ),
        errorBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.zero,
          borderSide: BorderSide(color: primaryPink, width: 2),
        ),
        focusedErrorBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.zero,
          borderSide: BorderSide(color: primaryPink, width: 2),
        ),
        labelStyle: const TextStyle(
          color: textGray,
          fontFamily: 'monospace',
        ),
        hintStyle: const TextStyle(
          color: textDark,
          fontFamily: 'monospace',
        ),
        errorStyle: const TextStyle(
          color: primaryPink,
          fontFamily: 'monospace',
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),

      // Card theme
      cardTheme: CardThemeData(
        color: backgroundGray,
        elevation: 0,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.zero,
          side: BorderSide(color: textGray, width: 1),
        ),
        margin: const EdgeInsets.all(8),
      ),

      // Dialog theme
      dialogTheme: const DialogThemeData(
        backgroundColor: backgroundBlack,
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          fontFamily: 'monospace',
          color: primaryCyan,
        ),
        contentTextStyle: TextStyle(
          fontSize: 14,
          fontFamily: 'monospace',
          color: textWhite,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.zero,
        ),
      ),

      // Bottom navigation bar theme
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: backgroundBlack,
        selectedItemColor: primaryCyan,
        unselectedItemColor: textGray,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: TextStyle(
          fontFamily: 'monospace',
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: 'monospace',
          fontSize: 10,
        ),
      ),

      // Tab bar theme
      tabBarTheme: const TabBarThemeData(
        labelColor: primaryCyan,
        unselectedLabelColor: textGray,
        indicatorColor: primaryCyan,
        labelStyle: TextStyle(
          fontFamily: 'monospace',
          fontWeight: FontWeight.bold,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: 'monospace',
        ),
      ),

      // Progress indicator theme
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primaryCyan,
        linearTrackColor: backgroundGray,
        circularTrackColor: backgroundGray,
      ),

      // Switch theme
      switchTheme: SwitchThemeData(
        thumbColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryCyan;
          }
          return textGray;
        }),
        trackColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryCyan.withOpacity(0.3);
          }
          return backgroundGray;
        }),
      ),

      // Checkbox theme
      checkboxTheme: CheckboxThemeData(
        fillColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryCyan;
          }
          return Colors.transparent;
        }),
        checkColor: MaterialStateProperty.all(backgroundBlack),
        side: const BorderSide(color: primaryCyan, width: 2),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.zero,
        ),
      ),

      // Radio theme
      radioTheme: RadioThemeData(
        fillColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryCyan;
          }
          return textGray;
        }),
      ),

      // Divider theme
      dividerTheme: const DividerThemeData(
        color: textGray,
        thickness: 1,
        space: 16,
      ),

      // Icon theme
      iconTheme: const IconThemeData(
        color: primaryCyan,
        size: 24,
      ),

      // Primary icon theme
      primaryIconTheme: const IconThemeData(
        color: backgroundBlack,
        size: 24,
      ),
    );
  }

  // Dark theme (same as light theme for cyberpunk consistency)
  static ThemeData get darkTheme => lightTheme;

  // Custom gradients
  static const Gradient primaryGradient = LinearGradient(
    colors: [primaryCyan, primaryPink],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Gradient secondaryGradient = LinearGradient(
    colors: [primaryPink, primaryYellow],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Gradient accentGradient = LinearGradient(
    colors: [primaryYellow, primaryGreen],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Custom shadows
  static List<BoxShadow> get cyberpunkShadow => [
    BoxShadow(
      color: primaryCyan.withOpacity(0.3),
      blurRadius: 10,
      spreadRadius: 2,
    ),
  ];

  static List<BoxShadow> get pinkGlow => [
    BoxShadow(
      color: primaryPink.withOpacity(0.5),
      blurRadius: 20,
      spreadRadius: 4,
    ),
  ];

  static List<BoxShadow> get yellowGlow => [
    BoxShadow(
      color: primaryYellow.withOpacity(0.4),
      blurRadius: 15,
      spreadRadius: 3,
    ),
  ];
}