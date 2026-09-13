import { contentCatalogSeed } from './seed';

import type {
  AnyTaxonomizedContent,
  BaseEntity,
  CatalogCollectionName,
  ContentCatalog,
  ContentLookupQuery,
  TaxonomyRef,
  TaxonomySlugPath,
  ValidationIssue,
} from './types';

const validStatuses = new Set(['draft', 'active', 'inactive', 'archived']);
const validVisibilities = new Set(['public', 'authenticated', 'private']);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const taxonomyCollections = [
  'exams',
  'examVersions',
  'skills',
  'taskTypes',
  'subskills',
  'topics',
  'levels',
  'contentTypes',
  'contentTags',
] as const;

export const taxonomizedCollections = [
  'courses',
  'modules',
  'lessons',
  'vocabularySets',
  'grammarLessons',
  'practiceSets',
  'questions',
  'tests',
  'speakingTasks',
  'writingTasks',
] as const;

export const catalogCollections = [
  ...taxonomyCollections,
  'courses',
  'modules',
  'lessons',
  'vocabularySets',
  'vocabularyWords',
  'vocabularyProgress',
  'grammarCategories',
  'grammarTopics',
  'grammarLessons',
  'grammarProgress',
  'practiceSets',
  'questions',
  'questionOptions',
  'readingPracticeScreens',
  'tests',
  'testSections',
  'attempts',
  'answers',
  'speakingTasks',
  'speakingAttempts',
  'writingTasks',
  'writingSubmissions',
  'contentProgress',
  'studyPlans',
  'studyPlanTasks',
  'entitlements',
  'featureConfigs',
] as const satisfies readonly CatalogCollectionName[];

function collectionItems(catalog: ContentCatalog, collection: CatalogCollectionName): BaseEntity[] {
  return (catalog[collection] ?? []) as unknown as BaseEntity[];
}

function findById<T extends BaseEntity>(items: T[], id?: string): T | undefined {
  return id ? items.find((item) => item.id === id) : undefined;
}

function findBySlug<T extends BaseEntity>(items: T[], slug?: string): T | undefined {
  return slug ? items.find((item) => item.slug === slug) : undefined;
}

function isDefined<T>(item: T | undefined): item is T {
  return item !== undefined;
}

function hasTaxonomy(item: unknown): item is AnyTaxonomizedContent {
  return typeof item === 'object' && item !== null && 'taxonomy' in item;
}

function pushIssue(
  issues: ValidationIssue[],
  code: string,
  message: string,
  collection?: CatalogCollectionName,
  entityId?: string,
) {
  issues.push({ code, collection, entityId, message });
}

export function getEntityBySlug<T extends BaseEntity = BaseEntity>(
  catalog: ContentCatalog,
  collection: CatalogCollectionName,
  slug: string,
): T | undefined {
  return collectionItems(catalog, collection).find((item) => item.slug === slug) as T | undefined;
}

export function getEntityById<T extends BaseEntity = BaseEntity>(
  catalog: ContentCatalog,
  collection: CatalogCollectionName,
  id: string,
): T | undefined {
  return collectionItems(catalog, collection).find((item) => item.id === id) as T | undefined;
}

