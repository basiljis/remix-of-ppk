import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, ClipboardList, Users, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ParentTest {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  scientific_basis: string | null;
  is_active: boolean;
  sort_order: number;
  scoring_config: any;
  created_at: string;
}

interface TestQuestion {
  id: string;
  test_id: string;
  question_number: number;
  question_text: string;
  dimension: string;
  is_inverted: boolean;
}

interface TestResult {
  id: string;
  parent_user_id: string;
  child_id: string;
  test_id: string;
  result_type: string;
  result_label: string;
  risk_level: string;
  scores: any;
  completed_at: string;
}

export function ParentTestsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTest, setEditingTest] = useState<ParentTest | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<TestQuestion | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);

  // Form state for test
  const [testForm, setTestForm] = useState({
    slug: "",
    title: "",
    description: "",
    scientific_basis: "",
    is_active: true,
    sort_order: 0,
  });

  // Form state for question
  const [questionForm, setQuestionForm] = useState({
    question_number: 1,
    question_text: "",
    dimension: "",
    is_inverted: false,
  });

  // Fetch tests
  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ["admin-parent-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_tests" as any)
        .select("*")
        .order("sort_order") as { data: ParentTest[] | null; error: any };
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch questions for selected test
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["admin-test-questions", selectedTestId],
    queryFn: async () => {
      if (!selectedTestId) return [];
      const { data, error } = await supabase
        .from("parent_test_questions" as any)
        .select("*")
        .eq("test_id", selectedTestId)
        .order("question_number") as { data: TestQuestion[] | null; error: any };
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedTestId,
  });

  // Fetch test results statistics
  const { data: resultsStats } = useQuery({
    queryKey: ["admin-test-results-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_test_results" as any)
        .select("test_id, result_type, risk_level") as { data: TestResult[] | null; error: any };
      if (error) throw error;
      
      // Group by test and result type
      const stats: Record<string, { total: number; byType: Record<string, number>; byRisk: Record<string, number> }> = {};
      (data || []).forEach((r) => {
        if (!stats[r.test_id]) {
          stats[r.test_id] = { total: 0, byType: {}, byRisk: {} };
        }
        stats[r.test_id].total++;
        stats[r.test_id].byType[r.result_type] = (stats[r.test_id].byType[r.result_type] || 0) + 1;
        if (r.risk_level) {
          stats[r.test_id].byRisk[r.risk_level] = (stats[r.test_id].byRisk[r.risk_level] || 0) + 1;
        }
      });
      return stats;
    },
  });

  // Mutations
  const updateTestMutation = useMutation({
    mutationFn: async (test: Partial<ParentTest> & { id?: string }) => {
      if (test.id) {
        const { error } = await supabase
          .from("parent_tests" as any)
          .update({
            slug: test.slug,
            title: test.title,
            description: test.description,
            scientific_basis: test.scientific_basis,
            is_active: test.is_active,
            sort_order: test.sort_order,
          } as any)
          .eq("id", test.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("parent_tests" as any)
          .insert({
            slug: test.slug,
            title: test.title,
            description: test.description,
            scientific_basis: test.scientific_basis,
            is_active: test.is_active,
            sort_order: test.sort_order,
            scoring_config: {},
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-parent-tests"] });
      setTestDialogOpen(false);
      setEditingTest(null);
      toast({ title: "Тест сохранён" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (question: Partial<TestQuestion> & { id?: string }) => {
      if (question.id) {
        const { error } = await supabase
          .from("parent_test_questions" as any)
          .update({
            question_number: question.question_number,
            question_text: question.question_text,
            dimension: question.dimension,
            is_inverted: question.is_inverted,
          } as any)
          .eq("id", question.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("parent_test_questions" as any)
          .insert({
            test_id: selectedTestId,
            question_number: question.question_number,
            question_text: question.question_text,
            dimension: question.dimension,
            is_inverted: question.is_inverted,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-test-questions", selectedTestId] });
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({ title: "Вопрос сохранён" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("parent_test_questions" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-test-questions", selectedTestId] });
      toast({ title: "Вопрос удалён" });
    },
  });

  const handleEditTest = (test: ParentTest) => {
    setEditingTest(test);
    setTestForm({
      slug: test.slug,
      title: test.title,
      description: test.description || "",
      scientific_basis: test.scientific_basis || "",
      is_active: test.is_active,
      sort_order: test.sort_order,
    });
    setTestDialogOpen(true);
  };

  const handleNewTest = () => {
    setEditingTest(null);
    setTestForm({
      slug: "",
      title: "",
      description: "",
      scientific_basis: "",
      is_active: true,
      sort_order: (tests?.length || 0) + 1,
    });
    setTestDialogOpen(true);
  };

  const handleEditQuestion = (question: TestQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_number: question.question_number,
      question_text: question.question_text,
      dimension: question.dimension,
      is_inverted: question.is_inverted,
    });
    setQuestionDialogOpen(true);
  };

  const handleNewQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question_number: (questions?.length || 0) + 1,
      question_text: "",
      dimension: "",
      is_inverted: false,
    });
    setQuestionDialogOpen(true);
  };

  const handleSaveTest = () => {
    updateTestMutation.mutate({
      ...testForm,
      id: editingTest?.id,
    });
  };

  const handleSaveQuestion = () => {
    updateQuestionMutation.mutate({
      ...questionForm,
      id: editingQuestion?.id,
    });
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "low":
        return <Badge className="bg-green-100 text-green-800">Низкий</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Средний</Badge>;
      case "high":
        return <Badge className="bg-red-100 text-red-800">Высокий</Badge>;
      default:
        return null;
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Тесты для родителей</h2>
          <p className="text-muted-foreground">
            Управление тестами и вопросами для кабинета родителя
          </p>
        </div>
        <Button onClick={handleNewTest} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить тест
        </Button>
      </div>

      <Tabs defaultValue="tests">
        <TabsList>
          <TabsTrigger value="tests" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Тесты ({tests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Статистика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="mt-4 space-y-4">
          {tests?.map((test) => (
            <Card key={test.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{test.title}</CardTitle>
                      {test.is_active ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Активен
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Неактивен</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      slug: {test.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTest(test)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={selectedTestId === test.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTestId(selectedTestId === test.id ? null : test.id)}
                    >
                      Вопросы
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {test.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{test.description}</p>
                </CardContent>
              )}

              {/* Questions section */}
              {selectedTestId === test.id && (
                <CardContent className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Вопросы теста</h4>
                    <Button size="sm" onClick={handleNewQuestion} className="gap-1">
                      <Plus className="h-3 w-3" />
                      Добавить вопрос
                    </Button>
                  </div>
                  
                  {questionsLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : questions?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Нет вопросов</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">№</TableHead>
                          <TableHead>Вопрос</TableHead>
                          <TableHead className="w-40">Измерение</TableHead>
                          <TableHead className="w-24">Инверсия</TableHead>
                          <TableHead className="w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questions?.map((q) => (
                          <TableRow key={q.id}>
                            <TableCell className="font-medium">{q.question_number}</TableCell>
                            <TableCell>{q.question_text}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{q.dimension}</Badge>
                            </TableCell>
                            <TableCell>
                              {q.is_inverted && (
                                <Badge variant="secondary">Да</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditQuestion(q)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => deleteQuestionMutation.mutate(q.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="statistics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Статистика прохождения тестов</CardTitle>
            </CardHeader>
            <CardContent>
              {tests?.map((test) => {
                const stats = resultsStats?.[test.id];
                if (!stats) return null;
                
                return (
                  <div key={test.id} className="mb-6 last:mb-0">
                    <h4 className="font-semibold mb-2">{test.title}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">Всего прохождений</p>
                      </div>
                      {Object.entries(stats.byRisk).map(([risk, count]) => (
                        <div key={risk} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold">{count}</p>
                            {getRiskBadge(risk)}
                          </div>
                          <p className="text-sm text-muted-foreground">Риск</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {!resultsStats || Object.keys(resultsStats).length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  Пока нет данных о прохождении тестов
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTest ? "Редактировать тест" : "Новый тест"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug (уникальный идентификатор)</Label>
                <Input
                  value={testForm.slug}
                  onChange={(e) => setTestForm({ ...testForm, slug: e.target.value })}
                  placeholder="parenting-style"
                />
              </div>
              <div className="space-y-2">
                <Label>Порядок сортировки</Label>
                <Input
                  type="number"
                  value={testForm.sort_order}
                  onChange={(e) => setTestForm({ ...testForm, sort_order: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={testForm.title}
                onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                placeholder="Стиль моего родительства"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={testForm.description}
                onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Научная основа</Label>
              <Textarea
                value={testForm.scientific_basis}
                onChange={(e) => setTestForm({ ...testForm, scientific_basis: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={testForm.is_active}
                onCheckedChange={(checked) => setTestForm({ ...testForm, is_active: checked })}
              />
              <Label>Активен</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveTest} disabled={updateTestMutation.isPending}>
              {updateTestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Редактировать вопрос" : "Новый вопрос"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Номер вопроса</Label>
                <Input
                  type="number"
                  value={questionForm.question_number}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_number: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Измерение</Label>
                <Input
                  value={questionForm.dimension}
                  onChange={(e) => setQuestionForm({ ...questionForm, dimension: e.target.value })}
                  placeholder="emotional_sensitivity"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Текст вопроса</Label>
              <Textarea
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={questionForm.is_inverted}
                onCheckedChange={(checked) => setQuestionForm({ ...questionForm, is_inverted: checked })}
              />
              <Label>Инверсия (обратный подсчёт)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveQuestion} disabled={updateQuestionMutation.isPending}>
              {updateQuestionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
