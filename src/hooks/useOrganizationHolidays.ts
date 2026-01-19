import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, getMonth, getDate, parseISO, isSameDay } from "date-fns";

interface Holiday {
  id: string;
  organization_id: string;
  holiday_date: string;
  name: string;
  description: string | null;
  is_recurring: boolean;
}

export function useOrganizationHolidays() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ["organization-holidays", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("organization_holidays")
        .select("*")
        .eq("organization_id", organizationId);
      
      if (error) throw error;
      return data as Holiday[];
    },
    enabled: !!organizationId,
  });

  /**
   * Check if a specific date is a holiday/non-working day
   */
  const isHoliday = (date: Date): boolean => {
    return holidays.some((holiday) => {
      const holidayDate = parseISO(holiday.holiday_date);
      
      if (holiday.is_recurring) {
        // For recurring holidays, only compare month and day
        return getMonth(holidayDate) === getMonth(date) && 
               getDate(holidayDate) === getDate(date);
      } else {
        // For non-recurring, compare full date
        return isSameDay(holidayDate, date);
      }
    });
  };

  /**
   * Get holiday info for a specific date if it exists
   */
  const getHolidayInfo = (date: Date): Holiday | undefined => {
    return holidays.find((holiday) => {
      const holidayDate = parseISO(holiday.holiday_date);
      
      if (holiday.is_recurring) {
        return getMonth(holidayDate) === getMonth(date) && 
               getDate(holidayDate) === getDate(date);
      } else {
        return isSameDay(holidayDate, date);
      }
    });
  };

  /**
   * Get all holiday dates as formatted strings for a given year
   */
  const getHolidayDatesForYear = (year: number): string[] => {
    return holidays.map((holiday) => {
      if (holiday.is_recurring) {
        const holidayDate = parseISO(holiday.holiday_date);
        return format(new Date(year, getMonth(holidayDate), getDate(holidayDate)), "yyyy-MM-dd");
      }
      return holiday.holiday_date;
    }).filter((dateStr) => dateStr.startsWith(String(year)));
  };

  return {
    holidays,
    isLoading,
    isHoliday,
    getHolidayInfo,
    getHolidayDatesForYear,
  };
}
