import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Section {
  id: string;
  title: string;
  content: string;
  subsections: Subsection[];
  documents: Document[];
}

interface Subsection {
  id: string;
  title: string;
  content: string;
  documents: Document[];
}

interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface Instruction {
  id: string;
  title: string;
  content: any; // Using any for JSONB compatibility
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useInstructions = () => {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstructions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('instructions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setInstructions((data || []).map(item => ({
        ...item,
        content: (() => {
          try {
            const parsed = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      })));
    } catch (err) {
      console.error('Error fetching instructions:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке инструкций');
      setInstructions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructions();
  }, []);

  return {
    instructions,
    loading,
    error,
    refetch: fetchInstructions
  };
};