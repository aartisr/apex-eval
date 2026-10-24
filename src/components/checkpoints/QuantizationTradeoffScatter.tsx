import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Sliders, Zap, HardDrive, AlertTriangle, Sparkles, Filter } from 'lucide-react';

export type ScatterMode = 'vram_vs_latency' | 'bits_vs_reasoning' | 'vram_vs_throughput';

export interface QuantPoint {
  modelName: string;
  family: 'Gemma' | 'Llama' | 'Phi';
  format: string;
  bits: number;
  vramGB: number;
  latencyMs: number;
  tokensPerSec: number;
  reasoningScore: number;
  memorySavingsPercent: number;
  accuracyRetention: number;
  isParetoOptimal: boolean;
  isQualityCliff: boolean;
}

const QUANT_SCATTER_DATA: QuantPoint[] = [
  // Gemma 2 2B Checkpoints
  {
    modelName: 'Gemma 2 2B',
    family: 'Gemma',
    format: 'FP16',
    bits: 16.0,
    vramGB: 5.2,
    latencyMs: 68,
    tokensPerSec: 195,
    reasoningScore: 89.2,
    memorySavingsPercent: 0,
    accuracyRetention: 100,
    isParetoOptimal: false,
    isQualityCliff: false,
  },
  {
    modelName: 'Gemma 2 2B',
    family: 'Gemma',
    format: 'Q8_0',
    bits: 8.5,
    vramGB: 2.8,
    latencyMs: 52,
    tokensPerSec: 240,
    reasoningScore: 89.0,
    memorySavingsPercent: 46.2,
    accuracyRetention: 99.8,
    isParetoOptimal: true,
    isQualityCliff: false,
  },
  {
    modelName: 'Gemma 2 2B',
    family: 'Gemma',
    format: 'Q6_K',
    bits: 6.6,
    vramGB: 2.2,
    latencyMs: 44,
    tokensPerSec: 260,
    reasoningScore: 88.8,
    memorySavingsPercent: 57.7,
    accuracyRetention: 99.5,
    isParetoOptimal: true,
    isQualityCliff: false,
  },
  {
    modelName: 'Gemma 2 2B',
    family: 'Gemma',
    format: 'Q4_K_M',
    bits: 4.5,
    vramGB: 1.8,
    latencyMs: 38,
    tokensPerSec: 285,
    reasoningScore: 88.6,
    memorySavingsPercent: 65.4,
    accuracyRetention: 98.9,
    isParetoOptimal: true,
    isQualityCliff: false,
  },
  {
    modelName: 'Gemma 2 2B',
    family: 'Gemma',
    format: 'IQ3_M',
    bits: 3.3,
    vramGB: 1.4,
    latencyMs: 35,
    tokensPerSec: 305,
    reasoningScore: 84.1,
    memorySavingsPercent: 73.1,
    accuracyRetention: 94.3,
    isParetoOptimal: false,
    isQualityCliff: true,
  },
  {
    modelName: 'Gemma 2 2B',
    family: 'Gemma',
    format: 'INT2',
    bits: 2.2,
    vramGB: 1.0,
    latencyMs: 32,
    tokensPerSec: 320,
    reasoningScore: 62.4,
    memorySavingsPercent: 80.8,
    accuracyRetention: 69.9,
    isParetoOptimal: false,
    isQualityCliff: true,
  },

  // Llama 3.1 8B Checkpoints
  {
    modelName: 'Llama 3.1 8B',
    family: 'Llama',
    format: 'FP16',
    bits: 16.0,
    vramGB: 16.0,
    latencyMs: 110,
    tokensPerSec: 115,
    reasoningScore: 91.5,
    memorySavingsPercent: 0,
    accuracyRetention: 100,
    isParetoOptimal: false,
    isQualityCliff: false,
  },
  {
    modelName: 'Llama 3.1 8B',
    family: 'Llama',
    format: 'Q8_0',
    bits: 8.5,
    vramGB: 8.6,
    latencyMs: 84,
    tokensPerSec: 142,
    reasoningScore: 91.2,
    memorySavingsPercent: 46.2,
    accuracyRetention: 99.7,
    isParetoOptimal: true,
    isQualityCliff: false,
  },
  {
    modelName: 'Llama 3.1 8B',
    family: 'Llama',
    format: 'Q5_K_M',
    bits: 5.5,
    vramGB: 5.8,
    latencyMs: 72,
    tokensPerSec: 164,
    reasoningScore: 90.9,
    memorySavingsPercent: 63.8,
    accuracyRetention: 99.3,
    isParetoOptimal: true,
    isQualityCliff: false,
  },
  {
    modelName: 'Llama 3.1 8B',
    family: 'Llama',
    format: 'Q4_K_M',
    bits: 4.5,
    vramGB: 4.8,
    latencyMs: 64,
    tokensPerSec: 180,
    reasoningScore: 90.4,
    memorySavingsPercent: 70.0,
    accuracyRetention: 98.8,
    isParetoOptimal: true,
    isQualityCliff: false,
  },
  {
    modelName: 'Llama 3.1 8B',
    family: 'Llama',
    format: 'IQ3_XXS',
    bits: 3.1,
    vramGB: 3.7,
    latencyMs: 59,
    tokensPerSec: 195,
    reasoningScore: 83.0,
    memorySavingsPercent: 76.9,
    accuracyRetention: 90.7,
    isParetoOptimal: false,
    isQualityCliff: true,
  },

  // Phi-3 Mini 3.8B Checkpoints
  {
    modelName: 'Phi-3 Mini 3.8B',
    family: 'Phi',
    format: 'FP16',
    bits: 16.0,
    vramGB: 7.6,
    latencyMs: 82,
    tokensPerSec: 145,
    reasoningScore: 91.0,
    memorySavingsPercent: 0,
    accuracyRetention: 100,
    isParetoOptimal: false,
    isQualityCliff: false,
  },
  {
    modelName: 'Phi-3 Mini 3.8B',
    family: 'Phi',
    format: 'Q8_0',
    bits: 8.5,
    vramGB: 4.1,
    latencyMs: 52,
    tokensPerSec: 175,
    reasoningScore: 90.6,
    memorySavingsPercent: 46.0,
    accuracyRetention: 99.5,
    isParetoOptimal: true,
    isQualityCliff: false,
  },
  {
    modelName: 'Phi-3 Mini 3.8B',
    family: 'Phi',
    format: 'Q4_K_M',
    bits: 4.5,
    vramGB: 2.5,
    latencyMs: 42,
    tokensPerSec: 210,
    reasoningScore: 89.8,
    memorySavingsPercent: 67.1,
    accuracyRetention: 98.7,
    isParetoOptimal: true,
    isQualityCliff: false,
  },
  {
    modelName: 'Phi-3 Mini 3.8B',
    family: 'Phi',
    format: 'IQ3_S',
    bits: 3.2,
    vramGB: 1.9,
    latencyMs: 38,
    tokensPerSec: 230,
    reasoningScore: 82.5,
    memorySavingsPercent: 75.0,
    accuracyRetention: 90.6,
    isParetoOptimal: false,
    isQualityCliff: true,
  },
];

