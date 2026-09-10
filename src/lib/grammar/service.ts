import { grammarSeed } from './data';
import { getNextGrammarProgress, isGrammarReviewDue, mergeCompletedStep } from './scheduler';
import type {
  GrammarActivityItem,
  GrammarCategorySummary,
  GrammarExerciseType,
  GrammarPracticeMode,
  GrammarProgress,
  GrammarQuestion,
  GrammarRecommendation,
  GrammarSession,
  GrammarSessionResult,
  GrammarStep,
  GrammarSummary,
  GrammarTopicCard,
  GrammarTopicSummary,
} from './types';

const practiceModes: GrammarPracticeMode[] = ['personalized', 'topic', 'review'];
const fallbackTopicSlug = 'relative-clauses';
const dayMs = 24 * 60 * 60 * 1000;

const activeCategories = grammarSeed.categories
  .filter((category) => category.status === 'active' && (category.visibility as string) !== 'private')
  .sort((a, b) => a.sortOrder - b.sortOrder);
const activeTopics = grammarSeed.topics
  .filter((topic) => topic.status === 'active' && (topic.visibility as string) !== 'private')
  .sort((a, b) => a.sortOrder - b.sortOrder);
const categoriesById = new Map(activeCategories.map((category) => [category.id, category]));
const topicsById = new Map(activeTopics.map((topic) => [topic.id, topic]));
const topicsBySlug = new Map(activeTopics.map((topic) => [topic.slug, topic]));
const progressByTopicId = new Map(grammarSeed.progress.map((progress) => [progress.topicId, progress]));
const questionsById = new Map(activeTopics.flatMap((topic) => topic.questions).map((question) => [question.id, question]));

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeProgress(progress: Partial<GrammarProgress> & { topicId: string }): GrammarProgress {
  const seedProgress = progressByTopicId.get(progress.topicId);

  return {
    topicId: progress.topicId,
    state: progress.state ?? seedProgress?.state ?? 'not-started',
    mastery: clamp(progress.mastery ?? seedProgress?.mastery ?? 0, 0, 100),
    lastPracticedAt: progress.lastPracticedAt ?? seedProgress?.lastPracticedAt ?? null,
    nextReviewAt: progress.nextReviewAt ?? seedProgress?.nextReviewAt ?? null,
    correctStreak: progress.correctStreak ?? seedProgress?.correctStreak ?? 0,
    incorrectCount: progress.incorrectCount ?? seedProgress?.incorrectCount ?? 0,
    practiceCount: progress.practiceCount ?? seedProgress?.practiceCount ?? 0,
    recentErrors: progress.recentErrors ?? seedProgress?.recentErrors ?? 0,
    difficulty: progress.difficulty ?? seedProgress?.difficulty ?? topicsById.get(progress.topicId)?.difficulty ?? 3,
    completedSteps: progress.completedSteps ?? seedProgress?.completedSteps ?? [],
  };
}

export function getGrammarCategories() {
  return [...activeCategories];
}

export function getGrammarTopics() {
  return [...activeTopics];
}

export function getGrammarTopicBySlug(slug: string) {
  return topicsBySlug.get(slug);
}

export function getGrammarTopicById(topicId: string) {
  return topicsById.get(topicId);
}

export function getGrammarQuestionById(questionId: string) {
  return questionsById.get(questionId);
}

export function getInitialGrammarProgress(): GrammarProgress[] {
  return activeTopics.map((topic) => normalizeProgress({ topicId: topic.id }));
}

export function mergeGrammarProgress(progress: GrammarProgress[] | undefined | null): GrammarProgress[] {
  const incoming = new Map((progress ?? []).map((item) => [item.topicId, item]));
  return activeTopics.map((topic) => normalizeProgress(incoming.get(topic.id) ?? { topicId: topic.id }));
}

export function getGrammarOverview(progressInput: GrammarProgress[] = getInitialGrammarProgress()) {
  const progress = mergeGrammarProgress(progressInput);
  const totalMastery = progress.reduce((sum, item) => sum + item.mastery, 0);
  const sevenDaysAgo = Date.now() - 7 * dayMs;

  return {
    grammarMastery: Math.round(totalMastery / Math.max(progress.length, 1)),
    topicsLearned: progress.filter((item) => item.state !== 'not-started').length,
    needsPractice: progress.filter((item) => item.state === 'needs-practice' || isGrammarReviewDue(item)).length,
    weeklyPractice: progress.filter((item) => item.lastPracticedAt && Date.parse(item.lastPracticedAt) >= sevenDaysAgo).length,
    weeklyGoal: 6,
  };
}

