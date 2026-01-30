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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Baby, LogOut, User, Copy, Check, Info, CalendarDays, Phone, ClipboardList } from "lucide-react";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { ParentCalendar } from "@/components/ParentCalendar";
import { BookConsultationDialog } from "@/components/BookConsultationDialog";
import { ParentTestsSection } from "@/components/ParentTestsSection";

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
  created_at: string;
}

const educationLevels = [
  { value: "DO", label: "Дошкольное образование" },
  { value: "NOO", label: "Начальное общее (1-4 класс)" },
  { value: "OOO", label: "Основное общее (5-9 класс)" },
  { value: "SOO", label: "Среднее общее (10-11 класс)" },
];

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

  // New child form
  const [newChild, setNewChild] = useState({
    fullName: "",
    gender: "",
    birthDate: "",
    schoolName: "",
    classOrGroup: "",
    educationLevel: "",
  });

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
      
      if (!isParent) {
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

      const { error } = await supabase.from("parent_children" as any).insert({
        parent_user_id: user.id,
        full_name: newChild.fullName.trim(),
        gender: newChild.gender || null,
        birth_date: newChild.birthDate || null,
        school_name: newChild.schoolName.trim() || null,
        class_or_group: newChild.classOrGroup.trim() || null,
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
        schoolName: "",
        classOrGroup: "",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Baby className="h-8 w-8 text-pink-500" />
            <div>
              <h1 className="text-xl font-bold">universum.</h1>
              <p className="text-xs text-muted-foreground">Кабинет родителя</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Book Consultation Button */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Личный кабинет родителя</h2>
            <p className="text-muted-foreground">Управляйте детьми и записывайтесь на консультации</p>
          </div>
          <Button 
            onClick={() => setBookDialogOpen(true)} 
            variant="outline"
            className="gap-2 border-pink-300 text-pink-600 hover:bg-pink-50"
          >
            <Phone className="h-4 w-4" />
            Записаться на консультацию
          </Button>
        </div>

        <Tabs defaultValue="children" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="children" className="gap-2">
              <Baby className="h-4 w-4" />
              Мои дети
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Тесты
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Календарь занятий
            </TabsTrigger>
          </TabsList>

          <TabsContent value="children">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold">Мои дети</h3>
                <p className="text-sm text-muted-foreground">Управляйте профилями своих детей</p>
              </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-pink-600 hover:bg-pink-700 gap-2">
                <Plus className="h-4 w-4" />
                Добавить ребёнка
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
                    onValueChange={(value) => setNewChild({ ...newChild, educationLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите уровень" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class-group">
                    {newChild.educationLevel === "DO" ? "Группа" : "Класс"}
                  </Label>
                  <Input
                    id="class-group"
                    value={newChild.classOrGroup}
                    onChange={(e) => setNewChild({ ...newChild, classOrGroup: e.target.value })}
                    placeholder={newChild.educationLevel === "DO" ? "Средняя группа" : "5А"}
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Нужно для подбора рекомендаций по возрасту
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school-name">Образовательная организация (необязательно)</Label>
                  <Input
                    id="school-name"
                    value={newChild.schoolName}
                    onChange={(e) => setNewChild({ ...newChild, schoolName: e.target.value })}
                    placeholder="Школа № 1234"
                  />
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
                                {educationLevels.find(l => l.value === child.education_level)?.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
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
          </TabsContent>

          <TabsContent value="tests">
            <ParentTestsSection 
              parentUserId={profile?.id || ""} 
              children={children.map(c => ({ 
                id: c.id, 
                full_name: c.full_name,
                child_unique_id: c.child_unique_id
              }))} 
            />
          </TabsContent>

          <TabsContent value="calendar">
            <ParentCalendar 
              parentUserId={profile?.id || ""} 
              childIds={children.map(c => c.id)} 
            />
          </TabsContent>
        </Tabs>

        {/* Book Consultation Dialog */}
        <BookConsultationDialog
          open={bookDialogOpen}
          onOpenChange={setBookDialogOpen}
          parentUserId={profile?.id || ""}
          regionId={profile?.region_id || null}
          children={children.map(c => ({ id: c.id, full_name: c.full_name }))}
        />
      </main>
    </div>
  );
}
