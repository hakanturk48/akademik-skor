import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';

import { firebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import type { AdminActor, AdminWorkspaceState } from './types';
import { getPublishedWorkspace, migrateAdminWorkspace } from './workflow';

const adminWorkspaceCollection = 'adminWorkspaces';
const publishedContentCollection = 'publishedContentSnapshots';
const remoteWorkspaceKey = 'main';

export const remoteWorkspaceSetupMessage = 'Firebase Firestore henüz hazır değil veya güvenlik kuralları bu işlemi engelliyor. Firebase Console içinde Firestore/Rules ayarlarını kontrol edin.';

type RemoteWorkspaceRow = {
  state?: unknown;
  revision?: number | null;
};

export function isRemoteAdminWorkspaceEnabled() {
  return isFirebaseConfigured && Boolean(firebaseDb);
}

export function isRemoteWorkspaceSetupError(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  const message = error instanceof Error ? error.message : String(error ?? '');
  return code === 'permission-denied' || code === 'failed-precondition' || code === 'unavailable' || message === remoteWorkspaceSetupMessage || /firestore.*not.*enabled|permission/i.test(message);
}

function actorId(actor?: AdminActor) {
  return actor?.id ?? null;
}

function normalizeWorkspaceState(value: unknown, migrate: boolean): AdminWorkspaceState | null {
  if (!value || typeof value !== 'object') return null;
  const state = value as AdminWorkspaceState;
  if (!state.catalog || !Array.isArray(state.navigation?.groups) || !Array.isArray(state.navigation?.items)) return null;
  return migrate ? migrateAdminWorkspace(state) : state;
}

function friendlyRemoteError(error: unknown, fallback: string) {
  if (isRemoteWorkspaceSetupError(error)) return new Error(remoteWorkspaceSetupMessage);
  const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
  return new Error(message || fallback);
}

function workspaceRef(collectionName: string) {
  if (!firebaseDb) throw new Error('Firebase Firestore yapılandırılmadı.');
  return doc(firebaseDb, collectionName, remoteWorkspaceKey);
}

async function readRemoteWorkspace(collectionName: string, migrate: boolean) {
  if (!firebaseDb) return null;
  try {
    const snapshot = await getDoc(workspaceRef(collectionName));
    if (!snapshot.exists()) return null;

    const row = snapshot.data() as RemoteWorkspaceRow;
    const state = normalizeWorkspaceState(row.state, migrate);
    if (!state) throw new Error('Merkezi içerik verisi okunamadı. Kayıt biçimi geçersiz.');
    return state;
  } catch (error) {
    throw friendlyRemoteError(error, 'Firebase içerik verisi okunamadı.');
  }
}

async function upsertWorkspace(collectionName: string, state: AdminWorkspaceState, revision: number, actor?: AdminActor) {
  if (!firebaseDb) throw new Error('Firebase içerik altyapısı yapılandırılmadı.');
  try {
    await setDoc(workspaceRef(collectionName), {
      state,
      revision,
      updatedBy: actorId(actor),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    throw friendlyRemoteError(error, 'Firebase içerik verisi kaydedilemedi.');
  }
}

export async function loadRemoteAdminWorkspaceState() {
  return readRemoteWorkspace(adminWorkspaceCollection, true);
}

export async function loadRemotePublishedWorkspaceState() {
  return readRemoteWorkspace(publishedContentCollection, false);
}

export async function saveRemotePublishedWorkspaceState(state: AdminWorkspaceState, revision: number, actor?: AdminActor) {
  await upsertWorkspace(publishedContentCollection, state, revision, actor);
}

export async function saveRemoteAdminWorkspaceState(state: AdminWorkspaceState, expectedRevision: number | null, actor?: AdminActor) {
  if (!firebaseDb) throw new Error('Firebase içerik altyapısı yapılandırılmadı.');

  const revision = state.workflow?.revision ?? 0;
  const publishedState = getPublishedWorkspace(state);

  if (expectedRevision === null) {
    await upsertWorkspace(adminWorkspaceCollection, state, revision, actor);
    await saveRemotePublishedWorkspaceState(publishedState, revision, actor);
    return;
  }

  try {
    await runTransaction(firebaseDb, async (transaction) => {
      const adminRef = workspaceRef(adminWorkspaceCollection);
      const publishedRef = workspaceRef(publishedContentCollection);
      const current = await transaction.get(adminRef);
      const currentRevision = current.exists() ? Number((current.data() as RemoteWorkspaceRow).revision ?? 0) : null;

      if (currentRevision !== null && currentRevision !== expectedRevision) {
        throw new Error('Başka bir admin içerik kaydetti. Devam etmeden önce paneli yeniden yükleyin.');
      }

      const metadata = { revision, updatedBy: actorId(actor), updatedAt: serverTimestamp() };
      transaction.set(adminRef, { ...metadata, state }, { merge: true });
      transaction.set(publishedRef, { ...metadata, state: publishedState }, { merge: true });
    });
  } catch (error) {
    throw friendlyRemoteError(error, 'Firebase içerik verisi kaydedilemedi.');
  }
}
