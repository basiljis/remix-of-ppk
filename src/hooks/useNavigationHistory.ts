import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const HISTORY_KEY = "navigation_history";
const MAX_HISTORY_LENGTH = 20;

export function useNavigationHistory() {
  const location = useLocation();
  const navigate = useNavigate();
  const isInitialized = useRef(false);

  // Save current path to history on location change
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }

    const history = getHistory();
    const currentPath = location.pathname + location.search;
    
    // Don't add duplicates or the same path
    if (history[history.length - 1] !== currentPath) {
      history.push(currentPath);
      
      // Keep only the last MAX_HISTORY_LENGTH entries
      if (history.length > MAX_HISTORY_LENGTH) {
        history.shift();
      }
      
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }, [location.pathname, location.search]);

  const getHistory = (): string[] => {
    try {
      const stored = sessionStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const goBack = (fallbackPath: string = "/app") => {
    const history = getHistory();
    
    if (history.length > 1) {
      // Remove current page from history
      history.pop();
      const previousPath = history.pop();
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      
      if (previousPath) {
        navigate(previousPath);
        return;
      }
    }
    
    // Fallback to provided path
    navigate(fallbackPath);
  };

  const getPreviousPath = (): string | null => {
    const history = getHistory();
    if (history.length > 1) {
      return history[history.length - 2];
    }
    return null;
  };

  return {
    goBack,
    getPreviousPath,
    getHistory,
  };
}
