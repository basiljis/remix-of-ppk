import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { apiService } from '@/services/apiService';
import { useToast } from '@/hooks/use-toast';

export interface Organization {
  id: string;
  external_id?: string;
  name: string;
  district?: string;
  type?: string;
  is_manual: boolean;
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

      // Fetch organizations from Supabase only
      const { data: supabaseOrgs, error: supabaseError } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (supabaseError) throw supabaseError;

      setOrganizations(supabaseOrgs || []);
      
      console.log(`Loaded ${supabaseOrgs?.length || 0} organizations from Supabase`);
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

  const searchOrganizations = (query: string): Organization[] => {
    if (!query || query.trim() === '') return organizations;
    
    const lowercaseQuery = query.toLowerCase().trim();
    return organizations.filter(org => {
      if (!org.name) return false;
      
      return (
        org.name.toLowerCase().includes(lowercaseQuery) ||
        org.external_id?.toLowerCase().includes(lowercaseQuery) ||
        org.district?.toLowerCase().includes(lowercaseQuery) ||
        org.type?.toLowerCase().includes(lowercaseQuery)
      );
    });
  };

  return {
    organizations,
    loading,
    error,
    loadOrganizations,
    addOrganization,
    searchOrganizations,
    syncEkisOrganizations
  };
};