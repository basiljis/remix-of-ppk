import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Play, CheckCircle, Clock, Star, Trophy, 
  Brain, MessageCircle, Heart, Hand, Mic, ChevronRight, RotateCcw 
} from "lucide-react";
import { gameItemImages, sphereImages, taskImages } from "@/assets/game-items";

// Helper to find task image based on task title or content
const getTaskImage = (task: BlockTask): string | null => {
  const title = task.title.toLowerCase();
  const instruction = task.instruction.toLowerCase();
  
  // Check for specific keywords
  if (title.includes("фрукт") || instruction.includes("фрукт")) return taskImages.count_fruits;
  if (title.includes("эмоци") || instruction.includes("эмоци")) return taskImages.happy;
  if (title.includes("грусть") || instruction.includes("грустит")) return taskImages.sad;
  if (title.includes("память") || instruction.includes("запомни")) return taskImages.color_memory;
  if (title.includes("бабочка") || instruction.includes("бабочк")) return taskImages.butterfly;
  if (title.includes("дыши") || instruction.includes("дыхани") || instruction.includes("вдохни")) return taskImages.breathing_calm;
  if (title.includes("язык") || instruction.includes("язык") || instruction.includes("язычок")) return taskImages.tongue;
  if (title.includes("здоров") || instruction.includes("здоров") || instruction.includes("привет")) return taskImages.hello;
  
  return null;
};

interface TaskBlock {
  id: string;
  sphere_slug: string;
  title: string;
  description: string | null;
  estimated_duration_minutes: number;
}

interface BlockTask {
  id: string;
  block_id: string;
  task_type: string;
  title: string;
  instruction: string;
  content: any;
  points: number;
}

interface TaskProgress {
  id: string;
  child_id: string;
  block_id: string;
  task_id: string;
  status: string;
  answer: any;
  score: number | null;
  interaction_time_seconds: number | null;
}

const sphereConfig: Record<string, { name: string; icon: any; color: string; bgColor: string; textColor: string }> = {
  motor: { name: "Моторика", icon: Hand, color: "text-blue-600", bgColor: "bg-blue-100", textColor: "text-blue-900" },
  speech: { name: "Речь", icon: Mic, color: "text-green-600", bgColor: "bg-green-100", textColor: "text-green-900" },
  cognitive: { name: "Познание", icon: Brain, color: "text-purple-600", bgColor: "bg-purple-100", textColor: "text-purple-900" },
  social: { name: "Общение", icon: MessageCircle, color: "text-orange-600", bgColor: "bg-orange-100", textColor: "text-orange-900" },
  emotional: { name: "Эмоции", icon: Heart, color: "text-pink-600", bgColor: "bg-pink-100", textColor: "text-pink-900" },
};

