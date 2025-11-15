import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Search, AlertCircle, CheckCircle2, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export const EmailLogsPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { toast } = useToast();

  const handleExport = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast({
        title: "Нет данных",
        description: "Отсутствуют данные для экспорта",
        variant: "destructive",
      });
      return;
    }

    const typeLabels: Record<string, string> = {
      registration: "Регистрация",
      approval: "Одобрение",
      rejection: "Отклонение",
    };

    const exportData = filteredLogs.map((log) => ({
      'Дата и время': format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru }),
      'Получатель': log.recipient,
      'Тема': log.subject,
      'Тип': typeLabels[log.email_type] || log.email_type,
      'Статус': log.status === 'success' ? 'Успешно' : log.status === 'error' ? 'Ошибка' : 'В ожидании',
      'Сообщение об ошибке': log.error_message || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Email логи');

    ws['!cols'] = [
      { wch: 20 }, { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 12 }, { wch: 40 }
    ];

    const fileName = `Email_логи_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Экспорт выполнен",
      description: `Email логи экспортированы в файл ${fileName}`,
    });
  };

  const { data: emailLogs, isLoading } = useQuery({
    queryKey: ["email-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = emailLogs?.filter((log) => {
    const matchesSearch =
      log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesType = typeFilter === "all" || log.email_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil((filteredLogs?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageLogs = filteredLogs?.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Успешно
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Ошибка
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            В ожидании
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmailTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      registration: "Регистрация",
      approval: "Одобрение",
      rejection: "Отклонение",
    };

    return (
      <Badge variant="outline" className="bg-primary/10">
        {typeLabels[type] || type}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Загрузка логов...</p>
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
              <Mail className="h-5 w-5" />
              Логирование Email
            </CardTitle>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Экспорт в Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по получателю или теме..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="success">Успешно</SelectItem>
                <SelectItem value="error">Ошибка</SelectItem>
                <SelectItem value="pending">В ожидании</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="registration">Регистрация</SelectItem>
                <SelectItem value="approval">Одобрение</SelectItem>
                <SelectItem value="rejection">Отклонение</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredLogs && filteredLogs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата/Время</TableHead>
                    <TableHead>Получатель</TableHead>
                    <TableHead>Тема</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Resend ID</TableHead>
                  </TableRow>
                 </TableHeader>
                 <TableBody>
                   {currentPageLogs && currentPageLogs.length > 0 ? (
                     currentPageLogs.map((log) => (
                     <TableRow key={log.id}>
                       <TableCell className="whitespace-nowrap">
                         {format(new Date(log.created_at), "dd.MM.yyyy HH:mm", {
                           locale: ru,
                         })}
                       </TableCell>
                       <TableCell className="font-medium">{log.recipient}</TableCell>
                       <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                       <TableCell>{getEmailTypeBadge(log.email_type)}</TableCell>
                       <TableCell>{getStatusBadge(log.status)}</TableCell>
                       <TableCell className="font-mono text-xs">
                         {log.resend_id || "-"}
                       </TableCell>
                     </TableRow>
                   ))
                   ) : null}
                 </TableBody>
               </Table>
             </div>
           ) : (
             <div className="text-center py-8 text-muted-foreground">
               Логи не найдены
             </div>
           )}

           {filteredLogs && (
             <div className="mt-4 text-sm text-muted-foreground">
               Всего записей: {filteredLogs.length}
             </div>
           )}
           {totalPages > 1 && (
             <div className="flex justify-center mt-4">
               <Pagination>
                 <PaginationContent>
                   <PaginationItem>
                     <PaginationPrevious 
                       onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                       className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                     />
                   </PaginationItem>
                   {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                     <PaginationItem key={page}>
                       <PaginationLink
                         onClick={() => setCurrentPage(page)}
                         isActive={currentPage === page}
                         className="cursor-pointer"
                       >
                         {page}
                       </PaginationLink>
                     </PaginationItem>
                   ))}
                   <PaginationItem>
                     <PaginationNext 
                       onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                       className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                     />
                   </PaginationItem>
                 </PaginationContent>
               </Pagination>
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 };
