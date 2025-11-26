import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import { errorLogger } from "@/services/errorLogger";

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  position_id: string;
  region_id: string;
  organization_id: string;
  is_blocked: boolean;
  avatar_url?: string;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  positions?: {
    name: string;
  };
  regions?: {
    name: string;
  };
  organizations?: {
    name: string;
  };
}

export interface UserRole {
  role: "admin" | "regional_operator" | "user";
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccessRequest, setHasAccessRequest] = useState(false);

  const loadUserData = async (userId: string) => {
    try {
      console.log("[useAuth] Загрузка данных пользователя:", userId);
      
      // Check for access request first - используем maybeSingle() вместо single()
      const { data: accessRequest, error: accessError } = await supabase
        .from("access_requests")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle();

      // Логируем только реальные ошибки, не "нет записей"
      if (accessError) {
        console.error("[useAuth] Ошибка при проверке access_request:", accessError);
      }

      if (accessRequest) {
        console.log("[useAuth] Найден access_request со статусом:", accessRequest.status);
        setHasAccessRequest(true);
        
        // If request is not approved, don't load profile
        if (accessRequest.status !== "approved") {
          console.log("[useAuth] Запрос не одобрен, профиль не загружается");
          setProfile(null);
          setRoles([]);
          return;
        }
      } else {
        console.log("[useAuth] Access request не найден (это нормально для существующих пользователей)");
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          *,
          positions (name),
          regions (name),
          organizations (name)
        `)
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("[useAuth] Ошибка загрузки профиля:", profileError);
        errorLogger.logError({
          errorType: 'Profile Load Error',
          errorMessage: profileError.message,
          componentName: 'useAuth',
          severity: 'error',
          metadata: { userId, code: profileError.code }
        });
        throw profileError;
      }

      if (profileData) {
        console.log("[useAuth] Профиль загружен:", profileData.full_name);
        
        // Check if user is blocked
        if (profileData.is_blocked) {
          console.warn("[useAuth] Пользователь заблокирован");
          // Sign out blocked user
          await supabase.auth.signOut();
          setProfile(null);
          setRoles([]);
          setHasAccessRequest(false);
          
          toast({
            title: "Доступ запрещён",
            description: "Ваш аккаунт заблокирован администратором",
            variant: "destructive",
          });
          return;
        }
        
        setProfile(profileData);
        setHasAccessRequest(false);
      }

      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) {
        console.error("[useAuth] Ошибка загрузки ролей:", rolesError);
      } else {
        console.log("[useAuth] Роли загружены:", rolesData?.map(r => r.role).join(", ") || "нет ролей");
      }

      if (rolesData) {
        setRoles(rolesData);
      }
    } catch (error) {
      console.error("[useAuth] Критическая ошибка при загрузке данных пользователя:", error);
      errorLogger.logCritical(
        'Auth Data Load Failed',
        error instanceof Error ? error.message : String(error),
        { userId }
      );
      // Не блокируем загрузку при ошибке, позволяем пользователю увидеть интерфейс
      setProfile(null);
      setRoles([]);
    }
  };

  useEffect(() => {
    console.log("[useAuth] Инициализация хука авторизации");
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[useAuth] Auth state изменён:", event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          console.log("[useAuth] Нет активной сессии");
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[useAuth] Проверка существующей сессии:", session ? "найдена" : "не найдена");
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(error => {
      console.error("[useAuth] Ошибка при проверке сессии:", error);
      setLoading(false);
    });

    // Set up periodic blocking check every 5 minutes
    const blockCheckInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_blocked")
          .eq("id", session.user.id)
          .single();

        if (profileData?.is_blocked) {
          await supabase.auth.signOut();
          setProfile(null);
          setRoles([]);
          setHasAccessRequest(false);
          setUser(null);
          setSession(null);
          
          toast({
            title: "Доступ запрещён",
            description: "Ваш аккаунт заблокирован администратором",
            variant: "destructive",
          });
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(blockCheckInterval);
    };
  }, []);

  const isAdmin = roles.some((r) => r.role === "admin");
  const isRegionalOperator = roles.some((r) => r.role === "regional_operator");
  const isUser = roles.some((r) => r.role === "user");

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);
      setHasAccessRequest(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    session,
    profile,
    roles,
    loading,
    isAdmin,
    isRegionalOperator,
    isUser,
    hasAccessRequest,
    signOut,
  };
};