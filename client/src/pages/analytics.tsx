import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, TrendingUp, BarChart3, Calendar, Activity } from "lucide-react";
import { useLocation } from "wouter";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Area, AreaChart
} from "recharts";
import { localStorageManager } from "@/lib/localStorage-storage";
import { analyticsQueryOptions } from "@/lib/queryClient";
import { useState } from "react";

interface AnalyticsData {
  categoryBreakdown: {
    category: string;
    categoryAr: string;
    amount: number;
    color: string;
    icon: string;
  }[];
}

interface BalanceData {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

interface MonthlyTrendsData {
  monthlyData: {
    month: string;
    monthName: string;
    year: number;
    income: number;
    expenses: number;
    balance: number;
    savings: number;
  }[];
}

interface SpendingPatternsData {
  dayOfWeekSpending: {
    day: string;
    amount: number;
    dayIndex: number;
  }[];
  monthHalfSpending: {
    firstHalf: number;
    secondHalf: number;
    percentage: {
      firstHalf: number;
      secondHalf: number;
    };
  };
  categoryTrends: {
    category: string;
    categoryAr: string;
    color: string;
    amounts: number[];
  }[];
}

export default function Analytics() {
  const [, setLocation] = useLocation();
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'patterns'>('overview');

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    ...analyticsQueryOptions,
  });

  const { data: balance, isLoading: balanceLoading } = useQuery<BalanceData>({
    queryKey: ["/api/balance"],
    ...analyticsQueryOptions,
  });

  const { data: monthlyTrends, isLoading: trendsLoading } = useQuery<MonthlyTrendsData>({
    queryKey: ["/api/analytics/monthly-trends"],
    ...analyticsQueryOptions,
  });

  const { data: spendingPatterns, isLoading: patternsLoading } = useQuery<SpendingPatternsData>({
    queryKey: ["/api/analytics/spending-patterns"],
    ...analyticsQueryOptions,
  });

  const isLoading = analyticsLoading || balanceLoading || trendsLoading || patternsLoading;

  if (isLoading) {
    return (
      <div className="mobile-container" dir="rtl">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      warning: 'bg-warning',
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      success: 'bg-success',
      destructive: 'bg-destructive',
      accent: 'bg-accent',
      muted: 'bg-muted',
    };
    return colorMap[color] || 'bg-muted';
  };

  const getChartColor = (color: string) => {
    const colorMap: Record<string, string> = {
      warning: '#f59e0b',
      primary: '#3b82f6', 
      secondary: '#10b981',
      success: '#22c55e',
      destructive: '#ef4444',
      accent: '#8b5cf6',
      muted: '#6b7280',
    };
    return colorMap[color] || '#6b7280';
  };

  // Prepare chart data
  const chartData = analytics?.categoryBreakdown.map((item, index) => ({
    name: item.categoryAr,
    value: item.amount,
    color: getChartColor(item.color),
    percentage: balance && balance.totalExpenses > 0 ? ((item.amount / balance.totalExpenses) * 100).toFixed(1) : '0'
  })) || [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.payload.name}</p>
          <p className="text-sm text-primary">
            {formatCurrency(data.value)} ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const escapeCSVField = (field: any): string => {
    // Convert to string and handle null/undefined
    const str = field?.toString() || '';
    
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  };

  const safeFormatDate = (dateValue: any): string => {
    try {
      if (!dateValue) return '';
      
      const date = new Date(dateValue);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      // Format as dd/mm/yyyy using English numbers for compatibility with import
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.warn('Date formatting error:', error, 'for value:', dateValue);
      return '';
    }
  };

  const exportToCSV = async () => {
    try {
      console.log('Starting CSV export...');
      
      // Get transactions from localStorage manager
      const transactions = await localStorageManager.getTransactions();
      console.log('Fetched transactions:', transactions.length);
      
      if (!transactions || transactions.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
      }

      // Prepare CSV data with proper escaping and sanitization
      // Using same format as import: النوع، المبلغ، التصنيف، الملاحظة، التاريخ
      const csvHeaders = ['النوع', 'المبلغ', 'التصنيف', 'الملاحظة', 'التاريخ'];
      const csvRows = transactions.map((transaction: any) => {
        try {
          return [
            escapeCSVField(transaction.type === 'income' ? 'دخل' : 'مصروف'),
            escapeCSVField(transaction.amount?.toString() || '0'),
            escapeCSVField(transaction.category || ''),
            escapeCSVField(transaction.note || ''),
            escapeCSVField(safeFormatDate(transaction.date))
          ];
        } catch (rowError) {
          console.warn('Error processing transaction row:', rowError, transaction);
          return [
            escapeCSVField(transaction.type === 'income' ? 'دخل' : 'مصروف'),
            escapeCSVField(transaction.amount?.toString() || '0'),
            escapeCSVField(transaction.category || ''),
            escapeCSVField(transaction.note || ''),
            escapeCSVField('')
          ];
        }
      });
      
      console.log('Prepared CSV rows:', csvRows.length);

      // Create CSV content with proper line endings
      const csvContent = [
        csvHeaders.map(escapeCSVField).join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\r\n');
      console.log('Created CSV content');

      // Add BOM for Arabic text support
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      console.log('Created Blob');
      
      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      console.log('Created object URL');
      
      const fileName = `العمليات_المالية_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup URL after a short delay to avoid premature revocation
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('CSV export completed successfully');
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      alert('حدث خطأ أثناء تصدير البيانات');
    }
  };

  return (
    <>
      <div className="p-4 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">التحليلات المتقدمة</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 mr-2" />
              تصدير CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-back-home"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg">
          <Button
            variant={selectedView === 'overview' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 text-sm"
            onClick={() => setSelectedView('overview')}
            data-testid="button-overview-tab"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            نظرة عامة
          </Button>
          <Button
            variant={selectedView === 'trends' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 text-sm"
            onClick={() => setSelectedView('trends')}
            data-testid="button-trends-tab"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            الاتجاهات الشهرية
          </Button>
          <Button
            variant={selectedView === 'patterns' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 text-sm"
            onClick={() => setSelectedView('patterns')}
            data-testid="button-patterns-tab"
          >
            <Activity className="h-4 w-4 mr-2" />
            أنماط الإنفاق
          </Button>
        </div>

        {/* Current Balance Summary - Always show */}
        <div className="bg-card rounded-lg border border-border p-4 mb-4">
          <h3 className="font-semibold mb-3">الوضع المالي الحالي</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">
                {balance ? formatCurrency(balance.currentBalance) : "٠ ج.م"}
              </p>
              <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-success">
                {balance ? formatCurrency(balance.totalIncome) : "٠ ج.م"}
              </p>
              <p className="text-xs text-muted-foreground">إجمالي الدخل</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-destructive">
                {balance ? formatCurrency(balance.totalExpenses) : "٠ ج.م"}
              </p>
              <p className="text-xs text-muted-foreground">إجمالي المصروفات</p>
            </div>
          </div>
        </div>

        {/* Conditional Content Based on Selected View */}
        {selectedView === 'overview' && (
          <>
            {/* Expense Distribution Chart */}
            <div className="bg-card rounded-lg border border-border p-4 mb-4" data-testid="chart-expense-distribution">
              <h3 className="font-semibold mb-3">توزيع المصروفات</h3>
              {chartData.length === 0 ? (
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center" data-testid="chart-empty-state">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="mx-auto h-12 w-12 mb-2" />
                    <p>لا توجد مصروفات لعرضها</p>
                    <p className="text-xs mt-1">أضف مصروفات لترى التوزيع</p>
                  </div>
                </div>
              ) : (
                <div className="h-64 w-full" data-testid="pie-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={false}
                        labelLine={false}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Categories Breakdown */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-4">تفصيل حسب التصنيفات</h3>
              <div className="space-y-3">
                {analytics?.categoryBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>لا توجد مصروفات لعرضها</p>
                  </div>
                ) : (
                  analytics?.categoryBreakdown.map((item, index) => {
                    const percentage = balance && balance.totalExpenses > 0 ? 
                      ((item.amount / balance.totalExpenses) * 100).toFixed(1) : '0';
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: getChartColor(item.color) }}
                          ></div>
                          <div className="flex items-center gap-2 flex-1">
                            <i className={`${item.icon} text-muted-foreground text-sm`}></i>
                            <div className="flex-1">
                              <span className="font-medium text-sm">{item.categoryAr}</span>
                              <div className="text-xs text-muted-foreground">{percentage}% من إجمالي المصروفات</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-sm">{formatCurrency(item.amount)}</div>
                          <div className="text-xs text-primary font-medium">{percentage}%</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {selectedView === 'trends' && (
          <>
            {/* Monthly Income vs Expenses Trend */}
            <div className="bg-card rounded-lg border border-border p-4 mb-4">
              <h3 className="font-semibold mb-3">الاتجاه الشهري: الدخل مقابل المصروفات</h3>
              {monthlyTrends?.monthlyData?.length === 0 || !monthlyTrends ? (
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="mx-auto h-12 w-12 mb-2" />
                    <p>لا توجد بيانات شهرية كافية</p>
                    <p className="text-xs mt-1">أضف معاملات لمدة شهر على الأقل</p>
                  </div>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthName" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          formatCurrency(Number(value)), 
                          name === 'income' ? 'الدخل' : name === 'expenses' ? 'المصروفات' : 'الرصيد'
                        ]}
                      />
                      <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="income" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="expenses" />
                      <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="balance" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Monthly Savings Rate */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-3">معدل الادخار الشهري</h3>
              {monthlyTrends?.monthlyData?.length === 0 || !monthlyTrends ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>لا توجد بيانات شهرية</p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrends.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthName" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'معدل الادخار']} />
                      <Area type="monotone" dataKey="savings" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}

        {selectedView === 'patterns' && (
          <>
            {/* Day of Week Spending */}
            <div className="bg-card rounded-lg border border-border p-4 mb-4">
              <h3 className="font-semibold mb-3">الإنفاق حسب أيام الأسبوع</h3>
              {spendingPatterns?.dayOfWeekSpending?.length === 0 || !spendingPatterns ? (
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Calendar className="mx-auto h-12 w-12 mb-2" />
                    <p>لا توجد بيانات إنفاق كافية</p>
                  </div>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={spendingPatterns.dayOfWeekSpending}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'الإنفاق']} />
                      <Bar dataKey="amount" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Month Half Spending Analysis */}
            <div className="bg-card rounded-lg border border-border p-4 mb-4">
              <h3 className="font-semibold mb-3">الإنفاق: النصف الأول مقابل الثاني من الشهر</h3>
              {spendingPatterns?.monthHalfSpending ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(spendingPatterns.monthHalfSpending.firstHalf)}
                    </p>
                    <p className="text-sm text-muted-foreground">النصف الأول</p>
                    <p className="text-xs text-primary font-medium">
                      {spendingPatterns.monthHalfSpending.percentage.firstHalf.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-lg font-bold text-secondary">
                      {formatCurrency(spendingPatterns.monthHalfSpending.secondHalf)}
                    </p>
                    <p className="text-sm text-muted-foreground">النصف الثاني</p>
                    <p className="text-xs text-secondary font-medium">
                      {spendingPatterns.monthHalfSpending.percentage.secondHalf.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>لا توجد بيانات كافية</p>
                </div>
              )}
            </div>

            {/* Category Trends Over Time */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-3">اتجاهات التصنيفات خلال الأشهر الماضية</h3>
              {spendingPatterns?.categoryTrends?.length === 0 || !spendingPatterns ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>لا توجد بيانات اتجاهات</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {spendingPatterns.categoryTrends.slice(0, 5).map((trend, index) => (
                    <div key={index} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{trend.categoryAr}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(trend.amounts.reduce((sum, amt) => sum + amt, 0))}
                        </span>
                      </div>
                      <div className="h-16 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trend.amounts.map((amount, idx) => ({ month: idx + 1, amount }))}>
                            <Area type="monotone" dataKey="amount" stroke={getChartColor(trend.color)} fill={getChartColor(trend.color)} fillOpacity={0.3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNavigation activeTab="analytics" />
    </>
  );
}
