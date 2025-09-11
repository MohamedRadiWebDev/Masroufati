import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BalanceCard from "@/components/balance-card";
import TransactionItem from "@/components/transaction-item";
import AddTransactionModal from "@/components/add-transaction-modal";
import VoiceRecordingModal from "@/components/voice-recording-modal";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Mic, Plus, Minus } from "lucide-react";
import { type Transaction } from "@shared/schema";

export default function Home() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const recentTransactions = transactions.slice(0, 5);

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
      {/* App Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">إدارة المصاريف</h1>
          <Button variant="ghost" size="sm" data-testid="button-settings">
            <i className="fas fa-cog"></i>
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <BalanceCard />
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-4">
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => setIsExpenseModalOpen(true)}
            data-testid="button-add-expense"
          >
            <Minus className="ml-2 h-4 w-4" />
            إضافة مصروف
          </Button>
          <Button
            className="flex-1 bg-success text-success-foreground hover:bg-success/90"
            onClick={() => setIsIncomeModalOpen(true)}
            data-testid="button-add-income"
          >
            <Plus className="ml-2 h-4 w-4" />
            إضافة دخل
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-4 pb-32">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">آخر العمليات</h2>
          <Button variant="ghost" size="sm" data-testid="button-show-all">
            عرض الكل
          </Button>
        </div>

        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <p className="text-muted-foreground">لا توجد عمليات مسجلة بعد</p>
              <p className="text-sm text-muted-foreground mt-2">
                ابدأ بإضافة أول عملية لك
              </p>
            </div>
          ) : (
            recentTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          )}
        </div>
      </div>

      {/* Voice Recording FAB */}
      <Button
        className="fab w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90"
        onClick={() => setIsVoiceModalOpen(true)}
        data-testid="button-voice-recording"
      >
        <Mic className="h-6 w-6" />
      </Button>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" />

      {/* Modals */}
      <AddTransactionModal
        type="expense"
        open={isExpenseModalOpen}
        onOpenChange={setIsExpenseModalOpen}
      />
      <AddTransactionModal
        type="income"
        open={isIncomeModalOpen}
        onOpenChange={setIsIncomeModalOpen}
      />
      <VoiceRecordingModal
        open={isVoiceModalOpen}
        onOpenChange={setIsVoiceModalOpen}
      />
    </>
  );
}
