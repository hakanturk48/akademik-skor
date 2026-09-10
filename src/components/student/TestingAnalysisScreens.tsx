import type { ReactNode } from 'react';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button, Card, Progress, studentTokens } from '@/components/student/ui';

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };
type Tone = 'blue' | 'teal' | 'orange' | 'purple' | 'yellow' | 'navy' | 'green';

type Metric = { label: string; value: string; sub: string; tone: Tone; icon: AppSymbolName; progress: number };
type MiniTestRow = { name: string; meta: string; skill: string; skillTone: Tone; time: string; questions: string; access: string; accessTone: Tone; latest: string; action: string; dark?: boolean };
type AnalysisRow = { label: string; detail?: string; values: string[]; tone?: Tone };

const fontFamily = 'Quicksand';
const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });

const arrowSymbol = symbolName('chevron.right', 'chevron_right');
const chartSymbol = symbolName('chart.line.uptrend.xyaxis', 'show_chart');
const targetSymbol = symbolName('target', 'track_changes');
const timerSymbol = symbolName('timer', 'timer');
const checkSymbol = symbolName('checkmark', 'check');
const starSymbol = symbolName('star.fill', 'star');
const bookSymbol = symbolName('book', 'menu_book');
const headphonesSymbol = symbolName('headphones', 'headphones');
const micSymbol = symbolName('mic', 'mic');
const writingSymbol = symbolName('square.and.pencil', 'edit_square');
const searchSymbol = symbolName('magnifyingglass', 'search');
const calendarSymbol = symbolName('calendar', 'calendar_month');
const exportSymbol = symbolName('square.and.arrow.up', 'file_upload');
const pauseSymbol = symbolName('pause.fill', 'pause');
const documentSymbol = symbolName('doc.text', 'description');
const sigmaSymbol = symbolName('sum', 'functions');

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

const miniMetrics: Metric[] = [
  { label: 'Available', value: '36', sub: 'Across 6 skill areas', tone: 'navy', icon: documentSymbol, progress: 74 },
  { label: 'Completed', value: '19', sub: 'This month: 7', tone: 'blue', icon: checkSymbol, progress: 54 },
  { label: 'Best Accuracy', value: '92%', sub: 'Vocabulary - Set 08', tone: 'yellow', icon: starSymbol, progress: 92 },
  { label: 'Avg. Time', value: '11m 24s', sub: 'Per mini test', tone: 'teal', icon: timerSymbol, progress: 68 },
];

const miniRows: MiniTestRow[] = [
  { name: 'Main Idea Sprint 04', meta: 'Reading - B2', skill: 'Reading', skillTone: 'blue', time: '10 min', questions: '8', access: 'Free', accessTone: 'green', latest: '88%', action: 'Review' },
  { name: 'Lecture Detail Check 03', meta: 'Listening - B2', skill: 'Listening', skillTone: 'teal', time: '12 min', questions: '10', access: 'Premium', accessTone: 'yellow', latest: '72%', action: 'Retake', dark: true },
  { name: 'Academic Collocations 08', meta: 'Vocabulary - C1', skill: 'Vocabulary', skillTone: 'orange', time: '8 min', questions: '12', access: 'Free', accessTone: 'green', latest: '92%', action: 'Review' },
  { name: 'Sentence Control 05', meta: 'Grammar - C1', skill: 'Grammar', skillTone: 'purple', time: '15 min', questions: '12', access: 'Premium', accessTone: 'yellow', latest: '-', action: 'Start', dark: true },
  { name: 'Speaking Organization Drill', meta: 'Speaking - Task 1', skill: 'Speaking', skillTone: 'purple', time: '10 min', questions: '3 prompts', access: 'Premium', accessTone: 'yellow', latest: '20/30', action: 'Review' },
];

const resultMetrics: Metric[] = [
  { label: 'Overall Score', value: '94 /120', sub: 'Estimated TOEFL score', tone: 'navy', icon: starSymbol, progress: 78 },
  { label: 'Reading', value: '24 /30', sub: '+2 vs previous test', tone: 'blue', icon: bookSymbol, progress: 80 },
  { label: 'Listening', value: '22 /30', sub: 'Stable', tone: 'teal', icon: headphonesSymbol, progress: 73 },
  { label: 'Speaking', value: '23 /30', sub: '+3 vs previous test', tone: 'purple', icon: micSymbol, progress: 77 },
];

const scoreMetrics: Metric[] = [
  { label: 'Estimated TOEFL', value: '87 /120', sub: '+6 in 30 days', tone: 'blue', icon: chartSymbol, progress: 72 },
  { label: 'Target Score', value: '105 /120', sub: '18 points to go', tone: 'orange', icon: targetSymbol, progress: 88 },
  { label: 'Full Mocks', value: '8', sub: 'Last: 94 /120', tone: 'navy', icon: timerSymbol, progress: 66 },
  { label: 'Score Stability', value: 'High', sub: '+/-3 points last 4 tests', tone: 'teal', icon: sigmaSymbol, progress: 86 },
];

const skillMetrics: Metric[] = [
  { label: 'Reading Mastery', value: '82 /100', sub: 'Strongest: Main Idea', tone: 'blue', icon: bookSymbol, progress: 82 },
  { label: 'Listening Mastery', value: '74 /100', sub: 'Weakest: Detail', tone: 'teal', icon: headphonesSymbol, progress: 74 },
  { label: 'Speaking Mastery', value: '61 /100', sub: 'Focus: Fluency', tone: 'purple', icon: micSymbol, progress: 61 },
  { label: 'Writing Mastery', value: '68 /100', sub: 'Focus: Grammar', tone: 'orange', icon: writingSymbol, progress: 68 },
];

