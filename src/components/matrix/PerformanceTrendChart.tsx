import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Sparkles, ChevronDown, ChevronUp, Layers, Info } from 'lucide-react';

export type MetricKey = 'winRate' | 'reasoning' | 'gsm8k' | 'mmlu';

interface PerformanceTrendChartProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const TREND_DATA_BY_METRIC: Record<
  MetricKey,
  {
    name: string;
    unit: string;
    yDomain: [number, number];
    points: {
      stage: string;
      step: string;
      date: string;
      geminiFlash: number;
      geminiArgon: number;
      gemmaFineTuned: number;
      gemmaBase: number;
      llamaFineTuned: number;
      llamaBase: number;
    }[];
  }
> = {
  winRate: {
    name: 'Win Rate (%)',
    unit: '%',
    yDomain: [50, 100],
    points: [
      { stage: 'Pre-train', step: '0', date: 'Oct 01', geminiFlash: 94.6, geminiArgon: 98.4, gemmaFineTuned: 64.2, gemmaBase: 64.2, llamaFineTuned: 72.8, llamaBase: 72.8 },
      { stage: 'SFT E1', step: '2.5k', date: 'Oct 06', geminiFlash: 94.6, geminiArgon: 98.4, gemmaFineTuned: 72.5, gemmaBase: 64.2, llamaFineTuned: 78.4, llamaBase: 72.8 },
      { stage: 'SFT E2', step: '5k', date: 'Oct 11', geminiFlash: 94.6, geminiArgon: 98.4, gemmaFineTuned: 79.1, gemmaBase: 64.2, llamaFineTuned: 83.2, llamaBase: 72.8 },
      { stage: 'DPO Beta', step: '7.5k', date: 'Oct 16', geminiFlash: 94.6, geminiArgon: 98.4, gemmaFineTuned: 86.4, gemmaBase: 64.2, llamaFineTuned: 88.0, llamaBase: 72.8 },
      { stage: 'DPO Q8', step: '10k', date: 'Oct 20', geminiFlash: 94.6, geminiArgon: 98.4, gemmaFineTuned: 88.0, gemmaBase: 64.2, llamaFineTuned: 90.6, llamaBase: 72.8 },
      { stage: 'Prod Q4', step: '12.5k', date: 'Oct 24', geminiFlash: 94.6, geminiArgon: 98.4, gemmaFineTuned: 88.6, gemmaBase: 64.2, llamaFineTuned: 91.5, llamaBase: 72.8 },
    ],
  },
  reasoning: {
    name: 'Reasoning Score (0-100)',
    unit: 'pts',
    yDomain: [45, 100],
    points: [
      { stage: 'Pre-train', step: '0', date: 'Oct 01', geminiFlash: 92.4, geminiArgon: 97.8, gemmaFineTuned: 58.0, gemmaBase: 58.0, llamaFineTuned: 71.4, llamaBase: 71.4 },
      { stage: 'SFT E1', step: '2.5k', date: 'Oct 06', geminiFlash: 92.4, geminiArgon: 97.8, gemmaFineTuned: 69.4, gemmaBase: 58.0, llamaFineTuned: 77.2, llamaBase: 71.4 },
      { stage: 'SFT E2', step: '5k', date: 'Oct 11', geminiFlash: 92.4, geminiArgon: 97.8, gemmaFineTuned: 78.0, gemmaBase: 58.0, llamaFineTuned: 82.5, llamaBase: 71.4 },
      { stage: 'DPO Beta', step: '7.5k', date: 'Oct 16', geminiFlash: 92.4, geminiArgon: 97.8, gemmaFineTuned: 87.5, gemmaBase: 58.0, llamaFineTuned: 87.1, llamaBase: 71.4 },
      { stage: 'DPO Q8', step: '10k', date: 'Oct 20', geminiFlash: 92.4, geminiArgon: 97.8, gemmaFineTuned: 89.0, gemmaBase: 58.0, llamaFineTuned: 89.8, llamaBase: 71.4 },
      { stage: 'Prod Q4', step: '12.5k', date: 'Oct 24', geminiFlash: 92.4, geminiArgon: 97.8, gemmaFineTuned: 89.2, gemmaBase: 58.0, llamaFineTuned: 90.4, llamaBase: 71.4 },
    ],
  },
  gsm8k: {
    name: 'GSM8k Math Derivation (%)',
    unit: '%',
    yDomain: [35, 100],
    points: [
      { stage: 'Pre-train', step: '0', date: 'Oct 01', geminiFlash: 93.8, geminiArgon: 97.4, gemmaFineTuned: 44.5, gemmaBase: 44.5, llamaFineTuned: 61.2, llamaBase: 61.2 },
      { stage: 'SFT E1', step: '2.5k', date: 'Oct 06', geminiFlash: 93.8, geminiArgon: 97.4, gemmaFineTuned: 61.2, gemmaBase: 44.5, llamaFineTuned: 70.4, llamaBase: 61.2 },
      { stage: 'SFT E2', step: '5k', date: 'Oct 11', geminiFlash: 93.8, geminiArgon: 97.4, gemmaFineTuned: 74.8, gemmaBase: 44.5, llamaFineTuned: 79.0, llamaBase: 61.2 },
      { stage: 'DPO Beta', step: '7.5k', date: 'Oct 16', geminiFlash: 93.8, geminiArgon: 97.4, gemmaFineTuned: 83.0, gemmaBase: 44.5, llamaFineTuned: 84.5, llamaBase: 61.2 },
      { stage: 'DPO Q8', step: '10k', date: 'Oct 20', geminiFlash: 93.8, geminiArgon: 97.4, gemmaFineTuned: 85.2, gemmaBase: 44.5, llamaFineTuned: 87.4, llamaBase: 61.2 },
      { stage: 'Prod Q4', step: '12.5k', date: 'Oct 24', geminiFlash: 93.8, geminiArgon: 97.4, gemmaFineTuned: 85.6, gemmaBase: 44.5, llamaFineTuned: 88.2, llamaBase: 61.2 },
    ],
  },
  mmlu: {
    name: 'MMLU-Pro Benchmark (%)',
    unit: '%',
    yDomain: [50, 100],
    points: [
      { stage: 'Pre-train', step: '0', date: 'Oct 01', geminiFlash: 91.2, geminiArgon: 96.1, gemmaFineTuned: 56.8, gemmaBase: 56.8, llamaFineTuned: 69.4, llamaBase: 69.4 },
      { stage: 'SFT E1', step: '2.5k', date: 'Oct 06', geminiFlash: 91.2, geminiArgon: 96.1, gemmaFineTuned: 64.5, gemmaBase: 56.8, llamaFineTuned: 73.8, llamaBase: 69.4 },
      { stage: 'SFT E2', step: '5k', date: 'Oct 11', geminiFlash: 91.2, geminiArgon: 96.1, gemmaFineTuned: 71.0, gemmaBase: 56.8, llamaFineTuned: 77.2, llamaBase: 69.4 },
      { stage: 'DPO Beta', step: '7.5k', date: 'Oct 16', geminiFlash: 91.2, geminiArgon: 96.1, gemmaFineTuned: 76.8, gemmaBase: 56.8, llamaFineTuned: 80.5, llamaBase: 69.4 },
      { stage: 'DPO Q8', step: '10k', date: 'Oct 20', geminiFlash: 91.2, geminiArgon: 96.1, gemmaFineTuned: 78.0, gemmaBase: 56.8, llamaFineTuned: 81.9, llamaBase: 69.4 },
      { stage: 'Prod Q4', step: '12.5k', date: 'Oct 24', geminiFlash: 91.2, geminiArgon: 96.1, gemmaFineTuned: 78.2, gemmaBase: 56.8, llamaFineTuned: 82.5, llamaBase: 69.4 },
    ],
  },
};

