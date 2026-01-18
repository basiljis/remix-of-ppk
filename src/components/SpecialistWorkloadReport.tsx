import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Download, Calendar, Users, Clock, PieChart } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO, differenceInMinutes } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface SpecialistWorkload {
  id: string;
  fullName: string;
  positionId: string;
  positionName: string;
  rate: number;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalMinutes: number;
  expectedMinutes: number;
  loadPercentage: number;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

export function SpecialistWorkloadReport() {
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "charts">("table");

  // Fetch positions
  const { data: positions } = useQuery({
    queryKey: ["positions-for-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch organizations
  const { data: organizations } = useQuery({
    queryKey: ["organizations-for-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, short_name")
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch specialists with rates and sessions
  const { data: workloadData, isLoading } = useQuery({
    queryKey: ["specialist-workload", dateFrom, dateTo, organizationFilter, positionFilter],
    queryFn: async () => {
      let profilesQuery = supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          organization_id,
          position_id,
          positions(id, name)
        `)
        .eq("is_blocked", false);

      if (organizationFilter !== "all") {
        profilesQuery = profilesQuery.eq("organization_id", organizationFilter);
      }

      if (positionFilter !== "all") {
        profilesQuery = profilesQuery.eq("position_id", positionFilter);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      const { data: rates, error: ratesError } = await supabase
        .from("specialist_rates")
        .select("user_id, rate, organization_id");
      if (ratesError) throw ratesError;

      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select(`
          id,
          specialist_id,
          scheduled_date,
          start_time,
          end_time,
          actual_duration_minutes,
          session_statuses(name)
        `)
        .gte("scheduled_date", dateFrom)
        .lte("scheduled_date", dateTo);
      if (sessionsError) throw sessionsError;

      const { data: workloadSettings, error: settingsError } = await supabase
        .from("specialist_workload_settings")
        .select("position_id, hours_per_rate, max_hours_per_week");
      if (settingsError) throw settingsError;

      const workloadMap: Record<string, SpecialistWorkload> = {};

      profiles?.forEach((profile) => {
        const specialistRate = rates?.find(
          (r) => r.user_id === profile.id && 
          (organizationFilter === "all" || r.organization_id === organizationFilter)
        );
        const rate = specialistRate?.rate || 1;

        const positionSetting = workloadSettings?.find(
          (s) => s.position_id === (profile.positions as any)?.id
        );
        const hoursPerRate = positionSetting?.hours_per_rate || 36;

        const startDate = parseISO(dateFrom);
        const endDate = parseISO(dateTo);
        const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const expectedMinutes = weeks * hoursPerRate * rate * 60;

        const specialistSessions = sessions?.filter((s) => s.specialist_id === profile.id) || [];
        
        let totalMinutes = 0;
        let completedCount = 0;
        let cancelledCount = 0;

        specialistSessions.forEach((session) => {
          const status = (session.session_statuses as any)?.name?.toLowerCase() || "";
          
          if (status.includes("отмен") || status.includes("cancel")) {
            cancelledCount++;
          } else if (status.includes("проведен") || status.includes("завершен") || status.includes("complete")) {
            completedCount++;
            if (session.actual_duration_minutes) {
              totalMinutes += session.actual_duration_minutes;
            } else if (session.start_time && session.end_time) {
              const start = new Date(`2000-01-01T${session.start_time}`);
              const end = new Date(`2000-01-01T${session.end_time}`);
              totalMinutes += differenceInMinutes(end, start);
            }
          }
        });

        workloadMap[profile.id] = {
          id: profile.id,
          fullName: profile.full_name,
          positionId: profile.position_id,
          positionName: (profile.positions as any)?.name || "Не указана",
          rate,
          totalSessions: specialistSessions.length,
          completedSessions: completedCount,
          cancelledSessions: cancelledCount,
          totalMinutes,
          expectedMinutes,
          loadPercentage: expectedMinutes > 0 ? Math.round((totalMinutes / expectedMinutes) * 100) : 0,
        };
      });

      return Object.values(workloadMap).filter((w) => w.totalSessions > 0 || w.rate > 0);
    },
    enabled: !!dateFrom && !!dateTo,
  });

  const stats = useMemo(() => {
    if (!workloadData) return null;
    
    const totalSpecialists = workloadData.length;
    const avgLoad = totalSpecialists > 0 
      ? Math.round(workloadData.reduce((sum, w) => sum + w.loadPercentage, 0) / totalSpecialists)
      : 0;
    const totalSessions = workloadData.reduce((sum, w) => sum + w.totalSessions, 0);
    const totalHours = Math.round(workloadData.reduce((sum, w) => sum + w.totalMinutes, 0) / 60);

    return { totalSpecialists, avgLoad, totalSessions, totalHours };
  }, [workloadData]);

  // Chart data
  const barChartData = useMemo(() => {
    if (!workloadData) return [];
    return workloadData
      .sort((a, b) => b.loadPercentage - a.loadPercentage)
      .slice(0, 15)
      .map((w) => ({
        name: w.fullName.split(" ").slice(0, 2).join(" "),
        загрузка: w.loadPercentage,
        часов: Math.round(w.totalMinutes / 60),
      }));
  }, [workloadData]);

  const positionPieData = useMemo(() => {
    if (!workloadData) return [];
    const byPosition: Record<string, { count: number; hours: number }> = {};
    workloadData.forEach((w) => {
      if (!byPosition[w.positionName]) {
        byPosition[w.positionName] = { count: 0, hours: 0 };
      }
      byPosition[w.positionName].count++;
      byPosition[w.positionName].hours += Math.round(w.totalMinutes / 60);
    });
    return Object.entries(byPosition).map(([name, data]) => ({
      name,
      value: data.count,
      hours: data.hours,
    }));
  }, [workloadData]);

  const loadDistributionData = useMemo(() => {
    if (!workloadData) return [];
    const ranges = [
      { name: "< 50%", min: 0, max: 50, count: 0 },
      { name: "50-80%", min: 50, max: 80, count: 0 },
      { name: "80-100%", min: 80, max: 100, count: 0 },
      { name: "> 100%", min: 100, max: Infinity, count: 0 },
    ];
    workloadData.forEach((w) => {
      const range = ranges.find((r) => w.loadPercentage >= r.min && w.loadPercentage < r.max);
      if (range) range.count++;
    });
    return ranges.map((r) => ({ name: r.name, value: r.count }));
  }, [workloadData]);

  const exportToCSV = () => {
    if (!workloadData) return;

    const headers = ["ФИО", "Должность", "Ставка", "Всего занятий", "Проведено", "Отменено", "Часов", "Загрузка %"];
    const rows = workloadData.map((w) => [
      w.fullName,
      w.positionName,
      w.rate.toString(),
      w.totalSessions.toString(),
      w.completedSessions.toString(),
      w.cancelledSessions.toString(),
      (w.totalMinutes / 60).toFixed(1),
      w.loadPercentage.toString(),
    ]);

    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workload_report_${dateFrom}_${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLoadColor = (percentage: number) => {
    if (percentage < 50) return "text-amber-500";
    if (percentage < 80) return "text-blue-500";
    if (percentage <= 100) return "text-green-500";
    return "text-red-500";
  };

  const getLoadBadge = (percentage: number) => {
    if (percentage < 50) return <Badge variant="outline" className="bg-amber-50">Низкая</Badge>;
    if (percentage < 80) return <Badge variant="outline" className="bg-blue-50">Средняя</Badge>;
    if (percentage <= 100) return <Badge variant="outline" className="bg-green-50">Норма</Badge>;
    return <Badge variant="destructive">Перегрузка</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Отчёт по загрузке специалистов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5 mb-6">
            <div>
              <Label htmlFor="dateFrom">Дата начала</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Дата окончания</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label>Организация</Label>
              <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все организации" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все организации</SelectItem>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.short_name || org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Должность</Label>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все должности" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все должности</SelectItem>
                  {positions?.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={exportToCSV} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Экспорт
              </Button>
            </div>
          </div>

          {stats && (
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Специалистов</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalSpecialists}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Всего занятий</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Всего часов</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalHours}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Средняя загрузка</span>
                  </div>
                  <p className={`text-2xl font-bold ${getLoadColor(stats.avgLoad)}`}>
                    {stats.avgLoad}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "charts")}>
        <TabsList>
          <TabsTrigger value="table" className="gap-2">
            <Users className="h-4 w-4" />
            Таблица
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-2">
            <PieChart className="h-4 w-4" />
            Графики
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Загрузка данных...</div>
              ) : workloadData && workloadData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Специалист</TableHead>
                      <TableHead>Должность</TableHead>
                      <TableHead className="text-center">Ставка</TableHead>
                      <TableHead className="text-center">Занятий</TableHead>
                      <TableHead className="text-center">Проведено</TableHead>
                      <TableHead className="text-center">Отменено</TableHead>
                      <TableHead className="text-center">Часов</TableHead>
                      <TableHead>Загрузка</TableHead>
                      <TableHead className="text-center">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workloadData.map((specialist) => (
                      <TableRow key={specialist.id}>
                        <TableCell className="font-medium">{specialist.fullName}</TableCell>
                        <TableCell>{specialist.positionName}</TableCell>
                        <TableCell className="text-center">{specialist.rate}</TableCell>
                        <TableCell className="text-center">{specialist.totalSessions}</TableCell>
                        <TableCell className="text-center text-green-600">
                          {specialist.completedSessions}
                        </TableCell>
                        <TableCell className="text-center text-red-600">
                          {specialist.cancelledSessions}
                        </TableCell>
                        <TableCell className="text-center">
                          {(specialist.totalMinutes / 60).toFixed(1)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={Math.min(specialist.loadPercentage, 100)} 
                              className="w-20 h-2"
                            />
                            <span className={`text-sm font-medium ${getLoadColor(specialist.loadPercentage)}`}>
                              {specialist.loadPercentage}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {getLoadBadge(specialist.loadPercentage)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Загрузка специалистов</CardTitle>
              </CardHeader>
              <CardContent>
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 150]} />
                      <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="загрузка" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Нет данных
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Специалисты по должностям</CardTitle>
              </CardHeader>
              <CardContent>
                {positionPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={positionPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {positionPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Нет данных
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Распределение по загрузке</CardTitle>
              </CardHeader>
              <CardContent>
                {loadDistributionData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={loadDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))">
                        <Cell fill="#f59e0b" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Нет данных
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Часы по должностям</CardTitle>
              </CardHeader>
              <CardContent>
                {positionPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={positionPieData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(var(--chart-2))" name="Часов" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Нет данных
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
