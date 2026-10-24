import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, X, ChevronRight, Sliders } from 'lucide-react';
import { ModelRecord, CheckpointRecord, ThresholdAlertSettings } from '../../types/eval.ts';

interface ThresholdAlertBannerProps {
  settings: ThresholdAlertSettings;
  models: ModelRecord[];
  checkpoints: CheckpointRecord[];
  onOpenSettings: () => void;
}

export const ThresholdAlertBanner: React.FC<ThresholdAlertBannerProps> = ({
  settings,
  models,
  checkpoints,
  onOpenSettings,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Find models violating thresholds
  const violatingModels = models.filter((m) => {
    return (
      m.winRate < settings.minWinRatePercent ||
      m.reasoningScore < settings.minReasoningScore ||
      m.latencyP95Ms > settings.maxLatencyP95Ms ||
      m.hallucinationRate > settings.maxHallucinationRatePercent
    );
  });

  if (isDismissed || violatingModels.length === 0) return null;

  const firstBreach = violatingModels[0];

  return (
    <div className="bg-amber-950/70 border-b border-amber-800/80 px-4 py-2 text-xs text-amber-200 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono overflow-x-auto py-0.5">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] shrink-0">
            Threshold Alert:
          </span>
          <span className="text-slate-200">
            <strong>{violatingModels.length} model(s)</strong> breached custom performance bounds. Primary breach:
          </span>
          <span className="text-white font-bold bg-amber-900/80 px-2 py-0.5 rounded border border-amber-700/60 shrink-0">
            {firstBreach.name}
          </span>
          <span className="text-amber-300 text-[11px] shrink-0">
            (Win Rate: {firstBreach.winRate}% vs {settings.minWinRatePercent}% target · P95: {firstBreach.latencyP95Ms}ms vs {settings.maxLatencyP95Ms}ms max)
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 font-semibold text-amber-300 hover:text-white bg-amber-900/60 hover:bg-amber-800/80 border border-amber-700/60 px-2.5 py-1 rounded transition-colors text-[11px]"
          >
            <Sliders className="h-3 w-3" />
            <span>Adjust Thresholds</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:text-white text-amber-400/80 transition-colors"
            title="Dismiss Alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
