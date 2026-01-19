import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface SessionData {
  child_id: string;
  child_name: string;
  session_type_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  topic: string;
  notes: string;
}

interface HolidayApprovalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionData: SessionData | null;
  holidayInfo: { id?: string; name: string } | null;
  onSuccess?: () => void;
}

export function HolidayApprovalRequestDialog({
  open,
  onOpenChange,
  sessionData,
  holidayInfo,
  onSuccess,
}: HolidayApprovalRequestDialogProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const organizationId = profile?.organization_id;

  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !sessionData) {
        throw new Error("Недостаточно данных для создания запроса");
      }

      const { error } = await supabase.from("holiday_session_requests").insert({
        organization_id: organizationId,
        holiday_id: holidayInfo?.id || null,
        requested_by: user?.id,
        requested_date: sessionData.scheduled_date,
        session_data: {
          child_id: sessionData.child_id,
          child_name: sessionData.child_name,
          session_type_id: sessionData.session_type_id,
          start_time: sessionData.start_time,
          end_time: sessionData.end_time,
          topic: sessionData.topic,
          notes: sessionData.notes,
          reason: reason,
        },
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holiday-session-requests"] });
      onOpenChange(false);
      setReason("");
      toast({
        title: "Запрос отправлен",
        description: "Администратор организации получит уведомление о вашем запросе",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!sessionData) return null;

  const formattedDate = format(new Date(sessionData.scheduled_date), "d MMMM yyyy", { locale: ru });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Запрос на занятие в нерабочий день
          </DialogTitle>
          <DialogDescription>
            Для планирования занятия в нерабочий день требуется согласование администратора организации.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
            <div className="font-medium text-amber-800 dark:text-amber-200">
              {holidayInfo?.name || "Нерабочий день"}
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300">
              Дата: {formattedDate}
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300">
              Ребёнок: {sessionData.child_name}
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300">
              Время: {sessionData.start_time} – {sessionData.end_time}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Причина запроса (обязательно)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Укажите причину, по которой необходимо провести занятие в этот день..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={() => requestMutation.mutate()}
            disabled={requestMutation.isPending || !reason.trim()}
          >
            {requestMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Отправить запрос
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
