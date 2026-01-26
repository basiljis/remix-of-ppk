import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Save, Users, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface SessionAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionDate: string;
  sessionTime: string;
  isGroupSession?: boolean;
}

interface AttendanceRecord {
  child_id: string;
  attended: boolean;
  child_name?: string;
}

export function SessionAttendanceDialog({
  open,
  onOpenChange,
  sessionId,
  sessionDate,
  sessionTime,
  isGroupSession = false,
}: SessionAttendanceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Load session children with their attendance
  const { data: sessionChildren = [], isLoading } = useQuery({
    queryKey: ["session-children-attendance", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from("session_children")
        .select(`
          child_id,
          attended,
          children (
            full_name,
            birth_date
          )
        `)
        .eq("session_id", sessionId);
      
      if (error) throw error;
      return data.map(sc => ({
        child_id: sc.child_id,
        attended: sc.attended,
        child_name: sc.children?.full_name || "Неизвестно",
        birth_date: sc.children?.birth_date
      }));
    },
    enabled: !!sessionId && open,
  });

  // If not a group session, fetch the single child from sessions table
  const { data: singleSessionChild } = useQuery({
    queryKey: ["session-single-child", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          child_id,
          children (
            full_name,
            birth_date
          )
        `)
        .eq("id", sessionId)
        .single();
      
      if (error) throw error;
      return {
        child_id: data.child_id,
        attended: true,
        child_name: data.children?.full_name || "Неизвестно",
      };
    },
    enabled: !!sessionId && open && !isGroupSession,
  });

  // Initialize attendance records
  useEffect(() => {
    if (isGroupSession && sessionChildren.length > 0) {
      setAttendanceRecords(sessionChildren.map(sc => ({
        child_id: sc.child_id,
        attended: sc.attended,
        child_name: sc.child_name,
      })));
    } else if (!isGroupSession && singleSessionChild) {
      // For individual sessions, check if there's a record in session_children
      const existingRecord = sessionChildren.find(sc => sc.child_id === singleSessionChild.child_id);
      setAttendanceRecords([{
        child_id: singleSessionChild.child_id,
        attended: existingRecord?.attended ?? true,
        child_name: singleSessionChild.child_name,
      }]);
    }
  }, [sessionChildren, singleSessionChild, isGroupSession]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Upsert attendance records
      for (const record of attendanceRecords) {
        const { data: existing } = await supabase
          .from("session_children")
          .select("id")
          .eq("session_id", sessionId)
          .eq("child_id", record.child_id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("session_children")
            .update({ attended: record.attended })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("session_children")
            .insert({
              session_id: sessionId,
              child_id: record.child_id,
              attended: record.attended,
            });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-children"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onOpenChange(false);
      toast({
        title: "Успешно",
        description: "Посещаемость сохранена",
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

  const toggleAttendance = (childId: string) => {
    setAttendanceRecords(prev =>
      prev.map(record =>
        record.child_id === childId
          ? { ...record, attended: !record.attended }
          : record
      )
    );
  };

  const presentCount = attendanceRecords.filter(r => r.attended).length;
  const absentCount = attendanceRecords.filter(r => !r.attended).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Отметка посещаемости
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(sessionDate), "d MMMM yyyy", { locale: ru })}, {sessionTime}
          </p>
        </DialogHeader>

        <div className="py-4">
          <div className="flex gap-4 mb-4">
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Присутствует: {presentCount}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Отсутствует: {absentCount}
            </Badge>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">Загрузка...</p>
          ) : attendanceRecords.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Нет данных о детях для этого занятия
            </p>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {attendanceRecords.map((record) => (
                  <div
                    key={record.child_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleAttendance(record.child_id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={record.attended}
                        onCheckedChange={() => toggleAttendance(record.child_id)}
                      />
                      <span className="font-medium">{record.child_name}</span>
                    </div>
                    <Badge
                      variant={record.attended ? "default" : "secondary"}
                      className={record.attended ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {record.attended ? "Присутствовал" : "Отсутствовал"}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