export function getGrammarTopicSummaries(progressInput: GrammarProgress[] = getInitialGrammarProgress()): GrammarTopicSummary[] {
  const progressMap = new Map(mergeGrammarProgress(progressInput).map((item) => [item.topicId, item]));

  return activeTopics.map((topic) => {
    const progress = progressMap.get(topic.id) ?? normalizeProgress({ topicId: topic.id });
    const category = categoriesById.get(topic.categoryId);
    const actionLabel: GrammarTopicSummary['actionLabel'] = progress.practiceCount > 0
      ? isGrammarReviewDue(progress) || progress.state === 'needs-practice' ? 'Review' : 'Continue'
      : 'Start';

    return {
      ...topic,
      categoryTitle: category?.title ?? 'Grammar',
      progress,
      actionLabel,
    };
  });
}

export function getGrammarCategorySummaries(progressInput: GrammarProgress[] = getInitialGrammarProgress()): GrammarCategorySummary[] {
  const summaries = getGrammarTopicSummaries(progressInput);

  return activeCategories.map((category) => {
    const topics = summaries.filter((topic) => topic.categoryId === category.id);
    const mastery = topics.length ? Math.round(topics.reduce((sum, topic) => sum + topic.progress.mastery, 0) / topics.length) : 0;
    const dueCount = topics.filter((topic) => topic.progress.state === 'needs-practice' || isGrammarReviewDue(topic.progress)).length;

    return {
      ...category,
      topicCount: topics.length,
      mastery,
      dueCount,
      topics,
    };
  });
}

function daysSince(isoDate: string | null) {
  if (!isoDate) return 45;
  return Math.max(0, Math.floor((Date.now() - Date.parse(isoDate)) / dayMs));
}

function recommendationReason(topic: GrammarTopicSummary) {
  if (topic.progress.mastery < 50) return 'Low mastery and ready for guided practice';
  if (topic.progress.recentErrors >= 3) return 'Recent mistakes show this topic needs attention';
  if (isGrammarReviewDue(topic.progress)) return 'Due for review based on your last practice';
  if (topic.difficulty >= 4) return 'High-value academic grammar for TOEFL writing';
  return 'Good next step for steady grammar growth';
}

export function getRecommendedGrammarTopics(progressInput: GrammarProgress[] = getInitialGrammarProgress(), limit = 3): GrammarRecommendation[] {
  return getGrammarTopicSummaries(progressInput)
    .map((topic) => {
      const staleDays = daysSince(topic.progress.lastPracticedAt);
      const dueBonus = isGrammarReviewDue(topic.progress) ? 24 : 0;
      const priorityScore = Math.round((100 - topic.progress.mastery) * 1.25 + topic.progress.recentErrors * 14 + Math.min(staleDays, 21) * 1.6 + topic.difficulty * 5 + dueBonus);
      return { topic, reason: recommendationReason(topic), priorityScore };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || a.topic.sortOrder - b.topic.sortOrder)
    .slice(0, limit);
}

export function makeGrammarSessionId(mode: GrammarPracticeMode, topicSlug: string) {
  return `${mode}--${topicSlug}`;
}

export function parseGrammarSessionId(sessionId: string) {
  const [modeInput, ...topicParts] = sessionId.split('--');
  const mode = practiceModes.includes(modeInput as GrammarPracticeMode) ? (modeInput as GrammarPracticeMode) : 'topic';
  const topicSlugInput = topicParts.join('--') || fallbackTopicSlug;
  const topic = getGrammarTopicBySlug(topicSlugInput) ?? getGrammarTopicBySlug(fallbackTopicSlug);
  return { mode, topicSlug: topic?.slug ?? fallbackTopicSlug };
}

function selectGrammarQuestions(topic: GrammarTopicCard, mode: GrammarPracticeMode, progress?: GrammarProgress) {
  const ordered = [...topic.questions].sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id));
  if (mode === 'review' || progress?.state === 'needs-practice') {
    return ordered.sort((a, b) => (a.errorTag === topic.id ? -1 : 1) - (b.errorTag === topic.id ? -1 : 1));
  }
  return ordered;
}

