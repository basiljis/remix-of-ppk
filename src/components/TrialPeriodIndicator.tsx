import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const TrialPeriodIndicator = () => {
  const { user } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkTrialPeriod = async () => {
      if (!user) return;

      // Проверяем наличие активной подписки
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      // Если есть активная подписка, не показываем индикатор
      if (subscription) {
        setDaysLeft(null);
        return;
      }

      // Проверяем пробный период
      const { data: accessRequest } = await supabase
        .from('access_requests')
        .select('reviewed_at')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (accessRequest?.reviewed_at) {
        const reviewDate = new Date(accessRequest.reviewed_at);
        const trialEndDate = new Date(reviewDate);
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        
        const now = new Date();
        const timeLeft = trialEndDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
        
        if (daysRemaining > 0) {
          setDaysLeft(daysRemaining);
          // Прогресс от 0 до 100 (обратный - чем меньше дней, тем больше прогресс)
          const progressValue = ((7 - daysRemaining) / 7) * 100;
          setProgress(progressValue);
        } else {
          setDaysLeft(0);
          setProgress(100);
        }
      }
    };

    checkTrialPeriod();
  }, [user]);

  if (daysLeft === null) return null;

  return (
    <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <div className="flex flex-col gap-1 min-w-[140px]">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Пробный период
          </span>
          <span className="text-xs text-blue-700 dark:text-blue-300">
            {daysLeft} {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}
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
