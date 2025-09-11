import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { localStorageManager } from "@/lib/localStorage-storage";
import { insertGoalSchema } from "@shared/schema";

const goalFormSchema = insertGoalSchema.extend({
  targetAmount: z.string().min(1, "المبلغ مطلوب").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "يجب أن يكون المبلغ رقم موجب"),
});

type GoalFormData = z.infer<typeof goalFormSchema>;

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: any[];
}

export function AddGoalModal({ isOpen, onClose, onSuccess, categories }: AddGoalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: "",
      nameAr: "",
      targetAmount: "",
      category: "",
      period: "monthly",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: "true",
    },
  });

  const watchedPeriod = form.watch("period");
  const watchedStartDate = form.watch("startDate");

  // Update end date based on period selection
  const updateEndDateBasedOnPeriod = (period: string, startDate: Date) => {
    const start = new Date(startDate);
    let endDate: Date;

    switch (period) {
      case "daily":
        endDate = new Date(start.getTime() + 24 * 60 * 60 * 1000); // 1 day
        break;
      case "weekly":
        endDate = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;
      case "monthly":
        endDate = new Date(start);
        endDate.setMonth(endDate.getMonth() + 1); // 1 month
        break;
      default:
        endDate = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }

    form.setValue("endDate", endDate);
  };

  const onSubmit = async (data: GoalFormData) => {
    try {
      setIsLoading(true);

      const goalData = {
        ...data,
        targetAmount: data.targetAmount,
        category: data.category === 'all' ? '' : data.category,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      };

      await localStorageManager.createGoal(goalData);

      toast({
        title: "تم إنشاء الهدف بنجاح",
        description: `تم إنشاء هدف "${data.nameAr}" بنجاح`,
      });

      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الهدف",
        description: "حدث خطأ أثناء إنشاء الهدف. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get expense categories for the dropdown
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            إنشاء هدف مالي جديد
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Goal Name in Arabic */}
            <FormField
              control={form.control}
              name="nameAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الهدف</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: هدف الطعام الشهري"
                      {...field}
                      data-testid="input-goal-name-ar"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Goal Name in English (optional, auto-generated) */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم بالإنجليزية (اختياري)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Food goal"
                      {...field}
                      data-testid="input-goal-name-en"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Amount */}
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المبلغ المستهدف (جنيه)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1000"
                      {...field}
                      data-testid="input-goal-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category (optional) */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التصنيف (اختياري)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-goal-category">
                        <SelectValue placeholder="اختر تصنيف أو اتركه فارغاً لجميع المصروفات" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">جميع المصروفات</SelectItem>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Period */}
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الفترة الزمنية</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      updateEndDateBasedOnPeriod(value, watchedStartDate);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-goal-period">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                      <SelectItem value="monthly">شهري</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    تاريخ البداية
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={formatDateForInput(new Date(field.value))}
                      onChange={(e) => {
                        const newStartDate = new Date(e.target.value);
                        field.onChange(newStartDate);
                        updateEndDateBasedOnPeriod(watchedPeriod, newStartDate);
                      }}
                      data-testid="input-goal-start-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    تاريخ النهاية
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={formatDateForInput(new Date(field.value))}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      data-testid="input-goal-end-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                data-testid="button-cancel-goal"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
                data-testid="button-save-goal"
              >
                {isLoading ? "جاري الحفظ..." : "حفظ الهدف"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}