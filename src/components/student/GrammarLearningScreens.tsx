import { useCallback, useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type DimensionValue } from 'react-native';

import { ProgressRecommendationPanel } from '@/components/student/RecommendationCards';
import {
  LearningActionCard,
  LearningIcon,
  LearningIconBubble,
  LearningMetricGrid,
  LearningPageHeader,
  learningIcons,
  learningToneColor,
  type AppSymbolName,
} from '@/components/student/LearningScaffold';
import { Badge, Button, Card, EmptyState, ErrorState, Progress, Skeleton, studentTokens } from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';
import {
  applyGrammarResult,
  createGrammarSession,
  evaluateGrammarAnswer,
  getGrammarCategorySummaries,
  getGrammarExerciseTypes,
  getGrammarOverview,
  getGrammarQuestionById,
  getGrammarTopicBySlug,
  getGrammarTopicSummaries,
  getInitialGrammarProgress,
  getRecentGrammarActivity,
  getRecommendedGrammarTopics,
  markGrammarStep,
  mergeGrammarProgress,
  summarizeGrammarSession,
  type GrammarCategorySummary,
  type GrammarExerciseOption,
  type GrammarProgress,
  type GrammarQuestion,
  type GrammarSession,
  type GrammarState,
  type GrammarStep,
  type GrammarSummary,
  type GrammarTopicSummary,
} from '@/lib/grammar';

const fontFamily = 'Quicksand';
type Store = { progress: GrammarProgress[]; sessions: GrammarSession[]; activeSessionId: string | null };
type DetailTab = 'learn' | 'examples' | 'mistakes' | 'practice' | 'quiz' | 'results';

const categoryIconRegistry: Record<string, AppSymbolName> = {
  structure: learningIcons.structure,
  bolt: learningIcons.bolt,
  check: learningIcons.check,
  layers: learningIcons.layers,
  edit: learningIcons.edit,
  article: learningIcons.article,
  person: learningIcons.person,
  link: learningIcons.link,
  academic: learningIcons.academic,
  writing: learningIcons.writing,
};

function stateTone(state: GrammarState): 'default' | 'yellow' | 'teal' | 'orange' | 'blue' | 'danger' {
  if (state === 'mastered' || state === 'strong') return 'teal';
  if (state === 'improving') return 'blue';
  if (state === 'needs-practice') return 'orange';
  if (state === 'learning') return 'yellow';
  return 'default';
}

function stateLabel(state: GrammarState) {
  const labels: Record<GrammarState, string> = {
    'not-started': 'Not Started',
    learning: 'Learning',
    'needs-practice': 'Needs Practice',
    improving: 'Improving',
    strong: 'Strong',
    mastered: 'Mastered',
  };
  return labels[state];
}

function readStore(userId: string): Store {
  const fallback: Store = { progress: getInitialGrammarProgress(), sessions: [], activeSessionId: null };
  if (typeof localStorage === 'undefined') return fallback;

  const raw = localStorage.getItem('akademik-grammar-' + userId);
  if (!raw) return fallback;

  const parsed = JSON.parse(raw) as Partial<Store>;
  return {
    progress: mergeGrammarProgress(parsed.progress),
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    activeSessionId: typeof parsed.activeSessionId === 'string' ? parsed.activeSessionId : null,
  };
}

function useGrammarStore(user: AuthUser) {
  const [initial] = useState(() => {
    try {
      return { store: readStore(user.id), error: null as string | null };
    } catch {
      return {
        store: { progress: getInitialGrammarProgress(), sessions: [], activeSessionId: null },
        error: 'Grammar verileri yüklenemedi. Lütfen tekrar deneyin.',
      };
    }
  });
  const [store, setStore] = useState<Store>(initial.store);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(initial.error);

  const updateStore = useCallback(
    (next: Store) => {
      setStore(next);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('akademik-grammar-' + user.id, JSON.stringify(next));
        }
        setError(null);
      } catch {
        setError('Grammar ilerlemesi kaydedilemedi. Depolama alanınızı kontrol edin.');
      }
    },
    [user.id],
  );

  return { store, loading, error, updateStore };
}

function GrammarLoading() {
  return (
    <View style={styles.page}>
      <Skeleton lines={2} style={styles.loadingHeader} />
      <View style={styles.statsGridFallback}>
        {[1, 2, 3, 4].map((item) => <Skeleton key={item} lines={3} style={styles.loadingStat} />)}
      </View>
      <Skeleton lines={5} style={styles.loadingPanel} />
    </View>
  );
}

function activeSessionForStore(store: Store) {
  return store.sessions.find((session) => session.id === store.activeSessionId && session.status === 'in-progress') ?? null;
}

