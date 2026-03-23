import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Ban, CheckCircle, Shield, User, Users, Edit, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { CreateUserDialog } from "./CreateUserDialog";

interface UserData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_blocked: boolean;
  is_private_practice: boolean | null;
  created_at: string;
  position_id: string;
  region_id: string;
  organization_id: string | null;
  positions?: { id: string; name: string };
  regions?: { id: string; name: string };
  organizations?: { id: string; name: string };
  user_roles: Array<{ role: string }>;
}

export const UserManagementEnhanced = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterOrg, setFilterOrg] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadRefData();
  }, []);

  const handleExport = () => {
    const exportData = filteredUsers.map((user) => ({
      'ФИО': user.full_name,
      'Email': user.email,
      'Телефон': user.phone,
      'Должность': user.positions?.name || 'Не указана',
      'Регион': user.regions?.name || 'Не указан',
      'Организация': user.organizations?.name || 'Не указана',
      'Роль': getRoleLabel(user.user_roles[0]?.role || 'user'),
      'Статус': user.is_blocked ? 'Заблокирован' : 'Активен',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Пользователи');

    ws['!cols'] = [
      { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 20 },
      { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 12 }
    ];

    const fileName = `Пользователи_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Экспорт выполнен",
      description: `Данные пользователей экспортированы в файл ${fileName}`,
    });
  };

  const loadRefData = async () => {
    const [positionsRes, regionsRes, orgsRes] = await Promise.all([
      supabase.from("positions").select("*").order("name"),
      supabase.from("regions").select("*").order("name"),
      supabase.from("organizations").select("id, name").order("name"),
    ]);

    if (positionsRes.data) setPositions(positionsRes.data);
    if (regionsRes.data) setRegions(regionsRes.data);
    if (orgsRes.data) setOrganizations(orgsRes.data);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          *,
          positions (id, name),
          regions (id, name),
          organizations (id, name)
        `)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: allRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Roles error:", rolesError);
      }

      const rolesMap = (allRoles || []).reduce((acc, role) => {
        if (!acc[role.user_id]) {
          acc[role.user_id] = [];
        }
        acc[role.user_id].push({ role: role.role });
        return acc;
      }, {} as Record<string, Array<{ role: string }>>);

      const usersWithRoles = (profilesData || []).map((profile) => ({
        ...profile,
        user_roles: rolesMap[profile.id] || [{ role: 'user' }],
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: !currentlyBlocked })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: currentlyBlocked ? "Пользователь разблокирован" : "Пользователь заблокирован",
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const changeUserRole = async (userId: string, newRole: "admin" | "regional_operator" | "user") => {
    try {
      await supabase.from("user_roles").delete().eq("user_id", userId);

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast({
        title: "Роль изменена",
        description: `Новая роль: ${getRoleLabel(newRole)}`,
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      const isPrivate = editingUser.is_private_practice === true;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editingUser.full_name,
          email: editingUser.email,
          phone: editingUser.phone,
          position_id: editingUser.position_id,
          region_id: editingUser.region_id,
          organization_id: isPrivate ? null : editingUser.organization_id,
          is_private_practice: isPrivate,
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      // Manage private_specialist role
      if (isPrivate) {
        // Add private_specialist role if not exists
        await supabase
          .from("user_roles")
          .upsert(
            { user_id: editingUser.id, role: "private_specialist" as any },
            { onConflict: "user_id,role" }
          );
      } else {
        // Remove private_specialist role
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", editingUser.id)
          .eq("role", "private_specialist" as any);
      }

      toast({
        title: "Успешно",
        description: "Данные пользователя обновлены",
      });

      setEditDialogOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "regional_operator":
        return "Региональный оператор";
      case "user":
        return "Пользователь";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "regional_operator":
        return <Users className="h-4 w-4" />;
      case "user":
        return <User className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.organizations?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.user_roles[0]?.role === filterRole;
    const matchesOrg = filterOrg === "all" || user.organizations?.name === filterOrg;
    const matchesPosition = filterPosition === "all" || user.positions?.name === filterPosition;

    return matchesSearch && matchesRole && matchesOrg && matchesPosition;
  });

  const uniqueOrgs = Array.from(new Set(users.map(u => u.organizations?.name).filter(Boolean)));
  const uniquePositions = Array.from(new Set(users.map(u => u.positions?.name).filter(Boolean)));

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Управление пользователями</CardTitle>
          <CardDescription>
            Просмотр, редактирование, блокировка и изменение ролей пользователей
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <CreateUserDialog onUserCreated={loadUsers} />
          <Button variant="outline" onClick={async () => {
            try {
              setLoading(true);
              const { data, error } = await supabase.functions.invoke('sync-auth-users');
              if (error) throw error;
              toast({ title: 'Синхронизация завершена', description: `Создано профилей: ${data?.createdProfiles || 0}, ролей: ${data?.createdRoles || 0}` });
              await loadUsers();
            } catch (e: any) {
              toast({ title: 'Ошибка синхронизации', description: e.message || 'Недостаточно прав или ошибка сервера', variant: 'destructive' });
            } finally {
              setLoading(false);
            }
          }}>
            Синхронизировать пользователей
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          <div className="flex gap-4">
            <Input
              placeholder="Поиск по имени, email или организации..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="regional_operator">Региональный оператор</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Организация</Label>
              <Select value={filterOrg} onValueChange={setFilterOrg}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все организации</SelectItem>
                  {uniqueOrgs.map((org) => (
                    <SelectItem key={org} value={org!}>{org}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Должность</Label>
              <Select value={filterPosition} onValueChange={setFilterPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все должности</SelectItem>
                  {uniquePositions.map((pos) => (
                    <SelectItem key={pos} value={pos!}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Должность</TableHead>
                <TableHead>Организация</TableHead>
                <TableHead>Регион</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={10} className="text-center">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    Пользователи не найдены
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.positions?.name}</TableCell>
                    <TableCell>{user.organizations?.name}</TableCell>
                    <TableCell>{user.regions?.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.user_roles[0] && getRoleIcon(user.user_roles[0].role)}
                        <Select
                          value={user.user_roles[0]?.role || "user"}
                          onValueChange={(value) =>
                            changeUserRole(user.id, value as any)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Пользователь</SelectItem>
                            <SelectItem value="regional_operator">
                              Региональный оператор
                            </SelectItem>
                            <SelectItem value="admin">Администратор</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_blocked ? (
                        <Badge variant="destructive">Заблокирован</Badge>
                      ) : (
                        <Badge variant="default">Активен</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={user.is_blocked ? "default" : "destructive"}
                          size="sm"
                          onClick={() => toggleBlockUser(user.id, user.is_blocked)}
                        >
                          {user.is_blocked ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактирование пользователя</DialogTitle>
            <DialogDescription>
              Измените данные пользователя
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ФИО</Label>
                <Input
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Должность</Label>
                <Select
                  value={editingUser.position_id}
                  onValueChange={(value) => setEditingUser({ ...editingUser, position_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id}>
                        {pos.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Регион</Label>
                <Select
                  value={editingUser.region_id}
                  onValueChange={(value) => setEditingUser({ ...editingUser, region_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((reg) => (
                      <SelectItem key={reg.id} value={reg.id}>
                        {reg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 flex items-center space-x-2 py-2">
                <Checkbox
                  id="edit_is_private_practice"
                  checked={editingUser.is_private_practice === true}
                  onCheckedChange={(checked) => {
                    setEditingUser({
                      ...editingUser,
                      is_private_practice: checked === true,
                      organization_id: checked ? null : editingUser.organization_id,
                    });
                  }}
                />
                <Label htmlFor="edit_is_private_practice" className="text-sm font-medium leading-none">
                  Частная практика
                </Label>
                <span className="text-xs text-muted-foreground">
                  (без организации, доступен «Публичный профиль»)
                </span>
              </div>

              {editingUser.is_private_practice !== true && (
                <div className="space-y-2">
                  <Label>Организация</Label>
                  <Select
                    value={editingUser.organization_id || ""}
                    onValueChange={(value) => setEditingUser({ ...editingUser, organization_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleEditUser}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};