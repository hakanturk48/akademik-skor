export type AuthRole = 'student' | 'teacher' | 'institution' | 'admin';
export type AuthPlan = 'free' | 'premium';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  plan: AuthPlan;
  goal: string;
  createdAt: string;
  emailVerified: boolean;
};

type StoredUser = AuthUser & {
  passwordHash: string;
  localAdmin?: boolean;
};

type AuthSuccess = {
  ok: true;
  user: AuthUser;
};

type AuthFailure = {
  ok: false;
  message: string;
};

export type AuthResult = AuthSuccess | AuthFailure;

export type VerificationResult =
  | {
      ok: true;
      code: string;
      expiresAt: string;
    }
  | AuthFailure;

export type VerifyEmailResult = { ok: true } | AuthFailure;

const USERS_KEY = 'akademik-skor.users';
const SESSION_KEY = 'akademik-skor.session';
const VERIFICATION_KEY = 'akademik-skor.email-verifications';
const VERIFICATION_TTL_MS = 10 * 60 * 1000;

type EmailVerification = {
  email: string;
  code: string;
  expiresAt: string;
  verifiedAt?: string;
};

let memoryUsers: StoredUser[] = [];
let memorySession: AuthUser | null = null;
let memoryVerifications: EmailVerification[] = [];

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function demoHashPassword(password: string) {
  let hash = 2166136261;
  for (let index = 0; index < password.length; index += 1) {
    hash ^= password.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${hash >>> 0}:${password.length}`;
}

function normalizePlan(plan?: AuthPlan): AuthPlan {
  return plan === 'premium' ? 'premium' : 'free';
}

function normalizeStoredUser(user: StoredUser): StoredUser {
  return {
    ...user,
    plan: normalizePlan(user.plan),
    emailVerified: user.emailVerified ?? true,
  };
}

function normalizeSessionUser(user: AuthUser): AuthUser {
  return {
    ...user,
    plan: normalizePlan(user.plan),
    emailVerified: user.emailVerified ?? true,
  };
}

function publicUser(user: StoredUser): AuthUser {
  const { passwordHash: _passwordHash, localAdmin: _localAdmin, ...safeUser } = normalizeStoredUser(user);
  return safeUser;
}

function readUsers(): StoredUser[] {
  if (!hasLocalStorage()) {
    return memoryUsers.map(normalizeStoredUser);
  }

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    const users = raw ? (JSON.parse(raw) as StoredUser[]) : [];
    return users.map(normalizeStoredUser);
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  const normalizedUsers = users.map(normalizeStoredUser);

  if (!hasLocalStorage()) {
    memoryUsers = normalizedUsers;
    return;
  }

  window.localStorage.setItem(USERS_KEY, JSON.stringify(normalizedUsers));
}

function readVerifications(): EmailVerification[] {
  const now = Date.now();
  const filterFresh = (items: EmailVerification[]) => items.filter((item) => Date.parse(item.expiresAt) > now);

  if (!hasLocalStorage()) {
    memoryVerifications = filterFresh(memoryVerifications);
    return memoryVerifications;
  }

  try {
    const raw = window.localStorage.getItem(VERIFICATION_KEY);
    const verifications = filterFresh(raw ? (JSON.parse(raw) as EmailVerification[]) : []);
    window.localStorage.setItem(VERIFICATION_KEY, JSON.stringify(verifications));
    return verifications;
  } catch {
    return [];
  }
}

function writeVerifications(verifications: EmailVerification[]) {
  if (!hasLocalStorage()) {
    memoryVerifications = verifications;
    return;
  }

  window.localStorage.setItem(VERIFICATION_KEY, JSON.stringify(verifications));
}

export function setCurrentUserSession(user: AuthUser) {
  const normalizedUser = normalizeSessionUser(user);

  if (!hasLocalStorage()) {
    memorySession = normalizedUser;
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(normalizedUser));
}

function makeUserId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `user-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function makeVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isEmailVerified(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const verifications = readVerifications();
  return verifications.some((item) => item.email === email && Boolean(item.verifiedAt));
}

function consumeEmailVerification(emailInput: string) {
  const email = normalizeEmail(emailInput);
  writeVerifications(readVerifications().filter((item) => item.email !== email));
}

export function getCurrentUser(): AuthUser | null {
  if (!hasLocalStorage()) {
    return memorySession;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    const user = raw ? (JSON.parse(raw) as AuthUser) : null;
    return user ? normalizeSessionUser(user) : null;
  } catch {
    return null;
  }
}

export function requestEmailVerification(emailInput: string): VerificationResult {
  const email = normalizeEmail(emailInput);

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, message: 'Geçerli bir e-posta adresi girin.' };
  }

  const users = readUsers();
  if (users.some((user) => user.email === email)) {
    return { ok: false, message: 'Bu e-posta ile oluşturulmuş bir üyelik var.' };
  }

  const code = makeVerificationCode();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
  const nextVerifications = [
    ...readVerifications().filter((item) => item.email !== email),
    { email, code, expiresAt },
  ];

  writeVerifications(nextVerifications);

  return { ok: true, code, expiresAt };
}

