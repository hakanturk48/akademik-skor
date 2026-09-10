import type {
  MiniTestActivity,
  MiniTestDifficulty,
  MiniTestModeRule,
  MiniTestOverviewMetric,
  MiniTestQuestionBankItem,
  MiniTestRecommendation,
  MiniTestSelection,
} from './types';

const stamp = '2026-09-04T00:00:00.000Z';

function question(
  id: string,
  skillSlug: string,
  taskTypeSlug: string,
  subskillSlug: string,
  topicSlug: string,
  levelSlug: 'foundation' | 'intermediate' | 'advanced',
  prompt: string,
  correct: string,
  distractors: string[],
  extra?: Partial<MiniTestQuestionBankItem>,
): MiniTestQuestionBankItem {
  const options = [correct, ...distractors].map((body, index) => ({
    id: `${id}-option-${index + 1}`,
    key: String.fromCharCode(65 + index),
    body,
    isCorrect: index === 0,
  }));

  return {
    id,
    slug: id.replace(/^qb-/, ''),
    title: prompt.slice(0, 52),
    status: 'active',
    sortOrder: Number(id.replace(/\D/g, '').slice(-3)) || 10,
    visibility: 'authenticated',
    isPremium: false,
    createdAt: stamp,
    updatedAt: stamp,
    taxonomy: {
      examSlug: 'toefl',
      examVersionSlug: 'toefl-current',
      skillSlug,
      taskTypeSlug,
      subskillSlug,
      topicSlug,
      levelSlug,
      contentTypeSlug: 'question',
      tagSlugs: ['timed'],
    },
    prompt,
    options,
    correctOptionKey: 'A',
    estimatedSeconds: 70,
    ...extra,
  };
}

export const miniTestDifficultyOptions: { id: MiniTestDifficulty; title: string; description: string; levelSlugs: string[] }[] = [
  { id: 'adaptive', title: 'Adaptive', description: 'Mixes nearby levels around your recent performance.', levelSlugs: ['foundation', 'intermediate', 'advanced'] },
  { id: 'easy', title: 'Easy', description: 'Lower pressure review with foundation-level items.', levelSlugs: ['foundation'] },
  { id: 'medium', title: 'Medium', description: 'Current target level with standard TOEFL pacing.', levelSlugs: ['intermediate'] },
  { id: 'hard', title: 'Hard', description: 'Advanced items and tighter distractors.', levelSlugs: ['advanced'] },
];

export const miniTestLengthOptions = [5, 10, 15] as const;

export const miniTestModeRules: MiniTestModeRule[] = [
  {
    mode: 'practice',
    title: 'Practice Mode',
    description: 'Use this when you want feedback during learning.',
    feedbackTiming: 'Show explanations after each answer.',
    transcriptPolicy: 'Allow review aids when the skill supports them.',
    timerPolicy: 'Timer is visible but low pressure.',
  },
  {
    mode: 'exam',
    title: 'Exam Mode',
    description: 'Use this when you want a realistic timed check.',
    feedbackTiming: 'Hide correctness and explanations until submit.',
    transcriptPolicy: 'Restrict hints and transcripts during the attempt.',
    timerPolicy: 'Timer is strict and section-like.',
  },
];

export const miniTestOverviewMetrics: MiniTestOverviewMetric[] = [
  { label: 'Available', value: '42', note: 'Across 6 skill areas', tone: 'navy', iconKey: 'quiz', progress: 78 },
  { label: 'Completed', value: '19', note: '7 this month', tone: 'blue', iconKey: 'check', progress: 54 },
  { label: 'Best Accuracy', value: '92%', note: 'Vocabulary - Set 08', tone: 'yellow', iconKey: 'star', progress: 92 },
  { label: 'Avg. Time', value: '11m 24s', note: 'Per mini test', tone: 'teal', iconKey: 'clock', progress: 68 },
];

export const miniTestDefaultSelection: MiniTestSelection = {
  skillSlug: 'reading',
  taskTypeSlug: 'reading-passage',
  subskillSlug: 'inference',
  difficulty: 'adaptive',
  length: 5,
  mode: 'practice',
};

export const miniTestWeakSignals: MiniTestRecommendation[] = [
  {
    id: 'weak-reading-inference',
    title: 'Inference Questions - Reading',
    description: 'Your recent inference accuracy is below your Reading average.',
    reason: 'Weak area: 63% accuracy, 4 recent misses.',
    tone: 'blue',
    iconKey: 'book',
    selection: { skillSlug: 'reading', taskTypeSlug: 'reading-passage', subskillSlug: 'inference', difficulty: 'adaptive', length: 5, mode: 'practice' },
  },
  {
    id: 'weak-listening-detail',
    title: 'Lecture Detail - Listening',
    description: 'Detail questions are your weakest Listening subskill this week.',
    reason: 'Recent activity: 72% complete but detail misses remain.',
    tone: 'teal',
    iconKey: 'headphones',
    selection: { skillSlug: 'listening', taskTypeSlug: 'academic-talk', subskillSlug: 'detail', difficulty: 'medium', length: 5, mode: 'practice' },
  },
  {
    id: 'weak-grammar-clauses',
    title: 'Complex Clauses - Grammar',
    description: 'Clause control appears in recent writing feedback.',
    reason: 'Rule-based link from writing errors.',
    tone: 'purple',
    iconKey: 'layers',
    selection: { skillSlug: 'grammar', taskTypeSlug: 'grammar-practice', subskillSlug: 'complex-clauses', difficulty: 'medium', length: 5, mode: 'exam' },
  },
];

