import type { TaxonomySlugPath } from '@/lib/content';

export type VocabularyPracticeTypeId = 'learn-new' | 'review-due' | 'weak-words' | 'saved-words' | 'toefl-sets';
export type VocabularyState = 'new' | 'learning' | 'improving' | 'strong' | 'mastered';
export type VocabularySessionStatus = 'in-progress' | 'completed';
export type VocabularyExerciseType = 'meaning-recognition' | 'fill-in-blank' | 'contextual-use' | 'listening-recognition';
export type VocabularyAnswerKind = 'know' | 'practice';
export type VocabularyTone = 'blue' | 'teal' | 'orange' | 'purple' | 'yellow' | 'navy' | 'green';
export type VocabularyVisibility = 'public' | 'authenticated' | 'private';
export type VocabularyEntityStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface VocabularyPracticeType {
  id: VocabularyPracticeTypeId;
  title: string;
  slug: string;
  description: string;
  tone: VocabularyTone;
  iconKey: string;
  defaultSetId: string | null;
  status: VocabularyEntityStatus;
  visibility: VocabularyVisibility;
  isPremium: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularySetCard {
  id: string;
  title: string;
  slug: string;
  description: string;
  topic: string;
  level: string;
  wordCount: number;
  estimatedMinutes: number;
  isPremium: boolean;
  status: VocabularyEntityStatus;
  visibility: VocabularyVisibility;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  taxonomy: TaxonomySlugPath;
  contentTags: string[];
  wordIds: string[];
}

export interface VocabularyWordCard {
  id: string;
  setId: string;
  word: string;
  slug: string;
  ipa: string;
  pronunciationLabel: string;
  partOfSpeech: string;
  definition: string;
  translation?: string;
  academicExample: string;
  toeflExample: string;
  collocations: string[];
  wordFamily: string[];
  synonyms: string[];
  antonyms: string[];
  audioUrl?: string | null;
  status: VocabularyEntityStatus;
  visibility: VocabularyVisibility;
  isPremium: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  contentTags: string[];
}

export interface VocabularyProgress {
  wordId: string;
  state: VocabularyState;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  correctStreak: number;
  incorrectCount: number;
  reviewCount: number;
  difficulty: number;
  interval: number;
  mastery: number;
  saved: boolean;
}

export interface VocabularyExerciseOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface VocabularyExercise {
  id: string;
  type: VocabularyExerciseType;
  prompt: string;
  stem: string;
  options: VocabularyExerciseOption[];
  correctOptionId: string;
}

export interface VocabularySessionResult {
  wordId: string;
  answerKind: VocabularyAnswerKind;
  exerciseType: VocabularyExerciseType;
  isCorrect: boolean;
  answeredAt: string;
}

export interface VocabularySession {
  id: string;
  practiceTypeId: VocabularyPracticeTypeId;
  setId: string;
  title: string;
  wordIds: string[];
  currentIndex: number;
  status: VocabularySessionStatus;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  results: VocabularySessionResult[];
}

export interface VocabularyOverview {
  wordsLearned: number;
  dueForReview: number;
  mastered: number;
  weeklyGoal: number;
}

export interface VocabularySetSummary extends VocabularySetCard {
  mastery: number;
  dueCount: number;
  knownCount: number;
  actionLabel: 'Start' | 'Continue';
}

export interface VocabularySummary {
  correct: number;
  incorrect: number;
  newlyLearned: number;
  needsReview: number;
  masteryChange: number;
  recommendedNextAction: string;
}

export interface VocabularyActivityItem {
  id: string;
  word: string;
  setTitle: string;
  state: VocabularyState;
  reviewedAt: string;
  result: 'correct' | 'practice';
}

export interface VocabularySeed {
  practiceTypes: VocabularyPracticeType[];
  sets: VocabularySetCard[];
  words: VocabularyWordCard[];
  progress: VocabularyProgress[];
}

