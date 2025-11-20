import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationData {
  email: string;
  fullName: string;
  subscriptionType: string;
  amount: number;
  startDate: string;
  endDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ConfirmationData = await req.json();

    const startDateFormatted = new Date(data.startDate).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const endDateFormatted = new Date(data.endDate).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    await resend.emails.send({
      from: "ППК Система <noreply@ppk-system.ru>",
      to: [data.email],
      subject: "Подписка успешно активирована!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Оплата успешно получена!</h2>
          
          <p>Уважаемый ${data.fullName},</p>
          
          <p>Благодарим вас за оплату подписки на систему управления протоколами ППК!</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Детали подписки:</h3>
            <p style="margin: 8px 0;"><strong>Тип подписки:</strong> ${data.subscriptionType}</p>
            <p style="margin: 8px 0;"><strong>Сумма оплаты:</strong> ${data.amount.toLocaleString()} ₽</p>
            <p style="margin: 8px 0;"><strong>Дата начала:</strong> ${startDateFormatted}</p>
            <p style="margin: 8px 0;"><strong>Действует до:</strong> ${endDateFormatted}</p>
          </div>
          
          <p>Ваша подписка активирована и вы можете пользоваться всеми возможностями системы.</p>
          
          <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>💡 Напоминание:</strong> За 7 дней до окончания подписки вы получите уведомление о необходимости продления.</p>
          </div>
          
          <p>Если у вас есть вопросы, пожалуйста, свяжитесь с нами.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">
            С уважением,<br>
            Команда ППК Система
          </p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
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
