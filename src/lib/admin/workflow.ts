import { validateContentCatalog } from '@/lib/content';
import { getNavigationRouteEntry } from '@/lib/navigation/registry';
import { validateVideoMediaUrl } from '@/lib/video-media';
import type { BaseEntity, ContentCatalog, Question, TaxonomyRef } from '@/lib/content';
import type {
  AdminActor, AdminDocument, AdminMutableCollectionKey, AdminRevision, AdminSnapshot,
  AdminWorkspaceState, PublicationStatus, VersionDiff,
} from './types';

export const publicationStatuses: PublicationStatus[] = ['draft', 'review', 'published', 'archived'];
export const workflowCollections: AdminMutableCollectionKey[] = [
  'navigationGroups', 'navigationItems', 'exams', 'examVersions', 'skills', 'taskTypes',
  'subskills', 'topics', 'levels', 'courses', 'modules', 'lessons', 'vocabularySets',
  'vocabularyWords', 'grammarCategories', 'grammarTopics', 'grammarLessons', 'questions', 'practiceSets', 'tests',
];
export const workspaceStorageKey = 'akademik-skor.admin-workspace.v2';
export const legacyWorkspaceStorageKey = 'akademik-skor.admin-workspace.v1';
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const documentKey = (collection: AdminMutableCollectionKey, id: string) => `${collection}:${id}`;

export function workspaceItems(state: AdminWorkspaceState, collection: AdminMutableCollectionKey): AdminSnapshot[] {
  if (collection === 'navigationGroups') return state.navigation.groups;
  if (collection === 'navigationItems') return state.navigation.items;
  return state.catalog[collection];
}

function replaceItem(state: AdminWorkspaceState, collection: AdminMutableCollectionKey, snapshot: AdminSnapshot) {
  if (collection === 'questions' && snapshot.questionOptions) {
    state.catalog.questionOptions = [...state.catalog.questionOptions.filter((option) => option.questionId !== snapshot.id), ...copy(snapshot.questionOptions)];
  }
  const items = workspaceItems(state, collection);
  const index = items.findIndex((item) => item.id === snapshot.id);
  if (index < 0) items.push(copy(snapshot));
  else items[index] = copy(snapshot);
}

function legacyStatus(item: AdminSnapshot): PublicationStatus {
  if ('isEnabled' in item) return item.isEnabled ? 'published' : 'archived';
  return item.status === 'active' ? 'published' : item.status === 'draft' ? 'draft' : 'archived';
}

// Imported records have no reliable actor; do not invent publication attribution.
export function migrateAdminWorkspace(state: AdminWorkspaceState): AdminWorkspaceState & { workflow: NonNullable<AdminWorkspaceState['workflow']> } {
  const next = copy(state);
  if (next.workflow) {
    if (next.workflow.schemaVersion !== 2 || !next.workflow.documents || !Array.isArray(next.workflow.audit)) {
      throw new Error('Unsupported admin workspace. Existing data has not been overwritten.');
    }
    // Freeze the existing live options before the first option-aware edit. Do not invent historical option versions.
    for (const document of Object.values(next.workflow.documents)) {
      if (document.collection === 'questions' && document.published && !document.published.questionOptions) {
        document.published.questionOptions = copy(next.catalog.questionOptions.filter((option) => option.questionId === document.entityId));
      }
    }
    return next as AdminWorkspaceState & { workflow: NonNullable<AdminWorkspaceState['workflow']> };
  }
  const workflow: NonNullable<AdminWorkspaceState['workflow']> = { schemaVersion: 2, revision: 0, documents: {}, audit: [] };
  for (const collection of workflowCollections) {
    for (const item of workspaceItems(next, collection)) {
      const status = legacyStatus(item);
      const snapshot: AdminSnapshot = { ...copy(item), version: 1, createdBy: null, updatedBy: null, publishedBy: null, publishedAt: null };
      if (collection === 'questions') snapshot.questionOptions = copy(next.catalog.questionOptions.filter((option) => option.questionId === item.id));
      workflow.documents[documentKey(collection, item.id)] = {
        collection, entityId: item.id, version: 1, status,
        published: status === 'published' ? copy(snapshot) : null,
        revisions: [{ version: 1, status, snapshot, actor: null, timestamp: item.updatedAt, action: 'migrated', diff: [] }],
      };
    }
  }
  return { ...next, workflow };
}

