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
  Star, Info, ChevronRight, Lightbulb, Lock, Eye
} from "lucide-react";
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
  completed_at: string;
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

  // Fetch existing results
  const { data: existingResults } = useQuery({
    queryKey: ["parent-test-results", parentUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_test_results" as any)
        .select("*")
        .eq("parent_user_id", parentUserId)
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
      };

      const { data, error } = await supabase
        .from("parent_test_results" as any)
        .insert(resultData as any)
        .select()
        .single() as { data: TestResult | null; error: any };

      if (error) throw error;
      return data as TestResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["parent-test-results"] });
      setTestDialogOpen(false);
      if (result) {
        setCurrentResult(result);
        setResultDialogOpen(true);
      }
      toast({ title: "Тест пройден!" });
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

  const startTest = (test: ParentTest) => {
    if (children.length === 0) {
      toast({
        title: "Сначала добавьте ребёнка",
        description: "Результаты теста сохраняются для конкретного ребёнка",
        variant: "destructive",
      });
      return;
    }
    setSelectedTest(test);
    setSelectedChildId(children[0].id);
    setCurrentQuestionIndex(0);
    setAnswers({});
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

  if (testsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Tests */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Доступные тесты</h3>
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

                        {/* Recommendations */}
                        {result.recommendations && result.recommendations.length > 0 && (
                          <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-pink-600" />
                              <span className="font-medium text-sm">Рекомендации</span>
                            </div>
                            <ul className="text-sm space-y-1">
                              {result.recommendations.map((rec: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-pink-600">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
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
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTest?.title}</DialogTitle>
            <DialogDescription>
              Выберите ребёнка и ответьте на вопросы
            </DialogDescription>
          </DialogHeader>

          {/* Child selector */}
          {currentQuestionIndex === 0 && (
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
    </div>
  );
}
