import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "@/components/bottom-navigation";
import TransactionItem from "@/components/transaction-item";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { type Transaction } from "@shared/schema";

export default function Transactions() {
  const [, setLocation] = useLocation();

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

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
    <>
      <div className="p-4 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">جميع العمليات</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <p className="text-muted-foreground">لا توجد عمليات مسجلة</p>
              <p className="text-sm text-muted-foreground mt-2">
                ارجع للصفحة الرئيسية لإضافة عمليات جديدة
              </p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          )}
        </div>
      </div>

      <BottomNavigation activeTab="transactions" />
    </>
  );
}
