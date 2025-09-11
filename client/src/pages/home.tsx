import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import BalanceCard from "@/components/balance-card";
import TransactionItem from "@/components/transaction-item";
import AddTransactionModal from "@/components/add-transaction-modal";
import VoiceRecordingModal from "@/components/voice-recording-modal";
import FileImportModal from "@/components/file-import-modal";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Plus, Minus, Search, Filter, X, Upload } from "lucide-react";
import { type Transaction } from "@shared/schema";

export default function Home() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Filter states
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Extract category names for the filter dropdown
  const categories = Array.isArray(categoriesData) ? 
    categoriesData.map((cat: any) => typeof cat === 'string' ? cat : cat.name || cat) : 
    [];

  // Filter transactions based on search and filter criteria
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchText.trim()) {
      filtered = filtered.filter(transaction =>
        transaction.description && transaction.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(transaction => transaction.category === selectedCategory);
    }

    // Apply type filter
    if (selectedType !== "all") {
      filtered = filtered.filter(transaction => transaction.type === selectedType);
    }

    return filtered;
  }, [transactions, searchText, selectedCategory, selectedType]);

  // Show filtered results or recent transactions
  const displayTransactions = (searchText || selectedCategory !== "all" || selectedType !== "all") 
    ? filteredTransactions 
    : transactions.slice(0, 5);

  // Clear all filters
  const clearFilters = () => {
    setSearchText("");
    setSelectedCategory("all");
    setSelectedType("all");
    setShowFilters(false);
  };

  const hasActiveFilters = searchText || selectedCategory !== "all" || selectedType !== "all";

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
        <div className="flex gap-3 mb-3">
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
        <Button
          variant="outline"
          className="w-full border-primary text-primary hover:bg-primary/10"
          onClick={() => setIsImportModalOpen(true)}
          data-testid="button-import-file"
        >
          <Upload className="ml-2 h-4 w-4" />
          استيراد من ملف Excel أو CSV
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الوصف..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pr-10"
              data-testid="input-search"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              data-testid="button-clear-filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 gap-3 mb-3" data-testid="filters-container">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="جميع التصنيفات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger data-testid="select-type">
                <SelectValue placeholder="جميع الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="income">دخل</SelectItem>
                <SelectItem value="expense">مصروف</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="px-4 pb-32">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {hasActiveFilters 
              ? `العمليات المصفاة (${displayTransactions.length})` 
              : "آخر العمليات"}
          </h2>
          {!hasActiveFilters && (
            <Button variant="ghost" size="sm" data-testid="button-show-all">
              عرض الكل
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {displayTransactions.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              {hasActiveFilters ? (
                <>
                  <p className="text-muted-foreground">لم يتم العثور على عمليات مطابقة</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    جرب تعديل معايير البحث
                  </p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">لا توجد عمليات مسجلة بعد</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    ابدأ بإضافة أول عملية لك
                  </p>
                </>
              )}
            </div>
          ) : (
            displayTransactions.map((transaction) => (
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
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        availableCategories={categories}
      />
    </>
  );
}