// Custom Tooltip adhering to anti-slop clean design
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/95 p-3 shadow-xl backdrop-blur-md text-xs font-sans min-w-[200px]">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
        <span className="font-semibold text-white">{label}</span>
        <span className="font-mono text-[11px] text-slate-500">
          Step {payload[0]?.payload?.step} · {payload[0]?.payload?.date}
        </span>
      </div>

      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-0.5 rounded-full inline-block"
                style={{ backgroundColor: entry.stroke }}
              />
              <span className="text-slate-300 font-medium">{entry.name}:</span>
            </div>
            <span className="font-mono font-semibold text-white tabular-nums">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({
  isVisible,
  onToggleVisibility,
}) => {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('winRate');
  const [visibleSeries, setVisibleSeries] = useState({
    geminiFlash: true,
    geminiArgon: true,
    gemmaFineTuned: true,
    gemmaBase: true,
    llamaFineTuned: true,
    llamaBase: false,
  });

  const currentConfig = TREND_DATA_BY_METRIC[activeMetric];

  const toggleSeries = (key: keyof typeof visibleSeries) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0E1526] transition-all">
      {/* Collapsible Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-display">
                Checkpoint Evolution & Model Trajectory Graph
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                Recharts Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Visualize performance divergence across fine-tuning epochs and quantization steps vs. frontier LLM baselines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs">
            {(
              [
                { key: 'winRate', label: 'Win Rate' },
                { key: 'reasoning', label: 'Reasoning' },
                { key: 'gsm8k', label: 'GSM8k (Math)' },
                { key: 'mmlu', label: 'MMLU-Pro' },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                onClick={() => setActiveMetric(m.key)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeMetric === m.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={onToggleVisibility}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            {isVisible ? (
              <>
                <span>Hide Chart</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Show Chart</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chart Viewport */}
      {isVisible && (
        <div className="p-4 space-y-4">
          {/* Series Toggle Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 text-[11px] font-medium mr-1">Series:</span>

              {/* Gemma Fine-Tuned (SLM) */}
              <button
                onClick={() => toggleSeries('gemmaFineTuned')}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium transition-all ${
                  visibleSeries.gemmaFineTuned
                    ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Gemma 2 2B (Fine-Tuned Run)</span>
              </button>

              {/* Gemma Base (SLM) */}
              <button
                onClick={() => toggleSeries('gemmaBase')}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium transition-all ${
                  visibleSeries.gemmaBase
                    ? 'border-slate-600 bg-slate-900 text-slate-300'
                    : 'border-slate-800 bg-slate-950 text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Gemma 2 2B (Base Unaligned)</span>
              </button>

              {/* Llama 3 8B Fine-Tuned */}
              <button
                onClick={() => toggleSeries('llamaFineTuned')}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium transition-all ${
                  visibleSeries.llamaFineTuned
                    ? 'border-indigo-500/80 bg-indigo-950/40 text-indigo-300'
                    : 'border-slate-800 bg-slate-950 text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Llama 3.1 8B (Enterprise DPO)</span>
              </button>

              {/* Gemini Flash (Frontier Baseline) */}
              <button
                onClick={() => toggleSeries('geminiFlash')}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium transition-all ${
                  visibleSeries.geminiFlash
                    ? 'border-amber-500/80 bg-amber-950/40 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Gemini 3.8 Flash (Frontier Baseline)</span>
              </button>

              {/* Gemini 4 Argon */}
              <button
                onClick={() => toggleSeries('geminiArgon')}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium transition-all ${
                  visibleSeries.geminiArgon
                    ? 'border-rose-500/80 bg-rose-950/40 text-rose-300'
                    : 'border-slate-800 bg-slate-950 text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Gemini 4 Argon (Pro Standard)</span>
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400 tabular-nums">
              <span className="text-slate-500">Fine-Tuning Delta:</span>
              <strong className="text-emerald-400">
                +{(
                  currentConfig.points[currentConfig.points.length - 1].gemmaFineTuned -
                  currentConfig.points[0].gemmaBase
                ).toFixed(1)}{' '}
                {currentConfig.unit}
              </strong>
            </div>
          </div>

          {/* Responsive Recharts Container */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={currentConfig.points}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E293B"
                  vertical={false}
                />
                <XAxis
                  dataKey="stage"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  domain={currentConfig.yDomain}
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `${val}${currentConfig.unit === '%' ? '%' : ''}`}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Gemini 4 Argon Pro Ceiling (Dashed) */}
                {visibleSeries.geminiArgon && (
                  <Line
                    type="monotone"
                    dataKey="geminiArgon"
                    name="Gemini 4 Argon"
                    stroke="#F43F5E"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}

                {/* Gemini 3.8 Flash Frontier Baseline (Dashed) */}
                {visibleSeries.geminiFlash && (
                  <Line
                    type="monotone"
                    dataKey="geminiFlash"
                    name="Gemini 3.8 Flash"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}

                {/* Gemma Base Plateau Line (Dotted) */}
                {visibleSeries.gemmaBase && (
                  <Line
                    type="stepAfter"
                    dataKey="gemmaBase"
                    name="Gemma 2 2B (Base)"
                    stroke="#64748B"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                )}

                {/* Gemma Fine-Tuned Checkpoint Progression (Primary Active Line) */}
                {visibleSeries.gemmaFineTuned && (
                  <Line
                    type="monotone"
                    dataKey="gemmaFineTuned"
                    name="Gemma 2 2B (Fine-Tuned Run)"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 4, strokeWidth: 1.5, stroke: '#0B0F19' }}
                    activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#FFFFFF' }}
                  />
                )}

                {/* Llama 3 8B Fine-Tuned Progression */}
                {visibleSeries.llamaFineTuned && (
                  <Line
                    type="monotone"
                    dataKey="llamaFineTuned"
                    name="Llama 3.1 8B (DPO)"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366F1', r: 3.5, strokeWidth: 1.5, stroke: '#0B0F19' }}
                    activeDot={{ r: 5, stroke: '#6366F1', strokeWidth: 2, fill: '#FFFFFF' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Analytical Footnote */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <Info className="h-3 w-3 text-indigo-400" />
              <span>
                <strong>Observation:</strong> DPO alignment at Step 7.5k yields the sharpest inflection point (+7.3% gain), with 4-bit quantization (Step 12.5k) holding steady within 0.6% of FP16 peak.
              </span>
            </span>
            <span className="font-mono text-slate-400">
              Training Epochs 0 → 5 (12,500 Steps)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
