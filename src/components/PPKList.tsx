import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Search, Plus, Eye, FileText, Trash2, Edit, AlertTriangle } from "lucide-react";
import { useProtocolStorage, SavedProtocol } from "@/hooks/useProtocolStorage";
import { useToast } from "@/hooks/use-toast";

export const PPKList = ({ onNewProtocol }: { onNewProtocol?: () => void }) => {
  const { protocols, deleteProtocol } = useProtocolStorage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterReason, setFilterReason] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<SavedProtocol | null>(null);

  const filteredRecords = protocols.filter(protocol => {
    const matchesSearch = protocol.childName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || protocol.status === filterStatus;
    const matchesType = filterType === "all" || protocol.consultationType === filterType;
    const matchesReason = filterReason === "all" || protocol.reason.toLowerCase().includes(filterReason.toLowerCase());
    return matchesSearch && matchesStatus && matchesType && matchesReason;
  });

  const getStatusBadge = (status: SavedProtocol["status"], completionPercentage: number) => {
    if (status === "completed") {
      return <Badge className="bg-success text-success-foreground">Завершен</Badge>;
    } else {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="bg-red-500 text-white">
            Не завершен ({completionPercentage}%)
          </Badge>
        </div>
      );
    }
  };

  const getTypeBadge = (type: SavedProtocol["consultationType"]) => {
    return type === "primary" ? 
      <Badge variant="outline">Первичный</Badge> : 
      <Badge variant="secondary">Вторичный</Badge>;
  };

  const handleDelete = (id: string) => {
    deleteProtocol(id);
    toast({
      title: "Протокол удален",
      description: "Протокол успешно удален из системы"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Список проведенных ППк
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Фильтры */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по ФИО ребенка..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="completed">Завершенные</SelectItem>
                <SelectItem value="draft">Черновики</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="primary">Первичные</SelectItem>
                <SelectItem value="secondary">Вторичные</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterReason} onValueChange={setFilterReason}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Причина" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все причины</SelectItem>
                <SelectItem value="трудности в освоении">Трудности в освоении программы</SelectItem>
                <SelectItem value="повторное обследование">Повторное обследование</SelectItem>
                <SelectItem value="социальная дезадаптация">Социальная дезадаптация</SelectItem>
                <SelectItem value="нарушения речи">Нарушения речи</SelectItem>
                <SelectItem value="поведенческие нарушения">Поведенческие нарушения</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onNewProtocol}>
              <Plus className="h-4 w-4 mr-2" />
              Новый ППк
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
                {filteredRecords.map((record) => (
                  <TableRow 
                    key={record.id} 
                    className={record.status === 'draft' ? 'bg-red-50 dark:bg-red-950/20' : ''}
                  >
                    <TableCell className="font-medium">{record.childName}</TableCell>
                    <TableCell className="max-w-xs truncate">{record.educationalOrganization}</TableCell>
                    <TableCell>{getTypeBadge(record.consultationType)}</TableCell>
                    <TableCell>{new Date(record.createdDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(record.status, record.completionPercentage)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={record.completionPercentage} className="w-16" />
                        <span className="text-xs text-muted-foreground">{record.completionPercentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRecord(record)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Просмотр
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Детали ППк - {selectedRecord?.childName}</DialogTitle>
                            </DialogHeader>
                            {selectedRecord && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold">Тип консультации:</h4>
                                    <p>{selectedRecord.consultationType === "primary" ? "Первичная" : "Вторичная"}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">Дата создания:</h4>
                                    <p>{new Date(selectedRecord.createdDate).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">Статус:</h4>
                                    <p>{getStatusBadge(selectedRecord.status, selectedRecord.completionPercentage)}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">Готовность:</h4>
                                    <div className="flex items-center gap-2">
                                      <Progress value={selectedRecord.completionPercentage} className="w-20" />
                                      <span>{selectedRecord.completionPercentage}%</span>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">Образовательная организация:</h4>
                                    <p>{selectedRecord.educationalOrganization}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">Уровень образования:</h4>
                                    <p>
                                      {selectedRecord.level === 'preschool' && 'Дошкольное'}
                                      {selectedRecord.level === 'elementary' && 'Начальное'}
                                      {selectedRecord.level === 'middle' && 'Основное'}
                                      {selectedRecord.level === 'high' && 'Среднее'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold">Причина направления:</h4>
                                  <p className="mt-1">{selectedRecord.reason}</p>
                                </div>

                                {selectedRecord.decision && (
                                  <div>
                                    <h4 className="font-semibold">Решение консилиума:</h4>
                                    <p className="mt-1">{selectedRecord.decision}</p>
                                  </div>
                                )}

                                {selectedRecord.recommendations && selectedRecord.recommendations.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold">Рекомендации:</h4>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                      {selectedRecord.recommendations.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                <div className="flex gap-2 pt-4">
                                  <Button variant="outline">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Экспорт протокола
                                  </Button>
                                  {selectedRecord.status === 'draft' && (
                                    <Button variant="outline">
                                      <Edit className="h-4 w-4 mr-2" />
                                      Дозаполнить
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {record.status === 'draft' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Удалить
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить протокол?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Протокол будет удален навсегда.
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
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Записи не найдены</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};