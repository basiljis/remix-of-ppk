import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays, addDays } from "date-fns";

interface SubscriptionInfo {
  endDate: string | null;
  paymentType: string | null;
  adminNotes: string | null;
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isTrialActive: boolean;
  trialEndDate: Date | null;
  daysLeft: number | null;
  progress: number;
  canCreateProtocols: boolean;
  canViewProtocols: boolean;
  subscriptionInfo: SubscriptionInfo | null;
  loading: boolean;
}

export const useSubscriptionStatus = (): SubscriptionStatus => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    isTrialActive: false,
    trialEndDate: null,
    daysLeft: null,
    progress: 0,
    canCreateProtocols: false,
    canViewProtocols: true,
    subscriptionInfo: null,
    loading: true,
  });

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setStatus({
          hasActiveSubscription: false,
          isTrialActive: false,
          trialEndDate: null,
          daysLeft: null,
          progress: 0,
          canCreateProtocols: false,
          canViewProtocols: false,
          subscriptionInfo: null,
          loading: false,
        });
        return;
      }

      try {
        // Проверяем активную подписку через серверную функцию
        const { data: hasActiveSubscription, error: rpcError } = await supabase
          .rpc('has_active_subscription', { _user_id: user.id });

        if (rpcError) {
          console.error('Error checking active subscription:', rpcError);
        }

        if (hasActiveSubscription) {
          // Получаем детальную информацию о подписке
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('end_date, payment_type, admin_notes')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString())
            .order('created_at', { ascending: false })
            .maybeSingle();

          setStatus({
            hasActiveSubscription: true,
            isTrialActive: false,
            trialEndDate: null,
            daysLeft: null,
            progress: 100,
            canCreateProtocols: true,
            canViewProtocols: true,
            subscriptionInfo: subscription ? {
              endDate: subscription.end_date,
              paymentType: subscription.payment_type,
              adminNotes: subscription.admin_notes,
            } : null,
            loading: false,
          });
          return;
        }

        // Дополнительная проверка по таблице подписок
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString())
          .maybeSingle();

        if (subscription) {
          setStatus({
            hasActiveSubscription: true,
            isTrialActive: false,
            trialEndDate: null,
            daysLeft: null,
            progress: 100,
            canCreateProtocols: true,
            canViewProtocols: true,
            subscriptionInfo: {
              endDate: subscription.end_date,
              paymentType: subscription.payment_type,
              adminNotes: subscription.admin_notes,
            },
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
          const endDate = addDays(reviewDate, 7);
          const now = new Date();
          const remainingDays = differenceInDays(endDate, now);
          const isActive = remainingDays >= 0;
          const progress = isActive ? ((7 - remainingDays) / 7) * 100 : 100;

          setStatus({
            hasActiveSubscription: false,
            isTrialActive: isActive,
            trialEndDate: endDate,
            daysLeft: Math.max(0, remainingDays),
            progress,
            canCreateProtocols: isActive,
            canViewProtocols: true,
            subscriptionInfo: null,
            loading: false,
          });
        } else {
          setStatus({
            hasActiveSubscription: false,
            isTrialActive: false,
            trialEndDate: null,
            daysLeft: null,
            progress: 0,
            canCreateProtocols: false,
            canViewProtocols: true,
            subscriptionInfo: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
        setStatus({
          hasActiveSubscription: false,
          isTrialActive: false,
          trialEndDate: null,
          daysLeft: null,
          progress: 0,
          canCreateProtocols: false,
          canViewProtocols: true,
          subscriptionInfo: null,
          loading: false,
        });
      }
    };

    checkStatus();
  }, [user]);

  return status;
};
