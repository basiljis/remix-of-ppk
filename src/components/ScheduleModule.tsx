import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { SessionCalendar } from "./SessionCalendar";
import { ChildrenManagement } from "./ChildrenManagement";
import { SpecialistRatesPanel } from "./SpecialistRatesPanel";
import { Calendar, Users, UserCog, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

export function ScheduleModule() {
  const { isAdmin, roles, profile } = useAuth();
  const { hasActiveSubscription, isTrialActive } = useSubscriptionStatus();
  const [activeTab, setActiveTab] = useState("calendar");
  
  const isOrgAdmin = roles.some((r) => r.role === "organization_admin");
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
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Моё расписание
          </TabsTrigger>
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
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <SessionCalendar />
        </TabsContent>

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
      </Tabs>
    </div>
  );
}