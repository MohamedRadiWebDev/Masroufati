import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, TrendingDown, Download, Filter } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import { localStorageManager } from "@/lib/localStorage-storage";
import { type Transaction } from "@shared/schema";

type TimeRange = 'week' | 'month' | '3months' | '6months' | 'year' | 'custom';
type ChartType = 'line' | 'area' | 'bar';

interface ReportData {
  overview: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    transactionCount: number;
    avgDailySpend: number;
    topCategory: string;
  };
  trends: {
    daily: Array<{ date: string; income: number; expenses: number; net: number }>;
    monthly: Array<{ month: string; income: number; expenses: number; net: number }>;
    categoryTrends: Array<{ category: string; amount: number; change: number }>;
  };
  comparisons: {
    previousPeriod: {
      income: number;
      expenses: number;
      changePercent: number;
    };
    categoryComparison: Array<{
      category: string;
      current: number;
      previous: number;
      change: number;
    }>;
  };
}

export default function Reports() {
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start = new Date();

    switch (timeRange) {
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3months':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6months':
        start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case 'year':
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    return { start, end };
  }, [timeRange]);

  // Generate comprehensive report data
  const reportData = useMemo((): ReportData => {
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const isInRange = transactionDate >= dateRange.start && transactionDate <= dateRange.end;
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      return isInRange && matchesCategory;
    });

    // Previous period for comparison
    const previousStart = new Date(dateRange.start.getTime() - (dateRange.end.getTime() - dateRange.start.getTime()));
    const previousEnd = dateRange.start;
    const previousTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= previousStart && transactionDate < previousEnd;
    });

    // Calculate overview metrics
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const netCashFlow = totalIncome - totalExpenses;
    const transactionCount = filteredTransactions.length;
    
    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const avgDailySpend = daysDiff > 0 ? totalExpenses / daysDiff : 0;

    // Find top expense category
    const categoryTotals: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
      });
    
    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'لا توجد فئات';

    // Generate daily trends
    const dailyTrends = generateDailyTrends(filteredTransactions, dateRange);
    
    // Generate monthly trends for longer periods
    const monthlyTrends = generateMonthlyTrends(filteredTransactions, dateRange);

    // Category trends with change calculation
    const categoryTrends = generateCategoryTrends(filteredTransactions, previousTransactions);

    // Previous period comparison
    const prevIncome = previousTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const prevExpenses = previousTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const changePercent = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;

    return {
      overview: {
        totalIncome,
        totalExpenses,
        netCashFlow,
        transactionCount,
        avgDailySpend,
        topCategory,
      },
      trends: {
        daily: dailyTrends,
        monthly: monthlyTrends,
        categoryTrends,
      },
      comparisons: {
        previousPeriod: {
          income: prevIncome,
          expenses: prevExpenses,
          changePercent,
        },
        categoryComparison: generateCategoryComparison(filteredTransactions, previousTransactions),
      },
    };
  }, [transactions, dateRange, selectedCategory]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="mobile-container" dir="rtl">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container" dir="rtl">
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h1 className="text-xl font-semibold">التقارير المالية</h1>
            <p className="text-sm text-muted-foreground">تحليل مفصل للأداء المالي</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-card">
          <div className="flex gap-3 flex-wrap">
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-auto min-w-[120px]">
                <Calendar className="ml-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">الأسبوع الماضي</SelectItem>
                <SelectItem value="month">الشهر الماضي</SelectItem>
                <SelectItem value="3months">آخر 3 أشهر</SelectItem>
                <SelectItem value="6months">آخر 6 أشهر</SelectItem>
                <SelectItem value="year">السنة الماضية</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-auto min-w-[120px]">
                <Filter className="ml-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {Array.isArray(categories) && categories.map((cat: any) => (
                  <SelectItem key={cat.name || cat} value={cat.name || cat}>
                    {cat.nameAr || cat.name || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
              <SelectTrigger className="w-auto min-w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">خطي</SelectItem>
                <SelectItem value="area">منطقة</SelectItem>
                <SelectItem value="bar">أعمدة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>إجمالي الدخل</CardDescription>
                <CardTitle className="text-success">
                  {formatCurrency(reportData.overview.totalIncome)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>إجمالي المصروفات</CardDescription>
                <CardTitle className="text-destructive">
                  {formatCurrency(reportData.overview.totalExpenses)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>صافي التدفق النقدي</CardDescription>
                <CardTitle className={reportData.overview.netCashFlow >= 0 ? "text-success" : "text-destructive"}>
                  {formatCurrency(reportData.overview.netCashFlow)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>متوسط الإنفاق اليومي</CardDescription>
                <CardTitle>
                  {formatCurrency(reportData.overview.avgDailySpend)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>اتجاهات الإنفاق</CardTitle>
              <CardDescription>
                مقارنة الدخل والمصروفات خلال الفترة المحددة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={reportData.trends.daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => formatDate(value)}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  ) : chartType === 'area' ? (
                    <AreaChart data={reportData.trends.daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => formatDate(value)}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Area type="monotone" dataKey="income" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                    </AreaChart>
                  ) : (
                    <BarChart data={reportData.trends.daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => formatDate(value)}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="income" fill="#22c55e" />
                      <Bar dataKey="expenses" fill="#ef4444" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Period Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>مقارنة مع الفترة السابقة</CardTitle>
              <CardDescription>
                تغيير الإنفاق مقارنة بالفترة المماثلة السابقة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>المصروفات</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatCurrency(reportData.overview.totalExpenses)}
                    </span>
                    <div className={`flex items-center gap-1 text-sm ${reportData.comparisons.previousPeriod.changePercent >= 0 ? 'text-destructive' : 'text-success'}`}>
                      {reportData.comparisons.previousPeriod.changePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {Math.abs(reportData.comparisons.previousPeriod.changePercent).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  الفترة السابقة: {formatCurrency(reportData.comparisons.previousPeriod.expenses)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Trends */}
          {reportData.trends.categoryTrends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>أداء الفئات</CardTitle>
                <CardDescription>
                  أعلى فئات الإنفاق والتغيرات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.trends.categoryTrends.slice(0, 5).map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatCurrency(category.amount)}
                        </span>
                        {category.change !== 0 && (
                          <div className={`flex items-center gap-1 text-xs ${category.change >= 0 ? 'text-destructive' : 'text-success'}`}>
                            {category.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(category.change).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <BottomNavigation activeTab="reports" />
      </div>
    </div>
  );
}

// Helper functions for data processing
function generateDailyTrends(transactions: Transaction[], dateRange: { start: Date; end: Date }) {
  const dailyData: Record<string, { income: number; expenses: number }> = {};
  
  // Initialize all days in range
  for (let d = new Date(dateRange.start); d <= dateRange.end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyData[dateStr] = { income: 0, expenses: 0 };
  }
  
  // Aggregate transactions by day
  transactions.forEach(t => {
    const dateStr = new Date(t.date).toISOString().split('T')[0];
    if (dailyData[dateStr]) {
      const amount = parseFloat(t.amount);
      if (t.type === 'income') {
        dailyData[dateStr].income += amount;
      } else {
        dailyData[dateStr].expenses += amount;
      }
    }
  });
  
  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function generateMonthlyTrends(transactions: Transaction[], dateRange: { start: Date; end: Date }) {
  const monthlyData: Record<string, { income: number; expenses: number }> = {};
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    
    const amount = parseFloat(t.amount);
    if (t.type === 'income') {
      monthlyData[monthKey].income += amount;
    } else {
      monthlyData[monthKey].expenses += amount;
    }
  });
  
  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function generateCategoryTrends(currentTransactions: Transaction[], previousTransactions: Transaction[]) {
  const currentCategories: Record<string, number> = {};
  const previousCategories: Record<string, number> = {};
  
  currentTransactions.filter(t => t.type === 'expense').forEach(t => {
    currentCategories[t.category] = (currentCategories[t.category] || 0) + parseFloat(t.amount);
  });
  
  previousTransactions.filter(t => t.type === 'expense').forEach(t => {
    previousCategories[t.category] = (previousCategories[t.category] || 0) + parseFloat(t.amount);
  });
  
  return Object.entries(currentCategories)
    .map(([category, amount]) => {
      const prevAmount = previousCategories[category] || 0;
      const change = prevAmount > 0 ? ((amount - prevAmount) / prevAmount) * 100 : 0;
      
      return {
        category,
        amount,
        change,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

function generateCategoryComparison(currentTransactions: Transaction[], previousTransactions: Transaction[]) {
  const currentCategories: Record<string, number> = {};
  const previousCategories: Record<string, number> = {};
  
  currentTransactions.filter(t => t.type === 'expense').forEach(t => {
    currentCategories[t.category] = (currentCategories[t.category] || 0) + parseFloat(t.amount);
  });
  
  previousTransactions.filter(t => t.type === 'expense').forEach(t => {
    previousCategories[t.category] = (previousCategories[t.category] || 0) + parseFloat(t.amount);
  });
  
  const allCategories = new Set([...Object.keys(currentCategories), ...Object.keys(previousCategories)]);
  
  return Array.from(allCategories).map(category => {
    const current = currentCategories[category] || 0;
    const previous = previousCategories[category] || 0;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    
    return {
      category,
      current,
      previous,
      change,
    };
  }).filter(item => item.current > 0 || item.previous > 0);
}