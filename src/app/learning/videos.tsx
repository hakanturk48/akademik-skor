import { VideoLessons } from '@/components/student/VideoLessons';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function VideoLessonsScreen() {
  return <StudentRouteScreen routeKey="video-lessons">{(user) => <VideoLessons user={user} />}</StudentRouteScreen>;
}