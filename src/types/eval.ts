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
  precisionScore?: number; // 0 - 100 token/entity precision
  recallScore?: number; // 0 - 100 factual needle recall
  f1Score?: number; // 0 - 100 harmonic F1 score
  perplexity?: number; // Exp(val_loss) language modeling perplexity (PPL)
  // Qualitative NLG & Conversational Dimensions (0 - 100 scale)
  coherenceScore?: number; // Discourse structure & narrative logical progression
  fluencyScore?: number; // Grammatical correctness, lexical diversity & natural cadence
  relevancyScore?: number; // Prompt intent fulfillment & direct topic focus
  appropriatenessScore?: number; // Contextual tone, register suitability & safety boundaries
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
  perplexity?: number; // Language modeling perplexity (PPL)
  precisionScore?: number; // 0 - 100 precision
  coherenceScore?: number; // Discourse coherence
  fluencyScore?: number; // Linguistic fluency
  alignmentMethod: 'sft' | 'dpo' | 'kto' | 'orpo';
  quantization: QuantizationType;
  winRate: number;
  reasoningScore: number;
  factualAccuracy: number;
  memoryGB: number;
  notes: string;
  // Custom Tags and Markdown Annotations
  tags?: string[];
  markdownAnnotation?: string;
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
  domain: 'reasoning' | 'code' | 'facts' | 'adversarial' | 'nlg_linguistics';
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
  category?: 'engineering_logic' | 'nlg_linguistics' | 'custom';
  weights: {
    correctness: number; // e.g. 0.20
    reasoning: number;   // e.g. 0.15
    instruction: number; // e.g. 0.15
    factualSafety: number; // e.g. 0.10
    conciseness: number; // e.g. 0.05
    coherence?: number;  // e.g. 0.10 (logical discourse progression)
    fluency?: number;    // e.g. 0.10 (grammatical purity & natural cadence)
    relevancy?: number;  // e.g. 0.08 (direct prompt intent adherence)
    appropriateness?: number; // e.g. 0.07 (tone & register calibration)
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
    coherence?: number;
    fluency?: number;
    relevancy?: number;
    appropriateness?: number;
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

export interface RealWorldAlignmentMetrics {
  jsonSchemaValidityRate: number; // % valid JSON schema adherence under load
  toolCallingAccuracy: number; // % accurate tool/API parameter parsing
  ragDistractorNoiseResistance: number; // % accuracy under noisy retrieved context
  p95LatencyBudgetCompliance: number; // % requests meeting SLA budget
  costPer1kTasksUSD: number; // Dollar cost per 1,000 real-world queries
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

export interface ThresholdAlertSettings {
  minWinRatePercent: number; // e.g. 80.0%
  minReasoningScore: number; // e.g. 75.0
  maxPsiDrift: number; // e.g. 0.15
  maxLossGap: number; // e.g. 0.30
  maxLatencyP95Ms: number; // e.g. 250 ms
  maxHallucinationRatePercent: number; // e.g. 5.0%
  enableEmailAlerts?: boolean;
}
