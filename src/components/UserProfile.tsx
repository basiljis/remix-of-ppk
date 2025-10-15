import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User, Building2, Mail, Phone, MapPin, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserProfileData {
  full_name: string;
  email: string;
  phone: string;
  region_id: string;
  is_blocked: boolean;
  position_name?: string;
  organization_name?: string;
  organization_district?: string;
  organization_type?: string;
  roles: string[];
}

export const UserProfile = () => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Пользователь не авторизован");
        setLoading(false);
        return;
      }

      await loadProfileDirect(user.id);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileDirect = async (userId: string) => {
    // Direct SQL queries using raw queries
    const profileData: Partial<UserProfileData> = {
      full_name: '',
      email: '',
      phone: '',
      region_id: '',
      is_blocked: false,
      roles: []
    };

    try {
      // Get basic profile
      const { data: profile } = await supabase
        .from('profiles' as any)
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        const p = profile as any;
        profileData.full_name = p.full_name;
        profileData.email = p.email;
        profileData.phone = p.phone;
        profileData.region_id = p.region_id;
        profileData.is_blocked = p.is_blocked;

        // Get position
        if (p.position_id) {
          const { data: position } = await supabase
            .from('positions' as any)
            .select('name')
            .eq('id', p.position_id)
            .single();
          if (position) profileData.position_name = (position as any).name;
        }

        // Get organization
        if (p.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name, district, type')
            .eq('id', p.organization_id)
            .single();
          if (org) {
            profileData.organization_name = org.name;
            profileData.organization_district = org.district || undefined;
            profileData.organization_type = org.type || undefined;
          }
        }
      }

      // Get roles
      const { data: roles } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', userId);
      
      if (roles) {
        profileData.roles = roles.map((r: any) => r.role);
      }

      setProfile(profileData as UserProfileData);
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Загрузка профиля...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Профиль не найден</AlertDescription>
      </Alert>
    );
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Администратор",
      regional_operator: "Региональный оператор",
      user: "Пользователь"
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Профиль</h2>
        <p className="text-muted-foreground">
          Информация о вашей учетной записи и организации
        </p>
      </div>

      {profile.is_blocked && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ваша учетная запись заблокирована. Обратитесь к администратору.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Личные данные
          </CardTitle>
          <CardDescription>Основная информация о пользователе</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">ФИО</div>
              <div className="text-base">{profile.full_name}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Должность</div>
              <div className="text-base">{profile.position_name || "Не указана"}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <div className="text-base">{profile.email}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Телефон
              </div>
              <div className="text-base">{profile.phone}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Регион
              </div>
              <div className="text-base">{profile.region_id}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Роли
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.roles && profile.roles.length > 0 ? (
                  profile.roles.map((role, idx) => (
                    <Badge key={idx} variant="secondary">
                      {getRoleLabel(role)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Роли не назначены</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {profile.organization_name && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Образовательная организация
            </CardTitle>
            <CardDescription>Место работы</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <div className="text-sm font-medium text-muted-foreground mb-1">Название</div>
                <div className="text-base font-medium">{profile.organization_name}</div>
              </div>

              {profile.organization_type && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Тип</div>
                  <div className="text-base">{profile.organization_type}</div>
                </div>
              )}

              {profile.organization_district && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Округ</div>
                  <div className="text-base">{profile.organization_district}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
