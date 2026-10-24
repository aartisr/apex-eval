import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  HardDrive,
  Tag,
  FileText,
  Edit3,
  Eye,
  Plus,
  X,
  Save,
  Check,
  Bookmark,
  Bold,
  Italic,
  List,
  Code,
} from 'lucide-react';
import { CheckpointRecord, QuantizationType } from '../../types/eval.ts';
import { QuantizationTradeoffScatter } from './QuantizationTradeoffScatter.tsx';
import { db } from '../../lib/firebase.ts';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface CheckpointInspectorProps {
  checkpoints: CheckpointRecord[];
  searchQuery?: string;
  selectedCheckpointIdOverride?: string;
}

const formatInlineMarkdown = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-slate-900 text-emerald-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-800">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const renderSimpleMarkdown = (mdText: string) => {
  if (!mdText || !mdText.trim()) {
    return <p className="text-slate-500 italic text-xs">No custom markdown annotation provided yet. Click &quot;Edit Markdown&quot; to add evaluation notes.</p>;
  }

  const lines = mdText.split('\n');
  return (
    <div className="space-y-1.5 text-xs text-slate-200">
      {lines.map((line, idx) => {
        if (line.startsWith('### ')) {
          return <h3 key={idx} className="text-xs font-bold text-indigo-300 mt-2 mb-1 uppercase tracking-wider">{line.replace('### ', '')}</h3>;
        } else if (line.startsWith('## ')) {
          return <h2 key={idx} className="text-sm font-bold text-white mt-2 mb-1">{line.replace('## ', '')}</h2>;
        } else if (line.startsWith('# ')) {
          return <h1 key={idx} className="text-base font-bold text-white mt-2 mb-1">{line.replace('# ', '')}</h1>;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          const content = line.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 ml-1">
              <span className="text-indigo-400 font-bold">•</span>
              <span>{formatInlineMarkdown(content)}</span>
            </div>
          );
        } else if (line.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-2 border-indigo-500 pl-3 py-1 text-slate-300 italic bg-indigo-950/20 rounded-r text-[11px]">
              {formatInlineMarkdown(line.replace('> ', ''))}
            </blockquote>
          );
        } else if (line.trim() === '') {
          return <div key={idx} className="h-0.5" />;
        }
        return <p key={idx} className="leading-relaxed">{formatInlineMarkdown(line)}</p>;
      })}
    </div>
  );
};

