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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Edit,
  User,
  Filter
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

interface GoalWithProgress extends SpecialistGoal {
  currentValue: number;
  progress: number;
  daysLeft: number;
  isCompleted: boolean;
  isExpired: boolean;
  specialist?: {
    full_name: string;
    position?: string;
  };
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

export function OrganizationKPIManagement() {
  const { user, profile, roles, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SpecialistGoal | null>(null);
  const [filterSpecialist, setFilterSpecialist] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    user_id: "",
    goal_type: "sessions_count" as GoalType,
    goal_name: "",
    target_value: "",
    period_type: "month" as PeriodType,
    notes: "",
  });
  const [isBulkMode, setIsBulkMode] = useState(false);

  const organizationId = profile?.organization_id;
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

  // Fetch organization employees
  const { data: employees = [] } = useQuery({
    queryKey: ["organization-employees-kpi", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          positions (name)
        `)
        .eq("organization_id", organizationId)
        .eq("is_blocked", false)
        .order("full_name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch all goals for organization
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["organization-goals", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialist_goals")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SpecialistGoal[];
    },
    enabled: !!organizationId,
  });

  // Fetch sessions for calculating KPIs
  const { data: sessions = [] } = useQuery({
    queryKey: ["org-kpi-sessions", organizationId],
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
          specialist_id,
          session_statuses (name)
        `)
        .eq("organization_id", organizationId)
        .gte("scheduled_date", format(yearStart, "yyyy-MM-dd"))
        .lte("scheduled_date", format(yearEnd, "yyyy-MM-dd"));
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Calculate current values for goals
  const goalsWithProgress: GoalWithProgress[] = useMemo(() => {
    return goals.map(goal => {
      const periodStart = parseISO(goal.period_start);
      const periodEnd = parseISO(goal.period_end);
      
      const sessionsInPeriod = sessions.filter(s => {
        const sessionDate = parseISO(s.scheduled_date);
        return s.specialist_id === goal.user_id && 
               isWithinInterval(sessionDate, { start: periodStart, end: periodEnd });
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

      // Find specialist info
      const employee = employees.find(e => e.id === goal.user_id);

      return {
        ...goal,
        currentValue,
        progress,
        daysLeft,
        isCompleted,
        isExpired,
        specialist: employee ? {
          full_name: employee.full_name,
          position: (employee.positions as any)?.name,
        } : undefined,
      };
    });
  }, [goals, sessions, employees]);

  // Filter goals
  const filteredGoals = useMemo(() => {
    return goalsWithProgress.filter(goal => {
      if (filterSpecialist !== "all" && goal.user_id !== filterSpecialist) return false;
      if (filterStatus === "completed" && !goal.isCompleted) return false;
      if (filterStatus === "in_progress" && (goal.isCompleted || goal.isExpired)) return false;
      if (filterStatus === "expired" && !goal.isExpired) return false;
      return true;
    });
  }, [goalsWithProgress, filterSpecialist, filterStatus]);

  // Create goal mutation (single)
  const createGoalMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { start, end } = getPeriodDates(data.period_type);
      
      const { error } = await supabase
        .from("specialist_goals")
        .insert({
          user_id: data.user_id,
          organization_id: organizationId,
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
      toast.success("Цель успешно назначена");
      queryClient.invalidateQueries({ queryKey: ["organization-goals"] });
      queryClient.invalidateQueries({ queryKey: ["specialist-goals"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Ошибка при создании цели: " + error.message);
    },
  });

  // Bulk create goals mutation
  const bulkCreateGoalsMutation = useMutation({
    mutationFn: async (data: { userIds: string[]; formData: typeof formData }) => {
      const { start, end } = getPeriodDates(data.formData.period_type);
      
      const goalsToInsert = data.userIds.map(userId => ({
        user_id: userId,
        organization_id: organizationId,
        goal_type: data.formData.goal_type,
        goal_name: data.formData.goal_name || goalTypeLabels[data.formData.goal_type],
        target_value: parseFloat(data.formData.target_value) || 0,
        current_value: 0,
        period_type: data.formData.period_type,
        period_start: format(start, "yyyy-MM-dd"),
        period_end: format(end, "yyyy-MM-dd"),
        notes: data.formData.notes || null,
        created_by: user?.id,
      }));
      
      const { error } = await supabase
        .from("specialist_goals")
        .insert(goalsToInsert);
      
      if (error) throw error;
      return data.userIds.length;
    },
    onSuccess: (count) => {
      toast.success(`Цели успешно назначены ${count} сотрудникам`);
      queryClient.invalidateQueries({ queryKey: ["organization-goals"] });
      queryClient.invalidateQueries({ queryKey: ["specialist-goals"] });
      setIsDialogOpen(false);
      resetForm();
      setSelectedEmployees([]);
      setIsBulkMode(false);
    },
    onError: (error: any) => {
      toast.error("Ошибка при создании целей: " + error.message);
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
      queryClient.invalidateQueries({ queryKey: ["organization-goals"] });
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
      queryClient.invalidateQueries({ queryKey: ["organization-goals"] });
      queryClient.invalidateQueries({ queryKey: ["specialist-goals"] });
    },
    onError: (error: any) => {
      toast.error("Ошибка при удалении цели: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      user_id: "",
      goal_type: "sessions_count",
      goal_name: "",
      target_value: "",
      period_type: "month",
      notes: "",
    });
    setSelectedEmployees([]);
    setIsBulkMode(false);
  };

  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(empId) 
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const selectAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(e => e.id));
    }
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
    } else if (isBulkMode) {
      if (selectedEmployees.length === 0) {
        toast.error("Выберите хотя бы одного сотрудника");
        return;
      }
      bulkCreateGoalsMutation.mutate({ userIds: selectedEmployees, formData });
    } else {
      if (!formData.user_id) {
        toast.error("Выберите сотрудника");
        return;
      }
      createGoalMutation.mutate(formData);
    }
  };

  const handleEdit = (goal: SpecialistGoal) => {
    setEditingGoal(goal);
    setFormData({
      user_id: goal.user_id,
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
    const expired = goalsWithProgress.filter(g => g.isExpired && !g.isCompleted);
    const avgProgress = active.length > 0 
      ? Math.round(active.reduce((acc, g) => acc + g.progress, 0) / active.length)
      : 0;

    return {
      total: goalsWithProgress.length,
      active: active.length,
      completed: completed.length,
      expired: expired.length,
      avgProgress,
    };
  }, [goalsWithProgress]);

  if (!canManageGoals) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>У вас нет прав для управления KPI сотрудников.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{summaryStats.total}</div>
              <div className="text-xs text-muted-foreground">Всего целей</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summaryStats.active}</div>
              <div className="text-xs text-muted-foreground">Активных</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryStats.completed}</div>
              <div className="text-xs text-muted-foreground">Выполнено</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summaryStats.expired}</div>
              <div className="text-xs text-muted-foreground">Просрочено</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{summaryStats.avgProgress}%</div>
              <div className="text-xs text-muted-foreground">Средний прогресс</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            KPI сотрудников
          </CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterSpecialist} onValueChange={setFilterSpecialist}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Все сотрудники" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все сотрудники</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="in_progress">В процессе</SelectItem>
                  <SelectItem value="completed">Выполнено</SelectItem>
                  <SelectItem value="expired">Просрочено</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                  Назначить цель
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingGoal ? "Редактировать цель" : "Назначить цель сотрудникам"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Mode toggle for bulk/single */}
                  {!editingGoal && (
                    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <Button
                        variant={!isBulkMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setIsBulkMode(false);
                          setSelectedEmployees([]);
                        }}
                      >
                        <User className="h-4 w-4 mr-1" />
                        Одному сотруднику
                      </Button>
                      <Button
                        variant={isBulkMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setIsBulkMode(true);
                          setFormData({ ...formData, user_id: "" });
                        }}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Нескольким сотрудникам
                      </Button>
                    </div>
                  )}

                  {/* Single employee selector */}
                  {!isBulkMode && !editingGoal && (
                    <div className="space-y-2">
                      <Label>Сотрудник *</Label>
                      <Select
                        value={formData.user_id}
                        onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите сотрудника" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {emp.full_name}
                                {(emp.positions as any)?.name && (
                                  <span className="text-muted-foreground text-xs">
                                    — {(emp.positions as any).name}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Editing mode - show current employee */}
                  {editingGoal && (
                    <div className="space-y-2">
                      <Label>Сотрудник</Label>
                      <div className="p-2 border rounded-md bg-muted/50 text-sm">
                        {employees.find(e => e.id === editingGoal.user_id)?.full_name || "—"}
                      </div>
                    </div>
                  )}

                  {/* Bulk employee selector */}
                  {isBulkMode && !editingGoal && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Сотрудники * ({selectedEmployees.length} выбрано)</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllEmployees}
                        >
                          {selectedEmployees.length === employees.length ? "Снять все" : "Выбрать всех"}
                        </Button>
                      </div>
                      <ScrollArea className="h-[200px] border rounded-md p-2">
                        <div className="space-y-1">
                          {employees.map((emp) => {
                            const isSelected = selectedEmployees.includes(emp.id);
                            return (
                              <div
                                key={emp.id}
                                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                  isSelected 
                                    ? "bg-primary/10 border border-primary/30" 
                                    : "hover:bg-muted"
                                }`}
                                onClick={() => toggleEmployeeSelection(emp.id)}
                              >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                  isSelected 
                                    ? "bg-primary border-primary text-primary-foreground" 
                                    : "border-muted-foreground/30"
                                }`}>
                                  {isSelected && <CheckCircle2 className="h-3 w-3" />}
                                </div>
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{emp.full_name}</div>
                                  {(emp.positions as any)?.name && (
                                    <div className="text-xs text-muted-foreground">
                                      {(emp.positions as any).name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Тип цели</Label>
                    <Select
                      value={formData.goal_type}
                      onValueChange={(value: GoalType) => setFormData({ ...formData, goal_type: value })}
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
                    <Label>Целевое значение *</Label>
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
                    <Label>Заметки</Label>
                    <Textarea
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
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createGoalMutation.isPending || updateGoalMutation.isPending || bulkCreateGoalsMutation.isPending}
                  >
                    {editingGoal 
                      ? "Сохранить" 
                      : isBulkMode 
                        ? `Назначить ${selectedEmployees.length} сотрудникам`
                        : "Назначить"
                    }
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Цели не найдены</p>
              <p className="text-sm">Назначьте первую цель для сотрудника</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сотрудник</TableHead>
                    <TableHead>Цель</TableHead>
                    <TableHead>Период</TableHead>
                    <TableHead>Прогресс</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGoals.map((goal) => {
                    const IconComponent = goalTypeIcons[goal.goal_type as GoalType] || Target;
                    
                    return (
                      <TableRow key={goal.id} className={
                        goal.isCompleted ? "bg-green-50/50 dark:bg-green-950/20" :
                        goal.isExpired ? "bg-red-50/50 dark:bg-red-950/20" :
                        ""
                      }>
                        <TableCell>
                          <div>
                            <div className="font-medium">{goal.specialist?.full_name || "—"}</div>
                            {goal.specialist?.position && (
                              <div className="text-xs text-muted-foreground">{goal.specialist.position}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium">{goal.goal_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {goalTypeLabels[goal.goal_type as GoalType]}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(parseISO(goal.period_start), "d MMM", { locale: ru })} — {format(parseISO(goal.period_end), "d MMM", { locale: ru })}
                          </div>
                          {!goal.isExpired && !goal.isCompleted && goal.daysLeft > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Осталось {goal.daysLeft} дн.
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 min-w-[120px]">
                            <div className="flex justify-between text-xs">
                              <span>{goal.currentValue} / {goal.target_value}</span>
                              <span className="font-medium">{goal.progress}%</span>
                            </div>
                            <Progress 
                              value={goal.progress} 
                              className={`h-2 ${getProgressColor(goal.progress, goal.isCompleted, goal.isExpired)}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(goal)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleEdit(goal)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteGoalMutation.mutate(goal.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
