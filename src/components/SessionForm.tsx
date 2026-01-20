import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationHolidays } from "@/hooks/useOrganizationHolidays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Save, AlertTriangle, Send } from "lucide-react";
import { HolidayApprovalRequestDialog } from "./HolidayApprovalRequestDialog";
interface SessionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: {
    id: string;
    child_id: string;
    session_type_id: string;
    session_status_id: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    topic: string | null;
    notes: string | null;
  } | null;
  defaultDate?: string;
  defaultStartTime?: string;
  onSessionCancelled?: (session: {
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
  }) => void;
}

export function SessionForm({
  open,
  onOpenChange,
  session,
  defaultDate,
  defaultStartTime,
  onSessionCancelled,
}: SessionFormProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isHoliday, getHolidayInfo } = useOrganizationHolidays();

  const [formData, setFormData] = useState({
    child_id: "",
    session_type_id: "",
    session_status_id: "",
    scheduled_date: "",
    start_time: "",
    end_time: "",
    topic: "",
    notes: "",
  });

  const organizationId = profile?.organization_id;

  // Load children for this organization (include birth_date for age calculation)
  const { data: children = [] } = useQuery({
    queryKey: ["children-active", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("children")
        .select("id, full_name, birth_date")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Load session duration settings by age
  const { data: durationSettings = [] } = useQuery({
    queryKey: ["session-duration-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_duration_settings")
        .select("*")
        .order("age_from");
      if (error) throw error;
      return data;
    },
  });

  // Calculate child age from birth_date
  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Get recommended duration based on child age
  const getRecommendedDuration = (childId: string): number => {
    const child = children.find((c) => c.id === childId);
    if (!child?.birth_date) return 30; // Default 30 minutes
    
    const age = calculateAge(child.birth_date);
    if (age === null) return 30;
    
    const setting = durationSettings.find(
      (s) => age >= s.age_from && age <= s.age_to
    );
    return setting?.session_duration_minutes || 30;
  };

  // Load session types
  const { data: sessionTypes = [] } = useQuery({
    queryKey: ["session-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_types")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Load session statuses
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

  // Initialize form with session data or defaults
  useEffect(() => {
    if (session) {
      setFormData({
        child_id: session.child_id,
        session_type_id: session.session_type_id,
        session_status_id: session.session_status_id,
        scheduled_date: session.scheduled_date,
        start_time: session.start_time,
        end_time: session.end_time,
        topic: session.topic || "",
        notes: session.notes || "",
      });
    } else {
      // Set defaults for new session
      const plannedStatus = sessionStatuses.find(
        (s) => s.name.toLowerCase().includes("заплан")
      );
      const individualType = sessionTypes.find(
        (t) => t.name.toLowerCase().includes("индив")
      );

      setFormData({
        child_id: "",
        session_type_id: individualType?.id || sessionTypes[0]?.id || "",
        session_status_id: plannedStatus?.id || sessionStatuses[0]?.id || "",
        scheduled_date: defaultDate || new Date().toISOString().split("T")[0],
        start_time: defaultStartTime || "09:00",
        end_time: defaultStartTime
          ? addMinutesToTime(defaultStartTime, 30)
          : "09:30",
        topic: "",
        notes: "",
      });
    }
  }, [session, sessionTypes, sessionStatuses, defaultDate, defaultStartTime]);

  // Track previous status to detect cancellation
  const [previousStatusId, setPreviousStatusId] = useState<string | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  useEffect(() => {
    if (session) {
      setPreviousStatusId(session.session_status_id);
    }
  }, [session]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const sessionData = {
        child_id: data.child_id,
        specialist_id: user?.id,
        session_type_id: data.session_type_id,
        session_status_id: data.session_status_id,
        scheduled_date: data.scheduled_date,
        start_time: data.start_time,
        end_time: data.end_time,
        topic: data.topic || null,
        notes: data.notes || null,
        organization_id: organizationId,
        created_by: user?.id,
      };

      if (data.id) {
        const { error } = await supabase
          .from("sessions")
          .update(sessionData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sessions").insert(sessionData);
        if (error) throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onOpenChange(false);
      toast({
        title: "Успешно",
        description: session ? "Занятие обновлено" : "Занятие создано",
      });

      // Check if session was cancelled (status changed to cancelled)
      if (session && previousStatusId && data.session_status_id !== previousStatusId) {
        const cancelledStatus = sessionStatuses.find(
          (s) => s.name.toLowerCase().includes("отмен")
        );
        if (cancelledStatus && data.session_status_id === cancelledStatus.id) {
          // Find child name
          const childName = children.find((c) => c.id === data.child_id)?.full_name || "";
          
          onSessionCancelled?.({
            id: session.id,
            child_id: data.child_id,
            child_name: childName,
            scheduled_date: data.scheduled_date,
            start_time: data.start_time,
            end_time: data.end_time,
            session_type_id: data.session_type_id,
            specialist_id: user?.id || "",
            organization_id: organizationId || null,
            topic: data.topic || null,
            notes: data.notes || null,
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if selected date is a holiday
  const selectedDate = formData.scheduled_date ? new Date(formData.scheduled_date) : null;
  const holidayInfo = selectedDate ? getHolidayInfo(selectedDate) : undefined;
  const isSelectedDateHoliday = selectedDate ? isHoliday(selectedDate) : false;

  const handleSave = () => {
    if (!formData.child_id) {
      toast({
        title: "Ошибка",
        description: "Выберите ребёнка",
        variant: "destructive",
      });
      return;
    }
    if (!formData.scheduled_date || !formData.start_time || !formData.end_time) {
      toast({
        title: "Ошибка",
        description: "Заполните дату и время занятия",
        variant: "destructive",
      });
      return;
    }
    // Block saving on holidays without confirmation
    if (isSelectedDateHoliday) {
      toast({
        title: "Нерабочий день",
        description: `${holidayInfo?.name || "Выбранная дата"} — нерабочий день. Для планирования занятия в этот день требуется согласование с администрацией организации.`,
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate({ ...formData, id: session?.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {session ? "Редактирование занятия" : "Новое занятие"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Ребёнок *</Label>
            <Select
              value={formData.child_id}
              onValueChange={(v) => {
                const recommendedDuration = getRecommendedDuration(v);
                const newEndTime = addMinutesToTime(formData.start_time, recommendedDuration);
                setFormData({ ...formData, child_id: v, end_time: newEndTime });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите ребёнка" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => {
                  const age = calculateAge(child.birth_date);
                  return (
                    <SelectItem key={child.id} value={child.id}>
                      {child.full_name}
                      {age !== null && (
                        <span className="text-muted-foreground ml-2">
                          ({age} {age === 1 ? "год" : age >= 2 && age <= 4 ? "года" : "лет"})
                        </span>
                      )}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {formData.child_id && (() => {
              const child = children.find((c) => c.id === formData.child_id);
              const age = child?.birth_date ? calculateAge(child.birth_date) : null;
              const setting = age !== null ? durationSettings.find((s) => age >= s.age_from && age <= s.age_to) : null;
              if (setting) {
                return (
                  <p className="text-xs text-muted-foreground">
                    Рекомендуемая длительность: {setting.session_duration_minutes} мин ({setting.age_label})
                  </p>
                );
              }
              return null;
            })()}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Тип занятия</Label>
              <Select
                value={formData.session_type_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, session_type_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  {sessionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Статус</Label>
              <Select
                value={formData.session_status_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, session_status_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  {sessionStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        {status.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                        )}
                        {status.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Дата занятия *</Label>
            <Input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_date: e.target.value })
              }
            />
            {isSelectedDateHoliday && holidayInfo && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex flex-col gap-2">
                  <span>
                    <span className="font-medium">{holidayInfo.name}</span> — нерабочий день.
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-fit"
                    onClick={() => setShowApprovalDialog(true)}
                    disabled={!formData.child_id}
                  >
                    <Send className="h-3 w-3 mr-2" />
                    Запросить разрешение
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Начало *
              </Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Окончание *
              </Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
              />
            </div>
          </div>

          {/* Duration warning */}
          {formData.child_id && formData.start_time && formData.end_time && (() => {
            const child = children.find((c) => c.id === formData.child_id);
            const age = child?.birth_date ? calculateAge(child.birth_date) : null;
            const setting = age !== null ? durationSettings.find((s) => age >= s.age_from && age <= s.age_to) : null;
            
            if (setting) {
              const [startH, startM] = formData.start_time.split(":").map(Number);
              const [endH, endM] = formData.end_time.split(":").map(Number);
              const actualDuration = (endH * 60 + endM) - (startH * 60 + startM);
              
              if (actualDuration > setting.session_duration_minutes) {
                const exceededBy = actualDuration - setting.session_duration_minutes;
                return (
                  <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      Длительность занятия ({actualDuration} мин) превышает рекомендуемую для возрастной категории "{setting.age_label}" на {exceededBy} мин.
                      Рекомендуемая длительность: {setting.session_duration_minutes} мин.
                    </AlertDescription>
                  </Alert>
                );
              }
            }
            return null;
          })()}

          <div className="grid gap-2">
            <Label>Тема занятия</Label>
            <Input
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Развитие мелкой моторики..."
            />
          </div>

          <div className="grid gap-2">
            <Label>Примечания</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Дополнительная информация..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <HolidayApprovalRequestDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        sessionData={
          formData.child_id
            ? {
                child_id: formData.child_id,
                child_name: children.find((c) => c.id === formData.child_id)?.full_name || "",
                session_type_id: formData.session_type_id,
                scheduled_date: formData.scheduled_date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                topic: formData.topic,
                notes: formData.notes,
              }
            : null
        }
        holidayInfo={holidayInfo ? { id: holidayInfo.id, name: holidayInfo.name } : null}
        onSuccess={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
}