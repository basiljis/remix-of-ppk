import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, CalendarPlus, AlertCircle, Check } from "lucide-react";
import { format, addDays, parseISO, isBefore, startOfDay, isWeekend } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RescheduleSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancelledSession: {
    id: string;
    child_id: string;
    child_name: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    session_type_id: string;
    specialist_id: string;
    organization_id: string | null;
    topic: string | null;
    notes: string | null;
  } | null;
  onComplete?: () => void;
}

interface SuggestedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  reason: string;
}

export function RescheduleSessionDialog({
  open,
  onOpenChange,
  cancelledSession,
  onComplete,
}: RescheduleSessionDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectionMode, setSelectionMode] = useState<"suggested" | "manual">("suggested");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [manualDate, setManualDate] = useState("");
  const [manualStartTime, setManualStartTime] = useState("09:00");
  const [manualEndTime, setManualEndTime] = useState("09:30");

  // Load existing sessions for the specialist to find free slots
  const { data: existingSessions = [] } = useQuery({
    queryKey: ["specialist-sessions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const today = format(new Date(), "yyyy-MM-dd");
      const twoWeeksLater = format(addDays(new Date(), 14), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("sessions")
        .select("scheduled_date, start_time, end_time")
        .eq("specialist_id", user.id)
        .gte("scheduled_date", today)
        .lte("scheduled_date", twoWeeksLater)
        .order("scheduled_date")
        .order("start_time");
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open,
  });

  // Load session statuses to get "planned" status
  const { data: sessionStatuses = [] } = useQuery({
    queryKey: ["session-statuses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_statuses")
        .select("id, name, color")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Generate suggested slots
  const suggestedSlots = useMemo((): SuggestedSlot[] => {
    if (!cancelledSession) return [];

    const slots: SuggestedSlot[] = [];
    const today = startOfDay(new Date());
    const originalTime = cancelledSession.start_time;
    const originalEndTime = cancelledSession.end_time;

    // Get list of busy times
    const busySlots = existingSessions.map((s) => ({
      date: s.scheduled_date,
      start: s.start_time,
      end: s.end_time,
    }));

    const isSlotFree = (date: Date, startTime: string) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return !busySlots.some(
        (slot) =>
          slot.date === dateStr &&
          slot.start <= startTime &&
          slot.end > startTime
      );
    };

    // Strategy 1: Same time, next available weekday
    for (let i = 1; i <= 14; i++) {
      const candidateDate = addDays(today, i);
      if (!isWeekend(candidateDate) && isSlotFree(candidateDate, originalTime)) {
        slots.push({
          date: candidateDate,
          startTime: originalTime,
          endTime: originalEndTime,
          reason: "То же время, ближайший будний день",
        });
        break;
      }
    }

    // Strategy 2: Same day of week, next week
    if (cancelledSession.scheduled_date) {
      const originalDayOfWeek = parseISO(cancelledSession.scheduled_date).getDay();
      for (let i = 1; i <= 14; i++) {
        const candidateDate = addDays(today, i);
        if (
          candidateDate.getDay() === originalDayOfWeek &&
          isSlotFree(candidateDate, originalTime)
        ) {
          slots.push({
            date: candidateDate,
            startTime: originalTime,
            endTime: originalEndTime,
            reason: "Тот же день недели",
          });
          break;
        }
      }
    }

    // Strategy 3: Alternative times in the next 7 days
    const alternativeTimes = ["10:00", "11:00", "14:00", "15:00", "16:00"];
    for (let i = 1; i <= 7; i++) {
      const candidateDate = addDays(today, i);
      if (isWeekend(candidateDate)) continue;

      for (const time of alternativeTimes) {
        if (time === originalTime) continue;
        if (isSlotFree(candidateDate, time)) {
          const [h, m] = time.split(":").map(Number);
          const endMins = h * 60 + m + 30;
          const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
          
          slots.push({
            date: candidateDate,
            startTime: time,
            endTime: endTime,
            reason: "Альтернативное время",
          });

          if (slots.length >= 5) break;
        }
      }
      if (slots.length >= 5) break;
    }

    // Remove duplicates by date+time
    const unique = slots.filter(
      (slot, index, self) =>
        index ===
        self.findIndex(
          (s) =>
            format(s.date, "yyyy-MM-dd") === format(slot.date, "yyyy-MM-dd") &&
            s.startTime === slot.startTime
        )
    );

    return unique.slice(0, 5);
  }, [cancelledSession, existingSessions]);

  const createRescheduledSession = useMutation({
    mutationFn: async (sessionData: {
      scheduled_date: string;
      start_time: string;
      end_time: string;
    }) => {
      if (!cancelledSession) throw new Error("No session to reschedule");

      const plannedStatus = sessionStatuses.find((s) =>
        s.name.toLowerCase().includes("заплан")
      );

      const { error } = await supabase.from("sessions").insert({
        child_id: cancelledSession.child_id,
        specialist_id: cancelledSession.specialist_id,
        session_type_id: cancelledSession.session_type_id,
        session_status_id: plannedStatus?.id || sessionStatuses[0]?.id,
        scheduled_date: sessionData.scheduled_date,
        start_time: sessionData.start_time,
        end_time: sessionData.end_time,
        topic: cancelledSession.topic,
        notes: cancelledSession.notes
          ? `${cancelledSession.notes}\n[Возмещение занятия от ${cancelledSession.scheduled_date}]`
          : `[Возмещение занятия от ${cancelledSession.scheduled_date}]`,
        organization_id: cancelledSession.organization_id,
        created_by: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onOpenChange(false);
      toast({
        title: "Успешно",
        description: "Занятие-возмещение запланировано",
      });
      onComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    if (selectionMode === "suggested" && selectedSlot !== null) {
      const slot = suggestedSlots[selectedSlot];
      createRescheduledSession.mutate({
        scheduled_date: format(slot.date, "yyyy-MM-dd"),
        start_time: slot.startTime,
        end_time: slot.endTime,
      });
    } else if (selectionMode === "manual" && manualDate) {
      createRescheduledSession.mutate({
        scheduled_date: manualDate,
        start_time: manualStartTime,
        end_time: manualEndTime,
      });
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    toast({
      title: "Пропущено",
      description: "Вы можете запланировать возмещение позже",
    });
    onComplete?.();
  };

  if (!cancelledSession) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Возмещение занятия
          </DialogTitle>
          <DialogDescription className="flex items-start gap-2 pt-2">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <span>
              Занятие с {cancelledSession.child_name} от{" "}
              {format(parseISO(cancelledSession.scheduled_date), "d MMMM", {
                locale: ru,
              })}{" "}
              было отменено. Хотите запланировать возмещение?
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selection mode */}
          <RadioGroup
            value={selectionMode}
            onValueChange={(v) => setSelectionMode(v as "suggested" | "manual")}
            className="gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="suggested" id="suggested" />
              <Label htmlFor="suggested" className="cursor-pointer">
                Выбрать из предложенных слотов
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual" className="cursor-pointer">
                Указать дату вручную
              </Label>
            </div>
          </RadioGroup>

          {/* Suggested slots */}
          {selectionMode === "suggested" && (
            <div className="space-y-2">
              {suggestedSlots.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Не найдено свободных слотов на ближайшие 2 недели.
                  <br />
                  Выберите дату вручную.
                </div>
              ) : (
                suggestedSlots.map((slot, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedSlot(index)}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                      selectedSlot === index
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {format(slot.date, "d MMMM, EEEE", { locale: ru })}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {slot.startTime} – {slot.endTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {slot.reason}
                      </Badge>
                      {selectedSlot === index && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Manual date selection */}
          {selectionMode === "manual" && (
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label>Дата</Label>
                <Input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Начало
                  </Label>
                  <Input
                    type="time"
                    value={manualStartTime}
                    onChange={(e) => {
                      setManualStartTime(e.target.value);
                      // Auto-set end time
                      const [h, m] = e.target.value.split(":").map(Number);
                      const endMins = h * 60 + m + 30;
                      setManualEndTime(
                        `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(
                          endMins % 60
                        ).padStart(2, "0")}`
                      );
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Окончание
                  </Label>
                  <Input
                    type="time"
                    value={manualEndTime}
                    onChange={(e) => setManualEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleSkip} className="sm:mr-auto">
            Пропустить
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              createRescheduledSession.isPending ||
              (selectionMode === "suggested" && selectedSlot === null) ||
              (selectionMode === "manual" && !manualDate)
            }
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            {createRescheduledSession.isPending
              ? "Создание..."
              : "Запланировать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
