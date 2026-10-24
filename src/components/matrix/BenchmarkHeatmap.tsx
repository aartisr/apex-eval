import React, { useState, useMemo } from 'react';
import {
  Grid,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ModelRecord } from '../../types/eval.ts';

interface BenchmarkHeatmapProps {
  models: ModelRecord[];
  onSelectForArena: (modelId: string) => void;
  onInspectCheckpoints: (modelId: string) => void;
}

interface HeatmapMetricDef {
  id: string;
  label: string;
  shortLabel: string;
  category: 'core' | 'benchmark' | 'efficiency';
  getValue: (m: ModelRecord) => number;
  format: (val: number, m?: ModelRecord) => string;
  description: string;
}

const HEATMAP_METRICS: HeatmapMetricDef[] = [
  {
    id: 'winRate',
    label: 'Overall Win Rate',
    shortLabel: 'Win Rate',
    category: 'core',
    getValue: (m) => m.winRate,
    format: (v) => `${v.toFixed(1)}%`,
    description: 'Head-to-head pairwise win rate across all evaluated test vectors.',
  },
  {
    id: 'reasoning',
    label: 'Reasoning Depth',
    shortLabel: 'Reasoning',
    category: 'core',
    getValue: (m) => m.reasoningScore,
    format: (v) => v.toFixed(1),
    description: 'Multi-step chain-of-thought logical deduction and proof soundness.',
  },
  {
    id: 'accuracy',
    label: 'Factual Accuracy',
    shortLabel: 'Factuality',
    category: 'core',
    getValue: (m) => m.factualAccuracy,
    format: (v) => `${v.toFixed(1)}%`,
    description: 'Entity extraction precision and factual groundedness.',
  },
  {
    id: 'precision',
    label: 'Token Precision Score',
    shortLabel: 'Precision',
    category: 'core',
    getValue: (m) => m.precisionScore || 85.0,
    format: (v) => `${v.toFixed(1)}%`,
    description: 'Proportion of generated tokens and extracted entities that are strictly correct.',
  },
  {
    id: 'coherence',
    label: 'Discourse Coherence',
    shortLabel: 'Coherence',
    category: 'core',
    getValue: (m) => m.coherenceScore || 85.0,
    format: (v) => v.toFixed(1),
    description: 'Logical discourse progression, thematic cohesion, and multi-paragraph narrative structure.',
  },
  {
    id: 'fluency',
    label: 'Grammatical Fluency',
    shortLabel: 'Fluency',
    category: 'core',
    getValue: (m) => m.fluencyScore || 85.0,
    format: (v) => v.toFixed(1),
    description: 'Syntactic purity, natural conversational cadence, and vocabulary richness.',
  },
  {
    id: 'relevancy',
    label: 'Prompt Relevancy',
    shortLabel: 'Relevancy',
    category: 'core',
    getValue: (m) => m.relevancyScore || 85.0,
    format: (v) => `${v.toFixed(1)}%`,
    description: 'Direct fulfillment of user prompt intent without off-topic digressions.',
  },
  {
    id: 'appropriateness',
    label: 'Context Appropriateness',
    shortLabel: 'Appropriate.',
    category: 'core',
    getValue: (m) => m.appropriatenessScore || 85.0,
    format: (v) => `${v.toFixed(1)}%`,
    description: 'Tone calibration, persona adherence, register suitability, and safety compliance.',
  },
  {
    id: 'perplexity',
    label: 'Language Modeling Perplexity (PPL)',
    shortLabel: 'Perplexity',
    category: 'core',
    getValue: (m) => {
      const ppl = m.perplexity || 5.0;
      // Convert PPL to 0-100 score for chromatic scale (lower PPL = higher score)
      return Math.max(20, Math.min(100, Math.round(102 - ppl * 4.2)));
    },
    format: (v, m) => (m?.perplexity ? `${m.perplexity.toFixed(2)} PPL` : `${v.toFixed(0)} pts`),
    description: 'Exp(val_loss) prediction confidence. Lower perplexity indicates superior distribution modeling.',
  },
  {
    id: 'gsm8k',
    label: 'GSM8k (Math Derivation)',
    shortLabel: 'GSM8k',
    category: 'benchmark',
    getValue: (m) => m.gsm8kScore,
    format: (v) => `${v.toFixed(1)}%`,
    description: 'Grade school mathematical derivation with multi-variable calculation.',
  },
  {
    id: 'mmlu',
    label: 'MMLU-Pro Multi-Task',
    shortLabel: 'MMLU-Pro',
    category: 'benchmark',
    getValue: (m) => m.mmluScore,
    format: (v) => `${v.toFixed(1)}%`,
    description: 'Broad multidimensional STEM, humanities, and professional reasoning.',
  },
  {
    id: 'humaneval',
    label: 'HumanEval (Code Synthesis)',
    shortLabel: 'HumanEval',
    category: 'benchmark',
    getValue: (m) => m.humanEvalScore,
    format: (v) => `${v.toFixed(1)}%`,
    description: 'Algorithmic code synthesis with execution unit test validation.',
  },
  {
    id: 'instruction',
    label: 'Instruction Adherence',
    shortLabel: 'Instruction',
    category: 'core',
    getValue: (m) => m.instructionFollowing,
    format: (v) => `${v.toFixed(1)}%`,
    description: 'Strict adherence to output schemas, formatting, and negative constraints.',
  },
  {
    id: 'hallucination',
    label: 'Hallucination Resistance',
    shortLabel: 'Anti-Halluc.',
    category: 'core',
    getValue: (m) => Math.max(0, 100 - m.hallucinationRate * 6),
    format: (v) => `${v.toFixed(1)}%`,
    description: 'Resistance to fabricated citations, false entities, and ungrounded statements.',
  },
  {
    id: 'latencyScore',
    label: 'Latency Efficiency',
    shortLabel: 'Latency Eff.',
    category: 'efficiency',
    getValue: (m) => Math.max(20, Math.min(100, Math.round(115 - m.latencyP50Ms * 0.45))),
    format: (v) => `${v.toFixed(0)} pts`,
    description: 'Normalized response velocity (higher points for sub-50ms p50 times).',
  },
  {
    id: 'costScore',
    label: 'Cost Efficiency (ROI)',
    shortLabel: 'Cost ROI',
    category: 'efficiency',
    getValue: (m) => {
      if (m.costPerMTokens <= 0.005) return 99;
      if (m.costPerMTokens <= 0.015) return 94;
      if (m.costPerMTokens <= 0.04) return 86;
      if (m.costPerMTokens <= 0.1) return 78;
      return 58;
    },
    format: (v) => `${v} pts`,
    description: 'Economic efficiency score per 1M tokens ($0.004/M tok = 99 pts).',
  },
];

