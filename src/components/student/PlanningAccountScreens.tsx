import type { ReactNode } from 'react';
import { type Href, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button, Card, Progress, studentTokens } from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };
type Tone = 'blue' | 'teal' | 'orange' | 'purple' | 'yellow' | 'navy' | 'green' | 'danger';
type Metric = { label: string; value: string; sub: string; tone: Tone; icon: AppSymbolName; progress: number };

const fontFamily = 'Quicksand';
const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });

const backSymbol = symbolName('arrow.left', 'arrow_back');
const addSymbol = symbolName('plus', 'add');
const checkSymbol = symbolName('checkmark', 'check');
const closeSymbol = symbolName('xmark', 'close');
const targetSymbol = symbolName('target', 'track_changes');
const calendarSymbol = symbolName('calendar', 'calendar_month');
const timerSymbol = symbolName('timer', 'timer');
const flameSymbol = symbolName('flame.fill', 'local_fire_department');
const starSymbol = symbolName('star.fill', 'star');
const searchSymbol = symbolName('magnifyingglass', 'search');
const videoSymbol = symbolName('play.rectangle', 'smart_display');
const practiceSymbol = symbolName('bolt.fill', 'bolt');
const progressSymbol = symbolName('chart.line.uptrend.xyaxis', 'show_chart');

const toneColor: Record<Tone, string> = {
  blue: studentTokens.blue,
  teal: studentTokens.teal,
  orange: studentTokens.orange,
  purple: '#8b5cf6',
  yellow: studentTokens.yellowDeep,
  navy: '#001b48',
  green: '#16a34a',
  danger: '#e24a3b',
};

const toneSoft: Record<Tone, string> = {
  blue: studentTokens.blueSoft,
  teal: studentTokens.tealSoft,
  orange: studentTokens.orangeSoft,
  purple: '#f0e9ff',
  yellow: studentTokens.yellowSoft,
  navy: '#edf2ff',
  green: '#e8f8ef',
  danger: '#fff0ec',
};

const studyMetrics: Metric[] = [
  { label: 'Target Score', value: '105', sub: 'Current estimate: 87', tone: 'blue', icon: targetSymbol, progress: 88 },
  { label: 'Exam Date', value: 'Aug 20', sub: '78 days remaining', tone: 'orange', icon: calendarSymbol, progress: 64 },
  { label: 'Weekly Study Goal', value: '5h 30m', sub: '3h 45m planned', tone: 'teal', icon: timerSymbol, progress: 68 },
  { label: 'This Week', value: '8 / 12', sub: '67% completed', tone: 'navy', icon: checkSymbol, progress: 67 },
];

const activityMetrics: Metric[] = [
  { label: 'Study Time', value: '24h 35m', sub: 'Last 30 days', tone: 'teal', icon: timerSymbol, progress: 72 },
  { label: 'Activities', value: '86', sub: '28 lessons - 19 tests', tone: 'blue', icon: checkSymbol, progress: 68 },
  { label: 'Active Days', value: '23 / 30', sub: '7-day current streak', tone: 'orange', icon: flameSymbol, progress: 77 },
  { label: 'Most Active Skill', value: 'Reading', sub: '9h 12m', tone: 'navy', icon: starSymbol, progress: 82 },
];

const todaysPlan = [
  ['Main Idea Practice Set 04', 'Reading', '20 min', 'Done', 'green'],
  ['Academic Words Set 13', 'Vocabulary', '15 min', 'Done', 'green'],
  ['Lecture 04 - Note Taking', 'Listening', '25 min', 'Next', 'yellow'],
  ['Speaking Task 02', 'Speaking', '15 min', 'Planned', 'blue'],
];

const activities = [
  ['R', 'Reading Practice - Main Idea Set 3', 'Today, 09:30 AM - 20 min', '10 questions - 9 answered - 1 flagged', '88% accuracy', 'green'],
  ['L', 'Listening - Lecture 03: Note Taking', 'Yesterday, 08:15 PM - 25 min', 'Notes saved - resumed from 18:42', '72% complete', 'blue'],
  ['V', 'Vocabulary Review - Academic Words Set 12', 'Yesterday, 06:40 PM - 15 min', '20 words reviewed - 2 marked difficult', '18 mastered', 'green'],
  ['T', 'Mock Test 03', 'May 30, 02:10 PM - 1h 53m', 'Reading 24 - Listening 22 - Speaking 23 - Writing 25', '94 / 120', 'yellow'],
  ['W', 'Writing Task 04 - Integrated', 'May 29, 08:12 PM - 30 min', '312 words - Draft submitted', 'Feedback ready', 'purple'],
];

const monthDays = Array.from({ length: 30 }, (_, index) => index + 1);
const heatLevels = [1, 0, 2, 3, 1, 0, 2, 4, 1, 3, 2, 0, 4, 1, 2, 3, 1, 0, 2, 3, 4, 1, 2, 0, 3, 2, 1, 4, 2, 3, 1, 2, 4, 0, 3, 2, 1, 2, 3, 4, 1, 0, 2, 3, 1, 4, 2, 3, 1, 2, 4, 0, 3, 2, 1, 4, 3, 2, 1, 3];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? 'A'}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

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

function MiniBadge({ label, tone = 'blue' }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.miniBadge, { backgroundColor: toneSoft[tone], borderColor: `${toneColor[tone]}33` }]}>
      <Text style={[styles.miniBadgeText, { color: toneColor[tone] }]}>{label}</Text>
    </View>
  );
}

