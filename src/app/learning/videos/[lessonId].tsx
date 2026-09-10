import { useLocalSearchParams } from 'expo-router';

import { VideoPlayer } from '@/components/student/VideoPlayer';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function VideoLessonDetailScreen() {
  const params = useLocalSearchParams<{ lessonId?: string | string[] }>();
  const rawLessonId = params.lessonId;
  const lessonId = Array.isArray(rawLessonId) ? rawLessonId[0] : rawLessonId ?? 'reading-inference-mini-lesson';

  return <StudentRouteScreen routeKey="video-lessons">{(user) => <VideoPlayer user={user} lessonId={lessonId} />}</StudentRouteScreen>;
}