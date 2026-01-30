import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ParentSidebar } from "@/components/ParentSidebar";
import { Loader2, Plus, Baby, LogOut, User, Copy, Check, Info, CalendarDays, Phone, ClipboardList, GraduationCap, Users, Shield, Mail, MapPin, Pencil } from "lucide-react";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ParentCalendar } from "@/components/ParentCalendar";
import { BookConsultationDialog } from "@/components/BookConsultationDialog";
import { ParentTestsSection } from "@/components/ParentTestsSection";
import { ParentNotificationsDialog } from "@/components/ParentNotificationsDialog";
import { EditChildDialog } from "@/components/EditChildDialog";
import { ChildTestResultsBadges } from "@/components/ChildTestResultsBadges";
import { TestRecommendationsDialog } from "@/components/TestRecommendationsDialog";
import { ParentInstructionsSection } from "@/components/ParentInstructionsSection";

interface ParentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  region_id: string | null;
}

interface ParentChild {
  id: string;
  child_unique_id: string;
  full_name: string;
  gender: string | null;
  birth_date: string | null;
  school_name: string | null;
  class_or_group: string | null;
  education_level: string | null;
  notes: string | null;
  created_at: string;
}

const educationLevels = [
  { value: "DO", label: "Дошкольное образование", shortLabel: "Дошкольное" },
  { value: "NOO", label: "Начальное общее (1-4 класс)", shortLabel: "Начальное" },
  { value: "OOO", label: "Основное общее (5-9 класс)", shortLabel: "Основное" },
  { value: "SOO", label: "Среднее общее (10-11 класс)", shortLabel: "Среднее" },
];

// Динамические опции для класса в зависимости от уровня образования
const getClassOptions = (educationLevel: string) => {
  switch (educationLevel) {
    case "DO":
      return [
        { value: "Младшая группа", label: "Младшая группа" },
        { value: "Средняя группа", label: "Средняя группа" },
        { value: "Старшая группа", label: "Старшая группа" },
        { value: "Подготовительная группа", label: "Подготовительная группа" },
      ];
    case "NOO":
      return [1, 2, 3, 4].map((n) => ({ value: n.toString(), label: `${n} класс` }));
    case "OOO":
      return [5, 6, 7, 8, 9].map((n) => ({ value: n.toString(), label: `${n} класс` }));
    case "SOO":
      return [10, 11].map((n) => ({ value: n.toString(), label: `${n} класс` }));
    default:
      return [];
  }
};

