import { useMemo, useState } from 'react';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button, Card, Progress, studentTokens } from '@/components/student/ui';
import {
  getListeningDifficultyById,
  getListeningLengthById,
  getListeningSelectionFromParams,
  getListeningSubskillById,
  getListeningTaskTypeById,
  type ListeningSelection,
} from '@/lib/listening';

const fontFamily = 'Quicksand';

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

type MetricItem = {
  value: string;
  label: string;
  color: string;
  icon: AppSymbolName;
};

type TimelineItem = {
  title: string;
  time: string;
  done?: boolean;
  active?: boolean;
};

type AnswerOption = {
  key: string;
  text: string;
  selected?: boolean;
};

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const arrowSymbol = symbolName('chevron.right', 'chevron_right');
const backSymbol = symbolName('arrow.left', 'arrow_back');
const headphonesSymbol = symbolName('headphones', 'headphones');
const playSymbol = symbolName('play.fill', 'play_arrow');
const pauseSymbol = symbolName('pause.fill', 'pause');
const clockSymbol = symbolName('clock', 'schedule');
const documentSymbol = symbolName('doc.text', 'description');
const checkSymbol = symbolName('checkmark', 'check');
const noteSymbol = symbolName('note.text', 'sticky_note_2');
const moreSymbol = symbolName('ellipsis', 'more_horiz');
const volumeSymbol = symbolName('speaker.wave.2', 'volume_up');
const fullscreenSymbol = symbolName('arrow.up.left.and.arrow.down.right', 'fullscreen');
const replaySymbol = symbolName('gobackward.10', 'replay_10');
const forwardSymbol = symbolName('goforward.10', 'forward_10');
const sendSymbol = symbolName('paperplane.fill', 'send');
const flameSymbol = symbolName('flame.fill', 'local_fire_department');
const questionSymbol = symbolName('questionmark.circle', 'help');

const waveformBars = [18, 29, 44, 54, 42, 62, 38, 58, 49, 68, 35, 76, 52, 64, 47, 72, 40, 58, 50, 80, 44, 66, 55, 70, 36, 58, 45, 78, 50, 64, 43, 61, 39, 55, 47, 74, 42, 60, 48, 67, 38, 53, 46, 63, 41, 58, 44, 72, 49, 66, 37, 54, 45, 60, 42, 57, 36, 51, 44, 62, 40, 56, 34, 48, 43, 59, 39, 52, 32, 46, 41, 55, 36, 50, 30, 43, 38, 51, 35, 47, 31, 45, 34, 49, 32, 44, 30, 40];

const outlineItems: TimelineItem[] = [
  { title: 'Introduction', time: '0:00 - 2:10', active: true },
  { title: 'Campus Facilities', time: '2:10 - 8:45', done: true },
  { title: 'Library Services', time: '8:45 - 15:30', done: true },
  { title: 'Student Support', time: '15:30 - 20:30' },
  { title: 'Health & Wellness', time: '20:30 - 24:35' },
];

const questionNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const answerOptions: AnswerOption[] = [
  { key: 'A', text: 'Visit the library front desk' },
  { key: 'B', text: 'Use the online booking system', selected: true },
  { key: 'C', text: 'Call the IT help desk' },
  { key: 'D', text: 'Email the student center' },
];

const statItems: MetricItem[] = [
  { value: '24:35', label: 'Total Duration', color: '#8b5cf6', icon: headphonesSymbol },
  { value: '10:28', label: 'Time Listened', color: studentTokens.orange, icon: volumeSymbol },
  { value: '43%', label: 'Completed', color: studentTokens.teal, icon: checkSymbol },
  { value: '12', label: 'Notes Taken', color: studentTokens.blue, icon: noteSymbol },
];
type ListeningSearchParams = Partial<Record<'task' | 'subskill' | 'difficulty' | 'length' | 'mode', string | string[]>>;

type ListeningPracticeContext = {
  selection: ListeningSelection;
  meta: string;
  subtitle: string;
  rules: string[];
};

