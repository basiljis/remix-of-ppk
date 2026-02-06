import { useState, useEffect, useRef } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Link as LinkIcon, Copy, Check, User, Eye, EyeOff, Plus, X, Camera, Wallet, Clock, Percent, Package, MapPin, Monitor, Globe, Upload, Trash2 } from "lucide-react";
import { MOSCOW_DISTRICTS } from "@/constants/moscowDistricts";

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

interface SessionPackage {
  sessions: number;
  price: number;
  discount?: number;
}

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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pricing fields
  const [consultationPrice, setConsultationPrice] = useState<number | "">("");
  const [consultationDuration, setConsultationDuration] = useState<number>(60);
  const [sessionPackages, setSessionPackages] = useState<SessionPackage[]>([]);
  const [showPricing, setShowPricing] = useState(false);
  
  // Work format fields
  const [workFormat, setWorkFormat] = useState<string>("offline");
  const [workDistrict, setWorkDistrict] = useState<string>("");

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["specialist-public-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, full_name, is_published, public_slug, public_bio, 
          public_photo_url, work_experience, education, achievements, 
          specializations, is_private_practice, show_pricing,
          consultation_price, consultation_duration, session_packages,
          work_format, work_district,
          organization:organizations(is_published, allow_employee_publishing, allow_employee_pricing)
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
      setConsultationPrice(profileData.consultation_price || "");
      setConsultationDuration(profileData.consultation_duration || 60);
      setSessionPackages(Array.isArray(profileData.session_packages) ? profileData.session_packages as unknown as SessionPackage[] : []);
      setWorkFormat(profileData.work_format || "offline");
      setWorkDistrict(profileData.work_district || "");
      setShowPricing(profileData.show_pricing || false);
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
          consultation_price: consultationPrice || null,
          consultation_duration: consultationDuration,
          session_packages: sessionPackages.length > 0 ? JSON.parse(JSON.stringify(sessionPackages)) : [],
          work_format: workFormat,
          work_district: workFormat === "online" ? null : (workDistrict || null),
          show_pricing: showPricing,
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

  const PRODUCTION_DOMAIN = "https://unvrsm.ru";
  
  const publicUrl = publicSlug 
    ? `${PRODUCTION_DOMAIN}/s/${publicSlug}`
    : user?.id 
      ? `${PRODUCTION_DOMAIN}/specialist/${user.id}`
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

  const handleAddPackage = () => {
    setSessionPackages([...sessionPackages, { sessions: 5, price: 0, discount: 0 }]);
  };

  const handleUpdatePackage = (index: number, field: keyof SessionPackage, value: number) => {
    const updated = [...sessionPackages];
    updated[index] = { ...updated[index], [field]: value };
    setSessionPackages(updated);
  };

  const handleRemovePackage = (index: number) => {
    setSessionPackages(sessionPackages.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ошибка",
        description: "Можно загружать только изображения",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Максимальный размер файла — 2 МБ",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Generate file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/photo.${fileExt}`;

      // Delete old photo if exists
      await supabase.storage.from('avatars').remove([filePath]);

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update the photo URL with cache buster
      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setPublicPhotoUrl(photoUrl);

      toast({
        title: "Фото загружено",
        description: "Не забудьте сохранить изменения",
      });
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id) return;
    
    try {
      // Try to remove from storage
      const extensions = ['jpg', 'jpeg', 'png', 'webp'];
      for (const ext of extensions) {
        await supabase.storage.from('avatars').remove([`${user.id}/photo.${ext}`]);
      }
      
      setPublicPhotoUrl("");
      toast({
        title: "Фото удалено",
        description: "Не забудьте сохранить изменения",
      });
    } catch (error) {
      console.error('Photo remove error:', error);
    }
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

          {/* Work Format */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Формат работы
              </Label>
              <RadioGroup value={workFormat} onValueChange={setWorkFormat} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offline" id="work-offline" />
                  <Label htmlFor="work-offline" className="flex items-center gap-1 cursor-pointer">
                    <MapPin className="h-4 w-4" />
                    Офлайн
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="work-online" />
                  <Label htmlFor="work-online" className="flex items-center gap-1 cursor-pointer">
                    <Monitor className="h-4 w-4" />
                    Онлайн
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="work-both" />
                  <Label htmlFor="work-both" className="cursor-pointer">
                    Оба формата
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* District selector - only for offline or both */}
            {(workFormat === "offline" || workFormat === "both") && (
              <div className="space-y-2">
                <Label htmlFor="work-district">Округ Москвы (для офлайн занятий)</Label>
                <Select value={workDistrict || "not-specified"} onValueChange={(val) => setWorkDistrict(val === "not-specified" ? "" : val)}>
                  <SelectTrigger id="work-district">
                    <SelectValue placeholder="Выберите округ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-specified">Не указан</SelectItem>
                    {MOSCOW_DISTRICTS.map(district => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Укажите округ, чтобы родители из вашего района могли легко вас найти
                </p>
              </div>
            )}
          </div>

          {/* Custom URL */}
          <div className="space-y-2">
            <Label htmlFor="public-slug">
              Адрес страницы
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center">
                <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0 whitespace-nowrap">
                  {PRODUCTION_DOMAIN}/s/
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

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Фото профиля</Label>
            <div className="flex gap-4 items-start">
              <div className="relative h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-dashed border-muted-foreground/30">
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
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {publicPhotoUrl ? "Заменить" : "Загрузить"}
                  </Button>
                  {publicPhotoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePhoto}
                      disabled={isUploadingPhoto}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG или WebP. Максимум 2 МБ. Рекомендуемый размер: 300×300 px
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

      {/* Pricing Card - For private practice or when org allows */}
      {(profileData?.is_private_practice || profileData?.organization?.allow_employee_pricing) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Стоимость услуг
            </CardTitle>
            <CardDescription>
              Информация о ценах для родителей на публичной странице
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Show pricing on public page toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {showPricing ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="show-pricing" className="font-medium">
                    Показывать на сайте
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {showPricing 
                    ? "Цены видны на вашей публичной странице"
                    : "Цены скрыты от посетителей сайта"
                  }
                </p>
              </div>
              <Switch
                id="show-pricing"
                checked={showPricing}
                onCheckedChange={setShowPricing}
              />
            </div>

            {/* Single consultation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultation-price" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Стоимость консультации
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="consultation-price"
                    type="number"
                    min={0}
                    value={consultationPrice}
                    onChange={(e) => setConsultationPrice(e.target.value ? Number(e.target.value) : "")}
                    placeholder="2500"
                  />
                  <span className="text-sm text-muted-foreground">₽</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="consultation-duration" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Продолжительность
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="consultation-duration"
                    type="number"
                    min={15}
                    step={15}
                    value={consultationDuration}
                    onChange={(e) => setConsultationDuration(Number(e.target.value) || 60)}
                    placeholder="60"
                  />
                  <span className="text-sm text-muted-foreground">мин</span>
                </div>
              </div>
            </div>

            {/* Session packages */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Пакеты занятий
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPackage}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Добавить пакет
                </Button>
              </div>
              
              {sessionPackages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Добавьте пакеты сессий со скидками для привлечения клиентов
                </p>
              ) : (
                <div className="space-y-3">
                  {sessionPackages.map((pkg, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Сессий</Label>
                          <Input
                            type="number"
                            min={2}
                            value={pkg.sessions}
                            onChange={(e) => handleUpdatePackage(index, 'sessions', Number(e.target.value))}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Цена (₽)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={pkg.price}
                            onChange={(e) => handleUpdatePackage(index, 'price', Number(e.target.value))}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Скидка
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={pkg.discount || 0}
                            onChange={(e) => handleUpdatePackage(index, 'discount', Number(e.target.value))}
                            className="h-8"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemovePackage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {consultationPrice && sessionPackages.length > 0 && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-2">Предпросмотр:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• 1 консультация: {Number(consultationPrice).toLocaleString('ru-RU')} ₽</li>
                    {sessionPackages.map((pkg, i) => (
                      <li key={i}>
                        • {pkg.sessions} {pkg.sessions === 1 ? 'сессия' : pkg.sessions < 5 ? 'сессии' : 'сессий'}: {pkg.price.toLocaleString('ru-RU')} ₽
                        {pkg.discount ? ` (скидка ${pkg.discount}%)` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
