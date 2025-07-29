import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChecklistSection } from "@/data/checklistData";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface StatisticsPanelProps {
  sections: ChecklistSection[];
}

export const StatisticsPanel = ({ sections }: StatisticsPanelProps) => {
  const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
  const completedItems = sections.reduce(
    (acc, section) => acc + section.items.filter(item => item.completed).length,
    0
  );
  const totalRequired = sections.reduce(
    (acc, section) => acc + section.items.filter(item => item.required).length,
    0
  );
  const completedRequired = sections.reduce(
    (acc, section) => acc + section.items.filter(item => item.required && item.completed).length,
    0
  );

  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const requiredProgress = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;

  const readinessStatus = () => {
    if (completedRequired === totalRequired && completedItems === totalItems) {
      return { status: "Полностью готов", color: "text-success", icon: CheckCircle };
    }
    if (completedRequired === totalRequired) {
      return { status: "Готов к консилиуму", color: "text-warning", icon: Clock };
    }
    return { status: "Требуется подготовка", color: "text-destructive", icon: AlertTriangle };
  };

  const { status, color, icon: StatusIcon } = readinessStatus();

  return (
    <Card className="bg-gradient-to-br from-card to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${color}`} />
          Статистика готовности
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{completedItems}/{totalItems}</div>
            <div className="text-sm text-muted-foreground">Всего задач</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{completedRequired}/{totalRequired}</div>
            <div className="text-sm text-muted-foreground">Обязательные</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Общий прогресс</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Обязательные задачи</span>
              <span>{Math.round(requiredProgress)}%</span>
            </div>
            <Progress value={requiredProgress} className="h-2" />
          </div>
        </div>

        <div className="text-center">
          <div className={`font-semibold ${color}`}>{status}</div>
        </div>
      </CardContent>
    </Card>
  );
};