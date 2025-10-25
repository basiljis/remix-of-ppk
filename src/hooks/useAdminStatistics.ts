import { useOptimizedQuery } from './useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStatistics {
  // Авторизация
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  
  // Заявки
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  
  // Протоколы
  totalProtocols: number;
  draftProtocols: number;
  inProgressProtocols: number;
  completedProtocols: number;
  
  // Организации
  totalOrganizations: number;
  activeOrganizations: number;
  
  // Должности
  totalPositions: number;
  
  // По ролям
  usersByRole: {
    admin: number;
    regional_operator: number;
    user: number;
  };
  
  // Распределение протоколов
  protocolsByLevel: {
    preschool: number;
    elementary: number;
    middle: number;
    high: number;
  };
  
  protocolsByType: {
    primary: number;
    secondary: number;
  };
}

export function useAdminStatistics() {
  return useOptimizedQuery(
    ['admin-statistics'],
    async (): Promise<AdminStatistics> => {
      // Параллельный запрос всех данных
      const [
        profilesResult,
        requestsResult,
        protocolsResult,
        organizationsResult,
        positionsResult,
        rolesResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id, is_blocked, created_at'),
        supabase.from('access_requests').select('id, status, created_at'),
        supabase.from('protocols').select('id, status, education_level, consultation_type, created_at'),
        supabase.from('organizations').select('id, is_archived'),
        supabase.from('positions').select('id'),
        supabase.from('user_roles').select('user_id, role'),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (requestsResult.error) throw requestsResult.error;
      if (protocolsResult.error) throw protocolsResult.error;
      if (organizationsResult.error) throw organizationsResult.error;
      if (positionsResult.error) throw positionsResult.error;
      if (rolesResult.error) throw rolesResult.error;

      const profiles = profilesResult.data || [];
      const requests = requestsResult.data || [];
      const protocols = protocolsResult.data || [];
      const organizations = organizationsResult.data || [];
      const positions = positionsResult.data || [];
      const roles = rolesResult.data || [];

      // Подсчет ролей
      const rolesCounts = roles.reduce((acc, r) => {
        acc[r.role] = (acc[r.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        // Авторизация
        totalUsers: profiles.length,
        activeUsers: profiles.filter(p => !p.is_blocked).length,
        blockedUsers: profiles.filter(p => p.is_blocked).length,
        
        // Заявки
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        approvedRequests: requests.filter(r => r.status === 'approved').length,
        rejectedRequests: requests.filter(r => r.status === 'rejected').length,
        
        // Протоколы
        totalProtocols: protocols.length,
        draftProtocols: protocols.filter(p => p.status === 'draft').length,
        inProgressProtocols: protocols.filter(p => p.status === 'in_progress').length,
        completedProtocols: protocols.filter(p => p.status === 'completed').length,
        
        // Организации
        totalOrganizations: organizations.length,
        activeOrganizations: organizations.filter(o => !o.is_archived).length,
        
        // Должности
        totalPositions: positions.length,
        
        // По ролям
        usersByRole: {
          admin: rolesCounts['admin'] || 0,
          regional_operator: rolesCounts['regional_operator'] || 0,
          user: rolesCounts['user'] || 0,
        },
        
        // Распределение протоколов
        protocolsByLevel: {
          preschool: protocols.filter(p => p.education_level === 'preschool').length,
          elementary: protocols.filter(p => p.education_level === 'elementary').length,
          middle: protocols.filter(p => p.education_level === 'middle').length,
          high: protocols.filter(p => p.education_level === 'high').length,
        },
        
        protocolsByType: {
          primary: protocols.filter(p => p.consultation_type === 'primary').length,
          secondary: protocols.filter(p => p.consultation_type === 'secondary').length,
        },
      };
    },
    {
      staleTime: 5 * 60 * 1000, // 5 минут
      gcTime: 10 * 60 * 1000, // 10 минут
    }
  );
}