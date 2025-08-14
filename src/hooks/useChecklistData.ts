import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChecklistItem {
  id: string;
  text: string;
  isRequired: boolean;
  isCompleted: boolean;
  orderIndex: number;
}

export interface Checklist {
  id: string;
  name: string;
  level: string;
  type: string;
  items: ChecklistItem[];
}

export const useChecklistData = () => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      
      // Fetch checklists with their items
      const { data: checklistData, error: checklistError } = await supabase
        .from('checklist')
        .select(`
          id,
          name,
          level,
          type,
          checklist_item (
            id,
            text,
            is_required,
            order_index
          )
        `)
        .order('created_at');

      if (checklistError) throw checklistError;

      // Transform data to match our interface
      const transformedChecklists: Checklist[] = (checklistData || []).map(checklist => ({
        id: checklist.id,
        name: checklist.name,
        level: checklist.level,
        type: checklist.type,
        items: (checklist.checklist_item || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((item: any) => ({
            id: item.id,
            text: item.text,
            isRequired: item.is_required,
            isCompleted: false,
            orderIndex: item.order_index
          }))
      }));

      setChecklists(transformedChecklists);
    } catch (err) {
      console.error('Error fetching checklists:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getChecklistByLevelAndType = (level: string, type: string): Checklist | undefined => {
    return checklists.find(checklist => 
      checklist.level === level && checklist.type === type
    );
  };

  return {
    checklists,
    loading,
    error,
    getChecklistByLevelAndType,
    refetch: fetchChecklists
  };
};