import { useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button, Card, EmptyState, Search, Tabs, studentTokens } from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';
import { getTopRecommendation } from '@/lib/progress-engine';
import {
  courseCards,
  learningFilters,
  learningTargetGap,
  skillThemes,
  weeklyLearningPlan,
  type CourseCard,
  type LearningFilter,
  type LearningSkillKey,
} from '@/lib/student-learning';

const fontFamily = 'Quicksand';

type MyLearningProps = {
  user: AuthUser;
};

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const arrowSymbol = symbolName('chevron.right', 'chevron_right');
const playSymbol = symbolName('play.fill', 'play_arrow');
const bookSymbol = symbolName('book', 'menu_book');
const headphonesSymbol = symbolName('headphones', 'headphones');
const micSymbol = symbolName('mic', 'mic');
const writingSymbol = symbolName('square.and.pencil', 'edit_square');
const vocabSymbol = symbolName('textformat.abc', 'abc');
const grammarSymbol = symbolName('text.book.closed', 'library_books');
const checkCircleSymbol = symbolName('checkmark.circle.fill', 'check_circle');
const circleSymbol = symbolName('circle', 'radio_button_unchecked');
const targetSymbol = symbolName('target', 'track_changes');
const flameSymbol = symbolName('flame.fill', 'local_fire_department');
const calendarSymbol = symbolName('calendar', 'calendar_month');
const bookmarkSymbol = symbolName('bookmark', 'bookmark');
const bookmarkOutlineSymbol = symbolName('bookmark', 'bookmark_border');
const noteSymbol = symbolName('doc.text', 'description');

const skillIcons: Record<LearningSkillKey, AppSymbolName> = {
  reading: bookSymbol,
  listening: headphonesSymbol,
  speaking: micSymbol,
  writing: writingSymbol,
  vocabulary: vocabSymbol,
  grammar: grammarSymbol,
};

const skillImageSources: Partial<Record<LearningSkillKey, number>> = {
  reading: require('@/assets/images/skill-reading.png'),
  listening: require('@/assets/images/skill-listening.png'),
  speaking: require('@/assets/images/skill-speaking.png'),
  writing: require('@/assets/images/skill-writing.png'),
};

const skillFilterItems: { value: LearningSkillKey; label: string; icon: AppSymbolName }[] = [
  { value: 'reading', label: 'Reading', icon: bookSymbol },
  { value: 'listening', label: 'Listening', icon: headphonesSymbol },
  { value: 'speaking', label: 'Speaking', icon: micSymbol },
  { value: 'writing', label: 'Writing', icon: writingSymbol },
  { value: 'vocabulary', label: 'Vocabulary', icon: vocabSymbol },
  { value: 'grammar', label: 'Grammar', icon: grammarSymbol },
];

const overviewStats = [
  { label: 'ACTIVE COURSES', value: '6', suffix: '', detail: 'Keep going', tone: 'blue' as const, icon: bookSymbol },
  { label: 'COMPLETED LESSONS', value: '42', suffix: '', detail: 'Great progress', tone: 'teal' as const, icon: checkCircleSymbol },
  { label: 'WEEKLY GOAL', value: '5', suffix: ' / 7 lessons', detail: '2 lessons to go', tone: 'yellow' as const, icon: targetSymbol, progress: 72 },
  { label: 'STUDY STREAK', value: '12', suffix: ' days', detail: 'Keep the streak alive', tone: 'purple' as const, icon: flameSymbol },
];

const coursePresentation: Record<string, { title: string; level: string; completed: number; total: number; progress: number; saved?: boolean; image?: number }> = {
  'reading-foundations': { title: 'Academic Reading', level: 'B2', completed: 18, total: 22, progress: 82, saved: true, image: skillImageSources.reading },
  'listening-note-map': { title: 'Academic Listening', level: 'B2', completed: 15, total: 21, progress: 72, saved: true, image: skillImageSources.listening },
  'speaking-builder': { title: 'Academic Speaking', level: 'B1+', completed: 11, total: 18, progress: 69, saved: true, image: skillImageSources.speaking },
  'writing-rubric-lab': { title: 'Academic Writing', level: 'B2', completed: 13, total: 19, progress: 68, image: skillImageSources.writing },
  'vocabulary-accelerator': { title: 'Academic Vocabulary', level: 'B2', completed: 20, total: 27, progress: 75, saved: true },
  'grammar-for-writing': { title: 'Academic Grammar', level: 'B1', completed: 8, total: 14, progress: 56, saved: true },
};


