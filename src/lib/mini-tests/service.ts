import type { AuthPlan } from '@/lib/auth';
import {
  contentCatalogSeed,
  createContentCatalogService,
  getActiveSorted,
  type Skill,
  type Subskill,
  type TaskType,
} from '@/lib/content';

import {
  miniTestDefaultSelection,
  miniTestDifficultyOptions,
  miniTestLengthOptions,
  miniTestModeRules,
  miniTestOverviewMetrics,
  miniTestQuestionBank,
  miniTestRecentActivity,
  miniTestWeakSignals,
} from './data';
import type {
  MiniTestActivity,
  MiniTestAttemptResult,
  MiniTestChoice,
  MiniTestDifficulty,
  MiniTestMode,
  MiniTestModeRule,
  MiniTestOverviewMetric,
  MiniTestQuestionBankItem,
  MiniTestQuestionQueryResult,
  MiniTestRecommendation,
  MiniTestSelection,
  MiniTestStepId,
  MiniTestTone,
} from './types';

const catalogService = createContentCatalogService(contentCatalogSeed);
const createdAt = '2026-09-04T00:00:00.000Z';

const stepDefinitions: { id: MiniTestStepId; title: string; description: string }[] = [
  { id: 'skill', title: 'Skill', description: 'Choose the TOEFL skill area.' },
  { id: 'task', title: 'Task Type', description: 'Question types change with the selected skill.' },
  { id: 'subskill', title: 'Focus', description: 'Pick the subskill the test should measure.' },
  { id: 'difficulty', title: 'Difficulty', description: 'Set the level mix for the question bank query.' },
  { id: 'length', title: 'Length', description: 'Choose how many questions to request.' },
  { id: 'mode', title: 'Mode', description: 'Practice gives feedback earlier; exam mode waits.' },
  { id: 'summary', title: 'Summary', description: 'Review the selections and create the attempt.' },
];

const skillToneBySlug: Record<string, MiniTestTone> = {
  reading: 'blue',
  listening: 'teal',
  speaking: 'purple',
  writing: 'orange',
  vocabulary: 'navy',
  grammar: 'yellow',
};

const skillIconBySlug = {
  reading: 'book',
  listening: 'headphones',
  speaking: 'mic',
  writing: 'writing',
  vocabulary: 'star',
  grammar: 'layers',
} as const;

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function slugMatches(value: string | undefined, candidate: string | undefined) {
  return Boolean(candidate) && (!value || value === 'all' || value === candidate);
}

function difficultyLevelSlugs(difficulty: MiniTestDifficulty) {
  return miniTestDifficultyOptions.find((item) => item.id === difficulty)?.levelSlugs ?? miniTestDifficultyOptions[0]!.levelSlugs;
}

function isValidDifficulty(value: string | undefined): value is MiniTestDifficulty {
  return miniTestDifficultyOptions.some((item) => item.id === value);
}

function isValidMode(value: string | undefined): value is MiniTestMode {
  return value === 'practice' || value === 'exam';
}

function normalizeLength(value: string | number | undefined) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return miniTestLengthOptions.includes(parsed as (typeof miniTestLengthOptions)[number]) ? parsed : miniTestDefaultSelection.length;
}

function activeSkillBySlug(slug?: string): Skill | undefined {
  return catalogService.catalog.skills.find((item) => item.slug === slug && item.status === 'active');
}

function activeTaskBySlug(slug?: string): TaskType | undefined {
  return catalogService.catalog.taskTypes.find((item) => item.slug === slug && item.status === 'active');
}

function activeSubskillBySlug(slug?: string): Subskill | undefined {
  return catalogService.catalog.subskills.find((item) => item.slug === slug && item.status === 'active');
}

function taskBelongsToSkill(task: TaskType | undefined, skill: Skill | undefined) {
  return Boolean(task && skill && task.skillId === skill.id);
}

function subskillBelongsToTask(subskill: Subskill | undefined, task: TaskType | undefined) {
  return Boolean(subskill && task && subskill.taskTypeIds.includes(task.id));
}

