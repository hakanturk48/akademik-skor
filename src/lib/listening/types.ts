export type ListeningTone = 'blue' | 'teal' | 'orange' | 'purple' | 'yellow' | 'navy' | 'green';

export type ListeningTaskTypeId = 'choose-response' | 'conversation' | 'announcement' | 'academic-talk';
export type ListeningSubskillId = 'main-idea' | 'purpose' | 'detail' | 'inference' | 'attitude' | 'function' | 'note-taking';
export type ListeningDifficultyId = 'adaptive' | 'easy' | 'medium' | 'hard';
export type ListeningLengthId = 'quick' | 'standard' | 'extended';
export type ListeningPracticeModeId = 'quick-listening' | 'focused-practice' | 'full-section-practice' | 'review-mistakes';
export type ListeningSessionMode = 'practice' | 'exam';

export type ListeningIconKey =
  | 'headphones'
  | 'play'
  | 'target'
  | 'clock'
  | 'check'
  | 'refresh'
  | 'star'
  | 'notes'
  | 'layers'
  | 'bolt'
  | 'book'
  | 'quiz';

export interface ListeningMetric {
  id: string;
  label: string;
  value: string;
  note: string;
  progress: number;
  max?: number;
  tone: ListeningTone;
  iconKey: ListeningIconKey;
}

export interface ListeningPracticeMode {
  id: ListeningPracticeModeId;
  title: string;
  description: string;
  tone: ListeningTone;
  iconKey: ListeningIconKey;
  sessionMode: ListeningSessionMode;
  defaultLengthId: ListeningLengthId;
}

export interface ListeningTaskType {
  id: ListeningTaskTypeId;
  title: string;
  description: string;
  examples: string;
  tone: ListeningTone;
  sortOrder: number;
}

export interface ListeningSubskill {
  id: ListeningSubskillId;
  title: string;
  description: string;
  taskTypeIds: ListeningTaskTypeId[];
  mastery: number;
  recentErrors: number;
  sortOrder: number;
}

export interface ListeningDifficulty {
  id: ListeningDifficultyId;
  title: string;
  description: string;
}

export interface ListeningLength {
  id: ListeningLengthId;
  title: string;
  description: string;
  minutes: number;
  questionCount: number;
}

export interface ListeningSelection {
  taskTypeId: ListeningTaskTypeId;
  subskillId: ListeningSubskillId;
  difficultyId: ListeningDifficultyId;
  lengthId: ListeningLengthId;
  sessionMode: ListeningSessionMode;
}

export interface ListeningRecommendation {
  id: string;
  title: string;
  reason: string;
  taskTypeId: ListeningTaskTypeId;
  subskillId: ListeningSubskillId;
  difficultyId: ListeningDifficultyId;
  lengthId: ListeningLengthId;
  sessionMode: ListeningSessionMode;
  priority: number;
  estimatedMinutes: number;
}

export interface ListeningContinueItem {
  id: string;
  title: string;
  subtitle: string;
  taskTypeId: ListeningTaskTypeId;
  subskillId: ListeningSubskillId;
  difficultyId: ListeningDifficultyId;
  lengthId: ListeningLengthId;
  sessionMode: ListeningSessionMode;
  progress: number;
  lastActivity: string;
}

export interface ListeningLearningChainItem {
  id: string;
  type: 'strategy-video' | 'guided-practice' | 'mini-test';
  title: string;
  description: string;
  href: string;
  tone: ListeningTone;
  iconKey: ListeningIconKey;
  isPremium: boolean;
}
