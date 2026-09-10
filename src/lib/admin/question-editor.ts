import type { ContentCatalog, Question, QuestionOption } from '@/lib/content';
import type { AdminQuestionDraft, AdminSnapshot } from './types';

export function readQuestionDraft(catalog: ContentCatalog, question: Question): AdminQuestionDraft {
  const owned = (question as Question & AdminSnapshot).questionOptions ?? catalog.questionOptions;
  return {
    taxonomy: JSON.parse(JSON.stringify(question.taxonomy)),
    stimulus: question.stimulus ?? '',
    correctOptionId: question.correctOptionId,
    options: question.optionIds.map((id) => {
      const option = owned.find((item) => item.id === id && item.questionId === question.id);
      return { id, body: option?.body ?? '', rationale: option?.rationale ?? '' };
    }),
  };
}

export function buildQuestionSnapshot(catalog: ContentCatalog, question: Question, draft?: AdminQuestionDraft): Question & AdminSnapshot {
  if (!draft) return { ...question, questionOptions: question.optionIds.flatMap((id) => catalog.questionOptions.filter((option) => option.id === id && option.questionId === question.id)) };
  const ids = draft.options.map((option) => option.id);
  if (ids.some((id) => !id || !/^[a-zA-Z0-9_-]+$/.test(id)) || new Set(ids).size !== ids.length) throw new Error('Option IDs must be unique and non-empty.');
  if (ids.some((id) => catalog.questionOptions.some((option) => option.id === id && option.questionId !== question.id))) throw new Error('An option belongs to another question.');
  if (draft.correctOptionId && !ids.includes(draft.correctOptionId)) throw new Error('The correct answer must belong to this question.');
  const at = question.updatedAt;
  const questionOptions: QuestionOption[] = draft.options.map((option, index) => {
    const existing = catalog.questionOptions.find((item) => item.id === option.id && item.questionId === question.id);
    return {
      ...existing, id: option.id, questionId: question.id, slug: option.id.toLowerCase(),
      title: `Option ${index + 1}`, optionKey: String.fromCharCode(65 + index), body: option.body.trim(),
      rationale: option.rationale.trim(), isCorrect: option.id === draft.correctOptionId,
      sortOrder: (index + 1) * 10, status: 'active', visibility: question.visibility, isPremium: question.isPremium,
      createdAt: existing?.createdAt ?? at, updatedAt: at,
    };
  });
  return { ...question, taxonomy: JSON.parse(JSON.stringify(draft.taxonomy)), stimulus: draft.stimulus.trim(), optionIds: ids, correctOptionId: draft.correctOptionId, questionOptions };
}
