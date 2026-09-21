import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';

import { firebaseAuth, firebaseDb, isFirebaseConfigured } from '@/lib/firebase';

export type ListeningProgress = {
  schemaVersion: 1;
  userId: string;
  contentId: string;
  contentTitle: string;
  subtitle: string;
  href: string;
  taskTypeId: string;
  subskillId: string;
  difficultyId: string;
  lengthId: string;
  sessionMode: string;
  currentSeconds: number;
  durationSeconds: number;
  progressPercent: number;
  completed: boolean;
  firstStartedAt: string;
  lastActivityAt: string;
};

const localStoragePrefix = 'akademik-skor.listening-progress.v1';

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function localStorageKey(userId: string) {
  return `${localStoragePrefix}|${userId}`;
}

function normalizeProgress(value: unknown, userId: string): ListeningProgress | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<ListeningProgress>;
  if (item.schemaVersion !== 1 || item.userId !== userId || typeof item.contentId !== 'string') return null;
  if (typeof item.currentSeconds !== 'number' || typeof item.durationSeconds !== 'number' || typeof item.progressPercent !== 'number') return null;
  return item as ListeningProgress;
}

function writeLocalCatalog(userId: string, items: ListeningProgress[]) {
  if (!hasBrowserStorage()) return;
  try {
    window.localStorage.setItem(localStorageKey(userId), JSON.stringify(items.slice(0, 50)));
  } catch {
    // Firestore remains the durable source when local storage is unavailable.
  }
}

export function readListeningProgressCatalog(userId: string): ListeningProgress[] {
  if (!hasBrowserStorage()) return [];
  try {
    const raw = window.localStorage.getItem(localStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) as unknown[] : [];
    return Array.isArray(parsed)
      ? parsed.map((item) => normalizeProgress(item, userId)).filter((item): item is ListeningProgress => Boolean(item))
      : [];
  } catch {
    return [];
  }
}

export function cacheListeningProgress(progress: ListeningProgress) {
  const current = readListeningProgressCatalog(progress.userId);
  const next = [progress, ...current.filter((item) => item.contentId !== progress.contentId)]
    .sort((first, second) => Date.parse(second.lastActivityAt) - Date.parse(first.lastActivityAt));
  writeLocalCatalog(progress.userId, next);
}

export function buildListeningProgress(input: {
  previous?: ListeningProgress | null;
  userId: string;
  contentId: string;
  contentTitle: string;
  subtitle: string;
  href: string;
  taskTypeId: string;
  subskillId: string;
  difficultyId: string;
  lengthId: string;
  sessionMode: string;
  currentSeconds: number;
  durationSeconds: number;
  completed?: boolean;
}): ListeningProgress {
  const now = new Date().toISOString();
  const durationSeconds = Math.max(1, Math.round(input.durationSeconds));
  const completed = Boolean(input.completed);
  const currentSeconds = completed ? durationSeconds : Math.min(durationSeconds, Math.max(0, Math.round(input.currentSeconds)));
  const progressPercent = completed ? 100 : Math.min(100, Math.max(0, Math.round(currentSeconds / durationSeconds * 100)));
  return {
    schemaVersion: 1,
    userId: input.userId,
    contentId: input.contentId,
    contentTitle: input.contentTitle,
    subtitle: input.subtitle,
    href: input.href,
    taskTypeId: input.taskTypeId,
    subskillId: input.subskillId,
    difficultyId: input.difficultyId,
    lengthId: input.lengthId,
    sessionMode: input.sessionMode,
    currentSeconds,
    durationSeconds,
    progressPercent,
    completed: completed || progressPercent >= 95,
    firstStartedAt: input.previous?.firstStartedAt ?? now,
    lastActivityAt: now,
  };
}

function progressDocumentId(contentId: string) {
  return contentId.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 120) || 'listening';
}

export async function saveListeningProgress(progress: ListeningProgress) {
  cacheListeningProgress(progress);
  const remoteUser = firebaseAuth?.currentUser;
  if (!isFirebaseConfigured || !firebaseDb || !remoteUser || remoteUser.uid !== progress.userId) return 'local' as const;

  await setDoc(doc(firebaseDb, 'profiles', progress.userId, 'listeningProgress', progressDocumentId(progress.contentId)), {
    ...progress,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return 'firestore' as const;
}

export async function loadListeningProgressCatalog(userId: string): Promise<ListeningProgress[]> {
  const local = readListeningProgressCatalog(userId);
  const remoteUser = firebaseAuth?.currentUser;
  if (!isFirebaseConfigured || !firebaseDb || !remoteUser || remoteUser.uid !== userId) return local;

  const snapshot = await getDocs(collection(firebaseDb, 'profiles', userId, 'listeningProgress'));
  const remote = snapshot.docs
    .map((item) => normalizeProgress(item.data(), userId))
    .filter((item): item is ListeningProgress => Boolean(item));
  const merged = [...remote, ...local]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.contentId === item.contentId) === index)
    .sort((first, second) => Date.parse(second.lastActivityAt) - Date.parse(first.lastActivityAt));
  writeLocalCatalog(userId, merged);
  return merged;
}

export function getLatestListeningProgress(items: ListeningProgress[]) {
  return [...items]
    .filter((item) => item.currentSeconds > 0 && !item.completed)
    .sort((first, second) => Date.parse(second.lastActivityAt) - Date.parse(first.lastActivityAt))[0] ?? null;
}