// Continuous chromatic scale helper
function getHeatmapColorStyle(value: number): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  if (value >= 90) {
    return {
      bg: 'bg-emerald-500/25 hover:bg-emerald-500/35',
      text: 'text-emerald-300 font-semibold',
      border: 'border-emerald-500/30',
      badge: 'Elite (90-100)',
    };
  }
  if (value >= 80) {
    return {
      bg: 'bg-teal-500/20 hover:bg-teal-500/30',
      text: 'text-teal-300 font-semibold',
      border: 'border-teal-500/25',
      badge: 'Strong (80-89)',
    };
  }
  if (value >= 70) {
    return {
      bg: 'bg-indigo-500/15 hover:bg-indigo-500/25',
      text: 'text-indigo-300 font-medium',
      border: 'border-indigo-500/20',
      badge: 'Competent (70-79)',
    };
  }
  if (value >= 60) {
    return {
      bg: 'bg-amber-500/15 hover:bg-amber-500/25',
      text: 'text-amber-300 font-medium',
      border: 'border-amber-500/20',
      badge: 'Developing (60-69)',
    };
  }
  return {
    bg: 'bg-rose-500/15 hover:bg-rose-500/25',
    text: 'text-rose-300 font-medium',
    border: 'border-rose-500/20',
    badge: 'Baseline (<60)',
  };
}

