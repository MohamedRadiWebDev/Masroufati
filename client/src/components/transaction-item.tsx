import { useQuery } from "@tanstack/react-query";
import { type Transaction, type Category } from "@shared/schema";

interface TransactionItemProps {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const category = categories.find(c => c.name === transaction.category);
  
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return `اليوم ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `أمس ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return d.toLocaleDateString('ar-EG');
    }
  };

  const getIconColorClass = (color: string) => {
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
    <div className="bg-card rounded-lg border border-border p-4 expense-item cursor-pointer hover:bg-accent/50 transition-colors" data-testid={`transaction-${transaction.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColorClass(category?.color || 'muted')}`}>
            <i className={`${category?.icon || 'fas fa-circle'} text-white`}></i>
          </div>
          <div>
            <p className="font-medium" data-testid={`text-category-${transaction.id}`}>
              {category?.nameAr || transaction.category}
            </p>
            {transaction.note && (
              <p className="text-sm text-muted-foreground" data-testid={`text-note-${transaction.id}`}>
                {transaction.note}
              </p>
            )}
            <p className="text-xs text-muted-foreground" data-testid={`text-date-${transaction.id}`}>
              {formatDate(transaction.date)}
            </p>
          </div>
        </div>
        <div className="text-left">
          <p className={`font-bold ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`} data-testid={`text-amount-${transaction.id}`}>
            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
          </p>
        </div>
      </div>
    </div>
  );
}
