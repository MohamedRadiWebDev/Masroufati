import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/dio_client.dart';
import '../services/api_client.dart';
import '../models/user.dart';

// Dio client provider
final dioClientProvider = Provider<DioClient>((ref) {
  return DioClient(
    onTokenExpired: () {
      // Clear auth state when token expires
      ref.read(authTokenProvider.notifier).state = null;
      ref.read(currentUserProvider.notifier).state = null;
    },
  );
});

// API client provider
final apiClientProvider = Provider<ApiClient>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return ApiClient(dioClient.dio);
});

// Auth token provider
final authTokenProvider = StateProvider<String?>((ref) => null);

// Current user provider
final currentUserProvider = StateProvider<User?>((ref) => null);

// User authentication state provider
final authStateProvider = StateProvider<bool>((ref) {
  final token = ref.watch(authTokenProvider);
  return token != null;
});

// Auth service provider
final authServiceProvider = Provider<AuthService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final dioClient = ref.watch(dioClientProvider);
  return AuthService(apiClient, dioClient, ref);
});

// Authentication service class
class AuthService {
  final ApiClient _apiClient;
  final DioClient _dioClient;
  final Ref _ref;

  AuthService(this._apiClient, this._dioClient, this._ref);

  Future<void> login(String username, String password) async {
    final request = LoginRequest(username: username, password: password);
    final response = await _apiClient.login(request);
    
    // Store token securely and update providers
    await _dioClient.setAuthToken(response.token);
    _ref.read(authTokenProvider.notifier).state = response.token;
    _ref.read(currentUserProvider.notifier).state = response.user;
  }

  Future<void> logout() async {
    // Clear token and user data
    await _dioClient.clearAuthToken();
    _ref.read(authTokenProvider.notifier).state = null;
    _ref.read(currentUserProvider.notifier).state = null;
  }

  Future<void> loadCurrentUser() async {
    try {
      final user = await _apiClient.getCurrentUser();
      _ref.read(currentUserProvider.notifier).state = user;
    } catch (e) {
      // If user fetch fails, likely invalid token
      await logout();
    }
  }
}