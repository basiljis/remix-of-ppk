import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COUNTER_ID = '106637396';
const METRIKA_API_BASE = 'https://api-metrika.yandex.net/stat/v1/data';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseClient.rpc('has_role', { role_name: 'admin' });
    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = Deno.env.get('YANDEX_METRIKA_TOKEN');
    if (!token) {
      console.error('YANDEX_METRIKA_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Metrika token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { period = '30d' } = await req.json().catch(() => ({}));
    
    // Calculate date range
    const now = new Date();
    let date1: string;
    let date2 = formatDate(now);
    
    switch (period) {
      case '7d':
        date1 = formatDate(subDays(now, 6));
        break;
      case '14d':
        date1 = formatDate(subDays(now, 13));
        break;
      case '30d':
        date1 = formatDate(subDays(now, 29));
        break;
      case '90d':
        date1 = formatDate(subDays(now, 89));
        break;
      case 'month':
        date1 = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      case 'prev-month':
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        date1 = formatDate(prevMonth);
        date2 = formatDate(lastDayPrevMonth);
        break;
      default:
        date1 = formatDate(subDays(now, 29));
    }

    console.log(`Fetching Metrika stats for period ${date1} to ${date2}`);

    // Fetch data in parallel
    const [summaryResponse, dailyResponse, topPagesResponse] = await Promise.all([
      // Summary metrics
      fetch(`${METRIKA_API_BASE}?ids=${COUNTER_ID}&metrics=ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds&date1=${date1}&date2=${date2}`, {
        headers: { 'Authorization': `OAuth ${token}` }
      }),
      // Daily breakdown
      fetch(`${METRIKA_API_BASE}/bytime?ids=${COUNTER_ID}&metrics=ym:s:visits,ym:s:users,ym:s:pageviews&date1=${date1}&date2=${date2}&group=day`, {
        headers: { 'Authorization': `OAuth ${token}` }
      }),
      // Top pages
      fetch(`${METRIKA_API_BASE}?ids=${COUNTER_ID}&metrics=ym:pv:pageviews&dimensions=ym:pv:URLPathFull&date1=${date1}&date2=${date2}&limit=10&sort=-ym:pv:pageviews`, {
        headers: { 'Authorization': `OAuth ${token}` }
      }),
    ]);

    // Parse responses
    const [summaryData, dailyData, topPagesData] = await Promise.all([
      summaryResponse.json(),
      dailyResponse.json(),
      topPagesResponse.json(),
    ]);

    console.log('Summary response:', JSON.stringify(summaryData).substring(0, 500));
    console.log('Daily response:', JSON.stringify(dailyData).substring(0, 500));
    console.log('Top pages response:', JSON.stringify(topPagesData).substring(0, 500));

    // Check for API errors
    if (summaryData.errors || dailyData.errors || topPagesData.errors) {
      const errors = summaryData.errors || dailyData.errors || topPagesData.errors;
      console.error('Metrika API errors:', errors);
      return new Response(
        JSON.stringify({ error: 'Metrika API error', details: errors }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract summary metrics
    const summaryRow = summaryData.data?.[0]?.metrics || [0, 0, 0, 0, 0];
    const visits = Math.round(summaryRow[0] || 0);
    const visitors = Math.round(summaryRow[1] || 0);
    const pageViews = Math.round(summaryRow[2] || 0);
    const bounceRate = Math.round(summaryRow[3] || 0);
    const avgSessionDuration = Math.round(summaryRow[4] || 0);

    // Extract daily stats
    const dailyStats = (dailyData.data || []).map((row: any, index: number) => {
      const dateStr = dailyData.time_intervals?.[index]?.[0] || '';
      const date = dateStr ? new Date(dateStr) : new Date();
      return {
        date: formatDisplayDate(date),
        visitors: Math.round(row.metrics?.[1] || 0),
        pageViews: Math.round(row.metrics?.[2] || 0),
        visits: Math.round(row.metrics?.[0] || 0),
      };
    });

    // Extract top pages
    const topPages = (topPagesData.data || []).slice(0, 6).map((row: any) => ({
      path: row.dimensions?.[0]?.name || '/',
      views: Math.round(row.metrics?.[0] || 0),
    }));

    const result = {
      visitors,
      pageViews,
      avgSessionDuration,
      bounceRate,
      visits,
      topPages,
      dailyStats,
      period,
      dateRange: { date1, date2 },
    };

    console.log('Returning analytics data:', JSON.stringify(result).substring(0, 500));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Metrika stats:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}
