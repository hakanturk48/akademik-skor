import { useEffect, useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button, Card, Progress, studentTokens } from '@/components/student/ui';
import type { ReadingPracticeQuestion, ReadingPracticeScreen } from '@/lib/content';
import { countReadingPracticeWords, formatReadingPracticeTimer, getReadingPracticeScreen, syncPublishedReadingPracticeScreens } from '@/lib/reading-practice-content';

const fontFamily = 'Quicksand';

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

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

const emptyQuestion: ReadingPracticeQuestion = {
  prompt: 'No question configured yet.',
  options: [],
};

function clampCount(value: number | undefined, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value ?? min)));
}

function getActiveQuestionIndex(content: ReadingPracticeScreen) {
  const questionCount = Math.max(1, content.questions.length);
  return clampCount(content.currentQuestionIndex, 0, questionCount - 1);
}

function buildMetrics(content: ReadingPracticeScreen): MetricItem[] {
  const questionCount = Math.max(1, content.questions.length);
  const activeQuestion = getActiveQuestionIndex(content);
  const answered = clampCount(content.answeredCount, 0, questionCount);
  const marked = clampCount(content.markedCount, 0, questionCount);
  const unanswered = Math.max(0, questionCount - answered);

  return [
    { value: String(answered), label: 'Answered', color: studentTokens.teal },
    { value: String(marked), label: 'Marked', color: studentTokens.yellowDeep },
    { value: String(unanswered), label: 'Not Answered', color: '#b7c0d2' },
    { value: `${activeQuestion + 1} / ${questionCount}`, label: 'Questions', color: studentTokens.navy },
  ];
}

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

function PageHeader({ compact, content, metrics }: { compact: boolean; content: ReadingPracticeScreen; metrics: MetricItem[] }) {
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
            <Text style={styles.pageTitle}>{content.title}</Text>
            <Text style={styles.pageSubtitle}>{content.subtitle || content.description}</Text>
          </View>
        </View>

        <Card style={[styles.metricsCard, compact ? styles.metricsCardCompact : null]} contentStyle={[styles.metricsBody, compact ? styles.metricsBodyCompact : null]}>
          {metrics.map((item) => <HeaderMetric key={item.label} item={item} />)}
        </Card>
      </View>
    </View>
  );
}

