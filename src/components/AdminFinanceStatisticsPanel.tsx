import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Wallet, TrendingUp, Users, Banknote, 
  BarChart3, CreditCard, Calendar 
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";

type PeriodFilter = "month" | "quarter" | "year" | "all";

export function AdminFinanceStatisticsPanel() {
  const [period, setPeriod] = useState<PeriodFilter>("month");

  const getPeriodRange = () => {
    const now = new Date();
    switch (period) {
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "quarter":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "all":
        return { start: new Date("2020-01-01"), end: new Date("2099-12-31") };
    }
  };

  const range = getPeriodRange();

  // Fetch all session payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin-finance-payments", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_payments")
        .select(`
          *,
          sessions(
            scheduled_date,
            specialist_id,
            child_id,
            session_statuses(name)
          )
        `)
        .gte("created_at", range.start.toISOString())
        .lte("created_at", range.end.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all sessions for the period
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["admin-finance-sessions", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          id,
          specialist_id,
          scheduled_date,
          session_status_id,
          session_statuses(name)
        `)
        .gte("scheduled_date", format(range.start, "yyyy-MM-dd"))
        .lte("scheduled_date", format(range.end, "yyyy-MM-dd"));

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch specialist names
  const specialistIds = useMemo(() => {
    const ids = new Set<string>();
    sessions.forEach((s) => ids.add(s.specialist_id));
    payments.forEach((p) => ids.add(p.specialist_id));
    return Array.from(ids);
  }, [sessions, payments]);

  const { data: specialists = [] } = useQuery({
    queryKey: ["admin-finance-specialists", specialistIds],
    queryFn: async () => {
      if (specialistIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", specialistIds);
      if (error) throw error;
      return data || [];
    },
    enabled: specialistIds.length > 0,
  });

  const specialistMap = useMemo(() => {
    const map = new Map<string, { full_name: string; email: string }>();
    specialists.forEach((s) => map.set(s.id, s));
    return map;
  }, [specialists]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const paidPayments = payments.filter((p) => p.status === "paid");
    const totalRevenue = paidPayments.reduce((s, p) => s + Number(p.amount), 0);
    const conductedSessions = sessions.filter(
      (s) => (s.session_statuses as any)?.name === "Проведено"
    );

    return {
      totalRevenue,
      totalPayments: paidPayments.length,
      totalSessions: sessions.length,
      conductedSessions: conductedSessions.length,
      cancelledSessions: sessions.filter(
        (s) => (s.session_statuses as any)?.name === "Отменено"
      ).length,
      activeSpecialists: new Set(conductedSessions.map((s) => s.specialist_id)).size,
    };
  }, [payments, sessions]);

  // Per-specialist breakdown
  const specialistBreakdown = useMemo(() => {
    const bySpecialist = new Map<string, {
      sessions: number;
      conducted: number;
      earned: number;
      paidSessions: number;
    }>();

    sessions.forEach((s) => {
      const entry = bySpecialist.get(s.specialist_id) || {
        sessions: 0, conducted: 0, earned: 0, paidSessions: 0,
      };
      entry.sessions++;
      if ((s.session_statuses as any)?.name === "Проведено") {
        entry.conducted++;
      }
      bySpecialist.set(s.specialist_id, entry);
    });

    payments.filter((p) => p.status === "paid").forEach((p) => {
      const entry = bySpecialist.get(p.specialist_id) || {
        sessions: 0, conducted: 0, earned: 0, paidSessions: 0,
      };
      entry.earned += Number(p.amount);
      entry.paidSessions++;
      bySpecialist.set(p.specialist_id, entry);
    });

    return Array.from(bySpecialist.entries())
      .map(([id, data]) => ({
        id,
        name: specialistMap.get(id)?.full_name || "Неизвестный",
        email: specialistMap.get(id)?.email || "",
        ...data,
      }))
      .sort((a, b) => b.earned - a.earned);
  }, [sessions, payments, specialistMap]);

  const isLoading = paymentsLoading || sessionsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Финансовая статистика
        </h2>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Текущий месяц</SelectItem>
            <SelectItem value="quarter">Последние 3 месяца</SelectItem>
            <SelectItem value="year">Текущий год</SelectItem>
            <SelectItem value="all">Всё время</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
                <Banknote className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {overallStats.totalRevenue.toLocaleString("ru-RU")} ₽
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overallStats.totalPayments} оплат
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Проведено занятий</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.conductedSessions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Всего: {overallStats.totalSessions} | Отмена: {overallStats.cancelledSessions}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Активных специалистов</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.activeSpecialists}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  С проведёнными занятиями
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
                <CreditCard className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overallStats.totalPayments > 0
                    ? Math.round(overallStats.totalRevenue / overallStats.totalPayments).toLocaleString("ru-RU")
                    : 0} ₽
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  За занятие
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Specialist breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                По специалистам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Специалист</TableHead>
                      <TableHead className="text-center">Занятий</TableHead>
                      <TableHead className="text-center">Проведено</TableHead>
                      <TableHead className="text-center">С оплатой</TableHead>
                      <TableHead className="text-right">Заработано</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialistBreakdown.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Нет данных за выбранный период
                        </TableCell>
                      </TableRow>
                    ) : (
                      specialistBreakdown.map((spec) => (
                        <TableRow key={spec.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{spec.name}</p>
                              <p className="text-xs text-muted-foreground">{spec.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{spec.sessions}</TableCell>
                          <TableCell className="text-center">{spec.conducted}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{spec.paidSessions}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {spec.earned > 0 ? (
                              <span className="text-green-600">
                                {spec.earned.toLocaleString("ru-RU")} ₽
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0 ₽</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
