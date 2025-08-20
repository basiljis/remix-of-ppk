import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ProtocolChecklistBlock } from "@/hooks/useProtocolChecklistData";
import { Calculator, TrendingUp, Target } from "lucide-react";

interface ProtocolResultsPanelProps {
  blocks: ProtocolChecklistBlock[];
  calculateBlockScore: (block: ProtocolChecklistBlock) => {
    score: number;
    maxScore: number;
    percentage: number;
    yesCountWithWeight1: number;
    sumWeight1Criteria: number;
    formulaPercentage: number;
  };
}

export const ProtocolResultsPanel = ({ blocks, calculateBlockScore }: ProtocolResultsPanelProps) => {
  // Общая статистика
  const totalStats = blocks.reduce((acc, block) => {
    const blockStats = calculateBlockScore(block);
    return {
      totalScore: acc.totalScore + blockStats.score,
      maxScore: acc.maxScore + blockStats.maxScore,
      yesCountWithWeight1: acc.yesCountWithWeight1 + blockStats.yesCountWithWeight1,
      sumWeight1Criteria: acc.sumWeight1Criteria + blockStats.sumWeight1Criteria
    };
  }, {
    totalScore: 0,
    maxScore: 0,
    yesCountWithWeight1: 0,
    sumWeight1Criteria: 0
  });

  const overallPercentage = totalStats.maxScore > 0 ? (totalStats.totalScore / totalStats.maxScore) * 100 : 0;
  const formulaPercentage = totalStats.sumWeight1Criteria > 0 ? 
    (totalStats.yesCountWithWeight1 * totalStats.sumWeight1Criteria) / 100 * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Общие результаты */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Итоги заполнения протокола и чек-листа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg bg-background">
              <div className="text-2xl font-bold text-primary">
                {totalStats.totalScore.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Сумма по критериям</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-background">
              <div className="text-2xl font-bold text-accent">
                {formulaPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">% по формуле</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-background">
              <div className="text-2xl font-bold text-secondary">
                {totalStats.yesCountWithWeight1}/{totalStats.sumWeight1Criteria}
              </div>
              <div className="text-sm text-muted-foreground">Критерии "да" с весом 1</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Общий прогресс</span>
                <span>{Math.round(overallPercentage)}%</span>
              </div>
              <Progress value={overallPercentage} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Прогресс по формуле</span>
                <span>{formulaPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={formulaPercentage} className="h-2" />
            </div>
          </div>

          <div className="text-center p-3 bg-accent/10 rounded-lg">
            <div className="text-sm font-medium text-foreground">
              Формула расчета: (количество "да" с весом 1) × (сумма критериев с весом 1) ÷ 100
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ({totalStats.yesCountWithWeight1} × {totalStats.sumWeight1Criteria}) ÷ 100 = {formulaPercentage.toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Результаты по блокам */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Результаты по блокам
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {blocks.map((block) => {
            const blockStats = calculateBlockScore(block);
            const blockFormula = blockStats.sumWeight1Criteria > 0 ? 
              (blockStats.yesCountWithWeight1 * blockStats.sumWeight1Criteria) / 100 * 100 : 0;
            
            return (
              <div key={block.id} className="p-4 border rounded-lg bg-card">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold">{block.title}</h4>
                  <Badge variant="outline">
                    {blockStats.score.toFixed(1)} / {blockStats.maxScore}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Сумма критериев</div>
                    <div className="font-medium">{blockStats.score.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">% по формуле</div>
                    <div className="font-medium">{blockFormula.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">"Да" с весом 1</div>
                    <div className="font-medium">{blockStats.yesCountWithWeight1}/{blockStats.sumWeight1Criteria}</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Progress value={blockStats.percentage} className="h-1" />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};