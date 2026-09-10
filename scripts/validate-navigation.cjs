const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const seed = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/lib/navigation/data/navigation.json'), 'utf8'));
const shellSource = fs.readFileSync(path.join(process.cwd(), 'src/components/student/StudentShell.tsx'), 'utf8');
const serviceSource = fs.readFileSync(path.join(process.cwd(), 'src/lib/navigation/service.ts'), 'utf8');
const registrySource = fs.readFileSync(path.join(process.cwd(), 'src/lib/navigation/registry.ts'), 'utf8');

const expected = {
  MAIN: ['Dashboard', 'My Learning'],
  PRACTICE: ['Video Lessons', 'Reading', 'Listening', 'Speaking', 'Writing'],
  VOCABULARY: ['Vocabulary', 'Grammar'],
  TESTS: ['Mini Tests', 'Mock Tests'],
  PROGRESS: ['My Progress', 'Score Analysis', 'Skill Analysis', 'Study Plan', 'Activity History'],
  ACCOUNT: ['Profile', 'Settings', 'Subscription'],
};
const allowedRoutes = new Set([
  '/dashboard','/my-learning','/learning/videos','/practice/reading','/listening','/practice/listening','/practice/speaking','/practice/writing',
  '/vocabulary','/grammar','/tests/mini','/tests/mock','/progress','/progress/score-analysis','/progress/skill-analysis','/progress/study-plan','/progress/activity',
  '/account/profile','/account/settings','/account/subscription',
]);
const allowedIcons = new Set([
  'dashboard','my-learning','video-lessons','reading','listening','speaking','writing','vocabulary','grammar','mini-tests','mock-tests','my-progress','score-analysis','skill-analysis','study-plan','activity-history','profile','settings','subscription','premium',
]);
const validVisibility = new Set(['public', 'authenticated', 'private']);
const validBadgeVariant = new Set(['default', 'info', 'success', 'warning', 'premium', null]);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const studentFree = { id: 'u1', role: 'student', plan: 'free' };
const studentPremium = { id: 'u2', role: 'student', plan: 'premium' };
const teacher = { id: 'u3', role: 'teacher', plan: 'premium' };

const sortByOrder = (items) => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
const routeKeyByRoute = (route) => {
  const source = registrySource.match(new RegExp(`routeKey: '([^']+)', route: '${route.replace(/\//g, '\\/')}'`));
  return source?.[1];
};
const activeRouteForPath = (pathname) => {
  const normalized = pathname.split('?')[0].replace(/\/$/, '') || '/';
  const entries = [...registrySource.matchAll(/routeKey: '([^']+)', route: '([^']+)', componentKey: '([^']+)', activeRoutePatterns: \[([^\]]+)\]/g)];
  for (const entry of entries) {
    const patterns = [...entry[4].matchAll(/'([^']+)'/g)].map((match) => match[1]);
    if (patterns.some((pattern) => pattern.endsWith('/*') ? normalized === pattern.slice(0, -2) || normalized.startsWith(`${pattern.slice(0, -2)}/`) : normalized === pattern)) {
      return entry[1];
    }
  }
  return undefined;
};
const access = (user, item) => {
  if (!item.isEnabled) return { allowed: false, disabled: true };
  if (item.visibility === 'private') return { allowed: false };
  if (item.visibility === 'authenticated' && !user) return { allowed: false };
  if (item.requiredRole && user?.role !== item.requiredRole) return { allowed: false, requiredRole: item.requiredRole };
  if (item.requiredPlan && user?.plan !== item.requiredPlan) return { allowed: false, requiredPlan: item.requiredPlan };
  return { allowed: true };
};
const groupsFor = (user, { includeLocked = true, includeDisabled = true, placement = 'sidebar', activeRoute } = {}, data = seed) => sortByOrder(data.groups)
  .filter((group) => group.placement === placement && group.isEnabled && group.visibility !== 'private' && (group.visibility !== 'authenticated' || user))
  .map((group) => ({
    ...group,
    items: sortByOrder(data.items)
      .filter((item) => item.groupId === group.id)
      .filter((item) => allowedRoutes.has(item.route))
      .filter((item) => item.isEnabled || includeDisabled)
      .filter((item) => item.visibility !== 'private' && (item.visibility !== 'authenticated' || user))
      .filter((item) => !item.requiredRole || user?.role === item.requiredRole)
      .filter((item) => !item.requiredPlan || user?.plan === item.requiredPlan || includeLocked)
      .map((item) => ({ ...item, routeKey: routeKeyByRoute(item.route), isActive: routeKeyByRoute(item.route) === activeRoute })),
  }))
  .filter((group) => group.items.length > 0);

assert.ok(Array.isArray(seed.groups), 'groups missing');
assert.ok(Array.isArray(seed.items), 'items missing');

for (const collection of [seed.groups, seed.items]) {
  const ids = new Set();
  const slugs = new Set();
  for (const item of collection) {
    assert.match(item.slug, slugPattern, `${item.id} invalid slug`);
    assert.ok(!ids.has(item.id), `duplicate id ${item.id}`);
    assert.ok(!slugs.has(item.slug), `duplicate slug ${item.slug}`);
    ids.add(item.id);
    slugs.add(item.slug);
    assert.equal(typeof item.sortOrder, 'number', `${item.id} sortOrder missing`);
    assert.ok(validVisibility.has(item.visibility), `${item.id} invalid visibility`);
  }
}