const FAMILY_COLORS: Record<string, string> = {
  Gemma: '#10B981', // Emerald
  Llama: '#6366F1', // Indigo
  Phi: '#F59E0B',   // Amber
};

interface QuantizationTradeoffScatterProps {
  searchQuery?: string;
}

export const QuantizationTradeoffScatter: React.FC<QuantizationTradeoffScatterProps> = ({
  searchQuery,
}) => {
  const [mode, setMode] = useState<ScatterMode>('vram_vs_latency');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [highlightParetoOnly, setHighlightParetoOnly] = useState<boolean>(false);

  const filteredPoints = QUANT_SCATTER_DATA.filter((pt) => {
    const matchFamily = selectedFamily === 'all' || pt.family === selectedFamily;
    const matchPareto = !highlightParetoOnly || pt.isParetoOptimal;
    const matchSearch =
      !searchQuery ||
      !searchQuery.trim() ||
      pt.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pt.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pt.format.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFamily && matchPareto && matchSearch;
  });

  // Mode configuration
  const modeConfigs = {
    vram_vs_latency: {
      title: 'VRAM Usage vs. Execution Latency (p50)',
      xKey: 'vramGB',
      xLabel: 'VRAM Footprint (GB)',
      xDomain: [0, 18],
      xUnit: 'GB',
      yKey: 'latencyMs',
      yLabel: 'Latency p50 (ms)',
      yDomain: [20, 120],
      yUnit: 'ms',
      zKey: 'reasoningScore',
      zLabel: 'Reasoning Score',
      insight: 'Models in the bottom-left quadrant deliver lowest VRAM usage and fastest response latency.',
    },
    bits_vs_reasoning: {
      title: 'Bit-Precision vs. Reasoning Score Retention',
      xKey: 'bits',
      xLabel: 'Quantization Bit-Precision (bits/weight)',
      xDomain: [1, 18],
      xUnit: 'bits',
      yKey: 'reasoningScore',
      yLabel: 'Reasoning Score (0-100)',
      yDomain: [55, 95],
      yUnit: 'pts',
      zKey: 'vramGB',
      zLabel: 'VRAM (GB)',
      insight: 'Notice the sharp Quality Cliff below 3.5 bits: reasoning drops precipitously from 88 to 62 points.',
    },
    vram_vs_throughput: {
      title: 'VRAM Footprint vs. Generation Throughput',
      xKey: 'vramGB',
      xLabel: 'VRAM Footprint (GB)',
      xDomain: [0, 18],
      xUnit: 'GB',
      yKey: 'tokensPerSec',
      yLabel: 'Throughput (tokens/sec)',
      yDomain: [90, 340],
      yUnit: 'tok/s',
      zKey: 'bits',
      zLabel: 'Bit-Precision',
      insight: '4-bit quantization maximizes token throughput while slashing memory bandwidth bottlenecks.',
    },
  };

  const activeConfig = modeConfigs[mode];

  // Custom Scatter Tooltip adhering to anti-slop guidelines
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: QuantPoint = payload[0].payload;

    return (
      <div className="rounded-lg border border-slate-700 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md text-xs font-sans min-w-[220px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: FAMILY_COLORS[data.family] }}
            />
            <span className="font-bold text-white">{data.modelName}</span>
          </div>
          <span className="font-mono text-[11px] uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            {data.format}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Bit Precision:</span>
            <span className="font-mono tabular-nums text-white">{data.bits} bits</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">VRAM Footprint:</span>
            <span className="font-mono tabular-nums text-emerald-400 font-semibold">{data.vramGB} GB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Latency p50:</span>
            <span className="font-mono tabular-nums text-slate-200">{data.latencyMs} ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Throughput:</span>
            <span className="font-mono tabular-nums text-slate-200">{data.tokensPerSec} tok/s</span>
          </div>
          <div className="flex justify-between border-t border-slate-800 pt-1.5">
            <span className="text-slate-400">Reasoning Score:</span>
            <span className="font-mono tabular-nums text-indigo-400 font-bold">{data.reasoningScore} / 100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Memory Saved vs FP16:</span>
            <span className="font-mono tabular-nums text-emerald-400">-{data.memorySavingsPercent}%</span>
          </div>

          {data.isQualityCliff && (
            <div className="mt-2 p-1.5 rounded bg-rose-950/60 border border-rose-800/50 text-[10px] text-rose-300 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Quality Cliff: Severe reasoning degradation.</span>
            </div>
          )}

          {data.isParetoOptimal && (
            <div className="mt-2 p-1.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-[10px] text-emerald-300 flex items-center gap-1">
              <Sparkles className="h-3 w-3 shrink-0 text-emerald-400" />
              <span>Pareto Optimal: Ideal accuracy/memory tradeoff.</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-display">
              Quantization Trade-off Scatter Matrix
            </h3>
            <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950/60 border border-indigo-800/50 px-1.5 py-0.5 rounded">
              Multi-Parametric
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate exact VRAM footprint, execution latency, and token throughput tradeoffs across bit-precision formats.
          </p>
        </div>

        {/* Axis Dimension Mode Selectors */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs">
          <button
            onClick={() => setMode('vram_vs_latency')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              mode === 'vram_vs_latency'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            VRAM vs. Latency
          </button>
          <button
            onClick={() => setMode('bits_vs_reasoning')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              mode === 'bits_vs_reasoning'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bits vs. Reasoning
          </button>
          <button
            onClick={() => setMode('vram_vs_throughput')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              mode === 'vram_vs_throughput'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            VRAM vs. Throughput
          </button>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-500 text-[11px] font-medium">Model Families:</span>
          {['all', 'Gemma', 'Llama', 'Phi'].map((fam) => (
            <button
              key={fam}
              onClick={() => setSelectedFamily(fam)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition-colors ${
                selectedFamily === fam
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {fam !== 'all' && (
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: FAMILY_COLORS[fam] }}
                />
              )}
              <span>{fam === 'all' ? 'All Models' : `${fam} Family`}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={highlightParetoOnly}
              onChange={(e) => setHighlightParetoOnly(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Pareto-Optimal Checkpoints Only</span>
          </label>
        </div>
      </div>

      {/* Scatter Chart Canvas */}
      <div className="h-72 sm:h-80 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 15, right: 25, bottom: 15, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis
              type="number"
              dataKey={activeConfig.xKey}
              name={activeConfig.xLabel}
              domain={activeConfig.xDomain}
              unit={` ${activeConfig.xUnit}`}
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              type="number"
              dataKey={activeConfig.yKey}
              name={activeConfig.yLabel}
              domain={activeConfig.yDomain}
              unit={` ${activeConfig.yUnit}`}
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <ZAxis
              type="number"
              dataKey={activeConfig.zKey}
              range={[50, 400]}
              name={activeConfig.zLabel}
            />
            <Tooltip
              content={<CustomScatterTooltip />}
              cursor={{ strokeDasharray: '3 3', stroke: '#475569' }}
            />

            <Scatter name="Quantized Checkpoints" data={filteredPoints}>
              {filteredPoints.map((entry, index) => {
                const baseColor = FAMILY_COLORS[entry.family];
                const isCliff = entry.isQualityCliff;
                const isPareto = entry.isParetoOptimal;

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isCliff ? '#F43F5E' : baseColor}
                    stroke={isPareto ? '#FFFFFF' : '#0B0F19'}
                    strokeWidth={isPareto ? 2 : 1}
                    opacity={isCliff ? 0.75 : 0.9}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Analytical Observation & Guide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-2 border-t border-slate-800 text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-slate-300">
            <strong>Optimal Frontier:</strong> {activeConfig.insight}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border border-white bg-emerald-500 inline-block" />
            <span>Pareto Edge</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>Quality Cliff (&lt;3.5 bits)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
