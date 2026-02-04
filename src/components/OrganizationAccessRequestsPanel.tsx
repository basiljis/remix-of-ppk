import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Loader2, Users, RefreshCw } from "lucide-react";

interface AccessRequest {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  position_id: string;
  organization_id: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  requested_at: string;
  reviewed_at: string | null;
  positions: {
    name: string;
  };
}

export function OrganizationAccessRequestsPanel() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const { profile, user } = useAuth();

  useEffect(() => {
    if (profile?.organization_id) {
      fetchRequests();
    }
  }, [profile?.organization_id]);

  const fetchRequests = async () => {
    if (!profile?.organization_id) return;

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
          status,
          admin_notes,
          requested_at,
          reviewed_at,
          positions!inner (name)
        `)
        .eq("organization_id", profile.organization_id)
        .order("requested_at", { ascending: false });

      if (error) throw error;

      setRequests((data || []) as AccessRequest[]);
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
    if (!selectedRequest || !user) return;

    try {
      setActionLoading(true);

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

      // Send approval email
      try {
        await supabase.functions.invoke('send-approval-email', {
          body: {
            email: selectedRequest.email,
            fullName: selectedRequest.full_name,
            status: "approved",
          },
        });
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
      }

      toast({
        title: "Успешно",
        description: "Заявка одобрена, уведомление отправлено на email",
      });

      setSelectedRequest(null);
      setAdminNotes("");
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
    if (!selectedRequest || !user) return;

    try {
      setActionLoading(true);

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
        await supabase.functions.invoke('send-approval-email', {
          body: {
            email: selectedRequest.email,
            fullName: selectedRequest.full_name,
            status: "rejected",
            adminNotes: adminNotes || undefined,
          },
        });
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
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

  const pendingCount = requests.filter(r => r.status === "pending").length;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Заявки на доступ</CardTitle>
              <CardDescription>
                Управление заявками пользователей на присоединение к организации
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="default">{pendingCount} ожидает</Badge>
            )}
            <Button onClick={fetchRequests} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Нет заявок на доступ к организации</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Должность</TableHead>
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
                <div className="col-span-2">
                  <span className="font-semibold">Должность:</span> {selectedRequest?.positions?.name}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNotes">Примечания</Label>
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
      </CardContent>
    </Card>
  );
}
