import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface AccessRequest {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  position_id: string;
  organization_id: string | null;
  region_id: string;
  role: "user" | "regional_operator" | "admin";
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  positions: {
    name: string;
  };
  organizations: {
    name: string;
  } | null;
  regions: {
    name: string;
  };
}

export const AccessRequestsManagement = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOrg, setFilterOrg] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Ожидает";
      case "approved":
        return "Одобрено";
      case "rejected":
        return "Отклонено";
      default:
        return status;
    }
  };

  const handleExport = () => {
    const exportData = filteredRequests.map((req) => ({
      'ФИО': req.full_name,
      'Email': req.email,
      'Телефон': req.phone,
      'Должность': req.positions?.name,
      'Регион': req.regions?.name,
      'Организация': req.organizations?.name || 'Не указана',
      'Роль': getRoleLabel(req.role),
      'Статус': getStatusLabel(req.status),
      'Дата заявки': new Date(req.requested_at).toLocaleString('ru-RU'),
      'Примечания': req.admin_notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Заявки');

    ws['!cols'] = [
      { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 20 },
      { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 30 }
    ];

    const fileName = `Заявки_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Экспорт выполнен",
      description: `Заявки экспортированы в файл ${fileName}`,
    });
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("access_requests")
        .select(`
          id,
          user_id,
          full_name,
          email,
          phone,
          position_id,
          organization_id,
          region_id,
          role,
          status,
          admin_notes,
          requested_at,
          reviewed_at,
          reviewed_by,
          positions!inner (name),
          organizations (name)
        `)
        .order("requested_at", { ascending: false });

      if (error) throw error;

      // Fetch regions separately to avoid relation issues
      const { data: regionsData } = await supabase
        .from("regions")
        .select("id, name");

      const regionsMap = new Map(regionsData?.map(r => [r.id, r.name]) || []);

      const requestsWithRegions = (data || []).map(req => ({
        ...req,
        regions: { name: regionsMap.get(req.region_id) || req.region_id }
      }));

      setRequests(requestsWithRegions as AccessRequest[]);
    } catch (error) {
      console.error("Error fetching access requests:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заявки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Update access request with selected role
      // The database trigger will automatically create the profile and assign the role
      const { error: updateError } = await supabase
        .from("access_requests")
        .update({
          status: "approved",
          role: selectedRole as "admin" | "regional_operator" | "user",
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", selectedRequest.id);

      if (updateError) throw updateError;

      // Send approval email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
          body: {
            email: selectedRequest.email,
            fullName: selectedRequest.full_name,
            organizationName: selectedRequest.organizations?.name,
            status: "approved",
          },
        });

        if (emailError) {
          console.error("Error sending approval email:", emailError);
          // Don't fail the approval if email fails
        }
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
        // Don't fail the approval if email fails
      }

      toast({
        title: "Успешно",
        description: `Заявка одобрена, уведомление отправлено на email. Роль: ${selectedRole === 'admin' ? 'Администратор' : selectedRole === 'regional_operator' ? 'Региональный оператор' : 'Пользователь'}`,
      });

      setSelectedRequest(null);
      setAdminNotes("");
      setSelectedRole("user");
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось одобрить заявку",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "rejected",
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // Send rejection email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
          body: {
            email: selectedRequest.email,
            fullName: selectedRequest.full_name,
            organizationName: selectedRequest.organizations?.name,
            status: "rejected",
            adminNotes: adminNotes || undefined,
          },
        });

        if (emailError) {
          console.error("Error sending rejection email:", emailError);
          // Don't fail the rejection if email fails
        }
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
        // Don't fail the rejection if email fails
      }


      toast({
        title: "Успешно",
        description: "Заявка отклонена, уведомление отправлено на email",
      });

      setSelectedRequest(null);
      setAdminNotes("");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить заявку",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Ожидает
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Одобрено
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Отклонено
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filterRole !== "all" && req.role !== filterRole) return false;
    if (filterStatus !== "all" && req.status !== filterStatus) return false;
    if (filterOrg !== "all" && req.organizations?.name !== filterOrg) return false;
    return true;
  });

  const uniqueOrgs = Array.from(new Set(requests.map(r => r.organizations?.name).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Заявки на доступ</h2>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          Обновить
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
          <Label>Статус</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="approved">Одобрено</SelectItem>
              <SelectItem value="rejected">Отклонено</SelectItem>
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
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {requests.length === 0 ? "Нет заявок на доступ" : "Заявки не найдены по заданным фильтрам"}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Должность</TableHead>
                <TableHead>Организация</TableHead>
                <TableHead>Округ</TableHead>
                <TableHead>Запрошенная роль</TableHead>
                <TableHead>Дата заявки</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.full_name}</TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>{request.phone}</TableCell>
                  <TableCell>{request.positions?.name}</TableCell>
                  <TableCell>{request.organizations?.name || "-"}</TableCell>
                  <TableCell>{request.regions?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {request.role === "admin" ? "Администратор" : 
                       request.role === "regional_operator" ? "Региональный оператор" : 
                       "Пользователь"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(request.requested_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
                          setSelectedRole(request.role || "user");
                          setAdminNotes(request.admin_notes || "");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Рассмотреть
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Рассмотрение заявки</DialogTitle>
            <DialogDescription>
              Заявка от {selectedRequest?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Email:</span> {selectedRequest?.email}
              </div>
              <div>
                <span className="font-semibold">Телефон:</span> {selectedRequest?.phone}
              </div>
              <div>
                <span className="font-semibold">Должность:</span> {selectedRequest?.positions?.name}
              </div>
              <div>
                <span className="font-semibold">Округ:</span> {selectedRequest?.regions?.name}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Роль пользователя *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="regional_operator">Региональный оператор</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Запрошенная роль: {selectedRequest?.role === "admin" ? "Администратор" : 
                                   selectedRequest?.role === "regional_operator" ? "Региональный оператор" : 
                                   "Пользователь"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminNotes">Примечания администратора</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Введите комментарий (необязательно)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={handleReject}
              variant="destructive"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Отклонить
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Одобрить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
