import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      session_id: string;
      specialist_id: string;
      payer_id: string;
    };
    paid: boolean;
    created_at: string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.text();
    const notification: YooKassaNotification = JSON.parse(body);

    console.log("Specialist webhook received:", notification.event, notification.object?.id);

    const payment = notification.object;
    const sessionId = payment.metadata?.session_id;
    const specialistId = payment.metadata?.specialist_id;

    if (!sessionId || !specialistId) {
      console.error("Missing metadata in payment");
      return new Response(
        JSON.stringify({ error: "Missing metadata" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature if present
    const signature = req.headers.get("x-yookassa-signature");
    if (signature) {
      // Get specialist's secret key for verification
      const { data: settings } = await supabase
        .from("specialist_payment_settings")
        .select("yukassa_secret_key")
        .eq("user_id", specialistId)
        .single();

      if (settings?.yukassa_secret_key) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(settings.yukassa_secret_key),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
        const expectedSignature = Array.from(new Uint8Array(signatureBytes))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        if (signature !== expectedSignature) {
          console.error("Invalid webhook signature for specialist:", specialistId);
          return new Response(
            JSON.stringify({ error: "Invalid signature" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Handle payment.succeeded
    if (notification.event === "payment.succeeded" && payment.status === "succeeded" && payment.paid) {
      console.log("Payment succeeded for session:", sessionId);

      const { error: updateError } = await supabase
        .from("session_payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .eq("yukassa_payment_id", payment.id);

      if (updateError) {
        console.error("Error updating session payment:", updateError);
        throw updateError;
      }

      console.log("Session payment marked as paid:", sessionId);
    } else if (notification.event === "payment.canceled") {
      console.log("Payment cancelled for session:", sessionId);

      await supabase
        .from("session_payments")
        .update({ status: "cancelled" })
        .eq("session_id", sessionId)
        .eq("yukassa_payment_id", payment.id);
    } else if (notification.event === "refund.succeeded") {
      console.log("Refund for session:", sessionId);

      await supabase
        .from("session_payments")
        .update({ status: "refunded" })
        .eq("session_id", sessionId)
        .eq("yukassa_payment_id", payment.id);
    } else {
      console.log("Ignoring event:", notification.event);
    }

    return new Response(
      JSON.stringify({ message: "OK" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Specialist webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
