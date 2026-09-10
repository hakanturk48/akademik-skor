import { type Href, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ProgressRecommendationPanel } from '@/components/student/RecommendationCards';
import { Badge, Button, Card, studentTokens } from '@/components/student/ui';
import { dashboardSnapshot, recentActivity, sectionScores, todaysStudyPlan, type SectionScore } from '@/lib/student-dashboard';
import type { AuthUser } from '@/lib/auth';

const fontFamily = 'Quicksand';

type DashboardProps = {
  user: AuthUser;
};

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const arrowSymbol = symbolName('chevron.right', 'chevron_right');
const playSymbol = symbolName('play.fill', 'play_arrow');
const targetSymbol = symbolName('target', 'track_changes');
const bookSymbol = symbolName('book', 'menu_book');
const headphonesSymbol = symbolName('headphones', 'headphones');
const micSymbol = symbolName('mic', 'mic');
const writingSymbol = symbolName('square.and.pencil', 'edit_square');
const vocabularySymbol = symbolName('textformat.abc', 'abc');
const checkSymbol = symbolName('checkmark', 'check');
const circleSymbol = symbolName('circle', 'radio_button_unchecked');

const sectionIcons: Record<SectionScore['key'], AppSymbolName> = {
  reading: bookSymbol,
  listening: headphonesSymbol,
  speaking: micSymbol,
  writing: writingSymbol,
};

const planIcons = [bookSymbol, vocabularySymbol, headphonesSymbol, micSymbol];
const activityIcons = [bookSymbol, headphonesSymbol, vocabularySymbol, writingSymbol];

function displayFirstName(name: string) {
  const first = name.trim().split(/\s+/)[0] || 'Student';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function CardHeader({ title, label, right }: { title: string; label?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderCopy}>
        {label ? <Text style={styles.cardLabel}>{label}</Text> : null}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

function StudyPlanRow({ task, index, completed }: { task: (typeof todaysStudyPlan)[number]; index: number; completed: boolean }) {
  const icon = planIcons[index] ?? bookSymbol;

  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.planRow, pressed ? styles.pressed : null]}>
      <View style={[styles.planStatus, completed ? styles.planStatusDone : null]}>
        <SymbolView name={completed ? checkSymbol : circleSymbol} tintColor={completed ? studentTokens.teal : '#b6bfce'} size={13} style={styles.planStatusIcon} />
      </View>
      <View style={[styles.planIconBox, { backgroundColor: `${task.color}18` }]}>
        <SymbolView name={icon} tintColor={task.color} size={17} style={styles.planIconSymbol} />
      </View>
      <View style={styles.planCopy}>
        <View style={styles.planTitleLine}>
          <Text style={styles.planTitle}>{task.title}</Text>
          <Text style={styles.planDot}>·</Text>
          <Text style={styles.planDetail}>{task.detail}</Text>
        </View>
        <Text style={styles.planSub}>{task.state}</Text>
      </View>
      <Text style={styles.planDuration}>{task.duration}</Text>
      <SymbolView name={arrowSymbol} tintColor={studentTokens.text} size={14} style={styles.chevronIcon} />
    </Pressable>
  );
}

function TargetSlider({ current, target, max }: { current: number; target: number; max: number }) {
  const currentPercent = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <View style={styles.targetSlider}>
      <View style={styles.targetTrack}>
        <View style={[styles.targetFill, { width: `${currentPercent}%` }]} />
        <View style={[styles.targetThumb, { left: `${currentPercent}%` }]} />
      </View>
      <Text style={styles.targetGap}>{target - current} points to go</Text>
    </View>
  );
}

