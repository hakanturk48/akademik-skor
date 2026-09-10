import type { NavigationRouteRegistryEntry, StudentRouteKey } from './types';

export const navigationRouteRegistry = {
  dashboard: { routeKey: 'dashboard', route: '/dashboard', componentKey: 'DashboardPage', activeRoutePatterns: ['/dashboard'], allowOpenInNewTab: false },
  myLearning: { routeKey: 'my-learning', route: '/my-learning', componentKey: 'MyLearningPage', activeRoutePatterns: ['/my-learning'], allowOpenInNewTab: false },
  videoLessons: { routeKey: 'video-lessons', route: '/learning/videos', componentKey: 'VideoLessonsPage', activeRoutePatterns: ['/learning/videos', '/learning/videos/*'], allowOpenInNewTab: false },
  reading: { routeKey: 'reading', route: '/practice/reading', componentKey: 'ReadingPracticePage', activeRoutePatterns: ['/practice/reading'], allowOpenInNewTab: false },
  listening: { routeKey: 'listening', route: '/listening', componentKey: 'ListeningHubPage', activeRoutePatterns: ['/listening', '/practice/listening'], allowOpenInNewTab: false },
  speaking: { routeKey: 'speaking', route: '/practice/speaking', componentKey: 'SpeakingPracticePage', activeRoutePatterns: ['/practice/speaking'], allowOpenInNewTab: false },
  writing: { routeKey: 'writing', route: '/practice/writing', componentKey: 'WritingPracticePage', activeRoutePatterns: ['/practice/writing'], allowOpenInNewTab: false },
  vocabulary: { routeKey: 'vocabulary', route: '/vocabulary', componentKey: 'VocabularyPage', activeRoutePatterns: ['/vocabulary', '/vocabulary/session/*'], allowOpenInNewTab: false },
  grammar: { routeKey: 'grammar', route: '/grammar', componentKey: 'GrammarPage', activeRoutePatterns: ['/grammar', '/grammar/*'], allowOpenInNewTab: false },
  miniTests: { routeKey: 'mini-tests', route: '/tests/mini', componentKey: 'MiniTestsPage', activeRoutePatterns: ['/tests/mini'], allowOpenInNewTab: false },
  mockTests: { routeKey: 'mock-tests', route: '/tests/mock', componentKey: 'MockTestsPage', activeRoutePatterns: ['/tests/mock', '/tests/mock/interface', '/tests/mock/results'], allowOpenInNewTab: false },
  myProgress: { routeKey: 'my-progress', route: '/progress', componentKey: 'MyProgressPage', activeRoutePatterns: ['/progress'], allowOpenInNewTab: false },
  scoreAnalysis: { routeKey: 'score-analysis', route: '/progress/score-analysis', componentKey: 'ScoreAnalysisPage', activeRoutePatterns: ['/progress/score-analysis'], allowOpenInNewTab: false },
  skillAnalysis: { routeKey: 'skill-analysis', route: '/progress/skill-analysis', componentKey: 'SkillAnalysisPage', activeRoutePatterns: ['/progress/skill-analysis'], allowOpenInNewTab: false },
  studyPlan: { routeKey: 'study-plan', route: '/progress/study-plan', componentKey: 'StudyPlanPage', activeRoutePatterns: ['/progress/study-plan'], allowOpenInNewTab: false },
  activityHistory: { routeKey: 'activity-history', route: '/progress/activity', componentKey: 'ActivityHistoryPage', activeRoutePatterns: ['/progress/activity'], allowOpenInNewTab: false },
  profile: { routeKey: 'profile', route: '/account/profile', componentKey: 'ProfilePage', activeRoutePatterns: ['/account/profile'], allowOpenInNewTab: false },
  settings: { routeKey: 'settings', route: '/account/settings', componentKey: 'SettingsPage', activeRoutePatterns: ['/account/settings'], allowOpenInNewTab: false },
  subscription: { routeKey: 'subscription', route: '/account/subscription', componentKey: 'SubscriptionPage', activeRoutePatterns: ['/account/subscription', '/account/unlock-premium', '/account/checkout', '/account/payment-success', '/account/payment-failed'], allowOpenInNewTab: false },
} as const satisfies Record<string, NavigationRouteRegistryEntry>;

export const allowedNavigationRoutes = Object.values(navigationRouteRegistry).map((entry) => entry.route);

export function getNavigationRouteEntry(route: string): NavigationRouteRegistryEntry | undefined {
  return Object.values(navigationRouteRegistry).find((entry) => entry.route === route);
}

export function getNavigationRouteByKey(routeKey: StudentRouteKey): NavigationRouteRegistryEntry | undefined {
  return Object.values(navigationRouteRegistry).find((entry) => entry.routeKey === routeKey);
}

export function isAllowedNavigationRoute(route: string): boolean {
  return Boolean(getNavigationRouteEntry(route));
}

export function getActiveRouteKeyForPath(pathname: string): StudentRouteKey | undefined {
  const normalized = pathname.split('?')[0].replace(/\/$/, '') || '/';

  return Object.values(navigationRouteRegistry).find((entry) =>
    entry.activeRoutePatterns.some((pattern) => {
      if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -2);
        return normalized === prefix || normalized.startsWith(`${prefix}/`);
      }

      return normalized === pattern;
    }),
  )?.routeKey;
}


