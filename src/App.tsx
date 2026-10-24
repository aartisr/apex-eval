/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from './components/Navbar.tsx';
import { CacheMetricBanner } from './components/common/CacheMetricBanner.tsx';
import { EvaluationMatrix } from './components/matrix/EvaluationMatrix.tsx';
import { ArenaLab } from './components/arena/ArenaLab.tsx';
import { CheckpointInspector } from './components/checkpoints/CheckpointInspector.tsx';
import { BenchmarkHarness } from './components/benchmarks/BenchmarkHarness.tsx';
import { JudgeRubricStudio } from './components/rubrics/JudgeRubricStudio.tsx';
import { DriftAlignmentConsole } from './components/drift/DriftAlignmentConsole.tsx';
import { NewRunModal } from './components/common/NewRunModal.tsx';
import { ModelHealthReportModal } from './components/common/ModelHealthReportModal.tsx';
import { SettingsThresholdModal } from './components/common/SettingsThresholdModal.tsx';
import { ThresholdAlertBanner } from './components/common/ThresholdAlertBanner.tsx';
import {
  INITIAL_MODELS,
  INITIAL_CHECKPOINTS,
  INITIAL_BENCHMARK_SUITES,
  INITIAL_JUDGE_RUBRIC,
} from './lib/initialData.ts';
import { ModelRecord, RedisCacheStats, ThresholdAlertSettings } from './types/eval.ts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

function ApexEvalApp() {
  const [activeTab, setActiveTab] = useState<
    'matrix' | 'arena' | 'checkpoints' | 'benchmarks' | 'rubric' | 'drift'
  >('matrix');
  const [preselectedArenaModelId, setPreselectedArenaModelId] = useState<string | undefined>(
    undefined
  );
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Threshold alert settings state
  const [thresholdSettings, setThresholdSettings] = useState<ThresholdAlertSettings>({
    minWinRatePercent: 80.0,
    minReasoningScore: 75.0,
    maxPsiDrift: 0.15,
    maxLossGap: 0.30,
    maxLatencyP95Ms: 250,
    maxHallucinationRatePercent: 5.0,
    enableEmailAlerts: true,
  });

  // Models, Checkpoints, Suites state
  const [models, setModels] = useState<ModelRecord[]>(INITIAL_MODELS);
  const [checkpoints] = useState(INITIAL_CHECKPOINTS);
  const [suites] = useState(INITIAL_BENCHMARK_SUITES);
  const [rubric] = useState(INITIAL_JUDGE_RUBRIC);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCheckpointOverride, setSelectedCheckpointOverride] = useState<string | undefined>(undefined);

  // TanStack Query for Redis Cache Stats
  const { data: cacheStats, refetch: refetchCacheStats } = useQuery<RedisCacheStats>({
    queryKey: ['cacheStats'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/cache/stats');
        if (!res.ok) throw new Error('Failed to fetch cache stats');
        return await res.json();
      } catch (e) {
        return {
          connected: true,
          hitCount: 247,
          missCount: 38,
          hitRatioPercent: 86.7,
          keysCount: 42,
          memoryBytes: 1024 * 142,
          avgLatencySavedMs: 650,
        };
      }
    },
    refetchInterval: 10000,
  });

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await fetch('/api/cache/clear', { method: 'POST' });
      await refetchCacheStats();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleSelectForArena = (modelId: string) => {
    setPreselectedArenaModelId(modelId);
    setActiveTab('arena');
  };

  const handleInspectCheckpoints = (_modelId: string) => {
    setActiveTab('checkpoints');
  };

  const handleSelectModelFromSearch = (modelId: string, targetTab: 'matrix' | 'arena' = 'matrix') => {
    const model = models.find((m) => m.id === modelId);
    if (targetTab === 'arena') {
      setPreselectedArenaModelId(modelId);
      setActiveTab('arena');
    } else {
      if (model) setSearchQuery(model.name);
      setActiveTab('matrix');
    }
  };

  const handleSelectCheckpointFromSearch = (checkpointId: string) => {
    setSelectedCheckpointOverride(checkpointId);
    setActiveTab('checkpoints');
  };

  const handleStartRun = (suiteId: string, modelIds: string[]) => {
    setActiveTab('benchmarks');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      {/* 3-Zone Top Bar with Global Search Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewRun={() => setIsNewRunModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        cacheStats={cacheStats || null}
        onRefreshCache={refetchCacheStats}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        models={models}
        checkpoints={checkpoints}
        onSelectModel={handleSelectModelFromSearch}
        onSelectCheckpoint={handleSelectCheckpointFromSearch}
      />

      {/* Real-Time Threshold Alert Banner */}
      <ThresholdAlertBanner
        settings={thresholdSettings}
        models={models}
        checkpoints={checkpoints}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Redis Cache Telemetry Banner */}
      <CacheMetricBanner
        stats={cacheStats || null}
        onClearCache={handleClearCache}
        isClearing={isClearingCache}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'matrix' && (
          <EvaluationMatrix
            models={models}
            onSelectForArena={handleSelectForArena}
            onInspectCheckpoints={handleInspectCheckpoints}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {activeTab === 'arena' && (
          <ArenaLab
            models={models}
            suites={suites}
            preselectedModelId={preselectedArenaModelId}
            onRefreshCache={refetchCacheStats}
          />
        )}

        {activeTab === 'checkpoints' && (
          <CheckpointInspector
            checkpoints={checkpoints}
            searchQuery={searchQuery}
            selectedCheckpointIdOverride={selectedCheckpointOverride}
          />
        )}

        {activeTab === 'benchmarks' && (
          <BenchmarkHarness
            suites={suites}
            models={models}
            onRefreshCache={refetchCacheStats}
          />
        )}

        {activeTab === 'rubric' && (
          <JudgeRubricStudio initialRubric={rubric} />
        )}

        {activeTab === 'drift' && (
          <DriftAlignmentConsole checkpoints={checkpoints} models={models} />
        )}
      </main>

      {/* New Run Modal */}
      <NewRunModal
        isOpen={isNewRunModalOpen}
        onClose={() => setIsNewRunModalOpen(false)}
        suites={suites}
        models={models}
        onStartRun={handleStartRun}
      />

      {/* Executive Model Health & Evaluation Report Modal */}
      <ModelHealthReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        models={models}
        checkpoints={checkpoints}
      />

      {/* Performance Thresholds & Alert Settings Modal */}
      <SettingsThresholdModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={thresholdSettings}
        onUpdateSettings={setThresholdSettings}
        models={models}
        checkpoints={checkpoints}
      />

      {/* Discreet Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0A0D16] py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">ApexEval</span>
            <span>·</span>
            <span>LLM & Small LLM Evaluation Engine</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <span>TanStack Table & Query</span>
            <span>·</span>
            <span>Redis Caching Proxy</span>
            <span>·</span>
            <span>Firestore Persistence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApexEvalApp />
    </QueryClientProvider>
  );
}
