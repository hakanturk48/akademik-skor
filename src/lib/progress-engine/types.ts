import type { AuthPlan, AuthUser } from '@/lib/auth';

export type ProgressSignalStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type ProgressSkillSlug = string;
export type ProgressSubskillSlug = string;

export type RecommendationType =
  | 'watch-lesson'
  | 'focused-practice'
  | 'review-mistakes'
  | 'vocabulary-review'
  | 'grammar-practice'
  | 'mini-test'
  | 'mock-test'
  | 'writing-feedback-review'
  | 'speaking-practice';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationRefreshState = 'fresh' | 'refresh-soon' | 'expired';
export type RecommendationContext = 'dashboard' | 'my-learning' | 'listening' | 'vocabulary' | 'grammar' | 'progress';

export type FormulaBreakdownItem = {
  key: string;
  label: string;
  value: number;
  weight: number;
  contribution: number;
};

export type VocabularyReviewSignal = {
  dueCount: number;
  weakCount: number;
  savedDueCount: number;
  state: 'new' | 'learning' | 'improving' | 'strong' | 'mastered' | 'due';
};

export type RecommendationTemplate = {
  type: RecommendationType;
  title: string;
  actionLabel: string;
  actionHref: string;
  contentId: string;
  estimatedMinutes: number;
  requiredPlan?: AuthPlan;
  isPremium?: boolean;
  expiresAt?: string;
  visibleInContexts?: RecommendationContext[];
};

export type ProgressSignalInput = {
  id: string;
  skillSlug: ProgressSkillSlug;
  skillTitle?: string;
  subskillSlug: ProgressSubskillSlug;
  subskillTitle?: string;
  taskTypeSlug?: string;
  taskTypeTitle?: string;
  topicSlug?: string;
  topicTitle?: string;
  masteryScore: number;
  recentAccuracy: number;
  practiceAccuracy?: number;
  questionTypePerformance: number;
  subskillMastery?: number;
  timeSpentMinutes: number;
  responseTimeSeconds: number;
  lastPracticedAt: string | null;
  attemptCount: number;
  recentErrors: number;
  vocabularyReviewState?: VocabularyReviewSignal;
  grammarMastery?: number;
  miniTestScore?: number;
  mockTestScore?: number;
  targetScore: number;
  targetExamDate: string;
  incompleteContentCount: number;
  status: ProgressSignalStatus;
  sortOrder: number;
  isPremium: boolean;
  recommendation: RecommendationTemplate;
};

export type SkillProgressSignal = ProgressSignalInput & {
  skillTitle: string;
  subskillTitle: string;
  taskTypeTitle?: string;
  practiceAccuracy: number;
  subskillMastery: number;
  weaknessScore: number;
  priorityScore: number;
  daysSincePractice: number;
  daysUntilExam: number;
  formulaBreakdown: FormulaBreakdownItem[];
};

export type ProgressFormulaConfig = {
  targetAccuracy: number;
  targetMastery: number;
  targetResponseSeconds: number;
  strongMastery: number;
  recentPracticeDays: number;
  stalePracticeDays: number;
  refreshSoonHours: number;
  weights: {
    masteryGap: number;
    recentAccuracyGap: number;
    questionTypeGap: number;
    recentErrors: number;
    stalePractice: number;
    recentlyTestedLowAccuracy: number;
    incompleteContent: number;
    responseTime: number;
    vocabularyDue: number;
    grammarGap: number;
    miniTestGap: number;
    mockScoreGap: number;
    examUrgency: number;
    attemptConfidence: number;
    strongRecentPenalty: number;
    freePlanLockedPenalty: number;
  };
  contextBoosts: Record<RecommendationContext, Partial<Record<RecommendationType, number>>>;
};

export type ProgressFormulaConfigInput = Partial<Omit<ProgressFormulaConfig, 'weights' | 'contextBoosts'>> & {
  weights?: Partial<ProgressFormulaConfig['weights']>;
  contextBoosts?: Partial<Record<RecommendationContext, Partial<Record<RecommendationType, number>>>>;
};

export type ProgressEngineRequest = {
  user?: Pick<AuthUser, 'id' | 'plan' | 'goal'>;
  now?: Date | string;
  formulaConfig?: ProgressFormulaConfigInput;
  signals?: ProgressSignalInput[];
  includeInactive?: boolean;
};

export type RecommendationRequest = ProgressEngineRequest & {
  context?: RecommendationContext;
  skill?: ProgressSkillSlug;
  limit?: number;
};

export type RecommendationAction = {
  href: string;
  label: string;
  contentId: string;
};

export type Recommendation = {
  id: string;
  type: RecommendationType;
  title: string;
  reason: string;
  estimatedMinutes: number;
  skill: ProgressSkillSlug;
  skillTitle: string;
  subskill: ProgressSubskillSlug;
  subskillTitle: string;
  taskTypeSlug?: string;
  taskTypeTitle?: string;
  topicSlug?: string;
  topicTitle?: string;
  contentId: string;
  action: RecommendationAction;
  priority: RecommendationPriority;
  priorityScore: number;
  requiredPlan: AuthPlan;
  isPremium: boolean;
  locked: boolean;
  expiresAt: string;
  refreshState: RecommendationRefreshState;
  generatedAt: string;
  evidence: string[];
  sourceSignalId: string;
};

export type ProgressEngine = {
  getFormulaConfig: () => ProgressFormulaConfig;
  getSkillProgressSignals: (request?: ProgressEngineRequest) => SkillProgressSignal[];
  getRecommendations: (request?: RecommendationRequest) => Recommendation[];
  getTopRecommendation: (request?: RecommendationRequest) => Recommendation | null;
};
