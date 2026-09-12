import { useEffect, useMemo, useState } from 'react';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Modal as NativeModal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { Button, Card, EmptyState, ErrorState, Skeleton, studentTokens } from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';
import { getEntitlementAccess } from '@/lib/permissions';
import {
  discoverVideoLessons,
  getVideoLessonCatalog,
  getVideoLessonById,
  getVideoSubskillFilters,
  getVideoTaskFilters,
  skillThemes,
  syncPublishedVideoCatalog,
  videoAccessFilters,
  videoDurationFilters,
  videoLevelFilters,
  videoSkillTabs,
  videoSortFilters,
  type LearningSkillKey,
  type VideoAccess,
  type VideoCategoryFilterKey,
  type VideoDurationFilter,
  type VideoFilterOption,
  type VideoLesson,
  type VideoLevel,
  type VideoSortMode,
} from '@/lib/student-learning';

const fontFamily = 'Quicksand';

type VideoLessonsProps = {
  user: AuthUser;
};

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };
type ConcreteVideoCategory = Exclude<VideoCategoryFilterKey, 'all'>;
type VideoFilterState = {
  query: string;
  category: VideoCategoryFilterKey;
  task: string;
  subskill: string;
  level: 'all' | VideoLevel;
  duration: VideoDurationFilter;
  access: 'all' | VideoAccess;
  sort: VideoSortMode;
};
type VideoSearchParams = Partial<Record<'q' | 'skill' | 'task' | 'subskill' | 'level' | 'duration' | 'access' | 'sort', string | string[]>>;

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const arrowSymbol = symbolName('chevron.right', 'chevron_right');
const playSymbol = symbolName('play.fill', 'play_arrow');
const videoSymbol = symbolName('play.rectangle', 'smart_display');
const bookSymbol = symbolName('book', 'menu_book');
const headphonesSymbol = symbolName('headphones', 'headphones');
const micSymbol = symbolName('mic', 'mic');
const writingSymbol = symbolName('square.and.pencil', 'edit_square');
const grammarSymbol = symbolName('text.book.closed', 'library_books');
const vocabSymbol = symbolName('textformat.abc', 'abc');
const checkCircleSymbol = symbolName('checkmark.circle.fill', 'check_circle');
const bookmarkSymbol = symbolName('bookmark.fill', 'bookmark');
const bookmarkOutlineSymbol = symbolName('bookmark', 'bookmark_border');
const flameSymbol = symbolName('flame.fill', 'local_fire_department');
const dotsSymbol = symbolName('ellipsis', 'more_vert');
const searchSymbol = symbolName('magnifyingglass', 'search');
const lockSymbol = symbolName('lock.fill', 'lock');
const filterSymbol = symbolName('line.3.horizontal.decrease.circle', 'filter_alt');
const closeSymbol = symbolName('xmark', 'close');
const compassSymbol = symbolName('location.north.circle', 'explore');
const targetSymbol = symbolName('target', 'track_changes');

const skillIcons: Record<LearningSkillKey, AppSymbolName> = {
  reading: bookSymbol,
  listening: headphonesSymbol,
  speaking: micSymbol,
  writing: writingSymbol,
  vocabulary: vocabSymbol,
  grammar: grammarSymbol,
};

const categoryIcons: Record<ConcreteVideoCategory, AppSymbolName> = {
  'getting-started': compassSymbol,
  reading: bookSymbol,
  listening: headphonesSymbol,
  speaking: micSymbol,
  writing: writingSymbol,
  vocabulary: vocabSymbol,
  grammar: grammarSymbol,
  'test-strategies': targetSymbol,
};

const skillImageSources: Partial<Record<LearningSkillKey, number>> = {
  reading: require('@/assets/images/skill-reading.png'),
  listening: require('@/assets/images/academic-hero.png'),
  speaking: require('@/assets/images/skill-speaking.png'),
  writing: require('@/assets/images/skill-writing.png'),
};

const videoOverviewStats = [
  { label: 'Total Video Hours', value: '24h 36m', detail: '+4.2h this week', tone: 'blue' as const, icon: videoSymbol },
  { label: 'Completed Lessons', value: '38', detail: '+6 this week', tone: 'teal' as const, icon: checkCircleSymbol },
  { label: 'Saved Lessons', value: '12', detail: 'View saved', tone: 'purple' as const, icon: bookmarkSymbol },
  { label: 'Recommended Pace', value: '3-4 lessons / week', detail: 'You are on track', tone: 'orange' as const, icon: flameSymbol },
];

