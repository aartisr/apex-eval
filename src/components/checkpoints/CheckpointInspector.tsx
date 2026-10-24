import React, { useState } from 'react';
import {
  GitCommit,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  HardDrive,
} from 'lucide-react';
import { CheckpointRecord, QuantizationType } from '../../types/eval.ts';
import { QuantizationTradeoffScatter } from './QuantizationTradeoffScatter.tsx';

interface CheckpointInspectorProps {
  checkpoints: CheckpointRecord[];
  searchQuery?: string;
  selectedCheckpointIdOverride?: string;
}

export const CheckpointInspector: React.FC<CheckpointInspectorProps> = ({
  checkpoints,
  searchQuery,
  selectedCheckpointIdOverride,
}) => {
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string>(
    selectedCheckpointIdOverride || checkpoints[checkpoints.length - 1]?.id || 'cp-5'
  );

  // Update selected if override passed
  React.useEffect(() => {
    if (selectedCheckpointIdOverride) {
      setSelectedCheckpointId(selectedCheckpointIdOverride);
    }
  }, [selectedCheckpointIdOverride]);

  const filteredCheckpoints = React.useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return checkpoints;
    const q = searchQuery.toLowerCase();
    const matched = checkpoints.filter(
      (cp) =>
        cp.modelName.toLowerCase().includes(q) ||
        cp.alignmentMethod.toLowerCase().includes(q) ||
        cp.quantization.toLowerCase().includes(q) ||
        cp.notes.toLowerCase().includes(q)
    );
    return matched.length > 0 ? matched : checkpoints;
  }, [checkpoints, searchQuery]);

  const selectedCheckpoint =
    filteredCheckpoints.find((c) => c.id === selectedCheckpointId) ||
    filteredCheckpoints[filteredCheckpoints.length - 1] ||
    checkpoints[0];

  // Base checkpoint for delta calculations
  const baseCheckpoint = checkpoints[0];

  return (
    <div className="space-y-6">
      {/* Title & Domain Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display">
            Fine-Tuning Checkpoint Progression & Alignment
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Track loss convergence, alignment shifts (SFT vs. DPO), and quantization efficiency curves across training steps
            for small language models (Gemma-2-2B Fine-Tuning Run).
          </p>
        </div>

        {/* Quantization Metric Tag */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Max Compression</span>
            <span className="text-emerald-400 font-bold font-mono">1.8 GB VRAM (Q4_K_M)</span>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Accuracy Retention</span>
            <span className="text-indigo-300 font-bold font-mono">98.9% of FP16</span>
          </div>
        </div>
      </div>

      {/* Checkpoint Progression Stepper */}
      <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Training Epoch Pipeline
          </span>
          <span className="text-xs text-slate-400">
            Select checkpoint to inspect parameter delta
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {filteredCheckpoints.map((cp, idx) => {
            const isSelected = cp.id === selectedCheckpointId;
            return (
              <button
                key={cp.id}
                onClick={() => setSelectedCheckpointId(cp.id)}
                className={`flex flex-col p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-mono text-slate-400">
                    Step {cp.step}
                  </span>
                  <span
                    className={`text-[9px] uppercase font-mono px-1 rounded ${
                      cp.alignmentMethod === 'dpo'
                        ? 'text-indigo-400 bg-indigo-950'
                        : 'text-slate-400 bg-slate-900'
                    }`}
                  >
                    {cp.quantization}
                  </span>
                </div>

                <span className="text-xs font-bold text-white mt-1.5 line-clamp-1">
                  Epoch {cp.epoch} ({cp.alignmentMethod.toUpperCase()})
                </span>

                <div className="mt-3 flex items-center justify-between text-[11px] tabular-nums border-t border-slate-800/80 pt-2 text-slate-400">
                  <span>Win Rate:</span>
                  <span className="font-semibold text-slate-200">{cp.winRate}%</span>
                </div>

                <div className="flex items-center justify-between text-[11px] tabular-nums text-slate-500">
                  <span>Loss:</span>
                  <span className="font-mono">{cp.trainLoss.toFixed(2)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Checkpoint Detailed Deep Dive */}
      {selectedCheckpoint && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Inspection Card */}
          <div className="lg:col-span-2 rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white font-display">
                  {selectedCheckpoint.modelName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Alignment Method: <strong className="text-indigo-300 uppercase font-mono">{selectedCheckpoint.alignmentMethod}</strong> · Format: <strong className="text-emerald-400 uppercase font-mono">{selectedCheckpoint.quantization}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Training Step:</span>
                <span className="font-mono text-xs font-semibold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {selectedCheckpoint.step.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Metrics Compared to Base Weights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Win Rate vs Base</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-bold text-emerald-400 tabular-nums">
                    {selectedCheckpoint.winRate}%
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    +{((selectedCheckpoint.winRate - baseCheckpoint.winRate)).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Reasoning Depth</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-bold text-slate-100 tabular-nums">
                    {selectedCheckpoint.reasoningScore}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    +{(selectedCheckpoint.reasoningScore - baseCheckpoint.reasoningScore).toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Train Loss</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-bold text-indigo-400 tabular-nums font-mono">
                    {selectedCheckpoint.trainLoss.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-indigo-300 font-mono">
                    (val: {selectedCheckpoint.valLoss.toFixed(2)})
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400">VRAM Footprint</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-bold text-slate-100 tabular-nums font-mono">
                    {selectedCheckpoint.memoryGB} GB
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    -{(((baseCheckpoint.memoryGB - selectedCheckpoint.memoryGB) / baseCheckpoint.memoryGB) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Checkpoint Notes & Rationale */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs space-y-1">
              <span className="font-semibold text-slate-300">Engineering Rationale & Observations:</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {selectedCheckpoint.notes}
              </p>
            </div>
          </div>

          {/* Quantization Tradeoff Analysis */}
          <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
            <div className="pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white font-display">
                Quantization ROI Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Impact of 4-bit and 8-bit quantization on SLM deployment viability.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>FP16 (Base Full Precision):</span>
                  <span className="font-mono text-slate-400">5.2 GB · 100% Acc</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-500 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Q8 (8-bit Quantized):</span>
                  <span className="font-mono text-emerald-400">2.8 GB · 99.4% Acc</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '54%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Q4_K_M (4-bit Production Edge):</span>
                  <span className="font-mono text-emerald-400">1.8 GB · 98.9% Acc</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '35%' }} />
                </div>
              </div>
            </div>

            <div className="p-3 rounded bg-indigo-950/30 border border-indigo-900/50 text-[11px] text-indigo-300 leading-relaxed">
              <strong>Recommendation:</strong> Deploying the <strong>Q4_K_M</strong> quantized checkpoint yields a 65% memory reduction, allowing real-time 285 tok/s local inference on commodity consumer GPUs or mobile NPUs without sacrificing mathematical reasoning fidelity.
            </div>
          </div>
        </div>
      )}

      {/* Quantization Multi-Parametric Trade-off Scatter Matrix */}
      <QuantizationTradeoffScatter searchQuery={searchQuery} />
    </div>
  );
};
