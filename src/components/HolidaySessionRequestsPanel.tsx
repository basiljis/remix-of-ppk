import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, X, Clock, Loader2, MessageSquare } from "lucide-react";

interface SessionDataJson {
  child_id: string;
  child_name: string;
  session_type_id: string;
  start_time: string;
  end_time: string;
  topic?: string;
  notes?: string;
  reason?: string;
}

interface HolidaySessionRequest {
  id: string;
  organization_id: string;
  holiday_id: string | null;
  requested_by: string;
  requested_date: string;
  session_data: SessionDataJson;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
  organization_holidays?: { name: string } | null;
}

export function HolidaySessionRequestsPanel() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<HolidaySessionRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const organizationId = profile?.organization_id;

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["holiday-session-requests", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from("holiday_session_requests")
        .select(`
          *,
          organization_holidays (name)
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Cast and fetch requester names separately
      const typedData = data as unknown as HolidaySessionRequest[];
      const requestsWithProfiles = await Promise.all(
        typedData.map(async (req) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", req.requested_by)
            .single();
          return { ...req, profiles: profileData };
        })
      );

      return requestsWithProfiles;
    },
    enabled: !!organizationId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("holiday_session_requests")
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq("id", id);

      if (error) throw error;

      // If approved, create the session
      if (status === "approved" && selectedRequest) {
        const sessionData = selectedRequest.session_data;
        const { error: sessionError } = await supabase.from("sessions").insert({
          child_id: sessionData.child_id,
          specialist_id: selectedRequest.requested_by,
          session_type_id: sessionData.session_type_id,
          session_status_id: await getPlannedStatusId(),
          scheduled_date: selectedRequest.requested_date,
          start_time: sessionData.start_time,
          end_time: sessionData.end_time,
          topic: sessionData.topic || null,
          notes: sessionData.notes || null,
          organization_id: organizationId,
          created_by: selectedRequest.requested_by,
        });

        if (sessionError) throw sessionError;
      }

      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ["holiday-session-requests"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setSelectedRequest(null);
      setAdminNotes("");
      toast({
        title: status === "approved" ? "Запрос одобрен" : "Запрос отклонён",
        description: status === "approved" 
          ? "Занятие успешно добавлено в расписание" 
          : "Специалист получит уведомление об отклонении",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getPlannedStatusId = async (): Promise<string> => {
    const { data } = await supabase
      .from("session_statuses")
      .select("id")
      .ilike("name", "%заплан%")
      .limit(1)
      .single();
    return data?.id || "";
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Ожидает</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Check className="h-3 w-3 mr-1" />Одобрено</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><X className="h-3 w-3 mr-1" />Отклонено</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Запросы на занятия в нерабочие дни</CardTitle>
          {pendingRequests.length > 0 && (
            <Badge variant="destructive">{pendingRequests.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Запросов на согласование нет</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Ожидают рассмотрения
                </h3>
                <RequestTable
                  requests={pendingRequests}
                  onReview={setSelectedRequest}
                  getStatusBadge={getStatusBadge}
                  showActions
                />
              </div>
            )}

            {processedRequests.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">История запросов</h3>
                <RequestTable
                  requests={processedRequests}
                  onReview={setSelectedRequest}
                  getStatusBadge={getStatusBadge}
                />
              </div>
            )}
          </div>
        )}

        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Рассмотрение запроса</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Специалист:</span>
                    <p className="font-medium">{selectedRequest.profiles?.full_name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Дата:</span>
                    <p className="font-medium">
                      {format(parseISO(selectedRequest.requested_date), "d MMMM yyyy", { locale: ru })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Праздник:</span>
                    <p className="font-medium">{selectedRequest.organization_holidays?.name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Время:</span>
                    <p className="font-medium">
                      {selectedRequest.session_data.start_time} – {selectedRequest.session_data.end_time}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Ребёнок:</span>
                    <p className="font-medium">{selectedRequest.session_data.child_name}</p>
                  </div>
                  {selectedRequest.session_data.reason && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Причина запроса:</span>
                      <p className="font-medium">{selectedRequest.session_data.reason}</p>
                    </div>
                  )}
                </div>

                {selectedRequest.status === "pending" && (
                  <div className="space-y-2">
                    <Label htmlFor="holiday-admin-notes">Комментарий администратора</Label>
                    <Textarea
                      id="holiday-admin-notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Необязательный комментарий..."
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              {selectedRequest?.status === "pending" ? (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => updateMutation.mutate({ id: selectedRequest.id, status: "rejected" })}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Отклонить
                  </Button>
                  <Button
                    onClick={() => updateMutation.mutate({ id: selectedRequest.id, status: "approved" })}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Одобрить
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Закрыть
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

interface RequestTableProps {
  requests: HolidaySessionRequest[];
  onReview: (request: HolidaySessionRequest) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  showActions?: boolean;
}

function RequestTable({ requests, onReview, getStatusBadge, showActions }: RequestTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Специалист</TableHead>
            <TableHead>Ребёнок</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-[100px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">
                {format(parseISO(request.requested_date), "d MMM yyyy", { locale: ru })}
              </TableCell>
              <TableCell>{request.profiles?.full_name || "—"}</TableCell>
              <TableCell>{request.session_data.child_name}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => onReview(request)}>
                  {showActions ? "Рассмотреть" : "Детали"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
