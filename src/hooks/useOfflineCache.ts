import { useCallback, useEffect } from 'react';

const CACHE_PREFIX = 'offline_cache_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export const useOfflineCache = () => {
  // Save data to cache
  const cacheData = useCallback(<T>(key: string, data: T, expiryMs = CACHE_EXPIRY_MS) => {
    try {
      const cacheEntry: CachedData<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + expiryMs,
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheEntry));
      return true;
    } catch (error) {
      console.warn('Failed to cache data:', error);
      return false;
    }
  }, []);

  // Get data from cache
  const getCachedData = useCallback(<T>(key: string): T | null => {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheEntry: CachedData<T> = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() > cacheEntry.expiresAt) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }, []);

  // Check if cache exists and is valid
  const hasCachedData = useCallback((key: string): boolean => {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return false;

      const cacheEntry = JSON.parse(cached);
      return Date.now() <= cacheEntry.expiresAt;
    } catch {
      return false;
    }
  }, []);

  // Clear specific cache
  const clearCache = useCallback((key: string) => {
    localStorage.removeItem(CACHE_PREFIX + key);
  }, []);

  // Clear all offline caches
  const clearAllCaches = useCallback(() => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

  // Get cache age in minutes
  const getCacheAge = useCallback((key: string): number | null => {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      return Math.round((Date.now() - cacheEntry.timestamp) / 60000);
    } catch {
      return null;
    }
  }, []);

  // Cleanup expired caches on mount
  useEffect(() => {
    const cleanupExpiredCaches = () => {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const cacheEntry = JSON.parse(cached);
              if (Date.now() > cacheEntry.expiresAt) {
                keysToRemove.push(key);
              }
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    };

    cleanupExpiredCaches();
  }, []);

  return {
    cacheData,
    getCachedData,
    hasCachedData,
    clearCache,
    clearAllCaches,
    getCacheAge,
  };
};
