import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  Wallet, TrendingUp, Calendar, Users, 
  BarChart3, CreditCard, Banknote, Clock 
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

type PeriodFilter = "month" | "quarter" | "year" | "all";

export function SpecialistFinancePanel() {
  const { user } = useAuth();
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

  // Fetch sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["finance-sessions", user?.id, period],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          child_id,
          session_status_id,
          topic,
          session_statuses(name),
          children(full_name)
        `)
        .eq("specialist_id", user.id)
        .gte("scheduled_date", format(range.start, "yyyy-MM-dd"))
        .lte("scheduled_date", format(range.end, "yyyy-MM-dd"))
        .order("scheduled_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch session payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["finance-payments", user?.id, period],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("session_payments")
        .select("*")
        .eq("specialist_id", user.id)
        .gte("created_at", range.start.toISOString())
        .lte("created_at", range.end.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const conductedSessions = sessions.filter(
      (s) => (s.session_statuses as any)?.name === "Проведено"
    );
    const cancelledSessions = sessions.filter(
      (s) => (s.session_statuses as any)?.name === "Отменено"
    );

    const paidPayments = payments.filter((p) => p.status === "paid");
    const pendingPayments = payments.filter((p) => p.status === "pending");

    const totalEarned = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const paidSessionIds = new Set(paidPayments.map((p) => p.session_id));
    const sessionsWithPayment = conductedSessions.filter((s) => paidSessionIds.has(s.id));
    const sessionsWithoutPayment = conductedSessions.filter((s) => !paidSessionIds.has(s.id));

    const uniqueChildren = new Set(conductedSessions.map((s) => s.child_id));

    return {
      totalSessions: sessions.length,
      conductedSessions: conductedSessions.length,
      cancelledSessions: cancelledSessions.length,
      sessionsWithPayment: sessionsWithPayment.length,
      sessionsWithoutPayment: sessionsWithoutPayment.length,
      totalEarned,
      pendingAmount,
      uniqueChildren: uniqueChildren.size,
      paidPayments: paidPayments.length,
    };
  }, [sessions, payments]);

  // Recent payment-sessions for table
  const recentPaidSessions = useMemo(() => {
    const paymentMap = new Map(payments.map((p) => [p.session_id, p]));
    return sessions
      .filter((s) => (s.session_statuses as any)?.name === "Проведено")
      .slice(0, 20)
      .map((s) => ({
        ...s,
        payment: paymentMap.get(s.id),
      }));
  }, [sessions, payments]);

  const isLoading = sessionsLoading || paymentsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" />
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
                <CardTitle className="text-sm font-medium">Заработано</CardTitle>
                <Banknote className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalEarned.toLocaleString("ru-RU")} ₽
                </div>
                {stats.pendingAmount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ожидает: {stats.pendingAmount.toLocaleString("ru-RU")} ₽
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Проведено занятий</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conductedSessions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Всего запланировано: {stats.totalSessions}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">С оплатой / Без</CardTitle>
                <CreditCard className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <span className="text-green-600">{stats.sessionsWithPayment}</span>
                  {" / "}
                  <span className="text-muted-foreground">{stats.sessionsWithoutPayment}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Отменено: {stats.cancelledSessions}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Уникальных детей</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueChildren}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  За выбранный период
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sessions table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Проведённые занятия
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Время</TableHead>
                      <TableHead>Ребёнок</TableHead>
                      <TableHead>Тема</TableHead>
                      <TableHead className="text-right">Оплата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPaidSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Нет проведённых занятий за выбранный период
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentPaidSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">
                            {format(parseISO(session.scheduled_date), "dd.MM.yyyy")}
                          </TableCell>
                          <TableCell>
                            {session.start_time?.slice(0, 5)}–{session.end_time?.slice(0, 5)}
                          </TableCell>
                          <TableCell>
                            {(session.children as any)?.full_name || "—"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {session.topic || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {session.payment ? (
                              <Badge
                                variant={session.payment.status === "paid" ? "default" : "secondary"}
                                className={session.payment.status === "paid" ? "bg-green-500 hover:bg-green-600" : ""}
                              >
                                {session.payment.status === "paid"
                                  ? `${Number(session.payment.amount).toLocaleString("ru-RU")} ₽`
                                  : "Ожидает"}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
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