function statToneColor(tone: (typeof overviewStats)[number]['tone']) {
  if (tone === 'teal') return studentTokens.teal;
  if (tone === 'yellow') return studentTokens.yellowDeep;
  if (tone === 'purple') return '#9657e8';
  return studentTokens.blue;
}

function OverviewStat({ item, compact }: { item: (typeof overviewStats)[number]; compact: boolean }) {
  const color = statToneColor(item.tone);

  return (
    <Card style={[styles.statCard, compact ? styles.statCardCompact : null]} contentStyle={styles.statBody}>
      <View style={[styles.statIconBox, { backgroundColor: `${color}18` }]}>
        <SymbolView name={item.icon} tintColor={color} size={24} style={styles.statIcon} />
      </View>
      <View style={styles.statCopy}>
        <Text style={styles.statLabel}>{item.label}</Text>
        <Text style={styles.statValue}>{item.value}<Text style={styles.statSuffix}>{item.suffix}</Text></Text>
        {item.progress ? (
          <View style={styles.statTrack}>
            <View style={[styles.statFill, { width: `${item.progress}%`, backgroundColor: studentTokens.yellow }]} />
          </View>
        ) : null}
        <Text style={styles.statDetail}>{item.detail}</Text>
      </View>
    </Card>
  );
}

function CourseThumb({ course, compact }: { course: CourseCard; compact: boolean }) {
  const theme = skillThemes[course.skill];
  const presentation = coursePresentation[course.id];
  const image = presentation?.image;

  return (
    <View style={[styles.courseThumb, compact ? styles.courseThumbCompact : null, { backgroundColor: theme.soft }]}>
      {image ? (
        <Image source={image} style={styles.courseThumbImage} contentFit="cover" accessibilityLabel={`${theme.label} course thumbnail`} />
      ) : (
        <SymbolView name={skillIcons[course.skill]} tintColor={theme.accent} size={34} style={styles.courseThumbIcon} />
      )}
    </View>
  );
}

function CourseProgressCard({ course, compact }: { course: CourseCard; compact: boolean }) {
  const router = useRouter();
  const theme = skillThemes[course.skill];
  const presentation = coursePresentation[course.id] ?? { title: course.title, level: 'B2', completed: course.completedLessons, total: course.lessonCount, progress: course.progress, saved: false };
  const coursePath = `/learning/videos/${course.nextLessonId}` as Href;

  return (
    <Card style={[styles.courseCard, compact ? styles.courseCardCompact : null]} contentStyle={[styles.courseBody, compact ? styles.courseBodyCompact : null]}>
      <CourseThumb course={course} compact={compact} />
      <View style={styles.courseCopy}>
        <View style={styles.courseHeadLine}>
          <View style={styles.courseTitleWrap}>
            <Text style={styles.courseTitle} numberOfLines={2}>{presentation.title}</Text>
            <Text style={styles.courseMeta}>{skillThemes[course.skill].label}  •  {presentation.level}</Text>
          </View>
          <SymbolView name={presentation.saved ? bookmarkSymbol : bookmarkOutlineSymbol} tintColor={studentTokens.text} size={16} style={styles.bookmarkIcon} />
        </View>
        <View style={styles.courseProgressRow}>
          <View style={styles.courseTrack}>
            <View style={[styles.courseFill, { width: `${presentation.progress}%`, backgroundColor: theme.accent }]} />
          </View>
          <Text style={styles.coursePercent}>{presentation.progress}%</Text>
        </View>
        <View style={styles.courseFootLine}>
          <Text style={styles.courseLessons}>{presentation.completed} / {presentation.total} lessons</Text>
          <Button label={course.cta} size="sm" variant={course.cta === 'Review' ? 'secondary' : 'primary'} onPress={() => router.push(coursePath)} right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.buttonIcon} />} style={styles.courseButton} textStyle={styles.courseButtonText} />
        </View>
        <Text style={styles.lastActivity} numberOfLines={1}>Last activity: {course.lastActivity}</Text>
      </View>
    </Card>
  );
}

