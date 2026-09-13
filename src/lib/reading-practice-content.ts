import { loadRemotePublishedWorkspaceState } from '@/lib/admin/remote-workspace';
import type { AdminWorkspaceState } from '@/lib/admin/types';
import { contentCatalogSeed } from '@/lib/content/seed';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { ReadingPracticeScreen } from '@/lib/content';

const publishedWorkspaceStorageKey = 'akademik-skor.published-workspace.v1';
const localAdminWorkspaceStorageKey = 'akademik-skor.admin-workspace.v2';

export const readingPracticeFallbackScreen: ReadingPracticeScreen = contentCatalogSeed.readingPracticeScreens[0] as ReadingPracticeScreen;

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
    // Cache failures should not block the screen; seed content remains available.
  }
}

export async function syncPublishedReadingPracticeScreens() {
  const remote = await loadRemotePublishedWorkspaceState();
  if (!remote) return false;
  cachePublishedWorkspace(remote);
  return true;
}

function readPublishedReadingPracticeScreens(): ReadingPracticeScreen[] {
  try {
    const storedState = readStoredWorkspace(publishedWorkspaceStorageKey) ?? (!isFirebaseConfigured ? readStoredWorkspace(localAdminWorkspaceStorageKey) : null);
    if (!storedState) return [];
    const stored = storedState as {
      catalog?: { readingPracticeScreens?: ReadingPracticeScreen[] };
      workflow?: { documents?: Record<string, { collection: string; published?: ReadingPracticeScreen | null }> };
    };
    const catalogScreens = stored.catalog?.readingPracticeScreens ?? [];
    const published = stored.workflow?.documents
      ? Object.values(stored.workflow.documents)
        .map((document) => (document.collection === 'readingPracticeScreens' ? document.published : null))
        .filter((screen): screen is ReadingPracticeScreen => Boolean(screen?.status === 'active'))
      : catalogScreens.filter((screen) => screen.status === 'active');

    return published.sort((first, second) => first.sortOrder - second.sortOrder || Date.parse(second.updatedAt) - Date.parse(first.updatedAt) || first.title.localeCompare(second.title));
  } catch {
    return [];
  }
}

export function getReadingPracticeScreens() {
  const screens = readPublishedReadingPracticeScreens();
  return screens.length ? screens : [readingPracticeFallbackScreen];
}

export function getReadingPracticeScreen(slug = 'reading-practice') {
  const screens = getReadingPracticeScreens();
  return screens.find((screen) => screen.slug === slug) ?? screens[0] ?? readingPracticeFallbackScreen;
}

export function countReadingPracticeWords(paragraphs: string[]) {
  return paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

export function formatReadingPracticeTimer(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const two = (value: number) => value.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${minutes}:${two(seconds)}`;
}
