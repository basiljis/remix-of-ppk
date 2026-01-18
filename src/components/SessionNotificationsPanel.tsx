import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function SessionNotificationsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [daysAhead, setDaysAhead] = useState("1");
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const targetDate = format(addDays(new Date(), parseInt(daysAhead)), "yyyy-MM-dd");

  // Fetch sessions for notification
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions-for-notifications", targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          topic,
          children(id, full_name, parent_email, parent_name),
          profiles!sessions_specialist_id_fkey(id, full_name),
          session_types(name),
          session_statuses(name),
          organizations(id, name, short_name)
        `)
        .eq("scheduled_date", targetDate)
        .order("start_time");
      if (error) throw error;
      return data;
    },
  });

  // Filter sessions that have parent email
  const notifiableSessions = sessions?.filter(
    (s) => (s.children as any)?.parent_email
  ) || [];

  const sendNotifications = async () => {
    if (selectedSessions.length === 0) {
      toast({
        title: "Выберите занятия",
        description: "Отметьте хотя бы одно занятие для отправки уведомлений",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const reminders = selectedSessions.map((sessionId) => {
        const session = notifiableSessions.find((s) => s.id === sessionId);
        if (!session) return null;

        return {
          sessionId: session.id,
          childName: (session.children as any)?.full_name || "",
          parentEmail: (session.children as any)?.parent_email || "",
          parentName: (session.children as any)?.parent_name || "",
          specialistName: (session.profiles as any)?.full_name || "",
          scheduledDate: session.scheduled_date,
          startTime: session.start_time,
          endTime: session.end_time,
          sessionType: (session.session_types as any)?.name || "",
          topic: session.topic || "",
          organizationName: (session.organizations as any)?.short_name || 
                           (session.organizations as any)?.name || "",
        };
      }).filter(Boolean);

      const { error } = await supabase.functions.invoke("send-session-reminder", {
        body: { reminders },
      });

      if (error) throw error;

      toast({
        title: "Уведомления отправлены",
        description: `Успешно отправлено ${reminders.length} уведомлений`,
      });

      setSelectedSessions([]);
      queryClient.invalidateQueries({ queryKey: ["sessions-for-notifications"] });
    } catch (error: any) {
      console.error("Error sending notifications:", error);
      toast({
        title: "Ошибка отправки",
        description: error.message || "Не удалось отправить уведомления",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleSession = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const toggleAll = () => {
    if (selectedSessions.length === notifiableSessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(notifiableSessions.map((s) => s.id));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Уведомления о занятиях
          </CardTitle>
          <CardDescription>
            Отправка email-уведомлений родителям о предстоящих занятиях их детей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 mb-6">
            <div className="space-y-2">
              <Label>Занятия через</Label>
              <Select value={daysAhead} onValueChange={setDaysAhead}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 день</SelectItem>
                  <SelectItem value="2">2 дня</SelectItem>
                  <SelectItem value="3">3 дня</SelectItem>
                  <SelectItem value="7">7 дней</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Дата: <strong>{format(parseISO(targetDate), "d MMMM yyyy", { locale: ru })}</strong>
              </p>
            </div>
            <Button
              onClick={sendNotifications}
              disabled={isSending || selectedSessions.length === 0}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSending ? "Отправка..." : `Отправить (${selectedSessions.length})`}
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Загрузка занятий...</div>
          ) : notifiableSessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSessions.length === notifiableSessions.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Ребёнок</TableHead>
                  <TableHead>Родитель</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Специалист</TableHead>
                  <TableHead>Тип</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifiableSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSessions.includes(session.id)}
                        onCheckedChange={() => toggleSession(session.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {(session.children as any)?.full_name}
                    </TableCell>
                    <TableCell>
                      {(session.children as any)?.parent_name || "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{(session.children as any)?.parent_email}</span>
                    </TableCell>
                    <TableCell>{(session.profiles as any)?.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{(session.session_types as any)?.name}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : sessions && sessions.length > 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>На выбранную дату есть {sessions.length} занятий,</p>
              <p>но ни у одного ребёнка не указан email родителя</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>На выбранную дату нет запланированных занятий</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Автоматические уведомления</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Функция в разработке</p>
                <p className="text-sm text-muted-foreground">
                  Автоматическая отправка уведомлений за 1 день до занятия будет доступна в ближайшем обновлении.
                  Пока уведомления можно отправлять вручную с этой страницы.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
