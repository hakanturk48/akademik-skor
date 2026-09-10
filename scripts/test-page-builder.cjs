/* global __dirname */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) { return originalResolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => { const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }); module._compile(output.outputText, filename); };
const builder = require('../src/lib/admin/page-builder.ts');

const user = { id: 'builder-test-admin', email: 'builder@example.com', role: 'admin' };
const page = (state, id) => state.pages.find((item) => item.id === id);

test('page builder registry rejects arbitrary component input and exposes bounded props', () => {
  const state = builder.defaultPageBuilderState();
  assert.equal(builder.pageBuilderRegistry.length, 22);
  assert.ok(builder.pageBuilderRegistry.every((item) => item.editableProps.length > 0 && item.responsiveRules.mobile));
  assert.throws(() => builder.addPageBuilderSection(state, 'dashboard', 'ArbitraryHtml', user), /registry|izinli/i);
});

test('locked system sections remain protected while content sections can be edited and reordered', () => {
  const state = builder.defaultPageBuilderState();
  const dashboard = page(state, 'dashboard');
  const locked = dashboard.versions[0].sections.find((item) => item.locked);
  assert.throws(() => builder.togglePageBuilderSection(state, 'dashboard', locked.id, user), /kilitli/i);
  assert.throws(() => builder.updatePageBuilderSection(state, 'dashboard', locked.id, { audience: 'premium' }, user), /kilitli/i);
  assert.throws(() => builder.duplicatePageBuilderSection(state, 'dashboard', locked.id, user), /kilitli/i);
  const video = page(state, 'video-lessons');
  const added = builder.addPageBuilderSection(state, 'video-lessons', 'CustomCTA', user);
  const addedPage = page(added, 'video-lessons');
  assert.equal(addedPage.versions.at(-1).sections.length, video.versions[0].sections.length + 1);
  const custom = addedPage.versions.at(-1).sections.find((item) => item.componentType === 'CustomCTA');
  const edited = builder.updatePageBuilderSection(added, 'video-lessons', custom.id, { responsiveRules: { desktopWidth: 'half', tablet: 'columns', mobile: 'stack' } }, user);
  assert.equal(page(edited, 'video-lessons').versions.at(-1).sections.find((item) => item.id === custom.id).responsiveRules.desktopWidth, 'half');
});

test('page builder publishes, restores as a new version, and keeps previous history', () => {
  const state = builder.defaultPageBuilderState();
  const draft = builder.addPageBuilderSection(state, 'video-lessons', 'Recommendations', user);
  const published = builder.publishPageBuilder(draft, 'video-lessons', user);
  const publishedPage = page(published, 'video-lessons');
  assert.equal(publishedPage.versions.at(-1).status, 'published');
  const restored = builder.restorePageBuilderVersion(published, 'video-lessons', 1, user);
  const restoredPage = page(restored, 'video-lessons');
  assert.equal(restoredPage.versions.at(-1).status, 'draft');
  assert.equal(restoredPage.versions.length, publishedPage.versions.length + 1);
  assert.equal(restoredPage.versions.at(-1).restoredFrom, 1);
});

test('system tabs require registry components and content tabs remain safe', () => {
  const state = builder.defaultPageBuilderState();
  assert.throws(() => builder.updatePageBuilderTab(state, 'video-lessons', { ...page(state, 'video-lessons').versions[0].tabs[0], componentType: 'ArbitraryHtml' }, user), /registry|izinli/i);
  const tab = builder.newPageBuilderTab('video-lessons', 'content');
  const next = builder.updatePageBuilderTab(state, 'video-lessons', tab, user);
  assert.ok(page(next, 'video-lessons').versions.at(-1).tabs.some((item) => item.id === tab.id));
  const hidden = builder.updatePageBuilderTab(next, 'video-lessons', { ...tab, isVisible: false, sortOrder: 20 }, user);
  assert.equal(page(hidden, 'video-lessons').versions.at(-1).tabs.find((item) => item.id === tab.id).isVisible, false);
  assert.throws(() => builder.updatePageBuilderTab(hidden, 'video-lessons', { ...page(hidden, 'video-lessons').versions.at(-1).tabs[0], title: 'Kilitli değişiklik' }, user), /kilitli/i);
});
