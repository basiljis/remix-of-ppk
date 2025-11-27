import { useEffect, useState } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const TrialPeriodIndicator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkTrialPeriod = async () => {
      if (!user) return;

      // Проверяем наличие активной подписки через серверную функцию,
      // которая учитывает как оплату, так и активацию администратором
      const { data: hasActiveSubscription, error: hasActiveSubscriptionError } = await supabase
        .rpc('has_active_subscription', { _user_id: user.id });

      if (hasActiveSubscriptionError) {
        console.error('Error checking active subscription in TrialPeriodIndicator:', hasActiveSubscriptionError);
      }

      // Если есть активная подписка, не показываем индикатор
      if (hasActiveSubscription) {
        setDaysLeft(null);
        setIsExpired(false);
        return;
      }

      // Проверяем пробный период по дате одобрения заявки
      const { data: accessRequest } = await supabase
        .from('access_requests')
        .select('reviewed_at')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (accessRequest?.reviewed_at) {
        const reviewDate = new Date(accessRequest.reviewed_at);
        const endDate = new Date(reviewDate);
        endDate.setDate(endDate.getDate() + 7);
        setTrialEndDate(endDate);
        
        const now = new Date();
        const timeLeft = endDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
        
        if (daysRemaining > 0) {
          setDaysLeft(daysRemaining);
          setIsExpired(false);
          const progressValue = ((7 - daysRemaining) / 7) * 100;
          setProgress(progressValue);
        } else {
          setDaysLeft(0);
          setIsExpired(true);
          setProgress(100);
        }
      }
    };

    checkTrialPeriod();
  }, [user]);

  if (daysLeft === null && !isExpired) return null;

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