export function verifyEmailCode(emailInput: string, codeInput: string): VerifyEmailResult {
  const email = normalizeEmail(emailInput);
  const code = codeInput.replace(/\D/g, '');
  const verifications = readVerifications();
  const verification = verifications.find((item) => item.email === email);

  if (!verification) {
    return { ok: false, message: 'Önce e-posta doğrulama kodu alın.' };
  }

  if (Date.parse(verification.expiresAt) <= Date.now()) {
    return { ok: false, message: 'Doğrulama kodunun süresi doldu. Yeni kod alın.' };
  }

  if (verification.code !== code) {
    return { ok: false, message: 'Doğrulama kodu hatalı.' };
  }

  writeVerifications(
    verifications.map((item) => (item.email === email ? { ...item, verifiedAt: new Date().toISOString() } : item)),
  );

  return { ok: true };
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: AuthRole;
  plan?: AuthPlan;
  goal?: string;
}): AuthResult {
  if (!(['student', 'teacher', 'institution'] as string[]).includes(input.role)) {
    return { ok: false, message: 'Admin hesabı normal üyelik formundan oluşturulamaz.' };
  }
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const goal = input.goal?.trim() || 'TOEFL iBT hazırlığı';

  if (name.length < 2) {
    return { ok: false, message: 'Lütfen ad soyad bilgisini girin.' };
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, message: 'Geçerli bir e-posta adresi girin.' };
  }

  if (password.length < 6) {
    return { ok: false, message: 'Şifre en az 6 karakter olmalı.' };
  }

  const users = readUsers();
  if (users.some((user) => user.email === email)) {
    return { ok: false, message: 'Bu e-posta ile oluşturulmuş bir üyelik var.' };
  }

  if (!isEmailVerified(email)) {
    return { ok: false, message: 'Üyeliği oluşturmak için e-postanızı doğrulayın.' };
  }

  const createdAt = new Date().toISOString();
  const storedUser: StoredUser = {
    id: makeUserId(),
    name,
    email,
    role: input.role,
    plan: normalizePlan(input.plan),
    goal,
    createdAt,
    emailVerified: true,
    passwordHash: demoHashPassword(password),
  };

  const nextUsers = [...users, storedUser];
  writeUsers(nextUsers);
  consumeEmailVerification(email);
  const user = publicUser(storedUser);
  setCurrentUserSession(user);

  return { ok: true, user };
}

export function loginUser(emailInput: string, passwordInput: string): AuthResult {
  const email = normalizeEmail(emailInput);
  const password = passwordInput.trim();

  if (!email || !password) {
    return { ok: false, message: 'E-posta ve şifre alanlarını doldurun.' };
  }

  const users = readUsers();
  const user = users.find((item) => item.email === email && item.passwordHash === demoHashPassword(password));
  if (!user) {
    return { ok: false, message: 'E-posta veya şifre hatalı.' };
  }

  if (user.localAdmin && !isLocalAdminDevelopment()) {
    return { ok: false, message: 'Bu yerel admin hesabı yalnız localhost geliştirme ortamında kullanılabilir.' };
  }
  if (!user.emailVerified && !(user.localAdmin && isLocalAdminDevelopment())) {
    return { ok: false, message: 'Bu hesabın e-posta doğrulaması tamamlanmamış.' };
  }

  const sessionUser = publicUser(user);
  setCurrentUserSession(sessionUser);

  return { ok: true, user: sessionUser };
}

