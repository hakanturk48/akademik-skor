import { loadRemotePublishedWorkspaceState } from "@/lib/admin/remote-workspace";
import type { AdminWorkspaceState } from "@/lib/admin/types";
import { contentCatalogSeed, type ContentCatalog, type ListeningHubItem } from "@/lib/content";
import { isFirebaseConfigured } from "@/lib/firebase";
import { createListeningPracticeHref, makeListeningSelection } from "./service";
import type { ListeningDifficultyId, ListeningLengthId, ListeningSessionMode, ListeningSubskillId, ListeningTaskTypeId } from "./types";

const publishedWorkspaceStorageKey = "akademik-skor.published-workspace.v1";
const localAdminWorkspaceStorageKey = "akademik-skor.admin-workspace.v2";

const taskTypeIds: ListeningTaskTypeId[] = ["choose-response", "conversation", "announcement", "academic-talk"];
const subskillIds: ListeningSubskillId[] = ["main-idea", "purpose", "detail", "inference", "attitude", "function", "note-taking"];
const difficultyIds: ListeningDifficultyId[] = ["adaptive", "easy", "medium", "hard"];
const lengthIds: ListeningLengthId[] = ["quick", "standard", "extended"];
const sessionModes: ListeningSessionMode[] = ["practice", "exam"];
const toeflListeningSectionSeconds = 29 * 60;
const toeflListeningSectionItems = 47;

function listeningQuestionPracticeMinutes(questionCount: number) {
  return Math.max(1, Math.ceil(Math.max(1, questionCount) * toeflListeningSectionSeconds / toeflListeningSectionItems / 60));
}

export type ListeningHubDisplayItem = ListeningHubItem & {
  href: string;
  selection: ReturnType<typeof makeListeningSelection>;
  topicTitle: string;
  taskTypeTitle: string;
  subskillTitle: string;
  meta: string;
};

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredWorkspace(key: string): AdminWorkspaceState | null {
  if (!hasBrowserStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminWorkspaceState;
    return parsed?.catalog ? parsed : null;
  } catch {
    return null;
  }
}

function cachePublishedWorkspace(state: AdminWorkspaceState) {
  if (!hasBrowserStorage()) return;
  try {
    window.localStorage.setItem(publishedWorkspaceStorageKey, JSON.stringify(state));
  } catch {
    // Cache is optional.
  }
}

export async function syncPublishedListeningHubItems() {
  const remote = await loadRemotePublishedWorkspaceState();
  if (!remote) return false;
  cachePublishedWorkspace(remote);
  return true;
}

function readPublishedListeningHubItems(state: AdminWorkspaceState | null): ListeningHubItem[] {
  if (!state) return [];
  const stored = state as AdminWorkspaceState & {
    catalog?: { listeningHubItems?: ListeningHubItem[] };
    workflow?: { documents?: Record<string, { collection: string; published?: ListeningHubItem | null }> };
  };

  if (stored.workflow?.documents) {
    return Object.values(stored.workflow.documents)
      .map((document) => document.collection === "listeningHubItems" ? document.published : null)
      .filter((item): item is ListeningHubItem => Boolean(item?.status === "active"));
  }

  return (stored.catalog?.listeningHubItems ?? []).filter((item) => item.status === "active");
}

function optionOrFallback<TValue extends string>(value: string | undefined, options: TValue[], fallback: TValue): TValue {
  return value && options.includes(value as TValue) ? value as TValue : fallback;
}

function describeListeningHubItem(catalog: ContentCatalog, item: ListeningHubItem): ListeningHubDisplayItem {
  const topic = catalog.topics.find((entry) => entry.id === item.topicId);
  const taskType = catalog.taskTypes.find((entry) => entry.id === item.taskTypeId);
  const subskill = catalog.subskills.find((entry) => entry.id === item.subskillId);
  const selection = makeListeningSelection({
    taskTypeId: optionOrFallback(taskType?.slug, taskTypeIds, "academic-talk"),
    subskillId: optionOrFallback(subskill?.slug, subskillIds, "detail"),
    difficultyId: optionOrFallback(item.difficultyId, difficultyIds, "adaptive"),
    lengthId: optionOrFallback(item.lengthId, lengthIds, "standard"),
    sessionMode: optionOrFallback(item.sessionMode, sessionModes, "practice"),
  });
  const topicTitle = topic?.title ?? "General Topic";
  const taskTypeTitle = taskType?.title ?? "Academic Talk";
  const subskillTitle = subskill?.title ?? "Detail";
  const questionCount = item.questions?.length || item.questionCount;
  const practiceMinutes = listeningQuestionPracticeMinutes(questionCount);

  const href = createListeningPracticeHref(selection) + "&hub=" + encodeURIComponent(item.id);

  return {
    ...item,
    href,
    selection,
    topicTitle,
    taskTypeTitle,
    subskillTitle,
    questionCount,
    meta: [topicTitle, taskTypeTitle, subskillTitle, String(questionCount) + " questions", String(practiceMinutes) + " min practice"].join(" - "),
  };
}

export function getListeningHubItems(): ListeningHubDisplayItem[] {
  const storedState = readStoredWorkspace(publishedWorkspaceStorageKey) ?? (!isFirebaseConfigured ? readStoredWorkspace(localAdminWorkspaceStorageKey) : null);
  const storedItems = readPublishedListeningHubItems(storedState);
  const catalog = storedState?.catalog ?? contentCatalogSeed;
  const seedItems = (contentCatalogSeed.listeningHubItems ?? []).filter((item) => item.status === "active");
  const items = storedItems.length ? storedItems : isFirebaseConfigured ? [] : seedItems;

  return [...items]
    .sort((first, second) => first.sortOrder - second.sortOrder || Date.parse(second.updatedAt) - Date.parse(first.updatedAt) || first.title.localeCompare(second.title))
    .map((item) => describeListeningHubItem(catalog, item));
}

export function getListeningHubItemById(id?: string | null): ListeningHubDisplayItem | null {
  const value = id?.trim();
  if (!value) return null;
  return getListeningHubItems().find((item) => item.id === value || item.slug === value) ?? null;
}
