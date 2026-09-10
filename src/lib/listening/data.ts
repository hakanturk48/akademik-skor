import type {
  ListeningContinueItem,
  ListeningDifficulty,
  ListeningLearningChainItem,
  ListeningLength,
  ListeningMetric,
  ListeningPracticeMode,
  ListeningRecommendation,
  ListeningSelection,
  ListeningSubskill,
  ListeningTaskType,
} from './types';

export const listeningMetrics: ListeningMetric[] = [
  { id: 'mastery', label: 'Listening Mastery', value: '74 / 100', note: '+3 this week', progress: 74, tone: 'blue', iconKey: 'headphones' },
  { id: 'practice-week', label: 'Practice This Week', value: '4 sessions', note: '96 minutes total', progress: 4, max: 6, tone: 'teal', iconKey: 'check' },
  { id: 'weakest', label: 'Weakest Subskill', value: 'Detail', note: '68% recent accuracy', progress: 68, tone: 'orange', iconKey: 'target' },
  { id: 'recent-best', label: 'Recent Best', value: '24 / 30', note: 'Academic Talk set', progress: 80, tone: 'purple', iconKey: 'star' },
];

export const listeningPracticeModes: ListeningPracticeMode[] = [
  {
    id: 'quick-listening',
    title: 'Quick Listening',
    description: 'A short set for daily momentum with replay and brief explanations.',
    tone: 'teal',
    iconKey: 'play',
    sessionMode: 'practice',
    defaultLengthId: 'quick',
  },
  {
    id: 'focused-practice',
    title: 'Focused Practice',
    description: 'Choose task type, subskill, difficulty, and length before starting.',
    tone: 'blue',
    iconKey: 'target',
    sessionMode: 'practice',
    defaultLengthId: 'standard',
  },
  {
    id: 'full-section-practice',
    title: 'Full Section Practice',
    description: 'Exam-like timing with delayed feedback and limited transcript access.',
    tone: 'orange',
    iconKey: 'clock',
    sessionMode: 'exam',
    defaultLengthId: 'extended',
  },
  {
    id: 'review-mistakes',
    title: 'Review Mistakes',
    description: 'Revisit missed questions and rebuild notes around weak details.',
    tone: 'purple',
    iconKey: 'refresh',
    sessionMode: 'practice',
    defaultLengthId: 'quick',
  },
];

export const listeningTaskTypes: ListeningTaskType[] = [
  {
    id: 'choose-response',
    title: 'Choose a Response',
    description: 'Short conversations that ask for the best reply or next response.',
    examples: 'Campus service desk, office-hours exchange, advisor conversation',
    tone: 'teal',
    sortOrder: 10,
  },
  {
    id: 'conversation',
    title: 'Conversation',
    description: 'Student-life conversations with purpose, function, and attitude questions.',
    examples: 'Registrar, library, housing, professor-student conversations',
    tone: 'blue',
    sortOrder: 20,
  },
  {
    id: 'announcement',
    title: 'Announcement',
    description: 'Campus announcements where structure and key details matter.',
    examples: 'Schedule changes, campus events, policy updates',
    tone: 'orange',
    sortOrder: 30,
  },
  {
    id: 'academic-talk',
    title: 'Academic Talk',
    description: 'Lecture-style listening with note-taking, main idea, and detail questions.',
    examples: 'Biology, history, psychology, environmental science',
    tone: 'purple',
    sortOrder: 40,
  },
];

export const listeningSubskills: ListeningSubskill[] = [
  { id: 'main-idea', title: 'Main Idea', description: 'Identify the central point and lecture organization.', taskTypeIds: ['conversation', 'announcement', 'academic-talk'], mastery: 82, recentErrors: 2, sortOrder: 10 },
  { id: 'purpose', title: 'Purpose', description: 'Recognize why a speaker says something or why the talk is given.', taskTypeIds: ['choose-response', 'conversation', 'announcement', 'academic-talk'], mastery: 78, recentErrors: 3, sortOrder: 20 },
  { id: 'detail', title: 'Detail', description: 'Capture specific facts, examples, and stated relationships.', taskTypeIds: ['choose-response', 'conversation', 'announcement', 'academic-talk'], mastery: 68, recentErrors: 6, sortOrder: 30 },
  { id: 'inference', title: 'Inference', description: 'Infer meaning from speaker context and implied relationships.', taskTypeIds: ['conversation', 'academic-talk'], mastery: 71, recentErrors: 5, sortOrder: 40 },
  { id: 'attitude', title: 'Attitude', description: 'Notice tone, hesitation, emphasis, and speaker stance.', taskTypeIds: ['choose-response', 'conversation', 'academic-talk'], mastery: 73, recentErrors: 4, sortOrder: 50 },
  { id: 'function', title: 'Function', description: 'Understand the role of a sentence within the exchange.', taskTypeIds: ['choose-response', 'conversation', 'academic-talk'], mastery: 76, recentErrors: 3, sortOrder: 60 },
  { id: 'note-taking', title: 'Note Taking', description: 'Map ideas, transitions, and examples while listening.', taskTypeIds: ['announcement', 'academic-talk'], mastery: 70, recentErrors: 5, sortOrder: 70 },
];

