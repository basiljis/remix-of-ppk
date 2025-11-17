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
      // Check for access request first
      const { data: accessRequest } = await supabase
        .from("access_requests")
        .select("status")
        .eq("user_id", userId)
        .single();

      if (accessRequest) {
        setHasAccessRequest(true);
        
        // If request is not approved, don't load profile
        if (accessRequest.status !== "approved") {
          setProfile(null);
          setRoles([]);
          return;
        }
      }

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
        // Check if user is blocked
        if (profileData.is_blocked) {
          // Sign out blocked user
          await supabase.auth.signOut();
          setProfile(null);
          setRoles([]);
          setHasAccessRequest(false);
          return;
        }
        
        setProfile(profileData);
        setHasAccessRequest(false);
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