/* global __dirname */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
  module._compile(output.outputText, filename);
};
const service = require('../src/lib/admin/service.ts');
const workflow = require('../src/lib/admin/workflow.ts');
const labels = require('../src/lib/admin/labels.ts');
const actor = { id: 'test-admin', email: 'test-admin@example.com', role: 'admin' };
const fresh = () => workflow.migrateAdminWorkspace(service.defaultWorkspaceState());
const doc = (state, id = 'exams-workflow-test') => workflow.getAdminDocument(state, 'exams', id);
const draft = { ...service.initialAdminDraft('exams'), title: 'Workflow Test', slug: 'workflow-test', description: 'Original description' };
const save = (state, status = 'draft', values = draft, id, version = 0) => service.saveAdminContent(state, 'taxonomy', 'exams', values, actor, status, id, version);
const memory = () => {
  const data = new Map();
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};

const questionDraft = (state) => ({
  ...service.initialAdminDraft('questions', undefined, state.catalog), title: 'Editor question', slug: 'editor-question',
  prompt: 'Which answer best describes the main idea?', explanation: 'The first option states the main idea.',
  question: {
    ...service.initialAdminDraft('questions', undefined, state.catalog).question,
    stimulus: 'A short passage for the question.', correctOptionId: 'editor-option-a',
    options: [{ id: 'editor-option-a', body: 'The main argument', rationale: 'Includes the full argument.' }, { id: 'editor-option-b', body: 'A minor detail', rationale: 'Only one detail.' }],
  },
});
const saveQuestion = (state, draft, status = 'draft', id, version = 0) => service.saveAdminContent(state, 'question-bank', 'questions', draft, actor, status, id, version);
const questionDoc = (state) => workflow.getAdminDocument(state, 'questions', 'questions-editor-question');

test('question editor creates and publishes taxonomy, stimulus, options and the correct answer together', () => {
  const state = fresh();
  const draft = questionDraft(state);
  const result = saveQuestion(state, draft, 'published');
  const published = questionDoc(result).published;
  assert.equal(published.stimulus, draft.question.stimulus);
  assert.deepEqual(published.taxonomy, draft.question.taxonomy);
  assert.equal(published.questionOptions.length, 2);
  assert.equal(published.questionOptions[0].isCorrect, true);
  assert.equal(published.questionOptions[1].isCorrect, false);
  assert.equal(published.correctOptionId, 'editor-option-a');
  assert.deepEqual(workflow.validatePublication(result, 'questions', published), []);
  assert.equal(state.catalog.questions.some((item) => item.id === published.id), false);
});

test('draft option edits do not leak into published options; restore creates a complete new version', () => {
  const first = saveQuestion(fresh(), questionDraft(fresh()), 'published');
  const id = questionDoc(first).entityId;
  const draft = service.initialAdminDraft('questions', service.listAdminRows(first, 'questions').find((row) => row.id === id), first.catalog);
  draft.question.options[0].body = 'An unpublished revision';
  draft.question.correctOptionId = 'editor-option-b';
  const second = saveQuestion(first, draft, 'draft', id, 1);
  const live = workflow.getPublishedWorkspace(second);
  assert.equal(live.catalog.questionOptions.find((item) => item.id === 'editor-option-a').body, 'The main argument');
  assert.equal(live.catalog.questionOptions.find((item) => item.id === 'editor-option-a').isCorrect, true);
  assert.ok(questionDoc(second).revisions[1].diff.some((item) => item.path === 'questionOptions'));
  const third = workflow.restoreAdminVersion(second, 'questions', id, 1, actor, 2);
  assert.deepEqual(questionDoc(third).revisions.slice(0, 2), questionDoc(second).revisions);
  assert.equal(third.catalog.questionOptions.find((item) => item.id === 'editor-option-a').body, 'The main argument');
  assert.equal(third.catalog.questions.find((item) => item.id === id).correctOptionId, 'editor-option-a');
  assert.equal(questionDoc(third).version, 3);
});