function HeaderButton({ label, icon, dark = false, onPress }: { label: string; icon?: AppSymbolName; dark?: boolean; onPress?: () => void }) {
  return (
    <Button
      label={label}
      size="sm"
      onPress={onPress}
      variant={dark ? 'ghost' : 'secondary'}
      left={icon ? <SymbolView name={icon} tintColor={dark ? '#ffffff' : studentTokens.navy} size={14} style={styles.tinyIcon} /> : undefined}
      style={[styles.headerButton, dark ? styles.navyButton : null]}
      textStyle={dark ? styles.whiteText : styles.headerButtonText}
    />
  );
}

function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{right}</View>;
}

function SearchBox({ placeholder }: { placeholder: string }) {
  return <View style={styles.searchBox}><SymbolView name={searchSymbol} tintColor="#8790a4" size={14} style={styles.tinyIcon} /><Text style={styles.searchText}>{placeholder}</Text></View>;
}

function PillTabs({ items, active = 0 }: { items: string[]; active?: number }) {
  return <View style={styles.pillTabs}>{items.map((item, index) => <View key={item} style={[styles.pillTab, index === active ? styles.pillTabActive : null]}><Text style={[styles.pillText, index === active ? styles.pillTextActive : null]}>{item}</Text></View>)}</View>;
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function Field({ label, value }: { label: string; value: string }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.fieldBox}><Text style={styles.fieldText}>{value}</Text></View></View>;
}

function CalendarMonth() {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const plans: Record<number, { text: string; tone: Tone }> = {
    2: { text: 'Reading - 20m', tone: 'blue' },
    3: { text: 'Listening - 25m', tone: 'green' },
    5: { text: 'Speaking - 15m', tone: 'purple' },
    9: { text: 'Reading - 20m', tone: 'blue' },
    10: { text: 'Listening - 25m', tone: 'green' },
    12: { text: 'Speaking - 15m', tone: 'purple' },
    16: { text: 'Reading - 20m', tone: 'blue' },
    17: { text: 'Listening - 25m', tone: 'green' },
    19: { text: 'Speaking - 15m', tone: 'purple' },
    23: { text: 'Reading - 20m', tone: 'blue' },
    24: { text: 'Listening - 25m', tone: 'green' },
    26: { text: 'Speaking - 15m', tone: 'purple' },
    30: { text: 'Reading - 20m', tone: 'blue' },
  };

  if (compact) {
    return (
      <View style={styles.agendaList}>
        {Object.entries(plans).map(([day, plan]) => (
          <View key={day} style={styles.agendaItem}>
            <View style={styles.agendaDate}>
              <Text style={styles.dayNumber}>{day}</Text>
              <Text style={styles.agendaMonth}>Jun</Text>
            </View>
            <View style={[styles.eventPill, styles.agendaPill, { backgroundColor: toneSoft[plan.tone] }]}>
              <Text style={[styles.eventText, { color: toneColor[plan.tone] }]}>{plan.text}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.calendarGrid}>
      {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => <Text key={day} style={styles.calendarHead}>{day}</Text>)}
      {monthDays.map((day) => {
        const plan = plans[day];
        return (
          <View key={day} style={styles.dayCell}>
            <Text style={styles.dayNumber}>{day}</Text>
            {plan ? <View style={[styles.eventPill, { backgroundColor: toneSoft[plan.tone] }]}><Text style={[styles.eventText, { color: toneColor[plan.tone] }]}>{plan.text}</Text></View> : null}
          </View>
        );
      })}
    </View>
  );
}

function PlanTable() {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  if (compact) {
    return <View style={styles.mobileList}>{todaysPlan.map(([task, skill, time, status, tone]) => <View key={task} style={styles.mobileItem}><View style={styles.mobileTopRow}><View style={styles.mobileTitleGroup}><Text style={styles.rowTitle}>{task}</Text><Text style={styles.rowSub}>{skill} - {time}</Text></View><MiniBadge label={status} tone={tone as Tone} /></View><HeaderButton label={status === 'Done' ? 'Review' : 'Start'} /></View>)}</View>;
  }
  return (
    <View style={styles.table}>
      <View style={styles.tableHead}>{['TASK', 'SKILL', 'ESTIMATED', 'STATUS', ''].map((item) => <Text key={item || 'action'} style={styles.tableHeadText}>{item}</Text>)}</View>
      {todaysPlan.map(([task, skill, time, status, tone]) => <View key={task} style={styles.tableRow}><Text style={[styles.cellText, styles.nameCell]}>{task}</Text><Text style={styles.cellText}>{skill}</Text><Text style={styles.cellText}>{time}</Text><MiniBadge label={status} tone={tone as Tone} /><Text style={styles.linkText}>{status === 'Done' ? 'Review' : 'Start'}</Text></View>)}
    </View>
  );
}

export function StudyPlanPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 1040;

  return (
    <View testID="study-plan-screen" style={styles.screen}>
      <PageHeader title="Study Plan" subtitle="Turn your target score and exam date into a practical daily and weekly roadmap." right={<><HeaderButton label="Week View" /><HeaderButton label="Add Task" icon={addSymbol} dark /></>} />
      <MetricGrid items={studyMetrics} />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <Card style={styles.panelCard} contentStyle={styles.panelBody}>
            <SectionHeader title="June 2026" right={<View style={styles.smallNav}><HeaderButton label="‹" /><HeaderButton label="Today" /><HeaderButton label="›" /></View>} />
            <CalendarMonth />
          </Card>
          <Card style={styles.panelCard} contentStyle={styles.panelBody}>
            <SectionHeader title="Today's Plan" right={<MiniBadge label="2 / 4 completed" tone="green" />} />
            <PlanTable />
          </Card>
        </View>
        <View style={styles.sideColumn}>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>PERSONALIZATION</Text>
            <InfoRow label="Plan intensity" value="Moderate" />
            <InfoRow label="Priority skill" value="Speaking" />
            <InfoRow label="Daily availability" value="45-60 min" />
            <Text style={styles.sideText}>Your plan prioritizes Speaking and Writing because they have the largest target gap.</Text>
            <Button label="Edit Preferences" size="sm" variant="secondary" style={styles.fullButton} />
          </Card>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>WEEKLY SKILL MIX</Text>
            <BarRow label="Reading" value={25} />
            <BarRow label="Listening" value={30} />
            <BarRow label="Speaking" value={30} />
            <BarRow label="Writing" value={15} />
          </Card>
          <View style={styles.noticeBox}><Text style={styles.noticeText}>Premium personalized plan: automatically adjusts weekly based on recent mock and practice data.</Text></View>
        </View>
      </View>
    </View>
  );
}

function Heatmap() {
  return <View style={styles.heatmapGrid}>{heatLevels.map((level, index) => <View key={String(index)} style={[styles.heatCell, level === 0 ? styles.heatEmpty : { backgroundColor: `rgba(0, 125, 115, ${0.15 + level * 0.18})` }]} />)}</View>;
}

export function ActivityHistoryPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 1040;
  const tablet = width >= 720;

  return (
    <View testID="activity-history-screen" style={styles.screen}>
      <PageHeader title="Activity History" subtitle="A complete timeline of lessons, practice, tests, reviews, and learning outcomes." right={<HeaderButton label="Filters" />} />
      <MetricGrid items={activityMetrics} />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <Card style={styles.panelCard} contentStyle={styles.panelBody}>
            <View style={[styles.filterLine, !tablet ? styles.filterLineStack : null]}><SearchBox placeholder="Search activity..." /><PillTabs items={['All', 'Lessons', 'Practice', 'Tests', 'Reviews', 'May 01-30']} /></View>
            <View style={styles.timeline}>{activities.map(([letter, title, time, detail, badge, tone], index) => <View key={title} style={styles.timelineRow}><View style={styles.timelineTrack}>{index < activities.length - 1 ? <View style={styles.timelineLine} /> : null}<View style={styles.timelineBubble}><Text style={styles.timelineLetter}>{letter}</Text></View></View><View style={styles.timelineCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowSub}>{time}</Text><Text style={styles.detailText}>{detail}</Text></View><MiniBadge label={badge} tone={tone as Tone} /></View>)}</View>
          </Card>
        </View>
        <View style={styles.sideColumn}>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>ACTIVITY BREAKDOWN</Text>
            <BarRow label="Lessons" value={28} suffix="" />
            <BarRow label="Practice" value={34} suffix="" />
            <BarRow label="Tests" value={19} suffix="" />
            <BarRow label="Reviews" value={5} suffix="" />
          </Card>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}>
            <Text style={styles.orangeLabel}>CONSISTENCY</Text>
            <Heatmap />
            <Text style={styles.sideText}>You studied on 23 of the last 30 days.</Text>
          </Card>
          <Button label="Export Activity CSV" size="sm" variant="secondary" style={styles.fullButton} />
        </View>
      </View>
    </View>
  );
}

