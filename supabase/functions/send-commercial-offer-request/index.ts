import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommercialOfferRequest {
  organizationName: string;
  inn: string;
  contactPerson: string;
  email: string;
  phone: string;
  comment?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationName, inn, contactPerson, email, phone, comment }: CommercialOfferRequest = await req.json();

    console.log("Processing commercial offer request for:", organizationName);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Новый запрос коммерческого предложения</h2>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #555; margin-top: 0;">Информация об организации</h3>
          <p><strong>Название:</strong> ${organizationName}</p>
          <p><strong>ИНН:</strong> ${inn}</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #555; margin-top: 0;">Контактная информация</h3>
          <p><strong>Контактное лицо:</strong> ${contactPerson}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Телефон:</strong> ${phone}</p>
        </div>

        ${comment ? `
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #555; margin-top: 0;">Комментарий</h3>
            <p>${comment}</p>
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
          <p>Это автоматическое уведомление из системы ППК "Профилактика"</p>
          <p>Дата запроса: ${new Date().toLocaleString('ru-RU')}</p>
        </div>
      </div>
    `;

    const clientEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Спасибо за ваш запрос!</h2>
        
        <p>Уважаемый(-ая) ${contactPerson},</p>
        
        <p>Мы получили ваш запрос на коммерческое предложение для организации <strong>${organizationName}</strong>.</p>
        
        <p>Наш менеджер свяжется с вами в ближайшее время для предоставления подробной информации о подключении системы ППК "Профилактика".</p>

        <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
          <p style="margin: 0;"><strong>Ваши контактные данные:</strong></p>
          <p style="margin: 5px 0;">Email: ${email}</p>
          <p style="margin: 5px 0;">Телефон: ${phone}</p>
        </div>

        <p>Если у вас есть срочные вопросы, вы можете связаться с нами по телефону или email, указанным в разделе "Контакты".</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
          <p>С уважением,<br>Команда ППК "Профилактика"</p>
          <p style="margin-top: 10px;">Это автоматическое сообщение. Пожалуйста, не отвечайте на него.</p>
        </div>
      </div>
    `;

    // Send email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "ППК Профилактика <onboarding@resend.dev>",
      to: ["admin@ppk-system.ru"], // Replace with actual admin email
      subject: `Запрос КП от ${organizationName}`,
      html: emailHtml,
    });

    // Send confirmation email to client
    const clientEmailResponse = await resend.emails.send({
      from: "ППК Профилактика <onboarding@resend.dev>",
      to: [email],
      subject: "Ваш запрос на коммерческое предложение получен",
      html: clientEmailHtml,
    });

    // Log emails
    await supabase.from("email_logs").insert([
      {
        recipient: "admin@ppk-system.ru",
        subject: `Запрос КП от ${organizationName}`,
        email_type: "commercial_offer_request_admin",
        status: adminEmailResponse.error ? "failed" : "sent",
        resend_id: adminEmailResponse.data?.id || null,
        error_message: adminEmailResponse.error?.message || null,
        metadata: { organizationName, inn, contactPerson, email, phone },
      },
      {
        recipient: email,
        subject: "Ваш запрос на коммерческое предложение получен",
        email_type: "commercial_offer_request_client",
        status: clientEmailResponse.error ? "failed" : "sent",
        resend_id: clientEmailResponse.data?.id || null,
        error_message: clientEmailResponse.error?.message || null,
        metadata: { organizationName },
      },
    ]);

    console.log("Commercial offer request emails sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        adminEmail: adminEmailResponse,
        clientEmail: clientEmailResponse
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-commercial-offer-request:", error);
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
