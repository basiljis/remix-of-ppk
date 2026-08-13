import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LegalUpdate {
  id: string;
  created_at: string;
  version_label: string;
  title: string;
  description: string;
  changes: Array<{ type: "add" | "update" | "remove"; doc: string; text: string }>;
  is_major: boolean;
}

export function useLegalUpdates() {
  return useQuery({
    queryKey: ["legal-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_updates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LegalUpdate[];
    },
  });
}

export function useLegalSubscription() {
  const queryClient = useQueryClient();

  const subscribe = useMutation({
    mutationFn: async (email: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { data, error } = await supabase
        .from("legal_subscriptions")
        .upsert(
          { 
            email, 
            user_id: userId,
            is_active: true 
          },
          { onConflict: "email" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Вы успешно подписались на обновления нормативной базы");
      queryClient.invalidateQueries({ queryKey: ["legal-subscription-status"] });
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.info("Вы уже подписаны на обновления");
      } else {
        toast.error("Не удалось оформить подписку: " + error.message);
      }
    },
  });

  return { subscribe };
}
