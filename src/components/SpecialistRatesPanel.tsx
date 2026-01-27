import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Pencil, Save } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface Specialist {
  id: string;
  full_name: string;
  email: string;
  positions: { name: string } | null;
  rate?: number;
  rate_notes?: string;
}

export function SpecialistRatesPanel() {
  const { profile, isAdmin, roles } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  const [rate, setRate] = useState(1.0);
  const [notes, setNotes] = useState("");

  const isOrgAdmin = roles.some((r) => r.role === "organization_admin");
  const organizationId = profile?.organization_id;

  const { data: specialists = [], isLoading } = useQuery({
    queryKey: ["specialists-with-rates", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      // Get all specialists in this organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          positions (name)
        `)
        .eq("organization_id", organizationId);
      
      if (profilesError) throw profilesError;

      // Get their rates
      const { data: rates, error: ratesError } = await supabase
        .from("specialist_rates")
        .select("user_id, rate, notes")
        .eq("organization_id", organizationId);

      if (ratesError) throw ratesError;

      const ratesMap = new Map(
        rates?.map((r) => [r.user_id, { rate: r.rate, notes: r.notes }])
      );

      return profiles?.map((p) => ({
        ...p,
        rate: ratesMap.get(p.id)?.rate ?? 1.0,
        rate_notes: ratesMap.get(p.id)?.notes ?? "",
      })) as Specialist[];
    },
    enabled: !!(organizationId && (isAdmin || isOrgAdmin)),
  });

  const rateMutation = useMutation({
    mutationFn: async ({
      userId,
      rate,
      notes,
    }: {
      userId: string;
      rate: number;
      notes: string;
    }) => {
      const { error } = await supabase.from("specialist_rates").upsert(
        {
          user_id: userId,
          organization_id: organizationId,
          rate,
          notes,
          set_by: profile?.id,
        },
        { onConflict: "user_id,organization_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialists-with-rates"] });
      setEditingSpecialist(null);
      toast({
        title: "Успешно",
        description: "Ставка специалиста обновлена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (specialist: Specialist) => {
    setEditingSpecialist(specialist);
    setRate(specialist.rate || 1.0);
    setNotes(specialist.rate_notes || "");
  };

  const handleSave = () => {
    if (!editingSpecialist) return;
    rateMutation.mutate({
      userId: editingSpecialist.id,
      rate,
      notes,
    });
  };

  if (!isAdmin && !isOrgAdmin) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          У вас нет доступа к управлению ставками специалистов
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Управление ставками специалистов
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО специалиста</TableHead>
                <TableHead>Должность</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Ставка</TableHead>
                <TableHead>Примечание</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : specialists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Нет специалистов в организации
                  </TableCell>
                </TableRow>
              ) : (
                specialists.map((specialist) => (
                  <TableRow key={specialist.id}>
                    <TableCell className="font-medium">
                      {specialist.full_name}
                    </TableCell>
                    <TableCell>
                      {specialist.positions?.name || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {specialist.email}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        {specialist.rate?.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {specialist.rate_notes || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(specialist)}
                        aria-label="Редактировать ставку специалиста"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog
        open={!!editingSpecialist}
        onOpenChange={(open) => !open && setEditingSpecialist(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменение ставки</DialogTitle>
          </DialogHeader>
          {editingSpecialist && (
            <div className="space-y-4 py-4">
              <div>
                <p className="font-medium">{editingSpecialist.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {editingSpecialist.positions?.name || "Должность не указана"}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Ставка</Label>
                  <span className="font-mono text-lg font-semibold">
                    {rate.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[rate]}
                  onValueChange={([v]) => setRate(v)}
                  min={0.25}
                  max={2.0}
                  step={0.25}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.25</span>
                  <span>0.5</span>
                  <span>0.75</span>
                  <span>1.0</span>
                  <span>1.25</span>
                  <span>1.5</span>
                  <span>1.75</span>
                  <span>2.0</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate_notes">Примечание</Label>
                <Textarea
                  id="rate_notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Основание для установки ставки..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSpecialist(null)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={rateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}