function hasValidTaxonomy(question: MiniTestQuestionBankItem) {
  const ref = catalogService.resolveTaxonomyRef(question.taxonomy);
  if (!ref) return false;

  const skill = activeSkillBySlug(question.taxonomy.skillSlug);
  const task = activeTaskBySlug(question.taxonomy.taskTypeSlug);
  const subskill = activeSubskillBySlug(question.taxonomy.subskillSlug);

  return taskBelongsToSkill(task, skill) && subskillBelongsToTask(subskill, task);
}

function isEntitled(question: MiniTestQuestionBankItem, plan: AuthPlan) {
  return !question.isPremium || plan === 'premium';
}

function matchesSelection(question: MiniTestQuestionBankItem, selection: MiniTestSelection) {
  const levels = difficultyLevelSlugs(selection.difficulty);
  return (
    slugMatches(selection.skillSlug, question.taxonomy.skillSlug) &&
    slugMatches(selection.taskTypeSlug, question.taxonomy.taskTypeSlug) &&
    slugMatches(selection.subskillSlug, question.taxonomy.subskillSlug) &&
    levels.includes(question.taxonomy.levelSlug ?? 'intermediate')
  );
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function choiceFromSkill(skill: Skill, plan: AuthPlan): MiniTestChoice {
  const count = queryMiniTestQuestions({ ...miniTestDefaultSelection, skillSlug: skill.slug, taskTypeSlug: 'all', subskillSlug: 'all' }, plan).totalMatchingActive;
  return {
    id: skill.id,
    slug: skill.slug,
    title: skill.title,
    description: `${count} active question${count === 1 ? '' : 's'} available`,
    tone: skillToneBySlug[skill.slug] ?? 'blue',
    iconKey: skillIconBySlug[skill.slug as keyof typeof skillIconBySlug] ?? 'quiz',
    sortOrder: skill.sortOrder,
    isPremium: skill.isPremium,
    questionCount: count,
    disabled: count === 0,
    disabledReason: count === 0 ? 'No active questions yet.' : undefined,
  };
}

function choiceFromTask(task: TaskType, selection: MiniTestSelection, plan: AuthPlan): MiniTestChoice {
  const count = queryMiniTestQuestions({ ...selection, taskTypeSlug: task.slug, subskillSlug: 'all' }, plan).totalMatchingActive;
  return {
    id: task.id,
    slug: task.slug,
    title: task.title,
    description: `${count} matching question${count === 1 ? '' : 's'}`,
    tone: skillToneBySlug[selection.skillSlug] ?? 'blue',
    iconKey: 'target',
    sortOrder: task.sortOrder,
    isPremium: task.isPremium,
    questionCount: count,
    disabled: count === 0,
    disabledReason: count === 0 ? 'No active questions for this task yet.' : undefined,
  };
}

function choiceFromSubskill(subskill: Subskill, selection: MiniTestSelection, plan: AuthPlan): MiniTestChoice {
  const count = queryMiniTestQuestions({ ...selection, subskillSlug: subskill.slug }, plan).totalMatchingActive;
  return {
    id: subskill.id,
    slug: subskill.slug,
    title: subskill.title,
    description: `${count} active item${count === 1 ? '' : 's'} in this focus`,
    tone: skillToneBySlug[selection.skillSlug] ?? 'blue',
    iconKey: 'layers',
    sortOrder: subskill.sortOrder,
    isPremium: subskill.isPremium,
    questionCount: count,
    disabled: count === 0,
    disabledReason: count === 0 ? 'No active questions for this focus yet.' : undefined,
  };
}

function fallbackTaskForSkill(skillSlug: string) {
  const skill = activeSkillBySlug(skillSlug) ?? activeSkillBySlug(miniTestDefaultSelection.skillSlug);
  const task = getActiveSorted(catalogService.catalog.taskTypes).find((item) => item.skillId === skill?.id);
  return task?.slug ?? miniTestDefaultSelection.taskTypeSlug;
}

function fallbackSubskillForTask(taskSlug: string) {
  const task = activeTaskBySlug(taskSlug) ?? activeTaskBySlug(miniTestDefaultSelection.taskTypeSlug);
  const subskill = getActiveSorted(catalogService.catalog.subskills).find((item) => task ? item.taskTypeIds.includes(task.id) : false);
  return subskill?.slug ?? miniTestDefaultSelection.subskillSlug;
}

export function getMiniTestSteps() {
  return stepDefinitions;
}

export function getMiniTestOverviewMetrics(): MiniTestOverviewMetric[] {
  return miniTestOverviewMetrics;
}

export function getMiniTestRecentActivity(): MiniTestActivity[] {
  return miniTestRecentActivity;
}

export function getMiniTestModeRule(mode: MiniTestMode): MiniTestModeRule {
  return miniTestModeRules.find((item) => item.mode === mode) ?? miniTestModeRules[0]!;
}

export function getMiniTestSkillChoices(plan: AuthPlan): MiniTestChoice[] {
  return getActiveSorted(catalogService.catalog.skills).map((skill) => choiceFromSkill(skill, plan));
}

export function getMiniTestTaskChoices(selection: MiniTestSelection, plan: AuthPlan): MiniTestChoice[] {
  const skill = activeSkillBySlug(selection.skillSlug);
  return getActiveSorted(catalogService.catalog.taskTypes)
    .filter((task) => task.skillId === skill?.id)
    .map((task) => choiceFromTask(task, selection, plan));
}

export function getMiniTestSubskillChoices(selection: MiniTestSelection, plan: AuthPlan): MiniTestChoice[] {
  const task = activeTaskBySlug(selection.taskTypeSlug);
  return getActiveSorted(catalogService.catalog.subskills)
    .filter((subskill) => task ? subskill.taskTypeIds.includes(task.id) : false)
    .map((subskill) => choiceFromSubskill(subskill, selection, plan));
}

export function getMiniTestDifficultyChoices(): MiniTestChoice[] {
  return miniTestDifficultyOptions.map((item, index) => ({
    id: item.id,
    slug: item.id,
    title: item.title,
    description: item.description,
    tone: index === 0 ? 'navy' : index === 1 ? 'green' : index === 2 ? 'blue' : 'orange',
    iconKey: index === 0 ? 'bolt' : 'target',
    sortOrder: (index + 1) * 10,
  }));
}

export function getMiniTestLengthChoices(selection: MiniTestSelection, plan: AuthPlan): MiniTestChoice[] {
  return miniTestLengthOptions.map((length) => {
    const query = queryMiniTestQuestions({ ...selection, length }, plan);
    return {
      id: String(length),
      slug: String(length),
      title: `${length} questions`,
      description: query.ok ? `${query.questions.length} will be selected` : query.message,
      tone: length === 5 ? 'green' : length === 10 ? 'blue' : 'orange',
      iconKey: 'clock',
      sortOrder: length,
      questionCount: query.totalMatchingActive,
      disabled: !query.ok,
      disabledReason: query.message,
    };
  });
}

export function getMiniTestModeChoices(): MiniTestChoice[] {
  return miniTestModeRules.map((item, index) => ({
    id: item.mode,
    slug: item.mode,
    title: item.title,
    description: item.description,
    tone: item.mode === 'practice' ? 'teal' : 'navy',
    iconKey: item.mode === 'practice' ? 'check' : 'target',
    sortOrder: (index + 1) * 10,
  }));
}

export function queryMiniTestQuestions(selection: MiniTestSelection, plan: AuthPlan): MiniTestQuestionQueryResult {
  const requestedCount = selection.length;
  const seen = new Set<string>();
  let inactiveCount = 0;
  let lockedPremiumCount = 0;
  let duplicateCount = 0;
  let missingTaxonomyCount = 0;
  const candidates: MiniTestQuestionBankItem[] = [];

  for (const question of [...miniTestQuestionBank].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))) {
    if (!matchesSelection(question, selection)) continue;

    if (seen.has(question.id)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(question.id);

    if (!hasValidTaxonomy(question)) {
      missingTaxonomyCount += 1;
      continue;
    }

    if (question.status !== 'active') {
      inactiveCount += 1;
      continue;
    }

    if (!isEntitled(question, plan)) {
      lockedPremiumCount += 1;
      continue;
    }

    candidates.push(question);
  }

  const questions = candidates.slice(0, requestedCount);
  const ok = questions.length >= requestedCount;

  return {
    selection,
    questions,
    requestedCount,
    totalMatchingActive: candidates.length,
    lockedPremiumCount,
    inactiveCount,
    duplicateCount,
    missingTaxonomyCount,
    ok,
    message: ok
      ? undefined
      : `Only ${candidates.length} active ${plan === 'premium' ? '' : 'free '}question${candidates.length === 1 ? '' : 's'} match this selection. Try fewer questions, Adaptive difficulty, or another focus.`,
  };
}

