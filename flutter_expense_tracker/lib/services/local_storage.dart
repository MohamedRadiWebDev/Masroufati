import 'package:hive_flutter/hive_flutter.dart';
import 'package:hive/hive.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'dart:typed_data';
import '../models/transaction.dart';
import '../models/category.dart';

class LocalStorage {
  static const String _transactionsBox = 'transactions';
  static const String _categoriesBox = 'categories';
  static const String _syncBox = 'sync_metadata';
  
  late Box<Map<String, dynamic>> _transactions;
  late Box<Map<String, dynamic>> _categories;
  late Box<Map<String, dynamic>> _syncMetadata;

  static LocalStorage? _instance;
  static LocalStorage get instance => _instance!;

  static Future<void> initialize() async {
    await Hive.initFlutter();
    
    _instance = LocalStorage._();
    await _instance!._openBoxes();
  }

  Future<Uint8List> _getEncryptionKey() async {
    const storage = FlutterSecureStorage();
    String? keyString = await storage.read(key: 'hive_encryption_key');
    
    if (keyString == null) {
      // Generate new encryption key
      final key = Hive.generateSecureKey();
      keyString = base64.encode(key);
      await storage.write(key: 'hive_encryption_key', value: keyString);
      return key;
    }
    
    return base64.decode(keyString);
  }

  LocalStorage._();

  Future<void> _openBoxes() async {
    final encryptionKey = await _getEncryptionKey();
    
    _transactions = await Hive.openBox<Map<String, dynamic>>(
      _transactionsBox,
      encryptionCipher: HiveAesCipher(encryptionKey),
    );
    _categories = await Hive.openBox<Map<String, dynamic>>(
      _categoriesBox,
      encryptionCipher: HiveAesCipher(encryptionKey),
    );
    _syncMetadata = await Hive.openBox<Map<String, dynamic>>(
      _syncBox,
      encryptionCipher: HiveAesCipher(encryptionKey),
    );
  }

  // Transaction operations
  Future<void> saveTransaction(Transaction transaction, {bool fromServer = false}) async {
    final json = transaction.toJson();
    await _transactions.put(transaction.id, json);
    
    // Don't automatically mark for sync here - let repositories control sync metadata
    // to avoid redundant writes
  }

  Future<void> deleteTransaction(String id) async {
    await _transactions.delete(id);
    await _markForSync(id, 'transaction', 'delete');
  }

  List<Transaction> getAllTransactions() {
    return _transactions.values
        .where((json) => json != null)
        .map((json) => Transaction.fromJson(json!))
        .toList();
  }

  Transaction? getTransaction(String id) {
    final json = _transactions.get(id);
    return json != null ? Transaction.fromJson(json) : null;
  }

  // Category operations
  Future<void> saveCategory(Category category, {bool fromServer = false}) async {
    final json = category.toJson();
    await _categories.put(category.id, json);
    
    // Don't automatically mark for sync here - let repositories control sync metadata
    // to avoid redundant writes
  }

  Future<void> deleteCategory(String id) async {
    await _categories.delete(id);
    await _markForSync(id, 'category', 'delete');
  }

  List<Category> getAllCategories() {
    return _categories.values
        .where((json) => json != null)
        .map((json) => Category.fromJson(json!))
        .toList();
  }

  Category? getCategory(String id) {
    final json = _categories.get(id);
    return json != null ? Category.fromJson(json) : null;
  }

  // Sync metadata operations
  Future<void> _markForSync(String id, String type, String action, {bool everSynced = false}) async {
    final syncItem = {
      'id': id,
      'type': type, // 'transaction' or 'category'
      'action': action, // 'create', 'update' or 'delete'
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'synced': false,
      'ever_synced': everSynced, // Track if item was ever synced to server
    };
    
    await _syncMetadata.put('${type}_$id', syncItem);
  }

