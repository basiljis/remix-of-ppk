import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import LandingFooter from "@/components/LandingFooter";
import { ParentAuthModal } from "@/components/ParentAuthModal";
import { PublicNavbar } from "@/components/PublicNavbar";
import {
  User, ArrowLeft, Loader2, Briefcase, GraduationCap, Award, MapPin,
  CalendarCheck, Building2, Wallet, Clock, Globe, Monitor, Package, Target, ZoomIn,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDirectionBySlug } from "@/constants/workDirections";

interface SessionPackage {
  sessions: number;
  price: number;
  discount?: number;
}

interface EducationEntry {
  institution: string;
  degree: string;
  speciality: string;
  year: string;
}

interface SpecialistProfile {
  id: string;
  full_name: string;
  public_bio: string | null;
  public_photo_url: string | null;
  public_slug: string | null;
  work_experience: string | null;
  education: string | null;
  education_entries: EducationEntry[] | null;
  achievements: string | null;
  certificate_images: string[] | null;
  specializations: string[] | null;
  work_directions: string[] | null;
  is_private_practice: boolean;
  show_pricing: boolean | null;
  consultation_price: number | null;
  consultation_duration: number | null;
  session_packages: SessionPackage[] | null;
  work_format: string | null;
  work_district: string | null;
  position: { id: string; name: string } | null;
  organization: { id: string; name: string; district: string | null; public_slug: string | null } | null;
}

