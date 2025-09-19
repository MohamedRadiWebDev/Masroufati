
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../utils/text_direction_helper.dart';
import '../models/transaction.dart';
import '../models/category.dart';
import '../providers/offline_providers.dart';
import '../utils/category_icons.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen>
    with SingleTickerProviderStateMixin {
  
  late TabController _tabController;
  String _selectedPeriod = 'month'; // month, year, all
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final transactions = ref.watch(localTransactionsProvider);
    final categories = ref.watch(localCategoriesProvider);
    
    final filteredTransactions = _filterTransactionsByPeriod(transactions);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'التحليلات المتقدمة',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _showPeriodSelector,
            icon: const Icon(LucideIcons.calendar),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'نظرة عامة', icon: Icon(LucideIcons.chartPie, size: 16)),
            Tab(text: 'الاتجاهات', icon: Icon(LucideIcons.trending_up, size: 16)),
            Tab(text: 'المقارنات', icon: Icon(LucideIcons.chartBar, size: 16)),
          ],
        ),
      ),
      body: Column(
        children: [
          // Period selector
          _buildPeriodHeader(),
          
          // Tab content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(filteredTransactions, categories),
                _buildTrendsTab(transactions, categories),
                _buildComparisonsTab(transactions, categories),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
      ),
      child: Row(
        children: [
          Icon(
            LucideIcons.calendar,
            size: 16,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(width: 8),
          Text(
            _getPeriodText(),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.primary,
            ),
            textDirection: TextDirectionHelper.rtl,
          ),
          const Spacer(),
          IconButton(
            onPressed: _showPeriodSelector,
            icon: Icon(
              LucideIcons.chevronDown,
              size: 16,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewTab(List<Transaction> transactions, List<Category> categories) {
    final totalIncome = transactions
        .where((t) => t.type == TransactionType.income)
        .fold(0.0, (sum, t) => sum + t.amount);
    
    final totalExpense = transactions
        .where((t) => t.type == TransactionType.expense)
        .fold(0.0, (sum, t) => sum + t.amount);
    
    final balance = totalIncome - totalExpense;
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Summary cards
          _buildSummaryCards(totalIncome, totalExpense, balance),
          
          const SizedBox(height: 24),
          
          // Expense breakdown pie chart
          if (transactions.where((t) => t.type == TransactionType.expense).isNotEmpty)
            _buildExpenseBreakdownChart(transactions, categories),
          
          const SizedBox(height: 24),
          
          // Top categories
          _buildTopCategoriesSection(transactions, categories),
        ],
      ),
    );
  }

  Widget _buildTrendsTab(List<Transaction> transactions, List<Category> categories) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Monthly trend line chart
          _buildMonthlyTrendChart(transactions),
          
          const SizedBox(height: 24),
          
          // Weekly spending pattern
          _buildWeeklyPatternChart(transactions),
          
          const SizedBox(height: 24),
          
          // Category trends
          _buildCategoryTrendsSection(transactions, categories),
        ],
      ),
    );
  }

  Widget _buildComparisonsTab(List<Transaction> transactions, List<Category> categories) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Income vs Expenses comparison
          _buildIncomeExpenseComparison(transactions),
          
          const SizedBox(height: 24),
          
          // Category comparison
          _buildCategoryComparison(transactions, categories),
          
          const SizedBox(height: 24),
          
          // Period comparison
          _buildPeriodComparison(transactions),
        ],
      ),
    );
  }

  Widget _buildSummaryCards(double totalIncome, double totalExpense, double balance) {
    return Row(
      children: [
        Expanded(
          child: _buildSummaryCard(
            'إجمالي الدخل',
            totalIncome,
            LucideIcons.trendingUp,
            Theme.of(context).colorScheme.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildSummaryCard(
            'إجمالي المصروفات',
            totalExpense,
            LucideIcons.trendingDown,
            Theme.of(context).colorScheme.error,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildSummaryCard(
            'الرصيد',
            balance,
            balance >= 0 ? LucideIcons.plus : LucideIcons.minus,
            balance >= 0 ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.error,
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard(String title, double amount, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            title,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            textDirection: TextDirectionHelper.rtl,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            '${amount.toStringAsFixed(2)} ج.م',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
            textDirection: TextDirectionHelper.rtl,
          ),
        ],
      ),
    );
  }

  Widget _buildExpenseBreakdownChart(List<Transaction> transactions, List<Category> categories) {
    final expenseTransactions = transactions.where((t) => t.type == TransactionType.expense).toList();
    
    if (expenseTransactions.isEmpty) {
      return _buildEmptyChart('لا توجد مصروفات لعرضها');
    }

    // Group by category
    final Map<String, double> categoryTotals = {};
    final Map<String, Color> categoryColors = {};
    
    for (final transaction in expenseTransactions) {
      categoryTotals[transaction.category] = 
          (categoryTotals[transaction.category] ?? 0) + transaction.amount;
      
      final category = categories.firstWhere(
        (c) => c.name == transaction.category,
        orElse: () => Category(
          id: 'default',
          name: transaction.category,
          nameAr: transaction.category,
          color: '#6B7280',
          icon: 'circle',
          type: TransactionType.expense,
          createdAt: DateTime.now(),
        ),
      );
      categoryColors[transaction.category] = Color(
        int.parse(category.color.replaceFirst('#', '0xFF')),
      );
    }

    final total = categoryTotals.values.fold(0.0, (sum, amount) => sum + amount);
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'توزيع المصروفات',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),
            
            SizedBox(
              height: 250,
              child: PieChart(
                PieChartData(
                  sections: categoryTotals.entries.map((entry) {
                    final percentage = (entry.value / total) * 100;
                    return PieChartSectionData(
                      value: entry.value,
                      title: '${percentage.toStringAsFixed(1)}%',
                      color: categoryColors[entry.key],
                      radius: 100,
                      titleStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    );
                  }).toList(),
                  sectionsSpace: 2,
                  centerSpaceRadius: 40,
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Legend
            Wrap(
              children: categoryTotals.entries.map((entry) {
                final category = categories.firstWhere(
                  (c) => c.name == entry.key,
                  orElse: () => Category(
                    id: 'default',
                    name: entry.key,
                    nameAr: entry.key,
                    color: '#6B7280',
                    icon: 'circle',
                    type: TransactionType.expense,
                    createdAt: DateTime.now(),
                  ),
                );
                
                return Container(
                  margin: const EdgeInsets.only(left: 8, bottom: 8),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: categoryColors[entry.key],
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        CategoryIcons.getIcon(category.icon),
                        size: 16,
                        color: categoryColors[entry.key],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        entry.key,
                        style: Theme.of(context).textTheme.bodySmall,
                        textDirection: TextDirectionHelper.rtl,
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMonthlyTrendChart(List<Transaction> transactions) {
    final now = DateTime.now();
    final months = <DateTime>[];
    final incomeData = <FlSpot>[];
    final expenseData = <FlSpot>[];
    
    // Get last 12 months
    for (int i = 11; i >= 0; i--) {
      final month = DateTime(now.year, now.month - i, 1);
      months.add(month);
    }
    
    // Calculate monthly totals
    for (int i = 0; i < months.length; i++) {
      final month = months[i];
      final monthTransactions = transactions.where((t) =>
          t.date.year == month.year && t.date.month == month.month).toList();
      
      final monthlyIncome = monthTransactions
          .where((t) => t.type == TransactionType.income)
          .fold(0.0, (sum, t) => sum + t.amount);
      
      final monthlyExpense = monthTransactions
          .where((t) => t.type == TransactionType.expense)
          .fold(0.0, (sum, t) => sum + t.amount);
      
      incomeData.add(FlSpot(i.toDouble(), monthlyIncome));
      expenseData.add(FlSpot(i.toDouble(), monthlyExpense));
    }
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'الاتجاه الشهري',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),
            
            SizedBox(
              height: 250,
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: true),
                  titlesData: FlTitlesData(
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          if (value.toInt() >= 0 && value.toInt() < months.length) {
                            final month = months[value.toInt()];
                            return Text(
                              DateFormat('MMM', 'ar').format(month),
                              style: const TextStyle(fontSize: 10),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            '${value.toInt()}',
                            style: const TextStyle(fontSize: 10),
                          );
                        },
                      ),
                    ),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: true),
                  lineBarsData: [
                    LineChartBarData(
                      spots: incomeData,
                      color: Theme.of(context).colorScheme.primary,
                      barWidth: 3,
                      dotData: const FlDotData(show: true),
                    ),
                    LineChartBarData(
                      spots: expenseData,
                      color: Theme.of(context).colorScheme.error,
                      barWidth: 3,
                      dotData: const FlDotData(show: true),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Legend
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 4),
                    Text('الدخل', textDirection: TextDirectionHelper.rtl),
                  ],
                ),
                const SizedBox(width: 16),
                Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      color: Theme.of(context).colorScheme.error,
                    ),
                    const SizedBox(width: 4),
                    Text('المصروفات', textDirection: TextDirectionHelper.rtl),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopCategoriesSection(List<Transaction> transactions, List<Category> categories) {
    final expenseTransactions = transactions.where((t) => t.type == TransactionType.expense).toList();
    
    if (expenseTransactions.isEmpty) {
      return _buildEmptyChart('لا توجد مصروفات لعرضها');
    }

    // Group and sort by total amount
    final Map<String, double> categoryTotals = {};
    for (final transaction in expenseTransactions) {
      categoryTotals[transaction.category] = 
          (categoryTotals[transaction.category] ?? 0) + transaction.amount;
    }
    
    final sortedCategories = categoryTotals.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    
    final topCategories = sortedCategories.take(5).toList();
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'أعلى التصنيفات إنفاقاً',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),
            
            ...topCategories.asMap().entries.map((entry) {
              final index = entry.key;
              final categoryEntry = entry.value;
              final category = categories.firstWhere(
                (c) => c.name == categoryEntry.key,
                orElse: () => Category(
                  id: 'default',
                  name: categoryEntry.key,
                  nameAr: categoryEntry.key,
                  color: '#6B7280',
                  icon: 'circle',
                  type: TransactionType.expense,
                  createdAt: DateTime.now(),
                ),
              );
              
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: Color(int.parse(category.color.replaceFirst('#', '0xFF'))),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Center(
                        child: Text(
                          '${index + 1}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(
                      CategoryIcons.getIcon(category.icon),
                      color: Color(int.parse(category.color.replaceFirst('#', '0xFF'))),
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        categoryEntry.key,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                        textDirection: TextDirectionHelper.rtl,
                      ),
                    ),
                    Text(
                      '${categoryEntry.value.toStringAsFixed(2)} ج.م',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      textDirection: TextDirectionHelper.rtl,
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildWeeklyPatternChart(List<Transaction> transactions) {
    final weeklyData = <int, double>{};
    
    // Initialize week days (0 = Sunday, 6 = Saturday)
    for (int i = 0; i < 7; i++) {
      weeklyData[i] = 0.0;
    }
    
    // Calculate spending by day of week
    for (final transaction in transactions) {
      if (transaction.type == TransactionType.expense) {
        final dayOfWeek = transaction.date.weekday % 7; // Convert to 0-6
        weeklyData[dayOfWeek] = weeklyData[dayOfWeek]! + transaction.amount;
      }
    }
    
    final dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'نمط الإنفاق الأسبوعي',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),
            
            SizedBox(
              height: 250,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  barGroups: weeklyData.entries.map((entry) {
                    return BarChartGroupData(
                      x: entry.key,
                      barRods: [
                        BarChartRodData(
                          toY: entry.value,
                          color: Theme.of(context).colorScheme.primary,
                          width: 20,
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                        ),
                      ],
                    );
                  }).toList(),
                  titlesData: FlTitlesData(
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          if (value.toInt() >= 0 && value.toInt() < dayNames.length) {
                            return Text(
                              dayNames[value.toInt()],
                              style: const TextStyle(fontSize: 10),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            '${value.toInt()}',
                            style: const TextStyle(fontSize: 10),
                          );
                        },
                      ),
                    ),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  gridData: const FlGridData(show: true),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryTrendsSection(List<Transaction> transactions, List<Category> categories) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'اتجاهات التصنيفات',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),
            Text(
              'قريباً: رسوم بيانية تفاعلية لاتجاهات التصنيفات عبر الزمن',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontStyle: FontStyle.italic,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIncomeExpenseComparison(List<Transaction> transactions) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'مقارنة الدخل مقابل المصروفات',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),
            Text(
              'قريباً: مخططات مقارنة تفاعلية',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontStyle: FontStyle.italic,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryComparison(List<Transaction> transactions, List<Category> categories) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'مقارنة التصنيفات',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),
            Text(
              'قريباً: مقارنات تفصيلية بين التصنيفات المختلفة',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontStyle: FontStyle.italic,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPeriodComparison(List<Transaction> transactions) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'مقارنة الفترات الزمنية',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),
            Text(
              'قريباً: مقارنة البيانات بين فترات زمنية مختلفة',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontStyle: FontStyle.italic,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyChart(String message) {
    return Card(
      child: Container(
        height: 200,
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              LucideIcons.chartPie,
              size: 48,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textDirection: TextDirectionHelper.rtl,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  List<Transaction> _filterTransactionsByPeriod(List<Transaction> transactions) {
    final now = DateTime.now();
    DateTime startDate;
    
    switch (_selectedPeriod) {
      case 'month':
        startDate = DateTime(_selectedDate.year, _selectedDate.month, 1);
        return transactions.where((t) =>
            t.date.year == _selectedDate.year && 
            t.date.month == _selectedDate.month).toList();
      
      case 'year':
        return transactions.where((t) => t.date.year == _selectedDate.year).toList();
      
      case 'all':
      default:
        return transactions;
    }
  }

  String _getPeriodText() {
    switch (_selectedPeriod) {
      case 'month':
        return DateFormat('MMMM yyyy', 'ar').format(_selectedDate);
      case 'year':
        return '${_selectedDate.year}';
      case 'all':
      default:
        return 'جميع الفترات';
    }
  }

  void _showPeriodSelector() {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('الشهر الحالي', textDirection: TextDirection.rtl),
                leading: const Icon(LucideIcons.calendar),
                onTap: () {
                  setState(() {
                    _selectedPeriod = 'month';
                    _selectedDate = DateTime.now();
                  });
                  Navigator.pop(context);
                },
              ),
              ListTile(
                title: const Text('السنة الحالية', textDirection: TextDirection.rtl),
                leading: const Icon(LucideIcons.calendar),
                onTap: () {
                  setState(() {
                    _selectedPeriod = 'year';
                    _selectedDate = DateTime.now();
                  });
                  Navigator.pop(context);
                },
              ),
              ListTile(
                title: const Text('جميع الفترات', textDirection: TextDirection.rtl),
                leading: const Icon(LucideIcons.calendar),
                onTap: () {
                  setState(() {
                    _selectedPeriod = 'all';
                  });
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
