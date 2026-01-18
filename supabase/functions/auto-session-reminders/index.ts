import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const CANCEL_URL_BASE = "https://oxyjmeslnmhewlpgzlmf.supabase.co/functions/v1/cancel-session";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting auto session reminders job...");

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    console.log(`Looking for sessions on: ${tomorrowStr}`);

    // Fetch sessions for tomorrow with child, specialist info and cancellation token
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select(`
        id,
        scheduled_date,
        start_time,
        end_time,
        topic,
        cancellation_token,
        cancelled_by_parent,
        children(id, full_name, parent_email, parent_name),
        profiles!sessions_specialist_id_fkey(id, full_name),
        session_types(name),
        organizations(id, name, short_name)
      `)
      .eq("scheduled_date", tomorrowStr)
      .eq("cancelled_by_parent", false);

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      throw sessionsError;
    }

    console.log(`Found ${sessions?.length || 0} sessions for tomorrow`);

    // Filter sessions that have parent email
    const sessionsWithEmail = sessions?.filter(
      (s) => (s.children as any)?.parent_email
    ) || [];

    console.log(`${sessionsWithEmail.length} sessions have parent email`);

    if (sessionsWithEmail.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No sessions with parent emails found for tomorrow",
          date: tomorrowStr 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const results: Array<{ sessionId: string; status: string; error?: string }> = [];

    for (const session of sessionsWithEmail) {
      const child = session.children as any;
      const specialist = session.profiles as any;
      const sessionType = session.session_types as any;
      const organization = session.organizations as any;

      const formattedDate = new Date(session.scheduled_date).toLocaleDateString("ru-RU", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const cancelUrl = session.cancellation_token 
        ? `${CANCEL_URL_BASE}?token=${session.cancellation_token}` 
        : null;

      const emailSubject = `Напоминание: занятие для ${child.full_name} завтра`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Напоминание о занятии</h1>
          <p>Здравствуйте, ${child.parent_name || "Уважаемый родитель"}!</p>
          
          <p>Напоминаем, что <strong>завтра</strong> состоится занятие для вашего ребёнка <strong>${child.full_name}</strong>.</p>
          
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #0369a1;">Детали занятия:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Дата:</td>
                <td style="padding: 8px 0; font-weight: bold;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Время:</td>
                <td style="padding: 8px 0; font-weight: bold;">${session.start_time?.slice(0, 5)} - ${session.end_time?.slice(0, 5)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Тип занятия:</td>
                <td style="padding: 8px 0; font-weight: bold;">${sessionType?.name || "Не указан"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Специалист:</td>
                <td style="padding: 8px 0; font-weight: bold;">${specialist?.full_name || "Не указан"}</td>
              </tr>
              ${session.topic ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Тема:</td>
                <td style="padding: 8px 0; font-weight: bold;">${session.topic}</td>
              </tr>
              ` : ""}
              ${organization ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Организация:</td>
                <td style="padding: 8px 0; font-weight: bold;">${organization.short_name || organization.name}</td>
              </tr>
              ` : ""}
            </table>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>Важно:</strong> Пожалуйста, убедитесь, что ваш ребёнок готов к занятию вовремя.
            </p>
          </div>

          ${cancelUrl ? `
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 12px; color: #991b1b; font-weight: 500;">
              Не можете присутствовать на занятии?
            </p>
            <a href="${cancelUrl}" 
               style="display: inline-block; background-color: #ef4444; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Отменить занятие
            </a>
            <p style="margin: 12px 0 0; color: #7f1d1d; font-size: 12px;">
              Просим уведомить об отмене заранее
            </p>
          </div>
          ` : ""}
          
          <p style="color: #666; font-size: 14px; margin-top: 40px;">
            Это автоматическое уведомление системы ППК. При возникновении вопросов обратитесь к специалисту или администратору.
          </p>
        </div>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "ППК Система <onboarding@resend.dev>",
          to: [child.parent_email],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log(`Email sent for session ${session.id}:`, emailResponse);

        // Log the email
        await supabase.from("email_logs").insert({
          recipient: child.parent_email,
          subject: emailSubject,
          email_type: "auto_session_reminder",
          status: "success",
          resend_id: emailResponse.data?.id || null,
          metadata: {
            sessionId: session.id,
            childName: child.full_name,
            scheduledDate: session.scheduled_date,
            startTime: session.start_time,
            specialistName: specialist?.full_name,
            automated: true,
            hasCancelLink: !!cancelUrl,
          },
        });

        successCount++;
        results.push({ sessionId: session.id, status: "success" });
      } catch (emailError: any) {
        console.error(`Failed to send email for session ${session.id}:`, emailError);

        await supabase.from("email_logs").insert({
          recipient: child.parent_email,
          subject: emailSubject,
          email_type: "auto_session_reminder",
          status: "error",
          error_message: emailError.message,
          metadata: {
            sessionId: session.id,
            childName: child.full_name,
            automated: true,
          },
        });

        errorCount++;
        results.push({ sessionId: session.id, status: "error", error: emailError.message });
      }
    }

    console.log(`Completed: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        message: `Sent ${successCount} reminders, ${errorCount} errors`,
        date: tomorrowStr,
        totalSessions: sessionsWithEmail.length,
        successCount,
        errorCount,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in auto-session-reminders function:", error);
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