function ProfileHero({ user }: { user: AuthUser }) {
  return (
    <Card style={styles.panelCard} contentStyle={styles.profileHeroBody}>
      <View style={styles.avatarLarge}><Text style={styles.avatarLargeText}>{initials(user.name)}</Text></View>
      <View style={styles.profileHeroCopy}>
        <Text style={styles.heroTitle}>{user.name}</Text>
        <Text style={styles.heroText}>{user.email}</Text>
        <View style={styles.badgeLine}><MiniBadge label={user.plan === 'premium' ? 'Premium Plan' : 'Free Plan'} tone={user.plan === 'premium' ? 'yellow' : 'blue'} />{user.emailVerified ? <MiniBadge label="Email verified" tone="green" /> : <MiniBadge label="Email pending" tone="orange" />}</View>
      </View>
      <HeaderButton label="Change Photo" />
    </Card>
  );
}

export function ProfilePage({ user }: { user: AuthUser }) {
  const { width } = useWindowDimensions();
  const wide = width >= 1040;

  return (
    <View testID="profile-screen" style={styles.screen}>
      <PageHeader title="Profile" subtitle="Manage your personal details, exam goal, and learning preferences." />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <ProfileHero user={user} />
          <Card style={styles.panelCard} contentStyle={styles.panelBody}>
            <PillTabs items={['Profile', 'Learning Preferences', 'Exam Goal']} />
            <View style={styles.formGrid}>
              <Field label="Full Name" value={user.name} />
              <Field label="Email" value={user.email} />
              <Field label="Timezone" value="Europe/Istanbul (UTC+3)" />
              <Field label="Interface Language" value="English" />
              <Field label="Target Exam Date" value="20 August 2026" />
              <Field label="Target TOEFL Score" value={user.goal || '105 / 120'} />
            </View>
            <View style={styles.footerLine}><Text style={styles.helperText}>Changes are saved to your account and study plan.</Text><Button label="Save Changes" size="sm" variant="ghost" style={styles.navyButton} textStyle={styles.whiteText} /></View>
          </Card>
          <Card style={styles.panelCard} contentStyle={styles.panelBody}>
            <Text style={styles.orangeLabel}>LEARNING PREFERENCES</Text>
            <View style={styles.threeFieldGrid}><Field label="Preferred study time" value="Evening" /><Field label="Daily study goal" value="45-60 minutes" /><Field label="Weekly study days" value="5 days" /></View>
          </Card>
        </View>
        <View style={styles.sideColumn}>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}><Text style={styles.orangeLabel}>GOAL SUMMARY</Text><InfoRow label="Estimated TOEFL" value="87 / 120" /><InfoRow label="Target" value="105 / 120" /><InfoRow label="Gap" value="18 points" /><Progress value={88} color={studentTokens.yellow} /><Button label="Review Study Plan" size="sm" style={styles.fullButton} /></Card>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}><Text style={styles.orangeLabel}>ACCOUNT STATUS</Text><InfoRow label="Member since" value="Apr 2026" /><InfoRow label="Plan" value={user.plan === 'premium' ? 'Premium' : 'Free'} /><InfoRow label="Last login" value="Today, 11:23" /></Card>
          <View style={styles.noticeBox}><Text style={styles.noticeText}>Privacy: your learning preferences are used only to personalize study planning and recommendations.</Text></View>
        </View>
      </View>
    </View>
  );
}

