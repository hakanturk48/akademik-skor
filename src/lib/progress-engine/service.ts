import type { AuthPlan } from '@/lib/auth';
import { contentCatalogSeed, createContentCatalogService } from '@/lib/content';

import { progressFormulaConfig, progressSignalInputs } from './data';
import type {
  FormulaBreakdownItem,
  ProgressEngine,
  ProgressEngineRequest,
  ProgressFormulaConfig,
  ProgressFormulaConfigInput,
  ProgressSignalInput,
  Recommendation,
  RecommendationContext,
  RecommendationPriority,
  RecommendationRefreshState,
  RecommendationRequest,
  SkillProgressSignal,
} from './types';

const catalogService = createContentCatalogService(contentCatalogSeed);
const defaultNow = '2026-09-04T09:00:00.000Z';
const msPerDay = 24 * 60 * 60 * 1000;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function titleize(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toDate(value?: Date | string) {
  if (value instanceof Date) return value;
  return new Date(value ?? defaultNow);
}

function daysSince(isoDate: string | null, now: Date) {
  if (!isoDate) return 45;
  return Math.max(0, Math.floor((now.getTime() - Date.parse(isoDate)) / msPerDay));
}

function daysUntil(isoDate: string, now: Date) {
  return Math.max(0, Math.ceil((Date.parse(isoDate) - now.getTime()) / msPerDay));
}

function parseTargetScore(goal?: string) {
  const match = goal?.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

export function getProgressFormulaConfig(input?: ProgressFormulaConfigInput): ProgressFormulaConfig {
  return {
    ...progressFormulaConfig,
    ...input,
    weights: {
      ...progressFormulaConfig.weights,
      ...input?.weights,
    },
    contextBoosts: {
      ...progressFormulaConfig.contextBoosts,
      ...input?.contextBoosts,
    },
  };
}

function pushBreakdown(items: FormulaBreakdownItem[], key: string, label: string, value: number, weight: number) {
  const contribution = round(value * weight);
  if (contribution <= 0) return;
  items.push({ key, label, value: round(value), weight, contribution });
}

export function calculateWeaknessScore(signal: ProgressSignalInput, config: ProgressFormulaConfig = progressFormulaConfig) {
  const items: FormulaBreakdownItem[] = [];
  const practiceAccuracy = signal.practiceAccuracy ?? signal.recentAccuracy;
  const subskillMastery = signal.subskillMastery ?? signal.masteryScore;
  const masteryGap = Math.max(0, config.targetMastery - signal.masteryScore);
  const accuracyGap = Math.max(0, config.targetAccuracy - signal.recentAccuracy);
  const questionTypeGap = Math.max(0, config.targetAccuracy - signal.questionTypePerformance);
  const responseTimeGap = Math.max(0, signal.responseTimeSeconds - config.targetResponseSeconds);
  const vocabularyDue = signal.vocabularyReviewState ? signal.vocabularyReviewState.dueCount + signal.vocabularyReviewState.weakCount : 0;
  const grammarGap = typeof signal.grammarMastery === 'number' ? Math.max(0, config.targetMastery - signal.grammarMastery) : 0;
  const miniTestGap = typeof signal.miniTestScore === 'number' ? Math.max(0, config.targetAccuracy - signal.miniTestScore) : 0;
  const mockScoreGap = typeof signal.mockTestScore === 'number' ? Math.max(0, signal.targetScore - signal.mockTestScore) : 0;

  pushBreakdown(items, 'mastery-gap', 'Mastery below target', masteryGap, config.weights.masteryGap);
  pushBreakdown(items, 'recent-accuracy-gap', 'Recent accuracy below target', accuracyGap, config.weights.recentAccuracyGap);
  pushBreakdown(items, 'question-type-gap', 'Question type performance gap', questionTypeGap, config.weights.questionTypeGap);
  pushBreakdown(items, 'recent-errors', 'Recent errors', signal.recentErrors, config.weights.recentErrors);
  pushBreakdown(items, 'response-time', 'Slow response time', responseTimeGap, config.weights.responseTime);
  pushBreakdown(items, 'vocabulary-due', 'Vocabulary review pressure', vocabularyDue, config.weights.vocabularyDue);
  pushBreakdown(items, 'grammar-gap', 'Grammar mastery gap', grammarGap, config.weights.grammarGap);
  pushBreakdown(items, 'mini-test-gap', 'Mini test score gap', miniTestGap, config.weights.miniTestGap);
  pushBreakdown(items, 'mock-score-gap', 'Mock score gap', mockScoreGap, config.weights.mockScoreGap);

  const weaknessScore = clamp(round(items.reduce((sum, item) => sum + item.contribution, 0)));

  return {
    weaknessScore,
    formulaBreakdown: items,
    practiceAccuracy,
    subskillMastery,
  };
}

export function calculatePriorityScore(signal: ProgressSignalInput, request: ProgressEngineRequest = {}) {
  const now = toDate(request.now);
  const config = getProgressFormulaConfig(request.formulaConfig);
  const base = calculateWeaknessScore(signal, config);
  const items = [...base.formulaBreakdown];
  const practicedDaysAgo = daysSince(signal.lastPracticedAt, now);
  const examDays = daysUntil(signal.targetExamDate, now);
  const staleDays = Math.max(0, practicedDaysAgo - config.recentPracticeDays);
  const stalePressure = Math.min(staleDays, config.stalePracticeDays);
  const examUrgency = examDays <= 45 ? 1 : examDays <= 90 ? 0.55 : 0;
  const recentlyTestedLowAccuracy = practicedDaysAgo <= config.recentPracticeDays && signal.recentAccuracy < config.targetAccuracy ? 1 : 0;
  const attemptConfidence = signal.attemptCount >= 3 ? 1 : 0;
  const strongRecentPenalty = signal.masteryScore >= config.strongMastery && signal.recentAccuracy >= config.targetAccuracy && practicedDaysAgo <= config.recentPracticeDays ? 1 : 0;

  pushBreakdown(items, 'stale-practice', 'Last practiced date', stalePressure, config.weights.stalePractice);
  pushBreakdown(items, 'recent-low-accuracy', 'Weak and recently tested', recentlyTestedLowAccuracy, config.weights.recentlyTestedLowAccuracy);
  pushBreakdown(items, 'incomplete-content', 'Incomplete content', signal.incompleteContentCount, config.weights.incompleteContent);
  pushBreakdown(items, 'exam-urgency', 'Target exam date pressure', examUrgency, config.weights.examUrgency);
  pushBreakdown(items, 'attempt-confidence', 'Enough attempts to trust signal', attemptConfidence, config.weights.attemptConfidence);

  let priorityScore = base.weaknessScore * 0.68 + items
    .filter((item) => !base.formulaBreakdown.some((baseItem) => baseItem.key === item.key))
    .reduce((sum, item) => sum + item.contribution, 0);

  if (strongRecentPenalty) {
    items.push({ key: 'strong-recent-penalty', label: 'Strong and recently practiced', value: 1, weight: -config.weights.strongRecentPenalty, contribution: -config.weights.strongRecentPenalty });
    priorityScore -= config.weights.strongRecentPenalty;
  }

  if (signal.recommendation.requiredPlan === 'premium' || signal.isPremium) {
    const plan = request.user?.plan ?? 'free';
    if (plan !== 'premium') {
      items.push({ key: 'free-plan-locked-penalty', label: 'Premium action shown lower for free plan', value: 1, weight: -config.weights.freePlanLockedPenalty, contribution: -config.weights.freePlanLockedPenalty });
      priorityScore -= config.weights.freePlanLockedPenalty;
    }
  }

  return {
    priorityScore: clamp(round(priorityScore)),
    weaknessScore: base.weaknessScore,
    formulaBreakdown: items,
    daysSincePractice: practicedDaysAgo,
    daysUntilExam: examDays,
    practiceAccuracy: base.practiceAccuracy,
    subskillMastery: base.subskillMastery,
  };
}

function getSkillTitle(skillSlug: string, fallback?: string) {
  return catalogService.catalog.skills.find((item) => item.slug === skillSlug)?.title ?? fallback ?? titleize(skillSlug);
}

function getSubskillTitle(subskillSlug: string, fallback?: string) {
  return catalogService.catalog.subskills.find((item) => item.slug === subskillSlug || item.id === subskillSlug)?.title ?? fallback ?? titleize(subskillSlug);
}

function getTaskTitle(taskTypeSlug: string | undefined, fallback?: string) {
  if (!taskTypeSlug) return fallback;
  return catalogService.catalog.taskTypes.find((item) => item.slug === taskTypeSlug || item.id === taskTypeSlug)?.title ?? fallback ?? titleize(taskTypeSlug);
}

export function getSkillProgressSignals(request: ProgressEngineRequest = {}): SkillProgressSignal[] {
  const source = request.signals ?? progressSignalInputs;
  const targetScore = parseTargetScore(request.user?.goal);

  return source
    .filter((signal) => request.includeInactive || signal.status === 'active')
    .map((signal) => {
      const scoringInput = targetScore ? { ...signal, targetScore } : signal;
      const score = calculatePriorityScore(scoringInput, request);
      return {
        ...scoringInput,
        skillTitle: getSkillTitle(signal.skillSlug, signal.skillTitle),
        subskillTitle: getSubskillTitle(signal.subskillSlug, signal.subskillTitle),
        taskTypeTitle: getTaskTitle(signal.taskTypeSlug, signal.taskTypeTitle),
        practiceAccuracy: score.practiceAccuracy,
        subskillMastery: score.subskillMastery,
        weaknessScore: score.weaknessScore,
        priorityScore: score.priorityScore,
        daysSincePractice: score.daysSincePractice,
        daysUntilExam: score.daysUntilExam,
        formulaBreakdown: score.formulaBreakdown,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || a.sortOrder - b.sortOrder);
}

function priorityFromScore(score: number): RecommendationPriority {
  if (score >= 82) return 'critical';
  if (score >= 64) return 'high';
  if (score >= 38) return 'medium';
  return 'low';
}

function refreshState(expiresAt: string, now: Date, config: ProgressFormulaConfig): RecommendationRefreshState {
  const remainingHours = (Date.parse(expiresAt) - now.getTime()) / (60 * 60 * 1000);
  if (remainingHours <= 0) return 'expired';
  if (remainingHours <= config.refreshSoonHours) return 'refresh-soon';
  return 'fresh';
}


function reasonFor(signal: SkillProgressSignal) {
  const subskill = signal.subskillTitle.toLowerCase();
  if (signal.vocabularyReviewState && signal.vocabularyReviewState.dueCount > 0) {
    return `${signal.vocabularyReviewState.dueCount} words are due and ${signal.vocabularyReviewState.weakCount} weak words need another pass.`;
  }
  if (typeof signal.grammarMastery === 'number' && signal.grammarMastery < 70) {
    return `${signal.subskillTitle} is at ${signal.grammarMastery}% mastery, below the ${80}% grammar target.`;
  }
  if (signal.recentErrors >= 5 && signal.recentAccuracy < 60) {
    return `You answered ${signal.recentAccuracy}% of ${subskill} items correctly recently and logged ${signal.recentErrors} recent errors.`;
  }
  if (typeof signal.miniTestScore === 'number' && signal.miniTestScore < 70) {
    return `Your latest mini test signal is ${signal.miniTestScore}%, so this focus area is ready for a short check.`;
  }
  if (typeof signal.mockTestScore === 'number' && signal.mockTestScore < signal.targetScore) {
    return `Your latest mock score is ${signal.mockTestScore}/120, leaving ${signal.targetScore - signal.mockTestScore} points to your target.`;
  }
  if (signal.incompleteContentCount > 0) {
    return `${signal.incompleteContentCount} related learning item is unfinished and can support ${subskill}.`;
  }
  if (signal.daysSincePractice > 7) {
    return `You have not practiced ${subskill} for ${signal.daysSincePractice} days.`;
  }
  return `${signal.subskillTitle} is the next useful step based on recent accuracy and mastery.`;
}

function evidenceFor(signal: SkillProgressSignal) {
  const evidence = [
    `Mastery ${signal.masteryScore}/100`,
    `Recent accuracy ${signal.recentAccuracy}%`,
    `${signal.recentErrors} recent errors`,
    `Last practiced ${signal.daysSincePractice} day${signal.daysSincePractice === 1 ? '' : 's'} ago`,
  ];
  if (signal.vocabularyReviewState) evidence.push(`${signal.vocabularyReviewState.dueCount} vocabulary items due`);
  if (typeof signal.grammarMastery === 'number') evidence.push(`Grammar mastery ${signal.grammarMastery}%`);
  if (typeof signal.miniTestScore === 'number') evidence.push(`Mini test ${signal.miniTestScore}%`);
  if (typeof signal.mockTestScore === 'number') evidence.push(`Mock ${signal.mockTestScore}/120`);
  if (signal.incompleteContentCount > 0) evidence.push(`${signal.incompleteContentCount} incomplete item${signal.incompleteContentCount === 1 ? '' : 's'}`);
  return evidence;
}

function contextAllows(signal: SkillProgressSignal, context?: RecommendationContext) {
  if (!context) return true;
  return !signal.recommendation.visibleInContexts || signal.recommendation.visibleInContexts.includes(context);
}

function contextScore(signal: SkillProgressSignal, context: RecommendationContext | undefined, config: ProgressFormulaConfig) {
  const boost = context ? config.contextBoosts[context]?.[signal.recommendation.type] ?? 0 : 0;
  return clamp(signal.priorityScore + boost);
}

function buildRecommendation(signal: SkillProgressSignal, request: RecommendationRequest, config: ProgressFormulaConfig, now: Date): Recommendation {
  const template = signal.recommendation;
  const requiredPlan: AuthPlan = template.requiredPlan ?? (template.isPremium || signal.isPremium ? 'premium' : 'free');
  const isPremium = template.isPremium ?? signal.isPremium;
  const locked = requiredPlan === 'premium' && request.user?.plan !== 'premium';
  const priorityScore = contextScore(signal, request.context, config);
  const expiresAt = template.expiresAt ?? new Date(now.getTime() + 3 * msPerDay).toISOString();

  return {
    id: `rec-${signal.id}`,
    type: template.type,
    title: template.title,
    reason: reasonFor(signal),
    estimatedMinutes: template.estimatedMinutes,
    skill: signal.skillSlug,
    skillTitle: signal.skillTitle,
    subskill: signal.subskillSlug,
    subskillTitle: signal.subskillTitle,
    taskTypeSlug: signal.taskTypeSlug,
    taskTypeTitle: signal.taskTypeTitle,
    topicSlug: signal.topicSlug,
    topicTitle: signal.topicTitle,
    contentId: template.contentId,
    action: {
      href: template.actionHref,
      label: template.actionLabel,
      contentId: template.contentId,
    },
    priority: priorityFromScore(priorityScore),
    priorityScore,
    requiredPlan,
    isPremium,
    locked,
    expiresAt,
    refreshState: refreshState(expiresAt, now, config),
    generatedAt: now.toISOString(),
    evidence: evidenceFor(signal),
    sourceSignalId: signal.id,
  };
}

export function getRecommendations(request: RecommendationRequest = {}): Recommendation[] {
  const now = toDate(request.now);
  const config = getProgressFormulaConfig(request.formulaConfig);
  const signals = getSkillProgressSignals(request)
    .filter((signal) => !request.skill || signal.skillSlug === request.skill)
    .filter((signal) => contextAllows(signal, request.context));

  const recommendations = signals
    .map((signal) => buildRecommendation(signal, request, config, now))
    .sort((a, b) => b.priorityScore - a.priorityScore || a.estimatedMinutes - b.estimatedMinutes || a.title.localeCompare(b.title));

  return typeof request.limit === 'number' ? recommendations.slice(0, request.limit) : recommendations;
}

export function getTopRecommendation(request: RecommendationRequest = {}) {
  return getRecommendations({ ...request, limit: 1 })[0] ?? null;
}

export function createProgressEngine(configInput?: ProgressFormulaConfigInput, signals: ProgressSignalInput[] = progressSignalInputs): ProgressEngine {
  return {
    getFormulaConfig: () => getProgressFormulaConfig(configInput),
    getSkillProgressSignals: (request = {}) => getSkillProgressSignals({ ...request, formulaConfig: request.formulaConfig ?? configInput, signals: request.signals ?? signals }),
    getRecommendations: (request = {}) => getRecommendations({ ...request, formulaConfig: request.formulaConfig ?? configInput, signals: request.signals ?? signals }),
    getTopRecommendation: (request = {}) => getTopRecommendation({ ...request, formulaConfig: request.formulaConfig ?? configInput, signals: request.signals ?? signals }),
  };
}

export const progressEngine = createProgressEngine();

