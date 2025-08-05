import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Search, Plus, Eye, FileText } from "lucide-react";

interface PPKRecord {
  id: string;
  childName: string;
  consultationType: "primary" | "secondary";
  date: string;
  status: "scheduled" | "completed" | "cancelled";
  reason: string;
  decision: string;
  nextReview?: string;
  recommendations: string[];
}

const mockPPKRecords: PPKRecord[] = [
  {
    id: "1",
    childName: "Иванов Иван Иванович",
    consultationType: "primary",
    date: "2024-01-15",
    status: "completed",
    reason: "Трудности в освоении программы",
    decision: "Рекомендовано психолого-педагогическое сопровождение",
    nextReview: "2024-06-15",
    recommendations: ["Индивидуальные занятия с психологом", "Адаптированная программа"]
  },
  {
    id: "2",
    childName: "Петрова Анна Сергеевна",
    consultationType: "secondary",
    date: "2024-01-20",
    status: "completed",
    reason: "Повторное обследование",
    decision: "Продолжить коррекционную работу",
    recommendations: ["Логопедические занятия", "Развитие мелкой моторики"]
  },
  {
    id: "3",
    childName: "Сидоров Петр Александрович",
    consultationType: "primary",
    date: "2024-02-01",
    status: "scheduled",
    reason: "Социальная дезадаптация",
    decision: "",
    recommendations: []
  }
];

export const PPKList = () => {
  const [records, setRecords] = useState<PPKRecord[]>(mockPPKRecords);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterReason, setFilterReason] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<PPKRecord | null>(null);

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.childName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;
    const matchesType = filterType === "all" || record.consultationType === filterType;
    const matchesReason = filterReason === "all" || record.reason.toLowerCase().includes(filterReason.toLowerCase());
    return matchesSearch && matchesStatus && matchesType && matchesReason;
  });

  const getStatusBadge = (status: PPKRecord["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground">Проведен</Badge>;
      case "scheduled":
        return <Badge className="bg-warning text-warning-foreground">Запланирован</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Отменен</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  const getTypeBadge = (type: PPKRecord["consultationType"]) => {
    return type === "primary" ? 
      <Badge variant="outline">Первичный</Badge> : 
      <Badge variant="secondary">Вторичный</Badge>;
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
                <SelectItem value="completed">Проведены</SelectItem>
                <SelectItem value="scheduled">Запланированы</SelectItem>
                <SelectItem value="cancelled">Отменены</SelectItem>
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
            <Button>
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
                  <TableHead>Тип</TableHead>
                  <TableHead>Дата проведения</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.childName}</TableCell>
                    <TableCell>{getTypeBadge(record.consultationType)}</TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">{record.reason}</TableCell>
                    <TableCell>
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
                                  <h4 className="font-semibold">Дата проведения:</h4>
                                  <p>{new Date(selectedRecord.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Статус:</h4>
                                  <p>{getStatusBadge(selectedRecord.status)}</p>
                                </div>
                                {selectedRecord.nextReview && (
                                  <div>
                                    <h4 className="font-semibold">Следующий осмотр:</h4>
                                    <p>{new Date(selectedRecord.nextReview).toLocaleDateString()}</p>
                                  </div>
                                )}
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

                              {selectedRecord.recommendations.length > 0 && (
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
                                <Button variant="outline">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Назначить повторный
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                        </Dialog>
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