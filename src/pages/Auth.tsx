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
import { DataProcessingAgreement } from "@/components/DataProcessingAgreement";
import { Checkbox } from "@/components/ui/checkbox";

const signupSchema = z.object({
  fullName: z.string()
    .trim()
    .min(1, "ФИО обязательно для заполнения")
    .max(200, "ФИО слишком длинное")
    .regex(/^[а-яА-ЯёЁa-zA-Z\s\-]+$/, "Только буквы, пробелы и дефисы"),
  phone: z.string()
    .regex(/^\+?7[0-9]{10}$/, "Формат: +79991234567")
    .transform(val => val.replace(/[^0-9+]/g, '')),
  email: z.string()
    .trim()
    .email("Некорректный email")
    .max(255, "Email слишком длинный"),
  password: z.string()
    .min(8, "Минимум 8 символов")
    .regex(/[A-ZА-Я]/, "Нужна заглавная буква")
    .regex(/[0-9]/, "Нужна цифра"),
  positionId: z.string().min(1, "Должность обязательна для заполнения"),
  regionId: z.string().min(1, "Регион обязателен для заполнения"),
  organizationId: z.string().min(1, "Организация обязательна для заполнения"),
  role: z.enum(["user", "regional_operator", "admin"], { 
    errorMap: () => ({ message: "Роль обязательна для заполнения" })
  }),
  dataProcessingConsent: z.boolean().refine(val => val === true, {
    message: "Необходимо согласие на обработку персональных данных"
  }),
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
    role: "user" as "user" | "regional_operator" | "admin",
    dataProcessingConsent: false,
  });

  // Validation errors
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

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
    setSignupErrors({});

    try {
      // Validate form data
      const result = signupSchema.safeParse(signupData);
      
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path[0] as string;
          errors[path] = issue.message;
        });
        setSignupErrors(errors);
        setLoading(false);
        return;
      }
      
      const validatedData = result.data;

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
        role: validatedData.role,
        status: "pending",
      });

      if (requestError) throw requestError;

      // Send registration confirmation email
      try {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", validatedData.organizationId)
          .single();

        await supabase.functions.invoke('send-registration-email', {
          body: {
            email: validatedData.email,
            fullName: validatedData.fullName,
            organizationName: orgData?.name,
          },
        });
      } catch (emailError) {
        console.error("Error sending registration email:", emailError);
        // Don't fail registration if email fails
      }

      toast({
        title: "Заявка отправлена",
        description: "Ваша заявка на доступ отправлена администратору. Вы получите уведомление на email после её рассмотрения.",
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
        role: "user",
        dataProcessingConsent: false,
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
    
    const emailValue = resetEmail?.trim() || "";
    
    if (!emailValue) {
      toast({
        title: "Ошибка",
        description: "Введите email для восстановления пароля",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      toast({
        title: "Ошибка",
        description: "Некорректный формат email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Письмо отправлено",
        description: "Проверьте почту для восстановления пароля. Перейдите по ссылке в письме для создания нового пароля.",
      });
      setResetEmail("");
      setResetDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить письмо для восстановления пароля",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
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
                      onChange={(e) => {
                        setSignupData({ ...signupData, fullName: e.target.value });
                        setSignupErrors({ ...signupErrors, fullName: "" });
                      }}
                      required
                      className={`h-10 ${signupErrors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {signupErrors.fullName && (
                      <p className="text-sm text-destructive">{signupErrors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm">Телефон *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7 (999) 999-99-99"
                      value={signupData.phone}
                      onChange={(e) => {
                        setSignupData({ ...signupData, phone: e.target.value });
                        setSignupErrors({ ...signupErrors, phone: "" });
                      }}
                      required
                      className={`h-10 ${signupErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {signupErrors.phone && (
                      <p className="text-sm text-destructive">{signupErrors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">Email (логин) *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => {
                        setSignupData({ ...signupData, email: e.target.value });
                        setSignupErrors({ ...signupErrors, email: "" });
                      }}
                      required
                      className={`h-10 ${signupErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {signupErrors.email && (
                      <p className="text-sm text-destructive">{signupErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm">Пароль *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => {
                        setSignupData({ ...signupData, password: e.target.value });
                        setSignupErrors({ ...signupErrors, password: "" });
                      }}
                      required
                      className={`h-10 ${signupErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {signupErrors.password && (
                      <p className="text-sm text-destructive">{signupErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-sm">Должность *</Label>
                    <Select
                      value={signupData.positionId}
                      onValueChange={(value) => {
                        setSignupData({ ...signupData, positionId: value });
                        setSignupErrors({ ...signupErrors, positionId: "" });
                      }}
                      required
                    >
                      <SelectTrigger className={`h-10 ${signupErrors.positionId ? "border-destructive focus-visible:ring-destructive" : ""}`}>
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
                    {signupErrors.positionId && (
                      <p className="text-sm text-destructive">{signupErrors.positionId}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-sm">Регион *</Label>
                    <Select
                      value={signupData.regionId}
                      onValueChange={(value) => {
                        setSignupData({ ...signupData, regionId: value });
                        setSignupErrors({ ...signupErrors, regionId: "" });
                      }}
                      required
                    >
                      <SelectTrigger className={`h-10 ${signupErrors.regionId ? "border-destructive focus-visible:ring-destructive" : ""}`}>
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
                    {signupErrors.regionId && (
                      <p className="text-sm text-destructive">{signupErrors.regionId}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm">Роль *</Label>
                    <Select
                      value={signupData.role}
                      onValueChange={(value: "user" | "regional_operator" | "admin") => {
                        setSignupData({ ...signupData, role: value });
                        setSignupErrors({ ...signupErrors, role: "" });
                      }}
                      required
                    >
                      <SelectTrigger className={`h-10 ${signupErrors.role ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Пользователь</SelectItem>
                        <SelectItem value="regional_operator">Региональный оператор</SelectItem>
                        <SelectItem value="admin">Администратор</SelectItem>
                      </SelectContent>
                    </Select>
                    {signupErrors.role && (
                      <p className="text-sm text-destructive">{signupErrors.role}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <OrganizationSelector
                      value={signupData.organizationId}
                      onChange={(value) => {
                        setSignupData({ ...signupData, organizationId: value });
                        setSignupErrors({ ...signupErrors, organizationId: "" });
                      }}
                      placeholder="Если не нашли организацию выберите Иное..."
                      regionFilter={signupData.regionId}
                    />
                    {signupErrors.organizationId && (
                      <p className="text-sm text-destructive">{signupErrors.organizationId}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="dataProcessingConsent"
                        checked={signupData.dataProcessingConsent}
                        onCheckedChange={(checked) => {
                          setSignupData({ ...signupData, dataProcessingConsent: checked as boolean });
                          setSignupErrors({ ...signupErrors, dataProcessingConsent: "" });
                        }}
                        className={signupErrors.dataProcessingConsent ? "border-destructive" : ""}
                      />
                      <label
                        htmlFor="dataProcessingConsent"
                        className="text-sm leading-tight cursor-pointer"
                      >
                        Я согласен на обработку персональных данных в соответствии с{" "}
                        <DataProcessingAgreement />
                      </label>
                    </div>
                    {signupErrors.dataProcessingConsent && (
                      <p className="text-sm text-destructive">{signupErrors.dataProcessingConsent}</p>
                    )}
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
    </main>
  );
};

export default Auth;