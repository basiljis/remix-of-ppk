import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, Trash2, Plus, Search, Edit, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useProtocols } from '@/hooks/useProtocols';
import { useToast } from '@/hooks/use-toast';
import { formatProtocolToText, exportProtocolToText, exportProtocolToXLS, formatChecklistResults } from '@/utils/protocolExportUtils';

interface PPKListProps {
  onNewProtocol: () => void;
  onEditProtocol: (protocolId: string) => void;
}

export const PPKList: React.FC<PPKListProps> = ({ onNewProtocol, onEditProtocol }) => {
  const { protocols, deleteProtocol, loading } = useProtocols();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');

  // Filter protocols based on search and filters
  const filteredRecords = protocols.filter(protocol => {
    const matchesSearch = protocol.child_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || protocol.status === statusFilter;
    const matchesType = typeFilter === 'all' || protocol.consultation_type === typeFilter;
    const matchesReason = reasonFilter === 'all' || protocol.consultation_reason === reasonFilter;

    return matchesSearch && matchesStatus && matchesType && matchesReason;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Завершен</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">В процессе</Badge>;
      case 'draft':
        return <Badge variant="outline">Черновик</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'primary':
        return <Badge variant="default">Первичная</Badge>;
      case 'secondary':
        return <Badge variant="secondary">Повторная</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProtocol(id);
      toast({
        title: "Протокол удален",
        description: "Протокол был успешно удален из системы",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить протокол",
        variant: "destructive",
      });
    }
  };

  const handleContinue = (protocol: any) => {
    onEditProtocol(protocol.id);
  };

  const handleExportText = (protocol: any) => {
    try {
      const protocolData = {
        child_name: protocol.child_name,
        education_level: protocol.education_level,
        organization: protocol.organizations,
        status: protocol.status,
        consultation_type: protocol.consultation_type,
        consultation_reason: protocol.consultation_reason,
        completion_percentage: protocol.completion_percentage,
        created_at: protocol.created_at,
        protocol_data: protocol.protocol_data,
        checklist_data: protocol.checklist_data
      };

      exportProtocolToText(protocolData);
      toast({
        title: "Экспорт завершен",
        description: "Протокол экспортирован в текстовом формате",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать протокол",
        variant: "destructive",
      });
    }
  };

  const handleExportXLS = (protocol: any) => {
    try {
      const protocolData = {
        child_name: protocol.child_name,
        education_level: protocol.education_level,
        organization: protocol.organizations,
        status: protocol.status,
        consultation_type: protocol.consultation_type,
        consultation_reason: protocol.consultation_reason,
        completion_percentage: protocol.completion_percentage,
        created_at: protocol.created_at,
        protocol_data: protocol.protocol_data,
        checklist_data: protocol.checklist_data
      };

      exportProtocolToXLS(protocolData);
      toast({
        title: "Экспорт завершен",
        description: "Протокол экспортирован в Excel формате",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать протокол",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Список протоколов ППК</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Фильтры */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени ребенка или организации..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="completed">Завершенные</SelectItem>
              <SelectItem value="in_progress">В процессе</SelectItem>
              <SelectItem value="draft">Черновики</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="primary">Первичные</SelectItem>
              <SelectItem value="secondary">Повторные</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reasonFilter} onValueChange={setReasonFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Причина" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все причины</SelectItem>
              <SelectItem value="трудности в обучении">Трудности в обучении</SelectItem>
              <SelectItem value="повторное обследование">Повторное обследование</SelectItem>
              <SelectItem value="социальная дезадаптация">Социальная дезадаптация</SelectItem>
              <SelectItem value="нарушения речи">Нарушения речи</SelectItem>
              <SelectItem value="поведенческие нарушения">Поведенческие нарушения</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={onNewProtocol}>
            <Plus className="h-4 w-4 mr-2" />
            Новый ППК
          </Button>
        </div>

        {/* Таблица */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО ребенка</TableHead>
                <TableHead>Организация</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Дата создания</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Готовность</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    Загрузка протоколов...
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.child_name}</TableCell>
                      <TableCell>{record.organizations?.name || 'Не указана'}</TableCell>
                      <TableCell>{getTypeBadge(record.consultation_type || '')}</TableCell>
                      <TableCell>{new Date(record.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <Badge variant={record.completion_percentage === 100 ? "default" : "secondary"}>
                          {record.completion_percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Протокол ППК - {record.child_name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-semibold">Имя ребенка:</p>
                                    <p>{record.child_name}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">Организация:</p>
                                    <p>{record.organizations?.name || 'Не указана'}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">Уровень образования:</p>
                                    <p>{record.education_level === 'preschool' ? 'Дошкольное образование' :
                                        record.education_level === 'primary' ? 'Начальное общее образование' :
                                        record.education_level === 'secondary' ? 'Основное общее образование' :
                                        record.education_level === 'high' ? 'Среднее общее образование' :
                                        record.education_level === 'vocational' ? 'Среднее профессиональное образование' :
                                        record.education_level === 'higher' ? 'Высшее образование' :
                                        record.education_level || 'Не указан'}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">Тип консультации:</p>
                                    <p>{record.consultation_type || 'Не указан'}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">Причина консультации:</p>
                                    <p>{record.consultation_reason || 'Не указана'}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">Статус:</p>
                                    <p>{getStatusBadge(record.status)}</p>
                                  </div>
                                </div>
                                
                                {record.checklist_data && Object.keys(record.checklist_data).length > 0 && (
                                  <div>
                                    <p className="font-semibold mb-2">Результаты чек-листов:</p>
                                    <div className="bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
                                      <div className="text-sm whitespace-pre-wrap font-mono">
                                        {formatChecklistResults(record.checklist_data)}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {record.status !== 'completed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleContinue(record)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600 hover:text-green-800"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleExportText(record)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Экспорт в TXT
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportXLS(record)}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Экспорт в XLS
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить протокол?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Протокол будет удален безвозвратно.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(record.id)}>
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredRecords.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        Записи не найдены
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};