export function getAdminDocument(state: AdminWorkspaceState, collection: AdminMutableCollectionKey, id: string): AdminDocument | undefined {
  return state.workflow?.documents[documentKey(collection, id)];
}

const metadata = new Set(['createdBy', 'updatedBy', 'publishedBy', 'publishedAt', 'updatedAt', 'version']);
export function diffSnapshots(before: AdminSnapshot | undefined, after: AdminSnapshot): VersionDiff[] {
  const result: VersionDiff[] = [];
  const walk = (a: unknown, b: unknown, path: string) => {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (!path && metadata.has(key)) continue;
        walk((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], path ? `${path}.${key}` : key);
      }
    } else result.push({ path, before: a ?? null, after: b ?? null });
  };
  walk(before ?? {}, after, '');
  return result;
}

export function getPublishedWorkspace(state: AdminWorkspaceState): AdminWorkspaceState {
  const next = copy(state);
  const documents = Object.values(migrateAdminWorkspace(state).workflow.documents);
  for (const collection of workflowCollections) {
    const items = workspaceItems(next, collection);
    items.splice(0, items.length, ...documents.filter((doc) => doc.collection === collection && doc.published).map((doc) => copy(doc.published!)));
  }
  next.catalog.questionOptions = documents.filter((doc) => doc.collection === 'questions' && doc.published).flatMap((doc) => copy(doc.published!.questionOptions ?? []));
  delete next.workflow;
  next.changes = [];
  return next;
}

function references(value: unknown, id: string): boolean {
  if (Array.isArray(value)) return value.some((item) => references(item, id));
  if (value && typeof value === 'object') return Object.entries(value).some(([key, item]) => key !== 'id' && references(item, id));
  return value === id;
}

