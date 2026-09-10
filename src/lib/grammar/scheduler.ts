import type { GrammarProgress, GrammarSessionResult, GrammarState, GrammarStep } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS).toISOString();
}

export function getGrammarState(mastery: number, correctStreak: number, practiceCount: number, recentErrors: number): GrammarState {
  if (mastery >= 90 || correctStreak >= 5) return 'mastered';
  if (mastery >= 76 || correctStreak >= 3) return 'strong';
  if (mastery >= 56) return 'improving';
  if (recentErrors >= 3 || (practiceCount > 0 && mastery < 55)) return 'needs-practice';
  if (practiceCount > 0) return 'learning';
  return 'not-started';
}

export function getNextGrammarInterval(correctStreak: number, isCorrect: boolean, recentErrors: number) {
  if (!isCorrect) return 1;
  if (recentErrors >= 3) return 2;
  if (correctStreak <= 1) return 2;
  if (correctStreak === 2) return 4;
  if (correctStreak === 3) return 8;
  return 14;
}

export function isGrammarReviewDue(progress: GrammarProgress, now = new Date()) {
  if (!progress.nextReviewAt) return progress.state !== 'mastered';
  return Date.parse(progress.nextReviewAt) <= now.getTime();
}

export function mergeCompletedStep(progress: GrammarProgress, step: GrammarStep): GrammarStep[] {
  return progress.completedSteps.includes(step) ? progress.completedSteps : [...progress.completedSteps, step];
}

export function getNextGrammarProgress(progress: GrammarProgress, result: GrammarSessionResult, reviewedAt = new Date()): GrammarProgress {
  const correctStreak = result.isCorrect ? progress.correctStreak + 1 : 0;
  const incorrectCount = result.isCorrect ? progress.incorrectCount : progress.incorrectCount + 1;
  const practiceCount = progress.practiceCount + 1;
  const recentErrors = clamp(result.isCorrect ? progress.recentErrors - 1 : progress.recentErrors + 1, 0, 12);
  const difficulty = clamp(progress.difficulty + (result.isCorrect ? -0.25 : 0.5), 1, 5);
  const masteryDelta = result.isCorrect ? (progress.state === 'not-started' ? 14 : 9) : -10;
  const mastery = clamp(progress.mastery + masteryDelta, 0, 100);
  const interval = getNextGrammarInterval(correctStreak, result.isCorrect, recentErrors);
  const state = getGrammarState(mastery, correctStreak, practiceCount, recentErrors);

  return {
    ...progress,
    state,
    mastery,
    lastPracticedAt: reviewedAt.toISOString(),
    nextReviewAt: addDays(reviewedAt, interval),
    correctStreak,
    incorrectCount,
    practiceCount,
    recentErrors,
    difficulty,
    completedSteps: mergeCompletedStep(progress, 'practice'),
  };
}
