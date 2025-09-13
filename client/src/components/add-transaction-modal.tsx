import { useState, useRef, useEffect } from "react";
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
import { suggestCategoryFromText } from "@/lib/arabic-text-processor";
import { X, Camera, Upload, Trash2, Lightbulb } from "lucide-react";

const transactionSchema = z.object({
  amount: z.string().min(1, "المبلغ مطلوب").refine((val) => parseFloat(val) > 0, "المبلغ يجب أن يكون أكبر من صفر"),
  category: z.string().min(1, "التصنيف مطلوب"),
  note: z.string().optional(),
  date: z.string().min(1, "التاريخ مطلوب"),
  receiptImage: z.string().optional(),
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories", type],
  });

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: "",
      category: "",
      note: "",
      date: new Date().toISOString().split('T')[0],
      receiptImage: "",
    },
  });

  // Function to compress and convert image to base64
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width)
        const maxWidth = 800;
        const scale = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "الملف كبير جداً",
          description: "يجب أن يكون حجم الصورة أقل من 10 ميجابايت",
          variant: "destructive",
        });
        return;
      }

      try {
        const compressedImage = await compressImage(file);
        setSelectedImage(compressedImage);
        form.setValue('receiptImage', compressedImage);
      } catch (error) {
        toast({
          title: "خطأ في رفع الصورة",
          description: "حدث خطأ أثناء معالجة الصورة",
          variant: "destructive",
        });
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    form.setValue('receiptImage', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createTransaction = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      return apiRequest("POST", "/api/transactions", {
        type,
        amount: data.amount,
        category: data.category,
        note: data.note || undefined,
        date: new Date(data.date).toISOString(),
        receiptImage: data.receiptImage || undefined,
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
      setSelectedImage(null);
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

  // Smart category suggestion based on note text
  useEffect(() => {
    const note = form.watch('note');
    if (note && note.length > 3) {
      const suggested = suggestCategoryFromText(note, categories, type);
      if (suggested && suggested !== form.getValues('category')) {
        setSuggestedCategory(suggested);
        setShowSuggestion(true);
      } else {
        setShowSuggestion(false);
      }
    } else {
      setShowSuggestion(false);
    }
  }, [form.watch('note'), categories, type]);

  const applySuggestedCategory = () => {
    if (suggestedCategory) {
      form.setValue('category', suggestedCategory);
      setShowSuggestion(false);
      toast({
        title: "تم اقتراح التصنيف!",
        description: "تم تحديد التصنيف تلقائياً بناءً على الوصف",
      });
    }
  };

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
            
            {/* Smart Category Suggestion */}
            {showSuggestion && suggestedCategory && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Lightbulb className="h-4 w-4" />
                  اقتراح ذكي للتصنيف
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    يبدو أن هذه المعاملة من فئة:{' '}
                    <span className="font-medium text-foreground">
                      {filteredCategories.find(cat => cat.name === suggestedCategory)?.nameAr || suggestedCategory}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={applySuggestedCategory}
                    className="h-8 px-3"
                    data-testid="button-apply-suggestion"
                  >
                    تطبيق
                  </Button>
                </div>
              </div>
            )}
            
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
            
            {/* Receipt Image Upload */}
            <div className="space-y-2">
              <Label>صورة الإيصال (اختياري)</Label>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-image"
                  >
                    <Camera className="ml-2 h-4 w-4" />
                    رفع صورة
                  </Button>
                  {selectedImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage}
                      data-testid="button-remove-image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-file"
                />
                
                {selectedImage && (
                  <div className="border border-border rounded-lg p-2">
                    <img
                      src={selectedImage}
                      alt="معاينة الإيصال"
                      className="w-full max-h-40 object-contain rounded"
                      data-testid="image-preview"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      معاينة صورة الإيصال
                    </p>
                  </div>
                )}
              </div>
            </div>
            
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
