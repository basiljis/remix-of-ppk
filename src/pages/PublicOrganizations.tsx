import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import LandingFooter from "@/components/LandingFooter";
import { ParentAuthModal } from "@/components/ParentAuthModal";
import { PublicNavbar, SearchNavBar } from "@/components/PublicNavbar";
import { Heart, Search, Building2, MapPin, Users, CalendarCheck, ArrowLeft, Loader2, Globe, Phone, Mail, MapPinned, ExternalLink, User, AlertCircle } from "lucide-react";
import { MOSCOW_DISTRICTS } from "@/constants/moscowDistricts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Moscow region ID in the database
const MOSCOW_REGION_ID = "77";

interface PublicOrganization {
  id: string;
  name: string;
  full_name: string | null;
  public_description: string | null;
  public_slug: string | null;
  logo_url: string | null;
  district: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  type: string | null;
  metro_station: string | null;
  region_id: string | null;
  employees_count?: number;
}

interface PublicEmployee {
  id: string;
  full_name: string;
  public_bio: string | null;
  public_photo_url: string | null;
  public_slug: string | null;
  position: { id: string; name: string } | null;
}

// Auto-detect region based on timezone
const detectUserRegion = (): string => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // If timezone is Europe/Moscow, default to Moscow region
    if (timezone === "Europe/Moscow") {
      return MOSCOW_REGION_ID;
    }
    // For other Russian timezones, could map to specific regions
    // For now, default to Moscow
    return MOSCOW_REGION_ID;
  } catch {
    return MOSCOW_REGION_ID;
  }
};

