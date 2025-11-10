import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  type: "draft_protocol" | "pending_request";
  title: string;
  description: string;
  created_at: string;
  link?: string;
}

export function useNotifications() {
  const { data: draftProtocols = [] } = useQuery({
    queryKey: ["draft-protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocols")
        .select("id, child_name, created_at, sequence_number")
        .eq("status", "draft")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["pending-access-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_requests")
        .select("id, full_name, created_at, requested_at")
        .eq("status", "pending")
        .order("requested_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const notifications: Notification[] = [
    ...draftProtocols.map((protocol) => ({
      id: protocol.id,
      type: "draft_protocol" as const,
      title: "Черновик протокола",
      description: `Протокол №${protocol.sequence_number} (${protocol.child_name}) не заполнен`,
      created_at: protocol.created_at,
      link: "protocol",
    })),
    ...pendingRequests.map((request) => ({
      id: request.id,
      type: "pending_request" as const,
      title: "Новая заявка",
      description: `Заявка от ${request.full_name} ожидает рассмотрения`,
      created_at: request.requested_at,
      link: "administration-access-requests",
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    notifications,
    count: notifications.length,
  };
}
