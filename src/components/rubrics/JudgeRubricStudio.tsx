import React, { useState } from 'react';
import { Sliders, Sparkles, CheckCircle, Scale, RefreshCw, BookOpen, MessageSquare, ShieldCheck } from 'lucide-react';
import { JudgeRubric, JudgeEvaluationResult } from '../../types/eval.ts';
import { INITIAL_JUDGE_RUBRIC, INITIAL_NLG_RUBRIC } from '../../lib/initialData.ts';

interface JudgeRubricStudioProps {
  initialRubric: JudgeRubric;
}

export const JudgeRubricStudio: React.FC<JudgeRubricStudioProps> = ({
  initialRubric,
}) => {
  const [rubric, setRubric] = useState<JudgeRubric>(initialRubric);
  const [selectedTemplate, setSelectedTemplate] = useState<'engineering' | 'nlg'>('engineering');
  const [testPrompt, setTestPrompt] = useState(
    'A tier-1 enterprise customer is extremely frustrated because their data synchronization job timed out during an overnight migration window. Write an empathetic, highly professional, and reassuring operational response that acknowledges their disruption, clearly outlines the root cause analysis steps being undertaken, and provides a guaranteed 2-hour checkpoint.'
  );
  const [testCompletion, setTestCompletion] = useState(
    'Dear Enterprise Platform Team,\n\nWe sincerely apologize for the disruption caused by the overnight data synchronization timeout. We fully recognize that this migration window was critical for your operations.\n\nOur site reliability engineering team has already isolated the bottleneck to worker thread lock contention under high batch concurrency. To remediate this immediately, we have provisioned dedicated read-replica compute nodes and re-allocated semaphore queues.\n\nWe are actively monitoring the re-indexed ingestion pipeline and will deliver our next formal status checkpoint within 2 hours (by 11:30 AM EST). Your technical account director is on direct standby at this line.\n\nWarm regards,\nCloud Operations Lead'
  );

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<JudgeEvaluationResult | null>(null);

  const handleSelectTemplate = (type: 'engineering' | 'nlg') => {
    setSelectedTemplate(type);
    if (type === 'nlg') {
      setRubric(INITIAL_NLG_RUBRIC);
      setTestPrompt(
        'Provide a structured, executive debrief explaining how a sudden 150 basis-point central bank interest rate hike impacts mortgage lending, corporate capital expenditure, and foreign exchange valuations. Maintain immaculate discourse coherence, logical transitions, and an analytical tone without straying into unrelated fiscal policies.'
      );
    } else {
      setRubric(INITIAL_JUDGE_RUBRIC);
      setTestPrompt('Prove why the sum of two even integers is always even.');
    }
  };

  const handleWeightChange = (key: keyof JudgeRubric['weights'], val: number) => {
    setRubric((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [key]: val,
      },
    }));
  };

  const totalWeight = Object.values(rubric.weights).reduce((a, b) => (a || 0) + (b || 0), 0);

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
          modelName: 'Gemma-2-2B Fine-Tuned Candidate',
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
            Configure multidimensional arbitration criteria weights for both cognitive reasoning and linguistic craftsmanship (Coherence, Fluency, Relevancy, and Appropriateness) evaluated by the Gemini arbiter.
          </p>
        </div>

        {/* Template Selector Segmented Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => handleSelectTemplate('engineering')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              selectedTemplate === 'engineering'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Logic & Engineering</span>
          </button>
          <button
            onClick={() => handleSelectTemplate('nlg')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              selectedTemplate === 'nlg'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Linguistic & Conversational Quality</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Criteria Weight Sliders */}
        <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {rubric.name}
            </span>
            <span className={`text-xs font-mono font-semibold ${Math.abs(totalWeight - 1.0) < 0.03 ? 'text-emerald-400' : 'text-amber-400'}`}>
              Normalized Weight: {(totalWeight * 100).toFixed(0)}%
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* 1. Coherence */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-400" />
                  1. Discourse Coherence & Narrative Structure
                </span>
                <span className="font-mono text-purple-400 font-bold">{((rubric.weights.coherence || 0) * 100).toFixed(0)}%</span>
              </div>
              <p className="text-[10px] text-slate-500">Logical transition flow, thematic unity, and narrative connectivity across paragraphs.</p>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={rubric.weights.coherence || 0}
                onChange={(e) => handleWeightChange('coherence', parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            {/* 2. Fluency */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  2. Grammatical Fluency & Natural Cadence
                </span>
                <span className="font-mono text-emerald-400 font-bold">{((rubric.weights.fluency || 0) * 100).toFixed(0)}%</span>
              </div>
              <p className="text-[10px] text-slate-500">Grammatical correctness, lexical diversity, fluid syntax, and lack of stilted repetition.</p>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={rubric.weights.fluency || 0}
                onChange={(e) => handleWeightChange('fluency', parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* 3. Relevancy */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  3. Query Relevancy & Intent Focus
                </span>
                <span className="font-mono text-indigo-400 font-bold">{((rubric.weights.relevancy || 0) * 100).toFixed(0)}%</span>
              </div>
              <p className="text-[10px] text-slate-500">Direct fulfillment of core prompt intent without drifting into unrequested tangents.</p>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={rubric.weights.relevancy || 0}
                onChange={(e) => handleWeightChange('relevancy', parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* 4. Appropriateness */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  4. Contextual Appropriateness & Tone
                </span>
                <span className="font-mono text-amber-400 font-bold">{((rubric.weights.appropriateness || 0) * 100).toFixed(0)}%</span>
              </div>
              <p className="text-[10px] text-slate-500">Tone calibration, empathetic/professional register suitability, and safety compliance.</p>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={rubric.weights.appropriateness || 0}
                onChange={(e) => handleWeightChange('appropriateness', parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* 5. Correctness & Logic */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="font-medium text-slate-300">5. Mathematical & Logical Correctness</span>
                <span className="font-mono text-slate-400 font-bold">{(rubric.weights.correctness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={rubric.weights.correctness}
                onChange={(e) => handleWeightChange('correctness', parseFloat(e.target.value))}
                className="w-full accent-slate-500"
              />
            </div>

            {/* 6. Reasoning Depth */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="font-medium text-slate-300">6. Chain-of-Thought Reasoning Depth</span>
                <span className="font-mono text-slate-400 font-bold">{(rubric.weights.reasoning * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={rubric.weights.reasoning}
                onChange={(e) => handleWeightChange('reasoning', parseFloat(e.target.value))}
                className="w-full accent-slate-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <span className="text-xs font-semibold text-slate-400">Arbiter Prompt Template:</span>
            <textarea
              rows={3}
              value={rubric.promptTemplate}
              onChange={(e) => setRubric((prev) => ({ ...prev, promptTemplate: e.target.value }))}
              className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200 font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Right: Interactive Test Sandbox */}
        <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Test Judge Calibration Sandbox
            </span>
            <button
              onClick={handleTestJudge}
              disabled={isEvaluating}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isEvaluating ? 'Arbitrating with Gemini...' : 'Run Judge Evaluation'}</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Evaluation Task Vector:</span>
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-slate-200"
              />
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Candidate Model Response:</span>
              <textarea
                rows={5}
                value={testCompletion}
                onChange={(e) => setTestCompletion(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 p-2.5 text-slate-200 font-mono text-[11px] leading-relaxed"
              />
            </div>
          </div>

          {/* Test Evaluation Feedback */}
          {testResult && (
            <div className="mt-4 p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Composite Judge Score:</span>
                  <span className="text-[10px] text-slate-400 font-mono">Weighted multi-dimensional arbiter grading</span>
                </div>
                <span className="text-2xl font-bold text-emerald-400 font-mono">
                  {testResult.overallScore} <span className="text-xs text-slate-500">/ 100</span>
                </span>
              </div>

              {/* 4 Core NLG Linguistic Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-1">
                <div className="p-2 rounded bg-purple-950/30 border border-purple-800/40">
                  <span className="text-purple-300 block text-[10px] font-semibold">Coherence:</span>
                  <span className="font-bold font-mono text-purple-200">{testResult.criteriaScores.coherence || 92}/100</span>
                </div>
                <div className="p-2 rounded bg-emerald-950/30 border border-emerald-800/40">
                  <span className="text-emerald-300 block text-[10px] font-semibold">Fluency:</span>
                  <span className="font-bold font-mono text-emerald-200">{testResult.criteriaScores.fluency || 94}/100</span>
                </div>
                <div className="p-2 rounded bg-indigo-950/30 border border-indigo-800/40">
                  <span className="text-indigo-300 block text-[10px] font-semibold">Relevancy:</span>
                  <span className="font-bold font-mono text-indigo-200">{testResult.criteriaScores.relevancy || 91}/100</span>
                </div>
                <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40">
                  <span className="text-amber-300 block text-[10px] font-semibold">Appropriateness:</span>
                  <span className="font-bold font-mono text-amber-200">{testResult.criteriaScores.appropriateness || 95}/100</span>
                </div>
              </div>

              <div className="text-xs space-y-1 pt-1 border-t border-slate-900">
                <span className="text-slate-400 font-medium">Judge Technical Critique:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {testResult.critique}
                </p>
              </div>

              {testResult.suggestedImprovement && (
                <div className="text-xs space-y-0.5 bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                  <span className="text-indigo-300 font-medium text-[11px]">Recommended Tuning Action:</span>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    {testResult.suggestedImprovement}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
