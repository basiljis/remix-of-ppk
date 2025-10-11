import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban, CheckCircle, Shield, User, Users } from "lucide-react";

interface UserData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_blocked: boolean;
  positions?: { name: string };
  regions?: { name: string };
  organizations?: { name: string };
  user_roles: Array<{ role: string }>;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Load profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          *,
          positions (name),
          regions (name),
          organizations (name)
        `)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Load roles for each user
      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          return {
            ...profile,
            user_roles: rolesData || [],
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
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
      // Remove all existing roles
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Add new role
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

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.organizations?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление пользователями</CardTitle>
        <CardDescription>
          Просмотр, блокировка и изменение ролей пользователей
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Поиск по имени, email или организации..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
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
                      <Button
                        variant={user.is_blocked ? "default" : "destructive"}
                        size="sm"
                        onClick={() => toggleBlockUser(user.id, user.is_blocked)}
                      >
                        {user.is_blocked ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Разблокировать
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
                            Заблокировать
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};