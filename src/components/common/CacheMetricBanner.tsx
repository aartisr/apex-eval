import React from 'react';
import { Database, Zap, Clock, Trash2, ShieldCheck } from 'lucide-react';
import { RedisCacheStats } from '../../types/eval.ts';

interface CacheMetricBannerProps {
  stats: RedisCacheStats | null;
  onClearCache: () => void;
  isClearing: boolean;
}

export const CacheMetricBanner: React.FC<CacheMetricBannerProps> = ({
  stats,
  onClearCache,
  isClearing,
}) => {
  if (!stats) return null;

  return (
    <div className="border-b border-slate-800 bg-[#0E1526]/80 px-4 py-2 text-xs">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
        {/* Unboxed metadata row with typographic separators */}
        <div className="flex flex-wrap items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span>Redis Cache Engine</span>
          </div>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <div className="flex items-center gap-1 tabular-nums">
            <span className="text-slate-500">Hit Ratio:</span>
            <span className="font-semibold text-emerald-400">{stats.hitRatioPercent}%</span>
            <span className="text-slate-500">({stats.hitCount} hits / {stats.missCount} misses)</span>
          </div>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <div className="flex items-center gap-1 tabular-nums">
            <Clock className="h-3 w-3 text-amber-400" />
            <span className="text-slate-500">Avg Latency Saved:</span>
            <span className="font-semibold text-slate-200">~{stats.avgLatencySavedMs}ms / req</span>
          </div>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <div className="flex items-center gap-1 tabular-nums">
            <Zap className="h-3 w-3 text-indigo-400" />
            <span className="text-slate-500">Active Keys:</span>
            <span className="font-semibold text-slate-200">{stats.keysCount}</span>
          </div>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <div className="flex items-center gap-1 tabular-nums text-slate-500">
            <span>Buffer:</span>
            <span>{Math.round(stats.memoryBytes / 1024)} KB</span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClearCache}
            disabled={isClearing}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Purge cached prompt evaluations to measure cold-start latency"
          >
            <Trash2 className="h-3 w-3" />
            <span>{isClearing ? 'Flushing...' : 'Flush Cache'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
