import { formatVideoTimestamp } from '@/lib/video-media';

export type LearningSkillKey = 'reading' | 'listening' | 'speaking' | 'writing' | 'vocabulary' | 'grammar';
export type LearningFilter = 'all' | 'in-progress' | 'completed' | 'saved';
export type VideoLevel = 'Foundation' | 'Intermediate' | 'Advanced';
export type VideoAccess = 'free' | 'premium';
export type VideoCategoryKey = 'getting-started' | LearningSkillKey | 'test-strategies';
export type VideoCategoryFilterKey = 'all' | VideoCategoryKey;
export type VideoDurationFilter = 'all' | 'under-15' | '15-25' | '25-plus';
export type VideoSortMode = 'recommended' | 'recently-added' | 'most-relevant';
export type VideoStatus = 'draft' | 'active' | 'inactive' | 'archived';

export type SkillTheme = {
  key: LearningSkillKey;
  label: string;
  accent: string;
  soft: string;
  short: string;
};

export type CourseCard = {
  id: string;
  skill: LearningSkillKey;
  title: string;
  description: string;
  progress: number;
  lessonCount: number;
  completedLessons: number;
  lastActivity: string;
  status: Exclude<LearningFilter, 'all'>;
  cta: 'Continue' | 'Review';
  nextLessonId: string;
  focus: string;
};

export type WeeklyLearningTask = {
  day: string;
  title: string;
  duration: string;
  state: 'Planlandı' | 'Sıradaki' | 'Tamamlandı';
  skill: LearningSkillKey;
};

export type RecommendedNext = {
  title: string;
  reason: string;
  duration: string;
  lessonId: string;
  skill: LearningSkillKey;
};

export type VideoLesson = {
  id: string;
  title: string;
  subtitle: string;
  category: VideoCategoryKey;
  course: string;
  module: string;
  skill: LearningSkillKey;
  taskType: string;
  taskTypeLabel: string;
  subskill: string;
  subskillLabel: string;
  topic: string;
  topicLabel: string;
  level: VideoLevel;
  access: VideoAccess;
  duration: string;
  durationMinutes: number;
  durationSeconds?: number;
  instructor: string;
  thumbnail: string;
  isPremium: boolean;
  progress: number;
  saved: boolean;
  updatedAt: string;
  createdAt: string;
  previewMinutes: number;
  previewDuration: number;
  previewDurationSeconds?: number;
  status: VideoStatus;
  mediaProvider?: 'youtube' | 'vimeo' | 'upload';
  mediaUrl?: string;
  tags: string[];
  sortOrder: number;
  recommendedScore: number;
  description: string;
  outcomes: string[];
  chapters: { title: string; duration: string; locked?: boolean }[];
  resources: { title: string; type: 'PDF' | 'Checklist' | 'Worksheet' | 'Template'; premium?: boolean }[];
  transcript: string[];
  transcriptLines?: { startSeconds: number; text: string }[];
  notesPrompt: string;
};

export type VideoFilterOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  description?: string;
};

export type VideoDiscoveryFilters = {
  category: VideoCategoryFilterKey;
  task: string;
  subskill: string;
  level: 'all' | VideoLevel;
  duration: VideoDurationFilter;
  access: 'all' | VideoAccess;
  sort: VideoSortMode;
  query: string;
};

export const skillThemes: Record<LearningSkillKey, SkillTheme> = {
  reading: { key: 'reading', label: 'Reading', accent: '#5b75d8', soft: '#edf1ff', short: 'R' },
  listening: { key: 'listening', label: 'Listening', accent: '#007d73', soft: '#e4f4f1', short: 'L' },
  speaking: { key: 'speaking', label: 'Speaking', accent: '#d99b00', soft: '#fff6d7', short: 'S' },
  writing: { key: 'writing', label: 'Writing', accent: '#f06a3d', soft: '#fff0e9', short: 'W' },
  vocabulary: { key: 'vocabulary', label: 'Vocabulary', accent: '#4d65c7', soft: '#eef2ff', short: 'V' },
  grammar: { key: 'grammar', label: 'Grammar', accent: '#8a5cf6', soft: '#f3efff', short: 'G' },
};

export const myLearningStats = [
  { label: 'Active Courses', value: '6', detail: '4 ders aktif ilerliyor', tone: 'blue' as const },
  { label: 'Completed Lessons', value: '38', detail: '+5 bu hafta', tone: 'teal' as const },
  { label: 'Weekly Goal', value: '245/300 dk', detail: '55 dk kaldı', tone: 'yellow' as const },
  { label: 'Study Streak', value: '4 gün', detail: 'Bugünkü plan hazır', tone: 'orange' as const },
];

export const learningFilters: { value: LearningFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'saved', label: 'Saved' },
];

