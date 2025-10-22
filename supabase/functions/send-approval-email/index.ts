import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
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
    const { email, fullName, organizationName }: ApprovalEmailRequest = await req.json();

    console.log("Sending approval email to:", email);

    const emailResponse = await resend.emails.send({
      from: "ППК Система <onboarding@resend.dev>",
      to: [email],
      subject: "Доступ к системе ППК одобрен",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Ваша заявка одобрена!</h1>
          <p>Здравствуйте, ${fullName}!</p>
          <p>Ваша заявка на доступ к системе ППК была одобрена администратором.</p>
          ${organizationName ? `<p>Организация: <strong>${organizationName}</strong></p>` : ''}
          <p>Теперь вы можете войти в систему, используя ваши учетные данные.</p>
          <div style="margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL') || 'https://oxyjmeslnmhewlpgzlmf.supabase.co'}" 
               style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Войти в систему
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 40px;">
            Если у вас возникли вопросы, обратитесь к администратору.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-approval-email function:", error);
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
