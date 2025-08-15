import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Settings } from "lucide-react";
import { AdminPanel } from "@/components/AdminPanel";
import { OrganizationsManagement } from "@/components/OrganizationsManagement";

export const Administration = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
          Администрирование системы
        </h2>
        <p className="text-muted-foreground">
          Управление организациями и настройка чеклистов протокола ППк
        </p>
      </div>

      <Tabs defaultValue="organizations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Управление организациями
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Управление чеклистом
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Управление организациями
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Просмотр, добавление и редактирование образовательных организаций в системе
              </p>
            </CardContent>
          </Card>
          <OrganizationsManagement />
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Управление чеклистом протокола
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Настройка элементов чеклиста для различных уровней образования
              </p>
            </CardContent>
          </Card>
          <AdminPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};