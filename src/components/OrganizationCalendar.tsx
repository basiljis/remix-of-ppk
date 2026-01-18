import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Users,
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  child_id: string;
  specialist_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  topic: string | null;
  children: { full_name: string } | null;
  profiles: { full_name: string } | null;
  session_types: { name: string } | null;
  session_statuses: { name: string; color: string | null } | null;
}

const timeSlots = Array.from({ length: 12 }, (_, i) => {
  const hour = 8 + i;
  return `${String(hour).padStart(2, "0")}:00`;
});

export function OrganizationCalendar() {
  const { user, profile, isAdmin, roles } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [specialistFilter, setSpecialistFilter] = useState<string>("all");

  const isOrgAdmin = roles.some((r) => r.role === "organization_admin");
  const isRegionalOperator = roles.some((r) => r.role === "regional_operator");

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const weekStart = format(currentWeekStart, "yyyy-MM-dd");
  const weekEnd = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

  // Fetch specialists for the organization
  const { data: specialists = [] } = useQuery({
    queryKey: ["org-specialists", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id && !isAdmin) return [];
      
      let query = supabase
        .from("profiles")
        .select("id, full_name, positions(name)")
        .eq("is_blocked", false);

      if (!isAdmin && profile?.organization_id) {
        query = query.eq("organization_id", profile.organization_id);
      }

      const { data, error } = await query.order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!(profile?.organization_id || isAdmin),
  });

  // Fetch all sessions for the organization
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["org-sessions", profile?.organization_id, weekStart, weekEnd, specialistFilter],
    queryFn: async () => {
      if (!profile?.organization_id && !isAdmin) return [];

      let query = supabase
        .from("sessions")
        .select(`
          *,
          children (full_name),
          profiles!sessions_specialist_id_fkey (full_name),
          session_types (name),
          session_statuses (name, color)
        `)
        .gte("scheduled_date", weekStart)
        .lte("scheduled_date", weekEnd)
        .order("start_time");

      if (!isAdmin && profile?.organization_id) {
        query = query.eq("organization_id", profile.organization_id);
      }

      if (specialistFilter !== "all") {
        query = query.eq("specialist_id", specialistFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Session[];
    },
    enabled: !!(profile?.organization_id || isAdmin),
  });

  const getSessionsForSlot = (date: Date, time: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const [slotHour] = time.split(":").map(Number);

    return sessions.filter((session) => {
      if (session.scheduled_date !== dateStr) return false;
      const [startH] = session.start_time.split(":").map(Number);
      return startH === slotHour;
    });
  };

  // Group sessions by specialist for the slot
  const groupSessionsBySpecialist = (slotSessions: Session[]) => {
    const grouped: Record<string, Session[]> = {};
    slotSessions.forEach((session) => {
      const specId = session.specialist_id;
      if (!grouped[specId]) grouped[specId] = [];
      grouped[specId].push(session);
    });
    return grouped;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Расписание организации
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={specialistFilter} onValueChange={setSpecialistFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Все специалисты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все специалисты</SelectItem>
                {specialists.map((spec) => (
                  <SelectItem key={spec.id} value={spec.id}>
                    {spec.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
              }
            >
              Сегодня
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(currentWeekStart, "d MMMM", { locale: ru })} –{" "}
          {format(addDays(currentWeekStart, 6), "d MMMM yyyy", { locale: ru })}
          {specialistFilter !== "all" && (
            <span className="ml-2">
              • Показан 1 специалист
            </span>
          )}
          {specialistFilter === "all" && specialists.length > 0 && (
            <span className="ml-2">
              • Всего специалистов: {specialists.length}
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header with weekdays */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="p-2 text-center text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4 mx-auto" />
              </div>
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-2 text-center rounded-lg",
                      isToday && "bg-primary/10"
                    )}
                  >
                    <div className="text-xs text-muted-foreground">
                      {format(day, "EEE", { locale: ru })}
                    </div>
                    <div
                      className={cn(
                        "text-lg font-semibold",
                        isToday && "text-primary"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="border rounded-lg overflow-hidden">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="grid grid-cols-8 gap-0 border-b last:border-b-0"
                >
                  <div className="p-2 text-xs text-muted-foreground border-r bg-muted/30 flex items-center justify-center">
                    {time}
                  </div>
                  {weekDays.map((day) => {
                    const slotSessions = getSessionsForSlot(day, time);
                    const isToday = isSameDay(day, new Date());
                    const grouped = groupSessionsBySpecialist(slotSessions);

                    return (
                      <div
                        key={`${day.toISOString()}-${time}`}
                        className={cn(
                          "p-1 min-h-[60px] border-r last:border-r-0",
                          isToday && "bg-primary/5"
                        )}
                      >
                        {Object.entries(grouped).map(([specId, specSessions]) => (
                          <div key={specId}>
                            {specSessions.map((session) => (
                              <div
                                key={session.id}
                                className={cn(
                                  "p-1.5 rounded text-xs mb-1",
                                  "border-l-4 bg-card shadow-sm"
                                )}
                                style={{
                                  borderLeftColor:
                                    session.session_statuses?.color || "hsl(var(--primary))",
                                }}
                              >
                                <div className="font-medium truncate text-primary">
                                  {session.profiles?.full_name}
                                </div>
                                <div className="truncate">
                                  {session.children?.full_name}
                                </div>
                                <div className="text-muted-foreground">
                                  {session.start_time.slice(0, 5)} –{" "}
                                  {session.end_time.slice(0, 5)}
                                </div>
                                {session.session_types?.name && (
                                  <Badge
                                    variant="secondary"
                                    className="mt-1 text-[10px] px-1 py-0"
                                  >
                                    {session.session_types.name}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            Загрузка...
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Нет занятий на выбранную неделю</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
