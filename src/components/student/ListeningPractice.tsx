import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Linking, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions, type DimensionValue } from 'react-native';

import { Button, Card, Progress, studentTokens } from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';
import type { LessonResource, ListeningHubQuestion } from '@/lib/content';
import { getEntitlementAccess } from '@/lib/permissions';
import {
  getListeningDifficultyById,
  getListeningHubItemById,
  getListeningLengthById,
  getListeningSelectionFromParams,
  getListeningSubskillById,
  getListeningTaskTypeById,
  createListeningPracticeHref,
  createListeningAttempt,
  buildListeningProgress,
  cacheListeningProgress,
  loadListeningProgressCatalog,
  readListeningProgressCatalog,
  saveListeningAttempt,
  saveListeningProgress,
  syncPublishedListeningHubItems,
  type ListeningAttempt,
  type ListeningHubDisplayItem,
  type ListeningSelection,
} from '@/lib/listening';
import { formatVideoTimestamp, getVideoEmbedUrl, videoProviderLabel } from '@/lib/video-media';
import { getVideoUploadUrl, revokeVideoUploadUrl } from '@/lib/video-upload';

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
  startSeconds: number;
  endSeconds: number;
  done?: boolean;
  active?: boolean;
};

type AnswerOption = {
  key: string;
  text: string;
  selected?: boolean;
};

type PlaybackSnapshot = {
  currentSeconds: number;
  durationSeconds: number;
};

type PlaybackState = PlaybackSnapshot & {
  sourceKey: string;
};

type MediaElementHandle = {
  currentTime: number;
  duration?: number;
  volume?: number;
  paused?: boolean;
  play?: () => Promise<void> | void;
  pause?: () => void;
  requestFullscreen?: () => Promise<void> | void;
  webkitRequestFullscreen?: () => Promise<void> | void;
};

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const arrowSymbol = symbolName('chevron.right', 'chevron_right');
const backSymbol = symbolName('arrow.left', 'arrow_back');
const headphonesSymbol = symbolName('headphones', 'headphones');
const playSymbol = symbolName('play.fill', 'play_arrow');
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


const fallbackListeningQuestion: ListeningHubQuestion = {
  prompt: 'According to the lecture, what can students do to book group study rooms?',
  options: [
    { key: 'A', text: 'Visit the library front desk' },
    { key: 'B', text: 'Use the online booking system' },
    { key: 'C', text: 'Call the IT help desk' },
    { key: 'D', text: 'Email the student center' },
    { key: 'E', text: 'Ask the course instructor in person' },
  ],
  correctOptionKey: 'B',
  explanation: 'The booking system is the action mentioned for reserving group study rooms.',
};

type ListeningSearchParams = Partial<Record<'task' | 'subskill' | 'difficulty' | 'length' | 'mode' | 'hub', string | string[]>>;

type TranscriptLine = { startSeconds: number; text: string };