export function normalizeMiniTestSelection(input?: Partial<MiniTestSelection>): MiniTestSelection {
  const skillSlug = activeSkillBySlug(input?.skillSlug)?.slug ?? miniTestDefaultSelection.skillSlug;
  const requestedTask = activeTaskBySlug(input?.taskTypeSlug);
  const taskTypeSlug = taskBelongsToSkill(requestedTask, activeSkillBySlug(skillSlug)) ? requestedTask!.slug : fallbackTaskForSkill(skillSlug);
  const requestedSubskill = activeSubskillBySlug(input?.subskillSlug);
  const subskillSlug = subskillBelongsToTask(requestedSubskill, activeTaskBySlug(taskTypeSlug)) ? requestedSubskill!.slug : fallbackSubskillForTask(taskTypeSlug);

  return {
    skillSlug,
    taskTypeSlug,
    subskillSlug,
    difficulty: input?.difficulty ?? miniTestDefaultSelection.difficulty,
    length: normalizeLength(input?.length),
    mode: input?.mode ?? miniTestDefaultSelection.mode,
  };
}

export function patchMiniTestSelection(selection: MiniTestSelection, patch: Partial<MiniTestSelection>): MiniTestSelection {
  return normalizeMiniTestSelection({ ...selection, ...patch });
}

