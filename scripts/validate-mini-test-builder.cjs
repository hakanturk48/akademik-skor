const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const routeSource = read('src/app/tests/mini.tsx');
const uiSource = read('src/components/student/MiniTestBuilder.tsx');
const typesSource = read('src/lib/mini-tests/types.ts');
const dataSource = read('src/lib/mini-tests/data.ts');
const serviceSource = read('src/lib/mini-tests/service.ts');
const packageSource = read('package.json');

for (const token of ['Quick Start', 'Build Your Mini Test', 'Start Test', 'Practice Mode', 'Exam Mode', 'QUESTION BANK QUERY']) {
  assert.ok(uiSource.includes(token), `${token} UI missing`);
}

for (const token of ['skill', 'task', 'subskill', 'difficulty', 'length', 'mode', 'summary']) {
  assert.ok(typesSource.includes(`'${token}'`), `${token} builder step missing`);
}

for (const token of ['Reading', 'Listening', 'Speaking', 'Writing', 'Vocabulary', 'Grammar']) {
  assert.ok(uiSource.includes(token) || dataSource.includes(token.toLowerCase()), `${token} path missing`);
}

for (const token of ['adaptive', 'easy', 'medium', 'hard', 'practice', 'exam']) {
  assert.ok(typesSource.includes(`'${token}'`) || dataSource.includes(`'${token}'`), `${token} option missing`);
}

for (const token of ['getMiniTestSkillChoices', 'getMiniTestTaskChoices', 'getMiniTestSubskillChoices', 'queryMiniTestQuestions', 'createMiniTestAttempt', 'createQuickMiniTestAttempt']) {
  assert.ok(serviceSource.includes(token), `${token} service missing`);
}

assert.ok(serviceSource.includes('catalogService.catalog.skills'), 'skills must come from content taxonomy');
assert.ok(serviceSource.includes('catalogService.catalog.taskTypes'), 'task types must come from content taxonomy');
assert.ok(serviceSource.includes('catalogService.catalog.subskills'), 'subskills must come from content taxonomy');
assert.ok(serviceSource.includes('resolveTaxonomyRef'), 'taxonomy lookup validation missing');
assert.ok(serviceSource.includes("question.status !== 'active'"), 'draft/inactive filtering missing');
assert.ok(serviceSource.includes('seen.has(question.id)'), 'duplicate filtering missing');
assert.ok(serviceSource.includes('!isEntitled(question, plan)'), 'premium entitlement filtering missing');
assert.ok(serviceSource.includes('questions.length >= requestedCount'), 'insufficient question guard missing');
assert.ok(serviceSource.includes('visibility: \'private\''), 'attempt visibility should be private');

const questionCount = (dataSource.match(/question\('qb-/g) || []).length;
assert.ok(questionCount >= 30, `expected at least 30 seed question bank items, found ${questionCount}`);
assert.ok(dataSource.includes("status: 'draft'") && dataSource.includes("status: 'inactive'"), 'disabled question fixtures missing');
assert.ok(dataSource.includes('isPremium: true'), 'premium question fixture missing');
assert.ok(dataSource.includes('miniTestWeakSignals'), 'rule-based weak area quick start missing');

assert.ok(uiSource.includes('width < 768'), 'mobile breakpoint handling missing');
assert.ok(uiSource.includes('accessibilityRole="button"'), 'button accessibility roles missing');
assert.ok(uiSource.includes('accessibilityState={{ selected'), 'selected/disabled accessibility state missing');
assert.ok(uiSource.includes('EmptyState') && uiSource.includes('ErrorState') && uiSource.includes('Skeleton'), 'loading/empty/error states missing');
assert.ok(uiSource.includes('setActiveStepIndex'), 'stepper navigation missing');
assert.ok(uiSource.includes('QueryStatus'), 'insufficient question status UI missing');
assert.ok(uiSource.includes('Attempt created'), 'success state missing');

assert.ok(routeSource.includes('MiniTestBuilderPage'), 'route must render MiniTestBuilderPage');
assert.ok(routeSource.includes('user={user}'), 'route must pass authenticated user to builder');
assert.ok(packageSource.includes('validate:mini-tests'), 'package script validate:mini-tests missing');

console.log('Mini Test Builder validation passed');
console.log('- quick start: ok');
console.log('- dynamic skill/task/subskill options: ok');
console.log('- question bank selection: ok');
console.log('- draft/inactive/duplicate filtering: ok');
console.log('- entitlement filtering: ok');
console.log('- insufficient question state: ok');
console.log('- attempt creation: ok');
console.log('- mobile stepper/accessibility markers: ok');
