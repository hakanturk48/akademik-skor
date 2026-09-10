import { createElement, useEffect, useState } from 'react';
import { adminDiffValue, adminFieldLabel, adminLabel } from '@/lib/admin/labels';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, studentFontFamily, studentTokens } from '@/components/student/ui';
import { VideoCard } from '@/components/student/VideoLessons';
import { WordFlashcard } from '@/components/student/VocabularyLearningScreens';
import { LearnPanel } from '@/components/student/GrammarLearningScreens';
import type { AuthUser } from '@/lib/auth';
import type { AdminDocument, AdminMutableCollectionKey, AdminSnapshot, AdminWorkspaceState, PublicationStatus } from '@/lib/admin';
import type { BaseEntity, Lesson, Question, VocabularyWord } from '@/lib/content';
import { skillThemes, type LearningSkillKey, type VideoLesson } from '@/lib/student-learning';
import { formatVideoTimestamp, getVideoEmbedUrl, videoProviderLabel } from '@/lib/video-media';
import { getVideoUploadUrl, revokeVideoUploadUrl } from '@/lib/video-upload';

export function PublicationBadge({ status = 'draft', version }: { status?: PublicationStatus; version?: number }) {
  const tone = status === 'published' ? 'teal' : status === 'review' ? 'yellow' : status === 'archived' ? 'danger' : 'blue';
  return <Badge label={`${adminLabel(status)}${version ? ` / ${version}. sürüm` : ''}`} tone={tone} />;
}

export function PublicationMetadata({ document }: { document?: AdminDocument }) {
  const snapshot = document?.revisions.at(-1)?.snapshot;
  return <View style={styles.metadata}>
    <PublicationBadge status={document?.status} version={document?.version} />
    <Text style={styles.meta}>Oluşturan: {snapshot?.createdBy?.email ?? 'Kaydedilmemiş'}</Text>
    <Text style={styles.meta}>Güncelleyen: {snapshot?.updatedBy?.email ?? 'Kaydedilmemiş'}</Text>
    <Text style={styles.meta}>Yayınlayan: {document?.published?.publishedBy?.email ?? 'Kaydedilmemiş'}</Text>
    <Text style={styles.meta}>Yayın tarihi: {document?.published?.publishedAt ? new Date(document.published.publishedAt).toLocaleString('tr-TR') : 'Kaydedilmemiş'}</Text>
    {document?.published && document.status !== 'published' ? <Text style={styles.meta}>Yayınlanan sürüm: {document.published.version}. Bekleyen değişiklikler henüz yayınlanmadı.</Text> : null}
  </View>;
}

export function VersionHistory({ document, onPreview, onRestore }: { document?: AdminDocument; onPreview: (snapshot: AdminSnapshot) => void; onRestore: (version: number) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!document) return <Text style={styles.body}>Sürüm geçmişini başlatmak için bir taslak kaydedin.</Text>;
  return <View testID="admin-version-history" style={styles.stack}>
    {[...document.revisions].reverse().map((revision) => <View key={revision.version} style={styles.historyItem}>
      <View style={styles.row}><PublicationBadge status={revision.status} version={revision.version} /><Text style={styles.meta}>{adminLabel(revision.action)}</Text></View>
      <Text style={styles.body}>{revision.snapshot.title}</Text>
      <Text style={styles.meta}>{revision.actor?.email ?? 'Aktarılan kayıt / kullanıcı kaydedilmemiş'}</Text>
      <Text style={styles.meta}>{new Date(revision.timestamp).toLocaleString('tr-TR')}</Text>
      <View style={styles.row}>
        <Button label={`Sürüm ${revision.version} Önizleme`} variant="secondary" onPress={() => onPreview(revision.snapshot)} />
        <Button label={`Değişiklikler (${revision.diff.length})`} variant="secondary" onPress={() => setExpanded(expanded === revision.version ? null : revision.version)} />
        <Button label={`Sürüm ${revision.version} Geri Yükle`} variant="secondary" disabled={revision.version === document.version} onPress={() => onRestore(revision.version)} />
      </View>
      {expanded === revision.version ? <View style={styles.stack}>
        {revision.diff.length ? revision.diff.map((diff) => <View key={diff.path} style={styles.diff}>
          <Text style={styles.heading}>{adminFieldLabel(diff.path)}</Text>
          <Text style={styles.meta}>Önce: {adminDiffValue(diff.path, diff.before)}</Text>
          <Text style={styles.body}>Sonra: {adminDiffValue(diff.path, diff.after)}</Text>
        </View>) : <Text style={styles.meta}>Kaydedilmiş alan değişikliği yok.</Text>}
      </View> : null}
    </View>)}
  </View>;
}

