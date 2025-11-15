import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, Trash2, Plus, Search, Edit, Download, FileText, FileSpreadsheet, RefreshCw, Copy, User } from 'lucide-react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProtocols } from '@/hooks/useProtocols';
import { useToast } from '@/hooks/use-toast';
import { formatProtocolToText, exportProtocolToText, exportProtocolToXLS, formatChecklistResults } from '@/utils/protocolExportUtils';
import { ProtocolResultsPanel } from '@/components/ProtocolResultsPanel';
import { AssistanceDirectionsPanel } from '@/components/AssistanceDirectionsPanel';
import { ProtocolConclusionPanel } from '@/components/ProtocolConclusionPanel';
import { useProtocolChecklistData } from '@/hooks/useProtocolChecklistData';
import { getCurrentSchoolYear, getAvailableSchoolYears, isDateInSchoolYear } from '@/utils/schoolYear';
import { useSchoolYears } from '@/hooks/useSchoolYears';
import { translateEducationLevel } from '@/utils/educationLevelTranslations';
import { translateWhobrought } from '@/utils/whobroughtTranslations';

interface PPKListProps {
  onNewProtocol: () => void;
  onEditProtocol: (protocol: any) => void;
}

export const PPKList: React.FC<PPKListProps> = ({ onNewProtocol, onEditProtocol }) => {
  const navigate = useNavigate();
  const { protocols, deleteProtocol, loading, loadProtocols } = useProtocols();
  const { calculateBlockScore } = useProtocolChecklistData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [meetingTypeFilter, setMeetingTypeFilter] = useState('all');
  const [conclusionTypeFilter, setConclusionTypeFilter] = useState('all');
  const [schoolYearFilter, setSchoolYearFilter] = useState<string>(() => getCurrentSchoolYear().value);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Fetch school years from database
  const { schoolYearsFormatted, loading: yearsLoading } = useSchoolYears();
  
  // Use database school years if available, otherwise use generated ones
  const availableSchoolYears = schoolYearsFormatted.length > 0 
    ? schoolYearsFormatted 
    : getAvailableSchoolYears();

  // Filter protocols based on search and filters
  const filteredRecords = protocols.filter(protocol => {
    const matchesSearch = protocol.child_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || protocol.status === statusFilter;
    const matchesType = typeFilter === 'all' || protocol.consultation_type === typeFilter;
    const matchesReason = reasonFilter === 'all' || protocol.consultation_reason === reasonFilter;
    const matchesMeetingType = meetingTypeFilter === 'all' || protocol.meeting_type === meetingTypeFilter;
    
    // Conclusion type filter
    let matchesConclusionType = true;
    if (conclusionTypeFilter && conclusionTypeFilter !== 'all' && protocol.protocol_data) {
      const conclusionData = (protocol.protocol_data as any)?.conclusion;
      if (conclusionData?.finalGroup) {
        // Преобразуем значение фильтра (например, "group1") в число (1)
        const filterGroup = conclusionTypeFilter.replace('group', '');
        matchesConclusionType = conclusionData.finalGroup.toString() === filterGroup;
      } else {
        matchesConclusionType = false;
      }
    }
    
    // School year filter (используем дату проведения ППК)
    let matchesSchoolYear = true;
    if (schoolYearFilter && schoolYearFilter !== 'all') {
      const selectedYear = availableSchoolYears.find(y => y.value === schoolYearFilter);
      if (selectedYear) {
        // Используем дату проведения из protocol_data.consultationDate
        const protocolData = protocol.protocol_data as any;
        const consultationDate = protocolData?.consultationDate 
          ? new Date(protocolData.consultationDate)
          : new Date(protocol.created_at); // Fallback на created_at если consultationDate не указана
        matchesSchoolYear = isDateInSchoolYear(consultationDate, selectedYear);
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesReason && matchesMeetingType && matchesConclusionType && matchesSchoolYear;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
    onEditProtocol(protocol);
  };

  const handleExportText = (protocol: any) => {
    try {
      const protocolData = {
        child_name: protocol.child_name,
        child_birth_date: protocol.child_birth_date,
        education_level: protocol.education_level,
        organization: protocol.organizations,
        status: protocol.status,
        consultation_type: protocol.consultation_type,
        consultation_reason: protocol.consultation_reason,
        meeting_type: protocol.meeting_type,
        ppk_number: protocol.ppk_number,
        session_topic: protocol.session_topic,
        completion_percentage: protocol.completion_percentage,
        is_ready: protocol.is_ready,
        created_at: protocol.created_at,
        updated_at: protocol.updated_at,
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
        child_birth_date: protocol.child_birth_date,
        education_level: protocol.education_level,
        organization: protocol.organizations,
        status: protocol.status,
        consultation_type: protocol.consultation_type,
        consultation_reason: protocol.consultation_reason,
        meeting_type: protocol.meeting_type,
        ppk_number: protocol.ppk_number,
        session_topic: protocol.session_topic,
        completion_percentage: protocol.completion_percentage,
        is_ready: protocol.is_ready,
        created_at: protocol.created_at,
        updated_at: protocol.updated_at,
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

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadProtocols();
      toast({
        title: "Данные обновлены",
        description: "Протоколы успешно загружены из базы данных",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyProtocol = (protocol: any) => {
    // Create a new protocol with child data copied and complete structure
    const initialDocuments = [
      { id: "representation", name: "Представление педагогического работника", required: true, present: false },
      { id: "psychologist", name: "Заключение педагога-психолога", required: true, present: false },
      { id: "logoped", name: "Заключение учителя-логопеда", required: false, present: false },
      { id: "defectologist", name: "Заключение учителя-дефектолога", required: false, present: false },
      { id: "social", name: "Заключение социального педагога", required: false, present: false },
      { id: "medical", name: "Справка о состоянии здоровья", required: false, present: false },
      { id: "characteristic", name: "Характеристика обучающегося", required: true, present: false },
      { id: "products", name: "Результаты продуктивной деятельности", required: false, present: false },
      { id: "cpmpk", name: "Заключение ЦПМПК г. Москвы (при наличии)", required: false, present: false },
      { id: "ipr", name: "Индивидуальная программа реабилитации и абилитации для ребёнка-инвалида (при наличии)", required: false, present: false },
    ];

    const newProtocol = {
      protocol_data: {
        childData: {
          fullName: protocol.child_name || '',
          birthDate: protocol.child_birth_date || '',
          age: (protocol.protocol_data as any)?.childData?.age || '',
          classNumber: '',
          classLetter: '',
          address: (protocol.protocol_data as any)?.childData?.address || '',
          registrationAddress: (protocol.protocol_data as any)?.childData?.registrationAddress || '',
          sameAsAddress: (protocol.protocol_data as any)?.childData?.sameAsAddress || false,
          parentName: (protocol.protocol_data as any)?.childData?.parentName || '',
          parentPhone: (protocol.protocol_data as any)?.childData?.parentPhone || '',
          whobrought: (protocol.protocol_data as any)?.childData?.whobrought || '',
          relationship: (protocol.protocol_data as any)?.childData?.relationship || '',
          educationalOrganization: protocol.organization_id || '',
        },
        documents: initialDocuments,
        consultationType: "primary" as const,
        consultationDate: new Date().toISOString().split('T')[0],
        reason: "",
        previousConsultations: "",
        ppkNumber: "",
        sessionTopic: "",
        meetingType: "scheduled" as const
      },
      child_name: protocol.child_name,
      child_birth_date: protocol.child_birth_date,
      education_level: protocol.education_level,
      organization_id: protocol.organization_id,
    };
    
    onEditProtocol(newProtocol);
    toast({
      title: "Создание нового ППК",
      description: `Данные ребенка ${protocol.child_name} скопированы в новый протокол`,
    });
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Список протоколов ППК</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleRefresh} 
                variant="outline"
                size="icon"
                disabled={refreshing || loading}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>

              <Button onClick={onNewProtocol}>
                <Plus className="h-4 w-4 mr-2" />
                Новый ППК
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
        {/* Фильтры */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <Label>Учебный год</Label>
            <Select value={schoolYearFilter} onValueChange={setSchoolYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите учебный год" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все годы</SelectItem>
                {availableSchoolYears.map(year => (
                  <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        
          <div className="flex-1 min-w-64">
            <Label>Поиск</Label>
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
          
          <div className="w-48">
            <Label>Статус</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="completed">Завершенные</SelectItem>
                <SelectItem value="in_progress">В процессе</SelectItem>
                <SelectItem value="draft">Черновики</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Label>Тип</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="primary">Первичные</SelectItem>
                <SelectItem value="secondary">Повторные</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Label>Причина</Label>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger>
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
          </div>

          <div className="w-48">
            <Label>Тип заседания</Label>
            <Select value={meetingTypeFilter} onValueChange={setMeetingTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Тип заседания" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="плановое">Плановое</SelectItem>
                <SelectItem value="внеплановое">Внеплановое</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Label>Заключение</Label>
            <Select value={conclusionTypeFilter} onValueChange={setConclusionTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Группа" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все группы</SelectItem>
                <SelectItem value="1">Группа 1 - Норма</SelectItem>
                <SelectItem value="2">Группа 2 - Риск</SelectItem>
                <SelectItem value="3">Группа 3 - Нарушение</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                  {paginatedRecords.map((record, index) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        #{startIndex + index + 1}. {record.child_name}
                        {record.ppk_number && (
                          <div className="text-sm text-muted-foreground">ППК №{record.ppk_number}</div>
                        )}
                      </TableCell>
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Просмотр протокола</p>
                              </TooltipContent>
                            </Tooltip>
                             <DialogContent className="max-w-4xl max-h-[90vh]">
                               <DialogHeader>
                                 <DialogTitle>Протокол ППК - {record.child_name}</DialogTitle>
                               </DialogHeader>
                               <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
                                 <div className="space-y-4">
                                   <div className="grid grid-cols-2 gap-4">
                                     <div>
                                       <p className="font-semibold">N п/п:</p>
                                       <p>{startIndex + index + 1}</p>
                                     </div>
                                     <div>
                                       <p className="font-semibold">ФИО обучающегося:</p>
                                       <p>{record.child_name}</p>
                                     </div>
                                      <div>
                                        <p className="font-semibold">Класс/группа:</p>
                                        <p>{(record.protocol_data as any)?.childData?.classNumber || 'Не указан'}{(record.protocol_data as any)?.childData?.classLetter || ''}</p>
                                      </div>
                                     {record.child_birth_date && (
                                       <div>
                                         <p className="font-semibold">Дата рождения:</p>
                                         <p>{new Date(record.child_birth_date).toLocaleDateString()}</p>
                                       </div>
                                     )}
                                       <div>
                                         <p className="font-semibold">Инициатор обращения:</p>
                                         <p>{translateWhobrought((record.protocol_data as any)?.childData?.whobrought)}</p>
                                       </div>
                                      <div>
                                        <p className="font-semibold">Повод обращения в ППк:</p>
                                        <p>{record.consultation_reason || 'Не указан'}</p>
                                      </div>
                                      <div>
                                        <p className="font-semibold">Коллегиальное заключение:</p>
                                        <p>{(record.protocol_data as any)?.collegialConclusion || 'Не указано'}</p>
                                      </div>
                                      <div>
                                        <p className="font-semibold">Результат обращения:</p>
                                        <p>{(record.protocol_data as any)?.appealResult || 'Не указан'}</p>
                                      </div>
                                      <div>
                                        <p className="font-semibold">Цель направления:</p>
                                        <p>{(record.protocol_data as any)?.purposeOfReferral || 'Не указана'}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="font-semibold">Перечень документов представленных на ППк:</p>
                                        <p>{(record.protocol_data as any)?.documents?.map((doc: any) => doc.present ? doc.name : null).filter(Boolean).join(', ') || 'Не указаны'}</p>
                                      </div>
                                     <div>
                                       <p className="font-semibold">Организация:</p>
                                       <p>{record.organizations?.name || 'Не указана'}</p>
                                     </div>
                                     <div>
                                       <p className="font-semibold">Уровень образования:</p>
                                       <p>{translateEducationLevel(record.education_level) || 'Не указан'}</p>
                                     </div>
                                     <div>
                                       <p className="font-semibold">Тип консультации:</p>
                                       <p>{record.consultation_type === 'primary' ? 'Первичная' : 'Повторная'}</p>
                                     </div>
                                     <div>
                                       <p className="font-semibold">Тип заседания:</p>
                                       <p>{record.meeting_type === 'scheduled' ? 'Плановое' : 
                                           record.meeting_type === 'unscheduled' ? 'Внеплановое' : 
                                           'Не указан'}</p>
                                     </div>
                                     {record.ppk_number && (
                                       <div>
                                         <p className="font-semibold">Номер ППК:</p>
                                         <p>{record.ppk_number}</p>
                                       </div>
                                     )}
                                     {record.session_topic && (
                                       <div>
                                         <p className="font-semibold">Тема заседания:</p>
                                         <p>{record.session_topic}</p>
                                       </div>
                                     )}
                                     <div>
                                       <p className="font-semibold">Статус:</p>
                                       <p>{getStatusBadge(record.status)}</p>
                                     </div>
                                     <div>
                                       <p className="font-semibold">Готовность:</p>
                                       <p>{record.completion_percentage}%</p>
                                     </div>
                                     <div>
                                       <p className="font-semibold">Дата создания:</p>
                                       <p>{new Date(record.created_at).toLocaleDateString()}</p>
                                     </div>
                                     <div>
                                       <p className="font-semibold">Дата обновления:</p>
                                       <p>{new Date(record.updated_at).toLocaleDateString()}</p>
                                     </div>
                                     {(record.protocol_data as any)?.parentConsent !== undefined && (
                                       <div>
                                         <p className="font-semibold">Согласие родителя:</p>
                                         <p>
                                           {(record.protocol_data as any).parentConsent ? (
                                             <Badge variant="default" className="bg-green-500">Да</Badge>
                                           ) : (
                                             <Badge variant="secondary">Нет</Badge>
                                           )}
                                         </p>
                                       </div>
                                     )}
                                   </div>
                                   
                                        {record.checklist_data && (record.checklist_data as any).blocks && Array.isArray((record.checklist_data as any).blocks) && (record.checklist_data as any).blocks.length > 0 && (
                                          <div className="space-y-6">
                                            <div>
                                              <p className="font-semibold mb-3">Результаты заполнения чек-листа:</p>
                                              <ProtocolResultsPanel 
                                                blocks={(record.checklist_data as any).blocks}
                                                educationLevel={record.education_level || 'elementary'}
                                                calculateBlockScore={calculateBlockScore}
                                              />
                                            </div>
                                            <div>
                                              <p className="font-semibold mb-3">Направления коррекционно-развивающей помощи:</p>
                                              <AssistanceDirectionsPanel 
                                                blocks={(record.checklist_data as any).blocks}
                                                educationLevel={record.education_level || 'elementary'}
                                                calculateBlockScore={calculateBlockScore}
                                              />
                                            </div>
                                            <div>
                                              <p className="font-semibold mb-3">Заключение протокола:</p>
                                              <ProtocolConclusionPanel 
                                                blocks={(record.checklist_data as any).blocks}
                                                educationLevel={record.education_level || 'elementary'}
                                                childName={record.child_name || 'Не указано'}
                                                calculateBlockScore={calculateBlockScore}
                                              />
                                            </div>
                                          </div>
                                        )}
                                     
                                     {record.checklist_data && Object.keys(record.checklist_data).length > 0 && !(record.checklist_data as any).blocks && (
                                      <div>
                                        <p className="font-semibold mb-2">Результаты чек-листов (старый формат):</p>
                                        <div className="bg-muted p-3 rounded max-h-60 overflow-y-auto">
                                          <div className="text-sm whitespace-pre-wrap font-mono">
                                            {formatChecklistResults(record.checklist_data)}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                   
                                    {/* HIDDEN: Данные протокола скрыты - для восстановления раскомментируйте следующий блок */}
                                    {/* 
                                    {record.protocol_data && Object.keys(record.protocol_data).length > 0 && (
                                      <div>
                                        <p className="font-semibold mb-2">Данные протокола:</p>
                                        <div className="bg-muted p-3 rounded max-h-60 overflow-y-auto">
                                          <div className="text-sm space-y-2">
                                            {Object.entries(record.protocol_data).map(([key, value]) => {
                                              let displayValue = '';
                                              if (typeof value === 'object' && value !== null) {
                                                if (Array.isArray(value)) {
                                                  displayValue = value.join(', ');
                                                } else {
                                                  displayValue = Object.entries(value).map(([k, v]) => `${k}: ${v}`).join('; ');
                                                }
                                              } else {
                                                displayValue = String(value);
                                              }
                                              return (
                                                <div key={key} className="border-b pb-1">
                                                  <span className="font-medium">{key}:</span>{' '}
                                                  <span>{displayValue}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                         </div>
                                       </div>
                                     )}
                                     */}
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                          </Dialog>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const currentPath = window.location.pathname;
                                  navigate(`/child-profile?name=${encodeURIComponent(record.child_name)}&org=${record.organization_id}&returnUrl=${encodeURIComponent(currentPath)}`);
                                }}
                                className="text-green-600 hover:text-green-800"
                              >
                                <User className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Профиль ребёнка</p>
                            </TooltipContent>
                          </Tooltip>

                          {record.status !== 'completed' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleContinue(record)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Редактировать протокол</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCopyProtocol(record)}
                                className="text-purple-600 hover:text-purple-800"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Новый ППК с данными ребенка</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <DropdownMenu>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Экспорт протокола</p>
                              </TooltipContent>
                            </Tooltip>
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Удалить протокол</p>
                              </TooltipContent>
                            </Tooltip>
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

                  {paginatedRecords.length === 0 && !loading && (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <div className="text-sm text-muted-foreground text-center">
          Показано: {paginatedRecords.length} из {filteredRecords.length} протоколов (страница {currentPage} из {totalPages})
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};