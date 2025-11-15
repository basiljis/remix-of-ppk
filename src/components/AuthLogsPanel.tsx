import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Shield, LogIn, LogOut, UserPlus, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface AuthLog {
  id: string;
  created_at: string;
  event_type: string;
  user_id: string;
  user_email: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
}

export const AuthLogsPanel = () => {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { toast } = useToast();

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = logs.slice(startIndex, endIndex);

  useEffect(() => {
    loadAuthLogs();
  }, []);

  const handleExport = () => {
    const exportData = logs.map((log) => ({
      'Дата и время': format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss'),
      'Событие': getEventLabel(log.event_type),
      'Email пользователя': log.user_email,
      'Статус': log.success ? 'Успешно' : 'Ошибка',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Логи авторизации');

    ws['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 12 }
    ];

    const fileName = `Логи_авторизации_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Экспорт выполнен",
      description: `Логи авторизации экспортированы в файл ${fileName}`,
    });
  };

  const loadAuthLogs = async () => {
    try {
      setLoading(true);
      
      // Получаем логи через edge function
      const { data, error } = await supabase.functions.invoke('get-auth-logs');
      
      if (error) {
        console.error('Error fetching auth logs:', error);
        setLogs([]);
        return;
      }
      
      if (data && Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error loading auth logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'user.signin':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'user.signout':
        return <LogOut className="h-4 w-4 text-orange-600" />;
      case 'user.created':
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'user.signin':
        return 'Вход в систему';
      case 'user.signout':
        return 'Выход из системы';
      case 'user.created':
        return 'Регистрация';
      default:
        return eventType;
    }
  };

  if (loading) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Логи авторизации
          </CardTitle>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Экспорт в Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Логи авторизации
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Логи авторизации отсутствуют</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата и время</TableHead>
                  <TableHead>Событие</TableHead>
                  <TableHead>Email пользователя</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
          <TableBody>
            {currentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEventIcon(log.event_type)}
                        <span>{getEventLabel(log.event_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{log.user_email}</TableCell>
                    <TableCell>
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.success ? 'Успешно' : 'Ошибка'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
