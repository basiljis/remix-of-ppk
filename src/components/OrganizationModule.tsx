import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationSubscription } from "@/hooks/useOrganizationSubscription";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, UserCog, BarChart3, Building, Loader2, Lock, Target, CalendarOff, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationCalendar } from "./OrganizationCalendar";
import { SpecialistRatesPanel } from "./SpecialistRatesPanel";
import { OrganizationEmployees } from "./OrganizationEmployees";
import { OrganizationStatistics } from "./OrganizationStatistics";
import { OrganizationKPIManagement } from "./OrganizationKPIManagement";
import { OrganizationHolidaysPanel } from "./OrganizationHolidaysPanel";
import { HolidaySessionRequestsPanel } from "./HolidaySessionRequestsPanel";
import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "./ui/badge";

export function OrganizationModule() {
  const { roles, profile, isAdmin, user } = useAuth();
  const { hasOrganizationSubscription, organizationSubscriptionEndDate, loading: subscriptionLoading } = useOrganizationSubscription();
  const [activeTab, setActiveTab] = useState("employees");
  
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" />
            Сотрудники
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="h-4 w-4" />
            Расписание организации
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-2">
            <UserCog className="h-4 w-4" />
            Ставки специалистов
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Статистика
          </TabsTrigger>
          <TabsTrigger value="kpi" className="gap-2">
            <Target className="h-4 w-4" />
            KPI сотрудников
          </TabsTrigger>
          <TabsTrigger value="holidays" className="gap-2">
            <CalendarOff className="h-4 w-4" />
            Нерабочие дни
          </TabsTrigger>
          <TabsTrigger value="holiday-requests" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Запросы на согласование
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-6">
          <OrganizationEmployees />
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <OrganizationCalendar />
        </TabsContent>

        <TabsContent value="rates" className="mt-6">
          <SpecialistRatesPanel />
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <OrganizationStatistics />
        </TabsContent>

        <TabsContent value="kpi" className="mt-6">
          <OrganizationKPIManagement />
        </TabsContent>

        <TabsContent value="holidays" className="mt-6">
          <OrganizationHolidaysPanel />
        </TabsContent>

        <TabsContent value="holiday-requests" className="mt-6">
          <HolidaySessionRequestsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