const skillRows: AnalysisRow[] = [
  { label: 'Main Idea', values: ['91%', '0:54', '+6%', 'Maintain'], tone: 'green' },
  { label: 'Vocabulary in Context', values: ['84%', '0:46', '+2%', 'Light review'], tone: 'green' },
  { label: 'Inference', values: ['63%', '1:32', '-4%', 'Priority practice'], tone: 'orange' },
  { label: "Author's Purpose", values: ['71%', '1:11', 'Stable', '2 sets this week'], tone: 'yellow' },
];

function PageHeader({ title, subtitle, right }: { title: string; subtitle: string; right?: ReactNode }) {
  const { width } = useWindowDimensions();
  const compact = width < 720;

  return (
    <View style={[styles.pageHeader, compact ? styles.pageHeaderCompact : null]}>
      <View style={styles.pageCopy}>
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.pageSubtitle}>{subtitle}</Text>
      </View>
      {right ? <View style={[styles.headerActions, compact ? styles.headerActionsCompact : null]}>{right}</View> : null}
    </View>
  );
}

function IconBubble({ icon, tone = 'blue', size = 38 }: { icon: AppSymbolName; tone?: Tone; size?: number }) {
  const iconSize = Math.round(size * 0.55);
  return (
    <View style={[styles.iconBubble, { width: size, height: size, borderRadius: Math.round(size / 3), backgroundColor: toneSoft[tone] }]}>
      <SymbolView name={icon} tintColor={toneColor[tone]} size={iconSize} style={[styles.symbolFill, { width: iconSize, height: iconSize }]} />
    </View>
  );
}

function MetricCard({ item, wide }: { item: Metric; wide: boolean }) {
  return (
    <Card style={[styles.metricCard, wide ? styles.metricCardWide : styles.metricCardStacked]} contentStyle={styles.metricBody}>
      <View style={styles.metricTop}>
        <IconBubble icon={item.icon} tone={item.tone} />
        <View style={styles.metricCopy}>
          <Text style={styles.metricLabel}>{item.label.toUpperCase()}</Text>
          <Text style={styles.metricValue}>{item.value}</Text>
          <Text style={styles.metricSub}>{item.sub}</Text>
        </View>
      </View>
      <Progress value={item.progress} color={item.tone === 'orange' ? studentTokens.orange : toneColor[item.tone]} />
    </Card>
  );
}

function MetricGrid({ items }: { items: Metric[] }) {
  const { width } = useWindowDimensions();
  const wide = width >= 720;

  return <View style={[styles.metricGrid, wide ? styles.metricGridWide : null]}>{items.map((item) => <MetricCard key={item.label} item={item} wide={wide} />)}</View>;
}

function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
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

function HeaderButton({ label, icon, dark = false }: { label: string; icon?: AppSymbolName; dark?: boolean }) {
  return (
    <Button
      label={label}
      size="sm"
      variant={dark ? 'ghost' : 'secondary'}
      left={icon ? <SymbolView name={icon} tintColor={dark ? '#ffffff' : studentTokens.navy} size={14} style={styles.tinyIcon} /> : undefined}
      style={[styles.headerButton, dark ? styles.navyButton : null]}
      textStyle={dark ? styles.whiteText : styles.headerButtonText}
    />
  );
}

function SearchBox({ placeholder }: { placeholder: string }) {
  return (
    <View style={styles.searchBox}>
      <SymbolView name={searchSymbol} tintColor="#8790a4" size={14} style={styles.tinyIcon} />
      <Text style={styles.searchText}>{placeholder}</Text>
    </View>
  );
}