function resolveListeningPracticeContext(params: ListeningSearchParams): ListeningPracticeContext {
  const selection = getListeningSelectionFromParams(params);
  const task = getListeningTaskTypeById(selection.taskTypeId);
  const subskill = getListeningSubskillById(selection.subskillId);
  const difficulty = getListeningDifficultyById(selection.difficultyId);
  const length = getListeningLengthById(selection.lengthId);
  const examMode = selection.sessionMode === 'exam';

  return {
    selection,
    meta: `${task.title} - ${subskill.title} - ${length.title}`,
    subtitle: `${difficulty.title} difficulty. ${examMode ? 'Exam mode keeps feedback and transcript limited until submission.' : 'Practice mode keeps replay, notes, and explanation available.'}`,
    rules: examMode
      ? ['Feedback hidden until the end', 'Transcript restricted during questions', 'Timer follows section pacing']
      : ['Replay is available', 'Notes stay visible while answering', 'Explanation can appear after each response'],
  };
}

function PageHeader({ compact, context }: { compact: boolean; context: ListeningPracticeContext }) {
  const router = useRouter();

  return (
    <View style={styles.headerStack}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/listening' as Href)} style={({ pressed }) => [styles.backLink, pressed ? styles.pressed : null]}>
        <SymbolView name={backSymbol} tintColor="#6e778b" size={13} style={styles.backIcon} />
        <Text style={styles.backText}>Back to Listening</Text>
      </Pressable>

      <View style={[styles.headerRow, compact ? styles.headerRowCompact : null]}>
        <View style={styles.titleCopy}>
          <Text style={styles.pageTitle}>Listening Practice</Text>
          <Text style={styles.pageMeta}>{context.meta}</Text>
          <Text style={styles.pageSubtitle}>{context.subtitle}</Text>
        </View>
        <View style={[styles.headerActions, compact ? styles.headerActionsCompact : null]}>
          <Button label="Lecture Resources" size="sm" variant="secondary" left={<SymbolView name={documentSymbol} tintColor={studentTokens.navy} size={14} style={styles.buttonIcon} />} style={[styles.headerButton, compact ? styles.headerButtonCompact : null]} />
          <Button label="Mark as Complete" size="sm" variant="soft" left={<SymbolView name={checkSymbol} tintColor={studentTokens.teal} size={14} style={styles.buttonIcon} />} style={[styles.headerButton, compact ? styles.headerButtonCompact : null]} />
        </View>
      </View>
    </View>
  );
}

function Waveform({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.waveformWrap, compact ? styles.waveformWrapCompact : null]}>
      {waveformBars.map((height, index) => {
        const active = index < 30;
        const barHeight = compact ? Math.max(16, Math.round(height * 0.72)) : height;
        return <View key={`${height}-${index}`} style={[styles.waveBar, { height: barHeight, backgroundColor: active ? studentTokens.yellow : '#32486f', opacity: active ? 1 : 0.78 }]} />;
      })}
      <View style={styles.waveMarker}>
        <View style={styles.markerPill}><Text style={styles.markerText}>08:47</Text></View>
      </View>
    </View>
  );
}

