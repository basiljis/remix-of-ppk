import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  User, Calendar, School, Search, Filter, CalendarIcon, 
  CheckCircle, XCircle, TrendingUp, FileText, Users
} from "lucide-react";
import { ChildProfileRadarChart } from "@/components/ChildProfileRadarChart";
import { ChildProfileBarChart } from "@/components/ChildProfileBarChart";
import { ChildProfileTable } from "@/components/ChildProfileTable";
import { ChildProfileRecommendations } from "@/components/ChildProfileRecommendations";
import { ChildProfileComparison } from "@/components/ChildProfileComparison";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSchoolYears } from "@/hooks/useSchoolYears";
import { isDateInSchoolYear } from "@/utils/schoolYear";

interface Child {
  id: string;
  full_name: string;
  birth_date: string | null;
  organization_id: string;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  education_level: string | null;
  gender: string | null;
  is_active: boolean;
}

interface Protocol {
  id: string;
  child_name: string;
  child_birth_date: string;
  organization_id: string;
  created_at: string;
  ppk_number: string;
  checklist_data: any;
  protocol_data: any;
  status: string;
  education_level: string;
}

export function ChildCardSection() {
  const { profile, isAdmin, roles } = useAuth();
  const { schoolYearsFormatted } = useSchoolYears();
  
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolYearFilter, setSchoolYearFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  
  const isOrgLevel = roles.some(r => ["user", "organization_admin", "director"].includes(r.role));
  const isRegionalOperator = roles.some(r => r.role === "regional_operator");

  // Fetch children based on user role
  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["child-card-children", profile?.organization_id, profile?.region_id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("children")
        .select("*")
        .eq("is_active", true)
        .order("full_name");

      if (!isAdmin && isOrgLevel && profile?.organization_id) {
        query = query.eq("organization_id", profile.organization_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Child[];
    },
    enabled: !!profile,
  });

  // Also get children from protocols (may not be in children table)
  const { data: protocolChildren = [] } = useQuery({
    queryKey: ["child-card-protocol-children", profile?.organization_id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("protocols")
        .select("child_name, child_birth_date, organization_id")
        .order("child_name");

      if (!isAdmin && isOrgLevel && profile?.organization_id) {
        query = query.eq("organization_id", profile.organization_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Unique children from protocols
      const uniqueChildren = new Map<string, { name: string; birthDate: string | null; orgId: string }>();
      data?.forEach(p => {
        const key = `${p.child_name}-${p.organization_id}`;
        if (!uniqueChildren.has(key)) {
          uniqueChildren.set(key, {
            name: p.child_name,
            birthDate: p.child_birth_date,
            orgId: p.organization_id
          });
        }
      });
      
      return Array.from(uniqueChildren.values());
    },
    enabled: !!profile,
  });

  // Merge children from both sources
  const allChildren = [...children];
  protocolChildren.forEach(pc => {
    const exists = children.some(c => 
      c.full_name.toLowerCase() === pc.name.toLowerCase() && 
      c.organization_id === pc.orgId
    );
    if (!exists) {
      allChildren.push({
        id: `protocol-${pc.name}-${pc.orgId}`,
        full_name: pc.name,
        birth_date: pc.birthDate,
        organization_id: pc.orgId,
        parent_name: null,
        parent_phone: null,
        parent_email: null,
        education_level: null,
        gender: null,
        is_active: true,
      });
    }
  });

  // Filter children by search
  const filteredChildren = allChildren.filter(child =>
    child.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected child data
  const selectedChild = allChildren.find(c => c.id === selectedChildId);

  // Fetch protocols for selected child
  const { data: protocols = [], isLoading: protocolsLoading } = useQuery({
    queryKey: ["child-card-protocols", selectedChild?.full_name, selectedChild?.organization_id],
    queryFn: async () => {
      if (!selectedChild) return [];

      const { data, error } = await supabase
        .from("protocols")
        .select("*")
        .eq("child_name", selectedChild.full_name)
        .eq("organization_id", selectedChild.organization_id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Protocol[];
    },
    enabled: !!selectedChild,
  });

  // Fetch sessions/attendance for selected child
  const { data: attendanceStats } = useQuery({
    queryKey: ["child-card-attendance", selectedChild?.id],
    queryFn: async () => {
      if (!selectedChild || selectedChild.id.startsWith("protocol-")) return null;

      const { data } = await supabase
        .from("session_children")
        .select("attended")
        .eq("child_id", selectedChild.id);

      if (!data || data.length === 0) return null;
      
      const total = data.length;
      const attended = data.filter(a => a.attended).length;
      return {
        total,
        attended,
        missed: total - attended,
        percentage: Math.round((attended / total) * 100)
      };
    },
    enabled: !!selectedChild && !selectedChild.id.startsWith("protocol-"),
  });

  // Filter protocols by date range and school year
  const filteredProtocols = protocols.filter(p => {
    // School year filter
    if (schoolYearFilter && schoolYearFilter !== "all") {
      const selectedYear = schoolYearsFormatted.find(y => y.value === schoolYearFilter);
      if (selectedYear) {
        const protocolData = p.protocol_data as any;
        const consultationDate = protocolData?.consultationDate 
          ? new Date(protocolData.consultationDate)
          : new Date(p.created_at);
        if (!isDateInSchoolYear(consultationDate, selectedYear)) {
          return false;
        }
      }
    }

    // Date range filter
    if (dateFrom && new Date(p.created_at) < dateFrom) return false;
    if (dateTo && new Date(p.created_at) > dateTo) return false;

    return true;
  });

  // Completed protocols for charts
  const completedProtocols = filteredProtocols.filter(p => p.status === "completed");

  // Calculate age
  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const years = differenceInYears(new Date(), birth);
    const months = differenceInMonths(new Date(), birth) % 12;
    return { years, months };
  };

  const resetFilters = () => {
    setSchoolYearFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const age = selectedChild?.birth_date ? calculateAge(selectedChild.birth_date) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            Карточка ребенка
          </h2>
          <p className="text-muted-foreground">
            Полная информация о развитии и посещаемости ребенка
          </p>
        </div>
      </div>

      {/* Child Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Выбор ребенка
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>Поиск по имени</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Введите имя ребенка..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1">
              <Label>Выберите ребенка</Label>
              <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите ребенка из списка" />
                </SelectTrigger>
                <SelectContent>
                  {filteredChildren.map(child => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.full_name}
                      {child.birth_date && (
                        <span className="text-muted-foreground ml-2">
                          ({format(new Date(child.birth_date), "dd.MM.yyyy")})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {childrenLoading && (
            <p className="text-sm text-muted-foreground">Загрузка списка детей...</p>
          )}
          {!childrenLoading && allChildren.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Дети не найдены. Добавьте детей в базу данных через модуль расписания.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Show content only when child is selected */}
      {selectedChild && (
        <>
          {/* Child Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Информация о ребенке</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ФИО</p>
                  <p className="font-medium">{selectedChild.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Дата рождения</p>
                  <p className="font-medium">
                    {selectedChild.birth_date
                      ? format(new Date(selectedChild.birth_date), "dd.MM.yyyy")
                      : "Не указана"}
                  </p>
                </div>
              </div>
              {age && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Возраст</p>
                    <p className="font-medium">
                      {age.years} лет {age.months > 0 && `${age.months} мес.`}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <School className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Уровень образования</p>
                  <p className="font-medium">{selectedChild.education_level || "Не указан"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Фильтры данных
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="min-w-[180px]">
                  <Label>Учебный год</Label>
                  <Select value={schoolYearFilter} onValueChange={setSchoolYearFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите год" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все годы</SelectItem>
                      {schoolYearsFormatted.map(year => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Период от</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "dd.MM.yy") : "Дата"}
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
                </div>

                <div>
                  <Label>Период до</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "dd.MM.yy") : "Дата"}
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
                </div>

                {(schoolYearFilter !== "all" || dateFrom || dateTo) && (
                  <Button variant="ghost" onClick={resetFilters}>
                    Сбросить
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{filteredProtocols.length}</p>
                    <p className="text-sm text-muted-foreground">Всего протоколов</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-700">{completedProtocols.length}</p>
                    <p className="text-sm text-muted-foreground">Завершённых</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {attendanceStats && (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{attendanceStats.total}</p>
                        <p className="text-sm text-muted-foreground">Занятий</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold">{attendanceStats.percentage}%</p>
                        <p className="text-sm text-muted-foreground">Посещаемость</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Attendance Details */}
          {attendanceStats && attendanceStats.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Посещаемость занятий</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{attendanceStats.total}</p>
                      <p className="text-sm text-muted-foreground">Всего занятий</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-700">{attendanceStats.attended}</p>
                      <p className="text-sm text-muted-foreground">Присутствовал</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-700">{attendanceStats.missed}</p>
                      <p className="text-sm text-muted-foreground">Пропустил</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Посещаемость</span>
                    <span>{attendanceStats.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${attendanceStats.percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Protocols Table */}
          {protocolsLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Загрузка протоколов...</p>
              </CardContent>
            </Card>
          ) : completedProtocols.length > 0 ? (
            <>
              <ChildProfileTable protocols={completedProtocols} />

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                <ChildProfileRadarChart protocols={completedProtocols} />
                <ChildProfileBarChart protocols={completedProtocols} />
              </div>

              {/* Comparison */}
              {completedProtocols.length > 0 && selectedChild.birth_date && (
                <ChildProfileComparison
                  childBirthDate={selectedChild.birth_date}
                  organizationId={selectedChild.organization_id}
                  currentProtocol={completedProtocols[completedProtocols.length - 1]}
                />
              )}

              {/* Recommendations */}
              <ChildProfileRecommendations protocols={completedProtocols} />
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Нет завершённых протоколов</h3>
                <p className="text-muted-foreground">
                  {filteredProtocols.length > 0 
                    ? `Найдено ${filteredProtocols.length} протоколов в статусе "Черновик". Завершите их для отображения динамики.`
                    : "Для этого ребенка ещё не создано ни одного протокола ППк."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedChild && !childrenLoading && allChildren.length > 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Выберите ребенка</h3>
            <p className="text-muted-foreground">
              Выберите ребенка из списка выше, чтобы просмотреть его карточку развития
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
