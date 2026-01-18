import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  X,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  analyzeProtocolResults,
  getPercentageColor,
} from "@/utils/assistanceDirections";
import {
  ProtocolChecklistBlock,
  ProtocolChecklistTopic,
  ProtocolChecklistSubtopic,
  ProtocolChecklistItem,
} from "@/hooks/useProtocolChecklistData";

interface ProtocolResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
}

interface SavedBlock {
  name: string;
  items: { id: string; score: 0 | 1; weight: number }[];
}

export function ProtocolResultsModal({
  open,
  onOpenChange,
  protocolId,
}: ProtocolResultsModalProps) {
  const [activeTab, setActiveTab] = useState("results");

  // Fetch protocol data
  const { data: protocol, isLoading } = useQuery({
    queryKey: ["protocol-results", protocolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocols")
        .select("*")
        .eq("id", protocolId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!protocolId,
  });

  // Fetch checklist items for structure
  const { data: checklistItems = [] } = useQuery({
    queryKey: ["protocol-checklist-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocol_checklist_items")
        .select("*")
        .eq("is_disabled", false)
        .order("block_order")
        .order("topic_order")
        .order("subtopic_order");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Build blocks from saved checklist_data
  const blocks: ProtocolChecklistBlock[] = useMemo(() => {
    if (!protocol?.checklist_data || !checklistItems.length) return [];

    const checklistData = protocol.checklist_data as { blocks?: SavedBlock[] };
    if (!checklistData.blocks) return [];

    // Create a map of saved scores
    const scoreMap = new Map<string, { score: 0 | 1; weight: number }>();
    checklistData.blocks.forEach((block) => {
      block.items?.forEach((item) => {
        scoreMap.set(item.id, { score: item.score, weight: item.weight });
      });
    });

    // Filter by education level
    const educationLevel = protocol.education_level;
    const levelMap: Record<string, string> = {
      preschool: "education_level_do",
      elementary: "education_level_noo",
      middle: "education_level_oo",
      high: "education_level_soo",
      do: "education_level_do",
      noo: "education_level_noo",
      oo: "education_level_oo",
      soo: "education_level_soo",
    };

    const levelKey = levelMap[educationLevel];
    const filteredItems = checklistItems.filter(
      (item) => (item as Record<string, unknown>)[levelKey] === true
    );

    // Build hierarchical structure
    const blocksMap = new Map<string, ProtocolChecklistBlock>();

    filteredItems.forEach((item) => {
      const blockKey = `${item.block_order}-${item.block}`;

      if (!blocksMap.has(blockKey)) {
        blocksMap.set(blockKey, {
          id: blockKey,
          title: item.block,
          order: item.block_order,
          topics: [],
        });
      }

      const block = blocksMap.get(blockKey)!;

      let topic = block.topics.find(
        (t) => t.order === item.topic_order && t.title === item.topic
      );
      if (!topic) {
        topic = {
          id: `${item.topic_order}-${item.topic}`,
          title: item.topic,
          order: item.topic_order,
          subtopics: [],
        };
        block.topics.push(topic);
      }

      let subtopic = topic.subtopics.find(
        (s) => s.order === item.subtopic_order && s.title === item.subtopic
      );
      if (!subtopic) {
        subtopic = {
          id: `${item.subtopic_order}-${item.subtopic}`,
          title: item.subtopic,
          order: item.subtopic_order,
          items: [],
        };
        topic.subtopics.push(subtopic);
      }

      const savedItem = scoreMap.get(item.checklist_item_id);
      subtopic.items.push({
        id: item.id,
        checklist_item_id: item.checklist_item_id,
        block: item.block,
        block_order: item.block_order,
        education_level_do: item.education_level_do,
        education_level_noo: item.education_level_noo,
        education_level_oo: item.education_level_oo,
        education_level_soo: item.education_level_soo,
        topic: item.topic,
        topic_order: item.topic_order,
        subtopic: item.subtopic,
        subtopic_order: item.subtopic_order,
        description: item.description,
        score_0_label: item.score_0_label,
        score_1_label: item.score_1_label,
        weight: item.weight,
        score: savedItem?.score || 0,
      } as ProtocolChecklistItem);
    });

    const result = Array.from(blocksMap.values()).sort(
      (a, b) => a.order - b.order
    );
    result.forEach((block) => {
      block.topics.sort((a, b) => a.order - b.order);
      block.topics.forEach((topic) => {
        topic.subtopics.sort((a, b) => a.order - b.order);
      });
    });

    return result;
  }, [protocol, checklistItems]);

  // Calculate block score
  const calculateBlockScore = (
    block: ProtocolChecklistBlock,
    educationLevel?: string
  ) => {
    let totalScore = 0;
    let maxScore = 0;
    let yesCount = 0;
    let totalItemsInBlock = 0;

    block.topics.forEach((topic) => {
      topic.subtopics.forEach((subtopic) => {
        subtopic.items.forEach((item) => {
          totalScore += (item.score || 0) * item.weight;
          maxScore += item.weight;
          totalItemsInBlock += 1;

          if (item.score === 1) {
            yesCount += 1;
          }
        });
      });
    });

    const getMaxCriteriaForBlock = (level: string, blockItemsCount: number) => {
      const totalMaxCriteria: Record<string, number> = {
        preschool: 7,
        elementary: 8,
        middle: 9,
        high: 10,
        do: 7,
        noo: 8,
        oo: 9,
        soo: 10,
      };
      const maxForLevel = totalMaxCriteria[level] || 10;
      return Math.min(blockItemsCount, maxForLevel);
    };

    const maxCriteriaForBlock = getMaxCriteriaForBlock(
      educationLevel || "high",
      totalItemsInBlock
    );
    const weightPerCriteria =
      maxCriteriaForBlock > 0 ? 100 / maxCriteriaForBlock : 0;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const formulaPercentage = Math.min(yesCount * weightPerCriteria, 100);

    return {
      score: totalScore,
      maxScore,
      percentage,
      yesCount,
      sumWeight1Criteria: 0,
      formulaPercentage,
      weightPerCriteria,
    };
  };

  // Calculate total stats
  const totalStats = useMemo(() => {
    if (!blocks.length) return null;

    const educationLevel = protocol?.education_level || "high";
    const blockStats = blocks.map((block) =>
      calculateBlockScore(block, educationLevel)
    );

    return {
      totalScore: blockStats.reduce((sum, stats) => sum + stats.score, 0),
      maxScore: blockStats.reduce((sum, stats) => sum + stats.maxScore, 0),
      yesCount: blockStats.reduce((sum, stats) => sum + stats.yesCount, 0),
      formulaPercentage:
        blockStats.length > 0
          ? Math.max(...blockStats.map((stats) => stats.formulaPercentage))
          : 0,
    };
  }, [blocks, protocol?.education_level]);

  // Get analysis
  const analysis = useMemo(() => {
    if (!blocks.length) return null;
    return analyzeProtocolResults(
      blocks,
      calculateBlockScore,
      protocol?.education_level || "high"
    );
  }, [blocks, protocol?.education_level]);

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

  const getEducationLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      do: "Дошкольное образование",
      preschool: "Дошкольное образование",
      noo: "Начальное общее образование",
      elementary: "Начальное общее образование",
      oo: "Основное общее образование",
      middle: "Основное общее образование",
      soo: "Среднее общее образование",
      high: "Среднее общее образование",
    };
    return labels[level] || level;
  };

  const protocolData = protocol?.protocol_data as {
    childData?: {
      fullName?: string;
      birthDate?: string;
      parentName?: string;
    };
  } | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Результаты протокола {protocol?.ppk_number || ""}
          </DialogTitle>
          <DialogDescription>
            Просмотр результатов заполнения протокола, результатов по блокам и
            направлений коррекционно-развивающей помощи
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Загрузка...</div>
          </div>
        ) : (
          <>
            {/* Protocol info */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{protocol?.child_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {protocol?.created_at
                    ? format(new Date(protocol.created_at), "dd.MM.yyyy", {
                        locale: ru,
                      })
                    : "—"}
                </span>
              </div>
              <Badge variant="secondary">
                {getEducationLevelLabel(protocol?.education_level || "")}
              </Badge>
              <Badge
                variant={
                  protocol?.status === "completed" ? "default" : "secondary"
                }
              >
                {protocol?.status === "completed" ? "Завершён" : "Черновик"}
              </Badge>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="results">Результаты</TabsTrigger>
                <TabsTrigger value="blocks">По блокам</TabsTrigger>
                <TabsTrigger value="directions">Направления помощи</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 mt-4">
                <TabsContent value="results" className="space-y-4 mt-0">
                  {totalStats && (
                    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Calculator className="h-5 w-5" />
                          Итоги заполнения протокола
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 border rounded-lg bg-background">
                            <div className="text-2xl font-bold text-primary">
                              {totalStats.totalScore.toFixed(1)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Сумма по критериям
                            </div>
                          </div>
                          <div className="text-center p-4 border rounded-lg bg-background">
                            <div
                              className={`text-2xl font-bold ${
                                getPercentageColor(
                                  totalStats.formulaPercentage
                                ) === "success"
                                  ? "text-green-600"
                                  : getPercentageColor(
                                      totalStats.formulaPercentage
                                    ) === "warning"
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {totalStats.formulaPercentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              % по формуле
                            </div>
                            <Badge
                              variant={
                                getPercentageColor(
                                  totalStats.formulaPercentage
                                ) === "success"
                                  ? "default"
                                  : getPercentageColor(
                                      totalStats.formulaPercentage
                                    ) === "warning"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className={`mt-1 ${
                                getPercentageColor(
                                  totalStats.formulaPercentage
                                ) === "success"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : getPercentageColor(
                                      totalStats.formulaPercentage
                                    ) === "warning"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                              }`}
                            >
                              {getPercentageColor(
                                totalStats.formulaPercentage
                              ) === "success"
                                ? "Низкий уровень"
                                : getPercentageColor(
                                    totalStats.formulaPercentage
                                  ) === "warning"
                                ? "Средний уровень"
                                : "Высокий уровень"}
                            </Badge>
                          </div>
                          <div className="text-center p-4 border rounded-lg bg-background">
                            <div className="text-2xl font-bold text-secondary-foreground">
                              {totalStats.yesCount}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Существенные критерии
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Прогресс по формуле</span>
                              <span>
                                {totalStats.formulaPercentage.toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              value={Math.min(
                                totalStats.formulaPercentage,
                                100
                              )}
                              className="h-2"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="blocks" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5" />
                        Результаты по блокам
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {blocks.map((block) => {
                        const stats = calculateBlockScore(
                          block,
                          protocol?.education_level
                        );

                        return (
                          <div
                            key={block.id}
                            className="p-4 border rounded-lg bg-card"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-semibold">{block.title}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {stats.score.toFixed(1)} / {stats.maxScore}
                                </Badge>
                                <Badge
                                  variant={
                                    getPercentageColor(stats.formulaPercentage) === "success"
                                      ? "default"
                                      : getPercentageColor(stats.formulaPercentage) === "warning"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className={
                                    getPercentageColor(stats.formulaPercentage) === "success"
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : getPercentageColor(stats.formulaPercentage) === "warning"
                                      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                      : "bg-red-100 text-red-800 border-red-200"
                                  }
                                >
                                  {stats.formulaPercentage.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">
                                  Сумма критериев
                                </div>
                                <div className="font-medium">
                                  {stats.score.toFixed(1)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">
                                  % по формуле
                                </div>
                                <div className="font-medium">
                                  {stats.formulaPercentage.toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">
                                  Существенные критерии
                                </div>
                                <div className="font-medium">
                                  {stats.yesCount}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3">
                              <Progress
                                value={Math.min(stats.formulaPercentage, 100)}
                                className="h-1"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="directions" className="space-y-4 mt-0">
                  {analysis && (
                    <div className="space-y-6">
                      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Target className="h-5 w-5" />
                            Направления коррекционно-развивающей помощи
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Alert
                            className={`border-l-4 ${
                              analysis.overallGroup.color === "success"
                                ? "border-l-green-500 bg-green-50"
                                : analysis.overallGroup.color === "warning"
                                ? "border-l-yellow-500 bg-yellow-50"
                                : "border-l-red-500 bg-red-50"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {getGroupIcon(analysis.overallGroup.group)}
                              <Badge
                                variant={
                                  analysis.overallGroup.color === "success"
                                    ? "default"
                                    : analysis.overallGroup.color === "warning"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                Группа {analysis.overallGroup.group}
                              </Badge>
                            </div>
                            <AlertDescription className="font-medium">
                              {analysis.overallGroup.description}
                            </AlertDescription>
                          </Alert>

                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">
                              Рекомендации:
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {analysis.recommendations.map(
                                (recommendation, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start gap-2"
                                  >
                                    <span className="text-muted-foreground mt-1">
                                      •
                                    </span>
                                    <span
                                      className={
                                        recommendation.includes("ОБЯЗАТЕЛЬНО")
                                          ? "font-semibold text-destructive"
                                          : ""
                                      }
                                    >
                                      {recommendation}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Анализ по блокам
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {analysis.blockAssessments.map(
                            (assessment, index) => (
                              <div
                                key={index}
                                className="p-3 border rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">
                                    {assessment.blockTitle}
                                  </span>
                                  {assessment.group && (
                                    <Badge
                                      variant={
                                        assessment.group.color === "success"
                                          ? "default"
                                          : assessment.group.color === "warning"
                                          ? "secondary"
                                          : "destructive"
                                      }
                                    >
                                      Группа {assessment.group.group}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Процент: {assessment.percentage.toFixed(1)}% |
                                  Существенные критерии:{" "}
                                  {assessment.hasEssentialCriteria
                                    ? "Да"
                                    : "Нет"}
                                </div>
                                {assessment.group && (
                                  <div className="text-sm mt-1">
                                    {assessment.group.description}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <div className="flex justify-end pt-4 border-t">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Закрыть
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
