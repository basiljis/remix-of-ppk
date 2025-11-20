import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalData {
  email: string;
  organizationName: string;
  subscriptionType: string;
  amount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ApprovalData = await req.json();

    // Здесь должны быть реквизиты вашего юридического лица
    const companyDetails = `
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Реквизиты для оплаты:</h3>
        <p><strong>Получатель:</strong> ООО "ППК Система"</p>
        <p><strong>ИНН:</strong> 1234567890</p>
        <p><strong>КПП:</strong> 123456789</p>
        <p><strong>Расчетный счет:</strong> 40702810000000000000</p>
        <p><strong>Банк:</strong> ПАО "Сбербанк"</p>
        <p><strong>БИК:</strong> 044525225</p>
        <p><strong>Корр. счет:</strong> 30101810400000000225</p>
      </div>
    `;

    await resend.emails.send({
      from: "ППК Система <noreply@ppk-system.ru>",
      to: [data.email],
      subject: "Счет на оплату подписки",
      html: `
        <h2>Ваш запрос на подписку одобрен!</h2>
        <p>Уважаемый представитель ${data.organizationName},</p>
        <p>Рады сообщить, что ваш запрос на оформление подписки был одобрен.</p>
        
        <div style="margin: 20px 0;">
          <p><strong>Тип подписки:</strong> ${data.subscriptionType}</p>
          <p><strong>Сумма к оплате:</strong> ${data.amount.toLocaleString()} ₽</p>
        </div>

        ${companyDetails}

        <p><strong>Назначение платежа:</strong> Оплата за подписку на систему ППК (${data.subscriptionType})</p>
        
        <p>После поступления оплаты подписка будет автоматически активирована.</p>
        <p>Если у вас есть вопросы, пожалуйста, свяжитесь с нами.</p>
        
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
    console.error("Error sending approval email:", error);
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
