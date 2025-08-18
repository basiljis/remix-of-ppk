import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Cpu, Database, Globe, MemoryStick, RefreshCw } from 'lucide-react';
import { usePerformanceStats } from '@/hooks/useOptimizedQuery';
import { resourceMonitor, PerformanceMonitor as PM } from '@/lib/supabase-performance';

export const PerformanceMonitor: React.FC = () => {
  const { data: performanceStats, refetch } = usePerformanceStats();
  const [systemInfo, setSystemInfo] = useState({
    memory: { used: 0, total: 0, limit: 0 },
    network: { online: true, speed: 'unknown' },
    timestamp: Date.now(),
  });

  useEffect(() => {
    const updateSystemInfo = () => {
      resourceMonitor.checkMemoryUsage();
      
      const memory = 'memory' in performance ? (performance as any).memory : null;
      
      setSystemInfo({
        memory: memory ? {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        } : { used: 0, total: 0, limit: 0 },
        network: {
          online: resourceMonitor.checkNetworkStatus(),
          speed: resourceMonitor.getConnectionSpeed(),
        },
        timestamp: Date.now(),
      });
    };

    updateSystemInfo();
    const interval = setInterval(updateSystemInfo, 5000); // Обновляем каждые 5 секунд

    return () => clearInterval(interval);
  }, []);

  const handleClearMetrics = () => {
    PM.getInstance().clearMetrics();
    refetch();
  };

  const getStatusColor = (avg: number) => {
    if (avg < 100) return 'default';
    if (avg < 500) return 'secondary';
    if (avg < 1000) return 'outline';
    return 'destructive';
  };

  const getMemoryUsagePercent = () => {
    if (systemInfo.memory.limit === 0) return 0;
    return (systemInfo.memory.used / systemInfo.memory.limit) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Мониторинг производительности</h2>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
          <Button onClick={handleClearMetrics} variant="outline" size="sm">
            Очистить метрики
          </Button>
        </div>
      </div>

      <Tabs defaultValue="queries" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queries">
            <Database className="h-4 w-4 mr-2" />
            Запросы к БД
          </TabsTrigger>
          <TabsTrigger value="system">
            <Cpu className="h-4 w-4 mr-2" />
            Система
          </TabsTrigger>
          <TabsTrigger value="network">
            <Globe className="h-4 w-4 mr-2" />
            Сеть
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Статистика запросов
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceStats && Object.keys(performanceStats).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(performanceStats).map(([queryName, stats]) => (
                    <div key={queryName} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{queryName}</h4>
                        <Badge variant={getStatusColor(stats.avg)}>
                          {stats.avg}ms среднее
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Выполнено:</span>
                          <p className="font-medium">{stats.count}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Минимум:</span>
                          <p className="font-medium">{stats.min}ms</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Максимум:</span>
                          <p className="font-medium">{stats.max}ms</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">95-й перцентиль:</span>
                          <p className="font-medium">{stats.p95}ms</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Статус:</span>
                          <p className="font-medium">
                            {stats.avg < 100 ? '🟢 Отлично' :
                             stats.avg < 500 ? '🟡 Хорошо' :
                             stats.avg < 1000 ? '🟠 Средне' : '🔴 Медленно'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Метрики запросов пока не собраны. Выполните несколько действий в приложении.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MemoryStick className="h-5 w-5 mr-2" />
                Использование памяти
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemInfo.memory.limit > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Использовано: {systemInfo.memory.used} MB</span>
                    <span>Лимит: {systemInfo.memory.limit} MB</span>
                  </div>
                  <Progress 
                    value={getMemoryUsagePercent()} 
                    className="w-full"
                  />
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Использовано:</span>
                      <p className="font-medium">{systemInfo.memory.used} MB</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Всего:</span>
                      <p className="font-medium">{systemInfo.memory.total} MB</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Процент:</span>
                      <p className="font-medium">{getMemoryUsagePercent().toFixed(1)}%</p>
                    </div>
                  </div>
                  {getMemoryUsagePercent() > 80 && (
                    <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
                      ⚠️ Высокое использование памяти. Рекомендуется перезагрузить страницу.
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Информация о памяти недоступна в этом браузере.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Состояние сети
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span>Статус подключения:</span>
                  <Badge variant={systemInfo.network.online ? 'default' : 'destructive'}>
                    {systemInfo.network.online ? '🟢 Онлайн' : '🔴 Офлайн'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span>Скорость соединения:</span>
                  <Badge variant="secondary">
                    {systemInfo.network.speed === '4g' ? '🟢 4G' :
                     systemInfo.network.speed === '3g' ? '🟡 3G' :
                     systemInfo.network.speed === '2g' ? '🔴 2G' :
                     systemInfo.network.speed === 'slow-2g' ? '🔴 Медленное 2G' : 
                     '❓ Неизвестно'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Последнее обновление: {new Date(systemInfo.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Рекомендации по оптимизации</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {performanceStats && Object.values(performanceStats).some((stats: any) => stats.avg > 1000) && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                🔴 <strong>Медленные запросы:</strong> Обнаружены запросы с временем выполнения больше 1 сек. 
                Проверьте индексы в базе данных.
              </div>
            )}
            
            {getMemoryUsagePercent() > 70 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                🟠 <strong>Высокое использование памяти:</strong> Рассмотрите возможность 
                оптимизации кэширования или перезагрузки страницы.
              </div>
            )}
            
            {!systemInfo.network.online && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                🔴 <strong>Нет соединения:</strong> Проверьте подключение к интернету.
              </div>
            )}
            
            {(systemInfo.network.speed === '2g' || systemInfo.network.speed === 'slow-2g') && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                🟠 <strong>Медленное соединение:</strong> Некоторые функции могут работать медленно.
              </div>
            )}
            
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              🟢 <strong>Оптимизация включена:</strong> Используются индексы БД, кэширование запросов 
              и мониторинг производительности.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};