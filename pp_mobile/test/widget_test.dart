// This is a basic Flutter widget test for PittuRu WebView app.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pp_mobile/main.dart';

void main() {
  testWidgets('PittuRu app loads correctly', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const PittuRuApp());

    // Verify that app title is displayed
    expect(find.text('🎮 PittuRu PpattuRu'), findsOneWidget);
    
    // Verify that navigation buttons are present
    expect(find.byIcon(Icons.arrow_back), findsOneWidget);
    expect(find.byIcon(Icons.arrow_forward), findsOneWidget);
    expect(find.byIcon(Icons.refresh), findsOneWidget);
    expect(find.byIcon(Icons.language), findsOneWidget);
    expect(find.byIcon(Icons.menu), findsOneWidget);
  });
}
