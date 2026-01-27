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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { Calendar, Clock, Save, AlertTriangle, Users, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GroupSessionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: {
    id: string;
    session_type_id: string;
    session_status_id: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    topic: string | null;
    notes: string | null;
    is_group?: boolean;
  } | null;
  defaultDate?: string;
  defaultStartTime?: string;
}

export function GroupSessionForm({
  open,
  onOpenChange,
  session,
  defaultDate,
  defaultStartTime,
}: GroupSessionFormProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isHoliday, getHolidayInfo } = useOrganizationHolidays();

  const [formData, setFormData] = useState({
    session_type_id: "",
    session_status_id: "",
    scheduled_date: "",
    start_time: "",
    end_time: "",
    topic: "",
    notes: "",
  });

  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const organizationId = profile?.organization_id;

  // Load children for this organization
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

  // Load existing session children if editing
  const { data: sessionChildren = [] } = useQuery({
    queryKey: ["session-children", session?.id],
    queryFn: async () => {
      if (!session?.id) return [];
      const { data, error } = await supabase
        .from("session_children")
        .select("child_id, attended")
        .eq("session_id", session.id);
      if (error) throw error;
      return data;
    },
    enabled: !!session?.id,
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

  // Initialize form with session data or defaults
  useEffect(() => {
    if (session) {
      setFormData({
        session_type_id: session.session_type_id,
        session_status_id: session.session_status_id,
        scheduled_date: session.scheduled_date,
        start_time: session.start_time,
        end_time: session.end_time,
        topic: session.topic || "",
        notes: session.notes || "",
      });
      // Set selected children from session_children
      if (sessionChildren.length > 0) {
        setSelectedChildIds(sessionChildren.map(sc => sc.child_id));
      }
    } else {
      // Set defaults for new session
      const plannedStatus = sessionStatuses.find(
        (s) => s.name.toLowerCase().includes("заплан")
      );
      const groupType = sessionTypes.find(
        (t) => t.name.toLowerCase().includes("групп")
      );

      setFormData({
        session_type_id: groupType?.id || sessionTypes[0]?.id || "",
        session_status_id: plannedStatus?.id || sessionStatuses[0]?.id || "",
        scheduled_date: defaultDate || new Date().toISOString().split("T")[0],
        start_time: defaultStartTime || "09:00",
        end_time: defaultStartTime
          ? addMinutesToTime(defaultStartTime, 45)
          : "09:45",
        topic: "",
        notes: "",
      });
      setSelectedChildIds([]);
    }
  }, [session, sessionTypes, sessionStatuses, defaultDate, defaultStartTime, sessionChildren]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      // First child from list - used for child_id in sessions table
      const primaryChildId = selectedChildIds[0];
      
      const sessionData = {
        child_id: primaryChildId,
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
        is_group: true,
      };

      let sessionId = data.id;

      if (data.id) {
        const { error } = await supabase
          .from("sessions")
          .update(sessionData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { data: newSession, error } = await supabase
          .from("sessions")
          .insert(sessionData)
          .select("id")
          .single();
        if (error) throw error;
        sessionId = newSession.id;
      }

      // Update session_children
      if (sessionId) {
        // Delete existing children for this session
        await supabase
          .from("session_children")
          .delete()
          .eq("session_id", sessionId);

        // Insert new children
        if (selectedChildIds.length > 0) {
          const childrenData = selectedChildIds.map(childId => ({
            session_id: sessionId,
            child_id: childId,
            attended: true,
          }));
          const { error: childrenError } = await supabase
            .from("session_children")
            .insert(childrenData);
          if (childrenError) throw childrenError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session-children"] });
      onOpenChange(false);
      toast({
        title: "Успешно",
        description: session ? "Групповое занятие обновлено" : "Групповое занятие создано",
      });
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
    if (selectedChildIds.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одного ребёнка",
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
    if (isSelectedDateHoliday) {
      toast({
        title: "Нерабочий день",
        description: `${holidayInfo?.name || "Выбранная дата"} — нерабочий день.`,
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate({ ...formData, id: session?.id });
  };

  const toggleChild = (childId: string) => {
    setSelectedChildIds(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const filteredChildren = children.filter(child =>
    child.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {session ? "Редактирование группового занятия" : "Новое групповое занятие"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 overflow-y-auto flex-1">
          {/* Children Selection */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Дети ({selectedChildIds.length} выбрано) *
            </Label>
            
            {selectedChildIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedChildIds.map(id => {
                  const child = children.find(c => c.id === id);
                  if (!child) return null;
                  return (
                    <Badge 
                      key={id} 
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {child.full_name}
                      <button
                        onClick={() => toggleChild(id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            <Input
              placeholder="Поиск по ФИО..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <ScrollArea className="h-40 border rounded-md p-2">
              {filteredChildren.map((child) => {
                const age = calculateAge(child.birth_date);
                const isSelected = selectedChildIds.includes(child.id);
                return (
                  <div
                    key={child.id}
                    className="flex items-center space-x-2 py-2 px-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => toggleChild(child.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleChild(child.id)}
                    />
                    <span className="flex-1">{child.full_name}</span>
                    {age !== null && (
                      <span className="text-muted-foreground text-sm">
                        {age} лет
                      </span>
                    )}
                  </div>
                );
              })}
              {filteredChildren.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Дети не найдены
                </p>
              )}
            </ScrollArea>
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
                <AlertDescription>
                  <span className="font-medium">{holidayInfo.name}</span> — нерабочий день.
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

          <div className="grid gap-2">
            <Label>Тема занятия</Label>
            <Input
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Групповая терапия..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="group-session-notes">Примечания</Label>
            <Textarea
              id="group-session-notes"
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