test('option reorder preserves answer identity and removal can be saved incomplete but not published', () => {
  const draft = questionDraft(fresh());
  draft.question.options.reverse();
  const first = saveQuestion(fresh(), draft, 'published');
  assert.equal(questionDoc(first).published.questionOptions[1].id, 'editor-option-a');
  assert.equal(questionDoc(first).published.questionOptions[1].optionKey, 'B');
  draft.question.options = draft.question.options.filter((item) => item.id !== 'editor-option-a');
  draft.question.correctOptionId = undefined;
  const second = saveQuestion(first, draft, 'draft', questionDoc(first).entityId, 1);
  assert.equal(second.catalog.questionOptions.some((item) => item.id === 'editor-option-a'), false);
  assert.equal(workflow.getPublishedWorkspace(second).catalog.questionOptions.some((item) => item.id === 'editor-option-a'), true);
  assert.throws(() => saveQuestion(second, draft, 'published', questionDoc(first).entityId, 2), /distinct options|correct answer/);
});

test('invalid option identity, empty and duplicate text cannot be published', () => {
  for (const body of ['', '  THE MAIN ARGUMENT  ']) {
    const draft = questionDraft(fresh());
    draft.question.options[1].body = body;
    assert.throws(() => saveQuestion(fresh(), draft, 'published'), /empty|distinct/);
  }
  const state = fresh();
  const foreign = questionDraft(state);
  foreign.question.options[1].id = state.catalog.questionOptions[0].id;
  assert.throws(() => saveQuestion(state, foreign), /another question/);
  const duplicate = questionDraft(state);
  duplicate.question.options[1].id = duplicate.question.options[0].id;
  assert.throws(() => saveQuestion(state, duplicate), /unique/);
  const wrong = questionDraft(state);
  wrong.question.correctOptionId = 'not-an-option';
  assert.throws(() => saveQuestion(state, wrong), /correct answer/);
});

test('publishing rejects mismatched skill/task and unavailable taxonomy records', () => {
  const state = fresh();
  const draft = questionDraft(state);
  draft.question.taxonomy.skillId = state.catalog.skills.find((item) => item.id !== draft.question.taxonomy.skillId).id;
  assert.throws(() => saveQuestion(state, draft, 'published'), /skill/);
  const missing = questionDraft(state);
  missing.question.taxonomy.examVersionId = 'missing-version';
  assert.throws(() => saveQuestion(state, missing, 'published'), /examVersion/);
  const noTask = questionDraft(state);
  noTask.question.taxonomy.taskTypeId = undefined;
  assert.throws(() => saveQuestion(state, noTask, 'published'), /Task type/);
});

test('question preview uses unsaved options without mutating any workspace data', () => {
  const state = fresh();
  const before = JSON.stringify(state);
  const draft = questionDraft(state);
  draft.question.options[1].body = 'Unsaved preview text';
  const preview = service.previewAdminDraft(state, 'questions', draft);
  assert.equal(preview.questionOptions[1].body, 'Unsaved preview text');
  assert.equal(preview.questionOptions[1].isCorrect, false);
  assert.equal(JSON.stringify(state), before);
});

test('legacy live options are frozen on migration but missing historical option snapshots are not invented', () => {
  const legacy = fresh();
  const item = legacy.catalog.questions.find((question) => question.optionIds.length > 1);
  const history = workflow.getAdminDocument(legacy, 'questions', item.id);
  delete history.published.questionOptions;
  delete history.revisions[0].snapshot.questionOptions;
  const baseline = structuredClone(history.revisions);
  const migrated = workflow.migrateAdminWorkspace(legacy);
  const migratedHistory = workflow.getAdminDocument(migrated, 'questions', item.id);
  assert.ok(migratedHistory.published.questionOptions.length);
  assert.deepEqual(migratedHistory.revisions, baseline);
  assert.throws(() => workflow.restoreAdminVersion(migrated, 'questions', item.id, 1, actor, 1), /legacy version/);
});

test('admin Turkish labels preserve internal keys and user content', () => {
  assert.deepEqual(['draft', 'review', 'published', 'archived'].map(labels.adminLabel), ['Taslak', 'İncelemede', 'Yayında', 'Arşivlendi']);
  assert.equal(labels.adminLabel('questionOptions'), 'Cevap Seçenekleri');
  assert.equal(labels.adminFieldLabel('taxonomy.skillId'), 'Sınıflandırma / Beceri');
  assert.equal(labels.adminDiffValue('title', 'Published content'), 'Published content');
  assert.equal(labels.adminDiffValue('status', 'published'), 'Yayında');
  assert.equal(service.adminModules.find((item) => item.key === 'question-bank').title, 'Soru Bankası');
});

