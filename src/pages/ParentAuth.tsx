import React, { useState, useEffect } from "react";
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
import { DataProcessingAgreement } from "@/components/DataProcessingAgreement";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthFooter } from "@/components/AuthFooter";
import { ParentSystemInfoDialog } from "@/components/ParentSystemInfoDialog";
import { Heart, Users, Baby, Shield, Gamepad2 } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";

const parentSignupSchema = z.object({
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
  regionId: z.string().min(1, "Выберите регион"),
  dataProcessingConsent: z.boolean().refine(val => val === true, {
    message: "Необходимо согласие на обработку персональных данных"
  }),
});

// Helper function to translate login errors to user-friendly Russian messages
const getLoginErrorMessage = (errorMessage: string): string => {
  const message = errorMessage?.toLowerCase() || "";
  
  if (message.includes("invalid login credentials") || message.includes("invalid_credentials")) {
    return "Неверный email или пароль. Проверьте правильность введённых данных. Если вы забыли пароль, воспользуйтесь функцией «Забыли пароль?» ниже.";
  }
  if (message.includes("email not confirmed")) {
    return "Email не подтверждён. Проверьте вашу почту и перейдите по ссылке подтверждения. Если письмо не пришло, попробуйте зарегистрироваться заново.";
  }
  if (message.includes("too many requests") || message.includes("rate limit")) {
    return "Слишком много попыток входа. Подождите несколько минут и попробуйте снова.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Ошибка соединения. Проверьте подключение к интернету и попробуйте снова.";
  }
  
  return `Не удалось выполнить вход. ${errorMessage}. Попробуйте ещё раз или обратитесь в поддержку.`;
};

// Helper function to translate signup errors to user-friendly Russian messages
const getSignupErrorMessage = (errorMessage: string): string => {
  const message = errorMessage?.toLowerCase() || "";
  
  if (message.includes("user already registered") || message.includes("already been registered")) {
    return "Пользователь с такой почтой уже зарегистрирован. Если вы не помните пароль, перейдите на вкладку «Вход» и воспользуйтесь функцией «Забыли пароль?».";
  }
  if (message.includes("password") && message.includes("weak")) {
    return "Пароль слишком простой. Используйте минимум 8 символов, включая заглавную букву и цифру.";
  }
  if (message.includes("invalid email")) {
    return "Некорректный формат email. Проверьте правильность написания адреса электронной почты.";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Слишком много попыток регистрации. Подождите несколько минут и попробуйте снова.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Ошибка соединения с сервером. Проверьте подключение к интернету и попробуйте снова.";
  }
  if (message.includes("signup_disabled")) {
    return "Регистрация временно недоступна. Попробуйте позже или обратитесь в поддержку.";
  }
  
  return `Не удалось зарегистрироваться. ${errorMessage}. Проверьте введённые данные и попробуйте ещё раз.`;
};

// Helper function to translate reset password errors
const getResetPasswordErrorMessage = (errorMessage: string): string => {
  const message = errorMessage?.toLowerCase() || "";
  
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Слишком много запросов на сброс пароля. Подождите несколько минут перед повторной попыткой.";
  }
  if (message.includes("user not found") || message.includes("no user")) {
    return "Пользователь с таким email не найден. Проверьте правильность email или зарегистрируйтесь.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Ошибка соединения. Проверьте подключение к интернету и попробуйте снова.";
  }
  
  return `Не удалось отправить письмо для сброса пароля. ${errorMessage}. Попробуйте позже.`;
};

const ParentAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupData, setSignupData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    regionId: "",
    dataProcessingConsent: false,
  });

  // Fetch regions
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([]);
  
  // Validation errors
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Reset password form
  const [resetEmail, setResetEmail] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  // Success dialog
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  
  // Welcome dialog
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  const [welcomeUserName, setWelcomeUserName] = useState("");

  // Redirect if already authenticated - AFTER all hooks
  useEffect(() => {
    if (user) {
      navigate("/parent");
    }
  }, [user, navigate]);

  // Fetch regions on mount
  useEffect(() => {
    supabase
      .from("regions")
      .select("id, name")
      .order("name")
      .then(({ data }) => setRegions(data || []));
  }, []);

  // If user is authenticated, show nothing while redirecting
  if (user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      // Check if user is a parent
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      const isParent = roles?.some(r => r.role === "parent");
      
      if (!isParent) {
        await supabase.auth.signOut();
        toast({
          title: "Доступ запрещён",
          description: "Этот вход только для родителей. Для педагогов используйте другую форму входа.",
          variant: "destructive",
        });
        return;
      }

      // Check if user is blocked
      const { data: profile } = await supabase
        .from("parent_profiles" as any)
        .select("is_blocked, full_name")
        .eq("id", data.user.id)
        .single() as { data: { is_blocked: boolean; full_name: string } | null };

      if ((profile as any)?.is_blocked) {
        await supabase.auth.signOut();
        toast({
          title: "Доступ заблокирован",
          description: "Ваш аккаунт был заблокирован администратором",
          variant: "destructive",
        });
        return;
      }

      // Show welcome dialog
      setWelcomeUserName((profile as any)?.full_name || "Родитель");
      setWelcomeDialogOpen(true);
    } catch (error: any) {
      const errorMessage = getLoginErrorMessage(error.message);
      toast({
        title: "⚠️ Ошибка входа",
        description: errorMessage,
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
      const result = parentSignupSchema.safeParse(signupData);
      
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

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('parent_profiles' as any)
        .select('email')
        .eq('email', validatedData.email)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: "Email уже зарегистрирован",
          description: "Пользователь с таким email уже существует. Попробуйте восстановить доступ через 'Забыли пароль?'",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/parent`,
          data: {
            full_name: validatedData.fullName,
            is_parent: true,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Не удалось создать пользователя");

      // Create parent profile
      const { error: profileError } = await supabase.from("parent_profiles" as any).insert({
        id: authData.user.id,
        full_name: validatedData.fullName,
        phone: validatedData.phone,
        email: validatedData.email,
        region_id: validatedData.regionId,
        data_processing_consent: true,
      } as any);

      if (profileError) throw profileError;

      // Assign parent role using secure function (bypasses RLS)
      const { error: roleError } = await supabase.rpc('assign_parent_role', {
        _user_id: authData.user.id
      });

      if (roleError) throw roleError;

      // Show success dialog
      setSuccessDialogOpen(true);
      
      // Clear form
      setSignupData({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        regionId: "",
        dataProcessingConsent: false,
      });
    } catch (error: any) {
      const errorMessage = getSignupErrorMessage(error.message);
      toast({
        title: "⚠️ Ошибка регистрации",
        description: errorMessage,
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

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Письмо отправлено",
        description: "Проверьте почту для восстановления пароля.",
      });
      setResetEmail("");
      setResetDialogOpen(false);
    } catch (error: any) {
      const errorMessage = getResetPasswordErrorMessage(error.message);
      toast({
        title: "⚠️ Ошибка сброса пароля",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar currentPage="parents" variant="simple" showSecondaryNav={true} authLink="/parent-auth" />
      
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-100 dark:from-pink-950/20 dark:to-purple-950/30 p-4 pt-32">
        
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-0 bg-background rounded-2xl shadow-2xl overflow-hidden">
          {/* Left side - Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="h-8 w-8 text-pink-500" />
                <h1 className="text-3xl font-bold">universum.</h1>
              </div>
              <p className="text-muted-foreground text-lg">Кабинет родителя</p>
            </div>
            
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Вход</TabsTrigger>
                <TabsTrigger value="signup">Регистрация</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <h2 className="text-2xl font-bold mb-2">Вход для родителей</h2>
                <p className="text-muted-foreground text-sm mb-6">Введите свои учетные данные</p>
                
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
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
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
                    className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white font-medium" 
                    disabled={loading}
                  >
                    {loading ? "Вход..." : "Войти"}
                  </Button>
                  
                  <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="w-full text-sm text-muted-foreground hover:text-pink-600">
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
                        <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700" disabled={loading}>
                          {loading ? "Отправка..." : "Отправить ссылку для сброса"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Child Login Link */}
                  <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-sm text-muted-foreground mb-2">Вход для ребёнка?</p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/child-login")}
                      className="gap-2 border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950"
                    >
                      <Gamepad2 className="h-4 w-4" />
                      Детский вход
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <h2 className="text-2xl font-bold mb-2">Регистрация родителя</h2>
                <p className="text-muted-foreground text-sm mb-4">Создайте аккаунт для отслеживания развития ребёнка</p>
                
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">ФИО *</Label>
                    <Input
                      id="fullName"
                      value={signupData.fullName}
                      onChange={(e) => {
                        setSignupData({ ...signupData, fullName: e.target.value });
                        setSignupErrors({ ...signupErrors, fullName: "" });
                      }}
                      required
                      className={signupErrors.fullName ? "border-destructive" : ""}
                    />
                    {signupErrors.fullName && (
                      <p className="text-sm text-destructive">{signupErrors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон *</Label>
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
                      className={signupErrors.phone ? "border-destructive" : ""}
                    />
                    {signupErrors.phone && (
                      <p className="text-sm text-destructive">{signupErrors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => {
                        setSignupData({ ...signupData, email: e.target.value });
                        setSignupErrors({ ...signupErrors, email: "" });
                      }}
                      required
                      className={signupErrors.email ? "border-destructive" : ""}
                    />
                    {signupErrors.email && (
                      <p className="text-sm text-destructive">{signupErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => {
                        setSignupData({ ...signupData, password: e.target.value });
                        setSignupErrors({ ...signupErrors, password: "" });
                      }}
                      required
                      className={signupErrors.password ? "border-destructive" : ""}
                    />
                    {signupErrors.password && (
                      <p className="text-sm text-destructive">{signupErrors.password}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Минимум 8 символов, заглавная буква и цифра</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Регион *</Label>
                    <Select
                      value={signupData.regionId}
                      onValueChange={(value) => {
                        setSignupData({ ...signupData, regionId: value });
                        setSignupErrors({ ...signupErrors, regionId: "" });
                      }}
                    >
                      <SelectTrigger className={signupErrors.regionId ? "border-destructive" : ""}>
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

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="dataProcessingConsent"
                      checked={signupData.dataProcessingConsent}
                      onCheckedChange={(checked) => {
                        setSignupData({ ...signupData, dataProcessingConsent: checked as boolean });
                        setSignupErrors({ ...signupErrors, dataProcessingConsent: "" });
                      }}
                    />
                    <label htmlFor="dataProcessingConsent" className="text-sm leading-tight cursor-pointer">
                      Я согласен на обработку персональных данных в соответствии с{" "}
                      <DataProcessingAgreement />
                    </label>
                  </div>
                  {signupErrors.dataProcessingConsent && (
                    <p className="text-sm text-destructive">{signupErrors.dataProcessingConsent}</p>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white font-medium" 
                    disabled={loading}
                  >
                    {loading ? "Регистрация..." : "Зарегистрироваться"}
                  </Button>
                  
                  <div className="pt-2">
                    <ParentSystemInfoDialog />
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right side - Feature blocks */}
          <div className="hidden md:flex flex-col relative bg-gradient-to-br from-pink-500 to-purple-600 p-8 justify-center">
            <div className="space-y-5">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Baby className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Добавьте своих детей</h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Создайте профиль для каждого ребёнка. Каждому ребёнку присваивается уникальный идентификатор, который может понадобиться при обращении к специалисту.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Материалы по возрасту</h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Укажите возраст и класс/группу ребёнка для получения рекомендаций и материалов, соответствующих его уровню развития.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Безопасность данных</h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Все данные защищены в соответствии с ФЗ-152. Доступ к информации о ребёнке имеете только вы.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Регистрация успешна!</DialogTitle>
            <DialogDescription className="text-center pt-4 text-base leading-relaxed">
              Ваш аккаунт создан. Теперь вы можете войти и добавить своих детей в личном кабинете.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => {
                setSuccessDialogOpen(false);
              }}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              Перейти ко входу
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome Dialog */}
      <Dialog open={welcomeDialogOpen} onOpenChange={(open) => {
        setWelcomeDialogOpen(open);
        if (!open) {
          setTimeout(() => {
            navigate("/parent");
          }, 100);
        }
      }}>
        <DialogContent className="sm:max-w-xl bg-gradient-to-br from-background via-background to-pink-50 dark:to-pink-950/20 border-2 border-pink-500 shadow-2xl">
          <DialogHeader className="space-y-4 pt-6">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-pink-100 dark:bg-pink-950/50 flex items-center justify-center border-4 border-pink-500">
                <Heart className="w-12 h-12 text-pink-500" />
              </div>
            </div>
            <DialogTitle className="text-center text-3xl font-bold">
              Добро пожаловать!
            </DialogTitle>
            <DialogDescription className="text-center text-xl font-medium text-foreground pt-2">
              {welcomeUserName}
            </DialogDescription>
            <p className="text-center text-muted-foreground text-base pt-2">
              Вы успешно вошли в кабинет родителя
            </p>
          </DialogHeader>
          <div className="flex justify-center pt-6 pb-4">
            <Button
              onClick={() => setWelcomeDialogOpen(false)}
              className="w-full h-12 text-lg font-semibold bg-pink-600 hover:bg-pink-700"
              size="lg"
            >
              Перейти в личный кабинет
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <AuthFooter mode="parent" />
    </div>
  );
};

export default ParentAuth;