export const courseCards: CourseCard[] = [
  {
    id: 'reading-foundations',
    skill: 'reading',
    title: 'Reading Foundations',
    description: 'Ana fikir, çıkarım, kelime ve paragraf amacı sorularında stratejik okuma akışı.',
    progress: 62,
    lessonCount: 18,
    completedLessons: 11,
    lastActivity: 'Bugün 09:20',
    status: 'in-progress',
    cta: 'Continue',
    nextLessonId: 'reading-inference-mini-lesson',
    focus: 'Inference sorularında kanıt cümlesi seçimi',
  },
  {
    id: 'listening-note-map',
    skill: 'listening',
    title: 'Listening Note Map',
    description: 'Lecture ve conversation türlerinde amaç, detay ve geçiş sinyallerini yakalama.',
    progress: 48,
    lessonCount: 16,
    completedLessons: 7,
    lastActivity: 'Dün 18:40',
    status: 'in-progress',
    cta: 'Continue',
    nextLessonId: 'listening-note-map-lecture',
    focus: 'Lecture not alma şablonu',
  },
  {
    id: 'speaking-builder',
    skill: 'speaking',
    title: 'Speaking Response Builder',
    description: '45-60 saniyelik cevaplarda akıcılık, yapı ve topic development pratiği.',
    progress: 34,
    lessonCount: 14,
    completedLessons: 5,
    lastActivity: '2 gün önce',
    status: 'saved',
    cta: 'Continue',
    nextLessonId: 'speaking-independent-response',
    focus: 'Estimated Speaking /30 rubric hazırlığı',
  },
  {
    id: 'writing-rubric-lab',
    skill: 'writing',
    title: 'Writing Rubric Lab',
    description: 'Integrated ve academic essay cevaplarında organizasyon ve dil kontrolü.',
    progress: 54,
    lessonCount: 15,
    completedLessons: 8,
    lastActivity: '29 Ağustos',
    status: 'in-progress',
    cta: 'Continue',
    nextLessonId: 'writing-integrated-thesis',
    focus: 'Rubric breakdown ve thesis kalitesi',
  },
  {
    id: 'vocabulary-accelerator',
    skill: 'vocabulary',
    title: 'Vocabulary Accelerator',
    description: 'Akademik word family, collocation ve tekrar kuyruğu ile kelime kalıcılığı.',
    progress: 78,
    lessonCount: 20,
    completedLessons: 16,
    lastActivity: 'Bu hafta',
    status: 'completed',
    cta: 'Review',
    nextLessonId: 'vocabulary-academic-word-family',
    focus: 'Review queue: 24 kelime',
  },
  {
    id: 'grammar-for-writing',
    skill: 'grammar',
    title: 'Grammar for Academic Writing',
    description: 'Clause combining, referans bağlaçları ve cümle netliği için kısa pratikler.',
    progress: 41,
    lessonCount: 12,
    completedLessons: 5,
    lastActivity: 'Geçen hafta',
    status: 'saved',
    cta: 'Continue',
    nextLessonId: 'grammar-clause-combining',
    focus: 'Complex sentence clarity',
  },
];

export const recommendedNext: RecommendedNext = {
  title: 'Listening note map lecture',
  reason: 'Reading ilerlemen iyi; sıradaki skor artışı için listening not alma pratiği öneriliyor.',
  duration: '14 dk',
  lessonId: 'listening-note-map-lecture',
  skill: 'listening',
};

export const weeklyLearningPlan: WeeklyLearningTask[] = [
  { day: 'Pzt', title: 'Reading inference video', duration: '18 dk', state: 'Tamamlandı', skill: 'reading' },
  { day: 'Sal', title: 'Listening lecture notes', duration: '14 dk', state: 'Sıradaki', skill: 'listening' },
  { day: 'Çar', title: 'Speaking response retry', duration: '10 dk', state: 'Planlandı', skill: 'speaking' },
  { day: 'Per', title: 'Writing rubric check', duration: '16 dk', state: 'Planlandı', skill: 'writing' },
];

export const learningTargetGap = {
  currentScore: 86,
  targetScore: 100,
  maxScore: 120,
  message: 'Hedefe 14 puan kaldı. Bu hafta listening ve writing görevleri tamamlanırsa tahmini artış +3 puan.',
};

export const videoStats = [
  { label: 'Total Video Hours', value: '42 sa', detail: 'TOEFL odaklı katalog', tone: 'blue' as const },
  { label: 'Completed Lessons', value: '38', detail: '11 Reading, 7 Listening', tone: 'teal' as const },
  { label: 'Saved Lessons', value: '9', detail: '3 Premium preview', tone: 'yellow' as const },
  { label: 'Recommended Pace', value: '5 ders/hafta', detail: 'Hedef skora göre', tone: 'orange' as const },
];

export const videoSkillTabs: VideoFilterOption<VideoCategoryFilterKey>[] = [
  { value: 'all', label: 'All Skills' },
  { value: 'getting-started', label: 'Getting Started' },
  { value: 'reading', label: 'Reading' },
  { value: 'listening', label: 'Listening' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'writing', label: 'Writing' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'test-strategies', label: 'Test Strategies' },
];

export const videoLevelFilters: VideoFilterOption<'all' | VideoLevel>[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'Foundation', label: 'Foundation' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
];

export const videoDurationFilters: VideoFilterOption<VideoDurationFilter>[] = [
  { value: 'all', label: 'Any Duration' },
  { value: 'under-15', label: 'Under 15 min' },
  { value: '15-25', label: '15-25 min' },
  { value: '25-plus', label: '25+ min' },
];

export const videoAccessFilters: VideoFilterOption<'all' | VideoAccess>[] = [
  { value: 'all', label: 'Free + Premium' },
  { value: 'free', label: 'Free' },
  { value: 'premium', label: 'Premium' },
];

export const videoSortFilters: VideoFilterOption<VideoSortMode>[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'recently-added', label: 'Recently Added' },
  { value: 'most-relevant', label: 'Most Relevant' },
];

