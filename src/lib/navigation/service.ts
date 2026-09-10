import navigationSeedJson from './data/navigation.json';
import { getNavigationRouteByKey, getNavigationRouteEntry } from './registry';

import type { AuthUser } from '@/lib/auth';
import type {
  NavigationAccessDecision,
  NavigationGroup,
  NavigationGroupPlacement,
  NavigationGroupQuery,
  NavigationItem,
  NavigationSeed,
  ResolvedNavigationGroup,
  ResolvedNavigationItem,
  StudentRouteKey,
} from './types';

export const navigationSeed = navigationSeedJson as unknown as NavigationSeed;
export const navigationGroups = navigationSeed.groups;
export const navigationItems = navigationSeed.items;

export function getNavigationItemByRouteKey(routeKey: StudentRouteKey, items: NavigationItem[] = navigationItems): NavigationItem | undefined {
  return items.find((item) => getNavigationRouteEntry(item.route)?.routeKey === routeKey);
}

export function getNavigationItemById(id: string, items: NavigationItem[] = navigationItems): NavigationItem | undefined {
  return items.find((item) => item.id === id);
}

export function getNavigationGroupById(id: string, groups: NavigationGroup[] = navigationGroups): NavigationGroup | undefined {
  return groups.find((group) => group.id === id);
}

export function getStudentRouteHref(routeKey: StudentRouteKey): string {
  return getNavigationRouteByKey(routeKey)?.route ?? '/dashboard';
}

export function getNavigationItemAccess(user: AuthUser | null, item: NavigationItem): NavigationAccessDecision {
  if (!item.isEnabled) {
    return {
      allowed: false,
      disabled: true,
      reason: 'Bu menu ogesi su anda kapali.',
    };
  }

  if (item.visibility === 'private') {
    return {
      allowed: false,
      reason: 'Bu menu ogesi yalnizca dahili kullanim icindir.',
    };
  }

  if (item.visibility === 'authenticated' && !user) {
    return {
      allowed: false,
      reason: 'Bu alana erismek icin giris yapin.',
    };
  }

  if (item.requiredRole && user?.role !== item.requiredRole) {
    return {
      allowed: false,
      reason: 'Bu menu ogesi icin farkli bir hesap rolu gerekir.',
      requiredRole: item.requiredRole,
    };
  }

  if (item.requiredPlan && user?.plan !== item.requiredPlan) {
    return {
      allowed: false,
      reason: 'Bu menu ogesi Premium plan gerektirir.',
      requiredPlan: item.requiredPlan,
    };
  }

  return { allowed: true };
}

function canRenderGroup(user: AuthUser | null, group: NavigationGroup, placement: NavigationGroupPlacement): boolean {
  if (!group.isEnabled || group.placement !== placement || group.visibility === 'private') {
    return false;
  }

  return group.visibility !== 'authenticated' || Boolean(user);
}

function canRenderItem(user: AuthUser | null, item: NavigationItem, includeLocked: boolean, includeDisabled: boolean): boolean {
  const route = getNavigationRouteEntry(item.route);

  if (!route || (item.openInNewTab && !route.allowOpenInNewTab)) {
    return false;
  }

  if (!item.isEnabled) {
    return includeDisabled;
  }

  if (item.visibility === 'private') {
    return false;
  }

  if (item.visibility === 'authenticated' && !user) {
    return false;
  }

  if (item.requiredRole && user?.role !== item.requiredRole) {
    return false;
  }

  if (item.requiredPlan && user?.plan !== item.requiredPlan) {
    return includeLocked;
  }

  return true;
}

function resolveNavigationItem(user: AuthUser | null, item: NavigationItem, activeRoute?: StudentRouteKey): ResolvedNavigationItem | undefined {
  const routeEntry = getNavigationRouteEntry(item.route);

  if (!routeEntry) {
    return undefined;
  }

  const access = getNavigationItemAccess(user, item);

  return {
    ...item,
    routeKey: routeEntry.routeKey,
    isActive: routeEntry.routeKey === activeRoute,
    isLocked: !access.allowed && !access.disabled && Boolean(access.requiredPlan),
    lockedReason: access.allowed ? undefined : access.reason,
  };
}

export function getVisibleNavigationGroups(
  user: AuthUser | null,
  query: NavigationGroupQuery = {},
  seed: NavigationSeed = navigationSeed,
): ResolvedNavigationGroup[] {
  const includeLocked = query.includeLocked ?? true;
  const includeDisabled = query.includeDisabled ?? true;
  const placement = query.placement ?? 'sidebar';

  return seed.groups
    .filter((group) => canRenderGroup(user, group, placement))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
    .map((group) => {
      const items = seed.items
        .filter((item) => item.groupId === group.id)
        .filter((item) => canRenderItem(user, item, includeLocked, includeDisabled))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
        .map((item) => resolveNavigationItem(user, item, query.activeRoute))
        .filter((item): item is ResolvedNavigationItem => Boolean(item));

      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);
}

export function getBottomNavigationItem(user: AuthUser | null, seed: NavigationSeed = navigationSeed): ResolvedNavigationItem | undefined {
  return getVisibleNavigationGroups(user, { placement: 'bottom', includeLocked: true, includeDisabled: true }, seed)[0]?.items[0];
}

export function isPremiumNavigationRoute(routeKey: StudentRouteKey): boolean {
  return getNavigationItemByRouteKey(routeKey)?.requiredPlan === 'premium';
}

export function getNavigationRouteAccess(user: AuthUser | null, routeKey: StudentRouteKey): NavigationAccessDecision {
  const item = getNavigationItemByRouteKey(routeKey);

  if (!item) {
    return {
      allowed: false,
      reason: 'Bu route navigation registry icinde tanimli degil.',
    };
  }

  return getNavigationItemAccess(user, item);
}
