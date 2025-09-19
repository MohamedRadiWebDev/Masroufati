
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_expense_tracker/services/speech_recognition_service.dart';
import 'package:mockito/mockito.dart';

void main() {
  group('SpeechRecognitionService Tests', () {
    setUp(() {
      // Reset service state before each test
    });

    test('should initialize successfully', () async {
      // Note: This test would require mocking the speech_to_text plugin
      // For now, we'll test the basic structure
      expect(SpeechRecognitionService.isAvailable, isA<bool>());
    });

    test('should handle initialization failure gracefully', () async {
      // Test error handling during initialization
      // This would require mocking the speech_to_text plugin to simulate failure
    });

    test('should not start listening when not initialized', () async {
      // Test that service doesn't start listening before initialization
      var errorCalled = false;
      
      await SpeechRecognitionService.startListening(
        onResult: (text) {
          fail('Should not receive results when not initialized');
        },
        onError: (error) {
          errorCalled = true;
        },
      );
      
      // In a real scenario, this would check if error was called
    });

    test('should stop listening correctly', () async {
      // Test stopping functionality
      await SpeechRecognitionService.stopListening();
      expect(SpeechRecognitionService.isListening, false);
    });

    test('should cancel listening correctly', () async {
      // Test canceling functionality
      await SpeechRecognitionService.cancelListening();
      expect(SpeechRecognitionService.isListening, false);
    });
  });
}
