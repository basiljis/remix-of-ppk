import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Heart, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

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

interface ParentAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  specialistName?: string;
}

export function ParentAuthModal({ open, onOpenChange, onSuccess, specialistName }: ParentAuthModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

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
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Regions
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([]);

  // Reset password
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  useEffect(() => {
    if (open) {
      supabase
        .from("regions")
        .select("id, name")
        .order("name")
        .then(({ data }) => setRegions(data || []));
    }
  }, [open]);

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
        .select("is_blocked")
        .eq("id", data.user.id)
        .single() as { data: { is_blocked: boolean } | null };

      if ((profile as any)?.is_blocked) {
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
        description: "Перенаправляем в личный кабинет...",
      });
      
      onSuccess();
    } catch (error: any) {
      const message = error.message?.toLowerCase() || "";
      let errorMessage = "Не удалось выполнить вход";
      
      if (message.includes("invalid login credentials") || message.includes("invalid_credentials")) {
        errorMessage = "Неверный email или пароль";
      } else if (message.includes("email not confirmed")) {
        errorMessage = "Email не подтверждён. Проверьте почту.";
      }
      
      toast({
        title: "Ошибка входа",
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
          description: "Попробуйте войти или восстановить пароль",
          variant: "destructive",
        });
        setActiveTab("login");
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

      // Assign parent role
      const { error: roleError } = await supabase.rpc('assign_parent_role', {
        _user_id: authData.user.id
      });

      if (roleError) throw roleError;

      toast({
        title: "Регистрация успешна!",
        description: "Перенаправляем в личный кабинет...",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Попробуйте ещё раз",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail?.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Письмо отправлено",
        description: "Проверьте почту для восстановления пароля",
      });
      setShowResetForm(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить письмо",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-6 w-6 text-pink-500" />
            <DialogTitle className="text-xl">universum.</DialogTitle>
          </div>
          <DialogDescription>
            {specialistName 
              ? `Войдите, чтобы записаться к ${specialistName}`
              : "Войдите или зарегистрируйтесь для записи"
            }
          </DialogDescription>
        </DialogHeader>

        {showResetForm ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email для восстановления</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="your@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowResetForm(false)}
              >
                Назад
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Отправить"}
              </Button>
            </div>
          </form>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="signup">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="modal-login-email">Email</Label>
                  <Input
                    id="modal-login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-login-password">Пароль</Label>
                  <Input
                    id="modal-login-password"
                    type="password"
                    placeholder="Введите пароль"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-pink-600 hover:bg-pink-700" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Войти
                </Button>
                <Button 
                  type="button"
                  variant="link" 
                  className="w-full text-sm text-muted-foreground"
                  onClick={() => setShowResetForm(true)}
                >
                  Забыли пароль?
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                Ещё нет аккаунта?{" "}
                <button 
                  type="button"
                  className="text-pink-600 hover:underline font-medium"
                  onClick={() => setActiveTab("signup")}
                >
                  Зарегистрируйтесь
                </button>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="modal-signup-name">ФИО</Label>
                  <Input
                    id="modal-signup-name"
                    placeholder="Иванова Мария Петровна"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                  {signupErrors.fullName && (
                    <p className="text-xs text-destructive">{signupErrors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modal-signup-phone">Телефон</Label>
                  <Input
                    id="modal-signup-phone"
                    placeholder="+79991234567"
                    value={signupData.phone}
                    onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                  {signupErrors.phone && (
                    <p className="text-xs text-destructive">{signupErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modal-signup-email">Email</Label>
                  <Input
                    id="modal-signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  {signupErrors.email && (
                    <p className="text-xs text-destructive">{signupErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modal-signup-password">Пароль</Label>
                  <Input
                    id="modal-signup-password"
                    type="password"
                    placeholder="Минимум 8 символов"
                    value={signupData.password}
                    onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  {signupErrors.password && (
                    <p className="text-xs text-destructive">{signupErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Регион</Label>
                  <Select 
                    value={signupData.regionId} 
                    onValueChange={(value) => setSignupData(prev => ({ ...prev, regionId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите регион" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map(region => (
                        <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {signupErrors.regionId && (
                    <p className="text-xs text-destructive">{signupErrors.regionId}</p>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="modal-consent"
                    checked={signupData.dataProcessingConsent}
                    onCheckedChange={(checked) => 
                      setSignupData(prev => ({ ...prev, dataProcessingConsent: !!checked }))
                    }
                  />
                  <label htmlFor="modal-consent" className="text-xs text-muted-foreground leading-tight">
                    Согласен на{" "}
                    <Link to="/privacy" target="_blank" className="text-pink-600 hover:underline">
                      обработку персональных данных
                    </Link>
                  </label>
                </div>
                {signupErrors.dataProcessingConsent && (
                  <p className="text-xs text-destructive">{signupErrors.dataProcessingConsent}</p>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-pink-600 hover:bg-pink-700" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Зарегистрироваться
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                Уже есть аккаунт?{" "}
                <button 
                  type="button"
                  className="text-pink-600 hover:underline font-medium"
                  onClick={() => setActiveTab("login")}
                >
                  Войдите
                </button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
