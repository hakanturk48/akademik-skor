import type { AuthRole } from '@/lib/auth';
import type { BaseEntity, CatalogCollectionName, ContentCatalog, EntityStatus, QuestionOption, ReadingPracticeQuestion, TaxonomyRef, ValidationIssue, Visibility } from '@/lib/content';
import type { VideoMediaProvider } from '@/lib/video-media';
import type { NavigationGroup, NavigationItem } from '@/lib/navigation';

export type AdminModuleKey =
  | 'dashboard'
  | 'page-builder'
  | 'navigation'
  | 'taxonomy'
  | 'courses'
  | 'video-lessons'
  | 'reading-practice'
  | 'vocabulary'
  | 'grammar'
  | 'question-bank'
  | 'practice-sets'
  | 'mini-tests';

export type AdminIconKey =
  | 'dashboard'
  | 'builder'
  | 'navigation'
  | 'taxonomy'
  | 'courses'
  | 'video'
  | 'reading'
  | 'vocabulary'
  | 'grammar'
  | 'questions'
  | 'practice'
  | 'tests';

export type AdminCollectionKey =
  | CatalogCollectionName
  | 'navigationGroups'
  | 'navigationItems';

export type AdminMutableCollectionKey =
  | 'navigationGroups'
  | 'navigationItems'
  | 'exams'
  | 'examVersions'
  | 'skills'
  | 'taskTypes'
  | 'subskills'
  | 'topics'
  | 'levels'
  | 'courses'
  | 'modules'
  | 'lessons'
  | 'vocabularySets'
  | 'vocabularyWords'
  | 'grammarCategories'
  | 'grammarTopics'
  | 'grammarLessons'
  | 'questions'
  | 'readingPracticeScreens'
  | 'practiceSets'
  | 'tests';

export type AdminAccessDecision = {
  allowed: boolean;
  reason?: string;
  requiredRole?: AuthRole;
};

export type AdminModuleConfig = {
  key: AdminModuleKey;
  title: string;
  description: string;
  iconKey: AdminIconKey;
};

export type AdminCollectionConfig = {
  key: AdminMutableCollectionKey;
  label: string;
  singularLabel: string;
  description: string;
  contentTypeSlug?: string;
};

export type AdminChangeLogEntry = {
  id: string;
  at: string;
  module: AdminModuleKey;
  action: 'create' | 'edit' | 'disable' | 'reorder' | 'publish';
  entityId: string;
  entityTitle: string;
  detail: string;
};

export type AdminNavigationState = {
  groups: NavigationGroup[];
  items: NavigationItem[];
};

export type AdminWorkspaceState = {
  catalog: ContentCatalog;
  navigation: AdminNavigationState;
  changes: AdminChangeLogEntry[];
  workflow?: AdminWorkflowState;
  pageBuilder?: AdminPageBuilderState;
};

export type PageBuilderComponentType =
  | 'HeroBanner'
  | 'StatsGrid'
  | 'ContinueLearning'
  | 'SkillCards'
  | 'CourseGrid'
  | 'VideoGrid'
  | 'FilterBar'
  | 'CategoryTabs'
  | 'VocabularySetGrid'
  | 'VocabularyPracticeLauncher'
  | 'GrammarTopicGrid'
  | 'GrammarPracticeLauncher'
  | 'MiniTestBuilder'
  | 'AudioPractice'
  | 'Recommendations'
  | 'RecentActivity'
  | 'StudyPlanWidget'
  | 'ProgressChart'
  | 'Heatmap'
  | 'PricingCards'
  | 'FAQ'
  | 'CustomCTA';

export type PageBuilderPageKind = 'system' | 'content';
export type PageBuilderStatus = 'draft' | 'review' | 'published' | 'archived';
export type PageBuilderAudience = 'all' | 'authenticated' | 'premium';
export type PageBuilderDesktopWidth = 'full' | 'wide' | 'half';
export type PageBuilderTabletBehavior = 'stack' | 'columns';
export type PageBuilderMobileBehavior = 'stack' | 'hide';

export type PageBuilderResponsiveRules = {
  desktopWidth: PageBuilderDesktopWidth;
  tablet: PageBuilderTabletBehavior;
  mobile: PageBuilderMobileBehavior;
};

export type PageBuilderSectionConfiguration = Record<string, string | number | boolean | string[]>;

export type PageBuilderSection = {
  id: string;
  pageId: string;
  componentType: PageBuilderComponentType;
  sortOrder: number;
  isVisible: boolean;
  configuration: PageBuilderSectionConfiguration;
  responsiveRules: PageBuilderResponsiveRules;
  audience: PageBuilderAudience;
  requiredPlan: 'free' | 'premium' | null;
  locked?: boolean;
};