export function getActiveSorted<T extends BaseEntity>(items: T[], includeInactive = false): T[] {
  return [...items]
    .filter((item) => includeInactive || item.status === 'active')
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export function isPremiumContent(item: BaseEntity): boolean {
  return item.isPremium;
}

export function getTaxonomySlugPath(catalog: ContentCatalog, ref: TaxonomyRef): TaxonomySlugPath | undefined {
  const exam = findById(catalog.exams, ref.examId);
  const examVersion = findById(catalog.examVersions, ref.examVersionId);
  const skill = findById(catalog.skills, ref.skillId);
  const taskType = findById(catalog.taskTypes, ref.taskTypeId);
  const level = findById(catalog.levels, ref.levelId);
  const contentType = findById(catalog.contentTypes, ref.contentTypeId);
  const subskills = ref.subskillIds.map((id) => findById(catalog.subskills, id)).filter(isDefined);
  const topics = ref.topicIds.map((id) => findById(catalog.topics, id)).filter(isDefined);
  const tags = ref.tagIds.map((id) => findById(catalog.contentTags, id)).filter(isDefined);

  if (!exam || !examVersion || !skill || !contentType || subskills.length !== ref.subskillIds.length || topics.length !== ref.topicIds.length || tags.length !== ref.tagIds.length) {
    return undefined;
  }

  return {
    examSlug: exam.slug,
    examVersionSlug: examVersion.slug,
    skillSlug: skill.slug,
    taskTypeSlug: taskType?.slug,
    subskillSlug: subskills[0]?.slug,
    topicSlug: topics[0]?.slug,
    levelSlug: level?.slug,
    contentTypeSlug: contentType.slug,
    tagSlugs: tags.map((tag) => tag.slug),
  };
}

export function getTaxonomyBreadcrumb(catalog: ContentCatalog, ref: TaxonomyRef): string[] {
  const path = getTaxonomySlugPath(catalog, ref);

  if (!path) {
    return [];
  }

  return [
    path.examSlug,
    path.examVersionSlug,
    path.skillSlug,
    path.taskTypeSlug,
    path.subskillSlug,
    path.topicSlug,
    path.levelSlug,
    path.contentTypeSlug,
  ].filter(Boolean) as string[];
}

export function resolveTaxonomyRef(catalog: ContentCatalog, path: TaxonomySlugPath): TaxonomyRef | undefined {
  const exam = findBySlug(catalog.exams, path.examSlug);
  const examVersion = findBySlug(catalog.examVersions, path.examVersionSlug);
  const skill = findBySlug(catalog.skills, path.skillSlug);
  const taskType = findBySlug(catalog.taskTypes, path.taskTypeSlug);
  const subskill = findBySlug(catalog.subskills, path.subskillSlug);
  const topic = findBySlug(catalog.topics, path.topicSlug);
  const level = findBySlug(catalog.levels, path.levelSlug);
  const contentType = findBySlug(catalog.contentTypes, path.contentTypeSlug);
  const tags = path.tagSlugs?.map((slug) => findBySlug(catalog.contentTags, slug)).filter(isDefined) ?? [];

  if (!exam || !examVersion || !skill || !contentType || tags.length !== (path.tagSlugs?.length ?? 0)) {
    return undefined;
  }

  return {
    examId: exam.id,
    examVersionId: examVersion.id,
    skillId: skill.id,
    taskTypeId: taskType?.id,
    subskillIds: subskill ? [subskill.id] : [],
    topicIds: topic ? [topic.id] : [],
    levelId: level?.id,
    contentTypeId: contentType.id,
    tagIds: tags.map((tag) => tag.id),
  };
}

function queryMatchesPath(path: TaxonomySlugPath | undefined, query: ContentLookupQuery): boolean {
  if (!path) {
    return false;
  }

  const tagMatch = query.tagSlugs ? query.tagSlugs.every((slug) => path.tagSlugs?.includes(slug)) : true;

  return (
    (!query.examSlug || path.examSlug === query.examSlug) &&
    (!query.examVersionSlug || path.examVersionSlug === query.examVersionSlug) &&
    (!query.skillSlug || path.skillSlug === query.skillSlug) &&
    (!query.taskTypeSlug || path.taskTypeSlug === query.taskTypeSlug) &&
    (!query.subskillSlug || path.subskillSlug === query.subskillSlug) &&
    (!query.topicSlug || path.topicSlug === query.topicSlug) &&
    (!query.levelSlug || path.levelSlug === query.levelSlug) &&
    (!query.contentTypeSlug || path.contentTypeSlug === query.contentTypeSlug) &&
    tagMatch
  );
}

export function listContentByTaxonomy(catalog: ContentCatalog, query: ContentLookupQuery): AnyTaxonomizedContent[] {
  return taxonomizedCollections
    .flatMap((collection) => catalog[collection] as unknown as AnyTaxonomizedContent[])
    .filter((item) => query.includeInactive || item.status === 'active')
    .filter((item) => query.isPremium === undefined || item.isPremium === query.isPremium)
    .filter((item) => queryMatchesPath(getTaxonomySlugPath(catalog, item.taxonomy), query))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export function listContentByContentType(
  catalog: ContentCatalog,
  contentTypeSlug: string,
  includeInactive = false,
): AnyTaxonomizedContent[] {
  return listContentByTaxonomy(catalog, { contentTypeSlug, includeInactive });
}

export function getContentByTypeAndId(
  catalog: ContentCatalog,
  contentTypeId: string,
  contentId: string,
): BaseEntity | undefined {
  const contentType = findById(catalog.contentTypes, contentTypeId);

  if (!contentType) {
    return undefined;
  }

  return collectionItems(catalog, contentType.collection).find((item) => item.id === contentId);
}

export function validateContentCatalog(catalog: ContentCatalog): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const collection of catalogCollections) {
    const slugs = new Set<string>();

    for (const item of collectionItems(catalog, collection)) {
      if (!slugPattern.test(item.slug)) {
        pushIssue(issues, 'invalid-slug', `Slug must be kebab-case: ${item.slug}`, collection, item.id);
      }

      if (slugs.has(item.slug)) {
        pushIssue(issues, 'duplicate-slug', `Duplicate slug in ${collection}: ${item.slug}`, collection, item.id);
      }

      slugs.add(item.slug);

      if (!validStatuses.has(item.status)) {
        pushIssue(issues, 'invalid-status', `Invalid status: ${item.status}`, collection, item.id);
      }

      if (!validVisibilities.has(item.visibility)) {
        pushIssue(issues, 'invalid-visibility', `Invalid visibility: ${item.visibility}`, collection, item.id);
      }

      if (typeof item.sortOrder !== 'number') {
        pushIssue(issues, 'invalid-sort-order', 'sortOrder must be a number', collection, item.id);
      }

      if (typeof item.isPremium !== 'boolean') {
        pushIssue(issues, 'invalid-premium-flag', 'isPremium must be a boolean', collection, item.id);
      }
    }
  }

  const requireRef = (collection: CatalogCollectionName, id: string | undefined, entityId: string, relation: string) => {
    if (!id || !collectionItems(catalog, collection).some((item) => item.id === id)) {
      pushIssue(issues, 'missing-reference', `Missing ${relation}: ${id ?? 'undefined'}`, collection, entityId);
    }
  };

  const validateTaxonomy = (item: AnyTaxonomizedContent) => {
    requireRef('exams', item.taxonomy.examId, item.id, 'taxonomy.examId');
    requireRef('examVersions', item.taxonomy.examVersionId, item.id, 'taxonomy.examVersionId');
    requireRef('skills', item.taxonomy.skillId, item.id, 'taxonomy.skillId');
    requireRef('contentTypes', item.taxonomy.contentTypeId, item.id, 'taxonomy.contentTypeId');

    if (item.taxonomy.taskTypeId) {
      requireRef('taskTypes', item.taxonomy.taskTypeId, item.id, 'taxonomy.taskTypeId');
    }

    if (item.taxonomy.levelId) {
      requireRef('levels', item.taxonomy.levelId, item.id, 'taxonomy.levelId');
    }

    for (const id of item.taxonomy.subskillIds) {
      requireRef('subskills', id, item.id, 'taxonomy.subskillIds');
    }

    for (const id of item.taxonomy.topicIds) {
      requireRef('topics', id, item.id, 'taxonomy.topicIds');
    }

    for (const id of item.taxonomy.tagIds) {
      requireRef('contentTags', id, item.id, 'taxonomy.tagIds');
    }
  };

  for (const collection of taxonomizedCollections) {
    for (const item of catalog[collection]) {
      if (hasTaxonomy(item)) {
        validateTaxonomy(item);
      }
    }
  }

  for (const version of catalog.examVersions) requireRef('exams', version.examId, version.id, 'examId');
  for (const taskType of catalog.taskTypes) requireRef('skills', taskType.skillId, taskType.id, 'skillId');
  for (const subskill of catalog.subskills) {
    requireRef('skills', subskill.skillId, subskill.id, 'skillId');
    subskill.taskTypeIds.forEach((id) => requireRef('taskTypes', id, subskill.id, 'taskTypeIds'));
  }
  for (const topic of catalog.topics) topic.skillIds.forEach((id) => requireRef('skills', id, topic.id, 'skillIds'));
  for (const course of catalog.courses) course.moduleIds.forEach((id) => requireRef('modules', id, course.id, 'moduleIds'));
  for (const module of catalog.modules) {
    requireRef('courses', module.courseId, module.id, 'courseId');
    module.lessonIds.forEach((id) => requireRef('lessons', id, module.id, 'lessonIds'));
  }
  for (const lesson of catalog.lessons) {
    requireRef('courses', lesson.courseId, lesson.id, 'courseId');
    requireRef('modules', lesson.moduleId, lesson.id, 'moduleId');
  }
  for (const set of catalog.vocabularySets) {
    requireRef('levels', set.targetLevelId, set.id, 'targetLevelId');
    set.wordIds.forEach((id) => requireRef('vocabularyWords', id, set.id, 'wordIds'));
  }
  for (const word of catalog.vocabularyWords) {
    requireRef('vocabularySets', word.setId, word.id, 'setId');
    requireRef('levels', word.levelId, word.id, 'levelId');
    word.tagIds.forEach((id) => requireRef('contentTags', id, word.id, 'tagIds'));
  }
  for (const progress of catalog.vocabularyProgress) requireRef('vocabularyWords', progress.wordId, progress.id, 'wordId');
  for (const category of catalog.grammarCategories) {
    requireRef('skills', category.skillId, category.id, 'skillId');
    category.topicIds.forEach((id) => requireRef('grammarTopics', id, category.id, 'topicIds'));
  }
  for (const topic of catalog.grammarTopics) {
    requireRef('grammarCategories', topic.categoryId, topic.id, 'categoryId');
    requireRef('levels', topic.levelId, topic.id, 'levelId');
    topic.lessonIds.forEach((id) => requireRef('grammarLessons', id, topic.id, 'lessonIds'));
  }
  for (const lesson of catalog.grammarLessons) {
    requireRef('grammarTopics', lesson.topicId, lesson.id, 'topicId');
    lesson.practiceSetIds.forEach((id) => requireRef('practiceSets', id, lesson.id, 'practiceSetIds'));
  }
  for (const progress of catalog.grammarProgress) {
    requireRef('grammarTopics', progress.grammarTopicId, progress.id, 'grammarTopicId');
    progress.completedLessonIds.forEach((id) => requireRef('grammarLessons', id, progress.id, 'completedLessonIds'));
  }
  for (const set of catalog.practiceSets) set.questionIds.forEach((id) => requireRef('questions', id, set.id, 'questionIds'));
  for (const question of catalog.questions) {
    question.optionIds.forEach((id) => requireRef('questionOptions', id, question.id, 'optionIds'));
    if (question.correctOptionId) requireRef('questionOptions', question.correctOptionId, question.id, 'correctOptionId');
  }
  for (const option of catalog.questionOptions) requireRef('questions', option.questionId, option.id, 'questionId');
  for (const test of catalog.tests) test.sectionIds.forEach((id) => requireRef('testSections', id, test.id, 'sectionIds'));
  for (const section of catalog.testSections) {
    requireRef('tests', section.testId, section.id, 'testId');
    requireRef('skills', section.skillId, section.id, 'skillId');
    requireRef('taskTypes', section.taskTypeId, section.id, 'taskTypeId');
    section.questionIds.forEach((id) => requireRef('questions', id, section.id, 'questionIds'));
  }
  for (const attempt of catalog.attempts) {
    if (attempt.testId) requireRef('tests', attempt.testId, attempt.id, 'testId');
    if (attempt.practiceSetId) requireRef('practiceSets', attempt.practiceSetId, attempt.id, 'practiceSetId');
    attempt.answerIds.forEach((id) => requireRef('answers', id, attempt.id, 'answerIds'));
  }
  for (const answer of catalog.answers) {
    requireRef('attempts', answer.attemptId, answer.id, 'attemptId');
    requireRef('questions', answer.questionId, answer.id, 'questionId');
    if (answer.selectedOptionId) requireRef('questionOptions', answer.selectedOptionId, answer.id, 'selectedOptionId');
  }
  for (const attempt of catalog.speakingAttempts) requireRef('speakingTasks', attempt.speakingTaskId, attempt.id, 'speakingTaskId');
  for (const submission of catalog.writingSubmissions) requireRef('writingTasks', submission.writingTaskId, submission.id, 'writingTaskId');
  for (const progress of catalog.contentProgress) {
    requireRef('contentTypes', progress.contentTypeId, progress.id, 'contentTypeId');
    if (!getContentByTypeAndId(catalog, progress.contentTypeId, progress.contentId)) {
      pushIssue(issues, 'missing-content-reference', `Missing content item: ${progress.contentId}`, 'contentProgress', progress.id);
    }
  }
  for (const plan of catalog.studyPlans) {
    requireRef('examVersions', plan.examVersionId, plan.id, 'examVersionId');
    plan.taskIds.forEach((id) => requireRef('studyPlanTasks', id, plan.id, 'taskIds'));
  }
  for (const task of catalog.studyPlanTasks) {
    requireRef('studyPlans', task.studyPlanId, task.id, 'studyPlanId');
    requireRef('contentTypes', task.contentTypeId, task.id, 'contentTypeId');
    requireRef('skills', task.skillId, task.id, 'skillId');
    if (!getContentByTypeAndId(catalog, task.contentTypeId, task.contentId)) {
      pushIssue(issues, 'missing-content-reference', `Missing content item: ${task.contentId}`, 'studyPlanTasks', task.id);
    }
  }

  return issues;
}