function ContinueLearningBand({ compact }: { compact: boolean }) {
  const router = useRouter();

  return (
    <Card style={styles.continueHero} contentStyle={[styles.continueHeroBody, compact ? styles.continueHeroBodyCompact : null]}>
      <View style={styles.playCircle}>
        <SymbolView name={playSymbol} tintColor="#ffffff" size={26} style={styles.playIcon} />
      </View>
      <View style={styles.continueCopy}>
        <Text style={styles.continueLabel}>CONTINUE LEARNING</Text>
        <Text style={styles.continueTitle} numberOfLines={compact ? 2 : 1}>Academic Listening · Lecture 03</Text>
        <Text style={styles.continueSub}>Note Taking</Text>
        <View style={styles.continueProgressRow}>
          <Text style={styles.continueTime}>24:35 / 34:20</Text>
          <View style={styles.continueTrack}><View style={styles.continueFill} /></View>
          <Text style={styles.continuePercent}>72%</Text>
        </View>
      </View>
      {!compact ? (
        <View style={styles.waveWrap}>
          <Image source={require('@/assets/images/dashboard-waveform.png')} style={styles.waveImage} contentFit="contain" accessibilityLabel="Listening waveform visual" />
        </View>
      ) : null}
      <Button label="Continue Lesson" size="sm" variant="secondary" onPress={() => router.push('/learning/videos/listening-note-map-lecture' as Href)} right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={14} style={styles.buttonIcon} />} style={[styles.continueButton, compact ? styles.continueButtonCompact : null]} />
    </Card>
  );
}

function RecommendedCard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const recommendation = getTopRecommendation({ user, context: 'my-learning' });
  const theme = skillThemes[(recommendation?.skill ?? 'listening') as LearningSkillKey] ?? skillThemes.listening;
  const actionHref = recommendation?.locked ? '/account/subscription' : recommendation?.action.href ?? '/learning/videos/listening-note-map-lecture';

  return (
    <Card style={styles.sideCard} contentStyle={styles.sideCardBody}>
      <View style={styles.sideHeaderInline}>
        <View style={styles.sideTitleGroup}>
          <Text style={styles.sideKicker}>Recommended Next</Text>
        </View>
      </View>
      <View style={styles.recommendBody}>
        <View style={[styles.recommendVisual, { backgroundColor: theme.soft }]}>
          <SymbolView name={noteSymbol} tintColor={theme.accent} size={38} style={styles.recommendIcon} />
          <Text style={styles.recommendVisualText}>{recommendation?.subskillTitle.toUpperCase() ?? 'NOTE TAKING'}</Text>
        </View>
        <View style={styles.recommendCopy}>
          <Text style={styles.recommendTitle}>{recommendation?.title ?? 'Note Taking Strategies'}</Text>          <Text style={styles.recommendMeta}>{recommendation ? recommendation.skillTitle + ' - ' + recommendation.subskillTitle : 'Listening - B2'}</Text>          <Text style={styles.recommendText}>{recommendation?.reason ?? 'Improve your ability to capture key information in lectures.'}</Text>
        </View>
      </View>
      <Button label={recommendation?.locked ? 'View Plan' : recommendation?.action.label ?? 'Start Lesson'} size="sm" variant="secondary" onPress={() => router.push(actionHref as Href)} right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={14} style={styles.buttonIcon} />} style={styles.sideButtonWide} />
      <View style={styles.sliderDots}>
        <View style={styles.sliderDotActive} />
        <View style={styles.sliderDot} />
        <View style={styles.sliderDot} />
        <View style={styles.sliderDot} />
        <View style={styles.sliderDot} />
      </View>
    </Card>
  );
}

function WeeklyTaskRow({ task, index }: { task: (typeof weeklyLearningPlan)[number]; index: number }) {
  const theme = skillThemes[task.skill];
  const completed = task.state === 'Tamamlandı';
  const days = ['Today', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <View style={styles.weeklyRow}>
      <View style={[styles.weeklyIconBox, { backgroundColor: theme.soft }]}>
        <SymbolView name={skillIcons[task.skill]} tintColor={theme.accent} size={16} style={styles.weeklyIcon} />
      </View>
      <View style={styles.weeklyCopy}>
        <Text style={styles.weeklyTitle} numberOfLines={1}>{task.title}</Text>
        <Text style={styles.weeklyMeta}>{skillThemes[task.skill].label}  •  {task.duration}</Text>
      </View>
      <Text style={styles.weeklyDay}>{days[index] ?? task.day}</Text>
      <SymbolView name={completed ? checkCircleSymbol : circleSymbol} tintColor={completed ? '#00a66a' : '#b7bfce'} size={16} style={styles.weeklyStatusIcon} />
    </View>
  );
}

