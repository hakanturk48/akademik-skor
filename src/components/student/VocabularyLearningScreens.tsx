import { useCallback, useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type DimensionValue } from 'react-native';

import { ProgressRecommendationPanel } from '@/components/student/RecommendationCards';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Progress,
  Skeleton,
  studentTokens,
} from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';
import {
  buildVocabularyExercise,
  createVocabularySession,
  getInitialVocabularyProgress,
  getNextVocabularyProgress,
  getRecentVocabularyActivity,
  getVocabularyOverview,
  getVocabularyPracticeTypes,
  getVocabularySessionSeed,
  getVocabularySetSummaries,
  getVocabularyWordById,


  mergeVocabularyProgress,
  summarizeVocabularySession,
  type VocabularyActivityItem,
  type VocabularyAnswerKind,
  type VocabularyExercise,
  type VocabularyPracticeType,
  type VocabularyPracticeTypeId,
  type VocabularyProgress,
  type VocabularySession,
  type VocabularySetSummary,
  type VocabularyState,
  type VocabularyTone,
  type VocabularyWordCard,
} from '@/lib/vocabulary';

const fontFamily = 'Quicksand';

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };
type Store = { progress: VocabularyProgress[]; sessions: VocabularySession[]; activeSessionId: string | null };

const symbolName = (ios: string, web: string): AppSymbolName => ({
  ios: ios as SFSymbol,
  android: web as AndroidSymbol,
  web: web as AndroidSymbol,
});

const icons = {
  book: symbolName('book.closed', 'book'),
  headphones: symbolName('headphones', 'headphones'),
  refresh: symbolName('arrow.clockwise', 'refresh'),
  star: symbolName('star.fill', 'star'),
  flame: symbolName('flame.fill', 'whatshot'),
  target: symbolName('target', 'track-changes'),
  play: symbolName('play.fill', 'play-arrow'),
  check: symbolName('checkmark.circle.fill', 'check-circle'),
  lock: symbolName('lock.fill', 'lock'),
  sound: symbolName('speaker.wave.2.fill', 'volume-up'),
  arrow: symbolName('arrow.right', 'arrow-forward'),
  bookmark: symbolName('bookmark.fill', 'bookmark'),
};

function Icon({ name, color = studentTokens.navy, size = 20 }: { name: AppSymbolName; color?: string; size?: number }) {
  return <SymbolView name={name} tintColor={color} size={size} style={{ width: size, height: size }} />;
}

function toneColor(tone: VocabularyTone) {
  const colors: Record<VocabularyTone, string> = {
    blue: studentTokens.blue,
    teal: studentTokens.teal,
    orange: studentTokens.orange,
    purple: '#8d5bd6',
    yellow: studentTokens.yellowDeep,
    navy: studentTokens.navy,
    green: '#138a55',
  };
  return colors[tone];
}

function toneSoft(tone: VocabularyTone) {
  const colors: Record<VocabularyTone, string> = {
    blue: studentTokens.blueSoft,
    teal: studentTokens.tealSoft,
    orange: studentTokens.orangeSoft,
    purple: '#f1eaff',
    yellow: studentTokens.yellowSoft,
    navy: '#eef0f7',
    green: '#e5f6ed',
  };
  return colors[tone];
}

function stateTone(state: VocabularyState): 'default' | 'yellow' | 'teal' | 'orange' | 'blue' {
  if (state === 'mastered' || state === 'strong') return 'teal';
  if (state === 'improving') return 'blue';
  if (state === 'learning') return 'orange';
  return 'default';
}

function readStore(userId: string): Store {
  const fallback: Store = { progress: getInitialVocabularyProgress(), sessions: [], activeSessionId: null };

  if (typeof localStorage === 'undefined') return fallback;

  const raw = localStorage.getItem('akademik-vocabulary-' + userId);
  if (!raw) return fallback;

  const parsed = JSON.parse(raw) as Partial<Store>;
  return {
    progress: mergeVocabularyProgress(parsed.progress),
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    activeSessionId: typeof parsed.activeSessionId === 'string' ? parsed.activeSessionId : null,
  };
}

