import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrganizationSubscriptionAccess {
  hasOrganizationSubscription: boolean;
  organizationSubscriptionEndDate: Date | null;
  loading: boolean;
}

export const useOrganizationSubscription = (): OrganizationSubscriptionAccess => {
  const { user } = useAuth();
  const [access, setAccess] = useState<OrganizationSubscriptionAccess>({
    hasOrganizationSubscription: false,
    organizationSubscriptionEndDate: null,
    loading: true,
  });

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setAccess({
          hasOrganizationSubscription: false,
          organizationSubscriptionEndDate: null,
          loading: false,
        });
        return;
      }

      try {
        // Check organization subscription via RPC
        const { data: hasOrgSub, error: orgSubError } = await supabase
          .rpc('has_organization_subscription', { _user_id: user.id });

        if (orgSubError) {
          console.error('Error checking organization subscription:', orgSubError);
        }

        if (hasOrgSub) {
          // Get end date
          const { data: endDate } = await supabase
            .rpc('get_organization_subscription_end_date', { _user_id: user.id });

          setAccess({
            hasOrganizationSubscription: true,
            organizationSubscriptionEndDate: endDate ? new Date(endDate) : null,
            loading: false,
          });
          return;
        }

        setAccess({
          hasOrganizationSubscription: false,
          organizationSubscriptionEndDate: null,
          loading: false,
        });
      } catch (error) {
        console.error("Error checking organization subscription access:", error);
        setAccess({
          hasOrganizationSubscription: false,
          organizationSubscriptionEndDate: null,
          loading: false,
        });
      }
    };

    checkAccess();
  }, [user]);

  return access;
};
