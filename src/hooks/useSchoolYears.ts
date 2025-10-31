import { useOptimizedQuery, useOptimizedMutation } from './useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SchoolYear } from '@/utils/schoolYear';

export interface DbSchoolYear {
  id: string;
  label: string;
  value: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSchoolYears = () => {
  const { toast } = useToast();

  // Fetch school years from database
  const { data: dbSchoolYears, isLoading, error, refetch } = useOptimizedQuery<DbSchoolYear[]>(
    ['school-years'],
    async () => {
      const { data, error } = await supabase
        .from('school_years')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {},
    { staleTime: 5 * 60 * 1000, cacheTime: 10 * 60 * 1000 }
  );

  // Convert database school years to SchoolYear format
  const schoolYears: SchoolYear[] = (dbSchoolYears || []).map(year => ({
    label: year.label,
    value: year.value,
    startDate: new Date(year.start_date),
    endDate: new Date(year.end_date)
  }));

  // Create school year mutation
  const createMutation = useOptimizedMutation<DbSchoolYear, Partial<DbSchoolYear>>(
    async (yearData) => {
      const { data, error } = await supabase
        .from('school_years')
        .insert({
          label: yearData.label!,
          value: yearData.value!,
          start_date: yearData.start_date!,
          end_date: yearData.end_date!,
          is_active: yearData.is_active ?? true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        toast({
          title: "Учебный год добавлен",
          description: "Новый учебный год успешно создан"
        });
      },
      onError: (error) => {
        console.error('Error creating school year:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось создать учебный год",
          variant: "destructive"
        });
      },
      invalidateQueries: [['school-years']]
    }
  );

  // Update school year mutation
  const updateMutation = useOptimizedMutation<DbSchoolYear, { id: string; data: Partial<DbSchoolYear> }>(
    async ({ id, data }) => {
      const { data: updated, error } = await supabase
        .from('school_years')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    {
      onSuccess: () => {
        toast({
          title: "Учебный год обновлен",
          description: "Изменения успешно сохранены"
        });
      },
      onError: (error) => {
        console.error('Error updating school year:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось обновить учебный год",
          variant: "destructive"
        });
      },
      invalidateQueries: [['school-years']]
    }
  );

  // Delete school year mutation
  const deleteMutation = useOptimizedMutation<void, string>(
    async (id) => {
      const { error } = await supabase
        .from('school_years')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    {
      onSuccess: () => {
        toast({
          title: "Учебный год удален",
          description: "Учебный год успешно удален из системы"
        });
      },
      onError: (error) => {
        console.error('Error deleting school year:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить учебный год",
          variant: "destructive"
        });
      },
      invalidateQueries: [['school-years']]
    }
  );

  return {
    schoolYears: dbSchoolYears || [],
    schoolYearsFormatted: schoolYears,
    loading: isLoading,
    error,
    refetch,
    createSchoolYear: createMutation.mutate,
    updateSchoolYear: updateMutation.mutate,
    deleteSchoolYear: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
