import { useState } from 'react';
import { Image } from 'expo-image';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ProgressRecommendationList } from '@/components/student/RecommendationCards';
import { Button, Card, Progress, Tabs, studentTokens } from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };
type Tone = 'blue' | 'teal' | 'orange' | 'purple' | 'yellow' | 'navy' | 'green';
type WritingMode = 'integrated' | 'independent';

type Metric = {
  label: string;
  value: string;
  sub?: string;
  tone: Tone;
  icon: AppSymbolName;
  progress?: number;
};

type PracticeAnswer = {
  key: string;
  text: string;
  selected?: boolean;
};

type TestRow = {
  id: string;
  name: string;
  type: string;
  duration: string;
  questions: string;
  difficulty: string;
  access: 'Free' | 'Premium';
  score: string;
  date: string;
  action: string;
  tone: Tone;
};

const fontFamily = 'Quicksand';

const symbolName = (ios: string, web: string): AppSymbolName => ({
  ios: ios as SFSymbol,
  android: web as AndroidSymbol,
  web: web as AndroidSymbol,
});

const arrowSymbol = symbolName('chevron.right', 'chevron_right');
const playSymbol = symbolName('play.fill', 'play_arrow');
const pauseSymbol = symbolName('pause.fill', 'pause');
const stopSymbol = symbolName('stop.fill', 'stop');
const retrySymbol = symbolName('arrow.clockwise', 'refresh');
const sendSymbol = symbolName('paperplane.fill', 'send');
const targetSymbol = symbolName('target', 'track_changes');
const bookSymbol = symbolName('book', 'menu_book');
const headphonesSymbol = symbolName('headphones', 'headphones');
const micSymbol = symbolName('mic', 'mic');
const writingSymbol = symbolName('square.and.pencil', 'edit_square');
const grammarSymbol = symbolName('text.book.closed', 'library_books');
const vocabSymbol = symbolName('textformat.abc', 'abc');
const checkSymbol = symbolName('checkmark', 'check');
const checkCircleSymbol = symbolName('checkmark.circle.fill', 'check_circle');
const clockSymbol = symbolName('clock', 'schedule');
const documentSymbol = symbolName('doc.text', 'description');
const trophySymbol = symbolName('trophy.fill', 'emoji_events');
const chartSymbol = symbolName('chart.line.uptrend.xyaxis', 'trending_up');
const calendarSymbol = symbolName('calendar', 'calendar_month');
const flameSymbol = symbolName('flame.fill', 'local_fire_department');
const filterSymbol = symbolName('line.3.horizontal.decrease.circle', 'filter_alt');
const searchSymbol = symbolName('magnifyingglass', 'search');
const saveSymbol = symbolName('bookmark', 'bookmark');
const volumeSymbol = symbolName('speaker.wave.2', 'volume_up');
const lockSymbol = symbolName('lock.fill', 'lock');
const uploadSymbol = symbolName('square.and.arrow.up', 'file_upload');
const moreSymbol = symbolName('ellipsis', 'more_vert');

const toneColor: Record<Tone, string> = {
  blue: studentTokens.blue,
  teal: studentTokens.teal,
  orange: studentTokens.orange,
  purple: '#8b5cf6',
  yellow: studentTokens.yellowDeep,
  navy: '#001b48',
  green: '#16a34a',
};

const toneSoft: Record<Tone, string> = {
  blue: studentTokens.blueSoft,
  teal: studentTokens.tealSoft,
  orange: studentTokens.orangeSoft,
  purple: '#f0e9ff',
  yellow: studentTokens.yellowSoft,
  navy: '#edf2ff',
  green: '#e8f8ef',
};

const waveformBars = [14, 26, 44, 62, 32, 54, 71, 39, 66, 48, 76, 35, 58, 46, 69, 42, 80, 51, 64, 38, 57, 45, 72, 36, 52, 44, 61, 33, 49, 40, 56, 31, 45, 38, 54, 28, 43, 34, 50, 30, 46, 36, 52, 32, 48, 39, 55, 35, 51, 29, 44];

const speakingAnswers: PracticeAnswer[] = [
  { key: 'A', text: 'Give a clear opinion and keep one position.' },
  { key: 'B', text: 'Use two reasons with specific examples.', selected: true },
  { key: 'C', text: 'Close with a short summary of your view.' },
];

const speakingCriteria = [
  { title: 'Fluency & Coherence', text: 'Speak smoothly and organize ideas clearly.', score: '0 - 4 raw', tone: 'orange' as Tone, icon: volumeSymbol },
  { title: 'Lexical Resource', text: 'Use accurate academic vocabulary.', score: '0 - 4 raw', tone: 'green' as Tone, icon: bookSymbol },
  { title: 'Grammatical Range', text: 'Use varied structures with control.', score: '0 - 4 raw', tone: 'blue' as Tone, icon: grammarSymbol },
  { title: 'Pronunciation', text: 'Keep rhythm, stress, and intonation natural.', score: '0 - 4 raw', tone: 'purple' as Tone, icon: headphonesSymbol },
];

const previousAttempts = [
  { attempt: '3 latest', date: 'May 30, 2025 - 09:45 AM', duration: '01:58', estimated: '23/30', delivery: '4.0', language: '3.5', topic: '4.0', pronunciation: '4.0' },
  { attempt: '2', date: 'May 28, 2025 - 06:20 PM', duration: '02:00', estimated: '21/30', delivery: '3.5', language: '3.5', topic: '3.0', pronunciation: '3.5' },
  { attempt: '1', date: 'May 26, 2025 - 08:15 AM', duration: '01:47', estimated: '19/30', delivery: '3.0', language: '2.5', topic: '3.0', pronunciation: '3.0' },
];

const mockRows: TestRow[] = [
  { id: '01', name: 'Mock Test 01', type: 'Full Test - 4 Sections', duration: '120 min', questions: '100 Questions', difficulty: 'Moderate', access: 'Premium', score: '105 /120', date: 'May 30, 2025', action: 'Review Test', tone: 'purple' },
  { id: '02', name: 'Mock Test 02', type: 'Full Test - 4 Sections', duration: '120 min', questions: '100 Questions', difficulty: 'Moderate', access: 'Premium', score: '94 /120', date: 'May 28, 2025', action: 'Resume Test', tone: 'yellow' },
  { id: '03', name: 'Mock Test 03', type: 'Full Test - 4 Sections', duration: '120 min', questions: '100 Questions', difficulty: 'Easy', access: 'Free', score: '- /120', date: 'Not attempted', action: 'Start Test', tone: 'green' },
  { id: '04', name: 'Mock Test 04', type: 'Section Test - Reading', duration: '35 min', questions: '20 Questions', difficulty: 'Easy', access: 'Free', score: '78 /100', date: 'May 22, 2025', action: 'Review Test', tone: 'blue' },
  { id: '05', name: 'Listening Section Test 02', type: 'Section Test - Listening', duration: '45 min', questions: '28 Questions', difficulty: 'Moderate', access: 'Premium', score: '- /100', date: 'Not attempted', action: 'Start Test', tone: 'purple' },
];

const progressMetrics: Metric[] = [
  { label: 'Estimated Score', value: '87', sub: '/120 | +6 vs last 30 days', tone: 'blue', icon: chartSymbol, progress: 72 },
  { label: 'Target Score', value: '105', sub: '/120 | +5 vs last 30 days', tone: 'orange', icon: targetSymbol, progress: 88 },
  { label: 'Study Time This Month', value: '24h 35m', sub: '+3h 20m vs last month', tone: 'green', icon: clockSymbol, progress: 67 },
  { label: 'Lessons Completed', value: '28', sub: '/40 | +6 vs last 30 days', tone: 'purple', icon: bookSymbol, progress: 70 },
];

const skillMastery = [
  { label: 'Reading', value: 82, score: '24/30', tone: 'blue' as Tone, icon: bookSymbol },
  { label: 'Listening', value: 74, score: '22/30', tone: 'teal' as Tone, icon: headphonesSymbol },
  { label: 'Speaking', value: 61, score: '23/30', tone: 'purple' as Tone, icon: micSymbol },
  { label: 'Writing', value: 68, score: '23/30', tone: 'orange' as Tone, icon: writingSymbol },
];

