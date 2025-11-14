import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, School, User, CalendarIcon } from "lucide-react";
import { ChildProfileRadarChart } from "@/components/ChildProfileRadarChart";
import { ChildProfileBarChart } from "@/components/ChildProfileBarChart";
import { ChildProfileTable } from "@/components/ChildProfileTable";
import { ChildProfileRecommendations } from "@/components/ChildProfileRecommendations";
import { ChildProfileComparison } from "@/components/ChildProfileComparison";
import Preloader from "@/components/Preloader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Protocol {
  id: string;
  child_name: string;
  child_birth_date: string;
  organization_id: string;
  created_at: string;
  ppk_number: string;
  checklist_data: any;
  protocol_data: any;
  organizations?: {
    name: string;
  };
}

export default function ChildProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [allProtocols, setAllProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [childInfo, setChildInfo] = useState<{
    name: string;
    birthDate: string;
    organization: string;
  } | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const childName = searchParams.get("name");
  const organizationId = searchParams.get("org");
  const returnUrl = searchParams.get("returnUrl") || "/app";

  useEffect(() => {
    const loadProtocols = async () => {
      if (!childName || !organizationId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("protocols")
          .select(`
            *,
            organizations (
              name
            )
          `)
          .eq("child_name", childName)
          .eq("organization_id", organizationId)
          .eq("status", "completed")
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setAllProtocols(data);
          setProtocols(data);
          setChildInfo({
            name: data[0].child_name,
            birthDate: data[0].child_birth_date,
            organization: data[0].organizations?.name || "Не указана",
          });
        }
      } catch (error) {
        console.error("Error loading protocols:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProtocols();
  }, [childName, organizationId]);

  // Фильтрация по периодам
  useEffect(() => {
    let filtered = [...allProtocols];

    if (dateFrom) {
      filtered = filtered.filter(p => new Date(p.created_at) >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter(p => new Date(p.created_at) <= dateTo);
    }

    setProtocols(filtered);
  }, [dateFrom, dateTo, allProtocols]);

  if (loading) {
    return <Preloader />;
  }

  if (!childName || !organizationId || protocols.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Данные не найдены</CardTitle>
            <CardDescription>
              Не удалось загрузить профиль ребёнка. Проверьте правильность ссылки.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(returnUrl)} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(returnUrl)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>

          {/* Фильтрация по периодам */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd.MM.yyyy") : "Дата от"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd.MM.yyyy") : "Дата до"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
              >
                Сбросить
              </Button>
            )}
          </div>
        </div>

        {/* Child Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Профиль ребёнка</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ФИО</p>
                <p className="font-medium">{childInfo?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Дата рождения</p>
                <p className="font-medium">
                  {childInfo?.birthDate
                    ? new Date(childInfo.birthDate).toLocaleDateString("ru-RU")
                    : "Не указана"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <School className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Образовательная организация
                </p>
                <p className="font-medium">{childInfo?.organization}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamics Table */}
        <ChildProfileTable protocols={protocols} />

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <ChildProfileRadarChart protocols={protocols} />
          <ChildProfileBarChart protocols={protocols} />
        </div>

        {/* Comparison with averages */}
        {protocols.length > 0 && (
          <ChildProfileComparison
            childBirthDate={protocols[protocols.length - 1].child_birth_date}
            organizationId={protocols[protocols.length - 1].organization_id}
            currentProtocol={protocols[protocols.length - 1]}
          />
        )}

        {/* Recommendations */}
        <ChildProfileRecommendations protocols={protocols} />
      </div>
    </div>
  );
}
