import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Users, Eye, Clock, MousePointerClick, Globe, BarChart3, Calendar, RefreshCw, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

// Color palette for charts
const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

type PeriodType = '7d' | '14d' | '30d' | '90d' | 'month' | 'prev-month';

interface AnalyticsData {
  visitors: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: { path: string; views: number }[];
  dailyStats: { date: string; visitors: number; pageViews: number }[];
}

// Mock data for demonstration - in production, this would come from analytics API
const generateMockData = (days: number): AnalyticsData => {
  const dailyStats = [];
  const baseVisitors = 50 + Math.floor(Math.random() * 100);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayOfWeek = date.getDay();
    // Weekends have less traffic
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1;
    const visitors = Math.floor((baseVisitors + Math.random() * 80) * weekendMultiplier);
    const pageViews = Math.floor(visitors * (1.5 + Math.random() * 2));
    
    dailyStats.push({
      date: format(date, 'dd.MM', { locale: ru }),
      visitors,
      pageViews,
    });
  }
  
  const totalVisitors = dailyStats.reduce((sum, d) => sum + d.visitors, 0);
  const totalPageViews = dailyStats.reduce((sum, d) => sum + d.pageViews, 0);
  
  return {
    visitors: totalVisitors,
    pageViews: totalPageViews,
    avgSessionDuration: 120 + Math.floor(Math.random() * 180), // seconds
    bounceRate: 30 + Math.floor(Math.random() * 30),
    topPages: [
      { path: '/', views: Math.floor(totalPageViews * 0.35) },
      { path: '/specialists', views: Math.floor(totalPageViews * 0.2) },
      { path: '/organizations', views: Math.floor(totalPageViews * 0.15) },
      { path: '/for-parents', views: Math.floor(totalPageViews * 0.12) },
      { path: '/for-specialists', views: Math.floor(totalPageViews * 0.1) },
      { path: '/for-organizations', views: Math.floor(totalPageViews * 0.08) },
    ],
    dailyStats,
  };
};

const getPeriodDays = (period: PeriodType): number => {
  switch (period) {
    case '7d': return 7;
    case '14d': return 14;
    case '30d': return 30;
    case '90d': return 90;
    case 'month': return new Date().getDate();
    case 'prev-month': {
      const prevMonth = subMonths(new Date(), 1);
      return new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
    }
    default: return 30;
  }
};

const getPeriodLabel = (period: PeriodType): string => {
  switch (period) {
    case '7d': return 'Последние 7 дней';
    case '14d': return 'Последние 14 дней';
    case '30d': return 'Последние 30 дней';
    case '90d': return 'Последние 90 дней';
    case 'month': return format(new Date(), 'LLLL yyyy', { locale: ru });
    case 'prev-month': return format(subMonths(new Date(), 1), 'LLLL yyyy', { locale: ru });
    default: return 'Период';
  }
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function SiteAnalyticsPanel() {
  const [period, setPeriod] = useState<PeriodType>('30d');
  
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['site-analytics', period],
    queryFn: async () => {
      // In production, replace with actual analytics API call
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return generateMockData(getPeriodDays(period));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Calculate comparison data (previous period)
  const comparisonData = useQuery({
    queryKey: ['site-analytics-comparison', period],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return generateMockData(getPeriodDays(period));
    },
    staleTime: 5 * 60 * 1000,
  });
  
  const getChangePercent = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };
  
  const renderChangeIndicator = (current: number, previous: number, inverse = false) => {
    const change = getChangePercent(current, previous);
    const isPositive = inverse ? change < 0 : change > 0;
    
    if (change === 0) return null;
    
    return (
      <Badge variant={isPositive ? "default" : "secondary"} className={`ml-2 ${isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {Math.abs(change)}%
      </Badge>
    );
  };

  const exportToCSV = () => {
    if (!data) return;
    
    const headers = ['Дата', 'Посетители', 'Просмотры страниц'];
    const rows = data.dailyStats.map(d => [d.date, d.visitors, d.pageViews]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `site-analytics-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                SMM Аналитика сайта
              </CardTitle>
              <CardDescription>
                Статистика посещаемости и поведения пользователей для продвижения
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 дней</SelectItem>
                  <SelectItem value="14d">14 дней</SelectItem>
                  <SelectItem value="30d">30 дней</SelectItem>
                  <SelectItem value="90d">90 дней</SelectItem>
                  <SelectItem value="month">Текущий месяц</SelectItem>
                  <SelectItem value="prev-month">Прошлый месяц</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={exportToCSV} disabled={!data}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Уникальные посетители</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{formatNumber(data?.visitors || 0)}</div>
              {comparisonData.data && renderChangeIndicator(data?.visitors || 0, comparisonData.data.visitors)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              За {getPeriodLabel(period).toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просмотры страниц</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{formatNumber(data?.pageViews || 0)}</div>
              {comparisonData.data && renderChangeIndicator(data?.pageViews || 0, comparisonData.data.pageViews)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data ? (data.pageViews / data.visitors).toFixed(1) : 0} стр./сессию
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя сессия</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{formatDuration(data?.avgSessionDuration || 0)}</div>
              {comparisonData.data && renderChangeIndicator(data?.avgSessionDuration || 0, comparisonData.data.avgSessionDuration)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Время на сайте
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Показатель отказов</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{data?.bounceRate || 0}%</div>
              {comparisonData.data && renderChangeIndicator(data?.bounceRate || 0, comparisonData.data.bounceRate, true)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ушли сразу
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Traffic dynamics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Динамика посещаемости
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.dailyStats || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="visitors" 
                    name="Посетители"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pageViews" 
                    name="Просмотры"
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Популярные страницы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topPages || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="path" 
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatNumber(value), 'Просмотров']}
                  />
                  <Bar 
                    dataKey="views" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SMM recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Рекомендации для SMM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">Лучшее время</Badge>
              </h4>
              <p className="text-sm text-muted-foreground">
                Публикуйте контент в будние дни — трафик выше на 40%
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">Фокус контента</Badge>
              </h4>
              <p className="text-sm text-muted-foreground">
                Страница «Специалисты» — второй по популярности раздел. Продвигайте профили специалистов.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">Вовлечённость</Badge>
              </h4>
              <p className="text-sm text-muted-foreground">
                Средняя сессия {formatDuration(data?.avgSessionDuration || 0)} — пользователи вовлечены. Добавьте CTA на ключевые страницы.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note about data */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            📊 Данные демонстрационные. Для получения реальной статистики подключите Яндекс.Метрику или Google Analytics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
