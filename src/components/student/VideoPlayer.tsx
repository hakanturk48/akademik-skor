import { createElement, useEffect, useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Linking, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button, Card, ErrorState, Input, Progress, Tabs, Toast, studentTokens } from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';
import { getEntitlementAccess } from '@/lib/permissions';
import { formatVideoTimestamp, getVideoEmbedUrl } from '@/lib/video-media';
import { getVideoUploadUrl, revokeVideoUploadUrl } from '@/lib/video-upload';
import { getCourseVideoLessons, getRelatedVideoLessons, getVideoLessonById, skillThemes, type LearningSkillKey, type VideoLesson } from '@/lib/student-learning';

const fontFamily = 'Quicksand';

type VideoPlayerProps = {
  user: AuthUser;
  lessonId: string;
};

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };
type PlayerTab = 'overview' | 'notes' | 'transcript' | 'resources';
type CourseLessonState = 'done' | 'active' | 'available' | 'locked';
type CourseLessonItem = {
  id: string;
  number: string;
  title: string;
  time: string;
  state: CourseLessonState;
};
type LessonPresentation = {
  title: string;
  shortTitle: string;
  author: string;
  module: string;
  course: string;
  time: string;
  watched: string;
  progress: number;
  thumb?: number;
  tag: string;
  updated: string;
  sectionScore: number;
};

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const arrowSymbol = symbolName('chevron.right', 'chevron_right');
const playSymbol = symbolName('play.fill', 'play_arrow');
const homeSymbol = symbolName('house.fill', 'home');
const bookSymbol = symbolName('book', 'menu_book');
const headphonesSymbol = symbolName('headphones', 'headphones');
const micSymbol = symbolName('mic', 'mic');
const writingSymbol = symbolName('square.and.pencil', 'edit_square');
const grammarSymbol = symbolName('text.book.closed', 'library_books');
const vocabSymbol = symbolName('textformat.abc', 'abc');
const checkSymbol = symbolName('checkmark', 'check');
const lockSymbol = symbolName('lock.fill', 'lock');
const bookmarkSymbol = symbolName('bookmark.fill', 'bookmark');
const documentSymbol = symbolName('doc.text', 'description');
const downloadSymbol = symbolName('arrow.down.doc', 'download');
const clockSymbol = symbolName('clock', 'schedule');
const targetSymbol = symbolName('target', 'track_changes');
const shareSymbol = symbolName('square.and.arrow.up', 'share');
const ccSymbol = symbolName('captions.bubble', 'closed_caption');
const settingsSymbol = symbolName('gearshape', 'settings');
const fullscreenSymbol = symbolName('arrow.up.left.and.arrow.down.right', 'fullscreen');
const volumeSymbol = symbolName('speaker.wave.2', 'volume_up');

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
  listening: require('@/assets/images/academic-hero.png'),
  speaking: require('@/assets/images/skill-speaking.png'),
  writing: require('@/assets/images/skill-writing.png'),
};

const lessonPresentation: Record<string, LessonPresentation> = {
  'reading-inference-mini-lesson': { title: 'Academic Reading - Inference Mini Lesson', shortTitle: 'Identifying Author Purpose in Academic Texts', author: 'Sarah Johnson', module: 'Reading - Main Idea', course: 'Academic Reading', time: '16:28', watched: '08:40', progress: 60, thumb: skillImageSources.reading, tag: 'READING', updated: 'May 20, 2026', sectionScore: 24 },
  'listening-note-map-lecture': { title: 'Academic Listening - Lecture 03: Note Taking', shortTitle: 'Note-Taking Strategies for Lectures', author: 'Emma Johnson', module: 'Lecture 03 - Academic Listening', course: 'Academic Listening', time: '34:20', watched: '05:00', progress: 72, thumb: skillImageSources.listening, tag: 'LISTENING', updated: 'May 26, 2026', sectionScore: 22 },
  'speaking-independent-response': { title: 'Academic Speaking - Task 02: Independent Response', shortTitle: 'Improving Fluency and Confidence', author: 'Emma Wilson', module: 'Speaking - Task 02', course: 'Academic Speaking', time: '21:15', watched: '09:10', progress: 40, thumb: skillImageSources.speaking, tag: 'SPEAKING', updated: 'May 21, 2026', sectionScore: 23 },
  'writing-integrated-thesis': { title: 'Academic Writing - Integrated Task Structure', shortTitle: 'Structuring Academic Essays Effectively', author: 'Dr. James Lee', module: 'Writing - Integrated Task', course: 'Academic Writing', time: '19:33', watched: '04:50', progress: 25, thumb: skillImageSources.writing, tag: 'WRITING', updated: 'May 18, 2026', sectionScore: 23 },
  'vocabulary-academic-word-family': { title: 'Academic Vocabulary - Word Family Review', shortTitle: 'Academic Word Family Review', author: 'Akademik Skor', module: 'Vocabulary - Academic Words', course: 'Academic Vocabulary', time: '12:10', watched: '09:20', progress: 76, tag: 'VOCABULARY', updated: 'May 14, 2026', sectionScore: 21 },
  'grammar-clause-combining': { title: 'Academic Grammar - Clause Combining', shortTitle: 'Mastering Past Perfect Tense', author: 'Olivia Martinez', module: 'Grammar - Sentence Control', course: 'Academic Grammar', time: '14:11', watched: '12:46', progress: 90, tag: 'GRAMMAR', updated: 'May 12, 2026', sectionScore: 22 },
};

const playerTabs: { value: PlayerTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'notes', label: 'Notes' },
  { value: 'transcript', label: 'Transcript' },
  { value: 'resources', label: 'Resources' },
];


const resourceFiles = [
  { title: 'Note Taking Strategies (PDF)', meta: 'PDF - 1.2 MB' },
  { title: 'Lecture 03 Worksheet', meta: 'PDF - 892 KB' },
  { title: 'Abbreviations & Symbols Guide', meta: 'PDF - 615 KB' },
];