export const videoTaskFiltersByCategory: Record<VideoCategoryKey, VideoFilterOption[]> = {
  'getting-started': [
    { value: 'all', label: 'All Getting Started' },
    { value: 'platform-tour', label: 'Platform Tour' },
    { value: 'study-setup', label: 'Study Setup' },
    { value: 'score-roadmap', label: 'Score Roadmap' },
  ],
  reading: [
    { value: 'all', label: 'All Reading' },
    { value: 'main-idea', label: 'Main Idea' },
    { value: 'inference', label: 'Inference' },
    { value: 'vocabulary-in-context', label: 'Vocabulary in Context' },
    { value: 'rhetorical-purpose', label: 'Rhetorical Purpose' },
    { value: 'sentence-simplification', label: 'Sentence Simplification' },
  ],
  listening: [
    { value: 'all', label: 'All Listening' },
    { value: 'choose-a-response', label: 'Choose a Response' },
    { value: 'conversation', label: 'Conversation' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'academic-talk', label: 'Academic Talk' },
    { value: 'question-strategies', label: 'Question Strategies' },
    { value: 'note-taking', label: 'Note Taking' },
    { value: 'mistake-review', label: 'Mistake Review' },
  ],
  speaking: [
    { value: 'all', label: 'All Speaking' },
    { value: 'independent-response', label: 'Independent Response' },
    { value: 'integrated-response', label: 'Integrated Response' },
    { value: 'fluency', label: 'Fluency' },
    { value: 'pronunciation', label: 'Pronunciation' },
  ],
  writing: [
    { value: 'all', label: 'All Writing' },
    { value: 'integrated-writing', label: 'Integrated Writing' },
    { value: 'academic-discussion', label: 'Academic Discussion' },
    { value: 'organization', label: 'Organization' },
    { value: 'rubric-review', label: 'Rubric Review' },
  ],
  vocabulary: [
    { value: 'all', label: 'All Vocabulary' },
    { value: 'academic-word-family', label: 'Academic Word Family' },
    { value: 'collocations', label: 'Collocations' },
    { value: 'campus-life', label: 'Campus Life' },
    { value: 'transitions', label: 'Connectors & Transitions' },
  ],
  grammar: [
    { value: 'all', label: 'All Grammar' },
    { value: 'sentence-structure', label: 'Sentence Structure' },
    { value: 'clauses', label: 'Clauses' },
    { value: 'verb-forms', label: 'Verb Forms' },
    { value: 'writing-grammar', label: 'Writing Grammar' },
  ],
  'test-strategies': [
    { value: 'all', label: 'All Test Strategies' },
    { value: 'time-management', label: 'Time Management' },
    { value: 'section-strategy', label: 'Section Strategy' },
    { value: 'mistake-review', label: 'Mistake Review' },
  ],
};

export const videoSubskillFiltersByTask: Record<string, VideoFilterOption[]> = {
  'main-idea': [
    { value: 'all', label: 'All Main Idea' },
    { value: 'passage-purpose', label: 'Passage Purpose' },
    { value: 'paragraph-summary', label: 'Paragraph Summary' },
  ],
  inference: [
    { value: 'all', label: 'All Inference' },
    { value: 'evidence-match', label: 'Evidence Match' },
    { value: 'answer-elimination', label: 'Answer Elimination' },
  ],
  'academic-talk': [
    { value: 'all', label: 'All Academic Talk' },
    { value: 'main-idea', label: 'Main Idea' },
    { value: 'detail', label: 'Detail' },
    { value: 'speaker-purpose', label: 'Speaker Purpose' },
    { value: 'organization', label: 'Organization' },
  ],
  'note-taking': [
    { value: 'all', label: 'All Note Taking' },
    { value: 'signal-words', label: 'Signal Words' },
    { value: 'lecture-map', label: 'Lecture Map' },
  ],
  'independent-response': [
    { value: 'all', label: 'All Independent Response' },
    { value: 'fluency-coherence', label: 'Fluency & Coherence' },
    { value: 'supporting-reasons', label: 'Supporting Reasons' },
  ],
  'integrated-writing': [
    { value: 'all', label: 'All Integrated Writing' },
    { value: 'thesis-structure', label: 'Thesis Structure' },
    { value: 'source-relationship', label: 'Source Relationship' },
  ],
  'academic-word-family': [
    { value: 'all', label: 'All Word Family' },
    { value: 'word-family', label: 'Word Family' },
    { value: 'context-clues', label: 'Context Clues' },
  ],
  clauses: [
    { value: 'all', label: 'All Clauses' },
    { value: 'clause-combining', label: 'Clause Combining' },
    { value: 'relative-clauses', label: 'Relative Clauses' },
  ],
  'platform-tour': [
    { value: 'all', label: 'All Platform Tour' },
    { value: 'learning-path', label: 'Learning Path' },
  ],
  'time-management': [
    { value: 'all', label: 'All Time Management' },
    { value: 'section-pacing', label: 'Section Pacing' },
    { value: 'review-checkpoints', label: 'Review Checkpoints' },
  ],
};

type VideoLessonSeed = Omit<
  VideoLesson,
  | 'category'
  | 'course'
  | 'module'
  | 'taskType'
  | 'taskTypeLabel'
  | 'subskill'
  | 'subskillLabel'
  | 'topic'
  | 'topicLabel'
  | 'duration'
  | 'thumbnail'
  | 'isPremium'
  | 'createdAt'
  | 'previewDuration'
  | 'status'
  | 'tags'
  | 'sortOrder'
  | 'recommendedScore'
>;

type VideoLessonMetadata = Pick<VideoLesson, 'category' | 'course' | 'module' | 'taskType' | 'taskTypeLabel' | 'subskill' | 'subskillLabel' | 'topic' | 'topicLabel' | 'thumbnail' | 'createdAt' | 'status' | 'tags' | 'recommendedScore'>;

