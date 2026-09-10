import type { User as SupabaseUser } from '@supabase/supabase-js';

import { setCurrentUserSession, type AuthRole, type AuthUser, type AuthResult, type AuthPlan } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  plan: AuthPlan;
  goal: string;
  created_at: string;
  email_verified: boolean;
};

const validRoles: AuthRole[] = ['student', 'teacher', 'institution', 'admin'];

function roleFrom(value: unknown): AuthRole {
  return typeof value === 'string' && validRoles.includes(value as AuthRole) ? value as AuthRole : 'student';
}

function planFrom(value: unknown): AuthPlan {
  return value === 'premium' ? 'premium' : 'free';
}

function userFromSupabase(user: SupabaseUser, profile?: Partial<ProfileRow> | null): AuthUser {
  const metadata = user.user_metadata ?? {};
  const nextUser: AuthUser = {
    id: user.id,
    name: String(profile?.name ?? metadata.name ?? user.email?.split('@')[0] ?? 'Kullanıcı'),
    email: user.email ?? String(profile?.email ?? metadata.email ?? ''),
    role: roleFrom(profile?.role),
    plan: planFrom(profile?.plan),
    goal: String(profile?.goal ?? metadata.goal ?? 'TOEFL iBT hazırlığı'),
    createdAt: String(profile?.created_at ?? user.created_at ?? new Date().toISOString()),
    emailVerified: Boolean(user.email_confirmed_at ?? profile?.email_verified),
  };
  setCurrentUserSession(nextUser);
  return nextUser;
}

async function profileFor(user: SupabaseUser) {
  if (!supabase) return null;
  const result = await supabase.from('profiles').select('id,name,email,role,plan,goal,created_at,email_verified').eq('id', user.id).maybeSingle();
  return result.data ?? null;
}

export function isRemoteAuthEnabled() {
  return isSupabaseConfigured && Boolean(supabase);
}

export async function getRemoteCurrentUser(): Promise<AuthUser | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return userFromSupabase(data.user, await profileFor(data.user));
}

export async function loginRemote(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: 'Merkezi üyelik altyapısı henüz yapılandırılmadı.' };
  const result = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (result.error || !result.data.user) return { ok: false, message: result.error?.message ?? 'E-posta veya şifre hatalı.' };
  return { ok: true, user: userFromSupabase(result.data.user, await profileFor(result.data.user)) };
}

export async function registerRemote(input: {
  name: string;
  email: string;
  password: string;
  role: Exclude<AuthRole, 'admin'>;
  goal?: string;
}): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: 'Merkezi üyelik altyapısı henüz yapılandırılmadı.' };
  const result = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: { data: { name: input.name.trim(), goal: input.goal?.trim() || 'TOEFL iBT hazırlığı', role: input.role } },
  });
  if (result.error || !result.data.user) return { ok: false, message: result.error?.message ?? 'Üyelik oluşturulamadı.' };
  if (!result.data.session) {
    return { ok: false, message: 'Hesabınız oluşturuldu. E-posta adresinize gelen doğrulama bağlantısını açtıktan sonra giriş yapabilirsiniz.' };
  }
  return { ok: true, user: userFromSupabase(result.data.user, await profileFor(result.data.user)) };
}

export async function logoutRemote() {
  if (supabase) await supabase.auth.signOut();
}
