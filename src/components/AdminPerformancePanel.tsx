import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { useOptimizedStatistics } from '@/hooks/useOptimizedQuery';
import { Activity, Database, TrendingUp } from 'lucide-react';

export const AdminPerformancePanel: React.FC = () => {
  const { data: statistics, isLoading } = useOptimizedStatistics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Панель администратора</h2>
        <div className="text-center py-8">Загрузка статистики...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Панель администратора</h2>
      
      <Tabs defaultValue="statistics" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="statistics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Статистика
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Activity className="h-4 w-4 mr-2" />
            Производительность
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-4">
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего протоколов</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalProtocols}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Завершено: {statistics.completedProtocols}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">В работе</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.inProgressProtocols}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Черновики: {statistics.draftProtocols}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Организации</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalOrganizations}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Активные образовательные
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Первичные / Повторные</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.protocolsByType.primary} / {statistics.protocolsByType.secondary}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Тип консультаций
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Распределение по уровням образования</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Дошкольное:</span>
                      <span className="font-medium">{statistics.protocolsByLevel.preschool}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Начальное:</span>
                      <span className="font-medium">{statistics.protocolsByLevel.elementary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Основное:</span>
                      <span className="font-medium">{statistics.protocolsByLevel.middle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Среднее:</span>
                      <span className="font-medium">{statistics.protocolsByLevel.high}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Статусы протоколов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Завершенные:</span>
                      <span className="font-medium text-green-600">{statistics.completedProtocols}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>В процессе:</span>
                      <span className="font-medium text-blue-600">{statistics.inProgressProtocols}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Черновики:</span>
                      <span className="font-medium text-gray-600">{statistics.draftProtocols}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
};