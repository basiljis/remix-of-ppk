import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import {
  Activity,
  Database,
  Server,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Clock,
  Zap,
  Users,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    healthy: { variant: "default", label: "Работает" },
    degraded: { variant: "secondary", label: "Деградация" },
    critical: { variant: "destructive", label: "Критично" },
    low: { variant: "default", label: "Низкая" },
    medium: { variant: "secondary", label: "Средняя" },
    high: { variant: "outline", label: "Высокая" },
  };

  const cfg = config[status] || { variant: "outline" as const, label: status };
  
  return (
    <Badge variant={cfg.variant} className={status === "critical" ? "animate-pulse" : ""}>
      {cfg.label}
    </Badge>
  );
};

const GaugeIndicator = ({ 
  value, 
  max = 100, 
  label, 
  status,
  unit = "%"
}: { 
  value: number; 
  max?: number; 
  label: string; 
  status: string;
  unit?: string;
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getColor = () => {
    if (status === "critical" || status === "degraded") return "bg-destructive";
    if (status === "high") return "bg-orange-500";
    if (status === "medium") return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  status,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  status?: string;
  trend?: "up" | "down" | "stable";
}) => {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-destructive" : trend === "down" ? "text-primary" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && <TrendIcon className={`h-4 w-4 ${trendColor}`} />}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {status && (
          <div className="mt-2">
            <StatusBadge status={status} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const SystemHealthPanel: React.FC = () => {
  const { data: health, isLoading, refetch, isRefetching } = useSystemHealth();

  if (isLoading || !health) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Мониторинг системы
        </h2>
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Загрузка метрик...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Мониторинг системы
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>

      {/* Общий статус системы */}
      <Card className={`border-2 ${
        health.availability.status === "healthy" ? "border-primary/50 bg-primary/5" :
        health.availability.status === "degraded" ? "border-yellow-500/50 bg-yellow-500/5" :
        "border-destructive/50 bg-destructive/5"
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {health.availability.status === "healthy" ? (
              <CheckCircle2 className="h-12 w-12 text-primary" />
            ) : health.availability.status === "degraded" ? (
              <AlertCircle className="h-12 w-12 text-yellow-500" />
            ) : (
              <AlertTriangle className="h-12 w-12 text-destructive animate-pulse" />
            )}
            <div>
              <h3 className="text-xl font-bold">
                {health.availability.status === "healthy" ? "Система работает нормально" :
                 health.availability.status === "degraded" ? "Наблюдается снижение производительности" :
                 "Критические проблемы с системой"}
              </h3>
              <p className="text-muted-foreground">
                Доступность: {health.availability.current.toFixed(1)}% • 
                Время отклика: {health.databaseLoad.avgResponseTime}мс • 
                Ошибок за час: {health.errors.last1h}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="performance">Производительность</TabsTrigger>
          <TabsTrigger value="errors">Ошибки</TabsTrigger>
          <TabsTrigger value="resources">Ресурсы</TabsTrigger>
        </TabsList>

        {/* Обзор */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Доступность (24ч)"
              value={`${health.availability.last24h.toFixed(1)}%`}
              subtitle="Успешных запросов"
              icon={Server}
              status={health.availability.status}
            />
            <MetricCard
              title="Среднее время отклика"
              value={`${health.databaseLoad.avgResponseTime}мс`}
              subtitle="За последние 24 часа"
              icon={Clock}
              status={health.databaseLoad.status}
            />
            <MetricCard
              title="Запросов/мин"
              value={health.apiLoad.requestsPerMinute.toFixed(1)}
              subtitle="Средняя нагрузка"
              icon={Zap}
              status={health.apiLoad.status}
            />
            <MetricCard
              title="Ошибок (24ч)"
              value={health.errors.last24h}
              subtitle={`Критических: ${health.errors.criticalErrors}`}
              icon={AlertTriangle}
              trend={health.errors.trend}
            />
          </div>

          {/* Графики нагрузки */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Нагрузка за последние 24 часа</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={health.hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="requests"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Запросы"
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgLatency"
                      stroke="hsl(var(--accent-foreground))"
                      strokeWidth={2}
                      name="Латентность (мс)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Производительность */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Нагрузка на БД */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Нагрузка на базу данных
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Статус</span>
                  <StatusBadge status={health.databaseLoad.status} />
                </div>
                <GaugeIndicator
                  label="Время отклика"
                  value={health.databaseLoad.avgResponseTime}
                  max={1000}
                  unit="мс"
                  status={health.databaseLoad.status}
                />
                <GaugeIndicator
                  label="Частота ошибок"
                  value={health.databaseLoad.errorRate}
                  max={10}
                  unit="%"
                  status={health.databaseLoad.errorRate > 5 ? "high" : "low"}
                />
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Активные запросы</span>
                    <span className="font-medium">{health.databaseLoad.activeQueries}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API нагрузка */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Нагрузка на API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Статус</span>
                  <StatusBadge status={health.apiLoad.status} />
                </div>
                <GaugeIndicator
                  label="Успешность запросов"
                  value={health.apiLoad.successRate}
                  max={100}
                  unit="%"
                  status={health.apiLoad.successRate < 95 ? "degraded" : "healthy"}
                />
                <GaugeIndicator
                  label="Средняя латентность"
                  value={health.apiLoad.avgLatency}
                  max={500}
                  unit="мс"
                  status={health.apiLoad.status}
                />
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Запросов/мин</span>
                    <span className="font-medium">{health.apiLoad.requestsPerMinute.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Ошибок за 24ч</span>
                    <span className="font-medium text-destructive">{health.apiLoad.errorCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Шкала уровней нагрузки */}
          <Card>
            <CardHeader>
              <CardTitle>Уровни нагрузки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="h-2 w-full bg-primary rounded mb-2" />
                  <span className="text-sm font-medium">Низкая</span>
                  <p className="text-xs text-muted-foreground">0-25%</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="h-2 w-full bg-yellow-500 rounded mb-2" />
                  <span className="text-sm font-medium">Средняя</span>
                  <p className="text-xs text-muted-foreground">25-50%</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="h-2 w-full bg-orange-500 rounded mb-2" />
                  <span className="text-sm font-medium">Высокая</span>
                  <p className="text-xs text-muted-foreground">50-75%</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="h-2 w-full bg-destructive rounded mb-2" />
                  <span className="text-sm font-medium">Критическая</span>
                  <p className="text-xs text-muted-foreground">75-100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ошибки */}
        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Ошибок за час"
              value={health.errors.last1h}
              icon={AlertTriangle}
              status={health.errors.last1h > 10 ? "critical" : health.errors.last1h > 5 ? "medium" : "low"}
            />
            <MetricCard
              title="Ошибок за 24 часа"
              value={health.errors.last24h}
              icon={AlertCircle}
              trend={health.errors.trend}
            />
            <MetricCard
              title="Критические ошибки (7д)"
              value={health.errors.criticalErrors}
              icon={AlertTriangle}
              status={health.errors.criticalErrors > 0 ? "critical" : "healthy"}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Распределение ошибок по часам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={health.hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar
                      dataKey="errors"
                      fill="hsl(var(--destructive))"
                      name="Ошибки"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ресурсы */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Хранилище */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Использование хранилища
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Статус</span>
                  <StatusBadge status={health.storage.status} />
                </div>
                <GaugeIndicator
                  label="Использовано"
                  value={health.storage.percentUsed}
                  max={100}
                  unit="%"
                  status={health.storage.status}
                />
                <div className="pt-2 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Использовано</span>
                    <span className="font-medium">{health.storage.usedMB} МБ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Всего доступно</span>
                    <span className="font-medium">{health.storage.totalMB} МБ</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Сессии */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Активные сессии
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-primary">
                    {health.sessions.activeSessions}
                  </div>
                  <p className="text-sm text-muted-foreground">Активных сессий сейчас</p>
                </div>
                <div className="pt-2 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Пик за сегодня</span>
                    <span className="font-medium">{health.sessions.peakToday}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ср. длительность сессии</span>
                    <span className="font-medium">{health.sessions.avgSessionDuration} мин</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Доступность */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Доступность системы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-primary">
                    {health.availability.current.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Последний час</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-primary">
                    {health.availability.last24h.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">24 часа</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-primary">
                    {health.availability.last7d.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">7 дней</p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    SLA цель: 99.9% • Текущий статус:{" "}
                    <StatusBadge status={health.availability.status} />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