function PillTabs({ items, active = 0 }: { items: string[]; active?: number }) {
  return (
    <View style={styles.pillTabs}>
      {items.map((item, index) => (
        <View key={item} style={[styles.pillTab, index === active ? styles.pillTabActive : null]}>
          <Text style={[styles.pillText, index === active ? styles.pillTextActive : null]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function MiniTestTable() {
  const { width } = useWindowDimensions();
  const compact = width < 780;

  if (compact) {
    return (
      <View style={styles.mobileList}>
        {miniRows.map((item) => (
          <View key={item.name} style={styles.mobileItem}>
            <View style={styles.mobileTopRow}>
              <View style={styles.mobileTitleGroup}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.meta}</Text>
              </View>
              <MiniBadge label={item.skill} tone={item.skillTone} />
            </View>
            <View style={styles.mobileMetaLine}>
              <Text style={styles.cellText}>{item.time}</Text>
              <Text style={styles.cellText}>{item.questions} questions</Text>
              <MiniBadge label={item.access} tone={item.accessTone} />
              <Text style={styles.latestText}>{item.latest}</Text>
            </View>
            <Button
              label={item.action}
              size="sm"
              variant={item.dark ? 'ghost' : 'secondary'}
              right={<SymbolView name={arrowSymbol} tintColor={item.dark ? '#ffffff' : studentTokens.navy} size={13} style={styles.tinyIcon} />}
              style={[styles.fullButton, item.dark ? styles.navyButton : null]}
              textStyle={item.dark ? styles.whiteText : undefined}
            />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.table}>
      <View style={styles.miniTableHead}>
        {['MINI TEST', 'SKILL', 'TIME', 'QUESTIONS', 'ACCESS', 'LATEST', ''].map((item) => <Text key={item || 'action'} style={styles.tableHeadText}>{item}</Text>)}
      </View>
      {miniRows.map((item) => (
        <View key={item.name} style={styles.miniTableRow}>
          <View style={styles.testNameCell}>
            <Text style={styles.rowTitle}>{item.name}</Text>
            <Text style={styles.rowSub}>{item.meta}</Text>
          </View>
          <MiniBadge label={item.skill} tone={item.skillTone} />
          <Text style={styles.cellText}>{item.time}</Text>
          <Text style={styles.cellText}>{item.questions}</Text>
          <MiniBadge label={item.access} tone={item.accessTone} />
          <Text style={styles.latestText}>{item.latest}</Text>
          <Button label={item.action} size="sm" variant={item.dark ? 'ghost' : 'secondary'} style={[styles.tableButton, item.dark ? styles.navyButton : null]} textStyle={item.dark ? styles.whiteText : undefined} />
        </View>
      ))}
    </View>
  );
}

function BarRow({ label, value, color = studentTokens.yellow, suffix = '%' }: { label: string; value: number; color?: string; suffix?: string }) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} /></View>
      <Text style={styles.barValue}>{value}{suffix}</Text>
    </View>
  );
}

function DashboardLineChart({ labels = ['May 01', 'May 08', 'May 15', 'May 22', 'May 30'], score = '87' }: { labels?: string[]; score?: string }) {
  return (
    <View style={styles.lineChart}>
      <View style={styles.chartAxis}>
        {[120, 100, 80, 60, 40, 20, 0].map((tick) => <Text key={tick} style={styles.axisText}>{tick}</Text>)}
      </View>
      <View style={styles.chartPlot}>
        <View style={styles.chartGridLineTop} />
        <View style={styles.targetDash} />
        <View style={styles.blueTrendLine} />
        <View style={styles.blueTrendLineSecond} />
        <View style={[styles.trendDot, styles.dotOne]} />
        <View style={[styles.trendDot, styles.dotTwo]} />
        <View style={[styles.trendDot, styles.dotThree]} />
        <View style={[styles.trendDot, styles.dotFour]} />
        <View style={[styles.trendDotLast, styles.dotLast]}><Text style={styles.dotLastText}>{score}</Text></View>
        <View style={styles.chartLabels}>
          {labels.map((label) => <Text key={label} style={styles.chartLabel}>{label}</Text>)}
        </View>
      </View>
    </View>
  );
}

function RingScore({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.ringWrap}>
      <View style={styles.ringOuter}>
        <View style={styles.ringArc} />
        <View style={styles.ringInner}><Text style={styles.ringValue}>{value}</Text></View>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );
}

function RightRail({ children }: { children: ReactNode }) {
  return <View style={styles.sideColumn}>{children}</View>;
}

export function MiniTestsPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 1040;
  const tablet = width >= 720;

  return (
    <View testID="mini-tests-screen" style={styles.screen}>
      <PageHeader title="Mini Tests" subtitle="Short, focused checks that build speed and accuracy without a full mock test." right={<HeaderButton label="Test History" />} />
      <MetricGrid items={miniMetrics} />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <View style={[styles.filterLine, !tablet ? styles.filterLineStack : null]}>
            <PillTabs items={['All', 'Reading', 'Listening', 'Speaking', 'Writing', 'Vocabulary', 'Grammar']} />
            <SearchBox placeholder="Search mini tests..." />
          </View>
          <Card style={styles.panelCard} contentStyle={styles.panelBody}><MiniTestTable /></Card>
        </View>
        <RightRail>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>RECOMMENDED FOR YOU</Text>
            <Text style={styles.sideTitle}>Inference Questions - Reading</Text>
            <Text style={styles.sideText}>Your accuracy on inference questions is 63%, below your Reading average.</Text>
            <Progress value={63} color={studentTokens.yellow} />
            <View style={styles.sideMetaRow}><Text style={styles.sideText}>Estimated time</Text><Text style={styles.sideStrong}>12 min</Text></View>
            <Button label="Start Recommended Test" size="sm" style={styles.fullButton} />
          </Card>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>WEEKLY CHALLENGE</Text>
            <Text style={styles.bigSideNumber}>3 / 5</Text>
            <Text style={styles.sideText}>Complete 2 more mini tests by Sunday.</Text>
            <Progress value={60} color={studentTokens.yellow} />
            <View style={styles.rewardBox}><Text style={styles.rewardText}>+45 XP when completed</Text></View>
          </Card>
        </RightRail>
      </View>
    </View>
  );
}

function AnswerOption({ letter, text, selected = false }: { letter: string; text: string; selected?: boolean }) {
  return (
    <View style={[styles.answerOption, selected ? styles.answerSelected : null]}>
      <View style={[styles.answerLetter, selected ? styles.answerLetterSelected : null]}>
        <Text style={[styles.answerLetterText, selected ? styles.answerLetterTextSelected : null]}>{letter}</Text>
      </View>
      <Text style={styles.answerText}>{text}</Text>
    </View>
  );
}

function QuestionNavigator() {
  return (
    <View style={styles.navigatorGrid}>
      {Array.from({ length: 20 }, (_, index) => index + 1).map((number) => {
        const active = number === 12;
        return <View key={number} style={[styles.navBubble, active ? styles.navBubbleActive : null]}><Text style={[styles.navBubbleText, active ? styles.navBubbleTextActive : null]}>{number}</Text></View>;
      })}
    </View>
  );
}

export function TestInterfacePage() {
  const { width } = useWindowDimensions();
  const wide = width >= 960;
  const compact = width < 720;

  return (
    <View testID="test-interface-screen" style={styles.screen}>
      <PageHeader title="Test Interface" subtitle="Exam mode separates test-taking from practice feedback and preserves realistic timing." right={<HeaderButton label="Section Instructions" />} />
      <View style={[styles.examMetaLine, compact ? styles.examMetaLineStack : null]}>
        <View style={styles.examTags}><MiniBadge label="Mock Test 03" tone="navy" /><Text style={styles.examTagText}>Reading Section</Text><Text style={styles.examMuted}>Question 12 of 20</Text></View>
        <View style={styles.examActions}><View style={styles.timerPill}><Text style={styles.timerPillText}>Time Remaining 27:18</Text></View><HeaderButton label="Pause" icon={pauseSymbol} /></View>
      </View>
      <Card style={styles.panelCard} contentStyle={styles.examCardBody}>
        <View style={styles.examToolbar}>
          <View style={styles.toolbarLeft}><Text style={styles.toolbarStrong}>Passage 1 of 2</Text><Text style={styles.toolbarText}>Question Type: Inference</Text></View>
          <View style={styles.toolbarRight}><Text style={styles.toolbarText}>Text Size</Text><Text style={styles.sizeOption}>A</Text><Text style={styles.sizeOptionLarge}>A</Text><Text style={styles.sizeOptionLargest}>A</Text><Text style={styles.toolbarText}>Highlight</Text><Text style={styles.toolbarText}>Notes</Text></View>
        </View>
        <View style={[styles.examSplit, wide ? styles.examSplitWide : null]}>
          <View style={styles.passagePanel}>
            <Text style={styles.passageTitle}>The Evolution of Urban Green Infrastructure</Text>
            <Text style={styles.passageText}>Urban planners increasingly treat green infrastructure as a core component of resilient cities rather than as an aesthetic addition. Parks, permeable surfaces, green roofs, and urban forests can reduce stormwater runoff while also improving air quality and neighborhood comfort.</Text>
            <Text style={styles.passageText}>Early approaches often focused on isolated projects. More recent strategies emphasize connected networks that support both ecological processes and human mobility. This shift reflects a broader understanding that environmental systems do not operate independently from transportation, housing, and public health.</Text>
            <Text style={styles.passageText}>Research also suggests that benefits are uneven when projects are introduced without attention to access. Well-designed programs therefore combine environmental targets with community participation, maintenance planning, and long-term funding.</Text>
            <Text style={styles.passageText}>As climate risks increase, cities are likely to rely more heavily on integrated systems that address heat, water, biodiversity, and everyday public space at the same time.</Text>
            <View style={styles.examNote}><Text style={styles.examNoteText}>Exam Mode: Explanations and correctness feedback remain hidden until the section is submitted.</Text></View>
          </View>
          <View style={styles.questionPanel}>
            <View style={styles.questionTopLine}><Text style={styles.questionCount}>Question 12 of 20</Text><MiniBadge label="Flagged" tone="orange" /></View>
            <Text style={styles.questionText}>What can be inferred about recent approaches to green infrastructure?</Text>
            <View style={styles.answerList}>
              <AnswerOption letter="A" text="They focus primarily on visual improvements." />
              <AnswerOption letter="B" text="They increasingly combine environmental and social objectives." selected />
              <AnswerOption letter="C" text="They are less expensive than earlier approaches." />
              <AnswerOption letter="D" text="They no longer require community participation." />
            </View>
            <View style={styles.reviewLine}><View style={styles.checkboxChecked}><SymbolView name={checkSymbol} tintColor="#ffffff" size={12} style={styles.tinyIcon} /></View><Text style={styles.reviewText}>Mark for Review</Text><Text style={styles.autosavedText}>Answer autosaved</Text></View>
            <Text style={styles.navigatorLabel}>Question Navigator</Text>
            <QuestionNavigator />
            <View style={styles.examButtons}><Button label="Previous" size="sm" variant="secondary" style={styles.examButton} /><Button label="Next" size="sm" variant="ghost" style={[styles.examButton, styles.navyButton]} textStyle={styles.whiteText} /></View>
            <Button label="Submit Section" size="sm" variant="secondary" style={styles.submitSectionButton} />
          </View>
        </View>
      </Card>
    </View>
  );
}

function AnalysisTable({ title, filters, rows, headers }: { title: string; filters?: string[]; rows: AnalysisRow[]; headers: string[] }) {
  const { width } = useWindowDimensions();
  const compact = width < 720;

  if (compact) {
    return (
      <Card style={styles.panelCard} contentStyle={styles.panelBody}>
        <SectionHeader title={title} right={filters ? <PillTabs items={filters} /> : undefined} />
        <View style={styles.mobileList}>
          {rows.map((row) => (
            <View key={`${title}-${row.label}`} style={styles.mobileItem}>
              <View style={styles.mobileTopRow}>
                <View style={styles.mobileTitleGroup}><Text style={styles.rowTitle}>{row.label}</Text>{row.detail ? <Text style={styles.rowSub}>{row.detail}</Text> : null}</View>
                {row.tone ? <MiniBadge label={row.values[1] ?? row.values[0]} tone={row.tone} /> : null}
              </View>
              <View style={styles.mobileMetaLine}>{row.values.map((value) => <Text key={value} style={styles.cellText}>{value}</Text>)}</View>
            </View>
          ))}
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.panelCard} contentStyle={styles.panelBody}>
      <SectionHeader title={title} right={filters ? <PillTabs items={filters} /> : undefined} />
      <View style={styles.table}>
        <View style={styles.analysisHead}>{headers.map((head) => <Text key={head || 'empty'} style={styles.tableHeadText}>{head}</Text>)}</View>
        {rows.map((row) => (
          <View key={`${title}-${row.label}`} style={styles.analysisRow}>
            <View style={styles.analysisNameCell}><Text style={styles.rowTitle}>{row.label}</Text>{row.detail ? <Text style={styles.rowSub}>{row.detail}</Text> : null}</View>
            {row.values.map((value, index) => index === 1 && row.tone ? <MiniBadge key={value} label={value} tone={row.tone} /> : <Text key={value} style={styles.cellText}>{value}</Text>)}
          </View>
        ))}
      </View>
    </Card>
  );
}

export function TestResultsPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 1040;
  const tablet = width >= 720;

  return (
    <View testID="test-results-screen" style={styles.screen}>
      <PageHeader title="Test Results" subtitle="Understand your score, diagnose weak areas, and move directly into the right practice." right={<><HeaderButton label="Download Report" icon={exportSymbol} /><HeaderButton label="Take Another Test" dark /></>} />
      <MetricGrid items={resultMetrics} />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <Card style={styles.panelCard} contentStyle={styles.largeChartBody}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardTitleGroup}><Text style={styles.orangeLabel}>TEST PERFORMANCE</Text><Text style={styles.heroTitle}>Mock Test 03 - Complete</Text><Text style={styles.heroText}>Completed May 30, 2026 - 1h 53m - 96 questions answered</Text></View>
              <View style={styles.percentileBox}><Text style={styles.percentileValue}>78th</Text><Text style={styles.percentileLabel}>Readiness percentile</Text></View>
            </View>
            <DashboardLineChart labels={['Start', 'Reading', 'Listening', 'Speaking', 'Writing']} score="94" />
          </Card>
          <View style={[styles.equalGrid, tablet ? styles.equalGridWide : null]}>
            <Card style={styles.panelCard} contentStyle={styles.panelBody}>
              <SectionHeader title="WEAK AREAS" />
              <BarRow label="Reading - Inference" value={61} />
              <BarRow label="Listening - Detail" value={68} />
              <BarRow label="Writing - Lexical range" value={72} />
            </Card>
            <Card style={styles.panelCard} contentStyle={styles.panelBody}>
              <SectionHeader title="RECOMMENDED NEXT ACTIONS" />
              {[
                ['Inference Practice Set 05', '12 min - Reading', 'R'],
                ['Lecture Detail Mini Test', '10 min - Listening', 'L'],
                ['Writing Feedback Review', 'Review Task 04', 'W'],
              ].map(([title, sub, letter]) => <View key={title} style={styles.actionRow}><View style={styles.initialBubble}><Text style={styles.initialText}>{letter}</Text></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSub}>{sub}</Text></View><SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.tinyIcon} /></View>)}
            </Card>
          </View>
          <AnalysisTable title="Question Analysis" filters={['All', 'Incorrect', 'Flagged']} headers={['#', 'SKILL', 'QUESTION TYPE', 'RESULT', 'TIME', '']} rows={[
            { label: '12', detail: 'Reading', values: ['Inference', 'Incorrect', '1:48', 'Review'], tone: 'orange' },
            { label: '27', detail: 'Listening', values: ['Detail', 'Incorrect', '1:16', 'Review'], tone: 'orange' },
            { label: '42', detail: 'Reading', values: ['Vocabulary', 'Correct', '0:42', 'View'], tone: 'green' },
          ]} />
        </View>
        <RightRail>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>TARGET GAP</Text><Text style={styles.bigSideNumber}>11</Text><Text style={styles.sideStrong}>points to target 105</Text><Progress value={88} color={studentTokens.yellow} /><Text style={styles.sideText}>Your last three full mocks show a steady upward trend.</Text><Button label="Retake Weak Skills" size="sm" style={styles.fullButton} />
          </Card>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>SECTION BREAKDOWN</Text>
            {[['Reading /30', 24, 'blue'], ['Listening /30', 22, 'teal'], ['Speaking /30', 23, 'purple'], ['Writing /30', 25, 'orange']].map(([label, value, tone]) => <BarRow key={String(label)} label={String(label)} value={Number(value)} color={toneColor[tone as Tone]} suffix="" />)}
          </Card>
        </RightRail>
      </View>
    </View>
  );
}

