import { useCallback, useEffect, useMemo, useState } from "react";
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type DimensionValue } from 'react-native';

import {
  LearningIcon,
  LearningIconBubble,
  LearningMetricGrid,
  LearningPageHeader,
  LearningSectionTitle,
  learningIcons,
  learningSymbolName,
  learningToneColor,
  learningToneSoft,
  type AppSymbolName,
} from '@/components/student/LearningScaffold';
import { Badge, Button, Card, ErrorState, Progress, Skeleton, studentTokens } from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';
import {
  createListeningPracticeHref,
  getListeningHubItems,
  defaultListeningSelection,
  ensureCompatibleSubskill,
  getListeningDifficulties,
  getListeningDifficultyById,
  getListeningLearningChain,
  getListeningLengthById,
  getListeningLengths,
  getListeningPracticeModes,
  getListeningSubskillById,
  getListeningSubskills,
  getListeningTaskTypeById,
  getListeningTaskTypes,
  makeListeningSelection,
  getLatestListeningProgress,
  loadListeningAttempts,
  loadListeningProgressCatalog,
  readListeningAttempts,
  readListeningProgressCatalog,
  syncPublishedListeningHubItems,
  type ListeningAttempt,
  type ListeningHubDisplayItem,
  type ListeningIconKey,
  type ListeningMetric,
  type ListeningPracticeMode,
  type ListeningPracticeModeId,
  type ListeningProgress,
  type ListeningSelection,
  type ListeningTaskTypeId,
  type ListeningTone,
} from '@/lib/listening';
import { formatVideoTimestamp } from '@/lib/video-media';

const fontFamily = 'Quicksand';

type ListeningLearningHubProps = {
  user: AuthUser;
};

type ChoiceItem<TValue extends string> = {
  id: TValue;
  title: string;
  description: string;
  tone?: ListeningTone;
  mastery?: number;
  recentErrors?: number;
};

const iconRegistry: Record<ListeningIconKey, AppSymbolName> = {
  headphones: learningSymbolName('headphones', 'headphones'),
  play: learningIcons.play,
  target: learningIcons.target,
  clock: learningIcons.clock,
  check: learningIcons.check,
  refresh: learningIcons.refresh,
  star: learningIcons.star,
  notes: learningSymbolName('note.text', 'sticky_note_2'),
  layers: learningIcons.layers,
  bolt: learningIcons.bolt,
  book: learningIcons.book,
  quiz: learningSymbolName('checklist', 'checklist'),
};

function iconFor(key: ListeningIconKey) {
  return iconRegistry[key] ?? iconRegistry.headphones;
}

function ListeningLoading() {
  return (
    <View style={styles.page}>
      <Skeleton lines={2} style={styles.loadingHeader} />
      <View style={styles.loadingGrid}>
        {[1, 2, 3, 4].map((item) => <Skeleton key={item} lines={3} style={styles.loadingStat} />)}
      </View>
      <Skeleton lines={6} style={styles.loadingPanel} />
    </View>
  );
}

function ContinueListeningCard({
  progress,
  fallback,
  onContinue,
}: {
  progress: ListeningProgress | null;
  fallback: ListeningHubDisplayItem | null;
  onContinue: () => void;
}) {
  const title = progress?.contentTitle ?? fallback?.title ?? 'No listening in progress';
  const subtitle = progress?.subtitle ?? fallback?.meta ?? 'Start a published listening practice to see your progress here.';
  return (
    <Card style={styles.continueCard} contentStyle={styles.continueBody}>
      <View style={styles.continueCopy}>
        <Text style={styles.orangeLabel}>CONTINUE LISTENING</Text>
        <Text style={styles.continueTitle}>{title}</Text>
        <Text style={styles.onNavyText}>{subtitle}</Text>
        {progress ? <Progress value={progress.progressPercent} color={studentTokens.yellowDeep} label={`Continue from ${formatVideoTimestamp(progress.currentSeconds)}`} showValue /> : null}
      </View>
      <Button label={progress ? 'Resume' : 'Start Listening'} disabled={!progress && !fallback} onPress={onContinue} left={<LearningIcon name={learningIcons.play} color={studentTokens.navy} size={16} />} />
    </Card>
  );
}