function ToggleRow({ title, text, on = true }: { title: string; text: string; on?: boolean }) {
  return <View style={styles.toggleRow}><View style={styles.toggleCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowSub}>{text}</Text></View><View style={[styles.toggle, on ? styles.toggleOn : styles.toggleOff]}><View style={[styles.toggleKnob, on ? styles.toggleKnobOn : null]} /></View></View>;
}

export function SettingsPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 1040;

  return (
    <View testID="settings-screen" style={styles.screen}>
      <PageHeader title="Settings" subtitle="Control account behavior, notifications, accessibility, privacy, and security." />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <Card style={styles.panelCard} contentStyle={styles.panelBody}>
            <PillTabs items={['Account', 'Notifications', 'Accessibility', 'Privacy', 'Security']} />
            <Text style={styles.sectionTitle}>Account Preferences</Text>
            <View style={styles.formGrid}><Field label="Interface Language" value="English" /><Field label="Timezone" value="Europe/Istanbul (UTC+3)" /></View>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Learning Notifications</Text>
            <ToggleRow title="Daily study reminder" text="Remind me about today's plan." />
            <ToggleRow title="Feedback ready" text="Notify me when Speaking/Writing feedback is available." />
            <ToggleRow title="Weekly progress summary" text="Send a weekly learning report." />
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Accessibility</Text>
            <ToggleRow title="Reduced motion" text="Minimize non-essential animations." on={false} />
            <ToggleRow title="High contrast focus indicators" text="Strengthen keyboard focus visibility." />
            <View style={styles.footerLine}><Text style={styles.helperText}>Changes apply across the student application.</Text><Button label="Save Preferences" size="sm" variant="ghost" style={styles.navyButton} textStyle={styles.whiteText} /></View>
          </Card>
        </View>
        <View style={styles.sideColumn}>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}><Text style={styles.orangeLabel}>SECURITY</Text><InfoRow label="Password" value="••••••••••" /><Button label="Change Password" size="sm" variant="secondary" style={styles.fullButton} /><View style={styles.divider} /><InfoRow label="Active sessions" value="2" /><Button label="Manage Sessions" size="sm" variant="secondary" style={styles.fullButton} /></Card>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}><Text style={styles.orangeLabel}>PRIVACY</Text><InfoRow label="Learning analytics" value="Enabled" /><Text style={styles.sideText}>Used to power progress charts and personalized recommendations.</Text><Button label="Privacy Controls" size="sm" variant="secondary" style={styles.fullButton} /></Card>
          <Card style={styles.dangerCard} contentStyle={styles.sideBody}><Text style={styles.dangerTitle}>Account deletion</Text><Text style={styles.sideText}>Permanently delete your account and associated learning data.</Text><Button label="Delete Account" size="sm" variant="secondary" style={styles.deleteButton} /></Card>
        </View>
      </View>
    </View>
  );
}

function BenefitRow({ text }: { text: string }) {
  return <View style={styles.benefitRow}><SymbolView name={checkSymbol} tintColor={studentTokens.navy} size={13} style={styles.tinyIcon} /><Text style={styles.benefitText}>{text}</Text></View>;
}

