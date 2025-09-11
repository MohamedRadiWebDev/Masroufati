import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Category } from "@shared/schema";
import { X } from "lucide-react";

const transactionSchema = z.object({
  amount: z.string().min(1, "المبلغ مطلوب").refine((val) => parseFloat(val) > 0, "المبلغ يجب أن يكون أكبر من صفر"),
  category: z.string().min(1, "التصنيف مطلوب"),
  note: z.string().optional(),
  date: z.string().min(1, "التاريخ مطلوب"),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface AddTransactionModalProps {
  type: 'income' | 'expense';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddTransactionModal({ type, open, onOpenChange }: AddTransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories", { type }],
  });

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: "",
      category: "",
      note: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      return apiRequest("POST", "/api/transactions", {
        type,
        amount: data.amount,
        category: data.category,
        note: data.note || undefined,
        date: new Date(data.date).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      
      toast({
        title: "تم بنجاح!",
        description: `تم إضافة ${type === 'income' ? 'الدخل' : 'المصروف'} بنجاح`,
      });
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ!",
        description: "فشل في إضافة العملية. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    createTransaction.mutate(data);
  };

  const filteredCategories = categories.filter(cat => cat.type === type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4 rounded-t-lg data-[state=open]:slide-in-from-bottom-full">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>
            {type === 'income' ? 'إضافة دخل' : 'إضافة مصروف'}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid={`form-${type}`}>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المبلغ</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="٠.٠٠"
                      type="number"
                      step="0.01"
                      className="text-left"
                      data-testid="input-amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التصنيف</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2">
                            <i className={`${category.icon} text-sm`}></i>
                            {category.nameAr}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظة (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أضف ملاحظة"
                      className="resize-none"
                      rows={2}
                      data-testid="input-note"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التاريخ</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      data-testid="input-date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className={`w-full ${type === 'income' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'} text-white`}
              disabled={createTransaction.isPending}
              data-testid={`button-submit-${type}`}
            >
              {createTransaction.isPending ? 'جاري الحفظ...' : `إضافة ${type === 'income' ? 'الدخل' : 'المصروف'}`}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