const noop = () => {};

export function AdminContentPreview({ snapshot, collection, state, user }: { snapshot: AdminSnapshot; collection: AdminMutableCollectionKey; state: AdminWorkspaceState; user: AuthUser }) {
  const catalog = state.catalog;
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (collection !== 'lessons' || (snapshot as Lesson).mediaProvider !== 'upload') return () => {};
    void getVideoUploadUrl((snapshot as Lesson).mediaUrl).then((url) => {
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
  }, [collection, snapshot]);
  const base = snapshot as BaseEntity;
  let content;
  if (collection === 'lessons') {
    const lesson = snapshot as Lesson;
    const skillSlug = catalog.skills.find((item) => item.id === lesson.taxonomy.skillId)?.slug ?? 'reading';
    const skill: LearningSkillKey = Object.hasOwn(skillThemes, skillSlug) ? skillSlug as LearningSkillKey : 'reading';
    const task = catalog.taskTypes.find((item) => item.id === lesson.taxonomy.taskTypeId);
    const level = catalog.levels.find((item) => item.id === lesson.taxonomy.levelId)?.title;
    const minutes = Math.ceil(lesson.durationSeconds / 60);
    const video: VideoLesson = {
      id: lesson.id, title: lesson.title, subtitle: '', description: lesson.description ?? '', category: skill, skill,
      course: catalog.courses.find((item) => item.id === lesson.courseId)?.title ?? '',
      module: catalog.modules.find((item) => item.id === lesson.moduleId)?.title ?? '',
      taskType: task?.slug ?? '', taskTypeLabel: task?.title ?? '', subskill: '', subskillLabel: '', topic: '', topicLabel: '',
      level: level === 'Intermediate' || level === 'Advanced' ? level : 'Foundation',
      access: lesson.isPremium ? 'premium' : 'free', duration: `${minutes}:00`, durationMinutes: minutes,
      instructor: 'Eğitmen belirtilmemiş', thumbnail: lesson.thumbnailUrl ?? '', isPremium: lesson.isPremium, progress: 0, saved: false,
      updatedAt: lesson.updatedAt, createdAt: lesson.createdAt,
      previewMinutes: Math.ceil((lesson.previewDurationSeconds ?? 0) / 60), previewDuration: Math.ceil((lesson.previewDurationSeconds ?? 0) / 60),
      status: lesson.status, tags: [], sortOrder: lesson.sortOrder, recommendedScore: 0,
      outcomes: [],
      chapters: (lesson.chapters ?? []).map((chapter, index) => {
        const nextStart = lesson.chapters?.[index + 1]?.startSeconds ?? lesson.durationSeconds;
        return { title: chapter.title, duration: formatVideoTimestamp(Math.max(0, nextStart - chapter.startSeconds)) };
      }),
      resources: [], transcript: (lesson.transcript ?? []).map((line) => line.text), transcriptLines: lesson.transcript ?? [], notesPrompt: '',
    };
    const embedUrl = getVideoEmbedUrl(lesson.mediaProvider, lesson.mediaUrl);
    content = <View style={styles.video}>
      <VideoCard lesson={video} user={user} compact preview />
      {embedUrl && Platform.OS === 'web' ? (
        <View style={styles.mediaPreview}>
          {createElement('iframe', { src: embedUrl, title: lesson.title, allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share', allowFullScreen: true, style: { border: 0, width: '100%', height: '100%', display: 'block' } })}
        </View>
      ) : uploadedVideoUrl && Platform.OS === 'web' ? (
        <View style={styles.mediaPreview}>
          {createElement('video', { src: uploadedVideoUrl, controls: true, playsInline: true, style: { width: '100%', height: '100%', display: 'block', objectFit: 'contain', backgroundColor: '#111827' } })}
        </View>
      ) : <Text style={styles.meta}>{lesson.mediaUrl ? `${videoProviderLabel(lesson.mediaProvider)} kaynağı kaydedildi. Öğrenci önizlemesi web ortamında açılır.` : 'Video bağlantısı eklenmedi. Taslak kaydedilebilir ancak yayınlanamaz.'}</Text>}
      <Text style={styles.body}>{base.description}</Text>
    </View>;
  } else if (collection === 'vocabularyWords') {
    const word = snapshot as VocabularyWord;
    content = <WordFlashcard preview onAnswer={noop} onToggleSaved={noop}
      word={{ ...word, word: word.term, definition: word.meaning, ipa: '', pronunciationLabel: '', partOfSpeech: word.partOfSpeech ?? '', academicExample: word.example ?? '', toeflExample: '', collocations: [], wordFamily: [], synonyms: [], antonyms: [], contentTags: [] }}
      progress={{ wordId: word.id, state: 'new', lastReviewedAt: null, nextReviewAt: null, correctStreak: 0, incorrectCount: 0, reviewCount: 0, difficulty: 0, interval: 0, mastery: 0, saved: false }} />;
  } else if (collection === 'grammarTopics' || collection === 'grammarLessons') {
    content = <View style={styles.stack}><Text style={styles.title}>{base.title}</Text><LearnPanel topic={{ description: base.description ?? '', rules: [], tone: 'teal' }} progress={{ completedSteps: [] }} onComplete={noop} preview /></View>;
  } else if (collection === 'questions') {
    const question = snapshot as Question;
    content = <Card title={question.title}>
      {question.stimulus ? <Text style={styles.body}>{question.stimulus}</Text> : null}
      <Text style={styles.heading}>{question.prompt}</Text>
      {snapshot.version && !snapshot.questionOptions ? <Text style={styles.meta}>Bu eski sürümün seçenek geçmişi kaydedilmemiş.</Text> : question.optionIds.map((id) => (snapshot.questionOptions ?? catalog.questionOptions).find((option) => option.id === id && option.questionId === question.id)).filter((option) => !!option).map((option) => <View key={option.id} style={styles.option}><Text style={styles.body}>{option.optionKey}. {option.body}</Text>{option.id === question.correctOptionId ? <Badge label="Doğru cevap" tone="teal" /> : null}{option.rationale ? <Text style={styles.meta}>{option.rationale}</Text> : null}</View>)}
      {question.explanation ? <Text style={styles.body}>{question.explanation}</Text> : null}
    </Card>;
  } else {
    const children = collection === 'vocabularySets' ? catalog.vocabularyWords.filter((item) => item.setId === snapshot.id) : collection === 'courses' ? catalog.modules.filter((item) => item.courseId === snapshot.id) : collection === 'modules' ? catalog.lessons.filter((item) => item.moduleId === snapshot.id) : [];
    content = <Card title={snapshot.title} right={<Badge label={base.isPremium ? 'Premium' : 'Ücretsiz'} tone={base.isPremium ? 'yellow' : 'teal'} />}>
      <Text style={styles.body}>{base.description ?? ''}</Text>
      {children.map((item) => <Text key={item.id} style={styles.body}>{item.title}</Text>)}
    </Card>;
  }
  return <View testID="admin-content-preview" style={styles.stack}>
    <Text style={styles.meta}>Salt okunur önizleme. Öğrenme ilerlemesi ve sayfa yönlendirmeleri kapalıdır.</Text>
    {content}
  </View>;
}

const styles = StyleSheet.create({
  stack: { gap: 14, minWidth: 0 },
  metadata: { gap: 6, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: studentTokens.lineSoft },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  historyItem: { borderWidth: 1, borderColor: studentTokens.line, borderRadius: 8, padding: 14, gap: 10 },
  diff: { gap: 4, paddingVertical: 8, borderTopWidth: 1, borderTopColor: studentTokens.lineSoft },
  meta: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 12, lineHeight: 19, flexShrink: 1 },
  body: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 14, lineHeight: 22, flexShrink: 1 },
  heading: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  title: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 22, lineHeight: 29, fontWeight: '700' },
  option: { borderWidth: 1, borderColor: studentTokens.line, borderRadius: 8, padding: 12, marginTop: 8 },
  video: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 14 },
  mediaPreview: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', borderRadius: 10, backgroundColor: '#000000' },
});