export function ScoreAnalysisPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 1040;
  const tablet = width >= 720;

  return (
    <View testID="score-analysis-screen" style={styles.screen}>
      <PageHeader title="Score Analysis" subtitle="See how your estimated TOEFL score is changing and what drives the movement." right={<><HeaderButton label="May 01 - May 30" icon={calendarSymbol} /><HeaderButton label="Export" icon={exportSymbol} /></>} />
      <MetricGrid items={scoreMetrics} />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <Card style={styles.panelCard} contentStyle={styles.largeChartBody}>
            <SectionHeader title="Score Trend" right={<PillTabs items={['7D', '30D', '90D', 'All Time']} active={1} />} />
            <DashboardLineChart />
          </Card>
          <View style={[styles.equalGrid, tablet ? styles.equalGridWide : null]}>
            <Card style={styles.panelCard} contentStyle={styles.panelBody}>
              <SectionHeader title="SECTION CONTRIBUTION" />
              {[['Reading /30', 80], ['Listening /30', 73], ['Speaking /30', 77], ['Writing /30', 60]].map(([label, value]) => <BarRow key={String(label)} label={String(label)} value={Number(value)} color={studentTokens.yellow} suffix="" />)}
            </Card>
            <AnalysisTable title="TEST-TO-TEST COMPARISON" headers={['TEST', 'OVERALL', 'DELTA', 'DATE']} rows={[
              { label: 'Mock 03', values: ['94', '+4', 'May 30'], tone: 'green' },
              { label: 'Mock 02', values: ['90', '+3', 'May 20'], tone: 'green' },
              { label: 'Mock 01', values: ['87', 'Baseline', 'May 08'], tone: 'blue' },
            ]} />
          </View>
        </View>
        <RightRail>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}><Text style={styles.orangeLabel}>SCORE READINESS</Text><RingScore value="83%" label="On track" /><Text style={styles.sideTextCenter}>Based on recent mocks, practice consistency, and section stability.</Text></Card>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>TARGET SCENARIO</Text>
            {['Current estimate|87', 'Target|105', 'Exam date|Aug 20'].map((item) => { const [label, value] = item.split('|'); return <View key={label} style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; })}
            <View style={styles.priorityBox}><Text style={styles.priorityText}>Priority: Writing and Listening offer the largest near-term score gains.</Text></View>
            <Button label="Update Study Plan" size="sm" style={styles.fullButton} />
          </Card>
        </RightRail>
      </View>
    </View>
  );
}

