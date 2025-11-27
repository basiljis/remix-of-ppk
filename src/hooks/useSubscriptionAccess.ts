import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionAccess {
  hasActiveSubscription: boolean;
  isTrialActive: boolean;
  trialEndDate: Date | null;
  canCreateProtocols: boolean;
  canViewProtocols: boolean;
  loading: boolean;
}

export const useSubscriptionAccess = (): SubscriptionAccess => {
  const { user } = useAuth();
  const [access, setAccess] = useState<SubscriptionAccess>({
    hasActiveSubscription: false,
    isTrialActive: false,
    trialEndDate: null,
    canCreateProtocols: false,
    canViewProtocols: true, // Всегда можем просматривать протоколы в течение 3 лет
    loading: true,
  });

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setAccess({
          hasActiveSubscription: false,
          isTrialActive: false,
          trialEndDate: null,
          canCreateProtocols: false,
          canViewProtocols: false,
          loading: false,
        });
        return;
      }

      try {
        // Сначала проверяем активную подписку через серверную функцию,
        // которая учитывает все сценарии активации (оплата, активация администратором и т.п.)
        const { data: hasActiveSubscription, error: hasActiveSubscriptionError } = await supabase
          .rpc('has_active_subscription', { _user_id: user.id });

        if (hasActiveSubscriptionError) {
          console.error('Error checking active subscription via RPC:', hasActiveSubscriptionError);
        }

        if (hasActiveSubscription) {
          setAccess({
            hasActiveSubscription: true,
            isTrialActive: false,
            trialEndDate: null,
            canCreateProtocols: true,
            canViewProtocols: true,
            loading: false,
          });
          return;
        }

        // Если активной подписки нет, дополнительно проверяем по таблице подписок
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString())
          .maybeSingle();

        if (subscription) {
          setAccess({
            hasActiveSubscription: true,
            isTrialActive: false,
            trialEndDate: null,
            canCreateProtocols: true,
            canViewProtocols: true,
            loading: false,
          });
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
          const endDate = new Date(reviewDate);
          endDate.setDate(endDate.getDate() + 7);
          
          const now = new Date();
          const isActive = now < endDate;

          setAccess({
            hasActiveSubscription: false,
            isTrialActive: isActive,
            trialEndDate: endDate,
            canCreateProtocols: isActive,
            canViewProtocols: true,
            loading: false,
          });
        } else {
          setAccess({
            hasActiveSubscription: false,
            isTrialActive: false,
            trialEndDate: null,
            canCreateProtocols: false,
            canViewProtocols: true,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Error checking subscription access:", error);
        setAccess({
          hasActiveSubscription: false,
          isTrialActive: false,
          trialEndDate: null,
          canCreateProtocols: false,
          canViewProtocols: true,
          loading: false,
        });
      }
    };

    checkAccess();
  }, [user]);

  return access;
};
