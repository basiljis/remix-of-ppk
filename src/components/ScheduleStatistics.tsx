import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, parseISO, differenceInYears } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, BarChart3, Users, Clock, CalendarDays, TrendingUp } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

type PeriodType = "week" | "month" | "quarter" | "year" | "custom";

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

export function ScheduleStatistics() {
  const { isAdmin, roles, profile } = useAuth();
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  
  const isOrgAdmin = roles.some((r) => r.role === "organization_admin");
  const isRegionalOperator = roles.some((r) => r.role === "regional_operator");
  const organizationId = profile?.organization_id;

  // Calculate date range
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

  // Fetch sessions with all related data
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["schedule-statistics", organizationId, startDate.toISOString(), endDate.toISOString(), isAdmin, isOrgAdmin, isRegionalOperator],
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

      // Filter by organization for non-admins
      if (!isAdmin && organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      const { data, error } = await query.order("scheduled_date");
      if (error) throw error;
      return (data || []) as SessionWithDetails[];
    },
    enabled: !!organizationId || isAdmin,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const uniqueChildren = new Set(sessions.map(s => s.child_id)).size;
    const uniqueSpecialists = new Set(sessions.map(s => s.specialist_id)).size;

    // By status
    const byStatus: Record<string, number> = {};
    sessions.forEach(s => {
      const statusName = s.session_statuses?.name || "Неизвестно";
      byStatus[statusName] = (byStatus[statusName] || 0) + 1;
    });

    // By type
    const byType: Record<string, number> = {};
    sessions.forEach(s => {
      const typeName = s.session_types?.name || "Неизвестно";
      byType[typeName] = (byType[typeName] || 0) + 1;
    });

    // By age group
    const byAgeGroup: Record<string, number> = {};
    sessions.forEach(s => {
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
    sessions.forEach(s => {
      const level = s.children?.education_level || "Не указан";
      const label = levelLabels[level] || level;
      byEducationLevel[label] = (byEducationLevel[label] || 0) + 1;
    });

    // By specialist position
    const byPosition: Record<string, number> = {};
    sessions.forEach(s => {
      const position = s.profiles?.positions?.name || "Не указана";
      byPosition[position] = (byPosition[position] || 0) + 1;
    });

    // By day of week
    const byDayOfWeek: Record<string, number> = {
      "Пн": 0, "Вт": 0, "Ср": 0, "Чт": 0, "Пт": 0, "Сб": 0, "Вс": 0
    };
    const dayLabels = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    sessions.forEach(s => {
      const day = parseISO(s.scheduled_date).getDay();
      byDayOfWeek[dayLabels[day]]++;
    });

    // Daily trend
    const dailyTrend: Record<string, number> = {};
    sessions.forEach(s => {
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
  }, [sessions, ageGroups]);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Статистика занятий
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
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
                  className="px-3 py-2 border rounded-md text-sm"
                />
                <span>—</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                />
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Период: {format(startDate, "d MMMM yyyy", { locale: ru })} — {format(endDate, "d MMMM yyyy", { locale: ru })}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Загрузка статистики...
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalSessions}</p>
                      <p className="text-sm text-muted-foreground">Всего занятий</p>
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
                    <div>
                      <p className="text-2xl font-bold">{stats.uniqueChildren}</p>
                      <p className="text-sm text-muted-foreground">Уникальных детей</p>
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
                    <div>
                      <p className="text-2xl font-bold">{stats.uniqueSpecialists}</p>
                      <p className="text-sm text-muted-foreground">Специалистов</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
          </>
        )}
      </CardContent>
    </Card>
  );
}