export function SkillAnalysisPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 1040;
  const tablet = width >= 720;

  return (
    <View testID="skill-analysis-screen" style={styles.screen}>
      <PageHeader title="Skill Analysis" subtitle="Go beyond the score to understand subskills, timing, and recurring error patterns." right={<HeaderButton label="Last 30 Days" icon={calendarSymbol} />} />
      <MetricGrid items={skillMetrics} />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <AnalysisTable title="Question Type Breakdown" filters={['Reading', 'Listening', 'Speaking', 'Writing']} headers={['SUBSKILL', 'ACCURACY', 'AVG TIME', 'TREND', 'RECOMMENDATION']} rows={skillRows} />
          <View style={[styles.equalGrid, tablet ? styles.equalGridWide : null]}>
            <Card style={styles.panelCard} contentStyle={styles.largeChartBody}><Text style={styles.orangeLabel}>ACCURACY VS TIME</Text><DashboardLineChart labels={['0:40', '0:55', '1:10', '1:25']} score="82" /></Card>
            <Card style={styles.panelCard} contentStyle={styles.panelBody}>
              <SectionHeader title="ERROR PATTERNS" />
              {[
                ['1', 'Over-reading distractors', '6 of last 14 incorrect Reading answers'],
                ['2', 'Inference without text evidence', '4 recent errors'],
                ['3', 'Time pressure after Q8', 'Average response time +29%'],
              ].map(([number, title, sub]) => <View key={title} style={styles.patternRow}><View style={styles.initialBubble}><Text style={styles.initialText}>{number}</Text></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSub}>{sub}</Text></View></View>)}
            </Card>
          </View>
        </View>
        <RightRail>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>FOCUS AREAS</Text>
            <View style={styles.focusBox}><Text style={styles.sideStrong}>Reading - Inference</Text><Text style={styles.sideText}>63% mastery</Text></View>
            <Button label="Practice Inference" size="sm" style={styles.fullButton} />
            <View style={styles.focusBox}><Text style={styles.sideStrong}>Speaking - Fluency</Text><Text style={styles.sideText}>61% mastery</Text></View>
            <Button label="Open Speaking Drill" size="sm" variant="secondary" style={styles.fullButton} />
          </Card>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}><Text style={styles.orangeLabel}>LEARNING INSIGHT</Text><Text style={styles.sideTitle}>You perform best after 2-3 focused sessions per skill each week.</Text><Text style={styles.sideText}>Your accuracy drops when sessions exceed about 45 minutes. Consider shorter blocks.</Text></Card>
        </RightRail>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 12 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  pageHeaderCompact: { flexDirection: 'column', alignItems: 'stretch' },
  pageCopy: { flex: 1, minWidth: 0 },
  pageTitle: { color: studentTokens.ink, fontFamily, fontSize: 28, fontWeight: '700', lineHeight: 34 },
  pageSubtitle: { color: '#71809a', fontFamily, fontSize: 13, fontWeight: '500', lineHeight: 18, marginTop: 2 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  headerActionsCompact: { justifyContent: 'flex-start' },
  headerButton: { borderRadius: 8, minHeight: 34 },
  headerButtonText: { fontFamily, fontWeight: '700' },
  navyButton: { backgroundColor: '#001b48', borderColor: '#001b48', borderRadius: 8 },
  whiteText: { color: '#ffffff', fontFamily, fontWeight: '700' },
  tinyIcon: { width: 14, height: 14 },
  symbolFill: { flexShrink: 0 },
  iconBubble: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  metricGrid: { gap: 10 },
  metricGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  metricCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  metricCardWide: { flexGrow: 1, flexBasis: 210, minWidth: 190 },
  metricCardStacked: { width: '100%', minHeight: 0 },
  metricBody: { padding: 14, gap: 11 },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metricCopy: { flex: 1, minWidth: 0 },
  metricLabel: { color: '#6e778b', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 12 },
  metricValue: { color: studentTokens.navy, fontFamily, fontSize: 24, fontWeight: '700', lineHeight: 29, marginTop: 1 },
  metricSub: { color: '#8a94a8', fontFamily, fontSize: 10, fontWeight: '500', lineHeight: 14, marginTop: 1 },
  contentGrid: { gap: 12 },
  contentGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  mainColumn: { flex: 1, minWidth: 0, gap: 12 },
  sideColumn: { width: 288, maxWidth: '100%', gap: 12, flexShrink: 0 },
  panelCard: { flexGrow: 1, flexShrink: 1, padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  panelBody: { padding: 16, gap: 12 },
  sideCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  sideBody: { padding: 16, gap: 13 },
  sectionHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: studentTokens.ink, fontFamily, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  orangeLabel: { color: studentTokens.orange, fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 13 },
  sideTitle: { color: studentTokens.ink, fontFamily, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  sideText: { color: '#71809a', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  sideTextCenter: { color: '#71809a', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17, textAlign: 'center' },
  sideStrong: { color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  bigSideNumber: { color: studentTokens.navy, fontFamily, fontSize: 30, fontWeight: '700', lineHeight: 35 },
  miniBadge: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  miniBadgeText: { fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 12 },
  filterLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  filterLineStack: { flexDirection: 'column', alignItems: 'stretch' },
  pillTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pillTab: { minHeight: 31, borderRadius: 999, borderWidth: 1, borderColor: '#dfe6f1', backgroundColor: '#ffffff', justifyContent: 'center', paddingHorizontal: 13 },
  pillTabActive: { backgroundColor: '#001b48', borderColor: '#001b48' },
  pillText: { color: '#31405c', fontFamily, fontSize: 11, fontWeight: '600', lineHeight: 15 },
  pillTextActive: { color: '#ffffff', fontWeight: '700' },
  searchBox: { minHeight: 36, minWidth: 220, borderRadius: 8, borderWidth: 1, borderColor: '#dfe6f1', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  searchText: { color: '#8790a4', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  table: { borderTopWidth: 1, borderTopColor: '#eef1f6' },
  miniTableHead: { minHeight: 35, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  miniTableRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  tableHeadText: { flex: 1, color: '#8790a4', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 12 },
  testNameCell: { flex: 1.75, minWidth: 170 },
  rowTitle: { color: studentTokens.ink, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  rowSub: { color: '#7d889d', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16, marginTop: 1 },
  cellText: { flex: 1, color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  latestText: { flex: 1, color: studentTokens.navy, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  tableButton: { minWidth: 86, minHeight: 32, borderRadius: 7 },
  fullButton: { width: '100%', borderRadius: 8, minHeight: 36 },
  mobileList: { gap: 8 },
  mobileItem: { borderRadius: 9, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: '#fbfcff', padding: 11, gap: 9 },
  mobileTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  mobileTitleGroup: { flex: 1, minWidth: 0 },
  mobileMetaLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  sideMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rewardBox: { borderRadius: 8, borderWidth: 1, borderColor: '#f3dfa3', backgroundColor: '#fff8df', paddingHorizontal: 11, paddingVertical: 10 },
  rewardText: { color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  barRow: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 132, color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  barTrack: { flex: 1, height: 6, borderRadius: 999, backgroundColor: '#e9edf3', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  barValue: { width: 40, color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16, textAlign: 'right' },
  lineChart: { minHeight: 170, flexDirection: 'row', gap: 8 },
  chartAxis: { width: 26, justifyContent: 'space-between', paddingBottom: 18 },
  axisText: { color: '#8490a5', fontFamily, fontSize: 9, fontWeight: '500', lineHeight: 11, textAlign: 'right' },
  chartPlot: { flex: 1, minWidth: 0, position: 'relative', borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#edf1f6', overflow: 'hidden' },
  chartGridLineTop: { position: 'absolute', left: 0, right: 0, top: 31, height: 1, backgroundColor: '#edf1f6' },
  targetDash: { position: 'absolute', left: 0, right: 0, top: 54, borderTopWidth: 1, borderStyle: 'dashed', borderColor: `${studentTokens.orange}99` },
  blueTrendLine: { position: 'absolute', left: '13%', width: '43%', height: 6, bottom: 44, borderRadius: 999, backgroundColor: studentTokens.blue, transform: [{ rotate: '-10deg' }] },
  blueTrendLineSecond: { position: 'absolute', left: '52%', width: '31%', height: 6, bottom: 82, borderRadius: 999, backgroundColor: studentTokens.blue, transform: [{ rotate: '-10deg' }] },
  trendDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: studentTokens.blue, borderWidth: 2, borderColor: '#ffffff' },
  dotOne: { left: '13%', bottom: 42 },
  dotTwo: { left: '33%', bottom: 60 },
  dotThree: { left: '55%', bottom: 79 },
  dotFour: { left: '72%', bottom: 94 },
  trendDotLast: { position: 'absolute', width: 24, height: 20, borderRadius: 5, backgroundColor: '#001b48', alignItems: 'center', justifyContent: 'center' },
  dotLast: { right: 10, bottom: 103 },
  dotLastText: { color: '#ffffff', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 11 },
  chartLabels: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  chartLabel: { color: '#6e778b', fontFamily, fontSize: 10, fontWeight: '500', lineHeight: 13 },
  ringWrap: { alignItems: 'center', gap: 9 },
  ringOuter: { position: 'relative', width: 108, height: 108, borderRadius: 54, borderWidth: 10, borderColor: '#e8edf4', alignItems: 'center', justifyContent: 'center' },
  ringArc: { position: 'absolute', width: 108, height: 108, borderRadius: 54, borderWidth: 10, borderLeftColor: 'transparent', borderBottomColor: 'transparent', borderTopColor: '#16a34a', borderRightColor: '#16a34a', transform: [{ rotate: '-35deg' }] },
  ringInner: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  ringValue: { color: studentTokens.navy, fontFamily, fontSize: 24, fontWeight: '700', lineHeight: 29 },
  ringLabel: { color: studentTokens.navy, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  examMetaLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  examMetaLineStack: { flexDirection: 'column', alignItems: 'stretch' },
  examTags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  examTagText: { color: studentTokens.navy, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  examMuted: { color: '#7d889d', fontFamily, fontSize: 13, fontWeight: '500', lineHeight: 17 },
  examActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  timerPill: { minHeight: 34, borderRadius: 9, borderWidth: 1, borderColor: '#f1ce76', backgroundColor: '#fff9e7', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 },
  timerPillText: { color: studentTokens.navy, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  examCardBody: { padding: 0 },
  examToolbar: { minHeight: 44, borderBottomWidth: 1, borderBottomColor: '#e5eaf2', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingVertical: 8, flexWrap: 'wrap' },
  toolbarLeft: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  toolbarRight: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, alignItems: 'center' },
  toolbarStrong: { color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  toolbarText: { color: '#526078', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  sizeOption: { color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  sizeOptionLarge: { color: studentTokens.navy, fontFamily, fontSize: 14, fontWeight: '700', lineHeight: 17 },
  sizeOptionLargest: { color: studentTokens.navy, fontFamily, fontSize: 16, fontWeight: '700', lineHeight: 18 },
  examSplit: { gap: 0 },
  examSplitWide: { flexDirection: 'row' },
  passagePanel: { flex: 1.06, minWidth: 0, padding: 22, gap: 15 },
  questionPanel: { flex: 1, minWidth: 0, borderLeftWidth: 1, borderLeftColor: '#e5eaf2', padding: 22, gap: 14 },
  passageTitle: { color: studentTokens.navy, fontFamily, fontSize: 20, fontWeight: '700', lineHeight: 26 },
  passageText: { color: '#2d3d59', fontFamily, fontSize: 13, fontWeight: '500', lineHeight: 19 },
  examNote: { borderRadius: 10, borderWidth: 1, borderColor: '#f0ce80', backgroundColor: '#fff8df', padding: 12, marginTop: 4 },
  examNoteText: { color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  questionTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  questionCount: { color: studentTokens.navy, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  questionText: { color: studentTokens.navy, fontFamily, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  answerList: { gap: 8 },
  answerOption: { minHeight: 42, borderRadius: 8, borderWidth: 1, borderColor: '#dce3ef', backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  answerSelected: { borderColor: '#16a34a', backgroundColor: '#effbf6' },
  answerLetter: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#edf2f8', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  answerLetterSelected: { backgroundColor: '#16a34a' },
  answerLetterText: { color: studentTokens.navy, fontFamily, fontSize: 11, fontWeight: '700', lineHeight: 14 },
  answerLetterTextSelected: { color: '#ffffff' },
  answerText: { flex: 1, color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  reviewLine: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: '#eef1f6', paddingBottom: 12 },
  checkboxChecked: { width: 16, height: 16, borderRadius: 4, backgroundColor: studentTokens.blue, alignItems: 'center', justifyContent: 'center' },
  reviewText: { color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  autosavedText: { color: '#8790a4', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16, marginLeft: 'auto' },
  navigatorLabel: { color: '#8790a4', fontFamily, fontSize: 11, fontWeight: '500', lineHeight: 14 },
  navigatorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  navBubble: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#dce3ef', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  navBubbleActive: { backgroundColor: '#001b48', borderColor: '#001b48' },
  navBubbleText: { color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 15 },
  navBubbleTextActive: { color: '#ffffff', fontWeight: '700' },
  examButtons: { flexDirection: 'row', gap: 10 },
  examButton: { flex: 1, borderRadius: 8, minHeight: 38 },
  submitSectionButton: { borderRadius: 8, minHeight: 38, backgroundColor: '#fff8df', borderColor: '#f1ce76' },
  largeChartBody: { padding: 16, gap: 14 },
  cardTopRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  cardTitleGroup: { flex: 1, minWidth: 230, gap: 4 },
  heroTitle: { color: studentTokens.navy, fontFamily, fontSize: 23, fontWeight: '700', lineHeight: 29 },
  heroText: { color: '#71809a', fontFamily, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  percentileBox: { alignItems: 'flex-end', flexShrink: 0 },
  percentileValue: { color: studentTokens.navy, fontFamily, fontSize: 28, fontWeight: '700', lineHeight: 33 },
  percentileLabel: { color: '#71809a', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  equalGrid: { gap: 12 },
  equalGridWide: { flexDirection: 'row' },
  actionRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#eef1f6', paddingBottom: 9 },
  patternRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#eef1f6', paddingBottom: 9 },
  initialBubble: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#edf2ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  initialText: { color: studentTokens.blue, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  actionCopy: { flex: 1, minWidth: 0 },
  actionTitle: { color: studentTokens.navy, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  actionSub: { color: '#7d889d', fontFamily, fontSize: 11, fontWeight: '500', lineHeight: 15, marginTop: 1 },
  analysisHead: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  analysisRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  analysisNameCell: { flex: 1.35, minWidth: 0 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  infoLabel: { color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  infoValue: { color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  priorityBox: { borderRadius: 9, borderWidth: 1, borderColor: '#f0ce80', backgroundColor: '#fff8df', padding: 10 },
  priorityText: { color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  focusBox: { borderLeftWidth: 4, borderLeftColor: studentTokens.yellow, paddingLeft: 10, gap: 2 },
});


