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

  const { data: requests, isLoading } = useQuery({
    queryKey: ["commercial-offer-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commercial_offer_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
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
          <div className="space-y-4">
            {!requests || requests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Нет заявок на коммерческое предложение
              </p>
            ) : (
              requests.map((request) => (
                <Card key={request.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{request.organization_name}</span>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">ИНН:</span>
                            {request.inn}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">Контакт:</span>
                            {request.contact_person}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {request.email}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {request.phone}
                          </div>
                        </div>
                        {request.comment && (
                          <div className="text-sm mt-2 p-2 bg-muted/50 rounded">
                            <span className="font-medium">Комментарий:</span> {request.comment}
                          </div>
                        )}
                        {request.admin_notes && (
                          <div className="text-sm mt-2 p-2 bg-primary/10 rounded">
                            <span className="font-medium">Примечания администратора:</span>{" "}
                            {request.admin_notes}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Создано: {format(new Date(request.created_at), "dd MMM yyyy, HH:mm", { locale: ru })}
                        </div>
                      </div>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
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
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
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
