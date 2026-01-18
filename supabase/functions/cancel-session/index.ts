import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML template for success page
const successHtml = (childName: string, date: string, time: string) => `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Занятие отменено</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f0f9ff;
      margin: 0;
      padding: 40px 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    h1 {
      color: #1e293b;
      margin: 0 0 16px;
      font-size: 24px;
    }
    .details {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .details p {
      margin: 8px 0;
      color: #475569;
    }
    .details strong {
      color: #1e293b;
    }
    .note {
      color: #64748b;
      font-size: 14px;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h1>Занятие успешно отменено</h1>
    <div class="details">
      <p><strong>Ребёнок:</strong> ${childName}</p>
      <p><strong>Дата:</strong> ${date}</p>
      <p><strong>Время:</strong> ${time}</p>
    </div>
    <p class="note">
      Специалист будет уведомлён об отмене занятия.<br>
      Вы можете закрыть эту страницу.
    </p>
  </div>
</body>
</html>
`;

// HTML template for error page
const errorHtml = (message: string) => `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ошибка отмены</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #fef2f2;
      margin: 0;
      padding: 40px 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    h1 {
      color: #1e293b;
      margin: 0 0 16px;
      font-size: 24px;
    }
    .message {
      color: #64748b;
      margin: 16px 0;
    }
    .note {
      color: #94a3b8;
      font-size: 14px;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
    <h1>Не удалось отменить занятие</h1>
    <p class="message">${message}</p>
    <p class="note">
      При возникновении вопросов обратитесь к специалисту или администратору.
    </p>
  </div>
</body>
</html>
`;

// HTML template for confirmation page
const confirmationHtml = (childName: string, date: string, time: string, token: string, baseUrl: string) => `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подтверждение отмены занятия</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #fef3c7;
      margin: 0;
      padding: 40px 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: #f59e0b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    h1 {
      color: #1e293b;
      margin: 0 0 16px;
      font-size: 24px;
    }
    .details {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .details p {
      margin: 8px 0;
      color: #475569;
    }
    .details strong {
      color: #1e293b;
    }
    .buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 24px;
    }
    .btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      border: none;
    }
    .btn-cancel {
      background: #ef4444;
      color: white;
    }
    .btn-cancel:hover {
      background: #dc2626;
    }
    .btn-back {
      background: #e2e8f0;
      color: #475569;
    }
    .btn-back:hover {
      background: #cbd5e1;
    }
    .warning {
      color: #92400e;
      font-size: 14px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h1>Подтвердите отмену занятия</h1>
    <div class="details">
      <p><strong>Ребёнок:</strong> ${childName}</p>
      <p><strong>Дата:</strong> ${date}</p>
      <p><strong>Время:</strong> ${time}</p>
    </div>
    <p class="warning">Это действие нельзя отменить. Специалист будет уведомлён об отмене.</p>
    <div class="buttons">
      <a href="${baseUrl}?token=${token}&confirm=true" class="btn btn-cancel">Отменить занятие</a>
      <a href="javascript:window.close()" class="btn btn-back" onclick="window.close(); return false;">Назад</a>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const confirm = url.searchParams.get("confirm") === "true";
    const reason = url.searchParams.get("reason") || "Отменено родителем через email";

    if (!token) {
      return new Response(errorHtml("Отсутствует токен отмены"), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    console.log(`Processing cancellation request for token: ${token}, confirm: ${confirm}`);

    // Find session by token
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select(`
        id,
        scheduled_date,
        start_time,
        end_time,
        cancelled_by_parent,
        children(full_name),
        session_statuses(name)
      `)
      .eq("cancellation_token", token)
      .single();

    if (sessionError || !session) {
      console.error("Session not found:", sessionError);
      return new Response(
        errorHtml("Занятие не найдено или ссылка устарела. Возможно, занятие уже было отменено или перенесено."),
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    // Check if already cancelled
    if (session.cancelled_by_parent) {
      return new Response(
        errorHtml("Это занятие уже было отменено ранее."),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    // Check if session is in the past
    const sessionDate = new Date(`${session.scheduled_date}T${session.start_time}`);
    if (sessionDate < new Date()) {
      return new Response(
        errorHtml("Нельзя отменить занятие, которое уже прошло."),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    const formattedDate = new Date(session.scheduled_date).toLocaleDateString("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = `${session.start_time?.slice(0, 5)} - ${session.end_time?.slice(0, 5)}`;
    const childName = (session.children as any)?.full_name || "Не указано";

    // If not confirmed, show confirmation page
    if (!confirm) {
      const baseUrl = url.origin + url.pathname;
      return new Response(
        confirmationHtml(childName, formattedDate, formattedTime, token, baseUrl),
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    // Find "Отменено" status
    const { data: cancelledStatus } = await supabase
      .from("session_statuses")
      .select("id")
      .ilike("name", "%отмен%")
      .limit(1)
      .single();

    // Update session
    const updateData: Record<string, any> = {
      cancelled_by_parent: true,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    };

    if (cancelledStatus) {
      updateData.session_status_id = cancelledStatus.id;
    }

    const { error: updateError } = await supabase
      .from("sessions")
      .update(updateData)
      .eq("id", session.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        errorHtml("Произошла ошибка при отмене занятия. Попробуйте позже."),
        {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    console.log(`Session ${session.id} cancelled successfully`);

    // Log the cancellation
    await supabase.from("email_logs").insert({
      recipient: "system",
      subject: `Занятие отменено родителем: ${childName}`,
      email_type: "session_cancelled_by_parent",
      status: "info",
      metadata: {
        sessionId: session.id,
        childName,
        scheduledDate: session.scheduled_date,
        startTime: session.start_time,
        cancelledAt: new Date().toISOString(),
      },
    });

    return new Response(
      successHtml(childName, formattedDate, formattedTime),
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in cancel-session function:", error);
    return new Response(
      errorHtml("Произошла непредвиденная ошибка. Попробуйте позже."),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      }
    );
  }
};

serve(handler);