function PlayerIconButton({ icon, label }: { icon: AppSymbolName; label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.controlButton, pressed ? styles.pressed : null]}>
      <SymbolView name={icon} tintColor="#d8e3ff" size={19} style={styles.controlIcon} />
    </Pressable>
  );
}
function AudioPlayer({ compact }: { compact: boolean }) {
  return (
    <Card style={[styles.playerCard, compact ? styles.playerCardCompact : null]} contentStyle={[styles.playerBody, compact ? styles.playerBodyCompact : null]}>
      <View style={[styles.playerTopRow, compact ? styles.playerTopRowCompact : null]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Pause audio" style={({ pressed }) => [styles.pauseCircle, pressed ? styles.pressed : null]}>
          <SymbolView name={pauseSymbol} tintColor="#ffffff" size={24} style={styles.pauseIcon} />
        </Pressable>
        <Waveform compact={compact} />
      </View>
      <View style={styles.playerProgressRow}>
        <Text style={styles.playerTime}>08:47 / 24:35</Text>
        <View style={styles.playerTrack}><View style={styles.playerFill} /></View>
      </View>
      <View style={[styles.playerControls, compact ? styles.playerControlsCompact : null]}>
        <PlayerIconButton icon={replaySymbol} label="Replay 10 seconds" />
        <PlayerIconButton icon={forwardSymbol} label="Forward 10 seconds" />
        <View style={styles.controlDivider} />
        <Text style={styles.speedText}>1.0x</Text>
        <Text style={styles.speedLabel}>Speed</Text>
        <View style={styles.controlDivider} />
        <PlayerIconButton icon={volumeSymbol} label="Volume" />
        <View style={styles.volumeTrack}><View style={styles.volumeFill} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Fullscreen" style={({ pressed }) => [styles.fullscreenButton, pressed ? styles.pressed : null]}>
          <SymbolView name={fullscreenSymbol} tintColor="#d8e3ff" size={19} style={styles.fullscreenIcon} />
        </Pressable>
      </View>
    </Card>
  );
}

function NotesPanel() {
  return (
    <Card style={styles.practiceCard} contentStyle={styles.notesBody}>
      <View style={styles.cardHeadRow}>
        <View style={styles.cardTitleGroup}>
          <SymbolView name={noteSymbol} tintColor={studentTokens.blue} size={17} style={styles.cardTitleIcon} />
          <Text style={styles.cardTitle}>NOTE TAKING</Text>
        </View>
        <View style={styles.savedRow}>
          <SymbolView name={checkSymbol} tintColor={studentTokens.teal} size={12} style={styles.savedIcon} />
          <Text style={styles.savedText}>Saved automatically</Text>
          <SymbolView name={moreSymbol} tintColor={studentTokens.text} size={16} style={styles.moreIcon} />
        </View>
      </View>

      <View style={styles.noteToolbar}>
        {['B', 'I', 'U'].map((item) => <Text key={item} style={styles.noteToolbarText}>{item}</Text>)}
        <View style={styles.noteToolbarDivider} />
        <Text style={styles.noteToolbarText}>-</Text>
        <Text style={styles.noteToolbarText}>=</Text>
        <Text style={styles.noteToolbarText}>link</Text>
        <Pressable accessibilityRole="button" style={styles.clearButton}><Text style={styles.clearText}>Clear</Text></Pressable>
      </View>

      <View style={styles.paperArea}>
        <View style={styles.paperMargin} />
        <View style={styles.paperLines}>
          <Text style={styles.noteLine}>Key points about campus facilities:</Text>
          <Text style={styles.noteLine}>- Library open 24/7 during exam period</Text>
          <Text style={styles.noteLine}>- Group study rooms can be booked online</Text>
          <Text style={styles.noteLine}>- IT help desk on 2nd floor</Text>
          <Text style={styles.noteLine}>- Printing: $0.10 per page (black & white)</Text>
          <Text style={styles.noteLine}>- Student ID required for all services</Text>
          <Text style={styles.noteLineMuted}>Helpful tip: Download the campus app!</Text>
        </View>
      </View>
      <View style={styles.notesFooter}>
        <Text style={styles.footerText}>124 words</Text>
        <Text style={styles.footerText}>Last edited: Today, 10:15 AM</Text>
      </View>
    </Card>
  );
}

function QuestionNavigator() {
  return (
    <View style={styles.navigatorRow}>
      {questionNumbers.map((item, index) => {
        const answered = index < 2;
        const active = item === '3';
        return (
          <View key={item} style={[styles.navigatorItem, answered ? styles.navigatorAnswered : null, active ? styles.navigatorActive : null]}>
            <Text style={[styles.navigatorText, active ? styles.navigatorTextActive : null]}>{item}</Text>
          </View>
        );
      })}
      <SymbolView name={arrowSymbol} tintColor="#7a8398" size={12} style={styles.navigatorArrow} />
    </View>
  );
}

function AnswerRow({ item }: { item: AnswerOption }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: Boolean(item.selected) }} style={({ pressed }) => [styles.answerRow, item.selected ? styles.answerSelected : null, pressed ? styles.pressed : null]}>
      <View style={[styles.answerLetter, item.selected ? styles.answerLetterSelected : null]}>
        <Text style={[styles.answerLetterText, item.selected ? styles.answerLetterTextSelected : null]}>{item.key}</Text>
      </View>
      <Text style={[styles.answerText, item.selected ? styles.answerTextSelected : null]}>{item.text}</Text>
    </Pressable>
  );
}

