import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Calendar, Clock } from "lucide-react";

interface ConsultationSlotFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  defaultStartTime?: string;
}

export function ConsultationSlotForm({
  open,
  onOpenChange,
  defaultDate,
  defaultStartTime,
}: ConsultationSlotFormProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    slot_date: "",
    start_time: "",
    end_time: "",
  });

  const organizationId = profile?.organization_id;

  useEffect(() => {
    if (open) {
      setFormData({
        slot_date: defaultDate || new Date().toISOString().split("T")[0],
        start_time: defaultStartTime || "09:00",
        end_time: defaultStartTime 
          ? addMinutesToTime(defaultStartTime, 30)
          : "09:30",
      });
    }
  }, [open, defaultDate, defaultStartTime]);

  const addMinutesToTime = (time: string, minutes: number): string => {
    const [h, m] = time.split(":").map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !user?.id) throw new Error("Не авторизован");

      const { error } = await supabase.from("consultation_slots" as any).insert({
        organization_id: organizationId,
        specialist_id: user.id,
        slot_date: formData.slot_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_booked: false,
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation-slots"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({
        title: "Слот создан",
        description: "Слот для консультации по записи успешно добавлен",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.slot_date || !formData.start_time || !formData.end_time) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Консультация по записи
          </DialogTitle>
          <DialogDescription>
            Создайте слот для записи родителей. Ребёнок не выбирается — родитель запишется сам.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Дата</Label>
            <Input
              type="date"
              value={formData.slot_date}
              onChange={(e) => setFormData({ ...formData, slot_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Начало
              </Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Окончание
              </Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать слот
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
