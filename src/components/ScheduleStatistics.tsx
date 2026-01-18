import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear, 
  subMonths, 
  parseISO, 
  differenceInYears,
  subDays,
  subQuarters,
  subYears,
  differenceInDays
} from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, BarChart3, Users, Clock, CalendarDays, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus, GitCompare, CalendarRange, User, Building2 } from "lucide-react";
import { SpecialistKPIPanel } from "./SpecialistKPIPanel";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

type PeriodType = "week" | "month" | "quarter" | "year" | "custom";
type ComparisonType = "previous" | "year_ago";

interface SessionWithDetails {
  id: string;
  scheduled_date: string;
  session_status_id: string;
  session_type_id: string;
  child_id: string;
  specialist_id: string;
  organization_id: string;
  children: {
    birth_date: string | null;
    education_level: string | null;
  } | null;
  session_types: {
    name: string;
  } | null;
  session_statuses: {
    name: string;
    color: string;
  } | null;
  profiles: {
    full_name: string;
    position_id: string;
    positions: {
      name: string;
    } | null;
  } | null;
}

type ViewMode = "personal" | "organization";

export function ScheduleStatistics() {
  const { isAdmin, roles, profile, user } = useAuth();
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonType, setComparisonType] = useState<ComparisonType>("previous");
  const [viewMode, setViewMode] = useState<ViewMode>("personal");
  
  const isOrgAdmin = roles.some((r) => r.role === "organization_admin");
  const isRegionalOperator = roles.some((r) => r.role === "regional_operator");
  const isDirector = roles.some((r) => r.role === "director");
  const organizationId = profile?.organization_id;
  const canViewOrgStats = isAdmin || isOrgAdmin || isRegionalOperator || isDirector;

  // Calculate date range for current period
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (periodType) {
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return { startDate: weekStart, endDate: now };
      case "month":
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case "quarter":
        return { startDate: startOfQuarter(now), endDate: endOfQuarter(now) };
      case "year":
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case "custom":
        return {
          startDate: customStartDate ? parseISO(customStartDate) : subMonths(now, 1),
          endDate: customEndDate ? parseISO(customEndDate) : now,
        };
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  }, [periodType, customStartDate, customEndDate]);

  // Calculate previous period dates (either previous period or same period last year)
  const { prevStartDate, prevEndDate } = useMemo(() => {
    const periodDays = differenceInDays(endDate, startDate);
    
    // Same period last year
    if (comparisonType === "year_ago") {
      return {
        prevStartDate: subYears(startDate, 1),
        prevEndDate: subYears(endDate, 1),
      };
    }
    
    // Previous period (sequential)
    switch (periodType) {
      case "week":
        return {
          prevStartDate: subDays(startDate, 7),
          prevEndDate: subDays(endDate, 7),
        };
      case "month":
        return {
          prevStartDate: startOfMonth(subMonths(startDate, 1)),
          prevEndDate: endOfMonth(subMonths(startDate, 1)),
        };
      case "quarter":
        return {
          prevStartDate: startOfQuarter(subQuarters(startDate, 1)),
          prevEndDate: endOfQuarter(subQuarters(startDate, 1)),
        };
      case "year":
        return {
          prevStartDate: startOfYear(subYears(startDate, 1)),
          prevEndDate: endOfYear(subYears(startDate, 1)),
        };
      case "custom":
        return {
          prevStartDate: subDays(startDate, periodDays + 1),
          prevEndDate: subDays(startDate, 1),
        };
      default:
        return {
          prevStartDate: startOfMonth(subMonths(startDate, 1)),
          prevEndDate: endOfMonth(subMonths(startDate, 1)),
        };
    }
  }, [startDate, endDate, periodType, comparisonType]);

  // Fetch session types
  const { data: sessionTypes = [] } = useQuery({
    queryKey: ["session-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_types")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch session statuses
  const { data: sessionStatuses = [] } = useQuery({
    queryKey: ["session-statuses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_statuses")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch session duration settings (age groups)
  const { data: ageGroups = [] } = useQuery({
    queryKey: ["session-duration-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_duration_settings")
        .select("*")
        .order("age_from");
      if (error) throw error;
      return data;
    },
  });

  // Fetch sessions for current period
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["schedule-statistics", organizationId, startDate.toISOString(), endDate.toISOString(), isAdmin, isOrgAdmin, isRegionalOperator, viewMode, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("sessions")
        .select(`
          id,
          scheduled_date,
          session_status_id,
          session_type_id,
          child_id,
          specialist_id,
          organization_id,
          children (
            birth_date,
            education_level
          ),
          session_types (
            name
          ),
          session_statuses (
            name,
            color
          ),
          profiles:specialist_id (
            full_name,
            position_id,
            positions (
              name
            )
          )
        `)
        .gte("scheduled_date", format(startDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(endDate, "yyyy-MM-dd"));

      // Filter by specialist (current user) for personal view
      if (viewMode === "personal" && user?.id) {
        query = query.eq("specialist_id", user.id);
      } else {
        // Filter by organization for non-admins in organization view
        if (!isAdmin && organizationId) {
          query = query.eq("organization_id", organizationId);
        }
      }

      const { data, error } = await query.order("scheduled_date");
      if (error) throw error;
      return (data || []) as SessionWithDetails[];
    },
    enabled: !!user?.id && (!!organizationId || isAdmin),
  });

  // Fetch sessions for previous period (only when comparison is enabled)
  const { data: prevSessions = [], isLoading: isPrevLoading } = useQuery({
    queryKey: ["schedule-statistics-prev", organizationId, prevStartDate.toISOString(), prevEndDate.toISOString(), isAdmin, isOrgAdmin, isRegionalOperator, viewMode, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("sessions")
        .select(`
          id,
          scheduled_date,
          session_status_id,
          session_type_id,
          child_id,
          specialist_id,
          organization_id,
          children (
            birth_date,
            education_level
          ),
          session_types (
            name
          ),
          session_statuses (
            name,
            color
          ),
          profiles:specialist_id (
            full_name,
            position_id,
            positions (
              name
            )
          )
        `)
        .gte("scheduled_date", format(prevStartDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(prevEndDate, "yyyy-MM-dd"));

      // Filter by specialist (current user) for personal view
      if (viewMode === "personal" && user?.id) {
        query = query.eq("specialist_id", user.id);
      } else {
        // Filter by organization for non-admins in organization view
        if (!isAdmin && organizationId) {
          query = query.eq("organization_id", organizationId);
        }
      }

      const { data, error } = await query.order("scheduled_date");
      if (error) throw error;
      return (data || []) as SessionWithDetails[];
    },
    enabled: showComparison && !!user?.id && (!!organizationId || isAdmin),
  });

  // Calculate statistics for a given session array
  const calculateStats = (sessionsData: SessionWithDetails[]) => {
    const totalSessions = sessionsData.length;
    const uniqueChildren = new Set(sessionsData.map(s => s.child_id)).size;
    const uniqueSpecialists = new Set(sessionsData.map(s => s.specialist_id)).size;

    // By status
    const byStatus: Record<string, number> = {};
    sessionsData.forEach(s => {
      const statusName = s.session_statuses?.name || "Неизвестно";
      byStatus[statusName] = (byStatus[statusName] || 0) + 1;
    });

    // By type
    const byType: Record<string, number> = {};
    sessionsData.forEach(s => {
      const typeName = s.session_types?.name || "Неизвестно";
      byType[typeName] = (byType[typeName] || 0) + 1;
    });

    // By age group
    const byAgeGroup: Record<string, number> = {};
    sessionsData.forEach(s => {
      if (s.children?.birth_date) {
        const age = differenceInYears(new Date(), parseISO(s.children.birth_date));
        const ageGroup = ageGroups.find(g => age >= g.age_from && age <= g.age_to);
        const label = ageGroup?.age_label || `${age} лет`;
        byAgeGroup[label] = (byAgeGroup[label] || 0) + 1;
      } else {
        byAgeGroup["Не указан"] = (byAgeGroup["Не указан"] || 0) + 1;
      }
    });

    // By education level
    const byEducationLevel: Record<string, number> = {};
    const levelLabels: Record<string, string> = {
      do: "ДО",
      noo: "НОО",
      oo: "ОО",
      soo: "СОО",
    };
    sessionsData.forEach(s => {
      const level = s.children?.education_level || "Не указан";
      const label = levelLabels[level] || level;
      byEducationLevel[label] = (byEducationLevel[label] || 0) + 1;
    });

    // By specialist position
    const byPosition: Record<string, number> = {};
    sessionsData.forEach(s => {
      const position = s.profiles?.positions?.name || "Не указана";
      byPosition[position] = (byPosition[position] || 0) + 1;
    });

    // By day of week
    const byDayOfWeek: Record<string, number> = {
      "Пн": 0, "Вт": 0, "Ср": 0, "Чт": 0, "Пт": 0, "Сб": 0, "Вс": 0
    };
    const dayLabels = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    sessionsData.forEach(s => {
      const day = parseISO(s.scheduled_date).getDay();
      byDayOfWeek[dayLabels[day]]++;
    });

    // Daily trend
    const dailyTrend: Record<string, number> = {};
    sessionsData.forEach(s => {
      const date = s.scheduled_date;
      dailyTrend[date] = (dailyTrend[date] || 0) + 1;
    });

    return {
      totalSessions,
      uniqueChildren,
      uniqueSpecialists,
      byStatus,
      byType,
      byAgeGroup,
      byEducationLevel,
      byPosition,
      byDayOfWeek,
      dailyTrend,
    };
  };

  // Calculate statistics for current period
  const stats = useMemo(() => calculateStats(sessions), [sessions, ageGroups]);

  // Calculate statistics for previous period
  const prevStats = useMemo(() => calculateStats(prevSessions), [prevSessions, ageGroups]);

  // Calculate percentage change
  const calculateChange = (current: number, previous: number): { value: number; percent: number; direction: 'up' | 'down' | 'same' } => {
    if (previous === 0 && current === 0) return { value: 0, percent: 0, direction: 'same' };
    if (previous === 0) return { value: current, percent: 100, direction: 'up' };
    
    const diff = current - previous;
    const percent = Math.round((diff / previous) * 100);
    
    return {
      value: diff,
      percent: Math.abs(percent),
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
    };
  };

  const sessionsChange = calculateChange(stats.totalSessions, prevStats.totalSessions);
  const childrenChange = calculateChange(stats.uniqueChildren, prevStats.uniqueChildren);
  const specialistsChange = calculateChange(stats.uniqueSpecialists, prevStats.uniqueSpecialists);

  // Convert to chart data
  const statusChartData = Object.entries(stats.byStatus).map(([name, value]) => ({
    name,
    value,
    fill: sessionStatuses.find(s => s.name === name)?.color || COLORS[0],
  }));

  const typeChartData = Object.entries(stats.byType).map(([name, value], idx) => ({
    name,
    value,
    fill: COLORS[idx % COLORS.length],
  }));

  const ageChartData = Object.entries(stats.byAgeGroup).map(([name, value], idx) => ({
    name,
    value,
    fill: COLORS[idx % COLORS.length],
  }));

  const educationChartData = Object.entries(stats.byEducationLevel).map(([name, value], idx) => ({
    name,
    value,
    fill: COLORS[idx % COLORS.length],
  }));

  const positionChartData = Object.entries(stats.byPosition).map(([name, value], idx) => ({
    name,
    value,
    fill: COLORS[idx % COLORS.length],
  }));

  const dayOfWeekChartData = Object.entries(stats.byDayOfWeek).map(([name, value]) => ({
    name,
    sessions: value,
  }));

  const trendChartData = Object.entries(stats.dailyTrend)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({
      date: format(parseISO(date), "dd.MM", { locale: ru }),
      sessions: value,
    }));

  // Comparison chart data (by type)
  const comparisonByTypeData = useMemo(() => {
    if (!showComparison) return [];
    
    const allTypes = new Set([
      ...Object.keys(stats.byType),
      ...Object.keys(prevStats.byType)
    ]);

    return Array.from(allTypes).map(type => ({
      name: type,
      current: stats.byType[type] || 0,
      previous: prevStats.byType[type] || 0,
    }));
  }, [stats.byType, prevStats.byType, showComparison]);

  // Comparison chart data (by status)
  const comparisonByStatusData = useMemo(() => {
    if (!showComparison) return [];
    
    const allStatuses = new Set([
      ...Object.keys(stats.byStatus),
      ...Object.keys(prevStats.byStatus)
    ]);

    return Array.from(allStatuses).map(status => ({
      name: status,
      current: stats.byStatus[status] || 0,
      previous: prevStats.byStatus[status] || 0,
    }));
  }, [stats.byStatus, prevStats.byStatus, showComparison]);

  // Render change indicator
  const ChangeIndicator = ({ change }: { change: { value: number; percent: number; direction: 'up' | 'down' | 'same' } }) => {
    if (change.direction === 'same') {
      return (
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <Minus className="h-3 w-3" />
          без изменений
        </span>
      );
    }

    const isPositive = change.direction === 'up';
    
    return (
      <span className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )}
        {isPositive ? '+' : ''}{change.value} ({change.percent}%)
      </span>
    );
  };

  const getComparisonLabel = () => {
    if (comparisonType === "year_ago") {
      return "аналогичным периодом прошлого года";
    }
    
    switch (periodType) {
      case "week": return "прошлой неделей";
      case "month": return "прошлым месяцем";
      case "quarter": return "прошлым кварталом";
      case "year": return "прошлым годом";
      case "custom": return "предыдущим периодом";
      default: return "прошлым периодом";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Статистика занятий
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">За неделю</SelectItem>
                  <SelectItem value="month">За месяц</SelectItem>
                  <SelectItem value="quarter">За квартал</SelectItem>
                  <SelectItem value="year">За год</SelectItem>
                  <SelectItem value="custom">Произвольный период</SelectItem>
                </SelectContent>
              </Select>
              {periodType === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm bg-background"
                  />
                  <span>—</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm bg-background"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* View mode and Comparison controls */}
          <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/50 rounded-lg">
            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "personal" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("personal")}
                className="gap-1"
              >
                <User className="h-4 w-4" />
                Моя статистика
              </Button>
              {canViewOrgStats && (
                <Button
                  variant={viewMode === "organization" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("organization")}
                  className="gap-1"
                >
                  <Building2 className="h-4 w-4" />
                  Организация
                </Button>
              )}
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Comparison controls */}
            <div className="flex items-center gap-2">
              <Switch
                id="comparison-mode"
                checked={showComparison}
                onCheckedChange={setShowComparison}
              />
              <Label htmlFor="comparison-mode" className="text-sm cursor-pointer flex items-center gap-1">
                <GitCompare className="h-4 w-4" />
                Сравнение
              </Label>
            </div>
            
            {showComparison && (
              <Select value={comparisonType} onValueChange={(v) => setComparisonType(v as ComparisonType)}>
                <SelectTrigger className="w-[280px]">
                  <CalendarRange className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous">С предыдущим периодом</SelectItem>
                  <SelectItem value="year_ago">С аналогичным периодом прошлого года</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground mt-2">
          <Badge variant="outline" className="w-fit">
            {viewMode === "personal" ? "Личная статистика" : "Статистика организации"}
          </Badge>
          <span>
            Период: {format(startDate, "d MMMM yyyy", { locale: ru })} — {format(endDate, "d MMMM yyyy", { locale: ru })}
          </span>
          {showComparison && (
            <span className="text-chart-2">
              • Сравнение с {getComparisonLabel()}: {format(prevStartDate, "d MMMM yyyy", { locale: ru })} — {format(prevEndDate, "d MMMM yyyy", { locale: ru })}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading || (showComparison && isPrevLoading) ? (
          <div className="text-center py-8 text-muted-foreground">
            Загрузка статистики...
          </div>
        ) : (
          <>
            {/* Summary cards with comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{stats.totalSessions}</p>
                        {showComparison && (
                          <span className="text-sm text-muted-foreground">
                            (было {prevStats.totalSessions})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Всего занятий</p>
                      {showComparison && <ChangeIndicator change={sessionsChange} />}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-chart-2/10 rounded-full">
                      <Users className="h-6 w-6 text-chart-2" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{stats.uniqueChildren}</p>
                        {showComparison && (
                          <span className="text-sm text-muted-foreground">
                            (было {prevStats.uniqueChildren})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Уникальных детей</p>
                      {showComparison && <ChangeIndicator change={childrenChange} />}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-chart-3/10 rounded-full">
                      <Clock className="h-6 w-6 text-chart-3" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{stats.uniqueSpecialists}</p>
                        {showComparison && (
                          <span className="text-sm text-muted-foreground">
                            (было {prevStats.uniqueSpecialists})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Специалистов</p>
                      {showComparison && <ChangeIndicator change={specialistsChange} />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison charts */}
            {showComparison && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-chart-2/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitCompare className="h-4 w-4 text-chart-2" />
                      Сравнение по типам занятий
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {comparisonByTypeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={comparisonByTypeData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="current" name="Текущий период" fill="hsl(var(--primary))" />
                          <Bar dataKey="previous" name="Предыдущий период" fill="hsl(var(--chart-2))" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Нет данных для сравнения</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-chart-2/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitCompare className="h-4 w-4 text-chart-2" />
                      Сравнение по статусам
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {comparisonByStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={comparisonByStatusData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="current" name="Текущий период" fill="hsl(var(--primary))" />
                          <Bar dataKey="previous" name="Предыдущий период" fill="hsl(var(--chart-2))" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Нет данных для сравнения</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">По статусам</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Нет данных</p>
                  )}
                </CardContent>
              </Card>

              {/* By Type */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">По типам занятий</CardTitle>
                </CardHeader>
                <CardContent>
                  {typeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={typeChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" name="Занятий">
                          {typeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Нет данных</p>
                  )}
                </CardContent>
              </Card>

              {/* By Age Group */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">По возрастным группам</CardTitle>
                </CardHeader>
                <CardContent>
                  {ageChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={ageChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {ageChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Нет данных</p>
                  )}
                </CardContent>
              </Card>

              {/* By Education Level */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">По уровню образования</CardTitle>
                </CardHeader>
                <CardContent>
                  {educationChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={educationChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Занятий">
                          {educationChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Нет данных</p>
                  )}
                </CardContent>
              </Card>

              {/* By Day of Week */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">По дням недели</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dayOfWeekChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sessions" name="Занятий" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* By Specialist Position */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">По должностям специалистов</CardTitle>
                </CardHeader>
                <CardContent>
                  {positionChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={positionChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" name="Занятий">
                          {positionChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Нет данных</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Trend Chart */}
            {trendChartData.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Динамика занятий
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        name="Занятий"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* KPI Panel - show only in personal mode */}
            {viewMode === "personal" && (
              <SpecialistKPIPanel />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
