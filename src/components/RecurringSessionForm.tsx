import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationHolidays } from "@/hooks/useOrganizationHolidays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Calendar, Clock, Save, Plus, Trash2, CalendarDays, RepeatIcon, AlertTriangle, CalendarOff, Users, User } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RecurringSessionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId?: string;
}

interface WeeklySlot {
  id: string;
  dayOfWeek: number; // 0 = Monday, 6 = Sunday
  startTime: string;
  endTime: string;
}

const WEEKDAYS = [
  { value: 0, label: "Понедельник", short: "Пн" },
  { value: 1, label: "Вторник", short: "Вт" },
  { value: 2, label: "Среда", short: "Ср" },
  { value: 3, label: "Четверг", short: "Чт" },
  { value: 4, label: "Пятница", short: "Пт" },
  { value: 5, label: "Суббота", short: "Сб" },
  { value: 6, label: "Воскресенье", short: "Вс" },
];

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
}

export function RecurringSessionForm({
  open,
  onOpenChange,
  childId,
}: RecurringSessionFormProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isHoliday, getHolidayInfo } = useOrganizationHolidays();

  const [formData, setFormData] = useState({
    child_id: childId || "",
    session_type_id: "",
    topic: "",
    notes: "",
  });

  // For group sessions - multiple children selection
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(childId ? [childId] : []);
  const [childSearchQuery, setChildSearchQuery] = useState("");

  const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>([]);
  const [totalSessions, setTotalSessions] = useState(10);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const organizationId = profile?.organization_id;

  // Load children for this organization
  const { data: children = [] } = useQuery({
    queryKey: ["children-active", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("children")
        .select("id, full_name")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

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

  // Check if selected session type is "Group"
  const isGroupSession = useMemo(() => {
    const selectedType = sessionTypes.find((t) => t.id === formData.session_type_id);
    return selectedType?.name.toLowerCase().includes("групп");
  }, [formData.session_type_id, sessionTypes]);

  // Filtered children for search
  const filteredChildren = useMemo(() => {
    if (!childSearchQuery) return children;
    const query = childSearchQuery.toLowerCase();
    return children.filter((child) => 
      child.full_name.toLowerCase().includes(query)
    );
  }, [children, childSearchQuery]);

  // Toggle child selection for group sessions
  const toggleChildSelection = (childId: string) => {
    setSelectedChildIds((prev) => {
      if (prev.includes(childId)) {
        return prev.filter((id) => id !== childId);
      }
      return [...prev, childId];
    });
  };

  // Set defaults when types load
  useEffect(() => {
    if (sessionTypes.length > 0 && !formData.session_type_id) {
      const individualType = sessionTypes.find((t) =>
        t.name.toLowerCase().includes("индив")
      );
      setFormData((prev) => ({
        ...prev,
        session_type_id: individualType?.id || sessionTypes[0]?.id || "",
      }));
    }
  }, [sessionTypes, formData.session_type_id]);

  useEffect(() => {
    if (childId) {
      setFormData((prev) => ({ ...prev, child_id: childId }));
      setSelectedChildIds([childId]);
    }
  }, [childId]);

  // Reset child selection when switching between individual and group
  useEffect(() => {
    if (!isGroupSession) {
      // When switching to individual, keep only first selected child
      if (selectedChildIds.length > 1) {
        setSelectedChildIds([selectedChildIds[0]]);
        setFormData((prev) => ({ ...prev, child_id: selectedChildIds[0] }));
      }
    }
  }, [isGroupSession]);

  // Calculate number of weeks needed
  const weeksNeeded = useMemo(() => {
    if (weeklySlots.length === 0) return 0;
    return Math.ceil(totalSessions / weeklySlots.length);
  }, [totalSessions, weeklySlots.length]);

  // Generate preview of scheduled sessions (excluding holidays)
  const { scheduledSessions, holidayConflicts } = useMemo(() => {
    if (weeklySlots.length === 0) return { scheduledSessions: [], holidayConflicts: [] };

    const sessions: Array<{ date: Date; slot: WeeklySlot }> = [];
    const conflicts: Array<{ date: Date; holidayName: string }> = [];
    const start = new Date(startDate);
    const weekStart = startOfWeek(start, { weekStartsOn: 1 });

    let weekOffset = 0;
    let sessionCount = 0;

    while (sessionCount < totalSessions) {
      const currentWeekStart = addWeeks(weekStart, weekOffset);

      // Sort slots by day of week
      const sortedSlots = [...weeklySlots].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      for (const slot of sortedSlots) {
        if (sessionCount >= totalSessions) break;

        const sessionDate = addDays(currentWeekStart, slot.dayOfWeek);

        // Skip if session date is before start date
        if (sessionDate < start) continue;

        // Check if date is a holiday
        if (isHoliday(sessionDate)) {
          const holidayInfo = getHolidayInfo(sessionDate);
          conflicts.push({ 
            date: sessionDate, 
            holidayName: holidayInfo?.name || "Нерабочий день" 
          });
          continue; // Skip this date, don't count as a session
        }

        sessions.push({ date: sessionDate, slot });
        sessionCount++;
      }

      weekOffset++;
      if (weekOffset > 104) break; // Safety limit - 2 years
    }

    return { scheduledSessions: sessions, holidayConflicts: conflicts };
  }, [weeklySlots, totalSessions, startDate, isHoliday, getHolidayInfo]);

  const addWeeklySlot = () => {
    const newSlot: WeeklySlot = {
      id: crypto.randomUUID(),
      dayOfWeek: 0,
      startTime: "09:00",
      endTime: "09:30",
    };
    setWeeklySlots([...weeklySlots, newSlot]);
  };

  const updateSlot = (id: string, updates: Partial<WeeklySlot>) => {
    setWeeklySlots((slots) =>
      slots.map((slot) => {
        if (slot.id === id) {
          const updated = { ...slot, ...updates };
          // Auto-update end time if start time changed
          if (updates.startTime && !updates.endTime) {
            updated.endTime = addMinutesToTime(updates.startTime, 30);
          }
          return updated;
        }
        return slot;
      })
    );
  };

  const removeSlot = (id: string) => {
    setWeeklySlots((slots) => slots.filter((slot) => slot.id !== id));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const plannedStatus = sessionStatuses.find((s) =>
        s.name.toLowerCase().includes("заплан")
      );

      // Determine which children to use
      const childIdsToUse = isGroupSession ? selectedChildIds : [formData.child_id];
      const primaryChildId = childIdsToUse[0];

      // Create sessions
      const sessionsToCreate = scheduledSessions.map(({ date, slot }) => ({
        child_id: primaryChildId,
        specialist_id: user?.id,
        session_type_id: formData.session_type_id,
        session_status_id: plannedStatus?.id || sessionStatuses[0]?.id,
        scheduled_date: format(date, "yyyy-MM-dd"),
        start_time: slot.startTime,
        end_time: slot.endTime,
        topic: formData.topic || null,
        notes: formData.notes || null,
        organization_id: organizationId,
        created_by: user?.id,
        is_group: isGroupSession,
      }));

      const { data: insertedSessions, error } = await supabase
        .from("sessions")
        .insert(sessionsToCreate)
        .select("id");
      
      if (error) throw error;

      // If group session, add all children to session_children
      if (isGroupSession && insertedSessions && childIdsToUse.length > 0) {
        const sessionChildrenRecords = insertedSessions.flatMap((session) =>
          childIdsToUse.map((cid) => ({
            session_id: session.id,
            child_id: cid,
            attended: true,
          }))
        );

        const { error: scError } = await supabase
          .from("session_children")
          .insert(sessionChildrenRecords);
        
        if (scError) throw scError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onOpenChange(false);
      toast({
        title: "Успешно",
        description: `Создано ${scheduledSessions.length} занятий${isGroupSession ? ` для ${selectedChildIds.length} детей` : ''}`,
      });
      // Reset form
      setWeeklySlots([]);
      setTotalSessions(10);
      setSelectedChildIds([]);
      setChildSearchQuery("");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (isGroupSession) {
      if (selectedChildIds.length === 0) {
        toast({
          title: "Ошибка",
          description: "Выберите хотя бы одного ребёнка",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.child_id) {
        toast({
          title: "Ошибка",
          description: "Выберите ребёнка",
          variant: "destructive",
        });
        return;
      }
    }
    if (weeklySlots.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы один слот в неделю",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RepeatIcon className="h-5 w-5" />
            Серия занятий
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Session type - moved before child selector */}
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
                    <span className="flex items-center gap-2">
                      {type.name.toLowerCase().includes("групп") ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      {type.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Child selector - different UI based on session type */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              {isGroupSession ? (
                <>
                  <Users className="h-4 w-4" />
                  Дети ({selectedChildIds.length} выбрано) *
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Ребёнок *
                </>
              )}
            </Label>
            
            {isGroupSession ? (
              /* Multiple children selection for group sessions */
              <div className="space-y-2">
                <Input
                  placeholder="Поиск по имени..."
                  value={childSearchQuery}
                  onChange={(e) => setChildSearchQuery(e.target.value)}
                />
                <ScrollArea className="h-[150px] border rounded-lg p-2">
                  {filteredChildren.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      Дети не найдены
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredChildren.map((child) => (
                        <div
                          key={child.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                            selectedChildIds.includes(child.id)
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted"
                          )}
                          onClick={() => toggleChildSelection(child.id)}
                        >
                          <Checkbox
                            checked={selectedChildIds.includes(child.id)}
                            onCheckedChange={() => toggleChildSelection(child.id)}
                          />
                          <span className="text-sm">{child.full_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {selectedChildIds.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedChildIds.map((cid) => {
                      const child = children.find((c) => c.id === cid);
                      return child ? (
                        <Badge key={cid} variant="secondary" className="text-xs">
                          {child.full_name}
                          <button
                            type="button"
                            className="ml-1 hover:text-destructive"
                            onClick={() => toggleChildSelection(cid)}
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Single child selection for individual sessions */
              <Select
                value={formData.child_id}
                onValueChange={(v) => setFormData({ ...formData, child_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите ребёнка" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Start date */}
          <div className="grid gap-2">
            <Label>Дата начала серии</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Weekly slots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Расписание на неделю ({weeklySlots.length} занятий/нед)
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addWeeklySlot}>
                <Plus className="h-4 w-4 mr-1" />
                Добавить слот
              </Button>
            </div>

            {weeklySlots.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                Добавьте слоты занятий на неделю
              </div>
            ) : (
              <div className="space-y-2">
                {weeklySlots.map((slot, index) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
                  >
                    <Badge variant="outline" className="shrink-0">
                      {index + 1}
                    </Badge>
                    <Select
                      value={String(slot.dayOfWeek)}
                      onValueChange={(v) =>
                        updateSlot(slot.id, { dayOfWeek: parseInt(v) })
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((day) => (
                          <SelectItem key={day.value} value={String(day.value)}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateSlot(slot.id, { startTime: e.target.value })
                        }
                        className="w-[110px]"
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateSlot(slot.id, { endTime: e.target.value })
                        }
                        className="w-[110px]"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSlot(slot.id)}
                      className="text-destructive hover:text-destructive"
                      aria-label="Удалить слот"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total sessions */}
          <div className="grid gap-2">
            <Label>Общее количество занятий</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={1}
                max={100}
                value={totalSessions}
                onChange={(e) => setTotalSessions(parseInt(e.target.value) || 1)}
                className="w-[100px]"
              />
              {weeklySlots.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ≈ {weeksNeeded} недель
                </span>
              )}
            </div>
          </div>

          {/* Topic */}
          <div className="grid gap-2">
            <Label>Тема занятий</Label>
            <Input
              value={formData.topic}
              onChange={(e) =>
                setFormData({ ...formData, topic: e.target.value })
              }
              placeholder="Развитие мелкой моторики..."
            />
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="recurring-session-notes">Примечания</Label>
            <Textarea
              id="recurring-session-notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Дополнительная информация..."
              rows={2}
            />
          </div>

          {/* Holiday conflicts warning */}
          {holidayConflicts.length > 0 && (
            <Alert variant="destructive">
              <CalendarOff className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{holidayConflicts.length} дат пропущено</span> (нерабочие дни):
                <span className="ml-1 text-sm">
                  {holidayConflicts.slice(0, 5).map((c, i) => (
                    <span key={i}>
                      {format(c.date, "d MMM", { locale: ru })} ({c.holidayName})
                      {i < Math.min(holidayConflicts.length - 1, 4) ? ", " : ""}
                    </span>
                  ))}
                  {holidayConflicts.length > 5 && ` и ещё ${holidayConflicts.length - 5}...`}
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {scheduledSessions.length > 0 && (
            <div className="space-y-2">
              <Label>Предпросмотр ({scheduledSessions.length} занятий)</Label>
              <div className="max-h-[150px] overflow-y-auto border rounded-lg p-2 bg-muted/20">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                  {scheduledSessions.slice(0, 20).map(({ date, slot }, i) => (
                    <div
                      key={i}
                      className="text-xs px-2 py-1 rounded bg-background border"
                    >
                      <span className="font-medium">
                        {format(date, "d MMM", { locale: ru })}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        {WEEKDAYS[slot.dayOfWeek].short}
                      </span>
                      <span className="text-muted-foreground block">
                        {slot.startTime}
                      </span>
                    </div>
                  ))}
                  {scheduledSessions.length > 20 && (
                    <div className="text-xs px-2 py-1 text-muted-foreground">
                      +{scheduledSessions.length - 20} ещё...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || scheduledSessions.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending
              ? "Создание..."
              : `Создать ${scheduledSessions.length} занятий`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
