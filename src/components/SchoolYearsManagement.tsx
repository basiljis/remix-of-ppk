import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { useSchoolYears, DbSchoolYear } from '@/hooks/useSchoolYears';
import { Badge } from '@/components/ui/badge';

export const SchoolYearsManagement: React.FC = () => {
  const { schoolYears, loading, createSchoolYear, deleteSchoolYear, isCreating, isDeleting } = useSchoolYears();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newYear, setNewYear] = useState({
    startYear: new Date().getFullYear().toString(),
    endYear: (new Date().getFullYear() + 1).toString()
  });

  const handleCreateYear = () => {
    const startYear = parseInt(newYear.startYear);
    const endYear = parseInt(newYear.endYear);

    if (endYear !== startYear + 1) {
      alert('Учебный год должен быть с 1 сентября одного года по 31 августа следующего года');
      return;
    }

    const yearData = {
      label: `${startYear}/${endYear}`,
      value: `${startYear}-${endYear}`,
      start_date: `${startYear}-09-01`,
      end_date: `${endYear}-08-31`,
      is_active: true
    };

    createSchoolYear(yearData);
    setIsDialogOpen(false);
    setNewYear({
      startYear: new Date().getFullYear().toString(),
      endYear: (new Date().getFullYear() + 1).toString()
    });
  };

  const handleDelete = (id: string) => {
    deleteSchoolYear(id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Управление учебными годами
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Добавить учебный год
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить новый учебный год</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Начальный год</Label>
                  <Input
                    type="number"
                    value={newYear.startYear}
                    onChange={(e) => {
                      const start = e.target.value;
                      setNewYear({
                        startYear: start,
                        endYear: (parseInt(start) + 1).toString()
                      });
                    }}
                    placeholder="2024"
                  />
                </div>
                <div>
                  <Label>Конечный год</Label>
                  <Input
                    type="number"
                    value={newYear.endYear}
                    disabled
                    placeholder="2025"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Учебный год: {newYear.startYear}/{newYear.endYear}
                  <br />
                  Период: 01.09.{newYear.startYear} - 31.08.{newYear.endYear}
                </div>
                <Button onClick={handleCreateYear} disabled={isCreating} className="w-full">
                  {isCreating ? 'Создание...' : 'Создать учебный год'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Загрузка...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Учебный год</TableHead>
                <TableHead>Начало</TableHead>
                <TableHead>Окончание</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schoolYears.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    Нет учебных годов. Добавьте первый учебный год.
                  </TableCell>
                </TableRow>
              ) : (
                schoolYears.map((year: DbSchoolYear) => (
                  <TableRow key={year.id}>
                    <TableCell className="font-medium">{year.label}</TableCell>
                    <TableCell>{new Date(year.start_date).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>{new Date(year.end_date).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>
                      {year.is_active ? (
                        <Badge variant="default">Активен</Badge>
                      ) : (
                        <Badge variant="secondary">Неактивен</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить учебный год?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите удалить учебный год {year.label}? Это действие нельзя отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(year.id)}>
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
