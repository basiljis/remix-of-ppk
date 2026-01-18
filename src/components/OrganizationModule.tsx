import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Users, Calendar, UserCog, BarChart3, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationCalendar } from "./OrganizationCalendar";
import { SpecialistRatesPanel } from "./SpecialistRatesPanel";
import { OrganizationEmployees } from "./OrganizationEmployees";
import { OrganizationStatistics } from "./OrganizationStatistics";
import { useState } from "react";

export function OrganizationModule() {
  const { roles, profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("employees");
  
  const isOrgAdmin = roles.some((r) => r.role === "organization_admin");
  const isDirector = roles.some((r) => r.role === "director");
  
  // Only show for org admin, director, or admin
  if (!isOrgAdmin && !isDirector && !isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>У вас нет доступа к этому разделу.</p>
            <p className="text-sm">Обратитесь к администратору организации.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Организация</h2>
        <p className="text-muted-foreground">
          Управление сотрудниками, расписанием и статистикой организации
        </p>
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
      </Tabs>
    </div>
  );
}
