import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, ChevronLeft, ChevronRight, CheckCircle2, 
  AlertTriangle, Video, Camera, Upload, Baby, Calendar,
  Activity, MessageCircle, Brain, Users, Heart
} from "lucide-react";
import { format, differenceInMonths, differenceInYears } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useDevelopmentTest, Sphere, DevelopmentTask, AgeGroup } from "@/hooks/useDevelopmentTest";
import { cn } from "@/lib/utils";

interface ParentChild {
  id: string;
  full_name: string;
  birth_date: string | null;
}

interface DevelopmentTestWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentUserId: string;
  children: ParentChild[];
  onComplete: () => void;
}

const sphereIcons: Record<string, React.ReactNode> = {
  motor: <Activity className="h-5 w-5" />,
  speech: <MessageCircle className="h-5 w-5" />,
  cognitive: <Brain className="h-5 w-5" />,
  social: <Users className="h-5 w-5" />,
  emotional: <Heart className="h-5 w-5" />,
};

type Step = "select-child" | "consent" | "test" | "media" | "results";

export function DevelopmentTestWizard({
  open,
  onOpenChange,
  parentUserId,
  children,
  onComplete,
}: DevelopmentTestWizardProps) {
  const { toast } = useToast();
  const {
    test,
    testLoading,
    ageGroups,
    spheres,
    getAgeGroupForChild,
    fetchTasksForAgeGroup,
    calculateSphereScores,
    calculateRiskLevel,
    generateRecommendations,
    saveResultMutation,
  } = useDevelopmentTest();

  const [step, setStep] = useState<Step>("select-child");
  const [selectedChild, setSelectedChild] = useState<ParentChild | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [tasks, setTasks] = useState<DevelopmentTask[]>([]);
  const [currentSphereIndex, setCurrentSphereIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{ task_id: string; answer: string; sphere_id: string }>>([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep("select-child");
      setSelectedChild(null);
      setAgeGroup(null);
      setTasks([]);
      setCurrentSphereIndex(0);
      setCurrentTaskIndex(0);
      setAnswers([]);
      setConsentGiven(false);
      setResult(null);
    }
  }, [open]);

  // Load tasks when age group is selected
  useEffect(() => {
    if (ageGroup) {
      setLoading(true);
      fetchTasksForAgeGroup(ageGroup.id)
        .then((data) => {
          setTasks(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading tasks:", err);
          setLoading(false);
        });
    }
  }, [ageGroup]);

  const handleSelectChild = (child: ParentChild) => {
    if (!child.birth_date) {
      toast({
        title: "Укажите дату рождения",
        description: "Для прохождения теста нужна дата рождения ребёнка",
        variant: "destructive",
      });
      return;
    }
    setSelectedChild(child);
    const group = getAgeGroupForChild(child.birth_date);
    if (!group) {
      toast({
        title: "Возрастная группа не найдена",
        description: "Тест доступен для детей от 0 до 18 лет",
        variant: "destructive",
      });
      return;
    }
    setAgeGroup(group);
    setStep("consent");
  };

  const getChildAge = (birthDate: string) => {
    const years = differenceInYears(new Date(), new Date(birthDate));
    const months = differenceInMonths(new Date(), new Date(birthDate)) % 12;
    if (years === 0) return `${months} мес.`;
    return months > 0 ? `${years} лет ${months} мес.` : `${years} лет`;
  };

  const getCurrentSphereTasks = () => {
    if (!spheres || spheres.length === 0) return [];
    const currentSphere = spheres[currentSphereIndex];
    return tasks.filter((t) => t.sphere_id === currentSphere.id);
  };

  const currentTask = getCurrentSphereTasks()[currentTaskIndex];
  const currentSphere = spheres?.[currentSphereIndex];

  const totalTasks = tasks.length;
  const completedTasks = answers.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleAnswer = (answer: string) => {
    if (!currentTask || !currentSphere) return;

    const newAnswer = {
      task_id: currentTask.id,
      answer,
      sphere_id: currentSphere.id,
    };

    // Update or add answer
    const existingIndex = answers.findIndex((a) => a.task_id === currentTask.id);
    if (existingIndex >= 0) {
      const updated = [...answers];
      updated[existingIndex] = newAnswer;
      setAnswers(updated);
    } else {
      setAnswers([...answers, newAnswer]);
    }

    // Move to next task
    const sphereTasks = getCurrentSphereTasks();
    if (currentTaskIndex < sphereTasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else if (currentSphereIndex < (spheres?.length || 0) - 1) {
      setCurrentSphereIndex(currentSphereIndex + 1);
      setCurrentTaskIndex(0);
    } else {
      // All done - go to media step or directly to results
      setStep("media");
    }
  };

  const handlePrevious = () => {
    const sphereTasks = getCurrentSphereTasks();
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    } else if (currentSphereIndex > 0) {
      setCurrentSphereIndex(currentSphereIndex - 1);
      const prevSphereTasks = tasks.filter((t) => t.sphere_id === spheres![currentSphereIndex - 1].id);
      setCurrentTaskIndex(prevSphereTasks.length - 1);
    }
  };

  const handleFinish = async () => {
    if (!selectedChild || !test || !ageGroup || !spheres) return;

    setLoading(true);
    try {
      const sphereScores = calculateSphereScores(answers, tasks, spheres);
      const riskLevel = calculateRiskLevel(sphereScores);
      const recommendations = generateRecommendations(sphereScores, spheres);
      const childAgeMonths = differenceInMonths(new Date(), new Date(selectedChild.birth_date!));

      await saveResultMutation.mutateAsync({
        childId: selectedChild.id,
        parentUserId,
        testId: test.id,
        ageGroupId: ageGroup.id,
        childAgeMonths,
        answers,
        sphereScores,
        riskLevel,
        recommendations,
        consentGiven,
      });

      const resultData = {
        sphere_scores: sphereScores,
        overall_risk_level: riskLevel,
        recommendations,
      };

      setResult(resultData);
      setStep("results");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentAnswer = () => {
    if (!currentTask) return "";
    return answers.find((a) => a.task_id === currentTask.id)?.answer || "";
  };

  const renderStep = () => {
    switch (step) {
      case "select-child":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Выберите ребёнка</h3>
              <p className="text-muted-foreground text-sm">
                Система автоматически подберёт возрастные нормы и критерии оценки
              </p>
            </div>

            <div className="grid gap-3">
              {children.map((child) => (
                <Card
                  key={child.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedChild?.id === child.id && "ring-2 ring-primary"
                  )}
                  onClick={() => handleSelectChild(child)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-12 w-12 rounded-full bg-pink-100 dark:bg-pink-950 flex items-center justify-center">
                      <Baby className="h-6 w-6 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{child.full_name}</p>
                      {child.birth_date ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(child.birth_date), "dd.MM.yyyy", { locale: ru })}</span>
                          <Badge variant="secondary" className="text-xs">
                            {getChildAge(child.birth_date)}
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-sm text-orange-600">Укажите дату рождения</p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "consent":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2">Информированное согласие</h3>
              <Badge variant="secondary">{ageGroup?.label}</Badge>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Тест не является медицинским диагнозом. Результаты используются для 
                персонализации рекомендаций в системе UNIVERSUM.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">Система автоматически подберёт:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Возрастные нормы (ФГОС ДО / ОО)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Критерии оценки по 5 сферам развития
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Примеры выполнения заданий
                </li>
              </ul>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Checkbox
                id="consent"
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(!!checked)}
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                Я понимаю, что результаты могут быть переданы специалистам ППк с моего согласия. 
                Фото/видео хранятся в защищённом хранилище (соответствие ФЗ-152).
              </Label>
            </div>

            <Button
              className="w-full"
              onClick={() => setStep("test")}
              disabled={!consentGiven}
            >
              Начать тест
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case "test":
        if (loading || !currentSphere || !currentTask) {
          return (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Прогресс</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Sphere indicator */}
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: `${currentSphere.color}20` }}>
              <div style={{ color: currentSphere.color || "hsl(var(--primary))" }}>
                {sphereIcons[currentSphere.slug]}
              </div>
              <span className="font-medium" style={{ color: currentSphere.color || "hsl(var(--foreground))" }}>
                {currentSphere.name}
              </span>
              <Badge variant="outline" className="ml-auto">
                {currentTaskIndex + 1} / {getCurrentSphereTasks().length}
              </Badge>
            </div>

            {/* Task */}
            <Card className="p-4">
              <p className="text-lg font-medium mb-2">{currentTask.task_text}</p>
              {currentTask.age_range_hint && (
                <Badge variant="secondary" className="mb-4">
                  Возраст: {currentTask.age_range_hint}
                </Badge>
              )}

              {currentTask.video_demo_title && (
                <Button variant="outline" size="sm" className="mb-4 gap-2">
                  <Video className="h-4 w-4" />
                  {currentTask.video_demo_title}
                </Button>
              )}

              <RadioGroup value={getCurrentAnswer()} onValueChange={handleAnswer} className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="yes_easy" id="yes_easy" />
                  <Label htmlFor="yes_easy" className="flex-1 cursor-pointer">
                    <span className="font-medium">Да, легко</span>
                    <span className="block text-sm text-muted-foreground">Выполняет самостоятельно</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="yes_help" id="yes_help" />
                  <Label htmlFor="yes_help" className="flex-1 cursor-pointer">
                    <span className="font-medium">Да, с помощью</span>
                    <span className="block text-sm text-muted-foreground">Нужна поддержка взрослого</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="flex-1 cursor-pointer">
                    <span className="font-medium">Пока нет</span>
                    <span className="block text-sm text-muted-foreground">Пока не освоил</span>
                  </Label>
                </div>
              </RadioGroup>
            </Card>

            {/* Navigation */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSphereIndex === 0 && currentTaskIndex === 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Назад
              </Button>
            </div>
          </div>
        );

      case "media":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2">Прикрепите доказательства развития</h3>
              <p className="text-muted-foreground text-sm">
                2–3 фото/видео достаточно для объективной оценки
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-24 flex-col gap-2">
                <Camera className="h-6 w-6" />
                <span className="text-sm">Сделать фото</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2">
                <Upload className="h-6 w-6" />
                <span className="text-sm">Загрузить видео</span>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Эксперты системы проанализируют материалы для уточнения оценки
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleFinish} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Продолжить без фото
              </Button>
              <Button onClick={handleFinish} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Завершить
              </Button>
            </div>
          </div>
        );

      case "results":
        if (!result) return null;
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Тест завершён!</h3>
              <p className="text-muted-foreground text-sm">
                {selectedChild?.full_name}, {selectedChild?.birth_date && getChildAge(selectedChild.birth_date)}
              </p>
            </div>

            {/* Risk level badge */}
            <div className="flex justify-center">
              <Badge
                className={cn(
                  "text-white px-4 py-1",
                  result.overall_risk_level === "normal" && "bg-green-500",
                  result.overall_risk_level === "attention" && "bg-yellow-500",
                  result.overall_risk_level === "help_needed" && "bg-red-500"
                )}
              >
                {result.overall_risk_level === "normal" && "Норма развития"}
                {result.overall_risk_level === "attention" && "Требует внимания"}
                {result.overall_risk_level === "help_needed" && "Требуется помощь специалистов"}
              </Badge>
            </div>

            {/* Sphere scores */}
            <div className="space-y-2">
              {spheres?.map((sphere) => {
                const score = result.sphere_scores[sphere.slug] || 0;
                return (
                  <div key={sphere.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" 
                         style={{ backgroundColor: `${sphere.color}20`, color: sphere.color || "hsl(var(--primary))" }}>
                      {sphereIcons[sphere.slug]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{sphere.name}</span>
                        <span className="font-medium">{score}%</span>
                      </div>
                      <Progress 
                        value={score} 
                        className="h-2"
                        style={{ 
                          backgroundColor: `${sphere.color}20`,
                        }}
                      />
                    </div>
                    {score < 70 && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  </div>
                );
              })}
            </div>

            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Следующая проверка запланирована через 3 месяца. 
                Напоминание автоматически добавлено в календарь.
              </AlertDescription>
            </Alert>

            <Button className="w-full" onClick={() => { onComplete(); onOpenChange(false); }}>
              Посмотреть рекомендации
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-pink-600" />
            {test?.title || "Мой ребенок растет"}
          </DialogTitle>
          <DialogDescription>
            {step === "select-child" && "Мониторинг развития по 5 сферам"}
            {step === "consent" && "Подготовка к тестированию"}
            {step === "test" && "Оцените развитие ребёнка"}
            {step === "media" && "Дополнительные материалы"}
            {step === "results" && "Результаты тестирования"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {testLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            renderStep()
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
