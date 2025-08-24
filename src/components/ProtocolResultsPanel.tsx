import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ProtocolChecklistBlock } from "@/hooks/useProtocolChecklistData";
import { Calculator, TrendingUp, Target } from "lucide-react";
import { getPercentageColor } from "@/utils/assistanceDirections";

interface ProtocolResultsPanelProps {
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

export const ProtocolResultsPanel = ({ blocks, educationLevel, calculateBlockScore }: ProtocolResultsPanelProps) => {
  // Общая статистика - получаем максимальный процент среди всех блоков
  const blockStats = blocks.map(block => calculateBlockScore(block, educationLevel));
  
  const totalStats = {
    totalScore: blockStats.reduce((sum, stats) => sum + stats.score, 0),
    maxScore: blockStats.reduce((sum, stats) => sum + stats.maxScore, 0),
    yesCount: blockStats.reduce((sum, stats) => sum + stats.yesCount, 0),
    // Максимальный процент среди блоков, а не сумма
    formulaPercentage: blockStats.length > 0 ? Math.max(...blockStats.map(stats => stats.formulaPercentage)) : 0
  };

  const overallPercentage = totalStats.maxScore > 0 ? (totalStats.totalScore / totalStats.maxScore) * 100 : 0;

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
                <div className={`text-2xl font-bold ${
                  getPercentageColor(totalStats.formulaPercentage) === 'success' ? 'text-green-600' :
                  getPercentageColor(totalStats.formulaPercentage) === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {totalStats.formulaPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">% по формуле</div>
                <Badge 
                  variant={
                    getPercentageColor(totalStats.formulaPercentage) === 'success' ? 'default' :
                    getPercentageColor(totalStats.formulaPercentage) === 'warning' ? 'secondary' : 
                    'destructive'
                  }
                  className={`mt-1 ${
                    getPercentageColor(totalStats.formulaPercentage) === 'success' ? 'bg-green-100 text-green-800 border-green-200' :
                    getPercentageColor(totalStats.formulaPercentage) === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-red-100 text-red-800 border-red-200'
                  }`}
                >
                  {getPercentageColor(totalStats.formulaPercentage) === 'success' ? 'Низкий уровень' :
                   getPercentageColor(totalStats.formulaPercentage) === 'warning' ? 'Средний уровень' :
                   'Высокий уровень'}
                </Badge>
              </div>
            <div className="text-center p-4 border rounded-lg bg-background">
              <div className="text-2xl font-bold text-secondary">
                {totalStats.yesCount}
              </div>
              <div className="text-sm text-muted-foreground">Существенные критерии</div>
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
                <span>{totalStats.formulaPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(totalStats.formulaPercentage, 100)} className="h-2" />
            </div>
          </div>

          <div className="text-center p-3 bg-accent/10 rounded-lg">
            <div className="text-sm font-medium text-foreground">
              Формула расчета: СК × В (существенные критерии × вес критерия)
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Итоговый процент = максимальный процент среди всех блоков (не сумма)
            </div>
            <div className="text-xs text-muted-foreground">
              Каждый блок рассчитывается индивидуально и не может превышать 100%
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
            const blockStats = calculateBlockScore(block, educationLevel);
            
            return (
              <div key={block.id} className="p-4 border rounded-lg bg-card">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold">{block.title}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {blockStats.score.toFixed(1)} / {blockStats.maxScore}
                    </Badge>
                    <Badge 
                      variant={
                        getPercentageColor(blockStats.formulaPercentage) === 'success' ? 'default' :
                        getPercentageColor(blockStats.formulaPercentage) === 'warning' ? 'secondary' : 
                        'destructive'
                      }
                      className={
                        getPercentageColor(blockStats.formulaPercentage) === 'success' ? 'bg-green-100 text-green-800 border-green-200' :
                        getPercentageColor(blockStats.formulaPercentage) === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }
                    >
                      {blockStats.formulaPercentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Сумма критериев</div>
                    <div className="font-medium">{blockStats.score.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">% по формуле</div>
                    <div className="font-medium">{blockStats.formulaPercentage.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Существенные критерии</div>
                    <div className="font-medium">{blockStats.yesCount}</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Progress value={Math.min(blockStats.formulaPercentage, 100)} className="h-1" />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};