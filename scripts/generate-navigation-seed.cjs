const fs = require('node:fs');
const path = require('node:path');

const now = '2026-09-04T00:00:00.000Z';
const group = (id, title, sortOrder, placement = 'sidebar') => ({
  id,
  title,
  slug: id,
  sortOrder,
  visibility: 'authenticated',
  placement,
  isEnabled: true,
  createdAt: now,
  updatedAt: now,
});
const item = (id, title, route, groupId, sortOrder, extra = {}) => ({
  id,
  title,
  slug: id,
  iconKey: id,
  route,
  groupId,
  parentId: null,
  sortOrder,
  visibility: 'authenticated',
  requiredPlan: null,
  requiredRole: 'student',
  badgeText: null,
  badgeVariant: null,
  isEnabled: true,
  openInNewTab: false,
  createdAt: now,
  updatedAt: now,
  ...extra,
});

const seed = {
  groups: [
    group('main', 'MAIN', 10),
    group('practice', 'PRACTICE', 20),
    group('vocabulary', 'VOCABULARY', 30),
    group('tests', 'TESTS', 40),
    group('progress', 'PROGRESS', 50),
    group('account', 'ACCOUNT', 60),
    group('bottom', 'BOTTOM', 70, 'bottom'),
  ],
  items: [
    item('dashboard', 'Dashboard', '/dashboard', 'main', 10),
    item('my-learning', 'My Learning', '/my-learning', 'main', 20),
    item('video-lessons', 'Video Lessons', '/learning/videos', 'practice', 10),
    item('reading', 'Reading', '/practice/reading', 'practice', 20),
    item('listening', 'Listening', '/practice/listening', 'practice', 30),
    item('speaking', 'Speaking', '/practice/speaking', 'practice', 40),
    item('writing', 'Writing', '/practice/writing', 'practice', 50),
    item('vocabulary', 'Vocabulary', '/vocabulary', 'vocabulary', 10),
    item('grammar', 'Grammar', '/grammar', 'vocabulary', 20),
    item('mini-tests', 'Mini Tests', '/tests/mini', 'tests', 10),
    item('mock-tests', 'Mock Tests', '/tests/mock', 'tests', 20, { requiredPlan: 'premium', badgeVariant: 'premium' }),
    item('my-progress', 'My Progress', '/progress', 'progress', 10),
    item('score-analysis', 'Score Analysis', '/progress/score-analysis', 'progress', 20, { requiredPlan: 'premium', badgeVariant: 'premium' }),
    item('skill-analysis', 'Skill Analysis', '/progress/skill-analysis', 'progress', 30, { requiredPlan: 'premium', badgeVariant: 'premium' }),
    item('study-plan', 'Study Plan', '/progress/study-plan', 'progress', 40),
    item('activity-history', 'Activity History', '/progress/activity', 'progress', 50),
    item('profile', 'Profile', '/account/profile', 'account', 10),
    item('settings', 'Settings', '/account/settings', 'account', 20),
    item('subscription', 'Subscription', '/account/subscription', 'account', 30),
    item('premium', 'Upgrade to Premium', '/account/subscription', 'bottom', 10, { iconKey: 'premium', requiredRole: 'student', badgeVariant: 'premium' }),
  ],
};

const outPath = path.join(process.cwd(), 'src', 'lib', 'navigation', 'data', 'navigation.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(seed, null, 2)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
