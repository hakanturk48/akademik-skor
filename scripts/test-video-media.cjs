/* global __dirname */
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'test-api-key';
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test.firebaseapp.com';
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'test-project';
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890';
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:test';
const assert = require('node:assert/strict');
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

const media = require('../src/lib/video-media.ts');
const service = require('../src/lib/admin/service.ts');
const workflow = require('../src/lib/admin/workflow.ts');
const actor = { id: 'video-test-admin', email: 'video-test@example.com', role: 'admin' };

assert.equal(media.getVideoEmbedUrl('youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1');
assert.equal(media.getVideoEmbedUrl('vimeo', 'https://vimeo.com/123456789'), 'https://player.vimeo.com/video/123456789?dnt=1');
assert.match(media.validateVideoMediaUrl('youtube', 'https://example.com/video'), /YouTube/);
assert.equal(media.validateVideoMediaUrl('youtube', 'https://youtu.be/dQw4w9WgXcQ'), null);
assert.equal(media.validateVideoMediaUrl('upload', 'asset:browser-upload'), null);
assert.equal(media.validateVideoMediaUrl('upload', 'https://example.com/video'), null);
assert.deepEqual(media.videoMediaProviders.map((provider) => provider.value), ['youtube', 'vimeo']);
assert.deepEqual(media.parseVideoTimedText('00:00|Giriş\n01:20|Ana fikir'), {
  lines: [{ startSeconds: 0, text: 'Giriş' }, { startSeconds: 80, text: 'Ana fikir' }],
  invalidLines: [],
});
assert.equal(media.parseVideoTimedText('bozuk satır').invalidLines.length, 1);

const state = workflow.migrateAdminWorkspace(service.defaultWorkspaceState());
const draft = {
  ...service.initialAdminDraft('lessons', undefined, state.catalog),
  title: 'YouTube video lesson',
  slug: 'youtube-video-lesson',
  description: 'A published external video lesson.',
  mediaProvider: 'youtube',
  mediaUrl: 'https://youtu.be/dQw4w9WgXcQ',
  durationSeconds: 600,
  estimatedMinutes: 10,
  thumbnailUrl: 'https://cdn.example.com/youtube-lesson.jpg',
  previewDurationSeconds: 120,
  chaptersText: '00:00|Giriş\n04:00|Ana strateji',
  transcriptText: '00:00|Browser transcript line',
};

assert.throws(() => service.saveAdminContent(state, 'video-lessons', 'lessons', { ...draft, mediaUrl: '' }, actor, 'published'), /Video URL/);
const published = service.saveAdminContent(state, 'video-lessons', 'lessons', draft, actor, 'published');
const id = published.workflow.audit[0].entityId;
const document = workflow.getAdminDocument(published, 'lessons', id);
assert.equal(document.published.mediaProvider, 'youtube');
assert.equal(document.published.mediaUrl, draft.mediaUrl);
assert.equal(document.published.durationSeconds, 600);
assert.equal(document.published.thumbnailUrl, draft.thumbnailUrl);
assert.equal(document.published.previewDurationSeconds, 120);
assert.deepEqual(document.published.chapters, [{ startSeconds: 0, title: 'Giriş' }, { startSeconds: 240, title: 'Ana strateji' }]);
assert.deepEqual(document.published.transcript, [{ startSeconds: 0, text: 'Browser transcript line' }]);

const studentCatalog = require('../src/lib/student-learning.ts');
assert.equal(studentCatalog.getVideoLessonCatalog().length, 0);
global.window = { localStorage: { getItem: (key) => key === 'akademik-skor.published-workspace.v1' ? JSON.stringify(published) : null } };
const studentLesson = studentCatalog.getVideoLessonById(id);
assert.equal(studentLesson.mediaProvider, 'youtube');
assert.equal(studentLesson.mediaUrl, draft.mediaUrl);
assert.equal(studentLesson.thumbnail, draft.thumbnailUrl);
assert.equal(studentLesson.previewDuration, 2);
assert.deepEqual(studentLesson.chapters, [{ title: 'Giriş', duration: '04:00' }, { title: 'Ana strateji', duration: '06:00' }]);
assert.deepEqual(studentLesson.transcript, ['Browser transcript line']);
console.log('video media tests passed');
