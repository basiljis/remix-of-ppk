import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PaymentRequest {
  sessionId: string;
  amount: number;
  description: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sessionId, amount, description }: PaymentRequest = await req.json();

    console.log("Creating specialist payment:", { sessionId, amount, userId: user.id });

    // Get session to find specialist
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, specialist_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Session not found:", sessionError);
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get specialist payment settings
    const { data: paymentSettings, error: settingsError } = await supabase
      .from("specialist_payment_settings")
      .select("*")
      .eq("user_id", session.specialist_id)
      .single();

    if (settingsError || !paymentSettings) {
      console.error("Payment settings not found:", settingsError);
      return new Response(JSON.stringify({ error: "Specialist payment not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!paymentSettings.yukassa_shop_id || !paymentSettings.yukassa_secret_key) {
      return new Response(JSON.stringify({ error: "YuKassa credentials not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile for receipt
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    // Create YuKassa payment using specialist's credentials
    const idempotenceKey = crypto.randomUUID();
    const auth = btoa(`${paymentSettings.yukassa_shop_id}:${paymentSettings.yukassa_secret_key}`);

    const returnUrl = `https://ppk.lovable.app/?payment=success&session=${sessionId}`;

    const paymentData = {
      amount: {
        value: amount.toFixed(2),
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: returnUrl,
      },
      description,
      metadata: {
        session_id: sessionId,
        specialist_id: session.specialist_id,
        payer_id: user.id,
      },
      receipt: {
        customer: {
          email: profile?.email || user.email,
        },
        items: [
          {
            description: description.substring(0, 128),
            quantity: "1",
            amount: {
              value: amount.toFixed(2),
              currency: "RUB",
            },
            vat_code: 1,
            payment_subject: "service",
            payment_mode: "full_prepayment",
          },
        ],
      },
    };

    console.log("Calling YuKassa API...");

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
      console.error("YuKassa error:", error);
      return new Response(
        JSON.stringify({ error: `Payment creation failed: ${error}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payment = await yukassaResponse.json();
    console.log("Payment created:", payment.id);

    // Create session_payment record
    const { error: insertError } = await supabase
      .from("session_payments")
      .upsert({
        session_id: sessionId,
        specialist_id: session.specialist_id,
        amount,
        currency: "RUB",
        status: "pending",
        payment_mode: paymentSettings.payment_mode,
        yukassa_payment_id: payment.id,
        confirmation_url: payment.confirmation.confirmation_url,
        metadata: {
          payer_id: user.id,
          idempotence_key: idempotenceKey,
        },
      }, { onConflict: "session_id" });

    if (insertError) {
      console.error("Error saving payment record:", insertError);
    }

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
    console.error("Error creating specialist payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
