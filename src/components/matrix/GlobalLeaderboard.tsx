import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Zap,
  Target,
  Coins,
  Medal,
  Flame,
  ArrowUpRight,
  BarChart2,
  Sparkles,
  Scale,
} from 'lucide-react';
import { ModelRecord } from '../../types/eval.ts';

interface GlobalLeaderboardProps {
  models: ModelRecord[];
  onSelectForArena: (modelId: string) => void;
  onInspectCheckpoints: (modelId: string) => void;
  onOpenDiff: (modelId: string) => void;
}

export type LeaderboardMetric = 'aggregate' | 'accuracy' | 'perplexity' | 'speed' | 'efficiency';

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  models,
  onSelectForArena,
  onInspectCheckpoints,
  onOpenDiff,
}) => {
  const [activeMetric, setActiveMetric] = useState<LeaderboardMetric>('aggregate');

  // Compute metric scores & sorted ranking
  const rankedModels = useMemo(() => {
    const scored = models.map((m) => {
      let score = 0;
      let primaryMetricLabel = '';
      let primaryMetricValue = '';

      if (activeMetric === 'aggregate') {
        score =
          m.winRate * 0.35 +
          m.gsm8kScore * 0.25 +
          m.mmluScore * 0.20 +
          m.humanEvalScore * 0.20;
        primaryMetricLabel = 'Win Rate';
        primaryMetricValue = `${m.winRate}%`;
      } else if (activeMetric === 'accuracy') {
        score =
          m.reasoningScore * 0.30 +
          m.factualAccuracy * 0.30 +
          m.gsm8kScore * 0.20 +
          m.mmluScore * 0.20;
        primaryMetricLabel = 'Factual Acc';
        primaryMetricValue = `${m.factualAccuracy}%`;
      } else if (activeMetric === 'perplexity') {
        const ppl = m.perplexity || 5.0;
        const prec = m.precisionScore || 85.0;
        const pplScore = Math.max(0, Math.min(100, 100 - ppl * 4.5));
        score = prec * 0.6 + pplScore * 0.4;
        primaryMetricLabel = 'Perplexity / Precision';
        primaryMetricValue = `${ppl.toFixed(2)} PPL (${prec.toFixed(1)}% Prec)`;
      } else if (activeMetric === 'speed') {
        const tokScore = Math.min(100, (m.tokensPerSec / 300) * 100);
        const latScore = Math.max(0, 100 - (m.latencyP50Ms / 3));
        score = tokScore * 0.6 + latScore * 0.4;
        primaryMetricLabel = 'Speed / P50';
        primaryMetricValue = `${m.tokensPerSec} tok/s (${m.latencyP50Ms}ms)`;
      } else if (activeMetric === 'efficiency') {
        const costScore = Math.max(0, 100 - m.costPerMTokens * 50);
        const vramScore = Math.max(0, 100 - m.memoryGB * 0.5);
        score = costScore * 0.5 + vramScore * 0.5;
        primaryMetricLabel = 'VRAM / Cost';
        primaryMetricValue = `${m.memoryGB} GB ($${m.costPerMTokens})`;
      }

      return {
        model: m,
        calculatedScore: Math.round(score * 10) / 10,
        primaryMetricLabel,
        primaryMetricValue,
      };
    });

    return scored.sort((a, b) => b.calculatedScore - a.calculatedScore);
  }, [models, activeMetric]);

  const top3 = rankedModels.slice(0, 3);
  const remaining = rankedModels.slice(3);

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-5">
      {/* Header & Metric Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Global Model Evaluation Leaderboard
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rank models across aggregate index, reasoning accuracy, perplexity & precision, execution speed, and hardware efficiency.
            </p>
          </div>
        </div>

        {/* Metric Toggle Filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs flex-wrap">
          <button
            onClick={() => setActiveMetric('aggregate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition-all ${
              activeMetric === 'aggregate'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Aggregate Index</span>
          </button>

          <button
            onClick={() => setActiveMetric('accuracy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition-all ${
              activeMetric === 'accuracy'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>Accuracy & Reasoning</span>
          </button>

          <button
            onClick={() => setActiveMetric('perplexity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition-all ${
              activeMetric === 'perplexity'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Perplexity & Precision</span>
          </button>

          <button
            onClick={() => setActiveMetric('speed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition-all ${
              activeMetric === 'speed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Speed & Latency</span>
          </button>

          <button
            onClick={() => setActiveMetric('efficiency')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition-all ${
              activeMetric === 'efficiency'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            <span>VRAM & Cost ROI</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {top3.map((item, index) => {
          const m = item.model;
          const isGold = index === 0;
          const isSilver = index === 1;
          const isBronze = index === 2;

          return (
            <div
              key={m.id}
              className={`relative rounded-xl border p-4 flex flex-col justify-between space-y-3 transition-all ${
                isGold
                  ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/30 to-[#0E1526] ring-1 ring-amber-500/40 shadow-lg shadow-amber-950/20'
                  : isSilver
                  ? 'border-slate-400/50 bg-gradient-to-b from-slate-900/40 to-[#0E1526]'
                  : 'border-amber-800/40 bg-gradient-to-b from-amber-950/20 to-[#0E1526]'
              }`}
            >
              {/* Badge Icon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold font-mono ${
                      isGold
                        ? 'bg-amber-400 text-slate-950'
                        : isSilver
                        ? 'bg-slate-300 text-slate-950'
                        : 'bg-amber-700 text-white'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                      m.tier === 'fine_tuned_slm'
                        ? 'text-indigo-400 bg-indigo-950/80 border border-indigo-800/50'
                        : m.tier === 'foundation_llm'
                        ? 'text-amber-400 bg-amber-950/80 border border-amber-800/50'
                        : 'text-slate-400 bg-slate-900 border border-slate-800'
                    }`}
                  >
                    {m.tier === 'fine_tuned_slm' ? 'Fine-Tuned SLM' : m.tier === 'foundation_llm' ? 'Frontier LLM' : 'Base SLM'}
                  </span>
                </div>

                <span className="text-xl font-bold font-mono text-white tabular-nums">
                  {item.calculatedScore}
                  <span className="text-xs text-slate-500 font-sans font-normal ml-0.5">pts</span>
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white leading-tight font-display">{m.name}</h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {m.parametersB}B Params · <span className="uppercase">{m.quantization}</span> · {item.primaryMetricLabel}: <strong className="text-indigo-300">{item.primaryMetricValue}</strong>
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Relative Index</span>
                  <span>{item.calculatedScore}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isGold ? 'bg-amber-400' : isSilver ? 'bg-slate-300' : 'bg-amber-600'}`}
                    style={{ width: `${Math.min(100, item.calculatedScore)}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onSelectForArena(m.id)}
                  className="flex-1 py-1 px-2 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-center"
                >
                  Arena
                </button>
                <button
                  onClick={() => onOpenDiff(m.id)}
                  className="py-1 px-2.5 rounded text-[11px] font-medium border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Compare Diff"
                >
                  Diff
                </button>
                {m.family === 'Gemma' && (
                  <button
                    onClick={() => onInspectCheckpoints(m.id)}
                    className="py-1 px-2.5 rounded text-[11px] font-medium border border-indigo-900/60 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 transition-colors"
                  >
                    Epochs
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Remaining Leaderboard Table */}
      {remaining.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3 font-mono">Leaderboard Index</th>
                <th className="py-2.5 px-3 font-mono">Perplexity (PPL)</th>
                <th className="py-2.5 px-3 font-mono">Precision</th>
                <th className="py-2.5 px-3 font-mono">Win Rate</th>
                <th className="py-2.5 px-3 font-mono">Latency P50</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {remaining.map((item, index) => {
                const m = item.model;
                const rank = index + 4;
                return (
                  <tr key={m.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">#{rank}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-white">{m.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {m.parametersB}B Params · <span className="uppercase">{m.quantization}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-amber-400">{item.calculatedScore} pts</td>
                    <td className="py-2.5 px-3 text-purple-300 font-semibold">{m.perplexity ? `${m.perplexity.toFixed(2)} PPL` : 'N/A'}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">{m.precisionScore ? `${m.precisionScore.toFixed(1)}%` : 'N/A'}</td>
                    <td className="py-2.5 px-3 text-slate-300">{m.winRate}%</td>
                    <td className="py-2.5 px-3 text-slate-300">{m.latencyP50Ms} ms</td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectForArena(m.id)}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          Arena
                        </button>
                        <button
                          onClick={() => onOpenDiff(m.id)}
                          className="px-2 py-0.5 rounded text-[10px] border border-slate-800 hover:border-slate-700 text-slate-400"
                        >
                          Diff
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