const lessonPresentation: Record<string, { title: string; author: string; time: string; progress: number; completeText: string; thumb?: number; tag?: string }> = {
  'reading-inference-mini-lesson': { title: 'Identifying Author Purpose in Academic Texts', author: 'Sarah Johnson', time: '16:28', progress: 60, completeText: '60% Complete', thumb: skillImageSources.reading, tag: 'READING' },
  'listening-note-map-lecture': { title: 'Note-Taking Strategies for Lectures', author: 'Dr. Michael Brown', time: '22:40', progress: 85, completeText: '85% Complete', thumb: skillImageSources.listening, tag: 'LISTENING' },
  'speaking-independent-response': { title: 'Improving Fluency and Confidence', author: 'Emma Wilson', time: '21:15', progress: 40, completeText: '40% Complete', thumb: skillImageSources.speaking, tag: 'SPEAKING' },
  'writing-integrated-thesis': { title: 'Structuring Academic Essays Effectively', author: 'Dr. James Lee', time: '19:33', progress: 25, completeText: '25% Complete', thumb: skillImageSources.writing, tag: 'WRITING' },
  'vocabulary-academic-word-family': { title: 'Academic Word Family Review', author: 'Akademik Skor', time: '12:10', progress: 76, completeText: '76% Complete', tag: 'VOCABULARY' },
  'grammar-clause-combining': { title: 'Mastering Past Perfect Tense', author: 'Olivia Martinez', time: '14:11', progress: 90, completeText: '90% Complete', tag: 'GRAMMAR' },
  'toefl-current-roadmap': { title: 'TOEFL Current Roadmap', author: 'Akademik Skor', time: '09:00', progress: 0, completeText: 'Ready to start', thumb: skillImageSources.reading, tag: 'GETTING STARTED' },
  'test-strategy-section-pacing': { title: 'Section Pacing Strategy', author: 'Dr. Michael Brown', time: '17:00', progress: 0, completeText: 'Preview available', thumb: skillImageSources.listening, tag: 'TEST STRATEGY' },
};

