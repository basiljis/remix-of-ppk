import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { OrganizationSelector } from "@/components/OrganizationSelector";

const phoneRegex = /^(\+7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;

const signupSchema = z.object({
  fullName: z.string().min(1, "ФИО обязательно для заполнения"),
  phone: z.string().regex(phoneRegex, "Некорректный формат телефона"),
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  positionId: z.string().min(1, "Должность обязательна для заполнения"),
  regionId: z.string().min(1, "Регион обязателен для заполнения"),
  organizationId: z.string().min(1, "Организация обязательна для заполнения"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if already authenticated
  if (user) {
    navigate("/");
    return null;
  }

  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupData, setSignupData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    positionId: "",
    regionId: "",
    organizationId: "",
  });

  // Reset password form
  const [resetEmail, setResetEmail] = useState("");

  // Load reference data
  useState(() => {
    const loadRefData = async () => {
      const [regionsRes, positionsRes] = await Promise.all([
        supabase.from("regions").select("*").order("name"),
        supabase.from("positions").select("*").order("name"),
      ]);

      if (regionsRes.data) setRegions(regionsRes.data);
      if (positionsRes.data) setPositions(positionsRes.data);
    };
    loadRefData();
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      // Check if user is blocked
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_blocked")
        .eq("id", data.user.id)
        .single();

      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        toast({
          title: "Доступ заблокирован",
          description: "Ваш аккаунт был заблокирован администратором",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Вход выполнен",
        description: "Добро пожаловать!",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Ошибка входа",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      const validatedData = signupSchema.parse(signupData);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validatedData.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Не удалось создать пользователя");

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        full_name: validatedData.fullName,
        phone: validatedData.phone,
        email: validatedData.email,
        position_id: validatedData.positionId,
        region_id: validatedData.regionId,
        organization_id: validatedData.organizationId,
      });

      if (profileError) throw profileError;

      toast({
        title: "Регистрация завершена",
        description: "Проверьте почту для подтверждения аккаунта",
      });

      // Clear form
      setSignupData({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        positionId: "",
        regionId: "",
        organizationId: "",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Не удалось зарегистрировать пользователя",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Письмо отправлено",
        description: "Проверьте почту для восстановления пароля",
      });
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Система управления протоколами ППК</CardTitle>
          <CardDescription>Вход в систему или регистрация нового пользователя</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="signup">Регистрация</TabsTrigger>
              <TabsTrigger value="reset">Сброс пароля</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Вход..." : "Войти"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">ФИО *</Label>
                  <Input
                    id="fullName"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (999) 999-99-99"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (логин) *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Пароль *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Должность *</Label>
                  <Select
                    value={signupData.positionId}
                    onValueChange={(value) => setSignupData({ ...signupData, positionId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите должность" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Регион *</Label>
                  <Select
                    value={signupData.regionId}
                    onValueChange={(value) => setSignupData({ ...signupData, regionId: value })}
                    required
                  >
                    <SelectTrigger>
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
                </div>

                <div className="space-y-2">
                  <Label>Образовательная организация *</Label>
                  <OrganizationSelector
                    value={signupData.organizationId}
                    onChange={(value) => setSignupData({ ...signupData, organizationId: value })}
                    placeholder="Выберите организацию"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="reset" className="space-y-4">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Отправка..." : "Отправить ссылку для сброса"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;