function ThisWeekCard() {
  const router = useRouter();

  return (
    <Card style={styles.sideCard} contentStyle={styles.sideCardBody}>
      <View style={styles.sideHeaderInline}>
        <View style={styles.sideIconSmall}>
          <SymbolView name={calendarSymbol} tintColor={studentTokens.blue} size={16} style={styles.sideSmallSymbol} />
        </View>
        <Text style={styles.sideKicker}>Weekly Plan</Text>
      </View>
      <View style={styles.weeklyList}>
        {weeklyLearningPlan.map((task, index) => <WeeklyTaskRow key={`${task.day}-${task.title}`} task={task} index={index} />)}
        <WeeklyTaskRow task={{ day: 'Cum', title: 'Integrated Writing · Task 2', duration: '30 min', state: 'Planlandı', skill: 'writing' }} index={4} />
      </View>
      <Button label="View Full Plan" size="sm" variant="secondary" onPress={() => router.push('/progress/study-plan' as Href)} right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={14} style={styles.buttonIcon} />} style={styles.sideButtonWide} />
    </Card>
  );
}

export function MyLearning({ user }: MyLearningProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 1120;
  const isTablet = width >= 760;
  const isCompact = width < 620;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LearningFilter>('all');
  const [skill, setSkill] = useState<'all' | LearningSkillKey>('all');

  const normalizedQuery = query.trim().toLowerCase();
  const visibleCourses = useMemo(
    () => courseCards.filter((course) => {
      const presentation = coursePresentation[course.id];
      const searchableTitle = presentation?.title ?? course.title;
      const matchesFilter = filter === 'all' || course.status === filter;
      const matchesSkill = skill === 'all' || course.skill === skill;
      const matchesQuery = !normalizedQuery || `${searchableTitle} ${course.description} ${course.focus} ${skillThemes[course.skill].label}`.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesSkill && matchesQuery;
    }),
    [filter, normalizedQuery, skill],
  );

  return (
    <View testID="my-learning-screen" style={styles.screen}>
      <View style={styles.pageHead}>
        <Text style={styles.pageTitle}>My Learning</Text>
        <Text style={styles.pageText}>Track your progress, continue your lessons, and reach your target score.</Text>
      </View>

      <View style={styles.statsGrid}>
        {overviewStats.map((item) => <OverviewStat key={item.label} item={item} compact={!isTablet} />)}
      </View>

      <View style={[styles.learningLayout, isWide ? styles.learningLayoutWide : null]}>
        <View style={styles.primaryColumn}>
          <ContinueLearningBand compact={isCompact} />

          <View style={styles.filterPanel}>
            <View style={[styles.searchAndTabs, isTablet ? styles.searchAndTabsWide : null]}>
              <View style={styles.searchShell}>
                <Search value={query} onChangeText={setQuery} placeholder="Search courses, skills, topics..." />
              </View>
              <Tabs items={learningFilters} value={filter} onChange={setFilter} />
            </View>
            <View style={styles.skillChips}>
              {skillFilterItems.map((item) => {
                const active = item.value === skill;
                const theme = skillThemes[item.value];
                return (
                  <Pressable
                    key={item.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setSkill(active ? 'all' : item.value)}
                    style={({ pressed }) => [styles.skillChip, active ? { borderColor: theme.accent, backgroundColor: theme.soft } : null, pressed ? styles.pressed : null]}
                  >
                    {item.icon ? <SymbolView name={item.icon} tintColor={active ? theme.accent : studentTokens.text} size={14} style={styles.skillChipIcon} /> : null}
                    <Text style={[styles.skillChipText, active ? { color: studentTokens.navy } : null]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {visibleCourses.length > 0 ? (
            <View style={[styles.courseGrid, isTablet ? styles.courseGridTablet : null]}>
              {visibleCourses.map((course) => <CourseProgressCard key={course.id} course={course} compact={isCompact} />)}
            </View>
          ) : (
            <EmptyState title="No courses found" text="Change your search or filters to see more learning content." action={<Button label="Clear filters" variant="secondary" onPress={() => { setQuery(''); setFilter('all'); setSkill('all'); }} />} />
          )}

          <View style={styles.targetBanner}>
            <View style={styles.bannerIcon}>
              <SymbolView name={targetSymbol} tintColor={studentTokens.yellowDeep} size={18} style={styles.bannerSymbol} />
            </View>
            <Text style={styles.bannerText}>Stay consistent! You are {learningTargetGap.targetScore - learningTargetGap.currentScore} points away from your target score.</Text>
            <Button label="Go to Progress" size="sm" variant="secondary" onPress={() => router.push('/progress' as Href)} right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={14} style={styles.buttonIcon} />} style={styles.bannerButton} />
          </View>
        </View>

        <View style={[styles.sideColumn, isWide ? styles.sideColumnWide : null]}>
          <RecommendedCard user={user} />
          <ThisWeekCard />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 10 },
  pageHead: { gap: 2 },
  pageTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  pageText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flexGrow: 1, flexBasis: 184, minWidth: 0, padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  statCardCompact: { flexBasis: 158 },
  statBody: { padding: 13, minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconBox: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statIcon: { width: 24, height: 24 },
  statCopy: { flex: 1, minWidth: 0 },
  statLabel: { fontFamily: fontFamily, color: '#4f5870', fontSize: 8, lineHeight: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 3 },
  statValue: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 22, lineHeight: 27, fontWeight: '700' },
  statSuffix: { fontFamily: fontFamily, color: '#6e778b', fontSize: 10, lineHeight: 13, fontWeight: '700' },
  statDetail: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 8, lineHeight: 11, fontWeight: '600', marginTop: 4 },
  statTrack: { height: 5, borderRadius: 99, backgroundColor: '#e8ecf2', overflow: 'hidden', marginTop: 4 },
  statFill: { height: '100%', borderRadius: 99 },
  learningLayout: { gap: 14 },
  learningLayoutWide: { flexDirection: 'row', alignItems: 'flex-start' },
  primaryColumn: { flex: 1, minWidth: 0, gap: 10 },
  sideColumn: { width: '100%', gap: 10 },
  sideColumnWide: { width: 246, flexShrink: 0 },
  continueHero: { padding: 0, borderRadius: 11, borderColor: '#061f55', backgroundColor: '#001b48', overflow: 'hidden', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  continueHeroBody: { minHeight: 98, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
  continueHeroBodyCompact: { minHeight: 0, paddingHorizontal: 16, paddingVertical: 18, flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  playCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f15f21', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  playIcon: { width: 26, height: 26 },
  continueCopy: { flex: 1, minWidth: 0, flexShrink: 0 },
  continueLabel: { fontFamily: fontFamily, color: '#ff733c', fontSize: 9, lineHeight: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 3 },
  continueTitle: { fontFamily: fontFamily, color: '#ffffff', fontSize: 19, lineHeight: 24, fontWeight: '700', flexShrink: 1 },
  continueSub: { fontFamily: fontFamily, color: '#d8e3ff', fontSize: 11, lineHeight: 15, fontWeight: '600', marginTop: 1 },
  continueProgressRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  continueTime: { fontFamily: fontFamily, color: '#ffffff', fontSize: 10, lineHeight: 14, fontWeight: '600' },
  continueTrack: { height: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden', flex: 1, minWidth: 106, maxWidth: 250 },
  continueFill: { height: '100%', width: '72%', borderRadius: 999, backgroundColor: studentTokens.yellow },
  continuePercent: { fontFamily: fontFamily, color: studentTokens.yellow, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  waveWrap: { width: 280, height: 73, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  waveImage: { width: 280, height: 73, opacity: 0.92 },
  continueButton: { minWidth: 148, borderRadius: 8, minHeight: 38 },
  continueButtonCompact: { width: '100%', minWidth: 0, alignSelf: 'stretch', marginTop: 2 },
  filterPanel: { gap: 9 },
  searchAndTabs: { gap: 8 },
  searchAndTabsWide: { flexDirection: 'row', alignItems: 'center' },
  searchShell: { flex: 1, minWidth: 210 },
  skillChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  skillChip: { minHeight: 30, borderRadius: 8, borderWidth: 1, borderColor: '#e1e6ee', backgroundColor: studentTokens.surface, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  skillChipIcon: { width: 14, height: 14 },
  skillChipText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  courseGrid: { gap: 10 },
  courseGridTablet: { flexDirection: 'row', flexWrap: 'wrap' },
  courseCard: { flexGrow: 1, flexShrink: 1, flexBasis: 232, minWidth: 220, padding: 0, borderRadius: 11, borderColor: '#e5eaf2', overflow: 'hidden', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  courseCardCompact: { minWidth: 0, flexBasis: '100%' },
  courseBody: { padding: 10, flexDirection: 'row', gap: 10, minHeight: 116 },
  courseBodyCompact: { minHeight: 0 },
  courseThumb: { width: 74, minHeight: 92, borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  courseThumbCompact: { width: 72, minHeight: 88 },
  courseThumbImage: { width: '100%', height: '100%' },
  courseThumbIcon: { width: 34, height: 34 },
  courseCopy: { flex: 1, minWidth: 0, gap: 6 },
  courseHeadLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  courseTitleWrap: { flex: 1, minWidth: 0 },
  courseTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 11, lineHeight: 15, fontWeight: '700', flexShrink: 1 },
  courseMeta: { fontFamily: fontFamily, color: studentTokens.blue, fontSize: 9, lineHeight: 12, fontWeight: '700', marginTop: 2 },
  bookmarkIcon: { width: 16, height: 16, flexShrink: 0 },
  courseProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  courseTrack: { flex: 1, minWidth: 56, height: 5, borderRadius: 99, backgroundColor: '#e9edf3', overflow: 'hidden' },
  courseFill: { height: '100%', borderRadius: 99 },
  coursePercent: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 8, lineHeight: 11, fontWeight: '700', width: 26, textAlign: 'right' },
  courseFootLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  courseLessons: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700', flexShrink: 1 },
  courseButton: { minHeight: 27, borderRadius: 7, paddingHorizontal: 10 },
  courseButtonText: { fontFamily: fontFamily, fontSize: 9, lineHeight: 12 },
  lastActivity: { fontFamily: fontFamily, color: studentTokens.muted, fontSize: 8, lineHeight: 11, fontWeight: '700' },
  sideCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  sideCardBody: { padding: 13, gap: 10 },
  sideHeaderInline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sideTitleGroup: { flex: 1, minWidth: 0 },
  sideKicker: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  sideIconSmall: { width: 24, height: 24, borderRadius: 8, backgroundColor: studentTokens.blueSoft, alignItems: 'center', justifyContent: 'center' },
  sideSmallSymbol: { width: 16, height: 16 },
  recommendBody: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  recommendVisual: { width: 76, minHeight: 92, borderRadius: 8, alignItems: 'center', justifyContent: 'center', padding: 8, overflow: 'hidden' },
  recommendIcon: { width: 38, height: 38 },
  recommendVisualText: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 8, lineHeight: 10, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  recommendCopy: { flex: 1, minWidth: 0, gap: 3 },
  recommendTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  recommendMeta: { fontFamily: fontFamily, color: studentTokens.blue, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  recommendText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 9, lineHeight: 14, fontWeight: '600', flexShrink: 1 },
  sideButtonWide: { width: '100%', borderRadius: 7, minHeight: 31 },
  sliderDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  sliderDotActive: { width: 7, height: 7, borderRadius: 4, backgroundColor: studentTokens.yellowDeep },
  sliderDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c8ceda' },
  weeklyList: { gap: 0 },
  weeklyRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: '#edf1f6', paddingVertical: 6 },
  weeklyIconBox: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  weeklyIcon: { width: 16, height: 16 },
  weeklyCopy: { flex: 1, minWidth: 0 },
  weeklyTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  weeklyMeta: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 8, lineHeight: 11, fontWeight: '600', marginTop: 1 },
  weeklyDay: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700', width: 31, textAlign: 'right' },
  weeklyStatusIcon: { width: 16, height: 16, flexShrink: 0 },
  targetBanner: { minHeight: 37, borderRadius: 8, borderWidth: 1, borderColor: '#ffe2a2', backgroundColor: '#fff6d7', paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  bannerIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff0b2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bannerSymbol: { width: 18, height: 18 },
  bannerText: { fontFamily: fontFamily, flex: 1, minWidth: 210, color: '#4f5870', fontSize: 10, lineHeight: 14, fontWeight: '700' },
  bannerButton: { minHeight: 28, borderRadius: 7 },
  buttonIcon: { width: 14, height: 14 },
  pressed: { opacity: 0.72 },
});