function startOfCurrentWeek() {
  const date = new Date();
  const dayFromMonday = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - dayFromMonday);
  return date.getTime();
}

function buildLiveListeningMetrics(attempts: ListeningAttempt[]): ListeningMetric[] {
  const totalQuestions = attempts.reduce((total, attempt) => total + attempt.questionCount, 0);
  const totalCorrect = attempts.reduce((total, attempt) => total + attempt.correctCount, 0);
  const mastery = totalQuestions > 0 ? Math.round(totalCorrect / totalQuestions * 100) : 0;
  const weekStart = startOfCurrentWeek();
  const weekly = attempts.filter((attempt) => Date.parse(attempt.completedAt) >= weekStart);
  const weeklyMinutes = Math.round(weekly.reduce((total, attempt) => total + attempt.timeSpentSeconds, 0) / 60);
  const subskillTotals = new Map<string, { correct: number; questions: number }>();
  attempts.forEach((attempt) => {
    const current = subskillTotals.get(attempt.subskillId) ?? { correct: 0, questions: 0 };
    current.correct += attempt.correctCount;
    current.questions += attempt.questionCount;
    subskillTotals.set(attempt.subskillId, current);
  });
  const weakest = [...subskillTotals.entries()]
    .map(([id, value]) => ({ id, accuracy: value.questions > 0 ? Math.round(value.correct / value.questions * 100) : 0 }))
    .sort((first, second) => first.accuracy - second.accuracy)[0];
  const weakestTitle = weakest ? getListeningSubskills().find((item) => item.id === weakest.id)?.title ?? weakest.id : 'No data';
  const best = [...attempts].sort((first, second) => second.accuracyPercent - first.accuracyPercent || Date.parse(second.completedAt) - Date.parse(first.completedAt))[0];

  return [
    { id: 'mastery', label: 'Listening Mastery', value: `${mastery} / 100`, note: attempts.length ? `${attempts.length} completed sets` : 'Complete a set to begin', progress: mastery, tone: 'blue', iconKey: 'headphones' },
    { id: 'practice-week', label: 'Practice This Week', value: `${weekly.length} sessions`, note: `${weeklyMinutes} minutes total`, progress: weekly.length, max: Math.max(4, weekly.length), tone: 'teal', iconKey: 'check' },
    { id: 'weakest', label: 'Weakest Subskill', value: weakestTitle, note: weakest ? `${weakest.accuracy}% recent accuracy` : 'Not enough results yet', progress: weakest?.accuracy ?? 0, tone: 'orange', iconKey: 'target' },
    { id: 'recent-best', label: 'Recent Best', value: best ? `${best.correctCount} / ${best.questionCount}` : '0 / 0', note: best?.contentTitle ?? 'No completed set yet', progress: best?.accuracyPercent ?? 0, tone: 'purple', iconKey: 'star' },
  ];
}

function PracticeModeCard({ item, selected, onPress }: { item: ListeningPracticeMode; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={item.title}
      onPress={onPress}
      style={({ pressed }) => [styles.modeCard, selected ? { borderColor: learningToneColor(item.tone), backgroundColor: learningToneSoft(item.tone) } : null, pressed ? styles.pressed : null]}
    >
      <LearningIconBubble icon={iconFor(item.iconKey)} tone={item.tone} />
      <View style={styles.modeCopy}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Badge label={item.sessionMode === 'exam' ? 'Exam' : 'Practice'} tone={item.sessionMode === 'exam' ? 'orange' : 'teal'} />
        </View>
        <Text style={styles.bodyText}>{item.description}</Text>
      </View>
      <LearningIcon name={learningIcons.arrow} color={studentTokens.navy} size={15} />
    </Pressable>
  );
}

