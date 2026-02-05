import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import LandingFooter from "@/components/LandingFooter";
import { ParentAuthModal } from "@/components/ParentAuthModal";
import { PublicNavbar, SearchNavBar } from "@/components/PublicNavbar";
import { Heart, Search, User, MapPin, Briefcase, GraduationCap, CalendarCheck, ArrowLeft, Loader2, Building2, Wallet, Clock, MapPinned, Globe, Monitor } from "lucide-react";
import { MOSCOW_DISTRICTS } from "@/constants/moscowDistricts";
import { useAuth } from "@/hooks/useAuth";

// Specialist positions that should be shown in public filter
const SPECIALIST_POSITION_NAMES = [
  "Педагог-психолог",
  "Учитель-логопед",
  "Дефектолог/Тифлопедагог/Сурдопедагог",
  "Социальный педагог",
  "Специалист адаптивной физической культуры",
];

// Moscow region ID in the database
const MOSCOW_REGION_ID = "77";

interface SessionPackage {
  sessions: number;
  price: number;
  discount?: number;
}

interface PublicProfile {
  id: string;
  full_name: string;
  public_bio: string | null;
  public_photo_url: string | null;
  public_slug: string | null;
  work_experience: string | null;
  education: string | null;
  achievements: string | null;
  specializations: string[] | null;
  is_private_practice: boolean;
  consultation_price: number | null;
  consultation_duration: number | null;
  session_packages: SessionPackage[] | null;
  work_format: string | null;
  work_district: string | null;
  position_id: string | null;
  position: { id: string; name: string } | null;
  organization: { id: string; name: string; district: string | null; public_slug: string | null } | null;
}

