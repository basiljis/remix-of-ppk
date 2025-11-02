import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedOrganizations } from '@/hooks/useOptimizedQuery';
import { apiService } from '@/services/apiService';
import { useToast } from '@/hooks/use-toast';

export interface Organization {
  id: string;
  external_id?: string;
  name: string;
  district?: string;
  type?: string;
  mrsd?: string;
  is_manual: boolean;
  region_id?: string;
}

export const useOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use EKIS API data through Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('educom-api', {
        body: { action: 'getOrganizations' }
      });

      if (error) throw error;

      // Transform EKIS data to match organization interface
      const transformedOrgs = (data.data || []).map((org: any) => ({
        id: org.id,
        external_id: org.ekis_id,
        name: org.full_name || org.name,
        district: org.district,
        type: org.type,
        is_manual: org.is_manual || false,
        region_id: org.region_id
      }));

      setOrganizations(transformedOrgs);
      
      console.log(`Loaded ${transformedOrgs.length} organizations from EKIS API`);
    } catch (err) {
      console.error('Error loading organizations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const syncEkisOrganizations = async () => {
    try {
      console.log('Starting EKIS synchronization...');
      
      // Используем новую edge function вместо старого API сервиса
      const { data, error } = await supabase.functions.invoke('educom-api', {
        body: { action: 'syncOrganizations' }
      });

      if (error) {
        console.error('Sync error:', error);
        throw new Error(error.message || 'Edge Function error');
      }

      if (!data.success) {
        console.error('Sync failed:', data);
        throw new Error(data.error || data.details || 'Synchronization failed');
      }

      console.log(`Successfully synced ${data.synced} organizations (${data.errors} errors)`);
      
      // Reload organizations after sync
      await loadOrganizations();
      
      toast({
        title: "Синхронизация завершена",
        description: `Загружено ${data.synced} организаций из ЕКИС`
      });

    } catch (err) {
      console.error('EKIS synchronization failed:', err);
      
      let errorMessage = "Не удалось загрузить данные из ЕКИС.";
      
      // Проверяем тип ошибки для более точного сообщения
      if (err.message?.includes('ЕКИС API недоступен') || err.message?.includes('Edge Function returned a non-2xx status code')) {
        errorMessage = "API ЕКИС временно недоступен. Попробуйте позже.";
      } else if (err.message?.includes('Service Unavailable')) {
        errorMessage = "Сервис синхронизации временно недоступен. Попробуйте позже.";
      }
      
      toast({
        title: "Ошибка синхронизации",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  // Старый код синхронизации через apiService (оставляем как резерв)
  const syncEkisOrganizationsLegacy = async () => {
    try {
      console.log('Starting EKIS synchronization...');
      const ekisData = await apiService.getActualEduorgs();
      const ekisOrgs = ekisData.data.eduorgs;

      console.log(`Received ${ekisOrgs.length} organizations from EKIS`);

      if (ekisOrgs.length === 0) {
        throw new Error('No organizations received from EKIS');
      }

      // Batch upsert organizations in chunks for better performance
      const BATCH_SIZE = 50;
      const batches = [];
      
      for (let i = 0; i < ekisOrgs.length; i += BATCH_SIZE) {
        batches.push(ekisOrgs.slice(i, i + BATCH_SIZE));
      }

      let totalUpserted = 0;
      for (const batch of batches) {
        const orgsToUpsert = batch.map(org => ({
          external_id: org.id,
          name: org.name,
          district: org.district,
          type: org.type,
          is_manual: false
        }));

        console.log(`Upserting batch of ${orgsToUpsert.length} organizations...`);
        
        const { error } = await supabase
          .from('organizations')
          .upsert(orgsToUpsert, {
            onConflict: 'external_id'
          });

        if (error) {
          console.error('Upsert error:', error);
          throw error;
        }

        totalUpserted += orgsToUpsert.length;
      }

      // Reload organizations after sync
      await loadOrganizations();
      
      console.log(`Successfully synced ${totalUpserted} organizations from EKIS`);
      
      toast({
        title: "Синхронизация завершена",
        description: `Загружено ${totalUpserted} организаций из ЕКИС`
      });

    } catch (err) {
      console.error('EKIS synchronization failed:', err);
      toast({
        title: "Ошибка синхронизации",
        description: "Не удалось загрузить данные из ЕКИС. Проверьте подключение к интернету.",
        variant: "destructive"
      });
      throw err;
    }
  };

  const addOrganization = async (orgData: Omit<Organization, 'id' | 'is_manual'>) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          ...orgData,
          is_manual: true
        })
        .select()
        .single();

      if (error) throw error;

      setOrganizations(prev => [...prev, data]);
      toast({
        title: "Организация добавлена",
        description: "Новая организация успешно добавлена в базу данных"
      });

      return data;
    } catch (err) {
      console.error('Error adding organization:', err);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить организацию",
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateOrganization = async (id: string, orgData: Partial<Organization>) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(orgData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setOrganizations(prev => prev.map(org => org.id === id ? data : org));
      toast({
        title: "Организация обновлена",
        description: "Данные организации успешно обновлены"
      });

      return data;
    } catch (err) {
      console.error('Error updating organization:', err);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить организацию",
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteOrganization = async (id: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOrganizations(prev => prev.filter(org => org.id !== id));
      toast({
        title: "Организация удалена",
        description: "Организация успешно удалена из базы данных"
      });
    } catch (err) {
      console.error('Error deleting organization:', err);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить организацию",
        variant: "destructive"
      });
      throw err;
    }
  };

  const searchOrganizations = (query: string): Organization[] => {
    if (!query || query.trim() === '') return organizations;
    
    const lowercaseQuery = query.toLowerCase().trim();
    return organizations.filter(org => {
      if (!org.name) return false;
      
      return (
        org.name.toLowerCase().includes(lowercaseQuery) ||
        org.external_id?.toLowerCase().includes(lowercaseQuery) ||
        org.district?.toLowerCase().includes(lowercaseQuery) ||
        org.type?.toLowerCase().includes(lowercaseQuery) ||
        org.mrsd?.toLowerCase().includes(lowercaseQuery)
      );
    });
  };

  return {
    organizations,
    loading,
    error,
    loadOrganizations,
    addOrganization,
    updateOrganization,
    deleteOrganization,
    searchOrganizations,
    syncEkisOrganizations
  };
};