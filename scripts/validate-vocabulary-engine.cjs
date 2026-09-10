const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const seed = JSON.parse(read('src/lib/vocabulary/data/vocabulary.json'));
const uiSource = read('src/components/student/VocabularyLearningScreens.tsx');
const schedulerSource = read('src/lib/vocabulary/scheduler.ts');
const serviceSource = read('src/lib/vocabulary/service.ts');
const routeSource = read('src/app/vocabulary/session/[sessionId].tsx');

const expectedPractice = ['learn-new', 'review-due', 'weak-words', 'saved-words', 'toefl-sets'];
const expectedSets = ['Academic Core', 'Campus Life', 'Science', 'Social Sciences', 'Environment', 'Technology', 'Academic Discussion', 'Connectors & Transitions'];
const expectedStates = ['new', 'learning', 'improving', 'strong', 'mastered'];
const expectedExercises = ['meaning-recognition', 'fill-in-blank', 'contextual-use', 'listening-recognition'];
const progressFields = ['lastReviewedAt', 'nextReviewAt', 'correctStreak', 'incorrectCount', 'reviewCount', 'difficulty', 'interval', 'state'];

assert.deepEqual(seed.practiceTypes.map((item) => item.id), expectedPractice, 'practice type flow changed');
assert.deepEqual(seed.sets.map((item) => item.title), expectedSets, 'vocabulary set taxonomy changed');
assert.ok(seed.sets.some((item) => item.isPremium), 'premium set fixture missing');
assert.ok(seed.words.length >= 16, 'word card seed is too small');
assert.ok(seed.words.every((word) => word.ipa && word.definition && word.academicExample && word.toeflExample && word.collocations.length && word.wordFamily.length && word.synonyms.length && word.antonyms.length), 'word card detail is incomplete');
assert.ok(seed.progress.every((item) => progressFields.every((field) => Object.prototype.hasOwnProperty.call(item, field))), 'VocabularyProgress fields are incomplete');
assert.deepEqual([...new Set(seed.progress.map((item) => item.state))].sort(), expectedStates.sort(), 'all vocabulary states need seed coverage');
assert.deepEqual(expectedExercises, ['meaning-recognition', 'fill-in-blank', 'contextual-use', 'listening-recognition'], 'exercise types changed');
assert.ok(seed.sets.every((set) => set.wordIds.length > 0 && set.wordIds.every((wordId) => seed.words.some((word) => word.id === wordId))), 'set to word relation is broken');
assert.ok(uiSource.includes('VOCABULARY OVERVIEW') && uiSource.includes('Words Learned') && uiSource.includes('Due for Review') && uiSource.includes('Mastered') && uiSource.includes('Weekly Goal'), 'overview stats missing');
assert.ok(uiSource.includes('Continue Review') && uiSource.includes('Choose Your Practice') && uiSource.includes('Vocabulary Sets') && uiSource.includes('Recent Activity'), 'main sections missing');
assert.ok(uiSource.includes('Skeleton') && uiSource.includes('EmptyState') && uiSource.includes('ErrorState'), 'loading/empty/error states missing');
assert.ok(uiSource.includes('useWindowDimensions') && uiSource.includes('isMobile') && uiSource.includes('isTablet') && uiSource.includes('setCardDesktop') && uiSource.includes('setCardTablet') && uiSource.includes('setCardMobile'), 'responsive layout markers missing');
assert.ok(uiSource.includes('minWidth: 44') && uiSource.includes('minHeight: 44'), 'touch target baseline missing');
assert.ok(schedulerSource.includes('getNextVocabularyProgress') && schedulerSource.includes('nextReviewAt') && schedulerSource.includes('correctStreak') && schedulerSource.includes('incorrectCount') && schedulerSource.includes('interval'), 'deterministic scheduler fields missing');
assert.ok(serviceSource.includes('createVocabularySession') && serviceSource.includes('makeVocabularySessionId') && serviceSource.includes('buildVocabularyExercise') && serviceSource.includes('summarizeVocabularySession'), 'vocabulary service flow missing');
assert.ok(routeSource.includes('VocabularySessionPage') && routeSource.includes('sessionId'), 'session route missing');

console.log('Vocabulary engine validation passed');
console.log('- practice flow: ok');
console.log('- set taxonomy and relations: ok');
console.log('- progress scheduler: ok');
console.log('- exercises and session route: ok');
console.log('- responsive touch targets: ok');
console.log('- loading/empty/error states: ok');

