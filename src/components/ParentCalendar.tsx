import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CalendarDays, Clock, MapPin, User, Info } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

interface ParentCalendarProps {
  parentUserId: string;
  childIds: string[];
}

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

export function ParentCalendar({ parentUserId, childIds }: ParentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch sessions for parent's children via linked_parent_children
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["parent-children-sessions", childIds],
    queryFn: async () => {
      if (childIds.length === 0) return [];

      // First get linked children in organizations
      const { data: linkedChildren, error: linkedError } = await supabase
        .from("linked_parent_children" as any)
        .select("parent_child_id, organization_id")
        .in("parent_child_id", childIds);

      if (linkedError) throw linkedError;
      if (!linkedChildren || linkedChildren.length === 0) return [];

      // Get organization children that match parent children names
      const { data: parentChildrenData } = await supabase
        .from("parent_children" as any)
        .select("id, full_name")
        .in("id", childIds);

      const childNames = (parentChildrenData as any[])?.map(c => c.full_name.toLowerCase()) || [];
      const orgIds = [...new Set((linkedChildren as any[]).map(l => l.organization_id))];

      // Fetch organization children by name matching
      const { data: orgChildren } = await supabase
        .from("children")
        .select("id, full_name, organization_id")
        .in("organization_id", orgIds);

      const matchedOrgChildIds = (orgChildren || [])
        .filter(oc => childNames.includes(oc.full_name.toLowerCase()))
        .map(oc => oc.id);

      if (matchedOrgChildIds.length === 0) return [];

      // Fetch sessions for these children
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
        .gte("scheduled_date", new Date().toISOString().split("T")[0])
        .order("scheduled_date", { ascending: true });

      if (sessionsError) throw sessionsError;
      return (sessionsData as any[]) || [];
    },
    enabled: childIds.length > 0,
  });

  // Get sessions for selected date
  const selectedDateSessions = sessions.filter(s => 
    isSameDay(parseISO(s.scheduled_date), selectedDate)
  );

  // Get dates with sessions for calendar highlighting
  const datesWithSessions = sessions.map(s => parseISO(s.scheduled_date));

  const getStatusColor = (color: string | null) => {
    if (!color) return "bg-gray-100 text-gray-800";
    return "";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Занятия детей
        </CardTitle>
        <CardDescription>
          Здесь отображаются занятия, которые добавили организации или специалисты для ваших детей.
          Вы можете отслеживать расписание и не пропустить важные встречи.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ru}
                modifiers={{
                  hasSession: datesWithSessions,
                }}
                modifiersClassNames={{
                  hasSession: "bg-pink-100 dark:bg-pink-900/30 font-medium",
                }}
                className="rounded-md border"
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">
                {format(selectedDate, "d MMMM yyyy", { locale: ru })}
              </h3>

              {selectedDateSessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Нет занятий на эту дату
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateSessions.map((session) => (
                    <Card key={session.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                            </span>
                          </div>
                          {session.session_status && (
                            <Badge 
                              style={session.session_status.color ? { backgroundColor: session.session_status.color, color: 'white' } : undefined}
                              variant={session.session_status.color ? "default" : "secondary"}
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
                            <MapPin className="h-3 w-3 mt-0.5" />
                            <span>
                              {session.organization.name}
                              {session.organization.address && ` • ${session.organization.address}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
