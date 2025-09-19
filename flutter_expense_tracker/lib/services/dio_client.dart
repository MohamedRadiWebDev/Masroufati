import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/foundation.dart';
import '../services/error_handler.dart';

class DioClient {
  static const String _baseUrlDev = 'http://localhost:5000';
  static const String _baseUrlAndroidEmulator = 'http://10.0.2.2:5000';
  static const String _baseUrlProd = 'https://your-production-url.com';
  
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final VoidCallback? _onTokenExpired;

  DioClient({VoidCallback? onTokenExpired}) : _onTokenExpired = onTokenExpired {
    _dio = Dio();
    _initializeBaseUrl();
    _setupInterceptors();
  }

  Dio get dio => _dio;

  String get baseUrl {
    if (kReleaseMode) {
      return _baseUrlProd;
    }
    
    // Handle different platforms in development
    if (kIsWeb) {
      // For web, use window.location.origin or localhost
      return _baseUrlDev;
    }
    
    // For mobile, handle Android emulator vs physical devices
    // Android emulator can't access localhost, use 10.0.2.2 instead
    if (defaultTargetPlatform == TargetPlatform.android) {
      return _baseUrlAndroidEmulator;
    }
    
    return _baseUrlDev;
  }

  void _initializeBaseUrl() {
    _dio.options.baseUrl = baseUrl;
  }

  void _setupInterceptors() {
    // Request interceptor for authentication
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add auth token to requests
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          
          // Add content type for JSON requests (but not for multipart)
          if (options.data is! FormData) {
            options.headers['Content-Type'] = 'application/json';
          }
          
          handler.next(options);
        },
        onResponse: (response, handler) {
          // Log responses in debug mode
          if (kDebugMode) {
            print('Response: ${response.statusCode} ${response.requestOptions.path}');
          }
          handler.next(response);
        },
        onError: (error, handler) async {
          // Handle 401 errors (unauthorized)
          if (error.response?.statusCode == 401) {
            await _storage.delete(key: 'auth_token');
            _onTokenExpired?.call(); // Notify app of token expiration
          }
          
          // Convert DioException to ApiError
          final apiError = ApiErrorHandler.handleDioError(error);
          
          // Log errors in debug mode (without sensitive data)
          if (kDebugMode) {
            print('API Error: ${apiError.message} (${apiError.statusCode})');
          }
          
          // Return ApiError instead of DioException
          handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              error: apiError,
              type: error.type,
            ),
          );
        },
      ),
    );

    // Logging interceptor for debug mode (without sensitive headers)
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        requestHeader: false, // Avoid logging Authorization headers
        responseHeader: false,
      ));
    }
  }

  // Token management
  Future<void> setAuthToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<String?> getAuthToken() async {
    return await _storage.read(key: 'auth_token');
  }

  Future<void> clearAuthToken() async {
    await _storage.delete(key: 'auth_token');
  }
}