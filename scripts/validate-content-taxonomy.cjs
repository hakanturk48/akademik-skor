const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const catalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/lib/content/data/seed.json'), 'utf8'));
const statusValues = new Set(['draft', 'active', 'inactive', 'archived']);
const visibilityValues = new Set(['public', 'authenticated', 'private']);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const collections = [
  'exams','examVersions','skills','taskTypes','subskills','topics','levels','contentTypes','contentTags',
  'courses','modules','lessons','vocabularySets','vocabularyWords','vocabularyProgress','grammarCategories','grammarTopics','grammarLessons','grammarProgress',
  'practiceSets','questions','questionOptions','readingPracticeScreens','tests','testSections','attempts','answers','speakingTasks','speakingAttempts','writingTasks','writingSubmissions','contentProgress','studyPlans','studyPlanTasks','entitlements','featureConfigs',
];
const taxonomized = ['courses','modules','lessons','vocabularySets','grammarLessons','practiceSets','questions','tests','speakingTasks','writingTasks'];

const byId = (collection, id) => catalog[collection].find((item) => item.id === id);
const bySlug = (collection, slug) => catalog[collection].find((item) => item.slug === slug);
const expectRef = (collection, id, label) => assert.ok(byId(collection, id), `${label} missing: ${collection}.${id}`);

for (const collection of collections) {
  assert.ok(Array.isArray(catalog[collection]), `${collection} collection is missing`);
  const slugs = new Set();

  for (const item of catalog[collection]) {
    assert.match(item.slug, slugPattern, `${collection}.${item.id} slug is not kebab-case`);
    assert.ok(!slugs.has(item.slug), `${collection} duplicate slug: ${item.slug}`);
    slugs.add(item.slug);
    assert.ok(statusValues.has(item.status), `${collection}.${item.id} invalid status`);
    assert.ok(visibilityValues.has(item.visibility), `${collection}.${item.id} invalid visibility`);
    assert.equal(typeof item.sortOrder, 'number', `${collection}.${item.id} sortOrder must be number`);
    assert.equal(typeof item.isPremium, 'boolean', `${collection}.${item.id} isPremium must be boolean`);
  }
}

const validateTaxonomy = (item) => {
  const ref = item.taxonomy;
  expectRef('exams', ref.examId, `${item.id}.taxonomy.examId`);
  expectRef('examVersions', ref.examVersionId, `${item.id}.taxonomy.examVersionId`);
  expectRef('skills', ref.skillId, `${item.id}.taxonomy.skillId`);
  expectRef('contentTypes', ref.contentTypeId, `${item.id}.taxonomy.contentTypeId`);
  if (ref.taskTypeId) expectRef('taskTypes', ref.taskTypeId, `${item.id}.taxonomy.taskTypeId`);
  if (ref.levelId) expectRef('levels', ref.levelId, `${item.id}.taxonomy.levelId`);
  ref.subskillIds.forEach((id) => expectRef('subskills', id, `${item.id}.taxonomy.subskillIds`));
  ref.topicIds.forEach((id) => expectRef('topics', id, `${item.id}.taxonomy.topicIds`));
  ref.tagIds.forEach((id) => expectRef('contentTags', id, `${item.id}.taxonomy.tagIds`));
};

