import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { SessionCalendar } from "./SessionCalendar";
import { OrganizationCalendar } from "./OrganizationCalendar";
import { ChildrenManagement } from "./ChildrenManagement";
import { SpecialistRatesPanel } from "./SpecialistRatesPanel";
import { ScheduleStatistics } from "./ScheduleStatistics";
import { Calendar, Users, UserCog, Lock, Building, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

export function ScheduleModule() {
  const { isAdmin, roles, profile } = useAuth();
  const { hasActiveSubscription, isTrialActive } = useSubscriptionStatus();
  const [activeTab, setActiveTab] = useState("calendar");
  
  const isOrgAdmin = roles.some((r) => r.role === "organization_admin");
  const isRegionalOperator = roles.some((r) => r.role === "regional_operator");
  const canViewOrgCalendar = isAdmin || isOrgAdmin || isRegionalOperator;
  const canAccessSchedule = hasActiveSubscription || isTrialActive || isAdmin;

  if (!canAccessSchedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Модуль расписания
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Доступ к модулю расписания ограничен
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Для использования модуля расписания необходима активная подписка
              или пробный период. Модуль включает календарь занятий с
              drag-and-drop, управление детьми и настройку ставок специалистов.
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Доступно в подписке
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Модуль расписания
          </h2>
          <p className="text-muted-foreground">
            Управление занятиями, детьми и рабочим временем
          </p>
        </div>
        {!hasActiveSubscription && isTrialActive && (
          <Badge variant="outline" className="bg-primary/10">
            Пробный период
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Моё расписание
          </TabsTrigger>
          {canViewOrgCalendar && (
            <TabsTrigger value="org-calendar" className="gap-2">
              <Building className="h-4 w-4" />
              Расписание организации
            </TabsTrigger>
          )}
          {(isAdmin || isOrgAdmin) && (
            <>
              <TabsTrigger value="children" className="gap-2">
                <Users className="h-4 w-4" />
                Дети
              </TabsTrigger>
              <TabsTrigger value="rates" className="gap-2">
                <UserCog className="h-4 w-4" />
                Ставки специалистов
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="statistics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Статистика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <SessionCalendar />
        </TabsContent>

        {canViewOrgCalendar && (
          <TabsContent value="org-calendar" className="mt-6">
            <OrganizationCalendar />
          </TabsContent>
        )}

        {(isAdmin || isOrgAdmin) && (
          <>
            <TabsContent value="children" className="mt-6">
              <ChildrenManagement />
            </TabsContent>
            <TabsContent value="rates" className="mt-6">
              <SpecialistRatesPanel />
            </TabsContent>
          </>
        )}

        <TabsContent value="statistics" className="mt-6">
          <ScheduleStatistics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
