import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Heart, Target, Users, TrendingUp, Lightbulb } from "lucide-react";

interface TestResult {
  id: string;
  test_id: string;
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
}

interface ChildTestResultsBadgesProps {
  childId: string;
  onViewRecommendations?: (result: TestResult) => void;
  compact?: boolean;
}

export function ChildTestResultsBadges({ 
  childId, 
  onViewRecommendations,
  compact = false 
}: ChildTestResultsBadgesProps) {
  const { data: results, isLoading } = useQuery({
    queryKey: ["child-test-results", childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_test_results" as any)
        .select("*")
        .eq("child_id", childId)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false })
        .limit(1) as { data: TestResult[] | null; error: any };
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading || !results || results.length === 0) {
    return null;
  }

  const latestResult = results[0];
  const { scores } = latestResult;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "high": return "bg-red-500";
      default: return "bg-muted";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 p-1.5 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                <Heart className={`h-3.5 w-3.5 ${getScoreColor(scores.warmth)}`} />
                <span className={`text-sm font-semibold ${getScoreColor(scores.warmth)}`}>
                  {scores.warmth}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Эмоциональная теплота: {scores.warmth}/5</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Target className={`h-3.5 w-3.5 ${getScoreColor(scores.control)}`} />
                <span className={`text-sm font-semibold ${getScoreColor(scores.control)}`}>
                  {scores.control}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Гибкость границ: {scores.control}/5</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <Users className={`h-3.5 w-3.5 ${getScoreColor(scores.involvement)}`} />
                <span className={`text-sm font-semibold ${getScoreColor(scores.involvement)}`}>
                  {scores.involvement}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Вовлечённость: {scores.involvement}/5</TooltipContent>
          </Tooltip>

          {onViewRecommendations && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                  onClick={() => onViewRecommendations(latestResult)}
                >
                  <Lightbulb className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Рекомендации</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className="mt-4 border-pink-100 dark:border-pink-900">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-pink-600" />
            <span className="text-sm font-medium">Результаты теста</span>
          </div>
          <Badge className={`${getRiskColor(latestResult.risk_level)} text-white text-xs`}>
            {latestResult.result_label}
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-2 bg-pink-50 dark:bg-pink-950/30 rounded-lg cursor-help">
                  <Heart className={`h-4 w-4 mx-auto ${getScoreColor(scores.warmth)} mb-1`} />
                  <p className={`text-lg font-bold ${getScoreColor(scores.warmth)}`}>
                    {scores.warmth}/5
                  </p>
                  <p className="text-[10px] text-muted-foreground">Теплота</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Эмоциональная теплота в отношениях</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg cursor-help">
                  <Target className={`h-4 w-4 mx-auto ${getScoreColor(scores.control)} mb-1`} />
                  <p className={`text-lg font-bold ${getScoreColor(scores.control)}`}>
                    {scores.control}/5
                  </p>
                  <p className="text-[10px] text-muted-foreground">Границы</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Гибкость границ и правил</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg cursor-help">
                  <Users className={`h-4 w-4 mx-auto ${getScoreColor(scores.involvement)} mb-1`} />
                  <p className={`text-lg font-bold ${getScoreColor(scores.involvement)}`}>
                    {scores.involvement}/5
                  </p>
                  <p className="text-[10px] text-muted-foreground">Вовлечённость</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Вовлечённость в жизнь ребёнка</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {onViewRecommendations && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50"
            onClick={() => onViewRecommendations(latestResult)}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Рекомендации по воспитанию
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