export const miniTestRecentActivity: MiniTestActivity[] = [
  { id: 'activity-reading-sprint', title: 'Main Idea Sprint 04', meta: 'Reading - B2 - 10 min', score: '88%', tone: 'blue' },
  { id: 'activity-listening-detail', title: 'Lecture Detail Check 03', meta: 'Listening - B2 - 12 min', score: '72%', tone: 'teal' },
  { id: 'activity-collocations', title: 'Academic Collocations 08', meta: 'Vocabulary - C1 - 8 min', score: '92%', tone: 'orange' },
];

export const miniTestQuestionBank: MiniTestQuestionBankItem[] = [
  question('qb-reading-inference-001', 'reading', 'reading-passage', 'inference', 'urban-transportation', 'intermediate', 'What can be inferred about the city planning approach?', 'It combines environmental and social goals.', ['It focuses only on visual design.', 'It removes public participation.']),
  question('qb-reading-inference-002', 'reading', 'reading-passage', 'inference', 'sleep-science', 'foundation', 'What does the author imply about sleep routines?', 'Consistent habits can support performance.', ['Only long sleep matters.', 'Sleep routines are unrelated to memory.']),
  question('qb-reading-inference-003', 'reading', 'reading-passage', 'inference', 'biology', 'advanced', 'What is implied by the study comparison?', 'The newer model explains a broader pattern.', ['The older model is fully disproved.', 'The samples were identical.']),
  question('qb-reading-inference-004', 'reading', 'reading-passage', 'inference', 'urban-transportation', 'intermediate', 'Why does the author mention maintenance funding?', 'To show that long-term support affects outcomes.', ['To introduce an unrelated budget issue.', 'To argue that projects should stop.']),
  question('qb-reading-inference-005', 'reading', 'reading-passage', 'inference', 'sleep-science', 'foundation', 'What can readers conclude from the final paragraph?', 'Small routine changes may have meaningful effects.', ['Only medical treatment improves sleep.', 'Busy students cannot improve sleep.']),
  question('qb-reading-inference-006', 'reading', 'reading-passage', 'inference', 'biology', 'advanced', 'Which conclusion is best supported by the passage?', 'Evidence from several fields points to the same trend.', ['The author rejects evidence from biology.', 'The passage is only a personal story.'], { isPremium: true }),
  question('qb-listening-detail-001', 'listening', 'academic-talk', 'detail', 'campus-life', 'intermediate', 'Which facility does the speaker say is open late?', 'The library study rooms.', ['The admissions office.', 'The campus bookstore.']),
  question('qb-listening-detail-002', 'listening', 'academic-talk', 'detail', 'biology', 'foundation', 'What example does the professor use first?', 'A change in animal behavior.', ['A student survey.', 'A historical map.']),
  question('qb-listening-detail-003', 'listening', 'academic-talk', 'detail', 'campus-life', 'advanced', 'What service requires an online reservation?', 'Group study rooms.', ['Printing refunds.', 'Meal plan changes.']),
  question('qb-listening-detail-004', 'listening', 'academic-talk', 'detail', 'biology', 'intermediate', 'What detail supports the main lecture claim?', 'The pattern repeats across several observations.', ['The speaker changes the topic.', 'The lecture gives no example.']),
  question('qb-listening-detail-005', 'listening', 'academic-talk', 'detail', 'campus-life', 'foundation', 'What should students bring to the workshop?', 'Their student ID.', ['A printed transcript.', 'A lab notebook.']),
  question('qb-listening-main-idea-001', 'listening', 'academic-talk', 'main-idea', 'biology', 'intermediate', 'What is the lecture mainly about?', 'How evidence helps explain a biological process.', ['A campus policy change.', 'A list of library services.']),
  question('qb-speaking-fluency-001', 'speaking', 'independent-speaking', 'fluency-coherence', 'campus-life', 'foundation', 'Which response plan is most coherent?', 'State a preference, give two reasons, then close.', ['List unrelated examples.', 'Repeat the prompt without support.']),
  question('qb-speaking-fluency-002', 'speaking', 'independent-speaking', 'fluency-coherence', 'campus-life', 'intermediate', 'Which opening best supports fluency?', 'I prefer the group project because it improves planning.', ['Group project. Many things. Good.', 'The question is difficult and I am unsure.']),
  question('qb-speaking-fluency-003', 'speaking', 'independent-speaking', 'fluency-coherence', 'campus-life', 'advanced', 'Which transition improves organization?', 'Another reason is that it gives students feedback.', ['And, and, and the thing.', 'Maybe but not sure.']),
  question('qb-speaking-fluency-004', 'speaking', 'independent-speaking', 'fluency-coherence', 'campus-life', 'intermediate', 'Which sentence keeps the answer on topic?', 'This example shows why the option is practical.', ['The campus has many buildings.', 'I used to study math.']),
  question('qb-speaking-fluency-005', 'speaking', 'independent-speaking', 'fluency-coherence', 'campus-life', 'foundation', 'Which close is strongest?', 'For these reasons, I think the first option is better.', ['That is all.', 'I do not know more words.']),
  question('qb-writing-organization-001', 'writing', 'integrated-writing', 'organization', 'urban-transportation', 'foundation', 'Which thesis best organizes an integrated response?', 'The lecture challenges the reading by questioning its evidence.', ['The topic is transportation.', 'The reading is long and detailed.']),
  question('qb-writing-organization-002', 'writing', 'integrated-writing', 'organization', 'urban-transportation', 'intermediate', 'Which paragraph order is clearest?', 'Reading claim, lecture response, explanation.', ['Example, conclusion, unrelated detail.', 'Conclusion before any claim.']),
  question('qb-writing-organization-003', 'writing', 'integrated-writing', 'organization', 'urban-transportation', 'advanced', 'Which phrase signals contrast accurately?', 'However, the professor disputes this conclusion.', ['Also, the professor says the same thing.', 'For example, no contrast appears.']),
  question('qb-writing-organization-004', 'writing', 'integrated-writing', 'organization', 'urban-transportation', 'intermediate', 'Which detail belongs in the same paragraph?', 'A lecture point that directly answers the reading claim.', ['A personal opinion about city life.', 'A definition with no source link.']),
  question('qb-writing-organization-005', 'writing', 'integrated-writing', 'organization', 'urban-transportation', 'foundation', 'Which conclusion fits TOEFL integrated writing?', 'A brief restatement of how the lecture responds.', ['A new personal example.', 'A question for the reader.']),
  question('qb-vocabulary-collocations-001', 'vocabulary', 'vocabulary-review', 'academic-collocations', 'academic-language', 'foundation', 'Choose the strongest academic collocation.', 'pose a challenge', ['make a challenge strongly', 'do a challenge']),
  question('qb-vocabulary-collocations-002', 'vocabulary', 'vocabulary-review', 'academic-collocations', 'academic-language', 'intermediate', 'Choose the best phrase for academic writing.', 'conduct research', ['make research', 'do a research']),
  question('qb-vocabulary-collocations-003', 'vocabulary', 'vocabulary-review', 'academic-collocations', 'academic-language', 'advanced', 'Which collocation is most natural?', 'mitigate the impact', ['soft the impact', 'less the impact']),
  question('qb-vocabulary-collocations-004', 'vocabulary', 'vocabulary-review', 'academic-collocations', 'academic-language', 'intermediate', 'Choose the correct collocation.', 'reach a conclusion', ['arrive a conclusion', 'make to conclusion']),
  question('qb-vocabulary-collocations-005', 'vocabulary', 'vocabulary-review', 'academic-collocations', 'academic-language', 'foundation', 'Which phrase is appropriate in a report?', 'significant evidence', ['bigly evidence', 'evidence very']),
  question('qb-grammar-clauses-001', 'grammar', 'grammar-practice', 'complex-clauses', 'grammar-clauses', 'foundation', 'Choose the complete sentence.', 'Although the sample was small, the results were useful.', ['Although the sample was small.', 'Because the results useful.']),
  question('qb-grammar-clauses-002', 'grammar', 'grammar-practice', 'complex-clauses', 'grammar-clauses', 'intermediate', 'Choose the best connector.', 'The study was limited; however, the pattern was clear.', ['The study was limited, however the pattern was clear.', 'The study was limited however.']),
  question('qb-grammar-clauses-003', 'grammar', 'grammar-practice', 'complex-clauses', 'grammar-clauses', 'advanced', 'Which sentence uses a relative clause correctly?', 'The policy that the committee approved begins in June.', ['The policy which approved begins in June.', 'The policy that approved it begins in June.']),
  question('qb-grammar-clauses-004', 'grammar', 'grammar-practice', 'complex-clauses', 'grammar-clauses', 'intermediate', 'Choose the best noun clause.', 'The professor explains why the results changed.', ['The professor explains why did the results change.', 'The professor explains why changed.']),
  question('qb-grammar-clauses-005', 'grammar', 'grammar-practice', 'complex-clauses', 'grammar-clauses', 'foundation', 'Choose the sentence with correct subordination.', 'Because the course is demanding, students need a plan.', ['Because the course is demanding.', 'Students because need a plan.']),
  question('qb-draft-disabled-001', 'reading', 'reading-passage', 'inference', 'biology', 'intermediate', 'Draft item should not appear.', 'Draft answer.', ['Distractor one.', 'Distractor two.'], { status: 'draft' }),
  question('qb-inactive-disabled-001', 'listening', 'academic-talk', 'detail', 'biology', 'intermediate', 'Inactive item should not appear.', 'Inactive answer.', ['Distractor one.', 'Distractor two.'], { status: 'inactive' }),
];
