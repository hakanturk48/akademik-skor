const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const seed = JSON.parse(read('src/lib/grammar/data/grammar.json'));
const uiSource = read('src/components/student/GrammarLearningScreens.tsx');
const sharedUiSource = read('src/components/student/LearningScaffold.tsx');
const serviceSource = read('src/lib/grammar/service.ts');
const schedulerSource = read('src/lib/grammar/scheduler.ts');
const routeSource = read('src/app/grammar/[topicSlug].tsx');
const mainRouteSource = read('src/app/grammar.tsx');
const registrySource = read('src/lib/navigation/registry.ts');

const expectedCategories = [
  'Sentence Structure',
  'Verb Forms',
  'Agreement',
  'Clauses',
  'Modifiers',
  'Articles',
  'Pronouns',
  'Connectors',
  'Academic Grammar',
  'Writing Grammar',
];
const expectedExerciseTypes = ['multiple-choice', 'sentence-correction', 'fill-in-blank', 'sentence-building'];
const expectedProgressFields = ['lastPracticedAt', 'nextReviewAt', 'correctStreak', 'incorrectCount', 'practiceCount', 'recentErrors', 'difficulty', 'completedSteps', 'state', 'mastery'];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

assert.deepEqual(seed.categories.map((item) => item.title), expectedCategories, 'grammar category order changed');
assert.ok(seed.topics.length >= 16, 'not enough grammar topics');
assert.ok(seed.topics.some((topic) => topic.title === 'Relative Clauses'), 'Relative Clauses topic missing');
assert.ok(seed.topics.some((topic) => topic.title === 'Noun Clauses'), 'Noun Clauses topic missing');
assert.ok(seed.topics.some((topic) => topic.title === 'Adverb Clauses'), 'Adverb Clauses topic missing');
assert.ok(seed.topics.some((topic) => topic.isPremium), 'premium grammar topic fixture missing');

for (const collection of [seed.categories, seed.topics]) {
  const ids = new Set();
  const slugs = new Set();
  for (const item of collection) {
    assert.match(item.slug, slugPattern, `${item.id} invalid slug`);
    assert.ok(!ids.has(item.id), `duplicate id ${item.id}`);
    assert.ok(!slugs.has(item.slug), `duplicate slug ${item.slug}`);
    ids.add(item.id);
    slugs.add(item.slug);
    assert.equal(item.status, 'active', `${item.id} should be active fixture`);
    assert.equal(item.visibility, 'authenticated', `${item.id} visibility should match student area`);
    assert.equal(typeof item.sortOrder, 'number', `${item.id} sortOrder missing`);
    assert.ok(item.createdAt && item.updatedAt, `${item.id} timestamps missing`);
  }
}

for (const category of seed.categories) {
  assert.ok(category.topicIds.length > 0, `${category.id} needs topics`);
  assert.ok(category.topicIds.every((topicId) => seed.topics.some((topic) => topic.id === topicId && topic.categoryId === category.id)), `${category.id} topic relation broken`);
  assert.ok(category.taxonomy && category.taxonomy.skillSlug === 'grammar', `${category.id} taxonomy missing`);
}

for (const topic of seed.topics) {
  assert.ok(seed.categories.some((category) => category.id === topic.categoryId), `${topic.id} category relation broken`);
  assert.ok(topic.rules.length >= 2, `${topic.id} needs rules`);
  assert.ok(topic.positiveExamples.length && topic.negativeExamples.length && topic.academicExamples.length, `${topic.id} examples incomplete`);
  assert.ok(topic.commonMistakes.length, `${topic.id} common mistakes missing`);
  assert.deepEqual(topic.questions.map((question) => question.type).sort(), expectedExerciseTypes.sort(), `${topic.id} exercise type coverage missing`);
  assert.ok(topic.questions.every((question) => question.options.some((option) => option.id === question.correctOptionId && option.isCorrect)), `${topic.id} correct option relation broken`);
  assert.ok(topic.taxonomy && topic.taxonomy.skillSlug === 'grammar' && topic.taxonomy.topicSlug === topic.slug, `${topic.id} taxonomy path broken`);
}

assert.ok(seed.progress.every((item) => expectedProgressFields.every((field) => Object.prototype.hasOwnProperty.call(item, field))), 'GrammarProgress fields are incomplete');
assert.ok(new Set(seed.progress.map((item) => item.state)).has('needs-practice'), 'needs-practice state seed missing');
assert.ok(new Set(seed.progress.map((item) => item.state)).has('mastered'), 'mastered state seed missing');

assert.ok(uiSource.includes('Grammar Mastery') && uiSource.includes('Topics Learned') && uiSource.includes('Needs Practice') && uiSource.includes('Weekly Practice'), 'top stats missing');
assert.ok(uiSource.includes('Personalized Practice') && uiSource.includes('Choose a Topic'), 'main CTAs missing');
assert.ok(uiSource.includes('Learn') && uiSource.includes('Examples') && uiSource.includes('Common Mistakes') && uiSource.includes('Guided Practice') && uiSource.includes('Mini Quiz') && uiSource.includes('Results'), 'topic detail flow missing');
assert.ok(uiSource.includes('Skeleton') && uiSource.includes('EmptyState') && uiSource.includes('ErrorState'), 'loading/empty/error states missing');
assert.ok(uiSource.includes('useWindowDimensions') && uiSource.includes('isMobile') && uiSource.includes('isTablet') && uiSource.includes('categoryWidth'), 'responsive layout markers missing');
assert.ok(uiSource.includes('minHeight: 44') && uiSource.includes('minHeight: 52'), 'touch target baseline missing');
assert.ok(uiSource.includes('fontWeight: \'500\'') && uiSource.includes('fontWeight: \'700\''), 'font weight baseline missing');

assert.ok(sharedUiSource.includes('LearningMetricGrid') && sharedUiSource.includes('LearningActionCard') && sharedUiSource.includes('LearningIconBubble'), 'shared learning components missing');
assert.ok(serviceSource.includes('getRecommendedGrammarTopics') && serviceSource.includes('mastery') && serviceSource.includes('recentErrors') && serviceSource.includes('lastPracticedAt') && serviceSource.includes('difficulty'), 'rule-based recommendation signals missing');
assert.ok(serviceSource.includes('createGrammarSession') && serviceSource.includes('evaluateGrammarAnswer') && serviceSource.includes('summarizeGrammarSession'), 'grammar session service missing');
assert.ok(!serviceSource.toLowerCase().includes('openai') && !serviceSource.toLowerCase().includes('ai.'), 'grammar service should stay rule-based');
assert.ok(schedulerSource.includes('getNextGrammarProgress') && schedulerSource.includes('nextReviewAt') && schedulerSource.includes('correctStreak') && schedulerSource.includes('recentErrors'), 'deterministic scheduler missing');
assert.ok(mainRouteSource.includes('GrammarLearningPage'), '/grammar should use learning page');
assert.ok(routeSource.includes('useLocalSearchParams') && routeSource.includes('GrammarTopicPage') && routeSource.includes('topicSlug'), 'topic route missing');
assert.ok(registrySource.includes("activeRoutePatterns: ['/grammar', '/grammar/*']"), 'nested grammar active route pattern missing');

console.log('Grammar engine validation passed');
console.log('- category/topic taxonomy: ok');
console.log('- learn-practice-review flow: ok');
console.log('- guided practice exercises: ok');
console.log('- rule-based recommendations: ok');
console.log('- deterministic scheduler: ok');
console.log('- responsive/touch targets: ok');
console.log('- loading/empty/error states: ok');
console.log('- nested route: ok');
