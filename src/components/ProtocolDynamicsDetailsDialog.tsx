import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle,
  XCircle,
  Target,
  ClipboardList,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Protocol {
  id: string;
  child_name: string;
  created_at: string;
  ppk_number: string;
  checklist_data: any;
  protocol_data: any;
  education_level?: string;
  consultation_type?: string;
  consultation_reason?: string;
  session_topic?: string;
  meeting_type?: string;
}

interface ProtocolDynamicsDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocols: Protocol[];
}

export function ProtocolDynamicsDetailsDialog({ 
  open, 
  onOpenChange, 
  protocols
}: ProtocolDynamicsDetailsDialogProps) {
  // Расчёт баллов по блокам для каждого протокола
  const calculateBlockScores = (protocol: Protocol) => {
    if (!protocol.checklist_data?.blocks) return {};

    const blockScores: Record<string, { score: number; maxScore: number; items: any[] }> = {};
    
    protocol.checklist_data.blocks.forEach((block: any) => {
      if (block.items && Array.isArray(block.items)) {
        const scores = block.items.map((item: any) => item.score || 0);
        const maxScores = block.items.map(() => 1);
        const totalScore = scores.reduce((a: number, b: number) => a + b, 0);
        const maxScore = maxScores.reduce((a: number, b: number) => a + b, 0);
        const average = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        
        blockScores[block.name] = {
          score: Math.round(average),
          maxScore: maxScore,
          items: block.items
        };
      }
    });

    return blockScores;
  };

  // Общий балл по протоколу
  const calculateTotalScore = (protocol: Protocol) => {
    const blockScores = calculateBlockScores(protocol);
    const scores = Object.values(blockScores).map(b => b.score);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  // Получаем тренд
  const getTrend = (current: number, previous: number) => {
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "same";
  };

  // Переводы для типов консультаций
  const consultationTypeLabels: Record<string, string> = {
    initial: "Первичная",
    repeated: "Повторная",
    final: "Итоговая"
  };

  const meetingTypeLabels: Record<string, string> = {
    planned: "Плановое",
    unplanned: "Внеплановое"
  };

  const educationLevelLabels: Record<string, string> = {
    do: "ДО",
    noo: "НОО",
    oo: "ОО",
    soo: "СОО"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Подробные результаты по протоколам ППк
          </DialogTitle>
          <DialogDescription>
            Детальный анализ всех протоколов с результатами по блокам
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <Tabs defaultValue={protocols[protocols.length - 1]?.id || ""} className="w-full">
            <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
              {protocols.map((protocol, index) => (
                <TabsTrigger 
                  key={protocol.id} 
                  value={protocol.id}
                  className="flex-1 min-w-[100px]"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs">№{protocol.ppk_number || index + 1}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(protocol.created_at), "dd.MM.yy")}
                    </span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {protocols.map((protocol, protocolIndex) => {
              const blockScores = calculateBlockScores(protocol);
              const totalScore = calculateTotalScore(protocol);
              const previousScore = protocolIndex > 0 ? calculateTotalScore(protocols[protocolIndex - 1]) : null;
              const trend = previousScore !== null ? getTrend(totalScore, previousScore) : null;

              return (
                <TabsContent key={protocol.id} value={protocol.id} className="space-y-6 mt-4">
                  {/* Сводная информация о протоколе */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Протокол №{protocol.ppk_number || protocolIndex + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Дата</p>
                          <p className="font-medium">
                            {format(new Date(protocol.created_at), "dd.MM.yyyy", { locale: ru })}
                          </p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Тип консультации</p>
                          <Badge variant="outline">
                            {consultationTypeLabels[protocol.consultation_type || ""] || protocol.consultation_type || "—"}
                          </Badge>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Тип заседания</p>
                          <Badge variant="secondary">
                            {meetingTypeLabels[protocol.meeting_type || ""] || protocol.meeting_type || "—"}
                          </Badge>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Уровень образования</p>
                          <Badge>
                            {educationLevelLabels[protocol.education_level || ""] || protocol.education_level || "—"}
                          </Badge>
                        </div>
                      </div>

                      {/* Общий балл */}
                      <div className="mt-4 p-4 rounded-lg bg-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Target className="h-6 w-6 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Общий результат</p>
                            <p className="text-2xl font-bold">{totalScore}%</p>
                          </div>
                        </div>
                        {trend && (
                          <div className="flex items-center gap-2">
                            {trend === "up" && (
                              <>
                                <TrendingUp className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-green-600">
                                  +{totalScore - (previousScore || 0)}%
                                </span>
                              </>
                            )}
                            {trend === "down" && (
                              <>
                                <TrendingDown className="h-5 w-5 text-red-600" />
                                <span className="text-sm text-red-600">
                                  {totalScore - (previousScore || 0)}%
                                </span>
                              </>
                            )}
                            {trend === "same" && (
                              <Minus className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Причина обращения */}
                      {protocol.consultation_reason && (
                        <div className="mt-4 p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Причина обращения</p>
                          <p className="text-sm">{protocol.consultation_reason}</p>
                        </div>
                      )}

                      {/* Тема заседания */}
                      {protocol.session_topic && (
                        <div className="mt-3 p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Тема заседания</p>
                          <p className="text-sm">{protocol.session_topic}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Результаты по блокам */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Результаты по блокам
                    </h3>
                    
                    <div className="space-y-4">
                      {Object.entries(blockScores).map(([blockName, data]) => {
                        const previousBlockScores = protocolIndex > 0 
                          ? calculateBlockScores(protocols[protocolIndex - 1])
                          : null;
                        const previousScore = previousBlockScores?.[blockName]?.score;
                        const blockTrend = previousScore !== undefined 
                          ? getTrend(data.score, previousScore) 
                          : null;

                        return (
                          <Card key={blockName} className="overflow-hidden">
                            <CardHeader className="py-3 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{blockName}</CardTitle>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold">{data.score}%</span>
                                  {blockTrend === "up" && (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                  )}
                                  {blockTrend === "down" && (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  )}
                                  {blockTrend === "same" && (
                                    <Minus className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                              <Progress value={data.score} className="h-2 mt-2" />
                            </CardHeader>
                            <CardContent className="py-3">
                              <div className="grid gap-2">
                                {data.items.slice(0, 5).map((item: any, idx: number) => (
                                  <div 
                                    key={idx} 
                                    className="flex items-center gap-2 text-sm p-2 rounded bg-muted/20"
                                  >
                                    {item.score === 1 ? (
                                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                    )}
                                    <span className="line-clamp-1">
                                      {item.description || item.text || `Пункт ${idx + 1}`}
                                    </span>
                                  </div>
                                ))}
                                {data.items.length > 5 && (
                                  <p className="text-xs text-muted-foreground text-center py-1">
                                    и ещё {data.items.length - 5} пунктов...
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Заключение и рекомендации из protocol_data */}
                  {protocol.protocol_data?.conclusion && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Заключение
                        </h3>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <p className="text-sm whitespace-pre-wrap">
                            {protocol.protocol_data.conclusion}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {protocol.protocol_data?.recommendations && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Рекомендации
                        </h3>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <p className="text-sm whitespace-pre-wrap">
                            {protocol.protocol_data.recommendations}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Направления помощи */}
                  {protocol.protocol_data?.assistanceDirections && 
                   Array.isArray(protocol.protocol_data.assistanceDirections) &&
                   protocol.protocol_data.assistanceDirections.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Направления помощи
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {protocol.protocol_data.assistanceDirections.map((dir: string, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {dir}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}