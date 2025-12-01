import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertCircle, CheckCircle, Info, AlertTriangle, Search, RefreshCw, Download } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";

interface ErrorLog {
  id: string;
  user_id: string | null;
  error_type: string;
  error_message: string;
  error_stack: string | null;
  component_name: string | null;
  route: string | null;
  user_agent: string | null;
  browser_info: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata: any;
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
}

export const ErrorLogsPanel = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [resolvedFilter, setResolvedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const loadErrorLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      if (resolvedFilter === "resolved") {
        query = query.eq("resolved", true);
      } else if (resolvedFilter === "unresolved") {
        query = query.eq("resolved", false);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log("Загружено логов ошибок:", data?.length || 0);
      setLogs((data as ErrorLog[]) || []);
    } catch (error) {
      console.error("Ошибка загрузки логов:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadErrorLogs();
  }, [severityFilter, resolvedFilter]);

  const filteredLogs = logs.filter(
    (log) =>
      log.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.error_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.component_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.route?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const handleMarkResolved = async (logId: string) => {
    try {
      const { error } = await supabase
        .from("error_logs")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", logId);

      if (error) throw error;

      // Обновить локальное состояние
      setLogs(logs.map(log => 
        log.id === logId 
          ? { ...log, resolved: true, resolved_at: new Date().toISOString() }
          : log
      ));
    } catch (error) {
      console.error("Ошибка при обновлении лога:", error);
    }
  };

  const handleExport = () => {
    const exportData = filteredLogs.map(log => ({
      "Дата/время": format(new Date(log.created_at), "dd.MM.yyyy HH:mm:ss"),
      "Тип": log.error_type,
      "Сообщение": log.error_message,
      "Компонент": log.component_name || "—",
      "Маршрут": log.route || "—",
      "Серьёзность": log.severity,
      "Решено": log.resolved ? "Да" : "Нет",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Логи ошибок");
    XLSX.writeFile(wb, `error-logs-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
      critical: "destructive",
      error: "destructive",
      warning: "secondary",
      info: "outline",
    };

    return (
      <Badge variant={variants[severity] || "default"}>
        {severity}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Логи ошибок</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Логи ошибок</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadErrorLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Фильтры */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Поиск</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Поиск по сообщению, типу, компоненту..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Сброс на первую страницу при поиске
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Серьёзность</Label>
              <select
                id="severity"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="all">Все</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolved">Статус</Label>
              <select
                id="resolved"
                value={resolvedFilter}
                onChange={(e) => setResolvedFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="all">Все</option>
                <option value="unresolved">Не решены</option>
                <option value="resolved">Решены</option>
              </select>
            </div>
          </div>

          {/* Таблица логов */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата/время</TableHead>
                  <TableHead>Серьёзность</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Сообщение</TableHead>
                  <TableHead>Компонент</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Логи не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  currentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), "dd.MM.yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(log.severity)}
                          {getSeverityBadge(log.severity)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.error_type}
                      </TableCell>
                      <TableCell className="max-w-md truncate" title={log.error_message}>
                        {log.error_message}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.component_name || "—"}
                      </TableCell>
                      <TableCell>
                        {log.resolved ? (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Решено
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Открыто</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!log.resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkResolved(log.id)}
                          >
                            Решить
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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

          <div className="text-sm text-muted-foreground">
            Показано {currentLogs.length} из {filteredLogs.length} логов
          </div>
        </div>
      </CardContent>
    </Card>
  );
};