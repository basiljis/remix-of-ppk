import { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { cn } from '@/lib/utils';

export const OfflineIndicator = () => {
  const { isOnline, wasOffline, resetWasOffline } = useOfflineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        resetWasOffline();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  // Don't show anything if online and never was offline
  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300",
        isOnline
          ? "bg-green-500 text-white"
          : "bg-destructive text-destructive-foreground"
      )}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Соединение восстановлено</span>
          <button 
            onClick={() => window.location.reload()}
            aria-label="Обновить страницу"
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Нет подключения к сети</span>
          <span className="text-xs opacity-80">Работа в офлайн-режиме</span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
