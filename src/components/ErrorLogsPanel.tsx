import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Info, AlertTriangle, Search, RefreshCw, Download, Eye, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface GroupedError {
  key: string;
  error_type: string;
  error_message: string;
  count: number;
  lastOccurrence: string;
  severity: string;
  logs: ErrorLog[];
}

export const ErrorLogsPanel = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [resolvedFilter, setResolvedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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

  // Группировка ошибок по типу и сообщению
  const groupedErrors: GroupedError[] = useMemo(() => {
    const groups = new Map<string, GroupedError>();
    
    filteredLogs.forEach(log => {
      const key = `${log.error_type}::${log.error_message.substring(0, 100)}`;
      
      if (groups.has(key)) {
        const group = groups.get(key)!;
        group.count++;
        group.logs.push(log);
        if (new Date(log.created_at) > new Date(group.lastOccurrence)) {
          group.lastOccurrence = log.created_at;
        }
      } else {
        groups.set(key, {
          key,
          error_type: log.error_type,
          error_message: log.error_message,
          count: 1,
          lastOccurrence: log.created_at,
          severity: log.severity,
          logs: [log]
        });
      }
    });
    
    return Array.from(groups.values()).sort((a, b) => 
      new Date(b.lastOccurrence).getTime() - new Date(a.lastOccurrence).getTime()
    );
  }, [filteredLogs]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

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

  const handleExportSingleLog = (log: ErrorLog, formatType: 'txt' | 'json') => {
    const dateStr = format(new Date(log.created_at), "yyyy-MM-dd_HH-mm-ss");
    
    if (formatType === 'json') {
      const jsonData = JSON.stringify(log, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `error-log-${dateStr}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const textContent = `
Лог ошибки
==========
Дата/время: ${format(new Date(log.created_at), "dd.MM.yyyy HH:mm:ss")}
Тип: ${log.error_type}
Серьёзность: ${log.severity}
Компонент: ${log.component_name || "—"}
Маршрут: ${log.route || "—"}
Статус: ${log.resolved ? "Решено" : "Открыто"}

Сообщение об ошибке:
${log.error_message}

${log.error_stack ? `Stack Trace:
${log.error_stack}` : ''}

${log.user_agent ? `User Agent:
${log.user_agent}` : ''}

${log.browser_info ? `Информация о браузере:
${JSON.stringify(log.browser_info, null, 2)}` : ''}

${log.metadata ? `Дополнительные данные:
${JSON.stringify(log.metadata, null, 2)}` : ''}
      `.trim();
      
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `error-log-${dateStr}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
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
            <Button 
              variant={viewMode === 'grouped' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setViewMode(viewMode === 'list' ? 'grouped' : 'list')}
            >
              <Layers className="h-4 w-4 mr-2" />
              {viewMode === 'grouped' ? 'Список' : 'Группировка'}
            </Button>
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
          {viewMode === 'grouped' ? (
            <div className="space-y-2">
              {groupedErrors.map((group) => (
                <div key={group.key} className="border rounded-lg">
                  <button
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50"
                    onClick={() => toggleGroup(group.key)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedGroups.has(group.key) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {getSeverityIcon(group.severity)}
                      <span className="font-mono text-xs">{group.error_type}</span>
                      <span className="text-sm truncate max-w-md">{group.error_message.substring(0, 80)}...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{group.count} ошибок</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(group.lastOccurrence), "dd.MM.yyyy HH:mm")}
                      </span>
                    </div>
                  </button>
                  {expandedGroups.has(group.key) && (
                    <div className="border-t p-2 space-y-1 bg-muted/20">
                      {group.logs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-2 text-sm hover:bg-muted/50 rounded">
                          <span className="text-muted-foreground">
                            {format(new Date(log.created_at), "dd.MM.yyyy HH:mm:ss")}
                          </span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!log.resolved && (
                              <Button variant="ghost" size="sm" onClick={() => handleMarkResolved(log.id)}>
                                Решить
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
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
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!log.resolved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkResolved(log.id)}
                            >
                              Решить
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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

          <div className="text-sm text-muted-foreground">
            Показано {currentLogs.length} из {filteredLogs.length} логов
          </div>
        </div>
      </CardContent>

      {/* Модальное окно с детальной информацией */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getSeverityIcon(selectedLog.severity)}
              Детали ошибки
            </DialogTitle>
            <DialogDescription>
              Подробная информация об ошибке и stack trace
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* Основная информация */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Дата/время</Label>
                    <p className="font-mono text-sm">{format(new Date(selectedLog.created_at), "dd.MM.yyyy HH:mm:ss")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Серьёзность</Label>
                    <div className="mt-1">{getSeverityBadge(selectedLog.severity)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Тип ошибки</Label>
                    <p className="font-mono text-sm">{selectedLog.error_type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Компонент</Label>
                    <p className="text-sm">{selectedLog.component_name || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Маршрут</Label>
                    <p className="font-mono text-sm">{selectedLog.route || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Статус</Label>
                    <div className="mt-1">
                      {selectedLog.resolved ? (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Решено
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Открыто</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Сообщение об ошибке */}
                <div>
                  <Label className="text-muted-foreground">Сообщение об ошибке</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{selectedLog.error_message}</p>
                  </div>
                </div>

                {/* Stack trace */}
                {selectedLog.error_stack && (
                  <div>
                    <Label className="text-muted-foreground">Stack Trace</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                        {selectedLog.error_stack}
                      </pre>
                    </div>
                  </div>
                )}

                {/* User Agent */}
                {selectedLog.user_agent && (
                  <div>
                    <Label className="text-muted-foreground">User Agent</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="text-xs font-mono break-all">{selectedLog.user_agent}</p>
                    </div>
                  </div>
                )}

                {/* Browser Info */}
                {selectedLog.browser_info && (
                  <div>
                    <Label className="text-muted-foreground">Информация о браузере</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.browser_info, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {selectedLog.metadata && (
                  <div>
                    <Label className="text-muted-foreground">Дополнительные данные</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Действия */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleExportSingleLog(selectedLog, 'txt')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Экспорт TXT
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExportSingleLog(selectedLog, 'json')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Экспорт JSON
                  </Button>
                  {!selectedLog.resolved && (
                    <Button
                      onClick={() => {
                        handleMarkResolved(selectedLog.id);
                        setSelectedLog(null);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Отметить как решено
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setSelectedLog(null)}>
                    Закрыть
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};