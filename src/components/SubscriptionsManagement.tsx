import { useState, useMemo } from "react";
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
import { CheckCircle2, XCircle, Calendar, FileText, Download, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";

export const SubscriptionsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  
  // Фильтры для подписок
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  
  // Экспорт
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "user_name",
    "user_email",
    "organization_name",
    "subscription_type",
    "status",
    "amount",
    "start_date",
    "end_date",
  ]);

  // Загрузка подписок
  const { data: subscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data: subsData, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (subsError) throw subsError;

      // Получаем информацию о пользователях
      if (!subsData || subsData.length === 0) return [];

      const userIds = subsData.map(s => s.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          organization_id,
          organizations (
            name
          )
        `)
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      // Объединяем данные
      const enrichedData = subsData.map(sub => {
        const profile = profilesData?.find(p => p.id === sub.user_id);
        return {
          ...sub,
          user_name: profile?.full_name || "Пользователь не найден",
          user_email: profile?.email || "",
          organization_name: profile?.organizations?.name || "—"
        };
      });

      return enrichedData;
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

  // Фильтрация подписок
  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    
    return subscriptions.filter((sub: any) => {
      // Фильтр по статусу
      if (statusFilter !== "all" && sub.status !== statusFilter) {
        return false;
      }
      
      // Фильтр по типу
      if (typeFilter !== "all" && sub.subscription_type !== typeFilter) {
        return false;
      }
      
      // Фильтр по дате начала
      if (startDateFilter && sub.start_date) {
        const subDate = new Date(sub.start_date);
        const filterDate = new Date(startDateFilter);
        if (subDate < filterDate) return false;
      }
      
      // Фильтр по дате окончания
      if (endDateFilter && sub.end_date) {
        const subDate = new Date(sub.end_date);
        const filterDate = new Date(endDateFilter);
        if (subDate > filterDate) return false;
      }
      
      return true;
    });
  }, [subscriptions, statusFilter, typeFilter, startDateFilter, endDateFilter]);

  // Функции для экспорта
  const fieldLabels: Record<string, string> = {
    user_name: "Пользователь",
    user_email: "Email",
    organization_name: "Организация",
    subscription_type: "Тип подписки",
    status: "Статус",
    amount: "Сумма",
    payment_type: "Способ оплаты",
    start_date: "Дата начала",
    end_date: "Дата окончания",
    admin_notes: "Примечания",
    created_at: "Дата создания",
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const toggleAllFields = () => {
    if (selectedFields.length === Object.keys(fieldLabels).length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(Object.keys(fieldLabels));
    }
  };

  const handleExport = (exportFormat: "xlsx" | "csv") => {
    if (selectedFields.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одно поле для экспорта",
        variant: "destructive",
      });
      return;
    }

    const dataToExport = filteredSubscriptions.map((sub: any) => {
      const row: any = {};
      selectedFields.forEach(field => {
        if (field === "subscription_type") {
          row[fieldLabels[field]] = sub[field] === "monthly" ? "Месячная" : "Годовая";
        } else if (field === "status") {
          const statusLabels: Record<string, string> = {
            active: "Активна",
            pending: "Ожидает",
            expired: "Истекла",
            cancelled: "Отменена",
          };
          row[fieldLabels[field]] = statusLabels[sub[field]] || sub[field];
        } else if (field === "payment_type") {
          const paymentLabels: Record<string, string> = {
            card: "Банковская карта",
            legal_entity: "Юридическое лицо",
          };
          row[fieldLabels[field]] = paymentLabels[sub[field]] || sub[field];
        } else if (field === "amount") {
          row[fieldLabels[field]] = sub[field] ? `${sub[field]} ₽` : "—";
        } else if (field === "start_date" || field === "end_date" || field === "created_at") {
          row[fieldLabels[field]] = sub[field] 
            ? format(new Date(sub[field]), "dd.MM.yyyy", { locale: ru })
            : "—";
        } else {
          row[fieldLabels[field]] = sub[field] || "—";
        }
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Подписки");

    const fileName = `subscriptions_${format(new Date(), "yyyy-MM-dd")}.${exportFormat}`;
    XLSX.writeFile(wb, fileName);

    toast({ title: "Экспорт завершён" });
    setExportDialogOpen(false);
  };

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Управление подписками</CardTitle>
            <CardDescription>
              Активация и пролонгация подписок пользователей
            </CardDescription>
          </div>
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Экспорт
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Экспорт подписок</DialogTitle>
                <DialogDescription>
                  Выберите поля для экспорта и формат файла
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedFields.length === Object.keys(fieldLabels).length}
                    onCheckedChange={toggleAllFields}
                  />
                  <Label htmlFor="select-all" className="font-medium">
                    Выбрать все поля
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                  {Object.entries(fieldLabels).map(([field, label]) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={selectedFields.includes(field)}
                        onCheckedChange={() => toggleField(field)}
                      />
                      <Label htmlFor={field} className="text-sm cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleExport("xlsx")}
                    disabled={selectedFields.length === 0}
                    className="flex-1"
                  >
                    Экспорт в XLSX
                  </Button>
                  <Button
                    onClick={() => handleExport("csv")}
                    disabled={selectedFields.length === 0}
                    variant="outline"
                    className="flex-1"
                  >
                    Экспорт в CSV
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="subscriptions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subscriptions">Подписки</TabsTrigger>
            <TabsTrigger value="requests">Запросы от юр. лиц</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-4">
            {/* Фильтры */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="status-filter">
                  <Filter className="inline h-3 w-3 mr-1" />
                  Статус
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="active">Активна</SelectItem>
                    <SelectItem value="pending">Ожидает</SelectItem>
                    <SelectItem value="expired">Истекла</SelectItem>
                    <SelectItem value="cancelled">Отменена</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type-filter">
                  <Filter className="inline h-3 w-3 mr-1" />
                  Тип
                </Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="monthly">Месячная</SelectItem>
                    <SelectItem value="yearly">Годовая</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start-date-filter">Начало от</Label>
                <Input
                  id="start-date-filter"
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date-filter">Окончание до</Label>
                <Input
                  id="end-date-filter"
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Счётчик результатов */}
            <div className="text-sm text-muted-foreground">
              Найдено подписок: <span className="font-medium">{filteredSubscriptions.length}</span>
              {subscriptions && filteredSubscriptions.length !== subscriptions.length && (
                <span> из {subscriptions.length}</span>
              )}
            </div>

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
                {filteredSubscriptions?.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.user_name}</p>
                        <p className="text-xs text-muted-foreground">{sub.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{sub.organization_name}</TableCell>
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
