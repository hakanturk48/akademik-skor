import { contentCatalogSeed, getTaxonomyBreadcrumb, validateContentCatalog } from '@/lib/content';
import { navigationSeed } from '@/lib/navigation';
import { buildQuestionSnapshot, readQuestionDraft } from './question-editor';
import { getAdminDocument, migrateAdminWorkspace, readAdminWorkspace, persistAdminWorkspace, recordAdminRevision, workspaceItems, workspaceStorageKey } from './workflow';
import { isRemoteAdminWorkspaceEnabled, isRemoteWorkspaceSetupError, loadRemoteAdminWorkspaceState, saveRemoteAdminWorkspaceState } from './remote-workspace';
import { defaultPageBuilderState } from './page-builder';
import { parseVideoTimedText, serializeVideoTimedText, validateVideoMediaUrl, type VideoMediaProvider } from '@/lib/video-media';

import type {
  BaseEntity,
  ContentCatalog,
  ContentType,
  EntityStatus,
  TaxonomyRef,
  ValidationIssue,
  Visibility,
  Question,
  LessonResource,
  ReadingPracticeScreen,
} from '@/lib/content';
import type { NavigationGroup, NavigationIconKey, NavigationItem, NavigationSeed } from '@/lib/navigation';

import type {
  AdminActor,
  PublicationStatus,
  AdminChangeLogEntry,
  AdminCollectionConfig,
  AdminCollectionKey,
  AdminDashboardMetrics,
  AdminEntityDraft,
  AdminEntityRow,
  AdminModuleConfig,
  AdminModuleKey,
  AdminMutableCollectionKey,
  AdminQuestionFilters,
  AdminWorkspaceState,
} from './types';

type CatalogEntity = BaseEntity & Record<string, unknown>;

const defaultDate = '2026-09-06T00:00:00.000Z';

export const adminModules: AdminModuleConfig[] = [
  { key: 'dashboard', title: 'Yönetim Özeti', description: 'İçerik durumu, taslaklar ve son değişiklikler.', iconKey: 'dashboard' },
  { key: 'page-builder', title: 'Sayfa Oluşturucu', description: 'Güvenli bileşenlerle sayfa düzeni ve sekmeler.', iconKey: 'builder' },
  { key: 'navigation', title: 'Menü Yönetimi', description: 'Menü grupları ve bağlantıları.', iconKey: 'navigation' },
  { key: 'taxonomy', title: 'Sınıflandırma', description: 'Sınav, beceri, soru türü, konu ve seviye yapısı.', iconKey: 'taxonomy' },
  { key: 'courses', title: 'Kurslar', description: 'Kurs, modül ve ders yapısı.', iconKey: 'courses' },
  { key: 'video-lessons', title: 'Video Dersler', description: 'Video ders bilgileri, erişim ve sıralama.', iconKey: 'video' },
  { key: 'reading-practice', title: 'Okuma Pratiği', description: 'Reading Practice ekranı, passage ve soru akışı.', iconKey: 'reading' },
  { key: 'vocabulary', title: 'Kelime Çalışmaları', description: 'Kelime setleri ve kelimeler.', iconKey: 'vocabulary' },
  { key: 'grammar', title: 'Dil Bilgisi', description: 'Dil bilgisi kategorileri, konuları ve dersleri.', iconKey: 'grammar' },
  { key: 'question-bank', title: 'Soru Bankası', description: 'Sorular, filtreler ve cevap seçenekleri.', iconKey: 'questions' },
  { key: 'practice-sets', title: 'Alıştırma Setleri', description: 'Soru bankasından oluşturulan alıştırmalar.', iconKey: 'practice' },
  { key: 'mini-tests', title: 'Mini Testler', description: 'Mini test kayıtları, durum ve sıralama.', iconKey: 'tests' },
];

export const adminModuleCollections: Record<Exclude<AdminModuleKey, 'dashboard'>, AdminCollectionConfig[]> = {
  'page-builder': [],
  navigation: [
    { key: 'navigationGroups', label: 'Menü Grupları', singularLabel: 'Menü Grubu', description: 'Ana menü grupları.' },
    { key: 'navigationItems', label: 'Menü Bağlantıları', singularLabel: 'Menü Bağlantısı', description: 'İzin verilen sayfalara giden menü bağlantıları.' },
  ],
  taxonomy: [
    { key: 'exams', label: 'Sınavlar', singularLabel: 'Sınav', description: 'TOEFL gibi sınav aileleri.' },
    { key: 'examVersions', label: 'Sınav Sürümleri', singularLabel: 'Sınav Sürümü', description: 'Güncel ve gelecek sınav sürümleri.' },
    { key: 'skills', label: 'Beceriler', singularLabel: 'Beceri', description: 'Okuma, dinleme, konuşma ve diğer beceriler.' },
    { key: 'taskTypes', label: 'Soru Türleri', singularLabel: 'Soru Türü', description: 'Becerilere bağlı soru türleri.' },
    { key: 'subskills', label: 'Alt Beceriler', singularLabel: 'Alt Beceri', description: 'Çalışılacak alt beceriler.' },
    { key: 'topics', label: 'Konular', singularLabel: 'Konu', description: 'Akademik konular ve sınav konuları.' },
    { key: 'levels', label: 'Seviyeler', singularLabel: 'Seviye', description: 'Zorluk ve seviye ölçeği.' },
  ],
  courses: [
    { key: 'courses', label: 'Kurslar', singularLabel: 'Kurs', description: 'Sınav sürümüne ve beceriye bağlı kurslar.' },
    { key: 'modules', label: 'Modüller', singularLabel: 'Modül', description: 'Dersleri içeren kurs modülleri.' },
    { key: 'lessons', label: 'Dersler', singularLabel: 'Ders', description: 'Modüllere bağlı ders kayıtları.' },
  ],
  'video-lessons': [
    { key: 'lessons', label: 'Video Dersler', singularLabel: 'Video Ders', description: 'Sınıflandırılmış video ders kataloğu.', contentTypeSlug: 'video-lesson' },
  ],
  'reading-practice': [
    { key: 'readingPracticeScreens', label: 'Okuma Pratikleri', singularLabel: 'Okuma Pratiği', description: 'Reading Practice ekranının passage, soru ve yönergeleri.' },
  ],
  vocabulary: [
    { key: 'vocabularySets', label: 'Kelime Setleri', singularLabel: 'Kelime Seti', description: 'Gruplandırılmış TOEFL kelime setleri.' },
    { key: 'vocabularyWords', label: 'Kelimeler', singularLabel: 'Kelime', description: 'Kelime kartları ve tekrar içerikleri.' },
  ],
  grammar: [
    { key: 'grammarCategories', label: 'Dil Bilgisi Kategorileri', singularLabel: 'Dil Bilgisi Kategorisi', description: 'Dil bilgisi kataloğunun kategorileri.' },
    { key: 'grammarTopics', label: 'Dil Bilgisi Konuları', singularLabel: 'Dil Bilgisi Konusu', description: 'Seçilebilir dil bilgisi konuları.' },
    { key: 'grammarLessons', label: 'Dil Bilgisi Dersleri', singularLabel: 'Dil Bilgisi Dersi', description: 'Öğrenme, alıştırma ve tekrar dersleri.' },
  ],
  'question-bank': [
    { key: 'questions', label: 'Sorular', singularLabel: 'Soru', description: 'Sınıflandırma kontrolü yapılan soru kayıtları.' },
  ],
  'practice-sets': [
    { key: 'practiceSets', label: 'Alıştırma Setleri', singularLabel: 'Alıştırma Seti', description: 'Seçili sorulardan oluşan alıştırma setleri.' },
  ],
  'mini-tests': [
    { key: 'tests', label: 'Mini Testler', singularLabel: 'Mini Test', description: 'İçerik sınıflandırmasına göre hazırlanan mini testler.', contentTypeSlug: 'mini-test' },
  ],
};