export const CheckpointInspector: React.FC<CheckpointInspectorProps> = ({
  checkpoints,
  searchQuery,
  selectedCheckpointIdOverride,
}) => {
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string>(
    selectedCheckpointIdOverride || checkpoints[checkpoints.length - 1]?.id || 'cp-5'
  );

  // Update selected if override passed
  React.useEffect(() => {
    if (selectedCheckpointIdOverride) {
      setSelectedCheckpointId(selectedCheckpointIdOverride);
    }
  }, [selectedCheckpointIdOverride]);

  // Annotations & Tags State mapped by checkpoint ID
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, { tags: string[]; annotation: string }>>(() => {
    const initial: Record<string, { tags: string[]; annotation: string }> = {};
    checkpoints.forEach((cp) => {
      initial[cp.id] = {
        tags: cp.tags || ['#Evaluation-Candidate'],
        annotation: cp.markdownAnnotation || `### Evaluation Notes for ${cp.modelName}\n- **Loss**: \`${cp.trainLoss.toFixed(2)}\`\n- **Win Rate**: **${cp.winRate}%**`,
      };
    });
    return initial;
  });

  const [activeEditorTab, setActiveEditorTab] = useState<'preview' | 'edit'>('preview');
  const [editingAnnotation, setEditingAnnotation] = useState<string>('');
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [isSavedInFirestore, setIsSavedInFirestore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync editingAnnotation state whenever selectedCheckpointId changes
  useEffect(() => {
    if (selectedCheckpointId && annotationsMap[selectedCheckpointId]) {
      setEditingAnnotation(annotationsMap[selectedCheckpointId].annotation || '');
    }
  }, [selectedCheckpointId, annotationsMap]);

  const filteredCheckpoints = React.useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return checkpoints;
    const q = searchQuery.toLowerCase();
    const matched = checkpoints.filter((cp) => {
      const data = annotationsMap[cp.id];
      const hasMatchingTag = data?.tags.some((t) => t.toLowerCase().includes(q));
      const hasMatchingAnnotation = data?.annotation.toLowerCase().includes(q);
      return (
        cp.modelName.toLowerCase().includes(q) ||
        cp.alignmentMethod.toLowerCase().includes(q) ||
        cp.quantization.toLowerCase().includes(q) ||
        cp.notes.toLowerCase().includes(q) ||
        hasMatchingTag ||
        hasMatchingAnnotation
      );
    });
    return matched.length > 0 ? matched : checkpoints;
  }, [checkpoints, searchQuery, annotationsMap]);

  const selectedCheckpoint =
    filteredCheckpoints.find((c) => c.id === selectedCheckpointId) ||
    filteredCheckpoints[filteredCheckpoints.length - 1] ||
    checkpoints[0];

  const currentAnnotationData = annotationsMap[selectedCheckpoint.id] || { tags: [], annotation: '' };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    let tag = newTagInput.trim();
    if (!tag.startsWith('#')) tag = `#${tag}`;

    const currentTags = currentAnnotationData.tags || [];
    if (!currentTags.includes(tag)) {
      const updatedTags = [...currentTags, tag];
      const updatedMap = {
        ...annotationsMap,
        [selectedCheckpoint.id]: {
          ...currentAnnotationData,
          tags: updatedTags,
        },
      };
      setAnnotationsMap(updatedMap);
      saveToFirestore(selectedCheckpoint.id, updatedTags, currentAnnotationData.annotation);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = (currentAnnotationData.tags || []).filter((t) => t !== tagToRemove);
    const updatedMap = {
      ...annotationsMap,
      [selectedCheckpoint.id]: {
        ...currentAnnotationData,
        tags: updatedTags,
      },
    };
    setAnnotationsMap(updatedMap);
    saveToFirestore(selectedCheckpoint.id, updatedTags, currentAnnotationData.annotation);
  };

  const handleSaveAnnotation = async () => {
    setIsSaving(true);
    const updatedMap = {
      ...annotationsMap,
      [selectedCheckpoint.id]: {
        ...currentAnnotationData,
        annotation: editingAnnotation,
      },
    };
    setAnnotationsMap(updatedMap);
    await saveToFirestore(selectedCheckpoint.id, currentAnnotationData.tags, editingAnnotation);
    setIsSaving(false);
    setIsSavedInFirestore(true);
    setTimeout(() => setIsSavedInFirestore(false), 2500);
  };

  const saveToFirestore = async (cpId: string, tags: string[], annotation: string) => {
    try {
      await setDoc(
        doc(db, 'checkpoint_annotations', cpId),
        {
          cpId,
          tags,
          annotation,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore annotation save warning:', e);
    }
  };

  const insertMarkdownFormatting = (prefix: string, suffix: string = '') => {
    setEditingAnnotation((prev) => prev + `${prefix}Text${suffix}`);
  };

  // Base checkpoint for delta calculations
  const baseCheckpoint = checkpoints[0];

  return (
    <div className="space-y-6">
      {/* Title & Domain Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display">
            Fine-Tuning Checkpoint Progression & Alignment
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Track loss convergence, alignment shifts (SFT vs. DPO), and quantization efficiency curves across training steps
            for small language models (Gemma-2-2B Fine-Tuning Run).
          </p>
        </div>

        {/* Quantization Metric Tag */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Max Compression</span>
            <span className="text-emerald-400 font-bold font-mono">1.8 GB VRAM (Q4_K_M)</span>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Accuracy Retention</span>
            <span className="text-indigo-300 font-bold font-mono">98.9% of FP16</span>
          </div>
        </div>
      </div>

      {/* Checkpoint Progression Stepper */}
      <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Training Epoch Pipeline
          </span>
          <span className="text-xs text-slate-400">
            Select checkpoint to inspect parameter delta
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {filteredCheckpoints.map((cp, idx) => {
            const isSelected = cp.id === selectedCheckpointId;
            return (
              <button
                key={cp.id}
                onClick={() => setSelectedCheckpointId(cp.id)}
                className={`flex flex-col p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-mono text-slate-400">
                    Step {cp.step}
                  </span>
                  <span
                    className={`text-[9px] uppercase font-mono px-1 rounded ${
                      cp.alignmentMethod === 'dpo'
                        ? 'text-indigo-400 bg-indigo-950'
                        : 'text-slate-400 bg-slate-900'
                    }`}
                  >
                    {cp.quantization}
                  </span>
                </div>

                <span className="text-xs font-bold text-white mt-1.5 line-clamp-1">
                  Epoch {cp.epoch} ({cp.alignmentMethod.toUpperCase()})
                </span>

                <div className="mt-3 flex items-center justify-between text-[11px] tabular-nums border-t border-slate-800/80 pt-2 text-slate-400">
                  <span>Win Rate:</span>
                  <span className="font-semibold text-slate-200">{cp.winRate}%</span>
                </div>

                <div className="flex items-center justify-between text-[11px] tabular-nums text-slate-500">
                  <span>Loss:</span>
                  <span className="font-mono">{cp.trainLoss.toFixed(2)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Checkpoint Detailed Deep Dive */}
      {selectedCheckpoint && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Inspection Card */}
          <div className="lg:col-span-2 rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white font-display">
                  {selectedCheckpoint.modelName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Alignment Method: <strong className="text-indigo-300 uppercase font-mono">{selectedCheckpoint.alignmentMethod}</strong> · Format: <strong className="text-emerald-400 uppercase font-mono">{selectedCheckpoint.quantization}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Training Step:</span>
                <span className="font-mono text-xs font-semibold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {selectedCheckpoint.step.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Metrics Compared to Base Weights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Win Rate vs Base</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-bold text-emerald-400 tabular-nums">
                    {selectedCheckpoint.winRate}%
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    +{((selectedCheckpoint.winRate - baseCheckpoint.winRate)).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Reasoning Depth</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-bold text-slate-100 tabular-nums">
                    {selectedCheckpoint.reasoningScore}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    +{(selectedCheckpoint.reasoningScore - baseCheckpoint.reasoningScore).toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Train Loss</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-bold text-indigo-400 tabular-nums font-mono">
                    {selectedCheckpoint.trainLoss.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-indigo-300 font-mono">
                    (val: {selectedCheckpoint.valLoss.toFixed(2)})
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400">VRAM Footprint</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-bold text-slate-100 tabular-nums font-mono">
                    {selectedCheckpoint.memoryGB} GB
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    -{(((baseCheckpoint.memoryGB - selectedCheckpoint.memoryGB) / baseCheckpoint.memoryGB) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Checkpoint Notes & Rationale */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs space-y-1">
              <span className="font-semibold text-slate-300">Engineering Rationale & Observations:</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {selectedCheckpoint.notes}
              </p>
            </div>
          </div>

          {/* Quantization Tradeoff Analysis */}
          <div className="rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
            <div className="pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white font-display">
                Quantization ROI Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Impact of 4-bit and 8-bit quantization on SLM deployment viability.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>FP16 (Base Full Precision):</span>
                  <span className="font-mono text-slate-400">5.2 GB · 100% Acc</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-500 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Q8 (8-bit Quantized):</span>
                  <span className="font-mono text-emerald-400">2.8 GB · 99.4% Acc</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '54%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Q4_K_M (4-bit Production Edge):</span>
                  <span className="font-mono text-emerald-400">1.8 GB · 98.9% Acc</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '35%' }} />
                </div>
              </div>
            </div>

            <div className="p-3 rounded bg-indigo-950/30 border border-indigo-900/50 text-[11px] text-indigo-300 leading-relaxed">
              <strong>Recommendation:</strong> Deploying the <strong>Q4_K_M</strong> quantized checkpoint yields a 65% memory reduction, allowing real-time 285 tok/s local inference on commodity consumer GPUs or mobile NPUs without sacrificing mathematical reasoning fidelity.
            </div>
          </div>

          {/* Custom Markdown Context Annotation & Tagging Studio */}
          <div className="lg:col-span-3 rounded-lg border border-slate-800 bg-[#0E1526] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-display">
                  Evaluation Context Tracking & Custom Markdown Annotations
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  Firestore Persisted
                </span>
              </div>

              {/* Mode Buttons: Preview / Edit + Save */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveEditorTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all ${
                      activeEditorTab === 'preview'
                        ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => setActiveEditorTab('edit')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all ${
                      activeEditorTab === 'edit'
                        ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Markdown</span>
                  </button>
                </div>

                <button
                  onClick={handleSaveAnnotation}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSavedInFirestore ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                  <span>{isSaving ? 'Saving...' : isSavedInFirestore ? 'Saved to Firestore!' : 'Save Notes'}</span>
                </button>
              </div>
            </div>

            {/* Custom Tags Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-indigo-400" />
                  Custom Checkpoint Metadata Tags:
                </span>
                <span className="text-[10px] text-slate-500">Press Enter or click + Tag to attach custom tags</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(currentAnnotationData.tags || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2.5 py-1 rounded-md"
                  >
                    <span>{t}</span>
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-rose-400 transition-colors p-0.5"
                      title="Remove Tag"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="New tag e.g. #Quantized"
                    className="w-36 rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddTag}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title="Add Tag"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Markdown Editor / Preview Box */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              {activeEditorTab === 'edit' && (
                <div className="space-y-2">
                  {/* Markdown Toolbar */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded border border-slate-800 text-xs text-slate-400">
                    <button
                      onClick={() => insertMarkdownFormatting('### ')}
                      className="p-1 hover:bg-slate-800 rounded hover:text-slate-200 font-bold text-[11px]"
                      title="Header 3"
                    >
                      H3
                    </button>
                    <button
                      onClick={() => insertMarkdownFormatting('**', '**')}
                      className="p-1 hover:bg-slate-800 rounded hover:text-slate-200"
                      title="Bold"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => insertMarkdownFormatting('- ')}
                      className="p-1 hover:bg-slate-800 rounded hover:text-slate-200"
                      title="Bullet List"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => insertMarkdownFormatting('> ')}
                      className="p-1 hover:bg-slate-800 rounded hover:text-slate-200 italic font-mono text-[11px]"
                      title="Quote"
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => insertMarkdownFormatting('`', '`')}
                      className="p-1 hover:bg-slate-800 rounded hover:text-slate-200"
                      title="Inline Code"
                    >
                      <Code className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={editingAnnotation}
                    onChange={(e) => setEditingAnnotation(e.target.value)}
                    placeholder="Type markdown notes e.g., ### Training Notes\n- Verified loss convergence..."
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>
              )}

              {activeEditorTab === 'preview' && (
                <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 min-h-28">
                  {renderSimpleMarkdown(currentAnnotationData.annotation)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quantization Multi-Parametric Trade-off Scatter Matrix */}
      <QuantizationTradeoffScatter searchQuery={searchQuery} />
    </div>
  );
};
