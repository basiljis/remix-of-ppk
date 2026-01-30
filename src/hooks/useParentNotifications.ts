import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ParentNotification {
  id: string;
  type: "upcoming_session" | "consultation_booked" | "session_cancelled";
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
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Count urgent notifications (today or tomorrow)
  const urgentCount = notifications.filter(n => {
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
