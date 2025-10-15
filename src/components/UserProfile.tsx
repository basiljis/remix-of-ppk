import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Building2, MapPin, Briefcase, Mail, Phone } from "lucide-react";

export function UserProfile() {
  const { profile, roles } = useAuth();

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Загрузка профиля...</p>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: "Администратор",
      regional_operator: "Региональный оператор",
      user: "Пользователь",
    };
    return roleLabels[role] || role;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Профиль</h2>
        <p className="text-muted-foreground">
          Ваши личные данные и информация об организации
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Личная информация
          </CardTitle>
          <CardDescription>
            Данные, предоставленные при регистрации
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">ФИО</p>
              <p className="text-base">{profile.full_name}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Должность
              </p>
              <p className="text-base">{profile.positions?.name || "Не указана"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </p>
              <p className="text-base">{profile.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Телефон
              </p>
              <p className="text-base">{profile.phone}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Регион
              </p>
              <p className="text-base">{profile.regions?.name || "Не указан"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Роли</p>
              <div className="flex flex-wrap gap-2">
                {roles.map((role, index) => (
                  <Badge key={index} variant="secondary">
                    {getRoleLabel(role.role)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Образовательная организация
          </CardTitle>
          <CardDescription>
            Информация о вашей организации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Название организации</p>
              <p className="text-base font-medium">
                {profile.organizations?.name || "Не указана"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {profile.is_blocked && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Ограничение доступа</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Ваша учетная запись заблокирована. Обратитесь к администратору для получения дополнительной информации.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
