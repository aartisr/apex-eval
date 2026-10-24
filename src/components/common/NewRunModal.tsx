import React, { useState } from 'react';
import { X, Play, Layers, CheckSquare, Square } from 'lucide-react';
import { BenchmarkSuite, ModelRecord } from '../../types/eval.ts';

interface NewRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  suites: BenchmarkSuite[];
  models: ModelRecord[];
  onStartRun: (suiteId: string, modelIds: string[]) => void;
}

export const NewRunModal: React.FC<NewRunModalProps> = ({
  isOpen,
  onClose,
  suites,
  models,
  onStartRun,
}) => {
  const [suiteId, setSuiteId] = useState<string>(suites[0]?.id || '');
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([
    'gemini-3.8-flash',
    'gemma-2-2b-math-dpo-q4',
    'llama-3-1-8b-instruct-dpo-q4',
  ]);

  if (!isOpen) return null;

  const toggleModel = (id: string) => {
    setSelectedModelIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleLaunch = () => {
    onStartRun(suiteId, selectedModelIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-[#0E1526] shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Launch Evaluation Run
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select golden dataset and target LLMs / SLMs to evaluate.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Suite Select */}
        <div className="space-y-1.5 text-xs">
          <label className="font-semibold text-slate-300">
            Target Benchmark Suite:
          </label>
          <select
            value={suiteId}
            onChange={(e) => setSuiteId(e.target.value)}
            className="w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            {suites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.tasks.length} tasks) · {s.domain}
              </option>
            ))}
          </select>
        </div>

        {/* Model Checkbox List */}
        <div className="space-y-2 text-xs">
          <label className="font-semibold text-slate-300">
            Select Models to Include ({selectedModelIds.length} selected):
          </label>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-800 rounded-md p-2 bg-slate-950/60">
            {models.map((m) => {
              const isChecked = selectedModelIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggleModel(m.id)}
                  className="flex items-center justify-between p-2 rounded hover:bg-slate-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {isChecked ? (
                      <CheckSquare className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-600" />
                    )}
                    <span className="text-slate-200 font-medium">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>{m.parametersB}B</span>
                    <span>·</span>
                    <span className="uppercase">{m.quantization}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            disabled={selectedModelIds.length === 0}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Start Benchmark Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};
