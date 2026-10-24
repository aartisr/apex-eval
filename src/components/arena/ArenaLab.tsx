import React, { useState } from 'react';
import {
  Play,
  Scale,
  Sparkles,
  Zap,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Database,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { ModelRecord, BenchmarkSuite, JudgeEvaluationResult } from '../../types/eval.ts';

interface ArenaLabProps {
  models: ModelRecord[];
  suites: BenchmarkSuite[];
  preselectedModelId?: string;
  onRefreshCache: () => void;
}

export const ArenaLab: React.FC<ArenaLabProps> = ({
  models,
  suites,
  preselectedModelId,
  onRefreshCache,
}) => {
  const [modelAId, setModelAId] = useState<string>(
    preselectedModelId || 'gemini-3.8-flash'
  );
  const [modelBId, setModelBId] = useState<string>('gemma-2-2b-math-dpo-q4');

  const [prompt, setPrompt] = useState<string>(
    'A bakery prepares 4 batches of artisan sourdough loaves every morning. Each batch yields 24 loaves. If they sell 75% of the loaves by noon at $8 each, and the remainder during the evening at a 25% discount, what is their total revenue for the day?'
  );
  const [referenceAnswer, setReferenceAnswer] = useState<string>(
    'Total loaves = 4 * 24 = 96. Sold by noon = 96 * 0.75 = 72 loaves. Revenue noon = 72 * $8 = $576. Remainder = 96 - 72 = 24 loaves. Evening price = $8 * (1 - 0.25) = $6. Evening revenue = 24 * $6 = $144. Total daily revenue = $576 + $144 = $720.'
  );

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isJudging, setIsJudging] = useState<boolean>(false);

  // Model Completion State
  const [resultA, setResultA] = useState<{
    completion: string;
    latencyMs: number;
    tokensGenerated: number;
    tokensPerSec: number;
    estimatedCostUsd: number;
  } | null>(null);

  const [resultB, setResultB] = useState<{
    completion: string;
    latencyMs: number;
    tokensGenerated: number;
    tokensPerSec: number;
    estimatedCostUsd: number;
  } | null>(null);

  // Judge State
  const [judgeA, setJudgeA] = useState<JudgeEvaluationResult | null>(null);
  const [judgeB, setJudgeB] = useState<JudgeEvaluationResult | null>(null);

  const modelA = models.find((m) => m.id === modelAId) || models[0];
  const modelB = models.find((m) => m.id === modelBId) || models[1];

  // Select predefined prompt
  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const taskId = e.target.value;
    for (const suite of suites) {
      const found = suite.tasks.find((t) => t.id === taskId);
      if (found) {
        setPrompt(found.prompt);
        setReferenceAnswer(found.referenceAnswer);
        setResultA(null);
        setResultB(null);
        setJudgeA(null);
        setJudgeB(null);
        return;
      }
    }
  };

  // Run generation for both models concurrently
  const handleRunEvaluation = async () => {
    setIsRunning(true);
    setResultA(null);
    setResultB(null);
    setJudgeA(null);
    setJudgeB(null);

    try {
      const [resA, resB] = await Promise.all([
        fetch('/api/eval/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, modelId: modelAId }),
        }).then((r) => r.json()),
        fetch('/api/eval/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, modelId: modelBId }),
        }).then((r) => r.json()),
      ]);

      setResultA(resA);
      setResultB(resB);
    } catch (err) {
      console.error('Evaluation run failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Call Gemini LLM-as-a-Judge on both outputs
  const handleJudgeArbitration = async () => {
    if (!resultA || !resultB) return;
    setIsJudging(true);

    try {
      const [jA, jB] = await Promise.all([
        fetch('/api/eval/judge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            modelOutput: resultA.completion,
            referenceAnswer,
            modelName: modelA.name,
          }),
        }).then((r) => r.json()),
        fetch('/api/eval/judge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            modelOutput: resultB.completion,
            referenceAnswer,
            modelName: modelB.name,
          }),
        }).then((r) => r.json()),
      ]);

      setJudgeA(jA);
      setJudgeB(jB);
      onRefreshCache();
    } catch (err) {
      console.error('Judge arbitration failed:', err);
    } finally {
      setIsJudging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display">
            Side-by-Side Model Arena
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Execute synchronized prompt vectors against foundation LLMs and fine-tuned SLMs to quantify latency differences,
            reasoning integrity, and cost per inference token.
          </p>
        </div>

        {/* Model Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Model A Select */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-indigo-400 font-semibold">Model A:</span>
            <select
              value={modelAId}
              onChange={(e) => setModelAId(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                  {m.name} ({m.parametersB}B · {m.quantization})
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-600 font-bold text-xs">vs</span>

          {/* Model B Select */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-emerald-400 font-semibold">Model B:</span>
            <select
              value={modelBId}
              onChange={(e) => setModelBId(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                  {m.name} ({m.parametersB}B · {m.quantization})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Prompt Setup Panel */}
      <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-300">
            Evaluation Test Vector
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Benchmark Preset:</span>
            <select
              onChange={handleSelectPreset}
              className="rounded bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="">Custom Input</option>
              {suites.flatMap((s) =>
                s.tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {s.name}: {t.prompt.slice(0, 45)}...
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter prompt to evaluate across both models..."
          className="w-full rounded-md border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-500">Target Benchmark:</span>
            <span className="text-slate-300 font-medium">Mathematical & Logical Synthesis</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunEvaluation}
              disabled={isRunning || !prompt.trim()}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isRunning ? 'Synthesizing...' : 'Execute Synchronized Run'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Completion Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Model A Viewport */}
        <div className="rounded-lg border border-slate-800 bg-[#0E1526] flex flex-col min-h-[380px]">
          {/* Card Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">{modelA.name}</span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>{modelA.tier === 'foundation_llm' ? 'Frontier LLM' : 'Fine-Tuned SLM'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{modelA.parametersB}B Params</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono uppercase">{modelA.quantization}</span>
              </div>
            </div>

            {resultA && (
              <div className="flex items-center gap-3 text-xs tabular-nums text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Clock className="h-3 w-3" />
                  {resultA.latencyMs}ms
                </span>
                <span className="text-slate-500">·</span>
                <span>{resultA.tokensPerSec} tok/s</span>
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="p-4 flex-1 overflow-y-auto">
            {isRunning && !resultA ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent" />
                <span>Generating completion from {modelA.name}...</span>
              </div>
            ) : resultA ? (
              <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {resultA.completion}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-600 text-xs">
                Awaiting run execution to evaluate output.
              </div>
            )}
          </div>

          {/* Card Footer Metrics */}
          {resultA && (
            <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span>Est. Cost: <strong className="text-slate-200">${resultA.estimatedCostUsd.toFixed(6)}</strong></span>
              </div>
              <div className="text-slate-500">
                {resultA.tokensGenerated} tokens generated
              </div>
            </div>
          )}
        </div>

        {/* Model B Viewport */}
        <div className="rounded-lg border border-slate-800 bg-[#0E1526] flex flex-col min-h-[380px]">
          {/* Card Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">{modelB.name}</span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>{modelB.tier === 'foundation_llm' ? 'Frontier LLM' : 'Fine-Tuned SLM'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{modelB.parametersB}B Params</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono uppercase">{modelB.quantization}</span>
              </div>
            </div>

            {resultB && (
              <div className="flex items-center gap-3 text-xs tabular-nums text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Clock className="h-3 w-3" />
                  {resultB.latencyMs}ms
                </span>
                <span className="text-slate-500">·</span>
                <span>{resultB.tokensPerSec} tok/s</span>
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="p-4 flex-1 overflow-y-auto">
            {isRunning && !resultB ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent" />
                <span>Generating completion from {modelB.name}...</span>
              </div>
            ) : resultB ? (
              <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {resultB.completion}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-600 text-xs">
                Awaiting run execution to evaluate output.
              </div>
            )}
          </div>

          {/* Card Footer Metrics */}
          {resultB && (
            <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span>Est. Cost: <strong className="text-slate-200">${resultB.estimatedCostUsd.toFixed(6)}</strong></span>
              </div>
              <div className="text-slate-500">
                {resultB.tokensGenerated} tokens generated
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LLM-as-a-Judge Arbitration Trigger & Breakdown */}
      {resultA && resultB && (
        <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-display">
                  Gemini LLM-as-a-Judge Evaluation & Arbitration
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates both outputs across Correctness, Chain-of-Thought Reasoning, Instruction Adherence, and Hallucination Risk.
              </p>
            </div>

            <button
              onClick={handleJudgeArbitration}
              disabled={isJudging}
              className="flex items-center gap-2 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isJudging ? 'Arbitrating with Gemini 3.8...' : 'Arbitrate with Gemini Judge'}</span>
            </button>
          </div>

          {/* Judge Results Comparison Grid */}
          {(judgeA || judgeB) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Judge A Verdict */}
              {judgeA && (
                <div className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{modelA.name}</span>
                    <div className="flex items-center gap-2">
                      {judgeA.cached && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                          <Database className="h-2.5 w-2.5" />
                          Redis Hit ({judgeA.latencyMs}ms)
                        </span>
                      )}
                      <span className="text-lg font-bold text-white tabular-nums">
                        {judgeA.overallScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                      </span>
                    </div>
                  </div>

                  {/* Criteria Bars */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Correctness (35%):</span>
                      <span className="font-semibold tabular-nums text-slate-200">{judgeA.criteriaScores.correctness}/100</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${judgeA.criteriaScores.correctness}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Reasoning Depth (25%):</span>
                      <span className="font-semibold tabular-nums text-slate-200">{judgeA.criteriaScores.reasoning}/100</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${judgeA.criteriaScores.reasoning}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Instruction Adherence (20%):</span>
                      <span className="font-semibold tabular-nums text-slate-200">{judgeA.criteriaScores.instruction}/100</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${judgeA.criteriaScores.instruction}%` }} />
                    </div>
                  </div>

                  {/* Qualitative Critique */}
                  <div className="pt-2 border-t border-slate-900 space-y-1 text-xs">
                    <span className="text-slate-400 font-medium">Judge Critique:</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {judgeA.critique}
                    </p>
                  </div>
                </div>
              )}

              {/* Judge B Verdict */}
              {judgeB && (
                <div className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{modelB.name}</span>
                    <div className="flex items-center gap-2">
                      {judgeB.cached && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                          <Database className="h-2.5 w-2.5" />
                          Redis Hit ({judgeB.latencyMs}ms)
                        </span>
                      )}
                      <span className="text-lg font-bold text-white tabular-nums">
                        {judgeB.overallScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                      </span>
                    </div>
                  </div>

                  {/* Criteria Bars */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Correctness (35%):</span>
                      <span className="font-semibold tabular-nums text-slate-200">{judgeB.criteriaScores.correctness}/100</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${judgeB.criteriaScores.correctness}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Reasoning Depth (25%):</span>
                      <span className="font-semibold tabular-nums text-slate-200">{judgeB.criteriaScores.reasoning}/100</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${judgeB.criteriaScores.reasoning}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Instruction Adherence (20%):</span>
                      <span className="font-semibold tabular-nums text-slate-200">{judgeB.criteriaScores.instruction}/100</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${judgeB.criteriaScores.instruction}%` }} />
                    </div>
                  </div>

                  {/* Qualitative Critique */}
                  <div className="pt-2 border-t border-slate-900 space-y-1 text-xs">
                    <span className="text-slate-400 font-medium">Judge Critique:</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {judgeB.critique}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
