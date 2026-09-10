const fs = require('node:fs');
const path = require('node:path');

const createdAt = '2026-09-04T00:00:00.000Z';

const taxonomy = (categorySlug, topicSlug, levelSlug = 'b2') => ({
  examSlug: 'toefl',
  examVersionSlug: 'toefl-current',
  skillSlug: 'grammar',
  taskTypeSlug: 'learn-practice-review',
  subskillSlug: categorySlug,
  topicSlug,
  levelSlug,
  contentTypeSlug: 'grammar-lesson',
  tagSlugs: ['academic-english', categorySlug],
});

const base = (id, slug, title, description, sortOrder, extras = {}) => ({
  id,
  slug,
  title,
  description,
  status: 'active',
  visibility: 'authenticated',
  isPremium: false,
  sortOrder,
  createdAt,
  updatedAt: createdAt,
  ...extras,
});

const categories = [
  ['sentence-structure', 'sentence-structure', 'Sentence Structure', 'Build clear simple, compound, and complex academic sentences.', 'structure', 'blue'],
  ['verb-forms', 'verb-forms', 'Verb Forms', 'Control tense, aspect, and verb patterns in academic contexts.', 'bolt', 'teal'],
  ['agreement', 'agreement', 'Agreement', 'Keep subjects, verbs, and references consistent.', 'check', 'navy'],
  ['clauses', 'clauses', 'Clauses', 'Use relative, noun, and adverb clauses for precise meaning.', 'layers', 'purple'],
  ['modifiers', 'modifiers', 'Modifiers', 'Place descriptive information where it clearly belongs.', 'edit', 'orange'],
  ['articles', 'articles', 'Articles', 'Use a, an, the, and zero article with academic nouns.', 'article', 'yellow'],
  ['pronouns', 'pronouns', 'Pronouns', 'Make pronoun references clear and unambiguous.', 'person', 'blue'],
  ['connectors', 'connectors', 'Connectors', 'Show contrast, cause, addition, and sequence accurately.', 'link', 'teal'],
  ['academic-grammar', 'academic-grammar', 'Academic Grammar', 'Use formal structures such as nominalization and hedging.', 'academic', 'navy'],
  ['writing-grammar', 'writing-grammar', 'Writing Grammar', 'Improve cohesion, reference, and sentence control in essays.', 'writing', 'orange'],
].map(([id, slug, title, description, iconKey, tone], index) => base(id, slug, title, description, (index + 1) * 10, { iconKey, tone, topicIds: [], taxonomy: taxonomy(slug, slug) }));

