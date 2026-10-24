import React, { useState } from 'react';
import { Sliders, Sparkles, CheckCircle, Scale, RefreshCw } from 'lucide-react';
import { JudgeRubric, JudgeEvaluationResult } from '../../types/eval.ts';

interface JudgeRubricStudioProps {
  initialRubric: JudgeRubric;
}

export const JudgeRubricStudio: React.FC<JudgeRubricStudioProps> = ({
  initialRubric,
}) => {
  const [rubric, setRubric] = useState<JudgeRubric>(initialRubric);
  const [testPrompt, setTestPrompt] = useState(
    'Prove why the sum of two even integers is always even.'
  );
  const [testCompletion, setTestCompletion] = useState(
    'Let a and b be even integers. By definition, a = 2k and b = 2m for some integers k and m. Then a + b = 2k + 2m = 2(k + m). Since the integers are closed under addition, k + m is an integer. Thus, a + b is expressed in the form 2n where n = k + m, which is by definition an even integer. Q.E.D.'
  );

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<JudgeEvaluationResult | null>(null);

  const handleWeightChange = (key: keyof JudgeRubric['weights'], val: number) => {
    setRubric((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [key]: val,
      },
    }));
  };

  const totalWeight = Object.values(rubric.weights).reduce((a, b) => a + b, 0);

  const handleTestJudge = async () => {
    setIsEvaluating(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/eval/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          modelOutput: testCompletion,
          rubric,
          modelName: 'Gemma-2-2B Proof Candidate',
        }),
      }).then((r) => r.json());

      setTestResult(res);
    } catch (err) {
      console.error('Judge test failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Domain Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display">
            LLM-as-a-Judge Rubric Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure multidimensional arbitration criteria weights, chain-of-thought grading prompts,
            and hallucination penalty boundaries used by the Gemini arbiter.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
          <Scale className="h-3.5 w-3.5 text-indigo-400" />
          <span>Gemini 3.8 Flash Arbiter</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Criteria Weight Sliders */}
        <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Dimension Weights Configuration
            </span>
            <span className={`text-xs font-mono font-semibold ${Math.abs(totalWeight - 1.0) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>
              Total: {(totalWeight * 100).toFixed(0)}%
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Correctness */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="font-medium">1. Mathematical & Logical Correctness</span>
                <span className="font-mono text-indigo-400">{(rubric.weights.correctness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={rubric.weights.correctness}
                onChange={(e) => handleWeightChange('correctness', parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Reasoning */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="font-medium">2. Chain-of-Thought Reasoning Depth</span>
                <span className="font-mono text-indigo-400">{(rubric.weights.reasoning * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={rubric.weights.reasoning}
                onChange={(e) => handleWeightChange('reasoning', parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Instruction */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="font-medium">3. Instruction & Constraint Adherence</span>
                <span className="font-mono text-indigo-400">{(rubric.weights.instruction * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={rubric.weights.instruction}
                onChange={(e) => handleWeightChange('instruction', parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Factual Safety */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="font-medium">4. Factual Safety & Hallucination Resistance</span>
                <span className="font-mono text-indigo-400">{(rubric.weights.factualSafety * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={rubric.weights.factualSafety}
                onChange={(e) => handleWeightChange('factualSafety', parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Conciseness */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="font-medium">5. Information Density & Conciseness</span>
                <span className="font-mono text-indigo-400">{(rubric.weights.conciseness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={rubric.weights.conciseness}
                onChange={(e) => handleWeightChange('conciseness', parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-400">Judge System Prompt:</span>
            <textarea
              rows={4}
              value={rubric.promptTemplate}
              onChange={(e) => setRubric((prev) => ({ ...prev, promptTemplate: e.target.value }))}
              className="w-full rounded bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono"
            />
          </div>
        </div>

        {/* Right: Interactive Test Sandbox */}
        <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Test Judge Calibration
            </span>
            <button
              onClick={handleTestJudge}
              disabled={isEvaluating}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isEvaluating ? 'Evaluating...' : 'Test Judge Evaluation'}</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Test Task Prompt:</span>
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-slate-200"
              />
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Sample Candidate Output:</span>
              <textarea
                rows={4}
                value={testCompletion}
                onChange={(e) => setTestCompletion(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 p-2.5 text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Test Evaluation Feedback */}
          {testResult && (
            <div className="mt-4 p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Judge Score:</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {testResult.overallScore} / 100
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-500 block">Correctness:</span>
                  <span className="font-semibold">{testResult.criteriaScores.correctness}/100</span>
                </div>
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-500 block">Reasoning:</span>
                  <span className="font-semibold">{testResult.criteriaScores.reasoning}/100</span>
                </div>
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-500 block">Conciseness:</span>
                  <span className="font-semibold">{testResult.criteriaScores.conciseness}/100</span>
                </div>
              </div>

              <div className="text-xs space-y-1 pt-1">
                <span className="text-slate-400 font-medium">Judge Critique:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {testResult.critique}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
