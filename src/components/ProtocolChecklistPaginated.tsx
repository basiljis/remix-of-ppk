import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, List, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtocolChecklistBlock } from "@/hooks/useProtocolChecklistData";
import { ProtocolResultsPanel } from "@/components/ProtocolResultsPanel";

interface ProtocolChecklistPaginatedProps {
  blocks: ProtocolChecklistBlock[];
  onItemChange: (itemId: string, value: 0 | 1) => void;
  calculateBlockScore: (block: ProtocolChecklistBlock) => {
    score: number;
    maxScore: number;
    percentage: number;
    yesCountWithWeight1: number;
    sumWeight1Criteria: number;
    formulaPercentage: number;
  };
}

export const ProtocolChecklistPaginated = ({ 
  blocks, 
  onItemChange, 
  calculateBlockScore 
}: ProtocolChecklistPaginatedProps) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("checklist");

  const currentBlock = blocks[currentBlockIndex];
  const totalBlocks = blocks.length;

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

  const blockStats = calculateBlockScore(currentBlock);
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
              const stats = calculateBlockScore(block);
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Чек-лист
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Итоги
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
              {currentBlock.topics.map((topic) => (
                <div key={topic.id} className="space-y-4">
                  <h4 className="font-semibold text-lg text-primary border-b pb-2">
                    {topic.title}
                  </h4>
                  
                  {topic.subtopics.map((subtopic) => (
                    <div key={subtopic.id} className="space-y-3">
                      <h5 className="font-medium text-base text-secondary-foreground">
                        {subtopic.title}
                      </h5>
                      
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
                  ))}
                </div>
              ))}
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
            calculateBlockScore={calculateBlockScore}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};