import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import LandingFooter from "@/components/LandingFooter";
import { Heart, Search, Building2, MapPin, Users, CalendarCheck, ArrowLeft, Loader2, Globe, Phone, Mail, MapPinned } from "lucide-react";
import { MOSCOW_DISTRICTS } from "@/constants/moscowDistricts";

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
  employees_count?: number;
}

// Auto-detect region from browser/IP (returns district name if in Moscow)
const detectUserRegion = async (): Promise<string | null> => {
  try {
    // Try to get approximate location from timezone or IP
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === "Europe/Moscow") {
      return null; // In Moscow but can't determine district
    }
    return null;
  } catch {
    return null;
  }
};

export default function PublicOrganizations() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Try to auto-detect region on mount
  useEffect(() => {
    const autoDetect = async () => {
      setIsAutoDetecting(true);
      const detectedRegion = await detectUserRegion();
      if (detectedRegion) {
        setSelectedDistrict(detectedRegion);
      }
      setIsAutoDetecting(false);
    };
    autoDetect();
  }, []);

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
          metro_station
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
    
    const matchesDistrict = !selectedDistrict || selectedDistrict === "all" ||
      org.district === selectedDistrict;
    
    const matchesType = !selectedType || selectedType === "all" ||
      org.type === selectedType;
    
    return matchesSearch && matchesDistrict && matchesType;
  }) || [];

  const handleViewDetails = (orgId: string, slug: string | null) => {
    const target = slug ? `/o/${slug}` : `/organization/${orgId}`;
    navigate(target);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">universum.</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/specialists" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Специалисты
            </Link>
            <Link to="/organizations" className="text-sm text-foreground font-medium">
              Организации
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/parent-auth">
              <Button variant="outline" size="sm">Вход для родителей</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию или адресу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedDistrict || ""} onValueChange={(v) => setSelectedDistrict(v || null)}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <div className="flex items-center gap-2">
                  {isAutoDetecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MapPinned className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
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
                      
                      {org.employees_count > 0 && (
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
                          onClick={() => navigate(`/parent-auth?redirect=/organizations/${org.id}`)}
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

      <LandingFooter />
    </div>
  );
}