export function SubscriptionPage({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 1040;

  return (
    <View testID="subscription-screen" style={styles.screen}>
      <PageHeader title="Subscription" subtitle="See your current plan, access level, upgrade options, and payment history." />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <Card style={styles.planHero} contentStyle={styles.planHeroBody}>
            <View style={styles.planHeroCopy}><Text style={styles.orangeLabel}>CURRENT PLAN</Text><Text style={styles.planTitle}>{user.plan === 'premium' ? 'Premium' : 'Free'}</Text><Text style={styles.planText}>Core learning access with selected lessons, limited practice, and basic progress.</Text><View style={styles.buttonLine}><Button label="Upgrade to Premium" size="sm" onPress={() => router.push('/account/unlock-premium' as Href)} /><Button label="Compare Plans" size="sm" variant="ghost" style={styles.darkGhostButton} textStyle={styles.whiteText} /></View></View>
            <View style={styles.priceBoxDark}><Text style={styles.priceDark}>$0</Text><Text style={styles.priceDarkSub}>forever</Text></View>
          </Card>
          <View style={styles.accessGrid}><AccessCard title="Video Access" value="Preview" text="First 5 min on premium lessons" /><AccessCard title="Mock Tests" value="1 Free" text="Selected mini/full access" /><AccessCard title="Analytics" value="Basic" text="Core score and activity trend" /></View>
          <PlanBenefits />
          <Card style={styles.panelCard} contentStyle={styles.panelBody}><Text style={styles.sectionTitle}>Payment History</Text><Text style={styles.sideText}>No payments yet. Upgrade to Premium to start a subscription.</Text></Card>
        </View>
        <View style={styles.sideColumn}>
          <Card style={styles.recommendedCard} contentStyle={styles.sideBody}><Text style={styles.orangeLabel}>RECOMMENDED</Text><Text style={styles.sideTitle}>Premium</Text><Text style={styles.priceLarge}>$12.99</Text><Text style={styles.sideText}>per month</Text><View style={styles.divider} />{['Full video library', 'Unlimited practice', 'Full mock tests', 'Advanced analytics', 'Personalized study plan', 'Detailed Speaking/Writing feedback'].map((item) => <BenefitRow key={item} text={item} />)}<Button label="Upgrade Now" size="sm" onPress={() => router.push('/account/checkout' as Href)} style={styles.fullButton} /></Card>
          <View style={styles.noticeBox}><Text style={styles.noticeText}>6-month option: save 25% with a longer billing period.</Text></View>
        </View>
      </View>
    </View>
  );
}

function AccessCard({ title, value, text }: { title: string; value: string; text: string }) {
  return <Card style={styles.accessCard} contentStyle={styles.accessBody}><Text style={styles.sideText}>{title}</Text><Text style={styles.accessValue}>{value}</Text><Text style={styles.metricSub}>{text}</Text></Card>;
}

function PlanBenefits() {
  const rows = [
    ['Video lessons', 'Preview / selected', 'Unlimited full access'],
    ['Reading, Listening, Speaking, Writing', 'Limited attempts', 'Unlimited practice'],
    ['Mock tests', 'Selected', 'Full library'],
    ['Study plan', 'Basic', 'Personalized & adaptive'],
    ['Detailed feedback', 'Limited', 'Advanced feedback'],
  ];
  return <Card style={styles.panelCard} contentStyle={styles.panelBody}><SectionHeader title="Plan Benefits" right={<MiniBadge label="Premium unlocks all" tone="yellow" />} /><View style={styles.table}><View style={styles.tableHead}>{['FEATURE', 'FREE', 'PREMIUM'].map((item) => <Text key={item} style={styles.tableHeadText}>{item}</Text>)}</View>{rows.map(([feature, free, premium]) => <View key={feature} style={styles.tableRow}><Text style={styles.cellText}>{feature}</Text><Text style={styles.cellText}>{free}</Text><Text style={styles.strongCell}>{premium}</Text></View>)}</View></Card>;
}

export function UnlockPremiumPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const wide = width >= 1040;
  return (
    <View testID="unlock-premium-screen" style={styles.screen}>
      <PageHeader title="Unlock Premium" subtitle="Upgrade when the learning context makes the value clear - never as an aggressive interruption." />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <Card style={styles.planHero} contentStyle={[styles.planHeroBody, compact ? styles.planHeroBodyStack : null]}>
            <View style={styles.planHeroCopy}><Text style={styles.orangeLabel}>PREMIUM ACCESS</Text><Text style={styles.unlockTitle}>Continue your Academic Listening lesson without limits.</Text><Text style={styles.planText}>You reached the free preview at 05:00 of 34:20. Premium unlocks the full lesson, downloadable resources, complete practice access, and advanced progress tools.</Text><View style={styles.buttonLine}><Button label="Unlock Premium" size="sm" onPress={() => router.push('/account/checkout' as Href)} /><Button label="Back to Preview" size="sm" variant="ghost" style={styles.darkGhostButton} textStyle={styles.whiteText} /></View></View>
            <View style={styles.lockedContentBox}><Text style={styles.lockedTitle}>Locked Content</Text><Progress value={15} color={studentTokens.yellow} /><View style={styles.sideMetaRow}><Text style={styles.metricSub}>05:00 watched</Text><Text style={styles.metricSub}>34:20 total</Text></View></View>
          </Card>
          <View style={styles.accessGrid}><FeatureCard icon={videoSymbol} title="Full Video Access" text="Watch every lesson from start to finish with captions and speed controls." /><FeatureCard icon={practiceSymbol} title="Unlimited Practice" text="Reading, Listening, Speaking, Writing, Vocabulary and Grammar." /><FeatureCard icon={progressSymbol} title="Advanced Progress" text="Detailed analysis, weak-area recommendations, and personalized study planning." /></View>
          <PlanBenefits />
        </View>
        <View style={styles.sideColumn}>
          <Card style={styles.recommendedCard} contentStyle={styles.sideBody}><Text style={styles.orangeLabel}>PREMIUM MONTHLY</Text><Text style={styles.priceLarge}>$12.99</Text><Text style={styles.sideText}>Cancel anytime</Text><View style={styles.divider} />{['Everything in Premium', 'Secure checkout', 'No ads'].map((item) => <BenefitRow key={item} text={item} />)}<Button label="Continue to Checkout" size="sm" onPress={() => router.push('/account/checkout' as Href)} style={styles.fullButton} /></Card>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}><Text style={styles.orangeLabel}>WHY YOU ARE SEEING THIS</Text><Text style={styles.sideText}>This upgrade screen is contextual: it appeared after you reached the preview limit for a premium lesson.</Text></Card>
        </View>
      </View>
    </View>
  );
}

