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

enum TimeRange { week, month, threeMonths, sixMonths, year, custom }
enum ChartType { line, area, bar }

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen>
    with TickerProviderStateMixin {

  TimeRange _selectedTimeRange = TimeRange.month;
  ChartType _selectedChartType = ChartType.area;
  String _selectedCategory = 'all';
  late TabController _tabController;

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

    final filteredTransactions = _filterTransactionsByTimeRange(transactions);
    final reportData = _generateReportData(filteredTransactions, categories);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'التقارير المالية',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _showFilterOptions,
            icon: const Icon(LucideIcons.settings),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'نظرة عامة', icon: Icon(Icons.bar_chart, size: 16)),
            Tab(text: 'الاتجاهات', icon: Icon(LucideIcons.trending_up, size: 16)),
            Tab(text: 'المقارنات', icon: Icon(Icons.bar_chart, size: 16)),
          ],
        ),
      ),
      body: Column(
        children: [
          // Filter controls
          _buildFilterControls(),

          // Content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(reportData, categories),
                _buildTrendsTab(reportData, filteredTransactions),
                _buildComparisonsTab(reportData, filteredTransactions, categories),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterControls() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<TimeRange>(
              value: _selectedTimeRange,
              decoration: InputDecoration(
                labelText: 'الفترة الزمنية',
                labelStyle: const TextStyle(fontSize: 12),
                prefixIcon: const Icon(LucideIcons.calendar, size: 18),
                filled: true,
                fillColor: Theme.of(context).colorScheme.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              items: const [
                DropdownMenuItem(value: TimeRange.week, child: Text('أسبوع')),
                DropdownMenuItem(value: TimeRange.month, child: Text('شهر')),
                DropdownMenuItem(value: TimeRange.threeMonths, child: Text('3 أشهر')),
                DropdownMenuItem(value: TimeRange.sixMonths, child: Text('6 أشهر')),
                DropdownMenuItem(value: TimeRange.year, child: Text('سنة')),
              ],
              onChanged: (value) => setState(() => _selectedTimeRange = value!),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonFormField<ChartType>(
              value: _selectedChartType,
              decoration: InputDecoration(
                labelText: 'نوع الرسم',
                labelStyle: const TextStyle(fontSize: 12),
                prefixIcon: const Icon(LucideIcons.chart, size: 18),
                filled: true,
                fillColor: Theme.of(context).colorScheme.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              items: const [
                DropdownMenuItem(value: ChartType.area, child: Text('منطقة')),
                DropdownMenuItem(value: ChartType.line, child: Text('خط')),
                DropdownMenuItem(value: ChartType.bar, child: Text('أعمدة')),
              ],
              onChanged: (value) => setState(() => _selectedChartType = value!),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewTab(ReportData reportData, List<Category> categories) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Summary cards
          _buildSummaryCards(reportData.overview),

          const SizedBox(height: 24),

          // Cash flow chart
          _buildCashFlowChart(reportData.trends.daily),

          const SizedBox(height: 24),

          // Category breakdown
          _buildCategoryBreakdown(reportData.trends.categoryTrends, categories),
        ],
      ),
    );
  }

  Widget _buildTrendsTab(ReportData reportData, List<Transaction> transactions) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Daily trends chart
          _buildDailyTrendsChart(reportData.trends.daily),

          const SizedBox(height: 24),

          // Monthly comparison
          if (reportData.trends.monthly.isNotEmpty)
            _buildMonthlyTrendsChart(reportData.trends.monthly),
        ],
      ),
    );
  }

  Widget _buildComparisonsTab(ReportData reportData, List<Transaction> transactions, List<Category> categories) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Period comparison
          _buildPeriodComparison(reportData.comparisons.previousPeriod),

          const SizedBox(height: 24),

          // Category comparison
          _buildCategoryComparison(reportData.comparisons.categoryComparison, categories),
        ],
      ),
    );
  }

  Widget _buildSummaryCards(ReportOverview overview) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _buildSummaryCard(
          'إجمالي الدخل',
          overview.totalIncome,
          LucideIcons.trending_up,
          Theme.of(context).colorScheme.primary,
        ),
        _buildSummaryCard(
          'إجمالي المصروفات',
          overview.totalExpenses,
          LucideIcons.trending_down,
          Theme.of(context).colorScheme.error,
        ),
        _buildSummaryCard(
          'صافي التدفق النقدي',
          overview.netCashFlow,
          overview.netCashFlow >= 0 ? LucideIcons.plus : LucideIcons.minus,
          overview.netCashFlow >= 0 
            ? Theme.of(context).colorScheme.primary 
            : Theme.of(context).colorScheme.error,
        ),
        _buildSummaryCard(
          'متوسط الإنفاق اليومي',
          overview.avgDailySpend,
          LucideIcons.calculator,
          Theme.of(context).colorScheme.secondary,
        ),
      ],
    );
  }

  Widget _buildSummaryCard(String title, double value, IconData icon, Color color) {
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
        mainAxisAlignment: MainAxisAlignment.center,
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
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            '${value.toStringAsFixed(2)} ج.م',
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

  Widget _buildCashFlowChart(List<DailyTrend> dailyData) {
    if (dailyData.isEmpty) {
      return _buildEmptyChart('لا توجد بيانات لعرضها');
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'تدفق الأموال',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),

            SizedBox(
              height: 250,
              child: _selectedChartType == ChartType.bar
                  ? _buildBarChart(dailyData)
                  : _buildLineChart(dailyData),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLineChart(List<DailyTrend> data) {
    final incomeSpots = data.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.income);
    }).toList();

    final expenseSpots = data.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.expenses);
    }).toList();

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: true),
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                if (value.toInt() >= 0 && value.toInt() < data.length) {
                  final date = DateTime.parse(data[value.toInt()].date);
                  return Text(
                    DateFormat('dd/MM').format(date),
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
            spots: incomeSpots,
            color: Theme.of(context).colorScheme.primary,
            barWidth: 3,
            dotData: const FlDotData(show: true),
            belowBarData: _selectedChartType == ChartType.area 
                ? BarAreaData(show: true, color: Theme.of(context).colorScheme.primary.withOpacity(0.3))
                : BarAreaData(show: false),
          ),
          LineChartBarData(
            spots: expenseSpots,
            color: Theme.of(context).colorScheme.error,
            barWidth: 3,
            dotData: const FlDotData(show: true),
            belowBarData: _selectedChartType == ChartType.area 
                ? BarAreaData(show: true, color: Theme.of(context).colorScheme.error.withOpacity(0.3))
                : BarAreaData(show: false),
          ),
        ],
      ),
    );
  }

  Widget _buildBarChart(List<DailyTrend> data) {
    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: data.map((d) => [d.income, d.expenses].reduce((a, b) => a > b ? a : b)).reduce((a, b) => a > b ? a : b) * 1.2,
        barTouchData: BarTouchData(enabled: false),
        titlesData: FlTitlesData(
          show: true,
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (double value, TitleMeta meta) {
                if (value.toInt() >= 0 && value.toInt() < data.length) {
                  final date = DateTime.parse(data[value.toInt()].date);
                  return Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      DateFormat('dd').format(date),
                      style: const TextStyle(fontSize: 12),
                    ),
                  );
                }
                return const Text('');
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (double value, TitleMeta meta) {
                return Text('${value.toInt()}');
              },
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        barGroups: data.asMap().entries.map((entry) {
          return BarChartGroupData(
            x: entry.key,
            barRods: [
              BarChartRodData(
                toY: entry.value.income,
                color: Theme.of(context).colorScheme.primary,
                width: 12,
              ),
              BarChartRodData(
                toY: entry.value.expenses,
                color: Theme.of(context).colorScheme.error,
                width: 12,
              ),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildDailyTrendsChart(List<DailyTrend> data) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'الاتجاهات اليومية',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),

            SizedBox(
              height: 250,
              child: _buildLineChart(data),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMonthlyTrendsChart(List<MonthlyTrend> data) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'الاتجاهات الشهرية',
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
                          if (value.toInt() >= 0 && value.toInt() < data.length) {
                            return Text(
                              data[value.toInt()].month,
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
                      spots: data.asMap().entries.map((entry) {
                        return FlSpot(entry.key.toDouble(), entry.value.income);
                      }).toList(),
                      color: Theme.of(context).colorScheme.primary,
                      barWidth: 3,
                      dotData: const FlDotData(show: true),
                    ),
                    LineChartBarData(
                      spots: data.asMap().entries.map((entry) {
                        return FlSpot(entry.key.toDouble(), entry.value.expenses);
                      }).toList(),
                      color: Theme.of(context).colorScheme.error,
                      barWidth: 3,
                      dotData: const FlDotData(show: true),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryBreakdown(List<CategoryTrend> categoryTrends, List<Category> categories) {
    if (categoryTrends.isEmpty) {
      return _buildEmptyChart('لا توجد بيانات فئات لعرضها');
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'أعلى فئات الإنفاق',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),

            ...categoryTrends.take(5).map((trend) {
              final category = categories.firstWhere(
                (c) => c.name == trend.category,
                orElse: () => Category(
                  id: 'default',
                  name: trend.category,
                  nameAr: trend.category,
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
                    Icon(
                      CategoryIcons.getIcon(category.icon),
                      color: Color(int.parse(category.color.replaceFirst('#', '0xFF'))),
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        trend.category,
                        style: Theme.of(context).textTheme.bodyMedium,
                        textDirection: TextDirectionHelper.rtl,
                      ),
                    ),
                    Text(
                      '${trend.amount.toStringAsFixed(2)} ج.م',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      textDirection: TextDirectionHelper.rtl,
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: trend.change >= 0 
                            ? Colors.red.withOpacity(0.1)
                            : Colors.green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${trend.change >= 0 ? '+' : ''}${trend.change.toStringAsFixed(1)}%',
                        style: TextStyle(
                          color: trend.change >= 0 ? Colors.red : Colors.green,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
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

  Widget _buildPeriodComparison(PreviousPeriod comparison) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'مقارنة مع الفترة السابقة',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: _buildComparisonCard(
                    'الدخل',
                    comparison.income,
                    comparison.changePercent,
                    LucideIcons.trending_up,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildComparisonCard(
                    'المصروفات',
                    comparison.expenses,
                    -comparison.changePercent, // Negative for expenses
                    LucideIcons.trending_down,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildComparisonCard(String title, double amount, double changePercent, IconData icon) {
    final isPositive = changePercent >= 0;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18),
              const SizedBox(width: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.bodyMedium,
                textDirection: TextDirectionHelper.rtl,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${amount.toStringAsFixed(2)} ج.م',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textDirection: TextDirectionHelper.rtl,
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(
                isPositive ? LucideIcons.arrow_up : LucideIcons.arrow_down,
                size: 14,
                color: isPositive ? Colors.green : Colors.red,
              ),
              const SizedBox(width: 4),
              Text(
                '${changePercent.abs().toStringAsFixed(1)}%',
                style: TextStyle(
                  color: isPositive ? Colors.green : Colors.red,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryComparison(List<CategoryComparison> comparisons, List<Category> categories) {
    if (comparisons.isEmpty) {
      return _buildEmptyChart('لا توجد بيانات مقارنة للفئات');
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'مقارنة الفئات',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),

            ...comparisons.take(5).map((comparison) {
              final category = categories.firstWhere(
                (c) => c.name == comparison.category,
                orElse: () => Category(
                  id: 'default',
                  name: comparison.category,
                  nameAr: comparison.category,
                  color: '#6B7280',
                  icon: 'circle',
                  type: TransactionType.expense,
                  createdAt: DateTime.now(),
                ),
              );

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(
                          CategoryIcons.getIcon(category.icon),
                          color: Color(int.parse(category.color.replaceFirst('#', '0xFF'))),
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            comparison.category,
                            style: Theme.of(context).textTheme.bodyMedium,
                            textDirection: TextDirectionHelper.rtl,
                          ),
                        ),
                        Text(
                          '${comparison.current.toStringAsFixed(0)} ج.م',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                          textDirection: TextDirectionHelper.rtl,
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const SizedBox(width: 32),
                        Expanded(
                          child: Text(
                            'السابق: ${comparison.previous.toStringAsFixed(0)} ج.م',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                            textDirection: TextDirectionHelper.rtl,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: comparison.change >= 0 
                                ? Colors.red.withOpacity(0.1)
                                : Colors.green.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${comparison.change >= 0 ? '+' : ''}${comparison.change.toStringAsFixed(1)}%',
                            style: TextStyle(
                              color: comparison.change >= 0 ? Colors.red : Colors.green,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
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

  Widget _buildEmptyChart(String message) {
    return Card(
      child: Container(
        height: 200,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.pie_chart,
                size: 48,
                color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.5),
              ),
              const SizedBox(height: 16),
              Text(
                message,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                textDirection: TextDirectionHelper.rtl,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showFilterOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'خيارات التصفية',
              style: Theme.of(context).textTheme.titleLarge,
              textDirection: TextDirectionHelper.rtl,
            ),
            const SizedBox(height: 16),
            // Add more filter options here
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('إغلاق'),
            ),
          ],
        ),
      ),
    );
  }

  List<Transaction> _filterTransactionsByTimeRange(List<Transaction> transactions) {
    final now = DateTime.now();
    final DateTime startDate;

    switch (_selectedTimeRange) {
      case TimeRange.week:
        startDate = now.subtract(const Duration(days: 7));
        break;
      case TimeRange.month:
        startDate = DateTime(now.year, now.month - 1, now.day);
        break;
      case TimeRange.threeMonths:
        startDate = DateTime(now.year, now.month - 3, now.day);
        break;
      case TimeRange.sixMonths:
        startDate = DateTime(now.year, now.month - 6, now.day);
        break;
      case TimeRange.year:
        startDate = DateTime(now.year - 1, now.month, now.day);
        break;
      case TimeRange.custom:
        startDate = DateTime(now.year, now.month - 1, now.day);
        break;
    }

    return transactions.where((transaction) {
      return transaction.date.isAfter(startDate) &&
          (_selectedCategory == 'all' || transaction.category == _selectedCategory);
    }).toList();
  }

  ReportData _generateReportData(List<Transaction> transactions, List<Category> categories) {
    // Calculate overview
    final totalIncome = transactions
        .where((t) => t.type == TransactionType.income)
        .fold(0.0, (sum, t) => sum + t.amount);

    final totalExpenses = transactions
        .where((t) => t.type == TransactionType.expense)
        .fold(0.0, (sum, t) => sum + t.amount);

    final netCashFlow = totalIncome - totalExpenses;
    final transactionCount = transactions.length;
    final avgDailySpend = transactions.isNotEmpty 
        ? totalExpenses / _getDaysInRange()
        : 0.0;

    // Get top category
    final categoryTotals = <String, double>{};
    for (final transaction in transactions.where((t) => t.type == TransactionType.expense)) {
      categoryTotals[transaction.category] = 
          (categoryTotals[transaction.category] ?? 0) + transaction.amount;
    }
    final topCategory = categoryTotals.isNotEmpty
        ? categoryTotals.entries.reduce((a, b) => a.value > b.value ? a : b).key
        : '';

    final overview = ReportOverview(
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      netCashFlow: netCashFlow,
      transactionCount: transactionCount,
      avgDailySpend: avgDailySpend,
      topCategory: topCategory,
    );

    // Generate daily trends
    final dailyData = _generateDailyTrends(transactions);
    final monthlyData = _generateMonthlyTrends(transactions);
    final categoryTrends = _generateCategoryTrends(transactions);

    final trends = ReportTrends(
      daily: dailyData,
      monthly: monthlyData,
      categoryTrends: categoryTrends,
    );

    // Generate comparisons
    final previousPeriod = _calculatePreviousPeriod(transactions);
    final categoryComparison = _generateCategoryComparisons(transactions);

    final comparisons = ReportComparisons(
      previousPeriod: previousPeriod,
      categoryComparison: categoryComparison,
    );

    return ReportData(
      overview: overview,
      trends: trends,
      comparisons: comparisons,
    );
  }

  List<DailyTrend> _generateDailyTrends(List<Transaction> transactions) {
    final dailyData = <String, DailyTrend>{};

    for (final transaction in transactions) {
      final dateKey = DateFormat('yyyy-MM-dd').format(transaction.date);

      if (!dailyData.containsKey(dateKey)) {
        dailyData[dateKey] = DailyTrend(
          date: dateKey,
          income: 0,
          expenses: 0,
          net: 0,
        );
      }

      if (transaction.type == TransactionType.income) {
        dailyData[dateKey] = dailyData[dateKey]!.copyWith(
          income: dailyData[dateKey]!.income + transaction.amount,
        );
      } else {
        dailyData[dateKey] = dailyData[dateKey]!.copyWith(
          expenses: dailyData[dateKey]!.expenses + transaction.amount,
        );
      }

      dailyData[dateKey] = dailyData[dateKey]!.copyWith(
        net: dailyData[dateKey]!.income - dailyData[dateKey]!.expenses,
      );
    }

    final sortedEntries = dailyData.entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));

    return sortedEntries.map((entry) => entry.value).toList();
  }

  List<MonthlyTrend> _generateMonthlyTrends(List<Transaction> transactions) {
    final monthlyData = <String, MonthlyTrend>{};

    for (final transaction in transactions) {
      final monthKey = DateFormat('yyyy-MM').format(transaction.date);

      if (!monthlyData.containsKey(monthKey)) {
        monthlyData[monthKey] = MonthlyTrend(
          month: DateFormat('MMM', 'ar').format(transaction.date),
          income: 0,
          expenses: 0,
          net: 0,
        );
      }

      if (transaction.type == TransactionType.income) {
        monthlyData[monthKey] = monthlyData[monthKey]!.copyWith(
          income: monthlyData[monthKey]!.income + transaction.amount,
        );
      } else {
        monthlyData[monthKey] = monthlyData[monthKey]!.copyWith(
          expenses: monthlyData[monthKey]!.expenses + transaction.amount,
        );
      }

      monthlyData[monthKey] = monthlyData[monthKey]!.copyWith(
        net: monthlyData[monthKey]!.income - monthlyData[monthKey]!.expenses,
      );
    }

    final sortedEntries = monthlyData.entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));

    return sortedEntries.map((entry) => entry.value).toList();
  }

  List<CategoryTrend> _generateCategoryTrends(List<Transaction> transactions) {
    final categoryData = <String, double>{};

    for (final transaction in transactions.where((t) => t.type == TransactionType.expense)) {
      categoryData[transaction.category] = 
          (categoryData[transaction.category] ?? 0) + transaction.amount;
    }

    final sortedEntries = categoryData.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return sortedEntries.map((entry) => CategoryTrend(
      category: entry.key,
      amount: entry.value,
      change: 0.0, // For simplicity, using 0 change
    )).toList();
  }

  PreviousPeriod _calculatePreviousPeriod(List<Transaction> transactions) {
    // For simplicity, using dummy data
    return const PreviousPeriod(
      income: 5000.0,
      expenses: 3000.0,
      changePercent: 15.5,
    );
  }

  List<CategoryComparison> _generateCategoryComparisons(List<Transaction> transactions) {
    final categoryData = <String, double>{};

    for (final transaction in transactions.where((t) => t.type == TransactionType.expense)) {
      categoryData[transaction.category] = 
          (categoryData[transaction.category] ?? 0) + transaction.amount;
    }

    return categoryData.entries.map((entry) => CategoryComparison(
      category: entry.key,
      current: entry.value,
      previous: entry.value * 0.8, // Dummy previous period data
      change: 20.0, // Dummy change percentage
    )).toList();
  }

  int _getDaysInRange() {
    switch (_selectedTimeRange) {
      case TimeRange.week:
        return 7;
      case TimeRange.month:
        return 30;
      case TimeRange.threeMonths:
        return 90;
      case TimeRange.sixMonths:
        return 180;
      case TimeRange.year:
        return 365;
      case TimeRange.custom:
        return 30;
    }
  }
}

// Data classes
class ReportData {
  final ReportOverview overview;
  final ReportTrends trends;
  final ReportComparisons comparisons;

  const ReportData({
    required this.overview,
    required this.trends,
    required this.comparisons,
  });
}

class ReportOverview {
  final double totalIncome;
  final double totalExpenses;
  final double netCashFlow;
  final int transactionCount;
  final double avgDailySpend;
  final String topCategory;

  const ReportOverview({
    required this.totalIncome,
    required this.totalExpenses,
    required this.netCashFlow,
    required this.transactionCount,
    required this.avgDailySpend,
    required this.topCategory,
  });
}

class ReportTrends {
  final List<DailyTrend> daily;
  final List<MonthlyTrend> monthly;
  final List<CategoryTrend> categoryTrends;

  const ReportTrends({
    required this.daily,
    required this.monthly,
    required this.categoryTrends,
  });
}

class ReportComparisons {
  final PreviousPeriod previousPeriod;
  final List<CategoryComparison> categoryComparison;

  const ReportComparisons({
    required this.previousPeriod,
    required this.categoryComparison,
  });
}

class DailyTrend {
  final String date;
  final double income;
  final double expenses;
  final double net;

  const DailyTrend({
    required this.date,
    required this.income,
    required this.expenses,
    required this.net,
  });

  DailyTrend copyWith({
    String? date,
    double? income,
    double? expenses,
    double? net,
  }) {
    return DailyTrend(
      date: date ?? this.date,
      income: income ?? this.income,
      expenses: expenses ?? this.expenses,
      net: net ?? this.net,
    );
  }
}

class MonthlyTrend {
  final String month;
  final double income;
  final double expenses;
  final double net;

  const MonthlyTrend({
    required this.month,
    required this.income,
    required this.expenses,
    required this.net,
  });

  MonthlyTrend copyWith({
    String? month,
    double? income,
    double? expenses,
    double? net,
  }) {
    return MonthlyTrend(
      month: month ?? this.month,
      income: income ?? this.income,
      expenses: expenses ?? this.expenses,
      net: net ?? this.net,
    );
  }
}

class CategoryTrend {
  final String category;
  final double amount;
  final double change;

  const CategoryTrend({
    required this.category,
    required this.amount,
    required this.change,
  });
}

class PreviousPeriod {
  final double income;
  final double expenses;
  final double changePercent;

  const PreviousPeriod({
    required this.income,
    required this.expenses,
    required this.changePercent,
  });
}

class CategoryComparison {
  final String category;
  final double current;
  final double previous;
  final double change;

  const CategoryComparison({
    required this.category,
    required this.current,
    required this.previous,
    required this.change,
  });
}