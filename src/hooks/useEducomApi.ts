import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface EducomOrganization {
  id: string;
  ekis_id?: string;
  name: string;
  full_name?: string;
  short_name?: string;
  status_id: number;
  status_name?: string;
  is_archived: boolean;
  has_education_activity: boolean;
  district?: string;
  type?: string;
  phone?: string;
  email?: string;
  website?: string;
  parent_organization?: string;
  coordinates_lat?: number;
  coordinates_lng?: number;
  metro_station?: string;
  last_sync_at?: string;
  is_manual: boolean;
  created_at: string;
  updated_at: string;
  organization_addresses: Array<{
    id: string;
    address_type: string;
    full_address: string;
    postal_code?: string;
    region?: string;
    city?: string;
    street?: string;
    building?: string;
    is_main_building: boolean;
    coordinates_lat?: number;
    coordinates_lng?: number;
    district?: string;
    metro_station?: string;
  }>;
  organization_reorganizations: Array<{
    id: string;
    event_type_name: string;
    event_comments?: string;
    ekis_in?: string;
    ekis_out?: string;
    event_date?: string;
  }>;
}

export interface OrganizationFilters {
  status_id?: number;
  is_archived?: boolean;
  district?: string;
  has_education_activity?: boolean;
  search?: string;
}

export const useEducomApi = () => {
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<EducomOrganization[]>([]);

  const syncOrganizations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('educom-api', {
        body: { action: 'syncOrganizations' }
      });

      if (error) throw error;

      toast({
        title: "Синхронизация завершена",
        description: `Обновлено: ${data.synced}, ошибок: ${data.errors}, всего: ${data.total}`,
      });

      return data;
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Ошибка синхронизации",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async (filters?: OrganizationFilters) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('educom-api', {
        body: { 
          action: 'getOrganizations',
          filters 
        }
      });

      if (error) throw error;

      setOrganizations(data.data || []);
      return data.data || [];
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (statusId: number) => {
    switch (statusId) {
      case 1: return 'Действует';
      case 2: return 'В стадии открытия (приказ)';
      case 3: return 'В стадии закрытия (приказ)';
      default: return 'Неизвестно';
    }
  };

  const getStatusColor = (statusId: number, isArchived: boolean) => {
    if (isArchived) return 'destructive';
    switch (statusId) {
      case 1: return 'default';
      case 2: return 'secondary';
      case 3: return 'destructive';
      default: return 'outline';
    }
  };

  return {
    loading,
    organizations,
    syncOrganizations,
    fetchOrganizations,
    getStatusLabel,
    getStatusColor
  };
};