function ContinueGrammarCard({ session, topic, onContinue }: { session: GrammarSession | null; topic?: GrammarTopicSummary; onContinue: () => void }) {
  if (!session) {
    return (
      <Card title="Continue Practice" eyebrow="Current session">
        <EmptyState title="No active grammar session" text="Start personalized practice or choose a topic to begin." />
      </Card>
    );
  }

  const progressValue = Math.min(session.currentIndex, session.questionIds.length);

  return (
    <Card style={styles.continueCard} contentStyle={styles.continueBody}>
      <View style={styles.continueCopy}>
        <Text style={styles.orangeLabel}>CONTINUE PRACTICE</Text>
        <Text style={styles.continueTitle}>{session.title}</Text>
        <Text style={styles.onNavyText}>{topic?.categoryTitle ?? 'Grammar'}  Question {Math.min(progressValue + 1, session.questionIds.length)} of {session.questionIds.length}</Text>
        <Progress value={progressValue} max={Math.max(session.questionIds.length, 1)} color={studentTokens.yellowDeep} label={`${progressValue} completed`} showValue />
      </View>
      <Button label="Continue" onPress={onContinue} left={<LearningIcon name={learningIcons.play} color={studentTokens.navy} size={16} />} />
    </Card>
  );
}

function ActivityList({ items }: { items: ReturnType<typeof getRecentGrammarActivity> }) {
  if (!items.length) {
    return <EmptyState title="No recent grammar activity" text="Completed practice items will appear here." />;
  }

  return (
    <View style={styles.activityList}>
      {items.map((item) => (
        <View key={item.id} style={styles.activityRow}>
          <View style={styles.activityIcon}><LearningIcon name={item.result === 'correct' ? learningIcons.check : learningIcons.refresh} color={item.result === 'correct' ? studentTokens.teal : studentTokens.orange} size={18} /></View>
          <View style={styles.activityCopy}>
            <Text style={styles.cardTitle}>{item.topicTitle}</Text>
            <Text style={styles.bodyText}>{item.categoryTitle}  {new Date(item.practicedAt).toLocaleDateString()}</Text>
          </View>
          <Badge label={stateLabel(item.state)} tone={stateTone(item.state)} />
        </View>
      ))}
    </View>
  );
}

function TopicMiniRow({ topic, locked, onOpen }: { topic: GrammarTopicSummary; locked: boolean; onOpen: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={locked ? `${topic.title}, premium locked` : topic.title}
      accessibilityState={{ disabled: locked }}
      disabled={locked}
      onPress={onOpen}
      style={({ pressed }) => [styles.topicRow, pressed ? styles.pressed : null, locked ? styles.locked : null]}
    >
      <View style={styles.topicCopy}>
        <Text style={styles.topicTitle}>{topic.title}</Text>
        <Text style={styles.topicMeta}>{topic.level}  {topic.estimatedMinutes} min  {topic.progress.mastery}% mastery</Text>
      </View>
      <Badge label={locked ? 'Premium' : topic.actionLabel} tone={locked ? 'yellow' : stateTone(topic.progress.state)} />
    </Pressable>
  );
}

function CategoryCard({ category, width, user, onOpen }: { category: GrammarCategorySummary; width?: DimensionValue; user: AuthUser; onOpen: (topic: GrammarTopicSummary) => void }) {
  const icon = categoryIconRegistry[category.iconKey] ?? learningIcons.book;

  return (
    <Card style={[styles.categoryCard, { width }]} contentStyle={styles.categoryBody}>
      <View style={styles.categoryHead}>
        <LearningIconBubble icon={icon} tone={category.tone} />
        <View style={styles.categoryCopy}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.bodyText}>{category.description}</Text>
        </View>
      </View>
      <View style={styles.categoryMetaRow}>
        <Text style={styles.metaText}>{category.topicCount} topics</Text>
        <Text style={styles.metaText}>{category.dueCount} need practice</Text>
        <Text style={styles.metaText}>{category.mastery}% mastery</Text>
      </View>
      <Progress value={category.mastery} color={learningToneColor(category.tone)} />
      <View style={styles.topicList}>
        {category.topics.slice(0, 3).map((topic) => (
          <TopicMiniRow key={topic.id} topic={topic} locked={topic.isPremium && user.plan !== 'premium'} onOpen={() => onOpen(topic)} />
        ))}
      </View>
    </Card>
  );
}

