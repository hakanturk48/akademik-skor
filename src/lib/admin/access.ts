import type { AuthRole, AuthUser } from '@/lib/auth';

import type { AdminAccessDecision } from './types';

export const adminRequiredRoles = ['admin'] as const satisfies readonly AuthRole[];

export function isAdminRole(role: AuthRole | undefined): role is (typeof adminRequiredRoles)[number] {
  return Boolean(role && adminRequiredRoles.includes(role as (typeof adminRequiredRoles)[number]));
}

export function getAdminAccessDecision(user: AuthUser | null): AdminAccessDecision {
  if (!user) {
    return {
      allowed: false,
      reason: 'Admin paneline erişmek için giriş yapılmalı.',
      requiredRole: 'admin',
    };
  }

  if (!isAdminRole(user.role)) {
    return {
      allowed: false,
      reason: 'Admin paneli yalnızca admin rolüne sahip yetkili hesaplara açıktır.',
      requiredRole: 'admin',
    };
  }

  return { allowed: true };
}

export function assertAdminAccess(user: AuthUser | null): asserts user is AuthUser {
  const decision = getAdminAccessDecision(user);
  if (!decision.allowed) {
    throw new Error(decision.reason ?? 'Admin yetkisi gerekli.');
  }
}

// Client demo guard. Production authorization must verify a server session.
export function requireAdminRole(user: AuthUser | null): AuthUser {
  assertAdminAccess(user);
  return user;
}