type ListeningPracticeContext = {
  selection: ListeningSelection;
  hubItem: ListeningHubDisplayItem | null;
  title: string;
  meta: string;
  subtitle: string;
  rules: string[];
  mediaProvider?: ListeningHubDisplayItem['mediaProvider'];
  mediaUrl?: string;
  mediaFileName?: string;
  mediaMimeType?: string;
  isPremium: boolean;
  durationSeconds: number;
  previewDurationSeconds: number;
  questionCount: number;
  questions: ListeningHubQuestion[];
  resources: LessonResource[];
  noteSeed: string;
  studyTip: string;
  outline: TimelineItem[];
  transcript: TranscriptLine[];
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function fallbackDurationForSelection(selection: ListeningSelection) {
  if (selection.lengthId === "quick") return 600;
  if (selection.lengthId === "extended") return 1800;
  return 1200;
}

function clampSeconds(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function getEffectivePlaybackDuration(context: ListeningPracticeContext, fullAccess: boolean) {
  const previewSeconds = context.isPremium && !fullAccess ? Math.min(context.previewDurationSeconds, context.durationSeconds) : 0;
  return Math.max(1, previewSeconds || context.durationSeconds);
}

const toeflListeningSectionSeconds = 29 * 60;
const toeflListeningSectionItems = 47;

function getToeflListeningQuestionLimitSeconds(questionCount: number) {
  return Math.max(1, Math.ceil(Math.max(1, questionCount) * toeflListeningSectionSeconds / toeflListeningSectionItems));
}

type ListeningNoteState = {
  key: string;
  text: string;
  updatedAt: string | null;
};

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function countWordsFromNote(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function listeningNoteStorageKey(userId: string, context: ListeningPracticeContext) {
  const contentKey = context.hubItem?.id ?? context.hubItem?.slug ?? context.title;
  return ["akademik-skor.listening-practice-notes.v1", userId, contentKey].join("|");
}

function defaultListeningNote(context: ListeningPracticeContext) {
  const noteSeed = context.noteSeed.trim();
  if (noteSeed) return noteSeed;
  const outlineLines = context.outline.slice(0, 4).map((item) => "- " + item.title + " (" + item.time + ")");
  const focusQuestion = context.questions[0]?.prompt?.trim();
  const blocks = [
    context.title,
    context.subtitle,
    outlineLines.length ? "Key topics:\n" + outlineLines.join("\n") : "",
    focusQuestion ? "Question focus:\n- " + focusQuestion : "",
  ].filter(Boolean);
  return blocks.length ? blocks.join("\n\n") : "Main idea:\n- \nSupporting details:\n- \nExamples:\n- ";
}

function readListeningPracticeNote(key: string, fallbackText: string): ListeningNoteState {
  if (!hasBrowserStorage()) return { key, text: fallbackText, updatedAt: null };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { key, text: fallbackText, updatedAt: null };
    const parsed = JSON.parse(raw) as Partial<ListeningNoteState>;
    return { key, text: typeof parsed.text === "string" ? parsed.text : fallbackText, updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null };
  } catch {
    return { key, text: fallbackText, updatedAt: null };
  }
}

function writeListeningPracticeNote(note: ListeningNoteState) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(note.key, JSON.stringify(note));
}

function formatNoteEditedLabel(updatedAt: string | null) {
  if (!updatedAt) return "Not edited yet";
  return "Last edited: " + new Date(updatedAt).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function getListeningStudyTip(context: ListeningPracticeContext) {
  const customTip = context.studyTip.trim();
  if (customTip) return customTip;
  if (context.selection.sessionMode === "exam") return "Use the first listen to map the lecture structure, then answer without checking transcript support.";
  if (context.outline.length) return "Use the outline timings to organize notes by section instead of writing full sentences.";
  return "Take notes using abbreviations and symbols to keep up with the lecture and improve recall later.";
}


function makeOutlineFromHub(item: ListeningHubDisplayItem | null, durationSeconds: number): TimelineItem[] {
  const outline = item?.outline ?? [];
  if (!outline.length) return [];
  return outline.map((chapter, index) => {
    const nextStart = outline[index + 1]?.startSeconds ?? durationSeconds;
    return {
      title: chapter.title,
      startSeconds: chapter.startSeconds,
      endSeconds: Math.max(chapter.startSeconds, nextStart),
      time: formatVideoTimestamp(chapter.startSeconds) + " - " + formatVideoTimestamp(Math.max(chapter.startSeconds, nextStart)),
      active: index === 0,
      done: false,
    };
  });
}

function resolveListeningPracticeContext(params: ListeningSearchParams): ListeningPracticeContext {
  const selection = getListeningSelectionFromParams(params);
  const hubItem = getListeningHubItemById(firstParam(params.hub));
  const task = getListeningTaskTypeById(selection.taskTypeId);
  const subskill = getListeningSubskillById(selection.subskillId);
  const difficulty = getListeningDifficultyById(selection.difficultyId);
  const length = getListeningLengthById(selection.lengthId);
  const examMode = selection.sessionMode === 'exam';
  const durationSeconds = Math.max(1, hubItem?.durationSeconds ?? fallbackDurationForSelection(selection));
  const questions = hubItem?.questions?.length ? hubItem.questions : [fallbackListeningQuestion];
  const questionCount = Math.max(1, questions.length || hubItem?.questionCount || 10);
  const previewDurationSeconds = Math.max(0, Math.min(hubItem?.previewDurationSeconds ?? 0, durationSeconds));

  return {
    selection,
    hubItem,
    title: hubItem?.title ?? 'Listening Practice',
    meta: hubItem?.meta ?? `${task.title} - ${subskill.title} - ${length.title}`,
    subtitle: hubItem?.description ?? `${difficulty.title} difficulty. ${examMode ? 'Exam mode keeps feedback and transcript limited until submission.' : 'Practice mode keeps replay, notes, and explanation available.'}`,
    mediaProvider: hubItem?.mediaProvider,
    mediaUrl: hubItem?.mediaUrl,
    mediaFileName: hubItem?.mediaFileName,
    mediaMimeType: hubItem?.mediaMimeType,
    isPremium: Boolean(hubItem?.isPremium),
    durationSeconds,
    previewDurationSeconds,
    questionCount,
    questions,
    resources: hubItem?.resources ?? [],
    noteSeed: hubItem?.noteSeed ?? "",
    studyTip: hubItem?.studyTip ?? "",
    outline: makeOutlineFromHub(hubItem, durationSeconds),
    transcript: hubItem?.transcript ?? [],
    rules: examMode
      ? ['Feedback hidden until the end', 'Transcript restricted during questions', 'Timer follows section pacing']
      : ['Replay is available', 'Notes stay visible while answering', 'Explanation can appear after each response'],
  };
}

function PageHeader({ compact, context, resourcesOpen, onToggleResources }: { compact: boolean; context: ListeningPracticeContext; resourcesOpen: boolean; onToggleResources: () => void }) {
  const router = useRouter();

  return (
    <View style={styles.headerStack}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/listening' as Href)} style={({ pressed }) => [styles.backLink, pressed ? styles.pressed : null]}>
        <SymbolView name={backSymbol} tintColor="#6e778b" size={13} style={styles.backIcon} />
        <Text style={styles.backText}>Back to Listening</Text>
      </Pressable>

      <View style={[styles.headerRow, compact ? styles.headerRowCompact : null]}>
        <View style={styles.titleCopy}>
          <Text style={styles.pageTitle}>{context.title}</Text>
          <Text style={styles.pageMeta}>{context.meta}</Text>
          <Text style={styles.pageSubtitle}>{context.subtitle}</Text>
        </View>
        <View style={[styles.headerActions, compact ? styles.headerActionsCompact : null]}>
          <Button label={resourcesOpen ? "Hide Resources" : "Lecture Resources"} size="sm" variant="secondary" left={<SymbolView name={documentSymbol} tintColor={studentTokens.navy} size={14} style={styles.buttonIcon} />} onPress={onToggleResources} style={[styles.headerButton, compact ? styles.headerButtonCompact : null]} />
          <Button label="Mark as Complete" size="sm" variant="soft" left={<SymbolView name={checkSymbol} tintColor={studentTokens.teal} size={14} style={styles.buttonIcon} />} style={[styles.headerButton, compact ? styles.headerButtonCompact : null]} />
        </View>
      </View>
    </View>
  );
}

function listeningResourceMeta(resource: LessonResource, locked: boolean) {
  const details = [resource.type, resource.sizeLabel, locked ? "Premium" : resource.url ? "Ready" : "No link"].filter(Boolean);
  return details.join(" - ");
}

function openListeningResource(resource: LessonResource, fullAccess: boolean) {
  if (resource.premium && !fullAccess) return;
  if (resource.url) void Linking.openURL(resource.url);
}

function ListeningResourceRow({ resource, fullAccess }: { resource: LessonResource; fullAccess: boolean }) {
  const locked = Boolean(resource.premium && !fullAccess);
  const canOpen = Boolean(resource.url && !locked);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canOpen }} disabled={!canOpen} onPress={() => openListeningResource(resource, fullAccess)} style={({ pressed }) => [styles.resourceRow, locked ? styles.resourceRowLocked : null, pressed ? styles.pressed : null]}>
      <View style={styles.resourceIconBox}>
        <SymbolView name={documentSymbol} tintColor={locked ? studentTokens.muted : studentTokens.orange} size={17} style={styles.resourceIcon} />
      </View>
      <View style={styles.resourceCopy}>
        <Text style={styles.resourceTitle}>{resource.title}</Text>
        <Text style={styles.resourceMeta}>{listeningResourceMeta(resource, locked)}</Text>
      </View>
      <View style={[styles.resourceAction, canOpen ? styles.resourceActionActive : null]}>
        <Text style={[styles.resourceActionText, canOpen ? styles.resourceActionTextActive : null]}>{locked ? "Premium" : canOpen ? "Open" : "Added"}</Text>
      </View>
    </Pressable>
  );
}

function LectureResourcesPanel({ context, fullAccess }: { context: ListeningPracticeContext; fullAccess: boolean }) {
  return (
    <Card style={styles.resourcesCard} contentStyle={styles.resourcesBody}>
      <View style={styles.resourcesHeader}>
        <Text style={styles.cardLabelOrange}>LECTURE RESOURCES</Text>
        <Text style={styles.resourceCount}>{context.resources.length} files</Text>
      </View>
      {context.resources.length ? (
        <View style={styles.resourcesList}>
          {context.resources.map((resource) => <ListeningResourceRow key={resource.title + "-" + resource.type} resource={resource} fullAccess={fullAccess} />)}
        </View>
      ) : (
        <View style={styles.resourcesEmpty}>
          <Text style={styles.resourcesEmptyText}>No lecture resources have been attached yet.</Text>
        </View>
      )}
    </Card>
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

function PlayerIconButton({ icon, label, onPress, disabled }: { icon: AppSymbolName; label: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.controlButton, disabled ? styles.controlButtonDisabled : null, pressed ? styles.pressed : null]}>
      <SymbolView name={icon} tintColor="#d8e3ff" size={19} style={styles.controlIcon} />
    </Pressable>
  );
}
function mediaLooksAudioSource(mimeType?: string, mediaUrl?: string) {
  const type = mimeType?.toLowerCase() ?? '';
  const url = mediaUrl?.split('?')[0]?.toLowerCase() ?? '';
  if (type.startsWith('audio/')) return true;
  if (type.startsWith('video/')) return false;
  return /\.(mp3|m4a|aac|wav|ogg|opus)$/.test(url);
}

function addListeningPlaybackRange(embedUrl: string | null, provider: ListeningPracticeContext['mediaProvider'], previewSeconds: number, startSeconds: number) {
  if (!embedUrl || provider !== 'youtube') return embedUrl;
  const params: string[] = [];
  if (startSeconds > 0) params.push('start=' + Math.max(1, Math.floor(startSeconds)));
  if (previewSeconds > 0) params.push('end=' + Math.max(1, Math.floor(previewSeconds)));
  if (!params.length) return embedUrl;
  return embedUrl + (embedUrl.includes('?') ? '&' : '?') + params.join('&');
}

