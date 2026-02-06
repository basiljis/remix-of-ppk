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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Link as LinkIcon, Copy, Check, Upload, Building2, Eye, EyeOff, Image as ImageIcon, X } from "lucide-react";

const PRODUCTION_DOMAIN = "https://unvrsm.ru";

export function OrganizationDataPanel() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isPublished, setIsPublished] = useState(false);
  const [publicSlug, setPublicSlug] = useState("");
  const [publicDescription, setPublicDescription] = useState("");
  const [allowEmployeePublishing, setAllowEmployeePublishing] = useState(true);
  const [allowEmployeePricing, setAllowEmployeePricing] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const organizationId = profile?.organization_id;

  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization-public-data", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, is_published, public_slug, public_description, allow_employee_publishing, allow_employee_pricing, logo_url")
        .eq("id", organizationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  useEffect(() => {
    if (organization) {
      setIsPublished(organization.is_published || false);
      setPublicSlug(organization.public_slug || "");
      setPublicDescription(organization.public_description || "");
      setAllowEmployeePublishing(organization.allow_employee_publishing ?? true);
      setAllowEmployeePricing(organization.allow_employee_pricing ?? false);
      setLogoUrl(organization.logo_url || "");
    }
  }, [organization]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("No organization");
      
      // Validate slug
      if (publicSlug) {
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(publicSlug)) {
          throw new Error("Ссылка может содержать только латинские буквы, цифры и дефис");
        }
        
        // Check uniqueness
        const { data: existing } = await supabase
          .from("organizations")
          .select("id")
          .eq("public_slug", publicSlug)
          .neq("id", organizationId)
          .maybeSingle();
        
        if (existing) {
          throw new Error("Эта ссылка уже занята");
        }
      }
      
      const { error } = await supabase
        .from("organizations")
        .update({
          is_published: isPublished,
          public_slug: publicSlug || null,
          public_description: publicDescription || null,
          allow_employee_publishing: allowEmployeePublishing,
          allow_employee_pricing: allowEmployeePricing,
          logo_url: logoUrl || null,
        })
        .eq("id", organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-public-data"] });
      toast({
        title: "Сохранено",
        description: "Настройки публикации обновлены",
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
    ? `${PRODUCTION_DOMAIN}/o/${publicSlug}`
    : organizationId 
      ? `${PRODUCTION_DOMAIN}/organization/${organizationId}`
      : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Ссылка скопирована",
      description: "Ссылка скопирована в буфер обмена",
    });
  };

  const handleSlugChange = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setPublicSlug(sanitized);
    setSlugError("");
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organizationId) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Неверный формат",
        description: "Поддерживаются только PNG, JPG и WebP",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Файл слишком большой",
        description: "Максимальный размер логотипа — 2 МБ",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizationId}/logo.${fileExt}`;

      // Upload to avatars bucket (it's public and already exists)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      
      toast({
        title: "Логотип загружен",
        description: "Не забудьте сохранить изменения",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить логотип",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Данные об организации
          </CardTitle>
          <CardDescription>
            Настройки публичного профиля организации на сайте
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
                  ? "Организация отображается в публичном каталоге"
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
                  {PRODUCTION_DOMAIN}/o/
                </span>
                <Input
                  id="public-slug"
                  value={publicSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-organization"
                  className="rounded-l-none"
                />
              </div>
            </div>
            {slugError && (
              <p className="text-sm text-destructive">{slugError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Только латинские буквы, цифры и дефис. Например: school-123
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="public-description">
              Описание для посетителей
            </Label>
            <Textarea
              id="public-description"
              value={publicDescription}
              onChange={(e) => setPublicDescription(e.target.value)}
              placeholder="Расскажите о вашей организации, направлениях работы и услугах..."
              rows={4}
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-3">
            <Label>Логотип организации</Label>
            
            {logoUrl ? (
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img 
                    src={logoUrl} 
                    alt="Логотип" 
                    className="w-24 h-24 object-contain rounded-lg border bg-muted"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Логотип загружен. Чтобы заменить, удалите текущий и загрузите новый.
                  </p>
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {isUploadingLogo ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Загрузка...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Нажмите для загрузки</p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG или WebP до 2 МБ
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-md">
              <p className="font-medium">Требования к логотипу:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Рекомендуемый размер: 200×200 пикселей</li>
                <li>Формат: PNG (с прозрачным фоном), JPG или WebP</li>
                <li>Квадратные пропорции для лучшего отображения</li>
                <li>Максимальный размер файла: 2 МБ</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee publishing settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Настройки сотрудников</CardTitle>
          <CardDescription>
            Управление видимостью профилей сотрудников на сайте
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="allow-employee-publishing" className="font-medium">
                Разрешить публикацию профилей сотрудников
              </Label>
              <p className="text-sm text-muted-foreground">
                {allowEmployeePublishing 
                  ? "Сотрудники могут публиковать свои профили на сайте"
                  : "Профили сотрудников скрыты из публичного доступа"
                }
              </p>
            </div>
            <Switch
              id="allow-employee-publishing"
              checked={allowEmployeePublishing}
              onCheckedChange={setAllowEmployeePublishing}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="allow-employee-pricing" className="font-medium">
                Разрешить отображение стоимости услуг
              </Label>
              <p className="text-sm text-muted-foreground">
                {allowEmployeePricing
                  ? "Сотрудники могут указывать стоимость услуг на публичной странице"
                  : "Блок «Стоимость услуг» скрыт для сотрудников"
                }
              </p>
            </div>
            <Switch
              id="allow-employee-pricing"
              checked={allowEmployeePricing}
              onCheckedChange={setAllowEmployeePricing}
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
          Сохранить изменения
        </Button>
      </div>
    </div>
  );
}
