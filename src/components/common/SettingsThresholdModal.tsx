import React, { useState } from 'react';
import {
  X,
  Sliders,
  Bell,
  AlertTriangle,
  ShieldAlert,
  Save,
  Check,
  RotateCcw,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { ModelRecord, CheckpointRecord, ThresholdAlertSettings } from '../../types/eval.ts';
import { db } from '../../lib/firebase.ts';
import { doc, setDoc } from 'firebase/firestore';

interface SettingsThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ThresholdAlertSettings;
  onUpdateSettings: (newSettings: ThresholdAlertSettings) => void;
  models: ModelRecord[];
  checkpoints: CheckpointRecord[];
}

export const SettingsThresholdModal: React.FC<SettingsThresholdModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  models,
  checkpoints,
}) => {
  const [localSettings, setLocalSettings] = useState<ThresholdAlertSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  // Calculate active model violations under local settings
  const modelViolations = models.filter((m) => {
    return (
      m.winRate < localSettings.minWinRatePercent ||
      m.reasoningScore < localSettings.minReasoningScore ||
      m.latencyP95Ms > localSettings.maxLatencyP95Ms ||
      m.hallucinationRate > localSettings.maxHallucinationRatePercent
    );
  });

  const handleSave = async () => {
    setIsSaving(true);
    onUpdateSettings(localSettings);

    try {
      await setDoc(
        doc(db, 'settings', 'threshold_alerts'),
        {
          ...localSettings,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.warn('Firestore settings save error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    const defaults: ThresholdAlertSettings = {
      minWinRatePercent: 80.0,
      minReasoningScore: 75.0,
      maxPsiDrift: 0.15,
      maxLossGap: 0.30,
      maxLatencyP95Ms: 250,
      maxHallucinationRatePercent: 5.0,
      enableEmailAlerts: true,
    };
    setLocalSettings(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-slate-800 bg-[#0E1526] shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Performance Threshold & Governance Alert Settings
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Define acceptable quality bounds, drift limits, and SLA targets to trigger real-time model health warnings.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Threshold Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Rule 1: Min Win Rate */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Minimum Pairwise Win Rate (%)</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">
                  {localSettings.minWinRatePercent.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="0.5"
                value={localSettings.minWinRatePercent}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, minWinRatePercent: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Triggers alert if arena win rate falls below threshold.</span>
            </div>

            {/* Rule 2: Min Reasoning Score */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Minimum Reasoning Score</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">
                  {localSettings.minReasoningScore.toFixed(1)} / 100
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="1"
                value={localSettings.minReasoningScore}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, minReasoningScore: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Evaluates multi-step mathematical & logical derivation score.</span>
            </div>

            {/* Rule 3: Max PSI Data Drift */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Maximum PSI Data Drift</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {localSettings.maxPsiDrift.toFixed(2)} PSI
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.40"
                step="0.01"
                value={localSettings.maxPsiDrift}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, maxPsiDrift: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Population Stability Index limit (&gt;0.10 moderate, &gt;0.25 critical).</span>
            </div>

            {/* Rule 4: Max Loss Gap */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Max Overfitting Loss Gap ($\Delta$ Loss)</span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  +{localSettings.maxLossGap.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.02"
                value={localSettings.maxLossGap}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, maxLossGap: parseFloat(e.target.value) })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Divergence between validation loss and training loss.</span>
            </div>

            {/* Rule 5: Max P95 Latency */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Maximum P95 Latency SLA</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">
                  {localSettings.maxLatencyP95Ms} ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={localSettings.maxLatencyP95Ms}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, maxLatencyP95Ms: parseInt(e.target.value) })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Maximum 95th percentile response latency permitted.</span>
            </div>

            {/* Rule 6: Max Hallucination Rate */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Max Permitted Hallucination Rate</span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {localSettings.maxHallucinationRatePercent.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="15.0"
                step="0.5"
                value={localSettings.maxHallucinationRatePercent}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    maxHallucinationRatePercent: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">Counterfactual or ungrounded entity generation ceiling.</span>
            </div>
          </div>

          {/* Real-Time Live Violations Preview */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                Live Threshold Violations Simulation ({modelViolations.length} models breached)
              </span>
              <span className="text-[10px] text-slate-500">Updates live as you adjust threshold sliders above</span>
            </div>

            {modelViolations.length === 0 ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded text-emerald-400 font-mono text-[11px] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>All evaluated models and checkpoints satisfy your current performance thresholds!</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {modelViolations.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded bg-slate-900 border border-amber-900/40 flex items-center justify-between font-mono text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="font-bold text-white">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      {m.winRate < localSettings.minWinRatePercent && (
                        <span className="text-amber-400">Win Rate: {m.winRate}% (&lt;{localSettings.minWinRatePercent}%)</span>
                      )}
                      {m.latencyP95Ms > localSettings.maxLatencyP95Ms && (
                        <span className="text-rose-400">P95: {m.latencyP95Ms}ms (&gt;{localSettings.maxLatencyP95Ms}ms)</span>
                      )}
                      {m.hallucinationRate > localSettings.maxHallucinationRatePercent && (
                        <span className="text-rose-400">Hallucination: {m.hallucinationRate}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-[#0B0F19]">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {isSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              <span>{isSaving ? 'Saving...' : isSaved ? 'Saved to Firestore!' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
