import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button, Card, Progress, studentTokens } from '@/components/student/ui';

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };
type Tone = 'blue' | 'teal' | 'orange' | 'purple' | 'yellow' | 'navy' | 'green';

type Metric = {
  label: string;
  value: string;
  sub: string;
  tone: Tone;
  icon: AppSymbolName;
  progress: number;
};

type ReviewWord = {
  word: string;
  meta: string;
  meaning: string;
  mastery: string;
  tone: Tone;
  next: string;
};

type GrammarTopic = {
  title: string;
  detail: string;
  level: string;
  lessons: string;
  mastery: string;
  status: string;
  tone: Tone;
  action: string;
};

const fontFamily = 'Quicksand';

const symbolName = (ios: string, web: string): AppSymbolName => ({
  ios: ios as SFSymbol,
  android: web as AndroidSymbol,
  web: web as AndroidSymbol,
});

const arrowSymbol = symbolName('chevron.right', 'chevron_right');
const addSymbol = symbolName('plus', 'add');
const importSymbol = symbolName('square.and.arrow.down', 'file_download');
const bookSymbol = symbolName('book', 'menu_book');
const reviewSymbol = symbolName('arrow.clockwise', 'refresh');
const starSymbol = symbolName('star.fill', 'star');
const flameSymbol = symbolName('flame.fill', 'local_fire_department');
const playSymbol = symbolName('play.fill', 'play_arrow');
const checkSymbol = symbolName('checkmark', 'check');
const targetSymbol = symbolName('target', 'track_changes');
const lightningSymbol = symbolName('bolt.fill', 'bolt');
const levelSymbol = symbolName('arrow.right', 'arrow_forward');

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

const vocabMetrics: Metric[] = [
  { label: 'Words Learned', value: '642', sub: '+38 this month', tone: 'blue', icon: bookSymbol, progress: 78 },
  { label: 'Due for Review', value: '24', sub: '12 due today', tone: 'teal', icon: reviewSymbol, progress: 42 },
  { label: 'Mastered', value: '318', sub: '49% of library', tone: 'navy', icon: starSymbol, progress: 66 },
  { label: 'Review Streak', value: '9 days', sub: 'Best: 21 days', tone: 'orange', icon: flameSymbol, progress: 58 },
];

const reviewWords: ReviewWord[] = [
  { word: 'mitigate', meta: 'verb - C1', meaning: 'to make less severe', mastery: 'Learning', tone: 'orange', next: 'Today' },
  { word: 'empirical', meta: 'adj. - C1', meaning: 'based on observation', mastery: 'Strong', tone: 'green', next: 'Tomorrow' },
  { word: 'subsequent', meta: 'adj. - B2', meaning: 'coming after', mastery: 'Due', tone: 'yellow', next: 'Today' },
];

const weakGroups = [
  { label: 'Research', value: 58 },
  { label: 'Argumentation', value: 64 },
  { label: 'Environment', value: 72 },
];

const grammarMetrics: Metric[] = [
  { label: 'Topics Completed', value: '18 / 32', sub: '4 this month', tone: 'blue', icon: checkSymbol, progress: 56 },
  { label: 'Mastery', value: '76%', sub: '+5% this month', tone: 'teal', icon: targetSymbol, progress: 76 },
  { label: 'Exercises', value: '214', sub: '86% accuracy', tone: 'yellow', icon: lightningSymbol, progress: 86 },
  { label: 'Recommended Level', value: 'B2 → C1', sub: 'Based on recent work', tone: 'navy', icon: levelSymbol, progress: 68 },
];

