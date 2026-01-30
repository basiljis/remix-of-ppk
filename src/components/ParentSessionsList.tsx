import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isPast, isToday, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionWithDetails {
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

interface ParentSessionsListProps {
  sessions: SessionWithDetails[];
  className?: string;
}

export function ParentSessionsList({ sessions, className }: ParentSessionsListProps) {
  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const currentTime = format(now, "HH:mm");

    const upcomingSessions: SessionWithDetails[] = [];
    const pastSessions: SessionWithDetails[] = [];

    sessions.forEach((session) => {
      const sessionDate = session.scheduled_date;
      if (sessionDate > todayStr) {
        upcomingSessions.push(session);
      } else if (sessionDate < todayStr) {
        pastSessions.push(session);
      } else {
        // Today - check time
        if (session.end_time > currentTime) {
          upcomingSessions.push(session);
        } else {
          pastSessions.push(session);
        }
      }
    });

    // Sort upcoming ascending, past descending
    upcomingSessions.sort((a, b) => {
      if (a.scheduled_date !== b.scheduled_date) {
        return a.scheduled_date.localeCompare(b.scheduled_date);
      }
      return a.start_time.localeCompare(b.start_time);
    });

    pastSessions.sort((a, b) => {
      if (a.scheduled_date !== b.scheduled_date) {
        return b.scheduled_date.localeCompare(a.scheduled_date);
      }
      return b.start_time.localeCompare(a.start_time);
    });

    return { upcoming: upcomingSessions, past: pastSessions };
  }, [sessions]);

  const getSessionStatusIcon = (session: SessionWithDetails) => {
    const statusName = session.session_status?.name?.toLowerCase() || "";
    
    if (statusName.includes("проведен") || statusName.includes("завершен")) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (statusName.includes("отменен") || statusName.includes("пропуск")) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const renderSessionCard = (session: SessionWithDetails, showStatus: boolean = true) => {
    const sessionDate = parseISO(session.scheduled_date);
    const isSessionToday = isToday(sessionDate);
    const isPastSession = isPast(sessionDate) && !isSessionToday;

    return (
      <Card 
        key={session.id} 
        className={cn(
          "p-3 transition-all hover:shadow-sm",
          isSessionToday && "border-primary/50 bg-primary/5"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Status indicator */}
          {showStatus && (
            <div className="mt-0.5">
              {getSessionStatusIcon(session)}
            </div>
          )}
          
          <div className="flex-1 min-w-0 space-y-1">
            {/* Date and time */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-medium",
                  isSessionToday && "text-primary"
                )}>
                  {isSessionToday 
                    ? "Сегодня" 
                    : format(sessionDate, "d MMM", { locale: ru })
                  }
                </span>
                <span className="text-sm text-muted-foreground">
                  {session.start_time.slice(0, 5)}
                </span>
              </div>
              {session.session_status && (
                <Badge 
                  variant="outline"
                  className="text-[10px] px-1.5"
                  style={session.session_status.color ? { 
                    borderColor: session.session_status.color,
                    color: session.session_status.color,
                    backgroundColor: `${session.session_status.color}10`
                  } : undefined}
                >
                  {session.session_status.name}
                </Badge>
              )}
            </div>

            {/* Child name */}
            {session.child && (
              <p className="text-sm font-medium truncate">
                {session.child.full_name}
              </p>
            )}

            {/* Specialist */}
            {session.specialist && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">{session.specialist.full_name}</span>
              </div>
            )}

            {/* Type */}
            {session.session_type && (
              <Badge variant="secondary" className="text-[10px]">
                {session.session_type.name}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Занятия
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs defaultValue="upcoming" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mb-2" style={{ width: 'calc(100% - 32px)' }}>
            <TabsTrigger value="upcoming" className="text-xs">
              Предстоящие ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="text-xs">
              Прошедшие ({past.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="flex-1 overflow-hidden m-0 px-4 pb-4">
            <ScrollArea className="h-full">
              {upcoming.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Нет предстоящих занятий
                </div>
              ) : (
                <div className="space-y-2 pr-2">
                  {upcoming.map((session) => renderSessionCard(session, false))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="past" className="flex-1 overflow-hidden m-0 px-4 pb-4">
            <ScrollArea className="h-full">
              {past.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Нет прошедших занятий
                </div>
              ) : (
                <div className="space-y-2 pr-2">
                  {past.map((session) => renderSessionCard(session, true))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
