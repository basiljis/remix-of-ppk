import { useAuth } from "@/hooks/useAuth";
import { SessionCalendar } from "./SessionCalendar";
import { ChildrenManagement } from "./ChildrenManagement";
import { ScheduleStatistics } from "./ScheduleStatistics";
import { Calendar, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

interface ScheduleModuleProps {
  activeSubTab?: string;
}

export function ScheduleModule({ activeSubTab = "calendar" }: ScheduleModuleProps) {
  const { isAdmin, roles } = useAuth();
  const { canAccessSchedule: hasSubscriptionAccess, isTrialActive } = useSubscriptionStatus();
  
  const isOrgAdmin = roles.some((r) => r.role === "organization_admin");
  const isRegionalOperator = roles.some((r) => r.role === "regional_operator");
  // Доступ при: индивидуальной подписке, подписке организации, триале или для админа
  const canAccessSchedule = hasSubscriptionAccess || isTrialActive || isAdmin;

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

  const renderContent = () => {
    switch (activeSubTab) {
      case "calendar":
      case "module":
        return <SessionCalendar />;
      case "children":
        return <ChildrenManagement />;
      case "statistics":
        return <ScheduleStatistics />;
      default:
        return <SessionCalendar />;
    }
  };

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
        {!hasSubscriptionAccess && isTrialActive && (
          <Badge variant="outline" className="bg-primary/10">
            Пробный период
          </Badge>
        )}
      </div>

      {renderContent()}
    </div>
  );
}
