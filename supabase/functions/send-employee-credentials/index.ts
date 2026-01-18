import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmployeeCredentialsRequest {
  email: string;
  fullName: string;
  password: string;
  organizationName?: string;
  positionName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, password, organizationName, positionName }: EmployeeCredentialsRequest = await req.json();

    console.log("Sending credentials email to:", email);

    const emailSubject = "Ваши учетные данные для доступа к системе ППК";
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Добро пожаловать в систему ППК!</h1>
        <p>Здравствуйте, <strong>${fullName}</strong>!</p>
        <p>Вы были добавлены как сотрудник${organizationName ? ` организации <strong>${organizationName}</strong>` : ''}.</p>
        ${positionName ? `<p>Должность: <strong>${positionName}</strong></p>` : ''}
        
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #374151;">Ваши данные для входа:</p>
          <p style="margin: 8px 0; color: #111827;">
            <strong>Email:</strong> ${email}
          </p>
          <p style="margin: 8px 0; color: #111827;">
            <strong>Пароль:</strong> ${password}
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
          Если у вас возникли вопросы, обратитесь к администратору вашей организации.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "ППК Система <onboarding@resend.dev>",
      to: [email],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Credentials email sent successfully:", emailResponse);

    // Log email
    await supabase.from("email_logs").insert({
      recipient: email,
      subject: emailSubject,
      email_type: "employee_credentials",
      status: "success",
      resend_id: emailResponse.data?.id || null,
      email_body: emailHtml,
      metadata: { fullName, organizationName, positionName },
    });

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-employee-credentials function:", error);
    
    try {
      const body = await req.clone().json();
      await supabase.from("email_logs").insert({
        recipient: body.email || "unknown",
        subject: "Ваши учетные данные для доступа к системе ППК",
        email_type: "employee_credentials",
        status: "error",
        error_message: error.message,
      });
    } catch (logError) {
      console.error("Failed to log email error:", logError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
