import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RegistrationEmailRequest {
  email: string;
  fullName: string;
  organizationName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, organizationName }: RegistrationEmailRequest = await req.json();

    console.log("Sending registration confirmation email to:", email);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Заявка на доступ принята</h1>
        <p>Здравствуйте, ${fullName}!</p>
        <p>Ваша заявка на доступ к системе управления протоколами ППК успешно получена и направлена на рассмотрение администратору.</p>
        ${organizationName ? `<p>Организация: <strong>${organizationName}</strong></p>` : ''}
        
        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; font-weight: bold; color: #1e40af;">Что дальше?</p>
          <p style="margin: 8px 0 0 0; color: #1e3a8a;">
            Администратор рассмотрит вашу заявку в ближайшее время (обычно от нескольких часов до 1 рабочего дня).
            После принятия решения вы получите уведомление на этот email.
          </p>
        </div>

        <p style="margin-top: 24px;">Вы можете проверить статус заявки, войдя в систему с использованием учетных данных, указанных при регистрации.</p>
        
        <p style="color: #666; font-size: 14px; margin-top: 40px;">
          Если у вас возникли вопросы, обратитесь к администратору системы.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "ППК Система <onboarding@resend.dev>",
      to: [email],
      subject: "Заявка на доступ к системе ППК получена",
      html: emailHtml,
    });

    console.log("Registration email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-registration-email function:", error);
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
