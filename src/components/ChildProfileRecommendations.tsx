import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface Protocol {
  id: string;
  created_at: string;
  checklist_data: any;
}

interface Props {
  protocols: Protocol[];
}

export function ChildProfileRecommendations({ protocols }: Props) {
  // Calculate block scores for comparison
  const calculateBlockScores = (protocol: Protocol) => {
    if (!protocol.checklist_data?.blocks) return {};

    const blockScores: { [key: string]: number } = {};
    
    protocol.checklist_data.blocks.forEach((block: any) => {
      if (block.items && Array.isArray(block.items)) {
        const scores = block.items.map((item: any) => item.score || 0);
        const average = scores.length > 0 
          ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
          : 0;
        blockScores[block.name] = Math.round(average * 100);
      }
    });

    return blockScores;
  };

  if (protocols.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Автоматические рекомендации
          </CardTitle>
          <CardDescription>
            Недостаточно данных для анализа динамики. Требуется минимум 2 протокола.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const firstProtocol = protocols[0];
  const lastProtocol = protocols[protocols.length - 1];

  const firstScores = calculateBlockScores(firstProtocol);
  const lastScores = calculateBlockScores(lastProtocol);

  // Analyze trends
  const improvements: string[] = [];
  const declines: string[] = [];
  const stable: string[] = [];

  Object.keys(lastScores).forEach(blockName => {
    const first = firstScores[blockName] || 0;
    const last = lastScores[blockName] || 0;
    const change = last - first;

    if (change > 10) {
      improvements.push(`${blockName}: улучшение на ${change}%`);
    } else if (change < -10) {
      declines.push(`${blockName}: снижение на ${Math.abs(change)}%`);
    } else {
      stable.push(blockName);
    }
  });

  // Generate recommendations
  const recommendations: { type: "success" | "warning" | "info"; text: string }[] = [];

  if (improvements.length > 0) {
    recommendations.push({
      type: "success",
      text: `Отличная динамика в следующих областях: ${improvements.join(", ")}. Рекомендуется продолжить применяемые методики.`,
    });
  }

  if (declines.length > 0) {
    recommendations.push({
      type: "warning",
      text: `Требуется усиление работы в областях: ${declines.join(", ")}. Рекомендуется пересмотреть подходы и увеличить интенсивность занятий.`,
    });
  }

  if (stable.length > 0 && stable.length <= 3) {
    recommendations.push({
      type: "info",
      text: `Стабильные показатели в областях: ${stable.join(", ")}. Рекомендуется поддерживать текущий уровень работы.`,
    });
  }

  // Overall progress
  const overallFirst = Object.values(firstScores).reduce((a, b) => a + b, 0) / Object.values(firstScores).length;
  const overallLast = Object.values(lastScores).reduce((a, b) => a + b, 0) / Object.values(lastScores).length;
  const overallChange = Math.round(overallLast - overallFirst);

  recommendations.push({
    type: overallChange > 0 ? "success" : overallChange < 0 ? "warning" : "info",
    text: `Общая динамика за период наблюдения: ${overallChange > 0 ? "положительная" : overallChange < 0 ? "отрицательная" : "стабильная"} (${overallChange > 0 ? "+" : ""}${overallChange}%). ${
      overallChange > 5
        ? "Ребёнок демонстрирует уверенный прогресс."
        : overallChange < -5
        ? "Необходима корректировка индивидуального образовательного маршрута."
        : "Требуется продолжение систематических занятий."
    }`,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Автоматические рекомендации
        </CardTitle>
        <CardDescription>
          На основе анализа {protocols.length} протоколов за период с{" "}
          {new Date(firstProtocol.created_at).toLocaleDateString("ru-RU")} по{" "}
          {new Date(lastProtocol.created_at).toLocaleDateString("ru-RU")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => (
          <Alert key={index} variant={rec.type === "warning" ? "destructive" : "default"}>
            <div className="flex items-start gap-3">
              {rec.type === "success" && (
                <CheckCircle className="h-5 w-5 text-success-foreground" />
              )}
              {rec.type === "warning" && (
                <AlertTriangle className="h-5 w-5" />
              )}
              {rec.type === "info" && (
                <TrendingUp className="h-5 w-5 text-primary" />
              )}
              <AlertDescription className="flex-1">{rec.text}</AlertDescription>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