function FeatureCard({ icon, title, text }: { icon: AppSymbolName; title: string; text: string }) {
  return <Card style={styles.accessCard} contentStyle={styles.featureBody}><SymbolView name={icon} tintColor={studentTokens.navy} size={18} style={styles.tinyIcon} /><Text style={styles.sideTitle}>{title}</Text><Text style={styles.sideText}>{text}</Text></Card>;
}

export function CheckoutPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 1040;

  return (
    <View testID="checkout-screen" style={styles.screen}>
      <PageHeader title="Checkout" subtitle="Complete your Premium upgrade with clear pricing and secure server-created payment flow." right={<HeaderButton label="Back to Plans" icon={backSymbol} onPress={() => router.push('/account/subscription' as Href)} />} />
      <View style={[styles.contentGrid, wide ? styles.contentGridWide : null]}>
        <View style={styles.mainColumn}>
          <Card style={styles.panelCard} contentStyle={styles.panelBody}>
            <View style={styles.checkoutTop}><PillTabs items={['1 Plan', '2 Payment', '3 Review']} active={1} /><Text style={styles.helperText}>Secure checkout</Text></View>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentTabs}><Button label="Credit / Debit Card" size="sm" variant="ghost" style={[styles.navyButton, styles.paymentTab]} textStyle={styles.whiteText} /><Button label="PayPal" size="sm" variant="secondary" style={styles.paymentTab} /></View>
            <Field label="Card Number" value="1234 5678 9012 3456" />
            <View style={styles.formGrid}><Field label="Expiry" value="MM / YY" /><Field label="CVC" value="•••" /></View>
            <Field label="Name on Card" value="Alex Johnson" />
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Billing Details</Text>
            <View style={styles.formGrid}><Field label="Country" value="Türkiye" /><Field label="Postal Code" value="74100" /></View>
            <View style={styles.successBox}><Text style={styles.successTitle}>Secure payment</Text><Text style={styles.successText}>Payment details are handled by the configured payment provider. Subscription activation occurs only after server-side verification.</Text></View>
          </Card>
        </View>
        <View style={styles.sideColumn}>
          <Card style={styles.sideCard} contentStyle={styles.sideBody}><Text style={styles.orangeLabel}>ORDER SUMMARY</Text><Text style={styles.sideTitle}>Premium - 6 Months</Text><InfoRow label="Subtotal" value="$77.94" /><InfoRow label="6-month discount" value="-$19.49" /><InfoRow label="Tax" value="$0.00" /><View style={styles.divider} /><InfoRow label="Total" value="$58.45" /><Button label="Pay & Upgrade" size="sm" onPress={() => router.push('/account/payment-success' as Href)} style={styles.fullButton} /><Text style={styles.legalText}>By continuing, you agree to the subscription terms and renewal policy.</Text></Card>
          <View style={styles.noticeBox}><Text style={styles.noticeText}>Plan benefit: Personalized study plan, complete content library, advanced analytics and feedback.</Text></View>
        </View>
      </View>
    </View>
  );
}