export type PageBuilderTab = {
  id: string;
  pageId: string;
  type: 'content' | 'system';
  title: string;
  slug: string;
  sortOrder: number;
  isVisible: boolean;
  componentType?: PageBuilderComponentType;
  content?: string;
  locked?: boolean;
};

export type PageBuilderVersion = {
  version: number;
  status: PageBuilderStatus;
  sections: PageBuilderSection[];
  tabs: PageBuilderTab[];
  createdBy: AdminActor | null;
  updatedBy: AdminActor | null;
  publishedBy: AdminActor | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  restoredFrom?: number;
};

export type PageBuilderPage = {
  id: string;
  slug: string;
  title: string;
  kind: PageBuilderPageKind;
  locked: boolean;
  allowedComponentTypes: PageBuilderComponentType[];
  versions: PageBuilderVersion[];
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type PageBuilderAuditEntry = {
  id: string;
  action: 'created' | 'updated' | 'published' | 'restored' | 'tab-updated';
  pageId: string;
  sectionId?: string;
  user: AdminActor | null;
  timestamp: string;
  summary: string;
};

export type AdminPageBuilderState = {
  schemaVersion: 1;
  pages: PageBuilderPage[];
  audit: PageBuilderAuditEntry[];
};

export type PublicationStatus = 'draft' | 'review' | 'published' | 'archived';
export type AdminActor = { id: string; email: string; role: AuthRole };
export type AdminSnapshot = (BaseEntity | NavigationGroup | NavigationItem) & {
  questionOptions?: QuestionOption[];
  createdBy?: AdminActor | null;
  updatedBy?: AdminActor | null;
  publishedBy?: AdminActor | null;
  publishedAt?: string | null;
  version?: number;
};
export type VersionDiff = { path: string; before: unknown; after: unknown };
export type AdminRevision = {
  version: number;
  status: PublicationStatus;
  snapshot: AdminSnapshot;
  actor: AdminActor | null;
  timestamp: string;
  action: 'migrated' | 'created' | 'updated' | 'reviewed' | 'published' | 'archived' | 'restored' | 'reordered';
  restoredFrom?: number;
  diff: VersionDiff[];
};
export type AdminDocument = {
  collection: AdminMutableCollectionKey;
  entityId: string;
  status: PublicationStatus;
  version: number;
  published: AdminSnapshot | null;
  revisions: AdminRevision[];
};
export type AdminAuditEntry = {
  id: string;
  user: AdminActor | null;
  action: AdminRevision['action'];
  entityType: string;
  entityId: string;
  timestamp: string;
  summary: string;
  version: number;
};
export type AdminWorkflowState = {
  schemaVersion: 2;
  revision: number;
  documents: Record<string, AdminDocument>;
  audit: AdminAuditEntry[];
};

export type AdminEntityDraft = {
  question?: AdminQuestionDraft;
  title: string;
  slug: string;
  description: string;
  status: EntityStatus;
  visibility: Visibility;
  isPremium: boolean;
  sortOrder: number;
  prompt?: string;
  explanation?: string;
  mediaProvider?: VideoMediaProvider;
  mediaUrl?: string;
  courseId?: string;
  moduleId?: string;
  thumbnailUrl?: string;
  previewDurationSeconds?: number;
  transcriptText?: string;
  chaptersText?: string;
  resourcesText?: string;
  durationSeconds?: number;
  estimatedMinutes?: number;
  subtitle?: string;
  questionType?: string;
  timeLimitSeconds?: number;
  timeRemainingSeconds?: number;
  currentQuestionIndex?: number;
  answeredCount?: number;
  markedCount?: number;
  wordCount?: number;
  sourceLabel?: string;
  passageTitle?: string;
  passageText?: string;
  readingQuestionsText?: string;
  readingQuestions?: ReadingPracticeQuestion[];
  supportFocusTitle?: string;
  supportFocusText?: string;
  supportProgress?: number;
  reviewTitle?: string;
  reviewTipsText?: string;
};

export type AdminQuestionDraft = {
  taxonomy: TaxonomyRef;
  stimulus: string;
  options: { id: string; body: string; rationale: string }[];
  correctOptionId?: string;
};

export type AdminEntityRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: EntityStatus;
  visibility: Visibility;
  isPremium: boolean;
  sortOrder: number;
  updatedAt: string;
  relationSummary: string;
  secondary: string;
  referenceCount: number;
  raw: BaseEntity | NavigationGroup | NavigationItem;
  publicationStatus?: PublicationStatus;
  version?: number;
};

export type AdminDashboardMetrics = {
  publishedContent: number;
  drafts: number;
  disabledContent: number;
  activeUsers: number | null;
  validationIssues: ValidationIssue[];
};

export type AdminQuestionFilters = {
  skillId: string;
  taskTypeId: string;
  subskillId: string;
  topicId: string;
  levelId: string;
  status: 'all' | PublicationStatus;
};