function readLocalSetupUsers(): StoredUser[] {
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every((item) => item && typeof item.id === 'string' && typeof item.email === 'string' && typeof item.passwordHash === 'string' && typeof item.role === 'string')) {
    throw new Error('Invalid local account data');
  }
  return value.map(normalizeStoredUser);
}

function isLocalAdminDevelopment() {
  return typeof __DEV__ !== 'undefined' && __DEV__ && typeof window !== 'undefined' && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

export function getLocalAdminSetupState(): { available: boolean; message: string } {
  // This is a local demo bootstrap, never a production authorization boundary.
  if (!isLocalAdminDevelopment()) {
    return { available: false, message: 'Admin hesabı sistem yöneticisi tarafından oluşturulmalıdır.' };
  }
  try {
    if (readLocalSetupUsers().some((user) => user.role === 'admin')) {
      return { available: false, message: 'Bu tarayıcıda bir admin hesabı var. Oluşturduğunuz e-posta ve şifreyle giriş yapın.' };
    }
    return { available: true, message: 'Bu tarayıcıda henüz yerel admin hesabı yok.' };
  } catch {
    return { available: false, message: 'Yerel hesap verisi okunamadı. Mevcut veriler değiştirilmedi.' };
  }
}

export function createLocalAdminAccount(input: { name: string; email: string; password: string }): AuthResult {
  const setup = getLocalAdminSetupState();
  if (!setup.available) return { ok: false, message: setup.message };
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  if (name.length < 2) return { ok: false, message: 'Lütfen ad soyad bilgisini girin.' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: 'Geçerli bir e-posta adresi girin.' };
  if (password.length < 12) return { ok: false, message: 'Yerel admin şifresi en az 12 karakter olmalı.' };
  let storedUser: StoredUser;
  try {
    const users = readLocalSetupUsers();
    if (users.some((user) => user.email === email)) return { ok: false, message: 'Bu e-posta ile bir hesap var. Yerel admin için farklı bir e-posta kullanın.' };
    storedUser = {
      id: makeUserId(), name, email, role: 'admin', plan: 'free', goal: 'Yerel içerik yönetimi',
      createdAt: new Date().toISOString(), emailVerified: false, localAdmin: true, passwordHash: demoHashPassword(password),
    };
    // Local bootstrap is not email verification. Login handles this local account explicitly.
    writeUsers([...users, storedUser]);
  } catch { return { ok: false, message: 'Hesap kaydedilemedi. Tarayıcı depolamasını kontrol edin.' }; }
  const user = publicUser(storedUser);
  try { setCurrentUserSession(user); }
  catch { return { ok: false, message: 'Hesap oluşturuldu ancak oturum açılamadı. E-posta ve şifrenizle tekrar giriş yapın.' }; }
  return { ok: true, user };
}

export function getPostLoginRoute(user: AuthUser, requested?: string): '/admin' | '/dashboard' {
  return user.role === 'admin' || requested === '/admin' ? '/admin' : '/dashboard';
}

export function updateCurrentUserPlan(plan: AuthPlan): AuthUser | null {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return null;
  }

  const normalizedPlan = normalizePlan(plan);
  const nextUser = { ...currentUser, plan: normalizedPlan };
  writeUsers(readUsers().map((user) => (user.id === currentUser.id ? { ...user, plan: normalizedPlan } : user)));
  setCurrentUserSession(nextUser);
  return nextUser;
}

export function logoutUser() {
  if (!hasLocalStorage()) {
    memorySession = null;
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

export function getRoleLabel(role: AuthRole) {
  if (role === 'admin') return 'Admin';
  if (role === 'teacher') return 'Öğretmen';
  if (role === 'institution') return 'Kurum';
  return 'Öğrenci';
}

export function getPlanLabel(plan?: AuthPlan) {
  return normalizePlan(plan) === 'premium' ? 'Premium' : 'Free';
}

export function isPremiumUser(user: AuthUser | null) {
  return user?.plan === 'premium';
}
