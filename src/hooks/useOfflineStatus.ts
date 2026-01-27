import { useState, useEffect, useCallback } from 'react';

interface OfflineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
}

export const useOfflineStatus = () => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    lastOnlineAt: null,
  });

  const updateOnlineStatus = useCallback(() => {
    const isOnline = navigator.onLine;
    
    setStatus(prev => ({
      isOnline,
      wasOffline: !isOnline ? true : prev.wasOffline,
      lastOnlineAt: isOnline ? new Date() : prev.lastOnlineAt,
    }));
  }, []);

  const resetWasOffline = useCallback(() => {
    setStatus(prev => ({ ...prev, wasOffline: false }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [updateOnlineStatus]);

  return { ...status, resetWasOffline };
};