const topicDefs = [
  {
    id: 'simple-compound-complex', categoryId: 'sentence-structure', title: 'Simple, Compound & Complex Sentences', level: 'B1', tone: 'blue', minutes: 16, difficulty: 2,
    description: 'Choose sentence patterns that match the relationship between ideas.',
    rules: ['Use a simple sentence for one complete idea.', 'Use compound or complex structure when ideas need coordination or dependence.'],
    correct: 'Researchers collected data, and the results confirmed the initial hypothesis.',
    wrong: 'Researchers collected data and confirmed the initial hypothesis because.',
    academic: 'Although the sample was small, the study identified a useful pattern.',
    blankStem: '___ the sample was small, the study identified a useful pattern.',
    blankCorrect: 'Although',
    buildCorrect: 'Although the policy was expensive, it improved access to public services.',
    buildWrong: 'The policy was expensive, although improved access to public services.',
    mistakeNote: 'A dependent clause needs a complete main clause.'
  },
  {
    id: 'parallel-structure', categoryId: 'sentence-structure', title: 'Parallel Structure', level: 'B2', tone: 'blue', minutes: 14, difficulty: 3,
    description: 'Keep items in lists and comparisons grammatically balanced.',
    rules: ['Use the same grammatical form for items in a series.', 'Make compared ideas match in structure.'],
    correct: 'The program reduces costs, improves access, and supports long-term planning.',
    wrong: 'The program reduces costs, improves access, and support long-term planning.',
    academic: 'The survey measured attendance, engagement, and satisfaction.',
    blankStem: 'The course focuses on reading, listening, and ___ academic essays.',
    blankCorrect: 'writing',
    buildCorrect: 'The proposal is practical, affordable, and easy to implement.',
    buildWrong: 'The proposal is practical, affordable, and implementation is easy.',
    mistakeNote: 'Parallel lists should keep the same part of speech.'
  },
  {
    id: 'tense-consistency', categoryId: 'verb-forms', title: 'Tense Consistency', level: 'B1', tone: 'teal', minutes: 15, difficulty: 2,
    description: 'Maintain clear time relationships across clauses and paragraphs.',
    rules: ['Use present tense for general facts and current claims.', 'Shift tense only when the time frame changes.'],
    correct: 'The article explains the theory and describes how it applies today.',
    wrong: 'The article explains the theory and described how it applies today.',
    academic: 'The author argues that urban density increases access to public services.',
    blankStem: 'The author ___ that urban density increases access to public services.',
    blankCorrect: 'argues',
    buildCorrect: 'The experiment showed a pattern, and later studies confirmed it.',
    buildWrong: 'The experiment shows a pattern, and later studies confirmed it.',
    mistakeNote: 'Do not change tense unless the time reference changes.'
  },
  {
    id: 'perfect-aspect', categoryId: 'verb-forms', title: 'Perfect Aspect', level: 'B2', tone: 'teal', minutes: 18, difficulty: 3,
    description: 'Use perfect forms to connect earlier events to later relevance.',
    rules: ['Use present perfect for past actions with present relevance.', 'Use past perfect for an earlier past event before another past event.'],
    correct: 'Researchers have identified several factors that affect retention.',
    wrong: 'Researchers identified several factors that affect retention this month.',
    academic: 'By the time the policy changed, enrollment had already declined.',
    blankStem: 'Researchers ___ identified several factors that affect retention.',
    blankCorrect: 'have',
    buildCorrect: 'The city had expanded transit before population growth accelerated.',
    buildWrong: 'The city has expanded transit before population growth accelerated.',
    mistakeNote: 'Perfect aspect depends on the relationship between two time points.'
  },
  {
    id: 'subject-verb-agreement', categoryId: 'agreement', title: 'Subject-Verb Agreement', level: 'B1', tone: 'navy', minutes: 13, difficulty: 2,
    description: 'Match verbs to the real subject, even when phrases come between them.',
    rules: ['Ignore interrupting prepositional phrases when choosing verb form.', 'Use singular verbs with singular abstract nouns.'],
    correct: 'The quality of the responses varies across the two groups.',
    wrong: 'The quality of the responses vary across the two groups.',
    academic: 'A series of interviews provides deeper insight into student motivation.',
    blankStem: 'The quality of the responses ___ across the two groups.',
    blankCorrect: 'varies',
    buildCorrect: 'Each of the proposed solutions requires additional evidence.',
    buildWrong: 'Each of the proposed solutions require additional evidence.',
    mistakeNote: 'The nearest noun is not always the subject.'
  },
  {
    id: 'relative-clauses', categoryId: 'clauses', title: 'Relative Clauses', level: 'B2', tone: 'purple', minutes: 18, difficulty: 3,
    description: 'Add defining or non-defining information without losing clarity.',
    rules: ['Use that or which for things and who for people.', 'Use commas for extra non-defining information.'],
    correct: 'The method that the researchers used reduced measurement bias.',
    wrong: 'The method which used by the researchers reduced measurement bias.',
    academic: 'The policy, which was introduced in 2024, changed enrollment patterns.',
    blankStem: 'The policy, ___ was introduced in 2024, changed enrollment patterns.',
    blankCorrect: 'which',
    buildCorrect: 'The students who completed the survey received detailed feedback.',
    buildWrong: 'The students which completed the survey received detailed feedback.',
    mistakeNote: 'A relative clause needs the correct relative pronoun and verb structure.'
  },
  {
    id: 'noun-clauses', categoryId: 'clauses', title: 'Noun Clauses', level: 'B2', tone: 'purple', minutes: 17, difficulty: 3,
    description: 'Use clauses as subjects, objects, or complements in academic sentences.',
    rules: ['Use that clauses after reporting verbs when stating findings.', 'Keep statement word order inside indirect questions.'],
    correct: 'The study suggests that early feedback improves revision quality.',
    wrong: 'The study suggests what early feedback improves revision quality.',
    academic: 'What the survey reveals is a clear gap in access.',
    blankStem: 'The study suggests ___ early feedback improves revision quality.',
    blankCorrect: 'that',
    buildCorrect: 'The report explains why participation declined after the policy change.',
    buildWrong: 'The report explains why did participation decline after the policy change.',
    mistakeNote: 'Indirect questions use statement word order.'
  },
  {
    id: 'adverb-clauses', categoryId: 'clauses', title: 'Adverb Clauses', level: 'B2', tone: 'purple', minutes: 16, difficulty: 3,
    description: 'Show time, reason, contrast, and condition through dependent clauses.',
    rules: ['Use subordinators such as although, because, when, and if.', 'Connect the adverb clause to a complete main clause.'],
    correct: 'Because the sample was diverse, the findings are more reliable.',
    wrong: 'Because the sample was diverse.',
    academic: 'If funding remains stable, the program can expand next year.',
    blankStem: '___ funding remains stable, the program can expand next year.',
    blankCorrect: 'If',
    buildCorrect: 'Although costs increased, the project delivered measurable benefits.',
    buildWrong: 'Although costs increased, but the project delivered measurable benefits.',
    mistakeNote: 'Avoid using a subordinator and a coordinator for the same relationship.'
  },
  {
    id: 'modifier-placement', categoryId: 'modifiers', title: 'Modifier Placement', level: 'B2', tone: 'orange', minutes: 14, difficulty: 3,
    description: 'Place modifiers next to the words they describe.',
    rules: ['Put introductory modifiers next to the subject they modify.', 'Avoid separating only or nearly from the word they limit.'],
    correct: 'After reviewing the data, the researchers revised their conclusion.',
    wrong: 'After reviewing the data, the conclusion was revised by the researchers.',
    academic: 'Students who studied regularly performed better on the final task.',
    blankStem: 'After reviewing the data, the researchers ___ their conclusion.',
    blankCorrect: 'revised',
    buildCorrect: 'Designed for low-income families, the program reduced costs.',
    buildWrong: 'Designed for low-income families, costs were reduced by the program.',
    mistakeNote: 'A dangling modifier makes the actor unclear.'
  },
  {
    id: 'article-use-academic-nouns', categoryId: 'articles', title: 'Article Use in Academic Nouns', level: 'B2', tone: 'yellow', minutes: 15, difficulty: 3,
    description: 'Choose a, an, the, or zero article for countable and abstract nouns.',
    rules: ['Use the when the reader knows the specific noun.', 'Use zero article for general plural or uncountable academic concepts.'],
    correct: 'The results support a broader interpretation of the evidence.',
    wrong: 'Results support the broader interpretation of evidence in general.',
    academic: 'Education improves access to employment in many regions.',
    blankStem: '___ results support a broader interpretation of the evidence.',
    blankCorrect: 'The',
    buildCorrect: 'A limitation of the study is the small sample size.',
    buildWrong: 'Limitation of study is small sample size.',
    mistakeNote: 'Specific countable nouns usually need an article or determiner.'
  },
  {
    id: 'pronoun-reference', categoryId: 'pronouns', title: 'Pronoun Reference', level: 'B1', tone: 'blue', minutes: 12, difficulty: 2,
    description: 'Make it clear what each pronoun refers to.',
    rules: ['Use a noun again when a pronoun could refer to more than one idea.', 'Match pronouns with singular or plural antecedents.'],
    correct: 'The policy affected students, so the students requested more guidance.',
    wrong: 'The policy affected students, so they requested more guidance from it.',
    academic: 'This pattern suggests that the intervention had a measurable effect.',
    blankStem: 'This pattern suggests that ___ intervention had a measurable effect.',
    blankCorrect: 'the',
    buildCorrect: 'The survey was revised because it contained unclear items.',
    buildWrong: 'The survey was revised because they contained unclear items.',
    mistakeNote: 'A pronoun must clearly point to one noun.'
  },
  {
    id: 'contrast-connectors', categoryId: 'connectors', title: 'Contrast Connectors', level: 'B2', tone: 'teal', minutes: 14, difficulty: 3,
    description: 'Use however, nevertheless, although, and whereas to show contrast.',
    rules: ['Use however between independent clauses or sentences.', 'Use although before a dependent clause.'],
    correct: 'The sample was small; however, the pattern was consistent.',
    wrong: 'The sample was small, however the pattern was consistent.',
    academic: 'Although the policy was costly, it produced long-term benefits.',
    blankStem: 'The sample was small; ___, the pattern was consistent.',
    blankCorrect: 'however',
    buildCorrect: 'The first study measured access, whereas the second measured cost.',
    buildWrong: 'The first study measured access, however the second measured cost.',
    mistakeNote: 'Connector punctuation changes with sentence structure.'
  },
  {
    id: 'cause-effect-connectors', categoryId: 'connectors', title: 'Cause and Effect Connectors', level: 'B2', tone: 'teal', minutes: 14, difficulty: 3,
    description: 'Show reasons and results with accurate connector choices.',
    rules: ['Use because before a reason clause.', 'Use therefore to introduce a result in a new clause or sentence.'],
    correct: 'The sample was representative; therefore, the results are useful.',
    wrong: 'The sample was representative because the results are useful.',
    academic: 'Because participation increased, the program collected more reliable data.',
    blankStem: 'The sample was representative; ___, the results are useful.',
    blankCorrect: 'therefore',
    buildCorrect: 'The course added feedback because students needed guided revision.',
    buildWrong: 'The course added feedback therefore students needed guided revision.',
    mistakeNote: 'Reason and result connectors are not interchangeable.'
  },
  {
    id: 'nominalization', categoryId: 'academic-grammar', title: 'Nominalization', level: 'C1', tone: 'navy', minutes: 20, difficulty: 4,
    description: 'Turn actions into precise academic noun phrases when appropriate.',
    rules: ['Use nominalization to make claims concise and formal.', 'Avoid overusing abstract nouns when the actor matters.'],
    correct: 'The expansion of public transit reduced commuting time.',
    wrong: 'Public transit expanded reduced commuting time.',
    academic: 'The implementation of the policy created measurable benefits.',
    blankStem: 'The ___ of the policy created measurable benefits.',
    blankCorrect: 'implementation',
    buildCorrect: 'The reduction in costs improved access for local families.',
    buildWrong: 'The reduce in costs improved access for local families.',
    mistakeNote: 'Nominalized forms often need correct prepositions and articles.'
  },
  {
    id: 'hedging', categoryId: 'academic-grammar', title: 'Hedging', level: 'C1', tone: 'navy', minutes: 16, difficulty: 4,
    description: 'Make claims careful and evidence-based without sounding weak.',
    rules: ['Use may, might, appears to, and suggests for cautious claims.', 'Match stronger language to stronger evidence.'],
    correct: 'The findings suggest that feedback may improve revision quality.',
    wrong: 'The findings prove that feedback always improves revision quality.',
    academic: 'This trend appears to be related to changes in study habits.',
    blankStem: 'The findings ___ that feedback may improve revision quality.',
    blankCorrect: 'suggest',
    buildCorrect: 'The results may indicate a broader change in student behavior.',
    buildWrong: 'The results definitely indicate all students changed behavior.',
    mistakeNote: 'Academic writing often needs measured claims rather than absolute claims.'
  },
  {
    id: 'cohesion-and-reference', categoryId: 'writing-grammar', title: 'Cohesion and Reference', level: 'B2', tone: 'orange', minutes: 18, difficulty: 3,
    description: 'Connect sentences so readers can follow the argument easily.',
    rules: ['Use this plus a summary noun to refer to a previous idea.', 'Repeat key terms when a pronoun would be unclear.'],
    correct: 'Many students work part-time. This responsibility can limit study time.',
    wrong: 'Many students work part-time. This can limit study time.',
    academic: 'The intervention increased attendance. This improvement was strongest in small classes.',
    blankStem: 'The intervention increased attendance. This ___ was strongest in small classes.',
    blankCorrect: 'improvement',
    buildCorrect: 'The policy reduced delays, and this change improved satisfaction.',
    buildWrong: 'The policy reduced delays, and this improved satisfaction.',
    mistakeNote: 'This alone can be vague; this plus a noun is often clearer.'
  },
];