test('admin Turkish messages preserve actionable validation details', () => {
  assert.equal(labels.adminMessage('At least two distinct options are required.\nSelect a correct answer from the question options.'), 'En az iki farklı seçenek gerekli.\nSoru seçeneklerinden doğru cevabı seçin.');
  assert.equal(labels.adminMessage('Publish an active examVersions record before using it.'), 'Önce ilgili aktif kaydı yayınlayın: Sınav Sürümleri.');
  assert.equal(labels.adminMessage('Missing moduleId: missing-module'), 'Eksik ilişki: Modül (missing-module).');
  assert.equal(labels.adminMessage('Archive blocked: referenced by Academic Course.'), 'Arşivleme engellendi. İlişkili içerikler: Academic Course.');
});

test('Turkish audit rendering does not rewrite stored history or content titles', () => {
  const state = save(fresh());
  const before = JSON.stringify(state);
  assert.equal(labels.adminAuditSummary(state, state.workflow.audit[0]), 'Workflow Test: Oluşturuldu (1. sürüm)');
  assert.equal(JSON.stringify(state), before);
});

test('migration preserves legacy catalog and records unknown attribution without fake dates', () => {
  const original = service.defaultWorkspaceState();
  const state = workflow.migrateAdminWorkspace(original);
  assert.deepEqual(state.catalog, original.catalog);
  const item = state.catalog.exams[0];
  const history = doc(state, item.id);
  assert.equal(history.version, 1);
  assert.equal(history.revisions[0].snapshot.createdBy, null);
  assert.equal(history.revisions[0].snapshot.publishedAt, null);
  assert.deepEqual(workflow.migrateAdminWorkspace(state), state);
});

test('Draft -> Review -> Published records actors, metadata, immutable snapshots and diffs', () => {
  const first = save(fresh());
  assert.equal(doc(first).version, 1);
  assert.equal(doc(first).published, null);
  const reviewed = save(first, 'review', { ...draft, description: 'Reviewed description' }, doc(first).entityId, 1);
  assert.equal(doc(reviewed).status, 'review');
  assert.equal(doc(reviewed).published, null);
  const published = save(reviewed, 'published', { ...draft, description: 'Reviewed description' }, doc(first).entityId, 2);
  assert.equal(doc(published).status, 'published');
  assert.equal(doc(published).version, 3);
  assert.equal(doc(published).published.status, 'active');
  assert.deepEqual(doc(published).published.createdBy, actor);
  assert.deepEqual(doc(published).published.publishedBy, actor);
  assert.ok(Date.parse(doc(published).published.publishedAt));
  assert.equal(doc(first).revisions.length, 1);
  assert.equal(doc(first).revisions[0].snapshot.description, 'Original description');
  assert.ok(doc(reviewed).revisions[1].diff.some((change) => change.path === 'description' && change.before === 'Original description'));
  assert.equal(published.workflow.audit.length, 3);
  assert.equal(published.workflow.audit[0].user.email, actor.email);
  assert.equal(published.workflow.audit[0].entityId, doc(first).entityId);
});

test('saving a draft never replaces the live version or leaks history through the public projection', () => {
  const live = save(fresh(), 'published');
  const state = save(live, 'draft', { ...draft, title: 'Unpublished title' }, doc(live).entityId, 1);
  const published = workflow.getPublishedWorkspace(state);
  assert.equal(published.catalog.exams.find((item) => item.id === doc(live).entityId).title, draft.title);
  assert.equal(published.workflow, undefined);
  assert.deepEqual(published.changes, []);
  assert.equal(doc(state).published.title, draft.title);
  assert.equal(doc(state).revisions.at(-1).snapshot.title, 'Unpublished title');
});

test('restore appends a new draft and preserves all prior snapshots and the live version', () => {
  const first = save(fresh(), 'published');
  const second = save(first, 'published', { ...draft, title: 'Second title' }, doc(first).entityId, 1);
  const restored = workflow.restoreAdminVersion(second, 'exams', doc(first).entityId, 1, actor, 2);
  assert.equal(doc(restored).version, 3);
  assert.equal(doc(restored).status, 'draft');
  assert.deepEqual(doc(restored).revisions.slice(0, 2), doc(second).revisions);
  assert.equal(doc(restored).revisions[2].restoredFrom, 1);
  assert.equal(doc(restored).revisions[2].snapshot.title, draft.title);
  assert.equal(doc(restored).published.title, 'Second title');
});

