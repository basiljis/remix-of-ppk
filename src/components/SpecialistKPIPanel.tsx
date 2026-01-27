import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Target, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Award,
  Users,
  CalendarDays,
  Percent,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear,
  parseISO,
  isWithinInterval,
  differenceInDays
} from "date-fns";
import { ru } from "date-fns/locale";

interface SpecialistGoal {
  id: string;
  user_id: string;
  organization_id: string | null;
  goal_type: string;
  goal_name: string;
  target_value: number;
  current_value: number;
  period_type: string;
  period_start: string;
  period_end: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

type GoalType = "sessions_count" | "children_count" | "completion_rate" | "custom";
type PeriodType = "week" | "month" | "quarter" | "year";

const goalTypeLabels: Record<GoalType, string> = {
  sessions_count: "Количество занятий",
  children_count: "Количество детей",
  completion_rate: "Процент выполнения",
  custom: "Пользовательская цель",
};

const goalTypeIcons: Record<GoalType, typeof Target> = {
  sessions_count: CalendarDays,
  children_count: Users,
  completion_rate: Percent,
  custom: Target,
};

const periodTypeLabels: Record<PeriodType, string> = {
  week: "Неделя",
  month: "Месяц",
  quarter: "Квартал",
  year: "Год",
};

export function SpecialistKPIPanel() {
  const { user, profile, roles, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SpecialistGoal | null>(null);
  const [formData, setFormData] = useState({
    goal_type: "sessions_count" as GoalType,
    goal_name: "",
    target_value: "",
    period_type: "month" as PeriodType,
    notes: "",
  });

  const isOrgAdmin = roles.some((r) => r.role === "organization_admin");
  const isDirector = roles.some((r) => r.role === "director");
  const canManageGoals = isAdmin || isOrgAdmin || isDirector;

  // Get period dates based on period type
  const getPeriodDates = (periodType: PeriodType) => {
    const now = new Date();
    switch (periodType) {
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return { start: weekStart, end: weekEnd };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "quarter":
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case "year":
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  // Fetch goals for current user
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["specialist-goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialist_goals")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SpecialistGoal[];
    },
    enabled: !!user?.id,
  });

  // Fetch sessions for calculating KPIs
  const { data: sessions = [] } = useQuery({
    queryKey: ["kpi-sessions", user?.id, profile?.organization_id],
    queryFn: async () => {
      const yearStart = startOfYear(new Date());
      const yearEnd = endOfYear(new Date());
      
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          id,
          scheduled_date,
          session_status_id,
          child_id,
          session_statuses (name)
        `)
        .eq("specialist_id", user?.id)
        .gte("scheduled_date", format(yearStart, "yyyy-MM-dd"))
        .lte("scheduled_date", format(yearEnd, "yyyy-MM-dd"));
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Type for goal with calculated progress
  interface GoalWithProgress extends SpecialistGoal {
    currentValue: number;
    progress: number;
    daysLeft: number;
    isCompleted: boolean;
    isExpired: boolean;
  }

  // Calculate current values for goals
  const goalsWithProgress: GoalWithProgress[] = useMemo(() => {
    return goals.map(goal => {
      const periodStart = parseISO(goal.period_start);
      const periodEnd = parseISO(goal.period_end);
      
      const sessionsInPeriod = sessions.filter(s => {
        const sessionDate = parseISO(s.scheduled_date);
        return isWithinInterval(sessionDate, { start: periodStart, end: periodEnd });
      });

      let currentValue = goal.current_value;
      
      // Auto-calculate for automatic goal types
      if (goal.goal_type === "sessions_count") {
        currentValue = sessionsInPeriod.length;
      } else if (goal.goal_type === "children_count") {
        currentValue = new Set(sessionsInPeriod.map(s => s.child_id)).size;
      } else if (goal.goal_type === "completion_rate") {
        const completed = sessionsInPeriod.filter(s => 
          (s.session_statuses as any)?.name === "Проведено"
        ).length;
        currentValue = sessionsInPeriod.length > 0 
          ? Math.round((completed / sessionsInPeriod.length) * 100)
          : 0;
      }

      const progress = goal.target_value > 0 
        ? Math.min(100, Math.round((currentValue / goal.target_value) * 100))
        : 0;

      const daysLeft = Math.max(0, differenceInDays(periodEnd, new Date()));
      const isCompleted = currentValue >= goal.target_value;
      const isExpired = new Date() > periodEnd;

      return {
        ...goal,
        currentValue,
        progress,
        daysLeft,
        isCompleted,
        isExpired,
      };
    });
  }, [goals, sessions]);

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { start, end } = getPeriodDates(data.period_type);
      
      const { error } = await supabase
        .from("specialist_goals")
        .insert({
          user_id: user?.id,
          organization_id: profile?.organization_id,
          goal_type: data.goal_type,
          goal_name: data.goal_name || goalTypeLabels[data.goal_type],
          target_value: parseFloat(data.target_value) || 0,
          current_value: 0,
          period_type: data.period_type,
          period_start: format(start, "yyyy-MM-dd"),
          period_end: format(end, "yyyy-MM-dd"),
          notes: data.notes || null,
          created_by: user?.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Цель успешно создана");
      queryClient.invalidateQueries({ queryKey: ["specialist-goals"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Ошибка при создании цели: " + error.message);
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SpecialistGoal> }) => {
      const { error } = await supabase
        .from("specialist_goals")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Цель успешно обновлена");
      queryClient.invalidateQueries({ queryKey: ["specialist-goals"] });
      setEditingGoal(null);
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Ошибка при обновлении цели: " + error.message);
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("specialist_goals")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Цель удалена");
      queryClient.invalidateQueries({ queryKey: ["specialist-goals"] });
    },
    onError: (error: any) => {
      toast.error("Ошибка при удалении цели: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      goal_type: "sessions_count",
      goal_name: "",
      target_value: "",
      period_type: "month",
      notes: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.target_value) {
      toast.error("Укажите целевое значение");
      return;
    }

    if (editingGoal) {
      updateGoalMutation.mutate({
        id: editingGoal.id,
        data: {
          goal_type: formData.goal_type,
          goal_name: formData.goal_name || goalTypeLabels[formData.goal_type],
          target_value: parseFloat(formData.target_value),
          notes: formData.notes || null,
        },
      });
    } else {
      createGoalMutation.mutate(formData);
    }
  };

  const handleEdit = (goal: SpecialistGoal) => {
    setEditingGoal(goal);
    setFormData({
      goal_type: goal.goal_type as GoalType,
      goal_name: goal.goal_name,
      target_value: goal.target_value.toString(),
      period_type: goal.period_type as PeriodType,
      notes: goal.notes || "",
    });
    setIsDialogOpen(true);
  };

  const getProgressColor = (progress: number, isCompleted: boolean, isExpired: boolean) => {
    if (isCompleted) return "bg-green-500";
    if (isExpired) return "bg-red-500";
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusBadge = (goal: GoalWithProgress) => {
    if (goal.isCompleted) {
      return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Выполнено</Badge>;
    }
    if (goal.isExpired) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Просрочено</Badge>;
    }
    if (goal.progress >= 75) {
      return <Badge className="bg-blue-500 hover:bg-blue-600"><TrendingUp className="h-3 w-3 mr-1" />Почти готово</Badge>;
    }
    return <Badge variant="secondary"><Calendar className="h-3 w-3 mr-1" />В процессе</Badge>;
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const active = goalsWithProgress.filter(g => !g.isExpired);
    const completed = goalsWithProgress.filter(g => g.isCompleted);
    const avgProgress = active.length > 0 
      ? Math.round(active.reduce((acc, g) => acc + g.progress, 0) / active.length)
      : 0;

    return {
      total: goalsWithProgress.length,
      active: active.length,
      completed: completed.length,
      avgProgress,
    };
  }, [goalsWithProgress]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Цели и KPI
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingGoal(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Добавить цель
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Редактировать цель" : "Новая цель"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Тип цели</Label>
                <Select
                  value={formData.goal_type}
                  onValueChange={(value: GoalType) => setFormData({ ...formData, goal_type: value })}
                  disabled={!!editingGoal}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(goalTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Название цели</Label>
                <Input
                  value={formData.goal_name}
                  onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
                  placeholder={goalTypeLabels[formData.goal_type]}
                />
              </div>

              <div className="space-y-2">
                <Label>Целевое значение</Label>
                <Input
                  type="number"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder={formData.goal_type === "completion_rate" ? "100" : "0"}
                />
                {formData.goal_type === "completion_rate" && (
                  <p className="text-xs text-muted-foreground">Укажите процент (0-100)</p>
                )}
              </div>

              {!editingGoal && (
                <div className="space-y-2">
                  <Label>Период</Label>
                  <Select
                    value={formData.period_type}
                    onValueChange={(value: PeriodType) => setFormData({ ...formData, period_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(periodTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="kpi-notes">Заметки</Label>
                <Textarea
                  id="kpi-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Дополнительная информация..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSubmit} disabled={createGoalMutation.isPending || updateGoalMutation.isPending}>
                {editingGoal ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        {goalsWithProgress.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{summaryStats.total}</div>
              <div className="text-xs text-muted-foreground">Всего целей</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{summaryStats.active}</div>
              <div className="text-xs text-muted-foreground">Активных</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summaryStats.completed}</div>
              <div className="text-xs text-muted-foreground">Выполнено</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{summaryStats.avgProgress}%</div>
              <div className="text-xs text-muted-foreground">Средний прогресс</div>
            </div>
          </div>
        )}

        {/* Goals List */}
        {goalsWithProgress.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>У вас пока нет целей</p>
            <p className="text-sm">Добавьте первую цель для отслеживания KPI</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goalsWithProgress.map((goal) => {
              const IconComponent = goalTypeIcons[goal.goal_type as GoalType] || Target;
              
              return (
                <div 
                  key={goal.id} 
                  className={`p-4 border rounded-lg space-y-3 ${
                    goal.isCompleted ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" :
                    goal.isExpired ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" :
                    "bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">{goal.goal_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(goal.period_start as string), "d MMM", { locale: ru })} - {format(parseISO(goal.period_end as string), "d MMM yyyy", { locale: ru })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(goal)}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(goal)}
                        aria-label="Редактировать цель"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                        aria-label="Удалить цель"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        {goal.currentValue} / {goal.target_value}
                        {goal.goal_type === "completion_rate" && "%"}
                      </span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <Progress 
                      value={goal.progress} 
                      className={`h-2 ${getProgressColor(goal.progress, goal.isCompleted, goal.isExpired)}`}
                    />
                    {!goal.isExpired && !goal.isCompleted && goal.daysLeft > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Осталось {goal.daysLeft} дн.
                      </p>
                    )}
                  </div>

                  {goal.notes && (
                    <p className="text-sm text-muted-foreground">{goal.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
