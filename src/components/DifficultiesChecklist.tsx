import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { EducationLevel } from "@/components/EducationLevelSelector";
import { Calculator, CheckCircle, AlertTriangle } from "lucide-react";

interface DifficultiesItem {
  id: string;
  text: string;
  status: "yes" | "no" | "partial" | "not_assessed";
  weight: number;
  block: string;
}

interface DifficultiesBlock {
  id: string;
  title: string;
  items: DifficultiesItem[];
}

interface DifficultiesChecklistProps {
  level: EducationLevel;
  onItemChange: (itemId: string, status: DifficultiesItem["status"]) => void;
  blocks: DifficultiesBlock[];
  onCalculate: () => void;
  calculationResult?: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    recommendation: string;
  };
}

const getDifficultyStatusColor = (status: DifficultiesItem["status"]) => {
  switch (status) {
    case "yes":
      return "destructive";
    case "no":
      return "success";
    case "partial":
      return "warning";
    default:
      return "outline";
  }
};

const getDifficultyStatusText = (status: DifficultiesItem["status"]) => {
  switch (status) {
    case "yes":
      return "Есть трудности";
    case "no":
      return "Нет трудностей";
    case "partial":
      return "Частично";
    case "not_assessed":
    default:
      return "Не оценено";
  }
};

export const DifficultiesChecklist = ({ 
  level, 
  onItemChange, 
  blocks, 
  onCalculate, 
  calculationResult 
}: DifficultiesChecklistProps) => {
  
  const getBlockProgress = (block: DifficultiesBlock) => {
    const assessedItems = block.items.filter(item => item.status !== "not_assessed");
    return assessedItems.length > 0 ? (assessedItems.length / block.items.length) * 100 : 0;
  };

  const getOverallProgress = () => {
    const allItems = blocks.flatMap(block => block.items);
    const assessedItems = allItems.filter(item => item.status !== "not_assessed");
    return assessedItems.length > 0 ? (assessedItems.length / allItems.length) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Оценка трудностей обучающегося</span>
            {calculationResult && (
              <Button onClick={onCalculate} variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                Пересчитать
              </Button>
            )}
          </CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Общий прогресс оценки</span>
              <span>{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="assessment" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assessment">Оценка трудностей</TabsTrigger>
              <TabsTrigger value="calculation">Расчет результатов</TabsTrigger>
            </TabsList>

            <TabsContent value="assessment" className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {blocks.map((block) => (
                  <AccordionItem key={block.id} value={block.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center justify-between w-full mr-4">
                        <span>{block.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {Math.round(getBlockProgress(block))}%
                          </span>
                          <Progress value={getBlockProgress(block)} className="w-20 h-2" />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {block.items.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <p className="text-sm flex-1">{item.text}</p>
                            <Badge variant={getDifficultyStatusColor(item.status)}>
                              {getDifficultyStatusText(item.status)}
                            </Badge>
                          </div>
                          
                          <RadioGroup
                            value={item.status}
                            onValueChange={(value: DifficultiesItem["status"]) => onItemChange(item.id, value)}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`${item.id}-no`} />
                              <Label htmlFor={`${item.id}-no`} className="text-sm">Нет трудностей</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="partial" id={`${item.id}-partial`} />
                              <Label htmlFor={`${item.id}-partial`} className="text-sm">Частично</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`${item.id}-yes`} />
                              <Label htmlFor={`${item.id}-yes`} className="text-sm">Есть трудности</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="not_assessed" id={`${item.id}-not_assessed`} />
                              <Label htmlFor={`${item.id}-not_assessed`} className="text-sm">Не оценено</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              <div className="flex justify-center pt-4">
                <Button onClick={onCalculate} size="lg">
                  <Calculator className="h-4 w-4 mr-2" />
                  Рассчитать результаты
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="calculation" className="space-y-4">
              {calculationResult ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Результаты расчета
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {calculationResult.totalScore}
                          </div>
                          <div className="text-sm text-muted-foreground">Баллы трудностей</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-secondary">
                            {calculationResult.maxScore}
                          </div>
                          <div className="text-sm text-muted-foreground">Максимум баллов</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-accent">
                            {calculationResult.percentage.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Процент трудностей</div>
                        </div>
                      </div>

                      <div className="p-4 bg-accent/10 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          {calculationResult.percentage > 50 ? (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                          Рекомендация
                        </h4>
                        <p className="text-sm">{calculationResult.recommendation}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Детализация по блокам:</h4>
                        {blocks.map((block) => {
                          const blockScore = block.items.reduce((sum, item) => {
                            switch (item.status) {
                              case "yes": return sum + item.weight;
                              case "partial": return sum + (item.weight * 0.5);
                              default: return sum;
                            }
                          }, 0);
                          const blockMax = block.items.reduce((sum, item) => sum + item.weight, 0);
                          const blockPercentage = blockMax > 0 ? (blockScore / blockMax) * 100 : 0;

                          return (
                            <div key={block.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{block.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono">
                                  {blockScore.toFixed(1)}/{blockMax} ({blockPercentage.toFixed(1)}%)
                                </span>
                                <Progress value={blockPercentage} className="w-20 h-2" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Заполните оценку трудностей и нажмите "Рассчитать результаты"</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};