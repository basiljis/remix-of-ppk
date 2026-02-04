import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Calendar, Clock, Building2, User, Info, CheckCircle2, Search, X, MapPin, UserCircle, Briefcase, Filter } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { MOSCOW_DISTRICTS } from "@/constants/moscowDistricts";

interface BookConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentUserId: string;
  regionId: string | null;
  children: Array<{ id: string; full_name: string }>;
  preselectedSpecialistId?: string | null;
}

interface Organization {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
}

interface Specialist {
  id: string;
  full_name: string;
  organization_id: string | null;
  organization_name: string | null;
  is_private: boolean;
  position_id: string | null;
  position_name: string | null;
  avatar_url: string | null;
}

interface ConsultationSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  specialist: { full_name: string } | null;
  organization?: { name: string } | null;
}

type BookingMode = "organization" | "specialist";
type Step = "select" | "slot" | "confirm";

export function BookConsultationDialog({
  open,
  onOpenChange,
  parentUserId,
  regionId,
  children,
  preselectedSpecialistId,
}: BookConsultationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [bookingMode, setBookingMode] = useState<BookingMode>("organization");
  const [step, setStep] = useState<Step>("select");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [notes, setNotes] = useState("");
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [specialistSearchQuery, setSpecialistSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedPositionId, setSelectedPositionId] = useState<string>("all");

  // Handle preselected specialist - jump directly to slot selection
  useEffect(() => {
    if (open && preselectedSpecialistId) {
      setBookingMode("specialist");
      setSelectedSpecialistId(preselectedSpecialistId);
      setStep("slot");
    }
  }, [open, preselectedSpecialistId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Only reset if no preselected specialist (handled externally)
      if (!preselectedSpecialistId) {
        setStep("select");
        setSelectedOrgId("");
        setSelectedSpecialistId("");
        setSelectedSlotId("");
        setSelectedChildId("");
        setNotes("");
        setBookingMode("organization");
      }
    }
  }, [open, preselectedSpecialistId]);

  // Fetch positions for filter
  const { data: positions = [] } = useQuery({
    queryKey: ["positions-for-booking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Array<{ id: string; name: string }>;
    },
    enabled: open && bookingMode === "specialist",
  });

  // Fetch organizations in parent's region (only those allowing parent registration)
  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ["organizations-for-booking", regionId],
    queryFn: async () => {
      if (!regionId) return [];
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, address, district")
        .eq("region_id", regionId)
        .eq("is_archived", false)
        .eq("allow_parent_registration", true)
        .order("name");
      if (error) throw error;
      return data as Organization[];
    },
    enabled: !!regionId && open,
  });

  // Fetch all specialists (organization + private)
  const { data: specialists = [], isLoading: specialistsLoading } = useQuery({
    queryKey: ["specialists-for-booking", regionId],
    queryFn: async () => {
      if (!regionId) return [];
      
      // Fetch organization specialists (from organizations that allow registration)
      const { data: orgSpecialists, error: orgError } = await supabase
        .from("profiles")
        .select(`
          id, 
          full_name, 
          organization_id,
          position_id,
          avatar_url,
          position:positions(name),
          organization:organizations!profiles_organization_id_fkey(id, name, allow_parent_registration)
        `)
        .eq("region_id", regionId)
        .eq("is_blocked", false)
        .not("organization_id", "is", null);
      
      if (orgError) throw orgError;

      // Fetch private specialists
      const { data: privateSpecialists, error: privateError } = await supabase
        .from("profiles")
        .select(`
          id, 
          full_name,
          position_id,
          avatar_url,
          position:positions(name)
        `)
        .eq("region_id", regionId)
        .eq("is_blocked", false)
        .is("organization_id", null);
      
      if (privateError) throw privateError;

      // Combine and format
      const combined: Specialist[] = [];
      
      // Add org specialists (only from orgs that allow registration)
      (orgSpecialists || []).forEach((s: any) => {
        if (s.organization?.allow_parent_registration === true) {
          combined.push({
            id: s.id,
            full_name: s.full_name,
            organization_id: s.organization_id,
            organization_name: s.organization?.name || null,
            is_private: false,
            position_id: s.position_id || null,
            position_name: s.position?.name || null,
            avatar_url: s.avatar_url || null,
          });
        }
      });
      
      // Add private specialists
      (privateSpecialists || []).forEach((s: any) => {
        combined.push({
          id: s.id,
          full_name: s.full_name,
          organization_id: null,
          organization_name: null,
          is_private: true,
          position_id: s.position_id || null,
          position_name: s.position?.name || null,
          avatar_url: s.avatar_url || null,
        });
      });
      
      return combined;
    },
    enabled: !!regionId && open && bookingMode === "specialist",
  });

  // Get unique districts from organizations for the filter
  const availableDistricts = useMemo(() => {
    const districts = organizations
      .map(org => org.district)
      .filter((d): d is string => !!d && d.trim() !== "");
    return [...new Set(districts)].sort();
  }, [organizations]);

  // Check if region is Moscow (for showing district filter)
  const isMoscowRegion = useMemo(() => {
    return organizations.some(org => 
      MOSCOW_DISTRICTS.some(d => org.district?.includes(d.replace(" административный округ", "")))
    );
  }, [organizations]);

  // Filter organizations based on search and district
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      const matchesSearch = !searchQuery || 
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.address?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDistrict = selectedDistrict === "all" || 
        org.district === selectedDistrict;
      
      return matchesSearch && matchesDistrict;
    });
  }, [organizations, searchQuery, selectedDistrict]);

  // Filter specialists based on search and position
  const filteredSpecialists = useMemo(() => {
    return specialists.filter(s => {
      const matchesSearch = !specialistSearchQuery || 
        s.full_name.toLowerCase().includes(specialistSearchQuery.toLowerCase()) ||
        s.organization_name?.toLowerCase().includes(specialistSearchQuery.toLowerCase()) ||
        s.position_name?.toLowerCase().includes(specialistSearchQuery.toLowerCase());
      
      const matchesPosition = selectedPositionId === "all" || 
        s.position_id === selectedPositionId;
      
      return matchesSearch && matchesPosition;
    });
  }, [specialists, specialistSearchQuery, selectedPositionId]);

  // Get unique positions from specialists for the filter
  const availablePositions = useMemo(() => {
    const positionMap = new Map<string, string>();
    specialists.forEach(s => {
      if (s.position_id && s.position_name) {
        positionMap.set(s.position_id, s.position_name);
      }
    });
    return Array.from(positionMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [specialists]);

  // Fetch available slots for selected organization OR specialist
  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["consultation-slots-available", bookingMode, selectedOrgId, selectedSpecialistId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      let query = supabase
        .from("consultation_slots")
        .select(`
          id,
          slot_date,
          start_time,
          end_time,
          specialist:profiles!consultation_slots_specialist_id_fkey(full_name),
          organization:organizations(name)
        `)
        .eq("is_booked", false)
        .gte("slot_date", today)
        .order("slot_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (bookingMode === "organization" && selectedOrgId) {
        query = query.eq("organization_id", selectedOrgId);
      } else if (bookingMode === "specialist" && selectedSpecialistId) {
        query = query.eq("specialist_id", selectedSpecialistId);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: step === "slot" && ((bookingMode === "organization" && !!selectedOrgId) || (bookingMode === "specialist" && !!selectedSpecialistId)),
  });

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);
  const selectedSpecialist = specialists.find(s => s.id === selectedSpecialistId);
  const selectedSlot = slots.find((s: ConsultationSlot) => s.id === selectedSlotId) as ConsultationSlot | undefined;
  const selectedChild = children.find(c => c.id === selectedChildId);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlotId || !selectedChildId) {
        throw new Error("Выберите слот и ребёнка");
      }

      const { error } = await supabase
        .from("consultation_slots")
        .update({
          is_booked: true,
          booked_by_parent_id: parentUserId,
          booked_for_child_id: selectedChildId,
          booking_notes: notes.trim() || null,
          booked_at: new Date().toISOString(),
        })
        .eq("id", selectedSlotId)
        .eq("is_booked", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation-slots"] });
      queryClient.invalidateQueries({ queryKey: ["parent-booked-consultations"] });
      queryClient.invalidateQueries({ queryKey: ["parent-consultation-slots"] });
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
    setStep("select");
    setBookingMode("organization");
    setSelectedOrgId("");
    setSelectedSpecialistId("");
    setSelectedSlotId("");
    setSelectedChildId("");
    setNotes("");
    setSearchQuery("");
    setSpecialistSearchQuery("");
    setSelectedDistrict("all");
    setSelectedPositionId("all");
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step === "select") {
      if ((bookingMode === "organization" && selectedOrgId) || (bookingMode === "specialist" && selectedSpecialistId)) {
        setStep("slot");
      }
    } else if (step === "slot" && selectedSlotId && selectedChildId) {
      setStep("confirm");
    }
  };

  const handleBack = () => {
    if (step === "slot") {
      setStep("select");
      setSelectedSlotId("");
      setSelectedChildId("");
    } else if (step === "confirm") {
      setStep("slot");
    }
  };

  const handleModeChange = (mode: BookingMode) => {
    setBookingMode(mode);
    setSelectedOrgId("");
    setSelectedSpecialistId("");
    setSelectedSlotId("");
    setSearchQuery("");
    setSpecialistSearchQuery("");
    setSelectedDistrict("all");
    setSelectedPositionId("all");
  };

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!regionId) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
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
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-pink-600" />
            Запись на консультацию
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Выберите организацию или специалиста"}
            {step === "slot" && "Выберите удобное время и ребёнка"}
            {step === "confirm" && "Подтвердите запись"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4">
          {/* Step 1: Select Organization or Specialist */}
          {step === "select" && (
            <Tabs value={bookingMode} onValueChange={(v) => handleModeChange(v as BookingMode)} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                <TabsTrigger value="organization" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">В организацию</span>
                  <span className="sm:hidden">Организация</span>
                </TabsTrigger>
                <TabsTrigger value="specialist" className="gap-2">
                  <UserCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">К специалисту</span>
                  <span className="sm:hidden">Специалист</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="organization" className="flex-1 overflow-hidden mt-4">
                <div className="space-y-3 h-full flex flex-col">
                  {/* Search Input */}
                  <div className="relative flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск по названию или адресу..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* District Filter (only for Moscow) */}
                  {(isMoscowRegion || availableDistricts.length > 0) && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Все округа" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все округа</SelectItem>
                          {availableDistricts.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Organizations list */}
                  <ScrollArea className="flex-1">
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
                    ) : filteredOrganizations.length === 0 ? (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          По вашему запросу организации не найдены
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2 pr-4">
                        {filteredOrganizations.map((org) => (
                          <Card
                            key={org.id}
                            className={`p-3 cursor-pointer transition-colors ${
                              selectedOrgId === org.id 
                                ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20" 
                                : "hover:bg-muted"
                            }`}
                            onClick={() => setSelectedOrgId(org.id)}
                          >
                            <div className="flex items-start gap-3">
                              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{org.name}</p>
                                {org.address && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">{org.address}</p>
                                )}
                                {org.district && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {org.district}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Results count */}
                  {!orgsLoading && organizations.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center flex-shrink-0">
                      Показано {filteredOrganizations.length} из {organizations.length} организаций
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="specialist" className="flex-1 overflow-hidden mt-4">
                <div className="space-y-3 h-full flex flex-col">
                  {/* Search Input */}
                  <div className="relative flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск по ФИО или организации..."
                      value={specialistSearchQuery}
                      onChange={(e) => setSpecialistSearchQuery(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {specialistSearchQuery && (
                      <button
                        onClick={() => setSpecialistSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Position Filter */}
                  {availablePositions.length > 0 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Все специальности" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все специальности</SelectItem>
                          {availablePositions.map((position) => (
                            <SelectItem key={position.id} value={position.id}>
                              {position.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Specialists cards grid */}
                  <ScrollArea className="flex-1">
                    {specialistsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : specialists.length === 0 ? (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          В вашем регионе пока нет специалистов с доступными консультациями
                        </AlertDescription>
                      </Alert>
                    ) : filteredSpecialists.length === 0 ? (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          По вашему запросу специалисты не найдены
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
                        {filteredSpecialists.map((specialist) => (
                          <Card
                            key={specialist.id}
                            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                              selectedSpecialistId === specialist.id 
                                ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20 ring-2 ring-pink-500/20" 
                                : "hover:bg-muted/50"
                            }`}
                            onClick={() => setSelectedSpecialistId(specialist.id)}
                          >
                            <div className="flex flex-col items-center text-center gap-3">
                              <Avatar className="h-16 w-16 border-2 border-muted">
                                <AvatarImage 
                                  src={specialist.avatar_url || undefined} 
                                  alt={specialist.full_name}
                                />
                                <AvatarFallback className="text-lg bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700">
                                  {getInitials(specialist.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1 min-w-0 w-full">
                                <p className="font-semibold text-sm line-clamp-2">{specialist.full_name}</p>
                                {specialist.position_name && (
                                  <p className="text-xs text-muted-foreground">{specialist.position_name}</p>
                                )}
                                <div className="flex flex-wrap justify-center gap-1 mt-2">
                                  {specialist.is_private ? (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                      <Briefcase className="h-3 w-3" />
                                      Частная практика
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs gap-1 max-w-full">
                                      <Building2 className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{specialist.organization_name}</span>
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Results count */}
                  {!specialistsLoading && specialists.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center flex-shrink-0">
                      Показано {filteredSpecialists.length} из {specialists.length} специалистов
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
                      Нет доступных слотов. Попробуйте выбрать другую организацию или специалиста.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ScrollArea className="h-48">
                    <div className="space-y-2 pr-4">
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
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <div className="font-medium text-sm">
                                  {format(parseISO(slot.slot_date), "d MMM", { locale: ru })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(parseISO(slot.slot_date), "EEE", { locale: ru })}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-4 w-4" />
                                {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {slot.specialist && (
                                <Badge variant="outline" className="text-xs">
                                  {slot.specialist.full_name}
                                </Badge>
                              )}
                              {bookingMode === "specialist" && slot.organization && (
                                <Badge variant="secondary" className="text-xs">
                                  {slot.organization.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
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
                {bookingMode === "organization" && selectedOrg && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedOrg.name}</span>
                  </div>
                )}
                {bookingMode === "specialist" && selectedSpecialist && (
                  <div className="flex items-start gap-2">
                    <UserCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="font-medium">{selectedSpecialist.full_name}</span>
                      <div className="text-xs text-muted-foreground">
                        {selectedSpecialist.is_private ? "Частная практика" : selectedSpecialist.organization_name}
                      </div>
                    </div>
                  </div>
                )}
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

        <DialogFooter className="flex gap-2 flex-shrink-0 pt-4 border-t">
          {step !== "select" && (
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
                (step === "select" && bookingMode === "organization" && !selectedOrgId) ||
                (step === "select" && bookingMode === "specialist" && !selectedSpecialistId) ||
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
