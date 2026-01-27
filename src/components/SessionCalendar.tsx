import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationHolidays } from "@/hooks/useOrganizationHolidays";
import { useCalendarFilters } from "@/hooks/useCalendarFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  GripVertical,
  RepeatIcon,
  ChevronDown,
  CalendarOff,
  Filter,
  X,
  Users,
  UserCheck,
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
import { GroupSessionForm } from "./GroupSessionForm";
import { RecurringSessionForm } from "./RecurringSessionForm";
import { RescheduleSessionDialog } from "./RescheduleSessionDialog";
import { SessionAttendanceDialog } from "./SessionAttendanceDialog";
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
  is_group?: boolean;
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
  const { isHoliday, getHolidayInfo } = useOrganizationHolidays();
  const {
    activeStatusFilters,
    activeTypeFilters,
    toggleStatusFilter,
    toggleTypeFilter,
    clearFilters,
    hasActiveFilters,
  } = useCalendarFilters();
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showGroupSessionForm, setShowGroupSessionForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [cancelledSession, setCancelledSession] = useState<{
    id: string;
    child_id: string;
    child_name: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    session_type_id: string;
    specialist_id: string;
    organization_id: string | null;
    topic: string | null;
    notes: string | null;
  } | null>(null);
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

  // Fetch all session statuses for legend
  const { data: sessionStatuses = [] } = useQuery({
    queryKey: ["session-statuses-legend"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_statuses")
        .select("id, name, color")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all session types for filter
  const { data: sessionTypes = [] } = useQuery({
    queryKey: ["session-types-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_types")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
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
      if (startH !== slotHour) return false;
      
      // Apply status filter if any filters are active
      if (activeStatusFilters.size > 0 && !activeStatusFilters.has(session.session_status_id)) {
        return false;
      }
      // Apply type filter if any filters are active
      if (activeTypeFilters.size > 0 && !activeTypeFilters.has(session.session_type_id)) {
        return false;
      }
      return true;
    });
  };

  // Calculate counts per status and type
  const sessionCounts = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    
    sessions.forEach(session => {
      statusCounts[session.session_status_id] = (statusCounts[session.session_status_id] || 0) + 1;
      typeCounts[session.session_type_id] = (typeCounts[session.session_type_id] || 0) + 1;
    });
    
    return { statusCounts, typeCounts };
  }, [sessions]);

  const handleAttendanceClick = (session: Session) => {
    setSelectedSession(session);
    setShowAttendanceDialog(true);
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="ml-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Добавить занятие
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSession(null);
                    setSelectedSlot({ date: format(new Date(), "yyyy-MM-dd"), time: "09:00" });
                    setShowSessionForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <div className="flex flex-col">
                    <span>Индивидуальное занятие</span>
                    <span className="text-xs text-muted-foreground">Создать одно занятие</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSession(null);
                    setSelectedSlot({ date: format(new Date(), "yyyy-MM-dd"), time: "09:00" });
                    setShowGroupSessionForm(true);
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  <div className="flex flex-col">
                    <span>Групповое занятие</span>
                    <span className="text-xs text-muted-foreground">Несколько детей</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowRecurringForm(true)}>
                  <RepeatIcon className="h-4 w-4 mr-2" />
                  <div className="flex flex-col">
                    <span>Серия занятий</span>
                    <span className="text-xs text-muted-foreground">Регулярное расписание</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(currentWeekStart, "d MMMM", { locale: ru })} –{" "}
          {format(addDays(currentWeekStart, 6), "d MMMM yyyy", { locale: ru })}
        </p>
        
        {/* Status & Type Filters */}
        <div className="flex flex-col gap-2 mt-3">
          {/* Status filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[70px]">
              <Filter className="h-3 w-3" />
              <span>Статус:</span>
            </div>
            {sessionStatuses.map((status) => {
              const isActive = activeStatusFilters.has(status.id);
              return (
                <button
                  key={status.id}
                  onClick={() => toggleStatusFilter(status.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all",
                    "border hover:shadow-sm",
                    isActive 
                      ? "bg-primary/10 border-primary text-primary font-medium" 
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: status.color || "hsl(var(--primary))" }}
                  />
                  <span>{status.name}</span>
                  {sessionCounts.statusCounts[status.id] > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {sessionCounts.statusCounts[status.id]}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Type filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[70px]">
              <CalendarIcon className="h-3 w-3" />
              <span>Тип:</span>
            </div>
            {sessionTypes.map((type) => {
              const isActive = activeTypeFilters.has(type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => toggleTypeFilter(type.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all",
                    "border hover:shadow-sm",
                    isActive 
                      ? "bg-primary/10 border-primary text-primary font-medium" 
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span>{type.name}</span>
                  {sessionCounts.typeCounts[type.id] > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {sessionCounts.typeCounts[type.id]}
                    </Badge>
                  )}
                </button>
              );
            })}
            
            {/* Reset and Today indicator */}
            <div className="flex items-center gap-2 ml-auto">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="h-3 w-3" />
                  <span>Сбросить</span>
                </button>
              )}
              <div className="flex items-center gap-1.5 pl-2 border-l">
                <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-950 ring-1 ring-blue-300" />
                <span className="text-xs text-muted-foreground">Сегодня</span>
              </div>
            </div>
          </div>
        </div>
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
                const dayHolidayInfo = getHolidayInfo(day);
                const isDayHoliday = isHoliday(day);

                const dayHeader = (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-2 text-center rounded-lg relative",
                      isToday && "bg-primary/10",
                      isDayHoliday && "bg-destructive/10 border border-destructive/30"
                    )}
                  >
                    <div className={cn(
                      "text-xs",
                      isDayHoliday ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {format(day, "EEE", { locale: ru })}
                    </div>
                    <div
                      className={cn(
                        "text-lg font-semibold flex items-center justify-center gap-1",
                        isToday && "text-primary",
                        isDayHoliday && "text-destructive"
                      )}
                    >
                      {format(day, "d")}
                      {isDayHoliday && (
                        <CalendarOff className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                );

                if (isDayHoliday && dayHolidayInfo) {
                  return (
                    <TooltipProvider key={day.toISOString()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {dayHeader}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{dayHolidayInfo.name}</p>
                          <p className="text-xs text-muted-foreground">Нерабочий день</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return dayHeader;
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
                    const isDayHoliday = isHoliday(day);

                    return (
                      <div
                        key={`${day.toISOString()}-${time}`}
                        className={cn(
                          "p-1 min-h-[60px] border-r last:border-r-0 cursor-pointer transition-colors",
                          isToday && "bg-primary/5",
                          isDayHoliday && "bg-destructive/5",
                          draggedSession && "hover:bg-accent"
                        )}
                        onClick={() => handleSlotClick(day, time)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDrop(day, time);
                        }}
                      >
                        {slotSessions.map((session) => {
                          const statusColor = session.session_statuses?.color || "hsl(var(--primary))";
                          const statusName = session.session_statuses?.name?.toLowerCase() || "";
                          
                          // Determine background style based on status
                          const isPlanned = statusName.includes("заплан");
                          const isConducted = statusName.includes("провед") || statusName.includes("выполн");
                          const isCancelled = statusName.includes("отмен");
                          
                          const getSessionStyles = () => {
                            if (isToday) {
                              if (isConducted) {
                                return "bg-emerald-50 dark:bg-emerald-950/30 border-l-emerald-500";
                              }
                              if (isCancelled) {
                                return "bg-red-50 dark:bg-red-950/30 border-l-red-500 opacity-60";
                              }
                              if (isPlanned) {
                                return "bg-blue-50 dark:bg-blue-950/30 border-l-blue-500 ring-2 ring-blue-200 dark:ring-blue-800";
                              }
                            }
                            return "bg-card";
                          };

                          return (
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
                                "border-l-4 shadow-sm hover:shadow-md transition-all",
                                getSessionStyles()
                              )}
                              style={{
                                borderLeftColor: isToday ? undefined : statusColor,
                              }}
                            >
                              <div className="flex items-start gap-1">
                                <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate flex items-center gap-1">
                                    {session.children?.full_name}
                                    {session.is_group && (
                                      <Users className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {session.start_time.slice(0, 5)} –{" "}
                                    {session.end_time.slice(0, 5)}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    {session.session_types?.name && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1 py-0"
                                      >
                                        {session.session_types.name}
                                      </Badge>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAttendanceClick(session);
                                      }}
                                      aria-label="Отметить посещаемость"
                                    >
                                      <UserCheck className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
        onSessionCancelled={(session) => {
          setCancelledSession(session);
          setShowRescheduleDialog(true);
        }}
      />

      <GroupSessionForm
        open={showGroupSessionForm}
        onOpenChange={setShowGroupSessionForm}
        session={selectedSession?.is_group ? selectedSession : null}
        defaultDate={selectedSlot?.date}
        defaultStartTime={selectedSlot?.time}
      />

      <RecurringSessionForm
        open={showRecurringForm}
        onOpenChange={setShowRecurringForm}
      />

      <RescheduleSessionDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        cancelledSession={cancelledSession}
      />

      {selectedSession && (
        <SessionAttendanceDialog
          open={showAttendanceDialog}
          onOpenChange={setShowAttendanceDialog}
          sessionId={selectedSession.id}
          sessionDate={selectedSession.scheduled_date}
          sessionTime={selectedSession.start_time}
          isGroupSession={selectedSession.is_group}
        />
      )}
    </Card>
  );
}