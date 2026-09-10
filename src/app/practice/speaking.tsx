import { SpeakingPractice } from '@/components/student/PracticeScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function SpeakingPracticeScreen() {
  return <StudentRouteScreen routeKey="speaking">{() => <SpeakingPractice />}</StudentRouteScreen>;
}