import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';

import { firebaseAuth, firebaseDb, isFirebaseConfigured } from '@/lib/firebase';

export type ListeningAttemptStatus = 'completed' | 'timed-out';

export type ListeningAttemptResponse = {
  questionIndex: number;
  selectedOptionKey: string | null;
  correctOptionKey: string | null;
  isCorrect: boolean | null;
  answeredAtSeconds: number | null;
};

export type ListeningAttempt = {
  id: string;
  schemaVersion: 1;
  userId: string;
  contentId: string;
  contentTitle: string;
  topicId: string | null;
  taskTypeId: string;
  subskillId: string;
  difficultyId: string;
  lengthId: string;
  sessionMode: string;
  startedAt: string;
  completedAt: string;
  status: ListeningAttemptStatus;
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracyPercent: number;
  timeLimitSeconds: number;
  timeSpentSeconds: number;
  responses: ListeningAttemptResponse[];
};

export type ListeningAttemptSaveResult = {
  destination: 'firestore' | 'local';
};

const localStoragePrefix = 'akademik-skor.listening-attempts.v1';

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function makeAttemptId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `listening-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function localStorageKey(userId: string) {
  return `${localStoragePrefix}|${userId}`;
}

function saveAttemptsLocally(userId: string, attempts: ListeningAttempt[]) {
  if (!hasBrowserStorage()) return;
  const key = localStorageKey(userId);
  try {
    window.localStorage.setItem(key, JSON.stringify(attempts.slice(0, 100)));
  } catch {
    // Local cache is optional when storage is unavailable or full.
  }
}

export function readListeningAttempts(userId: string): ListeningAttempt[] {
  if (!hasBrowserStorage()) return [];
  try {
    const raw = window.localStorage.getItem(localStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) as ListeningAttempt[] : [];
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.schemaVersion === 1 && item.userId === userId && typeof item.id === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function loadListeningAttempts(userId: string): Promise<ListeningAttempt[]> {
  const local = readListeningAttempts(userId);
  const remoteUser = firebaseAuth?.currentUser;
  if (!isFirebaseConfigured || !firebaseDb || !remoteUser || remoteUser.uid !== userId) return local;

  const snapshot = await getDocs(collection(firebaseDb, 'profiles', userId, 'listeningAttempts'));
  const remote = snapshot.docs
    .map((item) => item.data() as ListeningAttempt)
    .filter((item) => item?.schemaVersion === 1 && item.userId === userId && typeof item.id === 'string');
  const merged = [...remote, ...local]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((first, second) => Date.parse(second.completedAt) - Date.parse(first.completedAt))
    .slice(0, 100);
  saveAttemptsLocally(userId, merged);
  return merged;
}

export function createListeningAttempt(input: Omit<ListeningAttempt, 'id' | 'schemaVersion'>): ListeningAttempt {
  return { ...input, id: makeAttemptId(), schemaVersion: 1 };
}

export async function saveListeningAttempt(attempt: ListeningAttempt): Promise<ListeningAttemptSaveResult> {
  const current = readListeningAttempts(attempt.userId);
  saveAttemptsLocally(attempt.userId, [attempt, ...current.filter((item) => item.id !== attempt.id)]);

  const remoteUser = firebaseAuth?.currentUser;
  if (!isFirebaseConfigured || !firebaseDb || !remoteUser || remoteUser.uid !== attempt.userId) {
    return { destination: 'local' };
  }

  const attemptRef = doc(collection(firebaseDb, 'profiles', attempt.userId, 'listeningAttempts'), attempt.id);
  await setDoc(attemptRef, {
    ...attempt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { destination: 'firestore' };
}
