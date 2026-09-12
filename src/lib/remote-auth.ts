import { createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword, signOut, updateProfile, type Auth, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { setCurrentUserSession, type AuthPlan, type AuthResult, type AuthRole, type AuthUser } from '@/lib/auth';
import { firebaseAuth, firebaseDb, isFirebaseConfigured } from '@/lib/firebase';

const validRoles: AuthRole[] = ['student', 'teacher', 'institution', 'admin'];

type ProfileRow = {
  id?: string;
  name?: string;
  email?: string;
  role?: AuthRole;
  plan?: AuthPlan;
  goal?: string;
  createdAt?: string;
  emailVerified?: boolean;
};

function getAuthRedirectUrl() {
  if (typeof window === 'undefined') return undefined;

  const segments = window.location.pathname.split('/').filter(Boolean);
  const basePath = window.location.hostname.endsWith('.github.io') && segments[0] ? `/${segments[0]}` : '';
  return `${window.location.origin}${basePath}/login`;
}

function getEmailActionSettings() {
  const url = getAuthRedirectUrl();
  return url ? { url } : undefined;
}

function roleFrom(value: unknown): AuthRole {
  return typeof value === 'string' && validRoles.includes(value as AuthRole) ? value as AuthRole : 'student';
}

function planFrom(value: unknown): AuthPlan {
  return value === 'premium' ? 'premium' : 'free';
}

function profileDoc(userId: string) {
  if (!firebaseDb) throw new Error('Firebase Firestore yapılandırılmadı.');
  return doc(firebaseDb, 'profiles', userId);
}

function authErrorMessage(error: unknown, fallback: string) {
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';

  if (code === 'auth/email-already-in-use') return 'Bu e-posta ile oluşturulmuş bir üyelik var.';
  if (code === 'auth/invalid-email') return 'Geçerli bir e-posta adresi girin.';
  if (code === 'auth/weak-password') return 'Şifre en az 6 karakter olmalı.';
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') return 'E-posta veya şifre hatalı.';
  if (code === 'auth/operation-not-allowed') return 'Firebase Authentication içinde E-posta/Şifre girişi etkin değil.';
  if (code === 'permission-denied') return 'Firebase yetkisi reddedildi. Firestore güvenlik kurallarını ve admin profil rolünü kontrol edin.';
  return message || fallback;
}

async function waitForInitialUser(auth: Auth) {
  return new Promise<FirebaseUser | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      () => {
        unsubscribe();
        resolve(null);
      },
    );
  });
}

async function profileFor(user: FirebaseUser): Promise<ProfileRow | null> {
  if (!firebaseDb) return null;
  const snapshot = await getDoc(profileDoc(user.uid));
  return snapshot.exists() ? snapshot.data() as ProfileRow : null;
}

async function syncVerifiedProfile(user: FirebaseUser) {
  if (!firebaseDb || !user.emailVerified) return;
  try {
    await setDoc(profileDoc(user.uid), { emailVerified: true, updatedAt: serverTimestamp() }, { merge: true });
  } catch {
    // Profile sync is helpful but should not block a valid auth session.
  }
}

function userFromFirebase(user: FirebaseUser, profile?: ProfileRow | null): AuthUser {
  const metadata = user.metadata;
  const nextUser: AuthUser = {
    id: user.uid,
    name: String(profile?.name ?? user.displayName ?? user.email?.split('@')[0] ?? 'Kullanıcı'),
    email: user.email ?? String(profile?.email ?? ''),
    role: roleFrom(profile?.role),
    plan: planFrom(profile?.plan),
    goal: String(profile?.goal ?? 'TOEFL iBT hazırlığı'),
    createdAt: String(profile?.createdAt ?? metadata.creationTime ?? new Date().toISOString()),
    emailVerified: Boolean(user.emailVerified || profile?.emailVerified),
  };
  setCurrentUserSession(nextUser);
  return nextUser;
}

export function isRemoteAuthEnabled() {
  return isFirebaseConfigured && Boolean(firebaseAuth && firebaseDb);
}

export async function getRemoteCurrentUser(): Promise<AuthUser | null> {
  if (!firebaseAuth) return null;
  const firebaseUser = firebaseAuth.currentUser ?? await waitForInitialUser(firebaseAuth);
  if (!firebaseUser) return null;
  if (!firebaseUser.emailVerified) {
    await signOut(firebaseAuth);
    return null;
  }

  try {
    await syncVerifiedProfile(firebaseUser);
    return userFromFirebase(firebaseUser, await profileFor(firebaseUser));
  } catch {
    return userFromFirebase(firebaseUser, null);
  }
}

export async function loginRemote(email: string, password: string): Promise<AuthResult> {
  if (!firebaseAuth) return { ok: false, message: 'Firebase üyelik altyapısı henüz yapılandırılmadı.' };
  try {
    const result = await signInWithEmailAndPassword(firebaseAuth, email.trim().toLowerCase(), password);
    if (!result.user.emailVerified) {
      await sendEmailVerification(result.user, getEmailActionSettings());
      await signOut(firebaseAuth);
      return { ok: false, message: 'E-posta doğrulaması tamamlanmamış. Yeni doğrulama bağlantısı gönderdik.' };
    }
    await syncVerifiedProfile(result.user);
    return { ok: true, user: userFromFirebase(result.user, await profileFor(result.user)) };
  } catch (error) {
    return { ok: false, message: authErrorMessage(error, 'E-posta veya şifre hatalı.') };
  }
}

export async function registerRemote(input: {
  name: string;
  email: string;
  password: string;
  role: Exclude<AuthRole, 'admin'>;
  goal?: string;
}): Promise<AuthResult> {
  if (!firebaseAuth || !firebaseDb) return { ok: false, message: 'Firebase üyelik altyapısı henüz yapılandırılmadı.' };
  try {
    const result = await createUserWithEmailAndPassword(firebaseAuth, input.email.trim().toLowerCase(), input.password);
    await updateProfile(result.user, { displayName: input.name.trim() });
    await setDoc(profileDoc(result.user.uid), {
      id: result.user.uid,
      name: input.name.trim(),
      email: result.user.email,
      role: input.role,
      plan: 'free',
      goal: input.goal?.trim() || 'TOEFL iBT hazırlığı',
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      emailVerified: false,
    });
    await sendEmailVerification(result.user, getEmailActionSettings());
    await signOut(firebaseAuth);
    return { ok: false, message: 'Hesabınız oluşturuldu. E-posta adresinize gelen doğrulama bağlantısını açtıktan sonra giriş yapabilirsiniz.' };
  } catch (error) {
    return { ok: false, message: authErrorMessage(error, 'Üyelik oluşturulamadı.') };
  }
}

export async function logoutRemote() {
  if (firebaseAuth) await signOut(firebaseAuth);
}