function categoryTheme(value: ConcreteVideoCategory) {
  if (value === 'getting-started') return { label: 'Getting Started', accent: studentTokens.blue, soft: studentTokens.blueSoft, short: 'G' };
  if (value === 'test-strategies') return { label: 'Test Strategies', accent: studentTokens.orange, soft: studentTokens.orangeSoft, short: 'T' };
  return skillThemes[value];
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function valueFromOptions<TValue extends string>(value: string | undefined, items: VideoFilterOption<TValue>[], fallback: TValue) {
  return items.some((item) => item.value === value) ? value as TValue : fallback;
}

function initialFilterState(params: VideoSearchParams): VideoFilterState {
  const category = valueFromOptions(firstParam(params.skill), videoSkillTabs, 'all');
  const taskOptions = getVideoTaskFilters(category);
  const task = taskOptions.length > 0 ? valueFromOptions(firstParam(params.task), taskOptions, 'all') : 'all';
  const subskillOptions = getVideoSubskillFilters(task);
  const subskill = subskillOptions.length > 0 ? valueFromOptions(firstParam(params.subskill), subskillOptions, 'all') : 'all';

  return {
    query: firstParam(params.q) ?? '',
    category,
    task,
    subskill,
    level: valueFromOptions(firstParam(params.level), videoLevelFilters, 'all'),
    duration: valueFromOptions(firstParam(params.duration), videoDurationFilters, 'all'),
    access: valueFromOptions(firstParam(params.access), videoAccessFilters, 'all'),
    sort: valueFromOptions(firstParam(params.sort), videoSortFilters, 'recommended'),
  };
}

function nextValue<T extends string>(items: { value: T }[], current: T) {
  const index = items.findIndex((item) => item.value === current);
  return items[(index + 1) % items.length]?.value ?? items[0].value;
}

function toneColor(tone: (typeof videoOverviewStats)[number]['tone']) {
  if (tone === 'teal') return studentTokens.teal;
  if (tone === 'orange') return studentTokens.orange;
  if (tone === 'purple') return '#9657e8';
  return studentTokens.blue;
}

function StatCard({ item }: { item: (typeof videoOverviewStats)[number] }) {
  const color = toneColor(item.tone);

  return (
    <Card style={styles.statCard} contentStyle={styles.statBody}>
      <View style={[styles.statIconBox, { backgroundColor: `${color}16` }]}>
        <SymbolView name={item.icon} tintColor={color} size={22} style={styles.statIcon} />
      </View>
      <View style={styles.statCopy}>
        <Text style={styles.statLabel} numberOfLines={1}>{item.label}</Text>
        <Text style={styles.statValue} numberOfLines={1}>{item.value}</Text>
        <Text style={[styles.statDetail, { color }]} numberOfLines={1}>{item.detail}</Text>
      </View>
    </Card>
  );
}

function SkillChip({ value, label, selected, compact, onPress }: { value: VideoCategoryFilterKey; label: string; selected: boolean; compact: boolean; onPress: () => void }) {
  const theme = value === 'all' ? null : categoryTheme(value);
  const icon = value === 'all' ? null : categoryIcons[value];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} video lessons`}
      onPress={onPress}
      style={({ pressed }) => [styles.skillChip, compact ? styles.skillChipCompact : null, selected ? styles.skillChipActive : null, theme && selected ? { borderColor: theme.accent, backgroundColor: theme.soft } : null, pressed ? styles.pressed : null]}
    >
      {theme && icon ? <SymbolView name={icon} tintColor={selected ? theme.accent : studentTokens.text} size={14} style={styles.skillChipIcon} /> : null}
      <Text style={[styles.skillChipText, selected ? styles.skillChipTextActive : null]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function OptionChip<TValue extends string>({ item, selected, compact, onPress }: { item: VideoFilterOption<TValue>; selected: boolean; compact: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.optionChip, compact ? styles.optionChipCompact : null, selected ? styles.optionChipActive : null, pressed ? styles.pressed : null]}>
      <Text style={[styles.optionChipText, selected ? styles.optionChipTextActive : null]} numberOfLines={1}>{item.label}</Text>
    </Pressable>
  );
}
function FilterOptionGroup<TValue extends string>({ title, items, value, compact, onChange }: { title: string; items: VideoFilterOption<TValue>[]; value: TValue; compact: boolean; onChange: (value: TValue) => void }) {
  if (items.length === 0) return null;

  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupTitle}>{title}</Text>
      <View style={styles.optionChipWrap}>
        {items.map((item) => <OptionChip key={item.value} item={item} compact={compact} selected={item.value === value} onPress={() => onChange(item.value)} />)}
      </View>
    </View>
  );
}

function LessonThumbnail({ lesson, compact = false }: { lesson: VideoLesson; compact?: boolean }) {
  const theme = skillThemes[lesson.skill];
  const presentation = lessonPresentation[lesson.id];
  const image = lesson.thumbnail.startsWith('http') ? { uri: lesson.thumbnail } : presentation?.thumb;

  return (
    <View style={[styles.lessonThumb, compact ? styles.lessonThumbCompact : null, { backgroundColor: theme.soft }]}>
      {image ? (
        <Image source={image} style={styles.lessonThumbImage} contentFit="cover" accessibilityLabel={`${theme.label} lesson thumbnail`} />
      ) : (
        <View style={styles.lessonFallback}>
          <SymbolView name={skillIcons[lesson.skill]} tintColor={theme.accent} size={36} style={styles.lessonFallbackIcon} />
          <Text style={[styles.lessonFallbackText, { color: theme.accent }]}>{theme.label}</Text>
        </View>
      )}
      <View style={[styles.lessonTag, { backgroundColor: theme.soft, borderColor: `${theme.accent}55` }]}>
        <Text style={[styles.lessonTagText, { color: theme.accent }]}>{presentation?.tag ?? theme.label.toUpperCase()}</Text>
      </View>
      {lesson.isPremium ? (
        <View style={styles.premiumPill}><Text style={styles.premiumText}>Premium</Text></View>
      ) : null}
      <View style={styles.timePill}><Text style={styles.timeText}>{presentation?.time ?? `${lesson.durationMinutes}:00`}</Text></View>
    </View>
  );
}

function HeroVideo({ lesson, compact }: { lesson: VideoLesson; compact: boolean }) {
  const router = useRouter();
  const theme = skillThemes[lesson.skill];
  const presentation = lessonPresentation[lesson.id];
  const heroProgress = presentation?.progress ?? lesson.progress;

  return (
    <Card style={styles.heroCard} contentStyle={[styles.heroBody, compact ? styles.heroBodyCompact : null]}>
      <View style={[styles.heroMedia, compact ? styles.heroMediaCompact : null]}>
        <Image source={skillImageSources.listening} style={styles.heroImage} contentFit="cover" accessibilityLabel="Current video lesson visual" />
        <View style={styles.heroPlayBubble}>
          <SymbolView name={playSymbol} tintColor="#ffffff" size={22} style={styles.heroPlayIcon} />
        </View>
        <View style={styles.heroTimePill}><Text style={styles.heroTimeText}>24:35</Text></View>
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroLabel}>CONTINUE LEARNING</Text>
        <Text style={styles.heroTitle} numberOfLines={compact ? 2 : 1}>{presentation?.title ?? lesson.title}</Text>
        <Text style={styles.heroSub}>{lesson.module} · {lesson.taskTypeLabel}</Text>
        <Text style={styles.heroText} numberOfLines={compact ? 3 : 2}>{lesson.description}</Text>
        <View style={styles.heroProgressRow}>
          <Text style={styles.heroProgressTime}>24:35 / 34:20</Text>
          <View style={styles.heroTrack}><View style={[styles.heroFill, { width: `${heroProgress}%`, backgroundColor: studentTokens.yellow }]} /></View>
          <Text style={styles.heroProgressValue}>{heroProgress}%</Text>
        </View>
      </View>
      {!compact ? (
        <View style={styles.waveWrap}>
          <Image source={require('@/assets/images/dashboard-waveform.png')} style={styles.waveImage} contentFit="contain" accessibilityLabel="Audio waveform" />
        </View>
      ) : null}
      <Button label="Continue Lesson" size="sm" variant="secondary" onPress={() => router.push(`/learning/videos/${lesson.id}` as Href)} right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={14} style={styles.buttonIcon} />} style={[styles.heroButton, compact ? styles.heroButtonCompact : null]} />
      <View style={[styles.heroGlow, { backgroundColor: `${theme.accent}22` }]} />
    </Card>
  );
}

export function VideoCard({ lesson, user, compact, preview = false }: { lesson: VideoLesson; user: AuthUser; compact: boolean; preview?: boolean }) {
  const router = useRouter();
  const theme = skillThemes[lesson.skill];
  const fullAccess = lesson.access === 'free' || getEntitlementAccess(user, 'video-full-access').allowed;
  const presentation = (!preview && lessonPresentation[lesson.id]) || { title: lesson.title, author: lesson.instructor, progress: lesson.progress, completeText: `${lesson.progress}% Complete` };
  const ctaLabel = lesson.progress > 0 ? 'Continue' : fullAccess ? 'Start Lesson' : 'Preview';

  return (
    <Card style={[styles.videoCard, compact ? styles.videoCardCompact : null]} contentStyle={styles.videoBody}>
      <LessonThumbnail lesson={lesson} compact={compact} />
      <View style={styles.videoCopy}>
        <View style={styles.videoTitleRow}>
          <Text style={styles.videoTitle} numberOfLines={2}>{presentation.title}</Text>
          <SymbolView name={dotsSymbol} tintColor={studentTokens.text} size={17} style={styles.dotsIcon} />
        </View>
        <View style={styles.teacherRow}>
          <View style={[styles.teacherAvatar, { backgroundColor: theme.soft }]}>
            <Text style={[styles.teacherInitial, { color: theme.accent }]}>{presentation.author.charAt(0)}</Text>
          </View>
          <Text style={styles.teacherName} numberOfLines={1}>{presentation.author}</Text>
          {lesson.saved ? <SymbolView name={bookmarkOutlineSymbol} tintColor={studentTokens.text} size={15} style={styles.savedIcon} /> : null}
        </View>
        <View style={styles.metaChipRow}>
          <View style={[styles.metaChip, { backgroundColor: theme.soft, borderColor: `${theme.accent}42` }]}><Text style={[styles.metaChipText, { color: theme.accent }]}>{skillThemes[lesson.skill].label}</Text></View>
          <View style={styles.metaChip}><Text style={styles.metaChipText}>{lesson.taskTypeLabel}</Text></View>
          <View style={styles.metaChip}><Text style={styles.metaChipText}>{lesson.level}</Text></View>
        </View>
        <Text style={styles.videoMetaLine} numberOfLines={1}>{lesson.course} · {lesson.module}</Text>
        <View style={styles.lessonProgressRow}>
          <View style={styles.lessonTrack}><View style={[styles.lessonFill, { width: `${presentation.progress}%`, backgroundColor: theme.accent }]} /></View>
          <Text style={styles.lessonProgressText}>{presentation.completeText}</Text>
        </View>
        <View style={[styles.previewRow, !fullAccess ? styles.previewRowLocked : null]}>
          <SymbolView name={!fullAccess ? lockSymbol : playSymbol} tintColor={!fullAccess ? studentTokens.yellowDeep : theme.accent} size={12} style={styles.previewIcon} />
          <Text style={styles.previewText}>{lesson.previewDuration} min preview</Text>
        </View>
        <Button label={ctaLabel} disabled={preview} size="sm" variant={lesson.progress > 0 ? 'primary' : 'secondary'} onPress={() => router.push(`/learning/videos/${lesson.id}` as Href)} right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.buttonIcon} />} style={styles.cardButton} textStyle={styles.cardButtonText} />
      </View>
    </Card>
  );
}
function FilterSheet({ visible, filters, taskOptions, subskillOptions, onClose, onReset, onChange }: { visible: boolean; filters: VideoFilterState; taskOptions: VideoFilterOption[]; subskillOptions: VideoFilterOption[]; onClose: () => void; onReset: () => void; onChange: (partial: Partial<VideoFilterState>) => void }) {
  return (
    <NativeModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close filters" style={styles.sheetBackdrop} onPress={onClose} />
        <View style={styles.filterSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close filters" onPress={onClose} style={({ pressed }) => [styles.sheetClose, pressed ? styles.pressed : null]}>
              <SymbolView name={closeSymbol} tintColor={studentTokens.navy} size={18} style={styles.sheetCloseIcon} />
            </Pressable>
          </View>
          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
            <FilterOptionGroup title="Task" items={taskOptions} value={filters.task} compact onChange={(task) => onChange({ task, subskill: 'all' })} />
            <FilterOptionGroup title="Subskill" items={subskillOptions} value={filters.subskill} compact onChange={(subskill) => onChange({ subskill })} />
            <FilterOptionGroup title="Level" items={videoLevelFilters} value={filters.level} compact onChange={(level) => onChange({ level })} />
            <FilterOptionGroup title="Duration" items={videoDurationFilters} value={filters.duration} compact onChange={(duration) => onChange({ duration })} />
            <FilterOptionGroup title="Access" items={videoAccessFilters} value={filters.access} compact onChange={(access) => onChange({ access })} />
            <FilterOptionGroup title="Sort" items={videoSortFilters} value={filters.sort} compact onChange={(sort) => onChange({ sort })} />
          </ScrollView>
          <View style={styles.sheetActions}>
            <Button label="Reset" variant="secondary" size="md" onPress={onReset} style={styles.sheetActionButton} />
            <Button label="Done" variant="primary" size="md" onPress={onClose} style={styles.sheetActionButton} />
          </View>
        </View>
      </View>
    </NativeModal>
  );
}

export function VideoLessons({ user }: VideoLessonsProps) {
  const router = useRouter();
  const params = useLocalSearchParams<VideoSearchParams>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 760;
  const isCompact = width < 620;
  const initial = initialFilterState(params);
  const [query, setQuery] = useState(initial.query);
  const [category, setCategory] = useState<VideoCategoryFilterKey>(initial.category);
  const [task, setTask] = useState(initial.task);
  const [subskill, setSubskill] = useState(initial.subskill);
  const [level, setLevel] = useState<'all' | VideoLevel>(initial.level);
  const [duration, setDuration] = useState<VideoDurationFilter>(initial.duration);
  const [access, setAccess] = useState<'all' | VideoAccess>(initial.access);
  const [sort, setSort] = useState<VideoSortMode>(initial.sort);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [catalogSync, setCatalogSync] = useState({ version: 0, loading: true, error: '' });

  useEffect(() => {
    let active = true;
    void syncPublishedVideoCatalog()
      .then(() => { if (active) setCatalogSync((current) => ({ version: current.version + 1, loading: false, error: '' })); })
      .catch((error) => { if (active) setCatalogSync((current) => ({ ...current, loading: false, error: error instanceof Error ? error.message : 'Video catalog could not be refreshed.' })); });
    return () => { active = false; };
  }, []);

  const taskOptions = useMemo(() => getVideoTaskFilters(category), [category]);
  const subskillOptions = useMemo(() => getVideoSubskillFilters(task), [task]);
  const filters = useMemo(() => ({ query, category, task, subskill, level, duration, access, sort }), [access, category, duration, level, query, sort, subskill, task]);
  const catalog = getVideoLessonCatalog();
  const featured = getVideoLessonById('listening-note-map-lecture') ?? catalog[0];
  const dataError = Boolean(catalogSync.error) && catalog.length === 0;
  const isLoading = catalogSync.loading && catalog.length === 0;

  const applyFilters = (partial: Partial<VideoFilterState>) => {
    let next: VideoFilterState = { ...filters, ...partial };

    if (partial.category !== undefined) {
      const nextTaskOptions = getVideoTaskFilters(next.category);
      next = { ...next, task: nextTaskOptions.some((item) => item.value === next.task) ? next.task : 'all', subskill: 'all' };
    }

    if (partial.task !== undefined) {
      const nextSubskillOptions = getVideoSubskillFilters(next.task);
      next = { ...next, subskill: nextSubskillOptions.some((item) => item.value === next.subskill) ? next.subskill : 'all' };
    }

    setQuery(next.query);
    setCategory(next.category);
    setTask(next.task);
    setSubskill(next.subskill);
    setLevel(next.level);
    setDuration(next.duration);
    setAccess(next.access);
    setSort(next.sort);
    router.setParams({ q: next.query, skill: next.category, task: next.task, subskill: next.subskill, level: next.level, duration: next.duration, access: next.access, sort: next.sort });
  };

  const resetFilters = () => applyFilters({ query: '', category: 'all', task: 'all', subskill: 'all', level: 'all', duration: 'all', access: 'all', sort: 'recommended' });
  const visibleLessons = discoverVideoLessons(filters);
  const sortLabel = videoSortFilters.find((item) => item.value === sort)?.label ?? 'Recommended';
  const levelLabel = videoLevelFilters.find((item) => item.value === level)?.label ?? 'All';
  const durationLabel = videoDurationFilters.find((item) => item.value === duration)?.label ?? 'Any';
  const accessLabel = videoAccessFilters.find((item) => item.value === access)?.label ?? 'All';
  const activeFilterCount = [category !== 'all', task !== 'all', subskill !== 'all', level !== 'all', duration !== 'all', access !== 'all', sort !== 'recommended'].filter(Boolean).length;

  if (dataError) {
    return <ErrorState title="Video lessons unavailable" text={catalogSync.error || 'The lesson catalog could not be loaded. Please try again shortly.'} action={<Button label="Retry" variant="secondary" onPress={resetFilters} />} />;
  }

  if (isLoading) {
    return <Skeleton lines={6} />;
  }

  return (
    <View testID="video-lessons-screen" style={styles.screen}>
      <View style={[styles.pageTop, !isTablet ? styles.pageTopCompact : null]}>
        <View style={styles.titleCluster}>
          <View style={styles.titleIconRing}>
            <SymbolView name={playSymbol} tintColor={studentTokens.orange} size={25} style={styles.titleIcon} />
          </View>
          <View style={styles.titleCopy}>
            <Text style={styles.pageTitle}>Video Lessons</Text>
            <Text style={styles.pageText}>Learn at your own pace with expert video lessons.</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          {videoOverviewStats.map((item) => <StatCard key={item.label} item={item} />)}
        </View>
      </View>

      <HeroVideo lesson={featured} compact={isCompact} />

      <View style={[styles.filtersBar, !isTablet ? styles.filtersBarCompact : null]}>
        <ScrollView horizontal={isCompact} showsHorizontalScrollIndicator={false} style={styles.skillScroll} contentContainerStyle={[styles.skillChips, isCompact ? styles.skillChipsScroll : null]}>
          {videoSkillTabs.map((item) => <SkillChip key={item.value} value={item.value} label={item.value === 'all' ? 'All' : item.label} compact={isCompact} selected={category === item.value} onPress={() => applyFilters({ category: item.value })} />)}
        </ScrollView>
        <View style={[styles.filterActions, isCompact ? styles.filterActionsCompact : null]}>
          <View style={[styles.searchWrap, isCompact ? styles.searchWrapCompact : null]}>
            <SymbolView name={searchSymbol} tintColor={studentTokens.muted} size={15} style={styles.searchIcon} />
            <TextInput accessibilityLabel="Search lessons" value={query} onChangeText={(value) => applyFilters({ query: value })} placeholder="Search lessons..." placeholderTextColor={studentTokens.muted} style={styles.searchInput} />
          </View>
          {isCompact ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Open lesson filters" onPress={() => setFiltersOpen(true)} style={({ pressed }) => [styles.mobileFilterButton, pressed ? styles.pressed : null]}>
              <SymbolView name={filterSymbol} tintColor={studentTokens.navy} size={16} style={styles.mobileFilterIcon} />
              <Text style={styles.mobileFilterText}>Filters</Text>
              {activeFilterCount > 0 ? <View style={styles.filterCountBadge}><Text style={styles.filterCountText}>{activeFilterCount}</Text></View> : null}
            </Pressable>
          ) : (
            <>
              <Pressable accessibilityRole="button" onPress={() => applyFilters({ sort: nextValue(videoSortFilters, sort) })} style={({ pressed }) => [styles.selectButton, pressed ? styles.pressed : null]}>
                <Text style={styles.selectText}>Sort: {sortLabel}</Text>
                <SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.selectIcon} />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => applyFilters({ level: nextValue(videoLevelFilters, level) })} style={({ pressed }) => [styles.selectButton, pressed ? styles.pressed : null]}>
                <Text style={styles.selectText}>Level: {levelLabel.replace('All Levels', 'All')}</Text>
                <SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.selectIcon} />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => applyFilters({ duration: nextValue(videoDurationFilters, duration) })} style={({ pressed }) => [styles.selectButton, pressed ? styles.pressed : null]}>
                <Text style={styles.selectText}>Duration: {durationLabel.replace('Any Duration', 'Any')}</Text>
                <SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.selectIcon} />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => applyFilters({ access: nextValue(videoAccessFilters, access) })} style={({ pressed }) => [styles.selectButton, pressed ? styles.pressed : null]}>
                <Text style={styles.selectText}>Access: {accessLabel.replace('Free + Premium', 'All')}</Text>
                <SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.selectIcon} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {!isCompact && category !== 'all' ? (
        <View style={styles.taxonomyFilters}>
          <FilterOptionGroup title="Task" items={taskOptions} value={task} compact={false} onChange={(nextTask) => applyFilters({ task: nextTask, subskill: 'all' })} />
          <FilterOptionGroup title="Subskill" items={subskillOptions} value={subskill} compact={false} onChange={(nextSubskill) => applyFilters({ subskill: nextSubskill })} />
        </View>
      ) : null}

      <FilterSheet visible={isCompact && filtersOpen} filters={filters} taskOptions={taskOptions} subskillOptions={subskillOptions} onClose={() => setFiltersOpen(false)} onReset={resetFilters} onChange={applyFilters} />

      {visibleLessons.length > 0 ? (
        <View style={[styles.videoGrid, isTablet ? styles.videoGridTablet : null]}>
          {visibleLessons.map((lesson) => <VideoCard key={lesson.id} lesson={lesson} user={user} compact={isCompact} />)}
        </View>
      ) : (
        <EmptyState title="No lessons found" text="Change the search, taxonomy, level, duration, or access filter to see more video lessons." action={<Button label="Clear filters" variant="secondary" onPress={resetFilters} />} />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { gap: 10 },
  pageTop: { alignItems: 'stretch', gap: 14 },
  pageTopCompact: { alignItems: 'stretch', flexDirection: 'column' },
  titleCluster: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0, minWidth: 240 },
  titleIconRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: studentTokens.orange, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  titleIcon: { width: 25, height: 25 },
  titleCopy: { minWidth: 0 },
  pageTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  pageText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 12, lineHeight: 17, fontWeight: '500', marginTop: 2 },
  statsGrid: { width: '100%', minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 10 },
  statCard: { flexGrow: 1, flexBasis: 210, maxWidth: 260, minWidth: 190, padding: 0, borderRadius: 9, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 7 } },
  statBody: { minHeight: 68, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statIcon: { width: 22, height: 22 },
  statCopy: { flex: 1, minWidth: 0 },
  statLabel: { fontFamily: fontFamily, color: '#4f5870', fontSize: 8, lineHeight: 11, fontWeight: '700' },
  statValue: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 14, lineHeight: 18, fontWeight: '700', marginTop: 2 },
  statDetail: { fontFamily: fontFamily, fontSize: 8, lineHeight: 11, fontWeight: '700', marginTop: 2 },
  heroCard: { position: 'relative', padding: 0, borderRadius: 11, borderColor: '#061f55', backgroundColor: '#001b48', overflow: 'hidden', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  heroBody: { minHeight: 126, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroBodyCompact: { minHeight: 0, flexDirection: 'column', alignItems: 'stretch', padding: 14, gap: 12 },
  heroMedia: { width: 248, height: 102, borderRadius: 8, overflow: 'hidden', backgroundColor: '#081d45', flexShrink: 0 },
  heroMediaCompact: { width: '100%', height: 154 },
  heroImage: { width: '100%', height: '100%' },
  heroPlayBubble: { position: 'absolute', left: 15, bottom: 14, width: 35, height: 35, borderRadius: 18, backgroundColor: studentTokens.orange, alignItems: 'center', justifyContent: 'center' },
  heroPlayIcon: { width: 22, height: 22 },
  heroTimePill: { position: 'absolute', right: 7, bottom: 7, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.66)', paddingHorizontal: 5, paddingVertical: 2 },
  heroTimeText: { fontFamily: fontFamily, color: '#ffffff', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  heroCopy: { flex: 1, minWidth: 0, flexShrink: 0 },
  heroLabel: { fontFamily: fontFamily, color: '#ff733c', fontSize: 9, lineHeight: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 3 },
  heroTitle: { fontFamily: fontFamily, color: '#ffffff', fontSize: 19, lineHeight: 24, fontWeight: '700', flexShrink: 1 },
  heroSub: { fontFamily: fontFamily, color: '#ffffff', fontSize: 11, lineHeight: 15, fontWeight: '700', marginTop: 1 },
  heroText: { fontFamily: fontFamily, color: '#d8e3ff', fontSize: 10, lineHeight: 15, fontWeight: '500', marginTop: 6, maxWidth: 440, flexShrink: 1 },
  heroProgressRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  heroProgressTime: { fontFamily: fontFamily, color: '#ffffff', fontSize: 10, lineHeight: 14, fontWeight: '600' },
  heroTrack: { height: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden', flex: 1, minWidth: 96, maxWidth: 230 },
  heroFill: { height: '100%', borderRadius: 999 },
  heroProgressValue: { fontFamily: fontFamily, color: studentTokens.yellow, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  waveWrap: { width: 210, height: 68, alignItems: 'center', justifyContent: 'center', flexShrink: 1, overflow: 'hidden' },
  waveImage: { width: 210, height: 68, opacity: 0.34 },
  heroButton: { minWidth: 148, borderRadius: 8, minHeight: 38 },
  heroButtonCompact: { width: '100%', minWidth: 0, alignSelf: 'stretch', marginTop: 4 },
  heroGlow: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 170, opacity: 0.35 },
  filtersBar: { alignItems: 'stretch', gap: 12, zIndex: 1 },
  filtersBarCompact: { gap: 10 },
  skillScroll: { width: '100%', flexGrow: 0, flexShrink: 1 },
  skillChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  skillChipsScroll: { flexWrap: 'nowrap', paddingRight: 10 },
  skillChip: { minHeight: 31, borderRadius: 7, borderWidth: 1, borderColor: '#e1e6ee', backgroundColor: studentTokens.surface, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  skillChipCompact: { minHeight: 44, paddingHorizontal: 13 },
  skillChipActive: { backgroundColor: '#001b48', borderColor: '#001b48' },
  skillChipIcon: { width: 14, height: 14 },
  skillChipText: { fontFamily: fontFamily, color: '#4f5870', fontSize: 10, lineHeight: 14, fontWeight: '700' },
  skillChipTextActive: { color: '#ffffff' },
  filterActions: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  filterActionsCompact: { flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'stretch' },
  searchWrap: { width: 260, minHeight: 31, borderRadius: 7, borderWidth: 1, borderColor: '#e1e6ee', backgroundColor: studentTokens.surface, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  searchWrapCompact: { flex: 1, width: 'auto', minHeight: 44 },
  searchIcon: { width: 15, height: 15, marginLeft: 9, flexShrink: 0 },
  searchInput: { fontFamily: fontFamily, flex: 1, minWidth: 0, minHeight: 29, borderWidth: 0, paddingHorizontal: 8, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '600', outlineStyle: 'none' as never },
  selectButton: { minHeight: 31, borderRadius: 7, borderWidth: 1, borderColor: '#e1e6ee', backgroundColor: studentTokens.surface, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  selectText: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  selectIcon: { width: 13, height: 13 },
  mobileFilterButton: { minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: '#d6deeb', backgroundColor: studentTokens.surface, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  mobileFilterIcon: { width: 16, height: 16 },
  mobileFilterText: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  filterCountBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: studentTokens.yellow, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  filterCountText: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 9, lineHeight: 11, fontWeight: '700' },
  taxonomyFilters: { gap: 8, paddingTop: 2 },
  filterGroup: { gap: 6 },
  filterGroupTitle: { fontFamily: fontFamily, color: '#4f5870', fontSize: 8, lineHeight: 11, fontWeight: '700', textTransform: 'uppercase' },
  optionChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  optionChip: { minHeight: 31, borderRadius: 7, borderWidth: 1, borderColor: '#e1e6ee', backgroundColor: studentTokens.surface, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  optionChipCompact: { minHeight: 44, paddingHorizontal: 13 },
  optionChipActive: { backgroundColor: '#001b48', borderColor: '#001b48' },
  optionChipText: { fontFamily: fontFamily, color: '#4f5870', fontSize: 10, lineHeight: 14, fontWeight: '700' },
  optionChipTextActive: { color: '#ffffff' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 11, 35, 0.36)' },
  sheetBackdrop: { ...StyleSheet.absoluteFill },
  filterSheet: { maxHeight: '88%', borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: studentTokens.surface, borderWidth: 1, borderColor: '#dfe5ef', paddingTop: 8, overflow: 'hidden' },
  sheetHandle: { width: 42, height: 4, borderRadius: 999, backgroundColor: '#d7deea', alignSelf: 'center', marginBottom: 8 },
  sheetHead: { minHeight: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#edf0f5' },
  sheetTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  sheetClose: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sheetCloseIcon: { width: 18, height: 18 },
  sheetScroll: { flexGrow: 0 },
  sheetContent: { paddingHorizontal: 16, paddingVertical: 14, gap: 14, paddingBottom: 16 },
  sheetActions: { padding: 14, borderTopWidth: 1, borderTopColor: '#edf0f5', flexDirection: 'row', gap: 10, backgroundColor: studentTokens.surface },
  sheetActionButton: { flex: 1, minHeight: 44 },
  videoGrid: { gap: 10 },
  videoGridTablet: { flexDirection: 'row', flexWrap: 'wrap' },
  videoCard: { flexGrow: 1, flexShrink: 1, flexBasis: 232, minWidth: 220, padding: 0, borderRadius: 9, borderColor: '#e5eaf2', overflow: 'hidden', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  videoCardCompact: { flexBasis: '100%', minWidth: 0 },
  videoBody: { gap: 0 },
  lessonThumb: { height: 124, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  lessonThumbCompact: { height: 148 },
  lessonThumbImage: { width: '100%', height: '100%' },
  lessonFallback: { alignItems: 'center', justifyContent: 'center', gap: 7 },
  lessonFallbackIcon: { width: 36, height: 36 },
  lessonFallbackText: { fontFamily: fontFamily, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  lessonTag: { position: 'absolute', left: 8, top: 8, borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 2 },
  lessonTagText: { fontFamily: fontFamily, fontSize: 7, lineHeight: 10, fontWeight: '700' },
  premiumPill: { position: 'absolute', right: 8, top: 8, borderRadius: 4, backgroundColor: '#fff0c4', borderWidth: 1, borderColor: '#ffd66b', paddingHorizontal: 6, paddingVertical: 2 },
  premiumText: { fontFamily: fontFamily, color: '#8a6100', fontSize: 8, lineHeight: 10, fontWeight: '700' },
  timePill: { position: 'absolute', right: 7, bottom: 7, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.66)', paddingHorizontal: 5, paddingVertical: 2 },
  timeText: { fontFamily: fontFamily, color: '#ffffff', fontSize: 8, lineHeight: 10, fontWeight: '700' },
  videoCopy: { padding: 10, gap: 7 },
  videoTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  videoTitle: { fontFamily: fontFamily, flex: 1, minWidth: 0, color: studentTokens.ink, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  dotsIcon: { width: 17, height: 17, flexShrink: 0 },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teacherAvatar: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  teacherInitial: { fontFamily: fontFamily, fontSize: 8, lineHeight: 10, fontWeight: '700' },
  teacherName: { fontFamily: fontFamily, flex: 1, minWidth: 0, color: '#4f5870', fontSize: 8, lineHeight: 11, fontWeight: '700' },
  savedIcon: { width: 15, height: 15, flexShrink: 0 },
  metaChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  metaChip: { minHeight: 18, borderRadius: 5, borderWidth: 1, borderColor: '#e4e9f2', backgroundColor: '#f7f9fc', paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  metaChipText: { fontFamily: fontFamily, color: '#53607a', fontSize: 7, lineHeight: 10, fontWeight: '700' },
  videoMetaLine: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '600' },
  lessonProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  lessonTrack: { flex: 1, minWidth: 52, height: 4, borderRadius: 99, backgroundColor: '#e9edf3', overflow: 'hidden' },
  lessonFill: { height: '100%', borderRadius: 99 },
  lessonProgressText: { fontFamily: fontFamily, color: '#6e778b', fontSize: 7, lineHeight: 10, fontWeight: '700', width: 70, textAlign: 'right' },
  previewRow: { minHeight: 20, borderRadius: 6, backgroundColor: '#f7f9fc', borderWidth: 1, borderColor: '#e4e9f2', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, alignSelf: 'flex-start' },
  previewRowLocked: { backgroundColor: studentTokens.yellowSoft, borderColor: '#f5d574' },
  previewIcon: { width: 12, height: 12 },
  previewText: { fontFamily: fontFamily, color: '#826400', fontSize: 8, lineHeight: 10, fontWeight: '700' },
  cardButton: { width: '100%', minHeight: 28, borderRadius: 6 },
  cardButtonText: { fontFamily: fontFamily, fontSize: 9, lineHeight: 12 },
  buttonIcon: { width: 14, height: 14 },
  pressed: { opacity: 0.72 },
});
