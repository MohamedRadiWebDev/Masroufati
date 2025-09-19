
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_expense_tracker/widgets/voice_input_modal.dart';

void main() {
  group('VoiceInputModal Widget Tests', () {
    late Widget testWidget;

    setUp(() {
      testWidget = const ProviderScope(
        child: MaterialApp(
          home: Scaffold(
            body: VoiceInputModal(),
          ),
        ),
      );
    });

    testWidgets('should display initial UI correctly', (WidgetTester tester) async {
      await tester.pumpWidget(testWidget);

      // Check if main elements are present
      expect(find.text('الإدخال الصوتي'), findsOneWidget);
      expect(find.text('قل شيئاً مثل: "صرفت خمسين جنيه أكل في المطعم"'), findsOneWidget);
      expect(find.byIcon(Icons.mic), findsOneWidget);
      expect(find.text('انقر للبدء'), findsOneWidget);
    });

    testWidgets('should show listening state when activated', (WidgetTester tester) async {
      await tester.pumpWidget(testWidget);

      // Tap the microphone button
      await tester.tap(find.byIcon(Icons.mic));
      await tester.pump();

      // Check if listening state is shown
      // Note: This test would need proper mocking of speech recognition
    });

    testWidgets('should display recognized text', (WidgetTester tester) async {
      await tester.pumpWidget(testWidget);

      // This test would require mocking speech recognition results
      // and verifying that recognized text is displayed correctly
    });

    testWidgets('should show parsed transaction results', (WidgetTester tester) async {
      await tester.pumpWidget(testWidget);

      // This test would simulate successful parsing and verify
      // that transaction details are displayed correctly
    });

    testWidgets('should handle errors gracefully', (WidgetTester tester) async {
      await tester.pumpWidget(testWidget);

      // This test would simulate errors and verify proper error display
    });
  });
}
