import { useState, useEffect, useCallback, useMemo } from "react";

const STATUS_FILTERS_KEY = "calendar_status_filters";
const TYPE_FILTERS_KEY = "calendar_type_filters";

export function useCalendarFilters() {
  const [activeStatusFilters, setActiveStatusFilters] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STATUS_FILTERS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(TYPE_FILTERS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save to localStorage when filters change
  useEffect(() => {
    localStorage.setItem(STATUS_FILTERS_KEY, JSON.stringify([...activeStatusFilters]));
  }, [activeStatusFilters]);

  useEffect(() => {
    localStorage.setItem(TYPE_FILTERS_KEY, JSON.stringify([...activeTypeFilters]));
  }, [activeTypeFilters]);

  const toggleStatusFilter = useCallback((statusId: string) => {
    setActiveStatusFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(statusId)) {
        newSet.delete(statusId);
      } else {
        newSet.add(statusId);
      }
      return newSet;
    });
  }, []);

  const toggleTypeFilter = useCallback((typeId: string) => {
    setActiveTypeFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) {
        newSet.delete(typeId);
      } else {
        newSet.add(typeId);
      }
      return newSet;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveStatusFilters(new Set());
    setActiveTypeFilters(new Set());
  }, []);

  const hasActiveFilters = useMemo(() => 
    activeStatusFilters.size > 0 || activeTypeFilters.size > 0,
    [activeStatusFilters, activeTypeFilters]
  );

  return {
    activeStatusFilters,
    activeTypeFilters,
    toggleStatusFilter,
    toggleTypeFilter,
    clearFilters,
    hasActiveFilters,
  };
}
