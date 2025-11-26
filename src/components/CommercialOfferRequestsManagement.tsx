import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, FileText, Mail, Phone, Building, Download, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

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
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState({
    created_at: true,
    organization_name: true,
    inn: true,
    contact_person: true,
    email: true,
    phone: true,
    status: true,
    comment: true,
    admin_notes: true,
    reviewed_at: true,
  });

  // Фильтры
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

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

  const getStatusText = (status: string) => {
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

  const fieldLabels = {
    created_at: "Дата создания",
    organization_name: "Название организации",
    inn: "ИНН",
    contact_person: "Контактное лицо",
    email: "Email",
    phone: "Телефон",
    status: "Статус",
    comment: "Комментарий",
    admin_notes: "Примечания администратора",
    reviewed_at: "Дата рассмотрения",
  };

  const handleExport = (fileFormat: "xlsx" | "csv") => {
    if (!filteredRequests || filteredRequests.length === 0) {
      toast({
        title: "Нет данных",
        description: "Нет заявок для экспорта",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredRequests.map((request) => {
      const row: any = {};
      
      if (selectedFields.created_at) {
        row[fieldLabels.created_at] = format(new Date(request.created_at), "dd.MM.yyyy HH:mm", { locale: ru });
      }
      if (selectedFields.organization_name) {
        row[fieldLabels.organization_name] = request.organization_name;
      }
      if (selectedFields.inn) {
        row[fieldLabels.inn] = request.inn;
      }
      if (selectedFields.contact_person) {
        row[fieldLabels.contact_person] = request.contact_person;
      }
      if (selectedFields.email) {
        row[fieldLabels.email] = request.email;
      }
      if (selectedFields.phone) {
        row[fieldLabels.phone] = request.phone;
      }
      if (selectedFields.status) {
        row[fieldLabels.status] = getStatusText(request.status);
      }
      if (selectedFields.comment) {
        row[fieldLabels.comment] = request.comment || "";
      }
      if (selectedFields.admin_notes) {
        row[fieldLabels.admin_notes] = request.admin_notes || "";
      }
      if (selectedFields.reviewed_at) {
        row[fieldLabels.reviewed_at] = request.reviewed_at 
          ? format(new Date(request.reviewed_at), "dd.MM.yyyy HH:mm", { locale: ru })
          : "";
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "КП заявки");

    const fileName = `КП_заявки_${format(new Date(), "dd.MM.yyyy_HH-mm", { locale: ru })}`;
    
    if (fileFormat === "xlsx") {
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: "csv" });
    }

    toast({
      title: "Экспорт выполнен",
      description: `Файл ${fileName}.${fileFormat} успешно создан`,
    });

    setExportDialogOpen(false);
  };

  const toggleAllFields = (checked: boolean) => {
    setSelectedFields({
      created_at: checked,
      organization_name: checked,
      inn: checked,
      contact_person: checked,
      email: checked,
      phone: checked,
      status: checked,
      comment: checked,
      admin_notes: checked,
      reviewed_at: checked,
    });
  };

  // Применение фильтров
  const filteredRequests = requests?.filter((request) => {
    // Фильтр по статусу
    if (statusFilter !== "all" && request.status !== statusFilter) {
      return false;
    }

    // Фильтр по дате
    const requestDate = parseISO(request.created_at);
    if (dateFrom && dateTo) {
      return isWithinInterval(requestDate, { start: dateFrom, end: dateTo });
    } else if (dateFrom) {
      return requestDate >= dateFrom;
    } else if (dateTo) {
      return requestDate <= dateTo;
    }

    return true;
  }) || [];

  const pendingCount = requests?.filter((r) => r.status === "pending").length || 0;
  const hasActiveFilters = statusFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

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
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Заявки на коммерческое предложение</CardTitle>
              {pendingCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {pendingCount} новых
                </Badge>
              )}
            </div>
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Экспорт
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Экспорт заявок на КП</DialogTitle>
                  <DialogDescription>
                    Выберите поля для экспорта и формат файла
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Checkbox
                      id="select-all"
                      checked={Object.values(selectedFields).every(Boolean)}
                      onCheckedChange={(checked) => toggleAllFields(checked as boolean)}
                    />
                    <Label htmlFor="select-all" className="font-semibold cursor-pointer">
                      Выбрать все поля
                    </Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(fieldLabels).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={selectedFields[key as keyof typeof selectedFields]}
                          onCheckedChange={(checked) =>
                            setSelectedFields((prev) => ({ ...prev, [key]: checked }))
                          }
                        />
                        <Label htmlFor={key} className="cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                      Отмена
                    </Button>
                    <Button variant="outline" onClick={() => handleExport("csv")}>
                      Экспорт в CSV
                    </Button>
                    <Button onClick={() => handleExport("xlsx")}>
                      Экспорт в XLSX
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Фильтры */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Фильтры</span>
                {hasActiveFilters && (
                  <Badge variant="secondary">
                    Найдено: {filteredRequests.length}
                  </Badge>
                )}
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8"
                >
                  <X className="h-4 w-4 mr-1" />
                  Сбросить
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Фильтр по статусу */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Статус</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
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

              {/* Фильтр по дате от */}
              <div className="space-y-2">
                <Label>Дата от</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Фильтр по дате до */}
              <div className="space-y-2">
                <Label>Дата до</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {!requests || requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Нет заявок на коммерческое предложение
            </p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {hasActiveFilters
                ? "Нет заявок, соответствующих выбранным фильтрам"
                : "Нет заявок на коммерческое предложение"}
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
                  {filteredRequests.map((request) => (
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