const videoLessonSeeds: VideoLessonSeed[] = [
  {
    id: 'reading-inference-mini-lesson',
    title: 'Reading inference mini dersi',
    subtitle: 'Paragraf amacını bulma ve kanıt cümlesi seçme',
    skill: 'reading',
    level: 'Intermediate',
    access: 'free',
    durationMinutes: 18,
    instructor: 'Mert A.',
    progress: 62,
    saved: true,
    updatedAt: '29 Ağustos 2026',
    previewMinutes: 18,
    description: 'TOEFL iBT Reading sorularında çıkarım yaparken seçenek eleme, kanıt cümlesi bulma ve soru kökünü doğru okuma akışını uygular.',
    outcomes: ['Inference soru köklerini ayırt etme', 'Kanıt cümlesini pasajdan işaretleme', 'Çeldirici seçenekleri hızlı eleme'],
    chapters: [
      { title: 'Soru tipi ve strateji', duration: '04:10' },
      { title: 'Örnek pasaj üzerinde çözüm', duration: '07:40' },
      { title: '6 soruluk mini uygulama', duration: '06:10' },
    ],
    resources: [
      { title: 'Inference question checklist', type: 'Checklist' },
      { title: 'Mini passage worksheet', type: 'Worksheet' },
    ],
    transcript: ['Bu derste çıkarım sorularını kanıt cümlesiyle eşleştiriyoruz.', 'Önce soru kökünü, sonra paragraftaki işaret sözcüklerini okuyun.', 'Cevap seçeneği pasajdaki anlamı genişletir ama pasajın dışına çıkmaz.'],
    notesPrompt: 'Bu ders için kendi kanıt cümlesi kontrol listenizi yazın.',
  },
  {
    id: 'listening-note-map-lecture',
    title: 'Listening note map lecture',
    subtitle: 'Lecture akışında ana fikir, detay ve dönüş sinyalleri',
    skill: 'listening',
    level: 'Foundation',
    access: 'free',
    durationMinutes: 14,
    instructor: 'Zeynep D.',
    progress: 48,
    saved: false,
    updatedAt: '30 Ağustos 2026',
    previewMinutes: 14,
    description: 'Listening lecture kayıtlarında konuşmacı amacı, örnekler, karşılaştırma ve sonuç cümlelerini kısa notlara dönüştürür.',
    outcomes: ['Lecture haritası çıkarma', 'Amaç ve detay ayrımı', 'Notları soru çözümüne bağlama'],
    chapters: [
      { title: 'Lecture yapısı', duration: '03:20' },
      { title: 'Not alma işaretleri', duration: '05:30' },
      { title: 'Soruya geri dönme', duration: '05:10' },
    ],
    resources: [
      { title: 'Listening note map sheet', type: 'Worksheet' },
      { title: 'Signal words mini list', type: 'PDF' },
    ],
    transcript: ['Lecture notlarında her detayı yazmaya çalışmayın.', 'Konuşmacının dönüş yaptığı yerler çoğu zaman soru üretir.', 'Kısa semboller notu hızlandırır ve zihinsel yükü azaltır.'],
    notesPrompt: 'Bugünkü lecture için ana fikir, iki destek detayı ve bir dönüş sinyali not edin.',
  },
  {
    id: 'speaking-independent-response',
    title: 'Speaking independent response',
    subtitle: '45 saniyelik cevapta yapı ve akıcılık',
    skill: 'speaking',
    level: 'Intermediate',
    access: 'premium',
    durationMinutes: 16,
    instructor: 'Burak T.',
    progress: 18,
    saved: true,
    updatedAt: '28 Ağustos 2026',
    previewMinutes: 4,
    description: 'Independent speaking cevabında net claim, iki gerekçe ve kısa sonuç akışını TOEFL rubriğine göre hazırlar.',
    outcomes: ['15 saniyelik hazırlık planı kurma', 'Akıcılık ve telaffuz kontrolü', 'Estimated Speaking /30 için rubric okuma'],
    chapters: [
      { title: 'Cevap şablonu', duration: '04:00' },
      { title: 'Model cevap analizi', duration: '06:30', locked: true },
      { title: 'Kendi cevabını kaydet', duration: '05:30', locked: true },
    ],
    resources: [
      { title: 'Speaking response template', type: 'Template', premium: true },
      { title: 'Rubric breakdown guide', type: 'PDF', premium: true },
    ],
    transcript: ['TOEFL speaking cevabı kısa ama planlı olmalı.', 'Önce iddia, sonra iki destekleyici neden ve net kapanış.', 'Bu dersin tam sürümü Premium kullanıcılar için açılır.'],
    notesPrompt: 'Kendi speaking cevabınız için claim + reason 1 + reason 2 taslağı çıkarın.',
  },
  {
    id: 'writing-integrated-thesis',
    title: 'Writing integrated thesis lab',
    subtitle: 'Okuma ve dinleme bilgisini tek thesis akışına bağlama',
    skill: 'writing',
    level: 'Advanced',
    access: 'premium',
    durationMinutes: 22,
    instructor: 'Selin K.',
    progress: 0,
    saved: false,
    updatedAt: '27 Ağustos 2026',
    previewMinutes: 5,
    description: 'Integrated writing taskinde reading claimleri ile listening itirazlarını organized essay planına dönüştürür.',
    outcomes: ['Integrated task ilişkisini kurma', 'Thesis ve paragraph topic sentence yazma', 'Writing /30 tahmini için rubrik kontrolü'],
    chapters: [
      { title: 'Task analizi', duration: '05:00' },
      { title: 'Essay outline', duration: '08:20', locked: true },
      { title: 'Rubric feedback örneği', duration: '08:40', locked: true },
    ],
    resources: [
      { title: 'Integrated outline template', type: 'Template', premium: true },
      { title: 'Writing rubric checklist', type: 'Checklist', premium: true },
    ],
    transcript: ['Integrated writing cevabında kaynaklar arasındaki ilişki temel puan sinyalidir.', 'Listening çoğu zaman reading claimlerini sınırlar veya reddeder.', 'Final tahmin section score olarak /30 gösterilir.'],
    notesPrompt: 'Reading claim ve listening response eşleştirmesini üç satırda çıkarın.',
  },
  {
    id: 'vocabulary-academic-word-family',
    title: 'Academic word family review',
    subtitle: 'TOEFL metinlerinde sık geçen kelime aileleri',
    skill: 'vocabulary',
    level: 'Foundation',
    access: 'free',
    durationMinutes: 12,
    instructor: 'Akademik Skor',
    progress: 76,
    saved: true,
    updatedAt: '26 Ağustos 2026',
    previewMinutes: 12,
    description: 'Akademik kelime ailelerini örnek cümle, eş anlam ve hızlı tekrar kartlarıyla pekiştirir.',
    outcomes: ['Word family tanıma', 'Context clue kullanma', 'Review queue planlama'],
    chapters: [
      { title: 'Kelime ailesi mantığı', duration: '03:00' },
      { title: 'TOEFL örnekleri', duration: '05:30' },
      { title: 'Hızlı tekrar', duration: '03:30' },
    ],
    resources: [{ title: 'Academic word family list', type: 'PDF' }],
    transcript: ['Bir kelime ailesini tanımak pasajdaki bilinmeyen formları çözmeyi kolaylaştırır.', 'Kelimeyi tek başına değil, cümle içindeki görevine göre okuyun.'],
    notesPrompt: 'Bugün karıştırdığınız üç kelime ailesini yazın.',
  },
  {
    id: 'grammar-clause-combining',
    title: 'Clause combining for clarity',
    subtitle: 'Akademik writing için cümle birleştirme',
    skill: 'grammar',
    level: 'Intermediate',
    access: 'free',
    durationMinutes: 15,
    instructor: 'Ece Y.',
    progress: 41,
    saved: false,
    updatedAt: '25 Ağustos 2026',
    previewMinutes: 15,
    description: 'Complex sentence üretirken anlamı kaybetmeden bağlaç, relative clause ve punctuation kontrolü yapar.',
    outcomes: ['Cümle birleştirme', 'Bağlaç seçimi', 'Writing clarity kontrolü'],
    chapters: [
      { title: 'Clause türleri', duration: '04:20' },
      { title: 'Birleştirme pratiği', duration: '06:40' },
      { title: 'Hata kontrolü', duration: '04:00' },
    ],
    resources: [{ title: 'Clause combining worksheet', type: 'Worksheet' }],
    transcript: ['Uzun cümle her zaman güçlü cümle değildir.', 'Akademik writing için ilişki netliği, uzunluktan daha önemlidir.'],
    notesPrompt: 'Bugünkü pratikten iki cümle birleştirme örneği kaydedin.',
  },
  {
    id: 'toefl-current-roadmap',
    title: 'TOEFL current roadmap',
    subtitle: 'Platform akışı, hedef puan ve çalışma yolu',
    skill: 'reading',
    level: 'Foundation',
    access: 'free',
    durationMinutes: 9,
    instructor: 'Akademik Skor',
    progress: 0,
    saved: false,
    updatedAt: '31 Ağustos 2026',
    previewMinutes: 9,
    description: 'Akademik Skor içindeki ders, pratik, test ve ilerleme akışını TOEFL Current hedefiyle nasıl kullanacağınızı gösterir.',
    outcomes: ['TOEFL Current yol haritasını okuma', 'Video ve pratik içerikleri filtreleme', 'Haftalık çalışma planına bağlanma'],
    chapters: [
      { title: 'Platform yol haritası', duration: '03:00' },
      { title: 'Hedef skora göre içerik seçimi', duration: '03:20' },
      { title: 'Plan ve progress bağlantısı', duration: '02:40' },
    ],
    resources: [{ title: 'Getting started checklist', type: 'Checklist' }],
    transcript: ['Bu kısa başlangıç dersinde çalışma yolunuzu netleştiriyoruz.', 'Önce hedef skorunuzu, sonra skill bazlı önerileri takip edin.', 'Video, pratik ve test ekranları aynı taxonomy üzerinden birbirine bağlanır.'],
    notesPrompt: 'Bu hafta tamamlamak istediğiniz bir skill hedefi ve bir test hedefi yazın.',
  },
  {
    id: 'test-strategy-section-pacing',
    title: 'Section pacing strategy',
    subtitle: 'Mock test içinde zamanı koruma ve işaretli sorulara dönüş',
    skill: 'listening',
    level: 'Intermediate',
    access: 'premium',
    durationMinutes: 17,
    instructor: 'Dr. Michael Brown',
    progress: 0,
    saved: true,
    updatedAt: '24 Ağustos 2026',
    previewMinutes: 5,
    description: 'Mock test sectionlarında süre baskısını azaltmak için checkpoint, flag ve review kararlarını net bir akışa dönüştürür.',
    outcomes: ['Section pacing checkpointleri kurma', 'Flagged soruları doğru zamanda geri alma', 'Yanlış review döngüsünü azaltma'],
    chapters: [
      { title: 'Section timing planı', duration: '04:30' },
      { title: 'Flag ve review kararları', duration: '06:20', locked: true },
      { title: 'Mock test uygulaması', duration: '06:10', locked: true },
    ],
    resources: [
      { title: 'Section pacing worksheet', type: 'Worksheet', premium: true },
      { title: 'Mock test review checklist', type: 'Checklist', premium: true },
    ],
    transcript: ['Test stratejisinde amaç her soruya eşit süre vermek değildir.', 'Checkpointler hangi sorudan sonra hızlanmanız gerektiğini gösterir.', 'Flag sistemi sadece geri dönebileceğiniz sorularda etkili olur.'],
    notesPrompt: 'Bir sonraki mock test için section başına zaman checkpointlerinizi yazın.',
  },
];

