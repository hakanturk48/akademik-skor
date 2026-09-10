import type { TaxonomySlugPath } from '@/lib/content';

export type GrammarEntityStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type GrammarVisibility = 'public' | 'authenticated' | 'private';
export type GrammarTone = 'blue' | 'teal' | 'orange' | 'purple' | 'yellow' | 'navy' | 'green';
export type GrammarState = 'not-started' | 'learning' | 'needs-practice' | 'improving' | 'strong' | 'mastered';
export type GrammarExerciseType = 'multiple-choice' | 'sentence-correction' | 'fill-in-blank' | 'sentence-building';
export type GrammarPracticeMode = 'personalized' | 'topic' | 'review';
export type GrammarSessionStatus = 'in-progress' | 'completed';
export type GrammarStep = 'learn' | 'examples' | 'mistakes' | 'practice' | 'quiz' | 'results';

export interface GrammarBaseEntity {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: GrammarEntityStatus;
  visibility: GrammarVisibility;
  isPremium: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GrammarCategoryCard extends GrammarBaseEntity {
  iconKey: string;
  tone: GrammarTone;
  topicIds: string[];
  taxonomy: TaxonomySlugPath;
}

export interface GrammarRule {
  id: string;
  title: string;
  body: string;
}

export interface GrammarExample {
  id: string;
  label: string;
  sentence: string;
  note: string;
  isCorrect: boolean;
}

export interface GrammarCommonMistake {
  id: string;
  wrong: string;
  right: string;
  note: string;
  errorTag: string;
}

export interface GrammarExerciseOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface GrammarQuestion {
  id: string;
  topicId: string;
  type: GrammarExerciseType;
  prompt: string;
  stem: string;
  options: GrammarExerciseOption[];
  correctOptionId: string;
  explanation: string;
  errorTag: string;
  difficulty: number;
}

export interface GrammarTopicCard extends GrammarBaseEntity {
  categoryId: string;
  level: string;
  tone: GrammarTone;
  estimatedMinutes: number;
  difficulty: number;
  lessonCount: number;
  taxonomy: TaxonomySlugPath;
  contentTags: string[];
  rules: GrammarRule[];
  positiveExamples: GrammarExample[];
  negativeExamples: GrammarExample[];
  academicExamples: GrammarExample[];
  commonMistakes: GrammarCommonMistake[];
  questions: GrammarQuestion[];
  recommendedNextTopicId: string | null;
}

export interface GrammarProgress {
  topicId: string;
  state: GrammarState;
  mastery: number;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
  correctStreak: number;
  incorrectCount: number;
  practiceCount: number;
  recentErrors: number;
  difficulty: number;
  completedSteps: GrammarStep[];
}

export interface GrammarSessionResult {
  questionId: string;
  exerciseType: GrammarExerciseType;
  isCorrect: boolean;
  selectedOptionId: string;
  answeredAt: string;
  errorTag: string;
}

export interface GrammarSession {
  id: string;
  topicId: string;
  mode: GrammarPracticeMode;
  title: string;
  questionIds: string[];
  currentIndex: number;
  status: GrammarSessionStatus;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  results: GrammarSessionResult[];
}

export interface GrammarOverview {
  grammarMastery: number;
  topicsLearned: number;
  needsPractice: number;
  weeklyPractice: number;
  weeklyGoal: number;
}

export interface GrammarTopicSummary extends GrammarTopicCard {
  categoryTitle: string;
  progress: GrammarProgress;
  actionLabel: 'Start' | 'Continue' | 'Review';
}

export interface GrammarCategorySummary extends GrammarCategoryCard {
  topicCount: number;
  mastery: number;
  dueCount: number;
  topics: GrammarTopicSummary[];
}

export interface GrammarRecommendation {
  topic: GrammarTopicSummary;
  reason: string;
  priorityScore: number;
}

export interface GrammarSummary {
  accuracy: number;
  correct: number;
  incorrect: number;
  mistakes: string[];
  masteryBefore: number;
  masteryAfter: number;
  masteryChange: number;
  recommendedNextTopic: GrammarTopicSummary | null;
  repeatWeakItems: GrammarQuestion[];
}

export interface GrammarActivityItem {
  id: string;
  topicTitle: string;
  categoryTitle: string;
  state: GrammarState;
  practicedAt: string;
  result: 'correct' | 'needs-practice';
}

export interface GrammarSeed {
  categories: GrammarCategoryCard[];
  topics: GrammarTopicCard[];
  progress: GrammarProgress[];
}
