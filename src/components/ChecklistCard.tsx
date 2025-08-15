import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportChecklistToXLS } from "@/utils/exportUtils";
import { useToast } from "@/components/ui/use-toast";

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
  level?: string;
}

export const ChecklistCard = ({ title, items, onItemToggle, variant, level }: ChecklistCardProps) => {
  const { toast } = useToast();
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

  const handleExportToXLS = () => {
    try {
      const mappedItems = items.map(item => ({
        text: item.text,
        isRequired: item.required,
        isCompleted: item.completed
      }));
      
      const fileName = exportChecklistToXLS(mappedItems, level || 'unknown');
      toast({
        title: "Экспорт завершен",
        description: `Чек-лист экспортирован в файл ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать чек-лист",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${getVariantStyles()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToXLS}
              className="text-green-600 hover:text-green-800"
            >
              <Download className="h-4 w-4 mr-1" />
              XLS
            </Button>
          </div>
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
            <div key={item.id} className={`flex items-start space-x-3 p-2 rounded ${item.required && !item.completed ? "bg-destructive/5 border border-destructive/20" : ""}`}>
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
                } ${item.required && !item.completed ? "font-medium" : ""}`}
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