function AudioPlayer({ compact, context, fullAccess, playback, onPlaybackChange }: { compact: boolean; context: ListeningPracticeContext; fullAccess: boolean; playback: PlaybackSnapshot; onPlaybackChange: (value: PlaybackSnapshot) => void }) {
  const mediaElementId = useMemo(() => {
    const seed = context.mediaUrl || context.title;
    return "listening-media-" + seed.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80);
  }, [context.mediaUrl, context.title]);
  const getMediaElement = () => {
    if (Platform.OS !== "web" || typeof document === "undefined") return null;
    return document.getElementById(mediaElementId) as MediaElementHandle | null;
  };
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const previewSeconds = context.isPremium && !fullAccess ? Math.min(context.previewDurationSeconds, context.durationSeconds) : 0;
  const canPlayMedia = !context.isPremium || fullAccess || previewSeconds > 0;
  const rawEmbedUrl = context.mediaProvider === "upload" ? null : getVideoEmbedUrl(context.mediaProvider, context.mediaUrl);
  const embedUrl = canPlayMedia ? addListeningPlaybackRange(rawEmbedUrl, context.mediaProvider, previewSeconds, playback.currentSeconds) : null;
  const uploadedMediaIsAudio = mediaLooksAudioSource(context.mediaMimeType, context.mediaUrl);
  const uploadedMediaAvailable = Boolean(context.mediaProvider === "upload" && uploadedMediaUrl && canPlayMedia);
  const controlsAvailable = Boolean(uploadedMediaAvailable && Platform.OS === "web");
  const effectiveDuration = Math.max(1, previewSeconds || playback.durationSeconds || context.durationSeconds);
  const safeCurrent = clampSeconds(playback.currentSeconds, 0, effectiveDuration);
  const progressPercent = clampSeconds((safeCurrent / effectiveDuration) * 100, 0, 100);
  const progressWidth = `${progressPercent}%` as DimensionValue;
  const playerTime = formatVideoTimestamp(safeCurrent) + " / " + formatVideoTimestamp(effectiveDuration);
  const previewLabel = context.isPremium && !fullAccess ? previewSeconds > 0 ? " · Ücretsiz önizleme: " + formatVideoTimestamp(previewSeconds) : " · Premium içerik kilitli" : "";
  const sourceLabel = context.mediaUrl ? (context.mediaProvider === "upload" ? (context.mediaFileName ? "Yüklenen dosya: " + context.mediaFileName : "Yüklenen dinleme dosyası") : videoProviderLabel(context.mediaProvider) + " listening source") + previewLabel : "Listening source not attached yet" + previewLabel;
  const updatePlaybackFromMedia = (event: { currentTarget?: MediaElementHandle }) => {
    const media = event.currentTarget;
    if (!media) return;
    const rawDuration = Number(media.duration);
    const mediaDuration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : context.durationSeconds;
    const durationSeconds = previewSeconds > 0 ? Math.min(previewSeconds, mediaDuration) : mediaDuration;
    let currentSeconds = clampSeconds(Number(media.currentTime) || 0, 0, durationSeconds);
    if (previewSeconds > 0 && media.currentTime > durationSeconds) {
      media.currentTime = durationSeconds;
      media.pause?.();
      currentSeconds = durationSeconds;
    }
    onPlaybackChange({ currentSeconds, durationSeconds });
  };
  const restorePlaybackFromMedia = (event: { currentTarget?: MediaElementHandle }) => {
    const media = event.currentTarget;
    if (!media) return;
    const rawDuration = Number(media.duration);
    const mediaDuration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : context.durationSeconds;
    const durationSeconds = previewSeconds > 0 ? Math.min(previewSeconds, mediaDuration) : mediaDuration;
    if (safeCurrent > 0) media.currentTime = clampSeconds(safeCurrent, 0, Math.max(0, durationSeconds - 1));
    updatePlaybackFromMedia(event);
  };
  const seekBy = (deltaSeconds: number) => {
    const media = getMediaElement();
    if (!media || !controlsAvailable) return;
    const durationSeconds = effectiveDuration;
    const currentSeconds = clampSeconds((Number(media.currentTime) || safeCurrent) + deltaSeconds, 0, durationSeconds);
    media.currentTime = currentSeconds;
    onPlaybackChange({ currentSeconds, durationSeconds });
  };
  const requestFullscreen = () => {
    const media = getMediaElement();
    const request = media?.requestFullscreen ?? media?.webkitRequestFullscreen;
    if (request) void request.call(media);
  };


  useEffect(() => {
    let active = true;
    if (context.mediaProvider !== "upload" || !context.mediaUrl) return () => {};
    void getVideoUploadUrl(context.mediaUrl)
      .then((url) => {
        if (active) setUploadedMediaUrl(url);
        else revokeVideoUploadUrl(url);
      })
      .catch(() => { if (active) setUploadedMediaUrl(null); });
    return () => {
      active = false;
      setUploadedMediaUrl((url) => {
        revokeVideoUploadUrl(url);
        return null;
      });
    };
  }, [context.mediaProvider, context.mediaUrl]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined" || safeCurrent <= 0) return;
    const media = document.getElementById(mediaElementId) as MediaElementHandle | null;
    if (!media || Math.abs((Number(media.currentTime) || 0) - safeCurrent) < 2) return;
    media.currentTime = safeCurrent;
  }, [mediaElementId, safeCurrent]);

  return (
    <Card style={[styles.playerCard, compact ? styles.playerCardCompact : null]} contentStyle={[styles.playerBody, compact ? styles.playerBodyCompact : null]}>
      {embedUrl && Platform.OS === "web" ? (
        <View style={styles.embeddedPlayer}>
          {createElement("iframe", {
            src: embedUrl,
            title: context.title,
            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
            allowFullScreen: true,
            style: { border: 0, width: "100%", height: "100%", display: "block" },
          })}
        </View>
      ) : uploadedMediaAvailable && Platform.OS === "web" ? (
        <View style={uploadedMediaIsAudio ? styles.uploadedAudioWrap : styles.embeddedPlayer}>
          {uploadedMediaIsAudio ? createElement("audio", { id: mediaElementId, src: uploadedMediaUrl, controls: true, onLoadedMetadata: restorePlaybackFromMedia, onTimeUpdate: updatePlaybackFromMedia, onSeeked: updatePlaybackFromMedia, onEnded: updatePlaybackFromMedia, style: { width: "100%", display: "block" } }) : createElement("video", { id: mediaElementId, src: uploadedMediaUrl, controls: true, playsInline: true, onLoadedMetadata: restorePlaybackFromMedia, onTimeUpdate: updatePlaybackFromMedia, onSeeked: updatePlaybackFromMedia, onEnded: updatePlaybackFromMedia, style: { width: "100%", height: "100%", display: "block", objectFit: "contain", backgroundColor: "#08142e" } })}
        </View>
      ) : uploadedMediaAvailable ? (
        <View style={[styles.playerTopRow, compact ? styles.playerTopRowCompact : null]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open listening media" onPress={() => uploadedMediaUrl ? Linking.openURL(uploadedMediaUrl) : undefined} style={({ pressed }) => [styles.externalMediaButton, pressed ? styles.pressed : null]}>
            <SymbolView name={playSymbol} tintColor="#ffffff" size={24} style={styles.pauseIcon} />
            <Text style={styles.externalMediaText}>Dosyayı aç</Text>
          </Pressable>
          <Waveform compact={compact} />
        </View>
      ) : (
        <View style={[styles.playerTopRow, compact ? styles.playerTopRowCompact : null]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Play audio" style={({ pressed }) => [styles.pauseCircle, pressed ? styles.pressed : null]}>
            <SymbolView name={playSymbol} tintColor="#ffffff" size={24} style={styles.pauseIcon} />
          </Pressable>
          <Waveform compact={compact} />
        </View>
      )}
      <View style={styles.playerProgressRow}>
        <Text style={styles.playerTime}>{playerTime}</Text>
        <View style={styles.playerTrack}><View style={[styles.playerFill, { width: progressWidth }]} /></View>
      </View>
      <Text style={styles.playerSourceText}>{sourceLabel}</Text>
      <View style={[styles.playerControls, compact ? styles.playerControlsCompact : null]}>
        <PlayerIconButton icon={replaySymbol} label="Replay 10 seconds" disabled={!controlsAvailable} onPress={() => seekBy(-10)} />
        <PlayerIconButton icon={forwardSymbol} label="Forward 10 seconds" disabled={!controlsAvailable} onPress={() => seekBy(10)} />
        <View style={styles.controlDivider} />
        <Text style={styles.speedText}>1.0x</Text>
        <Text style={styles.speedLabel}>Speed</Text>
        <View style={styles.controlDivider} />
        <PlayerIconButton icon={volumeSymbol} label="Volume" disabled={!controlsAvailable} />
        <View style={styles.volumeTrack}><View style={styles.volumeFill} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Fullscreen" accessibilityState={{ disabled: !controlsAvailable }} disabled={!controlsAvailable} onPress={requestFullscreen} style={({ pressed }) => [styles.fullscreenButton, !controlsAvailable ? styles.controlButtonDisabled : null, pressed ? styles.pressed : null]}>
          <SymbolView name={fullscreenSymbol} tintColor="#d8e3ff" size={19} style={styles.fullscreenIcon} />
        </Pressable>
      </View>
    </Card>
  );
}
function NotesPanel({ context, userId }: { context: ListeningPracticeContext; userId: string }) {
  const defaultNote = useMemo(() => defaultListeningNote(context), [context]);
  const noteKey = useMemo(() => listeningNoteStorageKey(userId, context), [userId, context]);
  const [storedNote, setStoredNote] = useState<ListeningNoteState>(() => readListeningPracticeNote(noteKey, defaultNote));
  const note = storedNote.key === noteKey ? storedNote : readListeningPracticeNote(noteKey, defaultNote);
  const wordCount = countWordsFromNote(note.text);
  const handleNoteChange = useCallback((text: string) => {
    const next = { key: noteKey, text, updatedAt: new Date().toISOString() };
    setStoredNote(next);
    writeListeningPracticeNote(next);
  }, [noteKey]);
  const clearNote = useCallback(() => handleNoteChange(""), [handleNoteChange]);

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
        {["B", "I", "U"].map((item) => <Text key={item} style={styles.noteToolbarText}>{item}</Text>)}
        <View style={styles.noteToolbarDivider} />
        <Text style={styles.noteToolbarText}>-</Text>
        <Text style={styles.noteToolbarText}>=</Text>
        <Text style={styles.noteToolbarText}>link</Text>
        <Pressable accessibilityRole="button" onPress={clearNote} style={styles.clearButton}><Text style={styles.clearText}>Clear</Text></Pressable>
      </View>

      <View style={styles.paperArea}>
        <View style={styles.paperMargin} />
        <TextInput
          accessibilityLabel="Listening note text"
          value={note.text}
          onChangeText={handleNoteChange}
          placeholder="Write key points while listening..."
          placeholderTextColor={studentTokens.muted}
          multiline
          textAlignVertical="top"
          style={styles.noteInput}
        />
      </View>
      <View style={styles.notesFooter}>
        <Text style={styles.footerText}>{wordCount} words</Text>
        <Text style={styles.footerText}>{formatNoteEditedLabel(note.updatedAt)}</Text>
      </View>
    </Card>
  );
}

