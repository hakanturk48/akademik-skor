import {
  defaultListeningSelection,
  listeningContinueItem,
  listeningDifficulties,
  listeningLearningChains,
  listeningLengths,
  listeningMetrics,
  listeningPracticeModes,
  listeningRecommendations,
  listeningSubskills,
  listeningTaskTypes,
} from './data';
import type {
  ListeningDifficultyId,
  ListeningLengthId,
  ListeningSelection,
  ListeningSessionMode,
  ListeningSubskillId,
  ListeningTaskTypeId,
} from './types';

function isTaskTypeId(value: string | undefined): value is ListeningTaskTypeId {
  return listeningTaskTypes.some((item) => item.id === value);
}

function isSubskillId(value: string | undefined): value is ListeningSubskillId {
  return listeningSubskills.some((item) => item.id === value);
}

function isDifficultyId(value: string | undefined): value is ListeningDifficultyId {
  return listeningDifficulties.some((item) => item.id === value);
}

function isLengthId(value: string | undefined): value is ListeningLengthId {
  return listeningLengths.some((item) => item.id === value);
}

function isSessionMode(value: string | undefined): value is ListeningSessionMode {
  return value === 'practice' || value === 'exam';
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function getListeningOverview() {
  return listeningMetrics;
}

export function getListeningPracticeModes() {
  return listeningPracticeModes;
}

export function getListeningTaskTypes() {
  return [...listeningTaskTypes].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getListeningSubskills(taskTypeId?: ListeningTaskTypeId) {
  return [...listeningSubskills]
    .filter((item) => !taskTypeId || item.taskTypeIds.includes(taskTypeId))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getListeningDifficulties() {
  return listeningDifficulties;
}

export function getListeningLengths() {
  return listeningLengths;
}

export function getListeningTaskTypeById(id: ListeningTaskTypeId) {
  return listeningTaskTypes.find((item) => item.id === id) ?? listeningTaskTypes[0]!;
}

export function getListeningSubskillById(id: ListeningSubskillId) {
  return listeningSubskills.find((item) => item.id === id) ?? listeningSubskills[0]!;
}

export function getListeningDifficultyById(id: ListeningDifficultyId) {
  return listeningDifficulties.find((item) => item.id === id) ?? listeningDifficulties[0]!;
}

export function getListeningLengthById(id: ListeningLengthId) {
  return listeningLengths.find((item) => item.id === id) ?? listeningLengths[0]!;
}

export function getListeningContinueItem() {
  return listeningContinueItem;
}

export function getListeningRecommendations() {
  return [...listeningRecommendations].sort((a, b) => a.priority - b.priority);
}

export function getListeningLearningChain(selection: Pick<ListeningSelection, 'taskTypeId' | 'subskillId'>) {
  const key = `${selection.taskTypeId}:${selection.subskillId}`;
  return listeningLearningChains[key] ?? listeningLearningChains['academic-talk:note-taking'];
}

export function ensureCompatibleSubskill(taskTypeId: ListeningTaskTypeId, subskillId: ListeningSubskillId): ListeningSubskillId {
  const valid = getListeningSubskills(taskTypeId);
  return valid.some((item) => item.id === subskillId) ? subskillId : valid[0]?.id ?? defaultListeningSelection.subskillId;
}

export function makeListeningSelection(input: Partial<ListeningSelection>): ListeningSelection {
  const taskTypeId = input.taskTypeId ?? defaultListeningSelection.taskTypeId;
  const subskillId = ensureCompatibleSubskill(taskTypeId, input.subskillId ?? defaultListeningSelection.subskillId);

  return {
    taskTypeId,
    subskillId,
    difficultyId: input.difficultyId ?? defaultListeningSelection.difficultyId,
    lengthId: input.lengthId ?? defaultListeningSelection.lengthId,
    sessionMode: input.sessionMode ?? defaultListeningSelection.sessionMode,
  };
}

export function getListeningSelectionFromParams(params: Partial<Record<'task' | 'subskill' | 'difficulty' | 'length' | 'mode', string | string[]>>): ListeningSelection {
  const task = firstParam(params.task);
  const subskill = firstParam(params.subskill);
  const difficulty = firstParam(params.difficulty);
  const length = firstParam(params.length);
  const mode = firstParam(params.mode);

  return makeListeningSelection({
    taskTypeId: isTaskTypeId(task) ? task : defaultListeningSelection.taskTypeId,
    subskillId: isSubskillId(subskill) ? subskill : defaultListeningSelection.subskillId,
    difficultyId: isDifficultyId(difficulty) ? difficulty : defaultListeningSelection.difficultyId,
    lengthId: isLengthId(length) ? length : defaultListeningSelection.lengthId,
    sessionMode: isSessionMode(mode) ? mode : defaultListeningSelection.sessionMode,
  });
}

export function createListeningPracticeHref(selection: ListeningSelection) {
  const query = new URLSearchParams({
    mode: selection.sessionMode,
    task: selection.taskTypeId,
    subskill: selection.subskillId,
    difficulty: selection.difficultyId,
    length: selection.lengthId,
  });

  return `/practice/listening?${query.toString()}`;
}

export function createSelectionFromRecommendation(id: string): ListeningSelection {
  const item = listeningRecommendations.find((recommendation) => recommendation.id === id) ?? listeningRecommendations[0]!;
  return makeListeningSelection({
    taskTypeId: item.taskTypeId,
    subskillId: item.subskillId,
    difficultyId: item.difficultyId,
    lengthId: item.lengthId,
    sessionMode: item.sessionMode,
  });
}