// Component for showing no slots available dialog with contact info
function NoSlotsDialog({ 
  open, 
  onOpenChange, 
  organizationId 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  organizationId: string;
}) {
  const { data: org } = useQuery({
    queryKey: ["org-contact", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("name, phone, email, address, website")
        .eq("id", organizationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!organizationId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Нет доступных слотов
          </DialogTitle>
          <DialogDescription>
            К сожалению, в данный момент нет доступных слотов для записи{org?.name ? ` в ${org.name}` : ""}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Вы можете связаться с организацией напрямую:
          </p>
          
          <div className="space-y-3">
            {org?.phone && (
              <a 
                href={`tel:${org.phone}`} 
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <Phone className="h-5 w-5 text-primary" />
                <span className="font-medium">{org.phone}</span>
              </a>
            )}
            {org?.email && (
              <a 
                href={`mailto:${org.email}`} 
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <Mail className="h-5 w-5 text-primary" />
                <span className="font-medium">{org.email}</span>
              </a>
            )}
            {org?.address && (
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-sm">{org.address}</span>
              </div>
            )}
            {org?.website && (
              <a 
                href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-5 w-5 text-primary" />
                <span className="font-medium">{org.website}</span>
              </a>
            )}
            {!org?.phone && !org?.email && !org?.address && !org?.website && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Контактные данные не указаны. Попробуйте позже.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PublicOrganizations() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>(() => detectUserRegion());
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingOrgId, setPendingOrgId] = useState<string | null>(null);
  const [showNoSlotsAlert, setShowNoSlotsAlert] = useState(false);

  // Fetch single organization by slug
  const { data: singleOrganization, isLoading: isLoadingSingle } = useQuery({
    queryKey: ["public-organization-slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from("organizations")
        .select(`
          id,
          name,
          full_name,
          public_description,
          public_slug,
          logo_url,
          district,
          address,
          phone,
          email,
          website,
          type,
          metro_station,
          region_id
        `)
        .eq("public_slug", slug)
        .eq("is_published", true)
        .eq("is_archived", false)
        .single();

      if (error) {
        console.error("Error fetching organization:", error);
        return null;
      }
      
      return data as PublicOrganization;
    },
    enabled: !!slug,
  });

  // Fetch employees for the organization
  const { data: employees = [] } = useQuery({
    queryKey: ["public-organization-employees", singleOrganization?.id],
    queryFn: async () => {
      if (!singleOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          public_bio,
          public_photo_url,
          public_slug,
          position:positions(id, name)
        `)
        .eq("organization_id", singleOrganization.id)
        .eq("is_published", true)
        .eq("is_blocked", false);

      if (error) throw error;
      return data as unknown as PublicEmployee[];
    },
    enabled: !!singleOrganization?.id,
  });

  // Fetch available consultation slots for the organization
  const { data: availableSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["public-organization-slots", singleOrganization?.id],
    queryFn: async () => {
      if (!singleOrganization?.id) return [];
      
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("consultation_slots")
        .select("id")
        .eq("organization_id", singleOrganization.id)
        .eq("is_booked", false)
        .gte("slot_date", today)
        .limit(1);

      if (error) throw error;
      return data || [];
    },
    enabled: !!singleOrganization?.id,
  });

  const hasAvailableSlots = availableSlots.length > 0;

  // Handle booking button click
  const handleBookingClick = (orgId: string) => {
    // Check slots and then decide action
    const checkAndBook = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("consultation_slots")
        .select("id")
        .eq("organization_id", orgId)
        .eq("is_booked", false)
        .gte("slot_date", today)
        .limit(1);

      if (data && data.length > 0) {
        // Has slots - show auth modal
        setPendingOrgId(orgId);
        setShowAuthModal(true);
      } else {
        // No slots - show alert
        setPendingOrgId(orgId);
        setShowNoSlotsAlert(true);
      }
    };
    checkAndBook();
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (pendingOrgId) {
      navigate(`/parent?booking=${pendingOrgId}`);
    } else {
      navigate("/parent");
    }
  };

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

  const { data: organizations, isLoading } = useQuery({
    queryKey: ["public-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select(`
          id,
          name,
          full_name,
          public_description,
          public_slug,
          logo_url,
          district,
          address,
          phone,
          email,
          website,
          type,
          metro_station,
          region_id
        `)
        .eq("is_published", true)
        .eq("is_archived", false);

      if (error) throw error;
      
      // Get employee counts for each organization
      const orgsWithCounts = await Promise.all(
        (data || []).map(async (org) => {
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", org.id)
            .eq("is_published", true)
            .eq("is_blocked", false);
          
          return { ...org, employees_count: count || 0 };
        })
      );
      
      return orgsWithCounts as PublicOrganization[];
    },
    enabled: !slug, // Only fetch list when not viewing single org
  });

  // Get unique types for filter
  const uniqueTypes = [...new Set(organizations?.map(o => o.type).filter(Boolean))].sort();

  // Filter organizations
  const filteredOrganizations = organizations?.filter(org => {
    const matchesSearch = !searchQuery || 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.public_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by region
    const matchesRegion = !selectedRegion || selectedRegion === "all" ||
      org.region_id === selectedRegion;
    
    // Filter by district (only for Moscow region)
    const matchesDistrict = selectedRegion !== MOSCOW_REGION_ID ||
      !selectedDistrict || 
      selectedDistrict === "all" ||
      org.district === selectedDistrict;
    
    const matchesType = !selectedType || selectedType === "all" ||
      org.type === selectedType;
    
    return matchesSearch && matchesRegion && matchesDistrict && matchesType;
  }) || [];

  const handleViewDetails = (orgId: string, slug: string | null) => {
    const target = slug ? `/o/${slug}` : `/organization/${orgId}`;
    navigate(target);
  };

  // If slug is provided, show single organization detail view
  if (slug) {
    if (isLoadingSingle) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!singleOrganization) {
      return (
        <div className="min-h-screen bg-background">
          <PublicNavbar currentPage="catalog-organizations" variant="full" showSecondaryNav={false} />
          <div className="pt-24 text-center py-20">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h1 className="text-2xl font-bold mb-2">Организация не найдена</h1>
            <p className="text-muted-foreground mb-6">Возможно, она была удалена или ещё не опубликована</p>
            <Link to="/organizations">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                К списку организаций
              </Button>
            </Link>
          </div>
          <LandingFooter />
        </div>
      );
    }

    // Single organization detail view
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <PublicNavbar currentPage="catalog-organizations" variant="full" showSecondaryNav={false} />

        {/* Organization Detail */}
        <section className="pt-24 pb-8 px-4">
          <div className="container mx-auto max-w-4xl">
            <Link to="/organizations" className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors mb-6">
              <ArrowLeft className="h-4 w-4" />
              К списку организаций
            </Link>

            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {singleOrganization.logo_url ? (
                  <img 
                    src={singleOrganization.logo_url} 
                    alt={singleOrganization.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {singleOrganization.full_name || singleOrganization.name}
                </h1>
                
                {singleOrganization.type && (
                  <Badge variant="secondary" className="mb-4">
                    {singleOrganization.type}
                  </Badge>
                )}
                
                {singleOrganization.public_description && (
                  <p className="text-muted-foreground mb-4">
                    {singleOrganization.public_description}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Контактная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Region/City */}
                {singleOrganization.region_id && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {regions.find(r => r.id === singleOrganization.region_id)?.name || "Россия"}
                      </p>
                      {singleOrganization.district && (
                        <p className="text-sm text-muted-foreground">{singleOrganization.district}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Address */}
                {singleOrganization.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{singleOrganization.address}</p>
                      {singleOrganization.metro_station && (
                        <p className="text-sm text-muted-foreground">м. {singleOrganization.metro_station}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {singleOrganization.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <a href={`tel:${singleOrganization.phone}`} className="hover:text-primary transition-colors">
                      {singleOrganization.phone}
                    </a>
                  </div>
                )}
                
                {singleOrganization.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <a href={`mailto:${singleOrganization.email}`} className="hover:text-primary transition-colors">
                      {singleOrganization.email}
                    </a>
                  </div>
                )}
                
                {singleOrganization.website && (
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    <a 
                      href={singleOrganization.website.startsWith('http') ? singleOrganization.website : `https://${singleOrganization.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {singleOrganization.website}
                    </a>
                  </div>
                )}

                {/* Show message if no contact info at all */}
                {!singleOrganization.region_id && !singleOrganization.address && !singleOrganization.phone && !singleOrganization.email && !singleOrganization.website && (
                  <p className="text-muted-foreground text-sm">Контактная информация не указана</p>
                )}
              </CardContent>
            </Card>

            {/* Employees */}
            {employees.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">
                  Наши специалисты ({employees.length})
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((employee) => (
                    <Card key={employee.id} className="hover:shadow-md transition-all">
                      <CardContent className="pt-6 pb-4">
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
                            {employee.public_photo_url ? (
                              <img 
                                src={employee.public_photo_url} 
                                alt={employee.full_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium leading-tight">{employee.full_name}</p>
                            {employee.position?.name && (
                              <p className="text-sm text-muted-foreground">{employee.position.name}</p>
                            )}
                          </div>
                        </div>
                        {employee.public_bio && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2 text-center">
                            {employee.public_bio}
                          </p>
                        )}
                        {employee.public_slug && (
                          <Link to={`/s/${employee.public_slug}`} className="mt-4 block">
                            <Button variant="outline" size="sm" className="w-full">
                              Подробнее
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* CTA or No Slots Alert */}
            {slotsLoading ? (
              <div className="flex justify-center">
                <Button size="lg" disabled className="gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Проверяем доступность...
                </Button>
              </div>
            ) : hasAvailableSlots ? (
              <div className="flex justify-center">
                <Button 
                  size="lg"
                  className="gap-2"
                  onClick={() => handleBookingClick(singleOrganization.id)}
                >
                  <CalendarCheck className="h-5 w-5" />
                  Записаться на консультацию
                </Button>
              </div>
            ) : (
              <Alert className="max-w-xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Нет доступных слотов</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>
                    К сожалению, в данный момент нет доступных слотов для записи. 
                    Вы можете связаться с организацией напрямую:
                  </p>
                  <div className="flex flex-col gap-2 pt-2">
                    {singleOrganization.phone && (
                      <a 
                        href={`tel:${singleOrganization.phone}`} 
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Phone className="h-4 w-4" />
                        {singleOrganization.phone}
                      </a>
                    )}
                    {singleOrganization.email && (
                      <a 
                        href={`mailto:${singleOrganization.email}`} 
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        {singleOrganization.email}
                      </a>
                    )}
                    {!singleOrganization.phone && !singleOrganization.email && (
                      <p className="text-muted-foreground text-sm">
                        Контактные данные не указаны. Попробуйте позже.
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </section>

        {/* Auth Modal */}
        <ParentAuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          onSuccess={handleAuthSuccess}
          specialistName={singleOrganization?.name}
        />

        <LandingFooter />
      </div>
    );
  }

  // Organizations list view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PublicNavbar currentPage="catalog-organizations" variant="full" showSecondaryNav={false} />

      {/* Secondary nav bar with search links */}
      <SearchNavBar currentPage="organizations" />
      <section className="pt-32 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Организации
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Школы, детские сады и ППМС-центры с квалифицированными специалистами
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 pb-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию или адресу..."
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
                <SelectItem value="all">Все регионы</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* District filter - only for Moscow region */}
            {selectedRegion === MOSCOW_REGION_ID && (
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
            
            <Select value={selectedType || ""} onValueChange={(v) => setSelectedType(v || null)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Тип организации" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type!}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Organizations Grid */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-6xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Организации не найдены</p>
              <p className="text-sm">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Найдено: {filteredOrganizations.length} организаци{filteredOrganizations.length === 1 ? 'я' : filteredOrganizations.length < 5 ? 'и' : 'й'}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrganizations.map((org) => (
                  <Card key={org.id} className="overflow-hidden hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {org.logo_url ? (
                            <img 
                              src={org.logo_url} 
                              alt={org.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-7 w-7 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2">{org.name}</CardTitle>
                          {org.type && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {org.type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {org.public_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {org.public_description}
                        </p>
                      )}
                      
                      {org.district && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>{org.district}</span>
                          {org.metro_station && (
                            <span className="text-xs">• м. {org.metro_station}</span>
                          )}
                        </div>
                      )}
                      
                      {org.address && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {org.address}
                        </p>
                      )}
                      
                      {org.employees_count && org.employees_count > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{org.employees_count} специалист{org.employees_count === 1 ? '' : org.employees_count < 5 ? 'а' : 'ов'}</span>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => handleViewDetails(org.id, org.public_slug)}
                        >
                          Подробнее
                        </Button>
                        <Button 
                          className="flex-1 gap-2"
                          onClick={() => handleBookingClick(org.id)}
                        >
                          <CalendarCheck className="h-4 w-4" />
                          Записаться
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Auth Modal */}
      <ParentAuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={handleAuthSuccess}
      />

      {/* No Slots Dialog */}
      {showNoSlotsAlert && pendingOrgId && (
        <NoSlotsDialog
          open={showNoSlotsAlert}
          onOpenChange={setShowNoSlotsAlert}
          organizationId={pendingOrgId}
        />
      )}

      <LandingFooter />
    </div>
  );
}