const videoLessonMetadata: Record<string, VideoLessonMetadata> = {
  'reading-inference-mini-lesson': {
    category: 'reading',
    course: 'TOEFL Current Reading',
    module: 'Main Idea & Inference',
    taskType: 'inference',
    taskTypeLabel: 'Inference',
    subskill: 'evidence-match',
    subskillLabel: 'Evidence Match',
    topic: 'academic-text-structure',
    topicLabel: 'Academic Text Structure',
    thumbnail: 'skill-reading',
    createdAt: '2026-08-29T09:00:00.000Z',
    status: 'active',
    tags: ['TOEFL', 'TOEFL Current', 'Reading', 'Inference', 'Evidence', 'Practice Set', 'Mini Test'],
    recommendedScore: 93,
  },
  'listening-note-map-lecture': {
    category: 'listening',
    course: 'TOEFL Current Listening',
    module: 'Academic Talk Notes',
    taskType: 'academic-talk',
    taskTypeLabel: 'Academic Talk',
    subskill: 'main-idea',
    subskillLabel: 'Main Idea',
    topic: 'biology-lecture',
    topicLabel: 'Biology Lecture',
    thumbnail: 'academic-hero',
    createdAt: '2026-08-30T09:00:00.000Z',
    status: 'active',
    tags: ['TOEFL', 'TOEFL Current', 'Listening', 'Academic Talk', 'Main Idea', 'Note Taking'],
    recommendedScore: 98,
  },
  'speaking-independent-response': {
    category: 'speaking',
    course: 'TOEFL Current Speaking',
    module: 'Independent Speaking',
    taskType: 'independent-response',
    taskTypeLabel: 'Independent Response',
    subskill: 'fluency-coherence',
    subskillLabel: 'Fluency & Coherence',
    topic: 'role-models',
    topicLabel: 'Role Models',
    thumbnail: 'skill-speaking',
    createdAt: '2026-08-28T09:00:00.000Z',
    status: 'active',
    tags: ['TOEFL', 'Speaking', 'Independent Response', 'Fluency', 'Rubric'],
    recommendedScore: 87,
  },
  'writing-integrated-thesis': {
    category: 'writing',
    course: 'TOEFL Current Writing',
    module: 'Integrated Writing',
    taskType: 'integrated-writing',
    taskTypeLabel: 'Integrated Writing',
    subskill: 'thesis-structure',
    subskillLabel: 'Thesis Structure',
    topic: 'urban-transportation',
    topicLabel: 'Urban Transportation',
    thumbnail: 'skill-writing',
    createdAt: '2026-08-27T09:00:00.000Z',
    status: 'active',
    tags: ['TOEFL', 'Writing', 'Integrated Writing', 'Thesis', 'Academic Essay'],
    recommendedScore: 90,
  },
  'vocabulary-academic-word-family': {
    category: 'vocabulary',
    course: 'TOEFL Current Vocabulary',
    module: 'Academic Core',
    taskType: 'academic-word-family',
    taskTypeLabel: 'Academic Word Family',
    subskill: 'word-family',
    subskillLabel: 'Word Family',
    topic: 'academic-core',
    topicLabel: 'Academic Core',
    thumbnail: 'vocabulary-fallback',
    createdAt: '2026-08-26T09:00:00.000Z',
    status: 'active',
    tags: ['TOEFL', 'Vocabulary', 'Academic Core', 'Word Family', 'Review'],
    recommendedScore: 84,
  },
  'grammar-clause-combining': {
    category: 'grammar',
    course: 'TOEFL Current Grammar',
    module: 'Sentence Structure',
    taskType: 'clauses',
    taskTypeLabel: 'Clauses',
    subskill: 'clause-combining',
    subskillLabel: 'Clause Combining',
    topic: 'complex-sentences',
    topicLabel: 'Complex Sentences',
    thumbnail: 'grammar-fallback',
    createdAt: '2026-08-25T09:00:00.000Z',
    status: 'active',
    tags: ['TOEFL', 'Grammar', 'Clauses', 'Writing Grammar', 'Sentence Structure'],
    recommendedScore: 82,
  },
  'toefl-current-roadmap': {
    category: 'getting-started',
    course: 'TOEFL Current Onboarding',
    module: 'Study Setup',
    taskType: 'platform-tour',
    taskTypeLabel: 'Platform Tour',
    subskill: 'learning-path',
    subskillLabel: 'Learning Path',
    topic: 'score-roadmap',
    topicLabel: 'Score Roadmap',
    thumbnail: 'getting-started',
    createdAt: '2026-08-31T09:00:00.000Z',
    status: 'active',
    tags: ['TOEFL', 'Getting Started', 'Study Plan', 'Score Roadmap', 'Dashboard'],
    recommendedScore: 89,
  },
  'test-strategy-section-pacing': {
    category: 'test-strategies',
    course: 'TOEFL Current Test Strategies',
    module: 'Mock Test Readiness',
    taskType: 'time-management',
    taskTypeLabel: 'Time Management',
    subskill: 'section-pacing',
    subskillLabel: 'Section Pacing',
    topic: 'mock-test-pacing',
    topicLabel: 'Mock Test Pacing',
    thumbnail: 'test-strategy',
    createdAt: '2026-08-24T09:00:00.000Z',
    status: 'active',
    tags: ['TOEFL', 'Test Strategy', 'Mock Test', 'Time Management', 'Mistake Review'],
    recommendedScore: 86,
  },
};

