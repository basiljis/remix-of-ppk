import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  subQuarters,
  subYears,
  subDays,
  differenceInDays,
  parseISO 
} from "date-fns";
import { ru } from "date-fns/locale";
import { 
  BarChart3, 
  Users, 
  ClipboardList, 
  Calendar, 
  FileText, 
  GitCompare, 
  CalendarRange,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

type PeriodType = "week" | "month" | "quarter" | "year" | "custom";
type ComparisonType = "previous" | "year_ago";

export function OrganizationStatistics() {
  const { profile } = useAuth();
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [activeTab, setActiveTab] = useState("overview");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonType, setComparisonType] = useState<ComparisonType>("previous");
  
  const organizationId = profile?.organization_id;

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

  // Calculate previous period dates
  const { prevStartDate, prevEndDate } = useMemo(() => {
    const periodDays = differenceInDays(endDate, startDate);
    
    if (comparisonType === "year_ago") {
      return {
        prevStartDate: subYears(startDate, 1),
        prevEndDate: subYears(endDate, 1),
      };
    }
    
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

  // Fetch protocols for current period
  const { data: protocols = [], isLoading: isProtocolsLoading } = useQuery({
    queryKey: ["org-protocols-stats", organizationId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("protocols")
        .select("id, created_at, status, consultation_type, education_level")
        .eq("organization_id", organizationId)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch protocols for previous period
  const { data: prevProtocols = [], isLoading: isPrevProtocolsLoading } = useQuery({
    queryKey: ["org-protocols-stats-prev", organizationId, prevStartDate.toISOString(), prevEndDate.toISOString()],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("protocols")
        .select("id, created_at, status, consultation_type, education_level")
        .eq("organization_id", organizationId)
        .gte("created_at", prevStartDate.toISOString())
        .lte("created_at", prevEndDate.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && showComparison,
  });

  // Fetch sessions for current period
  const { data: sessions = [], isLoading: isSessionsLoading } = useQuery({
    queryKey: ["org-sessions-stats", organizationId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          id,
          scheduled_date,
          session_status_id,
          session_type_id,
          specialist_id,
          child_id,
          session_statuses (name, color),
          session_types (name),
          profiles:specialist_id (full_name, positions (name))
        `)
        .eq("organization_id", organizationId)
        .gte("scheduled_date", format(startDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(endDate, "yyyy-MM-dd"));
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch sessions for previous period
  const { data: prevSessions = [], isLoading: isPrevSessionsLoading } = useQuery({
    queryKey: ["org-sessions-stats-prev", organizationId, prevStartDate.toISOString(), prevEndDate.toISOString()],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          id,
          scheduled_date,
          session_status_id,
          session_type_id,
          specialist_id,
          child_id,
          session_statuses (name, color),
          session_types (name),
          profiles:specialist_id (full_name, positions (name))
        `)
        .eq("organization_id", organizationId)
        .gte("scheduled_date", format(prevStartDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(prevEndDate, "yyyy-MM-dd"));
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && showComparison,
  });

  // Fetch employees count
  const { data: employees = [] } = useQuery({
    queryKey: ["org-employees-count", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, position_id, positions (name)")
        .eq("organization_id", organizationId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch children count
  const { data: children = [] } = useQuery({
    queryKey: ["org-children-count", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("children")
        .select("id, education_level")
        .eq("organization_id", organizationId)
        .eq("is_active", true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Calculate statistics for given data
  const calculateStats = (protocolsData: any[], sessionsData: any[]) => {
    // Protocol stats
    const protocolsByStatus: Record<string, number> = {};
    const protocolsByType: Record<string, number> = {};
    protocolsData.forEach((p) => {
      const status = p.status || "draft";
      protocolsByStatus[status] = (protocolsByStatus[status] || 0) + 1;
      
      const type = p.consultation_type || "unknown";
      protocolsByType[type] = (protocolsByType[type] || 0) + 1;
    });

    // Session stats
    const sessionsByStatus: Record<string, number> = {};
    const sessionsByType: Record<string, number> = {};
    const sessionsBySpecialist: Record<string, number> = {};
    const uniqueChildren = new Set<string>();
    
    sessionsData.forEach((s: any) => {
      const status = s.session_statuses?.name || "unknown";
      sessionsByStatus[status] = (sessionsByStatus[status] || 0) + 1;
      
      const type = s.session_types?.name || "unknown";
      sessionsByType[type] = (sessionsByType[type] || 0) + 1;
      
      const specialist = s.profiles?.full_name || "unknown";
      sessionsBySpecialist[specialist] = (sessionsBySpecialist[specialist] || 0) + 1;
      
      if (s.child_id) {
        uniqueChildren.add(s.child_id);
      }
    });

    return {
      totalProtocols: protocolsData.length,
      totalSessions: sessionsData.length,
      uniqueChildren: uniqueChildren.size,
      protocolsByStatus,
      protocolsByType,
      sessionsByStatus,
      sessionsByType,
      sessionsBySpecialist,
    };
  };

  // Current period stats
  const stats = useMemo(() => {
    const calculated = calculateStats(protocols, sessions);
    
    // Employees by position
    const employeesByPosition: Record<string, number> = {};
    employees.forEach((e: any) => {
      const position = e.positions?.name || "Не указана";
      employeesByPosition[position] = (employeesByPosition[position] || 0) + 1;
    });

    // Children by education level
    const childrenByLevel: Record<string, number> = {};
    const levelLabels: Record<string, string> = {
      do: "ДО",
      noo: "НОО",
      oo: "ОО",
      soo: "СОО",
    };
    children.forEach((c) => {
      const level = c.education_level || "not_set";
      const label = levelLabels[level] || level;
      childrenByLevel[label] = (childrenByLevel[label] || 0) + 1;
    });

    return {
      ...calculated,
      totalEmployees: employees.length,
      totalChildren: children.length,
      employeesByPosition,
      childrenByLevel,
    };
  }, [protocols, sessions, employees, children]);

  // Previous period stats
  const prevStats = useMemo(() => {
    return calculateStats(prevProtocols, prevSessions);
  }, [prevProtocols, prevSessions]);

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

  const protocolsChange = calculateChange(stats.totalProtocols, prevStats.totalProtocols);
  const sessionsChange = calculateChange(stats.totalSessions, prevStats.totalSessions);
  const childrenChange = calculateChange(stats.uniqueChildren, prevStats.uniqueChildren);

  // Comparison data for charts
  const comparisonBySessionTypeData = useMemo(() => {
    if (!showComparison) return [];
    
    const allTypes = new Set([
      ...Object.keys(stats.sessionsByType),
      ...Object.keys(prevStats.sessionsByType)
    ]);

    return Array.from(allTypes).map(type => ({
      name: type,
      current: stats.sessionsByType[type] || 0,
      previous: prevStats.sessionsByType[type] || 0,
    }));
  }, [stats.sessionsByType, prevStats.sessionsByType, showComparison]);

  const comparisonBySessionStatusData = useMemo(() => {
    if (!showComparison) return [];
    
    const allStatuses = new Set([
      ...Object.keys(stats.sessionsByStatus),
      ...Object.keys(prevStats.sessionsByStatus)
    ]);

    return Array.from(allStatuses).map(status => ({
      name: status,
      current: stats.sessionsByStatus[status] || 0,
      previous: prevStats.sessionsByStatus[status] || 0,
    }));
  }, [stats.sessionsByStatus, prevStats.sessionsByStatus, showComparison]);

  const comparisonByProtocolStatusData = useMemo(() => {
    if (!showComparison) return [];
    
    const statusLabels: Record<string, string> = {
      draft: "Черновик",
      completed: "Завершен",
    };
    
    const allStatuses = new Set([
      ...Object.keys(stats.protocolsByStatus),
      ...Object.keys(prevStats.protocolsByStatus)
    ]);

    return Array.from(allStatuses).map(status => ({
      name: statusLabels[status] || status,
      current: stats.protocolsByStatus[status] || 0,
      previous: prevStats.protocolsByStatus[status] || 0,
    }));
  }, [stats.protocolsByStatus, prevStats.protocolsByStatus, showComparison]);

  // Change indicator component
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

  // Convert to chart data
  const protocolStatusData = Object.entries(stats.protocolsByStatus).map(([name, value], idx) => ({
    name: name === "draft" ? "Черновик" : name === "completed" ? "Завершен" : name,
    value,
    fill: COLORS[idx % COLORS.length],
  }));

  const sessionStatusData = Object.entries(stats.sessionsByStatus).map(([name, value], idx) => ({
    name,
    value,
    fill: COLORS[idx % COLORS.length],
  }));

  const sessionTypeData = Object.entries(stats.sessionsByType).map(([name, value], idx) => ({
    name,
    value,
    fill: COLORS[idx % COLORS.length],
  }));

  const specialistData = Object.entries(stats.sessionsBySpecialist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({
      name: name.split(" ").slice(0, 2).join(" "),
      sessions: value,
    }));

  const employeePositionData = Object.entries(stats.employeesByPosition).map(([name, value], idx) => ({
    name,
    value,
    fill: COLORS[idx % COLORS.length],
  }));

  const childrenLevelData = Object.entries(stats.childrenByLevel).map(([name, value], idx) => ({
    name,
    value,
    fill: COLORS[idx % COLORS.length],
  }));

  const isLoading = isProtocolsLoading || isSessionsLoading;
  const isPrevLoading = isPrevProtocolsLoading || isPrevSessionsLoading;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Статистика организации
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

          {/* Comparison controls */}
          <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Switch
                id="org-comparison-mode"
                checked={showComparison}
                onCheckedChange={setShowComparison}
              />
              <Label htmlFor="org-comparison-mode" className="text-sm cursor-pointer flex items-center gap-1">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{stats.totalProtocols}</p>
                        {showComparison && (
                          <span className="text-xs text-muted-foreground">
                            (было {prevStats.totalProtocols})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Протоколов ППк</p>
                      {showComparison && <ChangeIndicator change={protocolsChange} />}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-chart-2/10 rounded-full">
                      <Calendar className="h-5 w-5 text-chart-2" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{stats.totalSessions}</p>
                        {showComparison && (
                          <span className="text-xs text-muted-foreground">
                            (было {prevStats.totalSessions})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Занятий</p>
                      {showComparison && <ChangeIndicator change={sessionsChange} />}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-chart-3/10 rounded-full">
                      <Users className="h-5 w-5 text-chart-3" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                      <p className="text-xs text-muted-foreground">Сотрудников</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-chart-4/10 rounded-full">
                      <FileText className="h-5 w-5 text-chart-4" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{stats.totalChildren}</p>
                        {showComparison && (
                          <span className="text-xs text-muted-foreground">
                            (участвовало {prevStats.uniqueChildren})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Детей</p>
                      {showComparison && <ChangeIndicator change={childrenChange} />}
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
                      Сравнение занятий по типам
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {comparisonBySessionTypeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={comparisonBySessionTypeData} layout="vertical">
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
                      Сравнение занятий по статусам
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {comparisonBySessionStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={comparisonBySessionStatusData} layout="vertical">
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

                <Card className="border-chart-2/30 lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitCompare className="h-4 w-4 text-chart-2" />
                      Сравнение протоколов ППк по статусам
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {comparisonByProtocolStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={comparisonByProtocolStatusData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
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

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Обзор</TabsTrigger>
                <TabsTrigger value="ppk">ППк</TabsTrigger>
                <TabsTrigger value="sessions">Занятия</TabsTrigger>
                <TabsTrigger value="employees">Сотрудники</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sessions by status */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Занятия по статусам</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sessionStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={sessionStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {sessionStatusData.map((entry, index) => (
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

                  {/* Top specialists */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Топ специалистов по занятиям</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {specialistData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={specialistData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="sessions" name="Занятий" fill="hsl(var(--primary))" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Нет данных</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="ppk" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Протоколы по статусам</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {protocolStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={protocolStatusData}
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {protocolStatusData.map((entry, index) => (
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

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Дети по уровню образования</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {childrenLevelData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={childrenLevelData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" name="Детей">
                              {childrenLevelData.map((entry, index) => (
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
              </TabsContent>

              <TabsContent value="sessions" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Занятия по типам</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sessionTypeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={sessionTypeData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" name="Занятий">
                              {sessionTypeData.map((entry, index) => (
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

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Занятия по статусам</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sessionStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={sessionStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {sessionStatusData.map((entry, index) => (
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
                </div>
              </TabsContent>

              <TabsContent value="employees" className="mt-6 space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Сотрудники по должностям</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employeePositionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={employeePositionData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" name="Сотрудников">
                            {employeePositionData.map((entry, index) => (
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
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
