import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

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

export default function Analytics() {
  const [, setLocation] = useLocation();

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  const { data: balance, isLoading: balanceLoading } = useQuery<BalanceData>({
    queryKey: ["/api/balance"],
  });

  const isLoading = analyticsLoading || balanceLoading;

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

  return (
    <>
      <div className="p-4 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">التحليلات الشهرية</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Monthly Summary */}
        <div className="bg-card rounded-lg border border-border p-4 mb-4">
          <h3 className="font-semibold mb-3">ملخص العمليات</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {balance ? formatCurrency(balance.totalIncome) : "٠ ج.م"}
              </p>
              <p className="text-sm text-muted-foreground">إجمالي الدخل</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">
                {balance ? formatCurrency(balance.totalExpenses) : "٠ ج.م"}
              </p>
              <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
            </div>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="chart-container mb-4">
          <h3 className="font-semibold mb-3">توزيع المصروفات</h3>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <i className="fas fa-chart-pie text-4xl mb-2"></i>
              <p>الرسم البياني للمصروفات</p>
              <p className="text-xs mt-1">سيتم تطوير هذه الميزة قريباً</p>
            </div>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-semibold mb-3">تفصيل حسب التصنيفات</h3>
          <div className="space-y-3">
            {analytics?.categoryBreakdown.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>لا توجد مصروفات لعرضها</p>
              </div>
            ) : (
              analytics?.categoryBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getColorClass(item.color)}`}></div>
                    <div className="flex items-center gap-2">
                      <i className={`${item.icon} text-muted-foreground`}></i>
                      <span>{item.categoryAr}</span>
                    </div>
                  </div>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNavigation activeTab="analytics" />
    </>
  );
}