function useVocabularyStore(user: AuthUser) {
  const [initial] = useState(() => {
    try {
      return { store: readStore(user.id), error: null as string | null };
    } catch {
      return {
        store: { progress: getInitialVocabularyProgress(), sessions: [], activeSessionId: null },
        error: 'Vocabulary verileri yüklenemedi. Lütfen tekrar deneyin.',
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
          localStorage.setItem('akademik-vocabulary-' + user.id, JSON.stringify(next));
        }
        setError(null);
      } catch {
        setError('İlerleme kaydedilemedi. Depolama alanınızı kontrol edin.');
      }
    },
    [user.id],
  );

  return { store, loading, error, updateStore };
}
function VocabularyLoading() {
  return (
    <View style={styles.page}>
      <Skeleton lines={2} style={styles.loadingHeader} />
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((item) => <Skeleton key={item} lines={3} style={styles.loadingStat} />)}
      </View>
      <Skeleton lines={5} style={styles.loadingPanel} />
    </View>
  );
}

function PageHeader({ onPrimary }: { onPrimary: () => void }) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerCopy}>
        <Text style={styles.kicker}>VOCABULARY OVERVIEW</Text>
        <Text style={styles.pageTitle}>Vocabulary</Text>
        <Text style={styles.pageSubtitle}>Build durable academic vocabulary with focused practice and mastery tracking.</Text>
      </View>
      <Button label="Start Review" variant="primary" onPress={onPrimary} left={<Icon name={icons.play} color={studentTokens.navy} size={16} />} />
    </View>
  );
}

function OverviewStat({
  label,
  value,
  note,
  icon,
  tone,
  progress,
  width,
}: {
  label: string;
  value: string;
  note: string;
  icon: AppSymbolName;
  tone: VocabularyTone;
  progress: number;
  width?: DimensionValue;
}) {
  return (
    <Card style={[styles.statCard, { width }]}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, { backgroundColor: toneSoft(tone) }]}>
          <Icon name={icon} color={toneColor(tone)} size={21} />
        </View>
        <View style={styles.statCopy}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statNote}>{note}</Text>
        </View>
      </View>
      <Progress value={progress} color={toneColor(tone)} style={styles.statProgress} />
    </Card>
  );
}

function ContinueReviewCard({
  session,
  onContinue,
  onDismiss,
}: {
  session: VocabularySession | null;
  onContinue: () => void;
  onDismiss: () => void;
}) {
  if (!session) {
    return (
      <Card title="Continue Review" eyebrow="Keep your momentum">
        <EmptyState
          title="No active session"
          text="Choose a practice type and set below to start a vocabulary session."
          action={<Button label="Choose practice" variant="secondary" onPress={onDismiss} />}
        />
      </Card>
    );
  }

  const completed = session.currentIndex;
  const total = session.wordIds.length;

  return (
    <Card style={styles.continueCard}>
      <View style={styles.continueCopy}>
        <Text style={styles.kicker}>CONTINUE REVIEW</Text>
        <Text style={styles.sectionTitle}>{session.title}</Text>
        <Text style={styles.bodyText}>You are on word {Math.min(completed + 1, total)} of {total}. Pick up where you left off.</Text>
        <Progress value={completed} max={Math.max(total, 1)} color={studentTokens.yellowDeep} label={completed + ' of ' + total + ' reviewed'} showValue />
        <Button label="Continue Session" onPress={onContinue} left={<Icon name={icons.play} color={studentTokens.navy} size={16} />} />
      </View>
      <View style={styles.continueIcon}>
        <Icon name={icons.refresh} color={studentTokens.yellowDeep} size={34} />
      </View>
    </Card>
  );
}

function PracticeChoice({
  item,
  selected,
  locked,
  onPress,
}: {
  item: VocabularyPracticeType;
  selected: boolean;
  locked: boolean;
  onPress: () => void;
}) {
  const color = toneColor(item.tone);
  const icon = item.iconKey in icons ? icons[item.iconKey as keyof typeof icons] : icons.book;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={locked ? item.title + ', premium locked' : item.title}
      accessibilityState={{ selected, disabled: locked }}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [styles.practiceChoice, selected ? { borderColor: color, backgroundColor: toneSoft(item.tone) } : null, pressed ? styles.pressed : null, locked ? styles.lockedChoice : null]}
    >
      <View style={[styles.practiceIcon, { backgroundColor: toneSoft(item.tone) }]}>
        <Icon name={locked ? icons.lock : icon} color={color} size={22} />
      </View>
      <View style={styles.practiceCopy}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {locked ? <Badge label="Premium" tone="yellow" /> : null}
        </View>
        <Text style={styles.bodyText} numberOfLines={2}>{item.description}</Text>
      </View>
    </Pressable>
  );
}

