export type SectionScore = {
  key: 'reading' | 'listening' | 'speaking' | 'writing';
  title: string;
  score: number;
  maxScore: 30;
  delta: number;
  focus: string;
  practiceAccuracy: number;
  mastery: number;
  color: string;
  softColor: string;
};

export const dashboardSnapshot = {
  currentScore: 87,
  targetScore: 105,
  scoreMax: 120,
  examDate: '18 Ekim 2026',
  weeklyMinutes: 245,
  streakDays: 4,
  planState: 'Small steps every day lead to big results.',
  completedPlanItems: 2,
  continueLearning: {
    title: 'Academic Listening · Lecture 01',
    module: 'Lecture 03 · Note Taking',
    detail: 'Lecture ana fikrini, geçiş sinyallerini ve detay notlarını tek akışta yakalama pratiği.',
    progress: 72,
    elapsed: '24:35',
    total: '34:20',
    nextAction: 'Continue Lesson',
  },
  scoreProgress: [
    { label: 'May 01', value: 42 },
    { label: 'May 06', value: 61 },
    { label: 'May 11', value: 67 },
    { label: 'May 16', value: 70 },
    { label: 'May 21', value: 73 },
    { label: 'May 26', value: 78 },
    { label: 'May 30', value: 87 },
  ],
};

export const sectionScores: SectionScore[] = [
  {
    key: 'reading',
    title: 'Reading',
    score: 24,
    maxScore: 30,
    delta: 2,
    focus: 'Main idea ve inference soruları',
    practiceAccuracy: 79,
    mastery: 76,
    color: '#5b75d8',
    softColor: '#edf1ff',
  },
  {
    key: 'listening',
    title: 'Listening',
    score: 22,
    maxScore: 30,
    delta: 2,
    focus: 'Lecture not alma ve konuşmacı amacı',
    practiceAccuracy: 72,
    mastery: 69,
    color: '#007d73',
    softColor: '#e4f4f1',
  },
  {
    key: 'speaking',
    title: 'Speaking',
    score: 23,
    maxScore: 30,
    delta: 2,
    focus: 'Estimated Speaking /30 rubric pratiği',
    practiceAccuracy: 74,
    mastery: 71,
    color: '#8a5cf6',
    softColor: '#f3efff',
  },
  {
    key: 'writing',
    title: 'Writing',
    score: 23,
    maxScore: 30,
    delta: 2,
    focus: 'Rubric breakdown ve organizasyon',
    practiceAccuracy: 75,
    mastery: 72,
    color: '#f06a3d',
    softColor: '#fff0e9',
  },
];

export const todaysStudyPlan = [
  {
    title: 'Reading',
    detail: 'Main Idea',
    duration: '20 min',
    state: 'Main Idea',
    color: '#5b75d8',
  },
  {
    title: 'Vocabulary',
    detail: 'Academic Words',
    duration: '15 min',
    state: 'Academic Words',
    color: '#8a5cf6',
  },
  {
    title: 'Listening',
    detail: 'Lecture 04',
    duration: '25 min',
    state: 'Lecture 04',
    color: '#007d73',
  },
  {
    title: 'Speaking',
    detail: 'Task 02',
    duration: '15 min',
    state: 'Task 02',
    color: '#f06a3d',
  },
];

export const recentActivity = [
  { title: 'Reading Practice', detail: 'Main Idea · Practice Set 3', time: 'Today, 09:30 AM', tone: '#5b75d8' },
  { title: 'Listening Practice', detail: 'Lecture 03 · Note Taking', time: 'Yesterday, 08:15 PM', tone: '#007d73' },
  { title: 'Vocabulary', detail: 'Academic Words · Set 12', time: 'Yesterday, 06:40 PM', tone: '#d99b00' },
  { title: 'Writing Task', detail: 'Integrated Writing · Task 1', time: 'Aug 28, 10:20 AM', tone: '#f06a3d' },
];