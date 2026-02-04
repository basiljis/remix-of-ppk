import { useState } from "react";
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
import { Heart, Search, User, MapPin, Briefcase, GraduationCap, CalendarCheck, ArrowLeft, Loader2, Building2 } from "lucide-react";
import { MOSCOW_DISTRICTS } from "@/constants/moscowDistricts";

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
  position: { name: string } | null;
  organization: { name: string; district: string | null } | null;
}

export default function PublicSpecialists() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);

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
          position:positions(name),
          organization:organizations(name, district)
        `)
        .eq("is_published", true)
        .eq("is_blocked", false);

      if (error) throw error;
      return data as PublicProfile[];
    },
  });

  // Get unique specializations for filter
  const allSpecializations = specialists?.flatMap(s => s.specializations || []) || [];
  const uniqueSpecializations = [...new Set(allSpecializations)].filter(Boolean).sort();

  // Filter specialists
  const filteredSpecialists = specialists?.filter(specialist => {
    const matchesSearch = !searchQuery || 
      specialist.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialist.public_bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialist.specializations?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDistrict = !selectedDistrict || selectedDistrict === "all" ||
      specialist.organization?.district === selectedDistrict ||
      (selectedDistrict === "private" && specialist.is_private_practice);
    
    const matchesSpecialization = !selectedSpecialization || selectedSpecialization === "all" ||
      specialist.specializations?.includes(selectedSpecialization);
    
    return matchesSearch && matchesDistrict && matchesSpecialization;
  }) || [];

  const handleBooking = (specialistId: string, slug: string | null) => {
    // Navigate to parent auth with redirect to booking
    const target = slug ? `/s/${slug}` : `/specialist/${specialistId}`;
    navigate(`/parent-auth?redirect=${encodeURIComponent(target)}`);
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
            <Link to="/specialists" className="text-sm text-foreground font-medium">
              Специалисты
            </Link>
            <Link to="/organizations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени или специализации..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedDistrict || ""} onValueChange={(v) => setSelectedDistrict(v || null)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Округ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все округа</SelectItem>
                <SelectItem value="private">Частная практика</SelectItem>
                {MOSCOW_DISTRICTS.map(district => (
                  <SelectItem key={district} value={district}>{district}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSpecialization || ""} onValueChange={(v) => setSelectedSpecialization(v || null)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Специализация" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все специализации</SelectItem>
                {uniqueSpecializations.map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
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
                {filteredSpecialists.map((specialist) => (
                  <Card key={specialist.id} className="overflow-hidden hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {specialist.public_photo_url ? (
                            <img 
                              src={specialist.public_photo_url} 
                              alt={specialist.full_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{specialist.full_name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Briefcase className="h-3 w-3" />
                            {specialist.position?.name || "Специалист"}
                          </CardDescription>
                          {specialist.is_private_practice ? (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              Частная практика
                            </Badge>
                          ) : specialist.organization?.name && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate">{specialist.organization.name}</span>
                            </div>
                          )}
                        </div>
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
                      
                      <Button 
                        className="w-full mt-4 gap-2"
                        onClick={() => handleBooking(specialist.id, specialist.public_slug)}
                      >
                        <CalendarCheck className="h-4 w-4" />
                        Записаться
                      </Button>
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
