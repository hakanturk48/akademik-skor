import { collection, doc, getDocs, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { firebaseAuth, firebaseDb, isFirebaseConfigured } from '@/lib/firebase';

export type SpeakingAttemptStatus = 'submitted' | 'processing' | 'scored' | 'failed';

export type SpeakingAttemptRecord = {
  id: string;
  schemaVersion: 1;
  userId: string;
  taskId: string;
  taskTitle: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  status: SpeakingAttemptStatus;
  audioUrl?: string;
  audioStoragePath?: string;
  audioMimeType?: string;
  audioSizeBytes?: number;
  score?: number;
  fluencyScore?: number;
  languageScore?: number;
  topicScore?: number;
  pronunciationScore?: number;
  transcript?: string;
  feedback?: string;
};

export type SpeakingAttemptSaveResult = { destination: 'firestore' | 'local' };

const localStoragePrefix = 'akademik-skor.speaking-attempts.v1';

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function localStorageKey(userId: string) {
  return `${localStoragePrefix}|${userId}`;
}

export function makeSpeakingAttemptId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `speaking-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function saveAttemptsLocally(userId: string, attempts: SpeakingAttemptRecord[]) {
  if (!hasBrowserStorage()) return;
  try {
    window.localStorage.setItem(localStorageKey(userId), JSON.stringify(attempts.slice(0, 100)));
  } catch {
    // Local caching should not block a remote save.
  }
}

function mergeSpeakingAttempts(userId: string, remote: SpeakingAttemptRecord[], local = readSpeakingAttempts(userId)) {
  const merged = [...remote, ...local]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((first, second) => Date.parse(second.completedAt) - Date.parse(first.completedAt))
    .slice(0, 100);
  saveAttemptsLocally(userId, merged);
  return merged;
}

export function readSpeakingAttempts(userId: string): SpeakingAttemptRecord[] {
  if (!hasBrowserStorage()) return [];
  try {
    const raw = window.localStorage.getItem(localStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) as SpeakingAttemptRecord[] : [];
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.schemaVersion === 1 && item.userId === userId && typeof item.id === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function loadSpeakingAttempts(userId: string): Promise<SpeakingAttemptRecord[]> {
  const local = readSpeakingAttempts(userId);
  const remoteUser = firebaseAuth?.currentUser;
  if (!isFirebaseConfigured || !firebaseDb || !remoteUser || remoteUser.uid !== userId) return local;

  const snapshot = await getDocs(collection(firebaseDb, 'profiles', userId, 'speakingAttempts'));
  const remote = snapshot.docs
    .map((item) => item.data() as SpeakingAttemptRecord)
    .filter((item) => item?.schemaVersion === 1 && item.userId === userId && typeof item.id === 'string');
  return mergeSpeakingAttempts(userId, remote, local);
}

export function subscribeSpeakingAttempts(
  userId: string,
  onChange: (attempts: SpeakingAttemptRecord[]) => void,
  onError?: (error: Error) => void,
) {
  const remoteUser = firebaseAuth?.currentUser;
  if (!isFirebaseConfigured || !firebaseDb || !remoteUser || remoteUser.uid !== userId) return null;

  return onSnapshot(collection(firebaseDb, 'profiles', userId, 'speakingAttempts'), (snapshot) => {
    const remote = snapshot.docs
      .map((item) => item.data() as SpeakingAttemptRecord)
      .filter((item) => item?.schemaVersion === 1 && item.userId === userId && typeof item.id === 'string');
    onChange(mergeSpeakingAttempts(userId, remote));
  }, (error) => onError?.(error));
}

export function createSpeakingAttempt(input: Omit<SpeakingAttemptRecord, 'id' | 'schemaVersion'> & { id?: string }): SpeakingAttemptRecord {
  const { id = makeSpeakingAttemptId(), ...rest } = input;
  return { ...rest, id, schemaVersion: 1 };
}

export async function saveSpeakingAttempt(attempt: SpeakingAttemptRecord): Promise<SpeakingAttemptSaveResult> {
  const current = readSpeakingAttempts(attempt.userId);
  saveAttemptsLocally(attempt.userId, [attempt, ...current.filter((item) => item.id !== attempt.id)]);

  const remoteUser = firebaseAuth?.currentUser;
  if (!isFirebaseConfigured || !firebaseDb || !remoteUser || remoteUser.uid !== attempt.userId) return { destination: 'local' };

  const attemptRef = doc(collection(firebaseDb, 'profiles', attempt.userId, 'speakingAttempts'), attempt.id);
  await setDoc(attemptRef, {
    ...attempt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { destination: 'firestore' };
}
