import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, UserCheck, CalendarCheck, ChevronRight,
  Building2, MapPin, Globe, Users as UsersIcon,
} from "lucide-react";
import { WORK_DIRECTIONS, getDirectionBySlug } from "@/constants/workDirections";

interface RecommendedSpecialistsProps {
  /** Direction slugs matching child's problem areas */
  problemDirections: string[];
  /** Parent's region_id for filtering */
  regionId: string | null;
  /** Callback when booking specialist */
  onBookSpecialist?: (specialistId: string) => void;
  /** Max specialists to show before "show all" */
  maxVisible?: number;
  /** Compact mode for embedding in cards */
  compact?: boolean;
}

interface MatchedSpecialist {
  id: string;
  full_name: string;
  public_slug: string | null;
  public_photo_url: string | null;
  work_directions: string[];
  is_private_practice: boolean;
  position_name: string | null;
  organization_name: string | null;
  work_format: string | null;
  work_district: string | null;
  available_slots: number;
  matchingDirections: string[];
}

export function RecommendedSpecialists({
  problemDirections,
  regionId,
  onBookSpecialist,
  maxVisible = 3,
  compact = false,
}: RecommendedSpecialistsProps) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const { data: specialists = [], isLoading } = useQuery({
    queryKey: ["recommended-specialists", problemDirections, regionId],
    queryFn: async () => {
      if (!regionId || problemDirections.length === 0) return [];

      // Fetch published specialists in the parent's region who have work_directions
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          id, full_name, public_slug, public_photo_url,
          work_directions, is_private_practice,
          work_format, work_district,
          position:positions(name),
          organization:organizations(name, allow_parent_registration)
        `)
        .eq("region_id", regionId)
        .eq("is_published", true)
        .eq("is_blocked", false)
        .not("work_directions", "is", null);

      if (error) throw error;

      // Filter to specialists whose work_directions overlap with problem directions
      const matched: MatchedSpecialist[] = [];

      for (const profile of (profiles || [])) {
        const dirs = (profile.work_directions as string[]) || [];
        if (dirs.length === 0) continue;

        // Skip org specialists whose org doesn't allow registration
        if (!profile.is_private_practice && profile.organization) {
          const org = profile.organization as any;
          if (!org.allow_parent_registration) continue;
        }

        const matchingDirs = dirs.filter((d) => problemDirections.includes(d));
        if (matchingDirs.length === 0) continue;

        matched.push({
          id: profile.id,
          full_name: profile.full_name || "",
          public_slug: profile.public_slug || null,
          public_photo_url: profile.public_photo_url || null,
          work_directions: dirs,
          is_private_practice: profile.is_private_practice || false,
          position_name: (profile.position as any)?.name || null,
          organization_name: profile.is_private_practice ? null : (profile.organization as any)?.name || null,
          work_format: profile.work_format || null,
          work_district: profile.work_district || null,
          available_slots: 0,
          matchingDirections: matchingDirs,
        });
      }

      // Sort: more matching directions first
      matched.sort((a, b) => b.matchingDirections.length - a.matchingDirections.length);

      // Fetch available slots count for each specialist
      if (matched.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const specialistIds = matched.map((s) => s.id);

        const { data: slots } = await supabase
          .from("consultation_slots")
          .select("specialist_id")
          .in("specialist_id", specialistIds)
          .eq("is_booked", false)
          .gte("slot_date", today);

        if (slots) {
          const slotCounts: Record<string, number> = {};
          slots.forEach((s) => {
            slotCounts[s.specialist_id] = (slotCounts[s.specialist_id] || 0) + 1;
          });
          matched.forEach((s) => {
            s.available_slots = slotCounts[s.id] || 0;
          });
          // Secondary sort: specialists with slots first
          matched.sort((a, b) => {
            if (b.matchingDirections.length !== a.matchingDirections.length) {
              return b.matchingDirections.length - a.matchingDirections.length;
            }
            return b.available_slots - a.available_slots;
          });
        }
      }

      return matched;
    },
    enabled: !!regionId && problemDirections.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (specialists.length === 0) {
    return null;
  }

  const visibleSpecialists = showAll ? specialists : specialists.slice(0, maxVisible);
  const getInitials = (name: string) =>
    name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

  const directionLabels = problemDirections
    .map((s) => getDirectionBySlug(s)?.shortLabel)
    .filter(Boolean);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <UserCheck className="h-4 w-4 text-primary" />
          Рекомендованные специалисты
        </div>
        <div className="space-y-2">
          {visibleSpecialists.map((spec) => (
            <div
              key={spec.id}
              className="flex items-center gap-3 p-2.5 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => {
                if (spec.public_slug) {
                  navigate(`/s/${spec.public_slug}`);
                } else if (onBookSpecialist) {
                  onBookSpecialist(spec.id);
                }
              }}
            >
              <Avatar className="h-9 w-9">
                {spec.public_photo_url && <AvatarImage src={spec.public_photo_url} />}
                <AvatarFallback className="text-xs">{getInitials(spec.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{spec.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {spec.position_name || "Специалист"}
                  {spec.organization_name ? ` · ${spec.organization_name}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {spec.available_slots > 0 ? (
                  <Badge variant="default" className="text-xs">
                    {spec.available_slots} {spec.available_slots === 1 ? "слот" : "слотов"}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Нет слотов
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        {specialists.length > maxVisible && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowAll(true)}
          >
            Показать всех ({specialists.length})
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={() => navigate("/specialists")}
        >
          <UsersIcon className="h-3.5 w-3.5" />
          Все специалисты
        </Button>
      </div>
    );
  }

  // Full card mode
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCheck className="h-5 w-5 text-primary" />
          Рекомендованные специалисты
        </CardTitle>
        {directionLabels.length > 0 && (
          <p className="text-xs text-muted-foreground">
            По направлениям: {directionLabels.join(", ")}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleSpecialists.map((spec, idx) => (
          <div key={spec.id}>
            {idx > 0 && <Separator className="mb-3" />}
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                {spec.public_photo_url && <AvatarImage src={spec.public_photo_url} />}
                <AvatarFallback>{getInitials(spec.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{spec.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {spec.position_name || "Специалист"}
                </p>
                {spec.organization_name && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" />
                    {spec.organization_name}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {spec.matchingDirections.map((d) => {
                    const dir = getDirectionBySlug(d);
                    return dir ? (
                      <Badge key={d} variant="secondary" className="text-xs">
                        {dir.shortLabel}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {spec.available_slots > 0 ? (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onBookSpecialist?.(spec.id)}
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Записаться
                  </Button>
                ) : spec.public_slug ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => navigate(`/s/${spec.public_slug}`)}
                  >
                    Профиль
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}

        {specialists.length > maxVisible && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowAll(true)}
          >
            Показать всех специалистов ({specialists.length})
          </Button>
        )}

        <Separator />
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => navigate("/specialists")}
        >
          <UsersIcon className="h-4 w-4" />
          Каталог всех специалистов
        </Button>
      </CardContent>
    </Card>
  );
}