export default function PublicSpecialists() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [workFormat, setWorkFormat] = useState<"online" | "offline">("offline");
  const [selectedRegion, setSelectedRegion] = useState<string>(MOSCOW_REGION_ID);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  
  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState<{ id: string; name: string; slug: string | null } | null>(null);

  // Fetch regions from database
  const { data: regions = [] } = useQuery({
    queryKey: ["public-regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch positions from database (only specialist positions)
  const { data: positions = [] } = useQuery({
    queryKey: ["public-positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("id, name")
        .in("name", SPECIALIST_POSITION_NAMES)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: specialists, isLoading } = useQuery({
    queryKey: ["public-specialists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          public_bio,
          public_photo_url,
          public_slug,
          work_experience,
          education,
          achievements,
          specializations,
          is_private_practice,
          consultation_price,
          consultation_duration,
          session_packages,
          work_format,
          work_district,
          position_id,
          position:positions(id, name),
          organization:organizations(id, name, district, public_slug)
        `)
        .eq("is_published", true)
        .eq("is_blocked", false);

      if (error) throw error;
      return data as unknown as PublicProfile[];
    },
  });

  // Fetch available slots count for each specialist
  const { data: slotsData = {} } = useQuery({
    queryKey: ["public-specialists-slots"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("consultation_slots")
        .select("specialist_id")
        .eq("is_booked", false)
        .gte("slot_date", today);

      if (error) throw error;
      
      // Count slots per specialist
      const counts: Record<string, number> = {};
      data?.forEach(slot => {
        counts[slot.specialist_id] = (counts[slot.specialist_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Filter specialists
  const filteredSpecialists = useMemo(() => {
    return specialists?.filter(specialist => {
      const matchesSearch = !searchQuery || 
        specialist.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        specialist.public_bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        specialist.position?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by work format
      const specFormat = specialist.work_format || "offline";
      const matchesWorkFormat = 
        specFormat === "both" || 
        specFormat === workFormat;
      
      // Filter by district (only for offline mode and Moscow region)
      const matchesDistrict = workFormat === "online" || 
        !selectedDistrict || 
        selectedDistrict === "all" ||
        specialist.work_district === selectedDistrict ||
        specialist.organization?.district === selectedDistrict;
      
      // Match by position ID
      const matchesPosition = !selectedPosition || selectedPosition === "all" ||
        specialist.position_id === selectedPosition;
      
      return matchesSearch && matchesWorkFormat && matchesDistrict && matchesPosition;
    }) || [];
  }, [specialists, searchQuery, workFormat, selectedDistrict, selectedPosition]);

  const handleBooking = (specialist: PublicProfile) => {
    // Check if user is already authenticated as parent
    if (user) {
      // Check if user has parent role - redirect to booking
      const target = specialist.public_slug ? `/s/${specialist.public_slug}` : `/specialist/${specialist.id}`;
      navigate(`/parent?book=${encodeURIComponent(target)}&specialist=${specialist.id}`);
    } else {
      // Show auth modal
      setSelectedSpecialist({
        id: specialist.id,
        name: specialist.full_name,
        slug: specialist.public_slug,
      });
      setAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    if (selectedSpecialist) {
      // Redirect to parent dashboard with booking intent
      navigate(`/parent?book=true&specialist=${selectedSpecialist.id}`);
    } else {
      navigate("/parent");
    }
  };

  const getSlotStatus = (specialistId: string, workFormat: string | null) => {
    const slotCount = slotsData[specialistId] || 0;
    const format = workFormat || "offline";
    
    if (slotCount === 0) {
      return {
        hasSlots: false,
        label: "Нет свободных слотов",
        tooltip: format === "online" 
          ? "У специалиста пока нет свободных слотов для онлайн-записи" 
          : "У специалиста пока нет свободных слотов для очной записи",
      };
    }
    
    return {
      hasSlots: true,
      label: `${slotCount} ${slotCount === 1 ? 'слот' : slotCount < 5 ? 'слота' : 'слотов'}`,
      tooltip: null,
    };
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <PublicNavbar currentPage="catalog-specialists" variant="minimal" showSecondaryNav={false} />

        {/* Secondary nav bar with search links */}
        <SearchNavBar currentPage="specialists" />
        <section className="pt-32 pb-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors mb-6">
              <ArrowLeft className="h-4 w-4" />
              На главную
            </Link>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Найти специалиста
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Психологи, логопеды, дефектологи и другие специалисты для развития вашего ребёнка
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="px-4 pb-8">
          <div className="container mx-auto max-w-6xl">
            {/* Work Format Toggle */}
            <div className="mb-4">
              <Tabs value={workFormat} onValueChange={(v) => setWorkFormat(v as "online" | "offline")}>
                <TabsList className="grid w-full max-w-[300px] grid-cols-2">
                  <TabsTrigger value="offline" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Офлайн
                  </TabsTrigger>
                  <TabsTrigger value="online" className="gap-2">
                    <Monitor className="h-4 w-4" />
                    Онлайн
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени или должности..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Region filter */}
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Регион" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* District filter - only for offline mode and Moscow region */}
              {workFormat === "offline" && selectedRegion === MOSCOW_REGION_ID && (
                <Select value={selectedDistrict || ""} onValueChange={(v) => setSelectedDistrict(v || null)}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <div className="flex items-center gap-2">
                      <MapPinned className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Округ Москвы" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все округа</SelectItem>
                    {MOSCOW_DISTRICTS.map(district => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Select value={selectedPosition || ""} onValueChange={(v) => setSelectedPosition(v || null)}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Специалист" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все специалисты</SelectItem>
                  {positions.map(pos => (
                    <SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Specialists Grid */}
        <section className="px-4 pb-20">
          <div className="container mx-auto max-w-6xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSpecialists.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Специалисты не найдены</p>
                <p className="text-sm">Попробуйте изменить параметры поиска</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Найдено: {filteredSpecialists.length} специалист{filteredSpecialists.length === 1 ? '' : filteredSpecialists.length < 5 ? 'а' : 'ов'}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSpecialists.map((specialist) => {
                    const slotStatus = getSlotStatus(specialist.id, specialist.work_format);
                    
                    return (
                      <Card key={specialist.id} className="overflow-hidden hover:shadow-lg transition-all group">
                        <CardHeader className="pb-4 pt-6">
                          {/* Photo centered at top */}
                          <div className="flex justify-center mb-4">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                              {specialist.public_photo_url ? (
                                <img 
                                  src={specialist.public_photo_url} 
                                  alt={specialist.full_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-10 w-10 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          {/* Name and position centered */}
                          <div className="text-center space-y-2">
                            <CardTitle className="text-lg leading-tight">{specialist.full_name}</CardTitle>
                            <CardDescription className="flex items-center justify-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{specialist.position?.name || "Специалист"}</span>
                            </CardDescription>
                            {specialist.is_private_practice ? (
                              <Badge variant="secondary" className="text-xs">
                                Частная практика
                              </Badge>
                            ) : specialist.organization?.name && (
                              <Link 
                                to={specialist.organization.public_slug ? `/o/${specialist.organization.public_slug}` : `/organizations`}
                                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground px-2 hover:text-primary transition-colors"
                              >
                                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="text-center underline-offset-2 hover:underline">{specialist.organization.name}</span>
                              </Link>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {specialist.specializations && specialist.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {specialist.specializations.slice(0, 3).map((spec) => (
                                <Badge key={spec} variant="outline" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                              {specialist.specializations.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{specialist.specializations.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {specialist.public_bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {specialist.public_bio}
                            </p>
                          )}
                          
                          {specialist.work_experience && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <GraduationCap className="h-4 w-4" />
                              <span className="line-clamp-1">{specialist.work_experience}</span>
                            </div>
                          )}
                          
                          {specialist.organization?.district && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{specialist.organization.district}</span>
                            </div>
                          )}

                          {/* Pricing info for private practice */}
                          {specialist.is_private_practice && specialist.consultation_price && (
                            <div className="pt-2 mt-2 border-t space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Wallet className="h-3.5 w-3.5" />
                                  Консультация
                                </span>
                                <span className="font-semibold text-primary">
                                  {specialist.consultation_price.toLocaleString('ru-RU')} ₽
                                </span>
                              </div>
                              {specialist.consultation_duration && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {specialist.consultation_duration} мин
                                </div>
                              )}
                              {specialist.session_packages && specialist.session_packages.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {specialist.session_packages.map((pkg, i) => (
                                    <span key={i}>
                                      {i > 0 && ' • '}
                                      {pkg.sessions} сес. — {pkg.price.toLocaleString('ru-RU')} ₽
                                      {pkg.discount ? ` (-${pkg.discount}%)` : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Booking button with slot status */}
                          <div className="mt-4 space-y-2">
                            {slotStatus.hasSlots ? (
                              <>
                                <Button 
                                  className="w-full gap-2"
                                  onClick={() => handleBooking(specialist)}
                                >
                                  <CalendarCheck className="h-4 w-4" />
                                  Записаться
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                  Доступно: {slotStatus.label}
                                </p>
                              </>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Button 
                                      className="w-full gap-2"
                                      variant="secondary"
                                      disabled
                                    >
                                      <CalendarCheck className="h-4 w-4" />
                                      Записаться
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground mt-2">
                                      {slotStatus.label}
                                    </p>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{slotStatus.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        <LandingFooter />

        {/* Auth Modal */}
        <ParentAuthModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          onSuccess={handleAuthSuccess}
          specialistName={selectedSpecialist?.name}
        />
      </div>
    </TooltipProvider>
  );
}
