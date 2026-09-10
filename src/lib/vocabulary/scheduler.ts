import type { VocabularyAnswerKind, VocabularyProgress, VocabularyState } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS).toISOString();
}

export function getVocabularyState(mastery: number, correctStreak: number, reviewCount: number): VocabularyState {
  if (mastery >= 90 || correctStreak >= 4) return 'mastered';
  if (mastery >= 75 || correctStreak >= 3) return 'strong';
  if (mastery >= 55 || correctStreak >= 2) return 'improving';
  if (reviewCount > 0) return 'learning';
  return 'new';
}

export function getNextVocabularyInterval(correctStreak: number, isCorrect: boolean) {
  if (!isCorrect) return 1;
  if (correctStreak <= 1) return 1;
  if (correctStreak === 2) return 3;
  if (correctStreak === 3) return 7;
  return 14;
}

export function getNextVocabularyProgress(
  progress: VocabularyProgress,
  result: { answerKind: VocabularyAnswerKind; isCorrect: boolean },
  reviewedAt = new Date(),
): VocabularyProgress {
  const isCorrect = result.isCorrect;
  const correctStreak = isCorrect ? progress.correctStreak + 1 : 0;
  const incorrectCount = isCorrect ? progress.incorrectCount : progress.incorrectCount + 1;
  const reviewCount = progress.reviewCount + 1;
  const interval = getNextVocabularyInterval(correctStreak, isCorrect);
  const difficulty = clamp(progress.difficulty + (isCorrect ? -1 : 1), 1, 5);
  const masteryDelta = isCorrect ? (result.answerKind === 'know' ? 12 : 6) : -8;
  const mastery = clamp(progress.mastery + masteryDelta, 0, 100);
  const state = getVocabularyState(mastery, correctStreak, reviewCount);

  return {
    ...progress,
    state,
    lastReviewedAt: reviewedAt.toISOString(),
    nextReviewAt: addDays(reviewedAt, interval),
    correctStreak,
    incorrectCount,
    reviewCount,
    difficulty,
    interval,
    mastery,
  };
}

export function isVocabularyReviewDue(progress: VocabularyProgress, now = new Date()) {
  if (progress.state === 'mastered' && progress.nextReviewAt) {
    return Date.parse(progress.nextReviewAt) <= now.getTime();
  }

  if (!progress.nextReviewAt) {
    return progress.state !== 'mastered';
  }

  return Date.parse(progress.nextReviewAt) <= now.getTime();
}

