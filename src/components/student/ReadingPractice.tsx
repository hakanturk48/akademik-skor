import { type Href, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button, Card, Progress, studentTokens } from '@/components/student/ui';

const fontFamily = 'Quicksand';

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

type AnswerOption = {
  key: string;
  text: string;
  selected?: boolean;
};

type MetricItem = {
  value: string;
  label: string;
  color: string;
};

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const arrowSymbol = symbolName('chevron.right', 'chevron_right');
const backSymbol = symbolName('arrow.left', 'arrow_back');
const bookSymbol = symbolName('book', 'menu_book');
const clockSymbol = symbolName('clock', 'schedule');
const highlightSymbol = symbolName('highlighter', 'edit');
const noteSymbol = symbolName('note.text', 'sticky_note_2');
const moreSymbol = symbolName('ellipsis', 'more_horiz');
const documentSymbol = symbolName('doc.text', 'description');
const checkSymbol = symbolName('checkmark', 'check');
const flagSymbol = symbolName('flag', 'flag');
const targetSymbol = symbolName('target', 'track_changes');

const passageParagraphs = [
  'Sleep is a fundamental biological process that affects nearly every aspect of human health and performance. While scientists are still uncovering the full complexity of sleep, research has shown that a good night\'s rest plays a critical role in memory consolidation, immune function, emotional regulation, and physical recovery.',
  'During sleep, the brain cycles through different stages, including both REM (rapid eye movement) and non-REM sleep. REM sleep is associated with dreaming and learning, while non-REM sleep is linked to deep rest and tissue repair. These cycles repeat several times throughout the night, typically lasting 90 to 110 minutes each.',
  'Chronic sleep deprivation, on the other hand, has been tied to a range of negative outcomes. It can impair concentration, weaken decision-making, increase stress hormones, and even contribute to long-term health problems like heart disease and diabetes. Despite these risks, many people, especially students and professionals, regularly sacrifice sleep due to busy schedules or poor habits.',
  'Improving sleep quality does not always require dramatic changes. Simple steps like maintaining a consistent sleep schedule, limiting screen time before bed, and creating a dark, quiet environment can have a meaningful impact. In short, prioritizing sleep is one of the most effective ways to support both mental and physical well-being.',
];

const metrics: MetricItem[] = [
  { value: '4', label: 'Answered', color: studentTokens.teal },
  { value: '0', label: 'Marked', color: studentTokens.yellowDeep },
  { value: '6', label: 'Not Answered', color: '#b7c0d2' },
  { value: '4 / 10', label: 'Questions', color: studentTokens.navy },
];

const answerOptions: AnswerOption[] = [
  { key: 'A', text: 'Sleep cycles are composed of REM and non-REM stages.' },
  { key: 'B', text: 'Sleep plays a vital role in both mental and physical health.', selected: true },
  { key: 'C', text: 'Many people suffer from sleep deprivation due to stress.' },
  { key: 'D', text: 'Small lifestyle changes can significantly improve sleep quality.' },
];

const questionNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

function HeaderMetric({ item }: { item: MetricItem }) {
  return (
    <View style={styles.headerMetric}>
      <Text style={styles.headerMetricValue}>{item.value}</Text>
      <View style={styles.metricLabelRow}>
        <View style={[styles.metricDot, { backgroundColor: item.color }]} />
        <Text style={styles.headerMetricLabel}>{item.label}</Text>
      </View>
    </View>
  );
}

