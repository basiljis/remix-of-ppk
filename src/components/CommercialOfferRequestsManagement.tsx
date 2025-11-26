import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, FileText, Mail, Phone, Building } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface CommercialOfferRequest {
  id: string;
  organization_name: string;
  inn: string;
  contact_person: string;
  email: string;
  phone: string;
  comment: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const CommercialOfferRequestsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<CommercialOfferRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ["commercial-offer-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commercial_offer_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching commercial offers:", error);
        throw error;
      }
      return data as CommercialOfferRequest[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      notes,
    }: {
      requestId: string;
      status: string;
      notes: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("commercial_offer_requests")
        .update({
          status,
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: userData.user?.id,
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-offer-requests"] });
      toast({
        title: "Статус обновлен",
        description: "Заявка успешно обработана",
      });
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус заявки",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (!selectedRequest) return;
    updateStatusMutation.mutate({
      requestId: selectedRequest.id,
      status: "approved",
      notes: adminNotes,
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    updateStatusMutation.mutate({
      requestId: selectedRequest.id,
      status: "rejected",
      notes: adminNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Ожидает</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Одобрено</Badge>;
      case "rejected":
        return <Badge variant="destructive">Отклонено</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingCount = requests?.filter((r) => r.status === "pending").length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Загрузка заявок...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <p className="text-destructive font-semibold">Ошибка загрузки заявок</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Неизвестная ошибка"}
            </p>
            <p className="text-sm text-muted-foreground">
              Убедитесь, что у вас есть права администратора для просмотра заявок.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Заявки на коммерческое предложение
            </CardTitle>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {pendingCount} новых
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Нет заявок на коммерческое предложение
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left">
                    <th className="py-2 px-3">Дата</th>
                    <th className="py-2 px-3">Организация</th>
                    <th className="py-2 px-3">ИНН</th>
                    <th className="py-2 px-3">Контактное лицо</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">Телефон</th>
                    <th className="py-2 px-3">Статус</th>
                    <th className="py-2 px-3">Комментарий</th>
                    <th className="py-2 px-3">Примечания администратора</th>
                    <th className="py-2 px-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">
                        {format(new Date(request.created_at), "dd.MM.yyyy HH:mm", { locale: ru })}
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {request.organization_name}
                      </td>
                      <td className="py-2 px-3">{request.inn}</td>
                      <td className="py-2 px-3">{request.contact_person}</td>
                      <td className="py-2 px-3">
                        <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                          {request.email}
                        </a>
                      </td>
                      <td className="py-2 px-3">
                        <a href={`tel:${request.phone}`} className="text-primary hover:underline">
                          {request.phone}
                        </a>
                      </td>
                      <td className="py-2 px-3">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="py-2 px-3 max-w-xs truncate" title={request.comment || undefined}>
                        {request.comment || "—"}
                      </td>
                      <td className="py-2 px-3 max-w-xs truncate" title={request.admin_notes || undefined}>
                        {request.admin_notes || "—"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {request.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setAdminNotes(request.admin_notes || "");
                            }}
                          >
                            Обработать
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRequest && (
        <Card>
          <CardHeader>
            <CardTitle>Обработка заявки: {selectedRequest.organization_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Примечания администратора
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Добавьте примечания к заявке..."
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={updateStatusMutation.isPending}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Одобрить
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={updateStatusMutation.isPending}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Отклонить
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRequest(null);
                  setAdminNotes("");
                }}
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
