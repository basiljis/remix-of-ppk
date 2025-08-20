import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProtocolChecklistBlock } from "@/hooks/useProtocolChecklistData";
import { analyzeProtocolResults, AssistanceRecommendation } from "@/utils/assistanceDirections";
import { Target, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

interface AssistanceDirectionsPanelProps {
  blocks: ProtocolChecklistBlock[];
  educationLevel: string;
  calculateBlockScore: (block: ProtocolChecklistBlock, educationLevel?: string) => {
    score: number;
    maxScore: number;
    percentage: number;
    yesCount: number;
    sumWeight1Criteria: number;
    formulaPercentage: number;
    weightPerCriteria: number;
  };
}

export const AssistanceDirectionsPanel = ({ blocks, educationLevel, calculateBlockScore }: AssistanceDirectionsPanelProps) => {
  const analysis: AssistanceRecommendation = analyzeProtocolResults(blocks, calculateBlockScore, educationLevel);

  const getGroupIcon = (group: number) => {
    switch (group) {
      case 1:
        return <CheckCircle className="h-4 w-4" />;
      case 2:
        return <AlertCircle className="h-4 w-4" />;
      case 3:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getGroupBadgeVariant = (color: string) => {
    switch (color) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'destructive':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Общая оценка */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Направления коррекционно-развивающей помощи
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className={`border-l-4 ${
            analysis.overallGroup.color === 'success' ? 'border-l-green-500 bg-green-50' :
            analysis.overallGroup.color === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
            'border-l-red-500 bg-red-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {getGroupIcon(analysis.overallGroup.group)}
              <Badge variant={getGroupBadgeVariant(analysis.overallGroup.color)}>
                Группа {analysis.overallGroup.group}
              </Badge>
            </div>
            <AlertDescription className="font-medium">
              {analysis.overallGroup.description}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Рекомендации:</h4>
            <ul className="space-y-1 text-sm">
              {analysis.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span className={recommendation.includes('ОБЯЗАТЕЛЬНО') ? 'font-semibold text-destructive' : ''}>
                    {recommendation}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Анализ по блокам */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Анализ по блокам</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.blockAssessments.map((assessment, index) => (
            <div key={index} className="p-4 border rounded-lg bg-card">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold">{assessment.blockTitle}</h4>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      assessment.percentage <= 25 ? 'default' :
                      assessment.percentage <= 60 ? 'secondary' : 
                      'destructive'
                    }
                    className={
                      assessment.percentage <= 25 ? 'bg-green-100 text-green-800 border-green-200' :
                      assessment.percentage <= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-red-100 text-red-800 border-red-200'
                    }
                  >
                    {assessment.percentage.toFixed(1)}%
                  </Badge>
                  <Badge variant={getGroupBadgeVariant(assessment.group.color)}>
                    Группа {assessment.group.group}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Статус:</span>
                  <div className="font-medium">{assessment.group.description}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Существенные критерии:</span>
                  <div className="font-medium">
                    {assessment.hasEssentialCriteria ? 
                      <span className="text-red-600">Есть</span> : 
                      <span className="text-green-600">Нет</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};