function SetCard({ item, width, locked, onPress }: { item: VocabularySetSummary; width?: DimensionValue; locked: boolean; onPress: () => void }) {
  return (
    <Card style={[styles.setCard, { width }]}>
      <View style={styles.setHead}>
        <View style={styles.setIcon}>
          <Icon name={icons.book} color={studentTokens.blue} size={20} />
        </View>
        {locked ? <Badge label="Premium" tone="yellow" /> : <Badge label="Free" tone="teal" />}
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.bodyText} numberOfLines={2}>{item.description}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{item.wordCount} words</Text>
        <Text style={styles.metaText}>{item.level}</Text>
        <Text style={styles.metaText}>{item.estimatedMinutes} min</Text>
      </View>
      <Progress value={item.mastery} color={studentTokens.blue} label={item.mastery + '% mastery'} showValue />
      <View style={styles.setFooter}>
        <Text style={styles.dueText}>{item.dueCount} due for review</Text>
        <Button
          label={locked ? 'View Plan' : item.actionLabel}
          variant={locked ? 'secondary' : 'primary'}
          size="sm"
          onPress={onPress}
          right={<Icon name={locked ? icons.lock : icons.arrow} color={studentTokens.navy} size={14} />}
        />
      </View>
    </Card>
  );
}

function ActivityList({ items }: { items: VocabularyActivityItem[] }) {
  if (!items.length) {
    return <EmptyState title="No recent activity" text="Your reviewed words will appear here after your first session." />;
  }

  return (
    <View style={styles.activityList}>
      {items.map((item) => (
        <View key={item.id} style={styles.activityItem}>
          <View style={styles.activityIcon}><Icon name={item.result === 'correct' ? icons.check : icons.refresh} color={item.result === 'correct' ? studentTokens.teal : studentTokens.orange} size={19} /></View>
          <View style={styles.activityCopy}>
            <Text style={styles.cardTitle}>{item.word}</Text>
            <Text style={styles.bodyText}>{item.setTitle} · {new Date(item.reviewedAt).toLocaleDateString()}</Text>
          </View>
          <Badge label={item.state} tone={stateTone(item.state)} />
        </View>
      ))}
    </View>
  );
}