export const videoLessons: VideoLesson[] = videoLessonSeeds.map((lesson, index) => {
  const metadata = videoLessonMetadata[lesson.id];

  if (!metadata) {
    throw new Error(`Missing video lesson metadata for ${lesson.id}`);
  }

  return {
    ...lesson,
    ...metadata,
    duration: `${lesson.durationMinutes} min`,
    durationSeconds: lesson.durationMinutes * 60,
    isPremium: lesson.access === 'premium',
    previewDuration: lesson.previewMinutes,
    previewDurationSeconds: lesson.previewMinutes * 60,
    sortOrder: index + 1,
  };
});

type StoredAdminVideoLesson = {
  id: string;
  title: string;
  description?: string;
  status: VideoStatus;
  sortOrder: number;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
  courseId: string;
  moduleId: string;
  taxonomy: { skillId: string; taskTypeId?: string; subskillIds: string[]; topicIds: string[]; levelId?: string; contentTypeId: string; tagIds: string[] };
  durationSeconds: number;
  mediaProvider?: 'youtube' | 'vimeo' | 'upload';
  mediaUrl?: string;
  thumbnailUrl?: string;
  previewDurationSeconds?: number;
  chapters?: { startSeconds: number; title: string }[];
  transcript?: { startSeconds: number; text: string }[];
};

