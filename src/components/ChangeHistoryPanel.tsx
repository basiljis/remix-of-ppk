import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, Search, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface ChangeHistory {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changed_by: string | null;
  changed_at: string;
  old_data: any;
  new_data: any;
  changes_summary: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export const ChangeHistoryPanel = () => {
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { toast } = useToast();

  const { data: changeHistory = [], isLoading } = useQuery({
    queryKey: ['change-history', tableFilter],
    queryFn: async () => {
      let query = supabase
        .from('change_history')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(200);

      if (tableFilter !== 'all') {
        query = query.eq('table_name', tableFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(data?.map(item => item.changed_by).filter(Boolean))] as string[];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(item => ({
        ...item,
        profiles: item.changed_by ? profilesMap.get(item.changed_by) : undefined
      })) as ChangeHistory[];
    }
  });

  const filteredHistory = changeHistory.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      item.profiles?.email?.toLowerCase().includes(searchLower) ||
      item.changes_summary?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageHistory = filteredHistory.slice(startIndex, endIndex);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Создано</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Обновлено</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Удалено</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'protocols':
        return <FileText className="h-4 w-4" />;
      case 'access_requests':
        return <Users className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTableName = (tableName: string) => {
    switch (tableName) {
      case 'protocols':
        return 'Протоколы';
      case 'access_requests':
        return 'Заявки';
      default:
        return tableName;
    }
  };

  const handleExport = () => {
    try {
      const exportData = filteredHistory.map(item => ({
        'Таблица': getTableName(item.table_name),
        'Действие': item.action === 'INSERT' ? 'Создано' : item.action === 'UPDATE' ? 'Обновлено' : 'Удалено',
        'Автор': item.profiles?.full_name || 'Система',
        'Email': item.profiles?.email || '-',
        'Дата и время': format(new Date(item.changed_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru }),
        'Описание': item.changes_summary || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'История изменений');
      
      const fileName = `история_изменений_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Экспорт выполнен",
        description: "История изменений успешно экспортирована"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>История изменений</CardTitle>
            <CardDescription>
              Отслеживание всех модификаций протоколов и заявок
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Экспорт в Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по автору, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Все таблицы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все таблицы</SelectItem>
              <SelectItem value="protocols">Протоколы</SelectItem>
              <SelectItem value="access_requests">Заявки</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Таблица</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Автор</TableHead>
                <TableHead>Дата и время</TableHead>
                <TableHead>Описание</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Загрузка истории изменений...
                  </TableCell>
                </TableRow>
              ) : currentPageHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    История изменений пуста
                  </TableCell>
              </TableRow>
            ) : (
              currentPageHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTableIcon(item.table_name)}
                        <span className="font-medium">{getTableName(item.table_name)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(item.action)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.profiles?.full_name || 'Система'}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.profiles?.email || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.changed_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {item.changes_summary || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredHistory.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Показано записей: {currentPageHistory.length} из {filteredHistory.length}
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
  );
};