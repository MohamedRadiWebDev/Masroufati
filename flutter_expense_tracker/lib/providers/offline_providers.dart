import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../models/transaction.dart';
import '../models/category.dart';
import '../services/local_storage.dart';
import 'sync_providers.dart';

// Local transactions provider with real-time updates
final localTransactionsProvider = StateNotifierProvider<LocalTransactionsNotifier, List<Transaction>>((ref) {
  final localStorage = ref.watch(localStorageProvider);
  return LocalTransactionsNotifier(localStorage);
});

// Local categories provider with real-time updates  
final localCategoriesProvider = StateNotifierProvider<LocalCategoriesNotifier, List<Category>>((ref) {
  final localStorage = ref.watch(localStorageProvider);
  return LocalCategoriesNotifier(localStorage);
});

// Offline-first transaction operations
final transactionRepositoryProvider = Provider<TransactionRepository>((ref) {
  final localStorage = ref.watch(localStorageProvider);
  return TransactionRepository(localStorage, ref);
});

// Offline-first category operations
final categoryRepositoryProvider = Provider<CategoryRepository>((ref) {
  final localStorage = ref.watch(localStorageProvider);
  return CategoryRepository(localStorage, ref);
});

class LocalTransactionsNotifier extends StateNotifier<List<Transaction>> {
  final LocalStorage _localStorage;

  LocalTransactionsNotifier(this._localStorage) : super([]) {
    _loadTransactions();
  }

  void _loadTransactions() {
    state = _localStorage.getAllTransactions();
  }

  void refresh() {
    _loadTransactions();
  }
}

class LocalCategoriesNotifier extends StateNotifier<List<Category>> {
  final LocalStorage _localStorage;

  LocalCategoriesNotifier(this._localStorage) : super([]) {
    _loadCategories();
  }

  void _loadCategories() {
    state = _localStorage.getAllCategories();
  }

  void refresh() {
    _loadCategories();
  }
}

class TransactionRepository {
  final LocalStorage _localStorage;
  final Ref _ref;

  TransactionRepository(this._localStorage, this._ref);

  // Create transaction (offline-first)
  Future<void> createTransaction(CreateTransactionRequest request) async {
    const uuid = Uuid();
    final transaction = Transaction(
      id: uuid.v4(), // Use UUID for consistent server-client IDs
      type: request.type,
      amount: request.amount,
      category: request.category,
      note: request.note,
      date: request.date ?? DateTime.now(),
      receiptImage: request.receiptImage,
      createdAt: DateTime.now(),
    );

    await _localStorage.saveTransaction(transaction);
    // Mark as create action for new items
    await _localStorage.markCreateForSync('transaction', transaction.id);
    _ref.read(localTransactionsProvider.notifier).refresh();
  }

  // Update transaction (offline-first)
  Future<void> updateTransaction(Transaction transaction) async {
    await _localStorage.saveTransaction(transaction);
    await _localStorage.markUpdateForSync('transaction', transaction.id);
    _ref.read(localTransactionsProvider.notifier).refresh();
  }

  // Delete transaction (offline-first)
  Future<void> deleteTransaction(String id) async {
    await _localStorage.deleteTransaction(id);
    _ref.read(localTransactionsProvider.notifier).refresh();
  }

  // Get all transactions (from local storage)
  List<Transaction> getAllTransactions() {
    return _localStorage.getAllTransactions();
  }

  // Get transaction by ID
  Transaction? getTransaction(String id) {
    return _localStorage.getTransaction(id);
  }

  // Get transactions by category
  List<Transaction> getTransactionsByCategory(String category) {
    return _localStorage.getAllTransactions()
        .where((t) => t.category == category)
        .toList();
  }

  // Get transactions by date range
  List<Transaction> getTransactionsByDateRange(DateTime start, DateTime end) {
    return _localStorage.getAllTransactions()
        .where((t) => t.date.isAfter(start) && t.date.isBefore(end))
        .toList();
  }

  // Get transactions by type
  List<Transaction> getTransactionsByType(TransactionType type) {
    return _localStorage.getAllTransactions()
        .where((t) => t.type == type)
        .toList();
  }
}

class CategoryRepository {
  final LocalStorage _localStorage;
  final Ref _ref;

  CategoryRepository(this._localStorage, this._ref);

  // Create category (offline-first)
  Future<void> createCategory(CreateCategoryRequest request) async {
    const uuid = Uuid();
    final category = Category(
      id: uuid.v4(), // Use UUID for consistent server-client IDs
      name: request.name,
      color: request.color,
      icon: request.icon,
      createdAt: DateTime.now(),
    );

    await _localStorage.saveCategory(category);
    // Mark as create action for new items
    await _localStorage.markCreateForSync('category', category.id);
    _ref.read(localCategoriesProvider.notifier).refresh();
  }

  // Update category (offline-first)
  Future<void> updateCategory(Category category) async {
    await _localStorage.saveCategory(category);
    await _localStorage.markUpdateForSync('category', category.id);
    _ref.read(localCategoriesProvider.notifier).refresh();
  }

  // Delete category (offline-first)
  Future<void> deleteCategory(String id) async {
    await _localStorage.deleteCategory(id);
    _ref.read(localCategoriesProvider.notifier).refresh();
  }

  // Get all categories (from local storage)
  List<Category> getAllCategories() {
    return _localStorage.getAllCategories();
  }

  // Get category by ID
  Category? getCategory(String id) {
    return _localStorage.getCategory(id);
  }

  // Get category by name
  Category? getCategoryByName(String name) {
    return _localStorage.getAllCategories()
        .where((c) => c.name.toLowerCase() == name.toLowerCase())
        .firstOrNull;
  }
}