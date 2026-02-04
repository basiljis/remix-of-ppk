import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedQuery, useOptimizedMutation } from '@/hooks/useOptimizedQuery';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
  meeting_type?: string;
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();

  const organizationId = profile?.organization_id;

  const { data: protocols = [], isLoading: loading, error, refetch: loadProtocols } = useOptimizedQuery(
    ['protocols', organizationId || 'all', isAdmin ? 'admin' : 'user'],
    async () => {
      let query = supabase
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

      // Фильтруем по организации, если пользователь не админ
      if (!isAdmin && organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      return data || [];
    },
    {
      enabled: isAdmin || !!organizationId
    },
    { staleTime: 1000 * 60 * 5 } // 5 minutes
  );


  const saveProtocolMutation = useOptimizedMutation<Protocol, Omit<Protocol, 'id' | 'created_at' | 'updated_at'>>(
    async (protocolData) => {
      const { data, error } = await supabase
        .from('protocols')
        .insert(protocolData)
        .select()
        .single();

      if (error) throw error;
      return data as Protocol;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['protocols'] });
        toast({
          title: "Протокол сохранен",
          description: "Протокол успешно добавлен в базу данных"
        });
      },
      onError: (err) => {
        console.error('Error saving protocol:', err);
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить протокол",
          variant: "destructive"
        });
      },
    }
  );

  const updateProtocolMutation = useOptimizedMutation<Protocol, { id: string; updates: Partial<Protocol> }>(
    async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('protocols')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Protocol;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['protocols'] });
        toast({
          title: "Протокол обновлен",
          description: "Изменения успешно сохранены"
        });
      },
      onError: (err) => {
        console.error('Error updating protocol:', err);
        toast({
          title: "Ошибка",
          description: "Не удалось обновить протокол",
          variant: "destructive"
        });
      },
    }
  );

  const deleteProtocolMutation = useOptimizedMutation<void, string>(
    async (id) => {
      const { error } = await supabase
        .from('protocols')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['protocols'] });
        toast({
          title: "Протокол удален",
          description: "Протокол успешно удален из базы данных"
        });
      },
      onError: (err) => {
        console.error('Error deleting protocol:', err);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить протокол",
          variant: "destructive"
        });
      },
    }
  );

  const getProtocol = (id: string): Protocol | undefined => {
    return protocols.find(p => p.id === id);
  };

  return {
    protocols,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Unknown error') : null,
    loadProtocols,
    saveProtocol: saveProtocolMutation.mutateAsync,
    updateProtocol: (id: string, updates: Partial<Protocol>) => 
      updateProtocolMutation.mutateAsync({ id, updates }),
    deleteProtocol: deleteProtocolMutation.mutateAsync,
    getProtocol: (id: string) => protocols.find(p => p.id === id)
  };
};