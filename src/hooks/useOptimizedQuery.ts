import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { PerformanceMonitor, optimizedQuery, cacheConfig } from '@/lib/supabase-performance';
import { supabase } from '@/integrations/supabase/client';

const performanceMonitor = PerformanceMonitor.getInstance();

// Оптимизированный хук для запросов с кэшированием и метриками
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Partial<UseQueryOptions<T>>,
  cacheSettings?: { staleTime?: number; cacheTime?: number }
) {
  const mergedCacheSettings = {
    ...cacheConfig.queries,
    ...cacheSettings,
  };

  return useQuery({
    queryKey,
    queryFn: () => performanceMonitor.measureQuery(
      queryKey.join('_'),
      () => optimizedQuery.withRetry(queryFn)
    ),
    staleTime: mergedCacheSettings.staleTime,
    gcTime: mergedCacheSettings.cacheTime, // Updated property name
    retry: mergedCacheSettings.retry,
    retryDelay: mergedCacheSettings.retryDelay,
    refetchOnWindowFocus: mergedCacheSettings.refetchOnWindowFocus,
    refetchOnReconnect: mergedCacheSettings.refetchOnReconnect,
    refetchOnMount: mergedCacheSettings.refetchOnMount,
    ...options,
  });
}

// Оптимизированный хук для мутаций
export function useOptimizedMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: Error, variables: V) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: V) => performanceMonitor.measureQuery(
      'mutation',
      () => optimizedQuery.withRetry(() => mutationFn(variables))
    ),
    onSuccess: (data, variables) => {
      // Инвалидация кэша
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
}

// Специализированные хуки для основных сущностей

// Протоколы с оптимизированным кэшированием
export function useOptimizedProtocols() {
  return useOptimizedQuery(
    ['protocols'],
    async () => {
      const { data, error } = await supabase
        .from('protocols')
        .select(`
          *,
          organizations:organization_id (
            id,
            name,
            district,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {},
    cacheConfig.protocols
  );
}

// Организации с долгосрочным кэшированием
export function useOptimizedOrganizations(searchTerm?: string) {
  return useOptimizedQuery(
    ['organizations', searchTerm || 'all'],
    async () => {
      let query = supabase
        .from('organizations')
        .select('*')
        .eq('is_archived', false)
        .eq('has_education_activity', true)
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,district.ilike.%${searchTerm}%,ekis_id.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    {},
    cacheConfig.organizations
  );
}

// Чек-листы с максимальным кэшированием
export function useOptimizedChecklists(educationLevel?: string) {
  return useOptimizedQuery(
    ['checklists', educationLevel || 'all'],
    async () => {
      let query = supabase
        .from('checklist')
        .select(`
          *,
          checklist_item (
            id,
            text,
            is_required,
            order_index
          )
        `)
        .order('name');

      if (educationLevel) {
        query = query.eq('level', educationLevel);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    {},
    cacheConfig.checklists
  );
}

// Инструкции с кэшированием
export function useOptimizedInstructions() {
  return useOptimizedQuery(
    ['instructions'],
    async () => {
      const { data, error } = await supabase
        .from('instructions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {},
    cacheConfig.checklists // Используем те же настройки что и для чек-листов
  );
}

// Батчированный запрос для статистики
export function useOptimizedStatistics() {
  return useOptimizedQuery(
    ['statistics'],
    async () => {
      // Батчируем несколько запросов
      const [protocolsResult, organizationsResult] = await Promise.all([
        supabase
          .from('protocols')
          .select('status, consultation_type, education_level, created_at'),
        supabase
          .from('organizations')
          .select('id, name, district')
          .eq('is_archived', false)
      ]);

      if (protocolsResult.error) throw protocolsResult.error;
      if (organizationsResult.error) throw organizationsResult.error;

      const protocols = protocolsResult.data || [];
      const organizations = organizationsResult.data || [];

      // Вычисляем статистику
      const stats = {
        totalProtocols: protocols.length,
        completedProtocols: protocols.filter(p => p.status === 'completed').length,
        draftProtocols: protocols.filter(p => p.status === 'draft').length,
        inProgressProtocols: protocols.filter(p => p.status === 'in_progress').length,
        totalOrganizations: organizations.length,
        protocolsByType: {
          primary: protocols.filter(p => p.consultation_type === 'primary').length,
          secondary: protocols.filter(p => p.consultation_type === 'secondary').length,
        },
        protocolsByLevel: {
          preschool: protocols.filter(p => p.education_level === 'preschool').length,
          elementary: protocols.filter(p => p.education_level === 'elementary').length,
          middle: protocols.filter(p => p.education_level === 'middle').length,
          high: protocols.filter(p => p.education_level === 'high').length,
        },
      };

      return stats;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 минут  
      gcTime: 10 * 60 * 1000, // 10 минут
    }
  );
}

// Хук для мониторинга производительности
export function usePerformanceStats() {
  return useOptimizedQuery(
    ['performance-stats'],
    () => Promise.resolve(performanceMonitor.getStats()),
    {
      staleTime: 30 * 1000, // 30 секунд
      gcTime: 60 * 1000, // 1 минута  
    }
  );
}