const grammarTopics: GrammarTopic[] = [
  { title: 'Verb Tense Control', detail: 'Sequence and consistency', level: 'B2', lessons: '6 / 6', mastery: '91%', status: 'Mastered', tone: 'green', action: 'Review' },
  { title: 'Relative Clauses', detail: 'Defining & non-defining', level: 'B2', lessons: '4 / 6', mastery: '74%', status: 'In Progress', tone: 'yellow', action: 'Continue' },
  { title: 'Conditionals in Arguments', detail: 'Hypothesis and stance', level: 'C1', lessons: '2 / 5', mastery: '61%', status: 'Needs Work', tone: 'orange', action: 'Continue' },
  { title: 'Nominalization', detail: 'Academic style', level: 'C1', lessons: '0 / 5', mastery: '-', status: 'Not Started', tone: 'navy', action: 'Start' },
];

function PageHeader({ title, subtitle, right }: { title: string; subtitle: string; right?: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const compact = width < 700;

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
  const iconSize = Math.round(size * 0.56);
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
      <Progress value={item.progress} color={toneColor[item.tone]} />
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

function MetricGrid({ items }: { items: Metric[] }) {
  const { width } = useWindowDimensions();
  const tablet = width >= 700;

  return (
    <View style={[styles.metricGrid, tablet ? styles.metricGridWide : null]}>
      {items.map((item) => <MetricCard key={item.label} item={item} wide={tablet} />)}
    </View>
  );
}

function WordHero() {
  return (
    <Card style={styles.wordHero} contentStyle={styles.wordHeroBody}>
      <View style={styles.wordHeroTop}>
        <View style={styles.wordCopy}>
          <Text style={styles.orangeLabel}>TODAY&apos;S WORD</Text>
          <Text style={styles.wordTitle}>ubiquitous</Text>
          <View style={styles.wordMetaRow}>
            <Text style={styles.wordMeta}>/juːˈbɪkwɪtəs/</Text>
            <Text style={styles.wordMeta}>adjective</Text>
            <Text style={styles.wordMeta}>Academic - C1</Text>
          </View>
          <Text style={styles.wordMeaning}>Present, appearing, or found everywhere. Commonly used in academic texts to describe widespread phenomena.</Text>
        </View>
        <Button label="Pronunciation" size="sm" left={<SymbolView name={playSymbol} tintColor={studentTokens.navy} size={14} style={styles.tinyIcon} />} style={styles.pronounceButton} />
      </View>
      <View style={styles.exampleBox}>
        <Text style={styles.exampleText}><Text style={styles.exampleLead}>Example: </Text>Digital technology has become ubiquitous in modern education, reshaping how students access information.</Text>
      </View>
      <View style={styles.wordActions}>
        <View style={styles.blankPill} />
        <View style={styles.blankPill} />
        <Button label="Need Review" size="sm" variant="secondary" style={styles.wordActionButton} />
        <Button label="I Know This" size="sm" style={styles.wordActionButton} />
      </View>
    </Card>
  );
}

function CircularGoal({ value, total }: { value: number; total: number }) {
  const percent = Math.max(0, Math.min(100, (value / total) * 100));

  return (
    <View style={styles.goalRingWrap}>
      <View style={styles.goalRingOuter}>
        <View style={[styles.goalRingFill, { transform: [{ rotate: `${Math.round(percent * 1.8)}deg` }] }]} />
        <View style={styles.goalRingInner}>
          <Text style={styles.goalValue}>{value}<Text style={styles.goalMax}>/{total}</Text></Text>
        </View>
      </View>
    </View>
  );
}

function ReviewQueue() {
  const { width } = useWindowDimensions();
  const compact = width < 700;

  return (
    <Card style={styles.panelCard} contentStyle={styles.panelBody}>
      <SectionHeader
        title="Review Queue"
        right={
          <View style={styles.queueFilters}>
            <MiniBadge label="Due Today" tone="navy" />
            <MiniBadge label="Difficult" tone="blue" />
            <MiniBadge label="Saved" tone="teal" />
          </View>
        }
      />
      {compact ? (
        <View style={styles.mobileQueueList}>
          {reviewWords.map((item) => (
            <View key={item.word} style={styles.mobileQueueCard}>
              <View style={styles.mobileQueueTop}>
                <View>
                  <Text style={styles.queueWord}>{item.word}</Text>
                  <Text style={styles.queueMeta}>{item.meta}</Text>
                </View>
                <MiniBadge label={item.mastery} tone={item.tone} />
              </View>
              <Text style={styles.queueMeaning}>{item.meaning}</Text>
              <View style={styles.mobileQueueBottom}>
                <Text style={styles.queueNext}>{item.next}</Text>
                <Button label="Review" size="sm" variant="secondary" style={styles.smallAction} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHead}>
            {['WORD', 'MEANING', 'MASTERY', 'NEXT REVIEW', 'ACTION'].map((head) => <Text key={head} style={styles.tableHeadText}>{head}</Text>)}
          </View>
          {reviewWords.map((item) => (
            <View key={item.word} style={styles.tableRow}>
              <View style={styles.wordCell}>
                <Text style={styles.queueWord}>{item.word}</Text>
                <Text style={styles.queueMeta}>{item.meta}</Text>
              </View>
              <Text style={styles.queueMeaning}>{item.meaning}</Text>
              <MiniBadge label={item.mastery} tone={item.tone} />
              <Text style={styles.queueNext}>{item.next}</Text>
              <Button label="Review" size="sm" variant="secondary" style={styles.smallAction} />
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function VocabularySide() {
  return (
    <View style={styles.sideColumn}>
      <Card style={styles.sideCard} contentStyle={styles.sideBody}>
        <Text style={styles.orangeLabel}>TODAY&apos;S GOAL</Text>
        <CircularGoal value={12} total={20} />
        <Text style={styles.goalHint}>8 words left to reach today&apos;s goal.</Text>
        <Button label="Start Review Session" size="sm" style={styles.fullButton} />
      </Card>

      <Card style={styles.sideCard} contentStyle={styles.sideBody}>
        <Text style={styles.orangeLabel}>WEAK WORD GROUPS</Text>
        <View style={styles.groupList}>
          {weakGroups.map((group) => (
            <View key={group.label} style={styles.groupRow}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <View style={styles.groupTrack}><View style={[styles.groupFill, { width: `${group.value}%` }]} /></View>
              <Text style={styles.groupValue}>{group.value}%</Text>
            </View>
          ))}
        </View>
        <Button label="View Vocabulary Analysis" size="sm" variant="secondary" style={styles.fullButton} />
      </Card>
    </View>
  );
}

function GrammarHero() {
  const { width } = useWindowDimensions();
  const compact = width < 700;

  return (
    <Card style={styles.panelCard} contentStyle={[styles.grammarHeroBody, compact ? styles.grammarHeroBodyCompact : null]}>
      <View style={styles.grammarHeroCopy}>
        <Text style={styles.orangeLabel}>RECOMMENDED NEXT</Text>
        <Text style={styles.heroTitle}>Complex Sentences & Academic Clauses</Text>
        <Text style={styles.heroText}>Strengthen cohesion by combining ideas with relative clauses, concessive clauses, and academic connectors.</Text>
        <View style={styles.heroActions}>
          <Button label="Continue Topic" size="sm" style={styles.heroButton} />
          <Button label="Quick Review" size="sm" variant="secondary" style={styles.heroButton} />
        </View>
      </View>
      <View style={styles.masteryPanel}>
        <Text style={styles.masteryValue}>68%</Text>
        <Text style={styles.masteryLabel}>Current mastery</Text>
        <Progress value={68} color={studentTokens.yellow} />
      </View>
    </Card>
  );
}

function GrammarTopics() {
  const { width } = useWindowDimensions();
  const compact = width < 700;

  return (
    <Card style={styles.panelCard} contentStyle={styles.panelBody}>
      <SectionHeader
        title="Grammar Topics"
        right={
          <View style={styles.topicFilters}>
            {['All', 'B1', 'B2', 'C1'].map((item) => <MiniBadge key={item} label={item} tone={item === 'All' ? 'navy' : 'blue'} />)}
          </View>
        }
      />
      {compact ? (
        <View style={styles.mobileTopicList}>
          {grammarTopics.map((topic) => (
            <View key={topic.title} style={styles.mobileTopicCard}>
              <View style={styles.mobileTopicTop}>
                <View style={styles.topicCopy}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.topicDetail}>{topic.detail}</Text>
                </View>
                <MiniBadge label={topic.status} tone={topic.tone} />
              </View>
              <View style={styles.topicMetaRow}>
                <Text style={styles.topicMeta}>Level {topic.level}</Text>
                <Text style={styles.topicMeta}>{topic.lessons} lessons</Text>
                <Text style={styles.topicMeta}>{topic.mastery} mastery</Text>
              </View>
              <Button label={topic.action} size="sm" variant="secondary" right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.tinyIcon} />} style={styles.fullButton} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.table}>
          <View style={styles.grammarTableHead}>
            {['TOPIC', 'LEVEL', 'LESSONS', 'MASTERY', 'STATUS', ''].map((head) => <Text key={head || 'action'} style={styles.tableHeadText}>{head}</Text>)}
          </View>
          {grammarTopics.map((topic) => (
            <View key={topic.title} style={styles.grammarRow}>
              <View style={styles.topicCopy}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDetail}>{topic.detail}</Text>
              </View>
              <Text style={styles.topicCell}>{topic.level}</Text>
              <Text style={styles.topicCell}>{topic.lessons}</Text>
              <Text style={styles.topicCell}>{topic.mastery}</Text>
              <MiniBadge label={topic.status} tone={topic.tone} />
              <Pressable accessibilityRole="button" style={({ pressed }) => [styles.linkAction, pressed ? styles.pressed : null]}>
                <Text style={styles.linkActionText}>{topic.action}</Text>
                <SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={12} style={styles.tinyIcon} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function GrammarSide() {
  return (
    <View style={styles.sideColumn}>
      <Card style={styles.sideCard} contentStyle={styles.sideBody}>
        <Text style={styles.orangeLabel}>QUICK EXERCISE</Text>
        <Text style={styles.sideTitle}>Choose the best sentence</Text>
        <Text style={styles.sideText}>The study was limited. ___, the findings remain valuable.</Text>
        <View style={styles.answerList}>
          <View style={styles.answerOption}><Text style={styles.answerText}>A. Therefore</Text></View>
          <View style={[styles.answerOption, styles.answerCorrect]}><Text style={styles.answerText}>B. Nevertheless</Text></View>
          <View style={styles.answerOption}><Text style={styles.answerText}>C. In addition</Text></View>
        </View>
        <Button label="Check Answer" size="sm" variant="ghost" style={styles.navyButton} textStyle={styles.whiteText} />
      </Card>

      <Card style={styles.sideCard} contentStyle={styles.sideBody}>
        <Text style={styles.orangeLabel}>COMMON ERROR PATTERN</Text>
        <View style={styles.errorBox}>
          <View style={styles.errorAccent} />
          <View style={styles.errorCopy}>
            <Text style={styles.sideTitle}>Article use in academic nouns</Text>
            <Text style={styles.sideText}>7 errors in your last 3 writing tasks</Text>
          </View>
        </View>
        <Button label="Practice This Skill" size="sm" variant="secondary" style={styles.fullButton} />
      </Card>
    </View>
  );
}

export function VocabularyPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 1040;

  return (
    <View testID="vocabulary-screen" style={styles.screen}>
      <PageHeader
        title="Vocabulary"
        subtitle="Build a durable academic vocabulary with smart review and mastery tracking."
        right={
          <>
            <Button label="Import Words" size="sm" variant="secondary" left={<SymbolView name={importSymbol} tintColor={studentTokens.navy} size={14} style={styles.tinyIcon} />} style={styles.headerButton} />
            <Button label="Add Word" size="sm" variant="ghost" left={<SymbolView name={addSymbol} tintColor="#ffffff" size={14} style={styles.tinyIcon} />} style={styles.navyButton} textStyle={styles.whiteText} />
          </>
        }
      />
      <MetricGrid items={vocabMetrics} />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <WordHero />
          <ReviewQueue />
        </View>
        <VocabularySide />
      </View>
    </View>
  );
}

export function GrammarPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 1040;

  return (
    <View testID="grammar-screen" style={styles.screen}>
      <PageHeader
        title="Grammar"
        subtitle="Master the structures that make academic English clear, precise, and natural."
        right={<Button label="Placement Review" size="sm" variant="secondary" style={styles.headerButton} />}
      />
      <MetricGrid items={grammarMetrics} />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <GrammarHero />
          <GrammarTopics />
        </View>
        <GrammarSide />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 12 },
  pressed: { opacity: 0.72 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  pageHeaderCompact: { flexDirection: 'column', alignItems: 'stretch' },
  pageCopy: { flex: 1, minWidth: 0 },
  pageTitle: { color: studentTokens.ink, fontFamily, fontSize: 28, fontWeight: '700', lineHeight: 34 },
  pageSubtitle: { color: '#71809a', fontFamily, fontSize: 13, fontWeight: '500', lineHeight: 18, marginTop: 2 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  headerActionsCompact: { justifyContent: 'flex-start' },
  headerButton: { borderRadius: 8, minHeight: 34 },
  navyButton: { backgroundColor: '#001b48', borderColor: '#001b48', borderRadius: 8, minHeight: 34 },
  whiteText: { color: '#ffffff', fontFamily },
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
  metricValue: { color: studentTokens.navy, fontFamily, fontSize: 24, fontWeight: '700', lineHeight: 28, marginTop: 1 },
  metricSub: { color: '#8a94a8', fontFamily, fontSize: 10, fontWeight: '500', lineHeight: 14, marginTop: 1 },
  contentGrid: { gap: 12 },
  contentGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  mainColumn: { flex: 1, minWidth: 0, gap: 12 },
  sideColumn: { width: 288, maxWidth: '100%', gap: 12, flexShrink: 0 },
  panelCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  panelBody: { padding: 16, gap: 12 },
  sectionHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: studentTokens.ink, fontFamily, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  orangeLabel: { color: studentTokens.orange, fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 13 },
  miniBadge: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  miniBadgeText: { fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 12 },
  wordHero: { padding: 0, borderRadius: 11, borderColor: '#061f55', backgroundColor: '#08265a', overflow: 'hidden', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  wordHeroBody: { padding: 18, gap: 14 },
  wordHeroTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  wordCopy: { flex: 1, minWidth: 230 },
  wordTitle: { color: '#ffffff', fontFamily, fontSize: 30, fontWeight: '700', lineHeight: 36, marginTop: 2 },
  wordMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 3 },
  wordMeta: { color: '#9fb0cf', fontFamily, fontSize: 11, fontWeight: '500', lineHeight: 15 },
  wordMeaning: { color: '#e7eefc', fontFamily, fontSize: 13, fontWeight: '500', lineHeight: 19, maxWidth: 760, marginTop: 12 },
  pronounceButton: { minWidth: 130, borderRadius: 8, backgroundColor: studentTokens.yellow, borderColor: studentTokens.yellow },
  exampleBox: { borderRadius: 9, backgroundColor: '#fff8df', borderWidth: 1, borderColor: '#ffe4a9', paddingHorizontal: 12, paddingVertical: 10 },
  exampleText: { color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  exampleLead: { color: studentTokens.navy, fontWeight: '700' },
  wordActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  blankPill: { flexGrow: 1, flexBasis: 160, minHeight: 32, borderRadius: 999, backgroundColor: '#ffffff' },
  wordActionButton: { minWidth: 112, borderRadius: 8 },
  sideCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  sideBody: { padding: 16, gap: 14 },
  fullButton: { width: '100%', borderRadius: 8, minHeight: 36 },
  goalRingWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 5 },
  goalRingOuter: { position: 'relative', width: 108, height: 108, borderRadius: 54, backgroundColor: '#e9edf3', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  goalRingFill: { position: 'absolute', width: 108, height: 108, borderRadius: 54, borderWidth: 10, borderColor: '#16a34a', borderLeftColor: 'transparent', borderBottomColor: 'transparent' },
  goalRingInner: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  goalValue: { color: studentTokens.navy, fontFamily, fontSize: 25, fontWeight: '700', lineHeight: 29 },
  goalMax: { color: '#8e98ab', fontFamily, fontSize: 14, fontWeight: '700' },
  goalHint: { color: '#7d889d', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17, textAlign: 'center' },
  groupList: { gap: 10 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupLabel: { width: 112, color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  groupTrack: { flex: 1, height: 5, borderRadius: 99, backgroundColor: '#e9edf3', overflow: 'hidden' },
  groupFill: { height: '100%', borderRadius: 99, backgroundColor: studentTokens.yellow },
  groupValue: { width: 38, color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16, textAlign: 'right' },
  queueFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  table: { borderTopWidth: 1, borderTopColor: '#eef1f6' },
  tableHead: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  tableHeadText: { flex: 1, color: '#8790a4', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 12 },
  tableRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  wordCell: { flex: 1, minWidth: 0 },
  queueWord: { color: studentTokens.ink, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  queueMeta: { color: '#7d889d', fontFamily, fontSize: 11, fontWeight: '500', lineHeight: 14, marginTop: 1 },
  queueMeaning: { flex: 1.45, color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  queueNext: { flex: 1, color: '#31405c', fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  smallAction: { minWidth: 88, minHeight: 32, borderRadius: 7 },
  mobileQueueList: { gap: 8 },
  mobileQueueCard: { borderRadius: 9, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: '#fbfcff', padding: 11, gap: 8 },
  mobileQueueTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  mobileQueueBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  grammarHeroBody: { padding: 18, gap: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grammarHeroBodyCompact: { flexDirection: 'column', alignItems: 'stretch' },
  grammarHeroCopy: { flex: 1, minWidth: 0, gap: 8 },
  heroTitle: { color: studentTokens.navy, fontFamily, fontSize: 22, fontWeight: '700', lineHeight: 28 },
  heroText: { color: '#71809a', fontFamily, fontSize: 13, fontWeight: '500', lineHeight: 19 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  heroButton: { minWidth: 122, borderRadius: 8 },
  masteryPanel: { width: 180, maxWidth: '100%', gap: 8, flexShrink: 0 },
  masteryValue: { color: studentTokens.navy, fontFamily, fontSize: 28, fontWeight: '700', lineHeight: 34 },
  masteryLabel: { color: '#71809a', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  topicFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  grammarTableHead: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  grammarRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  topicCopy: { flex: 1.65, minWidth: 0 },
  topicTitle: { color: studentTokens.ink, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  topicDetail: { color: '#7d889d', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16, marginTop: 1 },
  topicCell: { flex: 1, color: '#31405c', fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  topicMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  topicMeta: { color: '#526078', fontFamily, fontSize: 11, fontWeight: '500', lineHeight: 15 },
  mobileTopicList: { gap: 8 },
  mobileTopicCard: { borderRadius: 9, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: '#fbfcff', padding: 11, gap: 9 },
  mobileTopicTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  linkAction: { flex: 1, minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  linkActionText: { color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  sideTitle: { color: studentTokens.ink, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  sideText: { color: '#71809a', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  answerList: { gap: 8 },
  answerOption: { minHeight: 39, borderRadius: 8, borderWidth: 1, borderColor: '#dce3ef', backgroundColor: '#ffffff', paddingHorizontal: 11, justifyContent: 'center' },
  answerCorrect: { borderColor: '#16a34a', backgroundColor: '#effbf6' },
  answerText: { color: '#31405c', fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  errorBox: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  errorAccent: { width: 4, alignSelf: 'stretch', borderRadius: 4, backgroundColor: studentTokens.yellow },
  errorCopy: { flex: 1, minWidth: 0, gap: 3 },
});