test('stale version, duplicate slug, non-admin actor and missing version are rejected', () => {
  const state = save(fresh());
  assert.throws(() => save(state), /slug/);
  assert.throws(() => save(state, 'draft', draft, doc(state).entityId, 0), /changed/);
  assert.throws(() => service.saveAdminContent(fresh(), 'taxonomy', 'exams', draft, { ...actor, role: 'student' }, 'draft'), /Admin access/);
  assert.throws(() => workflow.restoreAdminVersion(state, 'exams', doc(state).entityId, 99, actor, 1), /not found/);
});

test('publish blocks questions without valid options and mismatched taxonomy', () => {
  const state = fresh();
  const questionDraft = { ...service.initialAdminDraft('questions'), title: 'Incomplete question', prompt: 'Which option is correct?' };
  const saved = service.saveAdminContent(state, 'question-bank', 'questions', questionDraft, actor, 'draft');
  const id = saved.workflow.audit[0].entityId;
  assert.throws(() => service.saveAdminContent(saved, 'question-bank', 'questions', questionDraft, actor, 'published', id, 1), /distinct options/);
  const lesson = structuredClone(state.catalog.lessons[0]);
  lesson.taxonomy.skillId = state.catalog.skills.find((skill) => skill.id !== lesson.taxonomy.skillId).id;
  assert.ok(workflow.validatePublication(state, 'lessons', lesson).some((error) => /skill/.test(error)));
  lesson.moduleId = 'missing-module';
  assert.ok(workflow.validatePublication(state, 'lessons', lesson).some((error) => /moduleId/.test(error)));
});

test('reading practice publishing requires five A-E options per question', () => {
  const state = fresh();
  const draft = {
    ...service.initialAdminDraft('readingPracticeScreens', undefined, state.catalog),
    title: 'Reading Workflow',
    slug: 'reading-workflow',
    passageTitle: 'A Passage About Learning',
    passageText: 'Reading tests measure comprehension. Students choose the best answer from the passage.',
    timeLimitSeconds: 600,
    readingQuestions: [{
      prompt: 'What is the main idea of this passage?',
      options: [
        { key: 'A', text: 'Reading tests measure comprehension.' },
        { key: 'B', text: 'Students never read passages.' },
        { key: 'C', text: 'Every answer is correct.' },
        { key: 'D', text: 'The passage focuses on spelling only.' },
        { key: 'E', text: 'The passage is about cooking.' },
      ],
      correctOptionKey: 'A',
    }],
  };
  const directCandidate = structuredClone(state.catalog.readingPracticeScreens[0]);
  directCandidate.questions[0].options = directCandidate.questions[0].options.slice(0, 4);
  assert.ok(workflow.validatePublication(state, 'readingPracticeScreens', directCandidate).includes('Every reading question needs exactly five options.'));
  const blankOption = structuredClone(draft);
  blankOption.readingQuestions[0].options[4].text = '';
  assert.throws(() => service.saveAdminContent(state, 'reading-practice', 'readingPracticeScreens', blankOption, actor, 'published'), /option needs text/);
  const result = service.saveAdminContent(state, 'reading-practice', 'readingPracticeScreens', draft, actor, 'published');
  const published = workflow.getAdminDocument(result, 'readingPracticeScreens', 'readingPracticeScreens-reading-workflow').published;
  assert.deepEqual(published.questions[0].options.map((option) => option.key), ['A', 'B', 'C', 'D', 'E']);
  assert.equal(published.currentQuestionIndex, 0);
  assert.equal(published.answeredCount, 0);
  assert.equal(published.wordCount, 12);
  assert.deepEqual(workflow.validatePublication(result, 'readingPracticeScreens', published), []);
});
test('archive preserves history and refuses to break published references', () => {
  const published = save(fresh(), 'published');
  const archived = service.archiveAdminEntity(published, 'exams', doc(published).entityId, actor, 1);
  assert.equal(doc(archived).status, 'archived');
  assert.equal(doc(archived).published, null);
  assert.equal(doc(archived).revisions.length, 2);
  const state = fresh();
  assert.throws(() => service.archiveAdminEntity(state, 'exams', state.catalog.exams[0].id, actor, 1), /referenced/);
});