function QuestionsPanel({ compact, context }: { compact: boolean; context: ListeningPracticeContext }) {
  return (
    <Card style={styles.practiceCard} contentStyle={styles.questionBody}>
      <View style={styles.cardHeadRow}>
        <View>
          <Text style={styles.cardLabelOrange}>QUESTIONS</Text>
          <Text style={styles.questionProgress}>Question 3 of 10</Text>
        </View>
        <View style={styles.timeLimitPill}>
          <SymbolView name={clockSymbol} tintColor={studentTokens.orange} size={13} style={styles.timeIcon} />
          <View>
            <Text style={styles.timeText}>19:42</Text>
            <Text style={styles.timeLabel}>Time Left</Text>
          </View>
        </View>
        {!compact ? <SymbolView name={moreSymbol} tintColor={studentTokens.text} size={16} style={styles.moreIcon} /> : null}
      </View>
      <QuestionNavigator />
      <Text style={styles.questionText}>According to the lecture, what can students do to book group study rooms?</Text>
      <View style={styles.answerList}>
        {answerOptions.map((item) => <AnswerRow key={item.key} item={item} />)}
      </View>
      <View style={[styles.modeNotice, context.selection.sessionMode === 'exam' ? styles.modeNoticeExam : null]}>
        <Text style={styles.modeNoticeText}>{context.selection.sessionMode === 'exam' ? 'Exam mode: feedback and transcript stay hidden until submission.' : 'Practice mode: explanation can appear after your answer.'}</Text>
      </View>
      <View style={[styles.questionActions, compact ? styles.questionActionsCompact : null]}>
        <Button label="Back" size="sm" variant="secondary" style={[styles.backButton, compact ? styles.actionButtonCompact : null]} />
        <Button label="Submit Answer" size="sm" variant="secondary" left={<SymbolView name={sendSymbol} tintColor={studentTokens.orange} size={14} style={styles.buttonIcon} />} style={[styles.submitButton, compact ? styles.actionButtonCompact : null]} />
        <Button label="Next" size="sm" variant="ghost" right={<SymbolView name={arrowSymbol} tintColor="#ffffff" size={13} style={styles.buttonIcon} />} style={[styles.nextButton, compact ? styles.actionButtonCompact : null]} textStyle={styles.nextButtonText} />
      </View>
    </Card>
  );
}

function OutlinePanel({ compact }: { compact: boolean }) {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <Card style={styles.sideCard} contentStyle={styles.sideBody}>
      <View style={styles.outlineHead}>
        <Text style={styles.cardLabelOrange}>LECTURE OUTLINE & KEY TOPICS</Text>
        {compact ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Toggle lecture outline" onPress={() => setExpanded((value) => !value)} style={({ pressed }) => [styles.outlineToggle, pressed ? styles.pressed : null]}>
            <Text style={styles.outlineToggleText}>{expanded ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>
      {expanded ? (
        <>
          <View style={styles.timelineList}>
            {outlineItems.map((item) => (
              <View key={item.title} style={[styles.timelineRow, item.active ? styles.timelineRowActive : null]}>
                <View style={[styles.timelineMarker, item.done ? styles.timelineDone : null, item.active ? styles.timelineActive : null]}>
                  {item.done ? <SymbolView name={checkSymbol} tintColor="#ffffff" size={10} style={styles.timelineCheck} /> : item.active ? <SymbolView name={playSymbol} tintColor="#ffffff" size={10} style={styles.timelineCheck} /> : null}
                </View>
                <View style={styles.timelineCopy}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
          <Button label="View Full Transcript" size="sm" variant="secondary" left={<SymbolView name={documentSymbol} tintColor={studentTokens.blue} size={14} style={styles.buttonIcon} />} right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.buttonIcon} />} style={styles.fullWidthButton} />
        </>
      ) : (
        <Text style={styles.collapsedOutlineText}>Outline is collapsed on mobile. Open it when you need topic timing or transcript access.</Text>
      )}
    </Card>
  );
}
function StatBox({ item }: { item: MetricItem }) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIconBox, { backgroundColor: `${item.color}16` }]}>
        <SymbolView name={item.icon} tintColor={item.color} size={18} style={styles.statIcon} />
      </View>
      <View style={styles.statCopy}>
        <Text style={styles.statValue}>{item.value}</Text>
        <Text style={styles.statLabel}>{item.label}</Text>
      </View>
    </View>
  );
}

