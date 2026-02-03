import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Gamepad2,
  Star,
  Clock,
  Trophy,
  Play,
  Hand,
  Mic,
  Brain,
  MessageCircle,
  Heart,
  CalendarDays,
} from "lucide-react";
import { format, parseISO, subDays, isAfter } from "date-fns";
import { ru } from "date-fns/locale";

interface ChildGameProgressCardProps {
  parentChildId: string;
}

interface TaskProgress {
  id: string;
  child_id: string;
  block_id: string;
  task_id: string;
  status: string;
  score: number | null;
  completed_at: string | null;
  interaction_time_seconds: number | null;
}

interface TaskBlock {
  id: string;
  sphere_slug: string;
  title: string;
}

const sphereConfig: Record<string, { name: string; icon: any; color: string; bgColor: string }> = {
  motor: { name: "Моторика", icon: Hand, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  speech: { name: "Речь", icon: Mic, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  cognitive: { name: "Познание", icon: Brain, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  social: { name: "Общение", icon: MessageCircle, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  emotional: { name: "Эмоции", icon: Heart, color: "text-pink-600", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
};

export function ChildGameProgressCard({ parentChildId }: ChildGameProgressCardProps) {
  const navigate = useNavigate();

  // Fetch progress for child
  const { data: progress = [], isLoading } = useQuery({
    queryKey: ["specialist-child-game-progress", parentChildId],
    queryFn: async () => {
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
          interaction_time_seconds
        `)
        .eq("child_id", parentChildId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      if (error) throw error;
      return (data || []) as TaskProgress[];
    },
    enabled: !!parentChildId,
  });

  // Fetch blocks for reference
  const { data: blocks = [] } = useQuery({
    queryKey: ["specialist-playground-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("development_task_blocks")
        .select("id, title, sphere_slug")
        .eq("is_active", true);

      if (error) throw error;
      return (data || []) as TaskBlock[];
    },
  });

  // Get block info by id
  const getBlockInfo = (blockId: string) => {
    return blocks.find(b => b.id === blockId);
  };

  // Calculate stats
  const totalPoints = progress.reduce((sum, p) => sum + (p.score || 0), 0);
  const totalTimeSeconds = progress.reduce((sum, p) => sum + (p.interaction_time_seconds || 0), 0);
  const completedTasksCount = progress.length;

  // Calculate progress by sphere
  const sphereStats = Object.entries(sphereConfig).map(([slug, config]) => {
    const sphereProgress = progress.filter(p => {
      const block = getBlockInfo(p.block_id);
      return block?.sphere_slug === slug;
    });
    
    const tasksCount = sphereProgress.length;
    const points = sphereProgress.reduce((sum, p) => sum + (p.score || 0), 0);
    const time = sphereProgress.reduce((sum, p) => sum + (p.interaction_time_seconds || 0), 0);
    
    return {
      slug,
      ...config,
      tasksCount,
      points,
      time,
    };
  });

  // Get recent activity (last 7 days)
  const recentProgress = progress.filter(p => {
    if (!p.completed_at) return false;
    return isAfter(parseISO(p.completed_at), subDays(new Date(), 7));
  });

  // Last activity date
  const lastActivityDate = progress.length > 0 && progress[0].completed_at
    ? format(parseISO(progress[0].completed_at), "d MMM yyyy", { locale: ru })
    : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // No progress yet
  if (progress.length === 0) {
    return (
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gamepad2 className="h-5 w-5 text-purple-600" />
            Прогресс в играх
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Ребёнок ещё не выполнял игровые задания
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/child-workspace?childId=${parentChildId}`)}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Запустить игры
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gamepad2 className="h-5 w-5 text-purple-600" />
            Прогресс в играх
          </CardTitle>
          <Button
            size="sm"
            onClick={() => navigate(`/child-workspace?childId=${parentChildId}`)}
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Play className="h-4 w-4" />
            Играть
          </Button>
        </div>
        {lastActivityDate && (
          <CardDescription className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            Последняя активность: {lastActivityDate}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 text-center">
            <Star className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
            <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{totalPoints}</p>
            <p className="text-xs text-muted-foreground">очков</p>
          </div>
          
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
            <Clock className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {totalTimeSeconds >= 60 ? `${Math.floor(totalTimeSeconds / 60)}м` : `${totalTimeSeconds}с`}
            </p>
            <p className="text-xs text-muted-foreground">время</p>
          </div>
          
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
            <Trophy className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold text-green-700 dark:text-green-400">{completedTasksCount}</p>
            <p className="text-xs text-muted-foreground">заданий</p>
          </div>
        </div>

        {/* Progress by sphere */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">По сферам развития</p>
          <div className="grid grid-cols-2 gap-2">
            {sphereStats.filter(s => s.tasksCount > 0).map((sphere) => {
              const Icon = sphere.icon;
              return (
                <div 
                  key={sphere.slug}
                  className={`p-2 rounded-lg ${sphere.bgColor}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${sphere.color}`} />
                    <span className="text-sm font-medium">{sphere.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{sphere.tasksCount} заданий</span>
                    <Badge variant="secondary" className="text-xs">
                      {sphere.points} ★
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Show empty spheres as a hint */}
          {sphereStats.filter(s => s.tasksCount === 0).length > 0 && (
            <p className="text-xs text-muted-foreground">
              Не начаты: {sphereStats.filter(s => s.tasksCount === 0).map(s => s.name).join(", ")}
            </p>
          )}
        </div>

        {/* Recent activity indicator */}
        {recentProgress.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {recentProgress.length} заданий за последние 7 дней
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
