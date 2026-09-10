const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const learningPath = path.join(root, 'src', 'lib', 'student-learning.ts');
const listPath = path.join(root, 'src', 'components', 'student', 'VideoLessons.tsx');
const playerPath = path.join(root, 'src', 'components', 'student', 'VideoPlayer.tsx');

const learning = fs.readFileSync(learningPath, 'utf8');
const list = fs.readFileSync(listPath, 'utf8');
const player = fs.readFileSync(playerPath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const requiredMetadataFields = [
  'category',
  'course',
  'module',
  'skill',
  'taskType',
  'subskill',
  'topic',
  'level',
  'duration',
  'instructor',
  'thumbnail',
  'isPremium',
  'previewDuration',
  'status',
  'tags',
];

for (const field of requiredMetadataFields) {
  assert(new RegExp(`${field}:`).test(learning), `VideoLesson metadata field missing: ${field}`);
}

const categories = ['getting-started', 'reading', 'listening', 'speaking', 'writing', 'vocabulary', 'grammar', 'test-strategies'];
for (const category of categories) {
  assert(learning.includes(`value: '${category}'`) || learning.includes(`${category}:`) || learning.includes(`'${category}':`), `Video category missing: ${category}`);
}

const listeningTasks = ['choose-a-response', 'conversation', 'announcement', 'academic-talk', 'question-strategies', 'note-taking', 'mistake-review'];
for (const task of listeningTasks) {
  assert(learning.includes(task), `Listening task filter missing: ${task}`);
}

const readingTasks = ['main-idea', 'inference', 'vocabulary-in-context', 'rhetorical-purpose', 'sentence-simplification'];
for (const task of readingTasks) {
  assert(learning.includes(task), `Reading task filter missing: ${task}`);
}

assert(learning.includes('videoLessonMetadata'), 'Video lesson metadata map is missing.');
assert(learning.includes('discoverVideoLessons'), 'Video discovery service is missing.');
assert(learning.includes("lesson.status === 'active'"), 'Inactive lessons are not filtered out.');
assert(learning.includes('filters.category') && learning.includes('filters.task') && learning.includes('filters.subskill'), 'Taxonomy lookup does not use category/task/subskill.');
assert(learning.includes('filters.access') && learning.includes('durationMatches'), 'Access and duration filters are not wired.');
assert(learning.includes('recently-added') && learning.includes('most-relevant') && learning.includes('recommended'), 'Required sort modes are missing.');
assert(learning.includes('isPremium: lesson.access ==='), 'Premium flag is not derived consistently from access.');

assert(list.includes('useLocalSearchParams') && list.includes('router.setParams'), 'URL query state is not wired on Video Lessons.');
assert(list.includes('NativeModal') && list.includes('FilterSheet'), 'Mobile filter bottom sheet/drawer is missing.');
assert(list.includes('horizontal={isCompact}') && list.includes('skillChipCompact'), 'Mobile horizontal skill chips or touch target styles are missing.');
assert(list.includes('lesson.taskTypeLabel') && list.includes('lesson.previewDuration') && list.includes('lesson.course'), 'Video cards do not show taxonomy metadata.');
assert(list.includes('getVideoTaskFilters(category)') && list.includes('getVideoSubskillFilters(task)'), 'Second-level task/subskill filters are not connected.');
assert(player.includes('VideoPlayer') && player.includes('getVideoLessonById') && !player.includes('discoverVideoLessons'), 'Video player behavior appears to be coupled to discovery filters.');

console.log('Video discovery validation passed.');