export function VocabularyLearningPage({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { store, loading, error, updateStore } = useVocabularyStore(user);
  const [selectedPractice, setSelectedPractice] = useState<VocabularyPracticeTypeId>('learn-new');

  const overview = useMemo(() => getVocabularyOverview(store.progress), [store.progress]);
  const sets = useMemo(() => getVocabularySetSummaries(store.progress), [store.progress]);
  const activity = useMemo(() => getRecentVocabularyActivity(store.progress), [store.progress]);
  const activeSession = useMemo(
    () => store.sessions.find((session) => session.id === store.activeSessionId && session.status === 'in-progress') ?? null,
    [store.activeSessionId, store.sessions],
  );
  const isMobile = width < 768;
  const isTablet = width >= 768;
  const isDesktop = width >= 1100;
  const statWidth = isMobile ? '100%' : isTablet ? '48%' : undefined;
  const setWidth = isDesktop ? undefined : isTablet ? styles.setCardTablet.width : styles.setCardMobile.width;

  const openSession = useCallback(
    (practiceTypeId: VocabularyPracticeTypeId, setId: string) => {
      const session = createVocabularySession(practiceTypeId, setId, store.progress);
      const sessions = [...store.sessions.filter((item) => item.id !== session.id), session];
      updateStore({ ...store, sessions, activeSessionId: session.id });
      router.push('/vocabulary/session/' + encodeURIComponent(session.id) as Href);
    },
    [router, store, updateStore],
  );

  const openReview = () => {
    if (activeSession) {
      router.push('/vocabulary/session/' + encodeURIComponent(activeSession.id) as Href);
    } else {
      const firstSet = sets[0];
      if (firstSet) openSession('review-due', firstSet.id);
    }
  };

  if (loading) return <VocabularyLoading />;
  if (error) {
    return (
      <View style={styles.page}>
        <ErrorState title="Vocabulary could not load" text={error} action={<Button label="Try again" variant="secondary" onPress={() => updateStore(readStore(user.id))} />} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <PageHeader onPrimary={openReview} />

      <View style={styles.statsGrid}>
        <OverviewStat label="Words Learned" value={String(overview.wordsLearned)} note="Across your library" icon={icons.book} tone="blue" progress={overview.wordsLearned} width={statWidth} />
        <OverviewStat label="Due for Review" value={String(overview.dueForReview)} note="Ready today" icon={icons.refresh} tone="teal" progress={overview.dueForReview} width={statWidth} />
        <OverviewStat label="Mastered" value={String(overview.mastered)} note="Strong and mastered" icon={icons.star} tone="purple" progress={overview.mastered} width={statWidth} />
        <OverviewStat label="Weekly Goal" value={Math.min(activity.length, overview.weeklyGoal) + ' / ' + overview.weeklyGoal} note="Words reviewed this week" icon={icons.target} tone="yellow" progress={activity.length} width={statWidth} />
      </View>

      <ContinueReviewCard session={activeSession} onContinue={openReview} onDismiss={() => setSelectedPractice('learn-new')} />

      <ProgressRecommendationPanel user={user} context="vocabulary" skill="vocabulary" limit={2} title="Recommended Next" eyebrow="Rule-based review" />

      <Card title="Choose Your Practice" eyebrow="Select a focused path">
        <Text style={styles.sectionHint}>Choose a practice type, then select a vocabulary set to start your session.</Text>
        <View style={styles.practiceGrid}>
          {getVocabularyPracticeTypes().map((item) => (
            <PracticeChoice
              key={item.id}
              item={item}
              selected={selectedPractice === item.id}
              locked={item.isPremium && user.plan !== 'premium'}
              onPress={() => setSelectedPractice(item.id)}
            />
          ))}
        </View>
      </Card>

      <Card title="Vocabulary Sets" eyebrow="Choose your content">
        <View style={styles.setGrid}>
          {sets.map((item) => (
            <SetCard
              key={item.id}
              item={item}
              width={setWidth}
              locked={item.isPremium && user.plan !== 'premium'}
              onPress={() => item.isPremium && user.plan !== 'premium' ? router.push('/account/subscription' as Href) : openSession(selectedPractice, item.id)}
            />
          ))}
        </View>
      </Card>

      <Card title="Recent Activity" eyebrow="Your latest reviews" right={<Icon name={icons.arrow} color={studentTokens.muted} size={18} />}>
        <ActivityList items={activity} />
      </Card>
    </View>
  );
}


export function WordFlashcard({
  word,
  progress,
  onAnswer,
  onToggleSaved,
  preview = false,
}: {
  word: VocabularyWordCard;
  progress: VocabularyProgress;
  onAnswer: (kind: VocabularyAnswerKind) => void;
  onToggleSaved: () => void;
  preview?: boolean;
}) {
  const [audioPlaying, setAudioPlaying] = useState(false);

  return (
    <Card style={styles.flashcard}>
      <View style={styles.flashcardTop}>
        <Badge label={progress.state} tone={stateTone(progress.state)} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={progress.saved ? 'Remove word from saved words' : 'Save word'}
          disabled={preview}
          accessibilityState={{ selected: progress.saved }}
          onPress={onToggleSaved}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        >
          <Icon name={icons.bookmark} color={progress.saved ? studentTokens.yellowDeep : studentTokens.muted} size={20} />
        </Pressable>
      </View>
      <Text style={styles.word}>{word.word}</Text>
      <View style={styles.pronunciationRow}>
        <Text style={styles.ipa}>{word.ipa}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={audioPlaying ? 'Stop pronunciation' : 'Play pronunciation'}
          disabled={preview}
          onPress={() => setAudioPlaying((value) => !value)}
          style={({ pressed }) => [styles.audioButton, audioPlaying ? styles.audioButtonActive : null, pressed ? styles.pressed : null]}
        >
          <Icon name={icons.sound} color={audioPlaying ? studentTokens.surface : studentTokens.navy} size={18} />
          <Text style={[styles.audioButtonText, audioPlaying ? styles.audioButtonTextActive : null]}>{audioPlaying ? 'Playing' : 'Listen'}</Text>
        </Pressable>
      </View>
      <Text style={styles.partOfSpeech}>{word.partOfSpeech} · {word.pronunciationLabel}</Text>
      <View style={styles.definitionBlock}>
        <Text style={styles.definition}>{word.definition}</Text>
        {word.translation ? <Text style={styles.translation}>{word.translation}</Text> : null}
      </View>
      <View style={styles.exampleBlock}>
        <Text style={styles.detailLabel}>ACADEMIC EXAMPLE</Text>
        <Text style={styles.detailText}>{word.academicExample}</Text>
      </View>
      <View style={styles.exampleBlock}>
        <Text style={styles.detailLabel}>TOEFL CONTEXT</Text>
        <Text style={styles.detailText}>{word.toeflExample}</Text>
      </View>
      <View style={styles.detailGrid}>
        <DetailGroup label="Collocations" values={word.collocations} />
        <DetailGroup label="Word family" values={word.wordFamily} />
        <DetailGroup label="Synonyms" values={word.synonyms} />
        <DetailGroup label="Antonyms" values={word.antonyms} />
      </View>
      <View style={styles.flashcardActions}>
        <Button label="Need Practice" disabled={preview} variant="secondary" onPress={() => onAnswer('practice')} style={styles.actionButton} />
        <Button label="I Know This" disabled={preview} onPress={() => onAnswer('know')} style={styles.actionButton} right={<Icon name={icons.check} color={studentTokens.navy} size={16} />} />
      </View>
    </Card>
  );
}

function DetailGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <View style={styles.detailGroup}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {values.map((value) => <Badge key={value} label={value} tone="default" />)}
      </View>
    </View>
  );
}

