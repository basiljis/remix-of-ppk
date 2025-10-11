import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  position_id: string;
  region_id: string;
  organization_id: string;
  is_blocked: boolean;
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

  const loadUserData = async (userId: string) => {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select(`
          *,
          positions (name),
          regions (name),
          organizations (name)
        `)
        .eq("id", userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesData) {
        setRoles(rolesData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = roles.some((r) => r.role === "admin");
  const isRegionalOperator = roles.some((r) => r.role === "regional_operator");
  const isUser = roles.some((r) => r.role === "user");

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
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
    signOut,
  };
};