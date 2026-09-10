import { WritingPractice } from '@/components/student/PracticeScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function WritingPracticeScreen() {
  return <StudentRouteScreen routeKey="writing">{() => <WritingPractice />}</StudentRouteScreen>;
}