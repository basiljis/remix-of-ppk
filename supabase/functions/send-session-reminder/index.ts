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

interface SessionReminder {
  sessionId: string;
  childName: string;
  parentEmail: string;
  parentName: string;
  specialistName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  topic?: string;
  organizationName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reminders }: { reminders: SessionReminder[] } = await req.json();

    console.log(`Sending ${reminders.length} session reminder(s)`);

    const results = [];

    for (const reminder of reminders) {
      const {
        sessionId,
        childName,
        parentEmail,
        parentName,
        specialistName,
        scheduledDate,
        startTime,
        endTime,
        sessionType,
        topic,
        organizationName,
      } = reminder;

      const formattedDate = new Date(scheduledDate).toLocaleDateString("ru-RU", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const emailSubject = `Напоминание о занятии для ${childName}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Напоминание о предстоящем занятии</h1>
          <p>Здравствуйте, ${parentName || "Уважаемый родитель"}!</p>
          
          <p>Напоминаем вам о предстоящем занятии для вашего ребёнка <strong>${childName}</strong>.</p>
          
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #0369a1;">Детали занятия:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Дата:</td>
                <td style="padding: 8px 0; font-weight: bold;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Время:</td>
                <td style="padding: 8px 0; font-weight: bold;">${startTime} - ${endTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Тип занятия:</td>
                <td style="padding: 8px 0; font-weight: bold;">${sessionType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Специалист:</td>
                <td style="padding: 8px 0; font-weight: bold;">${specialistName}</td>
              </tr>
              ${topic ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Тема:</td>
                <td style="padding: 8px 0; font-weight: bold;">${topic}</td>
              </tr>
              ` : ''}
              ${organizationName ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Организация:</td>
                <td style="padding: 8px 0; font-weight: bold;">${organizationName}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>Важно:</strong> Пожалуйста, убедитесь, что ваш ребёнок готов к занятию вовремя.
              При невозможности посещения просим заранее уведомить специалиста.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 40px;">
            Это автоматическое уведомление. При возникновении вопросов обратитесь к специалисту или администратору учреждения.
          </p>
        </div>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "ППК Система <onboarding@resend.dev>",
          to: [parentEmail],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log(`Reminder sent for session ${sessionId}:`, emailResponse);

        // Log successful email
        await supabase.from("email_logs").insert({
          recipient: parentEmail,
          subject: emailSubject,
          email_type: "session_reminder",
          status: "success",
          resend_id: emailResponse.data?.id || null,
          email_body: emailHtml,
          metadata: {
            sessionId,
            childName,
            scheduledDate,
            startTime,
            specialistName,
          },
        });

        results.push({ sessionId, status: "success" });
      } catch (emailError: any) {
        console.error(`Failed to send reminder for session ${sessionId}:`, emailError);

        await supabase.from("email_logs").insert({
          recipient: parentEmail,
          subject: emailSubject,
          email_type: "session_reminder",
          status: "error",
          error_message: emailError.message,
          metadata: { sessionId, childName },
        });

        results.push({ sessionId, status: "error", error: emailError.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-session-reminder function:", error);
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
