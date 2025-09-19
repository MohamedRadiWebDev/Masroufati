
import 'package:speech_to_text/speech_to_text.dart';
import 'package:flutter/foundation.dart';

class SpeechRecognitionService {
  static final SpeechToText _speech = SpeechToText();
  static bool _isInitialized = false;
  static bool _isListening = false;

  // Initialize speech recognition
  static Future<bool> initialize() async {
    if (_isInitialized) return true;

    try {
      bool available = await _speech.initialize(
        onStatus: _onSpeechStatus,
        onError: _onSpeechError,
        debugLogging: kDebugMode,
      );
      
      if (available) {
        _isInitialized = true;
        return true;
      }
      return false;
    } catch (e) {
      if (kDebugMode) {
        print('خطأ في تهيئة التعرف على الكلام: $e');
      }
      return false;
    }
  }

  // Start listening for Arabic speech
  static Future<void> startListening({
    required Function(String) onResult,
    required Function(String) onError,
    Duration? timeout,
  }) async {
    if (!_isInitialized) {
      final initialized = await initialize();
      if (!initialized) {
        onError('فشل في تهيئة خدمة التعرف على الكلام');
        return;
      }
    }

    if (_isListening) {
      onError('التعرف على الكلام قيد التشغيل بالفعل');
      return;
    }

    try {
      await _speech.listen(
        onResult: (result) {
          if (result.finalResult) {
            onResult(result.recognizedWords);
          }
        },
        listenFor: timeout ?? const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 3),
        partialResults: true,
        localeId: 'ar-EG', // Egyptian Arabic
        cancelOnError: true,
        onSoundLevelChange: null,
      );
      _isListening = true;
    } catch (e) {
      onError('خطأ في بدء التعرف على الكلام: ${e.toString()}');
    }
  }

  // Stop listening
  static Future<void> stopListening() async {
    if (_isListening) {
      await _speech.stop();
      _isListening = false;
    }
  }

  // Cancel listening
  static Future<void> cancelListening() async {
    if (_isListening) {
      await _speech.cancel();
      _isListening = false;
    }
  }

  // Check if currently listening
  static bool get isListening => _isListening;

  // Check if speech recognition is available
  static bool get isAvailable => _isInitialized && _speech.isAvailable;

  // Get available locales
  static Future<List<String>> getAvailableLocales() async {
    if (!_isInitialized) await initialize();
    
    final locales = await _speech.locales();
    return locales
        .where((locale) => locale.localeId.startsWith('ar'))
        .map((locale) => locale.localeId)
        .toList();
  }

  static void _onSpeechStatus(String status) {
    if (kDebugMode) {
      print('Speech status: $status');
    }
    
    if (status == 'done' || status == 'notListening') {
      _isListening = false;
    }
  }

  static void _onSpeechError(dynamic error) {
    if (kDebugMode) {
      print('Speech error: $error');
    }
    _isListening = false;
  }
}