  // Public methods for sync state management
  Future<void> markCreateForSync(String type, String id) async {
    await _markForSync(id, type, 'create');
  }

  Future<void> markUpdateForSync(String type, String id, {bool everSynced = false}) async {
    await _markForSync(id, type, 'update', everSynced: everSynced);
  }

  Future<void> markDeleteForSync(String type, String id) async {
    await _markForSync(id, type, 'delete');
  }

  // Mark server data as synced without pending status
  Future<void> markEverSyncedNoPending(String type, String id) async {
    final syncItem = {
      'id': id,
      'type': type,
      'action': 'synced', // Special action for server data
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'synced': true, // Already synced
      'ever_synced': true, // Came from server
    };
    
    await _syncMetadata.put('${type}_$id', syncItem);
  }

  // Check if item has pending sync operations
  bool hasPendingSync(String type, String id) {
    final key = '${type}_$id';
    final item = _syncMetadata.get(key);
    return item != null && item['synced'] == false;
  }

  // Check if item was ever synced to server
  bool wasEverSynced(String type, String id) {
    final key = '${type}_$id';
    final item = _syncMetadata.get(key);
    return item?['ever_synced'] == true || getServerId(type, id) != null;
  }

  List<Map<String, dynamic>> getPendingSyncItems() {
    return _syncMetadata.values
        .where((item) => item != null && item['synced'] == false)
        .map((item) => Map<String, dynamic>.from(item!))
        .toList();
  }

  Future<void> markAsSynced(String type, String id, {String? serverId}) async {
    final key = '${type}_$id';
    final item = _syncMetadata.get(key);
    if (item != null) {
      item['synced'] = true;
      if (serverId != null) {
        item['server_id'] = serverId;
      }
      await _syncMetadata.put(key, item);
    }
  }

  // Store server ID mapping for offline-created items
  Future<void> mapLocalToServerId(String type, String localId, String serverId) async {
    final key = 'mapping_${type}_$localId';
    await _syncMetadata.put(key, {
      'local_id': localId,
      'server_id': serverId,
      'type': type,
      'created_at': DateTime.now().millisecondsSinceEpoch,
    });
  }

  String? getServerId(String type, String localId) {
    final key = 'mapping_${type}_$localId';
    final mapping = _syncMetadata.get(key);
    return mapping?['server_id'];
  }

  // Clear ID mapping
  Future<void> clearIdMapping(String type, String localId) async {
    final key = 'mapping_${type}_$localId';
    await _syncMetadata.delete(key);
  }

  // Migrate local record to server ID (atomic operation)
  Future<void> migrateLocalToServerId(String type, String localId, String serverId, dynamic serverObject) async {
    if (type == 'transaction') {
      final transaction = serverObject as Transaction;
      // Remove old local record
      await _transactions.delete(localId);
      // Add server record with server ID
      await _transactions.put(serverId, transaction.toJson());
      
    } else if (type == 'category') {
      final category = serverObject as Category;
      // Remove old local record
      await _categories.delete(localId);
      // Add server record with server ID
      await _categories.put(serverId, category.toJson());
    }

    // Migrate sync metadata to server ID
    final oldMetadataKey = '${type}_$localId';
    final newMetadataKey = '${type}_$serverId';
    final oldMetadata = _syncMetadata.get(oldMetadataKey);
    
    if (oldMetadata != null) {
      // Update metadata with server ID and mark as ever synced
      oldMetadata['id'] = serverId;
      oldMetadata['ever_synced'] = true;
      await _syncMetadata.put(newMetadataKey, oldMetadata);
      await _syncMetadata.delete(oldMetadataKey);
    }

    // Store mapping for future reference
    await mapLocalToServerId(type, localId, serverId);
    
    // Mark the migrated item as synced to avoid pending state
    await markAsSynced(type, serverId);
  }

  Future<void> clearSyncMetadata() async {
    await _syncMetadata.clear();
  }