type QuestionPanelState = {
  key: string;
  activeIndex: number;
  selections: Record<number, string>;
  submitted: Record<number, boolean>;
  answeredAtSeconds: Record<number, number>;
  startedAt: string;
};

type AttemptResultState = {
  attempt: ListeningAttempt;
  saveStatus: 'saving' | 'firestore' | 'local';
};

function QuestionNavigator({ total, activeIndex, answeredIndexes, onSelect }: { total: number; activeIndex: number; answeredIndexes: Set<number>; onSelect: (index: number) => void }) {
  const questionNumbers = Array.from({ length: Math.min(Math.max(total, 1), 10) }, (_, index) => String(index + 1));
  return (
    <View style={styles.navigatorRow}>
      {questionNumbers.map((item, index) => {
        const answered = answeredIndexes.has(index);
        const active = index === activeIndex;
        return (
          <Pressable key={item} accessibilityRole="button" accessibilityLabel={"Go to question " + item} onPress={() => onSelect(index)} style={({ pressed }) => [styles.navigatorItem, answered ? styles.navigatorAnswered : null, active ? styles.navigatorActive : null, pressed ? styles.pressed : null]}>
            <Text style={[styles.navigatorText, active ? styles.navigatorTextActive : null]}>{item}</Text>
          </Pressable>
        );
      })}
      {total > 10 ? <Text style={styles.navigatorOverflow}>+{total - 10}</Text> : null}
      <SymbolView name={arrowSymbol} tintColor="#7a8398" size={12} style={styles.navigatorArrow} />
    </View>
  );
}

function AnswerRow({ item, selected, submitted, isCorrect, onPress }: { item: AnswerOption; selected: boolean; submitted: boolean; isCorrect: boolean; onPress: () => void }) {
  const highlighted = selected || (submitted && isCorrect);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} disabled={submitted} style={({ pressed }) => [styles.answerRow, highlighted ? styles.answerSelected : null, submitted && selected && !isCorrect ? styles.answerIncorrect : null, pressed ? styles.pressed : null]}>
      <View style={[styles.answerLetter, highlighted ? styles.answerLetterSelected : null, submitted && selected && !isCorrect ? styles.answerLetterIncorrect : null]}>
        <Text style={[styles.answerLetterText, highlighted ? styles.answerLetterTextSelected : null]}>{item.key}</Text>
      </View>
      <Text style={[styles.answerText, highlighted ? styles.answerTextSelected : null]}>{item.text}</Text>
    </Pressable>
  );
}

