import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { firebaseAuth, firebaseDb, isFirebaseConfigured } from '@/lib/firebase';

export type ReadingAttemptStatus = 'completed' | 'timed-out';

export type ReadingAttemptResponse = {
  questionIndex: number;
  selectedOptionKey: string | null;
  correctOptionKey: string | null;
  isCorrect: boolean | null;
  marked: boolean;
};

export type ReadingAttempt = {
  id: string;
  schemaVersion: 1;
  userId: string;
  contentId: string;
  contentTitle: string;
  passageTitle: string;
  questionType: string;
  startedAt: string;
  completedAt: string;
  status: ReadingAttemptStatus;
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  markedCount: number;
  accuracyPercent: number;
  timeLimitSeconds: number;
  timeSpentSeconds: number;
  responses: ReadingAttemptResponse[];
};

export type ReadingAttemptSaveResult = {
  destination: 'firestore' | 'local';
};

const localStoragePrefix = 'akademik-skor.reading-attempts.v1';

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function makeAttemptId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `reading-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function saveAttemptLocally(attempt: ReadingAttempt) {
  if (!hasBrowserStorage()) return;
  const key = `${localStoragePrefix}|${attempt.userId}`;
  try {
    const raw = window.localStorage.getItem(key);
    const current = raw ? JSON.parse(raw) as ReadingAttempt[] : [];
    const next = [attempt, ...current.filter((item) => item.id !== attempt.id)].slice(0, 100);
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    window.localStorage.setItem(key, JSON.stringify([attempt]));
  }
}

export function createReadingAttempt(input: Omit<ReadingAttempt, 'id' | 'schemaVersion'>): ReadingAttempt {
  return { ...input, id: makeAttemptId(), schemaVersion: 1 };
}

export async function saveReadingAttempt(attempt: ReadingAttempt): Promise<ReadingAttemptSaveResult> {
  saveAttemptLocally(attempt);

  const remoteUser = firebaseAuth?.currentUser;
  if (!isFirebaseConfigured || !firebaseDb || !remoteUser || remoteUser.uid !== attempt.userId) {
    return { destination: 'local' };
  }

  const attemptRef = doc(collection(firebaseDb, 'profiles', attempt.userId, 'readingAttempts'), attempt.id);
  await setDoc(attemptRef, {
    ...attempt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { destination: 'firestore' };
}
