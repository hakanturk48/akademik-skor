import type { AuthPlan } from '@/lib/auth';
import type { EntityStatus, TaxonomySlugPath, Visibility } from '@/lib/content';

export type MiniTestDifficulty = 'adaptive' | 'easy' | 'medium' | 'hard';
export type MiniTestMode = 'practice' | 'exam';
export type MiniTestStepId = 'skill' | 'task' | 'subskill' | 'difficulty' | 'length' | 'mode' | 'summary';
export type MiniTestTone = 'blue' | 'teal' | 'orange' | 'purple' | 'yellow' | 'navy' | 'green';
export type MiniTestIconKey = 'book' | 'headphones' | 'mic' | 'writing' | 'target' | 'layers' | 'bolt' | 'check' | 'star' | 'clock' | 'quiz';

export interface MiniTestBaseRecord {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: EntityStatus;
  sortOrder: number;
  visibility: Visibility;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MiniTestChoice {
  id: string;
  slug: string;
  title: string;
  description?: string;
  tone: MiniTestTone;
  iconKey: MiniTestIconKey;
  sortOrder: number;
  isPremium?: boolean;
  questionCount?: number;
  disabled?: boolean;
  disabledReason?: string;
}

export interface MiniTestQuestionOption {
  id: string;
  key: string;
  body: string;
  isCorrect: boolean;
  rationale?: string;
}

export interface MiniTestQuestionBankItem extends MiniTestBaseRecord {
  taxonomy: TaxonomySlugPath;
  prompt: string;
  stimulus?: string;
  options: MiniTestQuestionOption[];
  correctOptionKey?: string;
  estimatedSeconds: number;
}

export interface MiniTestSelection {
  skillSlug: string;
  taskTypeSlug: string;
  subskillSlug: string;
  difficulty: MiniTestDifficulty;
  length: number;
  mode: MiniTestMode;
}

export interface MiniTestOverviewMetric {
  label: string;
  value: string;
  note: string;
  tone: MiniTestTone;
  iconKey: MiniTestIconKey;
  progress: number;
}

export interface MiniTestModeRule {
  mode: MiniTestMode;
  title: string;
  description: string;
  feedbackTiming: string;
  transcriptPolicy: string;
  timerPolicy: string;
}

export interface MiniTestQuestionQueryResult {
  selection: MiniTestSelection;
  questions: MiniTestQuestionBankItem[];
  requestedCount: number;
  totalMatchingActive: number;
  lockedPremiumCount: number;
  inactiveCount: number;
  duplicateCount: number;
  missingTaxonomyCount: number;
  ok: boolean;
  message?: string;
}

export interface MiniTestAttemptDraft extends MiniTestBaseRecord {
  userId: string;
  selection: MiniTestSelection;
  questionIds: string[];
  mode: MiniTestMode;
  startedAt: string;
  submittedAt?: string;
  statusLabel: string;
  estimatedMinutes: number;
}

export type MiniTestAttemptResult =
  | { ok: true; attempt: MiniTestAttemptDraft; query: MiniTestQuestionQueryResult }
  | { ok: false; reason: string; query: MiniTestQuestionQueryResult };

export interface MiniTestRecommendation {
  id: string;
  title: string;
  description: string;
  selection: MiniTestSelection;
  reason: string;
  tone: MiniTestTone;
  iconKey: MiniTestIconKey;
}

export interface MiniTestActivity {
  id: string;
  title: string;
  meta: string;
  score: string;
  tone: MiniTestTone;
}

export interface MiniTestBuilderState {
  steps: { id: MiniTestStepId; title: string; description: string }[];
  selection: MiniTestSelection;
  query: MiniTestQuestionQueryResult;
  plan: AuthPlan;
}
