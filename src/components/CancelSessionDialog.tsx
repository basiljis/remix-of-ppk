import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Session {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  topic?: string | null;
  session_type?: { name: string } | null;
  specialist?: { full_name: string } | null;
  child?: { full_name: string } | null;
}

interface CancelSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
  onSuccess?: () => void;
}

const cancellationReasons = [
  { value: "illness", label: "Болезнь ребёнка" },
  { value: "family_circumstances", label: "Семейные обстоятельства" },
  { value: "schedule_conflict", label: "Конфликт расписания" },
  { value: "transport", label: "Проблемы с транспортом" },
  { value: "other", label: "Другая причина" },
];

export function CancelSessionDialog({ 
  open, 
  onOpenChange, 
  session,
  onSuccess 
}: CancelSessionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const cancelMutation = useMutation({
    mutationFn: async () => {
      // Get the cancelled status ID
      const { data: statusData } = await supabase
        .from("session_statuses")
        .select("id")
        .ilike("name", "%отменен%")
        .limit(1)
        .single();

      if (!statusData) {
        throw new Error("Статус отмены не найден");
      }

      const cancellationReasonText = reason === "other" 
        ? customReason 
        : cancellationReasons.find(r => r.value === reason)?.label || reason;

      const { error } = await supabase
        .from("sessions")
        .update({
          session_status_id: statusData.id,
          cancelled_by_parent: true,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellationReasonText,
        })
        .eq("id", session.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["parent-calendar-sessions"] });
      toast({
        title: "Занятие отменено",
        description: "Специалист получит уведомление об отмене",
      });
      onOpenChange(false);
      setReason("");
      setCustomReason("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка отмены",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCancel = () => {
    if (!reason) {
      toast({
        title: "Укажите причину",
        description: "Выберите причину отмены занятия",
        variant: "destructive",
      });
      return;
    }

    if (reason === "other" && !customReason.trim()) {
      toast({
        title: "Укажите причину",
        description: "Опишите причину отмены",
        variant: "destructive",
      });
      return;
    }

    cancelMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Отмена занятия
          </DialogTitle>
          <DialogDescription>
            Вы собираетесь отменить занятие. Специалист получит уведомление.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Session info */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <p className="font-medium">
              {format(new Date(session.scheduled_date), "d MMMM yyyy", { locale: ru })}
              {" "}в {session.start_time?.slice(0, 5)}
            </p>
            {session.child && (
              <p className="text-sm text-muted-foreground">
                Ребёнок: {session.child.full_name}
              </p>
            )}
            {session.specialist && (
              <p className="text-sm text-muted-foreground">
                Специалист: {session.specialist.full_name}
              </p>
            )}
          </div>

          <Alert variant="destructive" className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              Частые отмены могут влиять на расписание и результаты занятий.
            </AlertDescription>
          </Alert>

          {/* Reason selection */}
          <div className="space-y-3">
            <Label>Причина отмены *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {cancellationReasons.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Custom reason */}
          {reason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Опишите причину</Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Укажите причину отмены..."
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Назад
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Отменить занятие
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