function ExercisePanel({
  exercise,
  onSubmit,
}: {
  exercise: VocabularyExercise;
  onSubmit: (optionId: string) => void;
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  return (
    <Card style={styles.exerciseCard}>
      <Text style={styles.kicker}>QUICK EXERCISE</Text>
      <Text style={styles.exerciseTitle}>{exercise.prompt}</Text>
      <Text style={styles.exerciseStem}>{exercise.stem}</Text>
      <View style={styles.exerciseOptions}>
        {exercise.options.map((option) => {
          const selected = selectedOption === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setSelectedOption(option.id)}
              style={({ pressed }) => [styles.exerciseOption, selected ? styles.exerciseOptionSelected : null, pressed ? styles.pressed : null]}
            >
              <View style={[styles.optionDot, selected ? styles.optionDotSelected : null]} />
              <Text style={styles.optionText}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Button label="Submit Answer" onPress={() => selectedOption && onSubmit(selectedOption)} disabled={!selectedOption} style={styles.fullButton} right={<Icon name={icons.arrow} color={studentTokens.navy} size={16} />} />
    </Card>
  );
}

function SessionSummary({ summary, onHome, onNext }: { summary: ReturnType<typeof summarizeVocabularySession>; onHome: () => void; onNext: () => void }) {
  return (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryIcon}><Icon name={icons.check} color={studentTokens.teal} size={32} /></View>
      <Text style={styles.summaryTitle}>Session complete</Text>
      <Text style={styles.summaryText}>Your vocabulary progress has been saved.</Text>
      <View style={styles.summaryStats}>
        <SummaryStat label="Correct" value={summary.correct} tone="teal" />
        <SummaryStat label="Incorrect" value={summary.incorrect} tone="orange" />
        <SummaryStat label="Newly learned" value={summary.newlyLearned} tone="blue" />
        <SummaryStat label="Needs review" value={summary.needsReview} tone="yellow" />
      </View>
      <View style={styles.masteryChange}>
        <Text style={styles.detailLabel}>MASTERY CHANGE</Text>
        <Text style={styles.masteryValue}>{summary.masteryChange >= 0 ? '+' : ''}{summary.masteryChange}%</Text>
      </View>
      <View style={styles.recommendation}>
        <Text style={styles.detailLabel}>RECOMMENDED NEXT ACTION</Text>
        <Text style={styles.detailText}>{summary.recommendedNextAction}</Text>
      </View>
      <View style={styles.summaryActions}>
        <Button label="Back to Vocabulary" variant="secondary" onPress={onHome} style={styles.actionButton} />
        <Button label="Practice Again" onPress={onNext} style={styles.actionButton} />
      </View>
    </Card>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: 'teal' | 'orange' | 'blue' | 'yellow' }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={[styles.summaryStatValue, { color: toneColor(tone) }]}>{value}</Text>
      <Text style={styles.summaryStatLabel}>{label}</Text>
    </View>
  );
}

function SessionHeader({ session, index, onBack }: { session: VocabularySession; index: number; onBack: () => void }) {
  return (
    <View style={styles.sessionHeader}>
      <Button label="Vocabulary" variant="ghost" size="sm" onPress={onBack} left={<Icon name={icons.arrow} color={studentTokens.navy} size={16} />} />
      <View style={styles.sessionHeaderCopy}>
        <Text style={styles.kicker}>VOCABULARY SESSION</Text>
        <Text style={styles.sessionTitle}>{session.title}</Text>
      </View>
      <Text style={styles.sessionCount}>{Math.min(index + 1, session.wordIds.length)} / {session.wordIds.length}</Text>
    </View>
  );
}

export function VocabularySessionPage({ user, sessionId }: { user: AuthUser; sessionId: string }) {
  const router = useRouter();
  const { store, loading, error, updateStore } = useVocabularyStore(user);
  const [session, setSession] = useState<VocabularySession | null>(() => {
    const decodedId = decodeURIComponent(sessionId);
    const existing = store.sessions.find((item) => item.id === decodedId);
    return existing ?? getVocabularySessionSeed(decodedId, store.progress);
  });
  const [beforeProgress] = useState<VocabularyProgress[]>(() => store.progress);
  const [phase, setPhase] = useState<'flashcard' | 'exercise' | 'summary'>(() => {
    const decodedId = decodeURIComponent(sessionId);
    return store.sessions.find((item) => item.id === decodedId)?.status === 'completed' ? 'summary' : 'flashcard';
  });  const [answerKind, setAnswerKind] = useState<VocabularyAnswerKind>('know');
  const [exercise, setExercise] = useState<VocabularyExercise | null>(null);
  const [summary, setSummary] = useState<ReturnType<typeof summarizeVocabularySession> | null>(() => {
    const decodedId = decodeURIComponent(sessionId);
    const existing = store.sessions.find((item) => item.id === decodedId);
    return existing?.status === 'completed' ? summarizeVocabularySession(existing, store.progress, store.progress) : null;
  });

  const progressMap = useMemo(
    () => new Map(mergeVocabularyProgress(store.progress).map((item) => [item.wordId, item])),
    [store.progress],
  );
  const currentWord = session ? getVocabularyWordById(session.wordIds[session.currentIndex]) : undefined;
  const currentProgress = currentWord ? progressMap.get(currentWord.id) ?? getInitialVocabularyProgress().find((item) => item.wordId === currentWord.id) : undefined;

  const goHome = () => router.replace('/vocabulary' as Href);

  const handleAnswer = (kind: VocabularyAnswerKind) => {
    if (!currentWord) return;
    setAnswerKind(kind);
    setExercise(buildVocabularyExercise(currentWord, session?.currentIndex ?? 0));
    setPhase('exercise');
  };

  const handleToggleSaved = () => {
    if (!currentWord || !currentProgress) return;
    const nextProgress = { ...currentProgress, saved: !currentProgress.saved };
    const next = mergeVocabularyProgress(store.progress.map((item) => item.wordId === nextProgress.wordId ? nextProgress : item));
    updateStore({ ...store, progress: next });
  };

  const handleSubmitExercise = (optionId: string) => {
    if (!session || !currentWord || !currentProgress || !exercise) return;
    const isCorrect = optionId === exercise.correctOptionId;
    const result = {
      wordId: currentWord.id,
      answerKind,
      exerciseType: exercise.type,
      isCorrect,
      answeredAt: new Date().toISOString(),
    };
    const nextProgress = getNextVocabularyProgress(currentProgress, result);
    const nextProgressList = mergeVocabularyProgress(store.progress.map((item) => item.wordId === nextProgress.wordId ? nextProgress : item));
    const results = [...session.results, result];
    const nextIndex = session.currentIndex + 1;
    const isComplete = nextIndex >= session.wordIds.length;
    const nextSession: VocabularySession = {
      ...session,
      currentIndex: nextIndex,
      results,
      status: isComplete ? 'completed' : 'in-progress',
      completedAt: isComplete ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    const sessions = [...store.sessions.filter((item) => item.id !== nextSession.id), nextSession];
    updateStore({ ...store, progress: nextProgressList, sessions, activeSessionId: isComplete ? null : nextSession.id });
    setSession(nextSession);
    setExercise(null);
    setPhase(isComplete ? 'summary' : 'flashcard');

    if (isComplete) {
      setSummary(summarizeVocabularySession(nextSession, beforeProgress, nextProgressList));
    }
  };

  if (loading) return <VocabularyLoading />;
  if (error) {
    return <View style={styles.page}><ErrorState title="Session could not load" text={error} action={<Button label="Back to Vocabulary" variant="secondary" onPress={goHome} />} /></View>;
  }
  if (!session || !session.wordIds.length || (phase !== 'summary' && (!currentWord || !currentProgress))) {
    return <View style={styles.page}><EmptyState title="This session is empty" text="Choose another vocabulary set to begin learning." action={<Button label="Back to Vocabulary" onPress={goHome} />} /></View>;
  }

  return (
    <View style={styles.page}>
      <SessionHeader session={session} index={session.currentIndex} onBack={goHome} />
      <Progress value={session.currentIndex} max={Math.max(session.wordIds.length, 1)} color={studentTokens.yellowDeep} style={styles.sessionProgress} />
      {phase === 'flashcard' && currentWord && currentProgress ? <WordFlashcard word={currentWord} progress={currentProgress} onAnswer={handleAnswer} onToggleSaved={handleToggleSaved} /> : null}
      {phase === 'exercise' && exercise ? <ExercisePanel exercise={exercise} onSubmit={handleSubmitExercise} /> : null}
      {phase === 'summary' && summary ? <SessionSummary summary={summary} onHome={goHome} onNext={() => router.replace('/vocabulary' as Href)} /> : null}
    </View>
  );
}


const styles = StyleSheet.create({
  page: {
    width: '100%',
    gap: 16,
    paddingBottom: 28,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 18,
    flexWrap: 'wrap',
  },
  headerCopy: {
    flex: 1,
    minWidth: 220,
  },
  kicker: {
    color: studentTokens.orange,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  pageTitle: {
    color: studentTokens.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    marginTop: 2,
  },
  pageSubtitle: {
    color: studentTokens.muted,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginTop: 4,
    maxWidth: 680,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    minWidth: 0,
    flexGrow: 1,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statCopy: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    color: studentTokens.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    color: studentTokens.ink,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '700',
  },
  statNote: {
    color: studentTokens.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  statProgress: {
    marginTop: 16,
  },
  continueCard: {
    backgroundColor: studentTokens.navy,
    borderColor: studentTokens.navy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  continueCopy: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  continueIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a3b58',
  },
  sectionTitle: {
    color: studentTokens.surface,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  sectionHint: {
    color: studentTokens.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 14,
  },
  bodyText: {
    color: studentTokens.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    flexShrink: 1,
  },

  practiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  practiceChoice: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 210,
    minHeight: 86,
    borderWidth: 1,
    borderColor: studentTokens.line,
    borderRadius: 10,
    backgroundColor: studentTokens.surface,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  lockedChoice: {
    opacity: 0.65,
  },
  practiceIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  practiceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    color: studentTokens.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    flexShrink: 1,
  },
  setGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  setCard: {
    flexBasis: 220,
    minWidth: 0,
    flexGrow: 1,
    gap: 10,
  },
  setCardDesktop: {
    width: '31.5%',
    maxWidth: '32%',
    minWidth: 220,
  },
  setCardTablet: {
    width: '48%',
    minWidth: 250,
  },
  setCardMobile: {
    width: '100%',
  },
  setHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: studentTokens.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    color: studentTokens.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  setFooter: {
    gap: 10,
  },
  dueText: {
    color: studentTokens.orange,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  activityList: {
    gap: 2,
  },
  activityItem: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: studentTokens.lineSoft,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: studentTokens.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  loadingHeader: {
    width: '58%',
    height: 72,
  },
  loadingStat: {
    flexGrow: 1,
    flexBasis: 210,
    height: 124,
  },
  loadingPanel: {
    width: '100%',
    height: 220,
  },
  pressed: {
    opacity: 0.78,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  sessionHeaderCopy: {
    flex: 1,
    minWidth: 220,
  },
  sessionTitle: {
    color: studentTokens.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    marginTop: 2,
  },
  sessionCount: {
    color: studentTokens.navy,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  sessionProgress: {
    marginTop: -4,
  },
  flashcard: {
    maxWidth: 820,
    alignSelf: 'center',
    width: '100%',
    gap: 14,
  },
  flashcardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: studentTokens.neutral,
  },
  word: {
    color: studentTokens.ink,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  pronunciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  ipa: {
    color: studentTokens.muted,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  audioButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: studentTokens.yellow,
  },
  audioButtonActive: {
    backgroundColor: studentTokens.teal,
  },
  audioButtonText: {
    color: studentTokens.navy,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  audioButtonTextActive: {
    color: studentTokens.surface,
  },
  partOfSpeech: {
    color: studentTokens.blue,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  definitionBlock: {
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
  },
  definition: {
    color: studentTokens.ink,
    fontSize: 19,
    lineHeight: 27,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 650,
  },
  translation: {
    color: studentTokens.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  exampleBlock: {
    borderLeftWidth: 3,
    borderLeftColor: studentTokens.yellowDeep,
    backgroundColor: studentTokens.yellowSoft,
    padding: 12,
    gap: 4,
  },
  detailLabel: {
    color: studentTokens.orange,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailText: {
    color: studentTokens.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    flexShrink: 1,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailGroup: {
    flex: 1,
    minWidth: 160,
    gap: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  flashcardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    minHeight: 50,
  },
  exerciseCard: {
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
    gap: 12,
  },
  exerciseTitle: {
    color: studentTokens.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  exerciseStem: {
    color: studentTokens.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  exerciseOptions: {
    gap: 9,
    marginTop: 3,
  },
  exerciseOption: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: studentTokens.line,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseOptionSelected: {
    borderColor: studentTokens.blue,
    backgroundColor: studentTokens.blueSoft,
  },
  optionDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: studentTokens.muted,
    flexShrink: 0,
  },
  optionDotSelected: {
    borderWidth: 5,
    borderColor: studentTokens.blue,
    backgroundColor: studentTokens.surface,
  },
  optionText: {
    color: studentTokens.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    flex: 1,
    flexShrink: 1,
  },
  fullButton: {
    width: '100%',
    minHeight: 50,
    marginTop: 4,
  },
  summaryCard: {
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: studentTokens.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    color: studentTokens.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryText: {
    color: studentTokens.muted,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryStats: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 6,
  },
  summaryStat: {
    flexGrow: 1,
    flexBasis: 120,
    minWidth: 120,
    alignItems: 'center',
    backgroundColor: studentTokens.neutral,
    borderRadius: 10,
    padding: 12,
  },
  summaryStatValue: {
    fontFamily: fontFamily, fontSize: 23,
    lineHeight: 28,
    fontWeight: '700',
  },
  summaryStatLabel: {
    color: studentTokens.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
  masteryChange: {
    width: '100%',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: studentTokens.lineSoft,
    paddingTop: 12,
  },
  masteryValue: {
    color: studentTokens.teal,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  recommendation: {
    width: '100%',
    gap: 5,
    backgroundColor: studentTokens.blueSoft,
    borderRadius: 10,
    padding: 12,
  },
  summaryActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});