export default function SpecialistDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: specialist, isLoading } = useQuery({
    queryKey: ["specialist-detail", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, full_name, public_bio, public_photo_url, public_slug,
          work_experience, education, education_entries, achievements,
          certificate_images,
          specializations, work_directions, is_private_practice, show_pricing,
          consultation_price, consultation_duration, session_packages,
          work_format, work_district,
          position:positions(id, name),
          organization:organizations(id, name, district, public_slug)
        `)
        .eq("public_slug", slug)
        .eq("is_published", true)
        .eq("is_blocked", false)
        .single();

      if (error) return null;
      return data as unknown as SpecialistProfile;
    },
    enabled: !!slug,
  });

  const { data: slotsCount = 0 } = useQuery({
    queryKey: ["specialist-slots-count", specialist?.id],
    queryFn: async () => {
      if (!specialist?.id) return 0;
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("consultation_slots")
        .select("*", { count: "exact", head: true })
        .eq("specialist_id", specialist.id)
        .eq("is_booked", false)
        .gte("slot_date", today);
      return count || 0;
    },
    enabled: !!specialist?.id,
  });

  const handleBooking = () => {
    if (user) {
      navigate(`/parent?book=true&specialist=${specialist?.id}`);
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    navigate(`/parent?book=true&specialist=${specialist?.id}`);
  };

  const educationEntries: EducationEntry[] = (() => {
    if (specialist?.education_entries && Array.isArray(specialist.education_entries) && specialist.education_entries.length > 0) {
      return specialist.education_entries;
    }
    return [];
  })();

  const workFormatLabel = (format: string | null) => {
    switch (format) {
      case "online": return "Онлайн";
      case "offline": return "Офлайн";
      case "both": return "Онлайн и офлайн";
      default: return "Офлайн";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar currentPage="catalog-specialists" />
        <div className="pt-32 text-center py-20">
          <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Специалист не найден</h1>
          <p className="text-muted-foreground mb-6">Возможно, профиль был удалён или ещё не опубликован</p>
          <Link to="/specialists">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              К списку специалистов
            </Button>
          </Link>
        </div>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar currentPage="catalog-specialists" />

      <section className="pt-32 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link
            to="/specialists"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            К списку специалистов
          </Link>

          {/* Header: photo + basic info */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="h-32 w-32 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
              {specialist.public_photo_url ? (
                <img
                  src={specialist.public_photo_url}
                  alt={specialist.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{specialist.full_name}</h1>

              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Briefcase className="h-4 w-4" />
                <span>{specialist.position?.name || "Специалист"}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {specialist.is_private_practice ? (
                  <Badge variant="secondary">Частная практика</Badge>
                ) : specialist.organization?.name ? (
                  <Link
                    to={specialist.organization.public_slug ? `/o/${specialist.organization.public_slug}` : "/organizations"}
                    className="inline-flex"
                  >
                    <Badge variant="outline" className="gap-1 hover:bg-accent cursor-pointer">
                      <Building2 className="h-3 w-3" />
                      {specialist.organization.name}
                    </Badge>
                  </Link>
                ) : null}

                <Badge variant="outline" className="gap-1">
                  {specialist.work_format === "online" ? (
                    <Monitor className="h-3 w-3" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  {workFormatLabel(specialist.work_format)}
                </Badge>

                {specialist.work_district && specialist.work_format !== "online" && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {specialist.work_district}
                  </Badge>
                )}
              </div>

              {specialist.specializations && specialist.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {specialist.specializations.map((spec) => (
                    <Badge key={spec} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Work directions */}
              {specialist.work_directions && specialist.work_directions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {specialist.work_directions.map((slug) => {
                    const dir = getDirectionBySlug(slug);
                    return dir ? (
                      <Badge key={slug} variant="outline" className="text-xs gap-1">
                        <Target className="h-3 w-3" />
                        {dir.label}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main content - left column */}
            <div className="md:col-span-2 space-y-6">
              {/* Bio */}
              {specialist.public_bio && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">О себе</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1"
                      dangerouslySetInnerHTML={{ __html: specialist.public_bio }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Education entries */}
              {educationEntries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Образование
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {educationEntries.map((entry, i) => (
                      <div key={i} className={i > 0 ? "pt-4 border-t" : ""}>
                        <p className="font-medium">{entry.institution}</p>
                        {entry.speciality && (
                          <p className="text-sm text-muted-foreground">{entry.speciality}</p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          {entry.degree && <span>{entry.degree}</span>}
                          {entry.year && <span>• {entry.year}</span>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Legacy education (single text) */}
              {!educationEntries.length && specialist.education && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Образование
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line">{specialist.education}</p>
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              {specialist.work_experience && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Опыт работы</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{specialist.work_experience}</p>
                  </CardContent>
                </Card>
              )}

              {/* Achievements */}
              {(specialist.achievements || (specialist.certificate_images && specialist.certificate_images.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Достижения и сертификаты
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {specialist.achievements && (
                      <p className="text-sm whitespace-pre-line">{specialist.achievements}</p>
                    )}
                    {specialist.certificate_images && specialist.certificate_images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {specialist.certificate_images.map((url, i) => (
                          <div
                            key={i}
                            className="relative group rounded-lg overflow-hidden border bg-muted aspect-[4/3] cursor-pointer"
                            onClick={() => setPreviewImage(url)}
                          >
                            <img
                              src={url}
                              alt={`Сертификат ${i + 1}`}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <ZoomIn className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - right column */}
            <div className="space-y-6">
              {/* Booking card */}
              <Card className="sticky top-24">
                <CardContent className="pt-6 space-y-4">
                  {slotsCount > 0 ? (
                    <>
                      <Button className="w-full gap-2" size="lg" onClick={handleBooking}>
                        <CalendarCheck className="h-5 w-5" />
                        Записаться
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Доступно: {slotsCount} {slotsCount === 1 ? "слот" : slotsCount < 5 ? "слота" : "слотов"}
                      </p>
                    </>
                  ) : (
                    <>
                      <Button className="w-full gap-2" size="lg" variant="secondary" disabled>
                        <CalendarCheck className="h-5 w-5" />
                        Записаться
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Нет свободных слотов
                      </p>
                    </>
                  )}

                  {/* Pricing */}
                  {specialist.show_pricing && specialist.consultation_price && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Wallet className="h-4 w-4" />
                            Консультация
                          </span>
                          <span className="font-bold text-lg text-primary">
                            {specialist.consultation_price.toLocaleString("ru-RU")} ₽
                          </span>
                        </div>

                        {specialist.consultation_duration && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {specialist.consultation_duration} мин
                          </div>
                        )}

                        {specialist.session_packages && specialist.session_packages.length > 0 && (
                          <div className="space-y-2 pt-2 border-t">
                            <p className="text-xs font-medium flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5" />
                              Пакеты
                            </p>
                            {specialist.session_packages.map((pkg, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {pkg.sessions} {pkg.sessions === 1 ? "сессия" : pkg.sessions < 5 ? "сессии" : "сессий"}
                                </span>
                                <div className="text-right">
                                  <span className="font-semibold">
                                    {pkg.price.toLocaleString("ru-RU")} ₽
                                  </span>
                                  {pkg.discount ? (
                                    <span className="ml-1 text-xs text-primary">-{pkg.discount}%</span>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />

      <ParentAuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={handleAuthSuccess}
        specialistName={specialist?.full_name}
      />

      {/* Certificate preview dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">Просмотр сертификата</DialogTitle>
          {previewImage && (
            <img
              src={previewImage}
              alt="Просмотр сертификата"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
