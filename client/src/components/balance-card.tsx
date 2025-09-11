import { useQuery } from "@tanstack/react-query";

interface BalanceData {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

export default function BalanceCard() {
  const { data: balance, isLoading } = useQuery<BalanceData>({
    queryKey: ["/api/balance"],
  });

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  };

  if (isLoading) {
    return (
      <div className="balance-card text-white rounded-lg p-6 shadow-lg animate-pulse">
        <div className="text-center">
          <div className="h-4 bg-white/20 rounded w-20 mx-auto mb-2"></div>
          <div className="h-8 bg-white/20 rounded w-32 mx-auto mb-4"></div>
          <div className="flex justify-between">
            <div className="text-center">
              <div className="h-3 bg-white/20 rounded w-16 mb-1"></div>
              <div className="h-5 bg-white/20 rounded w-20"></div>
            </div>
            <div className="text-center">
              <div className="h-3 bg-white/20 rounded w-16 mb-1"></div>
              <div className="h-5 bg-white/20 rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="balance-card text-white rounded-lg p-6 shadow-lg">
      <div className="text-center">
        <p className="text-sm opacity-90 mb-2">الرصيد الحالي</p>
        <p className="text-3xl font-bold" data-testid="text-current-balance">
          {balance ? formatCurrency(balance.currentBalance) : "٠ ج.م"}
        </p>
        <div className="flex justify-between mt-4 text-sm">
          <div className="text-center">
            <p className="opacity-80">إجمالي الدخل</p>
            <p className="font-semibold" data-testid="text-total-income">
              {balance ? formatCurrency(balance.totalIncome) : "٠ ج.م"}
            </p>
          </div>
          <div className="text-center">
            <p className="opacity-80">إجمالي المصروفات</p>
            <p className="font-semibold" data-testid="text-total-expenses">
              {balance ? formatCurrency(balance.totalExpenses) : "٠ ج.م"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
