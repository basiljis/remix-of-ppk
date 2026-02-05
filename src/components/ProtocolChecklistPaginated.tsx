import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, List, BarChart3, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtocolChecklistBlock } from "@/hooks/useProtocolChecklistData";
import { ProtocolResultsPanel } from "@/components/ProtocolResultsPanel";
import { AssistanceDirectionsPanel } from "@/components/AssistanceDirectionsPanel";
import { ProtocolConclusionPanel } from "@/components/ProtocolConclusionPanel";

interface ProtocolChecklistPaginatedProps {
  blocks: ProtocolChecklistBlock[];
  educationLevel: string;
  childName: string;
  onItemChange: (itemId: string, value: 0 | 1) => void;
  calculateBlockScore: (block: ProtocolChecklistBlock, educationLevel?: string) => {
    score: number;
    maxScore: number;
    percentage: number;
    yesCount: number;
    sumWeight1Criteria: number;
    formulaPercentage: number;
    weightPerCriteria: number;
  };
  onConclusionChange?: (conclusionText: string) => void;
  savedConclusion?: string;
  parentConsent?: boolean;
  onParentConsentChange?: (consent: boolean) => void;
  checklistStarted?: boolean;
  checklistConfirmed?: boolean;
  onChecklistStarted?: (started: boolean) => void;
  onChecklistConfirmed?: (confirmed: boolean) => void;
}

