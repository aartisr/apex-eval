import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Sparkles,
  Database,
  RefreshCw,
  Search,
  X,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { RedisCacheStats, ModelRecord, CheckpointRecord } from '../types/eval.ts';

interface NavbarProps {
  activeTab: 'matrix' | 'arena' | 'checkpoints' | 'benchmarks' | 'rubric' | 'drift';
  onSelectTab: (tab: 'matrix' | 'arena' | 'checkpoints' | 'benchmarks' | 'rubric' | 'drift') => void;
  onOpenNewRun: () => void;
  cacheStats: RedisCacheStats | null;
  onRefreshCache: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  models: ModelRecord[];
  checkpoints: CheckpointRecord[];
  onSelectModel: (modelId: string, targetTab?: 'matrix' | 'arena') => void;
  onSelectCheckpoint: (checkpointId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewRun,
  cacheStats,
  onRefreshCache,
  searchQuery,
  onSearchChange,
  models,
  checkpoints,
  onSelectModel,
  onSelectCheckpoint,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey listener: '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matching models
  const matchingModels = searchQuery.trim()
    ? models.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.tier.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.quantization.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Filter matching checkpoints
  const matchingCheckpoints = searchQuery.trim()
    ? checkpoints.filter(
        (cp) =>
          cp.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cp.alignmentMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cp.quantization.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cp.notes.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const hasResults = matchingModels.length > 0 || matchingCheckpoints.length > 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0B0F19]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('matrix')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold text-sm tracking-wider">
              AE
            </div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              ApexEval
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onSelectTab('matrix')}
            className={`whitespace-nowrap transition-colors pb-0.5 border-b-2 ${
              activeTab === 'matrix'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Matrix
          </button>
          <button
            onClick={() => onSelectTab('arena')}
            className={`whitespace-nowrap transition-colors pb-0.5 border-b-2 ${
              activeTab === 'arena'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Arena
          </button>
          <button
            onClick={() => onSelectTab('checkpoints')}
            className={`whitespace-nowrap transition-colors pb-0.5 border-b-2 ${
              activeTab === 'checkpoints'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Checkpoints
          </button>
          <button
            onClick={() => onSelectTab('benchmarks')}
            className={`whitespace-nowrap transition-colors pb-0.5 border-b-2 ${
              activeTab === 'benchmarks'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Harness
          </button>
          <button
            onClick={() => onSelectTab('rubric')}
            className={`whitespace-nowrap transition-colors pb-0.5 border-b-2 ${
              activeTab === 'rubric'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Rubric
          </button>
          <button
            onClick={() => onSelectTab('drift')}
            className={`whitespace-nowrap transition-colors pb-0.5 border-b-2 ${
              activeTab === 'drift'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Drift & Alignment
          </button>
        </nav>

        {/* Global Search Bar (with Quick Results Dropdown) */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-xs md:max-w-sm">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search models, SLMs, checkpoints..."
              className="w-full rounded-md border border-slate-800 bg-slate-900/90 py-1.5 pl-8 pr-14 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  onClick={() => {
                    onSearchChange('');
                    setIsOpen(false);
                  }}
                  className="p-0.5 text-slate-500 hover:text-slate-300"
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block rounded border border-slate-800 bg-slate-950 px-1 py-0.5 text-[10px] font-mono text-slate-500">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Search Dropdown Panel */}
          {isOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 max-h-96 overflow-y-auto rounded-lg border border-slate-800 bg-[#0E1526]/98 p-2 shadow-2xl backdrop-blur-md z-50 text-xs space-y-3">
              {/* Models Section */}
              {matchingModels.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                    Models ({matchingModels.length})
                  </span>
                  <div className="space-y-1">
                    {matchingModels.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-900/90 transition-colors group cursor-pointer"
                        onClick={() => {
                          onSelectModel(m.id, 'matrix');
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-indigo-400 font-mono">
                              {m.parametersB}B · {m.quantization.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {m.tier === 'fine_tuned_slm' ? 'Fine-Tuned SLM' : m.tier === 'foundation_llm' ? 'Frontier LLM' : 'Base SLM'} · Win Rate: {m.winRate}%
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectModel(m.id, 'arena');
                              setIsOpen(false);
                            }}
                            className="px-2 py-0.5 text-[10px] rounded bg-indigo-950 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900"
                          >
                            Arena
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkpoints Section */}
              {matchingCheckpoints.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                    Fine-Tuning Checkpoints ({matchingCheckpoints.length})
                  </span>
                  <div className="space-y-1">
                    {matchingCheckpoints.slice(0, 4).map((cp) => (
                      <div
                        key={cp.id}
                        onClick={() => {
                          onSelectCheckpoint(cp.id);
                          setIsOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-900/90 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-200">
                              {cp.modelName}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Step {cp.step}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Loss: {cp.trainLoss.toFixed(2)} · Win Rate: {cp.winRate}% · {cp.quantization.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          Epochs <ArrowRight className="h-2.5 w-2.5" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!hasResults && (
                <div className="py-4 text-center text-slate-500 text-xs">
                  No models or checkpoints match &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Zone 3: 1 primary action + Unboxed cache telemetry */}
        <div className="flex items-center gap-3 shrink-0">
          {cacheStats && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 tabular-nums">
              <span className="text-slate-500">Redis:</span>
              <span className="font-semibold text-emerald-400">{cacheStats.hitRatioPercent}%</span>
              <button
                onClick={onRefreshCache}
                title="Refresh Cache Stats"
                className="p-1 hover:text-slate-200 transition-colors text-slate-500"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          )}

          <button
            onClick={onOpenNewRun}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all whitespace-nowrap shrink-0"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span className="hidden sm:inline">Run Evaluation</span>
            <span className="sm:hidden">Run</span>
          </button>
        </div>
      </div>
    </header>
  );
};
