import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, ClipboardList, CheckCircle2, AlertCircle, 
  Star, Info, ChevronRight, Lightbulb, Lock, Eye, BookOpen, Baby, TrendingUp
} from "lucide-react";
import { TestRecommendationsDialog } from "./TestRecommendationsDialog";
import { DevelopmentTestWizard } from "./DevelopmentTestWizard";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ParentTest {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  scientific_basis: string | null;
  scoring_config: any;
}

interface TestQuestion {
  id: string;
  question_number: number;
  question_text: string;
  dimension: string;
  is_inverted: boolean;
}

interface ParentChild {
  id: string;
  full_name: string;
  child_unique_id: string;
  birth_date?: string | null;
}

interface TestResult {
  id: string;
  child_id: string;
  test_id: string;
  result_type: string;
  result_label: string;
  risk_level: string;
  scores: any;
  recommendations: any;
  is_visible_to_specialists: boolean;
  is_completed: boolean;
  completed_at: string;
  answers: Record<string, number>;
}

const ANSWER_OPTIONS = [
  { value: 1, label: "Почти никогда" },
  { value: 2, label: "Редко" },
  { value: 3, label: "Иногда" },
  { value: 4, label: "Часто" },
  { value: 5, label: "Почти всегда" },
];

interface ParentTestsSectionProps {
  parentUserId: string;
  children: ParentChild[];
}

