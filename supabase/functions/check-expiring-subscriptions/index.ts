import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting expiring subscriptions check...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();

    // Calculate dates for 7, 3, and 1 day ahead
    const sevenDaysAhead = new Date(now);
    sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);
    
    const threeDaysAhead = new Date(now);
    threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);
    
    const oneDayAhead = new Date(now);
    oneDayAhead.setDate(oneDayAhead.getDate() + 1);

    // Get all active subscriptions
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        user_id,
        end_date,
        subscription_type,
        amount,
        reminder_7days_sent,
        reminder_3days_sent,
        reminder_1day_sent,
        profiles:user_id (
          full_name,
          email,
          email_notifications
        )
      `)
      .eq("status", "active")
      .not("end_date", "is", null);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      throw error;
    }

    console.log(`Found ${subscriptions?.length || 0} active subscriptions`);

    const remindersToSend = [];

    for (const subscription of subscriptions || []) {
      const endDate = new Date(subscription.end_date);
      const profile = Array.isArray(subscription.profiles) 
        ? subscription.profiles[0] 
        : subscription.profiles;

      // Skip if user has disabled email notifications
      if (!profile?.email_notifications) {
        continue;
      }

      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Check for 7 days reminder
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 6 && !subscription.reminder_7days_sent) {
        remindersToSend.push({
          subscriptionId: subscription.id,
          email: profile.email,
          fullName: profile.full_name,
          daysLeft: 7,
          endDate: subscription.end_date,
          subscriptionType: subscription.subscription_type,
          amount: subscription.amount,
          reminderField: "reminder_7days_sent",
        });
      }
      // Check for 3 days reminder
      else if (daysUntilExpiry <= 3 && daysUntilExpiry > 2 && !subscription.reminder_3days_sent) {
        remindersToSend.push({
          subscriptionId: subscription.id,
          email: profile.email,
          fullName: profile.full_name,
          daysLeft: 3,
          endDate: subscription.end_date,
          subscriptionType: subscription.subscription_type,
          amount: subscription.amount,
          reminderField: "reminder_3days_sent",
        });
      }
      // Check for 1 day reminder
      else if (daysUntilExpiry <= 1 && daysUntilExpiry > 0 && !subscription.reminder_1day_sent) {
        remindersToSend.push({
          subscriptionId: subscription.id,
          email: profile.email,
          fullName: profile.full_name,
          daysLeft: 1,
          endDate: subscription.end_date,
          subscriptionType: subscription.subscription_type,
          amount: subscription.amount,
          reminderField: "reminder_1day_sent",
        });
      }
    }

    console.log(`Sending ${remindersToSend.length} reminder(s)...`);

    // Send reminders
    for (const reminder of remindersToSend) {
      try {
        // Call send-subscription-reminder edge function
        const { error: reminderError } = await supabase.functions.invoke(
          "send-subscription-reminder",
          {
            body: {
              email: reminder.email,
              fullName: reminder.fullName,
              daysLeft: reminder.daysLeft,
              endDate: reminder.endDate,
              subscriptionType: reminder.subscriptionType,
              amount: reminder.amount,
            },
          }
        );

        if (reminderError) {
          console.error(`Error sending reminder to ${reminder.email}:`, reminderError);
          continue;
        }

        // Mark reminder as sent
        const updateData: any = {};
        updateData[reminder.reminderField] = true;

        await supabase
          .from("subscriptions")
          .update(updateData)
          .eq("id", reminder.subscriptionId);

        console.log(`Reminder sent to ${reminder.email} for ${reminder.daysLeft} days`);
      } catch (err) {
        console.error(`Failed to send reminder to ${reminder.email}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalSubscriptions: subscriptions?.length || 0,
        remindersSent: remindersToSend.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in check-expiring-subscriptions:", error);
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
