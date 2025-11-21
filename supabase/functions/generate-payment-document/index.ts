import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocumentRequest {
  subscriptionId: string;
  documentType: "receipt" | "act";
  subscription: {
    payment_id: string;
    amount: number;
    subscription_type: string;
    created_at: string;
    legal_entity_data?: any;
    payment_type: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscriptionId, documentType, subscription }: DocumentRequest = await req.json();
    console.log(`Generating ${documentType} for subscription ${subscriptionId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Company details (ваше юридическое лицо)
    const companyData = {
      name: "ООО \"ППК Система\"",
      inn: "1234567890",
      kpp: "123456789",
      address: "г. Москва, ул. Примерная, д. 1",
      phone: "+7 (495) 123-45-67",
      email: "info@ppk-system.ru",
    };

    const dateFormatted = new Date(subscription.created_at).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    let htmlContent = "";

    if (documentType === "receipt") {
      // Generate receipt HTML
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .info-section { margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .label { font-weight: bold; }
            .total { font-size: 20px; font-weight: bold; margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">ЧЕК</div>
            <div>№ ${subscription.payment_id || subscriptionId}</div>
            <div>${dateFormatted}</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="label">Продавец:</span>
              <span>${companyData.name}</span>
            </div>
            <div class="info-row">
              <span class="label">ИНН:</span>
              <span>${companyData.inn}</span>
            </div>
            <div class="info-row">
              <span class="label">Адрес:</span>
              <span>${companyData.address}</span>
            </div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="label">Покупатель:</span>
              <span>${profile?.full_name || "—"}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span>${profile?.email || "—"}</span>
            </div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="label">Наименование:</span>
              <span>Подписка на систему управления протоколами ППК (${subscription.subscription_type === "monthly" ? "месячная" : "годовая"})</span>
            </div>
            <div class="info-row">
              <span class="label">Количество:</span>
              <span>1</span>
            </div>
            <div class="info-row">
              <span class="label">Цена:</span>
              <span>${subscription.amount.toLocaleString()} ₽</span>
            </div>
          </div>

          <div class="total">
            <div class="info-row">
              <span>ИТОГО:</span>
              <span>${subscription.amount.toLocaleString()} ₽</span>
            </div>
          </div>

          <div class="footer">
            <p>Спасибо за покупку!</p>
            <p>${companyData.phone} | ${companyData.email}</p>
          </div>
        </body>
        </html>
      `;
    } else {
      // Generate act HTML
      const legalData = subscription.legal_entity_data || {};
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
            .parties { margin: 30px 0; }
            .party { margin-bottom: 20px; }
            .party-title { font-weight: bold; margin-bottom: 10px; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #333; padding: 10px; text-align: left; }
            .table th { background-color: #f0f0f0; font-weight: bold; }
            .total { text-align: right; font-weight: bold; margin-top: 10px; }
            .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature { text-align: center; width: 45%; }
            .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">АКТ ПРИЁМА-ПЕРЕДАЧИ ОКАЗАННЫХ УСЛУГ</div>
            <div>№ ${subscription.payment_id || subscriptionId} от ${dateFormatted}</div>
          </div>

          <div class="parties">
            <div class="party">
              <div class="party-title">Исполнитель:</div>
              <div>${companyData.name}</div>
              <div>ИНН: ${companyData.inn}, КПП: ${companyData.kpp}</div>
              <div>Адрес: ${companyData.address}</div>
            </div>

            <div class="party">
              <div class="party-title">Заказчик:</div>
              <div>${legalData.organization_name || "—"}</div>
              <div>ИНН: ${legalData.inn || "—"}${legalData.kpp ? `, КПП: ${legalData.kpp}` : ""}</div>
              <div>Адрес: ${legalData.legal_address || "—"}</div>
            </div>
          </div>

          <p>Исполнитель оказал, а Заказчик принял следующие услуги:</p>

          <table class="table">
            <thead>
              <tr>
                <th>№</th>
                <th>Наименование услуги</th>
                <th>Количество</th>
                <th>Цена, ₽</th>
                <th>Сумма, ₽</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Подписка на систему управления протоколами ППК (${subscription.subscription_type === "monthly" ? "1 месяц" : "12 месяцев"})</td>
                <td>1</td>
                <td>${subscription.amount.toLocaleString()}</td>
                <td>${subscription.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Итого: ${subscription.amount.toLocaleString()} ₽
          </div>

          <p style="margin-top: 30px;">Услуги оказаны в полном объёме. Заказчик претензий к Исполнителю не имеет.</p>

          <div class="signatures">
            <div class="signature">
              <div>Исполнитель</div>
              <div class="signature-line">
                ________________
              </div>
            </div>
            <div class="signature">
              <div>Заказчик</div>
              <div class="signature-line">
                ________________
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // For now, return the HTML content as a data URL
    // In production, you would use a PDF generation service like Puppeteer or a third-party API
    const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));
    const pdfUrl = `data:text/html;base64,${base64Html}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl,
        message: "Document generated successfully" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating document:", error);
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
