import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Получаем логи авторизации из auth schema
    const { data, error } = await supabaseClient.auth.admin.listUsers();

    if (error) throw error;

    // Преобразуем данные пользователей в логи
    const authLogs = data.users.flatMap(user => {
      const logs = [];
      
      // Добавляем событие регистрации
      if (user.created_at) {
        logs.push({
          id: `${user.id}-created`,
          created_at: user.created_at,
          event_type: 'user.created',
          user_id: user.id,
          user_email: user.email || 'Не указан',
          success: true
        });
      }

      // Добавляем последний вход
      if (user.last_sign_in_at) {
        logs.push({
          id: `${user.id}-signin`,
          created_at: user.last_sign_in_at,
          event_type: 'user.signin',
          user_id: user.id,
          user_email: user.email || 'Не указан',
          success: true
        });
      }

      return logs;
    });

    // Сортируем по дате (новые сверху)
    authLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return new Response(
      JSON.stringify(authLogs.slice(0, 100)),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
