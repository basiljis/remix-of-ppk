import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Clock, Users, Plus, Trash2, Tag, CheckCircle, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface SpecialistWorkloadSetting {
  id: string;
  position_id: string;
  max_hours_per_week: number;
  max_hours_per_day: number;
  max_hours_per_year: number;
  hours_per_rate: number;
  position?: { id: string; name: string };
}

interface SessionDurationSetting {
  id: string;
  age_from: number;
  age_to: number;
  age_label: string;
  session_duration_minutes: number;
  max_sessions_per_day: number;
  max_sessions_per_week: number;
}

interface SessionType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

interface SessionStatus {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  sort_order: number;
}

interface Position {
  id: string;
  name: string;
}

export function ScheduleSettingsPanel() {
  const queryClient = useQueryClient();
  const [editingWorkload, setEditingWorkload] = useState<SpecialistWorkloadSetting | null>(null);
  const [editingSession, setEditingSession] = useState<SessionDurationSetting | null>(null);
  const [editingType, setEditingType] = useState<SessionType | null>(null);
  const [editingStatus, setEditingStatus] = useState<SessionStatus | null>(null);
  const [showAddWorkloadDialog, setShowAddWorkloadDialog] = useState(false);
  const [showAddSessionDialog, setShowAddSessionDialog] = useState(false);
  const [showAddTypeDialog, setShowAddTypeDialog] = useState(false);
  const [showAddStatusDialog, setShowAddStatusDialog] = useState(false);
  const [newWorkload, setNewWorkload] = useState<Partial<SpecialistWorkloadSetting>>({
    max_hours_per_week: 36,
    max_hours_per_day: 8,
    max_hours_per_year: 1800,
    hours_per_rate: 36,
  });
  const [newSession, setNewSession] = useState<Partial<SessionDurationSetting>>({
    age_from: 0,
    age_to: 3,
    age_label: '',
    session_duration_minutes: 30,
    max_sessions_per_day: 2,
    max_sessions_per_week: 4,
  });
  const [newType, setNewType] = useState<Partial<SessionType>>({
    name: '',
    description: '',
    is_active: true,
    sort_order: 0,
  });
  const [newStatus, setNewStatus] = useState<Partial<SessionStatus>>({
    name: '',
    description: '',
    color: '#6b7280',
    is_active: true,
    sort_order: 0,
  });

  // Fetch positions
  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data as Position[];
    },
  });

  // Fetch workload settings
  const { data: workloadSettings = [], isLoading: loadingWorkload } = useQuery({
    queryKey: ['specialist-workload-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specialist_workload_settings')
        .select('*');
      if (error) throw error;
      return data as SpecialistWorkloadSetting[];
    },
  });

  // Fetch session duration settings
  const { data: sessionSettings = [], isLoading: loadingSession } = useQuery({
    queryKey: ['session-duration-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_duration_settings')
        .select('*')
        .order('age_from');
      if (error) throw error;
      return data as SessionDurationSetting[];
    },
  });

  // Fetch session types
  const { data: sessionTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['session-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_types')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as SessionType[];
    },
  });

  // Fetch session statuses
  const { data: sessionStatuses = [], isLoading: loadingStatuses } = useQuery({
    queryKey: ['session-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_statuses')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as SessionStatus[];
    },
  });

  // Mutations for workload settings
  const updateWorkloadMutation = useMutation({
    mutationFn: async (setting: SpecialistWorkloadSetting) => {
      const { error } = await supabase
        .from('specialist_workload_settings')
        .update({
          max_hours_per_week: setting.max_hours_per_week,
          max_hours_per_day: setting.max_hours_per_day,
          max_hours_per_year: setting.max_hours_per_year,
          hours_per_rate: setting.hours_per_rate,
        })
        .eq('id', setting.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialist-workload-settings'] });
      toast.success('Настройки нагрузки сохранены');
      setEditingWorkload(null);
    },
    onError: () => {
      toast.error('Ошибка сохранения настроек');
    },
  });

  const createWorkloadMutation = useMutation({
    mutationFn: async (setting: Partial<SpecialistWorkloadSetting>) => {
      const { error } = await supabase
        .from('specialist_workload_settings')
        .insert({
          position_id: setting.position_id,
          max_hours_per_week: setting.max_hours_per_week,
          max_hours_per_day: setting.max_hours_per_day,
          max_hours_per_year: setting.max_hours_per_year,
          hours_per_rate: setting.hours_per_rate,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialist-workload-settings'] });
      toast.success('Настройки нагрузки добавлены');
      setShowAddWorkloadDialog(false);
      setNewWorkload({
        max_hours_per_week: 36,
        max_hours_per_day: 8,
        max_hours_per_year: 1800,
        hours_per_rate: 36,
      });
    },
    onError: () => {
      toast.error('Ошибка добавления настроек');
    },
  });

  const deleteWorkloadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('specialist_workload_settings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialist-workload-settings'] });
      toast.success('Настройки удалены');
    },
    onError: () => {
      toast.error('Ошибка удаления настроек');
    },
  });

  // Mutations for session settings
  const updateSessionMutation = useMutation({
    mutationFn: async (setting: SessionDurationSetting) => {
      const { error } = await supabase
        .from('session_duration_settings')
        .update({
          age_from: setting.age_from,
          age_to: setting.age_to,
          age_label: setting.age_label,
          session_duration_minutes: setting.session_duration_minutes,
          max_sessions_per_day: setting.max_sessions_per_day,
          max_sessions_per_week: setting.max_sessions_per_week,
        })
        .eq('id', setting.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-duration-settings'] });
      toast.success('Настройки продолжительности сохранены');
      setEditingSession(null);
    },
    onError: () => {
      toast.error('Ошибка сохранения настроек');
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (setting: Partial<SessionDurationSetting>) => {
      const { error } = await supabase
        .from('session_duration_settings')
        .insert({
          age_from: setting.age_from,
          age_to: setting.age_to,
          age_label: setting.age_label,
          session_duration_minutes: setting.session_duration_minutes,
          max_sessions_per_day: setting.max_sessions_per_day,
          max_sessions_per_week: setting.max_sessions_per_week,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-duration-settings'] });
      toast.success('Настройки продолжительности добавлены');
      setShowAddSessionDialog(false);
      setNewSession({
        age_from: 0,
        age_to: 3,
        age_label: '',
        session_duration_minutes: 30,
        max_sessions_per_day: 2,
        max_sessions_per_week: 4,
      });
    },
    onError: () => {
      toast.error('Ошибка добавления настроек');
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('session_duration_settings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-duration-settings'] });
      toast.success('Настройки удалены');
    },
    onError: () => {
      toast.error('Ошибка удаления настроек');
    },
  });

  // Mutations for session types
  const updateTypeMutation = useMutation({
    mutationFn: async (type: SessionType) => {
      const { error } = await supabase
        .from('session_types')
        .update({
          name: type.name,
          description: type.description,
          is_active: type.is_active,
          sort_order: type.sort_order,
        })
        .eq('id', type.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-types'] });
      toast.success('Тип занятия сохранён');
      setEditingType(null);
    },
    onError: () => {
      toast.error('Ошибка сохранения');
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: async (type: Partial<SessionType>) => {
      const { error } = await supabase
        .from('session_types')
        .insert({
          name: type.name,
          description: type.description,
          is_active: type.is_active,
          sort_order: type.sort_order,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-types'] });
      toast.success('Тип занятия добавлен');
      setShowAddTypeDialog(false);
      setNewType({
        name: '',
        description: '',
        is_active: true,
        sort_order: 0,
      });
    },
    onError: () => {
      toast.error('Ошибка добавления');
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('session_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-types'] });
      toast.success('Тип занятия удалён');
    },
    onError: () => {
      toast.error('Ошибка удаления');
    },
  });

  // Mutations for session statuses
  const updateStatusMutation = useMutation({
    mutationFn: async (status: SessionStatus) => {
      const { error } = await supabase
        .from('session_statuses')
        .update({
          name: status.name,
          description: status.description,
          color: status.color,
          is_active: status.is_active,
          sort_order: status.sort_order,
        })
        .eq('id', status.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-statuses'] });
      toast.success('Статус занятия сохранён');
      setEditingStatus(null);
    },
    onError: () => {
      toast.error('Ошибка сохранения');
    },
  });

  const createStatusMutation = useMutation({
    mutationFn: async (status: Partial<SessionStatus>) => {
      const { error } = await supabase
        .from('session_statuses')
        .insert({
          name: status.name,
          description: status.description,
          color: status.color,
          is_active: status.is_active,
          sort_order: status.sort_order,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-statuses'] });
      toast.success('Статус занятия добавлен');
      setShowAddStatusDialog(false);
      setNewStatus({
        name: '',
        description: '',
        color: '#6b7280',
        is_active: true,
        sort_order: 0,
      });
    },
    onError: () => {
      toast.error('Ошибка добавления');
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('session_statuses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-statuses'] });
      toast.success('Статус занятия удалён');
    },
    onError: () => {
      toast.error('Ошибка удаления');
    },
  });

  const getPositionName = (positionId: string) => {
    return positions.find(p => p.id === positionId)?.name || 'Неизвестная должность';
  };

  const availablePositionsForWorkload = positions.filter(
    p => !workloadSettings.some(w => w.position_id === p.id)
  );

  if (loadingWorkload || loadingSession || loadingTypes || loadingStatuses) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Типы занятий</CardTitle>
                <CardDescription>
                  Настройка типов занятий (индивидуальное, групповое и др.)
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowAddTypeDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Порядок</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-[120px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Нет типов занятий. Добавьте первый тип.
                  </TableCell>
                </TableRow>
              ) : (
                sessionTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">
                      {editingType?.id === type.id ? (
                        <Input
                          value={editingType.name}
                          onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                          className="w-40"
                        />
                      ) : (
                        type.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingType?.id === type.id ? (
                        <Input
                          value={editingType.description || ''}
                          onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                          className="w-48"
                        />
                      ) : (
                        type.description || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingType?.id === type.id ? (
                        <Input
                          type="number"
                          value={editingType.sort_order}
                          onChange={(e) => setEditingType({ ...editingType, sort_order: Number(e.target.value) })}
                          className="w-16"
                        />
                      ) : (
                        type.sort_order
                      )}
                    </TableCell>
                    <TableCell>
                      {editingType?.id === type.id ? (
                        <Switch
                          checked={editingType.is_active}
                          onCheckedChange={(checked) => setEditingType({ ...editingType, is_active: checked })}
                        />
                      ) : (
                        <Badge variant={type.is_active ? "default" : "secondary"}>
                          {type.is_active ? 'Активен' : 'Неактивен'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingType?.id === type.id ? (
                          <Button
                            size="sm"
                            onClick={() => updateTypeMutation.mutate(editingType)}
                            disabled={updateTypeMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingType(type)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTypeMutation.mutate(type.id)}
                          disabled={deleteTypeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Session Statuses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Статусы занятий</CardTitle>
                <CardDescription>
                  Настройка статусов занятий (запланировано, проведено, отменено и др.)
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowAddStatusDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Цвет</TableHead>
                <TableHead>Порядок</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-[120px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionStatuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Нет статусов занятий. Добавьте первый статус.
                  </TableCell>
                </TableRow>
              ) : (
                sessionStatuses.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell className="font-medium">
                      {editingStatus?.id === status.id ? (
                        <Input
                          value={editingStatus.name}
                          onChange={(e) => setEditingStatus({ ...editingStatus, name: e.target.value })}
                          className="w-40"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingStatus?.id === status.id ? (
                        <Input
                          value={editingStatus.description || ''}
                          onChange={(e) => setEditingStatus({ ...editingStatus, description: e.target.value })}
                          className="w-48"
                        />
                      ) : (
                        status.description || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingStatus?.id === status.id ? (
                        <Input
                          type="color"
                          value={editingStatus.color}
                          onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
                          className="w-16 h-8 p-1"
                        />
                      ) : (
                        <div 
                          className="w-8 h-6 rounded border"
                          style={{ backgroundColor: status.color }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {editingStatus?.id === status.id ? (
                        <Input
                          type="number"
                          value={editingStatus.sort_order}
                          onChange={(e) => setEditingStatus({ ...editingStatus, sort_order: Number(e.target.value) })}
                          className="w-16"
                        />
                      ) : (
                        status.sort_order
                      )}
                    </TableCell>
                    <TableCell>
                      {editingStatus?.id === status.id ? (
                        <Switch
                          checked={editingStatus.is_active}
                          onCheckedChange={(checked) => setEditingStatus({ ...editingStatus, is_active: checked })}
                        />
                      ) : (
                        <Badge variant={status.is_active ? "default" : "secondary"}>
                          {status.is_active ? 'Активен' : 'Неактивен'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingStatus?.id === status.id ? (
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate(editingStatus)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingStatus(status)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteStatusMutation.mutate(status.id)}
                          disabled={deleteStatusMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Specialist Workload Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Нагрузка специалистов</CardTitle>
                <CardDescription>
                  Настройка максимальной нагрузки в зависимости от должности
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddWorkloadDialog(true)}
              disabled={availablePositionsForWorkload.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Должность</TableHead>
                <TableHead>Часов в день</TableHead>
                <TableHead>Часов в неделю</TableHead>
                <TableHead>Часов в год</TableHead>
                <TableHead>Часов на ставку</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workloadSettings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Нет настроек нагрузки. Добавьте настройки для должностей.
                  </TableCell>
                </TableRow>
              ) : (
                workloadSettings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">
                      {getPositionName(setting.position_id)}
                    </TableCell>
                    <TableCell>
                      {editingWorkload?.id === setting.id ? (
                        <Input
                          type="number"
                          value={editingWorkload.max_hours_per_day}
                          onChange={(e) => setEditingWorkload({
                            ...editingWorkload,
                            max_hours_per_day: Number(e.target.value)
                          })}
                          className="w-20"
                        />
                      ) : (
                        setting.max_hours_per_day
                      )}
                    </TableCell>
                    <TableCell>
                      {editingWorkload?.id === setting.id ? (
                        <Input
                          type="number"
                          value={editingWorkload.max_hours_per_week}
                          onChange={(e) => setEditingWorkload({
                            ...editingWorkload,
                            max_hours_per_week: Number(e.target.value)
                          })}
                          className="w-20"
                        />
                      ) : (
                        setting.max_hours_per_week
                      )}
                    </TableCell>
                    <TableCell>
                      {editingWorkload?.id === setting.id ? (
                        <Input
                          type="number"
                          value={editingWorkload.max_hours_per_year}
                          onChange={(e) => setEditingWorkload({
                            ...editingWorkload,
                            max_hours_per_year: Number(e.target.value)
                          })}
                          className="w-24"
                        />
                      ) : (
                        setting.max_hours_per_year
                      )}
                    </TableCell>
                    <TableCell>
                      {editingWorkload?.id === setting.id ? (
                        <Input
                          type="number"
                          value={editingWorkload.hours_per_rate}
                          onChange={(e) => setEditingWorkload({
                            ...editingWorkload,
                            hours_per_rate: Number(e.target.value)
                          })}
                          className="w-20"
                        />
                      ) : (
                        setting.hours_per_rate
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingWorkload?.id === setting.id ? (
                          <Button
                            size="sm"
                            onClick={() => updateWorkloadMutation.mutate(editingWorkload)}
                            disabled={updateWorkloadMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingWorkload(setting)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteWorkloadMutation.mutate(setting.id)}
                          disabled={deleteWorkloadMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Session Duration Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Продолжительность занятий</CardTitle>
                <CardDescription>
                  Настройка продолжительности и количества занятий в зависимости от возраста ребенка
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowAddSessionDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Возрастная группа</TableHead>
                <TableHead>Возраст (от-до)</TableHead>
                <TableHead>Длительность (мин)</TableHead>
                <TableHead>Занятий в день</TableHead>
                <TableHead>Занятий в неделю</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionSettings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Нет настроек продолжительности занятий.
                  </TableCell>
                </TableRow>
              ) : (
                sessionSettings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">
                      {editingSession?.id === setting.id ? (
                        <Input
                          value={editingSession.age_label}
                          onChange={(e) => setEditingSession({
                            ...editingSession,
                            age_label: e.target.value
                          })}
                          className="w-32"
                        />
                      ) : (
                        setting.age_label
                      )}
                    </TableCell>
                    <TableCell>
                      {editingSession?.id === setting.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={editingSession.age_from}
                            onChange={(e) => setEditingSession({
                              ...editingSession,
                              age_from: Number(e.target.value)
                            })}
                            className="w-16"
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            value={editingSession.age_to}
                            onChange={(e) => setEditingSession({
                              ...editingSession,
                              age_to: Number(e.target.value)
                            })}
                            className="w-16"
                          />
                        </div>
                      ) : (
                        `${setting.age_from} - ${setting.age_to} лет`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingSession?.id === setting.id ? (
                        <Input
                          type="number"
                          value={editingSession.session_duration_minutes}
                          onChange={(e) => setEditingSession({
                            ...editingSession,
                            session_duration_minutes: Number(e.target.value)
                          })}
                          className="w-20"
                        />
                      ) : (
                        setting.session_duration_minutes
                      )}
                    </TableCell>
                    <TableCell>
                      {editingSession?.id === setting.id ? (
                        <Input
                          type="number"
                          value={editingSession.max_sessions_per_day}
                          onChange={(e) => setEditingSession({
                            ...editingSession,
                            max_sessions_per_day: Number(e.target.value)
                          })}
                          className="w-16"
                        />
                      ) : (
                        setting.max_sessions_per_day
                      )}
                    </TableCell>
                    <TableCell>
                      {editingSession?.id === setting.id ? (
                        <Input
                          type="number"
                          value={editingSession.max_sessions_per_week}
                          onChange={(e) => setEditingSession({
                            ...editingSession,
                            max_sessions_per_week: Number(e.target.value)
                          })}
                          className="w-16"
                        />
                      ) : (
                        setting.max_sessions_per_week
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingSession?.id === setting.id ? (
                          <Button
                            size="sm"
                            onClick={() => updateSessionMutation.mutate(editingSession)}
                            disabled={updateSessionMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingSession(setting)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSessionMutation.mutate(setting.id)}
                          disabled={deleteSessionMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Type Dialog */}
      <Dialog open={showAddTypeDialog} onOpenChange={setShowAddTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить тип занятия</DialogTitle>
            <DialogDescription>
              Укажите название и описание нового типа занятия
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                placeholder="Например: Индивидуальное"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={newType.description || ''}
                onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                placeholder="Описание типа занятия"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Порядок сортировки</Label>
                <Input
                  type="number"
                  value={newType.sort_order}
                  onChange={(e) => setNewType({ ...newType, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Активен</Label>
                <div className="pt-2">
                  <Switch
                    checked={newType.is_active}
                    onCheckedChange={(checked) => setNewType({ ...newType, is_active: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTypeDialog(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => createTypeMutation.mutate(newType)}
              disabled={!newType.name || createTypeMutation.isPending}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Status Dialog */}
      <Dialog open={showAddStatusDialog} onOpenChange={setShowAddStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить статус занятия</DialogTitle>
            <DialogDescription>
              Укажите название, цвет и описание нового статуса
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={newStatus.name}
                onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                placeholder="Например: Запланировано"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={newStatus.description || ''}
                onChange={(e) => setNewStatus({ ...newStatus, description: e.target.value })}
                placeholder="Описание статуса"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Цвет</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={newStatus.color}
                    onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={newStatus.color}
                    onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                    placeholder="#6b7280"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Порядок сортировки</Label>
                <Input
                  type="number"
                  value={newStatus.sort_order}
                  onChange={(e) => setNewStatus({ ...newStatus, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Активен</Label>
              <div className="pt-2">
                <Switch
                  checked={newStatus.is_active}
                  onCheckedChange={(checked) => setNewStatus({ ...newStatus, is_active: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStatusDialog(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => createStatusMutation.mutate(newStatus)}
              disabled={!newStatus.name || createStatusMutation.isPending}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Workload Dialog */}
      <Dialog open={showAddWorkloadDialog} onOpenChange={setShowAddWorkloadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить настройки нагрузки</DialogTitle>
            <DialogDescription>
              Укажите параметры нагрузки для выбранной должности
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Должность</Label>
              <Select
                value={newWorkload.position_id}
                onValueChange={(value) => setNewWorkload({ ...newWorkload, position_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите должность" />
                </SelectTrigger>
                <SelectContent>
                  {availablePositionsForWorkload.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Часов в день</Label>
                <Input
                  type="number"
                  value={newWorkload.max_hours_per_day}
                  onChange={(e) => setNewWorkload({ ...newWorkload, max_hours_per_day: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Часов в неделю</Label>
                <Input
                  type="number"
                  value={newWorkload.max_hours_per_week}
                  onChange={(e) => setNewWorkload({ ...newWorkload, max_hours_per_week: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Часов в год</Label>
                <Input
                  type="number"
                  value={newWorkload.max_hours_per_year}
                  onChange={(e) => setNewWorkload({ ...newWorkload, max_hours_per_year: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Часов на ставку</Label>
                <Input
                  type="number"
                  value={newWorkload.hours_per_rate}
                  onChange={(e) => setNewWorkload({ ...newWorkload, hours_per_rate: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWorkloadDialog(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => createWorkloadMutation.mutate(newWorkload)}
              disabled={!newWorkload.position_id || createWorkloadMutation.isPending}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Session Dialog */}
      <Dialog open={showAddSessionDialog} onOpenChange={setShowAddSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить возрастную группу</DialogTitle>
            <DialogDescription>
              Укажите параметры занятий для возрастной группы
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название группы</Label>
              <Input
                value={newSession.age_label}
                onChange={(e) => setNewSession({ ...newSession, age_label: e.target.value })}
                placeholder="Например: 3-5 лет"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Возраст от (лет)</Label>
                <Input
                  type="number"
                  value={newSession.age_from}
                  onChange={(e) => setNewSession({ ...newSession, age_from: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Возраст до (лет)</Label>
                <Input
                  type="number"
                  value={newSession.age_to}
                  onChange={(e) => setNewSession({ ...newSession, age_to: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Длительность (мин)</Label>
                <Input
                  type="number"
                  value={newSession.session_duration_minutes}
                  onChange={(e) => setNewSession({ ...newSession, session_duration_minutes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Занятий в день</Label>
                <Input
                  type="number"
                  value={newSession.max_sessions_per_day}
                  onChange={(e) => setNewSession({ ...newSession, max_sessions_per_day: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Занятий в неделю</Label>
                <Input
                  type="number"
                  value={newSession.max_sessions_per_week}
                  onChange={(e) => setNewSession({ ...newSession, max_sessions_per_week: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSessionDialog(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => createSessionMutation.mutate(newSession)}
              disabled={!newSession.age_label || createSessionMutation.isPending}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
