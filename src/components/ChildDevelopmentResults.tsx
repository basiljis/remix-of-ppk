import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, TrendingUp, Brain, MessageCircle, Heart, Hand, Users, Calendar, ChevronRight, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";

interface DevelopmentTestResult {
  id: string;
  child_id: string;
  completed_at: string;
  next_test_date: string | null;
  overall_risk_level: string;
  sphere_scores: Record<string, number>;
  recommendations: any;
}

interface ChildDevelopmentResultsProps {
  childId: string;
  compact?: boolean;
  onViewDetails?: (result: DevelopmentTestResult) => void;
}

const sphereConfig: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  motor: { 
    name: "Моторика", 
    icon: <Hand className="h-4 w-4" />, 
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" 
  },
  speech: { 
    name: "Речь", 
    icon: <MessageCircle className="h-4 w-4" />, 
    color: "text-green-600 bg-green-100 dark:bg-green-900/30" 
  },
  cognitive: { 
    name: "Познание", 
    icon: <Brain className="h-4 w-4" />, 
    color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30" 
  },
  social: { 
    name: "Социальное", 
    icon: <Users className="h-4 w-4" />, 
    color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30" 
  },
  emotional: { 
    name: "Эмоции", 
    icon: <Heart className="h-4 w-4" />, 
    color: "text-pink-600 bg-pink-100 dark:bg-pink-900/30" 
  },
};

const getRiskLevelConfig = (level: string) => {
  switch (level) {
    case "normal":
      return { label: "Норма", color: "bg-green-500 text-white" };
    case "attention":
      return { label: "Внимание", color: "bg-yellow-500 text-white" };
    case "help_needed":
      return { label: "Нужна помощь", color: "bg-red-500 text-white" };
    default:
      return { label: level, color: "bg-gray-500 text-white" };
  }
};

export function ChildDevelopmentResults({ 
  childId, 
  compact = false,
  onViewDetails 
}: ChildDevelopmentResultsProps) {
  const { data: results, isLoading } = useQuery({
    queryKey: ["development-test-results-child", childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("development_test_results" as any)
        .select("*")
        .eq("child_id", childId)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false })
        .limit(5) as { data: DevelopmentTestResult[] | null; error: any };
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!results || results.length === 0) {
    return null;
  }

  const latestResult = results[0];
  const riskConfig = getRiskLevelConfig(latestResult.overall_risk_level);
  const scores = latestResult.sphere_scores || {};
  
  // Check if next test is due
  const daysUntilNextTest = latestResult.next_test_date 
    ? differenceInDays(new Date(latestResult.next_test_date), new Date())
    : null;
  const isTestDue = daysUntilNextTest !== null && daysUntilNextTest <= 0;
  const isTestSoon = daysUntilNextTest !== null && daysUntilNextTest > 0 && daysUntilNextTest <= 7;

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`${riskConfig.color} gap-1`}>
                <TrendingUp className="h-3 w-3" />
                {riskConfig.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Результат теста "Мой ребёнок растёт" от{" "}
              {format(new Date(latestResult.completed_at), "d MMM yyyy", { locale: ru })}
            </TooltipContent>
          </Tooltip>
          
          {/* Mini sphere indicators */}
          {Object.entries(scores).slice(0, 3).map(([key, value]) => {
            const config = sphereConfig[key];
            if (!config) return null;
            
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${config.color}`}>
                    {config.icon}
                    <span className="font-semibold">{value}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {config.name}: {value}%
                </TooltipContent>
              </Tooltip>
            );
          })}

          {isTestDue && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="border-orange-500 text-orange-600 gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Пора повторить
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Рекомендуется повторный тест развития
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className="border-emerald-200 dark:border-emerald-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Результаты развития
          </div>
          <Badge className={riskConfig.color}>{riskConfig.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sphere scores */}
        <div className="space-y-3">
          {Object.entries(scores).map(([key, value]) => {
            const config = sphereConfig[key];
            if (!config) return null;
            
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded ${config.color}`}>
                      {config.icon}
                    </span>
                    <span>{config.name}</span>
                  </div>
                  <span className="font-semibold">{value}%</span>
                </div>
                <Progress 
                  value={value} 
                  className="h-2"
                  style={{
                    '--progress-color': value >= 70 ? 'hsl(var(--success))' 
                      : value >= 50 ? 'hsl(var(--warning))' 
                      : 'hsl(var(--destructive))'
                  } as React.CSSProperties}
                />
              </div>
            );
          })}
        </div>

        {/* Next test reminder */}
        {latestResult.next_test_date && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            isTestDue 
              ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
              : isTestSoon 
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                : "bg-muted"
          }`}>
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {isTestDue 
                ? "Рекомендуется повторить тест"
                : isTestSoon 
                  ? `Следующий тест через ${daysUntilNextTest} дн.`
                  : `Следующий тест: ${format(new Date(latestResult.next_test_date), "d MMM yyyy", { locale: ru })}`
              }
            </span>
          </div>
        )}

        {/* View details button */}
        {onViewDetails && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2"
            onClick={() => onViewDetails(latestResult)}
          >
            Подробнее
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Test date */}
        <p className="text-xs text-muted-foreground text-center">
          Тест пройден: {format(new Date(latestResult.completed_at), "d MMMM yyyy", { locale: ru })}
        </p>
      </CardContent>
    </Card>
  );
}