function ContinueLearningHero({ compact }: { compact: boolean }) {
  const renderAction = (isCompact: boolean) => (
    <Button label={dashboardSnapshot.continueLearning.nextAction} size="sm" variant="secondary" right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={15} style={styles.buttonIcon} />} style={[styles.continueButton, isCompact ? styles.continueButtonCompact : null]} />
  );

  const renderCopy = (showLabel: boolean) => (
    <View style={[styles.continueCopy, compact ? styles.continueCopyCompact : null]}>
      {showLabel ? <Text style={styles.continueLabel} numberOfLines={1}>CONTINUE LEARNING</Text> : null}
      <Text style={[styles.continueTitle, compact ? styles.continueTitleCompact : null]}>{dashboardSnapshot.continueLearning.title}</Text>
      <Text style={styles.continueSub}>{dashboardSnapshot.continueLearning.module}</Text>
      <View style={styles.continueProgressRow}>
        <Text style={styles.continueTime}>{dashboardSnapshot.continueLearning.elapsed} / {dashboardSnapshot.continueLearning.total}</Text>
        <View style={styles.continueProgressTrack}>
          <View style={[styles.continueProgressFill, { width: `${dashboardSnapshot.continueLearning.progress}%` }]} />
        </View>
        <Text style={styles.continuePercent}>{dashboardSnapshot.continueLearning.progress}%</Text>
      </View>
    </View>
  );

  if (compact) {
    return (
      <Card style={styles.continueHero} contentStyle={[styles.continueHeroBody, styles.continueHeroBodyCompact]}>
        <View style={styles.continueMobileTop}>
          <View style={[styles.playCircle, styles.playCircleCompact]}>
            <SymbolView name={playSymbol} tintColor="#ffffff" size={26} style={styles.playIcon} />
          </View>
          <Text style={styles.continueLabel} numberOfLines={1}>CONTINUE LEARNING</Text>
        </View>
        {renderCopy(false)}
        {renderAction(true)}
      </Card>
    );
  }

  return (
    <Card style={styles.continueHero} contentStyle={styles.continueHeroBody}>
      <View style={styles.continueContent}>
        <View style={styles.playCircle}>
          <SymbolView name={playSymbol} tintColor="#ffffff" size={26} style={styles.playIcon} />
        </View>
        {renderCopy(true)}
      </View>
      <View style={styles.heroVisualWrap}>
        <Image source={require('@/assets/images/dashboard-waveform.png')} style={styles.heroWaveImage} contentFit="contain" accessibilityLabel="Audio waveform visual" />
      </View>
      {renderAction(false)}
    </Card>
  );
}
function SectionScoreCard({ item, compact }: { item: SectionScore; compact: boolean }) {
  return (
    <Card style={[styles.sectionCard, compact ? styles.sectionCardCompact : null]} contentStyle={styles.sectionCardBody}>
      <View style={styles.sectionTop}>
        <View style={[styles.sectionIconBox, { backgroundColor: item.softColor }]}>
          <SymbolView name={sectionIcons[item.key]} tintColor={item.color} size={23} style={styles.sectionIcon} />
        </View>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionLabel}>{item.title.toUpperCase()}</Text>
          <Text style={styles.sectionScore}>{item.score}<Text style={styles.sectionMax}>/30</Text></Text>
        </View>
      </View>
      <View style={styles.sectionTrack}>
        <View style={[styles.sectionFill, { width: `${(item.score / item.maxScore) * 100}%`, backgroundColor: item.color }]} />
      </View>
      <Text style={styles.sectionDelta}>↑ {item.delta} since last mock test</Text>
    </Card>
  );
}

