import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Расширенная конфигурация Supabase для высокой нагрузки
const supabaseConfig = {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    // Оптимизация для производительности
    storageKey: 'ppk-auth-token',
    flowType: 'pkce' as const,
  },
  db: {
    // Настройки подключения к БД
    schema: 'public',
  },
  realtime: {
    // Отключаем realtime для экономии ресурсов, если не нужно
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-client-info': 'ppk-system@1.0.0',
    },
  },
};

// Создание оптимизированного клиента Supabase
export const createOptimizedSupabaseClient = (): SupabaseClient => {
  const client = createClient(
    'https://oxyjmeslnmhewlpgzlmf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eWptZXNsbm1oZXdscGd6bG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjE2MjEsImV4cCI6MjA2OTg5NzYyMX0.zqNt8Zj0ktRLY1HBKelEYJ0gXaLkyIc4l6PAwMod7Co',
    supabaseConfig
  );

  return client;
};

// Система метрик производительности
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Замер времени выполнения запроса
  async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric(queryName, duration);
      
      // Логируем медленные запросы (> 1 секунды)
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`Query failed: ${queryName} in ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  // Запись метрики
  private recordMetric(queryName: string, duration: number): void {
    if (!this.metrics.has(queryName)) {
      this.metrics.set(queryName, []);
    }
    
    const metrics = this.metrics.get(queryName)!;
    metrics.push(duration);
    
    // Храним только последние 100 измерений
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  // Получение статистики
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [queryName, durations] of this.metrics) {
      if (durations.length === 0) continue;
      
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      const p95 = this.percentile(durations, 0.95);
      
      stats[queryName] = {
        count: durations.length,
        avg: Math.round(avg * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        p95: Math.round(p95 * 100) / 100,
      };
    }
    
    return stats;
  }

  // Вычисление перцентиля
  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }

  // Очистка метрик
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Обертка для оптимизированных запросов
export const optimizedQuery = {
  // Кэшированный запрос с автоматическими повторами
  async withRetry<T>(
    queryFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) break;
        
        // Экспоненциальная задержка
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError!;
  },

  // Батчинг запросов
  async batch<T>(queries: (() => Promise<T>)[]): Promise<T[]> {
    return Promise.all(queries.map(query => query()));
  },
};

// Настройки кэширования для React Query
export const cacheConfig = {
  queries: {
    // Время кэширования по умолчанию
    staleTime: 5 * 60 * 1000, // 5 минут
    cacheTime: 10 * 60 * 1000, // 10 минут
    
    // Настройки повторных запросов
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Фоновые обновления
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
  },
  
  // Специфичные настройки для разных типов данных
  protocols: {
    staleTime: 2 * 60 * 1000, // 2 минуты (часто изменяется)
    cacheTime: 5 * 60 * 1000,
  },
  
  organizations: {
    staleTime: 30 * 60 * 1000, // 30 минут (редко изменяется)
    cacheTime: 60 * 60 * 1000, // 1 час
  },
  
  checklists: {
    staleTime: 60 * 60 * 1000, // 1 час (очень редко изменяется)
    cacheTime: 24 * 60 * 60 * 1000, // 24 часа
  },
};

// Утилиты для мониторинга ресурсов
export const resourceMonitor = {
  // Проверка использования памяти
  checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryInfo = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
      
      // Предупреждение при высоком использовании памяти
      if (memoryInfo.used / memoryInfo.limit > 0.8) {
        console.warn('High memory usage detected:', memoryInfo);
      }
    }
  },

  // Мониторинг сетевого соединения
  checkNetworkStatus(): boolean {
    return navigator.onLine;
  },

  // Определение скорости соединения
  getConnectionSpeed(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || 'unknown';
    }
    return 'unknown';
  },
};