function StatsPanel() {
  return (
    <Card style={styles.sideCard} contentStyle={styles.sideBody}>
      <Text style={styles.cardLabelOrange}>LECTURE STATS</Text>
      <View style={styles.statsGrid}>
        {statItems.map((item) => <StatBox key={item.label} item={item} />)}
      </View>
    </Card>
  );
}

function StudyTipPanel() {
  return (
    <Card style={styles.tipCard} contentStyle={styles.tipBody}>
      <View style={styles.tipHead}>
        <View style={styles.tipIconBox}>
          <SymbolView name={questionSymbol} tintColor={studentTokens.blue} size={17} style={styles.tipIcon} />
        </View>
        <Text style={styles.tipTitle}>STUDY TIP</Text>
      </View>
      <Text style={styles.tipText}>Take notes using abbreviations and symbols to keep up with the lecture and improve recall later.</Text>
    </Card>
  );
}

function ScoreNudge() {
  return (
    <Card style={styles.nudgeCard} contentStyle={styles.nudgeBody}>
      <View style={styles.nudgeLeft}>
        <View style={styles.nudgeIconBox}>
          <SymbolView name={flameSymbol} tintColor={studentTokens.orange} size={18} style={styles.nudgeIcon} />
        </View>
        <View style={styles.nudgeCopy}>
          <Text style={styles.nudgeTitle}>Listening section momentum</Text>
          <Text style={styles.nudgeText}>You are 2 points away from 24/30 in Listening. Finish this set and review missed details.</Text>
        </View>
      </View>
      <Progress value={73} color={studentTokens.teal} style={styles.nudgeProgress} />
    </Card>
  );
}

function ModeBanner({ context }: { context: ListeningPracticeContext }) {
  return (
    <Card style={[styles.modeBanner, context.selection.sessionMode === 'exam' ? styles.modeBannerExam : null]} contentStyle={styles.modeBannerBody}>
      <View style={styles.modeBannerCopy}>
        <Text style={styles.cardLabelOrange}>{context.selection.sessionMode === 'exam' ? 'EXAM MODE' : 'PRACTICE MODE'}</Text>
        <Text style={styles.modeBannerTitle}>{context.selection.sessionMode === 'exam' ? 'Strict listening controls' : 'Guided listening controls'}</Text>
      </View>
      <View style={styles.ruleChipRow}>
        {context.rules.map((rule) => <View key={rule} style={styles.ruleChip}><Text style={styles.ruleChipText}>{rule}</Text></View>)}
      </View>
    </Card>
  );
}

