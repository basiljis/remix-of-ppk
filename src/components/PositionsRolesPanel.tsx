import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, Briefcase, ShieldCheck, Save, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Position {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  role: "admin" | "regional_operator" | "user" | "organization_admin" | "director";
  label: string;
  description: string;
  color: string;
}

const AVAILABLE_ROLES: UserRole[] = [
  { 
    role: "admin", 
    label: "Администратор", 
    description: "Полный доступ ко всем функциям системы",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  },
  { 
    role: "director", 
    label: "Руководитель организации", 
    description: "Управление организацией, сотрудниками и доступ к отчётам",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  },
  { 
    role: "organization_admin", 
    label: "Администратор организации", 
    description: "Управление сотрудниками, детьми и ставками организации",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  },
  { 
    role: "regional_operator", 
    label: "Региональный оператор", 
    description: "Доступ к данным организаций в своём регионе",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
  { 
    role: "user", 
    label: "Пользователь", 
    description: "Базовый доступ к функциям системы",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  },
];

export function PositionsRolesPanel() {
  const queryClient = useQueryClient();
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [showAddPositionDialog, setShowAddPositionDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newPositionName, setNewPositionName] = useState("");
  const [editedName, setEditedName] = useState("");

  // Fetch positions
  const { data: positions = [], isLoading: loadingPositions } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Position[];
    },
  });

  // Fetch position usage counts
  const { data: positionUsage = {} } = useQuery({
    queryKey: ['position-usage'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('position_id');
      if (error) throw error;
      
      const usage: Record<string, number> = {};
      profiles?.forEach(p => {
        if (p.position_id) {
          usage[p.position_id] = (usage[p.position_id] || 0) + 1;
        }
      });
      return usage;
    },
  });

  // Fetch role usage counts
  const { data: roleUsage = {} } = useQuery({
    queryKey: ['role-usage'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role');
      if (error) throw error;
      
      const usage: Record<string, number> = {};
      roles?.forEach(r => {
        usage[r.role] = (usage[r.role] || 0) + 1;
      });
      return usage;
    },
  });

  // Create position mutation
  const createPositionMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('positions')
        .insert({ name });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success('Должность добавлена');
      setShowAddPositionDialog(false);
      setNewPositionName("");
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('Должность с таким названием уже существует');
      } else {
        toast.error('Ошибка добавления должности');
      }
    },
  });

  // Update position mutation
  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('positions')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success('Должность обновлена');
      setEditingPosition(null);
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('Должность с таким названием уже существует');
      } else {
        toast.error('Ошибка обновления должности');
      }
    },
  });

  // Delete position mutation
  const deletePositionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success('Должность удалена');
      setShowDeleteConfirm(null);
    },
    onError: (error: any) => {
      if (error.message?.includes('foreign key') || error.code === '23503') {
        toast.error('Невозможно удалить: должность используется');
      } else {
        toast.error('Ошибка удаления должности');
      }
    },
  });

  const handleStartEdit = (position: Position) => {
    setEditingPosition(position);
    setEditedName(position.name);
  };

  const handleSaveEdit = () => {
    if (!editingPosition || !editedName.trim()) return;
    updatePositionMutation.mutate({ id: editingPosition.id, name: editedName.trim() });
  };

  const handleCreatePosition = () => {
    if (!newPositionName.trim()) return;
    createPositionMutation.mutate(newPositionName.trim());
  };

  if (loadingPositions) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Positions Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Должности</CardTitle>
                <CardDescription>
                  Управление списком должностей специалистов в системе
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowAddPositionDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название должности</TableHead>
                <TableHead className="text-center">Пользователей</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Нет добавленных должностей
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      {editingPosition?.id === position.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSaveEdit}
                            disabled={updatePositionMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingPosition(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium">{position.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {positionUsage[position.id] || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingPosition?.id !== position.id && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(position)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setShowDeleteConfirm(position.id)}
                            disabled={!!positionUsage[position.id]}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Roles Reference */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Типы пользователей (Роли)</CardTitle>
              <CardDescription>
                Системные роли пользователей и их описание. Роли используются для разграничения прав доступа.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Роль</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-center">Пользователей</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AVAILABLE_ROLES.map((role) => (
                <TableRow key={role.role}>
                  <TableCell>
                    <Badge className={role.color}>
                      {role.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.description}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {roleUsage[role.role] || 0}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Примечание:</strong> Типы пользователей определены на уровне системы и не могут быть изменены. 
            Для изменения роли пользователя используйте раздел «Пользователи».
          </p>
        </CardContent>
      </Card>

      {/* Add Position Dialog */}
      <Dialog open={showAddPositionDialog} onOpenChange={setShowAddPositionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить должность</DialogTitle>
            <DialogDescription>
              Введите название новой должности для специалистов
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position-name">Название должности</Label>
              <Input
                id="position-name"
                value={newPositionName}
                onChange={(e) => setNewPositionName(e.target.value)}
                placeholder="Например: Педагог-психолог"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPositionDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleCreatePosition} 
              disabled={!newPositionName.trim() || createPositionMutation.isPending}
            >
              {createPositionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить должность?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Должность будет удалена из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteConfirm && deletePositionMutation.mutate(showDeleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePositionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