function presentationForLesson(lesson: VideoLesson): LessonPresentation {
  return lessonPresentation[lesson.id] ?? {
    title: lesson.title,
    shortTitle: lesson.title,
    author: lesson.instructor,
    module: lesson.subtitle,
    course: skillThemes[lesson.skill].label,
    time: `${lesson.durationMinutes}:00`,
    watched: '00:00',
    progress: lesson.progress,
    thumb: skillImageSources[lesson.skill],
    tag: skillThemes[lesson.skill].label.toUpperCase(),
    updated: lesson.updatedAt,
    sectionScore: 21,
  };
}

function PlayerFrame({ lesson, fullAccess, compact, showQualityMenu }: { lesson: VideoLesson; fullAccess: boolean; compact: boolean; showQualityMenu: boolean }) {
  const theme = skillThemes[lesson.skill];
  const presentation = presentationForLesson(lesson);
  const poster = lesson.thumbnail.startsWith('http') ? { uri: lesson.thumbnail } : presentation.thumb ?? skillImageSources[lesson.skill];
  const embedUrl = getVideoEmbedUrl(lesson.mediaProvider, lesson.mediaUrl);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (lesson.mediaProvider !== 'upload') return () => {};
    void getVideoUploadUrl(lesson.mediaUrl).then((url) => {
      if (active) setUploadedVideoUrl(url);
      else revokeVideoUploadUrl(url);
    }).catch(() => {});
    return () => {
      active = false;
      setUploadedVideoUrl((url) => {
        revokeVideoUploadUrl(url);
        return null;
      });
    };
  }, [lesson.mediaProvider, lesson.mediaUrl]);
  const externalVideoAvailable = Boolean((embedUrl || uploadedVideoUrl) && (!lesson.isPremium || fullAccess));

  if (uploadedVideoUrl && externalVideoAvailable && Platform.OS === 'web') {
    return (
      <View style={[styles.videoFrame, compact ? styles.videoFrameCompact : null, styles.externalVideoFrame]}>
        {createElement('video', { src: uploadedVideoUrl, controls: true, playsInline: true, poster: typeof poster === 'object' && poster && 'uri' in poster ? poster.uri : undefined, style: { width: '100%', height: '100%', display: 'block', objectFit: 'contain', backgroundColor: '#111827' } })}
      </View>
    );
  }

  if (externalVideoAvailable && Platform.OS === 'web') {
    return (
      <View style={[styles.videoFrame, compact ? styles.videoFrameCompact : null, styles.externalVideoFrame]}>
        {createElement('iframe', {
          src: embedUrl,
          title: lesson.title,
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          allowFullScreen: true,
          style: { border: 0, width: '100%', height: '100%', display: 'block' },
        })}
      </View>
    );
  }

  return (
    <View style={[styles.videoFrame, compact ? styles.videoFrameCompact : null]}>
      {poster ? <Image source={poster} style={styles.videoPoster} contentFit="cover" accessibilityLabel={`${theme.label} video preview`} /> : null}
      <View style={styles.videoOverlay} />
      {externalVideoAvailable && lesson.mediaUrl && Platform.OS !== 'web' ? (
        <Pressable accessibilityRole="button" onPress={() => void Linking.openURL(lesson.mediaUrl!)} style={styles.externalOpenButton}>
          <Text style={styles.externalOpenText}>Videoyu aç</Text>
        </Pressable>
      ) : null}
      <View style={styles.freePreviewBadge}>
        <Text style={styles.freePreviewText}>{fullAccess ? 'FULL LESSON' : 'FREE PREVIEW'}</Text>
      </View>
      {showQualityMenu ? (
        <View style={styles.qualityMenu}>
          <Text style={styles.qualityTitle}>Quality</Text>
          {['1080p HD', '720p HD', '480p', '360p'].map((item, index) => <Text key={item} style={[styles.qualityItem, index === 0 ? styles.qualityItemActive : null]}>{item}{index === 0 ? '  ✓' : ''}</Text>)}
          <View style={styles.qualityDivider} />
          <Text style={styles.qualityTitle}>Playback Speed</Text>
          {['0.75x', '1.0x', '1.25x', '1.5x', '2.0x'].map((item, index) => <Text key={item} style={[styles.qualityItem, index === 1 ? styles.qualityItemActive : null]}>{item}{index === 1 ? '  ✓' : ''}</Text>)}
        </View>
      ) : null}
      <View style={styles.playerControlBar}>
        <View style={styles.controlIconButton}>
          <SymbolView name={playSymbol} tintColor="#ffffff" size={18} style={styles.controlIcon} />
        </View>
        <View style={styles.controlIconButtonSmall}>
          <SymbolView name={volumeSymbol} tintColor="#ffffff" size={16} style={styles.controlIconSmall} />
        </View>
        <Text style={styles.playerTime}>{presentation.watched} / {presentation.time}</Text>
        <View style={styles.playerTrack}>
          <View style={[styles.playerFill, { width: `${presentation.progress}%` }]} />
          <View style={[styles.playerThumb, { left: `${presentation.progress}%` }]} />
        </View>
        <Text style={styles.playerPercent}>{presentation.progress}%</Text>
        {!compact ? (
          <View style={styles.playerToolGroup}>
            <SymbolView name={ccSymbol} tintColor="#ffffff" size={15} style={styles.toolIcon} />
            <SymbolView name={settingsSymbol} tintColor="#ffffff" size={15} style={styles.toolIcon} />
            <SymbolView name={fullscreenSymbol} tintColor="#ffffff" size={15} style={styles.toolIcon} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
function UnlockStrip({ fullAccess, compact }: { fullAccess: boolean; compact: boolean }) {
  const router = useRouter();

  return (
    <View style={[styles.unlockStrip, compact ? styles.unlockStripCompact : null]}>
      <View style={styles.unlockMessage}>
        <View style={styles.unlockIconBox}>
          <SymbolView name={fullAccess ? checkSymbol : lockSymbol} tintColor={studentTokens.navy} size={17} style={styles.unlockIcon} />
        </View>
        <View style={styles.unlockCopy}>
          <Text style={styles.unlockTitle}>{fullAccess ? 'Full lesson unlocked' : 'Free preview ends at 05:00 / 34:20'}</Text>
          <Text style={styles.unlockText}>{fullAccess ? 'Transcript, resources, and full player controls are active.' : 'Unlock the full lesson to continue learning without limits.'}</Text>
        </View>
      </View>
      <View style={[styles.unlockActions, compact ? styles.unlockActionsCompact : null]}>
        <Button label={fullAccess ? 'Lesson Unlocked' : 'Unlock Full Lesson'} size="sm" variant="primary" left={<SymbolView name={fullAccess ? checkSymbol : lockSymbol} tintColor={studentTokens.navy} size={14} style={styles.buttonIcon} />} onPress={() => router.push('/account/subscription' as Href)} style={[styles.unlockButton, compact ? styles.unlockButtonCompact : null]} />
        <Button label="Explore Premium" size="sm" variant="secondary" onPress={() => router.push('/account/subscription' as Href)} style={[styles.unlockButton, compact ? styles.unlockButtonCompact : null]} />
      </View>
    </View>
  );
}

function PlayerPanel({ lesson, fullAccess, compact, showQualityMenu }: { lesson: VideoLesson; fullAccess: boolean; compact: boolean; showQualityMenu: boolean }) {
  return (
    <Card style={styles.playerCard} contentStyle={styles.playerCardBody}>
      <PlayerFrame lesson={lesson} fullAccess={fullAccess} compact={compact} showQualityMenu={showQualityMenu} />
      <UnlockStrip fullAccess={fullAccess} compact={compact} />
    </Card>
  );
}

function LessonFact({ icon, label, value, color }: { icon: AppSymbolName; label: string; value: string; color: string }) {
  return (
    <View style={styles.factRow}>
      <View style={[styles.factIconBox, { backgroundColor: `${color}16` }]}>
        <SymbolView name={icon} tintColor={color} size={15} style={styles.factIcon} />
      </View>
      <View style={styles.factCopy}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

function OverviewContent({ lesson, fullAccess, wide }: { lesson: VideoLesson; fullAccess: boolean; wide: boolean }) {
  const theme = skillThemes[lesson.skill];
  const presentation = presentationForLesson(lesson);

  return (
    <View style={[styles.overviewGrid, wide ? styles.overviewGridWide : null]}>
      <View style={styles.overviewAbout}>
        <Text style={styles.sectionMiniTitle}>About this lecture</Text>
        <Text style={styles.aboutText}>{lesson.description}</Text>
        <Text style={styles.sectionMiniTitle}>Learning Outcomes</Text>
        <View style={styles.outcomeList}>
          {lesson.outcomes.map((outcome) => (
            <View key={outcome} style={styles.outcomeRow}>
              <View style={styles.outcomeCheck}>
                <SymbolView name={checkSymbol} tintColor={studentTokens.teal} size={10} style={styles.outcomeCheckIcon} />
              </View>
              <Text style={styles.outcomeText}>{outcome}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.overviewFacts}>
        <LessonFact icon={clockSymbol} label="Duration" value={presentation.time} color={studentTokens.blue} />
        <LessonFact icon={targetSymbol} label="Estimated TOEFL" value={`${presentation.sectionScore}/30`} color={theme.accent} />
        <LessonFact icon={headphonesSymbol} label="Instructor" value={`${presentation.author} - TOEFL iBT Skill Expert`} color={studentTokens.teal} />
        <LessonFact icon={documentSymbol} label="Last Updated" value={presentation.updated} color={studentTokens.orange} />
        <View style={styles.scoreNote}>
          <Text style={styles.scoreNoteTitle}>Practice Accuracy /100</Text>
          <Progress value={presentation.progress} color={theme.accent} />
          <Text style={styles.scoreNoteText}>{fullAccess ? 'Full lesson progress is available.' : 'Free plan tracks preview progress only.'}</Text>
        </View>
      </View>
    </View>
  );
}

function ResourceRow({ resource, fullAccess }: { resource: VideoLesson['resources'][number]; fullAccess: boolean }) {
  const locked = Boolean(resource.premium && !fullAccess);

  return (
    <View style={[styles.resourceRow, locked ? styles.resourceRowLocked : null]}>
      <View style={styles.resourceIconBox}>
        <SymbolView name={locked ? lockSymbol : documentSymbol} tintColor={locked ? studentTokens.muted : studentTokens.orange} size={17} style={styles.resourceIcon} />
      </View>
      <View style={styles.resourceCopy}>
        <Text style={styles.resourceTitle}>{resource.title}</Text>
        <Text style={styles.resourceMeta}>{resource.type}{locked ? ' - Premium required' : ' - Ready to download'}</Text>
      </View>
      <Button label={locked ? 'Locked' : 'Download'} size="sm" variant={locked ? 'secondary' : 'soft'} disabled={locked} right={!locked ? <SymbolView name={downloadSymbol} tintColor={studentTokens.teal} size={13} style={styles.buttonIcon} /> : undefined} style={styles.resourceButton} />
    </View>
  );
}

function TranscriptRow({ text, index, fullAccess, timestamp }: { text: string; index: number; fullAccess: boolean; timestamp?: string }) {
  const locked = !fullAccess && index > 0;

  return (
    <View style={[styles.transcriptRow, locked ? styles.transcriptRowLocked : null]}>
      <Text style={styles.transcriptTime}>{timestamp ?? ('0' + String(index + 1) + ':20')}</Text>
      <Text style={styles.transcriptText}>{locked ? 'Premium unlock required for the rest of this transcript.' : text}</Text>
    </View>
  );
}

function NotesContent({ lesson }: { lesson: VideoLesson }) {
  return (
    <View style={styles.notesStack}>
      <Text style={styles.aboutText}>{lesson.notesPrompt}</Text>
      <Input label="My Notes" multiline numberOfLines={5} placeholder="Write key abbreviations, symbols, or next-practice reminders." style={styles.notesInput} helper="Demo state: saved notes should be scoped to the signed-in student." />
    </View>
  );
}

function TabContent({ tab, lesson, fullAccess, wide }: { tab: PlayerTab; lesson: VideoLesson; fullAccess: boolean; wide: boolean }) {
  if (tab === 'notes') return <NotesContent lesson={lesson} />;

  if (tab === 'transcript') {
    return (
      <View style={styles.tabStack}>
        {lesson.transcript.map((line, index) => <TranscriptRow key={`${line}-${index}`} text={line} index={index} fullAccess={fullAccess} timestamp={lesson.transcriptLines?.[index] ? formatVideoTimestamp(lesson.transcriptLines[index].startSeconds) : undefined} />)}
      </View>
    );
  }

  if (tab === 'resources') {
    return (
      <View style={styles.tabStack}>
        {lesson.resources.map((resource) => <ResourceRow key={resource.title} resource={resource} fullAccess={fullAccess} />)}
      </View>
    );
  }

  return <OverviewContent lesson={lesson} fullAccess={fullAccess} wide={wide} />;
}

function DetailPanel({ lesson, fullAccess, tab, onTabChange, wide }: { lesson: VideoLesson; fullAccess: boolean; tab: PlayerTab; onTabChange: (tab: PlayerTab) => void; wide: boolean }) {
  return (
    <Card style={styles.detailPanel} contentStyle={styles.detailPanelBody}>
      <Tabs items={playerTabs} value={tab} onChange={onTabChange} />
      <View style={styles.tabContent}>
        <TabContent tab={tab} lesson={lesson} fullAccess={fullAccess} wide={wide} />
      </View>
    </Card>
  );
}

function CourseLessonRow({ item }: { item: CourseLessonItem }) {
  const router = useRouter();
  const active = item.state === 'active';
  const done = item.state === 'done';
  const locked = item.state === 'locked';
  const playable = item.state === 'available';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: active || locked }}
      disabled={active || locked}
      onPress={() => router.push(`/learning/videos/${item.id}` as Href)}
      style={({ pressed }) => [styles.courseLessonRow, active ? styles.courseLessonActive : null, locked ? styles.courseLessonLocked : null, pressed ? styles.pressed : null]}
    >
      <Text style={[styles.courseLessonNumber, active ? styles.courseLessonNumberActive : null]}>{item.number}</Text>
      <View style={styles.courseLessonCopy}>
        <Text style={styles.courseLessonTitle} numberOfLines={2}>{item.title}</Text>
      </View>
      <Text style={styles.courseLessonTime}>{item.time}</Text>
      <View style={[styles.courseLessonState, active ? styles.courseLessonStateActive : null]}>
        <SymbolView name={done ? checkSymbol : active || playable ? playSymbol : lockSymbol} tintColor={done ? studentTokens.teal : active || playable ? studentTokens.yellowDeep : studentTokens.muted} size={12} style={styles.courseLessonIcon} />
      </View>
    </Pressable>
  );
}

function LessonsInCourse({ lessons, currentLessonId, fullAccess }: { lessons: VideoLesson[]; currentLessonId: string; fullAccess: boolean }) {
  const router = useRouter();
  const activeIndex = Math.max(0, lessons.findIndex((lesson) => lesson.id === currentLessonId));
  const items: CourseLessonItem[] = lessons.map((lesson, index) => ({
    id: lesson.id,
    number: String(index + 1).padStart(2, '0'),
    title: lesson.title,
    time: presentationForLesson(lesson).time,
    state: lesson.id === currentLessonId ? 'active' : index < activeIndex || lesson.progress >= 100 ? 'done' : lesson.isPremium && !fullAccess ? 'locked' : 'available',
  }));
  const countLabel = `${items.length} ${items.length === 1 ? 'Lesson' : 'Lessons'}`;
  const overviewHref = `/learning/videos?skill=${lessons[0]?.category ?? 'all'}` as Href;

  if (items.length === 0) return null;

  return (
    <Card style={styles.sidePanel} contentStyle={styles.sidePanelBody}>
      <View style={styles.sideHead}>
        <Text style={styles.sideTitle}>LESSONS IN THIS COURSE</Text>
        <Text style={styles.sideCount}>{countLabel}</Text>
      </View>
      <View style={styles.courseList}>
        {items.map((item) => <CourseLessonRow key={item.id} item={item} />)}
      </View>
      <Button label="View Course Overview" size="sm" variant="secondary" onPress={() => router.push(overviewHref)} right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.buttonIcon} />} style={styles.sideFullButton} />
    </Card>
  );
}

function ResourceFileRow({ item }: { item: (typeof resourceFiles)[number] }) {
  return (
    <View style={styles.fileRow}>
      <View style={styles.fileIconBox}>
        <SymbolView name={documentSymbol} tintColor={studentTokens.orange} size={16} style={styles.fileIcon} />
      </View>
      <View style={styles.fileCopy}>
        <Text style={styles.fileTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.fileMeta}>{item.meta}</Text>
      </View>
      <SymbolView name={downloadSymbol} tintColor={studentTokens.navy} size={15} style={styles.downloadIcon} />
    </View>
  );
}

function ResourcesPanel() {
  return (
    <Card style={styles.sidePanel} contentStyle={styles.sidePanelBody}>
      <View style={styles.sideHead}>
        <Text style={styles.sideTitle}>RESOURCES</Text>
        <Pressable accessibilityRole="button"><Text style={styles.viewAll}>View All</Text></Pressable>
      </View>
      <View style={styles.fileList}>
        {resourceFiles.map((item) => <ResourceFileRow key={item.title} item={item} />)}
      </View>
    </Card>
  );
}
function NoteSummary() {
  return (
    <Card style={styles.notePanel} contentStyle={styles.notePanelBody}>
      <View style={styles.cardHeadRow}>
        <Text style={styles.cardTitle}>MY NOTES</Text>
        <Pressable accessibilityRole="button"><Text style={styles.viewAll}>View All</Text></Pressable>
      </View>
      <View style={styles.noteCard}>
        <View style={styles.noteCopy}>
          <Text style={styles.noteTitle}>Key Abbreviations</Text>
          <Text style={styles.noteText} numberOfLines={2}>Common abbreviation helps save time and improve focus during lectures.</Text>
          <Text style={styles.noteTime}>Today, 09:15 AM</Text>
        </View>
        <SymbolView name={writingSymbol} tintColor={studentTokens.blue} size={17} style={styles.noteIcon} />
      </View>
    </Card>
  );
}

function RelatedLessonCard({ lesson }: { lesson: VideoLesson }) {
  const router = useRouter();
  const theme = skillThemes[lesson.skill];
  const presentation = presentationForLesson(lesson);
  const image = presentation.thumb ?? skillImageSources[lesson.skill];

  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/learning/videos/${lesson.id}` as Href)} style={({ pressed }) => [styles.relatedCard, pressed ? styles.pressed : null]}>
      <View style={[styles.relatedThumb, { backgroundColor: theme.soft }]}>
        {image ? <Image source={image} style={styles.relatedImage} contentFit="cover" accessibilityLabel={`${theme.label} related lesson`} /> : <SymbolView name={skillIcons[lesson.skill]} tintColor={theme.accent} size={24} style={styles.relatedFallbackIcon} />}
        <View style={styles.relatedTimePill}><Text style={styles.relatedTime}>{presentation.time}</Text></View>
      </View>
      <View style={styles.relatedCopy}>
        <Text style={styles.relatedKicker}>{presentation.course}</Text>
        <Text style={styles.relatedTitle} numberOfLines={2}>{presentation.shortTitle}</Text>
        <Text style={styles.relatedStatus} numberOfLines={1}>{lesson.progress > 0 ? 'Continue Watching' : 'Watch Next'}</Text>
      </View>
    </Pressable>
  );
}

function relatedLessonsHref(lesson: VideoLesson) {
  const params = new URLSearchParams({ skill: lesson.category, sort: 'most-relevant' });
  if (lesson.taskType) params.set('task', lesson.taskType);
  if (lesson.subskill) params.set('subskill', lesson.subskill);
  return `/learning/videos?${params.toString()}` as Href;
}

function RelatedPanel({ currentLesson, lessons }: { currentLesson: VideoLesson; lessons: VideoLesson[] }) {
  const router = useRouter();
  if (lessons.length === 0) return null;

  return (
    <Card testID="related-lessons-panel" style={styles.relatedPanel} contentStyle={styles.relatedPanelBody}>
      <View style={styles.cardHeadRow}>
        <Text style={styles.cardTitle}>RELATED LESSONS</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="View all related lessons" onPress={() => router.push(relatedLessonsHref(currentLesson))} style={({ pressed }) => [styles.viewAllButton, pressed ? styles.pressed : null]}>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>
      <View style={styles.relatedGrid}>
        {lessons.map((lesson) => <RelatedLessonCard key={lesson.id} lesson={lesson} />)}
      </View>
    </Card>
  );
}

export function VideoPlayer({ user, lessonId }: VideoPlayerProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 1120;
  const isTablet = width >= 760;
  const isCompact = width < 620;
  const [tab, setTab] = useState<PlayerTab>('overview');
  const [toastVisible, setToastVisible] = useState(false);
  const lesson = getVideoLessonById(lessonId);
  const courseLessons = useMemo(() => getCourseVideoLessons(lessonId), [lessonId]);
  const relatedLessons = useMemo(() => getRelatedVideoLessons(lessonId).slice(0, 3), [lessonId]);

  if (!lesson) {
    return (
      <ErrorState title="Video not found" text="This lesson is not available in the current video catalog." action={<Button label="Back to Video Lessons" onPress={() => router.push('/learning/videos' as Href)} />} />
    );
  }

  const theme = skillThemes[lesson.skill];
  const presentation = presentationForLesson(lesson);
  const fullAccess = getEntitlementAccess(user, 'video-full-access').allowed;

  const handleSave = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  };

  return (
    <View testID="video-player-screen" style={styles.screen}>
      <Toast visible={toastVisible} message="Lesson saved to your learning list." tone="success" />

      <View style={styles.breadcrumbRow}>
        <SymbolView name={homeSymbol} tintColor={studentTokens.blue} size={13} style={styles.breadcrumbIcon} />
        <SymbolView name={arrowSymbol} tintColor="#9aa3b5" size={10} style={styles.breadcrumbChevron} />
        <Text style={styles.breadcrumbText}>My Learning</Text>
        <SymbolView name={arrowSymbol} tintColor="#9aa3b5" size={10} style={styles.breadcrumbChevron} />
        <Text style={styles.breadcrumbText}>{presentation.course}</Text>
        <SymbolView name={arrowSymbol} tintColor="#9aa3b5" size={10} style={styles.breadcrumbChevron} />
        <Text style={styles.breadcrumbCurrent}>Lecture 03</Text>
      </View>

      <View style={[styles.pageHead, isTablet ? styles.pageHeadWide : null]}>
        <View style={styles.pageHeadCopy}>
          <Text style={[styles.pageEyebrow, { color: theme.accent }]}>{presentation.course.toUpperCase()}</Text>
          <Text style={[styles.pageTitle, isCompact ? styles.pageTitleCompact : null]}>{presentation.title}</Text>
        </View>
        <View style={[styles.pageActions, isCompact ? styles.pageActionsCompact : null]}>
          <Button label="Add to Favorites" size="sm" variant="secondary" left={<SymbolView name={bookmarkSymbol} tintColor={studentTokens.navy} size={14} style={styles.buttonIcon} />} onPress={handleSave} style={isCompact ? styles.mobileActionButton : undefined} />
          <Button label="Share" size="sm" variant="secondary" left={<SymbolView name={shareSymbol} tintColor={studentTokens.navy} size={14} style={styles.buttonIcon} />} onPress={handleSave} style={isCompact ? styles.mobileActionButton : undefined} />
        </View>
      </View>

      <View style={[styles.lessonGrid, isWide ? styles.lessonGridWide : null]}>
        <View style={styles.playerColumn}>
          <PlayerPanel lesson={lesson} fullAccess={fullAccess} compact={isCompact} showQualityMenu={isWide} />
          <DetailPanel lesson={lesson} fullAccess={fullAccess} tab={tab} onTabChange={setTab} wide={isTablet} />
        </View>
        <View style={[styles.sideColumn, !isWide ? styles.sideColumnStacked : null]}>
          <LessonsInCourse lessons={courseLessons} currentLessonId={lesson.id} fullAccess={fullAccess} />
          <ResourcesPanel />
        </View>
      </View>

      <View style={[styles.bottomGrid, isTablet ? styles.bottomGridWide : null]}>
        <NoteSummary />
        <RelatedPanel currentLesson={lesson} lessons={relatedLessons} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({  screen: { gap: 10, position: 'relative' },
  backLink: { alignSelf: 'flex-start', minHeight: 24, justifyContent: 'center' },
  backText: { fontFamily: fontFamily, color: '#5f6980', fontSize: 10, lineHeight: 14, fontWeight: '700' },
  practiceHeader: { gap: 12 },
  practiceHeaderWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  practiceTitleArea: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  practiceIconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  practiceIcon: { width: 24, height: 24 },
  practiceTitleCopy: { flex: 1, minWidth: 0 },
  pageSubtitle: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 10, lineHeight: 14, fontWeight: '600', marginTop: 3 },
  summaryCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', width: 382, maxWidth: '100%', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  summaryCardBody: { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  summaryCardBodyCompact: { flexWrap: 'wrap' },
  headerMetric: { flex: 1, minWidth: 74, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#eef1f6', gap: 2 },
  metricDot: { width: 5, height: 5, borderRadius: 3, marginBottom: 1 },
  headerMetricValue: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 17, lineHeight: 21, fontWeight: '700' },
  headerMetricLabel: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700', textAlign: 'center' },
  toolbarCard: { padding: 0, borderRadius: 10, borderColor: '#e5eaf2', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  toolbarBody: { minHeight: 43, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  toolbarBodyCompact: { alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'flex-start' },
  toolbarItem: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 96 },
  toolbarDivider: { width: 1, height: 24, backgroundColor: '#eef1f6' },
  toolbarLabel: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700' },
  toolbarValue: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 13, fontWeight: '700' },
  toolbarIcon: { width: 14, height: 14 },
  textSizeGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  textSizeSmall: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  textSizeMedium: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 11, lineHeight: 14, fontWeight: '700' },
  textSizeLarge: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 13, lineHeight: 16, fontWeight: '700' },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  breadcrumbIcon: { width: 13, height: 13 },
  breadcrumbChevron: { width: 10, height: 10 },
  breadcrumbText: { fontFamily: fontFamily, color: '#5f6980', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  breadcrumbCurrent: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  pageHead: { gap: 10 },
  pageHeadWide: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pageHeadCopy: { flex: 1, minWidth: 0 },
  pageEyebrow: { fontFamily: fontFamily, fontSize: 9, lineHeight: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  pageTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 20, lineHeight: 25, fontWeight: '700', flexShrink: 1 },
  pageTitleCompact: { fontFamily: fontFamily, fontSize: 18, lineHeight: 23 },
  pageActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flexShrink: 0 },
  pageActionsCompact: { width: '100%' },
  mobileActionButton: { flex: 1, minWidth: 136 },
  lessonGrid: { gap: 12 },
  lessonGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  playerColumn: { flex: 1, minWidth: 0, gap: 10 },
  checkpointColumn: { width: 410, maxWidth: '100%', gap: 12, flexShrink: 0 },
  checkpointColumnStacked: { width: '100%' },
  supportGrid: { gap: 12 },
  supportGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  supportMain: { flex: 1, minWidth: 0, gap: 12 },
  supportAside: { width: 330, maxWidth: '100%', gap: 12, flexShrink: 0 },
  supportAsideStacked: { width: '100%' },
  sideColumn: { width: 300, maxWidth: '100%', gap: 12, flexShrink: 0 },
  sideColumnStacked: { width: '100%' },
  playerCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', overflow: 'hidden', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  playerCardBody: { gap: 0 },
  videoFrame: { width: '100%', aspectRatio: 16 / 9, minHeight: 360, maxHeight: 540, backgroundColor: '#001b48', overflow: 'hidden', position: 'relative' },
  videoFrameCompact: { minHeight: 210, aspectRatio: 16 / 10 },
  externalVideoFrame: { overflow: 'hidden', backgroundColor: '#000000' },
  videoPoster: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%', opacity: 0.98 },
  videoOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 27, 72, 0.06)' },
  freePreviewBadge: { position: 'absolute', left: 12, top: 12, minHeight: 25, borderRadius: 4, backgroundColor: '#2165d7', paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  freePreviewText: { fontFamily: fontFamily, color: '#ffffff', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  externalOpenButton: { alignSelf: 'center', marginTop: 74, minHeight: 38, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  externalOpenText: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  qualityMenu: { position: 'absolute', top: 34, right: 20, width: 136, borderRadius: 8, backgroundColor: 'rgba(15, 18, 32, 0.78)', paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  qualityTitle: { fontFamily: fontFamily, color: '#ffffff', fontSize: 8, lineHeight: 11, fontWeight: '700' },
  qualityItem: { fontFamily: fontFamily, color: '#d5ddf2', fontSize: 8, lineHeight: 12, fontWeight: '600' },
  qualityItemActive: { color: '#ffffff', fontWeight: '700' },
  qualityDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 3 },
  playerControlBar: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 45, backgroundColor: 'rgba(5, 7, 15, 0.58)', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9 },
  controlIconButton: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  controlIconButtonSmall: { width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  controlIcon: { width: 18, height: 18 },
  controlIconSmall: { width: 16, height: 16 },
  playerTime: { fontFamily: fontFamily, color: '#ffffff', fontSize: 10, lineHeight: 14, fontWeight: '600', flexShrink: 0 },
  playerTrack: { position: 'relative', flex: 1, minWidth: 76, height: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.28)' },
  playerFill: { height: '100%', borderRadius: 999, backgroundColor: studentTokens.yellow },
  playerThumb: { position: 'absolute', top: -4, width: 13, height: 13, borderRadius: 7, marginLeft: -6, backgroundColor: '#ffffff', borderWidth: 2, borderColor: studentTokens.yellowDeep },
  playerPercent: { fontFamily: fontFamily, color: studentTokens.yellow, fontSize: 10, lineHeight: 14, fontWeight: '700', flexShrink: 0 },
  playerToolGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  toolIcon: { width: 15, height: 15 },  unlockStrip: { backgroundColor: '#fff6d7', borderTopWidth: 1, borderTopColor: '#f3dfa3', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  unlockStripCompact: { flexDirection: 'column', alignItems: 'stretch' },
  unlockMessage: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9 },
  unlockIconBox: { width: 31, height: 31, borderRadius: 10, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  unlockIcon: { width: 17, height: 17 },
  unlockCopy: { flex: 1, minWidth: 0 },
  unlockTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  unlockText: { fontFamily: fontFamily, color: '#4f5870', fontSize: 8, lineHeight: 12, fontWeight: '600', marginTop: 1 },
  unlockActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  unlockActionsCompact: { width: '100%', flexWrap: 'wrap' },
  unlockButton: { minWidth: 148, minHeight: 32, borderRadius: 7 },
  unlockButtonCompact: { flex: 1, minWidth: 136 },
  detailPanel: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  detailPanelBody: { padding: 0 },
  tabContent: { padding: 14, borderTopWidth: 1, borderTopColor: '#eef1f6' },
  overviewGrid: { gap: 14 },
  overviewGridWide: { flexDirection: 'row' },
  overviewAbout: { flex: 1.25, minWidth: 0, gap: 8 },
  overviewFacts: { flex: 0.86, minWidth: 220, borderLeftWidth: 1, borderLeftColor: '#eef1f6', paddingLeft: 16, gap: 10 },
  overviewFactsStacked: { borderLeftWidth: 0, paddingLeft: 0, minWidth: 0 },
  sectionMiniTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  aboutText: { fontFamily: fontFamily, color: '#4f5870', fontSize: 10, lineHeight: 16, fontWeight: '600', flexShrink: 1 },
  outcomeList: { gap: 5 },
  outcomeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  outcomeCheck: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#e9fbf6', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  outcomeCheckIcon: { width: 10, height: 10 },
  outcomeText: { fontFamily: fontFamily, flex: 1, minWidth: 0, color: studentTokens.text, fontSize: 9, lineHeight: 14, fontWeight: '600' },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  factIconBox: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  factIcon: { width: 15, height: 15 },
  factCopy: { flex: 1, minWidth: 0 },
  factLabel: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700' },
  factValue: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 13, fontWeight: '700', marginTop: 1 },
  scoreNote: { borderRadius: 9, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: studentTokens.neutral, padding: 9, gap: 6 },
  scoreNoteTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  scoreNoteText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 8, lineHeight: 12, fontWeight: '600' },
  tabStack: { gap: 10 },
  notesStack: { gap: 10 },
  notesInput: { minHeight: 112, textAlignVertical: 'top' },
  transcriptRow: { flexDirection: 'row', gap: 10, borderRadius: 10, backgroundColor: studentTokens.neutral, borderWidth: 1, borderColor: '#eef1f6', padding: 10 },
  transcriptRowLocked: { opacity: 0.62 },
  transcriptTime: { fontFamily: fontFamily, width: 42, color: studentTokens.teal, fontSize: 10, lineHeight: 15, fontWeight: '700', flexShrink: 0 },
  transcriptText: { fontFamily: fontFamily, flex: 1, minWidth: 0, color: studentTokens.text, fontSize: 11, lineHeight: 17, fontWeight: '600' },
  resourceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eef1f6', paddingBottom: 10 },
  resourceRowLocked: { opacity: 0.68 },
  resourceIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: studentTokens.orangeSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resourceIcon: { width: 17, height: 17 },
  resourceCopy: { flex: 1, minWidth: 178 },
  resourceTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  resourceMeta: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 9, lineHeight: 13, fontWeight: '600', marginTop: 1 },
  resourceButton: { minHeight: 32, borderRadius: 8 },
  checkpointCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  checkpointBody: { padding: 14, gap: 10 },
  checkpointTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkpointTitleBlock: { flex: 1, minWidth: 0 },
  checkpointLabel: { fontFamily: fontFamily, color: studentTokens.blue, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  checkpointTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 12, lineHeight: 16, fontWeight: '700', marginTop: 2 },
  checkpointTimePill: { minHeight: 24, borderRadius: 999, backgroundColor: studentTokens.orangeSoft, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  checkpointTinyIcon: { width: 13, height: 13 },
  checkpointTimeText: { fontFamily: fontFamily, color: studentTokens.orange, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  menuDotsIcon: { width: 18, height: 18, flexShrink: 0 },
  checkpointQuestion: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  optionList: { gap: 8 },
  optionRow: { minHeight: 38, borderRadius: 8, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.surface, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 9, paddingVertical: 8 },
  optionRowSelected: { borderColor: '#6bd5be', backgroundColor: '#eafaf6' },
  optionLetter: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionLetterSelected: { backgroundColor: studentTokens.teal },
  optionLetterText: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  optionLetterTextSelected: { color: '#ffffff' },
  optionText: { fontFamily: fontFamily, flex: 1, minWidth: 0, color: '#4f5870', fontSize: 9, lineHeight: 14, fontWeight: '600' },
  optionTextSelected: { color: studentTokens.ink, fontWeight: '700' },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reviewBox: { width: 15, height: 15, borderRadius: 3, borderWidth: 1, borderColor: '#b7c0d2', backgroundColor: studentTokens.surface },
  reviewText: { fontFamily: fontFamily, color: '#5f6980', fontSize: 9, lineHeight: 12, fontWeight: '600' },
  reviewIcon: { width: 13, height: 13 },
  navigatorPanel: { borderRadius: 9, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: studentTokens.neutral, padding: 10, gap: 8 },
  navigatorLabel: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700' },
  navigatorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  navigatorItem: { width: 28, height: 28, borderRadius: 7, borderWidth: 1, borderColor: '#e2e7f0', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  navigatorDone: { borderColor: '#c7eadf', backgroundColor: '#effbf6' },
  navigatorActive: { borderColor: studentTokens.navy, backgroundColor: '#ffffff' },
  navigatorMarked: { borderColor: '#ffd0a8', backgroundColor: '#fff4e9' },
  navigatorText: { fontFamily: fontFamily, color: '#5f6980', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  navigatorTextActive: { color: studentTokens.navy },
  checkpointActions: { flexDirection: 'row', gap: 9 },
  checkpointActionsCompact: { flexWrap: 'wrap' },
  checkpointButton: { flex: 1, minHeight: 36, borderRadius: 7 },
  checkpointButtonCompact: { minWidth: 130 },
  nextButton: { flex: 1, minHeight: 36, borderRadius: 7, backgroundColor: '#001b48', borderColor: '#001b48' },
  nextButtonText: { color: '#ffffff' },
  submitButton: { minHeight: 36, borderRadius: 7, backgroundColor: studentTokens.yellowSoft, borderColor: '#f3dfa3' },
  sidePanel: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  sidePanelBody: { padding: 12, gap: 10 },
  sideHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sideTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  sideCount: { fontFamily: fontFamily, color: studentTokens.blue, fontSize: 8, lineHeight: 11, fontWeight: '700' },
  courseList: { gap: 4 },
  courseLessonRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 7, backgroundColor: studentTokens.surface },
  courseLessonActive: { backgroundColor: studentTokens.yellowSoft, borderWidth: 1, borderColor: '#f3dfa3' },
  courseLessonLocked: { opacity: 0.72 },
  courseLessonNumber: { fontFamily: fontFamily, width: 18, color: '#8e98ab', fontSize: 8, lineHeight: 11, fontWeight: '700', flexShrink: 0 },
  courseLessonNumberActive: { color: studentTokens.yellowDeep },
  courseLessonCopy: { flex: 1, minWidth: 0 },
  courseLessonTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 13, fontWeight: '700' },
  courseLessonTime: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '600', flexShrink: 0 },
  courseLessonState: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  courseLessonStateActive: { backgroundColor: studentTokens.yellow },
  courseLessonIcon: { width: 12, height: 12 },
  sideFullButton: { minHeight: 32, borderRadius: 7, width: '100%' },
  fileList: { gap: 8 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 9, backgroundColor: studentTokens.neutral, padding: 8 },
  fileIconBox: { width: 31, height: 31, borderRadius: 10, backgroundColor: studentTokens.orangeSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fileIcon: { width: 16, height: 16 },
  fileCopy: { flex: 1, minWidth: 0 },
  fileTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 13, fontWeight: '700' },
  fileMeta: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '600', marginTop: 1 },
  downloadIcon: { width: 15, height: 15, flexShrink: 0 },
  bottomGrid: { gap: 12 },
  bottomGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  notePanel: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', flex: 0.62 },
  notePanelBody: { padding: 12, gap: 10 },
  relatedPanel: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', flex: 1.38 },
  relatedPanelBody: { padding: 12, gap: 10 },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  viewAllButton: { minHeight: 28, justifyContent: 'center', paddingHorizontal: 4 },
  viewAll: { fontFamily: fontFamily, color: studentTokens.blue, fontSize: 8, lineHeight: 11, fontWeight: '700' },
  noteCard: { borderRadius: 10, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: studentTokens.surface, padding: 10, flexDirection: 'row', gap: 10 },
  noteCopy: { flex: 1, minWidth: 0 },
  noteTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  noteText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 8, lineHeight: 12, fontWeight: '600', marginTop: 3 },
  noteTime: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '600', marginTop: 10 },
  noteIcon: { width: 17, height: 17, flexShrink: 0 },
  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  relatedCard: { flexGrow: 1, flexBasis: 176, minWidth: 164, borderRadius: 10, borderWidth: 1, borderColor: '#eef1f6', backgroundColor: studentTokens.surface, padding: 8, flexDirection: 'row', gap: 8 },
  relatedThumb: { width: 72, height: 48, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  relatedImage: { width: '100%', height: '100%' },
  relatedFallbackIcon: { width: 24, height: 24 },
  relatedTimePill: { position: 'absolute', right: 4, bottom: 4, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.62)', paddingHorizontal: 4, paddingVertical: 2 },
  relatedTime: { fontFamily: fontFamily, color: '#ffffff', fontSize: 7, lineHeight: 9, fontWeight: '700' },
  relatedCopy: { flex: 1, minWidth: 0 },
  relatedKicker: { fontFamily: fontFamily, color: '#6e778b', fontSize: 7, lineHeight: 10, fontWeight: '700' },
  relatedTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 9, lineHeight: 13, fontWeight: '700', marginTop: 1 },
  relatedStatus: { fontFamily: fontFamily, color: studentTokens.blue, fontSize: 8, lineHeight: 11, fontWeight: '700', marginTop: 5 },
  buttonIcon: { width: 14, height: 14 },
  pressed: { opacity: 0.72 },
});