test('reorder handles equal sort orders and logs every changed record as a draft', () => {
  const state = fresh();
  state.catalog.levels.forEach((item) => { item.sortOrder = 10; });
  const sorted = service.listAdminRows(state, 'levels');
  const next = service.reorderAdminEntity(state, 'taxonomy', 'levels', sorted[0].id, 'down', actor);
  assert.equal(service.listAdminRows(next, 'levels')[1].id, sorted[0].id);
  assert.ok(next.workflow.audit.some((entry) => entry.action === 'reordered'));
  assert.deepEqual(workflow.getPublishedWorkspace(next).catalog.levels, workflow.getPublishedWorkspace(state).catalog.levels);
});

test('storage migration keeps v1 backup, reloads history and detects stale tab writes', () => {
  const storage = memory();
  const legacy = JSON.stringify(service.defaultWorkspaceState());
  storage.setItem(workflow.legacyWorkspaceStorageKey, legacy);
  const initial = workflow.readAdminWorkspace(storage, fresh);
  const next = save(initial);
  workflow.persistAdminWorkspace(storage, next, 0);
  assert.equal(storage.getItem(workflow.legacyWorkspaceStorageKey), legacy);
  assert.deepEqual(workflow.readAdminWorkspace(storage, fresh), next);
  assert.throws(() => workflow.persistAdminWorkspace(storage, save(initial), 0), /Another tab/);
});

test('corrupt storage and quota errors cannot silently reset or report a successful save', () => {
  const storage = memory();
  storage.setItem(workflow.workspaceStorageKey, '{broken');
  assert.throws(() => workflow.readAdminWorkspace(storage, fresh), /not been reset/);
  assert.equal(storage.getItem(workflow.workspaceStorageKey), '{broken');
  assert.throws(() => workflow.persistAdminWorkspace({ getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); } }, save(fresh()), 0), /Save failed/);
});

test('draft preview reflects current edits without saving or writing progress', () => {
  const state = fresh();
  const original = structuredClone(state);
  const item = state.catalog.lessons[0];
  const row = service.listAdminRows(state, 'lessons').find((entry) => entry.id === item.id);
  const preview = service.previewAdminDraft(state, 'lessons', { ...service.initialAdminDraft('lessons', row), title: 'Preview title' }, item.id);
  assert.equal(preview.title, 'Preview title');
  assert.deepEqual(state, original);
});

test('question filters distinguish Review from Draft and Published', () => {
  const values = { ...service.initialAdminDraft('questions'), title: 'Review question', prompt: 'Which answer is correct?' };
  const state = service.saveAdminContent(fresh(), 'question-bank', 'questions', values, actor, 'review');
  const filters = service.defaultQuestionFilters();
  const id = state.workflow.audit[0].entityId;
  assert.ok(service.listAdminQuestionRows(state, { ...filters, status: 'review' }).some((row) => row.id === id));
  assert.ok(!service.listAdminQuestionRows(state, { ...filters, status: 'draft' }).some((row) => row.id === id));
  assert.ok(!service.listAdminQuestionRows(state, { ...filters, status: 'published' }).some((row) => row.id === id));
});

test('navigation publishing rejects routes outside the approved registry', () => {
  const state = fresh();
  const item = { ...state.navigation.items[0], route: 'javascript:alert(1)' };
  assert.ok(workflow.validatePublication(state, 'navigationItems', item).some((issue) => /approved navigation registry/.test(issue)));
});

test('navigation manager can hide and show registered menu records', () => {
  const state = fresh();
  const item = state.navigation.items[0];
  const hidden = service.toggleAdminNavigationVisibility(state, 'navigationItems', item.id, actor);
  assert.equal(hidden.navigation.items.find((entry) => entry.id === item.id).isEnabled, false);
  const shown = service.toggleAdminNavigationVisibility(hidden, 'navigationItems', item.id, actor);
  assert.equal(shown.navigation.items.find((entry) => entry.id === item.id).isEnabled, true);
});
