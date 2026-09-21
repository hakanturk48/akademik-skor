import { SpeakingPractice } from '@/components/student/PracticeScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';
import { useLocalSearchParams } from 'expo-router';

export default function SpeakingPracticeScreen() {
  const params = useLocalSearchParams<{ task?: string | string[] }>();
  const taskSlug = Array.isArray(params.task) ? params.task[0] : params.task;
  return <StudentRouteScreen routeKey="speaking">{(user) => <SpeakingPractice user={user} taskSlug={taskSlug} />}</StudentRouteScreen>;
}
