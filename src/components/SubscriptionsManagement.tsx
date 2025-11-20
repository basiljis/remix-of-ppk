import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CheckCircle2, XCircle, Calendar, FileText } from "lucide-react";

export const SubscriptionsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Загрузка подписок
  const { data: subscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          profiles (full_name, email, organization:organizations(name))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Загрузка запросов на подписку
  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ["subscription-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_requests")
        .select(`
          *,
          profiles (full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Активация/пролонгация подписки
  const activateSubscription = useMutation({
    mutationFn: async ({ id, months }: { id: string; months: number }) => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast({ title: "Подписка активирована" });
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Одобрение запроса на подписку от юр лица
  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      const { error } = await supabase
        .from("subscription_requests")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", requestId);

      if (error) throw error;

      // Отправляем email с подтверждением
      const request = requests?.find((r) => r.id === requestId);
      if (request) {
        await supabase.functions.invoke("send-subscription-approval-email", {
          body: {
            email: request.email,
            organizationName: request.organization_name,
            subscriptionType: request.subscription_type === "monthly" ? "Месячная" : "Годовая",
            amount: request.amount,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-requests"] });
      toast({ title: "Запрос одобрен, счет отправлен" });
      setAdminNotes("");
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Отклонение запроса
  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      const { error } = await supabase
        .from("subscription_requests")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-requests"] });
      toast({ title: "Запрос отклонен" });
      setAdminNotes("");
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { label: "Активна", variant: "default" },
      pending: { label: "Ожидает", variant: "secondary" },
      expired: { label: "Истекла", variant: "destructive" },
      cancelled: { label: "Отменена", variant: "outline" },
      approved: { label: "Одобрено", variant: "default" },
      rejected: { label: "Отклонено", variant: "destructive" },
    };
    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление подписками</CardTitle>
        <CardDescription>
          Активация и пролонгация подписок пользователей
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="subscriptions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subscriptions">Подписки</TabsTrigger>
            <TabsTrigger value="requests">Запросы от юр. лиц</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Организация</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Период</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions?.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{sub.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{sub.profiles?.organization?.name || "—"}</TableCell>
                    <TableCell>
                      {sub.subscription_type === "monthly" ? "Месячная" : "Годовая"}
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>
                      {sub.start_date && sub.end_date ? (
                        <div className="text-sm">
                          <p>{format(new Date(sub.start_date), "dd.MM.yyyy", { locale: ru })}</p>
                          <p className="text-muted-foreground">
                            до {format(new Date(sub.end_date), "dd.MM.yyyy", { locale: ru })}
                          </p>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Управление
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Управление подпиской</DialogTitle>
                            <DialogDescription>
                              Активируйте или продлите подписку пользователя
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Примечания администратора
                              </label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Комментарий..."
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() =>
                                  activateSubscription.mutate({
                                    id: sub.id,
                                    months: sub.subscription_type === "monthly" ? 1 : 12,
                                  })
                                }
                                disabled={activateSubscription.isPending}
                                className="flex-1"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Активировать/Продлить
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Организация</TableHead>
                  <TableHead>Контактное лицо</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests?.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{req.organization_name}</p>
                        <p className="text-xs text-muted-foreground">ИНН: {req.inn}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{req.contact_person}</p>
                        <p className="text-xs text-muted-foreground">{req.email}</p>
                        <p className="text-xs text-muted-foreground">{req.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {req.subscription_type === "monthly" ? "Месячная" : "Годовая"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {req.amount.toLocaleString()} ₽
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>
                      {req.status === "pending" && (
                        <Dialog open={selectedRequest?.id === req.id} onOpenChange={(open) => {
                          if (!open) setSelectedRequest(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequest(req)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Рассмотреть
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Рассмотрение запроса</DialogTitle>
                              <DialogDescription>
                                Одобрите запрос и отправьте счет или отклоните
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="bg-muted p-4 rounded-lg space-y-2">
                                <p><strong>Организация:</strong> {req.organization_name}</p>
                                <p><strong>ИНН:</strong> {req.inn}</p>
                                {req.kpp && <p><strong>КПП:</strong> {req.kpp}</p>}
                                <p><strong>Юридический адрес:</strong> {req.legal_address}</p>
                                <p><strong>Контактное лицо:</strong> {req.contact_person}</p>
                                <p><strong>Email:</strong> {req.email}</p>
                                <p><strong>Телефон:</strong> {req.phone}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Примечания администратора
                                </label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Комментарий..."
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => approveRequest.mutate(req.id)}
                                  disabled={approveRequest.isPending}
                                  className="flex-1"
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Одобрить
                                </Button>
                                <Button
                                  onClick={() => rejectRequest.mutate(req.id)}
                                  disabled={rejectRequest.isPending}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Отклонить
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
