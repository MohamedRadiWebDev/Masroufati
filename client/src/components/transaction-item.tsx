import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Transaction, type Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  ShoppingCart, 
  Car, 
  Home, 
  Utensils, 
  Gamepad2, 
  Shirt, 
  GraduationCap, 
  Heart, 
  Briefcase,
  Gift,
  CreditCard,
  Fuel,
  Smartphone,
  PiggyBank,
  CircleDollarSign,
  Receipt,
  MoreHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TransactionItemProps {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      
      toast({
        title: "تم الحذف بنجاح!",
        description: "تم حذف العملية بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ!",
        description: "فشل في حذف العملية. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("هل أنت متأكد من حذف هذه العملية؟")) {
      deleteTransaction.mutate(transaction.id);
    }
  };

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

  // Get appropriate icon for category
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, any> = {
      // Categories in Arabic
      'طعام': Utensils,
      'أكل': Utensils,
      'مطعم': Utensils,
      'طبخ': Utensils,
      'مواد غذائية': ShoppingCart,
      'تسوق': ShoppingCart,
      'تسويق': ShoppingCart,
      'شراء': ShoppingCart,
      'متاجر': ShoppingCart,
      'نقل': Car,
      'مواصلات': Car,
      'سيارة': Car,
      'بنزين': Fuel,
      'وقود': Fuel,
      'سكن': Home,
      'إيجار': Home,
      'كهرباء': Home,
      'مياه': Home,
      'ترفيه': Gamepad2,
      'لعب': Gamepad2,
      'سينما': Gamepad2,
      'ملابس': Shirt,
      'أزياء': Shirt,
      'تعليم': GraduationCap,
      'دراسة': GraduationCap,
      'كتب': GraduationCap,
      'صحة': Heart,
      'طبيب': Heart,
      'دواء': Heart,
      'عمل': Briefcase,
      'وظيفة': Briefcase,
      'راتب': CircleDollarSign,
      'هدايا': Gift,
      'بنك': CreditCard,
      'بطاقة': CreditCard,
      'هاتف': Smartphone,
      'اتصالات': Smartphone,
      'إنترنت': Smartphone,
      'استثمار': PiggyBank,
      'توفير': PiggyBank,
      'فاتورة': Receipt,
      'فواتير': Receipt,
      // Categories in English (fallback)
      'food': Utensils,
      'groceries': ShoppingCart,
      'transport': Car,
      'gas': Fuel,
      'rent': Home,
      'entertainment': Gamepad2,
      'clothes': Shirt,
      'education': GraduationCap,
      'health': Heart,
      'work': Briefcase,
      'salary': CircleDollarSign,
      'gifts': Gift,
      'bank': CreditCard,
      'phone': Smartphone,
      'investment': PiggyBank,
      'bills': Receipt,
    };
    
    // Find icon by exact match or partial match
    const lowerCategoryName = categoryName?.toLowerCase() || '';
    
    // Try exact match first
    if (iconMap[lowerCategoryName]) {
      return iconMap[lowerCategoryName];
    }
    
    // Try partial match
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerCategoryName.includes(key) || key.includes(lowerCategoryName)) {
        return icon;
      }
    }
    
    // Default icon
    return MoreHorizontal;
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
      // Add more vibrant colors for categories
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      orange: 'bg-orange-500',
      teal: 'bg-teal-500',
    };
    return colorMap[color] || 'bg-slate-500';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 expense-item cursor-pointer hover:bg-accent/50 transition-colors" data-testid={`transaction-${transaction.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColorClass(category?.color || 'blue')} shadow-sm`}>
            {(() => {
              const IconComponent = getCategoryIcon(transaction.category);
              return <IconComponent className="h-5 w-5 text-white" />;
            })()}
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
        <div className="text-left flex items-center gap-2">
          <p className={`font-bold ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`} data-testid={`text-amount-${transaction.id}`}>
            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteTransaction.isPending}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            data-testid={`button-delete-${transaction.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