export function ParentTestsSection({ parentUserId, children }: ParentTestsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTest, setSelectedTest] = useState<ParentTest | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [shareConsent, setShareConsent] = useState(false);
  const [draftResultId, setDraftResultId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [recommendationsDialogOpen, setRecommendationsDialogOpen] = useState(false);
  const [selectedResultForRecommendations, setSelectedResultForRecommendations] = useState<TestResult | null>(null);
  const [developmentTestOpen, setDevelopmentTestOpen] = useState(false);
  const [developmentTestChildId, setDevelopmentTestChildId] = useState<string | null>(null);

  // Fetch available tests
  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ["parent-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_tests" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order") as { data: ParentTest[] | null; error: any };
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch questions for selected test
  const { data: questions } = useQuery({
    queryKey: ["test-questions", selectedTest?.id],
    queryFn: async () => {
      if (!selectedTest?.id) return [];
      const { data, error } = await supabase
        .from("parent_test_questions" as any)
        .select("*")
        .eq("test_id", selectedTest.id)
        .order("question_number") as { data: TestQuestion[] | null; error: any };
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedTest?.id,
  });

  // Fetch existing results (completed only)
  const { data: existingResults } = useQuery({
    queryKey: ["parent-test-results", parentUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_test_results" as any)
        .select("*")
        .eq("parent_user_id", parentUserId)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false }) as { data: TestResult[] | null; error: any };
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch incomplete (draft) results
  const { data: draftResults } = useQuery({
    queryKey: ["parent-test-drafts", parentUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_test_results" as any)
        .select("*")
        .eq("parent_user_id", parentUserId)
        .eq("is_completed", false)
        .order("completed_at", { ascending: false }) as { data: TestResult[] | null; error: any };
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate and save result
  const saveResultMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTest || !selectedChildId || !questions) return;

      // Calculate scores based on test config
      const config = selectedTest.scoring_config;
      const scores: Record<string, number> = {};

      // Calculate warmth score (questions 1, 6, 8, 11 in config)
      const warmthQuestions = [1, 6, 8, 11];
      const controlQuestions = [2, 4, 5, 7];
      const invertedQuestions = [5, 7, 10, 12];
      const involvementQuestions = [3, 9, 11];

      let warmthSum = 0;
      let controlSum = 0;
      let involvementSum = 0;

      questions.forEach((q) => {
        const answer = answers[q.id] || 3;
        const score = q.is_inverted ? (6 - answer) : answer;

        if (warmthQuestions.includes(q.question_number)) {
          warmthSum += score;
        }
        if (controlQuestions.includes(q.question_number)) {
          controlSum += invertedQuestions.includes(q.question_number) ? (6 - answer) : score;
        }
        if (involvementQuestions.includes(q.question_number)) {
          involvementSum += score;
        }
      });

      const warmth = warmthSum / warmthQuestions.length;
      const control = controlSum / controlQuestions.length;
      const involvement = involvementSum / involvementQuestions.length;

      // Determine parenting style
      let resultType = "authoritative";
      let resultLabel = "Авторитетный (сбалансированный)";
      let riskLevel = "low";
      let recommendations: string[] = [];

      if (warmth > 3.5 && control >= 2.5 && control <= 3.5) {
        resultType = "authoritative";
        resultLabel = "Авторитетный (сбалансированный)";
        riskLevel = "low";
        recommendations = config?.styles?.authoritative?.recommendations || [
          "Поддержка текущей стратегии",
          "Развитие эмоционального интеллекта",
        ];
      } else if (warmth < 2.5 && control > 4.0) {
        resultType = "authoritarian";
        resultLabel = "Авторитарный";
        riskLevel = "medium";
        recommendations = config?.styles?.authoritarian?.recommendations || [
          "Тренинг эмпатичного общения",
          "Гибкость правил",
        ];
      } else if (warmth > 3.5 && control < 2.5) {
        resultType = "permissive";
        resultLabel = "Попустительский";
        riskLevel = "medium";
        recommendations = config?.styles?.permissive?.recommendations || [
          "Установление чётких правил",
          "Последовательность в требованиях",
        ];
      } else if (warmth < 2.5 && control < 2.5) {
        resultType = "uninvolved";
        resultLabel = "Индифферентный";
        riskLevel = "high";
        recommendations = config?.styles?.uninvolved?.recommendations || [
          "Рекомендуется консультация психолога",
          "Увеличение времени с ребёнком",
        ];
      }

      const resultData = {
        parent_user_id: parentUserId,
        child_id: selectedChildId,
        test_id: selectedTest.id,
        answers,
        scores: {
          warmth: Math.round(warmth * 10) / 10,
          control: Math.round(control * 10) / 10,
          involvement: Math.round(involvement * 10) / 10,
        },
        result_type: resultType,
        result_label: resultLabel,
        risk_level: riskLevel,
        recommendations,
        is_visible_to_specialists: shareConsent,
        is_completed: true,
      };

      let data: TestResult | null = null;

      if (draftResultId) {
        // Update existing draft to completed
        const { data: updatedData, error } = await supabase
          .from("parent_test_results" as any)
          .update(resultData as any)
          .eq("id", draftResultId)
          .select()
          .single() as { data: TestResult | null; error: any };
        if (error) throw error;
        data = updatedData;
      } else {
        // Create new result
        const { data: newData, error } = await supabase
          .from("parent_test_results" as any)
          .insert(resultData as any)
          .select()
          .single() as { data: TestResult | null; error: any };
        if (error) throw error;
        data = newData;
      }

      return data as TestResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["parent-test-results"] });
      queryClient.invalidateQueries({ queryKey: ["parent-test-drafts"] });
      setTestDialogOpen(false);
      setDraftResultId(null);
      if (result) {
        setCurrentResult(result);
        setResultDialogOpen(true);
      }
      // Toast removed - result dialog already shows success
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  // Toggle visibility
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase
        .from("parent_test_results" as any)
        .update({ is_visible_to_specialists: visible } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-test-results"] });
      toast({ title: "Настройки обновлены" });
    },
  });

  // Save draft on dialog close
  const saveDraft = async () => {
    if (!selectedTest || !selectedChildId || Object.keys(answers).length === 0) return;
    
    setIsSavingDraft(true);
    try {
      const draftData = {
        parent_user_id: parentUserId,
        child_id: selectedChildId,
        test_id: selectedTest.id,
        answers,
        scores: { warmth: 0, control: 0, involvement: 0 },
        result_type: "draft",
        result_label: "Незавершённый тест",
        risk_level: null,
        recommendations: [],
        is_visible_to_specialists: false,
        is_completed: false,
      };

      if (draftResultId) {
        // Update existing draft
        await supabase
          .from("parent_test_results" as any)
          .update({ answers, completed_at: new Date().toISOString() } as any)
          .eq("id", draftResultId);
      } else {
        // Create new draft
        const { data } = await supabase
          .from("parent_test_results" as any)
          .insert(draftData as any)
          .select()
          .single();
        if (data) setDraftResultId((data as any).id);
      }

      queryClient.invalidateQueries({ queryKey: ["parent-test-drafts"] });
      toast({ 
        title: "Прогресс сохранён", 
        description: "Вы можете продолжить тест позже" 
      });
    } catch (error) {
      console.error("Error saving draft:", error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDialogClose = async (open: boolean) => {
    if (!open && testDialogOpen && Object.keys(answers).length > 0 && questions && currentQuestionIndex < questions.length - 1) {
      // User is closing dialog with incomplete test - save draft
      await saveDraft();
    }
    setTestDialogOpen(open);
    if (!open) {
      // Reset state
      setDraftResultId(null);
    }
  };

  const startTest = (test: ParentTest, existingDraft?: TestResult) => {
    if (children.length === 0) {
      toast({
        title: "Сначала добавьте ребёнка",
        description: "Результаты теста сохраняются для конкретного ребёнка",
        variant: "destructive",
      });
      return;
    }
    setSelectedTest(test);
    
    if (existingDraft) {
      // Resume from draft
      setSelectedChildId(existingDraft.child_id);
      setAnswers(existingDraft.answers || {});
      setDraftResultId(existingDraft.id);
      // Find the first unanswered question
      const firstUnanswered = questions?.findIndex(q => !existingDraft.answers?.[q.id]) ?? 0;
      setCurrentQuestionIndex(Math.max(0, firstUnanswered));
    } else {
      setSelectedChildId(children[0].id);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setDraftResultId(null);
    }
    setShareConsent(false);
    setTestDialogOpen(true);
  };

  const handleAnswer = (value: string) => {
    if (!questions) return;
    const question = questions[currentQuestionIndex];
    setAnswers({ ...answers, [question.id]: parseInt(value) });
  };

  const nextQuestion = () => {
    if (!questions) return;
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishTest = () => {
    saveResultMutation.mutate();
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "high": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "low": return "Низкий";
      case "medium": return "Средний";
      case "high": return "Высокий";
      default: return risk;
    }
  };

  const getChildName = (childId: string) => {
    return children.find(c => c.id === childId)?.full_name || "—";
  };

  const openRecommendations = (result: TestResult) => {
    setSelectedResultForRecommendations(result);
    setRecommendationsDialogOpen(true);
  };

  if (testsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const startDevelopmentTest = (childId: string) => {
    if (children.length === 0) {
      toast({
        title: "Сначала добавьте ребёнка",
        description: "Результаты теста сохраняются для конкретного ребёнка",
        variant: "destructive",
      });
      return;
    }
    setDevelopmentTestChildId(childId);
    setDevelopmentTestOpen(true);
  };

  const handleDevelopmentTestComplete = () => {
    setDevelopmentTestOpen(false);
    setDevelopmentTestChildId(null);
    queryClient.invalidateQueries({ queryKey: ["development-test-results"] });
    toast({
      title: "Тест завершён",
      description: "Результаты сохранены в карточке ребёнка",
    });
  };

  return (
    <div className="space-y-6">
      {/* Development Test "My Child is Growing" */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Baby className="h-5 w-5 text-emerald-500" />
          Мониторинг развития
        </h3>
        <Card className="border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-shadow bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <TrendingUp className="h-5 w-5" />
                  Мой ребёнок растёт
                </CardTitle>
                <CardDescription className="mt-2">
                  Комплексная оценка развития по 5 сферам: моторное, речевое, познавательное, 
                  социально-коммуникативное и эмоционально-волевое. Система автоматически подберёт 
                  задания по возрасту и сформирует персонализированные рекомендации.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-start gap-2 p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg mb-4">
              <Info className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Тест занимает 10–15 минут. Вы можете загрузить фото/видео как доказательства выполнения заданий. 
                Результаты интегрируются в карточку ребёнка и доступны специалистам ППк по вашему согласию.
              </p>
            </div>
            
            {children.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Выберите ребёнка:</p>
                <div className="flex flex-wrap gap-2">
                  {children.map((child) => (
                    <Button 
                      key={child.id}
                      onClick={() => startDevelopmentTest(child.id)}
                      variant="outline"
                      className="border-emerald-300 hover:bg-emerald-100 hover:text-emerald-700 dark:border-emerald-700 dark:hover:bg-emerald-900 dark:hover:text-emerald-300"
                    >
                      <Baby className="h-4 w-4 mr-2" />
                      {child.full_name}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Сначала добавьте ребёнка в разделе «Мои дети»
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Available Parenting Tests */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Тесты для родителей</h3>
        <div className="grid gap-4">
          {tests?.map((test) => (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-pink-500" />
                      {test.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {test.description}
                    </CardDescription>
                  </div>
                  <Button onClick={() => startTest(test)} className="bg-pink-600 hover:bg-pink-700">
                    Пройти тест
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {test.scientific_basis && (
                <CardContent className="pt-0">
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{test.scientific_basis}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Draft Tests (Incomplete) */}
      {draftResults && draftResults.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Незавершённые тесты
            </h3>
            <div className="grid gap-4">
              {draftResults.map((draft) => {
                const test = tests?.find(t => t.id === draft.test_id);
                const answeredCount = Object.keys(draft.answers || {}).length;
                const totalQuestions = questions?.length || 12; // fallback
                const progress = Math.round((answeredCount / totalQuestions) * 100);
                
                return (
                  <Card key={draft.id} className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            <span className="font-semibold">{test?.title}</span>
                            <Badge variant="outline" className="border-orange-500 text-orange-600">
                              Не завершён
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Ребёнок: {getChildName(draft.child_id)} • Сохранено: {format(new Date(draft.completed_at), "dd MMMM yyyy, HH:mm", { locale: ru })}
                          </p>
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>Прогресс</span>
                              <span>{answeredCount} из {totalQuestions} вопросов ({progress}%)</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>
                        <Button 
                          onClick={() => test && startTest(test, draft)}
                          className="ml-4 bg-orange-600 hover:bg-orange-700"
                        >
                          Продолжить
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Results History */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Мои результаты</h3>
        {existingResults?.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Вы ещё не проходили тесты</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {existingResults?.map((result) => {
              const test = tests?.find(t => t.id === result.test_id);
              return (
                <Card key={result.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="font-semibold">{test?.title}</span>
                          <Badge 
                            className={`${getRiskColor(result.risk_level)} text-white`}
                          >
                            Риск: {getRiskLabel(result.risk_level)}
                          </Badge>
                        </div>
                        <p className="text-lg font-medium">{result.result_label}</p>
                        <p className="text-sm text-muted-foreground">
                          Ребёнок: {getChildName(result.child_id)} • {format(new Date(result.completed_at), "dd MMMM yyyy", { locale: ru })}
                        </p>
                        
                        {/* Scores */}
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="text-center p-2 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-pink-600">
                              {result.scores?.warmth}/5
                            </p>
                            <p className="text-xs text-muted-foreground">Эмоц. теплота</p>
                          </div>
                          <div className="text-center p-2 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-pink-600">
                              {result.scores?.control}/5
                            </p>
                            <p className="text-xs text-muted-foreground">Гибкость границ</p>
                          </div>
                          <div className="text-center p-2 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-pink-600">
                              {result.scores?.involvement}/5
                            </p>
                            <p className="text-xs text-muted-foreground">Вовлечённость</p>
                          </div>
                        </div>

                        {/* Recommendations button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 gap-2 border-pink-300 text-pink-600 hover:bg-pink-50"
                          onClick={() => openRecommendations(result)}
                        >
                          <BookOpen className="h-4 w-4" />
                          Подробные рекомендации
                        </Button>
                      </div>
                      
                      {/* Visibility toggle */}
                      <div className="ml-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          {result.is_visible_to_specialists ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Switch
                            checked={result.is_visible_to_specialists}
                            onCheckedChange={(checked) => 
                              toggleVisibilityMutation.mutate({ id: result.id, visible: checked })
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.is_visible_to_specialists 
                            ? "Видно специалистам" 
                            : "Скрыто от специалистов"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Test Taking Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTest?.title}</DialogTitle>
            <DialogDescription>
              {draftResultId 
                ? "Продолжите прохождение теста с того места, где остановились" 
                : "Выберите ребёнка и ответьте на вопросы"}
            </DialogDescription>
          </DialogHeader>

          {/* Child selector - only show if not resuming draft and on first question */}
          {currentQuestionIndex === 0 && !draftResultId && (
            <div className="space-y-2 mb-4">
              <Label>Выберите ребёнка</Label>
              <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите ребёнка" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show child name when resuming */}
          {draftResultId && (
            <div className="p-3 bg-muted rounded-lg mb-4">
              <p className="text-sm">
                <span className="text-muted-foreground">Ребёнок:</span>{" "}
                <span className="font-medium">{getChildName(selectedChildId)}</span>
              </p>
            </div>
          )}

          {questions && questions.length > 0 && (
            <>
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
                  <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
              </div>

              {/* Question */}
              <div className="py-4">
                <p className="text-lg font-medium mb-4">
                  {questions[currentQuestionIndex]?.question_text}
                </p>

                <RadioGroup
                  value={answers[questions[currentQuestionIndex]?.id]?.toString() || ""}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {ANSWER_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors">
                      <RadioGroupItem value={option.value.toString()} id={`answer-${option.value}`} />
                      <Label htmlFor={`answer-${option.value}`} className="flex-1 cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Share consent (on last question) */}
              {currentQuestionIndex === questions.length - 1 && (
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <Switch
                      checked={shareConsent}
                      onCheckedChange={setShareConsent}
                    />
                    <div>
                      <p className="font-medium">Поделиться результатами со специалистами</p>
                      <p className="text-sm text-muted-foreground">
                        Результаты будут видны специалистам, работающим с вашим ребёнком. 
                        Вы можете изменить это в любой момент.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
              Назад
            </Button>
            {questions && currentQuestionIndex < questions.length - 1 ? (
              <Button 
                onClick={nextQuestion}
                disabled={!answers[questions[currentQuestionIndex]?.id]}
              >
                Далее
              </Button>
            ) : (
              <Button 
                onClick={finishTest}
                disabled={!answers[questions?.[currentQuestionIndex]?.id] || saveResultMutation.isPending}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {saveResultMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Завершить
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Тест завершён!
            </DialogTitle>
          </DialogHeader>
          
          {currentResult && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Ваш стиль воспитания</p>
                <p className="text-2xl font-bold">{currentResult.result_label}</p>
                <Badge className={`${getRiskColor(currentResult.risk_level)} text-white mt-2`}>
                  Уровень риска: {getRiskLabel(currentResult.risk_level)}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                  <p className="text-xl font-bold text-pink-600">{currentResult.scores?.warmth}</p>
                  <p className="text-xs text-muted-foreground">Теплота</p>
                </div>
                <div className="p-2 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                  <p className="text-xl font-bold text-pink-600">{currentResult.scores?.control}</p>
                  <p className="text-xs text-muted-foreground">Гибкость</p>
                </div>
                <div className="p-2 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                  <p className="text-xl font-bold text-pink-600">{currentResult.scores?.involvement}</p>
                  <p className="text-xs text-muted-foreground">Вовлечённость</p>
                </div>
              </div>

              {currentResult.recommendations && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Рекомендации
                  </p>
                  <ul className="text-sm space-y-1">
                    {currentResult.recommendations.map((rec: string, i: number) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setResultDialogOpen(false)} className="w-full">
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recommendations Dialog */}
      <TestRecommendationsDialog
        open={recommendationsDialogOpen}
        onOpenChange={setRecommendationsDialogOpen}
        result={selectedResultForRecommendations}
        childName={selectedResultForRecommendations ? getChildName(selectedResultForRecommendations.child_id) : ""}
      />

      {/* Development Test Wizard */}
      <DevelopmentTestWizard
        open={developmentTestOpen}
        onOpenChange={(open) => {
          setDevelopmentTestOpen(open);
          if (!open) setDevelopmentTestChildId(null);
        }}
        parentUserId={parentUserId}
        children={developmentTestChildId ? children.filter(c => c.id === developmentTestChildId).map(c => ({
          id: c.id,
          full_name: c.full_name,
          birth_date: c.birth_date || null
        })) : []}
        onComplete={handleDevelopmentTestComplete}
      />
    </div>
  );
}