export default function ChildWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get("childId");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedBlock, setSelectedBlock] = useState<TaskBlock | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [totalPoints, setTotalPoints] = useState(0);
  
  // Interaction time tracking
  const taskStartTimeRef = useRef<number | null>(null);
  const interactionTimeRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(Date.now());
  const isActiveRef = useRef<boolean>(true);
  const INACTIVITY_THRESHOLD = 30000; // 30 seconds of inactivity = not counting time

  // Track user activity
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    
    // If was inactive, restart the active period
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      lastActivityRef.current = now;
    } else {
      // If was active, add time since last activity (up to threshold)
      const timeSinceLastActivity = now - lastActivityRef.current;
      if (timeSinceLastActivity < INACTIVITY_THRESHOLD) {
        interactionTimeRef.current += timeSinceLastActivity;
      }
      lastActivityRef.current = now;
    }
  }, []);

  // Set up activity listeners when task is active
  useEffect(() => {
    if (!selectedBlock || !currentTask) return;
    
    // Reset timing for new task
    taskStartTimeRef.current = Date.now();
    interactionTimeRef.current = 0;
    lastActivityRef.current = Date.now();
    isActiveRef.current = true;

    const events = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Check for inactivity periodically
    const inactivityCheck = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > INACTIVITY_THRESHOLD) {
        isActiveRef.current = false;
      }
    }, 5000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(inactivityCheck);
    };
  }, [selectedBlock?.id, currentTaskIndex, handleUserActivity]);

  // Calculate final interaction time
  const getInteractionTime = useCallback((): number => {
    // Add any remaining active time
    if (isActiveRef.current && lastActivityRef.current) {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      if (timeSinceLastActivity < INACTIVITY_THRESHOLD) {
        return Math.round((interactionTimeRef.current + timeSinceLastActivity) / 1000);
      }
    }
    return Math.round(interactionTimeRef.current / 1000);
  }, []);

  // Fetch task blocks
  const { data: blocks = [] } = useQuery({
    queryKey: ["task-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("development_task_blocks")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as TaskBlock[];
    },
  });

  // Fetch tasks for selected block
  const { data: tasks = [] } = useQuery({
    queryKey: ["block-tasks", selectedBlock?.id],
    queryFn: async () => {
      if (!selectedBlock?.id) return [];
      const { data, error } = await supabase
        .from("development_block_tasks")
        .select("*")
        .eq("block_id", selectedBlock.id)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as BlockTask[];
    },
    enabled: !!selectedBlock?.id,
  });

  // Fetch progress
  const { data: progress = [] } = useQuery({
    queryKey: ["child-progress", childId],
    queryFn: async () => {
      if (!childId) return [];
      const { data, error } = await supabase
        .from("child_task_progress")
        .select("*")
        .eq("child_id", childId);
      if (error) throw error;
      return (data || []) as unknown as TaskProgress[];
    },
    enabled: !!childId,
  });

  // Save progress mutation with interaction time
  const saveProgressMutation = useMutation({
    mutationFn: async ({ taskId, answer, score, interactionTimeSeconds }: { 
      taskId: string; 
      answer: any; 
      score: number;
      interactionTimeSeconds: number;
    }) => {
      if (!childId || !selectedBlock) return;
      const { error } = await supabase
        .from("child_task_progress")
        .upsert({
          child_id: childId,
          block_id: selectedBlock.id,
          task_id: taskId,
          status: "completed",
          answer: answer as any,
          score,
          interaction_time_seconds: interactionTimeSeconds,
          started_at: taskStartTimeRef.current ? new Date(taskStartTimeRef.current).toISOString() : null,
          completed_at: new Date().toISOString(),
        }, { onConflict: "child_id,task_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child-progress", childId] });
    },
  });

  // Shuffle and sort tasks: new tasks first (shuffled), completed tasks last with "repeat" label
  const sortedTasks = useMemo(() => {
    if (tasks.length === 0) return [];
    
    const completedTaskIds = new Set(
      progress
        .filter(p => p.block_id === selectedBlock?.id && p.status === "completed")
        .map(p => p.task_id)
    );
    
    const newTasks = tasks.filter(t => !completedTaskIds.has(t.id));
    const completedTasks = tasks.filter(t => completedTaskIds.has(t.id));
    
    // Shuffle new tasks using Fisher-Yates
    const shuffledNew = [...newTasks];
    for (let i = shuffledNew.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledNew[i], shuffledNew[j]] = [shuffledNew[j], shuffledNew[i]];
    }
    
    // Shuffle completed tasks too
    const shuffledCompleted = [...completedTasks];
    for (let i = shuffledCompleted.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCompleted[i], shuffledCompleted[j]] = [shuffledCompleted[j], shuffledCompleted[i]];
    }
    
    return [...shuffledNew, ...shuffledCompleted];
  }, [tasks, progress, selectedBlock?.id]);

  const currentTask = sortedTasks[currentTaskIndex];
  const isCurrentTaskRepeat = useMemo(() => {
    if (!currentTask) return false;
    return progress.some(p => p.task_id === currentTask.id && p.status === "completed");
  }, [currentTask, progress]);
  
  const _blockProgress = progress.filter(p => p.block_id === selectedBlock?.id);

  const handleSubmitAnswer = async () => {
    if (!currentTask || !selectedAnswer) return;

    let score = 0;
    const content = currentTask.content as any;
    
    if (currentTask.task_type === "question" && content?.correct !== undefined) {
      score = parseInt(selectedAnswer) === content.correct ? currentTask.points : 0;
    } else {
      score = currentTask.points; // Full points for exercises
    }

    // Get actual interaction time
    const interactionTimeSeconds = getInteractionTime();

    await saveProgressMutation.mutateAsync({
      taskId: currentTask.id,
      answer: { selected: selectedAnswer },
      score,
      interactionTimeSeconds,
    });

    setTotalPoints(prev => prev + score);
    
    if (score > 0) {
      toast({
        title: "Отлично! 🎉",
        description: `+${score} очков!`,
      });
    }

    setSelectedAnswer("");
    
    if (currentTaskIndex < sortedTasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
    } else {
      toast({
        title: "Блок завершён! 🏆",
        description: `Ты заработал ${totalPoints + score} очков!`,
      });
      setSelectedBlock(null);
      setCurrentTaskIndex(0);
    }
  };

  const getBlockCompletionPercent = (blockId: string) => {
    const blockTasks = tasks.filter(t => t.block_id === blockId);
    const completed = progress.filter(p => p.block_id === blockId && p.status === "completed");
    if (blockTasks.length === 0) return 0;
    return Math.round((completed.length / blockTasks.length) * 100);
  };

  if (!childId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-background dark:to-muted flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Выберите ребёнка для прохождения заданий</p>
            <Button onClick={() => navigate("/parent")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться в кабинет
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Task completion screen
  if (selectedBlock && currentTask) {
    const config = sphereConfig[selectedBlock.sphere_slug] || sphereConfig.cognitive;
    const Icon = config.icon;
    const content = currentTask.content as any;

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-background dark:to-muted">
        {/* Header */}
        <header className="bg-card border-b p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setSelectedBlock(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-bold">{totalPoints}</span>
            </div>
          </div>
        </header>

        {/* Progress */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">
              Задание {currentTaskIndex + 1} из {sortedTasks.length}
            </span>
            {isCurrentTaskRepeat && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                Повторение
              </Badge>
            )}
          </div>
          <Progress value={((currentTaskIndex + 1) / sortedTasks.length) * 100} className="h-2" />
        </div>

        {/* Task Card */}
        <div className="container mx-auto px-4 py-6">
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader className={`${config.bgColor} rounded-t-lg`}>
              <div className="flex items-center gap-3">
                {sphereImages[selectedBlock.sphere_slug] ? (
                  <img 
                    src={sphereImages[selectedBlock.sphere_slug]} 
                    alt={config.name} 
                    className="w-14 h-14 object-contain rounded-full bg-white/80 p-1"
                  />
                ) : (
                  <div className={`p-3 rounded-full bg-white/80 ${config.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <CardTitle className={`text-lg ${config.textColor}`}>{currentTask.title}</CardTitle>
                  <CardDescription className={`${config.textColor} opacity-80`}>
                    {selectedBlock.title}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-8">
              {/* Task illustration */}
              {getTaskImage(currentTask) && (
                <div className="flex justify-center mb-6">
                  <img 
                    src={getTaskImage(currentTask)!} 
                    alt="Иллюстрация к заданию" 
                    className="w-40 h-40 object-contain rounded-xl bg-white/50 p-2 shadow-sm"
                  />
                </div>
              )}
              
              <p className="text-lg mb-6">{currentTask.instruction}</p>

              {/* Question type */}
              {currentTask.task_type === "question" && content?.options && (
                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-3">
                  {(content.options as string[]).map((option, index) => {
                    const optionLower = option.toLowerCase().trim();
                    const imageUrl = gameItemImages[optionLower];
                    
                    return (
                      <div 
                        key={index}
                        className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all cursor-pointer
                          ${selectedAnswer === String(index) 
                            ? "border-primary bg-primary/5" 
                            : "border-muted hover:border-primary/50"
                          }`}
                        onClick={() => setSelectedAnswer(String(index))}
                      >
                        <RadioGroupItem value={String(index)} id={`option-${index}`} />
                        {imageUrl && (
                          <img 
                            src={imageUrl} 
                            alt={option} 
                            className="w-20 h-20 object-contain rounded-lg bg-white/80 p-1"
                          />
                        )}
                        <Label htmlFor={`option-${index}`} className="text-lg cursor-pointer flex-1 font-medium">
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}

              {/* Exercise type */}
              {currentTask.task_type === "exercise" && content?.steps && (
                <div className="space-y-3">
                  {(content.steps as string[]).map((step, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSelectedAnswer("done")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Я выполнил задание!
                    </Button>
                  </div>
                </div>
              )}

              {/* Game type placeholder */}
              {currentTask.task_type === "game" && (
                <div className="text-center py-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                    <Play className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-muted-foreground mb-4">Игровое задание</p>
                  <Button onClick={() => setSelectedAnswer("played")}>
                    Я поиграл!
                  </Button>
                </div>
              )}

              <div className="mt-8">
                <Button 
                  className="w-full text-lg py-6"
                  disabled={!selectedAnswer || saveProgressMutation.isPending}
                  onClick={handleSubmitAnswer}
                >
                  {currentTaskIndex < tasks.length - 1 ? (
                    <>
                      Дальше
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Завершить
                      <Trophy className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Block selection screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-background dark:to-muted">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/parent")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Задания для развития</h1>
            <p className="text-sm text-muted-foreground">Выбери блок и начни выполнять задания!</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-bold">{progress.reduce((sum, p) => sum + (p.score || 0), 0)}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block) => {
            const config = sphereConfig[block.sphere_slug] || sphereConfig.cognitive;
            const Icon = config.icon;
            const completionPercent = getBlockCompletionPercent(block.id);

            return (
              <Card 
                key={block.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => {
                  setSelectedBlock(block);
                  setCurrentTaskIndex(0);
                  setTotalPoints(0);
                }}
              >
                <CardHeader className={`${config.bgColor} rounded-t-lg`}>
                  <div className="flex items-center gap-3">
                    {sphereImages[block.sphere_slug] ? (
                      <img 
                        src={sphereImages[block.sphere_slug]} 
                        alt={config.name} 
                        className="w-14 h-14 object-contain rounded-full bg-white/80 p-1"
                      />
                    ) : (
                      <div className={`p-3 rounded-full bg-white/80 ${config.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <CardTitle className={`text-base ${config.textColor}`}>{block.title}</CardTitle>
                      <p className={`text-sm ${config.textColor} opacity-80`}>{config.name}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {block.description && (
                    <p className="text-sm text-muted-foreground mb-3">{block.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{block.estimated_duration_minutes} мин</span>
                    </div>
                    {completionPercent > 0 && (
                      <Badge variant={completionPercent === 100 ? "default" : "secondary"}>
                        {completionPercent}%
                      </Badge>
                    )}
                  </div>
                  {completionPercent > 0 && (
                    <Progress value={completionPercent} className="mt-3 h-1.5" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {blocks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Загрузка заданий...
          </div>
        )}
      </div>
    </div>
  );
}