for (const collection of taxonomized) catalog[collection].forEach(validateTaxonomy);
catalog.examVersions.forEach((item) => expectRef('exams', item.examId, `${item.id}.examId`));
catalog.taskTypes.forEach((item) => expectRef('skills', item.skillId, `${item.id}.skillId`));
catalog.subskills.forEach((item) => { expectRef('skills', item.skillId, `${item.id}.skillId`); item.taskTypeIds.forEach((id) => expectRef('taskTypes', id, `${item.id}.taskTypeIds`)); });
catalog.topics.forEach((item) => item.skillIds.forEach((id) => expectRef('skills', id, `${item.id}.skillIds`)));
catalog.courses.forEach((item) => item.moduleIds.forEach((id) => expectRef('modules', id, `${item.id}.moduleIds`)));
catalog.modules.forEach((item) => { expectRef('courses', item.courseId, `${item.id}.courseId`); item.lessonIds.forEach((id) => expectRef('lessons', id, `${item.id}.lessonIds`)); });
catalog.lessons.forEach((item) => { expectRef('courses', item.courseId, `${item.id}.courseId`); expectRef('modules', item.moduleId, `${item.id}.moduleId`); });
catalog.vocabularySets.forEach((item) => { expectRef('levels', item.targetLevelId, `${item.id}.targetLevelId`); item.wordIds.forEach((id) => expectRef('vocabularyWords', id, `${item.id}.wordIds`)); });
catalog.vocabularyWords.forEach((item) => { expectRef('vocabularySets', item.setId, `${item.id}.setId`); expectRef('levels', item.levelId, `${item.id}.levelId`); item.tagIds.forEach((id) => expectRef('contentTags', id, `${item.id}.tagIds`)); });
catalog.vocabularyProgress.forEach((item) => expectRef('vocabularyWords', item.wordId, `${item.id}.wordId`));
catalog.grammarCategories.forEach((item) => { expectRef('skills', item.skillId, `${item.id}.skillId`); item.topicIds.forEach((id) => expectRef('grammarTopics', id, `${item.id}.topicIds`)); });
catalog.grammarTopics.forEach((item) => { expectRef('grammarCategories', item.categoryId, `${item.id}.categoryId`); expectRef('levels', item.levelId, `${item.id}.levelId`); item.lessonIds.forEach((id) => expectRef('grammarLessons', id, `${item.id}.lessonIds`)); });
catalog.grammarLessons.forEach((item) => { expectRef('grammarTopics', item.topicId, `${item.id}.topicId`); item.practiceSetIds.forEach((id) => expectRef('practiceSets', id, `${item.id}.practiceSetIds`)); });
catalog.grammarProgress.forEach((item) => { expectRef('grammarTopics', item.grammarTopicId, `${item.id}.grammarTopicId`); item.completedLessonIds.forEach((id) => expectRef('grammarLessons', id, `${item.id}.completedLessonIds`)); });
catalog.practiceSets.forEach((item) => item.questionIds.forEach((id) => expectRef('questions', id, `${item.id}.questionIds`)));
catalog.questions.forEach((item) => { item.optionIds.forEach((id) => expectRef('questionOptions', id, `${item.id}.optionIds`)); if (item.correctOptionId) expectRef('questionOptions', item.correctOptionId, `${item.id}.correctOptionId`); });
catalog.questionOptions.forEach((item) => expectRef('questions', item.questionId, `${item.id}.questionId`));
catalog.tests.forEach((item) => item.sectionIds.forEach((id) => expectRef('testSections', id, `${item.id}.sectionIds`)));
catalog.testSections.forEach((item) => { expectRef('tests', item.testId, `${item.id}.testId`); expectRef('skills', item.skillId, `${item.id}.skillId`); expectRef('taskTypes', item.taskTypeId, `${item.id}.taskTypeId`); item.questionIds.forEach((id) => expectRef('questions', id, `${item.id}.questionIds`)); });
catalog.attempts.forEach((item) => { if (item.testId) expectRef('tests', item.testId, `${item.id}.testId`); if (item.practiceSetId) expectRef('practiceSets', item.practiceSetId, `${item.id}.practiceSetId`); item.answerIds.forEach((id) => expectRef('answers', id, `${item.id}.answerIds`)); });
catalog.answers.forEach((item) => { expectRef('attempts', item.attemptId, `${item.id}.attemptId`); expectRef('questions', item.questionId, `${item.id}.questionId`); if (item.selectedOptionId) expectRef('questionOptions', item.selectedOptionId, `${item.id}.selectedOptionId`); });
catalog.speakingAttempts.forEach((item) => expectRef('speakingTasks', item.speakingTaskId, `${item.id}.speakingTaskId`));
catalog.writingSubmissions.forEach((item) => expectRef('writingTasks', item.writingTaskId, `${item.id}.writingTaskId`));

