import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertCircle } from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useNavigate } from "react-router-dom";

export const TrialPeriodIndicator = () => {
  const navigate = useNavigate();
  const { 
    hasActiveSubscription, 
    isTrialActive, 
    trialEndDate, 
    daysLeft, 
    progress 
  } = useSubscriptionStatus();

  // Не показываем индикатор, если есть активная подписка или нет пробного периода
  if (hasActiveSubscription || (!isTrialActive && daysLeft === null)) return null;

  const isExpired = daysLeft === 0;

  if (isExpired) {
    return (
      <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-destructive/10 border border-destructive/30 rounded-lg">
        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-destructive">
            Пробный период завершен {trialEndDate?.toLocaleDateString('ru-RU')}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/profile')}
            className="h-6 text-xs"
          >
            Оформить подписку
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <div className="flex flex-col gap-1 min-w-[140px]">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Пробный период
          </span>
          <span className="text-xs text-blue-700 dark:text-blue-300">
            {daysLeft} {daysLeft === 1 ? 'день' : daysLeft! < 5 ? 'дня' : 'дней'}
          </span>
        </div>
        <Progress 
          value={progress} 
          className="h-1.5 bg-blue-100 dark:bg-blue-900/40"
        />
      </div>
    </div>
  );
};
