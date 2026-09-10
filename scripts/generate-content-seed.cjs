const fs = require('node:fs');
const path = require('node:path');

const now = '2026-09-04T00:00:00.000Z';
const base = (id, slug, title, extra = {}) => ({
  id,
  slug,
  title,
  status: extra.status || 'active',
  sortOrder: extra.sortOrder || 10,
  visibility: extra.visibility || 'authenticated',
  isPremium: extra.isPremium || false,
  createdAt: now,
  updatedAt: now,
  ...extra,
});
const tx = (skillId, taskTypeId, subskillIds, topicIds, levelId, contentTypeId, tagIds = []) => ({
  examId: 'exam-toefl',
  examVersionId: 'version-toefl-current',
  skillId,
  taskTypeId,
  subskillIds,
  topicIds,
  levelId,
  contentTypeId,
  tagIds,
});

const seed = {
  exams: [base('exam-toefl', 'toefl', 'TOEFL', { description: 'TOEFL iBT preparation catalog.', familySlug: 'toefl' })],
  examVersions: [base('version-toefl-current', 'toefl-current', 'TOEFL Current', { description: 'Current TOEFL iBT structure.', examId: 'exam-toefl', versionCode: 'current', effectiveFrom: '2025-01-01' })],
  skills: [
    base('skill-reading', 'reading', 'Reading', { sortOrder: 10, shortCode: 'R', colorToken: 'blue', iconToken: 'book-open' }),
    base('skill-listening', 'listening', 'Listening', { sortOrder: 20, shortCode: 'L', colorToken: 'green', iconToken: 'headphones' }),
    base('skill-speaking', 'speaking', 'Speaking', { sortOrder: 30, shortCode: 'S', colorToken: 'purple', iconToken: 'mic' }),
    base('skill-writing', 'writing', 'Writing', { sortOrder: 40, shortCode: 'W', colorToken: 'orange', iconToken: 'pencil' }),
    base('skill-vocabulary', 'vocabulary', 'Vocabulary', { sortOrder: 50, shortCode: 'V', colorToken: 'navy', iconToken: 'type' }),
    base('skill-grammar', 'grammar', 'Grammar', { sortOrder: 60, shortCode: 'G', colorToken: 'amber', iconToken: 'target' }),
  ],
  taskTypes: [
    base('task-reading-passage', 'reading-passage', 'Reading Passage', { sortOrder: 10, skillId: 'skill-reading' }),
    base('task-academic-talk', 'academic-talk', 'Academic Talk', { sortOrder: 20, skillId: 'skill-listening' }),
    base('task-independent-speaking', 'independent-speaking', 'Independent Speaking', { sortOrder: 30, skillId: 'skill-speaking' }),
    base('task-integrated-writing', 'integrated-writing', 'Integrated Writing', { sortOrder: 40, skillId: 'skill-writing' }),
    base('task-vocabulary-review', 'vocabulary-review', 'Vocabulary Review', { sortOrder: 50, skillId: 'skill-vocabulary' }),
    base('task-grammar-practice', 'grammar-practice', 'Grammar Practice', { sortOrder: 60, skillId: 'skill-grammar' }),
    base('task-full-mock', 'full-mock', 'Full Mock', { sortOrder: 70, skillId: 'skill-reading', isPremium: true }),
  ],
  subskills: [
    base('sub-main-idea', 'main-idea', 'Main Idea', { sortOrder: 10, skillId: 'skill-listening', taskTypeIds: ['task-academic-talk', 'task-reading-passage'] }),
    base('sub-detail', 'detail', 'Detail', { sortOrder: 20, skillId: 'skill-listening', taskTypeIds: ['task-academic-talk'] }),
    base('sub-inference', 'inference', 'Inference', { sortOrder: 30, skillId: 'skill-reading', taskTypeIds: ['task-reading-passage'] }),
    base('sub-fluency-coherence', 'fluency-coherence', 'Fluency & Coherence', { sortOrder: 40, skillId: 'skill-speaking', taskTypeIds: ['task-independent-speaking'] }),
    base('sub-organization', 'organization', 'Organization', { sortOrder: 50, skillId: 'skill-writing', taskTypeIds: ['task-integrated-writing'] }),
    base('sub-academic-collocations', 'academic-collocations', 'Academic Collocations', { sortOrder: 60, skillId: 'skill-vocabulary', taskTypeIds: ['task-vocabulary-review'] }),
    base('sub-complex-clauses', 'complex-clauses', 'Complex Clauses', { sortOrder: 70, skillId: 'skill-grammar', taskTypeIds: ['task-grammar-practice'] }),
  ],
  topics: [
    base('topic-biology', 'biology', 'Biology', { sortOrder: 10, skillIds: ['skill-listening', 'skill-reading'] }),
    base('topic-campus-life', 'campus-life', 'Campus Life', { sortOrder: 20, skillIds: ['skill-listening', 'skill-speaking'] }),
    base('topic-urban-transportation', 'urban-transportation', 'Urban Transportation', { sortOrder: 30, skillIds: ['skill-reading', 'skill-writing'] }),
    base('topic-sleep-science', 'sleep-science', 'Sleep Science', { sortOrder: 40, skillIds: ['skill-reading'] }),
    base('topic-academic-language', 'academic-language', 'Academic Language', { sortOrder: 50, skillIds: ['skill-vocabulary'] }),
    base('topic-grammar-clauses', 'grammar-clauses', 'Grammar Clauses', { sortOrder: 60, skillIds: ['skill-grammar'] }),
  ],
  levels: [
    base('level-foundation', 'foundation', 'Foundation', { sortOrder: 10, scale: 'platform', rank: 1 }),
    base('level-intermediate', 'intermediate', 'Intermediate', { sortOrder: 20, scale: 'platform', rank: 2 }),
    base('level-advanced', 'advanced', 'Advanced', { sortOrder: 30, scale: 'platform', rank: 3 }),
  ],
  contentTypes: [
    base('ctype-course', 'course', 'Course', { sortOrder: 10, collection: 'courses' }),
    base('ctype-module', 'module', 'Module', { sortOrder: 20, collection: 'modules' }),
    base('ctype-video-lesson', 'video-lesson', 'Video Lesson', { sortOrder: 30, collection: 'lessons' }),
    base('ctype-practice-set', 'practice-set', 'Practice Set', { sortOrder: 40, collection: 'practiceSets' }),
    base('ctype-question', 'question', 'Question', { sortOrder: 45, collection: 'questions' }),
    base('ctype-mini-test', 'mini-test', 'Mini Test', { sortOrder: 50, collection: 'tests' }),
    base('ctype-mock-test', 'mock-test', 'Mock Test', { sortOrder: 60, collection: 'tests' }),
    base('ctype-vocabulary-set', 'vocabulary-set', 'Vocabulary Set', { sortOrder: 70, collection: 'vocabularySets' }),
    base('ctype-grammar-lesson', 'grammar-lesson', 'Grammar Lesson', { sortOrder: 80, collection: 'grammarLessons' }),
    base('ctype-speaking-task', 'speaking-task', 'Speaking Task', { sortOrder: 90, collection: 'speakingTasks' }),
    base('ctype-writing-task', 'writing-task', 'Writing Task', { sortOrder: 100, collection: 'writingTasks' }),
  ],
  contentTags: [
    base('tag-high-yield', 'high-yield', 'High Yield', { sortOrder: 10, groupSlug: 'pedagogy' }),
    base('tag-free-preview', 'free-preview', 'Free Preview', { sortOrder: 20, groupSlug: 'access' }),
    base('tag-timed', 'timed', 'Timed', { sortOrder: 30, groupSlug: 'mode' }),
    base('tag-review', 'review', 'Review', { sortOrder: 40, groupSlug: 'mode' }),
  ],
  courses: [base('course-academic-listening', 'academic-listening', 'Academic Listening', { description: 'Structured listening course for academic talks.', examVersionId: 'version-toefl-current', primarySkillId: 'skill-listening', taxonomy: tx('skill-listening', 'task-academic-talk', ['sub-main-idea'], ['topic-biology'], 'level-intermediate', 'ctype-course', ['tag-high-yield']), moduleIds: ['module-listening-foundations'] })],
  modules: [base('module-listening-foundations', 'listening-foundations', 'Listening Foundations', { courseId: 'course-academic-listening', taxonomy: tx('skill-listening', 'task-academic-talk', ['sub-main-idea'], ['topic-biology'], 'level-intermediate', 'ctype-module', ['tag-high-yield']), lessonIds: ['lesson-listening-note-map', 'lesson-listening-archived-outline'] })],
  lessons: [
    base('lesson-listening-note-map', 'listening-note-map-lecture', 'Lecture 03: Note Taking', { description: 'Note-map strategy for academic talks.', isPremium: true, courseId: 'course-academic-listening', moduleId: 'module-listening-foundations', taxonomy: tx('skill-listening', 'task-academic-talk', ['sub-main-idea'], ['topic-biology'], 'level-intermediate', 'ctype-video-lesson', ['tag-high-yield', 'tag-free-preview']), durationSeconds: 2060, estimatedMinutes: 34, mediaUrl: 'demo://videos/listening-note-map', transcriptId: 'transcript-listening-note-map' }),
    base('lesson-listening-archived-outline', 'archived-outline-lecture', 'Archived Outline Lecture', { status: 'inactive', sortOrder: 90, visibility: 'private', courseId: 'course-academic-listening', moduleId: 'module-listening-foundations', taxonomy: tx('skill-listening', 'task-academic-talk', ['sub-detail'], ['topic-campus-life'], 'level-foundation', 'ctype-video-lesson', ['tag-review']), durationSeconds: 900, estimatedMinutes: 15, mediaUrl: 'demo://videos/archived-outline' }),
  ],
  vocabularySets: [base('vocab-set-academic-collocations', 'academic-collocations-set-08', 'Academic Collocations 08', { taxonomy: tx('skill-vocabulary', 'task-vocabulary-review', ['sub-academic-collocations'], ['topic-academic-language'], 'level-intermediate', 'ctype-vocabulary-set', ['tag-review']), wordIds: ['word-ubiquitous', 'word-mitigate'], targetLevelId: 'level-intermediate' })],
  vocabularyWords: [
    base('word-ubiquitous', 'ubiquitous', 'ubiquitous', { setId: 'vocab-set-academic-collocations', term: 'ubiquitous', meaning: 'present or found everywhere', partOfSpeech: 'adjective', example: 'Digital tools are ubiquitous in modern education.', levelId: 'level-intermediate', tagIds: ['tag-high-yield'] }),
    base('word-mitigate', 'mitigate', 'mitigate', { sortOrder: 20, setId: 'vocab-set-academic-collocations', term: 'mitigate', meaning: 'to make less severe', partOfSpeech: 'verb', example: 'Planning can mitigate traffic congestion.', levelId: 'level-intermediate', tagIds: ['tag-review'] }),
  ],
  vocabularyProgress: [base('vocab-progress-demo-ubiquitous', 'demo-ubiquitous-progress', 'Demo ubiquitous progress', { visibility: 'private', userId: 'demo-user', wordId: 'word-ubiquitous', masteryPercent: 78, reviewDueAt: '2026-09-05T00:00:00.000Z', lastReviewedAt: '2026-09-03T00:00:00.000Z' })],
  grammarCategories: [base('grammar-category-clauses', 'academic-clauses', 'Academic Clauses', { skillId: 'skill-grammar', topicIds: ['grammar-topic-complex-clauses'] })],
  grammarTopics: [base('grammar-topic-complex-clauses', 'complex-sentences-academic-clauses', 'Complex Sentences & Academic Clauses', { categoryId: 'grammar-category-clauses', levelId: 'level-advanced', taxonomy: tx('skill-grammar', 'task-grammar-practice', ['sub-complex-clauses'], ['topic-grammar-clauses'], 'level-advanced', 'ctype-grammar-lesson', ['tag-high-yield']), lessonIds: ['grammar-lesson-complex-clauses'] })],
  grammarLessons: [base('grammar-lesson-complex-clauses', 'complex-clauses-review', 'Complex Clauses Review', { topicId: 'grammar-topic-complex-clauses', taxonomy: tx('skill-grammar', 'task-grammar-practice', ['sub-complex-clauses'], ['topic-grammar-clauses'], 'level-advanced', 'ctype-grammar-lesson', ['tag-review']), estimatedMinutes: 12, practiceSetIds: ['practice-grammar-clauses-01'] })],
  grammarProgress: [base('grammar-progress-demo-clauses', 'demo-complex-clauses-progress', 'Demo complex clauses progress', { visibility: 'private', userId: 'demo-user', grammarTopicId: 'grammar-topic-complex-clauses', masteryPercent: 68, completedLessonIds: ['grammar-lesson-complex-clauses'] })],
  practiceSets: [
    base('practice-listening-note-map-01', 'note-map-main-idea-practice', 'Note Map Main Idea Practice', { taxonomy: tx('skill-listening', 'task-academic-talk', ['sub-main-idea'], ['topic-biology'], 'level-intermediate', 'ctype-practice-set', ['tag-timed']), questionIds: ['question-listening-main-idea'], estimatedMinutes: 10, timeLimitSeconds: 600 }),
    base('practice-grammar-clauses-01', 'complex-clauses-check', 'Complex Clauses Check', { sortOrder: 20, taxonomy: tx('skill-grammar', 'task-grammar-practice', ['sub-complex-clauses'], ['topic-grammar-clauses'], 'level-advanced', 'ctype-practice-set', ['tag-review']), questionIds: ['question-grammar-transition'], estimatedMinutes: 8, timeLimitSeconds: 480 }),
  ],
  questions: [
    base('question-listening-main-idea', 'listening-main-idea-campus-facilities', 'Main idea question', { taxonomy: tx('skill-listening', 'task-academic-talk', ['sub-main-idea'], ['topic-biology'], 'level-intermediate', 'ctype-question', ['tag-timed']), prompt: 'What is the lecture mainly about?', stimulus: 'A professor explains how students can identify the main point of an academic talk.', optionIds: ['option-listening-main-idea-a', 'option-listening-main-idea-b', 'option-listening-main-idea-c'], correctOptionId: 'option-listening-main-idea-b', explanation: 'The correct answer captures the central purpose rather than one detail.' }),
    base('question-reading-inference', 'reading-inference-green-infrastructure', 'Inference question', { sortOrder: 20, taxonomy: tx('skill-reading', 'task-reading-passage', ['sub-inference'], ['topic-urban-transportation'], 'level-intermediate', 'ctype-question', ['tag-timed']), prompt: 'What can be inferred about recent planning strategies?', stimulus: 'Urban planners increasingly connect environmental and social goals.', optionIds: ['option-reading-inference-a', 'option-reading-inference-b', 'option-reading-inference-c'], correctOptionId: 'option-reading-inference-b', explanation: 'The passage implies that newer strategies combine several objectives.' }),
    base('question-grammar-transition', 'grammar-transition-nevertheless', 'Transition question', { sortOrder: 30, taxonomy: tx('skill-grammar', 'task-grammar-practice', ['sub-complex-clauses'], ['topic-grammar-clauses'], 'level-advanced', 'ctype-question', ['tag-review']), prompt: 'Choose the best transition: The study was limited. __, the findings remain valuable.', optionIds: ['option-grammar-a', 'option-grammar-b', 'option-grammar-c'], correctOptionId: 'option-grammar-b', explanation: 'Nevertheless introduces contrast.' }),
  ],
  questionOptions: [
    base('option-listening-main-idea-a', 'listening-main-idea-a', 'Option A', { questionId: 'question-listening-main-idea', optionKey: 'A', body: 'A minor example from the lecture.', isCorrect: false }),
    base('option-listening-main-idea-b', 'listening-main-idea-b', 'Option B', { sortOrder: 20, questionId: 'question-listening-main-idea', optionKey: 'B', body: 'How to identify and record a lecture central idea.', isCorrect: true }),
    base('option-listening-main-idea-c', 'listening-main-idea-c', 'Option C', { sortOrder: 30, questionId: 'question-listening-main-idea', optionKey: 'C', body: 'A list of unrelated note symbols.', isCorrect: false }),
    base('option-reading-inference-a', 'reading-inference-a', 'Option A', { questionId: 'question-reading-inference', optionKey: 'A', body: 'They focus only on visual improvements.', isCorrect: false }),
    base('option-reading-inference-b', 'reading-inference-b', 'Option B', { sortOrder: 20, questionId: 'question-reading-inference', optionKey: 'B', body: 'They combine environmental and social objectives.', isCorrect: true }),
    base('option-reading-inference-c', 'reading-inference-c', 'Option C', { sortOrder: 30, questionId: 'question-reading-inference', optionKey: 'C', body: 'They avoid community participation.', isCorrect: false }),
    base('option-grammar-a', 'grammar-transition-a', 'Option A', { questionId: 'question-grammar-transition', optionKey: 'A', body: 'Therefore', isCorrect: false }),
    base('option-grammar-b', 'grammar-transition-b', 'Option B', { sortOrder: 20, questionId: 'question-grammar-transition', optionKey: 'B', body: 'Nevertheless', isCorrect: true }),
    base('option-grammar-c', 'grammar-transition-c', 'Option C', { sortOrder: 30, questionId: 'question-grammar-transition', optionKey: 'C', body: 'In addition', isCorrect: false }),
  ],
  tests: [
    base('test-mini-listening-note-map', 'listening-note-map-mini-test', 'Listening Note Map Mini Test', { taxonomy: tx('skill-listening', 'task-academic-talk', ['sub-main-idea'], ['topic-biology'], 'level-intermediate', 'ctype-mini-test', ['tag-timed']), sectionIds: ['section-mini-listening'], totalMinutes: 12, totalQuestions: 1 }),
    base('test-mock-03', 'mock-test-03', 'Mock Test 03', { sortOrder: 20, isPremium: true, taxonomy: tx('skill-reading', 'task-full-mock', ['sub-inference'], ['topic-urban-transportation'], 'level-advanced', 'ctype-mock-test', ['tag-timed']), sectionIds: ['section-mock-reading'], totalMinutes: 120, totalQuestions: 100 }),
  ],
  testSections: [
    base('section-mini-listening', 'mini-listening-section', 'Listening Section', { testId: 'test-mini-listening-note-map', skillId: 'skill-listening', taskTypeId: 'task-academic-talk', questionIds: ['question-listening-main-idea'], timeLimitSeconds: 720 }),
    base('section-mock-reading', 'mock-reading-section', 'Reading Section', { sortOrder: 20, isPremium: true, testId: 'test-mock-03', skillId: 'skill-reading', taskTypeId: 'task-reading-passage', questionIds: ['question-reading-inference'], timeLimitSeconds: 2160 }),
  ],
  attempts: [base('attempt-demo-mock-03', 'demo-mock-03-attempt', 'Demo Mock 03 Attempt', { visibility: 'private', userId: 'demo-user', testId: 'test-mock-03', startedAt: '2026-05-30T09:00:00.000Z', submittedAt: '2026-05-30T10:53:00.000Z', score: 94, answerIds: ['answer-demo-reading-inference'] })],
  answers: [base('answer-demo-reading-inference', 'demo-reading-inference-answer', 'Demo reading inference answer', { visibility: 'private', attemptId: 'attempt-demo-mock-03', questionId: 'question-reading-inference', selectedOptionId: 'option-reading-inference-b', isCorrect: true, score: 1 })],
  speakingTasks: [base('speaking-independent-role-models', 'independent-role-models-task', 'Independent Speaking Task 2', { taxonomy: tx('skill-speaking', 'task-independent-speaking', ['sub-fluency-coherence'], ['topic-campus-life'], 'level-intermediate', 'ctype-speaking-task', ['tag-timed']), prompt: 'Do you agree that celebrities are good role models for young people?', preparationSeconds: 60, responseSeconds: 120, rubricTagIds: ['tag-high-yield'] })],
  speakingAttempts: [base('speaking-attempt-demo-role-models', 'demo-role-models-speaking-attempt', 'Demo speaking attempt', { visibility: 'private', userId: 'demo-user', speakingTaskId: 'speaking-independent-role-models', startedAt: '2026-05-30T09:45:00.000Z', submittedAt: '2026-05-30T09:47:00.000Z', audioUrl: 'demo://audio/role-models', score: 7.5, feedback: 'Fluency and pronunciation improved.' })],
  writingTasks: [base('writing-integrated-remote-work', 'integrated-remote-work-transportation', 'Integrated Writing: Remote Work', { taxonomy: tx('skill-writing', 'task-integrated-writing', ['sub-organization'], ['topic-urban-transportation'], 'level-advanced', 'ctype-writing-task', ['tag-timed']), prompt: 'Summarize how the lecture responds to the reading about remote work and transportation.', stimulusIds: ['stimulus-reading-remote-work', 'stimulus-listening-urban-planning'], minWords: 150, maxWords: 225, timeLimitSeconds: 1200, rubricTagIds: ['tag-high-yield'] })],
  writingSubmissions: [base('writing-submission-demo-remote-work', 'demo-remote-work-writing-submission', 'Demo writing submission', { visibility: 'private', userId: 'demo-user', writingTaskId: 'writing-integrated-remote-work', submittedAt: '2026-05-29T08:45:00.000Z', wordCount: 278, score: 4, body: 'The reading says remote work affected commuting, while the lecture adds planning strategies.', feedback: 'Clear organization; add more precise lecture detail.' })],
  contentProgress: [base('content-progress-demo-note-map', 'demo-note-map-progress', 'Demo note map progress', { visibility: 'private', userId: 'demo-user', contentTypeId: 'ctype-video-lesson', contentId: 'lesson-listening-note-map', startedAt: '2026-05-26T09:00:00.000Z', progressPercent: 43, lastPositionSeconds: 520 })],
  studyPlans: [base('study-plan-demo', 'demo-study-plan', 'Demo Study Plan', { visibility: 'private', userId: 'demo-user', examVersionId: 'version-toefl-current', targetScore: 105, targetDate: '2026-08-20', taskIds: ['study-plan-task-note-map', 'study-plan-task-speaking'] })],
  studyPlanTasks: [
    base('study-plan-task-note-map', 'demo-note-map-study-task', 'Lecture 03 - Note Taking', { visibility: 'private', studyPlanId: 'study-plan-demo', contentTypeId: 'ctype-video-lesson', contentId: 'lesson-listening-note-map', skillId: 'skill-listening', scheduledFor: '2026-06-03', estimatedMinutes: 25 }),
    base('study-plan-task-speaking', 'demo-speaking-study-task', 'Speaking Task 02', { sortOrder: 20, visibility: 'private', studyPlanId: 'study-plan-demo', contentTypeId: 'ctype-speaking-task', contentId: 'speaking-independent-role-models', skillId: 'skill-speaking', scheduledFor: '2026-06-05', estimatedMinutes: 15 }),
  ],
  entitlements: [
    base('ent-free-video-preview', 'free-video-preview', 'Free video preview', { visibility: 'private', planKey: 'free', featureKey: 'video.previewMinutes', limit: 5, enabled: true }),
    base('ent-premium-video-full-access', 'premium-video-full-access', 'Premium video full access', { sortOrder: 20, visibility: 'private', isPremium: true, planKey: 'premium', featureKey: 'video.fullAccess', enabled: true }),
    base('ent-premium-mock-tests', 'premium-mock-tests', 'Premium mock tests', { sortOrder: 30, visibility: 'private', isPremium: true, planKey: 'premium', featureKey: 'tests.fullMockAccess', enabled: true }),
  ],
  featureConfigs: [
    base('feature-free-video-preview', 'free-video-preview-config', 'Free video preview config', { visibility: 'private', featureKey: 'video.previewMinutes', planKey: 'free', enabled: true, limit: 5, metadata: { unit: 'minutes' } }),
    base('feature-premium-content-access', 'premium-content-access-config', 'Premium content access config', { sortOrder: 20, visibility: 'private', isPremium: true, featureKey: 'content.fullAccess', planKey: 'premium', enabled: true, metadata: { includesPractice: true, includesMockTests: true } }),
  ],
};

const outPath = path.join(process.cwd(), 'src', 'lib', 'content', 'data', 'seed.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(seed, null, 2)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
