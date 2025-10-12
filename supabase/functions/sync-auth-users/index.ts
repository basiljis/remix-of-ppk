import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthUser {
  id: string;
  email: string | null;
  user_metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Service credentials are not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace("Bearer ", "");

  const authed = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: me, error: meErr } = await authed.auth.getUser();
  if (meErr || !me?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data: isAdminData, error: roleErr } = await admin
    .rpc("has_role", { _user_id: me.user.id, _role: "admin" });

  if (roleErr || !isAdminData) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Defaults for required fields
  const { data: pos } = await admin.from("positions").select("id").limit(1).maybeSingle();
  const defaultPositionId = pos?.id || null;
  const { data: reg } = await admin.from("regions").select("id").limit(1).maybeSingle();
  const defaultRegionId = reg?.id || ""; // text column

  // List all auth users
  const { data: usersResp, error: usersErr } = await admin.auth.admin.listUsers();
  if (usersErr) {
    return new Response(JSON.stringify({ error: usersErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const users: AuthUser[] = usersResp?.users || [];

  let createdProfiles = 0;
  let createdRoles = 0;

  for (const u of users) {
    const userId = u.id;

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      const full_name = u.user_metadata?.full_name || u.email || "Пользователь";
      const email = u.email || "";

      const { error: insertErr } = await admin.from("profiles").insert({
        id: userId,
        full_name,
        email,
        phone: "",
        region_id: defaultRegionId || "",
        position_id: defaultPositionId ?? crypto.randomUUID(),
        organization_id: null,
        is_blocked: false,
      });

      if (!insertErr) createdProfiles += 1;
    }

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!roles || roles.length === 0) {
      const { error: roleInsErr } = await admin
        .from("user_roles")
        .insert({ user_id: userId, role: "user" });
      if (!roleInsErr) createdRoles += 1;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, createdProfiles, createdRoles, totalUsers: users.length }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
});
