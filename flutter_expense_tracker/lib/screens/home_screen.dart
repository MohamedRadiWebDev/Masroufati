import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:intl/intl.dart';
import '../models/transaction.dart';
import '../models/category.dart';
import '../providers/offline_providers.dart';
import '../widgets/add_transaction_modal.dart';
import '../widgets/voice_input_modal.dart';
import '../widgets/file_import_modal.dart';
import '../utils/category_icons.dart';
import '../utils/text_direction_helper.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _searchText = '';
  String _selectedCategory = 'all';
  String _selectedType = 'all';
  String _selectedDateFilter = 'all';
  bool _showFilters = false;
  bool _showAllTransactions = false;

  void _clearFilters() {
    setState(() {
      _searchText = '';
      _selectedCategory = 'all';
      _selectedType = 'all';
      _selectedDateFilter = 'all';
      _showFilters = false;
    });
  }

  bool get _hasActiveFilters =>
      _searchText.isNotEmpty ||
      _selectedCategory != 'all' ||
      _selectedType != 'all' ||
      _selectedDateFilter != 'all';

  bool _isDateInRange(DateTime date, String range) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    switch (range) {
      case 'today':
        final transactionDate = DateTime(date.year, date.month, date.day);
        return transactionDate.isAtSameMomentAs(today);
      case 'week':
        final weekAgo = today.subtract(const Duration(days: 7));
        return date.isAfter(weekAgo) && date.isBefore(now.add(const Duration(days: 1)));
      case 'month':
        final monthAgo = today.subtract(const Duration(days: 30));
        return date.isAfter(monthAgo) && date.isBefore(now.add(const Duration(days: 1)));
      default:
        return true;
    }
  }

  List<Transaction> _getFilteredTransactions(List<Transaction> transactions) {
    List<Transaction> filtered = transactions;

    // Apply search filter
    if (_searchText.trim().isNotEmpty) {
      filtered = filtered.where((transaction) {
        return (transaction.note?.toLowerCase().contains(_searchText.toLowerCase()) ?? false) ||
            transaction.category.toLowerCase().contains(_searchText.toLowerCase());
      }).toList();
    }

    // Apply category filter
    if (_selectedCategory != 'all') {
      filtered = filtered.where((transaction) => transaction.category == _selectedCategory).toList();
    }

    // Apply type filter
    if (_selectedType != 'all') {
      final type = _selectedType == 'income' ? TransactionType.income : TransactionType.expense;
      filtered = filtered.where((transaction) => transaction.type == type).toList();
    }

    // Apply date filter
    if (_selectedDateFilter != 'all') {
      filtered = filtered.where((transaction) => _isDateInRange(transaction.date, _selectedDateFilter)).toList();
    }

    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    final transactions = ref.watch(localTransactionsProvider);
    final categories = ref.watch(localCategoriesProvider);

    final filteredTransactions = _getFilteredTransactions(transactions);
    final displayTransactions = _hasActiveFilters
        ? filteredTransactions
        : _showAllTransactions
            ? transactions
            : transactions.take(5).toList();

    // Calculate balance
    final totalIncome = transactions
        .where((t) => t.type == TransactionType.income)
        .fold(0.0, (sum, t) => sum + t.amount);
    final totalExpenses = transactions
        .where((t) => t.type == TransactionType.expense)
        .fold(0.0, (sum, t) => sum + t.amount);
    final balance = totalIncome - totalExpenses;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Header
          SliverAppBar(
            title: const Text(
              'إدارة المصاريف',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            backgroundColor: Colors.transparent,
            elevation: 0,
            floating: true,
            snap: true,
            actions: [
              IconButton(
                onPressed: _showSettingsModal,
                icon: const Icon(LucideIcons.settings),
              ),
            ],
          ),

          SliverToBoxAdapter(
            child: Column(
              children: [
                // Balance Card
                Container(
                  margin: const EdgeInsets.all(16),
                  child: _buildBalanceCard(balance, totalIncome, totalExpenses),
                ),

                // Quick Actions
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  child: _buildQuickActions(),
                ),

                const SizedBox(height: 16),

                // Search and Filter Section
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  child: _buildSearchAndFilters(categories),
                ),

                const SizedBox(height: 16),

                // Recent Transactions Header
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Text(
                        _hasActiveFilters ? 'نتائج البحث' : 'العمليات الحديثة',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        textDirection: TextDirectionHelper.rtl,
                      ),
                      const Spacer(),
                      if (!_hasActiveFilters && transactions.length > 5)
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _showAllTransactions = !_showAllTransactions;
                            });
                          },
                          child: Text(
                            _showAllTransactions ? 'عرض أقل' : 'عرض الكل',
                            textDirection: TextDirectionHelper.rtl,
                          ),
                        ),
                    ],
                  ),
                ),

                const SizedBox(height: 8),
              ],
            ),
          ),

          // Transactions List
          if (displayTransactions.isEmpty)
            SliverFillRemaining(
              child: _buildEmptyState(),
            )
          else
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final transaction = displayTransactions[index];
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: _buildTransactionItem(transaction, categories),
                  );
                },
                childCount: displayTransactions.length,
              ),
            ),

          // Bottom padding for navigation
          const SliverToBoxAdapter(
            child: SizedBox(height: 100),
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceCard(double balance, double totalIncome, double totalExpenses) {
    return Card(
      elevation: 4,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [
              Theme.of(context).primaryColor,
              Theme.of(context).primaryColor.withOpacity(0.8),
            ],
          ),
        ),
        child: Column(
          children: [
            Text(
              'الرصيد الحالي',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 8),
            Text(
              '${balance.toStringAsFixed(2)} ج.م',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      const Icon(
                        LucideIcons.trending_up,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'الدخل',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                        textDirection: TextDirectionHelper.rtl,
                      ),
                      Text(
                        '${totalIncome.toStringAsFixed(2)} ج.م',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                        textDirection: TextDirectionHelper.rtl,
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 1,
                  height: 40,
                  color: Colors.white30,
                ),
                Expanded(
                  child: Column(
                    children: [
                      const Icon(
                        LucideIcons.trending_down,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'المصروفات',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                        textDirection: TextDirectionHelper.rtl,
                      ),
                      Text(
                        '${totalExpenses.toStringAsFixed(2)} ج.م',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                        textDirection: TextDirectionHelper.rtl,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _showAddTransactionModal(TransactionType.expense),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.error,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: const Icon(LucideIcons.minus, size: 18),
                label: const Text('إضافة مصروف'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _showAddTransactionModal(TransactionType.income),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: const Icon(LucideIcons.plus, size: 18),
                label: const Text('إضافة دخل'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _showFileImportModal,
            icon: const Icon(LucideIcons.upload, size: 18),
            label: const Text('استيراد من ملف CSV'),
          ),
        ),
      ],
    );
  }

  Widget _buildSearchAndFilters(List<Category> categories) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'البحث في الوصف...',
                  hintTextDirection: TextDirectionHelper.rtl,
                  prefixIcon: const Icon(LucideIcons.search),
                  filled: true,
                  fillColor: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                ),
                textDirection: TextDirectionHelper.rtl,
                onChanged: (value) {
                  setState(() {
                    _searchText = value;
                  });
                },
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: () {
                setState(() {
                  _showFilters = !_showFilters;
                });
              },
              icon: Icon(
                LucideIcons.settings,
                color: _showFilters ? Theme.of(context).primaryColor : null,
              ),
            ),
            if (_hasActiveFilters)
              IconButton(
                onPressed: _clearFilters,
                icon: const Icon(LucideIcons.x),
              ),
          ],
        ),

        if (_showFilters) ...[
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedCategory,
                  decoration: InputDecoration(
                    labelText: 'التصنيف',
                    filled: true,
                    fillColor: Theme.of(context).colorScheme.surface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  items: [
                    const DropdownMenuItem(value: 'all', child: Text('جميع التصنيفات')),
                    ...categories.map((category) => DropdownMenuItem(
                      value: category.name,
                      child: Text(category.name, textDirection: TextDirectionHelper.rtl),
                    )),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedCategory = value!;
                    });
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedType,
                  decoration: InputDecoration(
                    labelText: 'النوع',
                    filled: true,
                    fillColor: Theme.of(context).colorScheme.surface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('جميع الأنواع')),
                    DropdownMenuItem(value: 'income', child: Text('دخل')),
                    DropdownMenuItem(value: 'expense', child: Text('مصروف')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedType = value!;
                    });
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _selectedDateFilter,
            decoration: InputDecoration(
              labelText: 'الفترة الزمنية',
              filled: true,
              fillColor: Theme.of(context).colorScheme.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
            ),
            items: const [
              DropdownMenuItem(value: 'all', child: Text('جميع الفترات')),
              DropdownMenuItem(value: 'today', child: Text('اليوم')),
              DropdownMenuItem(value: 'week', child: Text('الأسبوع الماضي')),
              DropdownMenuItem(value: 'month', child: Text('الشهر الماضي')),
            ],
            onChanged: (value) {
              setState(() {
                _selectedDateFilter = value!;
              });
            },
          ),
        ],
      ],
    );
  }

  Widget _buildTransactionItem(Transaction transaction, List<Category> categories) {
    final category = categories.firstWhere(
      (c) => c.name == transaction.category,
      orElse: () => Category(
        id: 'other',
        name: 'أخرى',
        nameAr: 'أخرى',
        icon: 'more-horizontal',
        color: '#6B7280',
        type: TransactionType.expense,
      ),
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Color(int.parse(category.color.replaceFirst('#', '0xFF'))).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            CategoryIcons.getIcon(category.icon),
            color: Color(int.parse(category.color.replaceFirst('#', '0xFF'))),
            size: 20,
          ),
        ),
        title: Text(
          transaction.category,
          style: const TextStyle(fontWeight: FontWeight.w600),
          textDirection: TextDirectionHelper.rtl,
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (transaction.note != null)
              Text(
                transaction.note!,
                textDirection: TextDirectionHelper.rtl,
                style: const TextStyle(fontSize: 12),
              ),
            Text(
              DateFormat('dd/MM/yyyy').format(transaction.date),
              style: TextStyle(
                fontSize: 11,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${transaction.type == TransactionType.income ? '+' : '-'}${transaction.amount.toStringAsFixed(2)} ج.م',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: transaction.type == TransactionType.income
                    ? Colors.green
                    : Theme.of(context).colorScheme.error,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            Icon(
              transaction.type == TransactionType.income
                  ? LucideIcons.trending_up
                  : LucideIcons.trending_down,
              size: 14,
              color: transaction.type == TransactionType.income
                  ? Colors.green
                  : Theme.of(context).colorScheme.error,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            LucideIcons.receipt,
            size: 64,
            color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            _hasActiveFilters ? 'لا توجد نتائج للبحث' : 'لا توجد عمليات حتى الآن',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            textDirection: TextDirectionHelper.rtl,
          ),
          const SizedBox(height: 8),
          Text(
            _hasActiveFilters ? 'جرب تعديل معايير البحث' : 'ابدأ بإضافة أول عملية مالية',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            textDirection: TextDirectionHelper.rtl,
          ),
          if (!_hasActiveFilters) ...[
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _showAddTransactionModal(TransactionType.expense),
              icon: const Icon(LucideIcons.plus),
              label: const Text('إضافة عملية جديدة'),
            ),
          ],
        ],
      ),
    );
  }

  void _showAddTransactionModal(TransactionType type) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AddTransactionModal(initialType: type),
    );
  }

  void _showFileImportModal() {
    final categories = ref.read(localCategoriesProvider);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => FileImportModal(),
      ),
    );
  }

  void _showSettingsModal() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('الإعدادات', textDirection: TextDirectionHelper.rtl),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(LucideIcons.palette),
              title: Text('تخصيص الألوان', textDirection: TextDirectionHelper.rtl),
            ),
            ListTile(
              leading: Icon(LucideIcons.bell),
              title: Text('الإشعارات', textDirection: TextDirectionHelper.rtl),
            ),
            ListTile(
              leading: Icon(LucideIcons.download),
              title: Text('النسخ الاحتياطي', textDirection: TextDirectionHelper.rtl),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('إغلاق'),
          ),
        ],
      ),
    );
  }
}