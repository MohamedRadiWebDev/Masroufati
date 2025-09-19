import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../models/transaction.dart';
import '../models/category.dart' as models;
import '../services/api_client.dart';
import '../services/local_storage.dart';

class SyncService {
  final ApiClient _apiClient;
  final LocalStorage _localStorage;
  
  Timer? _syncTimer;
  bool _isSyncing = false;
  
  // Sync configuration
  static const Duration _syncInterval = Duration(minutes: 5);
  static const int _maxRetries = 3;
  static const Duration _retryDelay = Duration(seconds: 30);

  SyncService(this._apiClient, this._localStorage);

  // Start automatic background sync
  void startAutoSync() {
    stopAutoSync(); // Stop any existing timer
    
    _syncTimer = Timer.periodic(_syncInterval, (_) {
      if (!_isSyncing) {
        sync();
      }
    });
    
    // Initial sync
    sync();
  }

  void stopAutoSync() {
    _syncTimer?.cancel();
    _syncTimer = null;
  }

  // Manual sync trigger
  Future<SyncResult> sync() async {
    if (_isSyncing) {
      return SyncResult.inProgress();
    }

    _isSyncing = true;
    
    try {
      // Check network connectivity
      final connectivity = await Connectivity().checkConnectivity();
      if (connectivity == ConnectivityResult.none) {
        return SyncResult.noConnection();
      }

      final result = await _performSync();
      
      if (result.success) {
        await _localStorage.updateLastSyncTime();
      }
      
      return result;
      
    } catch (e) {
      if (kDebugMode) {
        print('Sync error: $e');
      }
      return SyncResult.error(e.toString());
    } finally {
      _isSyncing = false;
    }
  }

  Future<SyncResult> _performSync() async {
    int uploadedCount = 0;
    int downloadedCount = 0;
    int conflictsResolved = 0;

    try {
      // 1. Upload pending local changes
      final pendingItems = _localStorage.getPendingSyncItems();
      
      for (final item in pendingItems) {
        try {
          if (item['action'] == 'delete') {
            await _handleDelete(item);
          } else {
            await _handleUpload(item);
          }
          
          await _localStorage.markAsSynced(item['type'], item['id']);
          uploadedCount++;
          
        } catch (e) {
          if (kDebugMode) {
            print('Failed to sync item ${item['id']}: $e');
          }
          
          // Implement retry logic with exponential backoff
          bool success = false;
          for (int retry = 0; retry < _maxRetries; retry++) {
            try {
              await Future.delayed(_retryDelay * (1 << retry)); // Exponential backoff
              if (item['action'] == 'delete') {
                await _handleDelete(item);
              } else {
                await _handleUpload(item);
              }
              success = true;
              break;
            } catch (retryError) {
              if (kDebugMode) {
                print('Retry ${retry + 1}/$_maxRetries failed for ${item['id']}: $retryError');
              }
            }
          }
          
          if (!success) {
            // Skip this item after all retries failed
            continue;
          }
        }
      }

      // 2. Download latest data from server
      final lastSync = _localStorage.lastSyncTime;
      
      // Get transactions and reconcile deletions
      final transactions = await _apiClient.getTransactions();
      conflictsResolved += await _resolveTransactionConflicts(transactions);
      await _localStorage.reconcileTransactions(transactions); // Handle server deletions
      await _localStorage.saveTransactionsBulk(transactions, fromServer: true);
      downloadedCount += transactions.length;

      // Get categories and reconcile deletions
      final categories = await _apiClient.getCategories();
      conflictsResolved += await _resolveCategoryConflicts(categories);
      await _localStorage.reconcileCategories(categories); // Handle server deletions
      await _localStorage.saveCategoriesBulk(categories, fromServer: true);
      downloadedCount += categories.length;

      // Prune old sync metadata
      await _localStorage.pruneSyncMetadata();

      return SyncResult.success(
        uploadedCount: uploadedCount,
        downloadedCount: downloadedCount,
        conflictsResolved: conflictsResolved,
      );

    } catch (e) {
      return SyncResult.error(e.toString());
    }
  }