export function PaymentResultPage({ status }: { status: 'success' | 'failed' }) {
  const router = useRouter();
  const ok = status === 'success';
  return (
    <View testID={`payment-${status}-screen`} style={styles.screen}>
      <PageHeader title="Payment Result" subtitle={ok ? 'A confirmed payment result is shown only after server-side verification.' : 'Failure, cancellation, and pending states do not grant Premium access.'} />
      <View style={styles.centerWrap}>
        <Card style={styles.resultCard} contentStyle={styles.resultBody}>
          <View style={[styles.resultIcon, ok ? styles.resultIconSuccess : styles.resultIconFailed]}><SymbolView name={ok ? checkSymbol : closeSymbol} tintColor="#ffffff" size={28} style={styles.resultSymbol} /></View>
          <Text style={styles.resultTitle}>{ok ? 'Payment Successful!' : "Payment Couldn't Be Completed"}</Text>
          <Text style={styles.resultText}>{ok ? 'Your Premium subscription is active after secure server verification.' : 'No charge was confirmed and your current plan has not changed.'}</Text>
          {ok ? (
            <View style={styles.resultInfo}><InfoRow label="Plan" value="Premium - 6 Months" /><InfoRow label="Amount" value="$58.45" /><InfoRow label="Renewal date" value="March 03, 2027" /><InfoRow label="Receipt" value="#ASK-260903-1842" /></View>
          ) : (
            <View style={styles.errorBox}><Text style={styles.errorTitle}>Payment declined</Text><Text style={styles.errorText}>The payment provider did not approve this transaction. Check your card details or try a different payment method.</Text></View>
          )}
          {ok ? <View style={styles.successBox}><Text style={styles.successTitle}>Premium unlocked</Text><Text style={styles.successText}>Full lessons, unlimited practice, mock tests, personalized study planning, and advanced progress are now available.</Text></View> : <View style={styles.resultInfo}><InfoRow label="Attempted plan" value="Premium - 6 Months" /><InfoRow label="Reference" value="#PAY-260903-1844" /></View>}
          <Button label={ok ? 'Go to Dashboard' : 'Try Again'} size="sm" onPress={() => router.push(ok ? '/dashboard' as Href : '/account/checkout' as Href)} style={styles.fullButton} />
          <Button label={ok ? 'View Subscription' : 'Choose Another Plan'} size="sm" variant="secondary" onPress={() => router.push('/account/subscription' as Href)} style={styles.fullButton} />
          {!ok ? <Text style={styles.legalText}>{'If a pending authorization appears on your card, it may disappear automatically according to your bank\'s policy.'}</Text> : null}
        </Card>
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
  darkGhostButton: { borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8 },
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
  contentGridWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
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
  sideStrong: { color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  miniBadge: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  miniBadgeText: { fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 12 },
  fullButton: { width: '100%', borderRadius: 8, minHeight: 36 },
  filterLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  filterLineStack: { flexDirection: 'column', alignItems: 'stretch' },
  searchBox: { minHeight: 36, minWidth: 240, borderRadius: 8, borderWidth: 1, borderColor: '#dfe6f1', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  searchText: { color: '#8790a4', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  pillTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pillTab: { minHeight: 31, borderRadius: 999, borderWidth: 1, borderColor: '#dfe6f1', backgroundColor: '#ffffff', justifyContent: 'center', paddingHorizontal: 13 },
  pillTabActive: { backgroundColor: '#001b48', borderColor: '#001b48' },
  pillText: { color: '#31405c', fontFamily, fontSize: 11, fontWeight: '600', lineHeight: 15 },
  pillTextActive: { color: '#ffffff', fontWeight: '700' },
  table: { borderTopWidth: 1, borderTopColor: '#eef1f6' },
  tableHead: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  tableRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6' },
  tableHeadText: { flex: 1, color: '#8790a4', fontFamily, fontSize: 9, fontWeight: '700', lineHeight: 12 },
  cellText: { flex: 1, color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  strongCell: { flex: 1, color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  nameCell: { flex: 1.7, color: studentTokens.navy, fontWeight: '700' },
  linkText: { flex: 1, color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  rowTitle: { color: studentTokens.ink, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  rowSub: { color: '#7d889d', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16, marginTop: 1 },
  detailText: { color: '#7d889d', fontFamily, fontSize: 11, fontWeight: '500', lineHeight: 15, marginTop: 1 },
  mobileList: { gap: 8 },
  mobileItem: { borderRadius: 9, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: '#fbfcff', padding: 11, gap: 9 },
  mobileTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  mobileTitleGroup: { flex: 1, minWidth: 0 },
  smallNav: { flexDirection: 'row', gap: 7 },
  agendaList: { gap: 8 },
  agendaItem: { minHeight: 48, borderRadius: 9, borderWidth: 1, borderColor: '#dfe6f1', backgroundColor: '#ffffff', padding: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  agendaDate: { width: 42, height: 34, borderRadius: 8, backgroundColor: '#f4f7ff', alignItems: 'center', justifyContent: 'center' },
  agendaMonth: { color: '#7d889d', fontFamily, fontSize: 8, fontWeight: '500', lineHeight: 10 },
  agendaPill: { flex: 1, minHeight: 30, justifyContent: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  calendarHead: { flexBasis: '13.4%', minWidth: 92, color: '#8790a4', fontFamily, fontSize: 10, fontWeight: '600', lineHeight: 14 },
  dayCell: { flexBasis: '13.4%', minWidth: 92, minHeight: 60, borderRadius: 8, borderWidth: 1, borderColor: '#dfe6f1', backgroundColor: '#ffffff', padding: 7, gap: 5 },
  dayNumber: { color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 15 },
  eventPill: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 },
  eventText: { fontFamily, fontSize: 10, fontWeight: '600', lineHeight: 12 },
  barRow: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 104, color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  barTrack: { flex: 1, height: 6, borderRadius: 999, backgroundColor: '#e9edf3', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  barValue: { width: 38, color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16, textAlign: 'right' },
  sideMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  noticeBox: { borderRadius: 10, borderWidth: 1, borderColor: '#f3dfa3', backgroundColor: '#fff8df', padding: 12 },
  noticeText: { color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  timeline: { gap: 0, paddingTop: 6 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 52 },
  timelineTrack: { width: 34, alignItems: 'center' },
  timelineLine: { position: 'absolute', top: 32, bottom: -22, width: 1, backgroundColor: '#dfe6f1' },
  timelineBubble: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#edf2ff', alignItems: 'center', justifyContent: 'center' },
  timelineLetter: { color: studentTokens.blue, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  timelineCopy: { flex: 1, minWidth: 0, paddingBottom: 9 },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  heatCell: { width: 13, height: 13, borderRadius: 3 },
  heatEmpty: { backgroundColor: '#edf1f6' },
  profileHeroBody: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  avatarLarge: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#ffe3bf', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarLargeText: { color: studentTokens.navy, fontFamily, fontSize: 24, fontWeight: '700', lineHeight: 30 },
  profileHeroCopy: { flex: 1, minWidth: 220, gap: 3 },
  heroTitle: { color: studentTokens.navy, fontFamily, fontSize: 23, fontWeight: '700', lineHeight: 29 },
  heroText: { color: '#71809a', fontFamily, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  badgeLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  threeFieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { flexGrow: 1, flexBasis: 260, minWidth: 0, gap: 4 },
  fieldLabel: { color: '#7d889d', fontFamily, fontSize: 11, fontWeight: '500', lineHeight: 15 },
  fieldBox: { minHeight: 38, borderRadius: 8, borderWidth: 1, borderColor: '#dce3ef', backgroundColor: '#ffffff', justifyContent: 'center', paddingHorizontal: 12 },
  fieldText: { color: '#526078', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  footerLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: '#eef1f6', paddingTop: 12 },
  helperText: { color: '#7d889d', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  infoLabel: { color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  infoValue: { color: studentTokens.navy, fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#eef1f6' },
  toggleRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toggleCopy: { flex: 1, minWidth: 0 },
  toggle: { width: 35, height: 20, borderRadius: 10, padding: 2, justifyContent: 'center', flexShrink: 0 },
  toggleOn: { backgroundColor: '#001b48', alignItems: 'flex-end' },
  toggleOff: { backgroundColor: '#cfd7e4', alignItems: 'flex-start' },
  toggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#ffffff' },
  toggleKnobOn: { backgroundColor: '#ffffff' },
  dangerCard: { padding: 0, borderRadius: 11, borderColor: '#f5b6aa', backgroundColor: '#fff2ef', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  dangerTitle: { color: studentTokens.navy, fontFamily, fontSize: 14, fontWeight: '700', lineHeight: 18 },
  deleteButton: { alignSelf: 'flex-start', borderColor: '#dce3ef' },
  planHero: { padding: 0, borderRadius: 11, borderColor: '#061f55', backgroundColor: '#08265a', overflow: 'hidden', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  planHeroBody: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18 },
  planHeroBodyStack: { flexDirection: 'column', alignItems: 'stretch' },
  planHeroCopy: { flex: 1, minWidth: 240, gap: 12 },
  planTitle: { color: '#ffffff', fontFamily, fontSize: 30, fontWeight: '700', lineHeight: 36 },
  unlockTitle: { color: '#ffffff', fontFamily, fontSize: 30, fontWeight: '700', lineHeight: 38, maxWidth: 620 },
  planText: { color: '#c9d4ee', fontFamily, fontSize: 13, fontWeight: '500', lineHeight: 19, maxWidth: 720 },
  buttonLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priceBoxDark: { alignItems: 'flex-end', flexShrink: 0 },
  priceDark: { color: '#ffffff', fontFamily, fontSize: 30, fontWeight: '700', lineHeight: 36 },
  priceDarkSub: { color: '#c9d4ee', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  accessGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  accessCard: { flexGrow: 1, flexBasis: 220, minWidth: 0, padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  accessBody: { padding: 15, gap: 3 },
  accessValue: { color: studentTokens.navy, fontFamily, fontSize: 27, fontWeight: '700', lineHeight: 32 },
  recommendedCard: { padding: 0, borderRadius: 11, borderColor: studentTokens.yellow, borderWidth: 2, shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  priceLarge: { color: studentTokens.navy, fontFamily, fontSize: 41, fontWeight: '700', lineHeight: 47 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  benefitText: { color: '#31405c', fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 17, flex: 1 },
  lockedContentBox: { width: 150, maxWidth: '100%', borderRadius: 11, backgroundColor: '#ffffff', padding: 14, gap: 12, flexShrink: 0 },
  lockedTitle: { color: '#31405c', fontFamily, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  featureBody: { padding: 15, gap: 9 },
  checkoutTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', borderBottomWidth: 1, borderBottomColor: '#eef1f6', paddingBottom: 10 },
  paymentTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paymentTab: { flexGrow: 1, flexBasis: 220, borderRadius: 8 },
  successBox: { borderRadius: 10, borderWidth: 1, borderColor: '#bde8d0', backgroundColor: '#ecfbf2', padding: 12 },
  successTitle: { color: studentTokens.navy, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  successText: { color: '#31405c', fontFamily, fontSize: 11, fontWeight: '500', lineHeight: 16, marginTop: 2 },
  legalText: { color: '#8790a4', fontFamily, fontSize: 10, fontWeight: '500', lineHeight: 14, textAlign: 'center' },
  centerWrap: { minHeight: 560, alignItems: 'center', justifyContent: 'center', paddingVertical: 26 },
  resultCard: { width: '100%', maxWidth: 490, padding: 0, borderRadius: 12, borderColor: '#e5eaf2', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  resultBody: { padding: 32, gap: 14, alignItems: 'stretch' },
  resultIcon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  resultIconSuccess: { backgroundColor: '#159b5f' },
  resultIconFailed: { backgroundColor: '#e24a3b' },
  resultSymbol: { width: 28, height: 28 },
  resultTitle: { color: studentTokens.navy, fontFamily, fontSize: 28, fontWeight: '700', lineHeight: 34, textAlign: 'center' },
  resultText: { color: '#7d889d', fontFamily, fontSize: 13, fontWeight: '500', lineHeight: 18, textAlign: 'center' },
  resultInfo: { gap: 8, borderTopWidth: 1, borderTopColor: '#eef1f6', paddingTop: 10 },
  errorBox: { borderRadius: 10, borderWidth: 1, borderColor: '#f4b5a9', backgroundColor: '#fff2ef', padding: 12 },
  errorTitle: { color: studentTokens.navy, fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  errorText: { color: '#31405c', fontFamily, fontSize: 11, fontWeight: '500', lineHeight: 16, marginTop: 2 },
});