function ScoreChart() {
  const max = dashboardSnapshot.scoreMax;

  return (
    <View style={styles.chartWrap}>
      <View style={styles.chartGrid}>
        {[120, 100, 80, 60, 40, 20, 0].map((tick) => <Text key={String(tick)} style={styles.chartTick}>{tick}</Text>)}
      </View>
      <View style={styles.chartPlot}>
        {dashboardSnapshot.scoreProgress.map((point, index) => {
          const height = Math.max(14, (point.value / max) * 122);
          const last = index === dashboardSnapshot.scoreProgress.length - 1;
          return (
            <View key={point.label} style={styles.chartColumn}>
              <View style={styles.chartColumnInner}>
                <View style={[styles.chartBar, { height }]} />
                <View style={[styles.chartPoint, { bottom: Math.max(0, height - 6) }, last ? styles.chartPointLast : null]}>
                  {last ? <Text style={styles.chartPointText}>{point.value}</Text> : null}
                </View>
              </View>
              <Text style={styles.chartLabel}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ActivityRow({ item, index }: { item: (typeof recentActivity)[number]; index: number }) {
  const icon = activityIcons[index] ?? bookSymbol;

  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityIconBox, { backgroundColor: `${item.tone}18` }]}>
        <SymbolView name={icon} tintColor={item.tone} size={19} style={styles.activityIcon} />
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDetail}>{item.detail}</Text>
      </View>
      <Text style={styles.activityTime}>{item.time}</Text>
    </View>
  );
}

export function Dashboard({ user }: DashboardProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 1040;
  const isTablet = width >= 760;
  const isCompact = width < 620;
  const firstName = displayFirstName(user.name);
  const completedCount = dashboardSnapshot.completedPlanItems;
  const planPercent = (completedCount / todaysStudyPlan.length) * 100;

  return (
    <View testID="student-dashboard" style={styles.dashboard}>
      <View style={[styles.pageHead, isTablet ? styles.pageHeadWide : null]}>
        <View style={styles.pageHeadCopy}>
          <Text style={[styles.greeting, isCompact ? styles.greetingCompact : null]}>Good morning, {firstName}! 👋</Text>
          <Text style={styles.greetingSub}>{dashboardSnapshot.planState}</Text>
        </View>
        {isTablet ? (
          <View style={styles.quoteCard}>
            <Text style={styles.quoteMark}>“</Text>
            <Text style={styles.quoteText}>Consistency is the bridge between goals and results.</Text>
            <Text style={styles.quoteAuthor}>— Akademik Skor</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.topGrid, isWide ? styles.topGridWide : null]}>
        <Card style={[styles.studyCard, isWide ? styles.studyCardWide : null]} contentStyle={styles.studyCardBody}>
          <CardHeader title="TODAY'S STUDY PLAN" right={<Badge label={`${completedCount} / ${todaysStudyPlan.length} completed`} tone="teal" />} />
          <View style={styles.planList}>
            {todaysStudyPlan.map((task, index) => <StudyPlanRow key={task.title} task={task} index={index} completed={index < completedCount} />)}
          </View>
          <View style={styles.planFooter}>
            <Text style={styles.planCompleted}>{completedCount} / {todaysStudyPlan.length} completed</Text>
            <View style={styles.planFooterTrack}><View style={[styles.planFooterFill, { width: `${planPercent}%` }]} /></View>
            <Button label="View Study Plan" size="sm" variant="secondary" right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={14} style={styles.buttonIcon} />} onPress={() => router.push('/progress/study-plan' as Href)} style={styles.studyPlanButton} />
          </View>
        </Card>

        <Card style={[styles.targetCard, isWide ? styles.targetCardWide : null]} contentStyle={styles.targetBody}>
          <CardHeader title="YOUR TARGET SCORE" />
          <View style={styles.targetScoresRow}>
            <View style={styles.targetScoreBlock}>
              <Text style={styles.targetLabel}>ESTIMATED TOEFL</Text>
              <Text style={styles.currentScore}>{dashboardSnapshot.currentScore}<Text style={styles.scoreMax}>/120</Text></Text>
            </View>
            <View style={styles.targetScoreBlock}>
              <Text style={styles.targetLabel}>TARGET SCORE</Text>
              <Text style={styles.goalScore}>{dashboardSnapshot.targetScore}<Text style={styles.scoreMax}>/120</Text></Text>
            </View>
          </View>
          <TargetSlider current={dashboardSnapshot.currentScore} target={dashboardSnapshot.targetScore} max={dashboardSnapshot.scoreMax} />
          <Button label="Take Mock Test" size="lg" left={<SymbolView name={targetSymbol} tintColor={studentTokens.navy} size={20} style={styles.targetButtonIcon} />} right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={16} style={styles.buttonIcon} />} onPress={() => router.push('/tests/mock' as Href)} style={styles.mockButton} />
        </Card>
      </View>

      <ContinueLearningHero compact={isCompact} />

      <ProgressRecommendationPanel user={user} context="dashboard" limit={isCompact ? 2 : 3} compact={isCompact} dense={isCompact} />

      <View style={[styles.sectionGrid, isTablet ? styles.sectionGridTablet : null]}>
        {sectionScores.map((item) => <SectionScoreCard key={item.key} item={item} compact={isCompact} />)}
      </View>

      <View style={[styles.bottomGrid, isWide ? styles.bottomGridWide : null]}>
        <Card style={[styles.scoreProgressCard, isWide ? styles.scoreProgressWide : null]} contentStyle={styles.scoreProgressBody}>
          <CardHeader title="SCORE PROGRESS" right={<Button label="Last 30 Days" size="sm" variant="secondary" />} />
          <ScoreChart />
          <Button label="View All Progress" size="sm" variant="secondary" right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={14} style={styles.buttonIcon} />} onPress={() => router.push('/progress' as Href)} style={styles.progressButton} />
        </Card>

        <Card style={[styles.activityCard, isWide ? styles.activityWide : null]} contentStyle={styles.activityBody}>
          <CardHeader title="RECENT ACTIVITY" right={<Pressable accessibilityRole="button" onPress={() => router.push('/progress/activity' as Href)}><Text style={styles.viewAll}>View All</Text></Pressable>} />
          <View style={styles.activityList}>
            {recentActivity.map((item, index) => <ActivityRow key={`${item.title}-${item.time}`} item={item} index={index} />)}
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboard: { gap: 10 },
  pageHead: { gap: 12 },
  pageHeadWide: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pageHeadCopy: { flex: 1, minWidth: 0 },
  greeting: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  greetingCompact: { fontFamily: fontFamily, fontSize: 20, lineHeight: 26 },
  greetingSub: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 12, lineHeight: 17, fontWeight: '500', marginTop: 2 },
  quoteCard: { width: 232, minHeight: 50, borderRadius: 9, borderWidth: 1, borderColor: '#ffe2a2', backgroundColor: '#fffaf0', paddingHorizontal: 14, paddingVertical: 8, flexShrink: 0 },
  quoteMark: { fontFamily: fontFamily, position: 'absolute', left: 10, top: 2, color: studentTokens.yellowDeep, fontSize: 25, lineHeight: 28, fontWeight: '700' },
  quoteText: { fontFamily: fontFamily, color: '#31405c', fontSize: 9, lineHeight: 13, fontWeight: '700', paddingLeft: 20 },
  quoteAuthor: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 8, lineHeight: 11, fontWeight: '700', textAlign: 'right', marginTop: 2 },
  topGrid: { gap: 12 },
  topGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  studyCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  studyCardWide: { flex: 1.08 },
  studyCardBody: { padding: 14, gap: 8 },
  targetCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  targetCardWide: { flex: 0.92 },
  targetBody: { padding: 14, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardHeaderCopy: { flex: 1, minWidth: 0 },
  cardLabel: { fontFamily: fontFamily, color: studentTokens.teal, fontSize: 9, lineHeight: 12, fontWeight: '700', textTransform: 'uppercase' },
  cardTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 12, lineHeight: 16, fontWeight: '700', textTransform: 'uppercase' },
  planList: { gap: 0, borderTopWidth: 1, borderTopColor: '#eef1f6' },
  planRow: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: '#eef1f6', paddingVertical: 7 },
  planStatus: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  planStatusDone: { backgroundColor: '#e8fbf5' },
  planStatusIcon: { width: 13, height: 13 },
  planIconBox: { width: 25, height: 25, borderRadius: 7, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  planIconSymbol: { width: 17, height: 17 },
  planCopy: { flex: 1, minWidth: 0 },
  planTitleLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 4 },
  planTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  planDot: { fontFamily: fontFamily, color: '#a2aabc', fontSize: 10, lineHeight: 14, fontWeight: '600' },
  planDetail: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 10, lineHeight: 14, fontWeight: '600', flexShrink: 1 },
  planSub: { fontFamily: fontFamily, color: studentTokens.muted, fontSize: 9, lineHeight: 12, fontWeight: '500', marginTop: 1 },
  planDuration: { fontFamily: fontFamily, color: '#42506b', fontSize: 10, lineHeight: 14, fontWeight: '600', flexShrink: 0 },
  chevronIcon: { width: 14, height: 14 },
  planFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingTop: 2 },
  planCompleted: { fontFamily: fontFamily, color: studentTokens.teal, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  planFooterTrack: { height: 5, borderRadius: 99, backgroundColor: '#e9edf3', overflow: 'hidden', flex: 1, minWidth: 110 },
  planFooterFill: { height: '100%', borderRadius: 99, backgroundColor: studentTokens.yellow },
  studyPlanButton: { minWidth: 142, borderRadius: 7, minHeight: 30 },
  targetScoresRow: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
  targetScoreBlock: { flex: 1, minWidth: 0 },
  targetLabel: { fontFamily: fontFamily, color: '#7a8398', fontSize: 9, lineHeight: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5 },
  currentScore: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 34, lineHeight: 39, fontWeight: '700' },
  goalScore: { fontFamily: fontFamily, color: '#f04a23', fontSize: 34, lineHeight: 39, fontWeight: '700' },
  scoreMax: { fontFamily: fontFamily, color: '#9aa3b5', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  targetSlider: { gap: 8 },
  targetTrack: { position: 'relative', height: 7, borderRadius: 999, backgroundColor: '#e8ebf1' },
  targetFill: { height: '100%', borderRadius: 999, backgroundColor: studentTokens.yellow },
  targetThumb: { position: 'absolute', top: -4, width: 15, height: 15, borderRadius: 8, marginLeft: -7, backgroundColor: studentTokens.yellowDeep, borderWidth: 2, borderColor: '#ffffff' },
  targetGap: { fontFamily: fontFamily, color: '#4f5870', fontSize: 10, lineHeight: 14, fontWeight: '700' },
  mockButton: { borderRadius: 8, minHeight: 42, width: '100%' },
  targetButtonIcon: { width: 20, height: 20 },
  continueHero: { padding: 0, borderRadius: 11, borderColor: '#061f55', backgroundColor: '#001b48', overflow: 'hidden', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  continueHeroBody: { minHeight: 104, paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 16 },
  continueHeroBodyCompact: { minHeight: 0, paddingHorizontal: 16, paddingVertical: 20, flexDirection: 'column', alignItems: 'stretch', gap: 14 },
  continueContent: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 16 },
  continueMobileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f15f21', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  playCircleCompact: { width: 50, height: 50, borderRadius: 25 },
  playIcon: { width: 26, height: 26 },
  continueCopy: { flex: 1, minWidth: 0 },
  continueCopyCompact: { width: '100%', minWidth: 0, flexShrink: 0 },
  continueLabel: { fontFamily: fontFamily, color: '#ff733c', fontSize: 9, lineHeight: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  continueTitle: { fontFamily: fontFamily, color: '#ffffff', fontSize: 19, lineHeight: 24, fontWeight: '700', flexShrink: 1 },
  continueTitleCompact: { fontFamily: fontFamily, fontSize: 17, lineHeight: 22, flexShrink: 0 },
  continueSub: { fontFamily: fontFamily, color: '#d8e3ff', fontSize: 11, lineHeight: 15, fontWeight: '600', marginTop: 2 },
  continueProgressRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  continueTime: { fontFamily: fontFamily, color: '#ffffff', fontSize: 10, lineHeight: 14, fontWeight: '600' },
  continueProgressTrack: { height: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden', flex: 1, minWidth: 96, maxWidth: 230 },
  continueProgressFill: { height: '100%', borderRadius: 999, backgroundColor: studentTokens.yellow },
  continuePercent: { fontFamily: fontFamily, color: studentTokens.yellow, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  heroVisualWrap: { width: 334, height: 82, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  heroWaveImage: { width: 334, height: 82, opacity: 0.94 },
  continueButton: { minWidth: 164, borderRadius: 8, minHeight: 39 },
  continueButtonCompact: { width: '100%', minWidth: 0, alignSelf: 'stretch', marginTop: 8 },
  sectionGrid: { gap: 10 },
  sectionGridTablet: { flexDirection: 'row', flexWrap: 'wrap' },
  sectionCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', flexGrow: 1, flexBasis: 190, minWidth: 178, shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  sectionCardCompact: { width: '100%', flexBasis: 'auto', flexGrow: 0, minWidth: 0 },
  sectionCardBody: { padding: 12, gap: 8 },
  sectionTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconBox: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sectionIcon: { width: 23, height: 23 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionLabel: { fontFamily: fontFamily, color: '#4f5870', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  sectionScore: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 22, lineHeight: 27, fontWeight: '700', marginTop: 1 },
  sectionMax: { fontFamily: fontFamily, color: '#8e98ab', fontSize: 11, lineHeight: 15, fontWeight: '700' },
  sectionTrack: { height: 5, borderRadius: 99, backgroundColor: '#e8ecf2', overflow: 'hidden' },
  sectionFill: { height: '100%', borderRadius: 99 },
  sectionDelta: { fontFamily: fontFamily, color: studentTokens.teal, fontSize: 9, lineHeight: 13, fontWeight: '600' },
  bottomGrid: { gap: 12 },
  bottomGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  scoreProgressCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2' },
  scoreProgressWide: { flex: 1.04 },
  scoreProgressBody: { padding: 14, gap: 10 },
  activityCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2' },
  activityWide: { flex: 0.96 },
  activityBody: { padding: 14, gap: 10 },
  chartWrap: { minHeight: 154, flexDirection: 'row', gap: 8 },
  chartGrid: { width: 24, justifyContent: 'space-between', paddingBottom: 20 },
  chartTick: { fontFamily: fontFamily, color: '#8490a5', fontSize: 8, lineHeight: 10, fontWeight: '700', textAlign: 'right' },
  chartPlot: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#edf1f6', paddingLeft: 8, paddingTop: 8 },
  chartColumn: { flex: 1, minWidth: 0, alignItems: 'center', gap: 6 },
  chartColumnInner: { position: 'relative', height: 126, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  chartBar: { width: '62%', maxWidth: 36, minWidth: 9, borderRadius: 999, backgroundColor: '#ffe3a0' },
  chartPoint: { position: 'absolute', width: 9, height: 9, borderRadius: 5, backgroundColor: studentTokens.yellowDeep, borderWidth: 2, borderColor: '#ffffff' },
  chartPointLast: { width: 22, height: 18, borderRadius: 5, backgroundColor: '#001b48', alignItems: 'center', justifyContent: 'center' },
  chartPointText: { fontFamily: fontFamily, color: '#ffffff', fontSize: 8, lineHeight: 10, fontWeight: '700' },
  chartLabel: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '600', textAlign: 'center' },
  progressButton: { alignSelf: 'center', minWidth: 210, borderRadius: 7, minHeight: 31 },
  viewAll: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  activityList: { gap: 0 },
  activityRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6', paddingVertical: 7 },
  activityIconBox: { width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityIcon: { width: 19, height: 19 },
  activityCopy: { flex: 1, minWidth: 0 },
  activityTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  activityDetail: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 9, lineHeight: 13, fontWeight: '700', marginTop: 1 },
  activityTime: { fontFamily: fontFamily, width: 86, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700', textAlign: 'right', flexShrink: 0 },
  buttonIcon: { width: 15, height: 15 },
  pressed: { opacity: 0.72 },
});