export function validatePublication(state: AdminWorkspaceState, collection: AdminMutableCollectionKey, candidate: AdminSnapshot): string[] {
  const issues: string[] = [];
  if (candidate.title.trim().length < 2) issues.push('Title must contain at least two characters.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate.slug)) issues.push('A valid unique slug is required.');
  if (!Number.isFinite(candidate.sortOrder) || candidate.sortOrder < 0) issues.push('Sort order must be a non-negative number.');
  const live = getPublishedWorkspace(state);
  const all = [...workspaceItems(state, collection), ...workspaceItems(live, collection)];
  if (all.some((item) => item.id !== candidate.id && item.slug === candidate.slug)) issues.push('This slug is already in use.');
  replaceItem(live, collection, candidate);
  if (collection === 'navigationItems') {
    const item = candidate as typeof state.navigation.items[number];
    const route = getNavigationRouteEntry(item.route);
    if (!route || (item.openInNewTab && !route.allowOpenInNewTab)) issues.push('Select a route from the approved navigation registry.');
    if (!live.navigation.groups.some((group) => group.id === item.groupId)) issues.push('Publish the navigation group first.');
  } else if (collection !== 'navigationGroups') {
    issues.push(...validateContentCatalog(live.catalog).filter((issue) => issue.entityId === candidate.id).map((issue) => issue.message));
    const taxonomy = (candidate as BaseEntity & { taxonomy?: TaxonomyRef }).taxonomy;
    if (taxonomy) {
      const version = live.catalog.examVersions.find((item) => item.id === taxonomy.examVersionId);
      const task = live.catalog.taskTypes.find((item) => item.id === taxonomy.taskTypeId);
      if (version && version.examId !== taxonomy.examId) issues.push('Exam version does not belong to the selected exam.');
      if (task && task.skillId !== taxonomy.skillId) issues.push('Task type does not belong to the selected skill.');
      for (const id of taxonomy.subskillIds) {
        const subskill = live.catalog.subskills.find((item) => item.id === id);
        if (subskill && (subskill.skillId !== taxonomy.skillId || (task && !subskill.taskTypeIds.includes(task.id)))) issues.push('Subskill does not match the selected skill/task.');
      }
      for (const id of taxonomy.topicIds) {
        const topic = live.catalog.topics.find((item) => item.id === id);
        if (topic && !topic.skillIds.includes(taxonomy.skillId)) issues.push('Topic does not match the selected skill.');
      }
      const refs: [keyof ContentCatalog, string[]][] = [
        ['exams', [taxonomy.examId]], ['examVersions', [taxonomy.examVersionId]], ['skills', [taxonomy.skillId]],
        ['taskTypes', taxonomy.taskTypeId ? [taxonomy.taskTypeId] : []], ['subskills', taxonomy.subskillIds],
        ['topics', taxonomy.topicIds], ['levels', taxonomy.levelId ? [taxonomy.levelId] : []], ['contentTypes', [taxonomy.contentTypeId]],
      ];
      for (const [key, ids] of refs) {
        if (ids.some((id) => !live.catalog[key].some((item) => item.id === id && item.status === 'active'))) issues.push(`Publish an active ${key} record before using it.`);
      }
    }
    if (collection === 'questions') {
      const question = candidate as ContentCatalog['questions'][number];
      if (question.prompt.trim().length < 8) issues.push('Question prompt is too short.');
      if (question.optionIds.length < 2 || new Set(question.optionIds).size !== question.optionIds.length) issues.push('At least two distinct options are required.');
      if (!question.correctOptionId || !question.optionIds.includes(question.correctOptionId)) issues.push('Select a correct answer from the question options.');
      if (question.optionIds.some((id) => !live.catalog.questionOptions.some((option) => option.id === id && option.questionId === question.id && option.status === 'active'))) issues.push('Every option must be active and belong to this question.');
      const options = question.optionIds.flatMap((id) => live.catalog.questionOptions.filter((option) => option.id === id && option.questionId === question.id));
      const bodies = options.map((option) => option.body.trim().toLocaleLowerCase());
      if (bodies.some((body) => !body)) issues.push('Option text cannot be empty.');
      if (new Set(bodies).size !== bodies.length) issues.push('Option texts must be distinct.');
      if (options.filter((option) => option.isCorrect).length !== 1 || options.some((option) => option.isCorrect !== (option.id === question.correctOptionId))) issues.push('Exactly one option must match the correct answer.');
      if (!question.taxonomy.taskTypeId || !question.taxonomy.levelId) issues.push('Task type and difficulty are required.');
      if (live.catalog.contentTypes.find((item) => item.id === question.taxonomy.contentTypeId)?.slug !== 'question') issues.push('Question content type is required.');
    }
    if (collection === 'lessons') {
      const lesson = candidate as BaseEntity & { mediaProvider?: 'youtube' | 'vimeo' | 'upload'; mediaUrl?: string };
      const mediaIssue = validateVideoMediaUrl(lesson.mediaProvider, lesson.mediaUrl);
      if (mediaIssue) {
        issues.push(mediaIssue === 'Video bağlantısı gerekli.' ? 'Video URL is required before publishing.' : lesson.mediaProvider === 'youtube' ? 'A valid YouTube video URL is required before publishing.' : lesson.mediaProvider === 'vimeo' ? 'A valid Vimeo video URL is required before publishing.' : 'A stored video file is required before publishing.');
      }
    }
  }
  return [...new Set(issues)];
}

export function recordAdminRevision(
  before: AdminWorkspaceState, candidateState: AdminWorkspaceState, collection: AdminMutableCollectionKey,
  id: string, actor: AdminActor, action: AdminRevision['action'], status: PublicationStatus,
  expectedVersion: number, restoredFrom?: number,
): AdminWorkspaceState {
  if (actor.role !== 'admin' || !actor.id || !actor.email) throw new Error('Admin access is required.');
  actor = { id: actor.id, email: actor.email, role: actor.role };
  const base = migrateAdminWorkspace(before);
  const previous = getAdminDocument(base, collection, id);
  if ((previous?.version ?? 0) !== expectedVersion) throw new Error('This content changed. Reopen it before saving.');
  const next = copy(candidateState);
  next.workflow = copy(base.workflow);
  const candidate = workspaceItems(next, collection).find((item) => item.id === id);
  if (!candidate) throw new Error('Content was not found.');
  if (collection === 'questions' && !candidate.questionOptions) candidate.questionOptions = copy(next.catalog.questionOptions.filter((option) => option.questionId === id));
  const liveItems = workspaceItems(getPublishedWorkspace(base), collection);
  if ([...workspaceItems(next, collection), ...liveItems].some((item) => item.id !== id && item.slug === candidate.slug)) throw new Error('This slug is already in use.');
  if (status === 'published') {
    const errors = validatePublication(base, collection, candidate);
    if (errors.length) throw new Error(errors.join('\n'));
  }
  if (status === 'archived' && previous?.published) {
    const live = getPublishedWorkspace(base);
    const dependents = workflowCollections.flatMap((key) => workspaceItems(live, key)).filter((item) => item.id !== id && references(item, id));
    if (dependents.length) throw new Error(`Archive blocked: referenced by ${dependents.slice(0, 3).map((item) => item.title).join(', ')}.`);
  }
  const at = new Date().toISOString();
  const version = (previous?.version ?? 0) + 1;
  const last = previous?.revisions.at(-1)?.snapshot;
  const snapshot: AdminSnapshot = {
    ...copy(candidate), version, createdBy: last ? last.createdBy : copy(actor), updatedBy: copy(actor),
    createdAt: last?.createdAt ?? candidate.createdAt, updatedAt: at,
    publishedBy: status === 'published' ? copy(actor) : previous?.published?.publishedBy ?? null,
    publishedAt: status === 'published' ? at : previous?.published?.publishedAt ?? null,
  };
  if ('status' in snapshot) snapshot.status = status === 'published' ? 'active' : status === 'archived' ? 'archived' : 'draft';
  if ('isEnabled' in snapshot) snapshot.isEnabled = status === 'published';
  if (snapshot.questionOptions) snapshot.questionOptions = snapshot.questionOptions.map((option) => ({ ...option, status: status === 'published' ? 'active' : status === 'archived' ? 'archived' : 'draft' }));
  const revision: AdminRevision = { version, status, snapshot: copy(snapshot), actor: copy(actor), timestamp: at, action, ...(restoredFrom === undefined ? {} : { restoredFrom }), diff: diffSnapshots(last, snapshot) };
  next.workflow.documents[documentKey(collection, id)] = {
    collection, entityId: id, version, status,
    published: status === 'published' ? copy(snapshot) : status === 'archived' ? null : copy(previous?.published ?? null),
    revisions: [...(previous?.revisions ?? []), revision],
  };
  next.workflow.revision += 1;
  const summary = `${snapshot.title}: ${action}${restoredFrom ? ` from v${restoredFrom}` : ''} (v${version})`;
  next.workflow.audit.unshift({ id: `${collection}:${id}:${version}`, user: copy(actor), action, entityType: collection, entityId: id, timestamp: at, summary, version });
  replaceItem(next, collection, snapshot);
  return next;
}

export function restoreAdminVersion(state: AdminWorkspaceState, collection: AdminMutableCollectionKey, id: string, version: number, actor: AdminActor, expectedVersion: number) {
  const document = getAdminDocument(state, collection, id);
  const revision = document?.revisions.find((item) => item.version === version);
  if (!revision) throw new Error('Version was not found.');
  if (collection === 'questions' && !revision.snapshot.questionOptions && (revision.snapshot as Question).optionIds.length) throw new Error('This legacy version has no option snapshot. Restore is unavailable; edit a new draft instead.');
  const next = copy(state);
  replaceItem(next, collection, revision.snapshot);
  return recordAdminRevision(state, next, collection, id, actor, 'restored', 'draft', expectedVersion, version);
}

type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export function readAdminWorkspace(storage: StoragePort, fallback: () => AdminWorkspaceState): AdminWorkspaceState {
  const raw = storage.getItem(workspaceStorageKey) ?? storage.getItem(legacyWorkspaceStorageKey);
  if (!raw) return migrateAdminWorkspace(fallback());
  try {
    const parsed = JSON.parse(raw) as AdminWorkspaceState;
    if (!parsed.catalog || !Array.isArray(parsed.navigation?.groups) || !Array.isArray(parsed.navigation?.items)) throw new Error();
    for (const key of workflowCollections) if (!Array.isArray(workspaceItems(parsed, key))) throw new Error();
    return migrateAdminWorkspace(parsed);
  } catch { throw new Error('Stored admin data could not be read. It has not been reset or overwritten.'); }
}

export function persistAdminWorkspace(storage: StoragePort, next: AdminWorkspaceState, expectedRevision: number) {
  const raw = storage.getItem(workspaceStorageKey);
  const currentRevision = raw ? readAdminWorkspace(storage, () => next).workflow?.revision ?? 0 : 0;
  if (currentRevision !== expectedRevision) throw new Error('Another tab saved changes. Reload the workspace before saving.');
  // One atomic write; leave the v1 key intact as the migration backup.
  try { storage.setItem(workspaceStorageKey, JSON.stringify(next)); }
  catch { throw new Error('Save failed. Browser storage may be full or unavailable. Your changes remain in the editor.'); }
}