export const BenchmarkHeatmap: React.FC<BenchmarkHeatmapProps> = ({
  models,
  onSelectForArena,
  onInspectCheckpoints,
}) => {
  const [sortMetricId, setSortMetricId] = useState<string>('winRate');
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [hoveredCell, setHoveredCell] = useState<{
    modelId: string;
    metricId: string;
  } | null>(null);

  const activeMetricDef = HEATMAP_METRICS.find((m) => m.id === sortMetricId) || HEATMAP_METRICS[0];

  // Sort models according to active heatmap column
  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      const valA = activeMetricDef.getValue(a);
      const valB = activeMetricDef.getValue(b);
      return sortDesc ? valB - valA : valA - valB;
    });
  }, [models, activeMetricDef, sortDesc]);

  const handleHeaderClick = (metricId: string) => {
    if (sortMetricId === metricId) {
      setSortDesc(!sortDesc);
    } else {
      setSortMetricId(metricId);
      setSortDesc(true);
    }
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
      {/* Heatmap Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-display">
              Comparative Benchmark Heatmap Matrix
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
              High-Density View
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Color-coded chromatic cross-evaluation of foundation LLMs and fine-tuned SLMs across all verified benchmark dimensions. Click any column header to sort.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span className="text-slate-500 font-medium">Scale:</span>
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-mono font-semibold">
              ≥90 Elite
            </span>
            <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/25 text-teal-300 font-mono">
              80-89
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 font-mono">
              70-79
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-amber-300 font-mono">
              60-69
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/20 text-rose-300 font-mono">
              &lt;60
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0B0F19]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
              <th className="sticky left-0 z-20 bg-slate-950 px-3.5 py-3 font-semibold uppercase tracking-wider text-[11px] min-w-[200px] border-r border-slate-800">
                Model Architecture
              </th>
              {HEATMAP_METRICS.map((metric) => {
                const isSorted = sortMetricId === metric.id;
                return (
                  <th
                    key={metric.id}
                    onClick={() => handleHeaderClick(metric.id)}
                    className="px-3 py-2.5 font-semibold uppercase tracking-wider text-[11px] text-center cursor-pointer select-none hover:bg-slate-900/60 hover:text-white transition-colors border-r border-slate-800/60"
                    title={metric.description}
                  >
                    <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                      <span>{metric.shortLabel}</span>
                      {isSorted && (
                        <span>
                          {sortDesc ? (
                            <ArrowDown className="h-3 w-3 text-emerald-400 inline" />
                          ) : (
                            <ArrowUp className="h-3 w-3 text-emerald-400 inline" />
                          )}
                        </span>
                      )}
                      {!isSorted && <ArrowUpDown className="h-2.5 w-2.5 opacity-30 inline" />}
                    </div>
                  </th>
                );
              })}
              <th className="px-3 py-2.5 font-semibold uppercase tracking-wider text-[11px] text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {sortedModels.map((model) => (
              <tr key={model.id} className="hover:bg-slate-900/40 transition-colors group">
                {/* Model Info Sticky Column */}
                <td className="sticky left-0 z-10 bg-[#0B0F19] group-hover:bg-[#0E1526] px-3.5 py-2.5 border-r border-slate-800 transition-colors">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-xs">
                        {model.name}
                      </span>
                      {model.tier === 'fine_tuned_slm' && (
                        <span className="text-[9px] text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-1 rounded font-mono">
                          SLM
                        </span>
                      )}
                      {model.tier === 'foundation_llm' && (
                        <span className="text-[9px] text-amber-400 bg-amber-950/60 border border-amber-800/50 px-1 rounded font-mono">
                          LLM
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 font-mono">
                      <span>{model.parametersB}B</span>
                      <span>·</span>
                      <span className="uppercase">{model.quantization}</span>
                      <span>·</span>
                      <span className="text-slate-400">{model.family}</span>
                    </div>
                  </div>
                </td>

                {/* Heatmap Chromatic Cells */}
                {HEATMAP_METRICS.map((metric) => {
                  const val = metric.getValue(model);
                  const style = getHeatmapColorStyle(val);
                  const isHovered =
                    hoveredCell?.modelId === model.id && hoveredCell?.metricId === metric.id;

                  return (
                    <td
                      key={metric.id}
                      onMouseEnter={() =>
                        setHoveredCell({ modelId: model.id, metricId: metric.id })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`px-3 py-2 text-center border-r border-slate-800/50 transition-all cursor-default ${style.bg} ${
                        isHovered ? 'ring-2 ring-indigo-400 z-10' : ''
                      }`}
                    >
                      <span className={`font-mono tabular-nums text-xs ${style.text}`}>
                        {metric.format(val, model)}
                      </span>
                    </td>
                  );
                })}

                {/* Actions Column */}
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onSelectForArena(model.id)}
                      className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                      title="Load in Arena"
                    >
                      Arena
                    </button>
                    {model.family === 'Gemma' && (
                      <button
                        onClick={() => onInspectCheckpoints(model.id)}
                        className="px-2 py-0.5 text-[11px] rounded bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/50 transition-colors"
                        title="Inspect Epochs"
                      >
                        Epochs
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Heatmap Tooltip / Detail Summary Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-2 border-t border-slate-800 text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-slate-300">
            <strong>Sorted By:</strong> {activeMetricDef.label} ({sortDesc ? 'Highest First' : 'Lowest First'}).{' '}
            <span className="text-slate-400">{activeMetricDef.description}</span>
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Showing {sortedModels.length} models across 10 benchmark dimensions
        </div>
      </div>
    </div>
  );
};
