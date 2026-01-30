import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, AlertTriangle, CheckCircle, 
  Star, Info, Lightbulb, Calendar, Lock
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TestResult {
  id: string;
  result_type: string;
  result_label: string;
  risk_level: string;
  scores: {
    warmth: number;
    control: number;
    involvement: number;
  };
  recommendations: string[];
  completed_at: string;
  is_visible_to_specialists: boolean;
}

interface ChildFamilyContextProps {
  parentChildId: string;
  isLinked: boolean;
}

export function ChildFamilyContext({ parentChildId, isLinked }: ChildFamilyContextProps) {
  // Fetch test results for this child
  const { data: testResults, isLoading } = useQuery({
    queryKey: ["child-family-context", parentChildId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_test_results" as any)
        .select("*")
        .eq("child_id", parentChildId)
        .eq("is_visible_to_specialists", true)
        .order("completed_at", { ascending: false })
        .limit(1) as { data: TestResult[] | null; error: any };
      
      if (error) throw error;
      return (data || [])[0] as TestResult | undefined;
    },
    enabled: isLinked,
  });

  if (!isLinked) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            Семейный контекст
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Ребёнок ещё не привязан к организации
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Данные появятся после добавления ребёнка по коду родителя
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!testResults) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            Семейный контекст
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Info className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Родитель ещё не проходил тесты или не дал согласие на их показ
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case "low":
        return { 
          color: "bg-green-500", 
          bgColor: "bg-green-50 dark:bg-green-950/30",
          textColor: "text-green-700 dark:text-green-300",
          icon: CheckCircle,
          label: "Низкий"
        };
      case "medium":
        return { 
          color: "bg-yellow-500", 
          bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
          textColor: "text-yellow-700 dark:text-yellow-300",
          icon: AlertTriangle,
          label: "Средний"
        };
      case "high":
        return { 
          color: "bg-red-500", 
          bgColor: "bg-red-50 dark:bg-red-950/30",
          textColor: "text-red-700 dark:text-red-300",
          icon: AlertTriangle,
          label: "Высокий"
        };
      default:
        return { 
          color: "bg-gray-500", 
          bgColor: "bg-gray-50 dark:bg-gray-950/30",
          textColor: "text-gray-700 dark:text-gray-300",
          icon: Info,
          label: risk
        };
    }
  };

  const riskConfig = getRiskConfig(testResults.risk_level);
  const RiskIcon = riskConfig.icon;

  // Calculate star rating (1-5 based on warmth and involvement)
  const avgScore = (testResults.scores.warmth + testResults.scores.involvement) / 2;
  const starRating = Math.round(avgScore);

  return (
    <Card className={riskConfig.bgColor}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            Семейный контекст
          </CardTitle>
          <Badge className={`${riskConfig.color} text-white`}>
            <RiskIcon className="h-3 w-3 mr-1" />
            Риск: {riskConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parenting Style */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">ТИП ВОСПИТАНИЯ</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= starRating 
                      ? "text-yellow-500 fill-yellow-500" 
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-lg font-bold">{testResults.result_label}</p>
        </div>

        <Separator />

        {/* Scores */}
        <div>
          <p className="text-sm font-medium mb-3">Показатели:</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">• Эмоциональная теплота</span>
              <span className="font-semibold">{testResults.scores.warmth}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">• Гибкость границ</span>
              <span className="font-semibold">{testResults.scores.control}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">• Вовлечённость</span>
              <span className="font-semibold">{testResults.scores.involvement}/5</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Context for specialists */}
        <div className={`p-3 rounded-lg ${riskConfig.bgColor} border border-current/10`}>
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Контекст для специалистов
          </p>
          <p className="text-sm text-muted-foreground">
            {testResults.result_type === "authoritative" && (
              "Стиль способствует развитию самостоятельности и эмоциональной регуляции. Рекомендуется усилить поддержку в сферах, выявленных по данным мониторинга ППк."
            )}
            {testResults.result_type === "authoritarian" && (
              "Возможны трудности в социальной сфере. Рекомендуется учитывать стиль при интерпретации данных по эмоциональному развитию."
            )}
            {testResults.result_type === "permissive" && (
              "Возможны трудности с самоорганизацией. Рекомендуется обратить внимание на развитие волевых качеств."
            )}
            {testResults.result_type === "uninvolved" && (
              "Рекомендуется консультация психолога. Важно учитывать семейный контекст при оценке всех сфер развития."
            )}
          </p>
        </div>

        {/* Update date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Последнее обновление
          </span>
          <span>{format(new Date(testResults.completed_at), "dd.MM.yyyy", { locale: ru })}</span>
        </div>
        <p className="text-xs text-muted-foreground italic">
          Периодичность актуализации — 1 раз в 6 месяцев
        </p>
      </CardContent>
    </Card>
  );
}
