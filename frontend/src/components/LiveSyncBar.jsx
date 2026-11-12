import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export function LiveSyncBar({
  autoSync,
  onToggleAutoSync,
  onRefresh,
  lastSyncedAt,
  syncing = false,
  intervalMs = 15000
}) {
  useEffect(() => {
    if (!autoSync || !onRefresh) return undefined;
    const timer = setInterval(() => {
      onRefresh(true);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoSync, onRefresh, intervalMs]);

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
          <span className="relative flex h-2 w-2">
            {autoSync && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                autoSync ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          </span>
          {autoSync ? 'Live Auto-Sync Active (15s)' : 'Auto-Sync Paused'}
        </span>
        {lastSyncedAt && (
          <span className="text-slate-500 hidden sm:inline">
            • Updated {new Date(lastSyncedAt).toLocaleTimeString('en-IN')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleAutoSync}
          className={`px-2.5 py-1 rounded-lg font-semibold border transition ${
            autoSync
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
        >
          {autoSync ? 'Live: ON' : 'Live: OFF'}
        </button>
        <button
          type="button"
          onClick={() => onRefresh?.(false)}
          disabled={syncing}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold transition"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>
  );
}
