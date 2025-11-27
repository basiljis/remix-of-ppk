import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, User, ArrowLeft, CreditCard, Receipt, Clock } from "lucide-react";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { PaymentStatusDialog } from "@/components/PaymentStatusDialog";
import { PaymentHistory } from "@/components/PaymentHistory";
import { Progress } from "@/components/ui/progress";
import { differenceInDays, addDays } from "date-fns";

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url || "");
      setNotificationsEnabled(profile.notifications_enabled ?? true);
      setEmailNotifications(profile.email_notifications ?? true);
    }
  }, [profile]);

  useEffect(() => {
    const checkTestMode = async () => {
      if (!user?.id) return;

      // Проверяем активную подписку через серверную функцию,
      // которая учитывает все сценарии активации (оплата, активация администратором и т.п.)
      const { data: hasActiveSubscription, error: hasActiveSubscriptionError } = await supabase
        .rpc('has_active_subscription', { _user_id: user.id });

      if (hasActiveSubscriptionError) {
        console.error('Error checking active subscription in Profile:', hasActiveSubscriptionError);
      }

      if (hasActiveSubscription) {
        setHasActiveSubscription(true);
        setDaysLeft(null);
        return;
      }

      // Если нет активной подписки, проверяем пробный период
      const { data: accessRequest } = await supabase
        .from('access_requests')
        .select('reviewed_at')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (accessRequest?.reviewed_at) {
        const approvalDate = new Date(accessRequest.reviewed_at);
        const testEndDate = addDays(approvalDate, 7);
        const today = new Date();
        const remainingDays = differenceInDays(testEndDate, today);

        if (remainingDays >= 0) {
          setDaysLeft(remainingDays);
          setHasActiveSubscription(false);
        } else {
          setDaysLeft(0);
          setHasActiveSubscription(false);
        }
      }
    };

    checkTestMode();
  }, [user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Успешно",
        description: "Аватар обновлен",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить аватар",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          notifications_enabled: notificationsEnabled,
          email_notifications: emailNotifications,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Профиль обновлен",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <PaymentStatusDialog />
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
        <h1 className="text-3xl font-bold">Профиль</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Профиль
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Подписка
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <Receipt className="h-4 w-4" />
            История платежей
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          {!hasActiveSubscription && daysLeft !== null && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Пробный период
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Осталось дней:</span>
                    <span className="font-semibold text-lg text-primary">
                      {daysLeft} {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}
                    </span>
                  </div>
                  <Progress value={(daysLeft / 7) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Тестовый период действует 7 дней с момента одобрения заявки
                  </p>
                </div>
                {daysLeft <= 2 && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <p className="text-sm text-orange-900 dark:text-orange-100">
                      Тестовый период скоро истекает. Оформите подписку во вкладке "Подписка"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Фотография профиля</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>Загрузить фото</span>
                    </div>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG или WEBP. Макс. 2МБ.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Личная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">ФИО</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Телефон</Label>
                  <Input value={profile.phone} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Должность</Label>
                  <Input value={profile.positions?.name || "—"} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Регион</Label>
                  <Input value={profile.regions?.name || "—"} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Организация</Label>
                  <Input value={profile.organizations?.name || "—"} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Настройки уведомлений</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Уведомления в системе</Label>
                  <p className="text-sm text-muted-foreground">
                    Получать уведомления в системе
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email уведомления</Label>
                  <p className="text-sm text-muted-foreground">
                    Получать уведомления на email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить изменения
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
          <SubscriptionForm />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