function ChoiceButton<TValue extends string>({ item, selected, width, onPress }: { item: ChoiceItem<TValue>; selected: boolean; width?: DimensionValue; onPress: () => void }) {
  const tone = item.tone ?? 'blue';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={item.title}
      onPress={onPress}
      style={({ pressed }) => [styles.choiceButton, { width }, selected ? { borderColor: learningToneColor(tone), backgroundColor: learningToneSoft(tone) } : null, pressed ? styles.pressed : null]}
    >
      <View style={styles.choiceTopLine}>
        <Text style={styles.choiceTitle}>{item.title}</Text>
        {typeof item.mastery === 'number' ? <Text style={styles.choiceMeta}>{item.mastery}%</Text> : null}
      </View>
      <Text style={styles.choiceDescription}>{item.description}</Text>
      {typeof item.recentErrors === 'number' ? <Text style={styles.errorMeta}>{item.recentErrors} recent errors</Text> : null}
    </Pressable>
  );
}

function ChoiceGroup<TValue extends string>({
  title,
  step,
  items,
  value,
  compact,
  onChange,
}: {
  title: string;
  step: string;
  items: ChoiceItem<TValue>[];
  value: TValue;
  compact: boolean;
  onChange: (value: TValue) => void;
}) {
  const itemWidth = compact ? '100%' : undefined;

  return (
    <View style={styles.choiceGroup}>
      <Text style={styles.stepLabel}>{step}</Text>
      <Text style={styles.choiceGroupTitle}>{title}</Text>
      <View style={styles.choiceGrid}>
        {items.map((item) => <ChoiceButton key={item.id} item={item} selected={item.id === value} width={itemWidth} onPress={() => onChange(item.id)} />)}
      </View>
    </View>
  );
}

function FocusedPracticeWizard({ selection, selectedMode, compact, onChange, onStart }: { selection: ListeningSelection; selectedMode: ListeningPracticeMode; compact: boolean; onChange: (selection: ListeningSelection) => void; onStart: () => void }) {
  const taskItems = getListeningTaskTypes().map((item) => ({ id: item.id, title: item.title, description: item.description, tone: item.tone }));
  const subskillItems = getListeningSubskills(selection.taskTypeId).map((item) => ({ id: item.id, title: item.title, description: item.description, mastery: item.mastery, recentErrors: item.recentErrors, tone: item.recentErrors >= 5 ? 'orange' as const : 'blue' as const }));
  const difficultyItems = getListeningDifficulties().map((item) => ({ id: item.id, title: item.title, description: item.description, tone: item.id === 'adaptive' ? 'teal' as const : 'blue' as const }));
  const lengthItems = getListeningLengths().map((item) => ({ id: item.id, title: item.title, description: `${item.description} - about ${item.minutes} min`, tone: item.id === 'extended' ? 'orange' as const : 'yellow' as const }));
  const task = getListeningTaskTypeById(selection.taskTypeId);
  const subskill = getListeningSubskillById(selection.subskillId);
  const difficulty = getListeningDifficultyById(selection.difficultyId);
  const length = getListeningLengthById(selection.lengthId);

  const changeTask = (taskTypeId: ListeningTaskTypeId) => {
    onChange({ ...selection, taskTypeId, subskillId: ensureCompatibleSubskill(taskTypeId, selection.subskillId) });
  };

  return (
    <Card title="Focused Practice Flow" eyebrow="Listening -> Task Type -> Subskill -> Difficulty -> Length" right={<Badge label={selectedMode.sessionMode === 'exam' ? 'Exam mode' : 'Practice mode'} tone={selectedMode.sessionMode === 'exam' ? 'orange' : 'teal'} />}>
      <View style={styles.selectionSummary}>
        <View style={styles.summaryIcon}><LearningIcon name={iconFor('headphones')} color={studentTokens.blue} size={22} /></View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>{task.title} - {subskill.title}</Text>
          <Text style={styles.bodyText}>{difficulty.title} difficulty, {length.title.toLowerCase()} length, {length.questionCount} questions.</Text>
        </View>
      </View>

      <View style={styles.wizardStack}>
        <ChoiceGroup title="Task Type" step="Step 1" items={taskItems} value={selection.taskTypeId} compact={compact} onChange={changeTask} />
        <ChoiceGroup title="Subskill" step="Step 2" items={subskillItems} value={selection.subskillId} compact={compact} onChange={(subskillId) => onChange({ ...selection, subskillId })} />
        <ChoiceGroup title="Difficulty" step="Step 3" items={difficultyItems} value={selection.difficultyId} compact={compact} onChange={(difficultyId) => onChange({ ...selection, difficultyId })} />
        <ChoiceGroup title="Length" step="Step 4" items={lengthItems} value={selection.lengthId} compact={compact} onChange={(lengthId) => onChange({ ...selection, lengthId })} />
      </View>

      <View style={styles.wizardFooter}>
        <Text style={styles.footerHint}>{selectedMode.sessionMode === 'exam' ? 'Feedback and transcript stay hidden until the end.' : 'Replay, notes, and explanation are available during practice.'}</Text>
        <Button label="Start Listening" onPress={onStart} style={styles.startButton} right={<LearningIcon name={learningIcons.arrow} color={studentTokens.navy} size={16} />} />
      </View>
    </Card>
  );
}

