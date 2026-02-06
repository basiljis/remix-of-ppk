import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  position_id: string;
  region_id: string;
  organization_id: string | null;
  role: "admin" | "regional_operator" | "user";
  is_private_practice?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing service credentials");
    return new Response(
      JSON.stringify({ error: "Service credentials are not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Verify the caller is an admin
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace("Bearer ", "");

  if (!jwt) {
    return new Response(JSON.stringify({ error: "Unauthorized - no token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const authed = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: me, error: meErr } = await authed.auth.getUser();
  if (meErr || !me?.user) {
    console.error("Auth error:", meErr);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Check if the caller has admin role
  const { data: isAdminData, error: roleErr } = await admin
    .rpc("has_role", { _user_id: me.user.id, _role: "admin" });

  console.log("Admin check:", { isAdminData, roleErr, userId: me.user.id });

  if (roleErr || !isAdminData) {
    return new Response(JSON.stringify({ error: "Forbidden: Admin role required" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body: CreateUserRequest = await req.json();
    console.log("Creating user with data:", { ...body, password: "[REDACTED]" });

    const isPrivatePractice = body.is_private_practice === true;
    // Validate required fields
    if (!body.email || !body.password || !body.full_name || !body.phone || !body.position_id || !body.region_id || !body.role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name,
      },
    });

    if (authError) {
      console.error("Auth error creating user:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("User created in auth:", authData.user.id);

    // Create user profile
    const { error: profileError } = await admin.from("profiles").insert({
      id: authData.user.id,
      email: body.email,
      full_name: body.full_name,
      phone: body.phone,
      position_id: body.position_id,
      region_id: body.region_id,
      organization_id: isPrivatePractice ? null : (body.organization_id || null),
      is_blocked: false,
      is_private_practice: isPrivatePractice,
    });

    if (profileError) {
      console.error("Profile error:", profileError);
      // Try to clean up the auth user if profile creation fails
      await admin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Profile created");

    // Assign role to user
    const { error: roleError } = await admin.from("user_roles").insert({
      user_id: authData.user.id,
      role: body.role,
    });

    if (roleError) {
      console.error("Role error:", roleError);
      return new Response(
        JSON.stringify({ error: `Failed to assign role: ${roleError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Role assigned:", body.role);

    // If private practice, also assign private_specialist role
    if (isPrivatePractice) {
      const { error: privateRoleError } = await admin.from("user_roles").insert({
        user_id: authData.user.id,
        role: "private_specialist",
      });

      if (privateRoleError) {
        console.error("Private specialist role error:", privateRoleError);
        // Non-critical, log but don't fail
      } else {
        console.log("Private specialist role assigned");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: authData.user.id, 
          email: authData.user.email 
        } 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