function QuestionsPanel({
  compact,
  context,
  user,
  remainingSeconds,
  timeLimitSeconds,
  onCompleted,
  onRestart,
}: {
  compact: boolean;
  context: ListeningPracticeContext;
  user: AuthUser;
  remainingSeconds: number;
  timeLimitSeconds: number;
  onCompleted: (attempt: ListeningAttempt) => void;
  onRestart: () => void;
}) {
  const router = useRouter();
  const questionTotal = Math.max(1, context.questions.length || context.questionCount);
  const questionKey = (context.hubItem?.id ?? context.title) + "|" + String(questionTotal);
  const defaultQuestionState = useMemo<QuestionPanelState>(() => ({
    key: questionKey,
    activeIndex: 0,
    selections: {},
    submitted: {},
    answeredAtSeconds: {},
    startedAt: new Date().toISOString(),
  }), [questionKey]);
  const [storedQuestionState, setQuestionState] = useState<QuestionPanelState>(() => defaultQuestionState);
  const [resultState, setResultState] = useState<AttemptResultState | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const completionStarted = useRef(false);
  const questionState = storedQuestionState.key === questionKey ? storedQuestionState : defaultQuestionState;
  const activeIndex = Math.min(Math.max(questionState.activeIndex, 0), questionTotal - 1);
  const currentQuestion = context.questions[activeIndex] ?? context.questions[0] ?? fallbackListeningQuestion;
  const selectedKey = questionState.selections[activeIndex] ?? "";
  const submitted = Boolean(questionState.submitted[activeIndex]);
  const answeredIndexes = useMemo(() => new Set(Object.keys(questionState.selections).map((item) => Number(item)).filter(Number.isFinite)), [questionState.selections]);
  const explanation = currentQuestion.explanation?.trim();
  const selectQuestion = useCallback((index: number) => {
    setQuestionState((current) => {
      const base = current.key === questionKey ? current : defaultQuestionState;
      return { ...base, activeIndex: Math.min(Math.max(index, 0), questionTotal - 1) };
    });
  }, [defaultQuestionState, questionKey, questionTotal]);
  const selectAnswer = useCallback((key: string) => {
    setQuestionState((current) => {
      const base = current.key === questionKey ? current : defaultQuestionState;
      if (base.submitted[activeIndex]) return base;
      return { ...base, selections: { ...base.selections, [activeIndex]: key } };
    });
  }, [activeIndex, defaultQuestionState, questionKey]);
  const finishAttempt = useCallback((state: QuestionPanelState, status: 'completed' | 'timed-out') => {
    if (completionStarted.current) return;
    completionStarted.current = true;

    const responses = Array.from({ length: questionTotal }, (_, questionIndex) => {
      const question = context.questions[questionIndex] ?? (questionIndex === 0 ? fallbackListeningQuestion : undefined);
      const wasSubmitted = Boolean(state.submitted[questionIndex]);
      const selectedOptionKey = wasSubmitted ? state.selections[questionIndex] ?? null : null;
      const correctOptionKey = question?.correctOptionKey ?? null;
      return {
        questionIndex,
        selectedOptionKey,
        correctOptionKey,
        isCorrect: wasSubmitted && correctOptionKey ? selectedOptionKey === correctOptionKey : null,
        answeredAtSeconds: wasSubmitted ? state.answeredAtSeconds[questionIndex] ?? null : null,
      };
    });
    const answeredCount = responses.filter((item) => item.selectedOptionKey !== null).length;
    const correctCount = responses.filter((item) => item.isCorrect === true).length;
    const incorrectCount = responses.filter((item) => item.isCorrect === false).length;
    const timeSpentSeconds = Math.min(timeLimitSeconds, Math.max(0, timeLimitSeconds - remainingSeconds));
    const attempt = createListeningAttempt({
      userId: user.id,
      contentId: context.hubItem?.id ?? context.hubItem?.slug ?? questionKey,
      contentTitle: context.title,
      topicId: context.hubItem?.topicId ?? null,
      taskTypeId: context.selection.taskTypeId,
      subskillId: context.selection.subskillId,
      difficultyId: context.selection.difficultyId,
      lengthId: context.selection.lengthId,
      sessionMode: context.selection.sessionMode,
      startedAt: state.startedAt,
      completedAt: new Date().toISOString(),
      status,
      questionCount: questionTotal,
      answeredCount,
      correctCount,
      incorrectCount,
      unansweredCount: questionTotal - answeredCount,
      accuracyPercent: Math.round(correctCount / questionTotal * 100),
      timeLimitSeconds,
      timeSpentSeconds,
      responses,
    });

    setResultState({ attempt, saveStatus: 'saving' });
    setReviewMode(false);
    onCompleted(attempt);
    void saveListeningAttempt(attempt)
      .then((saved) => {
        setResultState((current) => current?.attempt.id === attempt.id ? { attempt, saveStatus: saved.destination } : current);
      })
      .catch(() => {
        setResultState((current) => current?.attempt.id === attempt.id ? { attempt, saveStatus: 'local' } : current);
      });
  }, [context, onCompleted, questionKey, questionTotal, remainingSeconds, timeLimitSeconds, user.id]);
  const submitAnswer = useCallback(() => {
    if (!selectedKey || submitted || resultState) return;
    const nextState: QuestionPanelState = {
      ...questionState,
      submitted: { ...questionState.submitted, [activeIndex]: true },
      answeredAtSeconds: {
        ...questionState.answeredAtSeconds,
        [activeIndex]: Math.min(timeLimitSeconds, Math.max(0, timeLimitSeconds - remainingSeconds)),
      },
    };
    setQuestionState(nextState);
    if (Object.keys(nextState.submitted).length >= questionTotal) finishAttempt(nextState, 'completed');
  }, [activeIndex, finishAttempt, questionState, questionTotal, remainingSeconds, resultState, selectedKey, submitted, timeLimitSeconds]);
  const goToQuestion = useCallback((delta: number) => selectQuestion(activeIndex + delta), [activeIndex, selectQuestion]);
  const restartAttempt = useCallback(() => {
    completionStarted.current = false;
    setQuestionState({ ...defaultQuestionState, startedAt: new Date().toISOString() });
    setResultState(null);
    setReviewMode(false);
    onRestart();
  }, [defaultQuestionState, onRestart]);

  useEffect(() => {
    if (remainingSeconds > 0 || resultState || completionStarted.current) return;
    finishAttempt(questionState, 'timed-out');
  }, [finishAttempt, questionState, remainingSeconds, resultState]);

  if (resultState && !reviewMode) {
    const { attempt, saveStatus } = resultState;
    const saveMessage = saveStatus === 'saving'
      ? 'Saving your result...'
      : saveStatus === 'firestore'
        ? 'Result saved to your learning history.'
        : 'Result saved on this device; the cloud record could not be written.';
    return (
      <Card testID="listening-attempt-result" style={styles.practiceCard} contentStyle={styles.resultBody}>
        <View style={styles.resultIconBox}>
          <SymbolView name={checkSymbol} tintColor={studentTokens.teal} size={24} style={styles.resultIcon} />
        </View>
        <Text style={styles.resultEyebrow}>{attempt.status === 'timed-out' ? 'TIME ENDED' : 'PRACTICE COMPLETE'}</Text>
        <Text style={styles.resultScore}>{attempt.accuracyPercent}%</Text>
        <Text style={styles.resultTitle}>{attempt.correctCount} of {attempt.questionCount} correct</Text>
        <Text style={styles.resultMessage}>
          {attempt.accuracyPercent >= 80
            ? 'Strong result. Continue with a harder listening set.'
            : attempt.accuracyPercent >= 60
              ? 'Good start. Review the missed item before the next set.'
              : 'Review the explanation and repeat this subskill once more.'}
        </Text>
        <View style={styles.resultStats}>
          <View style={styles.resultStat}><Text style={styles.resultStatValue}>{attempt.answeredCount}</Text><Text style={styles.resultStatLabel}>Answered</Text></View>
          <View style={styles.resultStat}><Text style={styles.resultStatValue}>{attempt.incorrectCount}</Text><Text style={styles.resultStatLabel}>Incorrect</Text></View>
          <View style={styles.resultStat}><Text style={styles.resultStatValue}>{attempt.unansweredCount}</Text><Text style={styles.resultStatLabel}>Unanswered</Text></View>
          <View style={styles.resultStat}><Text style={styles.resultStatValue}>{formatVideoTimestamp(attempt.timeSpentSeconds)}</Text><Text style={styles.resultStatLabel}>Time used</Text></View>
        </View>
        <Text style={[styles.resultSaveText, saveStatus === 'local' ? styles.resultSaveTextLocal : null]}>{saveMessage}</Text>
        <View style={[styles.resultActions, compact ? styles.questionActionsCompact : null]}>
          <Button label="Review Answers" variant="secondary" size="sm" onPress={() => setReviewMode(true)} style={styles.resultActionButton} />
          <Button label="Practice Again" size="sm" onPress={restartAttempt} style={styles.resultActionButton} />
          <Button label="Back to Listening" variant="ghost" size="sm" onPress={() => router.push('/listening' as Href)} style={[styles.resultActionButton, styles.resultBackButton]} textStyle={styles.nextButtonText} />
        </View>
      </Card>
    );
  }
  const noticeText = context.selection.sessionMode === "exam"
    ? "Exam mode: feedback and transcript stay hidden until submission."
    : resultState
      ? "Review mode: your submitted answer and the correct option are shown."
      : submitted
      ? explanation || "Answer saved. Continue to the next question when you are ready."
      : "Choose an answer, then submit to see the explanation.";

  return (
    <Card style={styles.practiceCard} contentStyle={styles.questionBody}>
      <View style={styles.cardHeadRow}>
        <View>
          <Text style={styles.cardLabelOrange}>QUESTIONS</Text>
          <Text style={styles.questionProgress}>Question {activeIndex + 1} of {questionTotal}</Text>
        </View>
        <View style={styles.timeLimitPill}>
          <SymbolView name={clockSymbol} tintColor={studentTokens.orange} size={13} style={styles.timeIcon} />
          <View>
            <Text style={styles.timeText}>{formatVideoTimestamp(Math.max(0, remainingSeconds))}</Text>
            <Text style={styles.timeLabel}>Time Left</Text>
          </View>
        </View>
        {!compact ? <SymbolView name={moreSymbol} tintColor={studentTokens.text} size={16} style={styles.moreIcon} /> : null}
      </View>
      <QuestionNavigator total={questionTotal} activeIndex={activeIndex} answeredIndexes={answeredIndexes} onSelect={selectQuestion} />
      <Text style={styles.questionText}>{currentQuestion.prompt}</Text>
      <View style={styles.answerList}>
        {currentQuestion.options.map((item) => (
          <AnswerRow
            key={item.key}
            item={item}
            selected={selectedKey === item.key}
            submitted={submitted}
            isCorrect={item.key === currentQuestion.correctOptionKey}
            onPress={() => selectAnswer(item.key)}
          />
        ))}
      </View>
      <View style={[styles.modeNotice, context.selection.sessionMode === "exam" ? styles.modeNoticeExam : null]}>
        <Text style={styles.modeNoticeText}>{noticeText}</Text>
      </View>
      <View style={[styles.questionActions, compact ? styles.questionActionsCompact : null]}>
        <Button label="Back" size="sm" variant="secondary" onPress={() => goToQuestion(-1)} disabled={activeIndex === 0} style={[styles.backButton, compact ? styles.actionButtonCompact : null]} />
        {resultState ? (
          <Button label={activeIndex >= questionTotal - 1 ? "View Result" : "Next"} size="sm" variant="ghost" right={<SymbolView name={arrowSymbol} tintColor="#ffffff" size={13} style={styles.buttonIcon} />} onPress={() => activeIndex >= questionTotal - 1 ? setReviewMode(false) : goToQuestion(1)} style={[styles.nextButton, compact ? styles.actionButtonCompact : null]} textStyle={styles.nextButtonText} />
        ) : (
          <>
            <Button label="Submit Answer" size="sm" variant="secondary" left={<SymbolView name={sendSymbol} tintColor={studentTokens.orange} size={14} style={styles.buttonIcon} />} onPress={submitAnswer} disabled={!selectedKey || submitted} style={[styles.submitButton, compact ? styles.actionButtonCompact : null]} />
            <Button label="Next" size="sm" variant="ghost" right={<SymbolView name={arrowSymbol} tintColor="#ffffff" size={13} style={styles.buttonIcon} />} onPress={() => goToQuestion(1)} disabled={activeIndex >= questionTotal - 1 || !submitted} style={[styles.nextButton, compact ? styles.actionButtonCompact : null]} textStyle={styles.nextButtonText} />
          </>
        )}
      </View>
    </Card>
  );
}

