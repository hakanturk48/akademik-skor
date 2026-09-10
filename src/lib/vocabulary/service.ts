import { vocabularySeed } from './data';
import { isVocabularyReviewDue } from './scheduler';
import type {
  VocabularyActivityItem,
  VocabularyExercise,
  VocabularyExerciseOption,
  VocabularyExerciseType,
  VocabularyPracticeTypeId,
  VocabularyProgress,
  VocabularySession,

  VocabularySetSummary,
  VocabularySummary,
  VocabularyWordCard,
} from './types';

const exerciseTypes: VocabularyExerciseType[] = ['meaning-recognition', 'fill-in-blank', 'contextual-use', 'listening-recognition'];
const practiceTypeIds: VocabularyPracticeTypeId[] = ['learn-new', 'review-due', 'weak-words', 'saved-words', 'toefl-sets'];
const fallbackPracticeTypeId: VocabularyPracticeTypeId = 'learn-new';
const fallbackSetId = 'academic-core';

const activeSets = vocabularySeed.sets.filter((set) => set.status === 'active' && (set.visibility as string) !== 'private');
const activeWords = vocabularySeed.words.filter((word) => word.status === 'active' && (word.visibility as string) !== 'private');
const wordsById = new Map(activeWords.map((word) => [word.id, word]));
const setsById = new Map(activeSets.map((set) => [set.id, set]));
const progressByWordId = new Map(vocabularySeed.progress.map((progress) => [progress.wordId, progress]));

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeProgress(progress: Partial<VocabularyProgress> & { wordId: string }): VocabularyProgress {
  const seedProgress = progressByWordId.get(progress.wordId);

  return {
    wordId: progress.wordId,
    state: progress.state ?? seedProgress?.state ?? 'new',
    lastReviewedAt: progress.lastReviewedAt ?? seedProgress?.lastReviewedAt ?? null,
    nextReviewAt: progress.nextReviewAt ?? seedProgress?.nextReviewAt ?? null,
    correctStreak: progress.correctStreak ?? seedProgress?.correctStreak ?? 0,
    incorrectCount: progress.incorrectCount ?? seedProgress?.incorrectCount ?? 0,
    reviewCount: progress.reviewCount ?? seedProgress?.reviewCount ?? 0,
    difficulty: progress.difficulty ?? seedProgress?.difficulty ?? 3,
    interval: progress.interval ?? seedProgress?.interval ?? 0,
    mastery: clamp(progress.mastery ?? seedProgress?.mastery ?? 0, 0, 100),
    saved: progress.saved ?? seedProgress?.saved ?? false,
  };
}

