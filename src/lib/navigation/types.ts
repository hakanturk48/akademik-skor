import type { AuthPlan, AuthRole } from '@/lib/auth';

export type StudentRouteKey =
  | 'dashboard'
  | 'my-learning'
  | 'video-lessons'
  | 'reading'
  | 'listening'
  | 'speaking'
  | 'writing'
  | 'vocabulary'
  | 'grammar'
  | 'mini-tests'
  | 'mock-tests'
  | 'my-progress'
  | 'score-analysis'
  | 'skill-analysis'
  | 'study-plan'
  | 'activity-history'
  | 'profile'
  | 'settings'
  | 'subscription';

export type NavigationVisibility = 'public' | 'authenticated' | 'private';
export type NavigationGroupPlacement = 'sidebar' | 'bottom';
export type NavigationBadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'premium';
export type NavigationIconKey =
  | 'dashboard'
  | 'my-learning'
  | 'video-lessons'
  | 'reading'
  | 'listening'
  | 'speaking'
  | 'writing'
  | 'vocabulary'
  | 'grammar'
  | 'mini-tests'
  | 'mock-tests'
  | 'my-progress'
  | 'score-analysis'
  | 'skill-analysis'
  | 'study-plan'
  | 'activity-history'
  | 'profile'
  | 'settings'
  | 'subscription'
  | 'premium';

export interface NavigationGroup {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  visibility: NavigationVisibility;
  placement: NavigationGroupPlacement;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NavigationItem {
  id: string;
  title: string;
  slug: string;
  iconKey: NavigationIconKey;
  route: string;
  groupId: string;
  parentId: string | null;
  sortOrder: number;
  visibility: NavigationVisibility;
  requiredPlan: AuthPlan | null;
  requiredRole: AuthRole | null;
  badgeText: string | null;
  badgeVariant: NavigationBadgeVariant | null;
  isEnabled: boolean;
  openInNewTab: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NavigationSeed {
  groups: NavigationGroup[];
  items: NavigationItem[];
}

export interface NavigationRouteRegistryEntry {
  routeKey: StudentRouteKey;
  route: string;
  componentKey: string;
  activeRoutePatterns: string[];
  allowOpenInNewTab: boolean;
}

export interface ResolvedNavigationItem extends NavigationItem {
  routeKey: StudentRouteKey;
  isActive: boolean;
  isLocked: boolean;
  lockedReason?: string;
}

export interface ResolvedNavigationGroup extends NavigationGroup {
  items: ResolvedNavigationItem[];
}

export interface NavigationAccessDecision {
  allowed: boolean;
  reason?: string;
  requiredPlan?: AuthPlan;
  requiredRole?: AuthRole;
  disabled?: boolean;
}

export interface NavigationGroupQuery {
  activeRoute?: StudentRouteKey;
  includeLocked?: boolean;
  includeDisabled?: boolean;
  placement?: NavigationGroupPlacement;
}
