import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  required: boolean;
}

interface ChecklistCardProps {
  title: string;
  items: ChecklistItem[];
  onItemToggle: (id: string) => void;
  variant: "primary" | "secondary" | "warning";
}

export const ChecklistCard = ({ title, items, onItemToggle, variant }: ChecklistCardProps) => {
  const completedItems = items.filter(item => item.completed).length;
  const totalItems = items.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  
  const requiredItems = items.filter(item => item.required);
  const completedRequired = requiredItems.filter(item => item.completed).length;
  const allRequiredCompleted = completedRequired === requiredItems.length;

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20";
      case "secondary":
        return "bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20";
      case "warning":
        return "bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20";
      default:
        return "";
    }
  };

  const getStatusBadge = () => {
    if (allRequiredCompleted && progress === 100) {
      return <Badge className="bg-success text-success-foreground">Завершено</Badge>;
    }
    if (allRequiredCompleted) {
      return <Badge className="bg-warning text-warning-foreground">Готово к консилиуму</Badge>;
    }
    return <Badge variant="outline">В процессе</Badge>;
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${getVariantStyles()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {getStatusBadge()}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Прогресс: {completedItems}/{totalItems}</span>
            <span>Обязательные: {completedRequired}/{requiredItems.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start space-x-3">
              <Checkbox
                id={item.id}
                checked={item.completed}
                onCheckedChange={() => onItemToggle(item.id)}
                className="mt-0.5"
              />
              <label
                htmlFor={item.id}
                className={`text-sm cursor-pointer flex-1 ${
                  item.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {item.text}
                {item.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};