export const adminStatusOptions: EntityStatus[] = ['draft', 'active', 'inactive', 'archived'];
export const adminVisibilityOptions: Visibility[] = ['public', 'authenticated', 'private'];

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `item-${Date.now()}`;
}

function firstId<T extends { id: string }>(items: T[]) {
  return items[0]?.id ?? '';
}

const lessonResourceTypes: LessonResource['type'][] = ['PDF', 'Checklist', 'Worksheet', 'Template'];

function normalizeLessonResourceType(value: string) {
  const match = lessonResourceTypes.find((type) => type.toLowerCase() === value.trim().toLowerCase());
  return match ?? null;
}

function isPremiumResourceToken(value: string) {
  return ['premium', 'paid', 'locked', 'kilitli', 'true', '1', 'evet'].includes(value.trim().toLowerCase());
}

function parseLessonResourcesText(value?: string) {
  const resources: LessonResource[] = [];
  const invalidLines: string[] = [];

  (value ?? '').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const [rawTitle, rawType = 'PDF', ...tokens] = trimmed.split('|').map((part) => part.trim());
    const type = normalizeLessonResourceType(rawType);
    let premium = false;
    let sizeLabel: string | undefined;
    let url: string | undefined;
    let invalid = false;

    tokens.filter(Boolean).forEach((token) => {
      if (isPremiumResourceToken(token)) {
        premium = true;
      } else if (/^https:\/\//i.test(token)) {
        url = token;
      } else if (/^https?:\/\//i.test(token)) {
        invalid = true;
      } else if (!sizeLabel) {
        sizeLabel = token;
      } else {
        invalid = true;
      }
    });

    if (!rawTitle || !type || invalid) {
      invalidLines.push(trimmed);
      return;
    }

    resources.push({ title: rawTitle, type, ...(sizeLabel ? { sizeLabel } : {}), ...(url ? { url } : {}), ...(premium ? { premium } : {}) });
  });

  return { resources, invalidLines };
}

function serializeLessonResourcesText(resources?: LessonResource[]) {
  return (resources ?? []).map((resource) => [resource.title, resource.type, resource.sizeLabel, resource.url, resource.premium ? 'premium' : undefined].filter(Boolean).join('|')).join('\n');
}


const defaultReadingPassageText = [
  "Sleep is a fundamental biological process that affects nearly every aspect of human health and performance. While scientists are still uncovering the full complexity of sleep, research has shown that a good night's rest plays a critical role in memory consolidation, immune function, emotional regulation, and physical recovery.",
  'During sleep, the brain cycles through different stages, including both REM (rapid eye movement) and non-REM sleep. REM sleep is associated with dreaming and learning, while non-REM sleep is linked to deep rest and tissue repair. These cycles repeat several times throughout the night, typically lasting 90 to 110 minutes each.',
  'Chronic sleep deprivation, on the other hand, has been tied to a range of negative outcomes. It can impair concentration, weaken decision-making, increase stress hormones, and even contribute to long-term health problems like heart disease and diabetes. Despite these risks, many people, especially students and professionals, regularly sacrifice sleep due to busy schedules or poor habits.',
  'Improving sleep quality does not always require dramatic changes. Simple steps like maintaining a consistent sleep schedule, limiting screen time before bed, and creating a dark, quiet environment can have a meaningful impact. In short, prioritizing sleep is one of the most effective ways to support both mental and physical well-being.',
].join('\n\n');

const defaultReadingQuestionsText = [
  "Which sentence best states the main idea of paragraph 1?\nA|Scientists already understand every detail of sleep.\nB*|Sleep strongly supports health, learning, emotion, and recovery.\nC|Physical recovery only happens during REM sleep.\nD|Students need less sleep than other adults.\nE|Sleep has no relationship to memory or emotion.",
  'What is the main purpose of paragraph 2?\nA*|To explain that sleep includes repeating stages with different functions.\nB|To argue that REM sleep is harmful for learners.\nC|To compare sleep research with medical treatment.\nD|To list common causes of poor sleep.\nE|To recommend replacing sleep with short naps.',
  'According to the passage, what can chronic sleep deprivation do?\nA|It can improve stress tolerance.\nB|It can eliminate the need for exercise.\nC*|It can harm concentration and long-term health.\nD|It can make REM cycles shorter than usual.\nE|It can make every student perform better.',
  'What is the main idea of the passage?\nA|Sleep cycles are composed of REM and non-REM stages.\nB*|Sleep plays a vital role in both mental and physical health.\nC|Many people suffer from sleep deprivation due to stress.\nD|Small lifestyle changes can significantly improve sleep quality.\nE|The passage mainly compares sleep with exercise.',
].join('\n---\n');
const defaultReadingReviewTipsText = 'Eliminate answer choices that focus on only one paragraph.\nConfirm the selected answer covers the whole passage.';
const readingPracticeOptionKeys = ['A', 'B', 'C', 'D', 'E'] as const;

type ReadingPracticeQuestionDraft = ReadingPracticeScreen['questions'][number];

function isReadingPracticeOptionKey(value: string): value is typeof readingPracticeOptionKeys[number] {
  return (readingPracticeOptionKeys as readonly string[]).includes(value);
}

function normalizeReadingPracticeQuestion(question?: Partial<ReadingPracticeQuestionDraft>): ReadingPracticeQuestionDraft {
  const rawOptions = question?.options ?? [];
  const options = readingPracticeOptionKeys.map((key) => {
    const match = rawOptions.find((option) => option.key.toUpperCase() === key);
    return { key, text: match?.text?.trim() ?? '' };
  });
  const rawCorrect = question?.correctOptionKey?.toUpperCase() ?? '';
  const correctOptionKey = isReadingPracticeOptionKey(rawCorrect) ? rawCorrect : undefined;

  return {
    prompt: question?.prompt?.trim() ?? '',
    options,
    ...(correctOptionKey ? { correctOptionKey } : {}),
    ...(question?.marked ? { marked: true } : {}),
  };
}

function normalizeReadingPracticeQuestions(questions?: ReadingPracticeQuestionDraft[]) {
  return (questions ?? []).map((question) => normalizeReadingPracticeQuestion(question));
}

function defaultReadingPracticeDraftFields(): Partial<AdminEntityDraft> {
  return {
    title: 'Reading Practice',
    slug: 'reading-practice',
    description: 'Main Idea · Practice Set 3 · TOEFL iBT Reading',
    subtitle: 'Main Idea · Practice Set 3 · TOEFL iBT Reading',
    questionType: 'Main Idea',
    timeLimitSeconds: 1200,
    timeRemainingSeconds: 1200,
    currentQuestionIndex: 0,
    answeredCount: 0,
    markedCount: 0,
    wordCount: countReadingWords(parseReadingPassageText(defaultReadingPassageText)),
    sourceLabel: 'Adapted from scientific American',
    passageTitle: 'The Science of Sleep: Why Rest Matters',
    passageText: defaultReadingPassageText,
    readingQuestionsText: defaultReadingQuestionsText,
    readingQuestions: parseReadingPracticeQuestionsText(defaultReadingQuestionsText).questions,
    supportFocusTitle: 'READING FOCUS',
    supportFocusText: 'Main idea questions reward structure, not isolated details.',
    supportProgress: 72,
    supportHint: 'Practice Accuracy /100: 72 · Target section score: 24/30',
    reviewTitle: 'NEXT REVIEW',
    reviewTipsText: defaultReadingReviewTipsText,
  };
}

