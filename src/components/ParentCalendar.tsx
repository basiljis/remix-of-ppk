import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Loader2, CalendarDays, Clock, MapPin, User, Info, 
  ChevronLeft, ChevronRight, Plus
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BookConsultationDialog } from "./BookConsultationDialog";
import { ParentSessionsList } from "./ParentSessionsList";

interface ParentCalendarProps {
  parentUserId: string;
  childIds: string[];
  regionId: string | null;
  children: Array<{ id: string; full_name: string }>;
}

export interface SessionWithDetails {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  topic: string | null;
  session_status: { name: string; color: string | null } | null;
  session_type: { name: string } | null;
  specialist: { full_name: string } | null;
  organization: { name: string; address: string | null } | null;
  child: { full_name: string } | null;
}

const timeSlots = Array.from({ length: 12 }, (_, i) => {
  const hour = 8 + i;
  return `${String(hour).padStart(2, "0")}:00`;
});

type ViewMode = "week" | "month";

export function ParentCalendar({ parentUserId, childIds, regionId, children }: ParentCalendarProps) {
  const isMobile = useIsMobile();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    const firstDayOfWeek = start.getDay();
    const daysToAddBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = daysToAddBefore; i > 0; i--) {
      days.unshift(addDays(start, -i));
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(addDays(end, i));
    }
    
    return days;
  }, [currentMonth]);

  // Fetch sessions for parent's children via linked_parent_children
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["parent-children-sessions", childIds],
    queryFn: async () => {
      if (childIds.length === 0) return [];

      const { data: linkedChildren, error: linkedError } = await supabase
        .from("linked_parent_children" as any)
        .select("parent_child_id, organization_id")
        .in("parent_child_id", childIds);

      if (linkedError) throw linkedError;
      if (!linkedChildren || linkedChildren.length === 0) return [];

      const { data: parentChildrenData } = await supabase
        .from("parent_children" as any)
        .select("id, full_name")
        .in("id", childIds);

      const childNames = (parentChildrenData as any[])?.map(c => c.full_name.toLowerCase()) || [];
      const orgIds = [...new Set((linkedChildren as any[]).map(l => l.organization_id))];

      const { data: orgChildren } = await supabase
        .from("children")
        .select("id, full_name, organization_id")
        .in("organization_id", orgIds);

      const matchedOrgChildIds = (orgChildren || [])
        .filter(oc => childNames.includes(oc.full_name.toLowerCase()))
        .map(oc => oc.id);

      if (matchedOrgChildIds.length === 0) return [];

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          topic,
          session_status:session_statuses(name, color),
          session_type:session_types(name),
          specialist:profiles!sessions_specialist_id_fkey(full_name),
          organization:organizations(name, address),
          child:children(full_name)
        `)
        .in("child_id", matchedOrgChildIds)
        .gte("scheduled_date", pastDate.toISOString().split("T")[0])
        .lte("scheduled_date", futureDate.toISOString().split("T")[0])
        .order("scheduled_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (sessionsError) throw sessionsError;
      return (sessionsData as SessionWithDetails[]) || [];
    },
    enabled: childIds.length > 0,
  });

  // Fetch consultation slots
  const { data: consultationSlots = [] } = useQuery({
    queryKey: ["parent-consultation-slots", parentUserId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: children } = await supabase
        .from("parent_children")
        .select("id")
        .eq("parent_user_id", user.id);

      if (!children || children.length === 0) return [];

      const childIds = children.map(c => c.id);
      const today = new Date().toISOString().split('T')[0];

      const { data: slots, error } = await supabase
        .from("consultation_slots")
        .select(`
          id,
          slot_date,
          start_time,
          end_time,
          booked_for_child_id,
          booking_notes,
          organization_id,
          specialist:profiles!consultation_slots_specialist_id_fkey(full_name),
          organization:organizations(name, address)
        `)
        .in("booked_for_child_id", childIds)
        .eq("is_booked", true)
        .gte("slot_date", today)
        .order("slot_date", { ascending: true });

      if (error) {
        console.error("Error fetching consultation slots:", error);
        return [];
      }

      return slots || [];
    },
    enabled: !!parentUserId,
  });

  const getSessionsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return sessions.filter(s => s.scheduled_date === dateStr);
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

  const getConsultationsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return consultationSlots.filter((s: any) => s.slot_date === dateStr);
  };

  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];
  const selectedDateConsultations = selectedDate ? getConsultationsForDate(selectedDate) : [];

  const handleDateSelect = (day: Date) => {
    setSelectedDate(day);
    if (isMobile) {
      setSheetOpen(true);
    }
  };

  if (childIds.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Добавьте ребёнка, чтобы видеть его занятия в календаре
        </AlertDescription>
      </Alert>
    );
  }

  const renderDayDetails = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">
        {selectedDate 
          ? format(selectedDate, "d MMMM yyyy", { locale: ru })
          : "Выберите день"}
      </h3>

      {selectedDate && selectedDateSessions.length === 0 && selectedDateConsultations.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Нет занятий на эту дату
        </p>
      ) : (
        <ScrollArea className="h-[calc(100vh-300px)] md:h-auto md:max-h-[500px]">
          <div className="space-y-3 pr-4">
            {selectedDateSessions.map((session) => (
              <Card key={session.id} className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm">
                        {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                      </span>
                    </div>
                    {session.session_status && (
                      <Badge 
                        style={session.session_status.color ? { backgroundColor: session.session_status.color, color: 'white' } : undefined}
                        variant={session.session_status.color ? "default" : "secondary"}
                        className="text-xs flex-shrink-0"
                      >
                        {session.session_status.name}
                      </Badge>
                    )}
                  </div>

                  {session.child && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>{session.child.full_name}</span>
                    </div>
                  )}

                  {session.session_type && (
                    <Badge variant="outline" className="text-xs">
                      {session.session_type.name}
                    </Badge>
                  )}

                  {session.topic && (
                    <p className="text-sm text-muted-foreground">
                      {session.topic}
                    </p>
                  )}

                  {session.specialist && (
                    <p className="text-xs text-muted-foreground">
                      Специалист: {session.specialist.full_name}
                    </p>
                  )}

                  {session.organization && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>
                        {session.organization.name}
                        {session.organization.address && ` • ${session.organization.address}`}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {selectedDateConsultations.map((slot: any) => (
              <Card key={slot.id} className="p-3 border-pink-200 bg-pink-50/50 dark:bg-pink-950/20">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-pink-600 flex-shrink-0" />
                      <span className="font-medium text-sm">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </span>
                    </div>
                    <Badge className="text-xs bg-pink-600 flex-shrink-0">
                      Консультация
                    </Badge>
                  </div>

                  {slot.specialist && (
                    <p className="text-xs text-muted-foreground">
                      Специалист: {slot.specialist.full_name}
                    </p>
                  )}

                  {slot.organization && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>
                        {slot.organization.name}
                        {slot.organization.address && ` • ${slot.organization.address}`}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  return (
    <div className="h-full flex gap-4">
      {/* Main Calendar */}
      <Card className="flex-1 flex flex-col min-w-0">
        <CardHeader className="flex-shrink-0 pb-3">
          {/* Header with controls - responsive layout */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CalendarDays className="h-5 w-5 text-pink-600" />
              <span className="hidden xs:inline">Расписание занятий</span>
              <span className="xs:hidden">Расписание</span>
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Book Consultation Button */}
              <Button 
                onClick={() => setBookingDialogOpen(true)}
                size="sm"
                className="bg-pink-600 hover:bg-pink-700 gap-1 text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Записаться</span>
              </Button>

              {/* View mode toggle */}
              <div className="flex rounded-lg border overflow-hidden">
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-none px-2 sm:px-3 text-xs sm:text-sm",
                    viewMode === "week" && "bg-pink-600 hover:bg-pink-700"
                  )}
                  onClick={() => setViewMode("week")}
                >
                  Неделя
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-none px-2 sm:px-3 text-xs sm:text-sm",
                    viewMode === "month" && "bg-pink-600 hover:bg-pink-700"
                  )}
                  onClick={() => setViewMode("month")}
                >
                  Месяц
                </Button>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => 
                    viewMode === "week" 
                      ? setCurrentWeekStart(subWeeks(currentWeekStart, 1))
                      : setCurrentMonth(subMonths(currentMonth, 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 sm:px-3 text-xs sm:text-sm h-8"
                  onClick={() => {
                    if (viewMode === "week") {
                      setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
                    } else {
                      setCurrentMonth(new Date());
                    }
                  }}
                >
                  Сегодня
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => 
                    viewMode === "week" 
                      ? setCurrentWeekStart(addWeeks(currentWeekStart, 1))
                      : setCurrentMonth(addMonths(currentMonth, 1))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Date range */}
          <p className="text-sm text-muted-foreground mt-2">
            {viewMode === "week" ? (
              <>
                {format(currentWeekStart, "d MMMM", { locale: ru })} –{" "}
                {format(addDays(currentWeekStart, 6), "d MMMM yyyy", { locale: ru })}
              </>
            ) : (
              format(currentMonth, "LLLL yyyy", { locale: ru })
            )}
          </p>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-950 ring-1 ring-blue-300" />
              <span className="text-xs text-muted-foreground">Сегодня</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-pink-100 dark:bg-pink-950 ring-1 ring-pink-300" />
              <span className="text-xs text-muted-foreground">Есть занятия</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-3 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === "week" ? (
            // Weekly view with time slots - fully responsive
            <div className="h-full flex flex-col">
              <ScrollArea className="flex-1">
                <div className="min-w-[320px]">
                  {/* Header with weekdays - responsive */}
                  <div className="grid grid-cols-8 gap-0.5 sm:gap-1 mb-2 sticky top-0 bg-card z-10">
                    <div className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-muted-foreground">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mx-auto" />
                    </div>
                    {weekDays.map((day) => {
                      const isToday = isSameDay(day, new Date());
                      const daySessions = getSessionsForDate(day);
                      const hasEvents = daySessions.length > 0;
                      const isSelected = selectedDate && isSameDay(day, selectedDate);

                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "p-1 sm:p-2 text-center rounded-lg cursor-pointer transition-colors",
                            isToday && "bg-blue-100 dark:bg-blue-950",
                            hasEvents && !isToday && "bg-pink-50 dark:bg-pink-950/30",
                            isSelected && "ring-2 ring-pink-500"
                          )}
                          onClick={() => handleDateSelect(day)}
                        >
                          <div className="text-[10px] sm:text-xs text-muted-foreground uppercase">
                            {format(day, isMobile ? "EEEEE" : "EEE", { locale: ru })}
                          </div>
                          <div className={cn(
                            "text-sm sm:text-lg font-semibold",
                            isToday && "text-blue-600"
                          )}>
                            {format(day, "d")}
                          </div>
                          {hasEvents && (
                            <Badge 
                              variant="secondary" 
                              className="mt-0.5 text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0 bg-pink-100 text-pink-700"
                            >
                              {daySessions.length}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Time grid - responsive */}
                  <div className="border rounded-lg overflow-hidden">
                    {timeSlots.map((time) => (
                      <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                        <div className="p-1 sm:p-2 text-[10px] sm:text-xs text-muted-foreground text-center border-r bg-muted/30">
                          {time}
                        </div>
                        {weekDays.map((day) => {
                          const slotSessions = getSessionsForSlot(day, time);
                          const isToday = isSameDay(day, new Date());

                          return (
                            <div
                              key={`${day.toISOString()}-${time}`}
                              className={cn(
                                "min-h-[40px] sm:min-h-[60px] p-0.5 sm:p-1 border-r last:border-r-0 relative",
                                isToday && "bg-blue-50/50 dark:bg-blue-950/20"
                              )}
                              onClick={() => handleDateSelect(day)}
                            >
                              <div className="space-y-0.5 sm:space-y-1">
                                {slotSessions.map((session) => (
                                  <TooltipProvider key={session.id}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={cn(
                                            "p-0.5 sm:p-1.5 rounded text-[8px] sm:text-xs cursor-pointer transition-all hover:shadow-md",
                                            "border-l-2"
                                          )}
                                          style={{
                                            backgroundColor: session.session_status?.color 
                                              ? `${session.session_status.color}20` 
                                              : "hsl(var(--muted))",
                                            borderColor: session.session_status?.color || "hsl(var(--primary))",
                                          }}
                                        >
                                          <div className="font-medium truncate">
                                            {isMobile 
                                              ? session.child?.full_name?.split(" ")[0]?.charAt(0) || "З"
                                              : session.child?.full_name?.split(" ")[0] || "Занятие"
                                            }
                                          </div>
                                          <div className="text-muted-foreground truncate hidden sm:block">
                                            {session.start_time.slice(0, 5)}
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-xs">
                                        <div className="space-y-1">
                                          <p className="font-medium">{session.child?.full_name}</p>
                                          <p className="text-sm">
                                            {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                                          </p>
                                          {session.session_type && (
                                            <Badge variant="secondary" className="text-xs">
                                              {session.session_type.name}
                                            </Badge>
                                          )}
                                          {session.specialist && (
                                            <p className="text-xs text-muted-foreground">
                                              Специалист: {session.specialist.full_name}
                                            </p>
                                          )}
                                          {session.topic && (
                                            <p className="text-xs">{session.topic}</p>
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : (
            // Monthly view - fixed grid layout
            <div className="h-full flex flex-col">
              {/* Calendar grid */}
              <div className="flex-1 min-w-0">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-1">
                  {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, idx) => (
                    <div key={idx} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days grid - fixed sizing */}
                <div className="grid grid-cols-7 gap-1 auto-rows-fr">
                  {monthDays.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const daySessions = getSessionsForDate(day);
                    const dayConsultations = getConsultationsForDate(day);
                    const hasEvents = daySessions.length > 0 || dayConsultations.length > 0;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => handleDateSelect(day)}
                        className={cn(
                          "min-h-[80px] p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md flex flex-col",
                          !isCurrentMonth && "opacity-40",
                          isToday && "bg-blue-100 dark:bg-blue-950 border-blue-300",
                          hasEvents && !isToday && "bg-pink-50 dark:bg-pink-950/30",
                          isSelected && "ring-2 ring-pink-500 shadow-md"
                        )}
                      >
                        <div className={cn(
                          "text-sm font-medium mb-1",
                          isToday && "text-blue-600"
                        )}>
                          {format(day, "d")}
                        </div>
                        
                        {/* Event indicators */}
                        <div className="flex-1 space-y-0.5 overflow-hidden">
                          {daySessions.slice(0, 2).map((session) => (
                            <div
                              key={session.id}
                              className="text-[10px] px-1 py-0.5 rounded truncate"
                              style={{
                                backgroundColor: session.session_status?.color 
                                  ? `${session.session_status.color}30` 
                                  : "hsl(var(--muted))",
                                color: session.session_status?.color || "hsl(var(--foreground))",
                              }}
                            >
                              {session.child?.full_name?.split(" ")[0] || "Занятие"}
                            </div>
                          ))}
                          {daySessions.length > 2 && (
                            <div className="text-[10px] text-muted-foreground px-1">
                              +{daySessions.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right sidebar with sessions list - desktop only */}
      {!isMobile && (
        <ParentSessionsList 
          sessions={sessions} 
          className="w-80 flex-shrink-0" 
        />
      )}

      {/* Mobile sheet for day details */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>
              {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: ru })}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {renderDayDetails()}
          </div>
        </SheetContent>
      </Sheet>

      {/* Booking Dialog */}
      <BookConsultationDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        parentUserId={parentUserId}
        regionId={regionId}
        children={children}
      />
    </div>
  );
}