export function getMiniTestSelectionFromParams(params: Record<string, string | string[] | undefined>): MiniTestSelection {
  const difficulty = scalar(params.difficulty);
  const mode = scalar(params.mode);
  return normalizeMiniTestSelection({
    skillSlug: scalar(params.skill),
    taskTypeSlug: scalar(params.task),
    subskillSlug: scalar(params.subskill),
    difficulty: isValidDifficulty(difficulty) ? difficulty : undefined,
    length: normalizeLength(scalar(params.length)),
    mode: isValidMode(mode) ? mode : undefined,
  });
}

export function getMiniTestStepChoices(step: MiniTestStepId, selection: MiniTestSelection, plan: AuthPlan): MiniTestChoice[] {
  if (step === 'skill') return getMiniTestSkillChoices(plan);
  if (step === 'task') return getMiniTestTaskChoices(selection, plan);
  if (step === 'subskill') return getMiniTestSubskillChoices(selection, plan);
  if (step === 'difficulty') return getMiniTestDifficultyChoices();
  if (step === 'length') return getMiniTestLengthChoices(selection, plan);
  if (step === 'mode') return getMiniTestModeChoices();
  return [];
}

export function getMiniTestSelectionValue(selection: MiniTestSelection, step: MiniTestStepId) {
  if (step === 'skill') return selection.skillSlug;
  if (step === 'task') return selection.taskTypeSlug;
  if (step === 'subskill') return selection.subskillSlug;
  if (step === 'difficulty') return selection.difficulty;
  if (step === 'length') return String(selection.length);
  if (step === 'mode') return selection.mode;
  return 'summary';
}

