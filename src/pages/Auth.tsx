import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

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

      // If access request is pending/rejected, redirect to status page
      const { data: reqs } = await supabase
        .from("access_requests")
        .select("status")
        .eq("user_id", data.user.id)
        .order("requested_at", { ascending: false })
        .limit(1);
      const request = reqs?.[0];
      if (request && request.status !== "approved") {
        navigate("/access-status");
        return;
      }

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

      // Create access request instead of profile
      const { error: requestError } = await supabase.from("access_requests").insert({
        user_id: authData.user.id,
        full_name: validatedData.fullName,
        phone: validatedData.phone,
        email: validatedData.email,
        position_id: validatedData.positionId,
        region_id: validatedData.regionId,
        organization_id: validatedData.organizationId,
        status: "pending",
      });

      if (requestError) throw requestError;

      toast({
        title: "Заявка отправлена",
        description: "Ваша заявка на доступ отправлена администратору. Вы получите уведомление после её рассмотрения.",
      });

      // Перейти на страницу статуса заявки
      navigate("/access-status");

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
      setResetDialogOpen(false);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-0 bg-background rounded-2xl shadow-2xl overflow-hidden">
        {/* Left side - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Система управления протоколами ППК</h1>
            <p className="text-muted-foreground">Цифровое решение для работы психолого-педагогических консилиумов</p>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="signup">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <h2 className="text-2xl font-bold mb-2">Вход в систему</h2>
              <p className="text-muted-foreground text-sm mb-6">Введите свои учетные данные для входа</p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">Пароль</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Введите пароль"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium" 
                  disabled={loading}
                >
                  {loading ? "Вход..." : "Войти"}
                </Button>
                
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="w-full text-sm text-muted-foreground hover:text-primary">
                      Забыли пароль?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Сброс пароля</DialogTitle>
                      <DialogDescription>
                        Введите email для восстановления доступа
                      </DialogDescription>
                    </DialogHeader>
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
                  </DialogContent>
                </Dialog>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <h2 className="text-2xl font-bold mb-2">Регистрация</h2>
              <p className="text-muted-foreground text-sm mb-4">Создайте новый аккаунт для работы с системой</p>
              
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="fullName" className="text-sm">ФИО *</Label>
                    <Input
                      id="fullName"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      required
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm">Телефон *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7 (999) 999-99-99"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                      required
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">Email (логин) *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm">Пароль *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-sm">Должность *</Label>
                    <Select
                      value={signupData.positionId}
                      onValueChange={(value) => setSignupData({ ...signupData, positionId: value })}
                      required
                    >
                      <SelectTrigger className="h-10">
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
                    <Label htmlFor="region" className="text-sm">Регион *</Label>
                    <Select
                      value={signupData.regionId}
                      onValueChange={(value) => setSignupData({ ...signupData, regionId: value })}
                      required
                    >
                      <SelectTrigger className="h-10">
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

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm">Образовательная организация *</Label>
                    <OrganizationSelector
                      value={signupData.organizationId}
                      onChange={(value) => setSignupData({ ...signupData, organizationId: value })}
                      placeholder="Выберите организацию"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium" 
                  disabled={loading}
                >
                  {loading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side - Image */}
        <div className="hidden md:block relative bg-gradient-to-br from-primary to-primary/80">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white p-8">
              <h2 className="text-3xl font-bold mb-4">Добро пожаловать</h2>
              <p className="text-lg opacity-90">Профессиональный инструмент для эффективной работы ППК</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;