function PageHeader({ compact }: { compact: boolean }) {
  const router = useRouter();

  return (
    <View style={styles.headerStack}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/dashboard' as Href)} style={({ pressed }) => [styles.backLink, pressed ? styles.pressed : null]}>
        <SymbolView name={backSymbol} tintColor="#6e778b" size={13} style={styles.backIcon} />
        <Text style={styles.backText}>Back to Dashboard</Text>
      </Pressable>

      <View style={[styles.headerRow, compact ? styles.headerRowCompact : null]}>
        <View style={styles.titleArea}>
          <View style={styles.titleIconBox}>
            <SymbolView name={bookSymbol} tintColor={studentTokens.blue} size={25} style={styles.titleIcon} />
          </View>
          <View style={styles.titleCopy}>
            <Text style={styles.pageTitle}>Reading Practice</Text>
            <Text style={styles.pageSubtitle}>Main Idea · Practice Set 3 · TOEFL iBT Reading</Text>
          </View>
        </View>

        <Card style={[styles.metricsCard, compact ? styles.metricsCardCompact : null]} contentStyle={[styles.metricsBody, compact ? styles.metricsBodyCompact : null]}>
          {metrics.map((item) => <HeaderMetric key={item.label} item={item} />)}
        </Card>
      </View>
    </View>
  );
}

function PracticeToolbar({ compact }: { compact: boolean }) {
  return (
    <Card style={styles.toolbarCard} contentStyle={[styles.toolbarBody, compact ? styles.toolbarBodyCompact : null]}>
      <View style={styles.toolbarItemWide}>
        <View style={styles.toolbarDiamond} />
        <Text style={styles.toolbarLabel}>Question Type</Text>
        <Text style={styles.toolbarValue}>Main Idea</Text>
        <SymbolView name={arrowSymbol} tintColor="#7a8398" size={12} style={styles.toolbarIcon} />
      </View>
      {!compact ? <View style={styles.toolbarDivider} /> : null}
      <View style={styles.toolbarItem}>
        <SymbolView name={clockSymbol} tintColor={studentTokens.navy} size={15} style={styles.toolbarIcon} />
        <Text style={styles.toolbarLabel}>Time Remaining</Text>
        <Text style={styles.toolbarValue}>18:24</Text>
      </View>
      {!compact ? <View style={styles.toolbarDivider} /> : null}
      <View style={styles.toolbarItem}>
        <Text style={styles.toolbarLabel}>Text Size</Text>
        <View style={styles.textSizeGroup}>
          <Text style={styles.textSizeSmall}>A</Text>
          <Text style={styles.textSizeMedium}>A</Text>
          <Text style={styles.textSizeLarge}>A</Text>
        </View>
      </View>
      {!compact ? <View style={styles.toolbarDivider} /> : null}
      <View style={styles.toolbarItem}>
        <SymbolView name={highlightSymbol} tintColor={studentTokens.yellowDeep} size={15} style={styles.toolbarIcon} />
        <Text style={styles.toolbarValue}>Highlight</Text>
      </View>
      {!compact ? <View style={styles.toolbarDivider} /> : null}
      <View style={styles.toolbarItem}>
        <SymbolView name={noteSymbol} tintColor={studentTokens.blue} size={15} style={styles.toolbarIcon} />
        <Text style={styles.toolbarValue}>Notes</Text>
      </View>
    </Card>
  );
}

function PassageCard() {
  return (
    <Card style={styles.practiceCard} contentStyle={styles.passageBody}>
      <Text style={styles.cardKicker}>Passage 1 of 1</Text>
      <Text style={styles.passageTitle}>The Science of Sleep: Why Rest Matters</Text>
      <View style={styles.passageTextStack}>
        {passageParagraphs.map((paragraph) => <Text key={paragraph} style={styles.passageText}>{paragraph}</Text>)}
      </View>
      <View style={styles.passageFooter}>
        <View style={styles.footerInfo}>
          <SymbolView name={documentSymbol} tintColor="#7a8398" size={14} style={styles.footerIcon} />
          <Text style={styles.footerText}>Word Count: 247</Text>
        </View>
        <Text style={styles.sourceText}>Source: Adapted from scientific American</Text>
      </View>
    </Card>
  );
}

