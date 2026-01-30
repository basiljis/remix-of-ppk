import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, Clock, Building2, User, Info, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

interface BookConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentUserId: string;
  regionId: string | null;
  children: Array<{ id: string; full_name: string }>;
}

interface Organization {
  id: string;
  name: string;
  address: string | null;
}

interface ConsultationSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  specialist: { full_name: string } | null;
}

export function BookConsultationDialog({
  open,
  onOpenChange,
  parentUserId,
  regionId,
  children,
}: BookConsultationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"org" | "slot" | "confirm">("org");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Fetch organizations in parent's region
  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ["organizations-for-booking", regionId],
    queryFn: async () => {
      if (!regionId) return [];
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, address")
        .eq("region_id", regionId)
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return data as Organization[];
    },
    enabled: !!regionId && open,
  });

  // Fetch available slots for selected organization
  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["consultation-slots-available", selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("consultation_slots" as any)
        .select(`
          id,
          slot_date,
          start_time,
          end_time,
          specialist:profiles!consultation_slots_specialist_id_fkey(full_name)
        `)
        .eq("organization_id", selectedOrgId)
        .eq("is_booked", false)
        .gte("slot_date", today)
        .order("slot_date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!selectedOrgId && step !== "org",
  });

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);
  const selectedSlot = slots.find((s: ConsultationSlot) => s.id === selectedSlotId) as ConsultationSlot | undefined;
  const selectedChild = children.find(c => c.id === selectedChildId);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlotId || !selectedChildId) {
        throw new Error("Выберите слот и ребёнка");
      }

      const { error } = await supabase
        .from("consultation_slots" as any)
        .update({
          is_booked: true,
          booked_by_parent_id: parentUserId,
          booked_for_child_id: selectedChildId,
          booking_notes: notes.trim() || null,
          booked_at: new Date().toISOString(),
        } as any)
        .eq("id", selectedSlotId)
        .eq("is_booked", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation-slots"] });
      queryClient.invalidateQueries({ queryKey: ["parent-booked-consultations"] });
      toast({
        title: "Вы записаны!",
        description: `Консультация запланирована на ${format(parseISO(selectedSlot?.slot_date || ""), "d MMMM yyyy", { locale: ru })}`,
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка записи",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep("org");
    setSelectedOrgId("");
    setSelectedSlotId("");
    setSelectedChildId("");
    setNotes("");
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step === "org" && selectedOrgId) {
      setStep("slot");
    } else if (step === "slot" && selectedSlotId && selectedChildId) {
      setStep("confirm");
    }
  };

  const handleBack = () => {
    if (step === "slot") {
      setStep("org");
      setSelectedSlotId("");
      setSelectedChildId("");
    } else if (step === "confirm") {
      setStep("slot");
    }
  };

  if (!regionId) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Запись на консультацию</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              Для записи на консультацию укажите регион в профиле
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Запись на консультацию
          </DialogTitle>
          <DialogDescription>
            {step === "org" && "Выберите организацию в вашем регионе"}
            {step === "slot" && "Выберите удобное время и ребёнка"}
            {step === "confirm" && "Подтвердите запись"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Select Organization */}
          {step === "org" && (
            <div className="space-y-4">
              {orgsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : organizations.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    В вашем регионе пока нет организаций с доступными консультациями
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {organizations.map((org) => (
                    <Card
                      key={org.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedOrgId === org.id 
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20" 
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedOrgId(org.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{org.name}</p>
                          {org.address && (
                            <p className="text-sm text-muted-foreground">{org.address}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Slot and Child */}
          {step === "slot" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Выберите ребёнка</Label>
                <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите ребёнка" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Доступные слоты</Label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Нет доступных слотов. Попробуйте другую организацию.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {slots.map((slot: ConsultationSlot) => (
                      <Card
                        key={slot.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedSlotId === slot.id 
                            ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20" 
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedSlotId(slot.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div className="font-medium">
                                {format(parseISO(slot.slot_date), "d MMM", { locale: ru })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(parseISO(slot.slot_date), "EEEE", { locale: ru })}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-4 w-4" />
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </div>
                          </div>
                          {slot.specialist && (
                            <Badge variant="outline" className="text-xs">
                              {slot.specialist.full_name}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Комментарий (необязательно)</Label>
                <Textarea
                  placeholder="Опишите причину обращения..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === "confirm" && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Проверьте данные и подтвердите запись
                </AlertDescription>
              </Alert>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedOrg?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedSlot && format(parseISO(selectedSlot.slot_date), "d MMMM yyyy (EEEE)", { locale: ru })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedSlot?.start_time.slice(0, 5)} - {selectedSlot?.end_time.slice(0, 5)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Ребёнок: {selectedChild?.full_name}</span>
                </div>
                {notes && (
                  <div className="p-2 bg-muted rounded text-muted-foreground">
                    {notes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {step !== "org" && (
            <Button variant="outline" onClick={handleBack}>
              Назад
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          {step !== "confirm" ? (
            <Button 
              onClick={handleNext}
              disabled={
                (step === "org" && !selectedOrgId) ||
                (step === "slot" && (!selectedSlotId || !selectedChildId))
              }
              className="bg-pink-600 hover:bg-pink-700"
            >
              Далее
            </Button>
          ) : (
            <Button 
              onClick={() => bookMutation.mutate()}
              disabled={bookMutation.isPending}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {bookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Записаться
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
