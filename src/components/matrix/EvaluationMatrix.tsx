import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  Gauge,
  DollarSign,
  Grid,
  Table,
  Scale,
  Trophy,
} from 'lucide-react';
import { ModelRecord, ModelTier, QuantizationType } from '../../types/eval.ts';
import { PerformanceTrendChart } from './PerformanceTrendChart.tsx';
import { BenchmarkHeatmap } from './BenchmarkHeatmap.tsx';
import { ModelScoreDiffModal } from './ModelScoreDiffModal.tsx';
import { GlobalLeaderboard } from './GlobalLeaderboard.tsx';

interface EvaluationMatrixProps {
  models: ModelRecord[];
  onSelectForArena: (modelId: string) => void;
  onInspectCheckpoints: (modelId: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const EvaluationMatrix: React.FC<EvaluationMatrixProps> = ({
  models,
  onSelectForArena,
  onInspectCheckpoints,
  searchQuery: externalSearchQuery,
  onSearchChange,
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'winRate', desc: true },
  ]);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = (q: string) => {
    if (onSearchChange) onSearchChange(q);
    setInternalSearchQuery(q);
  };

  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedQuant, setSelectedQuant] = useState<string>('all');
  const [maxParams, setMaxParams] = useState<number>(150);
  const [isChartVisible, setIsChartVisible] = useState(true);
  const [activeViewTab, setActiveViewTab] = useState<'both' | 'leaderboard' | 'heatmap' | 'table'>('both');
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffModelAId, setDiffModelAId] = useState<string>('gemini-3.8-flash');
  const [diffModelBId, setDiffModelBId] = useState<string>('gemma-2-2b-math-dpo-q4');

  // Filtered dataset
  const filteredData = useMemo(() => {
    return models.filter((item) => {
      // Search
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.quantization.toLowerCase().includes(searchQuery.toLowerCase());

      // Tier
      const matchesTier =
        selectedTier === 'all' || item.tier === selectedTier;

      // Quantization
      const matchesQuant =
        selectedQuant === 'all' || item.quantization.toLowerCase() === selectedQuant.toLowerCase();

      // Parameter limit
      const matchesParams = item.parametersB <= maxParams;

      return matchesSearch && matchesTier && matchesQuant && matchesParams;
    });
  }, [models, searchQuery, selectedTier, selectedQuant, maxParams]);

  // Define columns with TanStack Table
  const columns = useMemo<ColumnDef<ModelRecord>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Model & Architecture',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-col py-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-sm">
                  {row.name}
                </span>
                {row.tier === 'fine_tuned_slm' && (
                  <span className="text-[10px] text-indigo-400 font-medium">
                    FT-SLM
                  </span>
                )}
                {row.tier === 'foundation_llm' && (
                  <span className="text-[10px] text-amber-400 font-medium">
                    LLM
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{row.family}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="tabular-nums font-mono">{row.parametersB}B Params</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="uppercase font-mono text-[11px]">{row.quantization}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'winRate',
        header: 'Win Rate',
        cell: (info) => {
          const val = Number(info.getValue());
          const isHigh = val >= 85;
          return (
            <div className="flex items-center gap-2 tabular-nums">
              <span className={`font-semibold ${isHigh ? 'text-emerald-400' : 'text-slate-300'}`}>
                {val.toFixed(1)}%
              </span>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                <div
                  className={`h-full ${isHigh ? 'bg-emerald-500' : 'bg-slate-400'}`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'reasoningScore',
        header: 'Reasoning',
        cell: (info) => (
          <span className="tabular-nums font-medium text-slate-200">
            {Number(info.getValue()).toFixed(1)}
          </span>
        ),
      },
      {
        accessorKey: 'perplexity',
        header: 'Perplexity (PPL)',
        cell: (info) => {
          const val = Number(info.getValue() || 0);
          if (!val) return <span className="text-slate-500 font-mono text-xs">N/A</span>;
          const isLowPpl = val <= 3.5;
          return (
            <span className={`tabular-nums font-mono text-xs font-semibold px-1.5 py-0.5 rounded ${isLowPpl ? 'text-purple-300 bg-purple-950/80 border border-purple-800/50' : 'text-slate-300'}`}>
              {val.toFixed(2)} PPL
            </span>
          );
        },
      },
      {
        accessorKey: 'precisionScore',
        header: 'Precision',
        cell: (info) => {
          const val = Number(info.getValue() || 0);
          if (!val) return <span className="text-slate-500 font-mono text-xs">N/A</span>;
          return (
            <span className={`tabular-nums font-mono text-xs ${val >= 90 ? 'text-emerald-400 font-semibold' : 'text-slate-300'}`}>
              {val.toFixed(1)}%
            </span>
          );
        },
      },
      {
        accessorKey: 'gsm8kScore',
        header: 'GSM8k (Math)',
        cell: (info) => (
          <span className="tabular-nums text-slate-300">
            {Number(info.getValue()).toFixed(1)}%
          </span>
        ),
      },
      {
        accessorKey: 'mmluScore',
        header: 'MMLU-Pro',
        cell: (info) => (
          <span className="tabular-nums text-slate-300">
            {Number(info.getValue()).toFixed(1)}%
          </span>
        ),
      },
      {
        accessorKey: 'latencyP50Ms',
        header: 'Latency p50',
        cell: (info) => {
          const val = Number(info.getValue());
          return (
            <span className={`tabular-nums font-mono text-xs ${val < 70 ? 'text-emerald-400 font-semibold' : 'text-slate-300'}`}>
              {val} ms
            </span>
          );
        },
      },
      {
        accessorKey: 'tokensPerSec',
        header: 'Throughput',
        cell: (info) => (
          <span className="tabular-nums font-mono text-xs text-slate-300">
            {Number(info.getValue())} tok/s
          </span>
        ),
      },
      {
        accessorKey: 'memoryGB',
        header: 'VRAM Footprint',
        cell: (info) => {
          const val = Number(info.getValue());
          return (
            <span className={`tabular-nums font-mono text-xs ${val <= 4.0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {val.toFixed(1)} GB
            </span>
          );
        },
      },
      {
        accessorKey: 'costPerMTokens',
        header: 'Cost / 1M Tok',
        cell: (info) => {
          const val = Number(info.getValue());
          return (
            <span className={`tabular-nums font-mono text-xs ${val <= 0.01 ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
              ${val.toFixed(3)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Evaluation Actions',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setDiffModelBId(row.id);
                  setIsDiffModalOpen(true);
                }}
                className="px-2 py-1 text-xs rounded border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 transition-colors"
                title="View side-by-side score and quantization diff"
              >
                Diff
              </button>
              <button
                onClick={() => onSelectForArena(row.id)}
                className="px-2.5 py-1 text-xs rounded border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                title="Load into Arena comparison"
              >
                Arena
              </button>
              {row.family === 'Gemma' && (
                <button
                  onClick={() => onInspectCheckpoints(row.id)}
                  className="px-2.5 py-1 text-xs rounded border border-indigo-700/60 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 transition-colors"
                  title="View fine-tuning epoch progression"
                >
                  Epochs
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [onSelectForArena, onInspectCheckpoints]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Editorial Header & Value Anchor */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display">
            Multidimensional Evaluation Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Benchmarking frontier foundation LLMs alongside domain-specialized Small Language Models (SLMs)
            across reasoning depth, accuracy, execution latency, and quantization efficiency.
          </p>
        </div>

        {/* Quantization Tradeoff Insight */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-xs">
          <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
          <div className="text-slate-300">
            <span className="text-white font-semibold">Fine-Tuning Tradeoff Insight:</span>{' '}
            <span className="text-slate-400">
              Gemma-2-2B DPO Q4 achieves <span className="text-emerald-400 font-semibold">91.2%</span> of Frontier Flash reasoning at <span className="text-indigo-300 font-semibold">1/19th cost</span> and <span className="text-indigo-300 font-semibold">1.8GB VRAM</span>.
            </span>
          </div>
        </div>
      </div>

      {/* Performance Progression & Checkpoint Evolution Trend Chart */}
      <PerformanceTrendChart
        isVisible={isChartVisible}
        onToggleVisibility={() => setIsChartVisible(!isChartVisible)}
      />

      {/* Filter and Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
        {/* Search Input */}
        <div className="relative min-w-[220px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search model, family, tier..."
            className="w-full rounded-md border border-slate-800 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Architecture Tier Segmented Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedTier('all')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              selectedTier === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Tiers
          </button>
          <button
            onClick={() => setSelectedTier('fine_tuned_slm')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              selectedTier === 'fine_tuned_slm'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fine-Tuned SLMs
          </button>
          <button
            onClick={() => setSelectedTier('foundation_llm')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              selectedTier === 'foundation_llm'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Frontier LLMs
          </button>
          <button
            onClick={() => setSelectedTier('base_slm')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              selectedTier === 'base_slm'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Base SLMs
          </button>
        </div>

        {/* Quantization Filter */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs">
          <span className="text-[11px] text-slate-500 px-2 font-medium">Quant:</span>
          {['all', 'fp16', 'q8', 'q4_k_m'].map((q) => (
            <button
              key={q}
              onClick={() => setSelectedQuant(q)}
              className={`px-2 py-0.5 rounded font-mono uppercase text-[11px] transition-colors ${
                selectedQuant === q
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Parameter Size Slider */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500">Max Size:</span>
          <input
            type="range"
            min="2"
            max="150"
            step="1"
            value={maxParams}
            onChange={(e) => setMaxParams(Number(e.target.value))}
            className="w-20 accent-indigo-500"
          />
          <span className="font-mono text-slate-300 tabular-nums w-10">
            {maxParams >= 150 ? 'All' : `${maxParams}B`}
          </span>
        </div>

        {/* View Mode Segmented Switch */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs flex-wrap">
          <button
            onClick={() => setActiveViewTab('leaderboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              activeViewTab === 'leaderboard'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Global model ranking leaderboard"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Leaderboard</span>
          </button>
          <button
            onClick={() => setActiveViewTab('heatmap')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              activeViewTab === 'heatmap'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Benchmark chromatic heatmap overview"
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Heatmap</span>
          </button>
          <button
            onClick={() => setActiveViewTab('table')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              activeViewTab === 'table'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Detailed TanStack Table data grid"
          >
            <Table className="h-3.5 w-3.5" />
            <span>Data Grid</span>
          </button>
          <button
            onClick={() => setActiveViewTab('both')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              activeViewTab === 'both'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Combined view"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Combined</span>
          </button>
        </div>

        {/* Side-by-Side Score & Quant Diff Modal Trigger */}
        <button
          onClick={() => setIsDiffModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-colors shrink-0"
          title="Compare benchmark scores and quantization diff side-by-side"
        >
          <Scale className="h-3.5 w-3.5 text-indigo-400" />
          <span>Side-by-Side Diff</span>
        </button>
      </div>

      {/* Global Model Leaderboard */}
      {(activeViewTab === 'leaderboard' || activeViewTab === 'both') && (
        <GlobalLeaderboard
          models={filteredData}
          onSelectForArena={onSelectForArena}
          onInspectCheckpoints={onInspectCheckpoints}
          onOpenDiff={(id) => {
            setDiffModelBId(id);
            setIsDiffModalOpen(true);
          }}
        />
      )}

      {/* Benchmark Chromatic Heatmap Matrix */}
      {(activeViewTab === 'heatmap' || activeViewTab === 'both') && (
        <BenchmarkHeatmap
          models={filteredData}
          onSelectForArena={onSelectForArena}
          onInspectCheckpoints={onInspectCheckpoints}
        />
      )}

      {/* TanStack High-Performance Table Container */}
      {(activeViewTab === 'table' || activeViewTab === 'both') && (
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0E1526]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-slate-800 bg-slate-950/70 text-slate-400">
                  {headerGroup.headers.map((header) => {
                    const isSorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={`px-3.5 py-3 font-semibold uppercase tracking-wider text-[11px] select-none ${
                          header.column.getCanSort() ? 'cursor-pointer hover:text-slate-200 hover:bg-slate-900/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-slate-600">
                              {isSorted === 'asc' ? (
                                <ArrowUp className="h-3 w-3 text-indigo-400" />
                              ) : isSorted === 'desc' ? (
                                <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-40" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                    No models match the active filter criteria. Adjust parameter sliders or search query.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3.5 py-2.5 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <span className="font-semibold text-slate-300">{filteredData.length}</span> of{' '}
          <span className="font-semibold text-slate-300">{models.length}</span> models in evaluation matrix
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span>High Accuracy / Low Latency</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />
            <span>Fine-Tuned SLM Spec</span>
          </span>
        </div>
      </div>

      {/* Side-by-Side Model Score & Quantization Diff Modal */}
      <ModelScoreDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        models={models}
        initialModelAId={diffModelAId}
        initialModelBId={diffModelBId}
        onSendToArena={(idA, idB) => {
          onSelectForArena(idA);
        }}
      />
    </div>
  );
};
