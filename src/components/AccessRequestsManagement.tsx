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
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

interface AccessRequest {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  position_id: string;
  organization_id: string | null;
  region_id: string;
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
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

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

      // Update access request
      const { error: updateError } = await supabase
        .from("access_requests")
        .update({
          status: "approved",
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", selectedRequest.id);

      if (updateError) throw updateError;

      // Create or update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: selectedRequest.user_id,
          full_name: selectedRequest.full_name,
          email: selectedRequest.email,
          phone: selectedRequest.phone,
          position_id: selectedRequest.position_id,
          organization_id: selectedRequest.organization_id,
          region_id: selectedRequest.region_id,
          is_blocked: false,
        });

      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert([{
          user_id: selectedRequest.user_id,
          role: selectedRole as "admin" | "regional_operator" | "user",
        }]);

      if (roleError) throw roleError;

      toast({
        title: "Успешно",
        description: `Заявка одобрена. Роль: ${selectedRole === 'admin' ? 'Администратор' : selectedRole === 'regional_operator' ? 'Региональный оператор' : 'Пользователь'}`,
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

      toast({
        title: "Успешно",
        description: "Заявка отклонена",
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

      {requests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Нет заявок на доступ
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
                <TableHead>Дата заявки</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.full_name}</TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>{request.phone}</TableCell>
                  <TableCell>{request.positions?.name}</TableCell>
                  <TableCell>{request.organizations?.name || "-"}</TableCell>
                  <TableCell>{request.regions?.name}</TableCell>
                  <TableCell>
                    {new Date(request.requested_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
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
              <Label htmlFor="role">Роль пользователя</Label>
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
