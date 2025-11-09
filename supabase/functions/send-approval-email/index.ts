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

interface ApprovalEmailRequest {
  email: string;
  fullName: string;
  organizationName?: string;
  status: "approved" | "rejected";
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, organizationName, status, adminNotes }: ApprovalEmailRequest = await req.json();

    console.log(`Sending ${status} email to:`, email);

    const isApproved = status === "approved";
    const subject = isApproved 
      ? "Доступ к системе ППК одобрен" 
      : "Заявка на доступ к системе ППК отклонена";
    
    let logStatus = "pending";
    let errorMessage = null;
    let resendId = null;
    
    const emailHtml = isApproved ? `
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
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Ваша заявка отклонена</h1>
        <p>Здравствуйте, ${fullName}!</p>
        <p>К сожалению, ваша заявка на доступ к системе ППК была отклонена администратором.</p>
        ${organizationName ? `<p>Организация: <strong>${organizationName}</strong></p>` : ''}
        ${adminNotes ? `
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Комментарий администратора:</p>
            <p style="margin: 8px 0 0 0;">${adminNotes}</p>
          </div>
        ` : ''}
        <p>Если вы считаете, что это ошибка, пожалуйста, свяжитесь с администратором системы.</p>
        <p style="color: #666; font-size: 14px; margin-top: 40px;">
          Вы можете подать новую заявку на доступ к системе.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "ППК Система <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);
    
    logStatus = "success";
    resendId = emailResponse.data?.id || null;

    // Log successful email
    await supabase.from("email_logs").insert({
      recipient: email,
      subject: subject,
      email_type: isApproved ? "approval" : "rejection",
      status: logStatus,
      resend_id: resendId,
      email_body: emailHtml,
      metadata: { fullName, organizationName, adminNotes, status },
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-approval-email function:", error);
    
    // Log failed email attempt
    try {
      const { email, status } = await req.json();
      await supabase.from("email_logs").insert({
        recipient: email || "unknown",
        subject: status === "approved" ? "Доступ к системе ППК одобрен" : "Заявка на доступ к системе ППК отклонена",
        email_type: status === "approved" ? "approval" : "rejection",
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
