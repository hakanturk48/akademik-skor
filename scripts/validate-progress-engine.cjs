const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const typeSource = read('src/lib/progress-engine/types.ts');
const dataSource = read('src/lib/progress-engine/data.ts');
const serviceSource = read('src/lib/progress-engine/service.ts');
const componentSource = read('src/components/student/RecommendationCards.tsx');
const dashboardSource = read('src/components/student/Dashboard.tsx');
const myLearningSource = read('src/components/student/MyLearning.tsx');
const listeningSource = read('src/components/student/ListeningLearningHub.tsx');
const vocabularySource = read('src/components/student/VocabularyLearningScreens.tsx');
const grammarSource = read('src/components/student/GrammarLearningScreens.tsx');
const progressSource = read('src/components/student/PracticeScreens.tsx');
const progressRouteSource = read('src/app/progress/index.tsx');
const packageSource = read('package.json');

for (const token of [
  'practiceAccuracy',
  'recentErrors',
  'questionTypePerformance',
  'subskillMastery',
  'timeSpentMinutes',
  'responseTimeSeconds',
  'lastPracticedAt',
  'vocabularyReviewState',
  'grammarMastery',
  'miniTestScore',
  'mockTestScore',
  'targetScore',
  'targetExamDate',
  'incompleteContentCount',
]) {
  assert.ok(typeSource.includes(token), `${token} signal missing`);
}

for (const token of ['masteryScore', 'recentAccuracy', 'attemptCount', 'lastPracticedAt', 'weaknessScore', 'priorityScore']) {
  assert.ok(typeSource.includes(token), `${token} computed field missing`);
}

for (const token of [
  'watch-lesson',
  'focused-practice',
  'review-mistakes',
  'vocabulary-review',
  'grammar-practice',
  'mini-test',
  'mock-test',
  'writing-feedback-review',
  'speaking-practice',
]) {
  assert.ok(typeSource.includes(`'${token}'`) && dataSource.includes(`type: '${token}'`), `${token} recommendation type missing`);
}

for (const token of ['ProgressFormulaConfig', 'progressFormulaConfig', 'weights', 'contextBoosts', 'calculateWeaknessScore', 'calculatePriorityScore', 'formulaBreakdown']) {
  assert.ok(serviceSource.includes(token) || dataSource.includes(token) || typeSource.includes(token), `${token} formula/config missing`);
}

assert.ok(serviceSource.includes('createContentCatalogService(contentCatalogSeed)'), 'recommendation engine must read taxonomy catalog');
assert.ok(serviceSource.includes('catalogService.catalog.skills'), 'skill metadata should resolve through taxonomy');
assert.ok(serviceSource.includes('catalogService.catalog.subskills'), 'subskill metadata should resolve through taxonomy');
assert.ok(serviceSource.includes("signal.status === 'active'"), 'inactive content filtering missing');
assert.ok(serviceSource.includes('contextAllows'), 'context visibility filtering missing');
assert.ok(serviceSource.includes('visibleInContexts'), 'recommendation context visibility missing');
assert.ok(serviceSource.includes('requiredPlan') && serviceSource.includes('locked'), 'premium entitlement marker missing');
assert.ok(serviceSource.includes('refreshState') && serviceSource.includes('expiresAt'), 'expiry/refresh state missing');
assert.ok(serviceSource.includes('reasonFor') && serviceSource.includes('evidenceFor'), 'explainable reason/evidence missing');
assert.ok(dataSource.includes("status: 'inactive'"), 'inactive fixture missing');
assert.ok(dataSource.includes("requiredPlan: 'premium'") && dataSource.includes('isPremium: true'), 'premium fixture missing');

const recFixtures = (dataSource.match(/id: 'signal-/g) || []).length;
assert.ok(recFixtures >= 9, `expected at least 9 progress signal fixtures, found ${recFixtures}`);

for (const token of ['useWindowDimensions', 'numberOfLines', 'Show reason', 'ProgressRecommendationPanel', 'ProgressRecommendationList']) {
  assert.ok(componentSource.includes(token), `${token} UI marker missing`);
}

assert.ok(dashboardSource.includes('ProgressRecommendationPanel') && dashboardSource.includes('context="dashboard"'), 'Dashboard must use shared recommendation service');
assert.ok(myLearningSource.includes('getTopRecommendation') && myLearningSource.includes("context: 'my-learning'") && !myLearningSource.includes('recommendedNext,'), 'My Learning must use shared top recommendation');
assert.ok(listeningSource.includes('ProgressRecommendationList') && listeningSource.includes('context="listening"') && !listeningSource.includes('getListeningRecommendations'), 'Listening Hub must use shared recommendation list');
assert.ok(vocabularySource.includes('ProgressRecommendationPanel') && vocabularySource.includes('context="vocabulary"'), 'Vocabulary must use shared recommendation panel');
assert.ok(grammarSource.includes('ProgressRecommendationPanel') && grammarSource.includes('context="grammar"'), 'Grammar must use shared recommendation panel');
assert.ok(progressSource.includes('ProgressRecommendationList') && progressSource.includes('context="progress"'), 'My Progress must use shared recommendation list');
assert.ok(progressRouteSource.includes('<MyProgress user={user} />'), 'Progress route must pass user to My Progress');
assert.ok(packageSource.includes('validate:progress-engine'), 'package script validate:progress-engine missing');

console.log('Rule-based progress and recommendation engine validation passed');
console.log('- formula config and score fields: ok');
console.log('- explainable recommendation types: ok');
console.log('- taxonomy-backed skill/subskill labels: ok');
console.log('- inactive and premium filtering markers: ok');
console.log('- shared UI consumers: ok');
console.log('- responsive recommendation cards: ok');
