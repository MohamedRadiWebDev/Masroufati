import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../models/transaction.dart';
import '../providers/offline_providers.dart';
import '../widgets/transaction_item.dart';
import '../widgets/add_transaction_modal.dart';
import '../widgets/transaction_filters.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../utils/text_direction_helper.dart';

class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  String _searchText = '';
  String _selectedCategory = 'all';
  TransactionType? _selectedType;
  String _dateFilter = 'all';
  bool _showFilters = false;

  @override
  Widget build(BuildContext context) {
    final transactions = ref.watch(localTransactionsProvider);
    final filteredTransactions = _filterTransactions(transactions);
    
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text(
          'جميع العمليات',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => setState(() => _showFilters = !_showFilters),
            icon: Icon(
              _showFilters ? LucideIcons.x : LucideIcons.filter,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          IconButton(
            onPressed: _showAddTransactionModal,
            icon: Icon(
              LucideIcons.plus,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              textDirection: TextDirectionHelper.rtl,
              onChanged: (value) => setState(() => _searchText = value),
              decoration: InputDecoration(
                hintText: 'البحث في العمليات...',
                hintTextDirection: TextDirectionHelper.rtl,
                prefixIcon: const Icon(LucideIcons.search),
                filled: true,
                fillColor: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),

          // Filters Panel
          if (_showFilters)
            TransactionFilters(
              selectedCategory: _selectedCategory,
              selectedType: _selectedType,
              dateFilter: _dateFilter,
              onCategoryChanged: (category) => setState(() => _selectedCategory = category),
              onTypeChanged: (type) => setState(() => _selectedType = type),
              onDateFilterChanged: (filter) => setState(() => _dateFilter = filter),
            ),

          // Transactions List
          Expanded(
            child: transactions.isEmpty
                ? _buildEmptyState()
                : filteredTransactions.isEmpty
                    ? _buildNoResultsState()
                    : _buildTransactionsList(filteredTransactions),
          ),
        ],
      ),
    );
  }

  List<Transaction> _filterTransactions(List<Transaction> transactions) {
    return transactions.where((transaction) {
      // Search filter
      if (_searchText.isNotEmpty) {
        final searchLower = _searchText.toLowerCase();
        if (!transaction.category.toLowerCase().contains(searchLower) &&
            !(transaction.note?.toLowerCase().contains(searchLower) ?? false)) {
          return false;
        }
      }

      // Category filter
      if (_selectedCategory != 'all' && transaction.category != _selectedCategory) {
        return false;
      }

      // Type filter
      if (_selectedType != null && transaction.type != _selectedType) {
        return false;
      }

      // Date filter
      if (!_isDateInRange(transaction.date, _dateFilter)) {
        return false;
      }

      return true;
    }).toList()
      ..sort((a, b) => b.date.compareTo(a.date)); // Sort by date descending
  }

  bool _isDateInRange(DateTime date, String range) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final transactionDate = DateTime(date.year, date.month, date.day);

    switch (range) {
      case 'today':
        return transactionDate.isAtSameMomentAs(today);
      case 'yesterday':
        final yesterday = today.subtract(const Duration(days: 1));
        return transactionDate.isAtSameMomentAs(yesterday);
      case 'this_week':
        final weekStart = today.subtract(Duration(days: today.weekday - 1));
        return transactionDate.isAfter(weekStart.subtract(const Duration(days: 1)));
      case 'this_month':
        final monthStart = DateTime(today.year, today.month, 1);
        return transactionDate.isAfter(monthStart.subtract(const Duration(days: 1)));
      case 'last_month':
        final lastMonthStart = DateTime(today.year, today.month - 1, 1);
        final lastMonthEnd = DateTime(today.year, today.month, 1).subtract(const Duration(days: 1));
        return transactionDate.isAfter(lastMonthStart.subtract(const Duration(days: 1))) &&
               transactionDate.isBefore(lastMonthEnd.add(const Duration(days: 1)));
      default:
        return true;
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
                borderRadius: BorderRadius.circular(60),
              ),
              child: Icon(
                LucideIcons.receipt,
                size: 48,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'لا توجد عمليات مسجلة',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.onSurface,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 8),
            Text(
              'ابدأ بإضافة أول عملية مالية لك',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textDirection: TextDirectionHelper.rtl,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _showAddTransactionModal,
              icon: const Icon(LucideIcons.plus),
              label: const Text('إضافة عملية جديدة'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoResultsState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              LucideIcons.search_x,
              size: 64,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              'لا توجد نتائج',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.onSurface,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 8),
            Text(
              'جرب تغيير معايير البحث أو المرشحات',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textDirection: TextDirectionHelper.rtl,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => setState(() {
                _searchText = '';
                _selectedCategory = 'all';
                _selectedType = null;
                _dateFilter = 'all';
              }),
              child: const Text('مسح جميع المرشحات'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionsList(List<Transaction> transactions) {
    // Group transactions by date for better organization
    final groupedTransactions = <String, List<Transaction>>{};
    final dateFormatter = DateFormat('yyyy-MM-dd');
    
    for (final transaction in transactions) {
      final dateKey = dateFormatter.format(transaction.date);
      groupedTransactions[dateKey] ??= [];
      groupedTransactions[dateKey]!.add(transaction);
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: groupedTransactions.length,
      itemBuilder: (context, index) {
        final dateKey = groupedTransactions.keys.toList()[index];
        final transactionsForDate = groupedTransactions[dateKey]!;
        final date = DateTime.parse(dateKey);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date Header
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12.0),
              child: Text(
                _formatDateHeader(date),
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
                textDirection: TextDirectionHelper.rtl,
              ),
            ),

            // Transactions for this date
            ...transactionsForDate.map((transaction) => Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: TransactionItem(transaction: transaction),
            )),

            const SizedBox(height: 8),
          ],
        );
      },
    );
  }

  String _formatDateHeader(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final transactionDate = DateTime(date.year, date.month, date.day);

    if (transactionDate.isAtSameMomentAs(today)) {
      return 'اليوم';
    } else if (transactionDate.isAtSameMomentAs(yesterday)) {
      return 'أمس';
    } else {
      return DateFormat('EEEE، d MMMM yyyy', 'ar').format(date);
    }
  }

  void _showAddTransactionModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const AddTransactionModal(),
    );
  }
}