function readPublishedAdminVideoLessons(): VideoLesson[] {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem('akademik-skor.admin-workspace.v2');
    if (!raw) return [];
    const stored = JSON.parse(raw) as {
      catalog?: {
        lessons?: StoredAdminVideoLesson[];
        contentTypes?: { id: string; slug: string }[];
        skills?: { id: string; slug: string; title: string }[];
        taskTypes?: { id: string; slug: string; title: string }[];
        subskills?: { id: string; slug: string; title: string }[];
        topics?: { id: string; slug: string; title: string }[];
        levels?: { id: string; title: string }[];
        courses?: { id: string; title: string }[];
        modules?: { id: string; title: string }[];
        contentTags?: { id: string; title: string }[];
      };
      workflow?: { documents?: Record<string, { collection: string; published?: StoredAdminVideoLesson | null }> };
    };
    const catalog = stored.catalog;
    if (!catalog?.lessons?.length) return [];
    const videoTypeId = catalog.contentTypes?.find((item) => item.slug === 'video-lesson')?.id;
    const published = stored.workflow?.documents
      ? Object.values(stored.workflow.documents).map((document) => document.collection === 'lessons' ? document.published : null).filter((item): item is StoredAdminVideoLesson => Boolean(item?.status === 'active'))
      : catalog.lessons.filter((item) => item.status === 'active');

    return published
      .filter((lesson) => lesson.taxonomy.contentTypeId === videoTypeId && lesson.mediaProvider && lesson.mediaUrl)
      .map((lesson, index) => {
        const skillItem = catalog.skills?.find((item) => item.id === lesson.taxonomy.skillId);
        const knownSkills: LearningSkillKey[] = ['reading', 'listening', 'speaking', 'writing', 'vocabulary', 'grammar'];
        const skill = knownSkills.includes(skillItem?.slug as LearningSkillKey) ? skillItem!.slug as LearningSkillKey : 'reading';
        const levelTitle = catalog.levels?.find((item) => item.id === lesson.taxonomy.levelId)?.title;
        const level: VideoLevel = levelTitle === 'Advanced' || levelTitle === 'Intermediate' ? levelTitle : 'Foundation';
        const task = catalog.taskTypes?.find((item) => item.id === lesson.taxonomy.taskTypeId);
        const subskill = catalog.subskills?.find((item) => item.id === lesson.taxonomy.subskillIds[0]);
        const topic = catalog.topics?.find((item) => item.id === lesson.taxonomy.topicIds[0]);
        const course = catalog.courses?.find((item) => item.id === lesson.courseId);
        const module = catalog.modules?.find((item) => item.id === lesson.moduleId);
        const minutes = Math.max(1, Math.ceil(lesson.durationSeconds / 60));
        const chapters = (lesson.chapters ?? []).map((chapter, chapterIndex) => {
          const nextStart = lesson.chapters?.[chapterIndex + 1]?.startSeconds ?? lesson.durationSeconds;
          return { title: chapter.title, duration: formatVideoTimestamp(Math.max(0, nextStart - chapter.startSeconds)) };
        });
        return {
          id: lesson.id,
          title: lesson.title,
          subtitle: lesson.description ?? '',
          category: skill,
          course: course?.title ?? 'Video Dersler',
          module: module?.title ?? 'Genel',
          skill,
          taskType: task?.slug ?? '',
          taskTypeLabel: task?.title ?? '',
          subskill: subskill?.slug ?? '',
          subskillLabel: subskill?.title ?? '',
          topic: topic?.slug ?? '',
          topicLabel: topic?.title ?? '',
          level,
          access: lesson.isPremium ? 'premium' : 'free',
          duration: `${minutes} min`,
          durationMinutes: minutes,
          durationSeconds: lesson.durationSeconds,
          instructor: 'Akademik Skor',
          thumbnail: lesson.thumbnailUrl ?? '',
          isPremium: lesson.isPremium,
          progress: 0,
          saved: false,
          updatedAt: lesson.updatedAt,
          createdAt: lesson.createdAt,
          previewMinutes: Math.max(0, Math.ceil((lesson.previewDurationSeconds ?? 0) / 60)),
          previewDuration: Math.max(0, Math.ceil((lesson.previewDurationSeconds ?? 0) / 60)),
          previewDurationSeconds: Math.max(0, lesson.previewDurationSeconds ?? 0),
          status: lesson.status,
          mediaProvider: lesson.mediaProvider,
          mediaUrl: lesson.mediaUrl,
          tags: lesson.taxonomy.tagIds.map((id) => catalog.contentTags?.find((item) => item.id === id)?.title ?? id),
          sortOrder: lesson.sortOrder || index + 1,
          recommendedScore: 0,
          description: lesson.description ?? '',
          outcomes: [],
          chapters,
          resources: [],
          transcript: (lesson.transcript ?? []).map((line) => line.text),
          transcriptLines: lesson.transcript ?? [],
          notesPrompt: '',
        };
      });
  } catch {
    return [];
  }
}

