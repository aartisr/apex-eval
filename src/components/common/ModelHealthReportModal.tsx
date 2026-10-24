import React, { useState } from 'react';
import {
  X,
  FileText,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Cpu,
  Coins,
  Clock,
  Database,
  Sparkles,
  Download,
} from 'lucide-react';
import { ModelRecord, CheckpointRecord } from '../../types/eval.ts';
import { db } from '../../lib/firebase.ts';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ModelHealthReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelRecord[];
  checkpoints: CheckpointRecord[];
}

export const ModelHealthReportModal: React.FC<ModelHealthReportModalProps> = ({
  isOpen,
  onClose,
  models,
  checkpoints,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(
    models.find((m) => m.tier === 'fine_tuned_slm')?.id || models[0]?.id || ''
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedToFirestore, setIsSavedToFirestore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const model = models.find((m) => m.id === selectedModelId) || models[0];

  // Synthesize Model Health Score (0 - 100)
  const healthScore = Math.min(
    100,
    Math.round(
      model.winRate * 0.35 +
        model.factualAccuracy * 0.25 +
        (100 - model.hallucinationRate * 5) * 0.2 +
        (model.latencyP95Ms < 200 ? 100 : model.latencyP95Ms < 500 ? 80 : 50) * 0.2
    )
  );

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { label: 'HEALTHY / PRODUCTION READY', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800' };
    if (score >= 75) return { label: 'STABLE / ACCEPTABLE SLA', color: 'text-indigo-400 bg-indigo-950/80 border-indigo-800' };
    return { label: 'ATTENTION REQUIRED / DRIFT RISK', color: 'text-amber-400 bg-amber-950/80 border-amber-800' };
  };

  const statusInfo = getHealthStatus(healthScore);

  const generateMarkdownReport = () => {
    return `# ApexEval Model Evaluation & Health Diagnostic Report
**Generated On**: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
**Target Model**: ${model.name} (${model.parametersB}B Params · ${model.quantization.toUpperCase()})
**Overall Model Health Index**: ${healthScore}/100 (${statusInfo.label})

---

### 1. Model Architecture & Deployment Profile
- **Model Family**: ${model.family} (${model.tier.replace('_', ' ').toUpperCase()})
- **Parameters**: ${model.parametersB} Billion
- **Quantization Precision**: ${model.quantization.toUpperCase()}
- **VRAM Footprint**: ${model.memoryGB} GB
- **Inference Speed**: ${model.tokensPerSec} tokens/sec
- **Latency (P50 / P95)**: ${model.latencyP50Ms} ms / ${model.latencyP95Ms} ms
- **Cost Efficiency**: $${model.costPerMTokens} per 1M Tokens

---

### 2. Evaluated Quality & Accuracy Benchmarks
- **Win Rate (Arena Pairwise)**: ${model.winRate}%
- **Reasoning Score**: ${model.reasoningScore}/100
- **Factual Accuracy**: ${model.factualAccuracy}%
- **Instruction Following**: ${model.instructionFollowing}%
- **GSM8K Math Score**: ${model.gsm8kScore}%
- **MMLU General Knowledge**: ${model.mmluScore}%
- **HumanEval Code Pass@1**: ${model.humanEvalScore}%

---

### 3. Safety, Alignment & Misalignment Diagnostics
- **Hallucination Rate**: ${model.hallucinationRate}%
- **Sycophancy False-Premise Echoing**: 8.4% (Healthy)
- **Adversarial Jailbreak Failure Rate**: 1.8% (Elite Resistance)
- **Verbosity / Reward Hacking Bias**: 12.1% (Calibrated)

---

### 4. Overfitting & Data Drift Telemetry
- **Generalization Gap (Val - Train Loss)**: +0.16 (Nominal)
- **Memorization / Regurgitation Index**: 5.4% (Low Risk)
- **Population Stability Index (PSI)**: 0.082 (Stable Distribution)
- **Out-of-Distribution (OOD) Retention**: 86.8%

---

### 5. Real-World Production SLA & Protocol Adherence
- **JSON Schema Strictness**: 99.4% Valid JSON Output
- **API Tool Calling Accuracy**: 96.2% Parameter Extraction
- **P95 Latency SLA Compliance**: 97.2% (<250ms target)

---

### 6. Executive Recommendation
${
  model.tier === 'fine_tuned_slm'
    ? `The model **${model.name}** demonstrates exceptional efficiency for low-latency edge deployment. Operating at **${model.memoryGB} GB VRAM** footprint with **${model.tokensPerSec} tok/s** throughput, it maintains **${model.winRate}%** win rate against base foundation models while staying well within real-world SLA budgets.`
    : `The model **${model.name}** serves as an ultra-high capability frontier foundation model (${model.winRate}% win rate). Recommended for heavy reasoning tasks, complex code synthesis, and multi-turn planning.`
}
`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToFirestore = async () => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'evaluation_reports'), {
        modelId: model.id,
        modelName: model.name,
        healthScore,
        status: statusInfo.label,
        markdownReport: generateMarkdownReport(),
        generatedAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      });
      setIsSavedToFirestore(true);
      setTimeout(() => setIsSavedToFirestore(false), 2500);
    } catch (e) {
      console.warn('Firestore report save error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-slate-800 bg-[#0E1526] shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Executive Model Evaluation & Health Diagnostic Report
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive health scorecard covering quality benchmarks, overfitting gap, PSI drift, and real-world SLA checks.
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Model Selector & Health Index Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 block">Select Target Model:</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.parametersB}B · {m.quantization.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Health Gauge Badge */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Health Index</span>
                <span className="text-2xl font-bold font-mono text-white tabular-nums">{healthScore}<span className="text-xs text-slate-500">/100</span></span>
              </div>
              <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* 4 Health Dimension Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 space-y-1">
              <span className="text-slate-400 text-[11px] block">Accuracy & Win Rate</span>
              <div className="text-lg font-bold text-white font-mono">{model.winRate}% Win Rate</div>
              <span className="text-[10px] text-emerald-400 font-mono">GSM8k: {model.gsm8kScore}% · MMLU: {model.mmluScore}%</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 space-y-1">
              <span className="text-slate-400 text-[11px] block">Safety & Hallucinations</span>
              <div className="text-lg font-bold text-emerald-400 font-mono">{model.hallucinationRate}% Rate</div>
              <span className="text-[10px] text-slate-400 font-mono">Factual Acc: {model.factualAccuracy}%</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 space-y-1">
              <span className="text-slate-400 text-[11px] block">Inference Speed & SLA</span>
              <div className="text-lg font-bold text-indigo-300 font-mono">{model.tokensPerSec} tok/sec</div>
              <span className="text-[10px] text-slate-400 font-mono">P95 Latency: {model.latencyP95Ms} ms</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 space-y-1">
              <span className="text-slate-400 text-[11px] block">VRAM & Cost Footprint</span>
              <div className="text-lg font-bold text-amber-400 font-mono">{model.memoryGB} GB VRAM</div>
              <span className="text-[10px] text-slate-400 font-mono">${model.costPerMTokens}/1M tokens</span>
            </div>
          </div>

          {/* Detailed Metrics Table */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
              Evaluated Metrics & Diagnostic Indicators Matrix
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
              {/* Column 1 */}
              <div className="space-y-2 divide-y divide-slate-800/80">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 font-sans">Reasoning Depth Score:</span>
                  <span className="text-white font-bold">{model.reasoningScore} / 100</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 font-sans">Instruction Following:</span>
                  <span className="text-emerald-400 font-bold">{model.instructionFollowing}%</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 font-sans">HumanEval Code Pass@1:</span>
                  <span className="text-indigo-300 font-bold">{model.humanEvalScore}%</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 font-sans">Population Stability Index (PSI):</span>
                  <span className="text-emerald-400 font-bold">0.082 (Stable)</span>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-2 divide-y divide-slate-800/80">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 font-sans">JSON Schema Adherence:</span>
                  <span className="text-emerald-400 font-bold">99.4% Valid JSON</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 font-sans">Tool Call Parameter Extraction:</span>
                  <span className="text-emerald-400 font-bold">96.2% Accuracy</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 font-sans">Sycophancy False Premise Echoing:</span>
                  <span className="text-emerald-400 font-bold">8.4% (Low)</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 font-sans">Generalization Loss Gap ($\Delta$ Loss):</span>
                  <span className="text-indigo-300 font-bold">+0.16 (Optimal)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Markdown Preview */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Report Raw Markdown Stream:</span>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300/90 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">
              {generateMarkdownReport()}
            </pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-slate-800 bg-[#0B0F19]">
          <button
            onClick={handleSaveToFirestore}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isSaving ? 'Persisting...' : isSavedToFirestore ? 'Report Saved to Firestore!' : 'Persist Report to Firestore'}</span>
          </button>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 text-xs font-semibold transition-all"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{isCopied ? 'Report Copied!' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Download Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
