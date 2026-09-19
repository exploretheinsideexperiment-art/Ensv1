import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showRestoredToast, setShowRestoredToast] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setHasBeenOffline(true);
      setShowRestoredToast(false);
    } else if (hasBeenOffline) {
      setShowRestoredToast(true);
      const timer = setTimeout(() => setShowRestoredToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline]);

  if (!isOnline) {
    return (
      <div
        id="ens-offline-badge"
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-emerald-950/90 border border-emerald-600/50 px-3.5 py-2 text-xs font-medium text-emerald-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 select-none"
      >
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <WifiOff className="h-4 w-4 text-emerald-400" />
        <div>
          <span className="font-bold text-white">Offline Mode Active</span>
          <span className="hidden sm:inline text-emerald-300 ml-1.5">• 100% Working Without Internet</span>
        </div>
      </div>
    );
  }

  if (showRestoredToast) {
    return (
      <div
        id="ens-online-toast"
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-sky-950/90 border border-sky-600/50 px-3.5 py-2 text-xs font-medium text-sky-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 select-none"
      >
        <CheckCircle2 className="h-4 w-4 text-sky-400" />
        <span className="font-semibold text-white">Internet Connected</span>
      </div>
    );
  }

  return null;
};