export const listeningDifficulties: ListeningDifficulty[] = [
  { id: 'adaptive', title: 'Adaptive', description: 'Starts from your current mastery and adjusts the set.' },
  { id: 'easy', title: 'Easy', description: 'Clear speech, shorter audio, fewer distractors.' },
  { id: 'medium', title: 'Medium', description: 'Standard TOEFL pace with realistic answer choices.' },
  { id: 'hard', title: 'Hard', description: 'Dense lecture language and closer distractors.' },
];

export const listeningLengths: ListeningLength[] = [
  { id: 'quick', title: 'Quick', description: '1 audio, 5 questions', minutes: 8, questionCount: 5 },
  { id: 'standard', title: 'Standard', description: '2 audios, 10 questions', minutes: 18, questionCount: 10 },
  { id: 'extended', title: 'Extended', description: 'Full section rhythm', minutes: 36, questionCount: 20 },
];

export const defaultListeningSelection: ListeningSelection = {
  taskTypeId: 'academic-talk',
  subskillId: 'note-taking',
  difficultyId: 'adaptive',
  lengthId: 'standard',
  sessionMode: 'practice',
};

export const listeningContinueItem: ListeningContinueItem = {
  id: 'lecture-03-note-taking',
  title: 'Lecture 03 - Note Taking',
  subtitle: 'Academic Talk - Note Taking - 43% complete',
  taskTypeId: 'academic-talk',
  subskillId: 'note-taking',
  difficultyId: 'adaptive',
  lengthId: 'standard',
  sessionMode: 'practice',
  progress: 43,
  lastActivity: 'Resumed from 10:28',
};

export const listeningRecommendations: ListeningRecommendation[] = [
  {
    id: 'detail-academic-talk-standard',
    title: 'Detail Questions - Academic Talk',
    reason: 'Detail accuracy is your lowest recent listening subskill.',
    taskTypeId: 'academic-talk',
    subskillId: 'detail',
    difficultyId: 'adaptive',
    lengthId: 'standard',
    sessionMode: 'practice',
    priority: 1,
    estimatedMinutes: 18,
  },
  {
    id: 'conversation-function-quick',
    title: 'Function in Conversations',
    reason: 'You missed speaker-function items in your last two sets.',
    taskTypeId: 'conversation',
    subskillId: 'function',
    difficultyId: 'medium',
    lengthId: 'quick',
    sessionMode: 'practice',
    priority: 2,
    estimatedMinutes: 8,
  },
  {
    id: 'section-exam-listening',
    title: 'Timed Listening Section',
    reason: 'Use exam mode after two focused practice sessions.',
    taskTypeId: 'academic-talk',
    subskillId: 'main-idea',
    difficultyId: 'medium',
    lengthId: 'extended',
    sessionMode: 'exam',
    priority: 3,
    estimatedMinutes: 36,
  },
];

export const listeningLearningChains: Record<string, ListeningLearningChainItem[]> = {
  'academic-talk:detail': [
    { id: 'video-detail-academic-talk', type: 'strategy-video', title: 'Strategy Video', description: 'Watch how lecture examples signal testable details.', href: '/learning/videos?skill=listening&task=academic-talk&subskill=detail', tone: 'blue', iconKey: 'play', isPremium: false },
    { id: 'practice-detail-academic-talk', type: 'guided-practice', title: 'Guided Practice', description: 'Replay with notes, explanation, and immediate review.', href: '/practice/listening?mode=practice&task=academic-talk&subskill=detail&difficulty=adaptive&length=standard', tone: 'teal', iconKey: 'notes', isPremium: false },
    { id: 'mini-detail-academic-talk', type: 'mini-test', title: 'Mini Test', description: 'Finish with a short timed detail check.', href: '/tests/mini?skill=listening&task=academic-talk&subskill=detail', tone: 'orange', iconKey: 'quiz', isPremium: false },
  ],
  'academic-talk:note-taking': [
    { id: 'video-note-taking', type: 'strategy-video', title: 'Strategy Video', description: 'Review map-style notes for lecture structure.', href: '/learning/videos?skill=listening&task=academic-talk&subskill=note-taking', tone: 'blue', iconKey: 'play', isPremium: false },
    { id: 'practice-note-taking', type: 'guided-practice', title: 'Guided Practice', description: 'Practice note-taking with replay and guided prompts.', href: '/practice/listening?mode=practice&task=academic-talk&subskill=note-taking&difficulty=adaptive&length=standard', tone: 'teal', iconKey: 'notes', isPremium: false },
    { id: 'mini-note-taking', type: 'mini-test', title: 'Mini Test', description: 'Check whether your notes support the answers.', href: '/tests/mini?skill=listening&task=academic-talk&subskill=note-taking', tone: 'orange', iconKey: 'quiz', isPremium: false },
  ],
};
