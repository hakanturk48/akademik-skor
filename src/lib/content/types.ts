export type EntityStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type Visibility = 'public' | 'authenticated' | 'private';
export type PlanKey = 'free' | 'premium' | 'internal';

export interface BaseEntity {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: EntityStatus;
  sortOrder: number;
  visibility: Visibility;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxonomyRef {
  examId: string;
  examVersionId: string;
  skillId: string;
  taskTypeId?: string;
  subskillIds: string[];
  topicIds: string[];
  levelId?: string;
  contentTypeId: string;
  tagIds: string[];
}

export interface TaxonomySlugPath {
  examSlug: string;
  examVersionSlug: string;
  skillSlug: string;
  taskTypeSlug?: string;
  subskillSlug?: string;
  topicSlug?: string;
  levelSlug?: string;
  contentTypeSlug: string;
  tagSlugs?: string[];
}

export interface Exam extends BaseEntity {
  familySlug: string;
}

export interface ExamVersion extends BaseEntity {
  examId: string;
  versionCode: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface Skill extends BaseEntity {
  shortCode: string;
  colorToken?: string;
  iconToken?: string;
}

export interface TaskType extends BaseEntity {
  skillId: string;
}

export interface Subskill extends BaseEntity {
  skillId: string;
  taskTypeIds: string[];
}

export interface Topic extends BaseEntity {
  parentTopicId?: string;
  skillIds: string[];
}

export interface Level extends BaseEntity {
  scale: string;
  rank: number;
}

export interface ContentType extends BaseEntity {
  collection: ContentCollectionName;
}

export interface ContentTag extends BaseEntity {
  groupSlug: string;
}

export interface Course extends BaseEntity {
  examVersionId: string;
  primarySkillId: string;
  taxonomy: TaxonomyRef;
  moduleIds: string[];
}

export interface Module extends BaseEntity {
  courseId: string;
  taxonomy: TaxonomyRef;
  lessonIds: string[];
}

export interface LessonChapter {
  startSeconds: number;
  title: string;
}

export interface LessonTranscriptLine {
  startSeconds: number;
  text: string;
}

export interface Lesson extends BaseEntity {
  courseId: string;
  moduleId: string;
  taxonomy: TaxonomyRef;
  durationSeconds: number;
  estimatedMinutes: number;
  mediaProvider?: 'youtube' | 'vimeo' | 'upload';
  mediaUrl?: string;
  thumbnailUrl?: string;
  previewDurationSeconds?: number;
  chapters?: LessonChapter[];
  transcript?: LessonTranscriptLine[];
  transcriptId?: string;
}

export interface VocabularySet extends BaseEntity {
  taxonomy: TaxonomyRef;
  wordIds: string[];
  targetLevelId: string;
}

export interface VocabularyWord extends BaseEntity {
  setId: string;
  term: string;
  meaning: string;
  partOfSpeech?: string;
  example?: string;
  levelId: string;
  tagIds: string[];
}

export interface VocabularyProgress extends BaseEntity {
  userId: string;
  wordId: string;
  masteryPercent: number;
  reviewDueAt?: string;
  lastReviewedAt?: string;
  state?: 'new' | 'learning' | 'improving' | 'strong' | 'mastered';
  nextReviewAt?: string;
  correctStreak?: number;
  incorrectCount?: number;
  reviewCount?: number;
  difficulty?: number;
  interval?: number;
  saved?: boolean;
}

export interface GrammarCategory extends BaseEntity {
  skillId: string;
  topicIds: string[];
}

export interface GrammarTopic extends BaseEntity {
  categoryId: string;
  levelId: string;
  taxonomy: TaxonomyRef;
  lessonIds: string[];
}

export interface GrammarLesson extends BaseEntity {
  topicId: string;
  taxonomy: TaxonomyRef;
  estimatedMinutes: number;
  practiceSetIds: string[];
}

export interface GrammarProgress extends BaseEntity {
  userId: string;
  grammarTopicId: string;
  masteryPercent: number;
  completedLessonIds: string[];
}

export interface PracticeSet extends BaseEntity {
  taxonomy: TaxonomyRef;
  questionIds: string[];
  estimatedMinutes: number;
  timeLimitSeconds?: number;
}

export interface Question extends BaseEntity {
  taxonomy: TaxonomyRef;
  prompt: string;
  stimulus?: string;
  optionIds: string[];
  correctOptionId?: string;
  explanation?: string;
}

export interface QuestionOption extends BaseEntity {
  questionId: string;
  optionKey: string;
  body: string;
  isCorrect: boolean;
  rationale?: string;
}

export interface Test extends BaseEntity {
  taxonomy: TaxonomyRef;
  sectionIds: string[];
  totalMinutes: number;
  totalQuestions: number;
}

export interface TestSection extends BaseEntity {
  testId: string;
  skillId: string;
  taskTypeId: string;
  questionIds: string[];
  timeLimitSeconds: number;
}

export interface Attempt extends BaseEntity {
  userId: string;
  testId?: string;
  practiceSetId?: string;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  answerIds: string[];
}

export interface Answer extends BaseEntity {
  attemptId: string;
  questionId: string;
  selectedOptionId?: string;
  textResponse?: string;
  isCorrect?: boolean;
  score?: number;
}

export interface SpeakingTask extends BaseEntity {
  taxonomy: TaxonomyRef;
  prompt: string;
  preparationSeconds: number;
  responseSeconds: number;
  rubricTagIds: string[];
}

export interface SpeakingAttempt extends BaseEntity {
  userId: string;
  speakingTaskId: string;
  startedAt: string;
  submittedAt?: string;
  audioUrl?: string;
  score?: number;
  feedback?: string;
}

export interface WritingTask extends BaseEntity {
  taxonomy: TaxonomyRef;
  prompt: string;
  stimulusIds: string[];
  minWords?: number;
  maxWords?: number;
  timeLimitSeconds?: number;
  rubricTagIds: string[];
}

export interface WritingSubmission extends BaseEntity {
  userId: string;
  writingTaskId: string;
  submittedAt?: string;
  wordCount: number;
  score?: number;
  body: string;
  feedback?: string;
}

export interface ContentProgress extends BaseEntity {
  userId: string;
  contentTypeId: string;
  contentId: string;
  startedAt?: string;
  completedAt?: string;
  progressPercent: number;
  lastPositionSeconds?: number;
}

export interface StudyPlan extends BaseEntity {
  userId: string;
  examVersionId: string;
  targetScore?: number;
  targetDate?: string;
  taskIds: string[];
}

export interface StudyPlanTask extends BaseEntity {
  studyPlanId: string;
  contentTypeId: string;
  contentId: string;
  skillId: string;
  scheduledFor: string;
  estimatedMinutes: number;
  completedAt?: string;
}

export interface Entitlement extends BaseEntity {
  planKey: PlanKey;
  featureKey: string;
  limit?: number;
  enabled: boolean;
}

export interface FeatureConfig extends BaseEntity {
  featureKey: string;
  planKey: PlanKey;
  enabled: boolean;
  limit?: number;
  metadata: Record<string, string | number | boolean>;
}

export interface ContentCatalog {
  exams: Exam[];
  examVersions: ExamVersion[];
  skills: Skill[];
  taskTypes: TaskType[];
  subskills: Subskill[];
  topics: Topic[];
  levels: Level[];
  contentTypes: ContentType[];
  contentTags: ContentTag[];
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
  vocabularySets: VocabularySet[];
  vocabularyWords: VocabularyWord[];
  vocabularyProgress: VocabularyProgress[];
  grammarCategories: GrammarCategory[];
  grammarTopics: GrammarTopic[];
  grammarLessons: GrammarLesson[];
  grammarProgress: GrammarProgress[];
  practiceSets: PracticeSet[];
  questions: Question[];
  questionOptions: QuestionOption[];
  tests: Test[];
  testSections: TestSection[];
  attempts: Attempt[];
  answers: Answer[];
  speakingTasks: SpeakingTask[];
  speakingAttempts: SpeakingAttempt[];
  writingTasks: WritingTask[];
  writingSubmissions: WritingSubmission[];
  contentProgress: ContentProgress[];
  studyPlans: StudyPlan[];
  studyPlanTasks: StudyPlanTask[];
  entitlements: Entitlement[];
  featureConfigs: FeatureConfig[];
}

export type TaxonomyCollectionName =
  | 'exams'
  | 'examVersions'
  | 'skills'
  | 'taskTypes'
  | 'subskills'
  | 'topics'
  | 'levels'
  | 'contentTypes'
  | 'contentTags';

export type ContentCollectionName =
  | 'courses'
  | 'modules'
  | 'lessons'
  | 'vocabularySets'
  | 'grammarLessons'
  | 'practiceSets'
  | 'questions'
  | 'tests'
  | 'speakingTasks'
  | 'writingTasks';

export type CatalogCollectionName = keyof ContentCatalog;

export type AnyTaxonomizedContent =
  | Course
  | Module
  | Lesson
  | VocabularySet
  | GrammarLesson
  | PracticeSet
  | Question
  | Test
  | SpeakingTask
  | WritingTask;

export interface ContentLookupQuery extends Partial<TaxonomySlugPath> {
  includeInactive?: boolean;
  isPremium?: boolean;
}

export interface ValidationIssue {
  code: string;
  collection?: CatalogCollectionName;
  entityId?: string;
  message: string;
}