const contentByType = (contentTypeId, contentId) => {
  const type = byId('contentTypes', contentTypeId);
  return type ? byId(type.collection, contentId) : undefined;
};
catalog.contentProgress.forEach((item) => { expectRef('contentTypes', item.contentTypeId, `${item.id}.contentTypeId`); assert.ok(contentByType(item.contentTypeId, item.contentId), `${item.id}.contentId missing`); });
catalog.studyPlans.forEach((item) => { expectRef('examVersions', item.examVersionId, `${item.id}.examVersionId`); item.taskIds.forEach((id) => expectRef('studyPlanTasks', id, `${item.id}.taskIds`)); });
catalog.studyPlanTasks.forEach((item) => { expectRef('studyPlans', item.studyPlanId, `${item.id}.studyPlanId`); expectRef('contentTypes', item.contentTypeId, `${item.id}.contentTypeId`); expectRef('skills', item.skillId, `${item.id}.skillId`); assert.ok(contentByType(item.contentTypeId, item.contentId), `${item.id}.contentId missing`); });

const pathFromRef = (ref) => ({
  examSlug: byId('exams', ref.examId)?.slug,
  examVersionSlug: byId('examVersions', ref.examVersionId)?.slug,
  skillSlug: byId('skills', ref.skillId)?.slug,
  taskTypeSlug: byId('taskTypes', ref.taskTypeId)?.slug,
  subskillSlug: byId('subskills', ref.subskillIds[0])?.slug,
  topicSlug: byId('topics', ref.topicIds[0])?.slug,
  levelSlug: byId('levels', ref.levelId)?.slug,
  contentTypeSlug: byId('contentTypes', ref.contentTypeId)?.slug,
  tagSlugs: ref.tagIds.map((id) => byId('contentTags', id)?.slug),
});
const matches = (item, query) => {
  if (!query.includeInactive && item.status !== 'active') return false;
  if (query.isPremium !== undefined && item.isPremium !== query.isPremium) return false;
  const p = pathFromRef(item.taxonomy);
  return Object.entries(query).every(([key, value]) => {
    if (['includeInactive', 'isPremium'].includes(key) || value === undefined) return true;
    if (key === 'tagSlugs') return value.every((slug) => p.tagSlugs.includes(slug));
    return p[key] === value;
  });
};
const listTaxonomy = (query) => taxonomized.flatMap((collection) => catalog[collection]).filter((item) => matches(item, query)).sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
const lookup = {
  examSlug: 'toefl',
  examVersionSlug: 'toefl-current',
  skillSlug: 'listening',
  taskTypeSlug: 'academic-talk',
  subskillSlug: 'main-idea',
  topicSlug: 'biology',
  levelSlug: 'intermediate',
};

assert.ok(catalog.lessons.some((item) => item.isPremium), 'premium lesson missing');
assert.ok(catalog.entitlements.some((item) => item.planKey === 'premium' && item.featureKey === 'video.fullAccess' && item.enabled), 'premium video entitlement missing');
assert.equal(listTaxonomy({ contentTypeSlug: 'video-lesson' }).some((item) => item.status === 'inactive'), false, 'inactive content leaked by default');
assert.ok(listTaxonomy({ contentTypeSlug: 'video-lesson', includeInactive: true }).some((item) => item.status === 'inactive'), 'inactive content not included when requested');
assert.equal(listTaxonomy({ skillSlug: 'listening', contentTypeSlug: 'video-lesson' })[0].slug, 'listening-note-map-lecture', 'ordering or video lookup failed');
assert.equal(listTaxonomy({ ...lookup, contentTypeSlug: 'video-lesson' })[0]?.id, 'lesson-listening-note-map', 'same taxonomy video lesson lookup failed');
assert.equal(listTaxonomy({ ...lookup, contentTypeSlug: 'practice-set' })[0]?.id, 'practice-listening-note-map-01', 'same taxonomy practice set lookup failed');
assert.equal(listTaxonomy({ ...lookup, contentTypeSlug: 'mini-test' })[0]?.id, 'test-mini-listening-note-map', 'same taxonomy mini test lookup failed');
assert.ok(bySlug('skills', 'listening'), 'taxonomy slug lookup failed');

console.log('Content taxonomy validation passed');
console.log('- relations: ok');
console.log('- unique slugs: ok');
console.log('- ordering fields: ok');
console.log('- inactive filtering: ok');
console.log('- premium flags: ok');
console.log('- taxonomy lookup: ok');
