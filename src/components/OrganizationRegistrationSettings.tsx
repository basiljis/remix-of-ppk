import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Users, Info } from "lucide-react";

export function OrganizationRegistrationSettings() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const organizationId = profile?.organization_id;

  // Fetch current organization settings
  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization-registration-settings", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, allow_parent_registration")
        .eq("id", organizationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const updateMutation = useMutation({
    mutationFn: async (allowRegistration: boolean) => {
      if (!organizationId) throw new Error("Организация не найдена");
      
      const { error } = await supabase
        .from("organizations")
        .update({ allow_parent_registration: allowRegistration })
        .eq("id", organizationId);
      
      if (error) throw error;
    },
    onSuccess: (_, allowRegistration) => {
      queryClient.invalidateQueries({ queryKey: ["organization-registration-settings"] });
      toast({
        title: allowRegistration 
          ? "Регистрация разрешена" 
          : "Регистрация отключена",
        description: allowRegistration
          ? "Родители теперь могут записываться на консультации через личный кабинет"
          : "Организация скрыта из поиска для родителей",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!organizationId) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Вы не привязаны к организации
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Регистрация родителей
        </CardTitle>
        <CardDescription>
          Настройки видимости организации для родителей
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="allow-registration" className="text-base font-medium">
              Разрешить запись через личный кабинет
            </Label>
            <p className="text-sm text-muted-foreground">
              Если включено, родители смогут находить вашу организацию и её специалистов 
              в поиске и записываться на консультации
            </p>
          </div>
          <Switch
            id="allow-registration"
            checked={organization?.allow_parent_registration ?? true}
            onCheckedChange={(checked) => updateMutation.mutate(checked)}
            disabled={updateMutation.isPending}
          />
        </div>

        {!organization?.allow_parent_registration && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Регистрация отключена. Организация и её специалисты скрыты из поиска для родителей.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