const option = (id, label, isCorrect = false) => ({ id, label, isCorrect });

function makeQuestions(topic) {
  const baseId = topic.id;
  return [
    {
      id: `${baseId}-multiple-choice`,
      topicId: baseId,
      type: 'multiple-choice',
      prompt: 'Choose the strongest sentence',
      stem: `Which sentence best demonstrates ${topic.title}?`,
      options: [
        option(`${baseId}-mc-a`, topic.wrong),
        option(`${baseId}-mc-b`, topic.correct, true),
        option(`${baseId}-mc-c`, 'The idea is important and it is about the topic.'),
        option(`${baseId}-mc-d`, 'There are many examples that shows the same point.'),
      ],
      correctOptionId: `${baseId}-mc-b`,
      explanation: topic.mistakeNote,
      errorTag: topic.id,
      difficulty: topic.difficulty,
    },
    {
      id: `${baseId}-sentence-correction`,
      topicId: baseId,
      type: 'sentence-correction',
      prompt: 'Correct the sentence',
      stem: topic.wrong,
      options: [
        option(`${baseId}-sc-a`, topic.wrong),
        option(`${baseId}-sc-b`, topic.correct, true),
        option(`${baseId}-sc-c`, topic.academic),
        option(`${baseId}-sc-d`, 'No change is needed.'),
      ],
      correctOptionId: `${baseId}-sc-b`,
      explanation: topic.mistakeNote,
      errorTag: topic.id,
      difficulty: topic.difficulty,
    },
    {
      id: `${baseId}-fill-in-blank`,
      topicId: baseId,
      type: 'fill-in-blank',
      prompt: 'Fill in the blank',
      stem: topic.blankStem,
      options: [
        option(`${baseId}-fib-a`, topic.blankCorrect, true),
        option(`${baseId}-fib-b`, 'therefore'),
        option(`${baseId}-fib-c`, 'which'),
        option(`${baseId}-fib-d`, 'because'),
      ].filter((item, index, arr) => arr.findIndex((other) => other.label.toLowerCase() === item.label.toLowerCase()) === index),
      correctOptionId: `${baseId}-fib-a`,
      explanation: topic.mistakeNote,
      errorTag: topic.id,
      difficulty: topic.difficulty,
    },
    {
      id: `${baseId}-sentence-building`,
      topicId: baseId,
      type: 'sentence-building',
      prompt: 'Build the best sentence',
      stem: 'Choose the clearest academic sentence from the word groups.',
      options: [
        option(`${baseId}-sb-a`, topic.buildWrong),
        option(`${baseId}-sb-b`, topic.buildCorrect, true),
        option(`${baseId}-sb-c`, topic.correct.replace(/[.;]/g, ',')),
        option(`${baseId}-sb-d`, 'The sentence is clear because it has academic words.'),
      ],
      correctOptionId: `${baseId}-sb-b`,
      explanation: topic.mistakeNote,
      errorTag: topic.id,
      difficulty: topic.difficulty,
    },
  ];
}