function AnswerRow({ option }: { option: AnswerOption }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: Boolean(option.selected) }} style={({ pressed }) => [styles.answerRow, option.selected ? styles.answerSelected : null, pressed ? styles.pressed : null]}>
      <View style={[styles.answerLetter, option.selected ? styles.answerLetterSelected : null]}>
        <Text style={[styles.answerLetterText, option.selected ? styles.answerLetterTextSelected : null]}>{option.key}</Text>
      </View>
      <Text style={[styles.answerText, option.selected ? styles.answerTextSelected : null]}>{option.text}</Text>
    </Pressable>
  );
}

function QuestionNavigator() {
  return (
    <View style={styles.navigatorPanel}>
      <Text style={styles.navigatorLabel}>Question Navigator</Text>
      <View style={styles.navigatorRow}>
        {questionNumbers.map((item, index) => {
          const answered = index < 3;
          const active = item === '4';
          const marked = item === '5';
          return (
            <View key={item} style={[styles.navigatorItem, answered ? styles.navigatorAnswered : null, active ? styles.navigatorActive : null, marked ? styles.navigatorMarked : null]}>
              <Text style={[styles.navigatorText, active ? styles.navigatorTextActive : null]}>{item}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function QuestionCard({ compact }: { compact: boolean }) {
  return (
    <Card style={styles.practiceCard} contentStyle={styles.questionBody}>
      <View style={styles.questionTop}>
        <View style={styles.questionTitleGroup}>
          <Text style={styles.cardKicker}>Question 4 of 10</Text>
          <Text style={styles.questionTitle}>What is the main idea of the passage?</Text>
        </View>
        <View style={styles.timePill}>
          <SymbolView name={clockSymbol} tintColor={studentTokens.orange} size={13} style={styles.timeIcon} />
          <Text style={styles.timeText}>18:24</Text>
        </View>
        {!compact ? <SymbolView name={moreSymbol} tintColor={studentTokens.text} size={18} style={styles.moreIcon} /> : null}
      </View>

      <View style={styles.answerList}>
        {answerOptions.map((option) => <AnswerRow key={option.key} option={option} />)}
      </View>

      <View style={styles.reviewRow}>
        <View style={styles.reviewBox} />
        <Text style={styles.reviewText}>Mark for Review</Text>
        <SymbolView name={flagSymbol} tintColor={studentTokens.blue} size={13} style={styles.reviewIcon} />
      </View>

      <QuestionNavigator />

      <View style={[styles.questionActions, compact ? styles.questionActionsCompact : null]}>
        <Button label="Previous" size="sm" variant="secondary" style={[styles.navButton, compact ? styles.navButtonCompact : null]} />
        <Button label="Next" size="sm" variant="ghost" right={<SymbolView name={arrowSymbol} tintColor="#ffffff" size={13} style={styles.buttonIcon} />} style={[styles.nextButton, compact ? styles.navButtonCompact : null]} textStyle={styles.nextButtonText} />
      </View>

      <Button label="Submit & Review" size="sm" variant="secondary" left={<SymbolView name={documentSymbol} tintColor={studentTokens.yellowDeep} size={15} style={styles.buttonIcon} />} style={styles.submitButton} />
    </Card>
  );
}

function SkillFocusCard() {
  return (
    <Card style={styles.supportCard} contentStyle={styles.supportBody}>
      <View style={styles.supportHead}>
        <Text style={styles.supportTitle}>READING FOCUS</Text>
        <View style={styles.focusIconBox}>
          <SymbolView name={targetSymbol} tintColor={studentTokens.yellowDeep} size={18} style={styles.focusIcon} />
        </View>
      </View>
      <Text style={styles.supportMainText}>Main idea questions reward structure, not isolated details.</Text>
      <Progress value={72} color={studentTokens.yellowDeep} style={styles.focusProgress} />
      <Text style={styles.supportHint}>Practice Accuracy /100: 72 · Target section score: 24/30</Text>
    </Card>
  );
}

function ReviewTipsCard() {
  return (
    <Card style={styles.supportCard} contentStyle={styles.supportBody}>
      <View style={styles.supportHead}>
        <Text style={styles.supportTitle}>NEXT REVIEW</Text>
        <View style={styles.checkIconBox}>
          <SymbolView name={checkSymbol} tintColor={studentTokens.teal} size={18} style={styles.focusIcon} />
        </View>
      </View>
      <View style={styles.tipList}>
        <Text style={styles.tipText}>Eliminate answer choices that focus on only one paragraph.</Text>
        <Text style={styles.tipText}>Confirm the selected answer covers the whole passage.</Text>
      </View>
    </Card>
  );
}

export function ReadingPractice() {
  const { width } = useWindowDimensions();
  const isWide = width >= 1040;
  const isTablet = width >= 760;
  const isCompact = width < 620;

  return (
    <View testID="reading-practice-screen" style={styles.screen}>
      <PageHeader compact={!isTablet} />
      <PracticeToolbar compact={isCompact} />

      <View style={[styles.practiceGrid, isWide ? styles.practiceGridWide : null]}>
        <View style={styles.passageColumn}>
          <PassageCard />
        </View>
        <View style={[styles.questionColumn, !isWide ? styles.questionColumnStacked : null]}>
          <QuestionCard compact={isCompact} />
        </View>
      </View>

      <View style={[styles.supportGrid, isTablet ? styles.supportGridWide : null]}>
        <SkillFocusCard />
        <ReviewTipsCard />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 10 },
  pressed: { opacity: 0.72 },
  headerStack: { gap: 8 },
  backLink: { alignSelf: 'flex-start', minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backIcon: { width: 13, height: 13 },
  backText: { fontFamily: fontFamily, color: '#5f6980', fontSize: 10, lineHeight: 14, fontWeight: '700' },
  headerRow: { gap: 12 },
  headerRowCompact: { alignItems: 'stretch' },
  titleArea: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleIconBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: studentTokens.blueSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  titleIcon: { width: 25, height: 25 },
  titleCopy: { flex: 1, minWidth: 0 },
  pageTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  pageSubtitle: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 10, lineHeight: 14, fontWeight: '600', marginTop: 3 },
  metricsCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', width: 382, maxWidth: '100%', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  metricsCardCompact: { width: '100%' },
  metricsBody: { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  metricsBodyCompact: { flexWrap: 'wrap' },
  headerMetric: { flex: 1, minWidth: 74, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#eef1f6', gap: 3 },
  headerMetricValue: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 17, lineHeight: 21, fontWeight: '700' },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricDot: { width: 5, height: 5, borderRadius: 3 },
  headerMetricLabel: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700', textAlign: 'center' },
  toolbarCard: { padding: 0, borderRadius: 10, borderColor: '#e5eaf2', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  toolbarBody: { minHeight: 43, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  toolbarBodyCompact: { alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'flex-start' },
  toolbarItem: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 102 },
  toolbarItemWide: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 160 },
  toolbarDivider: { width: 1, height: 24, backgroundColor: '#eef1f6' },
  toolbarDiamond: { width: 9, height: 9, borderWidth: 1, borderColor: studentTokens.blue, transform: [{ rotate: '45deg' }] },
  toolbarLabel: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700' },
  toolbarValue: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 13, fontWeight: '700' },
  toolbarIcon: { width: 15, height: 15 },
  textSizeGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  textSizeSmall: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  textSizeMedium: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 11, lineHeight: 14, fontWeight: '700' },
  textSizeLarge: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 13, lineHeight: 16, fontWeight: '700' },
  practiceGrid: { gap: 10 },
  practiceGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  passageColumn: { flex: 1.04, minWidth: 0 },
  questionColumn: { flex: 0.96, minWidth: 0 },
  questionColumnStacked: { width: '100%' },
  practiceCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  passageBody: { minHeight: 460, padding: 16, gap: 11 },
  cardKicker: { fontFamily: fontFamily, color: studentTokens.blue, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  passageTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  passageTextStack: { gap: 12, flex: 1 },
  passageText: { fontFamily: fontFamily, color: '#31405c', fontSize: 11, lineHeight: 17, fontWeight: '600' },
  passageFooter: { minHeight: 38, borderRadius: 8, backgroundColor: studentTokens.neutral, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  footerIcon: { width: 14, height: 14 },
  footerText: { fontFamily: fontFamily, color: '#6e778b', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  sourceText: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700' },
  questionBody: { padding: 14, gap: 10 },
  questionTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  questionTitleGroup: { flex: 1, minWidth: 0, gap: 7 },
  questionTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  timePill: { minHeight: 24, borderRadius: 999, backgroundColor: studentTokens.orangeSoft, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  timeIcon: { width: 13, height: 13 },
  timeText: { fontFamily: fontFamily, color: studentTokens.orange, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  moreIcon: { width: 18, height: 18, flexShrink: 0 },
  answerList: { gap: 8 },
  answerRow: { minHeight: 40, borderRadius: 8, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.surface, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 9, paddingVertical: 8 },
  answerSelected: { borderColor: '#6bd5be', backgroundColor: '#eafaf6' },
  answerLetter: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  answerLetterSelected: { backgroundColor: studentTokens.teal },
  answerLetterText: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  answerLetterTextSelected: { color: '#ffffff' },
  answerText: { fontFamily: fontFamily, flex: 1, minWidth: 0, color: '#4f5870', fontSize: 9, lineHeight: 14, fontWeight: '600' },
  answerTextSelected: { color: studentTokens.ink, fontWeight: '700' },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reviewBox: { width: 15, height: 15, borderRadius: 3, borderWidth: 1, borderColor: '#b7c0d2', backgroundColor: studentTokens.surface },
  reviewText: { fontFamily: fontFamily, color: '#5f6980', fontSize: 9, lineHeight: 12, fontWeight: '600' },
  reviewIcon: { width: 13, height: 13 },
  navigatorPanel: { borderRadius: 9, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: studentTokens.neutral, padding: 10, gap: 8 },
  navigatorLabel: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700' },
  navigatorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  navigatorItem: { width: 28, height: 28, borderRadius: 7, borderWidth: 1, borderColor: '#e2e7f0', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  navigatorAnswered: { borderColor: '#c7eadf', backgroundColor: '#effbf6' },
  navigatorActive: { borderColor: studentTokens.navy, backgroundColor: '#ffffff' },
  navigatorMarked: { borderColor: '#ffd0a8', backgroundColor: '#fff4e9' },
  navigatorText: { fontFamily: fontFamily, color: '#5f6980', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  navigatorTextActive: { color: studentTokens.navy },
  questionActions: { flexDirection: 'row', gap: 9 },
  questionActionsCompact: { flexWrap: 'wrap' },
  navButton: { flex: 1, minHeight: 36, borderRadius: 7 },
  navButtonCompact: { minWidth: 130 },
  nextButton: { flex: 1, minHeight: 36, borderRadius: 7, backgroundColor: '#001b48', borderColor: '#001b48' },
  nextButtonText: { color: '#ffffff' },
  submitButton: { minHeight: 38, borderRadius: 7, backgroundColor: studentTokens.yellowSoft, borderColor: '#f3dfa3' },
  buttonIcon: { width: 15, height: 15 },
  supportGrid: { gap: 10 },
  supportGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  supportCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', flex: 1, shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  supportBody: { padding: 13, gap: 10 },
  supportHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  supportTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  focusIconBox: { width: 34, height: 34, borderRadius: 12, backgroundColor: studentTokens.yellowSoft, alignItems: 'center', justifyContent: 'center' },
  checkIconBox: { width: 34, height: 34, borderRadius: 12, backgroundColor: studentTokens.tealSoft, alignItems: 'center', justifyContent: 'center' },
  focusIcon: { width: 18, height: 18 },
  supportMainText: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  focusProgress: { marginTop: 2 },
  supportHint: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 9, lineHeight: 13, fontWeight: '600' },
  tipList: { gap: 8 },
  tipText: { fontFamily: fontFamily, color: '#4f5870', fontSize: 10, lineHeight: 15, fontWeight: '600' },
});