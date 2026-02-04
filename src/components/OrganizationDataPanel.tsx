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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Link as LinkIcon, Copy, Check, Upload, Building2, Globe, Eye, EyeOff } from "lucide-react";

export function OrganizationDataPanel() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isPublished, setIsPublished] = useState(false);
  const [publicSlug, setPublicSlug] = useState("");
  const [publicDescription, setPublicDescription] = useState("");
  const [allowEmployeePublishing, setAllowEmployeePublishing] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [slugError, setSlugError] = useState("");

  const organizationId = profile?.organization_id;

  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization-public-data", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, is_published, public_slug, public_description, allow_employee_publishing, logo_url")
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
    ? `${window.location.origin}/o/${publicSlug}`
    : organizationId 
      ? `${window.location.origin}/organization/${organizationId}`
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
                  {window.location.origin}/o/
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

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logo-url">
              Ссылка на логотип
            </Label>
            <Input
              id="logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Вставьте ссылку на изображение логотипа (рекомендуемый размер: 200x200 px)
            </p>
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
        <CardContent>
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
