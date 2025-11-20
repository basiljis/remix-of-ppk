import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface YooKassaNotification {
  type: string;
  event: string;
  object: {
    id: string;
    status: string;
    amount: {
      value: string;
      currency: string;
    };
    metadata: {
      subscription_id: string;
      user_id: string;
    };
    paid: boolean;
    created_at: string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const yukassaSecretKey = Deno.env.get("YUKASSA_SECRET_KEY");
    if (!yukassaSecretKey) {
      throw new Error("ЮКасса secret key not configured");
    }

    // Получаем тело запроса и заголовки
    const body = await req.text();
    const notification: YooKassaNotification = JSON.parse(body);

    // Проверяем подпись используя Web Crypto API (если ЮКасса отправляет заголовок с подписью)
    const signature = req.headers.get("x-yookassa-signature");
    if (signature && yukassaSecretKey) {
      const encoder = new TextEncoder();
      const data = encoder.encode(body);
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(yukassaSecretKey),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBytes = await crypto.subtle.sign("HMAC", key, data);
      const expectedSignature = Array.from(new Uint8Array(signatureBytes))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          }
        );
      }
    }

    console.log("Webhook received:", notification);

    const payment = notification.object;
    const subscriptionId = payment.metadata?.subscription_id;
    const userId = payment.metadata?.user_id;

    // Логируем все события в payment_logs
    if (subscriptionId) {
      await supabase.from("payment_logs").insert({
        subscription_id: subscriptionId,
        payment_id: payment.id,
        event_type: notification.event,
        status: payment.status,
        amount: parseFloat(payment.amount.value),
        raw_data: notification,
        processed: false,
      });
    }

    // Проверяем тип уведомления
    if (notification.type !== "notification" || notification.event !== "payment.succeeded") {
      console.log("Ignoring non-payment event:", notification.event);
      return new Response(
        JSON.stringify({ message: "Event ignored" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (!subscriptionId || !userId) {
      console.error("Missing metadata in payment");
      return new Response(
        JSON.stringify({ error: "Missing metadata" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Проверяем, что платеж успешен
    if (payment.status !== "succeeded" || !payment.paid) {
      console.log("Payment not succeeded:", payment.status);
      return new Response(
        JSON.stringify({ message: "Payment not succeeded" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Получаем данные подписки
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*, profiles(email, full_name)")
      .eq("id", subscriptionId)
      .single();

    if (subError || !subscription) {
      console.error("Subscription not found:", subError);
      return new Response(
        JSON.stringify({ error: "Subscription not found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Проверяем, не была ли уже обработана эта оплата (идемпотентность)
    if (subscription.payment_id === payment.id && subscription.status === "active") {
      console.log("Payment already processed");
      return new Response(
        JSON.stringify({ message: "Payment already processed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Вычисляем даты начала и окончания подписки
    const startDate = new Date();
    const endDate = new Date();
    const months = subscription.subscription_type === "monthly" ? 1 : 12;
    endDate.setMonth(endDate.getMonth() + months);

    // Обновляем подписку
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_id: payment.id,
      })
      .eq("id", subscriptionId);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }

    console.log("Subscription activated:", subscriptionId);

    // Отмечаем событие как обработанное
    await supabase
      .from("payment_logs")
      .update({ processed: true })
      .eq("payment_id", payment.id)
      .eq("event_type", "payment.succeeded");

    // Отправляем email-уведомление пользователю (в фоновом режиме)
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          await supabase.functions.invoke("send-payment-confirmation-email", {
            body: {
              email: subscription.profiles.email,
              fullName: subscription.profiles.full_name,
              subscriptionType: subscription.subscription_type === "monthly" ? "Месячная" : "Годовая",
              amount: subscription.amount,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          });
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError);
        }
      })()
    );

    return new Response(
      JSON.stringify({ message: "Payment processed successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
