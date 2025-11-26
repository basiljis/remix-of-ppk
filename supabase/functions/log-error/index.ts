import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[log-error] Получен запрос на логирование ошибки');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError) {
        console.error('[log-error] Ошибка авторизации:', authError);
      } else if (user) {
        userId = user.id;
        console.log('[log-error] Пользователь авторизован:', userId);
      }
    }

    const {
      error_type,
      error_message,
      error_stack,
      component_name,
      route,
      severity = 'error',
      metadata
    } = await req.json();

    console.log('[log-error] Данные ошибки:', {
      error_type,
      component_name,
      severity,
      user_id: userId
    });

    // Get browser info from headers
    const userAgent = req.headers.get('user-agent') || undefined;
    const browserInfo = {
      userAgent,
      language: req.headers.get('accept-language'),
      referer: req.headers.get('referer'),
    };

    // Validate severity
    const validSeverities = ['info', 'warning', 'error', 'critical'];
    const finalSeverity = validSeverities.includes(severity) ? severity : 'error';

    // Insert error log
    const { data, error } = await supabaseClient
      .from('error_logs')
      .insert({
        user_id: userId,
        error_type,
        error_message,
        error_stack,
        component_name,
        route,
        user_agent: userAgent,
        browser_info: browserInfo,
        severity: finalSeverity,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('[log-error] Ошибка при сохранении лога:', error);
      throw error;
    }

    console.log('[log-error] Лог успешно сохранён:', data.id);

    return new Response(
      JSON.stringify({ success: true, log_id: data.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[log-error] Критическая ошибка:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});