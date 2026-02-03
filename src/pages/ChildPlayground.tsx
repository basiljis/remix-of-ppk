import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { 
  ArrowLeft, Baby, Gamepad2, Clock, Star, Trophy, 
  Calendar as CalendarIcon, ChevronRight, Home, Play,
  Hand, Mic, Brain, MessageCircle, Heart
} from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

interface ParentChild {
  id: string;
  full_name: string;
  birth_date: string | null;
  child_unique_id: string;
}

interface TaskProgress {
  id: string;
  child_id: string;
  block_id: string;
  task_id: string;
  status: string;
  score: number | null;
  completed_at: string | null;
  started_at: string | null;
  interaction_time_seconds: number | null;
  block?: {
    title: string;
    sphere_slug: string;
  };
}

interface TaskBlock {
  id: string;
  sphere_slug: string;
  title: string;
  description: string | null;
  estimated_duration_minutes: number;
}

const sphereConfig: Record<string, { name: string; icon: any; color: string; bgColor: string }> = {
  motor: { name: "Моторика", icon: Hand, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  speech: { name: "Речь", icon: Mic, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  cognitive: { name: "Познание", icon: Brain, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  social: { name: "Общение", icon: MessageCircle, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  emotional: { name: "Эмоции", icon: Heart, color: "text-pink-600", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} сек`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes} мин ${remainingSeconds} сек` : `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} ч ${remainingMinutes} мин`;
}

export default function ChildPlayground() {
  const navigate = useNavigate();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Fetch parent's children
  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["parent-children-playground"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("parent_children")
        .select("id, full_name, birth_date, child_unique_id")
        .eq("parent_user_id", user.id)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return (data || []) as ParentChild[];
    },
  });

  // Fetch progress for selected child
  const { data: progress = [] } = useQuery({
    queryKey: ["child-playground-progress", selectedChildId],
    queryFn: async () => {
      if (!selectedChildId) return [];
      
      const { data, error } = await supabase
        .from("child_task_progress")
        .select(`
          id,
          child_id,
          block_id,
          task_id,
          status,
          score,
          completed_at,
          started_at,
          interaction_time_seconds
        `)
        .eq("child_id", selectedChildId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as TaskProgress[];
    },
    enabled: !!selectedChildId,
  });

  // Fetch blocks for reference
  const { data: blocks = [] } = useQuery({
    queryKey: ["playground-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("development_task_blocks")
        .select("id, title, sphere_slug, description, estimated_duration_minutes")
        .eq("is_active", true);
      
      if (error) throw error;
      return (data || []) as TaskBlock[];
    },
  });

  // Auto-select first child if only one
  useEffect(() => {
    if (children.length === 1 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  // Get block info by id
  const getBlockInfo = (blockId: string) => {
    return blocks.find(b => b.id === blockId);
  };

  // Calculate stats for selected child
  const totalPoints = progress.reduce((sum, p) => sum + (p.score || 0), 0);
  const totalTimeSeconds = progress.reduce((sum, p) => sum + (p.interaction_time_seconds || 0), 0);
  const completedTasksCount = progress.length;

  // Get dates with activity
  const activityDates = new Set<string>();
  progress.forEach(p => {
    if (p.completed_at) {
      activityDates.add(format(parseISO(p.completed_at), "yyyy-MM-dd"));
    }
  });

  // Get progress for selected date
  const selectedDateProgress = progress.filter(p => {
    if (!p.completed_at || !selectedDate) return false;
    return isSameDay(parseISO(p.completed_at), selectedDate);
  });

  // Calendar modifier for days with activity
  const dayWithActivity = (day: Date) => {
    return activityDates.has(format(day, "yyyy-MM-dd"));
  };

  const selectedChild = children.find(c => c.id === selectedChildId);

  // Child selection screen
  if (!selectedChildId || children.length > 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-blue-50 to-pink-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-pink-950/20">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="container mx-auto flex items-center gap-4 p-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                На главную
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => navigate("/parent")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              В кабинет родителя
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Gamepad2 className="h-5 w-5" />
              <span className="font-semibold">Игровая ребёнка</span>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                <Gamepad2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Игровая ребёнка</h1>
              <p className="text-muted-foreground">
                Выберите ребёнка, чтобы посмотреть прогресс и начать игры
              </p>
            </div>

            {childrenLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Загрузка...
              </div>
            ) : children.length === 0 ? (
              <Card className="text-center p-8">
                <Baby className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  У вас ещё нет добавленных детей
                </p>
                <Button onClick={() => navigate("/parent")}>
                  Добавить ребёнка
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {children.map((child) => (
                  <Card 
                    key={child.id}
                    className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
                      selectedChildId === child.id ? "ring-2 ring-purple-500" : ""
                    }`}
                    onClick={() => setSelectedChildId(child.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold">
                        {child.full_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{child.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {child.child_unique_id}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Child progress dashboard
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-blue-50 to-pink-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-pink-950/20">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-4 p-4">
          {children.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedChildId(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Выбрать другого
            </Button>
          )}
          {children.length === 1 && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/parent")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              В кабинет
            </Button>
          )}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
              {selectedChild?.full_name.charAt(0)}
            </div>
            <span className="font-medium">{selectedChild?.full_name}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-yellow-600">
              <Star className="h-5 w-5" />
              <span className="font-bold">{totalPoints}</span>
            </div>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => navigate(`/child-workspace?childId=${selectedChildId}`)}
            >
              <Play className="h-4 w-4 mr-2" />
              Играть
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего очков</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{totalPoints}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Время игры</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {formatDuration(totalTimeSeconds)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Заданий выполнено</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{completedTasksCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5 text-purple-500" />
                Календарь активности
              </CardTitle>
              <CardDescription>
                Дни с играми выделены цветом
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ru}
                modifiers={{
                  activity: dayWithActivity,
                }}
                modifiersStyles={{
                  activity: {
                    backgroundColor: "hsl(var(--primary) / 0.2)",
                    borderRadius: "50%",
                  },
                }}
                className="rounded-md border"
              />
              
              {/* Selected date info */}
              {selectedDate && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    {format(selectedDate, "d MMMM yyyy", { locale: ru })}
                  </p>
                  {selectedDateProgress.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateProgress.map((p) => {
                        const block = getBlockInfo(p.block_id);
                        const config = block ? sphereConfig[block.sphere_slug] : null;
                        const Icon = config?.icon || Gamepad2;
                        
                        return (
                          <div key={p.id} className="flex items-center gap-2 text-sm">
                            <Icon className={`h-4 w-4 ${config?.color || "text-muted-foreground"}`} />
                            <span className="flex-1">{block?.title || "Задание"}</span>
                            {p.interaction_time_seconds && p.interaction_time_seconds > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {formatDuration(p.interaction_time_seconds)}
                              </Badge>
                            )}
                            {p.score && p.score > 0 && (
                              <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 text-xs">
                                +{p.score}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      В этот день не было игр
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress by spheres */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-green-500" />
                Прогресс по сферам
              </CardTitle>
              <CardDescription>
                Выполненные задания и время по каждой сфере развития
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(sphereConfig).map(([slug, config]) => {
                  const Icon = config.icon;
                  const sphereProgress = progress.filter(p => {
                    const block = getBlockInfo(p.block_id);
                    return block?.sphere_slug === slug;
                  });
                  const spherePoints = sphereProgress.reduce((sum, p) => sum + (p.score || 0), 0);
                  const sphereTime = sphereProgress.reduce((sum, p) => sum + (p.interaction_time_seconds || 0), 0);
                  const sphereTasks = sphereProgress.length;

                  return (
                    <Card key={slug} className={`${config.bgColor} border-none`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-full bg-white/80 dark:bg-background/50 ${config.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{config.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {sphereTasks} заданий
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Очки:</span>
                            <span className="font-medium">{spherePoints}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Время:</span>
                            <span className="font-medium">
                              {sphereTime > 0 ? formatDuration(sphereTime) : "—"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-blue-500" />
              Последняя активность
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Пока нет завершённых игр</p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate(`/child-workspace?childId=${selectedChildId}`)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Начать игры
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {progress.slice(0, 20).map((p) => {
                    const block = getBlockInfo(p.block_id);
                    const config = block ? sphereConfig[block.sphere_slug] : null;
                    const Icon = config?.icon || Gamepad2;

                    return (
                      <div 
                        key={p.id} 
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className={`p-2 rounded-full ${config?.bgColor || "bg-muted"} ${config?.color || ""}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{block?.title || "Задание"}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.completed_at && format(parseISO(p.completed_at), "d MMM yyyy, HH:mm", { locale: ru })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.interaction_time_seconds && p.interaction_time_seconds > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(p.interaction_time_seconds)}
                            </Badge>
                          )}
                          {p.score && p.score > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                              +{p.score}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}