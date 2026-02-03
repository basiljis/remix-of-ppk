import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, format } from "date-fns";
import { ru } from "date-fns/locale";

export interface ParentNotification {
  id: string;
  type: "upcoming_session" | "consultation_booked" | "session_cancelled" | "test_reminder" | "test_due_today" | "test_overdue";
  title: string;
  description: string;
  date: string;
  link?: string;
}

export function useParentNotifications() {
  // Fetch upcoming consultation slots booked for parent's children
  const { data: consultationSlots = [] } = useQuery({
    queryKey: ["parent-consultation-slots"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get parent's children IDs
      const { data: children } = await supabase
        .from("parent_children")
        .select("id, full_name")
        .eq("parent_user_id", user.id);

      if (!children || children.length === 0) return [];

      const childIds = children.map(c => c.id);
      const childMap = new Map(children.map(c => [c.id, c.full_name]));

      // Get upcoming booked consultation slots
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
          organizations!consultation_slots_organization_id_fkey (name)
        `)
        .in("booked_for_child_id", childIds)
        .eq("is_booked", true)
        .gte("slot_date", today)
        .order("slot_date", { ascending: true })
        .limit(10);

      if (error) {
        console.error("Error fetching consultation slots:", error);
        return [];
      }

      return (slots || []).map(slot => ({
        id: slot.id,
        childName: childMap.get(slot.booked_for_child_id) || "Ребёнок",
        date: slot.slot_date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        organizationName: (slot.organizations as any)?.name || "Организация",
        notes: slot.booking_notes,
      }));
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch sessions for linked children
  const { data: linkedSessions = [] } = useQuery({
    queryKey: ["parent-linked-sessions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get parent's children
      const { data: children } = await supabase
        .from("parent_children")
        .select("id, full_name")
        .eq("parent_user_id", user.id);

      if (!children || children.length === 0) return [];

      const childIds = children.map(c => c.id);
      const childMap = new Map(children.map(c => [c.id, c.full_name]));

      // Get linked children
      const { data: linkedChildren } = await supabase
        .from("linked_parent_children")
        .select("parent_child_id, organization_id")
        .in("parent_child_id", childIds);

      if (!linkedChildren || linkedChildren.length === 0) return [];

      // For now, return empty - sessions are linked by organization's children table
      // This can be extended when there's a direct link between parent_children and children
      return [];
    },
    refetchInterval: 60000,
  });

  // Fetch development test reminders (next_test_date)
  const { data: testReminders = [] } = useQuery({
    queryKey: ["parent-test-reminders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get parent's children
      const { data: children } = await supabase
        .from("parent_children")
        .select("id, full_name")
        .eq("parent_user_id", user.id);

      if (!children || children.length === 0) return [];

      const childIds = children.map(c => c.id);
      const childMap = new Map(children.map(c => [c.id, c.full_name]));

      // Get latest development test results with next_test_date
      const { data: testResults, error } = await supabase
        .from("development_test_results" as any)
        .select("id, child_id, next_test_date, completed_at")
        .eq("parent_user_id", user.id)
        .eq("is_completed", true)
        .in("child_id", childIds)
        .not("next_test_date", "is", null)
        .order("completed_at", { ascending: false }) as { data: any[] | null; error: any };

      if (error) {
        console.error("Error fetching test reminders:", error);
        return [];
      }

      // Get only the latest result per child
      const latestByChild = new Map<string, any>();
      (testResults || []).forEach(result => {
        if (!latestByChild.has(result.child_id)) {
          latestByChild.set(result.child_id, result);
        }
      });

      const reminders: Array<{
        id: string;
        childName: string;
        nextTestDate: string;
        daysUntil: number;
        isOverdue: boolean;
        isDueToday: boolean;
        isDueSoon: boolean;
      }> = [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      latestByChild.forEach((result, childId) => {
        const nextDate = new Date(result.next_test_date);
        nextDate.setHours(0, 0, 0, 0);
        
        const daysUntil = differenceInDays(nextDate, today);
        const isOverdue = daysUntil < 0;
        const isDueToday = daysUntil === 0;
        const isDueSoon = daysUntil > 0 && daysUntil <= 3;

        // Only add reminder if due within 3 days, today, or overdue
        if (isOverdue || isDueToday || isDueSoon) {
          reminders.push({
            id: result.id,
            childName: childMap.get(childId) || "Ребёнок",
            nextTestDate: result.next_test_date,
            daysUntil,
            isOverdue,
            isDueToday,
            isDueSoon,
          });
        }
      });

      return reminders;
    },
    refetchInterval: 60000,
  });

  // Build notifications from data
  const notifications: ParentNotification[] = [
    ...consultationSlots.map((slot: any) => {
      const slotDate = new Date(slot.date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const isToday = slotDate.toDateString() === today.toDateString();
      const isTomorrow = slotDate.toDateString() === tomorrow.toDateString();
      
      let dateLabel = "";
      if (isToday) {
        dateLabel = "сегодня";
      } else if (isTomorrow) {
        dateLabel = "завтра";
      } else {
        dateLabel = new Date(slot.date).toLocaleDateString("ru-RU", { 
          day: "numeric", 
          month: "long" 
        });
      }

      return {
        id: slot.id,
        type: "upcoming_session" as const,
        title: isToday ? "Занятие сегодня!" : isTomorrow ? "Занятие завтра" : "Предстоящее занятие",
        description: `${slot.childName} — ${dateLabel} в ${slot.startTime?.slice(0, 5)} (${slot.organizationName})`,
        date: slot.date,
        link: "calendar",
      };
    }),
    // Test reminders
    ...testReminders.map((reminder: any) => {
      let title = "";
      let type: ParentNotification["type"] = "test_reminder";
      
      if (reminder.isOverdue) {
        title = "Тест просрочен!";
        type = "test_overdue";
      } else if (reminder.isDueToday) {
        title = "Тест сегодня!";
        type = "test_due_today";
      } else {
        title = `Тест через ${reminder.daysUntil} дн.`;
        type = "test_reminder";
      }

      const formattedDate = format(new Date(reminder.nextTestDate), "d MMMM", { locale: ru });
      
      return {
        id: `test-${reminder.id}`,
        type,
        title,
        description: `${reminder.childName} — повторный тест развития ${reminder.isDueToday ? "сегодня" : reminder.isOverdue ? "просрочен" : formattedDate}`,
        date: reminder.nextTestDate,
        link: "tests",
      };
    }),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Count urgent notifications (today or tomorrow, or test reminders)
  const urgentCount = notifications.filter(n => {
    // Test reminders are always urgent if they appear
    if (n.type === "test_overdue" || n.type === "test_due_today" || n.type === "test_reminder") {
      return true;
    }
    
    const notifDate = new Date(n.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return notifDate.toDateString() === today.toDateString() || 
           notifDate.toDateString() === tomorrow.toDateString();
  }).length;

  return {
    notifications,
    count: notifications.length,
    urgentCount,
  };
}