export function updateMiniTestSelectionForStep(selection: MiniTestSelection, step: MiniTestStepId, value: string): MiniTestSelection {
  if (step === 'skill') return patchMiniTestSelection(selection, { skillSlug: value, taskTypeSlug: undefined, subskillSlug: undefined });
  if (step === 'task') return patchMiniTestSelection(selection, { taskTypeSlug: value, subskillSlug: undefined });
  if (step === 'subskill') return patchMiniTestSelection(selection, { subskillSlug: value });
  if (step === 'difficulty' && isValidDifficulty(value)) return patchMiniTestSelection(selection, { difficulty: value });
  if (step === 'length') return patchMiniTestSelection(selection, { length: normalizeLength(value) });
  if (step === 'mode' && isValidMode(value)) return patchMiniTestSelection(selection, { mode: value });
  return selection;
}

export function getMiniTestSummaryRows(selection: MiniTestSelection) {
  const skill = activeSkillBySlug(selection.skillSlug);
  const task = activeTaskBySlug(selection.taskTypeSlug);
  const subskill = activeSubskillBySlug(selection.subskillSlug);
  const difficulty = miniTestDifficultyOptions.find((item) => item.id === selection.difficulty);
  const mode = getMiniTestModeRule(selection.mode);

  return [
    { label: 'Skill', value: skill?.title ?? selection.skillSlug },
    { label: 'Task Type', value: task?.title ?? selection.taskTypeSlug },
    { label: 'Focus', value: subskill?.title ?? selection.subskillSlug },
    { label: 'Difficulty', value: difficulty?.title ?? selection.difficulty },
    { label: 'Length', value: `${selection.length} questions` },
    { label: 'Mode', value: mode.title },
  ];
}

export function describeMiniTestQuery(selection: MiniTestSelection) {
  return `skill=${selection.skillSlug} task=${selection.taskTypeSlug} subskill=${selection.subskillSlug} difficulty=${selection.difficulty} length=${selection.length} mode=${selection.mode}`;
}

export function getRecommendedMiniTests(plan: AuthPlan): MiniTestRecommendation[] {
  return miniTestWeakSignals.filter((item) => queryMiniTestQuestions(item.selection, plan).questions.length > 0);
}

export function getQuickStartRecommendation(plan: AuthPlan): MiniTestRecommendation {
  return getRecommendedMiniTests(plan)[0] ?? miniTestWeakSignals[0]!;
}

export function createMiniTestAttempt(userId: string, selection: MiniTestSelection, plan: AuthPlan): MiniTestAttemptResult {
  const normalized = normalizeMiniTestSelection(selection);
  const query = queryMiniTestQuestions(normalized, plan);

  if (!query.ok) {
    return { ok: false, reason: query.message ?? 'Not enough questions match this selection.', query };
  }

  const questionIds = query.questions.map((question) => question.id);
  const signature = `${userId}:${describeMiniTestQuery(normalized)}:${questionIds.join(',')}`;
  const skill = activeSkillBySlug(normalized.skillSlug);
  const subskill = activeSubskillBySlug(normalized.subskillSlug);
  const estimatedMinutes = Math.max(5, Math.ceil(query.questions.reduce((sum, question) => sum + question.estimatedSeconds, 0) / 60));
  const slug = `mini-${normalized.skillSlug}-${normalized.subskillSlug}-${normalized.length}-${normalized.mode}`;

  return {
    ok: true,
    query,
    attempt: {
      id: `attempt-${hashString(signature)}`,
      slug,
      title: `${skill?.title ?? 'Mini'} - ${subskill?.title ?? 'Focused'} Test`,
      description: describeMiniTestQuery(normalized),
      status: 'active',
      sortOrder: 10,
      visibility: 'private',
      isPremium: false,
      createdAt,
      updatedAt: createdAt,
      userId,
      selection: normalized,
      questionIds,
      mode: normalized.mode,
      startedAt: new Date().toISOString(),
      statusLabel: normalized.mode === 'exam' ? 'Exam attempt ready' : 'Practice attempt ready',
      estimatedMinutes,
    },
  };
}

export function createQuickMiniTestAttempt(userId: string, plan: AuthPlan): MiniTestAttemptResult {
  return createMiniTestAttempt(userId, getQuickStartRecommendation(plan).selection, plan);
}
