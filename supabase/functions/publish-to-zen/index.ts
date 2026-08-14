import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { post, settings } = await req.json()

    // Логируем начало попытки
    const { data: logEntry, error: logError } = await supabaseClient
      .from('zen_publication_logs')
      .insert({
        post_id: post.id,
        status: 'pending',
        metadata: { settings: { channelId: settings.channelId } }
      })
      .select()
      .single()

    try {
      // Имитация вызова API Дзена (так как реальный API требует партнерского токена)
      // В реальности здесь был бы fetch к https://api.zen.yandex.ru/v1/posts
      
      console.log(`Publishing post ${post.id} to Zen channel ${settings.channelId}`)
      
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Если токен "test_error", имитируем ошибку для проверки лога
      if (settings.token === 'test_error') {
        throw new Error("Invalid access token (simulated)")
      }

      // Обновляем лог как успех
      await supabaseClient
        .from('zen_publication_logs')
        .update({ status: 'success' })
        .eq('id', logEntry.id)

      return new Response(JSON.stringify({ success: true, logId: logEntry.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } catch (publishError) {
      // Обновляем лог как ошибку
      await supabaseClient
        .from('zen_publication_logs')
        .update({ 
          status: 'error', 
          error_message: publishError.message 
        })
        .eq('id', logEntry.id)

      throw publishError
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