for (const item of seed.items) {
  assert.ok(seed.groups.some((group) => group.id === item.groupId), `${item.id} group missing`);
  assert.ok(allowedRoutes.has(item.route), `${item.id} route is not allowlisted`);
  assert.ok(allowedIcons.has(item.iconKey), `${item.id} iconKey is not allowlisted`);
  assert.ok(validBadgeVariant.has(item.badgeVariant), `${item.id} invalid badgeVariant`);
  assert.equal(item.openInNewTab, false, `${item.id} openInNewTab must stay false until registry allows it`);
}

for (const [title, itemTitles] of Object.entries(expected)) {
  const group = groupsFor(studentFree).find((entry) => entry.title === title);
  assert.deepEqual(group?.items.map((item) => item.title), itemTitles, `${title} order changed`);
}

assert.equal(activeRouteForPath('/learning/videos/listening-note-map-lecture'), 'video-lessons', 'nested video route active lookup failed');
assert.equal(activeRouteForPath('/practice/listening'), 'listening', 'listening practice active lookup failed');
assert.equal(activeRouteForPath('/tests/mock/interface'), 'mock-tests', 'nested mock interface active lookup failed');
assert.equal(activeRouteForPath('/tests/mock/results'), 'mock-tests', 'nested mock results active lookup failed');
assert.equal(activeRouteForPath('/vocabulary/session/review-due--academic-core'), 'vocabulary', 'nested vocabulary session active lookup failed');
assert.equal(activeRouteForPath('/grammar/relative-clauses'), 'grammar', 'nested grammar topic active lookup failed');
assert.ok(groupsFor(studentFree, { activeRoute: 'reading' }).flatMap((group) => group.items).find((item) => item.routeKey === 'reading')?.isActive, 'active route flag missing');

const fixture = JSON.parse(JSON.stringify(seed));
fixture.items.push({ ...seed.items[0], id: 'disabled-fixture', slug: 'disabled-fixture', title: 'A Very Long Disabled Navigation Label For Overflow Testing', sortOrder: 999, route: '/dashboard', groupId: 'main', isEnabled: false });
const disabledVisible = groupsFor(studentFree, { includeDisabled: true }, fixture).flatMap((group) => group.items).find((item) => item.id === 'disabled-fixture');
const disabledHidden = groupsFor(studentFree, { includeDisabled: false }, fixture).flatMap((group) => group.items).find((item) => item.id === 'disabled-fixture');
assert.ok(disabledVisible, 'disabled menu fixture should render when included');
assert.equal(disabledHidden, undefined, 'disabled menu fixture should hide when disabled items are excluded');
assert.equal(access(studentFree, disabledVisible).disabled, true, 'disabled menu access state missing');
assert.ok(disabledVisible.title.length > 44, 'long label fixture missing');

const freeItemsWithLocks = groupsFor(studentFree).flatMap((group) => group.items);
const freeItemsWithoutLocks = groupsFor(studentFree, { includeLocked: false }).flatMap((group) => group.items);
assert.ok(freeItemsWithLocks.some((item) => item.id === 'mock-tests'), 'premium item should remain visible in current sidebar baseline');
assert.ok(!freeItemsWithoutLocks.some((item) => item.id === 'mock-tests'), 'premium item should be hideable when locked items are excluded');
assert.equal(access(studentFree, seed.items.find((item) => item.id === 'mock-tests')).requiredPlan, 'premium', 'premium access metadata missing');
assert.ok(groupsFor(studentPremium).flatMap((group) => group.items).some((item) => item.id === 'mock-tests'), 'premium user should see premium route');
assert.equal(groupsFor(teacher).length, 0, 'role visibility should hide student nav for non-student role');

assert.ok(shellSource.includes('getVisibleNavigationGroups(user'), 'sidebar must read navigation service');
assert.ok(shellSource.includes('testID="student-mobile-drawer"'), 'mobile drawer missing');
assert.ok(shellSource.includes('groups={sidebarGroups}'), 'desktop and mobile drawer should use the same sidebarGroups data');
assert.ok(shellSource.includes('accessibilityRole="button"'), 'keyboard/button accessibility role missing');
assert.ok(shellSource.includes('accessibilityState={{ selected: active, disabled: !item.isEnabled }}'), 'selected/disabled accessibility state missing');
assert.ok(shellSource.includes('numberOfLines={1}'), 'long menu labels need one-line overflow control');
assert.ok(serviceSource.includes('item.openInNewTab && !route.allowOpenInNewTab'), 'openInNewTab safety guard missing');

console.log('Navigation validation passed');
console.log('- active route: ok');
console.log('- nested route: ok');
console.log('- disabled menu: ok');
console.log('- free/premium visibility: ok');
console.log('- role visibility: ok');
console.log('- mobile drawer shared data: ok');
console.log('- keyboard navigation/accessibility: ok');
console.log('- overflow/long labels: ok');
console.log('- route/icon allowlist safety: ok');