function clampAdminNumber(value: unknown, min: number, max: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function parseReadingPassageText(value?: string) {
  return (value ?? '').split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function serializeReadingPassageText(paragraphs?: string[]) {
  return (paragraphs ?? []).join('\n\n');
}

function countReadingWords(paragraphs: string[]) {
  return paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

function parseReviewTipsText(value?: string) {
  return (value ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function serializeReviewTipsText(tips?: string[]) {
  return (tips ?? []).join('\n');
}

function parseReadingPracticeQuestionsText(value?: string) {
  const questions: ReadingPracticeScreen['questions'] = [];
  const invalidLines: string[] = [];
  const blocks = (value ?? '').split(/\r?\n\s*-{3,}\s*\r?\n/).map((block) => block.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const prompt = lines.shift() ?? '';
    const options: ReadingPracticeScreen['questions'][number]['options'] = [];
    let correctOptionKey: string | undefined;
    let marked = false;

    for (const line of lines) {
      const meta = /^(correct|dogru|doğru|marked|isaretli|işaretli)\s*[:=]\s*(.+)$/i.exec(line);
      if (meta) {
        const key = meta[1].toLowerCase();
        if (key === 'marked' || key === 'isaretli' || key === 'işaretli') {
          marked = ['1', 'true', 'evet', 'yes'].includes(meta[2].trim().toLowerCase());
        } else {
          correctOptionKey = meta[2].trim().toUpperCase().slice(0, 1);
        }
        continue;
      }

      const option = /^([A-Z])(\*)?\s*\|\s*(.+)$/i.exec(line);
      if (!option) {
        invalidLines.push(line);
        continue;
      }

      const optionKey = option[1].toUpperCase();
      if (option[2]) correctOptionKey = optionKey;
      options.push({ key: optionKey, text: option[3].trim() });
    }

    if (!prompt || !options.length || new Set(options.map((option) => option.key)).size !== options.length) {
      invalidLines.push(block);
      continue;
    }

    questions.push(normalizeReadingPracticeQuestion({ prompt, options, ...(correctOptionKey ? { correctOptionKey } : {}), ...(marked ? { marked } : {}) }));
  }

  return { questions, invalidLines };
}

function serializeReadingPracticeQuestionsText(questions?: ReadingPracticeScreen['questions']) {
  return normalizeReadingPracticeQuestions(questions).map((question) => [
    question.prompt,
    ...question.options.map((option) => `${option.key}${option.key === question.correctOptionKey ? '*' : ''}|${option.text}`),
    question.marked ? 'marked: true' : undefined,
  ].filter(Boolean).join('\n')).join('\n---\n');
}

function readingPracticeDraftFromScreen(screen?: Partial<ReadingPracticeScreen>, row?: Pick<AdminEntityRow, 'description'>): Partial<AdminEntityDraft> {
  const defaults = defaultReadingPracticeDraftFields();
  const passageParagraphs = screen?.passageParagraphs?.length ? screen.passageParagraphs : parseReadingPassageText(String(defaults.passageText));
  const questions = normalizeReadingPracticeQuestions(screen?.questions?.length ? screen.questions : defaults.readingQuestions);

  return {
    subtitle: screen?.subtitle ?? row?.description ?? defaults.subtitle,
    questionType: screen?.questionType ?? defaults.questionType,
    timeLimitSeconds: screen?.timeLimitSeconds ?? defaults.timeLimitSeconds,
    timeRemainingSeconds: screen?.timeLimitSeconds ?? defaults.timeLimitSeconds,
    currentQuestionIndex: 0,
    answeredCount: 0,
    markedCount: 0,
    wordCount: countReadingWords(passageParagraphs),
    sourceLabel: screen?.sourceLabel ?? defaults.sourceLabel,
    passageTitle: screen?.passageTitle ?? defaults.passageTitle,
    passageText: serializeReadingPassageText(passageParagraphs),
    readingQuestionsText: serializeReadingPracticeQuestionsText(questions),
    readingQuestions: questions,
    supportFocusTitle: screen?.supportFocusTitle ?? defaults.supportFocusTitle,
    supportFocusText: screen?.supportFocusText ?? defaults.supportFocusText,
    supportProgress: screen?.supportProgress ?? defaults.supportProgress,
    supportHint: screen?.supportHint ?? defaults.supportHint,
    reviewTitle: screen?.reviewTitle ?? defaults.reviewTitle,
    reviewTipsText: serializeReviewTipsText(screen?.reviewTips) || defaults.reviewTipsText,
  };
}

function readingPracticeFieldsFromDraft(draft: Partial<AdminEntityDraft>, existing?: Partial<ReadingPracticeScreen>): Omit<ReadingPracticeScreen, keyof BaseEntity> {
  const defaults = defaultReadingPracticeDraftFields();
  const existingPassageText = serializeReadingPassageText(existing?.passageParagraphs);
  const existingQuestionsText = serializeReadingPracticeQuestionsText(existing?.questions);
  const passageParagraphs = parseReadingPassageText(draft.passageText ?? (existingPassageText || String(defaults.passageText)));
  const parsedQuestions = draft.readingQuestions?.length
    ? { questions: normalizeReadingPracticeQuestions(draft.readingQuestions), invalidLines: [] }
    : parseReadingPracticeQuestionsText(draft.readingQuestionsText ?? (existingQuestionsText || String(defaults.readingQuestionsText)));
  const fallbackQuestions = normalizeReadingPracticeQuestions(defaults.readingQuestions);
  const questions = normalizeReadingPracticeQuestions(parsedQuestions.questions.length ? parsedQuestions.questions : fallbackQuestions);
  const finalPassageParagraphs = passageParagraphs.length ? passageParagraphs : parseReadingPassageText(String(defaults.passageText));
  const timeLimitSeconds = clampAdminNumber(draft.timeLimitSeconds ?? existing?.timeLimitSeconds ?? defaults.timeLimitSeconds, 0, 24 * 60 * 60);

  return {
    subtitle: draft.subtitle?.trim() || existing?.subtitle || draft.description?.trim() || String(defaults.subtitle),
    questionType: draft.questionType?.trim() || existing?.questionType || String(defaults.questionType),
    timeLimitSeconds,
    timeRemainingSeconds: timeLimitSeconds,
    currentQuestionIndex: 0,
    answeredCount: 0,
    markedCount: 0,
    wordCount: countReadingWords(finalPassageParagraphs),
    sourceLabel: draft.sourceLabel?.trim() || existing?.sourceLabel || String(defaults.sourceLabel),
    passageTitle: draft.passageTitle?.trim() || existing?.passageTitle || String(defaults.passageTitle),
    passageParagraphs: finalPassageParagraphs,
    questions,
    supportFocusTitle: draft.supportFocusTitle?.trim() || existing?.supportFocusTitle || String(defaults.supportFocusTitle),
    supportFocusText: draft.supportFocusText?.trim() || existing?.supportFocusText || String(defaults.supportFocusText),
    supportProgress: clampAdminNumber(draft.supportProgress ?? existing?.supportProgress ?? defaults.supportProgress, 0, 100),
    supportHint: draft.supportHint?.trim() || existing?.supportHint || String(defaults.supportHint),
    reviewTitle: draft.reviewTitle?.trim() || existing?.reviewTitle || String(defaults.reviewTitle),
    reviewTips: parseReviewTipsText(draft.reviewTipsText ?? (serializeReviewTipsText(existing?.reviewTips) || String(defaults.reviewTipsText))),
  };
}
function contentTypeId(catalog: ContentCatalog, slug: string) {
  return catalog.contentTypes.find((item) => item.slug === slug)?.id ?? firstId(catalog.contentTypes);
}

function defaultTaxonomy(catalog: ContentCatalog, contentTypeSlug = 'video-lesson'): TaxonomyRef {
  const skillId = firstId(catalog.skills);
  const taskTypeId = catalog.taskTypes.find((item) => item.skillId === skillId)?.id;
  const subskill = catalog.subskills.find((item) => item.skillId === skillId && (!taskTypeId || item.taskTypeIds.includes(taskTypeId)));
  const topic = catalog.topics.find((item) => item.skillIds.includes(skillId));

  return {
    examId: firstId(catalog.exams),
    examVersionId: firstId(catalog.examVersions),
    skillId,
    taskTypeId,
    subskillIds: subskill ? [subskill.id] : [],
    topicIds: topic ? [topic.id] : [],
    levelId: firstId(catalog.levels),
    contentTypeId: contentTypeId(catalog, contentTypeSlug),
    tagIds: [],
  };
}

function baseEntity(collection: AdminMutableCollectionKey, draft: Partial<AdminEntityDraft>, existingItems: BaseEntity[]): BaseEntity {
  const title = draft.title?.trim() || 'Untitled item';
  const slug = normalizeSlug(draft.slug || title);
  const at = nowIso();
  const sortOrder = typeof draft.sortOrder === 'number' ? draft.sortOrder : nextSortOrder(existingItems);

  return {
    id: `${collection}-${slug}`,
    slug,
    title,
    description: draft.description?.trim() || '',
    status: draft.status ?? 'draft',
    sortOrder,
    visibility: draft.visibility ?? 'authenticated',
    isPremium: draft.isPremium ?? false,
    createdAt: at,
    updatedAt: at,
  };
}

function nextSortOrder(items: { sortOrder: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 10;
}

function collectionItems(catalog: ContentCatalog, collection: AdminMutableCollectionKey): BaseEntity[] {
  return (catalog as unknown as Record<string, BaseEntity[]>)[collection] ?? [];
}
function contentTypeMatches(catalog: ContentCatalog, item: BaseEntity, config?: AdminCollectionConfig) {
  if (!config?.contentTypeSlug || !('taxonomy' in item)) return true;
  const expectedContentTypeId = catalog.contentTypes.find((type) => type.slug === config.contentTypeSlug)?.id;
  return Boolean(expectedContentTypeId && (item as { taxonomy?: TaxonomyRef }).taxonomy?.contentTypeId === expectedContentTypeId);
}

export function defaultWorkspaceState(): AdminWorkspaceState {
  return {
    catalog: clone(contentCatalogSeed),
    navigation: clone(navigationSeed as NavigationSeed),
    pageBuilder: defaultPageBuilderState(),
    changes: [
      {
        id: 'change-admin-foundation-ready',
        at: defaultDate,
        module: 'dashboard',
        action: 'create',
        entityId: 'admin-foundation',
        entityTitle: 'Admin Panel Foundation',
        detail: 'Admin shell, protected route and content management foundation initialized.',
      },
    ],
  };
}

export function loadAdminWorkspaceState(): AdminWorkspaceState {
  if (!hasLocalStorage()) {
    return migrateAdminWorkspace(defaultWorkspaceState());
  }

  return readAdminWorkspace(window.localStorage, defaultWorkspaceState);
}

export function saveAdminWorkspaceState(state: AdminWorkspaceState, expectedRevision: number) {
  if (!hasLocalStorage()) throw new Error('Persistent admin storage is unavailable.');
  persistAdminWorkspace(window.localStorage, state, expectedRevision);
}

type SharedAdminWorkspaceState = {
  state: AdminWorkspaceState;
  source: 'local' | 'remote';
  message: string;
};

type SharedAdminSaveResult = {
  source: 'local' | 'remote';
  notice?: string;
};

function cacheAdminWorkspaceState(state: AdminWorkspaceState) {
  if (!hasLocalStorage()) return;
  try { window.localStorage.setItem(workspaceStorageKey, JSON.stringify(state)); }
  catch { /* Keep remote state usable even when browser cache is unavailable. */ }
}

function workspaceRevision(state: AdminWorkspaceState | null) {
  return state?.workflow?.revision ?? 0;
}

export async function loadSharedAdminWorkspaceState(actor?: AdminActor): Promise<SharedAdminWorkspaceState> {
  const local = loadAdminWorkspaceState();
  if (!isRemoteAdminWorkspaceEnabled()) {
    return { state: local, source: 'local', message: 'Merkezi içerik altyapısı yapılandırılmadı; yerel demo kayıtları kullanılıyor.' };
  }

  try {
    const remote = await loadRemoteAdminWorkspaceState();
    const localRevision = workspaceRevision(local);
    const remoteRevision = workspaceRevision(remote);

    if (!remote || localRevision > remoteRevision) {
      await saveRemoteAdminWorkspaceState(local, remote ? remoteRevision : null, actor);
      cacheAdminWorkspaceState(local);
      return { state: local, source: 'remote', message: 'Yerel admin kayıtları merkezi içerik verisine aktarıldı.' };
    }

    cacheAdminWorkspaceState(remote);
    return { state: remote, source: 'remote', message: 'Merkezi içerik verisi yüklendi.' };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Merkezi içerik verisi okunamadı.';
    return { state: local, source: 'local', message: detail + ' Yerel kopya gösteriliyor.' };
  }
}

export async function saveSharedAdminWorkspaceState(state: AdminWorkspaceState, expectedRevision: number, actor: AdminActor): Promise<SharedAdminSaveResult> {
  if (isRemoteAdminWorkspaceEnabled()) {
    try {
      await saveRemoteAdminWorkspaceState(state, expectedRevision, actor);
      cacheAdminWorkspaceState(state);
      return { source: 'remote' };
    } catch (error) {
      if (!isRemoteWorkspaceSetupError(error)) throw error;
      saveAdminWorkspaceState(state, expectedRevision);
      return {
        source: 'local',
        notice: (error instanceof Error ? error.message : 'Firebase merkezi içerik yazımı hazır değil.') + ' İşlem bu tarayıcıdaki yerel kopyaya kaydedildi; diğer tarayıcı ve bilgisayarlarda görünmesi için Firebase kurulumu tamamlanmalı.',
      };
    }
  }

  saveAdminWorkspaceState(state, expectedRevision);
  return { source: 'local', notice: 'Merkezi içerik altyapısı yapılandırılmadı; işlem bu tarayıcıdaki yerel kopyaya kaydedildi.' };
}

function withChange(state: AdminWorkspaceState, module: AdminModuleKey, action: AdminChangeLogEntry['action'], entity: Pick<AdminEntityRow, 'id' | 'title'>, detail: string): AdminWorkspaceState {
  return {
    ...state,
    changes: [
      { id: `change-${Date.now()}`, at: nowIso(), module, action, entityId: entity.id, entityTitle: entity.title, detail },
      ...state.changes,
    ].slice(0, 16),
  };
}

function makeTypedEntity(state: AdminWorkspaceState, collection: AdminMutableCollectionKey, draft: Partial<AdminEntityDraft>): CatalogEntity | NavigationGroup | NavigationItem {
  if (collection === 'navigationGroups') {
    const title = draft.title?.trim() || 'New Group';
    const slug = normalizeSlug(draft.slug || title);
    const at = nowIso();
    return {
      id: `admin-nav-group-${slug}`,
      title,
      slug,
      sortOrder: typeof draft.sortOrder === 'number' ? draft.sortOrder : nextSortOrder(state.navigation.groups),
      visibility: draft.visibility ?? 'authenticated',
      placement: 'sidebar',
      isEnabled: draft.status !== 'inactive' && draft.status !== 'archived',
      createdAt: at,
      updatedAt: at,
    };
  }

  if (collection === 'navigationItems') {
    const title = draft.title?.trim() || 'New Navigation Item';
    const slug = normalizeSlug(draft.slug || title);
    const at = nowIso();
    return {
      id: `admin-nav-item-${slug}`,
      title,
      slug,
      iconKey: 'dashboard' as NavigationIconKey,
      route: '/dashboard',
      groupId: state.navigation.groups[0]?.id ?? 'main',
      parentId: null,
      sortOrder: typeof draft.sortOrder === 'number' ? draft.sortOrder : nextSortOrder(state.navigation.items),
      visibility: draft.visibility ?? 'authenticated',
      requiredPlan: null,
      requiredRole: null,
      badgeText: null,
      badgeVariant: null,
      isEnabled: draft.status !== 'inactive' && draft.status !== 'archived',
      openInNewTab: false,
      createdAt: at,
      updatedAt: at,
    };
  }

  const base = baseEntity(collection, draft, collectionItems(state.catalog, collection)) as CatalogEntity;
  const catalog = state.catalog;
  const taxonomy = defaultTaxonomy(catalog, collection === 'tests' ? 'mini-test' : collection === 'grammarLessons' ? 'grammar-lesson' : collection === 'questions' ? 'question' : collection === 'practiceSets' ? 'practice-set' : collection === 'vocabularySets' ? 'vocabulary-set' : 'video-lesson');

  switch (collection) {
    case 'exams':
      return { ...base, familySlug: base.slug };
    case 'examVersions':
      return { ...base, examId: firstId(catalog.exams), versionCode: base.slug.toUpperCase().replace(/-/g, '_') };
    case 'skills':
      return { ...base, shortCode: base.title.slice(0, 2).toUpperCase(), colorToken: 'blue', iconToken: 'book' };
    case 'taskTypes':
      return { ...base, skillId: firstId(catalog.skills) };
    case 'subskills':
      return { ...base, skillId: firstId(catalog.skills), taskTypeIds: catalog.taskTypes[0] ? [catalog.taskTypes[0].id] : [] };
    case 'topics':
      return { ...base, skillIds: catalog.skills[0] ? [catalog.skills[0].id] : [] };
    case 'levels':
      return { ...base, scale: 'TOEFL', rank: nextSortOrder(catalog.levels) };
    case 'courses':
      return { ...base, examVersionId: firstId(catalog.examVersions), primarySkillId: firstId(catalog.skills), taxonomy, moduleIds: [] };
    case 'modules':
      return { ...base, courseId: firstId(catalog.courses), taxonomy, lessonIds: [] };
    case 'lessons': {
      const chapters = parseVideoTimedText(draft.chaptersText);
      const transcript = parseVideoTimedText(draft.transcriptText);
      const resources = parseLessonResourcesText(draft.resourcesText);
      return {
        ...base,
        courseId: draft.courseId || firstId(catalog.courses),
        moduleId: draft.moduleId || firstId(catalog.modules),
        taxonomy,
        durationSeconds: draft.durationSeconds ?? 900,
        estimatedMinutes: draft.estimatedMinutes ?? 15,
        mediaProvider: draft.mediaProvider,
        mediaUrl: draft.mediaUrl?.trim() || undefined,
        thumbnailUrl: draft.thumbnailUrl?.trim() || undefined,
        previewDurationSeconds: draft.previewDurationSeconds ?? 0,
        chapters: chapters.lines.map((line) => ({ startSeconds: line.startSeconds, title: line.text })),
        transcript: transcript.lines,
        resources: resources.resources,
      };
    }
    case 'readingPracticeScreens':
      return { ...base, ...readingPracticeFieldsFromDraft({ ...defaultReadingPracticeDraftFields(), ...draft }) };
    case 'vocabularySets':
      return { ...base, taxonomy, wordIds: [], targetLevelId: firstId(catalog.levels) };
    case 'vocabularyWords':
      return { ...base, setId: firstId(catalog.vocabularySets), term: base.title, meaning: base.description || 'Meaning to be completed', levelId: firstId(catalog.levels), tagIds: [] };
    case 'grammarCategories':
      return { ...base, skillId: catalog.skills.find((item) => item.slug === 'grammar')?.id ?? firstId(catalog.skills), topicIds: [] };
    case 'grammarTopics':
      return { ...base, categoryId: firstId(catalog.grammarCategories), levelId: firstId(catalog.levels), taxonomy, lessonIds: [] };
    case 'grammarLessons':
      return { ...base, topicId: firstId(catalog.grammarTopics), taxonomy, estimatedMinutes: 12, practiceSetIds: [] };
    case 'questions':
      return { ...base, taxonomy, prompt: draft.prompt?.trim() || base.title, stimulus: '', optionIds: [], correctOptionId: undefined, explanation: draft.explanation?.trim() || '' };
    case 'practiceSets':
      return { ...base, taxonomy, questionIds: [], estimatedMinutes: 10, timeLimitSeconds: 600 };
    case 'tests':
      return { ...base, taxonomy, sectionIds: [], totalMinutes: 12, totalQuestions: 0 };
    default:
      return base;
  }
}

function upsertCatalogEntity(state: AdminWorkspaceState, collection: AdminMutableCollectionKey, entity: BaseEntity) {
  const next = clone(state);
  const record = next.catalog as unknown as Record<string, BaseEntity[]>;
  record[collection] = [...(record[collection] ?? []), entity];
  return next;
}

function createEntityCandidate(state: AdminWorkspaceState, module: AdminModuleKey, collection: AdminMutableCollectionKey, draft: Partial<AdminEntityDraft>): AdminWorkspaceState {
  const entity = makeTypedEntity(state, collection, draft);
  if (workspaceItems(state, collection).some((item) => item.id === entity.id || item.slug === entity.slug)) throw new Error('This slug is already in use.');

  if (collection === 'navigationGroups') {
    const next = clone(state);
    next.navigation.groups = [...next.navigation.groups, entity as NavigationGroup];
    return withChange(next, module, 'create', rowFromEntity(next, collection, entity), `${(entity as NavigationGroup).title} oluşturuldu.`);
  }

  if (collection === 'navigationItems') {
    const next = clone(state);
    next.navigation.items = [...next.navigation.items, entity as NavigationItem];
    return withChange(next, module, 'create', rowFromEntity(next, collection, entity), `${(entity as NavigationItem).title} oluşturuldu.`);
  }

  const next = upsertCatalogEntity(state, collection, entity as BaseEntity);
  return withChange(next, module, draft.status === 'active' ? 'publish' : 'create', rowFromEntity(next, collection, entity), `${entity.title} oluşturuldu.`);
}

function applyDraftToEntity<T extends BaseEntity | NavigationGroup | NavigationItem>(collection: AdminMutableCollectionKey, entity: T, draft: Partial<AdminEntityDraft>): T {
  const updatedAt = nowIso();
  const next = {
    ...entity,
    title: draft.title?.trim() || entity.title,
    slug: normalizeSlug(draft.slug || entity.slug),
    sortOrder: typeof draft.sortOrder === 'number' ? draft.sortOrder : entity.sortOrder,
    visibility: draft.visibility ?? entity.visibility,
    updatedAt,
  } as T;

  if ('status' in next) {
    next.status = draft.status ?? next.status;
  }

  if ('description' in next) {
    next.description = draft.description?.trim() ?? next.description;
  }

  if ('isPremium' in next) {
    next.isPremium = draft.isPremium ?? next.isPremium;
  }

  if ('isEnabled' in next) {
    next.isEnabled = (draft.status ?? (next.isEnabled ? 'active' : 'inactive')) !== 'inactive' && (draft.status ?? 'active') !== 'archived';
  }

  if (collection === 'questions' && 'prompt' in next) {
    (next as BaseEntity & { prompt: string; explanation?: string }).prompt = draft.prompt?.trim() || draft.title?.trim() || (next as BaseEntity & { prompt: string }).prompt;
    (next as BaseEntity & { prompt: string; explanation?: string }).explanation = draft.explanation?.trim() ?? (next as BaseEntity & { explanation?: string }).explanation;
  }

  if (collection === 'vocabularyWords' && 'term' in next) {
    (next as BaseEntity & { term: string; meaning: string }).term = next.title;
    (next as BaseEntity & { term: string; meaning: string }).meaning = draft.description?.trim() || (next as BaseEntity & { term: string; meaning: string }).meaning;
  }

  if (collection === 'lessons' && 'durationSeconds' in next) {
    const lesson = next as BaseEntity & { durationSeconds: number; estimatedMinutes: number; mediaProvider?: VideoMediaProvider; mediaUrl?: string; courseId?: string; moduleId?: string; thumbnailUrl?: string; previewDurationSeconds?: number; chapters?: { startSeconds: number; title: string }[]; transcript?: { startSeconds: number; text: string }[]; resources?: LessonResource[] };
    lesson.durationSeconds = typeof draft.durationSeconds === 'number' && draft.durationSeconds >= 0 ? draft.durationSeconds : lesson.durationSeconds;
    lesson.estimatedMinutes = typeof draft.estimatedMinutes === 'number' && draft.estimatedMinutes >= 0 ? draft.estimatedMinutes : Math.ceil(lesson.durationSeconds / 60);
    lesson.mediaUrl = draft.mediaUrl?.trim() || undefined;
    lesson.mediaProvider = lesson.mediaUrl ? draft.mediaProvider : undefined;
    lesson.courseId = draft.courseId || lesson.courseId;
    lesson.moduleId = draft.moduleId || lesson.moduleId;
    lesson.thumbnailUrl = draft.thumbnailUrl?.trim() || undefined;
    lesson.previewDurationSeconds = typeof draft.previewDurationSeconds === 'number' && draft.previewDurationSeconds >= 0 ? draft.previewDurationSeconds : lesson.previewDurationSeconds ?? 0;
    lesson.chapters = parseVideoTimedText(draft.chaptersText).lines.map((line) => ({ startSeconds: line.startSeconds, title: line.text }));
    lesson.transcript = parseVideoTimedText(draft.transcriptText).lines;
    if (draft.resourcesText !== undefined) {
      lesson.resources = parseLessonResourcesText(draft.resourcesText).resources;
    }
  }

  if (collection === 'readingPracticeScreens') {
    Object.assign(next as BaseEntity & ReadingPracticeScreen, readingPracticeFieldsFromDraft(draft, next as Partial<ReadingPracticeScreen>));
  }

  return next;
}

function updateEntityCandidate(state: AdminWorkspaceState, module: AdminModuleKey, collection: AdminMutableCollectionKey, id: string, draft: Partial<AdminEntityDraft>): AdminWorkspaceState {
  const next = clone(state);

  if (collection === 'navigationGroups') {
    next.navigation.groups = next.navigation.groups.map((item) => (item.id === id ? applyDraftToEntity(collection, item, draft) : item));
    const row = listAdminRows(next, collection).find((item) => item.id === id);
    return row ? withChange(next, module, draft.status === 'active' ? 'publish' : 'edit', row, `${row.title} güncellendi.`) : next;
  }

  if (collection === 'navigationItems') {
    next.navigation.items = next.navigation.items.map((item) => (item.id === id ? applyDraftToEntity(collection, item, draft) : item));
    const row = listAdminRows(next, collection).find((item) => item.id === id);
    return row ? withChange(next, module, draft.status === 'active' ? 'publish' : 'edit', row, `${row.title} güncellendi.`) : next;
  }

  const record = next.catalog as unknown as Record<string, BaseEntity[]>;
  record[collection] = (record[collection] ?? []).map((item) => (item.id === id ? applyDraftToEntity(collection, item, draft) : item));
  const row = listAdminRows(next, collection).find((item) => item.id === id);
  return row ? withChange(next, module, draft.status === 'active' ? 'publish' : 'edit', row, `${row.title} güncellendi.`) : next;
}

export function archiveAdminEntity(state: AdminWorkspaceState, collection: AdminMutableCollectionKey, id: string, actor: AdminActor, expectedVersion: number) {
  return recordAdminRevision(state, state, collection, id, actor, 'archived', 'archived', expectedVersion);
}

export function toggleAdminNavigationVisibility(state: AdminWorkspaceState, collection: AdminMutableCollectionKey, id: string, actor: AdminActor) {
  if (collection !== 'navigationGroups' && collection !== 'navigationItems') throw new Error('Görünürlük yalnız menü kayıtlarında değiştirilebilir.');
  const next = clone(state);
  const items = collection === 'navigationGroups' ? next.navigation.groups : next.navigation.items;
  const item = items.find((entry) => entry.id === id);
  if (!item) throw new Error('Menü kaydı bulunamadı.');
  item.isEnabled = !item.isEnabled;
  item.updatedAt = nowIso();
  const row = listAdminRows(next, collection).find((entry) => entry.id === id);
  return row ? withChange(next, 'navigation', 'edit', row, `${row.title} ${item.isEnabled ? 'gösterildi' : 'gizlendi'}.`) : next;
}

export function reorderAdminEntity(state: AdminWorkspaceState, module: AdminModuleKey, collection: AdminMutableCollectionKey, id: string, direction: 'up' | 'down', actor: AdminActor): AdminWorkspaceState {
  let next = clone(state);
  const items = collection === 'navigationGroups'
    ? next.navigation.groups
    : collection === 'navigationItems'
      ? next.navigation.items
      : ((next.catalog as unknown as Record<string, BaseEntity[]>)[collection] ?? []);
  const ordered = [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  const index = ordered.findIndex((item) => item.id === id);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;

  if (index < 0 || swapIndex < 0 || swapIndex >= ordered.length) {
    return state;
  }

  const current = ordered[index];
  const other = ordered[swapIndex];
  ordered[index] = other;
  ordered[swapIndex] = current;
  const changed = ordered.filter((item, position) => item.sortOrder !== (position + 1) * 10);
  ordered.forEach((item, position) => { item.sortOrder = (position + 1) * 10; });
  for (const item of changed) {
    next = recordAdminRevision(next, next, collection, item.id, actor, 'reordered', 'draft', getAdminDocument(next, collection, item.id)?.version ?? 1);
  }
  return next;
}

export function previewAdminDraft(state: AdminWorkspaceState, collection: AdminMutableCollectionKey, draft: AdminEntityDraft, id?: string) {
  const existing = id ? workspaceItems(state, collection).find((item) => item.id === id) : undefined;
  const candidate = existing ? applyDraftToEntity(collection, existing, draft) : makeTypedEntity(state, collection, draft);
  return collection === 'questions' ? buildQuestionSnapshot(state.catalog, candidate as Question, draft.question) : candidate;
}

export function saveAdminContent(state: AdminWorkspaceState, module: AdminModuleKey, collection: AdminMutableCollectionKey, draft: AdminEntityDraft, actor: AdminActor, status: Exclude<PublicationStatus, 'archived'>, id?: string, expectedVersion = 0) {
  const errors = validateAdminEntityDraft(collection, draft);
  if (errors.length) throw new Error(errors.join('\n'));
  const next = id ? updateEntityCandidate(state, module, collection, id, draft) : createEntityCandidate(state, module, collection, draft);
  const entityId = id ?? workspaceItems(next, collection).at(-1)!.id;
  if (collection === 'questions') {
    const index = next.catalog.questions.findIndex((item) => item.id === entityId);
    const snapshot = buildQuestionSnapshot(next.catalog, next.catalog.questions[index], draft.question);
    next.catalog.questions[index] = snapshot;
    next.catalog.questionOptions = [...next.catalog.questionOptions.filter((option) => option.questionId !== entityId), ...snapshot.questionOptions!];
  }
  const action = status === 'published' ? 'published' : status === 'review' ? 'reviewed' : id ? 'updated' : 'created';
  return recordAdminRevision(state, next, collection, entityId, actor, action, status, expectedVersion);
}

export function getReferenceCount(state: AdminWorkspaceState, collection: AdminCollectionKey, id: string) {
  const serializedCatalog = JSON.stringify(state.catalog);
  const serializedNavigation = JSON.stringify(state.navigation);
  const source = collection === 'navigationGroups' || collection === 'navigationItems' ? serializedNavigation : serializedCatalog;
  return (source.match(new RegExp(`"${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g')) ?? []).length;
}

function statusFromEntity(entity: BaseEntity | NavigationGroup | NavigationItem): EntityStatus {
  if ('status' in entity) return entity.status;
  return entity.isEnabled ? 'active' : 'inactive';
}

function descriptionFromEntity(entity: BaseEntity | NavigationGroup | NavigationItem) {
  if ('description' in entity && entity.description) return entity.description;
  if ('route' in entity) return entity.route;
  if ('placement' in entity) return `${entity.placement} menü grubu`;
  return '';
}

function isPremiumFromEntity(entity: BaseEntity | NavigationGroup | NavigationItem) {
  if ('isPremium' in entity) return entity.isPremium;
  if ('requiredPlan' in entity) return entity.requiredPlan === 'premium';
  return false;
}

function relationSummary(state: AdminWorkspaceState, collection: AdminCollectionKey, entity: BaseEntity | NavigationGroup | NavigationItem) {
  if ('route' in entity) {
    return `${entity.route} · grup ${entity.groupId}`;
  }

  if ('placement' in entity) {
    const count = state.navigation.items.filter((item) => item.groupId === entity.id).length;
    return `${count} bağlantı · ${entity.placement}`;
  }

  if (collection === 'readingPracticeScreens') {
    const screen = entity as BaseEntity & Partial<ReadingPracticeScreen>;
    return `${screen.questions?.length ?? 0} soru · ${screen.passageParagraphs?.length ?? 0} paragraf`;
  }

  if ('taxonomy' in entity) {
    const taxonomy = (entity as BaseEntity & { taxonomy?: TaxonomyRef }).taxonomy;
    const breadcrumb = taxonomy ? getTaxonomyBreadcrumb(state.catalog, taxonomy).join(' / ') : '';
    return breadcrumb || 'Sınıflandırma bekleniyor';
  }

  if (collection === 'examVersions' && 'examId' in entity) return `Sınav: ${(entity as BaseEntity & { examId: string }).examId}`;
  if (collection === 'taskTypes' && 'skillId' in entity) return `Beceri: ${(entity as BaseEntity & { skillId: string }).skillId}`;
  if (collection === 'subskills' && 'taskTypeIds' in entity) {
    const taskTypeIds = (entity as BaseEntity & { taskTypeIds?: string[] }).taskTypeIds ?? [];
    return `${taskTypeIds.length} soru türü ilişkisi`;
  }
  if (collection === 'topics' && 'skillIds' in entity) {
    const skillIds = (entity as BaseEntity & { skillIds?: string[] }).skillIds ?? [];
    return `${skillIds.length} beceri ilişkisi`;
  }
  if (collection === 'levels' && 'scale' in entity) {
    const level = entity as BaseEntity & { scale?: string; rank?: number };
    return `${level.scale ?? 'Seviye'} · sıra ${level.rank ?? '-'}`;
  }
  if (collection === 'vocabularyWords' && 'setId' in entity) return `Set: ${(entity as BaseEntity & { setId: string }).setId}`;
  if (collection === 'grammarCategories' && 'topicIds' in entity) {
    const topicIds = (entity as BaseEntity & { topicIds?: string[] }).topicIds ?? [];
    return `${topicIds.length} konu`;
  }
  if (collection === 'grammarTopics' && 'categoryId' in entity) return `Kategori: ${(entity as BaseEntity & { categoryId: string }).categoryId}`;
  return 'Engelleyici ilişki görünmüyor';
}

function rowFromEntity(state: AdminWorkspaceState, collection: AdminCollectionKey, entity: BaseEntity | NavigationGroup | NavigationItem): AdminEntityRow {
  return {
    id: entity.id,
    title: entity.title,
    slug: entity.slug,
    description: descriptionFromEntity(entity),
    status: statusFromEntity(entity),
    visibility: entity.visibility,
    isPremium: isPremiumFromEntity(entity),
    sortOrder: entity.sortOrder,
    updatedAt: entity.updatedAt,
    relationSummary: relationSummary(state, collection, entity),
    secondary: collection,
    referenceCount: getReferenceCount(state, collection, entity.id),
    raw: entity,
    publicationStatus: getAdminDocument(state, collection as AdminMutableCollectionKey, entity.id)?.status,
    version: getAdminDocument(state, collection as AdminMutableCollectionKey, entity.id)?.version,
  };
}

export function listAdminRows(state: AdminWorkspaceState, collection: AdminMutableCollectionKey, config?: AdminCollectionConfig, includeFilteredOut = false): AdminEntityRow[] {
  const items = collection === 'navigationGroups'
    ? state.navigation.groups
    : collection === 'navigationItems'
      ? state.navigation.items
      : collectionItems(state.catalog, collection).filter((item) => includeFilteredOut || contentTypeMatches(state.catalog, item, config));

  return items
    .map((item) => rowFromEntity(state, collection, item))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export function getAdminDashboardMetrics(state: AdminWorkspaceState): AdminDashboardMetrics {
  const contentCollections: AdminMutableCollectionKey[] = ['courses', 'modules', 'lessons', 'readingPracticeScreens', 'vocabularySets', 'vocabularyWords', 'grammarCategories', 'grammarTopics', 'grammarLessons', 'questions', 'practiceSets', 'tests'];
  const rows = contentCollections.flatMap((collection) => listAdminRows(state, collection));

  return {
    publishedContent: rows.filter((row) => getAdminDocument(state, row.secondary as AdminMutableCollectionKey, row.id)?.published).length,
    drafts: rows.filter((row) => row.publicationStatus === 'draft' || row.publicationStatus === 'review').length,
    disabledContent: rows.filter((row) => row.status === 'inactive' || row.status === 'archived').length,
    activeUsers: null,
    validationIssues: validateContentCatalog(state.catalog),
  };
}

export function initialAdminDraft(collection: AdminMutableCollectionKey, row?: AdminEntityRow, catalog?: ContentCatalog): AdminEntityDraft {
  if (row) {
    const raw = row.raw as BaseEntity & Partial<ReadingPracticeScreen> & { prompt?: string; explanation?: string; mediaProvider?: VideoMediaProvider; mediaUrl?: string; courseId?: string; moduleId?: string; thumbnailUrl?: string; previewDurationSeconds?: number; chapters?: { startSeconds: number; title: string }[]; transcript?: { startSeconds: number; text: string }[]; resources?: LessonResource[]; durationSeconds?: number; estimatedMinutes?: number };
    return {
      title: row.title,
      slug: row.slug,
      description: row.description,
      status: row.status,
      visibility: row.visibility,
      isPremium: row.isPremium,
      sortOrder: row.sortOrder,
      prompt: raw.prompt ?? row.title,
      explanation: raw.explanation ?? '',
      ...(collection === 'lessons' ? {
        mediaProvider: raw.mediaProvider as VideoMediaProvider | undefined,
        mediaUrl: raw.mediaUrl ?? '',
        courseId: raw.courseId,
        moduleId: raw.moduleId,
        thumbnailUrl: raw.thumbnailUrl ?? '',
        previewDurationSeconds: raw.previewDurationSeconds ?? 0,
        chaptersText: serializeVideoTimedText(raw.chapters?.map((chapter) => ({ startSeconds: chapter.startSeconds, text: chapter.title }))),
        transcriptText: serializeVideoTimedText(raw.transcript),
        resourcesText: serializeLessonResourcesText(raw.resources),
        durationSeconds: raw.durationSeconds ?? 900,
        estimatedMinutes: raw.estimatedMinutes ?? 15,
      } : {}),
      ...(collection === 'readingPracticeScreens' ? readingPracticeDraftFromScreen(raw, row) : {}),
      ...(collection === 'questions' && catalog ? { question: readQuestionDraft(catalog, row.raw as Question) } : {}),
    };
  }

  return {
    title: '',
    slug: '',
    description: '',
    status: 'draft',
    visibility: 'authenticated',
    isPremium: false,
    sortOrder: nextSortOrder(collection === 'navigationGroups' || collection === 'navigationItems' ? [] : []),
    prompt: '',
    explanation: '',
    ...(collection === 'lessons' ? { mediaProvider: 'youtube' as const, mediaUrl: '', courseId: firstId(catalog?.courses ?? []), moduleId: firstId(catalog?.modules ?? []), thumbnailUrl: '', previewDurationSeconds: 0, chaptersText: '', transcriptText: '', resourcesText: '', durationSeconds: 900, estimatedMinutes: 15 } : {}),
    ...(collection === 'readingPracticeScreens' ? defaultReadingPracticeDraftFields() : {}),
    ...(collection === 'questions' && catalog ? { question: { taxonomy: defaultTaxonomy(catalog, 'question'), stimulus: '', options: [] } } : {}),
  };
}

export function validateAdminEntityDraft(collection: AdminMutableCollectionKey, draft: AdminEntityDraft): string[] {
  const issues: string[] = [];
  if (draft.title.trim().length < 2) issues.push('Title en az 2 karakter olmalı.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizeSlug(draft.slug || draft.title))) issues.push('Slug kebab-case olmalı.');
  if (!adminStatusOptions.includes(draft.status)) issues.push('Status geçerli değil.');
  if (!adminVisibilityOptions.includes(draft.visibility)) issues.push('Visibility geçerli değil.');
  if (collection === 'questions' && (draft.prompt ?? '').trim().length < 8) issues.push('Question prompt en az 8 karakter olmalı.');
  if (collection === 'lessons' && draft.mediaUrl?.trim()) {
    const mediaIssue = validateVideoMediaUrl(draft.mediaProvider, draft.mediaUrl);
    if (mediaIssue) issues.push(mediaIssue);
  }
  if (collection === 'lessons') {
    if ((draft.previewDurationSeconds ?? 0) < 0 || (draft.previewDurationSeconds ?? 0) > (draft.durationSeconds ?? Number.MAX_SAFE_INTEGER)) issues.push('Önizleme süresi video süresini aşamaz.');
    if (draft.chaptersText && parseVideoTimedText(draft.chaptersText).invalidLines.length) issues.push('Bölümler her satırda zaman|başlık biçiminde olmalı.');
    if (draft.transcriptText && parseVideoTimedText(draft.transcriptText).invalidLines.length) issues.push('Transkript her satırda zaman|metin biçiminde olmalı.');
    if (draft.resourcesText && parseLessonResourcesText(draft.resourcesText).invalidLines.length) issues.push('Kaynaklar her satırda başlık|tür|boyut|url|premium biçiminde olmalı.');
  }
  if (collection === 'readingPracticeScreens') {
    const paragraphs = parseReadingPassageText(draft.passageText);
    const parsed = draft.readingQuestions?.length
      ? { questions: normalizeReadingPracticeQuestions(draft.readingQuestions), invalidLines: [] }
      : parseReadingPracticeQuestionsText(draft.readingQuestionsText);
    const questions = normalizeReadingPracticeQuestions(parsed.questions);
    if ((draft.passageTitle ?? '').trim().length < 2) issues.push('Passage başlığı en az 2 karakter olmalı.');
    if (!paragraphs.length) issues.push('Reading passage is required before publishing.');
    if (parsed.invalidLines.length) issues.push('Sorular her blokta soru metni ve A|seçenek biçiminde olmalı. Doğru seçenek için B*|metin kullanın.');
    if (!questions.length) issues.push('Reading practice needs at least one question.');
    if (questions.some((question) => question.prompt.trim().length < 8)) issues.push('Every reading question needs a prompt.');
    if (questions.some((question) => question.options.length !== readingPracticeOptionKeys.length || !readingPracticeOptionKeys.every((key, index) => question.options[index]?.key === key))) issues.push('Every reading question needs exactly five options.');
    if (questions.some((question) => question.options.some((option) => !option.text.trim()))) issues.push('Every reading option needs text.');
    if (questions.some((question) => !question.correctOptionKey || !question.options.some((option) => option.key === question.correctOptionKey))) issues.push('Every reading question needs a correct option.');
    if (questions.some((question) => new Set(question.options.map((option) => option.text.trim().toLocaleLowerCase()).filter(Boolean)).size !== question.options.filter((option) => option.text.trim()).length)) issues.push('Reading option texts must be distinct.');
  }
  return issues;
}

export function defaultQuestionFilters(): AdminQuestionFilters {
  return { skillId: 'all', taskTypeId: 'all', subskillId: 'all', topicId: 'all', levelId: 'all', status: 'all' };
}

export function listAdminQuestionRows(state: AdminWorkspaceState, filters: AdminQuestionFilters): AdminEntityRow[] {
  return listAdminRows(state, 'questions')
    .filter((row) => filters.status === 'all' || row.publicationStatus === filters.status)
    .filter((row) => filters.skillId === 'all' || ((row.raw as BaseEntity & { taxonomy?: TaxonomyRef }).taxonomy?.skillId === filters.skillId))
    .filter((row) => filters.taskTypeId === 'all' || ((row.raw as BaseEntity & { taxonomy?: TaxonomyRef }).taxonomy?.taskTypeId === filters.taskTypeId))
    .filter((row) => filters.subskillId === 'all' || Boolean((row.raw as BaseEntity & { taxonomy?: TaxonomyRef }).taxonomy?.subskillIds.includes(filters.subskillId)))
    .filter((row) => filters.topicId === 'all' || Boolean((row.raw as BaseEntity & { taxonomy?: TaxonomyRef }).taxonomy?.topicIds.includes(filters.topicId)))
    .filter((row) => filters.levelId === 'all' || ((row.raw as BaseEntity & { taxonomy?: TaxonomyRef }).taxonomy?.levelId === filters.levelId));
}

export function validateAdminQuestion(state: AdminWorkspaceState, questionId: string): string[] {
  const question = state.catalog.questions.find((item) => item.id === questionId);
  if (!question) return ['Question bulunamadı.'];

  const issues: string[] = [];
  if (question.prompt.trim().length < 8) issues.push('Prompt eksik veya çok kısa.');
  if (question.status === 'active' && question.optionIds.length < 2) issues.push('Aktif soruda en az iki seçenek olmalı.');
  if (question.correctOptionId && !question.optionIds.includes(question.correctOptionId)) issues.push('Correct option, optionIds içinde bulunmalı.');
  if (question.status === 'active' && !question.correctOptionId) issues.push('Aktif soruda correctOptionId tanımlı olmalı.');

  const catalogIssues = validateContentCatalog(state.catalog).filter((issue: ValidationIssue) => issue.entityId === question.id);
  for (const issue of catalogIssues) {
    issues.push(issue.message);
  }

  return issues;
}

export function collectionSupportsPremium(collection: AdminMutableCollectionKey) {
  return collection !== 'navigationGroups' && collection !== 'navigationItems';
}

export function collectionCanCreate(collection: AdminMutableCollectionKey) {
  return collection !== 'navigationItems' || navigationSeed.items.length > 0;
}

export function collectionLabel(collection: AdminMutableCollectionKey) {
  for (const configs of Object.values(adminModuleCollections)) {
    const match = configs.find((item) => item.key === collection);
    if (match) return match.label;
  }
  return collection;
}

export function contentTypeLabel(catalog: ContentCatalog, contentType?: ContentType) {
  return contentType?.title ?? catalog.contentTypes[0]?.title ?? 'Content';
}
