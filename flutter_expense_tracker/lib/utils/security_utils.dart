
import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecurityUtils {
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );
  
  // Generate secure random ID
  static String generateSecureId() {
    final random = Random.secure();
    final bytes = List<int>.generate(16, (i) => random.nextInt(256));
    return base64Url.encode(bytes);
  }
  
  // Hash sensitive data
  static String hashData(String data, [String? salt]) {
    salt ??= generateSecureId();
    final bytes = utf8.encode(data + salt);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
  
  // Store sensitive data securely
  static Future<void> storeSecurely(String key, String value) async {
    try {
      await _secureStorage.write(key: key, value: value);
    } catch (e) {
      if (kDebugMode) {
        print('Failed to store securely: $e');
      }
      rethrow;
    }
  }
  
  // Retrieve sensitive data securely
  static Future<String?> retrieveSecurely(String key) async {
    try {
      return await _secureStorage.read(key: key);
    } catch (e) {
      if (kDebugMode) {
        print('Failed to retrieve securely: $e');
      }
      return null;
    }
  }
  
  // Delete sensitive data
  static Future<void> deleteSecurely(String key) async {
    try {
      await _secureStorage.delete(key: key);
    } catch (e) {
      if (kDebugMode) {
        print('Failed to delete securely: $e');
      }
    }
  }
  
  // Clear all secure storage
  static Future<void> clearAllSecure() async {
    try {
      await _secureStorage.deleteAll();
    } catch (e) {
      if (kDebugMode) {
        print('Failed to clear secure storage: $e');
      }
    }
  }
  
  // Validate input data
  static bool isValidAmount(String amount) {
    if (amount.isEmpty) return false;
    final parsed = double.tryParse(amount);
    return parsed != null && parsed > 0 && parsed <= 999999999;
  }
  
  static bool isValidNote(String note) {
    return note.length <= 500; // Max 500 characters
  }
  
  static bool isValidCategoryName(String name) {
    return name.isNotEmpty && 
           name.length <= 50 && 
           RegExp(r'^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\w]+$').hasMatch(name);
  }
  
  // Sanitize user input
  static String sanitizeInput(String input) {
    return input
        .replaceAll(RegExp(r'<[^>]*>'), '') // Remove HTML tags
        .replaceAll(RegExp(r'[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\w.,!?()-]'), '') // Keep only safe characters
        .trim();
  }
  
  // Encrypt sensitive data (for local storage)
  static String encryptData(String data, String key) {
    // Simple XOR encryption for demonstration
    // In production, use proper encryption libraries
    final keyBytes = utf8.encode(key.padRight(data.length, key));
    final dataBytes = utf8.encode(data);
    final encrypted = <int>[];
    
    for (int i = 0; i < dataBytes.length; i++) {
      encrypted.add(dataBytes[i] ^ keyBytes[i % keyBytes.length]);
    }
    
    return base64.encode(encrypted);
  }
  
  // Decrypt data
  static String decryptData(String encryptedData, String key) {
    try {
      final encrypted = base64.decode(encryptedData);
      final keyBytes = utf8.encode(key.padRight(encrypted.length, key));
      final decrypted = <int>[];
      
      for (int i = 0; i < encrypted.length; i++) {
        decrypted.add(encrypted[i] ^ keyBytes[i % keyBytes.length]);
      }
      
      return utf8.decode(decrypted);
    } catch (e) {
      if (kDebugMode) {
        print('Decryption failed: $e');
      }
      return '';
    }
  }
  
  // Generate app signature for integrity checking
  static String generateAppSignature() {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = generateSecureId();
    return hashData('$timestamp$random');
  }
  
  // Log security events (in debug mode only)
  static void logSecurityEvent(String event) {
    if (kDebugMode) {
      final timestamp = DateTime.now().toIso8601String();
      print('🔒 Security Event [$timestamp]: $event');
    }
  }
}
