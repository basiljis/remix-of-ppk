import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  GripVertical,
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
} from "date-fns";
import { ru } from "date-fns/locale";
import { SessionForm } from "./SessionForm";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  child_id: string;
  specialist_id: string;
  session_type_id: string;
  session_status_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  topic: string | null;
  notes: string | null;
  children: { full_name: string } | null;
  session_types: { name: string } | null;
  session_statuses: { name: string; color: string | null } | null;
}

const timeSlots = Array.from({ length: 12 }, (_, i) => {
  const hour = 8 + i;
  return `${String(hour).padStart(2, "0")}:00`;
});

export function SessionCalendar() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [draggedSession, setDraggedSession] = useState<Session | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const weekStart = format(currentWeekStart, "yyyy-MM-dd");
  const weekEnd = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions", user?.id, weekStart, weekEnd],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("sessions")
        .select(
          `
          *,
          children (full_name),
          session_types (name),
          session_statuses (name, color)
        `
        )
        .eq("specialist_id", user.id)
        .gte("scheduled_date", weekStart)
        .lte("scheduled_date", weekEnd)
        .order("start_time");
      if (error) throw error;
      return data as Session[];
    },
    enabled: !!user?.id,
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({
      id,
      scheduled_date,
      start_time,
      end_time,
    }: {
      id: string;
      scheduled_date: string;
      start_time: string;
      end_time: string;
    }) => {
      const { error } = await supabase
        .from("sessions")
        .update({ scheduled_date, start_time, end_time })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({
        title: "Успешно",
        description: "Занятие перенесено",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (session: Session) => {
    setDraggedSession(session);
  };

  const handleDragEnd = () => {
    setDraggedSession(null);
  };

  const handleDrop = (date: Date, time: string) => {
    if (!draggedSession) return;

    const scheduled_date = format(date, "yyyy-MM-dd");
    const start_time = time;

    // Calculate new end time based on original duration
    const [oldStartH, oldStartM] = draggedSession.start_time.split(":").map(Number);
    const [oldEndH, oldEndM] = draggedSession.end_time.split(":").map(Number);
    const durationMins = (oldEndH * 60 + oldEndM) - (oldStartH * 60 + oldStartM);

    const [newH, newM] = time.split(":").map(Number);
    const endMins = newH * 60 + newM + durationMins;
    const end_time = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(
      endMins % 60
    ).padStart(2, "0")}`;

    updateSessionMutation.mutate({
      id: draggedSession.id,
      scheduled_date,
      start_time,
      end_time,
    });
  };

  const handleSlotClick = (date: Date, time: string) => {
    setSelectedSlot({
      date: format(date, "yyyy-MM-dd"),
      time,
    });
    setSelectedSession(null);
    setShowSessionForm(true);
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setSelectedSlot(null);
    setShowSessionForm(true);
  };

  const getSessionsForSlot = (date: Date, time: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const [slotHour] = time.split(":").map(Number);

    return sessions.filter((session) => {
      if (session.scheduled_date !== dateStr) return false;
      const [startH] = session.start_time.split(":").map(Number);
      return startH === slotHour;
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Моё расписание
          </CardTitle>
          <div className="flex items-center gap-2">
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
            <Button
              onClick={() => {
                setSelectedSession(null);
                setSelectedSlot({ date: format(new Date(), "yyyy-MM-dd"), time: "09:00" });
                setShowSessionForm(true);
              }}
              className="ml-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              Добавить занятие
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(currentWeekStart, "d MMMM", { locale: ru })} –{" "}
          {format(addDays(currentWeekStart, 6), "d MMMM yyyy", { locale: ru })}
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

                    return (
                      <div
                        key={`${day.toISOString()}-${time}`}
                        className={cn(
                          "p-1 min-h-[60px] border-r last:border-r-0 cursor-pointer transition-colors",
                          isToday && "bg-primary/5",
                          draggedSession && "hover:bg-accent"
                        )}
                        onClick={() => handleSlotClick(day, time)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDrop(day, time);
                        }}
                      >
                        {slotSessions.map((session) => (
                          <div
                            key={session.id}
                            draggable
                            onDragStart={() => handleDragStart(session)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSessionClick(session);
                            }}
                            className={cn(
                              "p-1.5 rounded text-xs mb-1 cursor-grab active:cursor-grabbing",
                              "border-l-4 bg-card shadow-sm hover:shadow-md transition-shadow"
                            )}
                            style={{
                              borderLeftColor:
                                session.session_statuses?.color || "hsl(var(--primary))",
                            }}
                          >
                            <div className="flex items-start gap-1">
                              <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
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
                            </div>
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
      </CardContent>

      <SessionForm
        open={showSessionForm}
        onOpenChange={setShowSessionForm}
        session={selectedSession}
        defaultDate={selectedSlot?.date}
        defaultStartTime={selectedSlot?.time}
      />
    </Card>
  );
}