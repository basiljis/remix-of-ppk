import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { BarChart3, Users, ClipboardList, Calendar, FileText, TrendingUp } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

type PeriodType = "month" | "quarter" | "year";

export function OrganizationStatistics() {
  const { profile } = useAuth();
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [activeTab, setActiveTab] = useState("overview");
  
  const organizationId = profile?.organization_id;

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (periodType) {
      case "month":
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case "quarter":
        return { startDate: startOfQuarter(now), endDate: endOfQuarter(now) };
      case "year":
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  }, [periodType]);

  // Fetch protocols for organization
  const { data: protocols = [] } = useQuery({
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

  // Fetch sessions for organization
  const { data: sessions = [] } = useQuery({
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

  // Calculate statistics
  const stats = useMemo(() => {
    // Protocol stats
    const protocolsByStatus: Record<string, number> = {};
    const protocolsByType: Record<string, number> = {};
    protocols.forEach((p) => {
      const status = p.status || "draft";
      protocolsByStatus[status] = (protocolsByStatus[status] || 0) + 1;
      
      const type = p.consultation_type || "unknown";
      protocolsByType[type] = (protocolsByType[type] || 0) + 1;
    });

    // Session stats
    const sessionsByStatus: Record<string, number> = {};
    const sessionsByType: Record<string, number> = {};
    const sessionsBySpecialist: Record<string, number> = {};
    sessions.forEach((s: any) => {
      const status = s.session_statuses?.name || "unknown";
      sessionsByStatus[status] = (sessionsByStatus[status] || 0) + 1;
      
      const type = s.session_types?.name || "unknown";
      sessionsByType[type] = (sessionsByType[type] || 0) + 1;
      
      const specialist = s.profiles?.full_name || "unknown";
      sessionsBySpecialist[specialist] = (sessionsBySpecialist[specialist] || 0) + 1;
    });

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
      totalProtocols: protocols.length,
      totalSessions: sessions.length,
      totalEmployees: employees.length,
      totalChildren: children.length,
      protocolsByStatus,
      protocolsByType,
      sessionsByStatus,
      sessionsByType,
      sessionsBySpecialist,
      employeesByPosition,
      childrenByLevel,
    };
  }, [protocols, sessions, employees, children]);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Статистика организации
          </CardTitle>
          <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">За месяц</SelectItem>
              <SelectItem value="quarter">За квартал</SelectItem>
              <SelectItem value="year">За год</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Период: {format(startDate, "d MMMM yyyy", { locale: ru })} — {format(endDate, "d MMMM yyyy", { locale: ru })}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalProtocols}</p>
                  <p className="text-xs text-muted-foreground">Протоколов ППк</p>
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
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                  <p className="text-xs text-muted-foreground">Занятий</p>
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
                  <p className="text-2xl font-bold">{stats.totalChildren}</p>
                  <p className="text-xs text-muted-foreground">Детей</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
      </CardContent>
    </Card>
  );
}