export function createGrammarSession(
  topicSlug: string,
  mode: GrammarPracticeMode,
  progressInput: GrammarProgress[] = getInitialGrammarProgress(),
): GrammarSession {
  const topic = getGrammarTopicBySlug(topicSlug) ?? getGrammarTopicBySlug(fallbackTopicSlug);
  const progress = mergeGrammarProgress(progressInput).find((item) => item.topicId === topic?.id);
  const questions = topic ? selectGrammarQuestions(topic, mode, progress) : [];
  const createdAt = new Date().toISOString();

  return {
    id: makeGrammarSessionId(mode, topic?.slug ?? fallbackTopicSlug),
    topicId: topic?.id ?? fallbackTopicSlug,
    mode,
    title: `${topic?.title ?? 'Grammar'} Practice`,
    questionIds: questions.map((question) => question.id),
    currentIndex: 0,
    status: 'in-progress',
    startedAt: createdAt,
    updatedAt: createdAt,
    completedAt: null,
    results: [],
  };
}

export function getGrammarSessionSeed(sessionId: string, progress: GrammarProgress[] = getInitialGrammarProgress()) {
  const parsed = parseGrammarSessionId(sessionId);
  return createGrammarSession(parsed.topicSlug, parsed.mode, progress);
}

export function markGrammarStep(progressInput: GrammarProgress[], topicId: string, step: GrammarStep) {
  return mergeGrammarProgress(progressInput).map((item) => (item.topicId === topicId ? { ...item, completedSteps: mergeCompletedStep(item, step) } : item));
}

export function evaluateGrammarAnswer(question: GrammarQuestion, selectedOptionId: string): GrammarSessionResult {
  return {
    questionId: question.id,
    exerciseType: question.type,
    isCorrect: selectedOptionId === question.correctOptionId,
    selectedOptionId,
    answeredAt: new Date().toISOString(),
    errorTag: question.errorTag,
  };
}

export function applyGrammarResult(progressInput: GrammarProgress[], topicId: string, result: GrammarSessionResult) {
  return mergeGrammarProgress(progressInput).map((item) => (item.topicId === topicId ? getNextGrammarProgress(item, result) : item));
}

export function summarizeGrammarSession(
  session: GrammarSession,
  beforeProgressInput: GrammarProgress[],
  afterProgressInput: GrammarProgress[],
): GrammarSummary {
  const beforeProgress = mergeGrammarProgress(beforeProgressInput).find((item) => item.topicId === session.topicId);
  const afterProgress = mergeGrammarProgress(afterProgressInput).find((item) => item.topicId === session.topicId);
  const incorrectResults = session.results.filter((result) => !result.isCorrect);
  const correct = session.results.length - incorrectResults.length;
  const accuracy = session.results.length ? Math.round((correct / session.results.length) * 100) : 0;
  const mistakes = [...new Set(incorrectResults.map((result) => result.errorTag))];
  const topic = getGrammarTopicById(session.topicId);
  const nextTopicId = topic?.recommendedNextTopicId;
  const nextTopic = nextTopicId ? getGrammarTopicSummaries(afterProgressInput).find((item) => item.id === nextTopicId) ?? null : null;
  const repeatWeakItems = incorrectResults.map((result) => getGrammarQuestionById(result.questionId)).filter(Boolean) as GrammarQuestion[];

  return {
    accuracy,
    correct,
    incorrect: incorrectResults.length,
    mistakes,
    masteryBefore: beforeProgress?.mastery ?? 0,
    masteryAfter: afterProgress?.mastery ?? 0,
    masteryChange: (afterProgress?.mastery ?? 0) - (beforeProgress?.mastery ?? 0),
    recommendedNextTopic: nextTopic,
    repeatWeakItems,
  };
}

export function getRecentGrammarActivity(progressInput: GrammarProgress[] = getInitialGrammarProgress(), limit = 5): GrammarActivityItem[] {
  return mergeGrammarProgress(progressInput)
    .filter((item) => item.lastPracticedAt)
    .sort((a, b) => Date.parse(b.lastPracticedAt ?? '') - Date.parse(a.lastPracticedAt ?? ''))
    .slice(0, limit)
    .map((item) => {
      const topic = getGrammarTopicById(item.topicId);
      const category = topic ? categoriesById.get(topic.categoryId) : undefined;
      return {
        id: item.topicId,
        topicTitle: topic?.title ?? item.topicId,
        categoryTitle: category?.title ?? 'Grammar',
        state: item.state,
        practicedAt: item.lastPracticedAt ?? '',
        result: item.recentErrors > 0 ? 'needs-practice' : 'correct',
      };
    });
}

export function getGrammarExerciseTypes(): GrammarExerciseType[] {
  return ['multiple-choice', 'sentence-correction', 'fill-in-blank', 'sentence-building'];
}
