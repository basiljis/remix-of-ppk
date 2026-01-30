import { useAuth } from "@/hooks/useAuth";
import { useOrganizationSubscription } from "@/hooks/useOrganizationSubscription";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Building, Loader2, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OrganizationCalendar } from "./OrganizationCalendar";
import { SpecialistRatesPanel } from "./SpecialistRatesPanel";
import { OrganizationEmployees } from "./OrganizationEmployees";
import { OrganizationStatistics } from "./OrganizationStatistics";
import { OrganizationKPIManagement } from "./OrganizationKPIManagement";
import { OrganizationHolidaysPanel } from "./OrganizationHolidaysPanel";
import { HolidaySessionRequestsPanel } from "./HolidaySessionRequestsPanel";
import { OrganizationRegistrationSettings } from "./OrganizationRegistrationSettings";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "./ui/badge";

interface OrganizationModuleProps {
  activeSubTab?: string;
}

export function OrganizationModule({ activeSubTab = "employees" }: OrganizationModuleProps) {
  const { roles, profile, isAdmin, user } = useAuth();
  const { hasOrganizationSubscription, organizationSubscriptionEndDate, loading: subscriptionLoading } = useOrganizationSubscription();
  
  const isOrgAdmin = roles.some((r) => r.role === "organization_admin");
  const isDirector = roles.some((r) => r.role === "director");
  
  // Fetch employee permissions to check org_view access
  const { data: employeePermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["my-employee-permissions", user?.id, profile?.organization_id],
    queryFn: async () => {
      if (!user || !profile?.organization_id) return null;
      
      const { data, error } = await supabase
        .from("employee_permissions")
        .select("org_view, org_edit")
        .eq("user_id", user.id)
        .eq("organization_id", profile.organization_id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!profile?.organization_id,
  });

  // Check if user has access to organization module
  const hasRoleAccess = isOrgAdmin || isDirector || isAdmin;
  const hasPermissionAccess = employeePermissions?.org_view === true;
  const hasAccess = hasRoleAccess || hasPermissionAccess;

  // Check if organization subscription is required
  const requiresOrgSubscription = !isAdmin; // Admins don't need subscription
  const hasRequiredSubscription = !requiresOrgSubscription || hasOrganizationSubscription;

  const isLoading = subscriptionLoading || permissionsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check role/permission access first
  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>У вас нет доступа к этому разделу.</p>
            <p className="text-sm">Обратитесь к администратору организации для получения прав доступа.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Then check subscription
  if (!hasRequiredSubscription) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium text-foreground">Требуется подписка на организацию</p>
            <p className="text-sm mt-2">
              Для доступа к разделу "Организация" необходима активная подписка на уровне организации.
            </p>
            <p className="text-sm mt-1">
              Обратитесь к администратору системы для оформления подписки.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderContent = () => {
    switch (activeSubTab) {
      case "employees":
      case "module":
        return <OrganizationEmployees />;
      case "schedule":
        return <OrganizationCalendar />;
      case "rates":
        return <SpecialistRatesPanel />;
      case "statistics":
        return <OrganizationStatistics />;
      case "kpi":
        return <OrganizationKPIManagement />;
      case "holidays":
        return <OrganizationHolidaysPanel />;
      case "requests":
        return <HolidaySessionRequestsPanel />;
      case "settings":
        return <OrganizationRegistrationSettings />;
      default:
        return <OrganizationEmployees />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Организация</h2>
          <p className="text-muted-foreground">
            Управление сотрудниками, расписанием и статистикой организации
          </p>
        </div>
        {hasOrganizationSubscription && organizationSubscriptionEndDate && (
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Подписка до {format(organizationSubscriptionEndDate, "dd.MM.yyyy", { locale: ru })}
          </Badge>
        )}
      </div>

      {renderContent()}
    </div>
  );
}
