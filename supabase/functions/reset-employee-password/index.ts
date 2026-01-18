import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ResetPasswordRequest {
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
  newPassword?: string; // If not provided, will be generated
}

// Generate a random secure password
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specialChars = '!@#$%&*';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  password += Math.floor(Math.random() * 10);
  return password;
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

  // Verify the caller is authenticated
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace("Bearer ", "");

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

  // Check if user is admin or organization_admin or director
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", me.user.id);

  const userRoles = roles?.map(r => r.role) || [];
  const canResetPassword = userRoles.includes("admin") || 
                           userRoles.includes("organization_admin") || 
                           userRoles.includes("director");

  if (!canResetPassword) {
    console.error("User does not have permission to reset passwords:", me.user.id);
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body: ResetPasswordRequest = await req.json();
    const { employeeId, employeeEmail, employeeName, newPassword } = body;

    if (!employeeId || !employeeEmail) {
      return new Response(
        JSON.stringify({ error: "Employee ID and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get caller's profile to check organization
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", me.user.id)
      .single();

    // Get employee's profile
    const { data: employeeProfile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", employeeId)
      .single();

    // For non-admins, verify employee belongs to the same organization
    if (!userRoles.includes("admin")) {
      if (!callerProfile?.organization_id || 
          callerProfile.organization_id !== employeeProfile?.organization_id) {
        console.error("User tried to reset password for employee from different org");
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Generate new password if not provided
    const password = newPassword || generatePassword();

    // Update the password using admin API
    const { error: updateError } = await admin.auth.admin.updateUserById(
      employeeId,
      { password }
    );

    if (updateError) {
      console.error("Failed to update password:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to reset password: " + updateError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Password reset successfully for:", employeeEmail);

    // Get organization name for email
    let organizationName = "";
    if (employeeProfile?.organization_id) {
      const { data: org } = await admin
        .from("organizations")
        .select("name")
        .eq("id", employeeProfile.organization_id)
        .single();
      organizationName = org?.name || "";
    }

    // Send email with new password
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Сброс пароля</h1>
        <p>Здравствуйте, <strong>${employeeName}</strong>!</p>
        <p>Администратор${organizationName ? ` организации <strong>${organizationName}</strong>` : ''} сбросил ваш пароль в системе ППК.</p>
        
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #374151;">Ваши новые данные для входа:</p>
          <p style="margin: 8px 0; color: #111827;">
            <strong>Email:</strong> ${employeeEmail}
          </p>
          <p style="margin: 8px 0; color: #111827;">
            <strong>Новый пароль:</strong> ${password}
          </p>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; font-weight: bold; color: #b45309;">Важно!</p>
          <p style="margin: 8px 0 0 0; color: #92400e;">
            Рекомендуем сменить пароль после первого входа в систему для обеспечения безопасности вашей учётной записи.
          </p>
        </div>

        <p style="margin-top: 24px;">
          <a href="https://ppk.lovable.app" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Войти в систему
          </a>
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 40px;">
          Если вы не запрашивали сброс пароля, обратитесь к администратору вашей организации.
        </p>
      </div>
    `;

    try {
      const emailResponse = await resend.emails.send({
        from: "ППК Система <onboarding@resend.dev>",
        to: [employeeEmail],
        subject: "Сброс пароля в системе ППК",
        html: emailHtml,
      });

      console.log("Password reset email sent:", emailResponse);

      // Log email
      await admin.from("email_logs").insert([{
        recipient: employeeEmail,
        subject: "Сброс пароля в системе ППК",
        email_type: "password_reset",
        status: "success",
        resend_id: emailResponse.data?.id || null,
        email_body: emailHtml,
        metadata: { employeeName, resetBy: me.user.id },
      }]);
    } catch (emailError: any) {
      console.error("Failed to send email:", emailError);
      // Log failed email attempt
      await admin.from("email_logs").insert([{
        recipient: employeeEmail,
        subject: "Сброс пароля в системе ППК",
        email_type: "password_reset",
        status: "error",
        error_message: emailError.message,
        metadata: { employeeName, resetBy: me.user.id },
      }]);
    }

    // Log to change history
    await admin.from("change_history").insert([{
      table_name: "auth_password_reset",
      record_id: employeeId,
      action: "password_reset",
      changed_by: me.user.id,
      changes_summary: `Сброс пароля для сотрудника ${employeeName} (${employeeEmail})`,
    }]);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in reset-employee-password:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
