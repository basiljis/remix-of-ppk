import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Shield, 
  Clock, 
  Download, 
  Settings,
  Mail,
  Phone,
  Calendar,
  Edit,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position_id: string;
  organization_id: string;
  is_blocked: boolean;
  created_at: string;
  positions?: { name: string } | null;
}

interface EmployeePermissions {
  ppk_view: boolean;
  ppk_edit: boolean;
  ppk_create: boolean;
  org_view: boolean;
  org_edit: boolean;
  schedule_personal: boolean;
  schedule_organization: boolean;
  statistics_view: boolean;
}

interface WorkSchedule {
  monday_start: string | null;
  monday_end: string | null;
  tuesday_start: string | null;
  tuesday_end: string | null;
  wednesday_start: string | null;
  wednesday_end: string | null;
  thursday_start: string | null;
  thursday_end: string | null;
  friday_start: string | null;
  friday_end: string | null;
  saturday_start: string | null;
  saturday_end: string | null;
  sunday_start: string | null;
  sunday_end: string | null;
}

const dayLabels = {
  monday: "Понедельник",
  tuesday: "Вторник",
  wednesday: "Среда",
  thursday: "Четверг",
  friday: "Пятница",
  saturday: "Суббота",
  sunday: "Воскресенье",
};

export function OrganizationEmployees() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    position_id: "",
  });
  const [permissions, setPermissions] = useState<EmployeePermissions>({
    ppk_view: false,
    ppk_edit: false,
    ppk_create: false,
    org_view: false,
    org_edit: false,
    schedule_personal: true,
    schedule_organization: false,
    statistics_view: false,
  });
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>({
    monday_start: "09:00",
    monday_end: "18:00",
    tuesday_start: "09:00",
    tuesday_end: "18:00",
    wednesday_start: "09:00",
    wednesday_end: "18:00",
    thursday_start: "09:00",
    thursday_end: "18:00",
    friday_start: "09:00",
    friday_end: "18:00",
    saturday_start: null,
    saturday_end: null,
    sunday_start: null,
    sunday_end: null,
  });

  const organizationId = profile?.organization_id;

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["organization-employees", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          phone,
          position_id,
          organization_id,
          is_blocked,
          created_at,
          positions (name)
        `)
        .eq("organization_id", organizationId)
        .order("full_name");
      
      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!organizationId,
  });

  // Fetch positions
  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch employee permissions
  const { data: employeePermissions } = useQuery({
    queryKey: ["employee-permissions", selectedEmployee?.id, organizationId],
    queryFn: async () => {
      if (!selectedEmployee || !organizationId) return null;
      
      const { data, error } = await supabase
        .from("employee_permissions")
        .select("*")
        .eq("user_id", selectedEmployee.id)
        .eq("organization_id", organizationId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEmployee && !!organizationId,
  });

  // Fetch employee work schedule
  const { data: employeeWorkSchedule } = useQuery({
    queryKey: ["work-schedule", selectedEmployee?.id, organizationId],
    queryFn: async () => {
      if (!selectedEmployee || !organizationId) return null;
      
      const { data, error } = await supabase
        .from("work_schedules")
        .select("*")
        .eq("user_id", selectedEmployee.id)
        .eq("organization_id", organizationId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEmployee && !!organizationId,
  });

  // Fetch specialist rates
  const { data: specialistRates = [] } = useQuery({
    queryKey: ["specialist-rates", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("specialist_rates")
        .select("*")
        .eq("organization_id", organizationId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Save permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async (perms: EmployeePermissions) => {
      if (!selectedEmployee || !organizationId) throw new Error("No employee selected");

      const { error } = await supabase
        .from("employee_permissions")
        .upsert({
          user_id: selectedEmployee.id,
          organization_id: organizationId,
          ...perms,
          granted_by: profile?.id,
        }, {
          onConflict: 'user_id,organization_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-permissions"] });
      toast({ title: "Права доступа сохранены" });
      setIsPermissionsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить права доступа",
        variant: "destructive",
      });
    },
  });

  // Save work schedule mutation
  const saveScheduleMutation = useMutation({
    mutationFn: async (schedule: WorkSchedule) => {
      if (!selectedEmployee || !organizationId) throw new Error("No employee selected");

      const { error } = await supabase
        .from("work_schedules")
        .upsert({
          user_id: selectedEmployee.id,
          organization_id: organizationId,
          ...schedule,
        }, {
          onConflict: 'user_id,organization_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-schedule"] });
      toast({ title: "Рабочее время сохранено" });
      setIsScheduleDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить рабочее время",
        variant: "destructive",
      });
    },
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (employee: typeof newEmployee) => {
      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke("sync-auth-users", {
        body: {
          action: "create_user",
          email: employee.email,
          password: employee.password,
          full_name: employee.full_name,
          phone: employee.phone,
          position_id: employee.position_id,
          organization_id: organizationId,
          region_id: profile?.region_id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-employees"] });
      toast({ title: "Сотрудник добавлен", description: "Данные для входа отправлены на email" });
      setIsAddDialogOpen(false);
      setNewEmployee({ full_name: "", email: "", phone: "", password: "", position_id: "" });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить сотрудника",
        variant: "destructive",
      });
    },
  });

  // Open permissions dialog with existing data
  const openPermissionsDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsPermissionsDialogOpen(true);
  };

  // Open schedule dialog with existing data
  const openScheduleDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsScheduleDialogOpen(true);
  };

  // Effect to update permissions when data loads
  useState(() => {
    if (employeePermissions) {
      setPermissions({
        ppk_view: employeePermissions.ppk_view,
        ppk_edit: employeePermissions.ppk_edit,
        ppk_create: employeePermissions.ppk_create,
        org_view: employeePermissions.org_view,
        org_edit: employeePermissions.org_edit,
        schedule_personal: employeePermissions.schedule_personal,
        schedule_organization: employeePermissions.schedule_organization,
        statistics_view: employeePermissions.statistics_view,
      });
    }
  });

  // Effect to update schedule when data loads
  useState(() => {
    if (employeeWorkSchedule) {
      setWorkSchedule({
        monday_start: employeeWorkSchedule.monday_start,
        monday_end: employeeWorkSchedule.monday_end,
        tuesday_start: employeeWorkSchedule.tuesday_start,
        tuesday_end: employeeWorkSchedule.tuesday_end,
        wednesday_start: employeeWorkSchedule.wednesday_start,
        wednesday_end: employeeWorkSchedule.wednesday_end,
        thursday_start: employeeWorkSchedule.thursday_start,
        thursday_end: employeeWorkSchedule.thursday_end,
        friday_start: employeeWorkSchedule.friday_start,
        friday_end: employeeWorkSchedule.friday_end,
        saturday_start: employeeWorkSchedule.saturday_start,
        saturday_end: employeeWorkSchedule.saturday_end,
        sunday_start: employeeWorkSchedule.sunday_start,
        sunday_end: employeeWorkSchedule.sunday_end,
      });
    }
  });

  const filteredEmployees = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEmployeeRate = (userId: string) => {
    const rate = specialistRates.find((r) => r.user_id === userId);
    return rate?.rate || 1;
  };

  const exportEmployees = () => {
    const csvContent = [
      ["ФИО", "Email", "Телефон", "Должность", "Ставка", "Дата добавления"].join(";"),
      ...filteredEmployees.map((e) =>
        [
          e.full_name,
          e.email,
          e.phone,
          e.positions?.name || "",
          getEmployeeRate(e.id),
          format(new Date(e.created_at), "dd.MM.yyyy", { locale: ru }),
        ].join(";")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `employees_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Экспорт выполнен" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Сотрудники организации
            </CardTitle>
            <CardDescription>
              Управление сотрудниками, ставками, рабочим временем и правами доступа
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportEmployees}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить сотрудника
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Добавить сотрудника</DialogTitle>
                  <DialogDescription>
                    Создайте учетную запись для нового сотрудника. Данные для входа будут отправлены на email.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>ФИО *</Label>
                    <Input
                      value={newEmployee.full_name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                      placeholder="Иванов Иван Иванович"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Телефон *</Label>
                    <Input
                      type="tel"
                      value={newEmployee.phone}
                      onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                      placeholder="+7 (999) 999-99-99"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Пароль *</Label>
                    <Input
                      type="password"
                      value={newEmployee.password}
                      onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                      placeholder="Минимум 8 символов"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Должность *</Label>
                    <Select
                      value={newEmployee.position_id}
                      onValueChange={(v) => setNewEmployee({ ...newEmployee, position_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите должность" />
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button
                    onClick={() => createEmployeeMutation.mutate(newEmployee)}
                    disabled={
                      createEmployeeMutation.isPending ||
                      !newEmployee.full_name ||
                      !newEmployee.email ||
                      !newEmployee.phone ||
                      !newEmployee.password ||
                      !newEmployee.position_id
                    }
                  >
                    {createEmployeeMutation.isPending ? "Создание..." : "Создать"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Employees table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Сотрудники не найдены</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сотрудник</TableHead>
                    <TableHead>Должность</TableHead>
                    <TableHead>Ставка</TableHead>
                    <TableHead>Контакты</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="font-medium">{employee.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Добавлен {format(new Date(employee.created_at), "dd.MM.yyyy", { locale: ru })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.positions?.name || "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getEmployeeRate(employee.id)} ст.</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {employee.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {employee.is_blocked ? (
                          <Badge variant="destructive">Заблокирован</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500">Активен</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Действия</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openPermissionsDialog(employee)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Права доступа
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openScheduleDialog(employee)}>
                              <Clock className="h-4 w-4 mr-2" />
                              Рабочее время
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Всего сотрудников: {filteredEmployees.length}
          </div>
        </div>

        {/* Permissions Dialog */}
        <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Права доступа: {selectedEmployee?.full_name}
              </DialogTitle>
              <DialogDescription>
                Настройте доступ сотрудника к различным разделам системы
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* PPK Section */}
              <div className="space-y-3">
                <h4 className="font-medium">Раздел ППк</h4>
                <div className="space-y-2 pl-4">
                  <div className="flex items-center justify-between">
                    <Label>Просмотр протоколов</Label>
                    <Switch
                      checked={permissions.ppk_view}
                      onCheckedChange={(v) => setPermissions({ ...permissions, ppk_view: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Редактирование протоколов</Label>
                    <Switch
                      checked={permissions.ppk_edit}
                      onCheckedChange={(v) => setPermissions({ ...permissions, ppk_edit: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Создание протоколов</Label>
                    <Switch
                      checked={permissions.ppk_create}
                      onCheckedChange={(v) => setPermissions({ ...permissions, ppk_create: v })}
                    />
                  </div>
                </div>
              </div>

              {/* Organization Section */}
              <div className="space-y-3">
                <h4 className="font-medium">Раздел Организация</h4>
                <div className="space-y-2 pl-4">
                  <div className="flex items-center justify-between">
                    <Label>Просмотр</Label>
                    <Switch
                      checked={permissions.org_view}
                      onCheckedChange={(v) => setPermissions({ ...permissions, org_view: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Редактирование</Label>
                    <Switch
                      checked={permissions.org_edit}
                      onCheckedChange={(v) => setPermissions({ ...permissions, org_edit: v })}
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="space-y-3">
                <h4 className="font-medium">Расписание</h4>
                <div className="space-y-2 pl-4">
                  <div className="flex items-center justify-between">
                    <Label>Личное расписание</Label>
                    <Switch
                      checked={permissions.schedule_personal}
                      onCheckedChange={(v) => setPermissions({ ...permissions, schedule_personal: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Расписание организации</Label>
                    <Switch
                      checked={permissions.schedule_organization}
                      onCheckedChange={(v) => setPermissions({ ...permissions, schedule_organization: v })}
                    />
                  </div>
                </div>
              </div>

              {/* Statistics Section */}
              <div className="space-y-3">
                <h4 className="font-medium">Статистика</h4>
                <div className="space-y-2 pl-4">
                  <div className="flex items-center justify-between">
                    <Label>Просмотр статистики</Label>
                    <Switch
                      checked={permissions.statistics_view}
                      onCheckedChange={(v) => setPermissions({ ...permissions, statistics_view: v })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                onClick={() => savePermissionsMutation.mutate(permissions)}
                disabled={savePermissionsMutation.isPending}
              >
                {savePermissionsMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Work Schedule Dialog */}
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Рабочее время: {selectedEmployee?.full_name}
              </DialogTitle>
              <DialogDescription>
                Настройте рабочие часы сотрудника на каждый день недели
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {Object.entries(dayLabels).map(([day, label]) => {
                const startKey = `${day}_start` as keyof WorkSchedule;
                const endKey = `${day}_end` as keyof WorkSchedule;
                const isWorking = workSchedule[startKey] !== null;

                return (
                  <div key={day} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 w-32">
                      <Switch
                        checked={isWorking}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setWorkSchedule({
                              ...workSchedule,
                              [startKey]: "09:00",
                              [endKey]: "18:00",
                            });
                          } else {
                            setWorkSchedule({
                              ...workSchedule,
                              [startKey]: null,
                              [endKey]: null,
                            });
                          }
                        }}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    {isWorking && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={workSchedule[startKey] || ""}
                          onChange={(e) =>
                            setWorkSchedule({ ...workSchedule, [startKey]: e.target.value })
                          }
                          className="w-24"
                        />
                        <span>—</span>
                        <Input
                          type="time"
                          value={workSchedule[endKey] || ""}
                          onChange={(e) =>
                            setWorkSchedule({ ...workSchedule, [endKey]: e.target.value })
                          }
                          className="w-24"
                        />
                      </div>
                    )}
                    {!isWorking && (
                      <span className="text-sm text-muted-foreground">Выходной</span>
                    )}
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                onClick={() => saveScheduleMutation.mutate(workSchedule)}
                disabled={saveScheduleMutation.isPending}
              >
                {saveScheduleMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