const topics = topicDefs.map((topic, index) => {
  const category = categories.find((item) => item.id === topic.categoryId);
  const slug = topic.id;
  const isPremium = ['nominalization', 'hedging', 'cohesion-and-reference', 'perfect-aspect'].includes(topic.id);
  return base(topic.id, slug, topic.title, topic.description, (index + 1) * 10, {
    categoryId: topic.categoryId,
    level: topic.level,
    tone: topic.tone,
    estimatedMinutes: topic.minutes,
    difficulty: topic.difficulty,
    lessonCount: 5,
    isPremium,
    taxonomy: taxonomy(category.slug, slug, topic.level.toLowerCase()),
    contentTags: ['toefl-grammar', category.slug, topic.level.toLowerCase()],
    rules: topic.rules.map((body, ruleIndex) => ({ id: `${topic.id}-rule-${ruleIndex + 1}`, title: ruleIndex === 0 ? 'Core rule' : 'Usage note', body })),
    positiveExamples: [{ id: `${topic.id}-positive`, label: 'Correct', sentence: topic.correct, note: topic.mistakeNote, isCorrect: true }],
    negativeExamples: [{ id: `${topic.id}-negative`, label: 'Needs revision', sentence: topic.wrong, note: topic.mistakeNote, isCorrect: false }],
    academicExamples: [{ id: `${topic.id}-academic`, label: 'Academic use', sentence: topic.academic, note: 'Useful for TOEFL-style academic explanations.', isCorrect: true }],
    commonMistakes: [{ id: `${topic.id}-mistake`, wrong: topic.wrong, right: topic.correct, note: topic.mistakeNote, errorTag: topic.id }],
    questions: makeQuestions(topic),
    recommendedNextTopicId: topicDefs[index + 1]?.id ?? null,
  });
});