export const ProtocolChecklistPaginated = ({ 
  blocks, 
  educationLevel,
  childName,
  onItemChange, 
  calculateBlockScore,
  onConclusionChange,
  savedConclusion,
  parentConsent,
  onParentConsentChange,
  checklistStarted = false,
  checklistConfirmed = false,
  onChecklistStarted,
  onChecklistConfirmed
}: ProtocolChecklistPaginatedProps) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("checklist");

  const currentBlock = blocks[currentBlockIndex];
  const totalBlocks = blocks.length;

  // Расчёт общего прогресса заполнения
  const totalChecklistItems = blocks.reduce((sum, block) => {
    return sum + block.topics.reduce((topicSum, topic) => {
      return topicSum + topic.subtopics.reduce((subtopicSum, subtopic) => {
        return subtopicSum + subtopic.items.length;
      }, 0);
    }, 0);
  }, 0);

  const completedChecklistItems = blocks.reduce((sum, block) => {
    return sum + block.topics.reduce((topicSum, topic) => {
      return topicSum + topic.subtopics.reduce((subtopicSum, subtopic) => {
        return subtopicSum + subtopic.items.filter(item => item.score !== undefined).length;
      }, 0);
    }, 0);
  }, 0);

  const overallCompletionPercentage = totalChecklistItems > 0 
    ? (completedChecklistItems / totalChecklistItems) * 100 
    : 0;

  const isFullyCompleted = overallCompletionPercentage === 100;

  const nextBlock = () => {
    if (currentBlockIndex < totalBlocks - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
    }
  };

  const prevBlock = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1);
    }
  };

  const goToBlock = (index: number) => {
    setCurrentBlockIndex(index);
    setActiveTab("checklist");
  };

  if (!currentBlock) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Нет данных для отображения</p>
        </CardContent>
      </Card>
    );
  }

  // Экран "Приступить к заполнению" если чек-лист ещё не начат
  if (!checklistStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Чек-лист обследования
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <List className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Готовы начать обследование?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Чек-лист содержит {totalChecklistItems} критериев оценки, разбитых на {totalBlocks} блоков. 
              Нажмите кнопку ниже, чтобы приступить к заполнению.
            </p>
            <Button 
              size="lg" 
              onClick={() => onChecklistStarted?.(true)}
              className="gap-2"
            >
              <ChevronRight className="h-5 w-5" />
              Приступить к заполнению
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const blockStats = calculateBlockScore(currentBlock, educationLevel);
  const completedItems = currentBlock.topics.reduce((sum, topic) => {
    return sum + topic.subtopics.reduce((subtopicSum, subtopic) => {
      return subtopicSum + subtopic.items.filter(item => item.score !== undefined).length;
    }, 0);
  }, 0);

  const totalItems = currentBlock.topics.reduce((sum, topic) => {
    return sum + topic.subtopics.reduce((subtopicSum, subtopic) => {
      return subtopicSum + subtopic.items.length;
    }, 0);
  }, 0);

  const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Статус заполнения чек-листа */}
      {checklistConfirmed ? (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <ChevronRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Чек-лист заполнен и подтверждён</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Заполнено {completedChecklistItems} из {totalChecklistItems} критериев
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onChecklistConfirmed?.(false)}
                className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300"
              >
                Редактировать
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <List className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">Заполнение чек-листа</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Заполнено {completedChecklistItems} из {totalChecklistItems} ({Math.round(overallCompletionPercentage)}%)
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => onChecklistConfirmed?.(true)}
                disabled={!isFullyCompleted}
                className="gap-2"
              >
                <ChevronRight className="h-4 w-4" />
                Подтвердить заполнение
              </Button>
            </div>
            <Progress value={overallCompletionPercentage} className="mt-3" />
          </CardContent>
        </Card>
      )}

      {/* Навигация по блокам */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Блоки чек-листа</span>
            <Badge variant="outline">
              {currentBlockIndex + 1} из {totalBlocks}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {blocks.map((block, index) => {
              const stats = calculateBlockScore(block, educationLevel);
              const blockCompleted = block.topics.reduce((sum, topic) => {
                return sum + topic.subtopics.reduce((subtopicSum, subtopic) => {
                  return subtopicSum + subtopic.items.filter(item => item.score !== undefined).length;
                }, 0);
              }, 0);
              const blockTotal = block.topics.reduce((sum, topic) => {
                return sum + topic.subtopics.reduce((subtopicSum, subtopic) => {
                  return subtopicSum + subtopic.items.length;
                }, 0);
              }, 0);
              const blockProgress = blockTotal > 0 ? (blockCompleted / blockTotal) * 100 : 0;

              return (
                <Button
                  key={block.id}
                  variant={index === currentBlockIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToBlock(index)}
                  className="h-auto p-3 flex flex-col items-start gap-1"
                >
                  <div className="font-medium text-xs truncate w-full text-left">
                    {block.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {blockCompleted}/{blockTotal}
                  </div>
                  <Progress value={blockProgress} className="h-1 w-full" />
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Основной контент */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Чек-лист</span>
            <span className="sm:hidden">Список</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Итоги</span>
            <span className="sm:hidden">Итоги</span>
          </TabsTrigger>
          <TabsTrigger value="assistance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Направления помощи</span>
            <span className="sm:hidden">Помощь</span>
          </TabsTrigger>
          <TabsTrigger value="conclusion" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Заключение</span>
            <span className="sm:hidden">Итог</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold">{currentBlock.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Блок {currentBlockIndex + 1} из {totalBlocks}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <Badge variant="outline" className="text-base px-3 py-1">
                    Баллов: {blockStats.score.toFixed(1)} / {blockStats.maxScore}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    <div>Заполнено: {completedItems}/{totalItems}</div>
                    <div>Прогресс: {Math.round(completionPercentage)}%</div>
                  </div>
                </div>
              </div>
              <Progress value={completionPercentage} className="mt-4" />
            </CardHeader>

            <CardContent className="space-y-6">
              {currentBlock.topics.map((topic, topicIndex) => {
                const prevTopic = topicIndex > 0 ? currentBlock.topics[topicIndex - 1] : null;
                const showTopicTitle = !prevTopic || prevTopic.title !== topic.title;
                
                return (
                  <div key={topic.id} className="space-y-4">
                    {showTopicTitle && (
                      <h4 className="font-semibold text-lg text-primary border-b pb-2">
                        {topic.title}
                      </h4>
                    )}
                    
                    {topic.subtopics.map((subtopic, subtopicIndex) => {
                      const prevSubtopic = subtopicIndex > 0 ? topic.subtopics[subtopicIndex - 1] : null;
                      const showSubtopicTitle = !prevSubtopic || prevSubtopic.title !== subtopic.title;
                      
                      return (
                        <div key={subtopic.id} className="space-y-3">
                          {showSubtopicTitle && (
                            <h5 className="font-medium text-base text-secondary-foreground">
                              {subtopic.title}
                            </h5>
                          )}
                          
                          <div className="space-y-3 pl-4 border-l-2 border-muted">
                            {subtopic.items.map((item) => (
                              <div key={item.checklist_item_id} className="space-y-2">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium leading-relaxed">
                                      {item.description}
                                    </p>
                                    {item.weight !== 1 && (
                                      <Badge variant="secondary" className="mt-1 text-xs">
                                        Вес: {item.weight}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0">
                                    <Badge 
                                      variant={item.score === 1 ? "default" : item.score === 0 ? "destructive" : "outline"}
                                      className="text-xs"
                                    >
                                      {item.score === 1 ? "Да" : item.score === 0 ? "Нет" : "—"}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <RadioGroup
                                  value={item.score?.toString() || ""}
                                  onValueChange={(value) => onItemChange(item.checklist_item_id, parseInt(value) as 0 | 1)}
                                  className="flex gap-4 ml-4"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="0" id={`${item.checklist_item_id}-0`} />
                                    <Label htmlFor={`${item.checklist_item_id}-0`} className="text-sm font-medium cursor-pointer">
                                      {item.score_0_label || "Нет"}
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="1" id={`${item.checklist_item_id}-1`} />
                                    <Label htmlFor={`${item.checklist_item_id}-1`} className="text-sm font-medium cursor-pointer">
                                      {item.score_1_label || "Да"}
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Навигация между блоками */}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={prevBlock} 
              disabled={currentBlockIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Предыдущий блок
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentBlock.title}
            </span>
            
            <Button 
              variant="outline" 
              onClick={nextBlock} 
              disabled={currentBlockIndex === totalBlocks - 1}
            >
              Следующий блок
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <ProtocolResultsPanel 
            blocks={blocks} 
            educationLevel={educationLevel}
            calculateBlockScore={calculateBlockScore}
          />
        </TabsContent>

        <TabsContent value="assistance" className="space-y-4">
          <AssistanceDirectionsPanel 
            blocks={blocks}
            educationLevel={educationLevel}
            calculateBlockScore={calculateBlockScore}
          />
        </TabsContent>

        <TabsContent value="conclusion" className="space-y-4">
          <ProtocolConclusionPanel 
            blocks={blocks}
            educationLevel={educationLevel}
            childName={childName}
            calculateBlockScore={calculateBlockScore}
            onConclusionChange={onConclusionChange}
            savedConclusion={savedConclusion}
            parentConsent={parentConsent}
            onParentConsentChange={onParentConsentChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};