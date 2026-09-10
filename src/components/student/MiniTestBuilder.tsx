import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import {
  LearningIcon,
  LearningIconBubble,
  LearningMetricGrid,
  LearningPageHeader,
  learningIcons,
  learningSymbolName,
  type AppSymbolName,
} from '@/components/student/LearningScaffold';
import { Badge, Button, Card, EmptyState, ErrorState, Progress, Skeleton, studentTokens } from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';
import {
  createMiniTestAttempt,
  createQuickMiniTestAttempt,
  describeMiniTestQuery,
  getMiniTestModeRule,
  getMiniTestOverviewMetrics,
  getMiniTestRecentActivity,
  getMiniTestSelectionFromParams,
  getMiniTestSelectionValue,
  getMiniTestStepChoices,
  getMiniTestSteps,
  getMiniTestSummaryRows,
  getQuickStartRecommendation,
  getRecommendedMiniTests,
  queryMiniTestQuestions,
  updateMiniTestSelectionForStep,
  type MiniTestAttemptDraft,
  type MiniTestChoice,
  type MiniTestMode,
  type MiniTestQuestionQueryResult,
  type MiniTestRecommendation,
  type MiniTestSelection,
  type MiniTestStepId,
  type MiniTestTone,
} from '@/lib/mini-tests';

const fontFamily = 'Quicksand';

const miniIconRegistry: Record<string, AppSymbolName> = {
  book: learningIcons.book,
  headphones: learningSymbolName('headphones', 'headphones'),
  mic: learningSymbolName('mic', 'mic'),
  writing: learningIcons.writing,
  target: learningIcons.target,
  layers: learningIcons.layers,
  bolt: learningIcons.bolt,
  check: learningIcons.check,
  star: learningIcons.star,
  clock: learningIcons.clock,
  quiz: learningSymbolName('checklist', 'checklist'),
};

function metricIcon(iconKey: string) {
  return miniIconRegistry[iconKey] ?? learningIcons.target;
}

