import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderData {
  email: string;
  fullName: string;
  daysLeft: number;
  endDate: string;
  subscriptionType: string;
  amount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ReminderData = await req.json();
    console.log(`Sending reminder to ${data.email} for ${data.daysLeft} days left`);

    const endDateFormatted = new Date(data.endDate).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const urgencyMessage = data.daysLeft === 1 
      ? "завтра" 
      : `через ${data.daysLeft} ${data.daysLeft === 3 ? "дня" : "дней"}`;

    const urgencyColor = data.daysLeft === 1 ? "#dc2626" : data.daysLeft === 3 ? "#ea580c" : "#f59e0b";

    await resend.emails.send({
      from: "ППК Система <noreply@ppk-system.ru>",
      to: [data.email],
      subject: `Напоминание: Ваша подписка истекает ${urgencyMessage}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${urgencyColor};">⚠️ Напоминание о продлении подписки</h2>
          
          <p>Уважаемый ${data.fullName},</p>
          
          <p>Это напоминание о том, что ваша подписка на систему управления протоколами ППК истекает <strong>${urgencyMessage}</strong>.</p>
          
          <div style="background: #fef3c7; border-left: 4px solid ${urgencyColor}; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;">Детали подписки:</h3>
            <p style="margin: 8px 0;"><strong>Тип подписки:</strong> ${data.subscriptionType}</p>
            <p style="margin: 8px 0;"><strong>Стоимость продления:</strong> ${data.amount.toLocaleString()} ₽</p>
            <p style="margin: 8px 0;"><strong>Дата окончания:</strong> ${endDateFormatted}</p>
            <p style="margin: 8px 0;"><strong>Осталось дней:</strong> ${data.daysLeft}</p>
          </div>
          
          <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>💡 Как продлить подписку:</strong></p>
            <ol style="margin: 10px 0;">
              <li>Войдите в личный кабинет</li>
              <li>Перейдите в раздел "Профиль"</li>
              <li>Выберите тип подписки и способ оплаты</li>
              <li>Оформите подписку</li>
            </ol>
          </div>
          
          ${data.daysLeft === 1 ? `
          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>⏰ Внимание!</strong> После истечения подписки доступ к системе будет ограничен. Продлите подписку сегодня, чтобы избежать перерыва в работе.</p>
          </div>
          ` : ''}
          
          <p>Если у вас есть вопросы, пожалуйста, свяжитесь с нами.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">
            С уважением,<br>
            Команда ППК Система
          </p>
        </div>
      `,
    });

    console.log(`Reminder email sent successfully to ${data.email}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending reminder email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