const classLetterOptions = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "К", "Л", "М"];

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("children");
  const [editChildDialogOpen, setEditChildDialogOpen] = useState(false);
  const [selectedChildForEdit, setSelectedChildForEdit] = useState<ParentChild | null>(null);
  const [recommendationsDialogOpen, setRecommendationsDialogOpen] = useState(false);
  const [selectedResultForRecommendations, setSelectedResultForRecommendations] = useState<any>(null);
  const [selectedChildForRecommendations, setSelectedChildForRecommendations] = useState<string>("");

  // New child form
  const [newChild, setNewChild] = useState({
    fullName: "",
    gender: "",
    birthDate: "",
    schoolId: "",
    classNumber: "",
    classLetter: "",
    educationLevel: "",
  });

  // Load organizations based on parent's region
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  
  // Regions for profile editing
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editedRegionId, setEditedRegionId] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/parent-auth");
        return;
      }

      // Check if user has parent role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isParent = roles?.some(r => r.role === "parent");
      const hasAdminRole = roles?.some(r => r.role === "admin");
      setIsAdmin(hasAdminRole || false);
      
      // Allow admins to view parent dashboard even without parent role
      if (!isParent && !hasAdminRole) {
        navigate("/parent-auth");
        return;
      }

      // Load parent profile
      const { data: profileData, error: profileError } = await supabase
        .from("parent_profiles" as any)
        .select("id, full_name, email, phone, region_id")
        .eq("id", user.id)
        .single() as { data: ParentProfile | null; error: any };

      if (profileError) throw profileError;
      setProfile(profileData as ParentProfile);
      setEditedRegionId(profileData?.region_id || "");

      // Load all regions for profile editing
      const { data: regionsData } = await supabase
        .from("regions")
        .select("id, name")
        .order("name");
      setRegions(regionsData || []);

      // Load organizations for parent's region
      if (profileData?.region_id) {
        const { data: orgsData } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("region_id", profileData.region_id)
          .eq("is_archived", false)
          .order("name");
        
        setOrganizations(orgsData || []);
      }

      // Load children
      const { data: childrenData, error: childrenError } = await supabase
        .from("parent_children" as any)
        .select("*")
        .eq("parent_user_id", user.id)
        .order("created_at", { ascending: false }) as { data: ParentChild[] | null; error: any };

      if (childrenError) throw childrenError;
      setChildren((childrenData as ParentChild[]) || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("parent_profiles" as any)
        .update({ region_id: editedRegionId })
        .eq("id", profile.id) as { error: any };
      
      if (error) throw error;
      
      setProfile({ ...profile, region_id: editedRegionId });
      setEditingProfile(false);
      
      // Reload organizations for new region
      if (editedRegionId) {
        const { data: orgsData } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("region_id", editedRegionId)
          .eq("is_archived", false)
          .order("name");
        
        setOrganizations(orgsData || []);
      } else {
        setOrganizations([]);
      }
      
      toast({
        title: "Успешно",
        description: "Регион обновлён",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить изменения",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddChild = async () => {
    if (!newChild.fullName.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите ФИО ребёнка",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      // Build class_or_group from classNumber and classLetter
      let classOrGroup = "";
      if (newChild.educationLevel === "DO") {
        classOrGroup = newChild.classNumber; // For preschool, classNumber contains the group name
      } else if (newChild.classNumber) {
        classOrGroup = newChild.classNumber + (newChild.classLetter ? newChild.classLetter : "");
      }

      // Get school name from selected organization
      const selectedOrg = organizations.find(o => o.id === newChild.schoolId);

      const { error } = await supabase.from("parent_children" as any).insert({
        parent_user_id: user.id,
        full_name: newChild.fullName.trim(),
        gender: newChild.gender || null,
        birth_date: newChild.birthDate || null,
        school_name: selectedOrg?.name || null,
        class_or_group: classOrGroup || null,
        education_level: newChild.educationLevel || null,
      } as any);

      if (error) throw error;

      toast({
        title: "Ребёнок добавлен",
        description: "Профиль ребёнка успешно создан",
      });

      setAddDialogOpen(false);
      setNewChild({
        fullName: "",
        gender: "",
        birthDate: "",
        schoolId: "",
        classNumber: "",
        classLetter: "",
        educationLevel: "",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/parent-auth");
  };

  const copyChildId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Скопировано",
      description: "Идентификатор ребёнка скопирован в буфер обмена",
    });
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const years = differenceInYears(new Date(), birth);
    const months = differenceInMonths(new Date(), birth) % 12;
    
    if (years === 0) {
      return `${months} мес.`;
    }
    
    const yearWord = years === 1 ? "год" : years < 5 ? "года" : "лет";
    const monthWord = months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев";
    
    return months > 0 ? `${years} ${yearWord} ${months} ${monthWord}` : `${years} ${yearWord}`;
  };

  const openEditChild = (child: ParentChild) => {
    setSelectedChildForEdit(child);
    setEditChildDialogOpen(true);
  };

  const handleViewRecommendations = (result: any, childName: string) => {
    setSelectedResultForRecommendations(result);
    setSelectedChildForRecommendations(childName);
    setRecommendationsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "children":
        return (
          <div className="space-y-6">
            {/* Header for children section */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Мои дети</h2>
                <p className="text-muted-foreground">Управляйте профилями своих детей</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setBookDialogOpen(true)} 
                  variant="outline"
                  className="gap-2 border-pink-300 text-pink-600 hover:bg-pink-50"
                >
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">Записаться на консультацию</span>
                  <span className="sm:hidden">Записаться</span>
                </Button>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-pink-600 hover:bg-pink-700 gap-2">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Добавить ребёнка</span>
                      <span className="sm:hidden">Добавить</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Добавить ребёнка</DialogTitle>
                      <DialogDescription>
                        Заполните информацию о ребёнке. Класс/группа нужны для подбора материалов по возрасту.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="child-name">ФИО ребёнка *</Label>
                        <Input
                          id="child-name"
                          value={newChild.fullName}
                          onChange={(e) => setNewChild({ ...newChild, fullName: e.target.value })}
                          placeholder="Иванов Иван Иванович"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Пол</Label>
                          <Select
                            value={newChild.gender}
                            onValueChange={(value) => setNewChild({ ...newChild, gender: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Мужской</SelectItem>
                              <SelectItem value="female">Женский</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="birth-date">Дата рождения</Label>
                          <Input
                            id="birth-date"
                            type="date"
                            value={newChild.birthDate}
                            onChange={(e) => setNewChild({ ...newChild, birthDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Уровень образования</Label>
                        <Select
                          value={newChild.educationLevel}
                          onValueChange={(value) => setNewChild({ 
                            ...newChild, 
                            educationLevel: value,
                            classNumber: "",
                            classLetter: ""
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите уровень" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            {educationLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {newChild.educationLevel && (
                        <div className="space-y-2">
                          <Label>
                            {newChild.educationLevel === "DO" ? "Группа" : "Класс"}
                          </Label>
                          {newChild.educationLevel === "DO" ? (
                            <Select
                              value={newChild.classNumber}
                              onValueChange={(value) => setNewChild({ ...newChild, classNumber: value, classLetter: "" })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите группу" />
                              </SelectTrigger>
                              <SelectContent className="bg-popover z-50">
                                {getClassOptions("DO").map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <Select
                                value={newChild.classNumber}
                                onValueChange={(value) => setNewChild({ ...newChild, classNumber: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Номер" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover z-50">
                                  {getClassOptions(newChild.educationLevel).map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={newChild.classLetter}
                                onValueChange={(value) => setNewChild({ ...newChild, classLetter: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Литера" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover z-50">
                                  {classLetterOptions.map((letter) => (
                                    <SelectItem key={letter} value={letter}>
                                      {letter}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Нужно для подбора рекомендаций по возрасту
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Образовательная организация (необязательно)</Label>
                        <Select
                          value={newChild.schoolId}
                          onValueChange={(value) => setNewChild({ ...newChild, schoolId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите организацию" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50 max-h-60">
                            {organizations.length === 0 ? (
                              <SelectItem value="none" disabled>
                                Нет организаций в вашем регионе
                              </SelectItem>
                            ) : (
                              organizations.map((org) => (
                                <SelectItem key={org.id} value={org.id}>
                                  {org.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        Отмена
                      </Button>
                      <Button 
                        onClick={handleAddChild} 
                        disabled={submitting}
                        className="bg-pink-600 hover:bg-pink-700"
                      >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Добавить
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {children.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Baby className="h-16 w-16 mx-auto text-pink-300 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Нет добавленных детей</h3>
                  <p className="text-muted-foreground mb-6">
                    Добавьте ребёнка, чтобы получить персональные рекомендации
                  </p>
                  <Button 
                    onClick={() => setAddDialogOpen(true)}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить первого ребёнка
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {children.map((child) => (
                  <Card key={child.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 bg-pink-100 dark:bg-pink-950">
                          <AvatarFallback className="text-pink-600 text-xl font-bold">
                            {child.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{child.full_name}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {child.gender && (
                                  <Badge variant="secondary">
                                    {child.gender === "male" ? "Мальчик" : "Девочка"}
                                  </Badge>
                                )}
                                {child.birth_date && (
                                  <Badge variant="outline">
                                    {calculateAge(child.birth_date)}
                                  </Badge>
                                )}
                                {child.education_level && (
                                  <Badge variant="outline" className="bg-pink-50 dark:bg-pink-950/50">
                                    {educationLevels.find(l => l.value === child.education_level)?.shortLabel}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditChild(child)}
                              className="h-8 w-8 text-muted-foreground hover:text-pink-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Test Results */}
                          <ChildTestResultsBadges 
                            childId={child.id}
                            onViewRecommendations={(result) => handleViewRecommendations(result, child.full_name)}
                          />
                          
                          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Уникальный идентификатор ребёнка
                                </p>
                                <p className="font-mono font-semibold text-pink-600">
                                  {child.child_unique_id}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyChildId(child.child_unique_id)}
                                className="gap-2"
                              >
                                {copiedId === child.child_unique_id ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Может понадобиться при обращении к специалисту
                            </p>
                          </div>

                          {(child.class_or_group || child.school_name) && (
                            <div className="mt-3 text-sm text-muted-foreground">
                              {child.class_or_group && <span>{child.class_or_group}</span>}
                              {child.class_or_group && child.school_name && " • "}
                              {child.school_name && <span>{child.school_name}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      case "tests":
        return (
          <ParentTestsSection 
            parentUserId={profile?.id || ""} 
            children={children.map(c => ({ 
              id: c.id, 
              full_name: c.full_name,
              child_unique_id: c.child_unique_id
            }))} 
          />
        );
      case "calendar":
        return (
          <ParentCalendar 
            parentUserId={profile?.id || ""} 
            childIds={children.map(c => c.id)}
            regionId={profile?.region_id || null}
            children={children.map(c => ({ id: c.id, full_name: c.full_name }))}
          />
        );
      case "instructions":
        return <ParentInstructionsSection />;
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Профиль</h2>
              <p className="text-muted-foreground">Информация о вашем аккаунте</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 bg-pink-100 dark:bg-pink-950">
                    <AvatarFallback className="text-pink-600 text-lg font-bold">
                      {profile?.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xl">{profile?.full_name}</div>
                    <Badge variant="outline" className="mt-1 text-pink-600 border-pink-300">
                      <Baby className="h-3 w-3 mr-1" />
                      Родитель
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Телефон</p>
                    <p className="font-medium">{profile?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Регион</p>
                    {editingProfile ? (
                      <div className="flex gap-2 mt-1">
                        <Select value={editedRegionId} onValueChange={setEditedRegionId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Выберите регион" />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map((region) => (
                              <SelectItem key={region.id} value={region.id}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
                          {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingProfile(false);
                          setEditedRegionId(profile?.region_id || "");
                        }}>
                          Отмена
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {regions.find(r => r.id === profile?.region_id)?.name || "Не указан"}
                        </p>
                        <Button size="sm" variant="ghost" onClick={() => setEditingProfile(true)}>
                          Изменить
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Количество детей</p>
                    <p className="font-medium">{children.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-pink-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header - fixed at top */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="hidden md:block">
                <h1 className="text-xl font-bold">universum.</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>{profile?.full_name}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-600 dark:text-pink-400">
                    Родитель
                  </span>
                  {isAdmin && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Режим просмотра
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Admin cabinet switcher */}
              {isAdmin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-primary/10 border border-blue-500/20">
                        <Users className="h-4 w-4 text-blue-500" />
                        <Switch
                          checked={false}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              navigate("/app");
                            }
                          }}
                          className="data-[state=unchecked]:bg-primary"
                        />
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">Переключиться на кабинет педагогов</p>
                      <p className="text-xs text-muted-foreground">Вы просматриваете кабинет родителей</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <div className="h-8 w-px bg-border hidden lg:block" />
              
              {/* Notifications bell */}
              <ParentNotificationsDialog onNavigate={setActiveTab} />
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors"
                >
                  <Avatar className="h-8 w-8 bg-pink-100 dark:bg-pink-950">
                    <AvatarFallback className="text-pink-600">
                      {profile?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <ThemeToggle />
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Выход</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Sidebar - positioned below header */}
        <div className="hidden md:block">
          <ParentSidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            childrenCount={children.length}
          />
        </div>
        
        {/* Main content */}
        <main className="flex-1 w-full pt-16">
          <div className={cn(
            "container mx-auto p-4 sm:p-6",
            activeTab === "calendar" ? "max-w-full px-2 sm:px-4" : "max-w-4xl lg:p-8"
          )}>
            {renderTabContent()}
          </div>
        </main>

        {/* Book Consultation Dialog */}
        <BookConsultationDialog
          open={bookDialogOpen}
          onOpenChange={setBookDialogOpen}
          parentUserId={profile?.id || ""}
          regionId={profile?.region_id || null}
          children={children.map(c => ({ id: c.id, full_name: c.full_name }))}
        />

        {/* Edit Child Dialog */}
        {selectedChildForEdit && (
          <EditChildDialog
            open={editChildDialogOpen}
            onOpenChange={setEditChildDialogOpen}
            child={selectedChildForEdit}
            organizations={organizations}
            onSuccess={loadData}
          />
        )}

        {/* Recommendations Dialog */}
        <TestRecommendationsDialog
          open={recommendationsDialogOpen}
          onOpenChange={setRecommendationsDialogOpen}
          result={selectedResultForRecommendations}
          childName={selectedChildForRecommendations}
        />
      </div>
    </SidebarProvider>
  );
}