function toneToBadge(tone: MiniTestTone): 'default' | 'yellow' | 'teal' | 'orange' | 'blue' | 'danger' {
  if (tone === 'yellow') return 'yellow';
  if (tone === 'teal' || tone === 'green') return 'teal';
  if (tone === 'orange') return 'orange';
  if (tone === 'blue' || tone === 'purple' || tone === 'navy') return 'blue';
  return 'default';
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function OptionCard({ item, selected, onPress }: { item: MiniTestChoice; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityState={{ selected, disabled: item.disabled }}
      disabled={item.disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        selected ? styles.optionCardSelected : null,
        item.disabled ? styles.optionCardDisabled : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <LearningIconBubble icon={metricIcon(item.iconKey)} tone={item.tone} size={42} />
      <View style={styles.optionCopy}>
        <View style={styles.optionTitleRow}>
          <Text style={styles.optionTitle}>{item.title}</Text>
          {item.isPremium ? <Badge label="Premium" tone="yellow" /> : null}
        </View>
        {item.description ? <Text style={styles.optionText}>{item.description}</Text> : null}
        {item.disabledReason ? <Text style={styles.optionDisabledText}>{item.disabledReason}</Text> : null}
      </View>
      {item.questionCount !== undefined ? <Badge label={`${item.questionCount}`} tone={item.questionCount > 0 ? 'teal' : 'danger'} /> : null}
    </Pressable>
  );
}

function Stepper({ steps, activeStep, onStepPress }: { steps: ReturnType<typeof getMiniTestSteps>; activeStep: number; onStepPress: (index: number) => void }) {
  return (
    <View accessibilityLabel={`Mini test builder step ${activeStep + 1} of ${steps.length}`} style={styles.stepper}>
      {steps.map((step, index) => {
        const active = index === activeStep;
        const complete = index < activeStep;
        return (
          <Pressable
            key={step.id}
            accessibilityRole="button"
            accessibilityLabel={`${step.title}. Step ${index + 1} of ${steps.length}`}
            accessibilityState={{ selected: active }}
            onPress={() => onStepPress(index)}
            style={({ pressed }) => [styles.stepPill, active ? styles.stepPillActive : null, complete ? styles.stepPillDone : null, pressed ? styles.pressed : null]}
          >
            <Text style={[styles.stepNumber, active ? styles.stepNumberActive : complete ? styles.stepNumberDone : null]}>{index + 1}</Text>
            <Text style={[styles.stepText, active ? styles.stepTextActive : null]} numberOfLines={1}>{step.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function QueryStatus({ query }: { query: MiniTestQuestionQueryResult }) {
  if (query.ok) {
    return (
      <View accessibilityLiveRegion="polite" style={styles.queryOk}>
        <LearningIcon name={learningIcons.check} color={studentTokens.teal} size={16} />
        <Text style={styles.queryOkText}>{query.questions.length} questions ready. Draft, inactive, duplicate, and locked items were excluded.</Text>
      </View>
    );
  }

  return (
    <View accessibilityLiveRegion="polite" style={styles.queryWarn}>
      <Text style={styles.queryWarnTitle}>Not enough questions</Text>
      <Text style={styles.queryWarnText}>{query.message}</Text>
      <Text style={styles.queryMetaText}>Locked premium: {query.lockedPremiumCount} - Inactive/draft: {query.inactiveCount} - Invalid taxonomy: {query.missingTaxonomyCount}</Text>
    </View>
  );
}

function QueryPreview({ selection, query }: { selection: MiniTestSelection; query: MiniTestQuestionQueryResult }) {
  return (
    <Card style={styles.sideCard} contentStyle={styles.sideBody}>
      <Text style={styles.orangeLabel}>QUESTION BANK QUERY</Text>
      <Text style={styles.queryText}>{describeMiniTestQuery(selection)}</Text>
      <Progress value={Math.min(query.questions.length, selection.length)} max={selection.length} color={query.ok ? studentTokens.teal : studentTokens.orange} />
      <QueryStatus query={query} />
    </Card>
  );
}

function AttemptPanel({ attempt, mode }: { attempt: MiniTestAttemptDraft | null; mode: MiniTestMode }) {
  const rule = getMiniTestModeRule(mode);

  if (!attempt) {
    return (
      <Card style={styles.sideCard} contentStyle={styles.sideBody}>
        <Text style={styles.orangeLabel}>MODE RULES</Text>
        <Text style={styles.sideTitle}>{rule.title}</Text>
        <Text style={styles.sideText}>{rule.feedbackTiming}</Text>
        <Text style={styles.sideText}>{rule.transcriptPolicy}</Text>
        <Text style={styles.sideText}>{rule.timerPolicy}</Text>
      </Card>
    );
  }

  return (
    <Card style={styles.sideCard} contentStyle={styles.sideBody}>
      <View style={styles.successIcon}><LearningIcon name={learningIcons.check} color="#ffffff" size={22} /></View>
      <Text style={styles.sideTitle}>Attempt created</Text>
      <Text style={styles.sideText}>{attempt.title}</Text>
      <View style={styles.attemptMetaGrid}>
        <SummaryRow label="Attempt" value={attempt.id} />
        <SummaryRow label="Mode" value={attempt.mode === 'exam' ? 'Exam Mode' : 'Practice Mode'} />
        <SummaryRow label="Questions" value={String(attempt.questionIds.length)} />
        <SummaryRow label="Time" value={`${attempt.estimatedMinutes} min`} />
      </View>
      <View style={styles.successBox}><Text style={styles.successText}>{attempt.statusLabel}. The generated question list is unique and taxonomy-matched.</Text></View>
    </Card>
  );
}

function QuickStartCard({ recommendation, onStart }: { recommendation: MiniTestRecommendation; onStart: () => void }) {
  return (
    <Card style={styles.panelCard} contentStyle={styles.quickBody}>
      <View style={styles.quickCopy}>
        <LearningIconBubble icon={metricIcon(recommendation.iconKey)} tone={recommendation.tone} />
        <View style={styles.quickTextGroup}>
          <Text style={styles.orangeLabel}>QUICK START</Text>
          <Text style={styles.heroTitle}>{recommendation.title}</Text>
          <Text style={styles.heroText}>{recommendation.description}</Text>
          <Text style={styles.reasonText}>{recommendation.reason}</Text>
        </View>
      </View>
      <Button label="Start Quick Test" onPress={onStart} style={styles.quickButton} />
    </Card>
  );
}

function RecommendationCard({ item, onSelect }: { item: MiniTestRecommendation; onSelect: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={onSelect} style={({ pressed }) => [styles.recommendationRow, pressed ? styles.pressed : null]}>
      <LearningIconBubble icon={metricIcon(item.iconKey)} tone={item.tone} size={38} />
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{item.title}</Text>
        <Text style={styles.actionSub}>{item.reason}</Text>
      </View>
      <LearningIcon name={learningIcons.arrow} color={studentTokens.navy} size={15} />
    </Pressable>
  );
}

function RecentActivityList() {
  const activities = getMiniTestRecentActivity();
  return (
    <Card style={styles.sideCard} contentStyle={styles.sideBody}>
      <Text style={styles.orangeLabel}>RECENT ACTIVITY</Text>
      {activities.map((item) => (
        <View key={item.id} style={styles.activityRow}>
          <Badge label={item.score} tone={toneToBadge(item.tone)} />
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>{item.title}</Text>
            <Text style={styles.actionSub}>{item.meta}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

function BuilderStepBody({ stepId, selection, query, choices, onSelect }: { stepId: MiniTestStepId; selection: MiniTestSelection; query: MiniTestQuestionQueryResult; choices: MiniTestChoice[]; onSelect: (value: string) => void }) {
  if (stepId === 'summary') {
    return (
      <View style={styles.summaryGrid}>
        <View style={styles.summaryRows}>{getMiniTestSummaryRows(selection).map((row) => <SummaryRow key={row.label} label={row.label} value={row.value} />)}</View>
        <QueryStatus query={query} />
      </View>
    );
  }

  if (choices.length === 0) {
    return <EmptyState title="No options yet" text="This taxonomy branch does not have active builder options. Choose another skill or task type." />;
  }

  const value = getMiniTestSelectionValue(selection, stepId);
  return (
    <View style={styles.optionGrid}>
      {choices.map((item) => (
        <OptionCard key={item.slug} item={item} selected={value === item.slug} onPress={() => onSelect(item.slug)} />
      ))}
    </View>
  );
}

function BuilderWizard({ user, selection, onSelectionChange, onAttemptCreated }: { user: AuthUser; selection: MiniTestSelection; onSelectionChange: (selection: MiniTestSelection) => void; onAttemptCreated: (attempt: MiniTestAttemptDraft) => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 768;
  const steps = getMiniTestSteps();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const activeStep = steps[activeStepIndex] ?? steps[0]!;
  const query = useMemo(() => queryMiniTestQuestions(selection, user.plan), [selection, user.plan]);
  const choices = useMemo(() => getMiniTestStepChoices(activeStep.id, selection, user.plan), [activeStep.id, selection, user.plan]);
  const selectedChoice = choices.find((item) => item.slug === getMiniTestSelectionValue(selection, activeStep.id));
  const isSummary = activeStep.id === 'summary';
  const canGoBack = activeStepIndex > 0;
  const canGoNext = isSummary || choices.length === 0 || !selectedChoice?.disabled;

  const startAttempt = () => {
    const result = createMiniTestAttempt(user.id, selection, user.plan);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setError(null);
    onAttemptCreated(result.attempt);
  };

  return (
    <Card style={styles.panelCard} contentStyle={styles.builderBody} testID="mini-test-builder">
      <View style={styles.builderHead}>
        <View style={styles.actionCopy}>
          <Text style={styles.orangeLabel}>Build Your Mini Test</Text>
          <Text style={styles.sectionTitle}>Step {activeStepIndex + 1} - {activeStep.title}</Text>
          <Text style={styles.sectionText}>{activeStep.description}</Text>
        </View>
        <Badge label={`${activeStepIndex + 1} / ${steps.length}`} tone="blue" />
      </View>
      <Stepper steps={steps} activeStep={activeStepIndex} onStepPress={setActiveStepIndex} />
      {error ? <ErrorState title="Test cannot start" text={error} action={<Button label="Review choices" variant="secondary" onPress={() => setActiveStepIndex(0)} />} /> : null}
      <BuilderStepBody stepId={activeStep.id} selection={selection} query={query} choices={choices} onSelect={(value) => onSelectionChange(updateMiniTestSelectionForStep(selection, activeStep.id, value))} />
      <View style={[styles.wizardActions, compact ? styles.wizardActionsCompact : null]}>
        <Button label="Back" variant="secondary" disabled={!canGoBack} onPress={() => setActiveStepIndex((index) => Math.max(0, index - 1))} style={styles.wizardButton} />
        {isSummary ? (
          <Button label="Start Test" disabled={!query.ok} onPress={startAttempt} style={styles.wizardButton} />
        ) : (
          <Button label="Next" disabled={!canGoNext} onPress={() => setActiveStepIndex((index) => Math.min(steps.length - 1, index + 1))} style={styles.wizardButton} />
        )}
      </View>
    </Card>
  );
}

function AvailableQuestionsCard({ query }: { query: MiniTestQuestionQueryResult }) {
  if (query.questions.length === 0) {
    return <EmptyState title="No matching questions" text="The current filters do not have enough active questions yet. The builder will keep the selection, but Start Test stays disabled until there is enough content." />;
  }

  return (
    <Card style={styles.panelCard} contentStyle={styles.panelBody}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Question Selection Preview</Text>
        <Badge label={`${query.questions.length} selected`} tone="teal" />
      </View>
      <View style={styles.questionPreviewList}>
        {query.questions.map((question, index) => (
          <View key={question.id} style={styles.questionPreviewRow}>
            <View style={styles.initialBubble}><Text style={styles.initialText}>{index + 1}</Text></View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>{question.prompt}</Text>
              <Text style={styles.actionSub}>{question.taxonomy.skillSlug} - {question.taxonomy.subskillSlug} - {question.taxonomy.levelSlug}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function MiniTestBuilderPage({ user }: { user: AuthUser }) {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const wide = width >= 1080;
  const [loading] = useState(false);
  const [selection, setSelection] = useState(() => getMiniTestSelectionFromParams(params as Record<string, string | string[] | undefined>));
  const [attempt, setAttempt] = useState<MiniTestAttemptDraft | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);
  const metrics = useMemo(() => getMiniTestOverviewMetrics().map((metric) => ({ ...metric, icon: metricIcon(metric.iconKey) })), []);
  const query = useMemo(() => queryMiniTestQuestions(selection, user.plan), [selection, user.plan]);
  const quick = useMemo(() => getQuickStartRecommendation(user.plan), [user.plan]);
  const recommendations = useMemo(() => getRecommendedMiniTests(user.plan), [user.plan]);

  const startQuick = () => {
    const result = createQuickMiniTestAttempt(user.id, user.plan);
    if (!result.ok) {
      setQuickError(result.reason);
      return;
    }
    setQuickError(null);
    setSelection(result.attempt.selection);
    setAttempt(result.attempt);
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <Skeleton lines={2} style={styles.loadingHeader} />
        <Skeleton lines={4} style={styles.loadingPanel} />
      </View>
    );
  }

  if (metrics.length === 0) {
    return <EmptyState title="Mini Tests are empty" text="No mini-test configuration is available yet." />;
  }

  return (
    <View testID="mini-tests-builder-screen" style={styles.screen}>
      <LearningPageHeader title="Mini Tests" subtitle="Start quickly from weak areas or build a focused mini test from the shared TOEFL taxonomy." right={<Button label="Test History" variant="secondary" />} />
      <LearningMetricGrid metrics={metrics} />
      {quickError ? <ErrorState title="Quick Start unavailable" text={quickError} action={<Button label="Build manually" variant="secondary" onPress={() => setQuickError(null)} />} /> : null}
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <QuickStartCard recommendation={quick} onStart={startQuick} />
          <BuilderWizard user={user} selection={selection} onSelectionChange={setSelection} onAttemptCreated={setAttempt} />
          <AvailableQuestionsCard query={query} />
        </View>
        <View style={styles.sideColumn}>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>RECOMMENDED FOR YOU</Text>
            {recommendations.map((item) => <RecommendationCard key={item.id} item={item} onSelect={() => setSelection(item.selection)} />)}
          </Card>
          <QueryPreview selection={selection} query={query} />
          <AttemptPanel attempt={attempt} mode={selection.mode} />
          <RecentActivityList />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 12 },
  pressed: { opacity: 0.74 },
  contentGrid: { gap: 12 },
  contentGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  mainColumn: { flex: 1, minWidth: 0, gap: 12 },
  sideColumn: { width: 310, maxWidth: '100%', gap: 12, flexShrink: 0 },
  panelCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  panelBody: { padding: 16, gap: 12 },
  sideCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  sideBody: { padding: 16, gap: 13 },
  orangeLabel: { color: studentTokens.orange, fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 13, textTransform: 'uppercase' },
  sectionHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: studentTokens.ink, fontFamily, fontSize: 17, fontWeight: '700', lineHeight: 23 },
  sectionText: { color: '#71809a', fontFamily, fontSize: 13, fontWeight: '500', lineHeight: 19 },
  heroTitle: { color: studentTokens.ink, fontFamily, fontSize: 22, fontWeight: '700', lineHeight: 28 },
  heroText: { color: '#526078', fontFamily, fontSize: 14, fontWeight: '500', lineHeight: 20 },
  reasonText: { color: studentTokens.teal, fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  sideTitle: { color: studentTokens.ink, fontFamily, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  sideText: { color: '#71809a', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 18 },
  quickBody: { padding: 16, gap: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  quickCopy: { flex: 1, minWidth: 230, flexDirection: 'row', alignItems: 'center', gap: 13 },
  quickTextGroup: { flex: 1, minWidth: 0, gap: 4 },
  quickButton: { minWidth: 160, minHeight: 44, borderRadius: 8 },
  builderBody: { padding: 16, gap: 14 },
  builderHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  stepper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepPill: { minHeight: 40, maxWidth: '100%', borderRadius: 999, borderWidth: 1, borderColor: '#dfe6f1', backgroundColor: '#ffffff', paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  stepPillActive: { borderColor: '#001b48', backgroundColor: '#001b48' },
  stepPillDone: { borderColor: '#cfe8df', backgroundColor: '#eefbf5' },
  stepNumber: { color: '#526078', fontFamily, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  stepNumberActive: { color: '#ffffff' },
  stepNumberDone: { color: studentTokens.teal },
  stepText: { color: '#526078', fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 16, maxWidth: 110 },
  stepTextActive: { color: '#ffffff', fontWeight: '700' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionCard: { flexGrow: 1, flexBasis: 250, minWidth: 230, minHeight: 76, borderRadius: 11, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: '#ffffff', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  optionCardSelected: { borderColor: '#001b48', backgroundColor: '#f8fbff' },
  optionCardDisabled: { opacity: 0.52 },
  optionCopy: { flex: 1, minWidth: 0, gap: 3 },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  optionTitle: { color: studentTokens.ink, fontFamily, fontSize: 15, fontWeight: '700', lineHeight: 20, flexShrink: 1 },
  optionText: { color: '#526078', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  optionDisabledText: { color: studentTokens.danger, fontFamily, fontSize: 11, fontWeight: '600', lineHeight: 16 },
  wizardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, borderTopWidth: 1, borderTopColor: '#eef1f6', paddingTop: 14 },
  wizardActionsCompact: { alignItems: 'stretch' },
  wizardButton: { minWidth: 130, minHeight: 44, borderRadius: 8 },
  summaryGrid: { gap: 12 },
  summaryRows: { borderWidth: 1, borderColor: '#eef1f6', borderRadius: 11, overflow: 'hidden' },
  summaryRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  summaryLabel: { color: '#71809a', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17, flex: 1 },
  summaryValue: { color: studentTokens.ink, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 17, flex: 1.2, textAlign: 'right' },
  queryOk: { borderRadius: 10, borderWidth: 1, borderColor: '#c7e8e3', backgroundColor: studentTokens.tealSoft, padding: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  queryOkText: { flex: 1, color: studentTokens.teal, fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  queryWarn: { borderRadius: 10, borderWidth: 1, borderColor: '#ffd8c9', backgroundColor: studentTokens.orangeSoft, padding: 11, gap: 4 },
  queryWarnTitle: { color: studentTokens.orange, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  queryWarnText: { color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 18 },
  queryMetaText: { color: '#71809a', fontFamily, fontSize: 11, fontWeight: '500', lineHeight: 16 },
  queryText: { color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 18 },
  recommendationRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#eef1f6', paddingBottom: 10 },
  activityRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6', paddingBottom: 9 },
  actionCopy: { flex: 1, minWidth: 0, gap: 3 },
  actionTitle: { color: studentTokens.ink, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  actionSub: { color: '#71809a', fontFamily, fontSize: 11, fontWeight: '500', lineHeight: 16 },
  questionPreviewList: { gap: 8 },
  questionPreviewRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#eef1f6', paddingBottom: 8 },
  initialBubble: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#edf2ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  initialText: { color: studentTokens.blue, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  successIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: studentTokens.teal, alignItems: 'center', justifyContent: 'center' },
  attemptMetaGrid: { gap: 0, borderWidth: 1, borderColor: '#eef1f6', borderRadius: 10, overflow: 'hidden' },
  successBox: { borderRadius: 10, borderWidth: 1, borderColor: '#c7e8e3', backgroundColor: studentTokens.tealSoft, padding: 11 },
  successText: { color: studentTokens.teal, fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  loadingHeader: { minHeight: 92 },
  loadingPanel: { minHeight: 320 },
});
