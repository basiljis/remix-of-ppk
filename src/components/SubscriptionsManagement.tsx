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
import { CheckCircle2, XCircle, Calendar, FileText, Download, Filter, Search, RotateCcw, Building } from "lucide-react";
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
  
  // Единые фильтры для обеих вкладок
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Функция сброса всех фильтров
  const clearAllFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setStartDateFilter("");
    setEndDateFilter("");
    setSearchQuery("");
    toast({ 
      title: "Фильтры сброшены",
      description: "Все фильтры были очищены"
    });
  };
  
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
  const [selectedOrgForSubscription, setSelectedOrgForSubscription] = useState<any>(null);
  const [orgSubscriptionMonths, setOrgSubscriptionMonths] = useState<number>(12);

  // Загрузка всех пользователей с их подписками
  const { data: usersWithSubscriptions, isLoading: loadingSubscriptions, error: subscriptionsError } = useQuery({
    queryKey: ["admin-all-users-subscriptions"],
    queryFn: async () => {
      console.log("Загрузка пользователей и подписок...");
      
      // Получаем всех пользователей
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          organization_id,
          organizations!profiles_organization_id_fkey (
            name
          )
        `)
        .order("full_name", { ascending: true });

      if (profilesError) {
        console.error("Ошибка загрузки профилей:", profilesError);
        throw profilesError;
      }

      console.log("Загружено профилей:", profilesData?.length || 0);

      // Получаем все подписки
      const { data: subsData, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (subsError) {
        console.error("Ошибка загрузки подписок:", subsError);
        throw subsError;
      }

      console.log("Загружено подписок:", subsData?.length || 0);

      // Объединяем данные
      const enrichedData = profilesData?.map(profile => {
        // Находим активную подписку пользователя
        const activeSubscription = subsData?.find(
          sub => sub.user_id === profile.id && 
          sub.status === 'active' && 
          sub.end_date && 
          new Date(sub.end_date) > new Date()
        );

        // Или последнюю подписку если активной нет
        const lastSubscription = subsData?.find(sub => sub.user_id === profile.id);
        const subscription = activeSubscription || lastSubscription;

        return {
          ...subscription,
          user_id: profile.id,
          user_name: profile.full_name,
          user_email: profile.email,
          organization_name: (profile.organizations as any)?.name || "—",
          subscription_status: activeSubscription ? 'active' : (lastSubscription ? 'expired' : 'none'),
        };
      }) || [];
      
      console.log("Обработано пользователей:", enrichedData.length);
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

  // Загрузка организаций с подписками
  const { data: organizationsWithSubscriptions, isLoading: loadingOrgSubscriptions } = useQuery({
    queryKey: ["organization-subscriptions"],
    queryFn: async () => {
      // Get all organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from("organizations")
        .select("id, name, short_name, email, phone, district")
        .eq("is_archived", false)
        .order("name");

      if (orgsError) throw orgsError;

      // Get organization subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .not("organization_id", "is", null)
        .order("created_at", { ascending: false });

      if (subsError) throw subsError;

      // Get user counts per organization
      const { data: userCounts, error: countError } = await supabase
        .from("profiles")
        .select("organization_id");

      if (countError) throw countError;

      const orgUserCounts = userCounts?.reduce((acc: Record<string, number>, profile) => {
        if (profile.organization_id) {
          acc[profile.organization_id] = (acc[profile.organization_id] || 0) + 1;
        }
        return acc;
      }, {}) || {};

      // Combine data
      return orgsData?.map(org => {
        const activeSub = subsData?.find(
          sub => sub.organization_id === org.id && 
          sub.status === 'active' && 
          sub.end_date && 
          new Date(sub.end_date) > new Date()
        );
        const lastSub = subsData?.find(sub => sub.organization_id === org.id);
        const subscription = activeSub || lastSub;

        return {
          ...org,
          subscription: subscription,
          subscription_status: activeSub ? 'active' : (lastSub ? 'expired' : 'none'),
          user_count: orgUserCounts[org.id] || 0,
        };
      }) || [];
    },
  });

  // Фильтрация организаций
  const filteredOrganizations = useMemo(() => {
    if (!organizationsWithSubscriptions) return [];
    
    return organizationsWithSubscriptions.filter((org: any) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          org.name?.toLowerCase().includes(query) ||
          org.short_name?.toLowerCase().includes(query) ||
          org.district?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (statusFilter !== "all" && org.subscription_status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [organizationsWithSubscriptions, statusFilter, searchQuery]);

  // Активация подписки для организации
  const activateOrgSubscription = useMutation({
    mutationFn: async ({ organizationId, months, amount }: { 
      organizationId: string; 
      months: number;
      amount: number;
    }) => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      // Check for existing org subscription
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (existingSub) {
        // Update existing
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            subscription_type: months >= 12 ? "yearly" : "monthly",
            amount: amount,
            admin_notes: adminNotes,
          })
          .eq("id", existingSub.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("subscriptions")
          .insert({
            organization_id: organizationId,
            user_id: (await supabase.auth.getUser()).data.user?.id || "",
            subscription_type: months >= 12 ? "yearly" : "monthly",
            amount: amount,
            payment_type: "legal",
            status: "active",
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            admin_notes: adminNotes,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-subscriptions"] });
      toast({ title: "Подписка на организацию активирована" });
      setAdminNotes("");
      setSelectedOrgForSubscription(null);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Активация/пролонгация подписки
  const activateSubscription = useMutation({
    mutationFn: async ({ id, userId, months, subscriptionType, amount }: { 
      id?: string; 
      userId: string; 
      months: number;
      subscriptionType: string;
      amount: number;
    }) => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      if (id) {
        // Обновляем существующую подписку
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
      } else {
        // Создаём новую подписку
        const { error } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            subscription_type: subscriptionType,
            amount: amount,
            payment_type: "individual",
            status: "active",
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            admin_notes: adminNotes,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-users-subscriptions"] });
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

  // Фильтрация пользователей
  const filteredUsers = useMemo(() => {
    if (!usersWithSubscriptions) return [];
    
    return usersWithSubscriptions.filter((user: any) => {
      // Поиск по имени, email, организации
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          user.user_name?.toLowerCase().includes(query) ||
          user.user_email?.toLowerCase().includes(query) ||
          user.organization_name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Фильтр по статусу подписки
      if (statusFilter !== "all" && user.subscription_status !== statusFilter) {
        return false;
      }
      
      // Фильтр по типу
      if (typeFilter !== "all" && user.subscription_type !== typeFilter) {
        return false;
      }
      
      // Фильтр по дате начала
      if (startDateFilter && user.start_date) {
        const subDate = new Date(user.start_date);
        const filterDate = new Date(startDateFilter);
        if (subDate < filterDate) return false;
      }
      
      // Фильтр по дате окончания
      if (endDateFilter && user.end_date) {
        const subDate = new Date(user.end_date);
        const filterDate = new Date(endDateFilter);
        if (subDate > filterDate) return false;
      }
      
      return true;
    });
  }, [usersWithSubscriptions, statusFilter, typeFilter, startDateFilter, endDateFilter, searchQuery]);

  // Фильтрация запросов от юр. лиц
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    
    return requests.filter((req: any) => {
      // Поиск по названию организации, контактному лицу, email
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          req.organization_name?.toLowerCase().includes(query) ||
          req.contact_person?.toLowerCase().includes(query) ||
          req.email?.toLowerCase().includes(query) ||
          req.inn?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Фильтр по статусу
      if (statusFilter !== "all" && req.status !== statusFilter) {
        return false;
      }
      
      // Фильтр по типу подписки
      if (typeFilter !== "all" && req.subscription_type !== typeFilter) {
        return false;
      }
      
      // Фильтр по дате создания (от)
      if (startDateFilter && req.created_at) {
        const reqDate = new Date(req.created_at);
        const filterDate = new Date(startDateFilter);
        if (reqDate < filterDate) return false;
      }
      
      // Фильтр по дате создания (до)
      if (endDateFilter && req.created_at) {
        const reqDate = new Date(req.created_at);
        const filterDate = new Date(endDateFilter);
        if (reqDate > filterDate) return false;
      }
      
      return true;
    });
  }, [requests, statusFilter, typeFilter, startDateFilter, endDateFilter, searchQuery]);

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

    const dataToExport = filteredUsers.map((user: any) => {
      const row: any = {};
      selectedFields.forEach(field => {
        if (field === "subscription_type") {
          row[fieldLabels[field]] = user[field] === "monthly" ? "Месячная" : 
                                     user[field] === "yearly" ? "Годовая" : "—";
        } else if (field === "status") {
          const statusLabels: Record<string, string> = {
            active: "Активна",
            pending: "Ожидает",
            expired: "Истекла",
            cancelled: "Отменена",
            none: "Нет подписки",
          };
          row[fieldLabels[field]] = statusLabels[user.subscription_status] || user.subscription_status;
        } else if (field === "payment_type") {
          const paymentLabels: Record<string, string> = {
            individual: "Физ. лицо",
            legal: "Юр. лицо",
          };
          row[fieldLabels[field]] = user[field] ? (paymentLabels[user[field]] || user[field]) : "—";
        } else if (field === "amount") {
          row[fieldLabels[field]] = user[field] ? `${user[field]} ₽` : "—";
        } else if (field === "start_date" || field === "end_date" || field === "created_at") {
          row[fieldLabels[field]] = user[field] 
            ? format(new Date(user[field]), "dd.MM.yyyy", { locale: ru })
            : "—";
        } else {
          row[fieldLabels[field]] = user[field] || "—";
        }
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Пользователи и подписки");

    const fileName = `users_subscriptions_${format(new Date(), "yyyy-MM-dd")}.${exportFormat}`;
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
      none: { label: "Нет подписки", variant: "outline" },
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subscriptions">Подписки</TabsTrigger>
            <TabsTrigger value="organization-subscriptions">
              <Building className="h-4 w-4 mr-2" />
              На организацию
            </TabsTrigger>
            <TabsTrigger value="requests">Запросы от юр. лиц</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-4">
            {/* Обработка состояний загрузки и ошибок */}
            {loadingSubscriptions && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Загрузка пользователей и подписок...</p>
              </div>
            )}

            {subscriptionsError && (
              <div className="text-center py-8">
                <div className="bg-destructive/10 border border-destructive rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-destructive font-semibold mb-2">Ошибка загрузки данных</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {subscriptionsError instanceof Error ? subscriptionsError.message : "Неизвестная ошибка"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Убедитесь, что у вас есть права администратора для просмотра данных.
                  </p>
                </div>
              </div>
            )}

            {!loadingSubscriptions && !subscriptionsError && (
              <>
                {/* Фильтры */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  {/* Поисковая строка и кнопка сброса */}
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="search-query">
                        <Search className="inline h-3 w-3 mr-1" />
                        Поиск
                      </Label>
                      <Input
                        id="search-query"
                        type="text"
                        placeholder="Поиск по имени, email, организации..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="default"
                        onClick={clearAllFilters}
                        className="whitespace-nowrap"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Сбросить фильтры
                      </Button>
                    </div>
                  </div>

                  {/* Остальные фильтры */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                          <SelectItem value="none">Нет подписки</SelectItem>
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
                </div>

            {/* Счётчик результатов */}
            <div className="text-sm text-muted-foreground">
              Найдено пользователей: <span className="font-medium">{filteredUsers.length}</span>
              {usersWithSubscriptions && filteredUsers.length !== usersWithSubscriptions.length && (
                <span> из {usersWithSubscriptions.length}</span>
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
                {filteredUsers?.map((user: any) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.user_name}</p>
                        <p className="text-xs text-muted-foreground">{user.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.organization_name}</TableCell>
                    <TableCell>
                      {user.subscription_type === "monthly" ? "Месячная" : 
                       user.subscription_type === "yearly" ? "Годовая" : "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.subscription_status)}</TableCell>
                    <TableCell>
                      {user.start_date && user.end_date ? (
                        <div className="text-sm">
                          <p>{format(new Date(user.start_date), "dd.MM.yyyy", { locale: ru })}</p>
                          <p className="text-muted-foreground">
                            до {format(new Date(user.end_date), "dd.MM.yyyy", { locale: ru })}
                          </p>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant={user.subscription_status === "none" ? "default" : "outline"}
                          >
                            {user.subscription_status === "none" ? "Активировать" : "Управление"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {user.subscription_status === "none" ? "Активация подписки" : "Управление подпиской"}
                            </DialogTitle>
                            <DialogDescription>
                              {user.subscription_status === "none" 
                                ? "Создайте новую подписку для пользователя" 
                                : "Активируйте или продлите подписку пользователя"}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`sub-duration-${user.id}`}>
                                {user.subscription_status === "none" ? "Срок подписки" : "Продлить на"}
                              </Label>
                              <Select 
                                defaultValue="1"
                                onValueChange={(value) => {
                                  const selectEl = document.getElementById(`sub-duration-value-${user.id}`) as HTMLInputElement;
                                  if (selectEl) selectEl.value = value;
                                }}
                              >
                                <SelectTrigger id={`sub-duration-${user.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 месяц</SelectItem>
                                  <SelectItem value="3">3 месяца</SelectItem>
                                  <SelectItem value="6">6 месяцев</SelectItem>
                                  <SelectItem value="12">12 месяцев (1 год)</SelectItem>
                                </SelectContent>
                              </Select>
                              <input type="hidden" id={`sub-duration-value-${user.id}`} defaultValue="1" />
                            </div>
                            {user.subscription_status === "none" && (
                              <div className="space-y-2">
                                <Label htmlFor={`sub-amount-${user.id}`}>Сумма (₽)</Label>
                                <Input
                                  id={`sub-amount-${user.id}`}
                                  type="number"
                                  defaultValue={1000}
                                  min={0}
                                />
                              </div>
                            )}
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
                                onClick={() => {
                                  const durationEl = document.getElementById(`sub-duration-value-${user.id}`) as HTMLInputElement;
                                  const amountEl = document.getElementById(`sub-amount-${user.id}`) as HTMLInputElement;
                                  const months = parseInt(durationEl?.value || "1", 10);
                                  const subType = months >= 12 ? "yearly" : "monthly";
                                  const amount = amountEl?.value ? parseFloat(amountEl.value) : (user.amount || 1000);
                                  
                                  activateSubscription.mutate({
                                    id: user.id,
                                    userId: user.user_id,
                                    months: months,
                                    subscriptionType: subType,
                                    amount: amount,
                                  });
                                }}
                                disabled={activateSubscription.isPending}
                                className="flex-1"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {user.subscription_status === "none" ? "Создать подписку" : "Активировать/Продлить"}
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
              </>
            )}
          </TabsContent>

          {/* Organization Subscriptions Tab */}
          <TabsContent value="organization-subscriptions" className="space-y-4">
            {loadingOrgSubscriptions ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Загрузка организаций...</p>
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>
                        <Search className="inline h-3 w-3 mr-1" />
                        Поиск организации
                      </Label>
                      <Input
                        type="text"
                        placeholder="Поиск по названию, району..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        <Filter className="inline h-3 w-3 mr-1" />
                        Статус
                      </Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Все" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все</SelectItem>
                          <SelectItem value="active">С подпиской</SelectItem>
                          <SelectItem value="expired">Истекла</SelectItem>
                          <SelectItem value="none">Без подписки</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" onClick={clearAllFilters}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Сбросить
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Counter */}
                <div className="text-sm text-muted-foreground">
                  Найдено организаций: <span className="font-medium">{filteredOrganizations.length}</span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Организация</TableHead>
                      <TableHead>Район</TableHead>
                      <TableHead>Пользователей</TableHead>
                      <TableHead>Статус подписки</TableHead>
                      <TableHead>Период</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.map((org: any) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{org.short_name || org.name}</p>
                            {org.short_name && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{org.name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{org.district || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{org.user_count} чел.</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(org.subscription_status)}</TableCell>
                        <TableCell>
                          {org.subscription?.start_date && org.subscription?.end_date ? (
                            <div className="text-sm">
                              <p>{format(new Date(org.subscription.start_date), "dd.MM.yyyy", { locale: ru })}</p>
                              <p className="text-muted-foreground">
                                до {format(new Date(org.subscription.end_date), "dd.MM.yyyy", { locale: ru })}
                              </p>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Dialog 
                            open={selectedOrgForSubscription?.id === org.id} 
                            onOpenChange={(open) => {
                              if (!open) setSelectedOrgForSubscription(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant={org.subscription_status === "none" ? "default" : "outline"}
                                onClick={() => setSelectedOrgForSubscription(org)}
                              >
                                <Building className="h-4 w-4 mr-2" />
                                {org.subscription_status === "none" ? "Выдать" : "Управление"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  <Building className="h-5 w-5 inline mr-2" />
                                  Подписка на организацию
                                </DialogTitle>
                                <DialogDescription>
                                  Подписка распространяется на всех сотрудников организации
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg">
                                  <p className="font-medium">{org.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Сотрудников: {org.user_count}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label>Срок подписки</Label>
                                  <Select 
                                    value={orgSubscriptionMonths.toString()}
                                    onValueChange={(v) => setOrgSubscriptionMonths(parseInt(v))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">1 месяц</SelectItem>
                                      <SelectItem value="3">3 месяца</SelectItem>
                                      <SelectItem value="6">6 месяцев</SelectItem>
                                      <SelectItem value="12">12 месяцев (год)</SelectItem>
                                      <SelectItem value="24">24 месяца (2 года)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="org-sub-amount">Сумма (₽)</Label>
                                  <Input
                                    id="org-sub-amount"
                                    type="number"
                                    defaultValue={org.user_count * 1000 * orgSubscriptionMonths}
                                    min={0}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Рекомендуемая: {org.user_count} × 1000 × {orgSubscriptionMonths} = {(org.user_count * 1000 * orgSubscriptionMonths).toLocaleString()} ₽
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label>Примечания</Label>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Комментарий администратора..."
                                    rows={3}
                                  />
                                </div>

                                <Button
                                  onClick={() => {
                                    const amountEl = document.getElementById("org-sub-amount") as HTMLInputElement;
                                    const amount = amountEl?.value ? parseFloat(amountEl.value) : 0;
                                    
                                    activateOrgSubscription.mutate({
                                      organizationId: org.id,
                                      months: orgSubscriptionMonths,
                                      amount: amount,
                                    });
                                  }}
                                  disabled={activateOrgSubscription.isPending}
                                  className="w-full"
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {org.subscription_status === "none" 
                                    ? "Активировать подписку" 
                                    : "Продлить подписку"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {/* Фильтры для запросов */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              {/* Поисковая строка и кнопка сброса */}
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="search-query-requests">
                    <Search className="inline h-3 w-3 mr-1" />
                    Поиск
                  </Label>
                  <Input
                    id="search-query-requests"
                    type="text"
                    placeholder="Поиск по организации, контактному лицу, email, ИНН..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={clearAllFilters}
                    className="whitespace-nowrap"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Сбросить фильтры
                  </Button>
                </div>
              </div>

              {/* Остальные фильтры */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status-filter-requests">
                    <Filter className="inline h-3 w-3 mr-1" />
                    Статус
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter-requests">
                      <SelectValue placeholder="Все статусы" />
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
                  <Label htmlFor="type-filter-requests">
                    <Filter className="inline h-3 w-3 mr-1" />
                    Тип
                  </Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="type-filter-requests">
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
                  <Label htmlFor="start-date-filter-requests">Дата от</Label>
                  <Input
                    id="start-date-filter-requests"
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-date-filter-requests">Дата до</Label>
                  <Input
                    id="end-date-filter-requests"
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Счётчик результатов */}
            <div className="text-sm text-muted-foreground">
              Найдено запросов: <span className="font-medium">{filteredRequests.length}</span>
              {requests && filteredRequests.length !== requests.length && (
                <span> из {requests.length}</span>
              )}
            </div>

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
                {filteredRequests?.map((req: any) => (
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