for (const category of categories) {
  category.topicIds = topics.filter((topic) => topic.categoryId === category.id).map((topic) => topic.id);
}

const progressSeeds = [
  ['simple-compound-complex', 'strong', 82, '2026-09-02T09:30:00.000Z', '2026-09-12T09:30:00.000Z', 3, 1, 7, 1, 2, ['learn', 'examples', 'practice']],
  ['parallel-structure', 'improving', 66, '2026-08-30T10:20:00.000Z', '2026-09-05T10:20:00.000Z', 2, 2, 5, 2, 3, ['learn', 'examples']],
  ['tense-consistency', 'mastered', 92, '2026-09-01T08:40:00.000Z', '2026-09-18T08:40:00.000Z', 5, 0, 9, 0, 2, ['learn', 'examples', 'mistakes', 'practice', 'quiz']],
  ['perfect-aspect', 'needs-practice', 48, '2026-08-22T14:00:00.000Z', '2026-09-04T08:00:00.000Z', 0, 4, 4, 4, 4, ['learn']],
  ['subject-verb-agreement', 'strong', 78, '2026-09-03T12:10:00.000Z', '2026-09-10T12:10:00.000Z', 3, 1, 6, 1, 2, ['learn', 'examples', 'practice']],
  ['relative-clauses', 'improving', 61, '2026-08-29T15:35:00.000Z', '2026-09-04T09:00:00.000Z', 1, 3, 5, 3, 3, ['learn', 'examples', 'mistakes']],
  ['noun-clauses', 'learning', 38, '2026-08-24T11:25:00.000Z', '2026-09-04T09:00:00.000Z', 0, 2, 2, 2, 3, ['learn']],
  ['adverb-clauses', 'not-started', 0, null, null, 0, 0, 0, 0, 3, []],
  ['modifier-placement', 'needs-practice', 44, '2026-08-27T16:50:00.000Z', '2026-09-04T09:00:00.000Z', 0, 5, 5, 5, 4, ['learn', 'examples']],
  ['article-use-academic-nouns', 'needs-practice', 42, '2026-08-31T17:30:00.000Z', '2026-09-04T09:00:00.000Z', 0, 6, 7, 6, 4, ['learn', 'examples', 'mistakes']],
  ['pronoun-reference', 'improving', 58, '2026-09-01T13:20:00.000Z', '2026-09-05T13:20:00.000Z', 1, 2, 4, 2, 3, ['learn', 'examples']],
  ['contrast-connectors', 'strong', 74, '2026-09-03T09:45:00.000Z', '2026-09-11T09:45:00.000Z', 3, 1, 6, 1, 3, ['learn', 'examples', 'practice']],
  ['cause-effect-connectors', 'learning', 36, '2026-08-26T09:15:00.000Z', '2026-09-04T09:00:00.000Z', 0, 3, 3, 3, 3, ['learn']],
  ['nominalization', 'not-started', 0, null, null, 0, 0, 0, 0, 5, []],
  ['hedging', 'learning', 52, '2026-08-28T10:10:00.000Z', '2026-09-04T09:00:00.000Z', 1, 2, 4, 2, 4, ['learn', 'examples']],
  ['cohesion-and-reference', 'improving', 63, '2026-09-02T18:15:00.000Z', '2026-09-07T18:15:00.000Z', 2, 2, 5, 2, 3, ['learn', 'examples', 'practice']],
];

const progress = progressSeeds.map(([topicId, state, mastery, lastPracticedAt, nextReviewAt, correctStreak, incorrectCount, practiceCount, recentErrors, difficulty, completedSteps]) => ({
  topicId,
  state,
  mastery,
  lastPracticedAt,
  nextReviewAt,
  correctStreak,
  incorrectCount,
  practiceCount,
  recentErrors,
  difficulty,
  completedSteps,
}));

const seed = { categories, topics, progress };
const outputPath = path.join(process.cwd(), 'src/lib/grammar/data/grammar.json');
fs.writeFileSync(outputPath, JSON.stringify(seed, null, 2) + '\n');
console.log(`Generated ${topics.length} grammar topics across ${categories.length} categories.`);
