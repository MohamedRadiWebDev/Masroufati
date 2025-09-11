import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Target, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { localStorageManager } from "@/lib/localStorage-storage";
import { type Goal } from "@shared/schema";
import { AddGoalModal } from "@/components/add-goal-modal";
import BottomNavigation from "@/components/bottom-navigation";

export default function Goals() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: goals = [], isLoading, refetch } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    queryFn: () => localStorageManager.getGoals(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => localStorageManager.getCategories(),
  });

  // Get progress for each goal
  const getGoalProgress = async (goal: Goal) => {
    return await localStorageManager.getGoalProgress(goal.id);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 50) return "bg-green-500";
    if (percentage <= 80) return "bg-yellow-500";
    return "bg-red-500";
  };

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
    <div className="mobile-container" dir="rtl">
      <div className="mobile-header">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">الأهداف المالية</h1>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          size="sm"
          data-testid="button-add-goal"
        >
          <Plus className="h-4 w-4 ml-2" />
          هدف جديد
        </Button>
      </div>

      <div className="mobile-content space-y-4">
        {goals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد أهداف مالية</h3>
              <p className="text-muted-foreground mb-4">
                ابدأ بوضع أهدافك المالية لتتبع مصروفاتك بشكل أفضل
              </p>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                data-testid="button-create-first-goal"
              >
                <Plus className="h-4 w-4 ml-2" />
                إنشاء هدف جديد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {goals.map((goal) => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                categories={categories}
                onRefresh={refetch}
              />
            ))}
          </>
        )}
      </div>

      <AddGoalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsAddModalOpen(false);
        }}
        categories={categories}
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="goals" />
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  categories: any[];
  onRefresh: () => void;
}

function GoalCard({ goal, categories }: GoalCardProps) {
  const [progress, setProgress] = useState<{ spent: number; percentage: number; remaining: number } | null>(null);

  // Load progress on mount
  useState(() => {
    localStorageManager.getGoalProgress(goal.id).then(setProgress);
  });

  const category = categories.find(c => c.name === goal.category);
  const targetAmount = parseFloat(goal.targetAmount);
  const spent = progress?.spent || 0;
  const percentage = progress?.percentage || 0;
  const remaining = progress?.remaining || targetAmount;

  const isOverBudget = percentage > 100;
  const isWarning = percentage > 80 && percentage <= 100;

  const getStatusBadge = (goal: Goal) => {
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    
    if (goal.isActive !== 'true') {
      return <Badge variant="secondary">غير نشط</Badge>;
    }
    
    if (now < startDate) {
      return <Badge variant="outline">لم يبدأ</Badge>;
    }
    
    if (now > endDate) {
      return <Badge variant="destructive">منتهي</Badge>;
    }
    
    return <Badge variant="default">نشط</Badge>;
  };

  return (
    <Card className="overflow-hidden" data-testid={`card-goal-${goal.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1" data-testid={`text-goal-name-${goal.id}`}>
              {goal.nameAr}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {category && (
                <Badge variant="outline" className="text-xs">
                  {category.nameAr}
                </Badge>
              )}
              <span>{goal.period === 'monthly' ? 'شهري' : goal.period === 'weekly' ? 'أسبوعي' : 'يومي'}</span>
            </div>
          </div>
          {getStatusBadge(goal)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>المصروف: {spent.toFixed(2)} جنيه</span>
            <span className={isOverBudget ? "text-red-600 font-semibold" : ""}>
              {percentage.toFixed(0)}%
            </span>
          </div>
          
          <Progress 
            value={Math.min(percentage, 100)} 
            className="h-2"
            data-testid={`progress-goal-${goal.id}`}
          />
          
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>الهدف: {targetAmount.toFixed(2)} جنيه</span>
            <span className={isOverBudget ? "text-red-600 font-semibold" : ""}>
              {isOverBudget 
                ? `تجاوز بـ ${(spent - targetAmount).toFixed(2)} جنيه`
                : `متبقي: ${remaining.toFixed(2)} جنيه`
              }
            </span>
          </div>
        </div>

        {/* Warning Messages */}
        {(isWarning || isOverBudget) && (
          <div className={`flex items-center gap-2 p-2 rounded-md text-sm ${
            isOverBudget 
              ? 'bg-red-50 text-red-800 border border-red-200' 
              : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}>
            <AlertTriangle className="h-4 w-4" />
            <span>
              {isOverBudget 
                ? 'تم تجاوز الهدف المحدد!' 
                : 'اقتربت من حد الهدف المحدد'
              }
            </span>
          </div>
        )}

        {/* Date Range */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            من {new Date(goal.startDate).toLocaleDateString('ar-EG')} 
            إلى {new Date(goal.endDate).toLocaleDateString('ar-EG')}
          </span>
        </div>

        {/* Trend Indicator */}
        {progress && (
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className={`h-3 w-3 ${
              percentage <= 70 ? 'text-green-600' : 
              percentage <= 90 ? 'text-yellow-600' : 'text-red-600'
            }`} />
            <span className="text-muted-foreground">
              {percentage <= 70 ? 'على المسار الصحيح' : 
               percentage <= 90 ? 'يحتاج انتباه' : 'خارج المسار'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}