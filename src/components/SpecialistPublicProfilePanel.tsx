import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Link as LinkIcon, Copy, Check, User, Eye, EyeOff, Plus, X, Camera } from "lucide-react";

const COMMON_SPECIALIZATIONS = [
  "Педагог-психолог",
  "Логопед",
  "Дефектолог",
  "Нейропсихолог",
  "Клинический психолог",
  "Семейный психолог",
  "Детский психолог",
  "Специалист по раннему развитию",
  "ABA-терапевт",
  "Сенсорная интеграция",
];

export function SpecialistPublicProfilePanel() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isPublished, setIsPublished] = useState(false);
  const [publicSlug, setPublicSlug] = useState("");
  const [publicBio, setPublicBio] = useState("");
  const [publicPhotoUrl, setPublicPhotoUrl] = useState("");
  const [workExperience, setWorkExperience] = useState("");
  const [education, setEducation] = useState("");
  const [achievements, setAchievements] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [copied, setCopied] = useState(false);
  const [slugError, setSlugError] = useState("");

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["specialist-public-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, full_name, is_published, public_slug, public_bio, 
          public_photo_url, work_experience, education, achievements, 
          specializations, is_private_practice,
          organization:organizations(is_published, allow_employee_publishing)
        `)
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profileData) {
      setIsPublished(profileData.is_published || false);
      setPublicSlug(profileData.public_slug || "");
      setPublicBio(profileData.public_bio || "");
      setPublicPhotoUrl(profileData.public_photo_url || "");
      setWorkExperience(profileData.work_experience || "");
      setEducation(profileData.education || "");
      setAchievements(profileData.achievements || "");
      setSpecializations(profileData.specializations || []);
    }
  }, [profileData]);

  // Check if publishing is allowed
  const canPublish = profileData?.is_private_practice || 
    (profileData?.organization?.is_published && profileData?.organization?.allow_employee_publishing);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("No user");
      
      // Validate slug
      if (publicSlug) {
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(publicSlug)) {
          throw new Error("Ссылка может содержать только латинские буквы, цифры и дефис");
        }
        
        // Check uniqueness
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("public_slug", publicSlug)
          .neq("id", user.id)
          .maybeSingle();
        
        if (existing) {
          throw new Error("Эта ссылка уже занята");
        }
      }
      
      const { error } = await supabase
        .from("profiles")
        .update({
          is_published: isPublished,
          public_slug: publicSlug || null,
          public_bio: publicBio || null,
          public_photo_url: publicPhotoUrl || null,
          work_experience: workExperience || null,
          education: education || null,
          achievements: achievements || null,
          specializations: specializations.length > 0 ? specializations : null,
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialist-public-profile"] });
      toast({
        title: "Сохранено",
        description: "Публичный профиль обновлён",
      });
      setSlugError("");
    },
    onError: (error: Error) => {
      setSlugError(error.message);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const publicUrl = publicSlug 
    ? `${window.location.origin}/s/${publicSlug}`
    : user?.id 
      ? `${window.location.origin}/specialist/${user.id}`
      : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Ссылка скопирована",
    });
  };

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setPublicSlug(sanitized);
    setSlugError("");
  };

  const handleAddSpecialization = (spec: string) => {
    if (spec && !specializations.includes(spec)) {
      setSpecializations([...specializations, spec]);
    }
    setNewSpecialization("");
  };

  const handleRemoveSpecialization = (spec: string) => {
    setSpecializations(specializations.filter(s => s !== spec));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show warning if organization doesn't allow publishing
  if (!profileData?.is_private_practice && !canPublish) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Публичный профиль
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Публикация профиля недоступна</p>
            <p className="text-sm mt-2">
              Ваша организация не разрешает публикацию профилей сотрудников на сайте.
            </p>
            <p className="text-sm">
              Обратитесь к администратору организации для изменения этой настройки.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Публичный профиль
          </CardTitle>
          <CardDescription>
            Информация о вас для родителей и посетителей сайта
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Publishing toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {isPublished ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="is-published" className="font-medium">
                  Публиковать на сайте
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {isPublished 
                  ? "Ваш профиль виден в каталоге специалистов"
                  : "Доступ только по прямой ссылке"
                }
              </p>
            </div>
            <Switch
              id="is-published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>

          {/* Custom URL */}
          <div className="space-y-2">
            <Label htmlFor="public-slug">
              Адрес страницы
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center">
                <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">
                  {window.location.origin}/s/
                </span>
                <Input
                  id="public-slug"
                  value={publicSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="ivan-petrov"
                  className="rounded-l-none"
                />
              </div>
            </div>
            {slugError && (
              <p className="text-sm text-destructive">{slugError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Только латинские буквы, цифры и дефис
            </p>
          </div>

          {/* Share link */}
          {publicUrl && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate flex-1">{publicUrl}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {/* Photo URL */}
          <div className="space-y-2">
            <Label htmlFor="photo-url">
              Ссылка на фото
            </Label>
            <div className="flex gap-4">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {publicPhotoUrl ? (
                  <img 
                    src={publicPhotoUrl} 
                    alt="Фото профиля"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  id="photo-url"
                  value={publicPhotoUrl}
                  onChange={(e) => setPublicPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Рекомендуемый размер: 300x300 px
                </p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="public-bio">
              О себе
            </Label>
            <Textarea
              id="public-bio"
              value={publicBio}
              onChange={(e) => setPublicBio(e.target.value)}
              placeholder="Расскажите о себе, своём опыте и подходе к работе..."
              rows={4}
            />
          </div>

          {/* Specializations */}
          <div className="space-y-2">
            <Label>Направления работы</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {specializations.map((spec) => (
                <Badge key={spec} variant="secondary" className="gap-1">
                  {spec}
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecialization(spec)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                placeholder="Добавить направление..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSpecialization(newSpecialization);
                  }
                }}
              />
              <Button 
                type="button"
                variant="outline"
                onClick={() => handleAddSpecialization(newSpecialization)}
                disabled={!newSpecialization}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {COMMON_SPECIALIZATIONS.filter(s => !specializations.includes(s)).slice(0, 5).map((spec) => (
                <Badge 
                  key={spec} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-accent text-xs"
                  onClick={() => handleAddSpecialization(spec)}
                >
                  + {spec}
                </Badge>
              ))}
            </div>
          </div>

          {/* Work experience */}
          <div className="space-y-2">
            <Label htmlFor="work-experience">
              Опыт работы
            </Label>
            <Input
              id="work-experience"
              value={workExperience}
              onChange={(e) => setWorkExperience(e.target.value)}
              placeholder="Например: 10 лет в сфере детской психологии"
            />
          </div>

          {/* Education */}
          <div className="space-y-2">
            <Label htmlFor="education">
              Образование
            </Label>
            <Textarea
              id="education"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Укажите ваше образование и квалификацию..."
              rows={3}
            />
          </div>

          {/* Achievements */}
          <div className="space-y-2">
            <Label htmlFor="achievements">
              Достижения и сертификаты
            </Label>
            <Textarea
              id="achievements"
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              placeholder="Курсы повышения квалификации, сертификаты, награды..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="gap-2"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Сохранить профиль
        </Button>
      </div>
    </div>
  );
}
