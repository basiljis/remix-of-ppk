import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Protocol {
  id: string;
  child_name: string;
  child_birth_date?: string;
  organization_id?: string;
  education_level: string;
  consultation_type: string;
  consultation_reason?: string;
  ppk_number?: string;
  session_topic?: string;
  protocol_data?: any;
  checklist_data?: any;
  completion_percentage: number;
  status: string;
  is_ready: boolean;
  created_at: string;
  updated_at: string;
  organizations?: {
    id: string;
    name: string;
    district?: string;
    type?: string;
  };
}

export const useProtocols = () => {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('protocols')
        .select(`
          *,
          organizations (
            id,
            name,
            district,
            type
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProtocols(data || []);
    } catch (err) {
      console.error('Error loading protocols:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const saveProtocol = async (protocolData: Omit<Protocol, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('protocols')
        .insert(protocolData)
        .select()
        .single();

      if (error) throw error;

      setProtocols(prev => [data, ...prev]);
      toast({
        title: "Протокол сохранен",
        description: "Протокол успешно добавлен в базу данных"
      });

      return data;
    } catch (err) {
      console.error('Error saving protocol:', err);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить протокол",
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateProtocol = async (id: string, updates: Partial<Protocol>) => {
    try {
      const { data, error } = await supabase
        .from('protocols')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProtocols(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      toast({
        title: "Протокол обновлен",
        description: "Изменения успешно сохранены"
      });

      return data;
    } catch (err) {
      console.error('Error updating protocol:', err);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить протокол",
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteProtocol = async (id: string) => {
    try {
      const { error } = await supabase
        .from('protocols')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProtocols(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Протокол удален",
        description: "Протокол успешно удален из базы данных"
      });
    } catch (err) {
      console.error('Error deleting protocol:', err);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить протокол",
        variant: "destructive"
      });
      throw err;
    }
  };

  const getProtocol = (id: string): Protocol | undefined => {
    return protocols.find(p => p.id === id);
  };

  return {
    protocols,
    loading,
    error,
    loadProtocols,
    saveProtocol,
    updateProtocol,
    deleteProtocol,
    getProtocol
  };
};