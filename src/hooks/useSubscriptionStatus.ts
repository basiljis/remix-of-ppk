import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays, addDays } from "date-fns";

interface SubscriptionInfo {
  endDate: string | null;
  paymentType: string | null;
  adminNotes: string | null;
  isOrganizationSubscription?: boolean;
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  hasOrganizationSubscription: boolean;
  isTrialActive: boolean;
  trialEndDate: Date | null;
  daysLeft: number | null;
  progress: number;
  canCreateProtocols: boolean;
  canViewProtocols: boolean;
  canAccessSchedule: boolean;
  canAccessOrganization: boolean;
  subscriptionInfo: SubscriptionInfo | null;
  loading: boolean;
}

export const useSubscriptionStatus = (): SubscriptionStatus => {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    hasOrganizationSubscription: false,
    isTrialActive: false,
    trialEndDate: null,
    daysLeft: null,
    progress: 0,
    canCreateProtocols: false,
    canViewProtocols: true,
    canAccessSchedule: false,
    canAccessOrganization: false,
    subscriptionInfo: null,
    loading: true,
  });

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setStatus({
          hasActiveSubscription: false,
          hasOrganizationSubscription: false,
          isTrialActive: false,
          trialEndDate: null,
          daysLeft: null,
          progress: 0,
          canCreateProtocols: false,
          canViewProtocols: false,
          canAccessSchedule: false,
          canAccessOrganization: false,
          subscriptionInfo: null,
          loading: false,
        });
        return;
      }

      try {
        const organizationId = profile?.organization_id;

        // 1. Проверяем любую активную подписку пользователя (личную или с organization_id)
        const { data: userSubscription } = await supabase
          .from('subscriptions')
          .select('end_date, payment_type, admin_notes, organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString())
          .order('end_date', { ascending: false })
          .maybeSingle();

        // 2. Проверяем подписку организации пользователя (если он привязан к организации, 
        // и подписка организации оформлена на другого user_id)
        let orgSubscription = null;
        if (organizationId) {
          const { data: orgSub } = await supabase
            .from('subscriptions')
            .select('end_date, payment_type, admin_notes, organization_id')
            .eq('organization_id', organizationId)
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString())
            .order('end_date', { ascending: false })
            .maybeSingle();
          
          orgSubscription = orgSub;
        }

        const hasUserSubscription = !!userSubscription;
        const hasOrgSubscription = !!orgSubscription;
        const hasAnyActiveSubscription = hasUserSubscription || hasOrgSubscription;

        // Определяем, является ли подписка организационной:
        // - если есть подписка организации профиля (orgSubscription), или
        // - если личная подписка пользователя привязана к организации (userSubscription.organization_id)
        const isOrgSubscription = hasOrgSubscription || (hasUserSubscription && !!userSubscription?.organization_id);

        if (hasAnyActiveSubscription) {
          // Выбираем активную подписку для отображения информации
          // Приоритет: подписка пользователя (она может быть и с organization_id)
          const activeSubscription = userSubscription || orgSubscription;
          
          setStatus({
            hasActiveSubscription: hasAnyActiveSubscription,
            hasOrganizationSubscription: isOrgSubscription,
            isTrialActive: false,
            trialEndDate: null,
            daysLeft: null,
            progress: 100,
            canCreateProtocols: true,
            canViewProtocols: true,
            canAccessSchedule: true, // Доступ к расписанию при любой активной подписке
            canAccessOrganization: isOrgSubscription, // Доступ к организации при подписке организации
            subscriptionInfo: activeSubscription ? {
              endDate: activeSubscription.end_date,
              paymentType: activeSubscription.payment_type,
              adminNotes: activeSubscription.admin_notes,
              isOrganizationSubscription: isOrgSubscription,
            } : null,
            loading: false,
          });
          return;
        }

        // 3. Проверяем пробный период
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
            hasOrganizationSubscription: false,
            isTrialActive: isActive,
            trialEndDate: endDate,
            daysLeft: Math.max(0, remainingDays),
            progress,
            canCreateProtocols: isActive,
            canViewProtocols: true,
            canAccessSchedule: isActive,
            canAccessOrganization: isActive,
            subscriptionInfo: null,
            loading: false,
          });
        } else {
          setStatus({
            hasActiveSubscription: false,
            hasOrganizationSubscription: false,
            isTrialActive: false,
            trialEndDate: null,
            daysLeft: null,
            progress: 0,
            canCreateProtocols: false,
            canViewProtocols: true,
            canAccessSchedule: false,
            canAccessOrganization: false,
            subscriptionInfo: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
        setStatus({
          hasActiveSubscription: false,
          hasOrganizationSubscription: false,
          isTrialActive: false,
          trialEndDate: null,
          daysLeft: null,
          progress: 0,
          canCreateProtocols: false,
          canViewProtocols: true,
          canAccessSchedule: false,
          canAccessOrganization: false,
          subscriptionInfo: null,
          loading: false,
        });
      }
    };

    checkStatus();
  }, [user, profile?.organization_id]);

  return status;
};
