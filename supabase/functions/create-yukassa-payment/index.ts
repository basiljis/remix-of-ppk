import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  subscriptionId: string;
  amount: number;
  description: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscriptionId, amount, description }: PaymentRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Получаем данные пользователя
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Получаем профиль пользователя
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    // Создаем платеж в ЮКасса
    const yukassaShopId = Deno.env.get("YUKASSA_SHOP_ID");
    const yukassaSecretKey = Deno.env.get("YUKASSA_SECRET_KEY");

    if (!yukassaShopId || !yukassaSecretKey) {
      throw new Error("ЮКасса credentials not configured");
    }

    const idempotenceKey = crypto.randomUUID();
    const auth = btoa(`${yukassaShopId}:${yukassaSecretKey}`);

    const paymentData = {
      amount: {
        value: amount.toFixed(2),
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: `${supabaseUrl.replace("https://", "https://")}/profile?payment=success`,
      },
      description: description,
      metadata: {
        subscription_id: subscriptionId,
        user_id: user.id,
      },
      receipt: {
        customer: {
          email: profile?.email || user.email,
        },
        items: [
          {
            description: description,
            quantity: "1",
            amount: {
              value: amount.toFixed(2),
              currency: "RUB",
            },
            vat_code: 1,
          },
        ],
      },
    };

    const yukassaResponse = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!yukassaResponse.ok) {
      const error = await yukassaResponse.text();
      console.error("ЮКасса error:", error);
      throw new Error(`ЮКасса payment creation failed: ${error}`);
    }

    const payment = await yukassaResponse.json();

    // Обновляем подписку с payment_id
    await supabase
      .from("subscriptions")
      .update({ payment_id: payment.id })
      .eq("id", subscriptionId);

    console.log("Payment created:", payment.id);

    return new Response(
      JSON.stringify({
        confirmationUrl: payment.confirmation.confirmation_url,
        paymentId: payment.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