export function GrammarLearningPage({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { store, loading, error, updateStore } = useGrammarStore(user);
  const [catalogMode, setCatalogMode] = useState<'recommended' | 'all'>('all');
  const overview = useMemo(() => getGrammarOverview(store.progress), [store.progress]);
  const categories = useMemo(() => getGrammarCategorySummaries(store.progress), [store.progress]);
  const topicSummaries = useMemo(() => getGrammarTopicSummaries(store.progress), [store.progress]);
  const recommendations = useMemo(() => getRecommendedGrammarTopics(store.progress), [store.progress]);
  const recentActivity = useMemo(() => getRecentGrammarActivity(store.progress), [store.progress]);
  const activeSession = useMemo(() => activeSessionForStore(store), [store]);
  const activeTopic = activeSession ? topicSummaries.find((topic) => topic.id === activeSession.topicId) : undefined;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1100;
  const categoryWidth = isMobile ? '100%' : isTablet ? '48%' : undefined;

  const openTopic = useCallback(
    (topic: GrammarTopicSummary, mode: 'topic' | 'personalized' | 'review' = 'topic') => {
      if (topic.isPremium && user.plan !== 'premium') {
        router.push('/account/subscription' as Href);
        return;
      }

      if (mode === 'topic') {
        router.push(('/grammar/' + encodeURIComponent(topic.slug)) as Href);
        return;
      }

      const session = createGrammarSession(topic.slug, mode, store.progress);
      const sessions = [...store.sessions.filter((item) => item.id !== session.id), session];
      updateStore({ ...store, sessions, activeSessionId: session.id });
      router.push(('/grammar/' + encodeURIComponent(topic.slug)) as Href);
    },
    [router, store, updateStore, user.plan],
  );

  const openPersonalized = () => {
    const recommended = recommendations[0]?.topic;
    if (recommended) openTopic(recommended, 'personalized');
  };

  const continueSession = () => {
    if (activeTopic) router.push(('/grammar/' + encodeURIComponent(activeTopic.slug)) as Href);
  };

  if (loading) return <GrammarLoading />;
  if (error) {
    return <View style={styles.page}><ErrorState title="Grammar could not load" text={error} action={<Button label="Try again" variant="secondary" onPress={() => updateStore(readStore(user.id))} />} /></View>;
  }

  const totalTopics = categories.reduce((sum, category) => sum + category.topicCount, 0);
  const visibleCategories = catalogMode === 'recommended'
    ? categories.filter((category) => category.topics.some((topic) => recommendations.some((item) => item.topic.id === topic.id)))
    : categories;
  const metrics = [
    { label: 'Grammar Mastery', value: `${overview.grammarMastery}%`, note: 'Across active topics', icon: learningIcons.target, tone: 'blue' as const, progress: overview.grammarMastery },
    { label: 'Topics Learned', value: String(overview.topicsLearned), note: `${totalTopics} total topics`, icon: learningIcons.book, tone: 'teal' as const, progress: overview.topicsLearned, max: Math.max(totalTopics, 1) },
    { label: 'Needs Practice', value: String(overview.needsPractice), note: 'Due or below target', icon: learningIcons.refresh, tone: 'orange' as const, progress: overview.needsPractice, max: Math.max(totalTopics, 1) },
    { label: 'Weekly Practice', value: `${overview.weeklyPractice} / ${overview.weeklyGoal}`, note: 'Topics practiced this week', icon: learningIcons.check, tone: 'yellow' as const, progress: overview.weeklyPractice, max: overview.weeklyGoal },
  ];

  return (
    <View testID="grammar-learning-screen" style={styles.page}>
      <LearningPageHeader eyebrow="GRAMMAR" title="Grammar" subtitle="Learn, practice, and review the structures that make academic English clear and natural." />
      <LearningMetricGrid metrics={metrics} />

      <View style={styles.ctaGrid}>
        <LearningActionCard title="Personalized Practice" text="Rule-based recommendations from mastery, recent errors, last practiced date, and difficulty." icon={learningIcons.bolt} tone="orange" onPress={openPersonalized} />
        <LearningActionCard title="Choose a Topic" text="Browse grammar categories and pick the exact topic you want to learn or review." icon={learningIcons.layers} tone="blue" onPress={() => setCatalogMode('all')} />
      </View>

      <ContinueGrammarCard session={activeSession} topic={activeTopic} onContinue={continueSession} />

      <View style={[styles.mainGrid, width >= 1080 ? styles.mainGridWide : null]}>
        <View style={styles.primaryColumn}>
          <Card title="Topic Catalog" eyebrow={catalogMode === 'recommended' ? 'Recommended first' : 'Choose a topic'} right={<Badge label={`${visibleCategories.length} categories`} tone="blue" />}>
            <Text style={styles.sectionHint}>Categories use the same taxonomy path as lessons, practice sets, mini tests, and future admin-managed content.</Text>
            <View style={styles.catalogControls}>
              <Button label="Recommended" variant={catalogMode === 'recommended' ? 'primary' : 'secondary'} size="sm" onPress={() => setCatalogMode('recommended')} />
              <Button label="All Topics" variant={catalogMode === 'all' ? 'primary' : 'secondary'} size="sm" onPress={() => setCatalogMode('all')} />
            </View>
            <View style={styles.categoryGrid}>
              {visibleCategories.map((category) => <CategoryCard key={category.id} category={category} width={categoryWidth} user={user} onOpen={(topic) => openTopic(topic)} />)}
            </View>
          </Card>
        </View>

        <View style={styles.sideColumn}>
          <ProgressRecommendationPanel user={user} context="grammar" skill="grammar" limit={3} title="Recommended" eyebrow="Rule-based" dense={isMobile} />
          <Card title="Recent Practice" eyebrow="Activity">
            <ActivityList items={recentActivity} />
          </Card>
        </View>
      </View>
    </View>
  );
}

function StepTabs({ value, onChange, includeResults }: { value: DetailTab; onChange: (value: DetailTab) => void; includeResults: boolean }) {
  const tabs: { value: DetailTab; label: string }[] = [
    { value: 'learn', label: 'Learn' },
    { value: 'examples', label: 'Examples' },
    { value: 'mistakes', label: 'Common Mistakes' },
    { value: 'practice', label: 'Guided Practice' },
    { value: 'quiz', label: 'Mini Quiz' },
  ];
  if (includeResults) tabs.push({ value: 'results', label: 'Results' });

  return (
    <View accessibilityRole="tablist" style={styles.stepTabs}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <Pressable key={tab.value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(tab.value)} style={({ pressed }) => [styles.stepTab, selected ? styles.stepTabActive : null, pressed ? styles.pressed : null]}>
            <Text style={[styles.stepTabText, selected ? styles.stepTabTextActive : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TopicHeader({ topic, progress, onBack, onStart }: { topic: GrammarTopicSummary; progress: GrammarProgress; onBack: () => void; onStart: () => void }) {
  return (
    <Card style={styles.topicHero} contentStyle={styles.topicHeroBody}>
      <View style={styles.topicHeroCopy}>
        <Button label="Grammar" variant="secondary" size="sm" onPress={onBack} left={<LearningIcon name={learningIcons.arrow} color={studentTokens.navy} size={14} />} style={styles.backButton} />
        <Text style={styles.orangeLabel}>{topic.categoryTitle.toUpperCase()}</Text>
        <Text style={styles.detailTitle}>{topic.title}</Text>
        <Text style={styles.detailSubtitle}>{topic.description}</Text>
        <View style={styles.metaWrap}>
          <Badge label={topic.level} tone="blue" />
          <Badge label={stateLabel(progress.state)} tone={stateTone(progress.state)} />
          {topic.isPremium ? <Badge label="Premium" tone="yellow" /> : <Badge label="Free" tone="teal" />}
        </View>
      </View>
      <View style={styles.masteryPanel}>
        <Text style={styles.masteryValue}>{progress.mastery}%</Text>
        <Text style={styles.masteryLabel}>Mastery progress</Text>
        <Progress value={progress.mastery} color={learningToneColor(topic.tone)} />
        <Button label="Start Practice" onPress={onStart} style={styles.fullButton} />
      </View>
    </Card>
  );
}

export function LearnPanel({ topic, progress, onComplete, preview = false }: { topic: Pick<GrammarTopicSummary, 'description' | 'rules' | 'tone'>; progress: Pick<GrammarProgress, 'completedSteps'>; onComplete: () => void; preview?: boolean }) {
  const learned = progress.completedSteps.includes('learn');

  return (
    <Card title="Learn" eyebrow="Topic explanation">
      <Text style={styles.bodyTextLarge}>{topic.description}</Text>
      <View style={styles.ruleList}>
        {topic.rules.map((rule) => (
          <View key={rule.id} style={styles.ruleItem}>
            <LearningIconBubble icon={learningIcons.check} tone={topic.tone} size={38} />
            <View style={styles.ruleCopy}>
              <Text style={styles.ruleTitle}>{rule.title}</Text>
              <Text style={styles.bodyText}>{rule.body}</Text>
            </View>
          </View>
        ))}
      </View>
      <Button label={learned ? 'Learn Step Completed' : 'Mark Learn Step Complete'} disabled={preview} variant={learned ? 'secondary' : 'primary'} onPress={onComplete} style={styles.fullButton} />
    </Card>
  );
}

function ExampleBox({ sentence, label, note, good }: { sentence: string; label: string; note: string; good: boolean }) {
  return (
    <View style={[styles.exampleBox, good ? styles.exampleGood : styles.exampleBad]}>
      <Text style={styles.exampleLabel}>{label}</Text>
      <Text style={styles.exampleSentence}>{sentence}</Text>
      <Text style={styles.exampleNote}>{note}</Text>
    </View>
  );
}

function ExamplesPanel({ topic, onComplete }: { topic: GrammarTopicSummary; onComplete: () => void }) {
  return (
    <Card title="Examples" eyebrow="Positive, negative, academic">
      <View style={styles.exampleGrid}>
        {topic.positiveExamples.map((example) => <ExampleBox key={example.id} sentence={example.sentence} label={example.label} note={example.note} good />)}
        {topic.negativeExamples.map((example) => <ExampleBox key={example.id} sentence={example.sentence} label={example.label} note={example.note} good={false} />)}
        {topic.academicExamples.map((example) => <ExampleBox key={example.id} sentence={example.sentence} label={example.label} note={example.note} good />)}
      </View>
      <Button label="Examples Reviewed" variant="secondary" onPress={onComplete} style={styles.fullButton} />
    </Card>
  );
}

function MistakesPanel({ topic, onComplete }: { topic: GrammarTopicSummary; onComplete: () => void }) {
  return (
    <Card title="Common Mistakes" eyebrow="What to fix">
      <View style={styles.mistakeList}>
        {topic.commonMistakes.map((mistake) => (
          <View key={mistake.id} style={styles.mistakeCard}>
            <Text style={styles.exampleLabel}>Needs revision</Text>
            <Text style={styles.wrongSentence}>{mistake.wrong}</Text>
            <Text style={styles.exampleLabel}>Better</Text>
            <Text style={styles.rightSentence}>{mistake.right}</Text>
            <Text style={styles.exampleNote}>{mistake.note}</Text>
          </View>
        ))}
      </View>
      <Button label="Mistakes Reviewed" variant="secondary" onPress={onComplete} style={styles.fullButton} />
    </Card>
  );
}

function OptionRow({ option, selected, disabled, onSelect }: { option: GrammarExerciseOption; selected: boolean; disabled?: boolean; onSelect: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={option.label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onSelect}
      style={({ pressed }) => [styles.optionRow, selected ? styles.optionSelected : null, disabled ? styles.disabled : null, pressed ? styles.pressed : null]}
    >
      <View style={[styles.optionDot, selected ? styles.optionDotSelected : null]} />
      <Text style={styles.optionText}>{option.label}</Text>
    </Pressable>
  );
}

function PracticePanel({
  topic,
  session,
  question,
  selectedOptionId,
  onStart,
  onSelect,
  onSubmit,
}: {
  topic: GrammarTopicSummary;
  session: GrammarSession | null;
  question?: GrammarQuestion;
  selectedOptionId: string | null;
  onStart: () => void;
  onSelect: (optionId: string) => void;
  onSubmit: () => void;
}) {
  if (!session || !question) {
    return (
      <Card title="Guided Practice" eyebrow="Short practice">
        <EmptyState title="Ready when you are" text={`Start a short ${topic.title} practice set with multiple choice, correction, fill in blank, and sentence building.`} action={<Button label="Start Guided Practice" onPress={onStart} />} />
      </Card>
    );
  }

  const typeLabel = question.type.replace(/-/g, ' ');

  return (
    <Card title="Guided Practice" eyebrow={typeLabel} right={<Badge label={`${Math.min(session.currentIndex + 1, session.questionIds.length)} / ${session.questionIds.length}`} tone="blue" />}>
      <Text style={styles.practicePrompt}>{question.prompt}</Text>
      <Text style={styles.practiceStem}>{question.stem}</Text>
      <View style={styles.optionList}>
        {question.options.map((option) => <OptionRow key={option.id} option={option} selected={selectedOptionId === option.id} onSelect={() => onSelect(option.id)} />)}
      </View>
      <Button label="Submit Answer" onPress={onSubmit} disabled={!selectedOptionId} style={styles.stickyActionButton} right={<LearningIcon name={learningIcons.arrow} color={studentTokens.navy} size={16} />} />
    </Card>
  );
}

function MiniQuizPanel({ topic, onStart }: { topic: GrammarTopicSummary; onStart: () => void }) {
  const exerciseTypes = getGrammarExerciseTypes();

  return (
    <Card title="Mini Quiz" eyebrow="Mixed check">
      <Text style={styles.bodyTextLarge}>A short quiz checks whether you can recognize and apply {topic.title.toLowerCase()} in TOEFL-style sentences.</Text>
      <View style={styles.quizTypeGrid}>
        {exerciseTypes.map((type) => (
          <View key={type} style={styles.quizTypePill}>
            <Text style={styles.quizTypeText}>{type.replace(/-/g, ' ')}</Text>
          </View>
        ))}
      </View>
      <Button label="Start Mini Quiz" onPress={onStart} style={styles.fullButton} />
    </Card>
  );
}

function ResultsPanel({ summary, onBack, onRepeat, onNext }: { summary: GrammarSummary | null; onBack: () => void; onRepeat: () => void; onNext: () => void }) {
  if (!summary) {
    return <Card title="Results" eyebrow="Session summary"><EmptyState title="No results yet" text="Complete a guided practice session to see your accuracy and mastery change." /></Card>;
  }

  return (
    <Card style={styles.resultsCard} contentStyle={styles.resultsBody}>
      <View style={styles.resultsIcon}><LearningIcon name={learningIcons.check} color={studentTokens.teal} size={32} /></View>
      <Text style={styles.resultsTitle}>Practice complete</Text>
      <Text style={styles.resultsText}>Your grammar mastery has been updated.</Text>
      <View style={styles.resultsGrid}>
        <ResultStat label="Accuracy" value={`${summary.accuracy}%`} tone="teal" />
        <ResultStat label="Correct" value={String(summary.correct)} tone="blue" />
        <ResultStat label="Mistakes" value={String(summary.incorrect)} tone="orange" />
        <ResultStat label="Mastery" value={`${summary.masteryBefore}% to ${summary.masteryAfter}%`} tone="yellow" />
      </View>
      <View style={styles.recommendationBox}>
        <Text style={styles.orangeLabel}>RECOMMENDED NEXT TOPIC</Text>
        <Text style={styles.cardTitle}>{summary.recommendedNextTopic?.title ?? 'Review weak items'}</Text>
        <Text style={styles.bodyText}>{summary.repeatWeakItems.length ? 'Repeat missed questions before moving on.' : 'Move to the next grammar topic when ready.'}</Text>
      </View>
      <View style={styles.summaryActions}>
        <Button label="Back to Grammar" variant="secondary" onPress={onBack} style={styles.actionButton} />
        <Button label="Repeat Weak Items" variant="secondary" onPress={onRepeat} style={styles.actionButton} />
        <Button label="Next Topic" onPress={onNext} style={styles.actionButton} />
      </View>
    </Card>
  );
}

function ResultStat({ label, value, tone }: { label: string; value: string; tone: 'teal' | 'blue' | 'orange' | 'yellow' }) {
  const colorMap = { teal: studentTokens.teal, blue: studentTokens.blue, orange: studentTokens.orange, yellow: studentTokens.yellowDeep };
  return (
    <View style={styles.resultStat}>
      <Text style={[styles.resultStatValue, { color: colorMap[tone] }]}>{value}</Text>
      <Text style={styles.resultStatLabel}>{label}</Text>
    </View>
  );
}

export function GrammarTopicPage({ user, topicSlug }: { user: AuthUser; topicSlug: string }) {
  const router = useRouter();
  const { store, loading, error, updateStore } = useGrammarStore(user);
  const decodedSlug = decodeURIComponent(topicSlug);
  const topic = useMemo(() => getGrammarTopicSummaries(store.progress).find((item) => item.slug === decodedSlug), [decodedSlug, store.progress]);
  const [activeTab, setActiveTab] = useState<DetailTab>(() => {
    const active = activeSessionForStore(readStore(user.id));
    const seedTopic = getGrammarTopicBySlug(decodedSlug);
    return active?.topicId === seedTopic?.id ? 'practice' : 'learn';
  });
  const [session, setSession] = useState<GrammarSession | null>(() => {
    const active = activeSessionForStore(readStore(user.id));
    const seedTopic = getGrammarTopicBySlug(decodedSlug);
    return active?.topicId === seedTopic?.id ? active : null;
  });
  const [beforeProgress, setBeforeProgress] = useState<GrammarProgress[]>(() => store.progress);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [summary, setSummary] = useState<GrammarSummary | null>(() => (session?.status === 'completed' ? summarizeGrammarSession(session, store.progress, store.progress) : null));

  const topicProgress = topic ? mergeGrammarProgress(store.progress).find((item) => item.topicId === topic.id) : undefined;
  const currentQuestion = session ? getGrammarQuestionById(session.questionIds[session.currentIndex]) : undefined;

  const goBack = () => router.replace('/grammar' as Href);

  const startSession = (mode: 'topic' | 'personalized' | 'review' = 'topic') => {
    if (!topic) return;
    const nextSession = createGrammarSession(topic.slug, mode, store.progress);
    const sessions = [...store.sessions.filter((item) => item.id !== nextSession.id), nextSession];
    updateStore({ ...store, sessions, activeSessionId: nextSession.id });
    setBeforeProgress(store.progress);
    setSession(nextSession);
    setSelectedOptionId(null);
    setSummary(null);
    setActiveTab('practice');
  };

  const completeStep = (step: GrammarStep) => {
    if (!topic) return;
    const progress = markGrammarStep(store.progress, topic.id, step);
    updateStore({ ...store, progress });
  };

  const submitAnswer = () => {
    if (!topic || !session || !currentQuestion || !selectedOptionId) return;
    const result = evaluateGrammarAnswer(currentQuestion, selectedOptionId);
    const nextProgress = applyGrammarResult(store.progress, topic.id, result);
    const nextIndex = session.currentIndex + 1;
    const isComplete = nextIndex >= session.questionIds.length;
    const nextSession: GrammarSession = {
      ...session,
      currentIndex: nextIndex,
      results: [...session.results, result],
      status: isComplete ? 'completed' : 'in-progress',
      completedAt: isComplete ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    const sessions = [...store.sessions.filter((item) => item.id !== nextSession.id), nextSession];
    updateStore({ ...store, progress: nextProgress, sessions, activeSessionId: isComplete ? null : nextSession.id });
    setSession(nextSession);
    setSelectedOptionId(null);

    if (isComplete) {
      setSummary(summarizeGrammarSession(nextSession, beforeProgress, nextProgress));
      setActiveTab('results');
    }
  };

  const openNextTopic = () => {
    if (!summary?.recommendedNextTopic) {
      goBack();
      return;
    }
    router.replace(('/grammar/' + encodeURIComponent(summary.recommendedNextTopic.slug)) as Href);
  };

  if (loading) return <GrammarLoading />;
  if (error) return <View style={styles.page}><ErrorState title="Grammar could not load" text={error} action={<Button label="Back to Grammar" variant="secondary" onPress={goBack} />} /></View>;
  if (!topic || !topicProgress) return <View style={styles.page}><EmptyState title="Topic not found" text="Choose another grammar topic from the catalog." action={<Button label="Back to Grammar" onPress={goBack} />} /></View>;
  if (topic.isPremium && user.plan !== 'premium') {
    return (
      <View style={styles.page}>
        <TopicHeader topic={topic} progress={topicProgress} onBack={goBack} onStart={() => router.push('/account/subscription' as Href)} />
        <Card title="Premium topic" eyebrow="Upgrade required">
          <EmptyState title="This grammar topic is Premium" text="Upgrade to continue with advanced TOEFL grammar practice." action={<Button label="View Subscription" onPress={() => router.push('/account/subscription' as Href)} />} />
        </Card>
      </View>
    );
  }

  return (
    <View testID="grammar-topic-screen" style={styles.page}>
      <TopicHeader topic={topic} progress={topicProgress} onBack={goBack} onStart={() => startSession('topic')} />
      <StepTabs value={activeTab} onChange={setActiveTab} includeResults={Boolean(summary)} />

      {activeTab === 'learn' ? <LearnPanel topic={topic} progress={topicProgress} onComplete={() => completeStep('learn')} /> : null}
      {activeTab === 'examples' ? <ExamplesPanel topic={topic} onComplete={() => completeStep('examples')} /> : null}
      {activeTab === 'mistakes' ? <MistakesPanel topic={topic} onComplete={() => completeStep('mistakes')} /> : null}
      {activeTab === 'practice' ? <PracticePanel topic={topic} session={session} question={currentQuestion} selectedOptionId={selectedOptionId} onStart={() => startSession('topic')} onSelect={setSelectedOptionId} onSubmit={submitAnswer} /> : null}
      {activeTab === 'quiz' ? <MiniQuizPanel topic={topic} onStart={() => startSession('review')} /> : null}
      {activeTab === 'results' ? <ResultsPanel summary={summary} onBack={goBack} onRepeat={() => startSession('review')} onNext={openNextTopic} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', gap: 16, paddingBottom: 30 },
  pressed: { opacity: 0.76 },
  disabled: { opacity: 0.58 },
  locked: { opacity: 0.62 },
  orangeLabel: { color: studentTokens.orange, fontFamily, fontSize: 11, lineHeight: 16, fontWeight: '700', textTransform: 'uppercase' },
  bodyText: { color: studentTokens.text, fontFamily, fontSize: 14, lineHeight: 20, fontWeight: '500', flexShrink: 1 },
  bodyTextLarge: { color: studentTokens.text, fontFamily, fontSize: 15, lineHeight: 23, fontWeight: '500' },
  cardTitle: { color: studentTokens.ink, fontFamily, fontSize: 15, lineHeight: 20, fontWeight: '700', flexShrink: 1 },
  sectionHint: { color: studentTokens.muted, fontFamily, fontSize: 14, lineHeight: 21, fontWeight: '500', marginBottom: 14 },
  statsGridFallback: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  loadingHeader: { width: '58%', height: 72 },
  loadingStat: { flexGrow: 1, flexBasis: 210, height: 124 },
  loadingPanel: { width: '100%', height: 240 },
  ctaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  continueCard: { backgroundColor: '#001b48', borderColor: '#061f55', borderRadius: 11 },
  continueBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  continueCopy: { flex: 1, minWidth: 220, gap: 9 },
  continueTitle: { color: '#ffffff', fontFamily, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  onNavyText: { color: '#d8e3ff', fontFamily, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  mainGrid: { gap: 14 },
  mainGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  primaryColumn: { flex: 1, minWidth: 0, gap: 14 },
  sideColumn: { width: 300, maxWidth: '100%', gap: 14, flexShrink: 0 },
  catalogControls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { flexGrow: 1, flexBasis: 270, minWidth: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  categoryBody: { gap: 12 },
  categoryHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  categoryCopy: { flex: 1, minWidth: 0, gap: 4 },
  categoryTitle: { color: studentTokens.ink, fontFamily, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  categoryMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaText: { color: studentTokens.muted, fontFamily, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  topicList: { gap: 7 },
  topicRow: { minHeight: 50, borderRadius: 9, borderWidth: 1, borderColor: '#edf1f6', backgroundColor: '#fbfcff', paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  topicCopy: { flex: 1, minWidth: 0, gap: 2 },
  topicTitle: { color: studentTokens.ink, fontFamily, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  topicMeta: { color: studentTokens.muted, fontFamily, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  recommendationList: { gap: 8 },
  recommendationRow: { minHeight: 58, borderRadius: 10, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: '#fbfcff', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankBubble: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rankText: { fontFamily, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  recommendationCopy: { flex: 1, minWidth: 0, gap: 2 },
  priorityText: { color: studentTokens.navy, fontFamily, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  activityList: { gap: 2 },
  activityRow: { minHeight: 58, borderBottomWidth: 1, borderBottomColor: studentTokens.lineSoft, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 11 },
  activityIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: studentTokens.neutral, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityCopy: { flex: 1, minWidth: 0, gap: 2 },
  topicHero: { backgroundColor: '#001b48', borderColor: '#061f55', borderRadius: 11 },
  topicHeroBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' },
  topicHeroCopy: { flex: 1, minWidth: 240, gap: 9 },
  backButton: { alignSelf: 'flex-start', minHeight: 36, borderRadius: 8 },
  detailTitle: { color: '#ffffff', fontFamily, fontSize: 30, lineHeight: 37, fontWeight: '700' },
  detailSubtitle: { color: '#d8e3ff', fontFamily, fontSize: 15, lineHeight: 23, fontWeight: '500', maxWidth: 760 },
  metaWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  masteryPanel: { width: 220, maxWidth: '100%', borderRadius: 11, backgroundColor: '#ffffff', padding: 14, gap: 8, flexShrink: 0 },
  masteryValue: { color: studentTokens.navy, fontFamily, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  masteryLabel: { color: studentTokens.muted, fontFamily, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  fullButton: { width: '100%', minHeight: 46, borderRadius: 8 },
  stepTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderRadius: 14, borderWidth: 1, borderColor: studentTokens.lineSoft, backgroundColor: studentTokens.neutral, padding: 5 },
  stepTab: { minHeight: 44, borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  stepTabActive: { backgroundColor: studentTokens.navy },
  stepTabText: { color: studentTokens.text, fontFamily, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  stepTabTextActive: { color: '#ffffff', fontWeight: '700' },
  ruleList: { gap: 10, marginTop: 14 },
  ruleItem: { borderRadius: 10, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: '#fbfcff', padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  ruleCopy: { flex: 1, minWidth: 0, gap: 4 },
  ruleTitle: { color: studentTokens.ink, fontFamily, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  exampleGrid: { gap: 10 },
  exampleBox: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 6 },
  exampleGood: { borderColor: '#bfe6d2', backgroundColor: '#effbf6' },
  exampleBad: { borderColor: '#ffd5c6', backgroundColor: '#fff2ec' },
  exampleLabel: { color: studentTokens.orange, fontFamily, fontSize: 11, lineHeight: 15, fontWeight: '700', textTransform: 'uppercase' },
  exampleSentence: { color: studentTokens.ink, fontFamily, fontSize: 16, lineHeight: 24, fontWeight: '500' },
  exampleNote: { color: studentTokens.text, fontFamily, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  mistakeList: { gap: 10 },
  mistakeCard: { borderRadius: 10, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: '#fbfcff', padding: 12, gap: 7 },
  wrongSentence: { color: studentTokens.danger, fontFamily, fontSize: 15, lineHeight: 22, fontWeight: '500' },
  rightSentence: { color: studentTokens.teal, fontFamily, fontSize: 15, lineHeight: 22, fontWeight: '500' },
  practicePrompt: { color: studentTokens.orange, fontFamily, fontSize: 12, lineHeight: 17, fontWeight: '700', textTransform: 'uppercase' },
  practiceStem: { color: studentTokens.ink, fontFamily, fontSize: 17, lineHeight: 25, fontWeight: '500', marginTop: 6 },
  optionList: { gap: 9, marginTop: 14 },
  optionRow: { minHeight: 52, borderRadius: 10, borderWidth: 1, borderColor: studentTokens.line, backgroundColor: studentTokens.surface, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionSelected: { borderColor: studentTokens.blue, backgroundColor: studentTokens.blueSoft },
  optionDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: studentTokens.muted, flexShrink: 0 },
  optionDotSelected: { borderWidth: 5, borderColor: studentTokens.blue, backgroundColor: studentTokens.surface },
  optionText: { color: studentTokens.ink, fontFamily, fontSize: 14, lineHeight: 21, fontWeight: '500', flex: 1, minWidth: 0 },
  stickyActionButton: { width: '100%', minHeight: 50, borderRadius: 8, marginTop: 14 },
  quizTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  quizTypePill: { minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: '#fbfcff', paddingHorizontal: 12, justifyContent: 'center' },
  quizTypeText: { color: studentTokens.text, fontFamily, fontSize: 13, lineHeight: 18, fontWeight: '500', textTransform: 'capitalize' },
  resultsCard: { maxWidth: 820, alignSelf: 'center', width: '100%', borderRadius: 11 },
  resultsBody: { alignItems: 'center', gap: 12 },
  resultsIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: studentTokens.tealSoft, alignItems: 'center', justifyContent: 'center' },
  resultsTitle: { color: studentTokens.ink, fontFamily, fontSize: 28, lineHeight: 35, fontWeight: '700', textAlign: 'center' },
  resultsText: { color: studentTokens.muted, fontFamily, fontSize: 15, lineHeight: 22, fontWeight: '500', textAlign: 'center' },
  resultsGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  resultStat: { flexGrow: 1, flexBasis: 132, minWidth: 126, alignItems: 'center', backgroundColor: studentTokens.neutral, borderRadius: 10, padding: 12 },
  resultStatValue: { fontFamily, fontSize: 23, lineHeight: 28, fontWeight: '700', textAlign: 'center' },
  resultStatLabel: { color: studentTokens.muted, fontFamily, fontSize: 12, lineHeight: 17, fontWeight: '500', textAlign: 'center' },
  recommendationBox: { width: '100%', borderRadius: 10, backgroundColor: studentTokens.yellowSoft, borderWidth: 1, borderColor: '#f3dfa3', padding: 12, gap: 5 },
  summaryActions: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionButton: { flexGrow: 1, flexBasis: 170, minHeight: 48 },
});




