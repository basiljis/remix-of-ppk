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

      // Fetch organizations from Supabase
      const { data: supabaseOrgs, error: supabaseError } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (supabaseError) throw supabaseError;

      setOrganizations(supabaseOrgs || []);

      // Load and sync EKIS organizations in background
      syncEkisOrganizations();
    } catch (err) {
      console.error('Error loading organizations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const syncEkisOrganizations = async () => {
    try {
      const ekisData = await apiService.getActualEduorgs();
      const ekisOrgs = ekisData.data.eduorgs;

      // Insert or update EKIS organizations
      for (const org of ekisOrgs) {
        await supabase
          .from('organizations')
          .upsert({
            external_id: org.id,
            name: org.name,
            district: org.district,
            type: org.type,
            is_manual: false
          }, {
            onConflict: 'external_id'
          });
      }

      // Reload organizations after sync
      loadOrganizations();
    } catch (err) {
      console.warn('Could not sync EKIS organizations:', err);
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
    if (!query) return organizations;
    
    const lowercaseQuery = query.toLowerCase();
    return organizations.filter(org =>
      org.name.toLowerCase().includes(lowercaseQuery) ||
      org.external_id?.includes(query) ||
      org.district?.toLowerCase().includes(lowercaseQuery)
    );
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