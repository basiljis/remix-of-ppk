import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Baby, Mail, Phone, MapPin, Bell, 
  Camera, Save, User, Calendar, GraduationCap,
  BellRing, BellOff
} from "lucide-react";

interface ParentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  region_id: string | null;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
}

interface ParentProfileSectionProps {
  profile: ParentProfile;
  regions: Array<{ id: string; name: string }>;
  childrenCount: number;
  onProfileUpdate: (updates: Partial<ParentProfile>) => void;
}

export function ParentProfileSection({ 
  profile, 
  regions, 
  childrenCount,
  onProfileUpdate 
}: ParentProfileSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [editedRegionId, setEditedRegionId] = useState(profile.region_id || "");
  const [editedPhone, setEditedPhone] = useState(profile.phone);
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile.notifications_enabled ?? true);
  const [emailNotifications, setEmailNotifications] = useState(profile.email_notifications ?? true);
  
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("parent_profiles" as any)
        .update({ 
          region_id: editedRegionId || null,
          phone: editedPhone,
          notifications_enabled: notificationsEnabled,
          email_notifications: emailNotifications,
        })
        .eq("id", profile.id) as { error: any };
      
      if (error) throw error;
    },
    onSuccess: () => {
      onProfileUpdate({
        region_id: editedRegionId || null,
        phone: editedPhone,
        notifications_enabled: notificationsEnabled,
        email_notifications: emailNotifications,
      });
      setEditingProfile(false);
      toast({ title: "Профиль обновлён" });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleNotification = async (type: 'push' | 'email', value: boolean) => {
    try {
      const updateData = type === 'push' 
        ? { notifications_enabled: value }
        : { email_notifications: value };
      
      const { error } = await supabase
        .from("parent_profiles" as any)
        .update(updateData)
        .eq("id", profile.id) as { error: any };

      if (error) throw error;

      if (type === 'push') {
        setNotificationsEnabled(value);
      } else {
        setEmailNotifications(value);
      }
      
      toast({ 
        title: value ? "Уведомления включены" : "Уведомления отключены" 
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Профиль</h2>
        <p className="text-muted-foreground">Управление вашим аккаунтом и уведомлениями</p>
      </div>

      {/* Main Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="h-16 w-16 bg-pink-100 dark:bg-pink-950 border-2 border-pink-200">
              <AvatarFallback className="text-pink-600 text-2xl font-bold">
                {profile.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl">{profile.full_name}</div>
              <Badge variant="outline" className="mt-1 text-pink-600 border-pink-300">
                <Baby className="h-3 w-3 mr-1" />
                Родитель
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Телефон</p>
              {editingProfile ? (
                <Input
                  value={editedPhone}
                  onChange={(e) => setEditedPhone(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  className="mt-1"
                />
              ) : (
                <p className="font-medium">{profile.phone}</p>
              )}
            </div>
          </div>

          {/* Region */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Регион</p>
              {editingProfile ? (
                <Select value={editedRegionId} onValueChange={setEditedRegionId}>
                  <SelectTrigger className="mt-1">
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
              ) : (
                <p className="font-medium">
                  {regions.find(r => r.id === profile.region_id)?.name || "Не указан"}
                </p>
              )}
            </div>
          </div>

          {/* Children count */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Количество детей</p>
              <p className="font-medium">{childrenCount}</p>
            </div>
          </div>

          {/* Edit buttons */}
          {editingProfile ? (
            <div className="flex gap-2">
              <Button 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Сохранить
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingProfile(false);
                  setEditedRegionId(profile.region_id || "");
                  setEditedPhone(profile.phone);
                }}
              >
                Отмена
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setEditingProfile(true)}>
              Редактировать профиль
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-pink-600" />
            Уведомления
          </CardTitle>
          <CardDescription>
            Настройте, какие уведомления вы хотите получать
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Push notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {notificationsEnabled ? (
                <BellRing className="h-5 w-5 text-pink-600" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Push-уведомления</p>
                <p className="text-sm text-muted-foreground">
                  Уведомления о занятиях и напоминания
                </p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={(checked) => toggleNotification('push', checked)}
            />
          </div>

          {/* Email notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className={`h-5 w-5 ${emailNotifications ? 'text-pink-600' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium">Email-уведомления</p>
                <p className="text-sm text-muted-foreground">
                  Напоминания о занятиях и результаты тестов
                </p>
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={(checked) => toggleNotification('email', checked)}
            />
          </div>

          <Separator />

          <div className="text-sm text-muted-foreground">
            <p>Уведомления помогут вам не пропустить занятия и важные события.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