function PracticeToolbar({ compact, content, timerText }: { compact: boolean; content: ReadingPracticeScreen; timerText: string }) {
  return (
    <Card style={styles.toolbarCard} contentStyle={[styles.toolbarBody, compact ? styles.toolbarBodyCompact : null]}>
      <View style={styles.toolbarItemWide}>
        <View style={styles.toolbarDiamond} />
        <Text style={styles.toolbarLabel}>Question Type</Text>
        <Text style={styles.toolbarValue}>{content.questionType}</Text>
        <SymbolView name={arrowSymbol} tintColor="#7a8398" size={12} style={styles.toolbarIcon} />
      </View>
      {!compact ? <View style={styles.toolbarDivider} /> : null}
      <View style={styles.toolbarItem}>
        <SymbolView name={clockSymbol} tintColor={studentTokens.navy} size={15} style={styles.toolbarIcon} />
        <Text style={styles.toolbarLabel}>Time Remaining</Text>
        <Text style={styles.toolbarValue}>{timerText}</Text>
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

function PassageCard({ content }: { content: ReadingPracticeScreen }) {
  const paragraphs = content.passageParagraphs.length ? content.passageParagraphs : ['No passage configured yet.'];
  const wordCount = content.wordCount || countReadingPracticeWords(paragraphs);

  return (
    <Card style={styles.practiceCard} contentStyle={styles.passageBody}>
      <Text style={styles.cardKicker}>Passage 1 of 1</Text>
      <Text style={styles.passageTitle}>{content.passageTitle}</Text>
      <View style={styles.passageTextStack}>
        {paragraphs.map((paragraph, index) => <Text key={`${index}-${paragraph.slice(0, 24)}`} style={styles.passageText}>{paragraph}</Text>)}
      </View>
      <View style={styles.passageFooter}>
        <View style={styles.footerInfo}>
          <SymbolView name={documentSymbol} tintColor="#7a8398" size={14} style={styles.footerIcon} />
          <Text style={styles.footerText}>Word Count: {wordCount}</Text>
        </View>
        {content.sourceLabel ? <Text style={styles.sourceText}>Source: {content.sourceLabel}</Text> : null}
      </View>
    </Card>
  );
}

function AnswerRow({ option, selected }: { option: ReadingPracticeQuestion['options'][number]; selected: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} style={({ pressed }) => [styles.answerRow, selected ? styles.answerSelected : null, pressed ? styles.pressed : null]}>
      <View style={[styles.answerLetter, selected ? styles.answerLetterSelected : null]}>
        <Text style={[styles.answerLetterText, selected ? styles.answerLetterTextSelected : null]}>{option.key}</Text>
      </View>
      <Text style={[styles.answerText, selected ? styles.answerTextSelected : null]}>{option.text}</Text>
    </Pressable>
  );
}

function QuestionNavigator({ content, activeIndex }: { content: ReadingPracticeScreen; activeIndex: number }) {
  const questionCount = Math.max(1, content.questions.length);
  const answered = clampCount(content.answeredCount, 0, questionCount);
  const marked = clampCount(content.markedCount, 0, questionCount);

  return (
    <View style={styles.navigatorPanel}>
      <Text style={styles.navigatorLabel}>Question Navigator</Text>
      <View style={styles.navigatorRow}>
        {Array.from({ length: questionCount }, (_, index) => {
          const active = index === activeIndex;
          const isAnswered = index < answered;
          const isMarked = Boolean(content.questions[index]?.marked) || index < marked;
          return (
            <View key={index} style={[styles.navigatorItem, isAnswered ? styles.navigatorAnswered : null, active ? styles.navigatorActive : null, isMarked ? styles.navigatorMarked : null]}>
              <Text style={[styles.navigatorText, active ? styles.navigatorTextActive : null]}>{index + 1}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function QuestionCard({ compact, content, timerText }: { compact: boolean; content: ReadingPracticeScreen; timerText: string }) {
  const activeIndex = getActiveQuestionIndex(content);
  const activeQuestion = content.questions[activeIndex] ?? emptyQuestion;
  const questionCount = Math.max(1, content.questions.length);

  return (
    <Card style={styles.practiceCard} contentStyle={styles.questionBody}>
      <View style={styles.questionTop}>
        <View style={styles.questionTitleGroup}>
          <Text style={styles.cardKicker}>Question {activeIndex + 1} of {questionCount}</Text>
          <Text style={styles.questionTitle}>{activeQuestion.prompt}</Text>
        </View>
        <View style={styles.timePill}>
          <SymbolView name={clockSymbol} tintColor={studentTokens.orange} size={13} style={styles.timeIcon} />
          <Text style={styles.timeText}>{timerText}</Text>
        </View>
        {!compact ? <SymbolView name={moreSymbol} tintColor={studentTokens.text} size={18} style={styles.moreIcon} /> : null}
      </View>

      <View style={styles.answerList}>
        {activeQuestion.options.map((option) => <AnswerRow key={option.key} option={option} selected={option.key === activeQuestion.correctOptionKey} />)}
      </View>

      <View style={styles.reviewRow}>
        <View style={styles.reviewBox} />
        <Text style={styles.reviewText}>Mark for Review</Text>
        <SymbolView name={flagSymbol} tintColor={studentTokens.blue} size={13} style={styles.reviewIcon} />
      </View>

      <QuestionNavigator content={content} activeIndex={activeIndex} />

      <View style={[styles.questionActions, compact ? styles.questionActionsCompact : null]}>
        <Button label="Previous" size="sm" variant="secondary" style={[styles.navButton, compact ? styles.navButtonCompact : null]} />
        <Button label="Next" size="sm" variant="ghost" right={<SymbolView name={arrowSymbol} tintColor="#ffffff" size={13} style={styles.buttonIcon} />} style={[styles.nextButton, compact ? styles.navButtonCompact : null]} textStyle={styles.nextButtonText} />
      </View>

      <Button label="Submit & Review" size="sm" variant="secondary" left={<SymbolView name={documentSymbol} tintColor={studentTokens.yellowDeep} size={15} style={styles.buttonIcon} />} style={styles.submitButton} />
    </Card>
  );
}

function SkillFocusCard({ content }: { content: ReadingPracticeScreen }) {
  return (
    <Card style={styles.supportCard} contentStyle={styles.supportBody}>
      <View style={styles.supportHead}>
        <Text style={styles.supportTitle}>{content.supportFocusTitle}</Text>
        <View style={styles.focusIconBox}>
          <SymbolView name={targetSymbol} tintColor={studentTokens.yellowDeep} size={18} style={styles.focusIcon} />
        </View>
      </View>
      <Text style={styles.supportMainText}>{content.supportFocusText}</Text>
      <Progress value={content.supportProgress} color={studentTokens.yellowDeep} style={styles.focusProgress} />
      <Text style={styles.supportHint}>{content.supportHint}</Text>
    </Card>
  );
}

function ReviewTipsCard({ content }: { content: ReadingPracticeScreen }) {
  const tips = content.reviewTips.length ? content.reviewTips : ['No review tips configured yet.'];

  return (
    <Card style={styles.supportCard} contentStyle={styles.supportBody}>
      <View style={styles.supportHead}>
        <Text style={styles.supportTitle}>{content.reviewTitle}</Text>
        <View style={styles.checkIconBox}>
          <SymbolView name={checkSymbol} tintColor={studentTokens.teal} size={18} style={styles.focusIcon} />
        </View>
      </View>
      <View style={styles.tipList}>
        {tips.map((tip, index) => <Text key={`${index}-${tip.slice(0, 24)}`} style={styles.tipText}>{tip}</Text>)}
      </View>
    </Card>
  );
}

export function ReadingPractice() {
  const { width } = useWindowDimensions();
  const [content, setContent] = useState(() => getReadingPracticeScreen());
  const isWide = width >= 1040;
  const isTablet = width >= 760;
  const isCompact = width < 620;
  const metrics = useMemo(() => buildMetrics(content), [content]);
  const timerText = formatReadingPracticeTimer(content.timeRemainingSeconds);

  useEffect(() => {
    let active = true;
    void syncPublishedReadingPracticeScreens()
      .catch(() => false)
      .finally(() => {
        if (active) setContent(getReadingPracticeScreen());
      });
    return () => { active = false; };
  }, []);

  return (
    <View testID="reading-practice-screen" style={styles.screen}>
      <PageHeader compact={!isTablet} content={content} metrics={metrics} />
      <PracticeToolbar compact={isCompact} content={content} timerText={timerText} />

      <View style={[styles.practiceGrid, isWide ? styles.practiceGridWide : null]}>
        <View style={styles.passageColumn}>
          <PassageCard content={content} />
        </View>
        <View style={[styles.questionColumn, !isWide ? styles.questionColumnStacked : null]}>
          <QuestionCard compact={isCompact} content={content} timerText={timerText} />
        </View>
      </View>

      <View style={[styles.supportGrid, isTablet ? styles.supportGridWide : null]}>
        <SkillFocusCard content={content} />
        <ReviewTipsCard content={content} />
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

