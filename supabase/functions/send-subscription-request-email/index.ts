import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestData {
  organizationName: string;
  inn: string;
  contactPerson: string;
  email: string;
  phone: string;
  subscriptionType: string;
  amount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: RequestData = await req.json();

    // Email администратору
    await resend.emails.send({
      from: "ППК Система <noreply@ppk-system.ru>",
      to: ["admin@ppk-system.ru"],
      subject: "Новый запрос на подписку от юридического лица",
      html: `
        <h2>Запрос на оформление подписки</h2>
        <p><strong>Организация:</strong> ${data.organizationName}</p>
        <p><strong>ИНН:</strong> ${data.inn}</p>
        <p><strong>Контактное лицо:</strong> ${data.contactPerson}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Телефон:</strong> ${data.phone}</p>
        <p><strong>Тип подписки:</strong> ${data.subscriptionType}</p>
        <p><strong>Сумма:</strong> ${data.amount.toLocaleString()} ₽</p>
        <br>
        <p>Пожалуйста, рассмотрите запрос в админ-панели системы.</p>
      `,
    });

    // Email клиенту
    await resend.emails.send({
      from: "ППК Система <noreply@ppk-system.ru>",
      to: [data.email],
      subject: "Ваш запрос на подписку принят",
      html: `
        <h2>Спасибо за ваш запрос!</h2>
        <p>Уважаемый ${data.contactPerson},</p>
        <p>Мы получили ваш запрос на оформление подписки для организации <strong>${data.organizationName}</strong>.</p>
        <p><strong>Тип подписки:</strong> ${data.subscriptionType}</p>
        <p><strong>Сумма:</strong> ${data.amount.toLocaleString()} ₽</p>
        <br>
        <p>Наш администратор рассмотрит заявку и свяжется с вами в ближайшее время для выставления счета.</p>
        <p>Если у вас есть вопросы, пожалуйста, свяжитесь с нами по телефону или email.</p>
        <br>
        <p>С уважением,<br>Команда ППК Система</p>
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
    console.error("Error sending emails:", error);
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