export function createContentCatalogService(catalog: ContentCatalog = contentCatalogSeed) {
  return {
    catalog,
    getActiveSorted,
    getContentByTypeAndId: (contentTypeId: string, contentId: string) => getContentByTypeAndId(catalog, contentTypeId, contentId),
    getEntityById: <T extends BaseEntity = BaseEntity>(collection: CatalogCollectionName, id: string) => getEntityById<T>(catalog, collection, id),
    getEntityBySlug: <T extends BaseEntity = BaseEntity>(collection: CatalogCollectionName, slug: string) => getEntityBySlug<T>(catalog, collection, slug),
    getTaxonomyBreadcrumb: (ref: TaxonomyRef) => getTaxonomyBreadcrumb(catalog, ref),
    getTaxonomySlugPath: (ref: TaxonomyRef) => getTaxonomySlugPath(catalog, ref),
    isPremiumContent,
    listContentByContentType: (contentTypeSlug: string, includeInactive = false) => listContentByContentType(catalog, contentTypeSlug, includeInactive),
    listContentByTaxonomy: (query: ContentLookupQuery) => listContentByTaxonomy(catalog, query),
    resolveTaxonomyRef: (path: TaxonomySlugPath) => resolveTaxonomyRef(catalog, path),
    validate: () => validateContentCatalog(catalog),
  };
}