function OutlinePanel({ compact, context, currentSeconds }: { compact: boolean; context: ListeningPracticeContext; currentSeconds: number }) {
  const [expanded, setExpanded] = useState(!compact);
  const transcriptPreview = context.selection.sessionMode === "exam" ? [] : context.transcript.slice(0, 3);
  const displayOutline = context.outline.map((item) => {
    const active = currentSeconds >= item.startSeconds && currentSeconds < item.endSeconds;
    const done = currentSeconds >= item.endSeconds;
    return { ...item, active, done };
  });

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
          {displayOutline.length ? (
            <View style={styles.timelineList}>
              {displayOutline.map((item) => (
                <View key={item.title + item.time} style={[styles.timelineRow, item.active ? styles.timelineRowActive : null]}>
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
          ) : (
            <View style={styles.outlineEmptyState}>
              <SymbolView name={documentSymbol} tintColor="#8a94a8" size={16} style={styles.buttonIcon} />
              <Text style={styles.outlineEmptyText}>Outline Not Added</Text>
            </View>
          )}
          {transcriptPreview.length ? (
            <View style={styles.transcriptPreview}>
              <Text style={styles.cardLabelOrange}>TRANSCRIPT PREVIEW</Text>
              {transcriptPreview.map((line) => (
                <Text key={String(line.startSeconds) + line.text} style={styles.transcriptLine}>{formatVideoTimestamp(line.startSeconds)} - {line.text}</Text>
              ))}
            </View>
          ) : null}
          <Button label={context.transcript.length ? 'View Transcript' : 'Transcript Not Added'} size="sm" variant="secondary" left={<SymbolView name={documentSymbol} tintColor={studentTokens.blue} size={14} style={styles.buttonIcon} />} right={<SymbolView name={arrowSymbol} tintColor={studentTokens.navy} size={13} style={styles.buttonIcon} />} style={styles.fullWidthButton} disabled={!context.transcript.length} />
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

function StatsPanel({ context }: { context: ListeningPracticeContext }) {
  const statItems: MetricItem[] = [
    { value: formatVideoTimestamp(context.durationSeconds), label: 'Total Duration', color: '#8b5cf6', icon: headphonesSymbol },
    { value: String(Math.max(1, context.questions.length || context.questionCount)), label: 'Questions', color: studentTokens.orange, icon: questionSymbol },
    { value: String(context.transcript.length), label: 'Transcript Lines', color: studentTokens.teal, icon: documentSymbol },
    { value: videoProviderLabel(context.mediaProvider), label: 'Source', color: studentTokens.blue, icon: volumeSymbol },
  ];

  return (
    <Card style={styles.sideCard} contentStyle={styles.sideBody}>
      <Text style={styles.cardLabelOrange}>LECTURE STATS</Text>
      <View style={styles.statsGrid}>
        {statItems.map((item) => <StatBox key={item.label} item={item} />)}
      </View>
    </Card>
  );
}

function StudyTipPanel({ context }: { context: ListeningPracticeContext }) {
  return (
    <Card style={styles.tipCard} contentStyle={styles.tipBody}>
      <View style={styles.tipHead}>
        <View style={styles.tipIconBox}>
          <SymbolView name={questionSymbol} tintColor={studentTokens.blue} size={17} style={styles.tipIcon} />
        </View>
        <Text style={styles.tipTitle}>STUDY TIP</Text>
      </View>
      <Text style={styles.tipText}>{getListeningStudyTip(context)}</Text>
    </Card>
  );
}

function ScoreNudge({ attempt }: { attempt: ListeningAttempt | null }) {
  const progress = attempt?.accuracyPercent ?? 0;
  return (
    <Card style={styles.nudgeCard} contentStyle={styles.nudgeBody}>
      <View style={styles.nudgeLeft}>
        <View style={styles.nudgeIconBox}>
          <SymbolView name={flameSymbol} tintColor={studentTokens.orange} size={18} style={styles.nudgeIcon} />
        </View>
        <View style={styles.nudgeCopy}>
          <Text style={styles.nudgeTitle}>{attempt ? 'Listening result recorded' : 'Listening evidence'}</Text>
          <Text style={styles.nudgeText}>
            {attempt
              ? `${attempt.accuracyPercent}% accuracy from ${attempt.questionCount} question${attempt.questionCount === 1 ? '' : 's'} was added to your ${attempt.subskillId.replace(/-/g, ' ')} history.`
              : 'Complete this set to add an accuracy and timing result to your listening skill history.'}
          </Text>
        </View>
      </View>
      <Progress value={progress} color={studentTokens.teal} style={styles.nudgeProgress} />
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
export function ListeningPractice({ user }: { user: AuthUser }) {
  const params = useLocalSearchParams<ListeningSearchParams>();
  const [hubVersion, setHubVersion] = useState(0);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [attemptSequence, setAttemptSequence] = useState(0);
  const [attemptCompleted, setAttemptCompleted] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<ListeningAttempt | null>(null);
  const context = useMemo(() => {
    void hubVersion;
    return resolveListeningPracticeContext(params);
  }, [params, hubVersion]);
  const { width } = useWindowDimensions();
  const isWide = width >= 1120;
  const isTablet = width >= 760;
  const isCompact = width < 620;
  const [mobilePanel, setMobilePanel] = useState<"notes" | "questions">("notes");
  const fullAccess = !context.isPremium || getEntitlementAccess(user, "video-full-access").allowed;
  const progressContentId = context.hubItem?.id ?? context.hubItem?.slug ?? [
    context.selection.taskTypeId,
    context.selection.subskillId,
    context.selection.difficultyId,
    context.selection.lengthId,
    context.selection.sessionMode,
  ].join("-");
  const progressHref = createListeningPracticeHref(context.selection) + (context.hubItem ? "&hub=" + encodeURIComponent(context.hubItem.id) : "");
  const initialProgress = readListeningProgressCatalog(user.id).find((item) => item.contentId === progressContentId) ?? null;
  const playbackKey = [
    progressContentId,
    context.mediaProvider,
    context.mediaUrl,
    String(context.durationSeconds),
    String(context.previewDurationSeconds),
    context.isPremium ? "premium" : "free",
    fullAccess ? "full" : "preview",
  ].join("|");
  const effectivePlaybackDuration = getEffectivePlaybackDuration(context, fullAccess);
  const defaultPlayback = useMemo<PlaybackSnapshot>(() => ({
    currentSeconds: Math.min(initialProgress?.currentSeconds ?? 0, effectivePlaybackDuration),
    durationSeconds: effectivePlaybackDuration,
  }), [effectivePlaybackDuration, initialProgress?.currentSeconds]);
  const [storedPlayback, setStoredPlayback] = useState<PlaybackState>(() => ({ ...defaultPlayback, sourceKey: playbackKey }));
  const playback: PlaybackSnapshot = storedPlayback.sourceKey === playbackKey ? storedPlayback : defaultPlayback;
  const lastCachedPlayback = useRef({ key: playbackKey, seconds: initialProgress?.currentSeconds ?? -2 });
  const lastSavedPlayback = useRef({ key: playbackKey, seconds: initialProgress?.currentSeconds ?? -10 });
  const questionLimitSeconds = useMemo(() => getToeflListeningQuestionLimitSeconds(Math.max(1, context.questions.length || context.questionCount)), [context.questionCount, context.questions.length]);
  const questionTimerKey = [playbackKey, String(questionLimitSeconds), String(attemptSequence)].join("|");
  const [questionTimer, setQuestionTimer] = useState(() => ({ key: questionTimerKey, elapsedSeconds: 0 }));
  const effectiveQuestionTimer = questionTimer.key === questionTimerKey ? questionTimer : { key: questionTimerKey, elapsedSeconds: 0 };
  const remainingQuestionSeconds = Math.max(0, questionLimitSeconds - effectiveQuestionTimer.elapsedSeconds);
  const handlePlaybackChange = useCallback((value: PlaybackSnapshot) => {
    setStoredPlayback({ ...value, sourceKey: playbackKey });
    const previous = readListeningProgressCatalog(user.id).find((item) => item.contentId === progressContentId) ?? null;
    const progress = buildListeningProgress({
      previous,
      userId: user.id,
      contentId: progressContentId,
      contentTitle: context.title,
      subtitle: context.meta,
      href: progressHref,
      taskTypeId: context.selection.taskTypeId,
      subskillId: context.selection.subskillId,
      difficultyId: context.selection.difficultyId,
      lengthId: context.selection.lengthId,
      sessionMode: context.selection.sessionMode,
      currentSeconds: value.currentSeconds,
      durationSeconds: context.durationSeconds,
    });
    const cachedSeconds = lastCachedPlayback.current.key === playbackKey ? lastCachedPlayback.current.seconds : -2;
    if (Math.abs(progress.currentSeconds - cachedSeconds) >= 1 || progress.completed) {
      cacheListeningProgress(progress);
      lastCachedPlayback.current = { key: playbackKey, seconds: progress.currentSeconds };
    }
    const savedSeconds = lastSavedPlayback.current.key === playbackKey ? lastSavedPlayback.current.seconds : -10;
    if (Math.abs(progress.currentSeconds - savedSeconds) >= 5 || progress.completed) {
      lastSavedPlayback.current = { key: playbackKey, seconds: progress.currentSeconds };
      void saveListeningProgress(progress).catch(() => {});
    }
  }, [context, playbackKey, progressContentId, progressHref, user.id]);

  useEffect(() => {
    let active = true;
    void loadListeningProgressCatalog(user.id)
      .then((items) => {
        if (!active) return;
        const saved = items.find((item) => item.contentId === progressContentId);
        if (!saved) return;
        const currentSeconds = Math.min(saved.currentSeconds, effectivePlaybackDuration);
        setStoredPlayback((current) => {
          if (current.sourceKey === playbackKey && current.currentSeconds > currentSeconds) return current;
          return { sourceKey: playbackKey, currentSeconds, durationSeconds: effectivePlaybackDuration };
        });
        lastCachedPlayback.current = { key: playbackKey, seconds: currentSeconds };
        lastSavedPlayback.current = { key: playbackKey, seconds: currentSeconds };
      })
      .catch(() => {});
    return () => { active = false; };
  }, [effectivePlaybackDuration, playbackKey, progressContentId, user.id]);

  useEffect(() => {
    if (attemptCompleted) return;
    const timer = setInterval(() => {
      setQuestionTimer((current) => {
        const base = current.key === questionTimerKey ? current : { key: questionTimerKey, elapsedSeconds: 0 };
        if (base.elapsedSeconds >= questionLimitSeconds) return base;
        return { key: questionTimerKey, elapsedSeconds: Math.min(questionLimitSeconds, base.elapsedSeconds + 1) };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [attemptCompleted, questionLimitSeconds, questionTimerKey]);

  const restartAttempt = useCallback(() => {
    setAttemptCompleted(false);
    setLatestAttempt(null);
    setAttemptSequence((value) => value + 1);
  }, []);
  const completeAttempt = useCallback((attempt: ListeningAttempt) => {
    setAttemptCompleted(true);
    setLatestAttempt(attempt);
  }, []);

  useEffect(() => {
    let active = true;
    void syncPublishedListeningHubItems()
      .then((changed) => {
        if (active && changed) setHubVersion((value) => value + 1);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <View testID="listening-practice-screen" style={styles.screen}>
      <PageHeader compact={isCompact} context={context} resourcesOpen={resourcesOpen} onToggleResources={() => setResourcesOpen((value) => !value)} />
      {resourcesOpen ? <LectureResourcesPanel context={context} fullAccess={fullAccess} /> : null}
      <ModeBanner context={context} />
      <View style={[styles.mainGrid, isWide ? styles.mainGridWide : null]}>
        <View style={styles.mainColumn}>
          <AudioPlayer compact={isCompact} context={context} fullAccess={fullAccess} playback={playback} onPlaybackChange={handlePlaybackChange} />
          {isCompact ? (
            <View style={styles.mobilePracticeStack}>
              <MobilePanelToggle value={mobilePanel} onChange={setMobilePanel} />
              {mobilePanel === 'notes' ? <NotesPanel context={context} userId={user.id} /> : <QuestionsPanel key={questionTimerKey} compact context={context} user={user} remainingSeconds={remainingQuestionSeconds} timeLimitSeconds={questionLimitSeconds} onCompleted={completeAttempt} onRestart={restartAttempt} />}
            </View>
          ) : (
            <View style={[styles.practiceGrid, isTablet ? styles.practiceGridWide : null]}>
              <NotesPanel context={context} userId={user.id} />
              <QuestionsPanel key={questionTimerKey} compact={isCompact} context={context} user={user} remainingSeconds={remainingQuestionSeconds} timeLimitSeconds={questionLimitSeconds} onCompleted={completeAttempt} onRestart={restartAttempt} />
            </View>
          )}
        </View>
        <View style={[styles.sideColumn, !isWide ? styles.sideColumnStacked : null]}>
          <OutlinePanel compact={isCompact} context={context} currentSeconds={playback.currentSeconds} />
          <StatsPanel context={context} />
          <StudyTipPanel context={context} />
        </View>
      </View>
      <ScoreNudge attempt={latestAttempt} />
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
  playerFill: { height: "100%", borderRadius: 999, backgroundColor: studentTokens.yellow },
  playerControls: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 14 },
  embeddedPlayer: { width: '100%', aspectRatio: 16 / 9, borderRadius: 10, overflow: 'hidden', backgroundColor: '#08142e' },
  uploadedAudioWrap: { width: '100%', minHeight: 74, borderRadius: 10, backgroundColor: '#08142e', justifyContent: 'center', padding: 12 },
  externalMediaButton: { minWidth: 128, minHeight: 52, borderRadius: 14, backgroundColor: '#f15f21', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 14, flexShrink: 0 },
  externalMediaText: { fontFamily: fontFamily, color: '#ffffff', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  playerSourceText: { fontFamily: fontFamily, color: '#d8e3ff', fontSize: 9, lineHeight: 13, fontWeight: '600' },
  controlIcon: { width: 19, height: 19, flexShrink: 0 },
  controlDivider: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.16)' },
  speedText: { fontFamily: fontFamily, color: '#ffffff', fontSize: 12, lineHeight: 15, fontWeight: '700' },
  speedLabel: { fontFamily: fontFamily, color: '#d8e3ff', fontSize: 7, lineHeight: 9, fontWeight: '700', marginLeft: -10, marginTop: 16 },
  volumeTrack: { width: 132, maxWidth: '24%', height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.24)', overflow: 'hidden' },
  volumeFill: { width: '48%', height: '100%', backgroundColor: studentTokens.yellow, borderRadius: 999 },
  fullscreenIcon: { width: 19, height: 19, alignSelf: "center" },
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
  noteInput: { flex: 1, minWidth: 0, minHeight: 246, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14, color: "#31405c", fontFamily: fontFamily, fontSize: 10, lineHeight: 15, fontWeight: "600" },
  paperLines: { flex: 1, minWidth: 0, paddingHorizontal: 14, paddingTop: 14, gap: 8 },
  noteLine: { fontFamily: fontFamily, color: '#31405c', fontSize: 10, lineHeight: 15, fontWeight: '600' },
  noteLineMuted: { fontFamily: fontFamily, color: '#5f6980', fontSize: 10, lineHeight: 15, fontWeight: '600', marginTop: 10 },
  notesFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  footerText: { fontFamily: fontFamily, color: '#6e778b', fontSize: 8, lineHeight: 11, fontWeight: '700' },
  questionBody: { padding: 14, gap: 10 },
  resultBody: { minHeight: 410, padding: 18, alignItems: 'center', justifyContent: 'center', gap: 9 },
  resultIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: studentTokens.tealSoft, alignItems: 'center', justifyContent: 'center' },
  resultIcon: { width: 24, height: 24 },
  resultEyebrow: { fontFamily: fontFamily, color: studentTokens.teal, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  resultScore: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 36, lineHeight: 42, fontWeight: '700' },
  resultTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  resultMessage: { maxWidth: 430, fontFamily: fontFamily, color: studentTokens.text, fontSize: 10, lineHeight: 15, fontWeight: '600', textAlign: 'center' },
  resultStats: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  resultStat: { flex: 1, minWidth: 92, minHeight: 58, borderRadius: 8, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.neutral, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  resultStatValue: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 13, lineHeight: 17, fontWeight: '700' },
  resultStatLabel: { fontFamily: fontFamily, color: studentTokens.muted, fontSize: 8, lineHeight: 11, fontWeight: '700', marginTop: 2 },
  resultSaveText: { fontFamily: fontFamily, color: studentTokens.teal, fontSize: 9, lineHeight: 13, fontWeight: '700', textAlign: 'center' },
  resultSaveTextLocal: { color: studentTokens.yellowDeep },
  resultActions: { width: '100%', flexDirection: 'row', gap: 8, marginTop: 4 },
  resultActionButton: { flex: 1, minWidth: 120, minHeight: 36, borderRadius: 7 },
  resultBackButton: { backgroundColor: studentTokens.navy, borderColor: studentTokens.navy },
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
  navigatorOverflow: { fontFamily: fontFamily, color: '#5f6980', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  questionText: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  answerList: { gap: 8 },
  answerRow: { minHeight: 39, borderRadius: 8, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.surface, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 9, paddingVertical: 8 },
  answerSelected: { borderColor: '#f3c25f', backgroundColor: '#fff7e4' },
  answerIncorrect: { borderColor: "#f7b0a2", backgroundColor: "#fff1ed" },
  answerLetter: { width: 21, height: 21, borderRadius: 11, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  answerLetterSelected: { backgroundColor: studentTokens.orange },
  answerLetterIncorrect: { backgroundColor: "#ef6b4a" },
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
  resourcesCard: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', backgroundColor: '#fbfcff', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  resourcesBody: { padding: 13, gap: 10 },
  resourcesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  resourceCount: { fontFamily: fontFamily, color: studentTokens.muted, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  resourcesList: { gap: 8 },
  resourceRow: { minHeight: 56, borderRadius: 9, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 8 },
  resourceRowLocked: { opacity: 0.68 },
  resourceIconBox: { width: 34, height: 34, borderRadius: 12, backgroundColor: studentTokens.orangeSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resourceIcon: { width: 17, height: 17 },
  resourceCopy: { flex: 1, minWidth: 0 },
  resourceTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  resourceMeta: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 9, lineHeight: 13, fontWeight: '600', marginTop: 1 },
  resourceAction: { minHeight: 28, borderRadius: 8, borderWidth: 1, borderColor: '#dce3ee', backgroundColor: studentTokens.neutral, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  resourceActionActive: { borderColor: '#c7e8e3', backgroundColor: studentTokens.tealSoft },
  resourceActionText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  resourceActionTextActive: { color: studentTokens.teal },
  resourcesEmpty: { minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  resourcesEmptyText: { fontFamily: fontFamily, color: studentTokens.muted, fontSize: 10, lineHeight: 14, fontWeight: '700' },
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
  transcriptPreview: { borderRadius: 8, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: '#fbfcff', padding: 10, gap: 6 },
  transcriptLine: { fontFamily: fontFamily, color: '#4f5870', fontSize: 9, lineHeight: 14, fontWeight: '600' },
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
  controlButton: { minWidth: 44, minHeight: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  controlButtonDisabled: { opacity: 0.38 },
  fullscreenButton: { minWidth: 44, minHeight: 44, borderRadius: 14, marginLeft: 'auto', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  playerControlsCompact: { minHeight: 44, flexWrap: 'wrap', gap: 8 },
  modeNotice: { borderRadius: 8, borderWidth: 1, borderColor: '#c7e8e3', backgroundColor: studentTokens.tealSoft, paddingHorizontal: 10, paddingVertical: 8 },
  modeNoticeExam: { borderColor: '#f3dfa3', backgroundColor: studentTokens.yellowSoft },
  modeNoticeText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 10, lineHeight: 15, fontWeight: '600' },
  outlineHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  outlineToggle: { minHeight: 34, borderRadius: 8, borderWidth: 1, borderColor: '#dce3ee', backgroundColor: studentTokens.surface, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  outlineToggleText: { fontFamily: fontFamily, color: studentTokens.navy, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  outlineEmptyState: { minHeight: 40, borderRadius: 8, borderWidth: 1, borderColor: "#e5eaf2", backgroundColor: "#fbfcff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 10 },
  outlineEmptyText: { fontFamily: fontFamily, color: "#8a94a8", fontSize: 10, lineHeight: 14, fontWeight: "700" },
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
