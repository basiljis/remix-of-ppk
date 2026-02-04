import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Calendar, Clock, Video, MapPin, AlertTriangle } from "lucide-react";

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
  const { user, profile, roles } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    slot_date: "",
    start_time: "",
    end_time: "",
    slot_format: "offline" as "online" | "offline" | "both",
  });

  const organizationId = profile?.organization_id;

  // Check if user is independent specialist (not tied to organization)
  const isIndependentSpecialist = !organizationId;

  // Query organization settings for allow_parent_registration
  const { data: organization } = useQuery({
    queryKey: ["organization-settings", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("allow_parent_registration")
        .eq("id", organizationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Allow booking slots if: independent specialist OR organization allows parent registration
  const canCreateBookingSlot = isIndependentSpecialist || organization?.allow_parent_registration === true;

  useEffect(() => {
    if (open) {
      setFormData({
        slot_date: defaultDate || new Date().toISOString().split("T")[0],
        start_time: defaultStartTime || "09:00",
        end_time: defaultStartTime 
          ? addMinutesToTime(defaultStartTime, 30)
          : "09:30",
        slot_format: "offline",
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
      if (!user?.id) throw new Error("Не авторизован");

      // For independent specialists, organization_id might be null
      // We need to handle this case
      const slotData: any = {
        specialist_id: user.id,
        slot_date: formData.slot_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        slot_format: formData.slot_format,
        is_booked: false,
      };

      // Only add organization_id if user belongs to one
      if (organizationId) {
        slotData.organization_id = organizationId;
      }

      const { error } = await supabase.from("consultation_slots").insert(slotData);

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

  // Show warning if organization doesn't allow parent registration
  if (!canCreateBookingSlot) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Запись недоступна
            </DialogTitle>
          </DialogHeader>
          <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Ваша организация отключила возможность записи через личный кабинет родителя.
              Для включения этой функции обратитесь к администратору организации.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Понятно
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

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

          {/* Format selection */}
          <div className="space-y-3">
            <Label>Формат консультации</Label>
            <RadioGroup
              value={formData.slot_format}
              onValueChange={(value) => setFormData({ ...formData, slot_format: value as "online" | "offline" | "both" })}
              className="grid gap-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="offline" id="format-offline" />
                <Label htmlFor="format-offline" className="flex-1 cursor-pointer flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Очно</div>
                    <div className="text-xs text-muted-foreground">Консультация в учреждении</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="online" id="format-online" />
                <Label htmlFor="format-online" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Онлайн</div>
                    <div className="text-xs text-muted-foreground">Видеоконсультация</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="both" id="format-both" />
                <Label htmlFor="format-both" className="flex-1 cursor-pointer flex items-center gap-2">
                  <div className="flex gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Очно или онлайн</div>
                    <div className="text-xs text-muted-foreground">Родитель выберет формат при записи</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
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
