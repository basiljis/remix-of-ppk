import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building, UserCog, Plus, Trash2, Search, Shield } from "lucide-react";

export function OrganizationAdminManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch users who are organization admins
  const { data: orgAdmins, isLoading: adminsLoading } = useQuery({
    queryKey: ["organization-admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role
        `)
        .eq("role", "organization_admin");
      if (error) throw error;

      // Fetch profile info for each admin
      const userIds = data.map((r) => r.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          organization_id,
          organizations(id, name, short_name)
        `)
        .in("id", userIds);
      if (profilesError) throw profilesError;

      return data.map((role) => {
        const profile = profiles?.find((p) => p.id === role.user_id);
        return {
          ...role,
          profile,
        };
      });
    },
  });

  // Fetch available users (not org admins)
  const { data: availableUsers } = useQuery({
    queryKey: ["available-users-for-org-admin", searchTerm],
    queryFn: async () => {
      const existingAdminIds = orgAdmins?.map((a) => a.user_id) || [];
      
      let query = supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          organization_id,
          organizations(id, name, short_name)
        `)
        .eq("is_blocked", false);

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      return data.filter((u) => !existingAdminIds.includes(u.id));
    },
    enabled: isDialogOpen,
  });

  // Fetch organizations
  const { data: organizations } = useQuery({
    queryKey: ["organizations-for-admin-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, short_name")
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: isDialogOpen,
  });

  // Mutation to add organization admin
  const addOrgAdminMutation = useMutation({
    mutationFn: async ({ userId, organizationId }: { userId: string; organizationId: string }) => {
      // Add role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "organization_admin",
        });
      if (roleError) throw roleError;

      // Update profile organization if needed
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ organization_id: organizationId })
        .eq("id", userId);
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-admins"] });
      queryClient.invalidateQueries({ queryKey: ["available-users-for-org-admin"] });
      toast({
        title: "Администратор назначен",
        description: "Пользователь успешно назначен администратором организации",
      });
      setIsDialogOpen(false);
      setSelectedUserId("");
      setSelectedOrgId("");
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось назначить администратора",
        variant: "destructive",
      });
    },
  });

  // Mutation to remove organization admin
  const removeOrgAdminMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-admins"] });
      toast({
        title: "Роль удалена",
        description: "Пользователь больше не является администратором организации",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить роль",
        variant: "destructive",
      });
    },
  });

  const handleAssign = () => {
    if (!selectedUserId || !selectedOrgId) {
      toast({
        title: "Ошибка",
        description: "Выберите пользователя и организацию",
        variant: "destructive",
      });
      return;
    }
    addOrgAdminMutation.mutate({ userId: selectedUserId, organizationId: selectedOrgId });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Администраторы организаций
              </CardTitle>
              <CardDescription>
                Назначение роли "Администратор организации" пользователям системы.
                Администраторы организации могут управлять детьми, ставками специалистов и расписанием.
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Назначить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {adminsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
          ) : orgAdmins && orgAdmins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Организация</TableHead>
                  <TableHead className="text-center">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-primary" />
                        {admin.profile?.full_name || "—"}
                      </div>
                    </TableCell>
                    <TableCell>{admin.profile?.email || "—"}</TableCell>
                    <TableCell>
                      {admin.profile?.organizations ? (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {(admin.profile.organizations as any).short_name || 
                           (admin.profile.organizations as any).name}
                        </div>
                      ) : (
                        <Badge variant="outline">Не привязана</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOrgAdminMutation.mutate(admin.id)}
                        disabled={removeOrgAdminMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Администраторы организаций ещё не назначены</p>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(true)}
                className="mt-4"
              >
                Назначить первого администратора
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Назначить администратора организации</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Поиск пользователя</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Введите имя или email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Пользователь</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пользователя" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span>{user.full_name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Организация</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите организацию" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.short_name || org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Права администратора организации:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Управление списком детей организации</li>
                <li>Назначение ставок специалистам</li>
                <li>Просмотр расписания всех специалистов</li>
                <li>Управление занятиями организации</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedUserId || !selectedOrgId || addOrgAdminMutation.isPending}
            >
              {addOrgAdminMutation.isPending ? "Назначение..." : "Назначить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
