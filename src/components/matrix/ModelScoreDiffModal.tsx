import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  Sparkles,
  TrendingUp,
  TrendingDown,
  HardDrive,
  Zap,
  DollarSign,
  Scale,
  CheckCircle,
  Play,
} from 'lucide-react';
import { ModelRecord } from '../../types/eval.ts';

interface ModelScoreDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelRecord[];
  initialModelAId?: string;
  initialModelBId?: string;
  onSendToArena: (modelAId: string, modelBId: string) => void;
}

interface DiffMetricRow {
  name: string;
  category: 'architecture' | 'benchmark' | 'efficiency';
  valA: number | string;
  valB: number | string;
  displayA: string;
  displayB: string;
  rawDiff?: number;
  diffText: string;
  isPositiveForB: boolean; // whether B's value is superior to A
  isNeutral?: boolean;
}

export const ModelScoreDiffModal: React.FC<ModelScoreDiffModalProps> = ({
  isOpen,
  onClose,
  models,
  initialModelAId,
  initialModelBId,
  onSendToArena,
}) => {
  const [modelAId, setModelAId] = useState<string>(
    initialModelAId || 'gemini-3.8-flash'
  );
  const [modelBId, setModelBId] = useState<string>(
    initialModelBId || 'gemma-2-2b-math-dpo-q4'
  );

  if (!isOpen) return null;

  const modelA = models.find((m) => m.id === modelAId) || models[0];
  const modelB = models.find((m) => m.id === modelBId) || models[1];

  const handleSwap = () => {
    const temp = modelAId;
    setModelAId(modelBId);
    setModelBId(temp);
  };

  // Build diff rows
  const diffRows: DiffMetricRow[] = [
    // 1. Architecture & Quantization
    {
      name: 'Architecture Tier',
      category: 'architecture',
      valA: modelA.tier,
      valB: modelB.tier,
      displayA: modelA.tier === 'foundation_llm' ? 'Frontier LLM' : 'Fine-Tuned SLM',
      displayB: modelB.tier === 'foundation_llm' ? 'Frontier LLM' : 'Fine-Tuned SLM',
      diffText: modelA.tier === modelB.tier ? 'Identical' : 'Tier Shift',
      isPositiveForB: true,
      isNeutral: true,
    },
    {
      name: 'Parameter Scale',
      category: 'architecture',
      valA: modelA.parametersB,
      valB: modelB.parametersB,
      displayA: `${modelA.parametersB}B`,
      displayB: `${modelB.parametersB}B`,
      rawDiff: modelB.parametersB - modelA.parametersB,
      diffText: `${modelB.parametersB > modelA.parametersB ? '+' : ''}${(modelB.parametersB - modelA.parametersB).toFixed(1)}B`,
      isPositiveForB: modelB.parametersB < modelA.parametersB, // smaller is lighter
    },
    {
      name: 'Quantization Format',
      category: 'architecture',
      valA: modelA.quantization,
      valB: modelB.quantization,
      displayA: modelA.quantization.toUpperCase(),
      displayB: modelB.quantization.toUpperCase(),
      diffText: modelA.quantization === modelB.quantization ? 'Same Format' : `${modelB.quantization.toUpperCase()} vs ${modelA.quantization.toUpperCase()}`,
      isPositiveForB: true,
      isNeutral: true,
    },
    {
      name: 'VRAM Memory Footprint',
      category: 'efficiency',
      valA: modelA.memoryGB,
      valB: modelB.memoryGB,
      displayA: `${modelA.memoryGB.toFixed(1)} GB`,
      displayB: `${modelB.memoryGB.toFixed(1)} GB`,
      rawDiff: modelB.memoryGB - modelA.memoryGB,
      diffText: `${modelB.memoryGB > modelA.memoryGB ? '+' : ''}${(modelB.memoryGB - modelA.memoryGB).toFixed(1)} GB (${(((modelB.memoryGB - modelA.memoryGB) / modelA.memoryGB) * 100).toFixed(0)}%)`,
      isPositiveForB: modelB.memoryGB < modelA.memoryGB,
    },
    {
      name: 'Cost / 1M Tokens',
      category: 'efficiency',
      valA: modelA.costPerMTokens,
      valB: modelB.costPerMTokens,
      displayA: `$${modelA.costPerMTokens.toFixed(3)}`,
      displayB: `$${modelB.costPerMTokens.toFixed(3)}`,
      rawDiff: modelB.costPerMTokens - modelA.costPerMTokens,
      diffText: `${modelB.costPerMTokens > modelA.costPerMTokens ? '+' : ''}$${(modelB.costPerMTokens - modelA.costPerMTokens).toFixed(3)} (${(((modelB.costPerMTokens - modelA.costPerMTokens) / modelA.costPerMTokens) * 100).toFixed(0)}%)`,
      isPositiveForB: modelB.costPerMTokens < modelA.costPerMTokens,
    },
    {
      name: 'Inference Latency (p50)',
      category: 'efficiency',
      valA: modelA.latencyP50Ms,
      valB: modelB.latencyP50Ms,
      displayA: `${modelA.latencyP50Ms} ms`,
      displayB: `${modelB.latencyP50Ms} ms`,
      rawDiff: modelB.latencyP50Ms - modelA.latencyP50Ms,
      diffText: `${modelB.latencyP50Ms > modelA.latencyP50Ms ? '+' : ''}${modelB.latencyP50Ms - modelA.latencyP50Ms} ms (${(((modelB.latencyP50Ms - modelA.latencyP50Ms) / modelA.latencyP50Ms) * 100).toFixed(0)}%)`,
      isPositiveForB: modelB.latencyP50Ms < modelA.latencyP50Ms,
    },
    {
      name: 'Token Throughput',
      category: 'efficiency',
      valA: modelA.tokensPerSec,
      valB: modelB.tokensPerSec,
      displayA: `${modelA.tokensPerSec} tok/s`,
      displayB: `${modelB.tokensPerSec} tok/s`,
      rawDiff: modelB.tokensPerSec - modelA.tokensPerSec,
      diffText: `${modelB.tokensPerSec > modelA.tokensPerSec ? '+' : ''}${modelB.tokensPerSec - modelA.tokensPerSec} tok/s`,
      isPositiveForB: modelB.tokensPerSec > modelA.tokensPerSec,
    },

    // 2. Benchmarks
    {
      name: 'Overall Win Rate',
      category: 'benchmark',
      valA: modelA.winRate,
      valB: modelB.winRate,
      displayA: `${modelA.winRate.toFixed(1)}%`,
      displayB: `${modelB.winRate.toFixed(1)}%`,
      rawDiff: modelB.winRate - modelA.winRate,
      diffText: `${modelB.winRate > modelA.winRate ? '+' : ''}${(modelB.winRate - modelA.winRate).toFixed(1)}%`,
      isPositiveForB: modelB.winRate > modelA.winRate,
    },
    {
      name: 'Reasoning Depth (0-100)',
      category: 'benchmark',
      valA: modelA.reasoningScore,
      valB: modelB.reasoningScore,
      displayA: modelA.reasoningScore.toFixed(1),
      displayB: modelB.reasoningScore.toFixed(1),
      rawDiff: modelB.reasoningScore - modelA.reasoningScore,
      diffText: `${modelB.reasoningScore > modelA.reasoningScore ? '+' : ''}${(modelB.reasoningScore - modelA.reasoningScore).toFixed(1)}`,
      isPositiveForB: modelB.reasoningScore > modelA.reasoningScore,
    },
    {
      name: 'Perplexity (PPL - Lower is Better)',
      category: 'benchmark',
      valA: modelA.perplexity || 5.0,
      valB: modelB.perplexity || 5.0,
      displayA: `${(modelA.perplexity || 5.0).toFixed(2)} PPL`,
      displayB: `${(modelB.perplexity || 5.0).toFixed(2)} PPL`,
      rawDiff: (modelB.perplexity || 5.0) - (modelA.perplexity || 5.0),
      diffText: `${(modelB.perplexity || 5.0) > (modelA.perplexity || 5.0) ? '+' : ''}${((modelB.perplexity || 5.0) - (modelA.perplexity || 5.0)).toFixed(2)} PPL`,
      isPositiveForB: (modelB.perplexity || 5.0) < (modelA.perplexity || 5.0),
    },
    {
      name: 'Token & Entity Precision',
      category: 'benchmark',
      valA: modelA.precisionScore || 85.0,
      valB: modelB.precisionScore || 85.0,
      displayA: `${(modelA.precisionScore || 85.0).toFixed(1)}%`,
      displayB: `${(modelB.precisionScore || 85.0).toFixed(1)}%`,
      rawDiff: (modelB.precisionScore || 85.0) - (modelA.precisionScore || 85.0),
      diffText: `${(modelB.precisionScore || 85.0) > (modelA.precisionScore || 85.0) ? '+' : ''}${((modelB.precisionScore || 85.0) - (modelA.precisionScore || 85.0)).toFixed(1)}%`,
      isPositiveForB: (modelB.precisionScore || 85.0) > (modelA.precisionScore || 85.0),
    },
    {
      name: 'Discourse Coherence',
      category: 'benchmark',
      valA: modelA.coherenceScore || 85.0,
      valB: modelB.coherenceScore || 85.0,
      displayA: `${(modelA.coherenceScore || 85.0).toFixed(1)}`,
      displayB: `${(modelB.coherenceScore || 85.0).toFixed(1)}`,
      rawDiff: (modelB.coherenceScore || 85.0) - (modelA.coherenceScore || 85.0),
      diffText: `${(modelB.coherenceScore || 85.0) > (modelA.coherenceScore || 85.0) ? '+' : ''}${((modelB.coherenceScore || 85.0) - (modelA.coherenceScore || 85.0)).toFixed(1)}`,
      isPositiveForB: (modelB.coherenceScore || 85.0) > (modelA.coherenceScore || 85.0),
    },
    {
      name: 'Grammatical Fluency',
      category: 'benchmark',
      valA: modelA.fluencyScore || 85.0,
      valB: modelB.fluencyScore || 85.0,
      displayA: `${(modelA.fluencyScore || 85.0).toFixed(1)}`,
      displayB: `${(modelB.fluencyScore || 85.0).toFixed(1)}`,
      rawDiff: (modelB.fluencyScore || 85.0) - (modelA.fluencyScore || 85.0),
      diffText: `${(modelB.fluencyScore || 85.0) > (modelA.fluencyScore || 85.0) ? '+' : ''}${((modelB.fluencyScore || 85.0) - (modelA.fluencyScore || 85.0)).toFixed(1)}`,
      isPositiveForB: (modelB.fluencyScore || 85.0) > (modelA.fluencyScore || 85.0),
    },
    {
      name: 'Prompt Relevancy',
      category: 'benchmark',
      valA: modelA.relevancyScore || 85.0,
      valB: modelB.relevancyScore || 85.0,
      displayA: `${(modelA.relevancyScore || 85.0).toFixed(1)}%`,
      displayB: `${(modelB.relevancyScore || 85.0).toFixed(1)}%`,
      rawDiff: (modelB.relevancyScore || 85.0) - (modelA.relevancyScore || 85.0),
      diffText: `${(modelB.relevancyScore || 85.0) > (modelA.relevancyScore || 85.0) ? '+' : ''}${((modelB.relevancyScore || 85.0) - (modelA.relevancyScore || 85.0)).toFixed(1)}%`,
      isPositiveForB: (modelB.relevancyScore || 85.0) > (modelA.relevancyScore || 85.0),
    },
    {
      name: 'Contextual Appropriateness',
      category: 'benchmark',
      valA: modelA.appropriatenessScore || 85.0,
      valB: modelB.appropriatenessScore || 85.0,
      displayA: `${(modelA.appropriatenessScore || 85.0).toFixed(1)}%`,
      displayB: `${(modelB.appropriatenessScore || 85.0).toFixed(1)}%`,
      rawDiff: (modelB.appropriatenessScore || 85.0) - (modelA.appropriatenessScore || 85.0),
      diffText: `${(modelB.appropriatenessScore || 85.0) > (modelA.appropriatenessScore || 85.0) ? '+' : ''}${((modelB.appropriatenessScore || 85.0) - (modelA.appropriatenessScore || 85.0)).toFixed(1)}%`,
      isPositiveForB: (modelB.appropriatenessScore || 85.0) > (modelA.appropriatenessScore || 85.0),
    },
    {
      name: 'GSM8k Math Derivation',
      category: 'benchmark',
      valA: modelA.gsm8kScore,
      valB: modelB.gsm8kScore,
      displayA: `${modelA.gsm8kScore.toFixed(1)}%`,
      displayB: `${modelB.gsm8kScore.toFixed(1)}%`,
      rawDiff: modelB.gsm8kScore - modelA.gsm8kScore,
      diffText: `${modelB.gsm8kScore > modelA.gsm8kScore ? '+' : ''}${(modelB.gsm8kScore - modelA.gsm8kScore).toFixed(1)}%`,
      isPositiveForB: modelB.gsm8kScore > modelA.gsm8kScore,
    },
    {
      name: 'Factual Accuracy',
      category: 'benchmark',
      valA: modelA.factualAccuracy,
      valB: modelB.factualAccuracy,
      displayA: `${modelA.factualAccuracy.toFixed(1)}%`,
      displayB: `${modelB.factualAccuracy.toFixed(1)}%`,
      rawDiff: modelB.factualAccuracy - modelA.factualAccuracy,
      diffText: `${modelB.factualAccuracy > modelA.factualAccuracy ? '+' : ''}${(modelB.factualAccuracy - modelA.factualAccuracy).toFixed(1)}%`,
      isPositiveForB: modelB.factualAccuracy > modelA.factualAccuracy,
    },
    {
      name: 'MMLU-Pro Multi-Task',
      category: 'benchmark',
      valA: modelA.mmluScore,
      valB: modelB.mmluScore,
      displayA: `${modelA.mmluScore.toFixed(1)}%`,
      displayB: `${modelB.mmluScore.toFixed(1)}%`,
      rawDiff: modelB.mmluScore - modelA.mmluScore,
      diffText: `${modelB.mmluScore > modelA.mmluScore ? '+' : ''}${(modelB.mmluScore - modelA.mmluScore).toFixed(1)}%`,
      isPositiveForB: modelB.mmluScore > modelA.mmluScore,
    },
    {
      name: 'HumanEval Code Synthesis',
      category: 'benchmark',
      valA: modelA.humanEvalScore,
      valB: modelB.humanEvalScore,
      displayA: `${modelA.humanEvalScore.toFixed(1)}%`,
      displayB: `${modelB.humanEvalScore.toFixed(1)}%`,
      rawDiff: modelB.humanEvalScore - modelA.humanEvalScore,
      diffText: `${modelB.humanEvalScore > modelA.humanEvalScore ? '+' : ''}${(modelB.humanEvalScore - modelA.humanEvalScore).toFixed(1)}%`,
      isPositiveForB: modelB.humanEvalScore > modelA.humanEvalScore,
    },
    {
      name: 'Instruction Adherence',
      category: 'benchmark',
      valA: modelA.instructionFollowing,
      valB: modelB.instructionFollowing,
      displayA: `${modelA.instructionFollowing.toFixed(1)}%`,
      displayB: `${modelB.instructionFollowing.toFixed(1)}%`,
      rawDiff: modelB.instructionFollowing - modelA.instructionFollowing,
      diffText: `${modelB.instructionFollowing > modelA.instructionFollowing ? '+' : ''}${(modelB.instructionFollowing - modelA.instructionFollowing).toFixed(1)}%`,
      isPositiveForB: modelB.instructionFollowing > modelA.instructionFollowing,
    },
    {
      name: 'Hallucination Frequency',
      category: 'benchmark',
      valA: modelA.hallucinationRate,
      valB: modelB.hallucinationRate,
      displayA: `${modelA.hallucinationRate.toFixed(1)}%`,
      displayB: `${modelB.hallucinationRate.toFixed(1)}%`,
      rawDiff: modelB.hallucinationRate - modelA.hallucinationRate,
      diffText: `${modelB.hallucinationRate > modelA.hallucinationRate ? '+' : ''}${(modelB.hallucinationRate - modelA.hallucinationRate).toFixed(1)}%`,
      isPositiveForB: modelB.hallucinationRate < modelA.hallucinationRate, // lower is better
    },
  ];

  // Executive Tradeoff Summary
  const memorySavedPct = (((modelA.memoryGB - modelB.memoryGB) / modelA.memoryGB) * 100);
  const costSavedPct = (((modelA.costPerMTokens - modelB.costPerMTokens) / modelA.costPerMTokens) * 100);
  const reasoningRetention = ((modelB.reasoningScore / modelA.reasoningScore) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-slate-800 bg-[#0E1526] shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white font-display">
                Side-by-Side Model Score & Quantization Diff
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct delta analysis of benchmark scores, memory requirements, and inference cost tradeoffs between two models.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Model Selectors Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          {/* Base Model (Model A) */}
          <div className="flex-1 w-full space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 block">
              Reference Model A:
            </span>
            <select
              value={modelAId}
              onChange={(e) => setModelAId(e.target.value)}
              className="w-full rounded bg-slate-900 border border-slate-800 p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.parametersB}B · {m.quantization.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors shrink-0"
            title="Swap Model A and Model B"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>

          {/* Candidate Model (Model B) */}
          <div className="flex-1 w-full space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block">
              Comparison Model B:
            </span>
            <select
              value={modelBId}
              onChange={(e) => setModelBId(e.target.value)}
              className="w-full rounded bg-slate-900 border border-slate-800 p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.parametersB}B · {m.quantization.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Executive Trade-off Verdict Card */}
        <div className="rounded-lg bg-indigo-950/30 border border-indigo-900/60 p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>Executive Tradeoff Synthesis ({modelB.name} vs. {modelA.name}):</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {modelB.name} achieves <strong className="text-emerald-400 font-mono">{reasoningRetention.toFixed(1)}%</strong> of {modelA.name}&apos;s reasoning score
            {memorySavedPct > 0 ? (
              <> while slashing VRAM footprint by <strong className="text-emerald-400 font-mono">{memorySavedPct.toFixed(1)}%</strong> ({modelA.memoryGB}GB → {modelB.memoryGB}GB)</>
            ) : (
              <> with an additional {Math.abs(memorySavedPct).toFixed(0)}% VRAM requirement</>
            )}
            {costSavedPct > 0 ? (
              <> and reducing operational inference cost by <strong className="text-emerald-400 font-mono">{costSavedPct.toFixed(1)}%</strong></>
            ) : null}.
          </p>
        </div>

        {/* Diff Data Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0B0F19]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                <th className="px-4 py-2.5 font-semibold uppercase tracking-wider text-[11px]">
                  Evaluation Dimension
                </th>
                <th className="px-4 py-2.5 font-semibold uppercase tracking-wider text-[11px] text-indigo-300">
                  {modelA.name}
                </th>
                <th className="px-4 py-2.5 font-semibold uppercase tracking-wider text-[11px] text-emerald-300">
                  {modelB.name}
                </th>
                <th className="px-4 py-2.5 font-semibold uppercase tracking-wider text-[11px] text-right">
                  Delta (B vs. A)
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {diffRows.map((row, idx) => {
                const isPositive = row.isPositiveForB;
                const isNeutral = row.isNeutral;

                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-2 text-slate-300 font-medium whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="px-4 py-2 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                      {row.displayA}
                    </td>
                    <td className="px-4 py-2 font-mono tabular-nums text-white font-semibold whitespace-nowrap">
                      {row.displayB}
                    </td>
                    <td className="px-4 py-2 font-mono tabular-nums text-right whitespace-nowrap">
                      {isNeutral ? (
                        <span className="text-slate-400 text-[11px]">{row.diffText}</span>
                      ) : (
                        <span
                          className={`font-semibold text-xs ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {row.diffText}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="text-[11px] text-slate-500 font-mono">
            Green indicates favorable metric shift or efficiency saving
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onSendToArena(modelAId, modelBId);
                onClose();
              }}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Launch Arena Comparison</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
