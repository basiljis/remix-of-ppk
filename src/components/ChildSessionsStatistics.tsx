import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CalendarCheck, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Timer,
  Target
} from "lucide-react";

interface SessionType {
  id: string;
  name: string;
}

interface SessionStatus {
  id: string;
  name: string;
  color?: string;
}

interface Specialist {
  id: string;
  full_name: string;
}

interface Session {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  actual_duration_minutes?: number;
  session_types: SessionType;
  session_statuses: SessionStatus;
  profiles?: Specialist;
  topic?: string;
}

interface SessionChildRecord {
  attended: boolean;
  session: Session;
}

interface ChildSessionsStatisticsProps {
  sessions: SessionChildRecord[];
  loading?: boolean;
}

export function ChildSessionsStatistics({ sessions, loading }: ChildSessionsStatisticsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Статистика занятий
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Статистика занятий
          </CardTitle>
          <CardDescription>
            Данные из журнала занятий
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Занятия с этим ребёнком ещё не запланированы
          </p>
        </CardContent>
      </Card>
    );
  }

  // Общая статистика
  const totalSessions = sessions.length;
  const attendedSessions = sessions.filter(s => s.attended).length;
  const missedSessions = totalSessions - attendedSessions;
  const attendanceRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

  // Статистика по типам занятий
  const typeStats: Record<string, { total: number; attended: number; name: string }> = {};
  sessions.forEach(({ session, attended }) => {
    const typeName = session.session_types?.name || "Не указан";
    const typeId = session.session_types?.id || "unknown";
    if (!typeStats[typeId]) {
      typeStats[typeId] = { total: 0, attended: 0, name: typeName };
    }
    typeStats[typeId].total += 1;
    if (attended) typeStats[typeId].attended += 1;
  });

  // Статистика по статусам занятий  
  const statusStats: Record<string, { count: number; name: string; color?: string }> = {};
  sessions.forEach(({ session }) => {
    const statusName = session.session_statuses?.name || "Не указан";
    const statusId = session.session_statuses?.id || "unknown";
    if (!statusStats[statusId]) {
      statusStats[statusId] = { 
        count: 0, 
        name: statusName, 
        color: session.session_statuses?.color 
      };
    }
    statusStats[statusId].count += 1;
  });

  // Статистика по специалистам
  const specialistStats: Record<string, { total: number; attended: number; name: string }> = {};
  sessions.forEach(({ session, attended }) => {
    const specialistName = session.profiles?.full_name || "Не указан";
    const specialistId = session.profiles?.id || "unknown";
    if (!specialistStats[specialistId]) {
      specialistStats[specialistId] = { total: 0, attended: 0, name: specialistName };
    }
    specialistStats[specialistId].total += 1;
    if (attended) specialistStats[specialistId].attended += 1;
  });

  // Общее время занятий
  const totalMinutes = sessions.reduce((sum, { session, attended }) => {
    if (!attended) return sum;
    if (session.actual_duration_minutes) {
      return sum + session.actual_duration_minutes;
    }
    // Вычисляем из времени начала и окончания
    const start = session.start_time?.split(":").map(Number);
    const end = session.end_time?.split(":").map(Number);
    if (start && end && start.length >= 2 && end.length >= 2) {
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      return sum + (endMinutes - startMinutes);
    }
    return sum;
  }, 0);

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // Периоды занятий
  const sortedDates = sessions
    .map(s => new Date(s.session.scheduled_date))
    .sort((a, b) => a.getTime() - b.getTime());
  
  const firstSession = sortedDates[0];
  const lastSession = sortedDates[sortedDates.length - 1];

  // Среднее количество занятий в неделю
  const weeksDiff = firstSession && lastSession 
    ? Math.max(1, Math.ceil((lastSession.getTime() - firstSession.getTime()) / (7 * 24 * 60 * 60 * 1000)))
    : 1;
  const avgSessionsPerWeek = (totalSessions / weeksDiff).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5" />
          Статистика занятий
        </CardTitle>
        <CardDescription>
          Данные из журнала занятий
          {firstSession && lastSession && (
            <span className="ml-2">
              ({firstSession.toLocaleDateString("ru-RU")} — {lastSession.toLocaleDateString("ru-RU")})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Общие показатели */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{totalSessions}</p>
            <p className="text-xs text-muted-foreground">Всего занятий</p>
          </div>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{attendedSessions}</p>
            <p className="text-xs text-muted-foreground">Посещено</p>
          </div>
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-center">
            <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{missedSessions}</p>
            <p className="text-xs text-muted-foreground">Пропущено</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
            <Timer className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {totalHours > 0 ? `${totalHours}ч` : ""}{remainingMinutes > 0 ? `${remainingMinutes}м` : totalHours === 0 ? "0" : ""}
            </p>
            <p className="text-xs text-muted-foreground">Общее время</p>
          </div>
        </div>

        {/* Посещаемость */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Посещаемость
            </span>
            <span className="font-medium">{attendanceRate}%</span>
          </div>
          <Progress value={attendanceRate} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            В среднем {avgSessionsPerWeek} занятий в неделю
          </p>
        </div>

        {/* Статистика по типам занятий */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            По типам занятий
          </h4>
          <div className="space-y-2">
            {Object.entries(typeStats).map(([typeId, stats]) => (
              <div key={typeId} className="flex items-center justify-between p-2 rounded bg-muted/30">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stats.name}</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {stats.attended}/{stats.total}
                  </span>
                  <span className="font-medium w-12 text-right">
                    {Math.round((stats.attended / stats.total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Статистика по статусам */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            По статусам
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusStats).map(([statusId, stats]) => (
              <Badge 
                key={statusId}
                variant="secondary"
                className="px-3 py-1"
                style={stats.color ? { 
                  backgroundColor: `${stats.color}20`,
                  borderColor: stats.color,
                  color: stats.color
                } : undefined}
              >
                {stats.name}: {stats.count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Статистика по специалистам */}
        {Object.keys(specialistStats).length > 0 && Object.keys(specialistStats)[0] !== "unknown" && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              По специалистам
            </h4>
            <div className="space-y-2">
              {Object.entries(specialistStats)
                .filter(([id]) => id !== "unknown")
                .map(([specialistId, stats]) => (
                  <div key={specialistId} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-sm">{stats.name}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {stats.attended} из {stats.total} занятий
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