const consistencyDays = [0, 2, 3, 1, 4, 2, 0, 3, 4, 1, 2, 0, 4, 3, 2, 1, 0, 3, 2, 4, 1, 2, 3, 0, 4, 2, 1, 3, 2, 0];

function PageTitle({ title, subtitle, right }: { title: string; subtitle: string; right?: React.ReactNode }) {
  return (
    <View style={styles.pageHead}>
      <View style={styles.pageCopy}>
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.pageSubtitle}>{subtitle}</Text>
      </View>
      {right}
    </View>
  );
}

function QuoteCard({ text }: { text: string }) {
  return (
    <View style={styles.quoteCard}>
      <Text style={styles.quoteMark}>&quot;</Text>
      <Text style={styles.quoteText}>{text}</Text>
      <Text style={styles.quoteAuthor}>- Akademik Skor</Text>
    </View>
  );
}

function IconBubble({ icon, tone = 'blue', size = 38 }: { icon: AppSymbolName; tone?: Tone; size?: number }) {
  const iconSize = Math.round(size * 0.56);
  return (
    <View style={[styles.iconBubble, { width: size, height: size, borderRadius: Math.round(size / 3), backgroundColor: toneSoft[tone] }]}>
      <SymbolView name={icon} tintColor={toneColor[tone]} size={iconSize} style={[styles.symbolFill, { width: iconSize, height: iconSize }]} />
    </View>
  );
}

function MetricCard({ item }: { item: Metric }) {
  const { width } = useWindowDimensions();
  const tablet = width >= 760;

  return (
    <Card style={[styles.metricCard, tablet ? styles.metricCardTablet : styles.metricCardMobile]} contentStyle={styles.metricBody}>
      <View style={styles.metricTop}>
        <IconBubble icon={item.icon} tone={item.tone} />
        <View style={styles.metricCopy}>
          <Text style={styles.metricLabel}>{item.label.toUpperCase()}</Text>
          <Text style={styles.metricValue}>{item.value}</Text>
          {item.sub ? <Text style={styles.metricSub}>{item.sub}</Text> : null}
        </View>
      </View>
      {typeof item.progress === 'number' ? <Progress value={item.progress} color={toneColor[item.tone]} /> : null}
    </Card>
  );
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

function MiniBadge({ label, tone = 'blue' }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.miniBadge, { backgroundColor: toneSoft[tone], borderColor: `${toneColor[tone]}33` }]}>
      <Text style={[styles.miniBadgeText, { color: toneColor[tone] }]}>{label}</Text>
    </View>
  );
}

function Waveform({ color = studentTokens.yellow, muted = '#32486f', compact = false }: { color?: string; muted?: string; compact?: boolean }) {
  const scale = compact ? 0.58 : 1;

  return (
    <View style={[styles.waveform, compact ? styles.waveformCompact : null]}>
      {waveformBars.map((height, index) => (
        <View
          key={`${height}-${index}`}
          style={[styles.waveBar, { height: Math.max(9, Math.round(height * scale)), backgroundColor: index < 24 ? color : muted }]}
        />
      ))}
    </View>
  );
}
function ToolbarButton({ icon, label }: { icon: AppSymbolName; label: string }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.toolbarButton, pressed ? styles.pressed : null]}>
      <SymbolView name={icon} tintColor={studentTokens.navy} size={14} style={styles.tinyIcon} />
      <Text style={styles.toolbarButtonText}>{label}</Text>
    </Pressable>
  );
}

function MiniLineChart({ tone = 'yellow' }: { tone?: Tone }) {
  const points = [38, 54, 58, 62, 68, 72, 80];
  return (
    <View style={styles.miniLineChart}>
      {points.map((point, index) => (
        <View key={`${point}-${index}`} style={styles.miniPointColumn}>
          <View style={[styles.miniPointBar, { height: point, backgroundColor: `${toneColor[tone]}28` }]} />
          <View style={[styles.miniPointDot, { backgroundColor: toneColor[tone] }]} />
        </View>
      ))}
    </View>
  );
}

