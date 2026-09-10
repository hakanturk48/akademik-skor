import { ReadingPractice } from '@/components/student/ReadingPractice';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function ReadingPracticeScreen() {
  return <StudentRouteScreen routeKey="reading">{() => <ReadingPractice />}</StudentRouteScreen>;
}