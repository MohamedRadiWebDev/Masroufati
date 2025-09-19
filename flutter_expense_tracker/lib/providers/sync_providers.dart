import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/sync_service.dart';
import '../services/local_storage.dart';
import 'api_providers.dart';

// Local storage provider
final localStorageProvider = Provider<LocalStorage>((ref) {
  return LocalStorage.instance;
});

// Sync service provider
final syncServiceProvider = Provider<SyncService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final localStorage = ref.watch(localStorageProvider);
  return SyncService(apiClient, localStorage);
});

// Sync status provider
final syncStatusProvider = StateProvider<SyncResult?>((ref) => null);

// Auto sync state provider
final autoSyncEnabledProvider = StateProvider<bool>((ref) => true);

// Last sync time provider
final lastSyncTimeProvider = Provider<DateTime?>((ref) {
  final localStorage = ref.watch(localStorageProvider);
  return localStorage.lastSyncTime;
});

// Pending sync items count provider
final pendingSyncCountProvider = Provider<int>((ref) {
  final localStorage = ref.watch(localStorageProvider);
  return localStorage.getPendingSyncItems().length;
});

// Sync controller provider
final syncControllerProvider = Provider<SyncController>((ref) {
  final syncService = ref.watch(syncServiceProvider);
  return SyncController(syncService, ref);
});

class SyncController {
  final SyncService _syncService;
  final Ref _ref;

  SyncController(this._syncService, this._ref);

  // Manual sync trigger
  Future<void> triggerSync() async {
    _ref.read(syncStatusProvider.notifier).state = SyncResult.inProgress();
    
    final result = await _syncService.sync();
    _ref.read(syncStatusProvider.notifier).state = result;
  }

  // Toggle auto sync
  void toggleAutoSync(bool enabled) {
    _ref.read(autoSyncEnabledProvider.notifier).state = enabled;
    
    if (enabled) {
      _syncService.startAutoSync();
    } else {
      _syncService.stopAutoSync();
    }
  }

  // Initialize sync service
  void initialize() {
    final autoSyncEnabled = _ref.read(autoSyncEnabledProvider);
    if (autoSyncEnabled) {
      _syncService.startAutoSync();
    }
  }

  void dispose() {
    _syncService.stopAutoSync();
  }
}