function ScoreTrendChart() {
  const values = [61, 70, 74, 78, 81, 84, 87];
  const labels = ['May 01', 'May 06', 'May 11', 'May 16', 'May 21', 'May 26', 'May 30'];
  return (
    <View style={styles.trendChart}>
      <View style={styles.trendAxis}>
        {[120, 100, 80, 60, 40, 20, 0].map((tick) => <Text key={tick} style={styles.axisText}>{tick}</Text>)}
      </View>
      <View style={styles.trendPlot}>
        <View style={styles.targetLine} />
        {values.map((value, index) => {
          const height = Math.max(16, (value / 120) * 132);
          const last = index === values.length - 1;
          return (
            <View key={labels[index]} style={styles.trendColumn}>
              <View style={styles.trendColumnInner}>
                <View style={[styles.trendFill, { height }]} />
                <View style={[styles.trendDot, { bottom: height - 5 }, last ? styles.trendDotLast : null]}>
                  {last ? <Text style={styles.trendDotText}>{value}</Text> : null}
                </View>
              </View>
              <Text style={styles.chartLabel}>{labels[index]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Heatmap() {
  return (
    <View style={styles.heatmapGrid}>
      {consistencyDays.map((level, index) => (
        <View key={String(index)} style={[styles.heatCell, level === 0 ? styles.heatEmpty : { backgroundColor: `rgba(0, 125, 115, ${0.18 + level * 0.17})` }]} />
      ))}
    </View>
  );
}

function TimerBox({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <View style={styles.timerBox}>
      <IconBubble icon={tone === 'orange' ? clockSymbol : micSymbol} tone={tone} size={34} />
      <View>
        <Text style={styles.timerLabel}>{label}</Text>
        <Text style={styles.timerValue}>{value}</Text>
      </View>
    </View>
  );
}

export function SpeakingPractice() {
  const { width } = useWindowDimensions();
  const isWide = width >= 1080;
  const isTablet = width >= 760;
  const isCompact = width < 620;

  return (
    <View testID="speaking-practice-screen" style={styles.screen}>
      <View style={[styles.pageTopLine, !isTablet ? styles.pageTopLineCompact : null]}>
        <View style={styles.headingWithPill}>
          <PageTitle title="Speaking Practice" subtitle="Independent Task 2" />
          <MiniBadge label="Estimated Speaking /30" tone="purple" />
        </View>
        {isTablet ? <QuoteCard text="Practice consistently, speak confidently." /> : null}
      </View>

      <View style={[styles.twoColumnGrid, isWide ? styles.twoColumnGridWide : null]}>
        <View style={styles.mainColumn}>
          <Card style={styles.practicePanel} contentStyle={styles.practicePanelBody}>
            <SectionHeader title="TASK PROMPT" right={<View style={styles.timerStackRow}><TimerBox label="PREPARATION TIME" value="01:00" tone="orange" /><TimerBox label="SPEAKING TIME" value="02:00" tone="purple" /></View>} />
            <View style={styles.promptBody}>
              <Text style={styles.promptQuestion}>Some people believe that celebrities are good role models for young people.</Text>
              <Text style={styles.promptQuestion}>To what extent do you agree or disagree?</Text>
              <Text style={styles.promptText}>Give reasons for your answer and include any relevant examples from your own knowledge or experience.</Text>
            </View>
            <View style={styles.checkList}>
              <Text style={styles.checkListTitle}>INCLUDE IN YOUR RESPONSE</Text>
              {speakingAnswers.map((item) => (
                <View key={item.key} style={styles.checkRow}>
                  <SymbolView name={checkCircleSymbol} tintColor={toneColor.purple} size={13} style={styles.tinyIcon} />
                  <Text style={styles.checkText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.recorderCard} contentStyle={[styles.recorderBody, isCompact ? styles.recorderBodyCompact : null]}>
            <View style={styles.recorderLabelWrap}>
              <Text style={styles.orangeLabel}>RECORD YOUR RESPONSE</Text>
            </View>
            <View style={[styles.recorderStage, isCompact ? styles.recorderStageCompact : null]}>
              <Waveform color="#9f7aea" muted="#264370" compact={isCompact} />
              <View style={[styles.micRing, isCompact ? styles.micRingCompact : null]}>
                <View style={[styles.micCircle, isCompact ? styles.micCircleCompact : null]}>
                  <SymbolView name={micSymbol} tintColor="#8b5cf6" size={isCompact ? 30 : 42} style={isCompact ? styles.mediumIcon : styles.bigIcon} />
                </View>
              </View>
              <View style={[styles.elapsedBox, isCompact ? styles.elapsedBoxCompact : null]}>
                <Text style={styles.elapsedLabel}>ELAPSED TIME</Text>
                <Text style={styles.elapsedValue}>00:00 <Text style={styles.elapsedMax}>/02:00</Text></Text>
                <Progress value={0} color={studentTokens.yellow} />
                <View style={styles.readyHint}>
                  <SymbolView name={checkCircleSymbol} tintColor="#c6f6d5" size={14} style={styles.tinyIcon} />
                  <Text style={styles.readyText}>Click Start and speak clearly. You can pause if needed.</Text>
                </View>
              </View>
            </View>
            <View style={[styles.recorderActions, isCompact ? styles.recorderActionsCompact : null]}>
              <Button label="Start" size="sm" variant="secondary" left={<SymbolView name={playSymbol} tintColor={studentTokens.navy} size={14} style={styles.tinyIcon} />} style={styles.equalButton} />
              <Button label="Pause" size="sm" variant="ghost" left={<SymbolView name={pauseSymbol} tintColor="#ffffff" size={14} style={styles.tinyIcon} />} style={styles.darkGhostButton} textStyle={styles.whiteButtonText} />
              <Button label="Stop" size="sm" variant="ghost" left={<SymbolView name={stopSymbol} tintColor="#ffffff" size={14} style={styles.tinyIcon} />} style={styles.darkGhostButton} textStyle={styles.whiteButtonText} />
              <Button label="Retry" size="sm" variant="ghost" left={<SymbolView name={retrySymbol} tintColor="#ffffff" size={14} style={styles.tinyIcon} />} style={styles.darkGhostButton} textStyle={styles.whiteButtonText} />
              <Button label="Submit" size="sm" variant="ghost" left={<SymbolView name={sendSymbol} tintColor="#9fb4dc" size={14} style={styles.tinyIcon} />} style={styles.disabledDarkButton} textStyle={styles.disabledDarkButtonText} />
            </View>
          </Card>

          <Card style={styles.practicePanel} contentStyle={styles.practicePanelBody}>
            <SectionHeader title="YOUR PREVIOUS ATTEMPTS" />
            {isCompact ? (
              <View style={styles.mobileAttemptList}>
                {previousAttempts.map((attempt) => (
                  <View key={attempt.attempt} style={styles.mobileAttemptCard}>
                    <View style={styles.mobileAttemptTop}>
                      <View style={styles.mobileAttemptMeta}>
                        <Text style={styles.mobileAttemptTitle}>Attempt {attempt.attempt}</Text>
                        <Text style={styles.mobileAttemptDate}>{attempt.date}</Text>
                      </View>
                      <MiniBadge label={attempt.estimated} tone={attempt.estimated === '23/30' ? 'green' : 'orange'} />
                    </View>
                    <View style={styles.mobileAttemptScores}>
                      <MiniBadge label={`Duration ${attempt.duration}`} tone="navy" />
                      <MiniBadge label={`Del. ${attempt.delivery}`} tone="yellow" />
                      <MiniBadge label={`Lang. ${attempt.language}`} tone="green" />
                      <MiniBadge label={`Topic ${attempt.topic}`} tone="blue" />
                      <MiniBadge label={`Pron. ${attempt.pronunciation}`} tone="purple" />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.attemptTable}>
                <View style={styles.tableHead}>
                  {['ATTEMPT', 'DATE & TIME', 'DURATION', 'ESTIMATED', 'DEL.', 'LANG.', 'TOPIC', 'PRON.'].map((head) => <Text key={head} style={styles.tableHeadText}>{head}</Text>)}
                </View>
                {previousAttempts.map((attempt) => (
                  <View key={attempt.attempt} style={styles.tableRow}>
                    <Text style={styles.tableText}>{attempt.attempt}</Text>
                    <Text style={styles.tableText}>{attempt.date}</Text>
                    <Text style={styles.tableText}>{attempt.duration}</Text>
                    <MiniBadge label={attempt.estimated} tone={attempt.estimated === '23/30' ? 'green' : 'orange'} />
                    <MiniBadge label={attempt.delivery} tone="yellow" />
                    <MiniBadge label={attempt.language} tone="green" />
                    <MiniBadge label={attempt.topic} tone="blue" />
                    <MiniBadge label={attempt.pronunciation} tone="purple" />
                  </View>
                ))}
              </View>
            )}            <Button label="View All Attempts" size="sm" variant="secondary" right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.tinyIcon} />} style={styles.centerButton} />
          </Card>
        </View>

        <View style={[styles.sideColumn, !isWide ? styles.sideColumnStacked : null]}>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>SPEAKING TIPS & SCORING CRITERIA</Text>
            {speakingCriteria.map((item) => (
              <View key={item.title} style={styles.criteriaRow}>
                <IconBubble icon={item.icon} tone={item.tone} size={34} />
                <View style={styles.criteriaCopy}>
                  <Text style={styles.criteriaTitle}>{item.title}</Text>
                  <Text style={styles.criteriaText}>{item.text}</Text>
                </View>
                <Text style={styles.criteriaScore}>{item.score}</Text>
              </View>
            ))}
            <Button label="View TOEFL Rubric" size="sm" variant="secondary" right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.tinyIcon} />} style={styles.fullButton} />
          </Card>

          <Card style={styles.beforeCard} contentStyle={styles.beforeBody}>
            <View style={styles.beforeCopy}>
              <Text style={styles.orangeLabel}>BEFORE YOU START</Text>
              {['Find a quiet place', 'Check your microphone', 'Speak clearly and naturally', 'Stick to the time limit', 'Review the task prompt'].map((item) => (
                <View key={item} style={styles.checkRow}>
                  <SymbolView name={checkSymbol} tintColor={toneColor.green} size={13} style={styles.tinyIcon} />
                  <Text style={styles.checkText}>{item}</Text>
                </View>
              ))}
            </View>
            <Image source={require('@/assets/images/academic-hero.png')} style={styles.beforeImage} contentFit="contain" accessibilityLabel="Student preparing for speaking practice" />
          </Card>

          <Card style={styles.sideCard} contentStyle={styles.summaryBody}>
            <Text style={styles.orangeLabel}>PERFORMANCE SUMMARY</Text>
            <View style={styles.summaryScoreRow}>
              <View style={styles.scoreRing}>
                <Text style={styles.scoreRingValue}>23</Text>
                <Text style={styles.scoreRingLabel}>/30</Text>
              </View>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryUp}>+2 since last attempt</Text>
                <Text style={styles.summaryText}>Your fluency and pronunciation improved. Use a wider range of vocabulary in your next attempt.</Text>
              </View>
            </View>
            <Button label="View Detailed Feedback" size="sm" variant="secondary" right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.tinyIcon} />} style={styles.fullButton} />
          </Card>
        </View>
      </View>
    </View>
  );
}

export function WritingPractice() {
  const { width } = useWindowDimensions();
  const isWide = width >= 1080;
  const isTablet = width >= 760;
  const [mode, setMode] = useState<WritingMode>('integrated');

  return (
    <View testID="writing-practice-screen" style={styles.screen}>
      <View style={[styles.pageTopLine, !isTablet ? styles.pageTopLineCompact : null]}>
        <PageTitle title="Writing Practice" subtitle="Develop clear, well-structured responses." />
        <View style={styles.headerActions}>
          {isTablet ? <QuoteCard text="Write clearly. Support logically. Revise purposefully." /> : null}
          <ToolbarButton icon={documentSymbol} label="How it works" />
        </View>
      </View>

      <Tabs<WritingMode>
        value={mode}
        onChange={setMode}
        items={[
          { value: 'integrated', label: 'Integrated Writing' },
          { value: 'independent', label: 'Independent Writing' },
        ]}
      />

      <Card style={styles.toolbarCard} contentStyle={styles.statusBar}>
        <View style={styles.statusItem}><SymbolView name={checkCircleSymbol} tintColor={toneColor.green} size={14} style={styles.tinyIcon} /><Text style={styles.statusText}>Autosaved just now</Text></View>
        <View style={styles.statusItem}><Text style={styles.statusLabel}>Word Count</Text><Text style={styles.statusValue}>278 / 300</Text></View>
        <View style={styles.statusItem}><Text style={styles.statusLabel}>Time Elapsed</Text><Text style={styles.statusValue}>08:42</Text></View>
        <View style={styles.statusItem}><Text style={styles.statusLabel}>Target</Text><Text style={styles.statusValue}>150 - 225 words</Text></View>
        <Button label="Hide Rubric" size="sm" variant="secondary" style={styles.compactButton} />
      </Card>

      <View style={[styles.writingGrid, isWide ? styles.writingGridWide : null]}>
        <View style={[styles.stimulusColumn, !isWide ? styles.stimulusColumnStacked : null]}>
          <StimulusCard kind="READING STIMULUS" title="The Impact of Remote Work on Urban Transportation" icon={bookSymbol} tone="blue" />
          <StimulusCard kind="LISTENING STIMULUS" title="Urban Planning and Sustainable Transportation" icon={playSymbol} tone="green" audio />
        </View>

        <Card style={styles.editorCard} contentStyle={styles.editorBody}>
          <SectionHeader title="YOUR RESPONSE" right={<Text style={styles.wordCounter}>278 words</Text>} />
          <View style={styles.editorToolbar}>
            {['undo', 'redo', 'Paragraph', 'B', 'I', 'U', 'list', 'align', 'link', '...'].map((tool) => <Text key={tool} style={styles.editorTool}>{tool}</Text>)}
          </View>
          <View style={styles.responsePaper}>
            <Text style={styles.responseText}>The reading passage presents findings from a study on how remote work has affected transportation in major cities, while the lecture explains strategies urban planners can use to build more sustainable transportation systems. Both highlight positive changes in urban mobility, but the lecture focuses on long-term solutions that can amplify these benefits.</Text>
            <Text style={styles.responseText}>According to the reading, remote work has led to a significant drop in commuting. Public transit use decreased by 34%, and car usage during peak hours fell by 21%. At the same time, more people are walking and cycling, increasing by 17%. As a result, overall commute times have improved by 18%, which helps reduce traffic congestion and emissions.</Text>
            <Text style={styles.responseText}>The lecture builds on these ideas by discussing how cities can support sustainable transportation through better planning and investment. It suggests improving public transit systems, creating safe bike lanes, and designing neighborhoods that are easy to walk in. These steps can make sustainable choices more convenient and attractive for people.</Text>
            <Text style={styles.responseText}>In conclusion, while the reading shows that remote work has already changed commuting behaviors, the lecture explains how cities can take further action to create a healthier and more sustainable urban future.</Text>
          </View>
          <View style={styles.editorFooter}>
            <Button label="Save Draft" size="sm" variant="secondary" left={<SymbolView name={saveSymbol} tintColor={studentTokens.navy} size={14} style={styles.tinyIcon} />} style={styles.editorAction} />
            <Button label="Submit Response" size="sm" variant="ghost" right={<SymbolView name={sendSymbol} tintColor="#ffffff" size={13} style={styles.tinyIcon} />} style={[styles.editorAction, styles.navyButton]} textStyle={styles.whiteButtonText} />
          </View>
          <Text style={styles.editorHint}>You can continue editing until you submit.</Text>
        </Card>

        <View style={[styles.sideColumn, !isWide ? styles.sideColumnStacked : null]}>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>WRITING RUBRIC</Text>
            {[
              { title: 'Organization', score: '4 / 5', tone: 'blue' as Tone, value: 80 },
              { title: 'Grammar', score: '4 / 5', tone: 'purple' as Tone, value: 80 },
              { title: 'Vocabulary', score: '3 / 5', tone: 'yellow' as Tone, value: 60 },
              { title: 'Coherence', score: '4 / 5', tone: 'green' as Tone, value: 80 },
            ].map((item) => (
              <View key={item.title} style={styles.rubricRow}>
                <IconBubble icon={item.title === 'Organization' ? bookSymbol : item.title === 'Grammar' ? grammarSymbol : item.title === 'Vocabulary' ? vocabSymbol : chartSymbol} tone={item.tone} size={33} />
                <View style={styles.rubricCopy}>
                  <View style={styles.rubricTop}>
                    <Text style={styles.criteriaTitle}>{item.title}</Text>
                    <Text style={styles.rubricScore}>{item.score}</Text>
                  </View>
                  <Progress value={item.value} color={toneColor[item.tone]} />
                </View>
              </View>
            ))}
            <Button label="View Full Rubric Guide" size="sm" variant="secondary" right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.tinyIcon} />} style={styles.fullButton} />
          </Card>

          <Card style={styles.tipCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>FEEDBACK PREVIEW</Text>
            <View style={styles.feedbackBox}>
              <IconBubble icon={chartSymbol} tone="blue" size={33} />
              <View style={styles.feedbackCopy}>
                <Text style={styles.criteriaTitle}>Great start, Alex!</Text>
                <Text style={styles.criteriaText}>Your response addresses both sources with good balance. Add more specific details from the lecture to strengthen support.</Text>
                <Text style={styles.linkText}>View Sample Feedback</Text>
              </View>
            </View>
          </Card>
        </View>
      </View>

      <Card style={styles.practicePanel} contentStyle={styles.tipsStrip}>
        {[
          { title: 'Plan Before You Write', text: 'Spend 1-2 minutes planning your response.', icon: documentSymbol, tone: 'blue' as Tone },
          { title: 'Compare and Contrast', text: 'Explain how lecture and reading relate.', icon: chartSymbol, tone: 'green' as Tone },
          { title: 'Use Specific Details', text: 'Include precise examples and numbers.', icon: writingSymbol, tone: 'orange' as Tone },
        ].map((item) => (
          <View key={item.title} style={styles.tipItem}>
            <IconBubble icon={item.icon} tone={item.tone} size={34} />
            <View style={styles.tipItemCopy}>
              <Text style={styles.criteriaTitle}>{item.title}</Text>
              <Text style={styles.criteriaText}>{item.text}</Text>
            </View>
          </View>
        ))}
        <Button label="View All Tips" size="sm" variant="secondary" right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.tinyIcon} />} style={styles.compactButton} />
      </Card>
    </View>
  );
}

function StimulusCard({ kind, title, icon, tone, audio = false }: { kind: string; title: string; icon: AppSymbolName; tone: Tone; audio?: boolean }) {
  return (
    <Card style={styles.sideCard} contentStyle={styles.sideBody}>
      <Text style={styles.orangeLabel}>{kind}</Text>
      <Text style={styles.stimulusTitle}>{title}</Text>
      {audio ? (
        <View style={styles.audioMini}>
          <IconBubble icon={icon} tone={tone} size={30} />
          <View style={styles.audioMiniTrack}><View style={styles.audioMiniFill} /></View>
          <Text style={styles.audioMiniText}>0:00 / 2:45</Text>
        </View>
      ) : null}
      <Text style={styles.stimulusText}>A recent study investigated how the rise of remote work has influenced commuting patterns in major cities. The data collected from 5,000 employees across three metropolitan areas reveals significant changes in transportation usage.</Text>
      <View style={styles.bulletStack}>
        {['Public transit usage decreased by 34%.', 'Car usage during peak hours dropped by 21%.', 'Cycling and walking increased by 17%.'].map((item) => <Text key={item} style={styles.bulletText}>- {item}</Text>)}
      </View>
      <Text style={styles.linkText}>View Full {audio ? 'Lecture' : 'Reading'}</Text>
    </Card>
  );
}

export function MockTests({ user }: { user: AuthUser }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1080;
  const isTablet = width >= 760;
  const isPremium = user.plan === 'premium';

  const metrics: Metric[] = [
    { label: 'Full Tests', value: '12', sub: '8 completed', tone: 'purple', icon: documentSymbol, progress: 66 },
    { label: 'Mini Tests', value: '28', sub: '16 completed', tone: 'green', icon: grammarSymbol, progress: 57 },
    { label: 'Best Score', value: '105', sub: 'Mock Test 01', tone: 'yellow', icon: trophySymbol, progress: 88 },
    { label: 'Completion Rate', value: '66%', sub: '16 / 24 tests', tone: 'blue', icon: targetSymbol, progress: 66 },
  ];

  return (
    <View testID="mock-tests-screen" style={styles.screen}>
      <View style={[styles.pageTopLine, !isTablet ? styles.pageTopLineCompact : null]}>
        <PageTitle title="Mock Tests" subtitle="Simulate the real test experience and track your readiness." />
      </View>

      <View style={[styles.metricGrid, isTablet ? styles.metricGridTablet : null]}>
        {metrics.map((item) => <MetricCard key={item.label} item={item} />)}
      </View>

      <View style={[styles.filterLine, !isTablet ? styles.filterLineCompact : null]}>
        <View style={styles.segmented}>
          {['All Tests', 'Full Tests', 'Section Tests', 'Mini Tests'].map((item, index) => (
            <View key={item} style={[styles.segmentItem, index === 0 ? styles.segmentItemActive : null]}>
              <Text style={[styles.segmentText, index === 0 ? styles.segmentTextActive : null]}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={styles.filterActions}>
          <ToolbarButton icon={filterSymbol} label="Filters" />
          <ToolbarButton icon={searchSymbol} label="Search tests..." />
        </View>
      </View>

      <View style={[styles.twoColumnGrid, isWide ? styles.twoColumnGridWide : null]}>
        <Card style={styles.featuredTestCard} contentStyle={styles.featuredTestBody}>
          <View style={styles.featuredLeft}>
            <MiniBadge label="FEATURED" tone="navy" />
            <Text style={styles.featuredTitle}>Mock Test 02</Text>
            <Text style={styles.featuredMeta}>Full Test - 4 Sections</Text>
            <View style={styles.inlineMetaWrap}>
              <Text style={styles.lightMeta}>120 min</Text>
              <Text style={styles.lightMeta}>100 Questions</Text>
              <Text style={styles.lightMeta}>Moderate</Text>
            </View>
            <Text style={styles.featuredText}>Experience a real TOEFL iBT test with section timing and scoring.</Text>
            <View style={styles.featuredActions}>
              <Button label="Review Test" size="sm" variant="secondary" right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.tinyIcon} />} style={styles.compactButton} />
              <Button label="Test Details" size="sm" variant="ghost" style={styles.darkGhostButton} textStyle={styles.whiteButtonText} />
            </View>
          </View>
          <View style={styles.featuredScoreBox}>
            <Text style={styles.featuredScoreLabel}>YOUR RECENT SCORE</Text>
            <Text style={styles.featuredScore}>94<Text style={styles.featuredScoreMax}>/120</Text></Text>
            <Text style={styles.excellentText}>Excellent</Text>
            <Progress value={78} color={studentTokens.yellow} />
            <Text style={styles.lightMeta}>Attempted on May 28, 2025</Text>
          </View>
        </Card>

        <Card style={styles.sideCard} contentStyle={styles.sideBody}>
          <Text style={styles.orangeLabel}>FOCUS WHERE IT MATTERS</Text>
          <Text style={styles.criteriaText}>Based on your performance, focus on your weakest skill to improve your overall score.</Text>
          <View style={styles.weakSkillBox}>
            <IconBubble icon={micSymbol} tone="orange" size={34} />
            <View style={styles.weakCopy}>
              <Text style={styles.criteriaTitle}>Speaking</Text>
              <Text style={styles.criteriaText}>Practice Accuracy /100</Text>
            </View>
            <Text style={styles.weakScore}>61<Text style={styles.weakScoreMax}>/100</Text></Text>
          </View>
          <View style={styles.suggestedTestBox}>
            <MiniBadge label={isPremium ? 'Unlocked' : 'Premium'} tone={isPremium ? 'green' : 'yellow'} />
            <Text style={styles.suggestedTitle}>Speaking Section Test 03</Text>
            <Text style={styles.criteriaText}>15 questions - 20 min - Easy</Text>
          </View>
          <Button label="Start Suggested Test" size="sm" variant="ghost" right={<SymbolView name={arrowSymbol} tintColor="#ffffff" size={13} style={styles.tinyIcon} />} style={styles.navyButton} textStyle={styles.whiteButtonText} />
        </Card>
      </View>

      <Card style={styles.practicePanel} contentStyle={styles.testListBody}>
        <View style={styles.testTableHead}>
          {['TEST', 'DURATION', 'QUESTIONS', 'DIFFICULTY', 'SCORE', 'LAST ATTEMPT', 'ACTION'].map((item) => <Text key={item} style={styles.testHeadText}>{item}</Text>)}
        </View>
        {mockRows.map((item) => <TestRowItem key={item.id} item={item} isLocked={item.access === 'Premium' && !isPremium} />)}
        <View style={styles.paginationRow}>
          <Text style={styles.paginationText}>Showing 1-5 of 24 tests</Text>
          <View style={styles.pageButtons}>
            {['<', '1', '2', '3', '...', '5', '>'].map((page, index) => (
              <View key={`${page}-${index}`} style={[styles.pageButton, page === '1' ? styles.pageButtonActive : null]}>
                <Text style={[styles.pageButtonText, page === '1' ? styles.pageButtonTextActive : null]}>{page}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </View>
  );
}

function TestRowItem({ item, isLocked }: { item: TestRow; isLocked: boolean }) {
  const darkAction = item.action.includes('Start') || item.action.includes('Resume');

  return (
    <View style={styles.testRow}>
      <View style={styles.testNameCell}>
        <View style={[styles.testIdBadge, { backgroundColor: toneSoft[item.tone] }]}>
          <Text style={[styles.testIdText, { color: toneColor[item.tone] }]}>{item.id}</Text>
        </View>
        <View style={styles.testNameCopy}>
          <Text style={styles.testName}>{item.name}</Text>
          <Text style={styles.testType}>{item.type}</Text>
        </View>
      </View>
      <Text style={styles.testCell}>{item.duration}</Text>
      <Text style={styles.testCell}>{item.questions}</Text>
      <MiniBadge label={item.difficulty} tone={item.difficulty === 'Easy' ? 'green' : 'blue'} />
      <Text style={[styles.testScore, item.score.startsWith('-') ? styles.mutedScore : null]}>{item.score}</Text>
      <Text style={styles.testCell}>{item.date}</Text>
      <Button label={isLocked ? 'Unlock' : item.action} size="sm" variant={darkAction && !isLocked ? 'ghost' : 'secondary'} left={isLocked ? <SymbolView name={lockSymbol} tintColor={studentTokens.navy} size={12} style={styles.tinyIcon} /> : undefined} right={!isLocked ? <SymbolView name={arrowSymbol} tintColor={darkAction ? '#ffffff' : studentTokens.navy} size={12} style={styles.tinyIcon} /> : undefined} style={[styles.tableButton, darkAction && !isLocked ? styles.navyButton : null, isLocked ? styles.lockButton : null]} textStyle={darkAction && !isLocked ? styles.whiteButtonText : undefined} />
      <SymbolView name={moreSymbol} tintColor={studentTokens.navy} size={15} style={styles.tinyIcon} />
    </View>
  );
}

export function MyProgress({ user }: { user?: Pick<AuthUser, 'id' | 'plan' | 'goal'> }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1080;
  const isTablet = width >= 760;

  return (
    <View testID="my-progress-screen" style={styles.screen}>
      <View style={[styles.pageTopLine, !isTablet ? styles.pageTopLineCompact : null]}>
        <PageTitle title="My Progress" subtitle="Track your growth and stay on target." />
        <View style={styles.headerActions}>
          <ToolbarButton icon={calendarSymbol} label="May 01 - May 30, 2025" />
          <View style={styles.segmented}>
            {['7D', '30D', '90D', 'All Time'].map((item) => <View key={item} style={[styles.segmentItem, item === '30D' ? styles.segmentItemActive : null]}><Text style={[styles.segmentText, item === '30D' ? styles.segmentTextActive : null]}>{item}</Text></View>)}
          </View>
          <ToolbarButton icon={uploadSymbol} label="Export" />
        </View>
      </View>

      <View style={[styles.metricGrid, isTablet ? styles.metricGridTablet : null]}>
        {progressMetrics.map((item) => <MetricCard key={item.label} item={item} />)}
      </View>

      <View style={[styles.progressGrid, isWide ? styles.progressGridWide : null]}>
        <Card style={styles.practicePanel} contentStyle={styles.chartCardBody}>
          <SectionHeader title="SCORE TREND" right={<View style={styles.legendRow}><View style={styles.legendDotBlue} /><Text style={styles.legendText}>Estimated Score</Text><View style={styles.legendDashOrange} /><Text style={styles.legendText}>Target Score</Text></View>} />
          <ScoreTrendChart />
        </Card>

        <Card style={styles.sideCard} contentStyle={styles.targetGapBody}>
          <Text style={styles.orangeLabel}>TARGET GAP</Text>
          <View style={styles.gapTop}>
            <View>
              <Text style={styles.gapNumber}>18</Text>
              <Text style={styles.gapText}>points to go</Text>
              <Text style={styles.excellentText}>You are on track!</Text>
            </View>
            <View style={styles.targetGraphic}>
              <View style={styles.targetRingOuter}><View style={styles.targetRingMid}><View style={styles.targetRingInner} /></View></View>
              <SymbolView name={targetSymbol} tintColor={studentTokens.yellowDeep} size={34} style={styles.targetGraphicIcon} />
            </View>
          </View>
          <Progress value={82} color={studentTokens.yellow} />
          <View style={styles.scoreLabels}>
            <Text style={styles.scoreLabel}>87 Current Score</Text>
            <Text style={styles.scoreLabel}>105 Target Score</Text>
          </View>
          <Button label="Review Study Plan" size="sm" variant="secondary" right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.tinyIcon} />} style={styles.fullButton} />
        </Card>
      </View>

      <View style={[styles.progressGrid, isWide ? styles.progressGridWide : null]}>
        <Card style={styles.practicePanel} contentStyle={styles.practicePanelBody}>
          <Text style={styles.orangeLabel}>SKILL PERFORMANCE</Text>
          <View style={styles.skillGrid}>
            {skillMastery.map((skill) => (
              <View key={skill.label} style={styles.skillBox}>
                <View style={styles.skillBoxHead}>
                  <IconBubble icon={skill.icon} tone={skill.tone} size={36} />
                  <View>
                    <Text style={styles.criteriaTitle}>{skill.label}</Text>
                    <Text style={styles.skillScore}>{skill.score}</Text>
                  </View>
                </View>
                <MiniLineChart tone={skill.tone} />
                <Text style={styles.skillMasteryText}>Skill Mastery /100: {skill.value}</Text>
                <Button label={`Practice ${skill.label}`} size="sm" variant="secondary" right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={12} style={styles.tinyIcon} />} style={styles.fullButton} />
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.sideCard} contentStyle={styles.sideBody}>
          <Text style={styles.orangeLabel}>STUDY CONSISTENCY</Text>
          <View style={styles.weekLabels}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <Text key={day} style={styles.weekLabel}>{day}</Text>)}
          </View>
          <Heatmap />
          <View style={styles.heatLegend}>
            <Text style={styles.legendText}>Less</Text>
            {[1, 2, 3, 4].map((level) => <View key={level} style={[styles.heatCellSmall, { backgroundColor: `rgba(0, 125, 115, ${0.18 + level * 0.17})` }]} />)}
            <Text style={styles.legendText}>More</Text>
            <View style={styles.heatEmptySmall} />
            <Text style={styles.legendText}>No activity</Text>
          </View>
        </Card>
      </View>

      <View style={[styles.bottomCards, isTablet ? styles.bottomCardsWide : null]}>
        <Card style={styles.practicePanel} contentStyle={styles.milestoneBody}>
          <Text style={styles.orangeLabel}>STREAK & MILESTONES</Text>
          <View style={styles.milestoneGrid}>
            {[
              { title: '7 Day Streak', sub: 'Keep it going!', icon: flameSymbol, tone: 'yellow' as Tone },
              { title: '20 Lessons', sub: 'Milestone', icon: checkCircleSymbol, tone: 'green' as Tone },
              { title: '10 Mock Tests', sub: 'Completed', icon: trophySymbol, tone: 'purple' as Tone },
              { title: '5 Skills Improved', sub: 'This Month', icon: chartSymbol, tone: 'orange' as Tone },
            ].map((item) => (
              <View key={item.title} style={styles.milestoneItem}>
                <IconBubble icon={item.icon} tone={item.tone} size={38} />
                <Text style={styles.criteriaTitle}>{item.title}</Text>
                <Text style={styles.criteriaText}>{item.sub}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.practicePanel} contentStyle={styles.recommendBody}>
          <Text style={styles.orangeLabel}>RECOMMENDATIONS</Text>
          <ProgressRecommendationList user={user} context="progress" limit={3} dense />
        </Card>
        <Card style={styles.practicePanel} contentStyle={styles.recommendBody}>
          <Text style={styles.orangeLabel}>NEXT ACTIONS</Text>
          {[
            { title: 'Practice Speaking - Part 2', sub: 'Recommended for you', icon: micSymbol, tone: 'purple' as Tone },
            { title: 'Writing Task 1 - Feedback', sub: 'Review your writing', icon: writingSymbol, tone: 'orange' as Tone },
            { title: 'Take a Listening Quiz', sub: '15 min practice', icon: headphonesSymbol, tone: 'green' as Tone },
          ].map((item) => (
            <View key={item.title} style={styles.actionRow}>
              <IconBubble icon={item.icon} tone={item.tone} size={31} />
              <View style={styles.actionCopy}>
                <Text style={styles.criteriaTitle}>{item.title}</Text>
                <Text style={styles.criteriaText}>{item.sub}</Text>
              </View>
              <SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.tinyIcon} />
            </View>
          ))}
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 10 },
  pressed: { opacity: 0.72 },
  pageTopLine: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  pageTopLineCompact: { flexDirection: 'column', alignItems: 'stretch' },
  pageHead: { flexShrink: 1 },
  pageCopy: { minWidth: 0 },
  pageTitle: { color: studentTokens.ink, fontFamily, fontSize: 22, fontWeight: '700', lineHeight: 28 },
  pageSubtitle: { color: studentTokens.text, fontFamily, fontSize: 11, fontWeight: '600', lineHeight: 15, marginTop: 2 },
  headingWithPill: { flex: 1, minWidth: 0, gap: 7 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 9 },
  backLink: { alignSelf: 'flex-start', minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: '#5f6980', fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 14 },
  quoteCard: { width: 258, minHeight: 50, borderRadius: 9, borderWidth: 1, borderColor: '#ffe2a2', backgroundColor: '#fffaf0', paddingHorizontal: 14, paddingVertical: 8, flexShrink: 0 },
  quoteMark: { position: 'absolute', left: 10, top: 1, color: studentTokens.yellowDeep, fontFamily, fontSize: 25, fontWeight: '700', lineHeight: 28 },
  quoteText: { color: '#31405c', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 13, paddingLeft: 20 },
  quoteAuthor: { color: studentTokens.text, fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11, marginTop: 2, textAlign: 'right' },
  tinyIcon: { width: 14, height: 14 },
  mediumIcon: { width: 30, height: 30 },
  bigIcon: { width: 42, height: 42 },
  symbolFill: { flexShrink: 0 },
  iconBubble: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  metricGrid: { gap: 10 },
  metricGridTablet: { flexDirection: 'row', flexWrap: 'wrap' },
  metricCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 }, minWidth: 0 },
  metricCardTablet: { flexGrow: 1, flexBasis: 210, minWidth: 190 },
  metricCardMobile: { width: '100%', flexGrow: 0 },
  metricBody: { padding: 12, gap: 10 },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  metricCopy: { flex: 1, minWidth: 0 },
  metricLabel: { color: '#4f5870', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  metricValue: { color: studentTokens.navy, fontFamily, fontSize: 19, fontWeight: '700', lineHeight: 24, marginTop: 2 },
  metricSub: { color: '#6e778b', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11, marginTop: 2 },
  practicePanel: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  practicePanelBody: { padding: 14, gap: 11 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: studentTokens.ink, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16, textTransform: 'uppercase' },
  orangeLabel: { color: studentTokens.orange, fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 13 },
  promptBody: { gap: 6 },
  promptQuestion: { color: studentTokens.ink, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  promptText: { color: '#31405c', fontFamily, fontSize: 11, fontWeight: '700', lineHeight: 16 },
  checkList: { gap: 7 },
  checkListTitle: { color: studentTokens.navy, fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  checkText: { color: '#42506b', flex: 1, fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 15 },
  timerStackRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  timerBox: { minWidth: 128, minHeight: 58, borderRadius: 9, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.neutral, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  timerLabel: { color: '#4f5870', fontFamily, fontSize: 7, fontWeight: '700', lineHeight: 10 },
  timerValue: { color: studentTokens.navy, fontFamily, fontSize: 16, fontWeight: '700', lineHeight: 20, marginTop: 2 },
  twoColumnGrid: { gap: 12 },
  twoColumnGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  mainColumn: { flex: 1, minWidth: 0, gap: 10 },
  sideColumn: { width: 290, maxWidth: '100%', gap: 10, flexShrink: 0 },
  sideColumnStacked: { width: '100%' },
  sideCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  sideBody: { padding: 13, gap: 11 },
  recorderCard: { padding: 0, borderRadius: 11, borderColor: '#061f55', backgroundColor: '#001b48', overflow: 'hidden', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  recorderBody: { padding: 14, gap: 12 },
  recorderBodyCompact: { padding: 13, gap: 11 },
  recorderLabelWrap: { paddingHorizontal: 1 },
  recorderStage: { minHeight: 120, flexDirection: 'row', alignItems: 'center', gap: 16 },
  recorderStageCompact: { minHeight: 0, flexDirection: 'column', alignItems: 'center', gap: 10 },
  navigatorRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  navigatorItem: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#e2e7f0', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  navigatorAnswered: { borderColor: '#c7eadf', backgroundColor: '#effbf6' },
  navigatorActive: { borderColor: studentTokens.navy, backgroundColor: studentTokens.navy },
  navigatorText: { color: '#5f6980', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 12 },
  navigatorTextActive: { color: '#ffffff' },
  waveform: { flex: 1, minWidth: 0, minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  waveformCompact: { alignSelf: 'stretch', flex: 0, minHeight: 58, overflow: 'hidden' },
  waveBar: { width: 3, borderRadius: 999, opacity: 0.92 },
  micRing: { width: 116, height: 116, borderRadius: 58, borderWidth: 8, borderColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', flexShrink: 0 },
  micRingCompact: { width: 92, height: 92, borderRadius: 46, borderWidth: 6 },
  micCircle: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  micCircleCompact: { width: 64, height: 64, borderRadius: 32 },
  elapsedBox: { flex: 0.9, minWidth: 180, gap: 8 },
  elapsedBoxCompact: { alignSelf: 'stretch', minWidth: 0, flex: 0 },
  elapsedLabel: { color: '#b6c4e2', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  elapsedValue: { color: '#ffffff', fontFamily, fontSize: 21, fontWeight: '700', lineHeight: 26 },
  elapsedMax: { color: '#c9d4ee', fontFamily, fontSize: 11, fontWeight: '700' },
  readyHint: { borderRadius: 8, backgroundColor: 'rgba(0,125,115,0.55)', paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  readyText: { color: '#e9fff8', flex: 1, fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 15 },
  recorderActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recorderActionsCompact: { flexDirection: 'column', alignItems: 'stretch' },
  equalButton: { flexGrow: 1, minWidth: 96, minHeight: 38, borderRadius: 7 },
  darkGhostButton: { flexGrow: 1, minWidth: 96, minHeight: 38, borderRadius: 7, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.05)' },
  disabledDarkButton: { flexGrow: 1, minWidth: 96, minHeight: 38, borderRadius: 7, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.03)' },
  whiteButtonText: { color: '#ffffff', fontFamily },
  disabledDarkButtonText: { color: '#9fb4dc', fontFamily },
  attemptTable: { gap: 0, borderTopWidth: 1, borderTopColor: '#eef1f6' },
  tableHead: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  tableHeadText: { flex: 1, color: '#6e778b', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  tableRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  tableText: { flex: 1, color: '#42506b', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  miniBadge: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  miniBadgeText: { fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 10 },
  mobileAttemptList: { gap: 8, borderTopWidth: 1, borderTopColor: '#eef1f6', paddingTop: 10 },
  mobileAttemptCard: { borderRadius: 9, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: '#fbfcff', padding: 10, gap: 9 },
  mobileAttemptTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  mobileAttemptMeta: { flex: 1, minWidth: 0 },
  mobileAttemptTitle: { color: studentTokens.ink, fontFamily, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  mobileAttemptDate: { color: '#526078', fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 14, marginTop: 2 },
  mobileAttemptScores: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  centerButton: { alignSelf: 'center', minWidth: 240, borderRadius: 7 },
  fullButton: { width: '100%', borderRadius: 7, minHeight: 34 },
  compactButton: { minHeight: 34, borderRadius: 7 },
  criteriaRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6', paddingBottom: 9 },
  criteriaCopy: { flex: 1, minWidth: 0 },
  criteriaTitle: { color: studentTokens.ink, fontFamily, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  criteriaText: { color: '#42506b', fontFamily, fontSize: 10, fontWeight: '600', lineHeight: 15, marginTop: 2 },
  criteriaScore: { color: '#526078', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 12, flexShrink: 0 },
  beforeCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', overflow: 'hidden', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  beforeBody: { minHeight: 128, padding: 13, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  beforeCopy: { flex: 1, gap: 6, minWidth: 0 },
  beforeImage: { width: 116, height: 108, flexShrink: 0 },
  summaryBody: { padding: 13, gap: 12 },
  summaryScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  scoreRing: { width: 82, height: 82, borderRadius: 41, borderWidth: 7, borderColor: toneColor.green, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  scoreRingValue: { color: toneColor.green, fontFamily, fontSize: 24, fontWeight: '700', lineHeight: 28 },
  scoreRingLabel: { color: '#6e778b', fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 12 },
  summaryCopy: { flex: 1, minWidth: 0, gap: 4 },
  summaryUp: { color: toneColor.green, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  summaryText: { color: '#42506b', fontFamily, fontSize: 9, fontWeight: '600', lineHeight: 14 },
  toolbarButton: { minHeight: 34, borderRadius: 8, borderWidth: 1, borderColor: '#e1e6ee', backgroundColor: studentTokens.surface, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  toolbarButtonText: { color: studentTokens.navy, fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 14 },
  toolbarCard: { padding: 0, borderRadius: 10, borderColor: '#e5eaf2', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  statusBar: { minHeight: 43, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  statusItem: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 7, borderRightWidth: 1, borderRightColor: '#eef1f6', paddingRight: 16 },
  statusText: { color: toneColor.green, fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 13 },
  statusLabel: { color: '#6e778b', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  statusValue: { color: studentTokens.ink, fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 14 },
  writingGrid: { gap: 10 },
  writingGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  stimulusColumn: { width: 230, maxWidth: '100%', gap: 10, flexShrink: 0 },
  stimulusColumnStacked: { width: '100%', maxWidth: '100%' },
  stimulusTitle: { color: studentTokens.ink, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  stimulusText: { color: '#31405c', fontFamily, fontSize: 10, fontWeight: '600', lineHeight: 15 },
  bulletStack: { gap: 3 },
  bulletText: { color: '#42506b', fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 15 },
  linkText: { color: studentTokens.blue, fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 14 },
  audioMini: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 8 },
  audioMiniTrack: { flex: 1, height: 4, borderRadius: 99, backgroundColor: '#e8ecf2', overflow: 'hidden' },
  audioMiniFill: { width: '44%', height: '100%', backgroundColor: toneColor.green, borderRadius: 99 },
  audioMiniText: { color: '#6e778b', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 12 },
  editorCard: { flex: 1, minWidth: 0, padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  editorBody: { padding: 14, gap: 10 },
  wordCounter: { color: '#6e778b', fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 13 },
  editorToolbar: { minHeight: 31, borderRadius: 7, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: studentTokens.neutral, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingHorizontal: 10 },
  editorTool: { color: '#42506b', fontFamily, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  responsePaper: { minHeight: 356, borderRadius: 8, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: '#ffffff', padding: 14, gap: 11 },
  responseText: { color: '#21304d', fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  editorFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  editorAction: { flex: 1, minWidth: 170, borderRadius: 7 },
  navyButton: { backgroundColor: '#001b48', borderColor: '#001b48' },
  editorHint: { color: '#6e778b', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 12, textAlign: 'center' },
  rubricRow: { flexDirection: 'row', gap: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  rubricCopy: { flex: 1, minWidth: 0, gap: 7 },
  rubricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rubricScore: { color: toneColor.green, fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 14 },
  tipCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', backgroundColor: '#fbfcff', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  feedbackBox: { flexDirection: 'row', gap: 10, borderRadius: 9, backgroundColor: '#f7f9ff', padding: 10 },
  feedbackCopy: { flex: 1, minWidth: 0 },
  tipsStrip: { padding: 13, gap: 11, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  tipItem: { flexGrow: 1, flexBasis: 230, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipItemCopy: { flex: 1, minWidth: 0 },
  filterLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  filterLineCompact: { flexDirection: 'column', alignItems: 'stretch' },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, borderRadius: 10, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.neutral, padding: 4 },
  segmentItem: { minHeight: 27, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  segmentItemActive: { backgroundColor: '#001b48' },
  segmentText: { color: '#42506b', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 12 },
  segmentTextActive: { color: '#ffffff' },
  filterActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featuredTestCard: { flex: 1, minWidth: 0, padding: 0, borderRadius: 11, borderColor: '#061f55', backgroundColor: '#001b48', overflow: 'hidden', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  featuredTestBody: { minHeight: 184, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18 },
  featuredLeft: { flex: 1, minWidth: 0, gap: 8 },
  featuredTitle: { color: '#ffffff', fontFamily, fontSize: 22, fontWeight: '700', lineHeight: 28 },
  featuredMeta: { color: '#d8e3ff', fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 14 },
  inlineMetaWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 13 },
  lightMeta: { color: '#d8e3ff', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 13 },
  featuredText: { color: '#d8e3ff', fontFamily, fontSize: 10, fontWeight: '600', lineHeight: 15 },
  featuredActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 },
  featuredScoreBox: { width: 220, maxWidth: '100%', gap: 8 },
  featuredScoreLabel: { color: '#d8e3ff', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  featuredScore: { color: '#ffffff', fontFamily, fontSize: 35, fontWeight: '700', lineHeight: 41 },
  featuredScoreMax: { color: '#d8e3ff', fontFamily, fontSize: 16, fontWeight: '700' },
  excellentText: { color: toneColor.green, fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 14 },
  weakSkillBox: { minHeight: 56, borderRadius: 9, backgroundColor: studentTokens.neutral, borderWidth: 1, borderColor: '#eef1f6', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  weakCopy: { flex: 1, minWidth: 0 },
  weakScore: { color: studentTokens.orange, fontFamily, fontSize: 19, fontWeight: '700', lineHeight: 24 },
  weakScoreMax: { color: '#6e778b', fontFamily, fontSize: 9, fontWeight: '700' },
  suggestedTestBox: { borderRadius: 9, backgroundColor: '#f8fbff', borderWidth: 1, borderColor: '#eef1f6', padding: 10, gap: 5 },
  suggestedTitle: { color: studentTokens.ink, fontFamily, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  testListBody: { padding: 0 },
  testTableHead: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  testHeadText: { flex: 1, color: '#8790a4', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  testRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  testNameCell: { flex: 1.7, minWidth: 170, flexDirection: 'row', alignItems: 'center', gap: 10 },
  testIdBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  testIdText: { fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 14 },
  testNameCopy: { flex: 1, minWidth: 0 },
  testName: { color: studentTokens.ink, fontFamily, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  testType: { color: '#6e778b', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  testCell: { flex: 1, color: '#42506b', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 13 },
  testScore: { flex: 1, color: toneColor.green, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  mutedScore: { color: '#6e778b' },
  tableButton: { minWidth: 96, minHeight: 32, borderRadius: 7 },
  lockButton: { backgroundColor: studentTokens.yellow, borderColor: studentTokens.yellow },
  paginationRow: { minHeight: 50, paddingHorizontal: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  paginationText: { color: '#6e778b', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 13 },
  pageButtons: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  pageButton: { width: 28, height: 28, borderRadius: 7, borderWidth: 1, borderColor: '#e5eaf2', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  pageButtonActive: { backgroundColor: '#001b48', borderColor: '#001b48' },
  pageButtonText: { color: '#42506b', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 12 },
  pageButtonTextActive: { color: '#ffffff' },
  progressGrid: { gap: 10 },
  progressGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  chartCardBody: { minHeight: 232, padding: 14, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  legendDotBlue: { width: 16, height: 2, borderRadius: 999, backgroundColor: studentTokens.blue },
  legendDashOrange: { width: 16, height: 2, borderRadius: 999, backgroundColor: studentTokens.orange },
  legendText: { color: '#6e778b', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  trendChart: { minHeight: 172, flexDirection: 'row', gap: 8 },
  trendAxis: { width: 24, justifyContent: 'space-between', paddingBottom: 20 },
  axisText: { color: '#8490a5', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 10, textAlign: 'right' },
  trendPlot: { position: 'relative', flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#edf1f6', paddingLeft: 8, paddingTop: 8 },
  targetLine: { position: 'absolute', left: 8, right: 0, top: 34, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: `${studentTokens.orange}80` },
  trendColumn: { flex: 1, minWidth: 0, alignItems: 'center', gap: 6 },
  trendColumnInner: { position: 'relative', height: 136, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  trendFill: { width: '56%', maxWidth: 34, minWidth: 9, borderRadius: 999, backgroundColor: '#eaf0ff' },
  trendDot: { position: 'absolute', width: 9, height: 9, borderRadius: 5, backgroundColor: studentTokens.blue, borderWidth: 2, borderColor: '#ffffff' },
  trendDotLast: { width: 22, height: 18, borderRadius: 5, backgroundColor: '#001b48', alignItems: 'center', justifyContent: 'center' },
  trendDotText: { color: '#ffffff', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 10 },
  chartLabel: { color: '#6e778b', fontFamily, fontSize: 8, fontWeight: '600', lineHeight: 11, textAlign: 'center' },
  targetGapBody: { padding: 13, gap: 10 },
  gapTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  gapNumber: { color: studentTokens.navy, fontFamily, fontSize: 30, fontWeight: '700', lineHeight: 36 },
  gapText: { color: studentTokens.ink, fontFamily, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  targetGraphic: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  targetRingOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 8, borderColor: '#e3e6ee', alignItems: 'center', justifyContent: 'center' },
  targetRingMid: { width: 48, height: 48, borderRadius: 24, borderWidth: 6, borderColor: '#cfd5df', alignItems: 'center', justifyContent: 'center' },
  targetRingInner: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#9aa3b5' },
  targetGraphicIcon: { position: 'absolute', width: 34, height: 34, right: 12, top: 10 },
  scoreLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  scoreLabel: { color: '#6e778b', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skillBox: { flexGrow: 1, flexBasis: 150, minWidth: 146, borderRadius: 10, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: '#ffffff', padding: 10, gap: 8 },
  skillBoxHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  skillScore: { color: studentTokens.navy, fontFamily, fontSize: 15, fontWeight: '700', lineHeight: 19 },
  miniLineChart: { height: 58, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  miniPointColumn: { flex: 1, minWidth: 0, height: 54, justifyContent: 'flex-end', alignItems: 'center' },
  miniPointBar: { width: '70%', borderRadius: 999 },
  miniPointDot: { width: 6, height: 6, borderRadius: 3, marginTop: -3, borderWidth: 1, borderColor: '#ffffff' },
  skillMasteryText: { color: toneColor.teal, fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  weekLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 2 },
  weekLabel: { color: '#6e778b', fontFamily, fontSize: 8, fontWeight: '700', lineHeight: 11 },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  heatCell: { width: 14, height: 14, borderRadius: 3 },
  heatEmpty: { backgroundColor: '#edf1f6' },
  heatLegend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  heatCellSmall: { width: 10, height: 10, borderRadius: 2 },
  heatEmptySmall: { width: 10, height: 10, borderRadius: 2, backgroundColor: '#edf1f6', marginLeft: 8 },
  bottomCards: { gap: 10 },
  bottomCardsWide: { flexDirection: 'row', alignItems: 'stretch' },
  milestoneBody: { padding: 13, gap: 10 },
  milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  milestoneItem: { flexGrow: 1, flexBasis: 108, minWidth: 106, alignItems: 'center', gap: 5, borderRadius: 9, borderWidth: 1, borderColor: '#eef1f6', padding: 10 },
  recommendBody: { padding: 13, gap: 10 },
  recommendRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  actionRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: '#eef1f6', paddingBottom: 7 },
  actionCopy: { flex: 1, minWidth: 0 },
});