export function getVocabularyPracticeTypes() {
  return [...vocabularySeed.practiceTypes]
    .filter((type) => type.status === 'active' && (type.visibility as string) !== 'private')
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getVocabularySets() {
  return [...activeSets].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getVocabularyWords() {
  return [...activeWords].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getVocabularyWordById(wordId: string) {
  return wordsById.get(wordId);
}

export function getVocabularySetById(setId: string) {
  return setsById.get(setId);
}

export function getInitialVocabularyProgress(): VocabularyProgress[] {
  return activeWords.map((word) => normalizeProgress({ wordId: word.id }));
}

export function mergeVocabularyProgress(progress: VocabularyProgress[] | undefined | null): VocabularyProgress[] {
  const incoming = new Map((progress ?? []).map((item) => [item.wordId, item]));
  return activeWords.map((word) => normalizeProgress(incoming.get(word.id) ?? { wordId: word.id }));
}

export function getVocabularyOverview(progressInput: VocabularyProgress[] = getInitialVocabularyProgress()) {
  const progress = mergeVocabularyProgress(progressInput);
  const now = new Date();

  return {
    wordsLearned: progress.filter((item) => item.state !== 'new').length,
    dueForReview: progress.filter((item) => isVocabularyReviewDue(item, now)).length,
    mastered: progress.filter((item) => item.state === 'mastered').length,
    weeklyGoal: 20,
  };
}

export function getVocabularySetSummaries(progressInput: VocabularyProgress[] = getInitialVocabularyProgress()): VocabularySetSummary[] {
  const progress = new Map(mergeVocabularyProgress(progressInput).map((item) => [item.wordId, item]));
  const now = new Date();

  return getVocabularySets().map((set) => {
    const setProgress = set.wordIds.map((wordId) => progress.get(wordId)).filter(Boolean) as VocabularyProgress[];
    const mastery = setProgress.length ? Math.round(setProgress.reduce((sum, item) => sum + item.mastery, 0) / setProgress.length) : 0;
    const dueCount = setProgress.filter((item) => isVocabularyReviewDue(item, now)).length;
    const knownCount = setProgress.filter((item) => item.state === 'strong' || item.state === 'mastered').length;

    return {
      ...set,
      mastery,
      dueCount,
      knownCount,
      actionLabel: mastery > 0 ? 'Continue' : 'Start',
    };
  });
}

export function makeVocabularySessionId(practiceTypeId: VocabularyPracticeTypeId, setId: string) {
  return `${practiceTypeId}--${setId}`;
}

export function parseVocabularySessionId(sessionId: string): { practiceTypeId: VocabularyPracticeTypeId; setId: string } {
  const [practiceTypeIdInput, ...setParts] = sessionId.split('--');
  const practiceTypeId = practiceTypeIds.includes(practiceTypeIdInput as VocabularyPracticeTypeId) ? (practiceTypeIdInput as VocabularyPracticeTypeId) : fallbackPracticeTypeId;
  const setIdInput = setParts.join('--') || fallbackSetId;
  const setId = setsById.has(setIdInput) ? setIdInput : fallbackSetId;

  return { practiceTypeId, setId };
}

function sortWordsForPractice(words: VocabularyWordCard[], progress: Map<string, VocabularyProgress>) {
  return [...words].sort((a, b) => {
    const progressA = progress.get(a.id);
    const progressB = progress.get(b.id);
    const dueA = progressA && isVocabularyReviewDue(progressA) ? 0 : 1;
    const dueB = progressB && isVocabularyReviewDue(progressB) ? 0 : 1;

    if (dueA !== dueB) return dueA - dueB;
    if ((progressA?.mastery ?? 0) !== (progressB?.mastery ?? 0)) return (progressA?.mastery ?? 0) - (progressB?.mastery ?? 0);
    return a.sortOrder - b.sortOrder;
  });
}

export function selectVocabularyWords(
  practiceTypeId: VocabularyPracticeTypeId,
  setId: string,
  progressInput: VocabularyProgress[] = getInitialVocabularyProgress(),
  limit = 6,
) {
  const set = getVocabularySetById(setId) ?? getVocabularySetById(fallbackSetId);
  const progress = new Map(mergeVocabularyProgress(progressInput).map((item) => [item.wordId, item]));
  const words = (set?.wordIds ?? []).map((wordId) => wordsById.get(wordId)).filter(Boolean) as unknown as VocabularyWordCard[];
  const now = new Date();

  const filtered = words.filter((word) => {
    const wordProgress = progress.get(word.id) ?? normalizeProgress({ wordId: word.id });

    if (practiceTypeId === 'learn-new') return wordProgress.state === 'new' || wordProgress.state === 'learning';
    if (practiceTypeId === 'review-due') return isVocabularyReviewDue(wordProgress, now);
    if (practiceTypeId === 'weak-words') return wordProgress.mastery < 65 || wordProgress.incorrectCount > 0;
    if (practiceTypeId === 'saved-words') return wordProgress.saved;
    return true;
  });

  const selected = filtered.length ? filtered : words;
  return sortWordsForPractice(selected, progress).slice(0, limit);
}

export function createVocabularySession(
  practiceTypeId: VocabularyPracticeTypeId,
  setId: string,
  progress: VocabularyProgress[] = getInitialVocabularyProgress(),
): VocabularySession {
  const set = getVocabularySetById(setId) ?? getVocabularySetById(fallbackSetId);
  const practiceType = getVocabularyPracticeTypes().find((item) => item.id === practiceTypeId) ?? getVocabularyPracticeTypes()[0];
  const words = selectVocabularyWords(practiceTypeId, set?.id ?? fallbackSetId, progress, 6);
  const createdAt = new Date().toISOString();

  return {
    id: makeVocabularySessionId(practiceTypeId, set?.id ?? fallbackSetId),
    practiceTypeId,
    setId: set?.id ?? fallbackSetId,
    title: `${practiceType.title} - ${set?.title ?? 'Academic Core'}`,
    wordIds: words.map((word) => word.id),
    currentIndex: 0,
    status: 'in-progress',
    startedAt: createdAt,
    updatedAt: createdAt,
    completedAt: null,
    results: [],
  };
}

export function getVocabularySessionSeed(sessionId: string, progress: VocabularyProgress[] = getInitialVocabularyProgress()) {
  const parsed = parseVocabularySessionId(sessionId);
  return createVocabularySession(parsed.practiceTypeId, parsed.setId, progress);
}

function rotateOptions(options: VocabularyExerciseOption[], offset: number) {
  if (!options.length) return options;
  const normalizedOffset = offset % options.length;
  return [...options.slice(normalizedOffset), ...options.slice(0, normalizedOffset)];
}

function makeOptions(correct: VocabularyExerciseOption, distractors: string[], offset: number) {
  const options = [
    correct,
    ...distractors.slice(0, 3).map((label, index) => ({ id: `${correct.id}-d${index + 1}`, label, isCorrect: false })),
  ];

  return rotateOptions(options, offset);
}

function getDistractorWords(word: VocabularyWordCard, allWords: VocabularyWordCard[]) {
  const sameSet = allWords.filter((item) => item.setId === word.setId && item.id !== word.id);
  const otherSets = allWords.filter((item) => item.setId !== word.setId && item.id !== word.id);
  return [...sameSet, ...otherSets];
}

export function buildVocabularyExercise(word: VocabularyWordCard, index: number, allWords = getVocabularyWords()): VocabularyExercise {
  const type = exerciseTypes[index % exerciseTypes.length];
  const distractors = getDistractorWords(word, allWords);
  const correctOptionId = `${word.id}-${type}-correct`;
  const offset = word.id.length + index;

  if (type === 'fill-in-blank') {
    const blankStem = word.toeflExample.replace(new RegExp(`\\b${word.word}\\b`, 'i'), '_____');
    return {
      id: `${word.id}-${type}`,
      type,
      prompt: 'Fill in the blank',
      stem: blankStem,
      options: makeOptions({ id: correctOptionId, label: word.word, isCorrect: true }, distractors.map((item) => item.word), offset),
      correctOptionId,
    };
  }

  if (type === 'contextual-use') {
    return {
      id: `${word.id}-${type}`,
      type,
      prompt: 'Choose the TOEFL-context sentence',
      stem: `Which sentence uses "${word.word}" in a suitable academic context?`,
      options: makeOptions({ id: correctOptionId, label: word.toeflExample, isCorrect: true }, distractors.map((item) => item.toeflExample), offset),
      correctOptionId,
    };
  }

  if (type === 'listening-recognition') {
    return {
      id: `${word.id}-${type}`,
      type,
      prompt: 'Listening recognition',
      stem: `You hear: ${word.pronunciationLabel}. Which word matches it?`,
      options: makeOptions({ id: correctOptionId, label: word.word, isCorrect: true }, distractors.map((item) => item.word), offset),
      correctOptionId,
    };
  }

  return {
    id: `${word.id}-${type}`,
    type,
    prompt: 'Meaning recognition',
    stem: `What does "${word.word}" mean?`,
    options: makeOptions({ id: correctOptionId, label: word.definition, isCorrect: true }, distractors.map((item) => item.definition), offset),
    correctOptionId,
  };
}

export function summarizeVocabularySession(
  session: VocabularySession,
  beforeProgressInput: VocabularyProgress[],
  afterProgressInput: VocabularyProgress[],
): VocabularySummary {
  const beforeProgress = new Map(mergeVocabularyProgress(beforeProgressInput).map((item) => [item.wordId, item]));
  const afterProgress = new Map(mergeVocabularyProgress(afterProgressInput).map((item) => [item.wordId, item]));
  const relevantResults = session.results.filter((result) => session.wordIds.includes(result.wordId));
  const correct = relevantResults.filter((result) => result.isCorrect).length;
  const incorrect = relevantResults.length - correct;
  const newlyLearned = relevantResults.filter((result) => beforeProgress.get(result.wordId)?.state === 'new' && afterProgress.get(result.wordId)?.state !== 'new').length;
  const needsReview = relevantResults.filter((result) => {
    const next = afterProgress.get(result.wordId);
    return result.answerKind === 'practice' || !result.isCorrect || next?.state === 'learning';
  }).length;
  const beforeMastery = relevantResults.reduce((sum, result) => sum + (beforeProgress.get(result.wordId)?.mastery ?? 0), 0);
  const afterMastery = relevantResults.reduce((sum, result) => sum + (afterProgress.get(result.wordId)?.mastery ?? 0), 0);
  const masteryChange = relevantResults.length ? Math.round((afterMastery - beforeMastery) / relevantResults.length) : 0;

  return {
    correct,
    incorrect,
    newlyLearned,
    needsReview,
    masteryChange,
    recommendedNextAction: needsReview > correct ? 'Review Due Words ile kısa bir tekrar yap.' : 'Yeni TOEFL setinden 6 kelime daha öğren.',
  };
}

export function getRecentVocabularyActivity(progressInput: VocabularyProgress[] = getInitialVocabularyProgress(), limit = 5): VocabularyActivityItem[] {
  const progress = mergeVocabularyProgress(progressInput);

  return progress
    .filter((item) => item.lastReviewedAt)
    .sort((a, b) => Date.parse(b.lastReviewedAt ?? '') - Date.parse(a.lastReviewedAt ?? ''))
    .slice(0, limit)
    .map((item) => {
      const word = getVocabularyWordById(item.wordId);
      const set = word ? getVocabularySetById(word.setId) : undefined;

      return {
        id: item.wordId,
        word: word?.word ?? item.wordId,
        setTitle: set?.title ?? 'Vocabulary',
        state: item.state,
        reviewedAt: item.lastReviewedAt ?? '',
        result: item.correctStreak > 0 ? 'correct' : 'practice',
      };
    });
}

export function getVocabularyExerciseTypes() {
  return [...exerciseTypes];
}




