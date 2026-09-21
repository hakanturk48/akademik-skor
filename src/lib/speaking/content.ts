import { loadRemotePublishedWorkspaceState } from '@/lib/admin/remote-workspace';
import type { AdminWorkspaceState } from '@/lib/admin/types';
import { contentCatalogSeed } from '@/lib/content/seed';
import type { SpeakingTask } from '@/lib/content';
import { isFirebaseConfigured } from '@/lib/firebase';

const publishedWorkspaceStorageKey = 'akademik-skor.published-workspace.v1';
const localAdminWorkspaceStorageKey = 'akademik-skor.admin-workspace.v2';

export const speakingFallbackTask = contentCatalogSeed.speakingTasks[0] as SpeakingTask;

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredWorkspace(key: string): AdminWorkspaceState | null {
  if (!hasBrowserStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminWorkspaceState;
    if (!parsed.catalog || !Array.isArray(parsed.navigation?.groups) || !Array.isArray(parsed.navigation?.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function cachePublishedWorkspace(state: AdminWorkspaceState) {
  if (!hasBrowserStorage()) return;
  try {
    window.localStorage.setItem(publishedWorkspaceStorageKey, JSON.stringify(state));
  } catch {
    // The cache is optional; the bundled fallback remains usable.
  }
}

export async function syncPublishedSpeakingTasks() {
  const remote = await loadRemotePublishedWorkspaceState();
  if (!remote) return false;
  cachePublishedWorkspace(remote);
  return true;
}

function readPublishedSpeakingTasks(): SpeakingTask[] {
  const storedState = readStoredWorkspace(publishedWorkspaceStorageKey) ?? (!isFirebaseConfigured ? readStoredWorkspace(localAdminWorkspaceStorageKey) : null);
  if (!storedState) return [];
  const stored = storedState as {
    catalog?: { speakingTasks?: SpeakingTask[] };
    workflow?: { documents?: Record<string, { collection: string; published?: SpeakingTask | null }> };
  };
  const catalogTasks = stored.catalog?.speakingTasks ?? [];
  const published = stored.workflow?.documents
    ? Object.values(stored.workflow.documents)
      .map((document) => (document.collection === 'speakingTasks' ? document.published : null))
      .filter((task): task is SpeakingTask => Boolean(task?.status === 'active'))
    : catalogTasks.filter((task) => task.status === 'active');

  return published.sort((first, second) => first.sortOrder - second.sortOrder || first.title.localeCompare(second.title));
}

export function getSpeakingTasks() {
  const tasks = readPublishedSpeakingTasks();
  return tasks.length ? tasks : [speakingFallbackTask];
}

export function getSpeakingTask(slug?: string) {
  const tasks = getSpeakingTasks();
  return tasks.find((task) => task.slug === slug || task.id === slug) ?? tasks[0] ?? speakingFallbackTask;
}

export function formatSpeakingTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
