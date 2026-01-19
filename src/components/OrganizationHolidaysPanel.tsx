import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { format, isSameYear, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus, CalendarDays, Trash2, Pencil, Loader2, CalendarOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Holiday {
  id: string;
  organization_id: string;
  holiday_date: string;
  name: string;
  description: string | null;
  is_recurring: boolean;
  created_at: string;
}

interface HolidayFormData {
  holiday_date: Date | undefined;
  name: string;
  description: string;
  is_recurring: boolean;
}

const initialFormData: HolidayFormData = {
  holiday_date: undefined,
  name: "",
  description: "",
  is_recurring: false,
};

export function OrganizationHolidaysPanel() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState<HolidayFormData>(initialFormData);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const organizationId = profile?.organization_id;

  // Fetch holidays
  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ["organization-holidays", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("organization_holidays")
        .select("*")
        .eq("organization_id", organizationId)
        .order("holiday_date", { ascending: true });
      
      if (error) throw error;
      return data as Holiday[];
    },
    enabled: !!organizationId,
  });

  // Create/update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: HolidayFormData & { id?: string }) => {
      if (!organizationId || !data.holiday_date) throw new Error("Missing required data");
      
      const holidayData = {
        organization_id: organizationId,
        holiday_date: format(data.holiday_date, "yyyy-MM-dd"),
        name: data.name,
        description: data.description || null,
        is_recurring: data.is_recurring,
        created_by: user?.id,
      };

      if (data.id) {
        const { error } = await supabase
          .from("organization_holidays")
          .update(holidayData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("organization_holidays")
          .insert(holidayData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-holidays"] });
      setDialogOpen(false);
      setEditingHoliday(null);
      setFormData(initialFormData);
      toast({
        title: editingHoliday ? "Праздник обновлён" : "Праздник добавлен",
        description: "Нерабочий день успешно сохранён",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message.includes("duplicate") 
          ? "Эта дата уже добавлена как нерабочий день" 
          : error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("organization_holidays")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-holidays"] });
      toast({
        title: "Праздник удалён",
        description: "Нерабочий день успешно удалён",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка удаления",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (holiday?: Holiday) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setFormData({
        holiday_date: parseISO(holiday.holiday_date),
        name: holiday.name,
        description: holiday.description || "",
        is_recurring: holiday.is_recurring,
      });
    } else {
      setEditingHoliday(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.holiday_date || !formData.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните дату и название",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate({ ...formData, id: editingHoliday?.id });
  };

  // Separate holidays by type
  const thisYearHolidays = holidays.filter(h => 
    !h.is_recurring && isSameYear(parseISO(h.holiday_date), new Date())
  );
  const recurringHolidays = holidays.filter(h => h.is_recurring);
  const pastHolidays = holidays.filter(h => 
    !h.is_recurring && !isSameYear(parseISO(h.holiday_date), new Date())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Праздники и нерабочие дни</CardTitle>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingHoliday ? "Редактировать нерабочий день" : "Добавить нерабочий день"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Дата *</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.holiday_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {formData.holiday_date 
                          ? format(formData.holiday_date, "d MMMM yyyy", { locale: ru })
                          : "Выберите дату"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.holiday_date}
                        onSelect={(date) => {
                          setFormData(prev => ({ ...prev, holiday_date: date }));
                          setCalendarOpen(false);
                        }}
                        locale={ru}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Название *</Label>
                  <Input
                    placeholder="Например: Новый год"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea
                    placeholder="Дополнительная информация..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                  <div className="space-y-0.5">
                    <Label className="text-base">Ежегодный праздник</Label>
                    <p className="text-sm text-muted-foreground">
                      Повторяется каждый год в эту дату
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: checked }))}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setDialogOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Сохранить
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {holidays.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Праздничные и нерабочие дни не добавлены</p>
            <p className="text-sm">Добавьте даты, в которые нельзя планировать занятия</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recurring holidays */}
            {recurringHolidays.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Ежегодные праздники</h3>
                  <Badge variant="secondary">{recurringHolidays.length}</Badge>
                </div>
                <HolidayTable 
                  holidays={recurringHolidays} 
                  onEdit={handleOpenDialog}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isDeleting={deleteMutation.isPending}
                />
              </div>
            )}

            {/* This year holidays */}
            {thisYearHolidays.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Нерабочие дни {new Date().getFullYear()}</h3>
                  <Badge variant="secondary">{thisYearHolidays.length}</Badge>
                </div>
                <HolidayTable 
                  holidays={thisYearHolidays} 
                  onEdit={handleOpenDialog}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isDeleting={deleteMutation.isPending}
                />
              </div>
            )}

            {/* Past holidays (collapsible or hidden) */}
            {pastHolidays.length > 0 && (
              <div className="opacity-60">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-medium text-sm">Прошлые даты</h3>
                  <Badge variant="outline">{pastHolidays.length}</Badge>
                </div>
                <HolidayTable 
                  holidays={pastHolidays} 
                  onEdit={handleOpenDialog}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isDeleting={deleteMutation.isPending}
                  compact
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface HolidayTableProps {
  holidays: Holiday[];
  onEdit: (holiday: Holiday) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  compact?: boolean;
}

function HolidayTable({ holidays, onEdit, onDelete, isDeleting, compact }: HolidayTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Название</TableHead>
            {!compact && <TableHead>Описание</TableHead>}
            <TableHead className="w-[100px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holidays.map((holiday) => (
            <TableRow key={holiday.id}>
              <TableCell className="font-medium">
                {format(parseISO(holiday.holiday_date), "d MMMM", { locale: ru })}
                {!holiday.is_recurring && (
                  <span className="text-muted-foreground ml-1">
                    {format(parseISO(holiday.holiday_date), "yyyy")}
                  </span>
                )}
              </TableCell>
              <TableCell>{holiday.name}</TableCell>
              {!compact && (
                <TableCell className="text-muted-foreground text-sm">
                  {holiday.description || "—"}
                </TableCell>
              )}
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(holiday)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(holiday.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
