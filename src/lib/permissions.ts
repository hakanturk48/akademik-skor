import type { AuthPlan, AuthRole, AuthUser } from '@/lib/auth';
import { getNavigationRouteAccess, getNavigationRouteEntry, isPremiumNavigationRoute, navigationItems, type StudentRouteKey } from '@/lib/navigation';

export type { StudentRouteKey } from '@/lib/navigation';

export type AccessDecision = {
  allowed: boolean;
  reason?: string;
  requiredRole?: AuthRole;
  requiredPlan?: AuthPlan;
  disabled?: boolean;
};

export type EntitlementKey =
  | 'video-full-access'
  | 'mock-test-access'
  | 'advanced-score-analysis'
  | 'advanced-skill-analysis'
  | 'detailed-ai-feedback';

export const routePlanRules = navigationItems.reduce((rules, item) => {
  const route = getNavigationRouteEntry(item.route);

  if (route && item.requiredPlan) {
    rules[route.routeKey] = item.requiredPlan;
  }

  return rules;
}, {} as Partial<Record<StudentRouteKey, AuthPlan>>);

export const entitlementPlanRules: Record<EntitlementKey, AuthPlan> = {
  'video-full-access': 'premium',
  'mock-test-access': 'premium',
  'advanced-score-analysis': 'premium',
  'advanced-skill-analysis': 'premium',
  'detailed-ai-feedback': 'premium',
};

export function isPremiumStudentRoute(route: StudentRouteKey) {
  return isPremiumNavigationRoute(route);
}

export function getStudentRouteAccess(user: AuthUser | null, route: StudentRouteKey): AccessDecision {
  if (!user) {
    return {
      allowed: false,
      reason: 'Bu alana erişmek için giriş yapın.',
    };
  }

  const decision = getNavigationRouteAccess(user, route);

  if (decision.allowed) {
    return { allowed: true };
  }

  if (decision.disabled) {
    return {
      allowed: false,
      disabled: true,
      reason: 'Bu özellik şu anda kapalı.',
    };
  }

  if (decision.requiredRole) {
    return {
      allowed: false,
      reason: 'Bu bölüm öğrenci hesabı ile kullanılabilir.',
      requiredRole: decision.requiredRole,
    };
  }

  if (decision.requiredPlan) {
    return {
      allowed: false,
      reason: 'Bu özellik Premium plan gerektirir.',
      requiredPlan: decision.requiredPlan,
    };
  }

  return {
    allowed: false,
    reason: decision.reason ?? 'Bu işlem için yetkiniz yok.',
  };
}

export function getEntitlementAccess(user: AuthUser | null, entitlement: EntitlementKey): AccessDecision {
  if (!user) {
    return {
      allowed: false,
      reason: 'Bu içeriğe erişmek için giriş yapın.',
    };
  }

  const requiredPlan = entitlementPlanRules[entitlement];
  if (user.plan !== requiredPlan) {
    return {
      allowed: false,
      reason: 'Bu içerik Premium plan gerektirir.',
      requiredPlan,
    };
  }

  return { allowed: true };
}

export function assertStudentRouteAccess(user: AuthUser | null, route: StudentRouteKey) {
  const decision = getStudentRouteAccess(user, route);
  if (!decision.allowed) {
    throw new Error(decision.reason ?? 'Bu işlem için yetkiniz yok.');
  }
}

export function getPlanActionLabel(user: AuthUser | null) {
  return user?.plan === 'premium' ? 'Manage Subscription' : 'Upgrade to Premium';
}
