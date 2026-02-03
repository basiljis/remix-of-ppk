import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Baby, LogIn, ArrowLeft, Sparkles, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function ChildLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password.trim()) {
      toast({
        title: "Ошибка",
        description: "Введи логин и пароль",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Normalize login - remove invisible characters and extra spaces
      const normalizedLogin = login.trim().normalize("NFC").replace(/\s+/g, "_");
      const normalizedPassword = password.trim();
      
      console.log("[ChildLogin] Attempting login with:", { login: normalizedLogin, passwordLength: normalizedPassword.length });

      // Verify child credentials - use maybeSingle to avoid error on no match
      const { data, error } = await supabase
        .from("child_credentials")
        .select("*, parent_children(*)")
        .eq("login", normalizedLogin)
        .eq("is_active", true)
        .maybeSingle();

      console.log("[ChildLogin] Query result:", { data: data ? "found" : "not found", error });

      if (error) {
        console.error("[ChildLogin] Database error:", error);
        toast({
          title: "Ошибка подключения",
          description: "Попробуй ещё раз позже",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        // Try case-insensitive search as fallback
        const { data: fallbackData } = await supabase
          .from("child_credentials")
          .select("*, parent_children(*)")
          .ilike("login", normalizedLogin)
          .eq("is_active", true)
          .maybeSingle();
        
        if (!fallbackData) {
          toast({
            title: "Неверный логин или пароль",
            description: "Попроси родителей проверить данные для входа",
            variant: "destructive",
          });
          return;
        }
        
        // Use fallback data
        Object.assign(data || {}, fallbackData);
      }

      const credentialData = (data || {}) as unknown as {
        id: string;
        parent_child_id: string;
        plain_password: string | null;
        parent_children: { full_name: string } | null;
      };

      // Simple password check - case sensitive
      if (!credentialData.plain_password || credentialData.plain_password !== normalizedPassword) {
        console.log("[ChildLogin] Password mismatch");
        toast({
          title: "Неверный пароль",
          description: "Попробуй ещё раз",
          variant: "destructive",
        });
        return;
      }

      // Update last login
      await supabase
        .from("child_credentials")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", credentialData.id);

      // Store child session in localStorage
      localStorage.setItem("childSession", JSON.stringify({
        childId: credentialData.parent_child_id,
        childName: credentialData.parent_children?.full_name || "Ребёнок",
        loginAt: new Date().toISOString(),
      }));

      toast({
        title: `Привет, ${credentialData.parent_children?.full_name || "друг"}! 👋`,
        description: "Добро пожаловать в мир заданий!",
      });

      navigate(`/child-workspace?childId=${credentialData.parent_child_id}`);
    } catch (err) {
      console.error("Login error:", err);
      toast({
        title: "Ошибка входа",
        description: "Попробуй позже",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-purple-100 to-pink-100 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 flex flex-col items-center justify-center p-4">
      {/* Home button */}
      <Link 
        to="/" 
        className="absolute top-4 left-4 z-10"
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Home className="h-4 w-4" />
          На главную
        </Button>
      </Link>
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-50 blur-2xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-300 rounded-full opacity-50 blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-300 rounded-full opacity-40 blur-2xl" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4 shadow-lg">
            <Baby className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Вход для детей
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Мир интересных заданий ждёт тебя!
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </p>
        </div>

        <Card className="shadow-xl border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-center">Войди в свой аккаунт</CardTitle>
            <CardDescription className="text-center">
              Попроси родителей дать тебе логин и пароль
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login" className="text-base">Логин</Label>
                <Input
                  id="login"
                  placeholder="Твой логин..."
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="text-lg py-6"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Твой пароль..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-lg py-6"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full text-lg py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Входим..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Войти
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Ты родитель?
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate("/parent-auth")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Войти как родитель
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Если забыл логин или пароль — попроси родителей посмотреть в их кабинете
        </p>
      </div>
    </div>
  );
}
