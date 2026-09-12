import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AdminActor, AdminWorkspaceState } from './types';
import { getPublishedWorkspace, migrateAdminWorkspace } from './workflow';

const adminWorkspaceTable = 'admin_workspaces';
const publishedContentTable = 'published_content_snapshots';
const remoteWorkspaceKey = 'main';

type RemoteWorkspaceRow = {
  state: unknown;
  revision: number | null;
};

export function isRemoteAdminWorkspaceEnabled() {
  return isSupabaseConfigured && Boolean(supabase);
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function actorId(actor?: AdminActor) {
  return isUuid(actor?.id) ? actor!.id : null;
}

function normalizeWorkspaceState(value: unknown, migrate: boolean): AdminWorkspaceState | null {
  if (!value || typeof value !== 'object') return null;
  const state = value as AdminWorkspaceState;
  if (!state.catalog || !Array.isArray(state.navigation?.groups) || !Array.isArray(state.navigation?.items)) return null;
  return migrate ? migrateAdminWorkspace(state) : state;
}

function friendlyRemoteError(error: unknown, fallback: string) {
  const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
  if (/relation .*does not exist|admin_workspaces|published_content_snapshots/i.test(message)) {
    return new Error('Merkezi içerik tabloları bulunamadı. Supabase SQL Editor içinde güncel supabase/schema.sql dosyasını çalıştırın.');
  }
  if (/row-level security|permission denied|not authorized|JWT/i.test(message)) {
    return new Error('Merkezi içerik kaydı için Supabase admin oturumu/yetkisi gerekli. Admin hesabının profiles.role değeri admin olmalı.');
  }
  return new Error(message || fallback);
}

async function readRemoteWorkspace(table: string, migrate: boolean) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(table)
    .select('state,revision')
    .eq('key', remoteWorkspaceKey)
    .maybeSingle();

  if (error) throw friendlyRemoteError(error, 'Merkezi içerik verisi okunamadı.');
  if (!data) return null;

  const row = data as RemoteWorkspaceRow;
  const state = normalizeWorkspaceState(row.state, migrate);
  if (!state) throw new Error('Merkezi içerik verisi okunamadı. Kayıt biçimi geçersiz.');
  return state;
}

async function readRemoteRevision(table: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(table)
    .select('revision')
    .eq('key', remoteWorkspaceKey)
    .maybeSingle();

  if (error) throw friendlyRemoteError(error, 'Merkezi içerik sürümü okunamadı.');
  return typeof data?.revision === 'number' ? data.revision : null;
}

async function upsertWorkspace(table: string, state: AdminWorkspaceState, revision: number, actor?: AdminActor) {
  if (!supabase) throw new Error('Merkezi içerik altyapısı yapılandırılmadı.');
  const { error } = await supabase
    .from(table)
    .upsert({ key: remoteWorkspaceKey, state, revision, updated_by: actorId(actor) }, { onConflict: 'key' });

  if (error) throw friendlyRemoteError(error, 'Merkezi içerik verisi kaydedilemedi.');
}

export async function loadRemoteAdminWorkspaceState() {
  return readRemoteWorkspace(adminWorkspaceTable, true);
}

export async function loadRemotePublishedWorkspaceState() {
  return readRemoteWorkspace(publishedContentTable, false);
}

export async function saveRemotePublishedWorkspaceState(state: AdminWorkspaceState, revision: number, actor?: AdminActor) {
  await upsertWorkspace(publishedContentTable, state, revision, actor);
}

export async function saveRemoteAdminWorkspaceState(state: AdminWorkspaceState, expectedRevision: number | null, actor?: AdminActor) {
  if (!supabase) throw new Error('Merkezi içerik altyapısı yapılandırılmadı.');

  const revision = state.workflow?.revision ?? 0;
  if (expectedRevision === null) {
    await upsertWorkspace(adminWorkspaceTable, state, revision, actor);
    await saveRemotePublishedWorkspaceState(getPublishedWorkspace(state), revision, actor);
    return;
  }

  const { data, error } = await supabase
    .from(adminWorkspaceTable)
    .update({ state, revision, updated_by: actorId(actor) })
    .eq('key', remoteWorkspaceKey)
    .eq('revision', expectedRevision)
    .select('revision')
    .maybeSingle();

  if (error) throw friendlyRemoteError(error, 'Merkezi içerik verisi kaydedilemedi.');

  if (!data) {
    const currentRevision = await readRemoteRevision(adminWorkspaceTable);
    if (currentRevision !== null && currentRevision !== expectedRevision) {
      throw new Error('Başka bir admin içerik kaydetti. Devam etmeden önce paneli yeniden yükleyin.');
    }
    await upsertWorkspace(adminWorkspaceTable, state, revision, actor);
  }

  await saveRemotePublishedWorkspaceState(getPublishedWorkspace(state), revision, actor);
}