function RecommendationList({ items, onStart }: { items: ListeningHubDisplayItem[]; onStart: (item: ListeningHubDisplayItem) => void }) {
  if (!items.length) {
    return <Card><Text style={styles.bodyText}>Henüz yayınlanmış listening parçası yok. Admin panelinden Listening Hub kaydı yayınlandığında burada görünür.</Text></Card>;
  }

  return (
    <View style={styles.recommendationList}>
      {items.slice(0, 4).map((item, index) => {
        const tone: ListeningTone = index === 0 ? "teal" : index === 1 ? "blue" : index === 2 ? "yellow" : "orange";
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.title + " listening practice başlat"}
            onPress={() => onStart(item)}
            style={({ pressed }) => [styles.recommendationRow, pressed ? styles.pressed : null]}
          >
            <View style={[styles.rankBubble, { backgroundColor: learningToneSoft(tone) }]}>
              <Text style={[styles.rankText, { color: learningToneColor(tone) }]}>{index + 1}</Text>
            </View>
            <View style={styles.recommendationCopy}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Badge label={item.sessionMode === "exam" ? "Exam" : "Practice"} tone={item.sessionMode === "exam" ? "orange" : "teal"} />
              </View>
              <Text style={styles.bodyText}>{item.description || item.meta}</Text>
              <Text style={styles.metaText}>{item.meta}</Text>
            </View>
            <View style={styles.recommendationAction}>
              <Text style={styles.questionCountText}>{item.questionCount} soru</Text>
              <View style={styles.recommendationActionPill}>
                <Text style={styles.recommendationActionText}>{item.actionLabel}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}


function LearningChainCard({ selection, onStart }: { selection: ListeningSelection; onStart: () => void }) {
  const router = useRouter();
  const chain = getListeningLearningChain(selection);

  return (
    <Card title="Learn -> Practice -> Test" eyebrow="Recommended chain">
      <View style={styles.chainList}>
        {chain.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => item.type === 'guided-practice' ? onStart() : router.push(item.href as Href)}
            style={({ pressed }) => [styles.chainRow, pressed ? styles.pressed : null]}
          >
            <View style={[styles.chainStep, { backgroundColor: learningToneSoft(item.tone) }]}>
              <Text style={[styles.chainStepText, { color: learningToneColor(item.tone) }]}>{index + 1}</Text>
            </View>
            <View style={styles.chainCopy}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.bodyText}>{item.description}</Text>
            </View>
            {item.isPremium ? <Badge label="Premium" tone="yellow" /> : null}
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function SessionRulesCard({ mode }: { mode: ListeningPracticeMode }) {
  const isExam = mode.sessionMode === 'exam';

  return (
    <Card title="Session Rules" eyebrow={isExam ? 'Exam mode' : 'Practice mode'}>
      <View style={styles.ruleList}>
        <View style={styles.ruleItem}>
          <LearningIconBubble icon={isExam ? learningIcons.clock : learningIcons.refresh} tone={isExam ? 'orange' : 'teal'} size={38} />
          <View style={styles.ruleCopy}>
            <Text style={styles.cardTitle}>{isExam ? 'Strict timing' : 'Replay available'}</Text>
            <Text style={styles.bodyText}>{isExam ? 'Feedback stays hidden until the set is submitted.' : 'Replay, notes, and explanation can support practice.'}</Text>
          </View>
        </View>
        <View style={styles.ruleItem}>
          <LearningIconBubble icon={iconFor('notes')} tone="blue" size={38} />
          <View style={styles.ruleCopy}>
            <Text style={styles.cardTitle}>{isExam ? 'Limited transcript' : 'Guided note review'}</Text>
            <Text style={styles.bodyText}>{isExam ? 'Transcript is restricted until the test review stage.' : 'Notes and question review stay visible while practicing.'}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function RecentActivityCard({ attempts }: { attempts: ListeningAttempt[] }) {
  const recent = [...attempts].sort((first, second) => Date.parse(second.completedAt) - Date.parse(first.completedAt)).slice(0, 2);
  return (
    <Card title="Recent Listening" eyebrow="Activity">
      <View style={styles.activityList}>
        {recent.length ? recent.map((attempt) => (
          <View key={attempt.id} style={styles.activityRow}>
            <LearningIconBubble icon={learningIcons.check} tone="teal" size={36} />
            <View style={styles.activityCopy}>
              <Text style={styles.cardTitle}>{attempt.contentTitle}</Text>
              <Text style={styles.bodyText}>{attempt.questionCount} questions - {attempt.correctCount} correct</Text>
            </View>
            <Badge label={`${attempt.accuracyPercent}%`} tone="teal" />
          </View>
        )) : <Text style={styles.bodyText}>No completed listening practice yet.</Text>}
      </View>
    </Card>
  );
}

export function ListeningLearningHub({ user }: ListeningLearningHubProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [hubSync, setHubSync] = useState({ version: 0, loading: true, error: "" });
  const [hubRefreshToken, setHubRefreshToken] = useState(0);
  const [attempts, setAttempts] = useState<ListeningAttempt[]>(() => readListeningAttempts(user.id));
  const [progressItems, setProgressItems] = useState<ListeningProgress[]>(() => readListeningProgressCatalog(user.id));
  const [modeId, setModeId] = useState<ListeningPracticeModeId>('focused-practice');
  const modes = getListeningPracticeModes();
  const selectedMode = modes.find((mode) => mode.id === modeId) ?? modes[1];
  const [selection, setSelection] = useState<ListeningSelection>(() => defaultListeningSelection);
  const isMobile = width < 768;
  const isWide = width >= 1080;

  useEffect(() => {
    let active = true;
    void syncPublishedListeningHubItems()
      .then(() => {
        if (active) setHubSync((current) => ({ version: current.version + 1, loading: false, error: "" }));
      })
      .catch((cause) => {
        const message = cause instanceof Error ? cause.message : "Listening hub could not refresh.";
        if (active) setHubSync((current) => ({ ...current, loading: false, error: message }));
      });
    return () => { active = false; };
  }, [hubRefreshToken]);

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.all([loadListeningAttempts(user.id), loadListeningProgressCatalog(user.id)])
      .then(([nextAttempts, nextProgress]) => {
        if (!active) return;
        setAttempts(nextAttempts);
        setProgressItems(nextProgress);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [user.id]));

  const hubItems = getListeningHubItems();
  const latestProgress = useMemo(() => getLatestListeningProgress(progressItems), [progressItems]);

  const metrics = useMemo(
    () => buildLiveListeningMetrics(attempts).map((metric) => ({ ...metric, icon: iconFor(metric.iconKey) })),
    [attempts],
  );

  const applyMode = (mode: ListeningPracticeMode) => {
    setModeId(mode.id);
    setSelection((current) => makeListeningSelection({ ...current, sessionMode: mode.sessionMode, lengthId: mode.defaultLengthId }));
  };

  const openPractice = (nextSelection = selection) => {
    router.push(createListeningPracticeHref(nextSelection) as Href);
  };

  const reloadHub = () => {
    setHubSync((current) => ({ ...current, loading: true, error: "" }));
    setHubRefreshToken((value) => value + 1);
  };

  const openContinue = () => {
    if (latestProgress) {
      router.push(latestProgress.href as Href);
      return;
    }
    if (hubItems[0]) router.push(hubItems[0].href as Href);
  };
  const openHubItem = (item: ListeningHubDisplayItem) => router.push(item.href as Href);
  const isHubLoading = hubSync.loading && hubItems.length === 0;
  const isHubError = Boolean(hubSync.error) && hubItems.length === 0;

  if (isHubLoading) return <ListeningLoading />;
  if (isHubError) return <ErrorState title="Listening hub could not load" text={hubSync.error} action={<Button label="Tekrar dene" variant="secondary" onPress={reloadHub} />} />;

  return (
    <View testID="listening-hub-screen" style={styles.page}>
      <LearningPageHeader
        eyebrow="LISTENING HUB"
        title="Listening"
        subtitle="Choose a focused listening path before entering the practice player."
        right={<Button label="Open Current Practice" variant="secondary" onPress={() => router.push('/practice/listening' as Href)} />}
      />

      <LearningMetricGrid metrics={metrics} />
      <ContinueListeningCard progress={latestProgress} fallback={hubItems[0] ?? null} onContinue={openContinue} />

      <View style={[styles.mainGrid, isWide ? styles.mainGridWide : null]}>
        <View style={styles.primaryColumn}>
          <LearningSectionTitle title="Topic-Based Listening" />
          {hubSync.error ? <Text style={styles.metaText}>Canlı listening içeriği yenilenemedi; kayıtlı içerik gösteriliyor.</Text> : null}
          <RecommendationList items={hubItems} onStart={openHubItem} />

          <LearningSectionTitle title="Choose Your Practice" />
          <View style={styles.modeGrid}>
            {modes.map((mode) => <PracticeModeCard key={mode.id} item={mode} selected={mode.id === modeId} onPress={() => applyMode(mode)} />)}
          </View>

          <FocusedPracticeWizard selection={selection} selectedMode={selectedMode} compact={isMobile} onChange={setSelection} onStart={() => openPractice()} />
        </View>

        <View style={styles.sideColumn}>
          <LearningChainCard selection={selection} onStart={() => openPractice()} />
          <SessionRulesCard mode={selectedMode} />
          <RecentActivityCard attempts={attempts} />
          {user.plan === 'free' ? (
            <Card style={styles.premiumNudge} contentStyle={styles.premiumBody}>
              <Text style={styles.orangeLabel}>PREMIUM CONTEXT</Text>
              <Text style={styles.cardTitle}>Full section analytics unlock with Premium.</Text>
              <Text style={styles.bodyText}>The current hub keeps free practice visible while preserving plan-aware routes.</Text>
            </Card>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', gap: 16, paddingBottom: 30 },
  pressed: { opacity: 0.76 },
  loadingHeader: { width: '58%', height: 72 },
  loadingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  loadingStat: { flexGrow: 1, flexBasis: 210, height: 124 },
  loadingPanel: { width: '100%', height: 260 },
  orangeLabel: { fontFamily: fontFamily, color: studentTokens.orange, fontSize: 11, lineHeight: 16, fontWeight: '700', textTransform: 'uppercase' },
  bodyText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 14, lineHeight: 20, fontWeight: '500', flexShrink: 1 },
  metaText: { fontFamily: fontFamily, color: studentTokens.muted, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  cardTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 15, lineHeight: 20, fontWeight: '700', flexShrink: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  continueCard: { backgroundColor: '#001b48', borderColor: '#061f55', borderRadius: 11 },
  continueBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  continueCopy: { flex: 1, minWidth: 220, gap: 9 },
  continueTitle: { fontFamily: fontFamily, color: '#ffffff', fontSize: 23, lineHeight: 30, fontWeight: '700' },
  onNavyText: { fontFamily: fontFamily, color: '#d8e3ff', fontSize: 13, lineHeight: 19, fontWeight: '500' },
  mainGrid: { gap: 14 },
  mainGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  primaryColumn: { flex: 1, minWidth: 0, gap: 14 },
  sideColumn: { width: 318, maxWidth: '100%', gap: 14, flexShrink: 0 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  modeCard: { minHeight: 96, flexGrow: 1, flexBasis: 260, minWidth: 230, borderRadius: 11, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.surface, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  modeCopy: { flex: 1, minWidth: 0, gap: 4 },
  selectionSummary: { borderRadius: 11, borderWidth: 1, borderColor: '#e8edf5', backgroundColor: '#fbfcff', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  summaryIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: studentTokens.blueSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  summaryCopy: { flex: 1, minWidth: 0, gap: 3 },
  summaryTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 17, lineHeight: 23, fontWeight: '700' },
  wizardStack: { gap: 16 },
  choiceGroup: { gap: 8 },
  stepLabel: { fontFamily: fontFamily, color: studentTokens.muted, fontSize: 11, lineHeight: 15, fontWeight: '700', textTransform: 'uppercase' },
  choiceGroupTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceButton: { flexGrow: 1, flexBasis: 170, minWidth: 150, minHeight: 74, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: studentTokens.surface, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', gap: 4 },
  choiceTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  choiceTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 14, lineHeight: 19, fontWeight: '700', flexShrink: 1 },
  choiceMeta: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 12, lineHeight: 16, fontWeight: '700' },
  choiceDescription: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  errorMeta: { fontFamily: fontFamily, color: studentTokens.orange, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  wizardFooter: { borderTopWidth: 1, borderTopColor: studentTokens.lineSoft, paddingTop: 14, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  footerHint: { fontFamily: fontFamily, color: studentTokens.muted, fontSize: 13, lineHeight: 19, fontWeight: '500', flex: 1, minWidth: 220 },
  startButton: { minHeight: 48, minWidth: 178 },
  recommendationList: { gap: 9 },
  recommendationRow: { minHeight: 70, borderRadius: 11, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.surface, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  rankBubble: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rankText: { fontFamily: fontFamily, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  recommendationCopy: { flex: 1, minWidth: 0, gap: 3 },
  recommendationAction: { alignItems: "flex-end", gap: 7, minWidth: 116 },
  recommendationActionPill: { minHeight: 34, borderRadius: 9, borderWidth: 1, borderColor: "#d7e0ec", backgroundColor: studentTokens.neutral, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" },
  recommendationActionText: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 11, lineHeight: 15, fontWeight: "700" },
  questionCountText: { fontFamily: fontFamily, color: studentTokens.muted, fontSize: 11, lineHeight: 15, fontWeight: "700" },
  chainList: { gap: 8 },
  chainRow: { minHeight: 62, borderRadius: 10, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: '#fbfcff', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  chainStep: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chainStepText: { fontFamily: fontFamily, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  chainCopy: { flex: 1, minWidth: 0, gap: 2 },
  ruleList: { gap: 10 },
  ruleItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ruleCopy: { flex: 1, minWidth: 0, gap: 3 },
  activityList: { gap: 8 },
  activityRow: { minHeight: 58, borderBottomWidth: 1, borderBottomColor: studentTokens.lineSoft, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  activityCopy: { flex: 1, minWidth: 0, gap: 2 },
  premiumNudge: { borderColor: '#f3dfa3', backgroundColor: studentTokens.yellowSoft, borderRadius: 11 },
  premiumBody: { gap: 8 },
});
