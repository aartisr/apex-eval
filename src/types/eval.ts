/**
 * ApexEval Type Definitions
 * Type-safe contracts across frontend and backend evaluation engine
 */

export type ModelTier = 'foundation_llm' | 'fine_tuned_slm' | 'base_slm';

export type QuantizationType = 'fp16' | 'q8' | 'q4_k_m' | 'q4_K_m' | 'int4';

export interface ModelRecord {
  id: string;
  name: string;
  family: string;
  tier: ModelTier;
  parametersB: number;
  quantization: QuantizationType;
  contextWindow: number;
  costPerMTokens: number; // in USD
  tokensPerSec: number;
  memoryGB: number;
  // Multidimensional Benchmark Scores (0 - 100 scale)
  winRate: number;
  reasoningScore: number;
  factualAccuracy: number;
  instructionFollowing: number;
  hallucinationRate: number; // lower is better
  gsm8kScore: number;
  mmluScore: number;
  humanEvalScore: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  fineTuningMethod?: 'sft' | 'dpo' | 'kto' | 'orpo' | 'none';
  checkpointEpoch?: number;
  description: string;
}

export interface CheckpointRecord {
  id: string;
  modelId: string;
  modelName: string;
  epoch: number;
  step: number;
  trainLoss: number;
  valLoss: number;
  alignmentMethod: 'sft' | 'dpo' | 'kto' | 'orpo';
  quantization: QuantizationType;
  winRate: number;
  reasoningScore: number;
  factualAccuracy: number;
  memoryGB: number;
  notes: string;
  // Overfitting & Alignment Diagnostics
  memorizationIndex?: number; // 0 - 100 verbatim regurgitation score
  oodScore?: number; // Out-of-distribution reasoning score
  sycophancyIndex?: number; // 0 - 100 false premise echoing
}

export interface BenchmarkTask {
  id: string;
  suiteId: string;
  prompt: string;
  referenceAnswer: string;
  domain: 'reasoning' | 'code' | 'facts' | 'adversarial';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface BenchmarkSuite {
  id: string;
  name: string;
  domain: string;
  description: string;
  taskCount: number;
  tasks: BenchmarkTask[];
}

export interface JudgeRubric {
  id: string;
  name: string;
  weights: {
    correctness: number; // e.g. 0.35
    reasoning: number;   // e.g. 0.25
    instruction: number; // e.g. 0.20
    factualSafety: number; // e.g. 0.15
    conciseness: number; // e.g. 0.05
  };
  promptTemplate: string;
}

export interface JudgeEvaluationResult {
  overallScore: number; // 0 - 100
  criteriaScores: {
    correctness: number;
    reasoning: number;
    instruction: number;
    factualSafety: number;
    conciseness: number;
  };
  critique: string;
  suggestedImprovement: string;
  cached: boolean;
  cacheSource?: 'redis' | 'memory' | 'none';
  latencyMs: number;
}

export interface OverfittingMetrics {
  generalizationGap: number; // valLoss - trainLoss
  memorizationIndex: number; // 0-100 score of verbatim dataset repetition
  oodPerformanceDrop: number; // % drop on Out-Of-Distribution vs In-Distribution
  overfittingAlert: boolean;
}

export interface DataDriftMetrics {
  psiScore: number; // Population Stability Index (e.g. 0.08 = stable, >0.25 = high drift)
  jsDivergence: number; // Jensen-Shannon divergence of embedding vectors
  conceptDriftAlert: 'nominal' | 'moderate' | 'critical';
  topDriftedDomains: string[];
}

export interface MisalignmentMetrics {
  sycophancyIndex: number; // 0-100: propensity to echo user false premises
  rewardHackingLengthBias: number; // 0-100: artificial verbosity inflating scores
  adversarialJailbreakRate: number; // % of adversarial probes breaching safety
  alignmentShiftType: 'sft' | 'dpo' | 'kto' | 'orpo';
}

export interface EvaluationRunRecord {
  id: string;
  suiteName: string;
  suiteId: string;
  modelsEvaluated: string[];
  totalTasks: number;
  completedTasks: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  averageScores: Record<string, number>;
}

export interface RedisCacheStats {
  connected: boolean;
  hitCount: number;
  missCount: number;
  hitRatioPercent: number;
  keysCount: number;
  memoryBytes: number;
  avgLatencySavedMs: number;
}
