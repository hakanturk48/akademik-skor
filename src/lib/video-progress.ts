import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';

import { firebaseAuth, firebaseDb, isFirebaseConfigured } from '@/lib/firebase';

export type VideoProgress = {
  schemaVersion: 1;
  userId: string;
  lessonId: string;
  lessonTitle: string;
  skill: string;
  currentSeconds: number;
  durationSeconds: number;
  progressPercent: number;
  completed: boolean;
  firstStartedAt: string;
  lastWatchedAt: string;
  completedAt: string | null;
  accessMode: 'full' | 'preview';
};

export type VideoProgressSaveResult = {
  destination: 'firestore' | 'local';
};

const localStoragePrefix = 'akademik-skor.video-progress.v1';

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function storageKey(userId: string, lessonId: string) {
  return `${localStoragePrefix}|${userId}|${lessonId}`;
}

function normalizeProgress(value: unknown): VideoProgress | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<VideoProgress>;
  if (item.schemaVersion !== 1 || typeof item.userId !== 'string' || typeof item.lessonId !== 'string') return null;
  if (typeof item.currentSeconds !== 'number' || typeof item.durationSeconds !== 'number' || typeof item.progressPercent !== 'number') return null;
  return item as VideoProgress;
}

function saveProgressLocally(progress: VideoProgress) {
  if (hasBrowserStorage()) window.localStorage.setItem(storageKey(progress.userId, progress.lessonId), JSON.stringify(progress));
}

export function readVideoProgress(userId: string, lessonId: string): VideoProgress | null {
  if (!hasBrowserStorage()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(userId, lessonId));
    return normalizeProgress(raw ? JSON.parse(raw) : null);
  } catch {
    return null;
  }
}

export async function loadVideoProgress(userId: string, lessonId: string): Promise<VideoProgress | null> {
  const local = readVideoProgress(userId, lessonId);
  const remoteUser = firebaseAuth?.currentUser;
  if (!isFirebaseConfigured || !firebaseDb || !remoteUser || remoteUser.uid !== userId) return local;

  const snapshot = await getDoc(doc(firebaseDb, 'profiles', userId, 'videoProgress', lessonId));
  const remote = snapshot.exists() ? normalizeProgress(snapshot.data()) : null;
  if (remote) saveProgressLocally(remote);
  return remote ?? local;
}

export async function loadVideoProgressCatalog(userId: string): Promise<Record<string, VideoProgress>> {
  const remoteUser = firebaseAuth?.currentUser;
  if (!isFirebaseConfigured || !firebaseDb || !remoteUser || remoteUser.uid !== userId) return {};

  const snapshot = await getDocs(collection(firebaseDb, 'profiles', userId, 'videoProgress'));
  const catalog: Record<string, VideoProgress> = {};
  snapshot.forEach((item) => {
    const progress = normalizeProgress(item.data());
    if (!progress) return;
    catalog[progress.lessonId] = progress;
    saveProgressLocally(progress);
  });
  return catalog;
}

export function buildVideoProgress(input: {
  previous?: VideoProgress | null;
  userId: string;
  lessonId: string;
  lessonTitle: string;
  skill: string;
  currentSeconds: number;
  durationSeconds: number;
  completed?: boolean;
  accessMode: 'full' | 'preview';
}): VideoProgress {
  const now = new Date().toISOString();
  const durationSeconds = Math.max(1, Math.round(input.durationSeconds));
  const currentSeconds = Math.min(durationSeconds, Math.max(0, Math.round(input.currentSeconds)));
  const progressPercent = Math.min(100, Math.max(0, Math.round(currentSeconds / durationSeconds * 100)));
  const completed = Boolean(input.completed) || progressPercent >= 95;
  return {
    schemaVersion: 1,
    userId: input.userId,
    lessonId: input.lessonId,
    lessonTitle: input.lessonTitle,
    skill: input.skill,
    currentSeconds: completed ? durationSeconds : currentSeconds,
    durationSeconds,
    progressPercent: completed ? 100 : progressPercent,
    completed,
    firstStartedAt: input.previous?.firstStartedAt ?? now,
    lastWatchedAt: now,
    completedAt: completed ? input.previous?.completedAt ?? now : null,
    accessMode: input.accessMode,
  };
}

export async function saveVideoProgress(progress: VideoProgress): Promise<VideoProgressSaveResult> {
  saveProgressLocally(progress);

  const remoteUser = firebaseAuth?.currentUser;
  if (!isFirebaseConfigured || !firebaseDb || !remoteUser || remoteUser.uid !== progress.userId) {
    return { destination: 'local' };
  }

  await setDoc(doc(firebaseDb, 'profiles', progress.userId, 'videoProgress', progress.lessonId), {
    ...progress,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return { destination: 'firestore' };
}
