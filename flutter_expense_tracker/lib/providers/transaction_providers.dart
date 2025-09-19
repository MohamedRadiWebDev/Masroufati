import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/transaction.dart';
import '../models/category.dart';
import '../services/api_client.dart';
import 'api_providers.dart';

// Transactions list provider
final transactionsProvider = FutureProvider<List<Transaction>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  return await apiClient.getTransactions();
});

// Categories list provider
final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  return await apiClient.getCategories();
});

// Income categories provider
final incomeCategoriesProvider = FutureProvider<List<Category>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  return await apiClient.getCategories(type: 'income');
});

// Expense categories provider
final expenseCategoriesProvider = FutureProvider<List<Category>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  return await apiClient.getCategories(type: 'expense');
});

// Transaction state notifier for managing transaction operations
class TransactionNotifier extends StateNotifier<AsyncValue<List<Transaction>>> {
  TransactionNotifier(this.apiClient) : super(const AsyncValue.loading());

  final ApiClient apiClient;

  Future<void> loadTransactions({
    int? page,
    int? limit,
    String? type,
    String? category,
  }) async {
    state = const AsyncValue.loading();
    try {
      final transactions = await apiClient.getTransactions(
        page: page,
        limit: limit,
        type: type,
        category: category,
      );
      state = AsyncValue.data(transactions);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> createTransaction(CreateTransactionRequest request) async {
    try {
      final newTransaction = await apiClient.createTransaction(request);
      
      // Add the new transaction to the current state if it exists
      state.whenData((transactions) {
        state = AsyncValue.data([newTransaction, ...transactions]);
      });
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> updateTransaction(String id, CreateTransactionRequest request) async {
    try {
      final updatedTransaction = await apiClient.updateTransaction(id, request);
      
      // Update the transaction in the current state
      state.whenData((transactions) {
        final updatedList = transactions.map((t) => 
          t.id == id ? updatedTransaction : t
        ).toList();
        state = AsyncValue.data(updatedList);
      });
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> deleteTransaction(String id) async {
    try {
      await apiClient.deleteTransaction(id);
      
      // Remove the transaction from the current state
      state.whenData((transactions) {
        final updatedList = transactions.where((t) => t.id != id).toList();
        state = AsyncValue.data(updatedList);
      });
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

// Transaction state notifier provider
final transactionNotifierProvider = StateNotifierProvider<TransactionNotifier, AsyncValue<List<Transaction>>>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return TransactionNotifier(apiClient);
});