  // Prune old sync metadata (keep only last 100 items)
  Future<void> pruneSyncMetadata() async {
    final allItems = _syncMetadata.values
        .where((item) => item?['synced'] == true)
        .toList();
    
    if (allItems.length > 100) {
      // Sort by timestamp and keep only recent 100 items
      allItems.sort((a, b) => (b?['timestamp'] ?? 0).compareTo(a?['timestamp'] ?? 0));
      
      // Remove old items beyond 100
      for (int i = 100; i < allItems.length; i++) {
        final item = allItems[i];
        if (item != null) {
          final key = '${item['type']}_${item['id']}';
          await _syncMetadata.delete(key);
        }
      }
    }
  }

  // Reconcile with server data (handle deletions safely)
  Future<void> reconcileTransactions(List<Transaction> serverTransactions) async {
    final serverIds = serverTransactions.map((t) => t.id).toSet();
    final localTransactions = getAllTransactions();
    
    // Find local transactions that no longer exist on server
    for (final localTx in localTransactions) {
      final localId = localTx.id;
      final serverId = getServerId('transaction', localId);
      
      // Check if item exists on server (either by local ID or mapped server ID)
      final existsOnServer = serverIds.contains(localId) || 
                           (serverId != null && serverIds.contains(serverId));
      
      if (!existsOnServer) {
        // Only delete if item was ever synced AND has no pending changes
        if (wasEverSynced('transaction', localId) && !hasPendingSync('transaction', localId)) {
          // Item was deleted on server and safe to remove locally
          await _transactions.delete(localId);
        }
        // Otherwise keep the local item (it may be a failed upload or new local item)
      }
    }
  }

  Future<void> reconcileCategories(List<Category> serverCategories) async {
    final serverIds = serverCategories.map((c) => c.id).toSet();
    final localCategories = getAllCategories();
    
    for (final localCat in localCategories) {
      final localId = localCat.id;
      final serverId = getServerId('category', localId);
      
      // Check if item exists on server (either by local ID or mapped server ID)
      final existsOnServer = serverIds.contains(localId) || 
                           (serverId != null && serverIds.contains(serverId));
      
      if (!existsOnServer) {
        // Only delete if item was ever synced AND has no pending changes
        if (wasEverSynced('category', localId) && !hasPendingSync('category', localId)) {
          await _categories.delete(localId);
        }
        // Otherwise keep the local item
      }
    }
  }

  // Bulk operations for server sync
  Future<void> saveTransactionsBulk(List<Transaction> transactions, {bool fromServer = false}) async {
    for (final transaction in transactions) {
      await saveTransaction(transaction, fromServer: fromServer);
      
      // Mark server data as ever synced without pending status (if no pending changes)
      if (fromServer && !hasPendingSync('transaction', transaction.id)) {
        await markEverSyncedNoPending('transaction', transaction.id);
      }
    }
  }

  Future<void> saveCategoriesBulk(List<Category> categories, {bool fromServer = false}) async {
    for (final category in categories) {
      await saveCategory(category, fromServer: fromServer);
      
      // Mark server data as ever synced without pending status (if no pending changes)
      if (fromServer && !hasPendingSync('category', category.id)) {
        await markEverSyncedNoPending('category', category.id);
      }
    }
  }

  // Last sync timestamp
  DateTime? get lastSyncTime {
    final timestamp = _syncMetadata.get('last_sync_time')?['timestamp'];
    return timestamp != null 
        ? DateTime.fromMillisecondsSinceEpoch(timestamp) 
        : null;
  }

  Future<void> updateLastSyncTime() async {
    await _syncMetadata.put('last_sync_time', {
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });
  }

  // Cleanup and maintenance
  Future<void> close() async {
    await _transactions.close();
    await _categories.close();
    await _syncMetadata.close();
  }

  Future<void> clear() async {
    await _transactions.clear();
    await _categories.clear();
    await _syncMetadata.clear();
  }
}