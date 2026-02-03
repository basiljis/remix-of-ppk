import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, School, User, CalendarIcon, ExternalLink, Plus, Link2 } from "lucide-react";
import { ChildProfileRadarChart } from "@/components/ChildProfileRadarChart";
import { ChildProfileBarChart } from "@/components/ChildProfileBarChart";
import { ChildProfileTable } from "@/components/ChildProfileTable";
import { ChildProfileRecommendations } from "@/components/ChildProfileRecommendations";
import { ChildProfileComparison } from "@/components/ChildProfileComparison";
import { ChildSessionsStatistics } from "@/components/ChildSessionsStatistics";
import { ChildInfoDetailsDialog } from "@/components/ChildInfoDetailsDialog";
import { ProtocolDynamicsDetailsDialog } from "@/components/ProtocolDynamicsDetailsDialog";
import { AddChildDialog } from "@/components/AddChildDialog";
import { ChildDevelopmentResults } from "@/components/ChildDevelopmentResults";
import { ChildGameProgressCard } from "@/components/ChildGameProgressCard";
import Preloader from "@/components/Preloader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";
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

interface SessionChildRecord {
  attended: boolean;
  session: {
    id: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    actual_duration_minutes?: number;
    topic?: string;
    session_types: { id: string; name: string };
    session_statuses: { id: string; name: string; color?: string };
    profiles?: { id: string; full_name: string };
  };
}

interface ChildData {
  id: string;
  full_name: string;
  birth_date?: string;
  gender?: string;
  education_level?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  notes?: string;
  organization?: {
    name?: string;
    address?: string;
  };
}

export default function ChildProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { goBack } = useNavigationHistory();
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
  const [sessionData, setSessionData] = useState<SessionChildRecord[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [linkedParentChildId, setLinkedParentChildId] = useState<string | null>(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showDynamicsDialog, setShowDynamicsDialog] = useState(false);
  const [showAddChildDialog, setShowAddChildDialog] = useState(false);
  const childName = searchParams.get("name");
  const organizationId = searchParams.get("org");
  const parentChildId = searchParams.get("parentChildId"); // Direct link to parent child
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

        // Load session data for the child
        const { data: childDbData } = await supabase
          .from("children")
          .select(`
            id,
            full_name,
            birth_date,
            gender,
            education_level,
            parent_name,
            parent_phone,
            parent_email,
            notes,
            organizations:organization_id (
              name,
              address
            )
          `)
          .eq("organization_id", organizationId)
          .ilike("full_name", childName)
          .maybeSingle();

        if (childDbData) {
          setChildData({
            id: childDbData.id,
            full_name: childDbData.full_name,
            birth_date: childDbData.birth_date,
            gender: childDbData.gender,
            education_level: childDbData.education_level,
            parent_name: childDbData.parent_name,
            parent_phone: childDbData.parent_phone,
            parent_email: childDbData.parent_email,
            notes: childDbData.notes,
            organization: childDbData.organizations as any
          });

          setSessionsLoading(true);
          const { data: sessionChildrenData } = await supabase
            .from("session_children")
            .select(`
              attended,
              sessions:session_id (
                id,
                scheduled_date,
                start_time,
                end_time,
                actual_duration_minutes,
                topic,
                session_types (id, name),
                session_statuses (id, name, color),
                profiles:specialist_id (id, full_name)
              )
            `)
            .eq("child_id", childDbData.id);

          if (sessionChildrenData) {
            const formattedData = sessionChildrenData
              .filter((item: any) => item.sessions)
              .map((item: any) => ({
                attended: item.attended,
                session: item.sessions
              }));
            setSessionData(formattedData);
          }
          setSessionsLoading(false);
        }

        // Check for linked parent child
        const { data: linkedData } = await supabase
          .from("linked_parent_children")
          .select("parent_child_id")
          .eq("organization_id", organizationId)
          .maybeSingle();

        if (linkedData) {
          // Find matching child by name in parent_children
          const { data: parentChild } = await supabase
            .from("parent_children")
            .select("id, full_name")
            .eq("id", linkedData.parent_child_id)
            .maybeSingle();

          if (parentChild && parentChild.full_name.toLowerCase() === childName?.toLowerCase()) {
            setLinkedParentChildId(parentChild.id);
          }
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => goBack(returnUrl)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <Button
              onClick={() => setShowAddChildDialog(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Добавить ребёнка
            </Button>
          </div>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">Информация о ребёнке</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowInfoDialog(true)}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Подробнее
            </Button>
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

        {/* Development Test Results from Parent (if linked) */}
        {(linkedParentChildId || parentChildId) && (
          <ChildDevelopmentResults 
            childId={linkedParentChildId || parentChildId!} 
          />
        )}

        {/* Game Progress from Child Workspace (if linked) */}
        {(linkedParentChildId || parentChildId) && (
          <ChildGameProgressCard 
            parentChildId={linkedParentChildId || parentChildId!}
          />
        )}

        {/* Sessions Statistics from Schedule */}
        <ChildSessionsStatistics sessions={sessionData} loading={sessionsLoading} />

        {/* Dynamics Table */}
        <ChildProfileTable 
          protocols={protocols} 
          onShowDetails={() => setShowDynamicsDialog(true)}
        />

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

      {/* Dialogs */}
      <ChildInfoDetailsDialog
        open={showInfoDialog}
        onOpenChange={setShowInfoDialog}
        protocols={protocols}
        childData={childData}
        childInfo={childInfo}
      />

      <ProtocolDynamicsDetailsDialog
        open={showDynamicsDialog}
        onOpenChange={setShowDynamicsDialog}
        protocols={protocols}
      />

      <AddChildDialog
        open={showAddChildDialog}
        onOpenChange={setShowAddChildDialog}
      />
    </div>
  );
}
