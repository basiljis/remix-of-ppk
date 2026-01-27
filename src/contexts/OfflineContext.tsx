import React, { createContext, useContext, ReactNode } from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useOfflineCache } from '@/hooks/useOfflineCache';

interface OfflineContextType {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  resetWasOffline: () => void;
  cacheData: <T>(key: string, data: T, expiryMs?: number) => boolean;
  getCachedData: <T>(key: string) => T | null;
  hasCachedData: (key: string) => boolean;
  clearCache: (key: string) => void;
  clearAllCaches: () => void;
  getCacheAge: (key: string) => number | null;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider = ({ children }: OfflineProviderProps) => {
  const offlineStatus = useOfflineStatus();
  const offlineCache = useOfflineCache();

  const value: OfflineContextType = {
    ...offlineStatus,
    ...offlineCache,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
