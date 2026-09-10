/* global __dirname */
// Structural smoke checks only. Behavior is tested by test-admin-workflow.cjs.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

const files = {
  route: read('src/app/admin.tsx'),
  routeGuard: read('src/components/admin/AdminRouteScreen.tsx'),
  shell: read('src/components/admin/AdminShell.tsx'),
  panel: read('src/components/admin/AdminPanel.tsx'),
  access: read('src/lib/admin/access.ts'),
  service: read('src/lib/admin/service.ts'),
  types: read('src/lib/admin/types.ts'),
  auth: read('src/lib/auth.ts'),
};

expect(/AuthRole\s*=\s*[^;]*'admin'/.test(files.auth), 'AuthRole must include admin.');
expect(files.auth.includes("role === 'admin'"), 'getRoleLabel must support admin.');
expect(files.route.includes('AdminRouteScreen'), '/admin route must render AdminRouteScreen.');
expect(files.access.includes('adminRequiredRoles'), 'Admin role allow-list is missing.');
expect(files.access.includes('getAdminAccessDecision'), 'Admin access decision helper is missing.');
expect(files.access.includes('requireAdminRole'), 'Client admin role guard is missing.');
expect(files.routeGuard.includes('requireAdminRole'), 'Admin route must call the client role guard.');

for (const token of ['testID="admin-shell"', 'testID="admin-sidebar"', 'testID="admin-mobile-drawer"', 'useWindowDimensions']) {
  expect(files.shell.includes(token), `Admin shell responsive marker missing: ${token}`);
}

for (const title of [
  'Yönetim Özeti',
  'Menü Yönetimi',
  'Sınıflandırma',
  'Kurslar',
  'Video Dersler',
  'Kelime Çalışmaları',
  'Dil Bilgisi',
  'Soru Bankası',
  'Alıştırma Setleri',
  'Mini Testler',
]) {
  expect(files.service.includes(`title: '${title}'`), `Admin module missing: ${title}`);
}

for (const fn of ['saveAdminContent', 'previewAdminDraft', 'archiveAdminEntity', 'reorderAdminEntity']) {
  expect(files.service.includes(`function ${fn}`) || files.service.includes(`export function ${fn}`), `Admin CRUD function missing: ${fn}`);
}

for (const token of ['navigationGroups', 'navigationItems', 'exams', 'examVersions', 'skills', 'taskTypes', 'subskills', 'topics', 'levels']) {
  expect(files.service.includes(token), `Taxonomy/navigation collection missing: ${token}`);
}

for (const token of ['courses', 'modules', 'lessons', 'vocabularySets', 'vocabularyWords', 'grammarCategories', 'grammarTopics', 'grammarLessons', 'questions', 'practiceSets', 'tests']) {
  expect(files.service.includes(token), `Content collection missing: ${token}`);
}

for (const token of ['skillId', 'taskTypeId', 'subskillId', 'topicId', 'levelId', 'validateAdminQuestion']) {
  expect(files.panel.includes(token) || files.service.includes(token), `Question bank filter/validation missing: ${token}`);
}

expect(!files.service.includes('Page Builder'), 'Page Builder must not be implemented in this phase.');
expect(!/payment management|payment module|ödeme yönetimi/i.test(files.service), 'Payment management must not be implemented in this phase.');
expect(files.panel.includes('NativeModal') && files.panel.includes('editorCardMobile'), 'Responsive admin modal/bottom-sheet foundation is missing.');
expect(files.panel.includes('mobileRecordCard') && files.panel.includes('ScrollView horizontal'), 'Responsive table/card foundation is missing.');

console.log('Admin foundation validation passed.');