  Future<void> _handleUpload(Map<String, dynamic> item) async {
    final type = item['type'] as String;
    final id = item['id'] as String;
    final action = item['action'] as String;

    if (type == 'transaction') {
      final transaction = _localStorage.getTransaction(id);
      if (transaction != null) {
        try {
          final request = CreateTransactionRequest(
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
            note: transaction.note,
            date: transaction.date,
            receiptImage: transaction.receiptImage,
          );
          
          // Determine if this is a create or update based on sync history
          final isUpdate = _localStorage.wasEverSynced('transaction', id) || action == 'update';
          
          Transaction response;
          if (isUpdate) {
            // Use server ID for updates
            final serverId = _localStorage.getServerId('transaction', id) ?? id;
            response = await _apiClient.updateTransaction(serverId, request);
          } else {
            // First time upload - create new
            response = await _apiClient.createTransaction(request);
            
            // Mark as ever synced for future operations
            await _localStorage.markUpdateForSync('transaction', id, everSynced: true);
          }
          
          // If server returns different ID, migrate the local record
          if (response.id != transaction.id) {
            await _localStorage.migrateLocalToServerId('transaction', transaction.id, response.id, response);
          }
        } catch (e) {
          if (kDebugMode) {
            print('Failed to upload transaction $id: $e');
          }
          rethrow;
        }
      }
    } else if (type == 'category') {
      final category = _localStorage.getCategory(id);
      if (category != null) {
        try {
          final request = CreateCategoryRequest(
            name: category.name,
            color: category.color,
            icon: category.icon,
          );
          
          final isUpdate = _localStorage.wasEverSynced('category', id) || action == 'update';
          
          Category response;
          if (isUpdate) {
            final serverId = _localStorage.getServerId('category', id) ?? id;
            response = await _apiClient.updateCategory(serverId, request);
          } else {
            response = await _apiClient.createCategory(request);
            await _localStorage.markUpdateForSync('category', id, everSynced: true);
          }
          
          if (response.id != category.id) {
            await _localStorage.migrateLocalToServerId('category', category.id, response.id, response);
          }
        } catch (e) {
          if (kDebugMode) {
            print('Failed to upload category $id: $e');
          }
          rethrow;
        }
      }
    }
  }

  Future<void> _handleDelete(Map<String, dynamic> item) async {
    final type = item['type'] as String;
    final localId = item['id'] as String;
    
    // Get the server ID if this was a mapped local item
    final serverId = _localStorage.getServerId(type, localId) ?? localId;

    try {
      if (type == 'transaction') {
        await _apiClient.deleteTransaction(serverId);
      } else if (type == 'category') {
        await _apiClient.deleteCategory(serverId);
      }
      
      // Clear the mapping after successful delete
      await _localStorage.clearIdMapping(type, localId);
    } catch (e) {
      // If item doesn't exist on server (404), consider it successfully deleted
      if (e.toString().contains('404')) {
        await _localStorage.clearIdMapping(type, localId);
        return; // Successfully "deleted"
      }
      rethrow;
    }
  }

  Future<int> _resolveTransactionConflicts(List<Transaction> serverTransactions) async {
    final localTransactions = _localStorage.getAllTransactions();
    final localMap = {for (final t in localTransactions) t.id: t};
    int conflictsResolved = 0;

    for (final serverTransaction in serverTransactions) {
      final localTransaction = localMap[serverTransaction.id];
      
      if (localTransaction != null) {
        // Simple conflict resolution: check if local and server differ
        if (_hasConflict(localTransaction, serverTransaction)) {
          if (kDebugMode) {
            print('Resolving conflict for transaction ${serverTransaction.id}: server wins');
          }
          // Server data will overwrite local data in bulk save
          conflictsResolved++;
        }
      }
    }
    
    return conflictsResolved;
  }

  Future<int> _resolveCategoryConflicts(List<Category> serverCategories) async {
    final localCategories = _localStorage.getAllCategories();
    final localMap = {for (final c in localCategories) c.id: c};
    int conflictsResolved = 0;

    for (final serverCategory in serverCategories) {
      final localCategory = localMap[serverCategory.id];
      
      if (localCategory != null) {
        if (_hasCategoryConflict(localCategory, serverCategory)) {
          if (kDebugMode) {
            print('Resolving conflict for category ${serverCategory.id}: server wins');
          }
          conflictsResolved++;
        }
      }
    }
    
    return conflictsResolved;
  }

  bool _hasConflict(Transaction local, Transaction server) {
    // Check if data actually differs (indicating a conflict)
    return local.amount != server.amount ||
           local.category != server.category ||
           local.note != server.note ||
           local.type != server.type ||
           local.receiptImage != server.receiptImage;
  }

  bool _hasCategoryConflict(Category local, Category server) {
    return local.name != server.name ||
           local.color != server.color ||
           local.icon != server.icon;
  }

  bool get isSyncing => _isSyncing;
  DateTime? get lastSyncTime => _localStorage.lastSyncTime;
}

class SyncResult {
  final bool success;
  final String? error;
  final int uploadedCount;
  final int downloadedCount;
  final int conflictsResolved;
  final SyncStatus status;

  SyncResult._({
    required this.success,
    this.error,
    this.uploadedCount = 0,
    this.downloadedCount = 0,
    this.conflictsResolved = 0,
    required this.status,
  });

  factory SyncResult.success({
    int uploadedCount = 0,
    int downloadedCount = 0,
    int conflictsResolved = 0,
  }) {
    return SyncResult._(
      success: true,
      uploadedCount: uploadedCount,
      downloadedCount: downloadedCount,
      conflictsResolved: conflictsResolved,
      status: SyncStatus.completed,
    );
  }

  factory SyncResult.error(String error) {
    return SyncResult._(
      success: false,
      error: error,
      status: SyncStatus.error,
    );
  }

  factory SyncResult.noConnection() {
    return SyncResult._(
      success: false,
      error: 'لا يوجد اتصال بالإنترنت',
      status: SyncStatus.noConnection,
    );
  }

  factory SyncResult.inProgress() {
    return SyncResult._(
      success: false,
      status: SyncStatus.inProgress,
    );
  }
}

enum SyncStatus {
  completed,
  inProgress,
  error,
  noConnection,
}