function MobilePanelToggle({ value, onChange }: { value: 'notes' | 'questions'; onChange: (value: 'notes' | 'questions') => void }) {
  return (
    <View accessibilityRole="tablist" style={styles.mobilePanelTabs}>
      {(['notes', 'questions'] as const).map((item) => {
        const selected = value === item;
        return (
          <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(item)} style={({ pressed }) => [styles.mobilePanelTab, selected ? styles.mobilePanelTabActive : null, pressed ? styles.pressed : null]}>
            <Text style={[styles.mobilePanelTabText, selected ? styles.mobilePanelTabTextActive : null]}>{item === 'notes' ? 'Notes' : 'Questions'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
export function ListeningPractice() {
  const params = useLocalSearchParams<ListeningSearchParams>();
  const context = useMemo(() => resolveListeningPracticeContext(params), [params]);
  const { width } = useWindowDimensions();
  const isWide = width >= 1120;
  const isTablet = width >= 760;
  const isCompact = width < 620;
  const [mobilePanel, setMobilePanel] = useState<'notes' | 'questions'>('notes');

  return (
    <View testID="listening-practice-screen" style={styles.screen}>
      <PageHeader compact={isCompact} context={context} />
      <ModeBanner context={context} />
      <View style={[styles.mainGrid, isWide ? styles.mainGridWide : null]}>
        <View style={styles.mainColumn}>
          <AudioPlayer compact={isCompact} />
          {isCompact ? (
            <View style={styles.mobilePracticeStack}>
              <MobilePanelToggle value={mobilePanel} onChange={setMobilePanel} />
              {mobilePanel === 'notes' ? <NotesPanel /> : <QuestionsPanel compact context={context} />}
            </View>
          ) : (
            <View style={[styles.practiceGrid, isTablet ? styles.practiceGridWide : null]}>
              <NotesPanel />
              <QuestionsPanel compact={isCompact} context={context} />
            </View>
          )}
        </View>
        <View style={[styles.sideColumn, !isWide ? styles.sideColumnStacked : null]}>
          <OutlinePanel compact={isCompact} />
          <StatsPanel />
          <StudyTipPanel />
        </View>
      </View>
      <ScoreNudge />
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
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerRowCompact: { flexDirection: 'column', alignItems: 'stretch' },
  titleCopy: { flex: 1, minWidth: 0 },
  pageTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  pageMeta: { fontFamily: fontFamily, color: '#5f6980', fontSize: 10, lineHeight: 14, fontWeight: '700', marginTop: 3 },
  pageSubtitle: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 10, lineHeight: 14, fontWeight: '600', marginTop: 4 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, flexShrink: 0 },
  headerActionsCompact: { justifyContent: 'flex-start' },
  headerButton: { minHeight: 34, borderRadius: 8 },
  headerButtonCompact: { flex: 1, minWidth: 152 },
  mainGrid: { gap: 12 },
  mainGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  mainColumn: { flex: 1, minWidth: 0, gap: 10 },
  sideColumn: { width: 330, maxWidth: '100%', gap: 12, flexShrink: 0 },
  sideColumnStacked: { width: '100%' },
  playerCard: { padding: 0, borderRadius: 11, borderColor: '#061f55', backgroundColor: '#001b48', overflow: 'hidden', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  playerBody: { minHeight: 198, paddingHorizontal: 20, paddingVertical: 18, gap: 16 },
  playerTopRow: { flex: 1, minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 18 },
  pauseCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f15f21', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pauseIcon: { width: 24, height: 24 },
  waveformWrap: { flex: 1, minWidth: 0, minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: 3, position: 'relative' },
  waveBar: { width: 3, borderRadius: 999 },
  waveMarker: { position: 'absolute', left: '38%', top: 4, bottom: 13, width: 2, backgroundColor: studentTokens.yellowDeep },
  markerPill: { position: 'absolute', top: -14, left: -18, minWidth: 40, height: 18, borderRadius: 5, backgroundColor: studentTokens.yellow, alignItems: 'center', justifyContent: 'center' },
  markerText: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 8, lineHeight: 10, fontWeight: '700' },
  playerProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playerTime: { fontFamily: fontFamily, color: '#ffffff', fontSize: 10, lineHeight: 14, fontWeight: '700', flexShrink: 0 },
  playerTrack: { flex: 1, minWidth: 90, height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  playerFill: { width: '43%', height: '100%', borderRadius: 999, backgroundColor: studentTokens.yellow },
  playerControls: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 14 },
  controlIcon: { width: 19, height: 19, flexShrink: 0 },
  controlDivider: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.16)' },
  speedText: { fontFamily: fontFamily, color: '#ffffff', fontSize: 12, lineHeight: 15, fontWeight: '700' },
  speedLabel: { fontFamily: fontFamily, color: '#d8e3ff', fontSize: 7, lineHeight: 9, fontWeight: '700', marginLeft: -10, marginTop: 16 },
  volumeTrack: { width: 132, maxWidth: '24%', height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.24)', overflow: 'hidden' },
  volumeFill: { width: '48%', height: '100%', backgroundColor: studentTokens.yellow, borderRadius: 999 },
  fullscreenIcon: { width: 19, height: 19, marginLeft: 'auto' },
  practiceGrid: { gap: 10 },
  practiceGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  practiceCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', flex: 1, shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  notesBody: { padding: 14, gap: 10 },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  cardTitleIcon: { width: 17, height: 17 },
  cardTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  savedIcon: { width: 12, height: 12 },
  savedText: { fontFamily: fontFamily, color: studentTokens.teal, fontSize: 8, lineHeight: 11, fontWeight: '700' },
  moreIcon: { width: 16, height: 16 },
  noteToolbar: { minHeight: 32, borderRadius: 7, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: studentTokens.neutral, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10 },
  noteToolbarText: { fontFamily: fontFamily, color: '#42506b', fontSize: 10, lineHeight: 14, fontWeight: '700' },
  noteToolbarDivider: { width: 1, height: 18, backgroundColor: '#dfe4ee' },
  clearButton: { marginLeft: 'auto', minHeight: 22, borderRadius: 6, backgroundColor: studentTokens.surface, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontFamily: fontFamily, color: '#42506b', fontSize: 8, lineHeight: 11, fontWeight: '700' },
  paperArea: { minHeight: 246, borderRadius: 8, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: '#fffdf8', overflow: 'hidden', flexDirection: 'row' },
  paperMargin: { width: 18, borderRightWidth: 1, borderRightColor: '#ffb8b8', backgroundColor: '#fff8f2' },
  paperLines: { flex: 1, minWidth: 0, paddingHorizontal: 14, paddingTop: 14, gap: 8 },
  noteLine: { fontFamily: fontFamily, color: '#31405c', fontSize: 10, lineHeight: 15, fontWeight: '600' },
  noteLineMuted: { fontFamily: fontFamily, color: '#5f6980', fontSize: 10, lineHeight: 15, fontWeight: '600', marginTop: 10 },
  notesFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  footerText: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700' },
  questionBody: { padding: 14, gap: 10 },
  cardLabelOrange: { fontFamily: fontFamily, color: studentTokens.orange, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  questionProgress: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700', marginTop: 4 },
  timeLimitPill: { minHeight: 35, borderRadius: 9, backgroundColor: studentTokens.yellowSoft, borderWidth: 1, borderColor: '#f3dfa3', paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  timeIcon: { width: 13, height: 13 },
  timeText: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 11, lineHeight: 14, fontWeight: '700' },
  timeLabel: { fontFamily: fontFamily, color: '#6e778b', fontSize: 7, lineHeight: 9, fontWeight: '700' },
  navigatorRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  navigatorItem: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#e2e7f0', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  navigatorAnswered: { borderColor: '#c7eadf', backgroundColor: '#effbf6' },
  navigatorActive: { borderColor: studentTokens.navy, backgroundColor: studentTokens.navy },
  navigatorText: { fontFamily: fontFamily, color: '#5f6980', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  navigatorTextActive: { color: '#ffffff' },
  navigatorArrow: { width: 12, height: 12 },
  questionText: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  answerList: { gap: 8 },
  answerRow: { minHeight: 39, borderRadius: 8, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.surface, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 9, paddingVertical: 8 },
  answerSelected: { borderColor: '#f3c25f', backgroundColor: '#fff7e4' },
  answerLetter: { width: 21, height: 21, borderRadius: 11, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  answerLetterSelected: { backgroundColor: studentTokens.orange },
  answerLetterText: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  answerLetterTextSelected: { color: '#ffffff' },
  answerText: { fontFamily: fontFamily, flex: 1, minWidth: 0, color: '#4f5870', fontSize: 9, lineHeight: 14, fontWeight: '600' },
  answerTextSelected: { color: studentTokens.ink, fontWeight: '700' },
  questionActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  questionActionsCompact: { flexWrap: 'wrap' },
  backButton: { flex: 0.86, minHeight: 36, borderRadius: 7 },
  submitButton: { flex: 1.25, minHeight: 36, borderRadius: 7, backgroundColor: studentTokens.yellowSoft, borderColor: '#f3dfa3' },
  nextButton: { flex: 0.96, minHeight: 36, borderRadius: 7, backgroundColor: '#001b48', borderColor: '#001b48' },
  nextButtonText: { color: '#ffffff' },
  actionButtonCompact: { flex: 1, minWidth: 132 },
  buttonIcon: { width: 14, height: 14 },
  sideCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  sideBody: { padding: 13, gap: 11 },
  timelineList: { gap: 6 },
  timelineRow: { minHeight: 37, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  timelineRowActive: { backgroundColor: studentTokens.yellowSoft, borderWidth: 1, borderColor: '#f3c25f' },
  timelineMarker: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#c8d0df', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  timelineActive: { backgroundColor: studentTokens.orange, borderColor: studentTokens.orange },
  timelineDone: { backgroundColor: studentTokens.teal, borderColor: studentTokens.teal },
  timelineCheck: { width: 10, height: 10 },
  timelineCopy: { flex: 1, minWidth: 0 },
  timelineTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 13, fontWeight: '700' },
  timelineTime: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '600', marginTop: 1 },
  fullWidthButton: { width: '100%', minHeight: 33, borderRadius: 7 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  statBox: { flexGrow: 1, flexBasis: 132, minHeight: 64, borderRadius: 9, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: studentTokens.surface, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  statIconBox: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statIcon: { width: 18, height: 18 },
  statCopy: { flex: 1, minWidth: 0 },
  statValue: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  statLabel: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700', marginTop: 1 },
  tipCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', backgroundColor: '#fbfcff', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  tipBody: { padding: 13, gap: 9 },
  tipHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipIconBox: { width: 30, height: 30, borderRadius: 11, backgroundColor: studentTokens.blueSoft, alignItems: 'center', justifyContent: 'center' },
  tipIcon: { width: 17, height: 17 },
  tipTitle: { fontFamily: fontFamily, color: studentTokens.blue, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  tipText: { fontFamily: fontFamily, color: '#4f5870', fontSize: 10, lineHeight: 15, fontWeight: '600' },
  nudgeCard: { padding: 0, borderRadius: 11, borderColor: '#f3dfa3', backgroundColor: '#fffaf0', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  nudgeBody: { padding: 13, gap: 10 },
  nudgeLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nudgeIconBox: { width: 34, height: 34, borderRadius: 12, backgroundColor: studentTokens.orangeSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nudgeIcon: { width: 18, height: 18 },
  nudgeCopy: { flex: 1, minWidth: 0 },
  nudgeTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  nudgeText: { fontFamily: fontFamily, color: '#4f5870', fontSize: 9, lineHeight: 13, fontWeight: '600', marginTop: 2 },
  nudgeProgress: { maxWidth: 520 },
  playerCardCompact: { borderRadius: 10 },
  playerBodyCompact: { minHeight: 0, paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  playerTopRowCompact: { minHeight: 0, flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  waveformWrapCompact: { minHeight: 78, maxHeight: 84, overflow: 'hidden' },
  controlButton: { minWidth: 44, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  fullscreenButton: { minWidth: 44, minHeight: 44, borderRadius: 14, marginLeft: 'auto', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  playerControlsCompact: { minHeight: 44, flexWrap: 'wrap', gap: 8 },
  modeNotice: { borderRadius: 8, borderWidth: 1, borderColor: '#c7e8e3', backgroundColor: studentTokens.tealSoft, paddingHorizontal: 10, paddingVertical: 8 },
  modeNoticeExam: { borderColor: '#f3dfa3', backgroundColor: studentTokens.yellowSoft },
  modeNoticeText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 10, lineHeight: 15, fontWeight: '600' },
  outlineHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  outlineToggle: { minHeight: 34, borderRadius: 8, borderWidth: 1, borderColor: '#dce3ee', backgroundColor: studentTokens.surface, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  outlineToggleText: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  collapsedOutlineText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 11, lineHeight: 17, fontWeight: '500' },
  modeBanner: { padding: 0, borderRadius: 11, borderColor: '#c7e8e3', backgroundColor: '#f1fbf8', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  modeBannerExam: { borderColor: '#f3dfa3', backgroundColor: '#fffaf0' },
  modeBannerBody: { minHeight: 58, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  modeBannerCopy: { flex: 1, minWidth: 180, gap: 2 },
  modeBannerTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  ruleChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, flexShrink: 1 },
  ruleChip: { minHeight: 30, borderRadius: 999, borderWidth: 1, borderColor: '#dce3ee', backgroundColor: studentTokens.surface, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  ruleChipText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 10, lineHeight: 14, fontWeight: '600' },
  mobilePracticeStack: { gap: 10 },
  mobilePanelTabs: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#dce3ee', backgroundColor: studentTokens.surface, flexDirection: 'row', padding: 4, gap: 4 },
  mobilePanelTab: { flex: 1, minHeight: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  mobilePanelTabActive: { backgroundColor: '#001b48' },
  mobilePanelTabText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  mobilePanelTabTextActive: { color: '#ffffff' },
});