export function getVideoLessonCatalog() {
  const merged = new Map(videoLessons.map((lesson) => [lesson.id, lesson]));
  readPublishedAdminVideoLessons().forEach((lesson) => merged.set(lesson.id, lesson));
  return [...merged.values()];
}

function includesSearch(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

function durationMatches(minutes: number, duration: VideoDurationFilter) {
  if (duration === 'under-15') return minutes < 15;
  if (duration === '15-25') return minutes >= 15 && minutes <= 25;
  if (duration === '25-plus') return minutes > 25;
  return true;
}

function relevanceScore(lesson: VideoLesson, query: string) {
  if (!query) return lesson.recommendedScore;

  const weightedText = [
    lesson.title,
    lesson.subtitle,
    lesson.course,
    lesson.module,
    lesson.taskTypeLabel,
    lesson.subskillLabel,
    lesson.topicLabel,
    lesson.level,
    lesson.instructor,
    lesson.description,
    lesson.tags.join(' '),
  ].join(' ');

  const directMatch = includesSearch(weightedText, query) ? 40 : 0;
  const tagHits = lesson.tags.filter((tag) => includesSearch(tag, query)).length * 12;
  return lesson.recommendedScore + directMatch + tagHits;
}

export function getVideoTaskFilters(category: VideoCategoryFilterKey): VideoFilterOption[] {
  if (category === 'all') return [];
  return videoTaskFiltersByCategory[category] ?? [];
}

export function getVideoSubskillFilters(task: string): VideoFilterOption[] {
  if (task === 'all') return [];
  return videoSubskillFiltersByTask[task] ?? [];
}

export function discoverVideoLessons(filters: VideoDiscoveryFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const catalog = getVideoLessonCatalog();

  return catalog
    .filter((lesson) => {
      const matchesStatus = lesson.status === 'active';
      const matchesCategory = filters.category === 'all' || lesson.category === filters.category;
      const matchesTask = filters.task === 'all' || lesson.taskType === filters.task;
      const matchesSubskill = filters.subskill === 'all' || lesson.subskill === filters.subskill;
      const matchesLevel = filters.level === 'all' || lesson.level === filters.level;
      const matchesDuration = durationMatches(lesson.durationMinutes, filters.duration);
      const matchesAccess = filters.access === 'all' || lesson.access === filters.access;
      const matchesQuery = !normalizedQuery || relevanceScore(lesson, normalizedQuery) > lesson.recommendedScore;
      return matchesStatus && matchesCategory && matchesTask && matchesSubskill && matchesLevel && matchesDuration && matchesAccess && matchesQuery;
    })
    .sort((first, second) => {
      if (filters.sort === 'recently-added') return Date.parse(second.createdAt) - Date.parse(first.createdAt);
      if (filters.sort === 'most-relevant') return relevanceScore(second, normalizedQuery) - relevanceScore(first, normalizedQuery);
      return second.recommendedScore - first.recommendedScore || first.sortOrder - second.sortOrder;
    });
}

export const featuredVideoId = 'reading-inference-mini-lesson';

export function getVideoLessonById(id: string) {
  return getVideoLessonCatalog().find((lesson) => lesson.id === id) ?? null;
}

export function getCourseVideoLessons(currentLessonId: string) {
  const current = getVideoLessonById(currentLessonId);
  if (!current) return [];

  return getVideoLessonCatalog()
    .filter((lesson) => lesson.status === 'active' && lesson.course === current.course)
    .sort((first, second) => first.sortOrder - second.sortOrder || Date.parse(first.createdAt) - Date.parse(second.createdAt) || first.title.localeCompare(second.title));
}

function relatedLessonScore(current: VideoLesson, candidate: VideoLesson) {
  let score = candidate.recommendedScore;
  if (candidate.course === current.course) score += 60;
  if (candidate.module === current.module) score += 35;
  if (candidate.skill === current.skill) score += 28;
  if (candidate.taskType && candidate.taskType === current.taskType) score += 22;
  if (candidate.subskill && candidate.subskill === current.subskill) score += 18;
  if (candidate.topic && candidate.topic === current.topic) score += 12;
  if (candidate.level === current.level) score += 6;
  if (candidate.progress > 0 && candidate.progress < 100) score += 8;
  if (!candidate.isPremium) score += 4;
  return score;
}

export function getRelatedVideoLessons(currentLessonId: string) {
  const current = getVideoLessonById(currentLessonId);
  const catalog = getVideoLessonCatalog().filter((lesson) => lesson.status === 'active');
  if (!current) return catalog.slice(0, 3);

  return catalog
    .filter((lesson) => lesson.id !== currentLessonId)
    .map((lesson) => ({ lesson, score: relatedLessonScore(current, lesson) }))
    .sort((first, second) => second.score - first.score || first.lesson.sortOrder - second.lesson.sortOrder || first.lesson.title.localeCompare(second.lesson.title))
    .map(({ lesson }) => lesson);
}
