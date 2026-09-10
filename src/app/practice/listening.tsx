import { ListeningPractice } from '@/components/student/ListeningPractice';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function ListeningPracticeScreen() {
  return <StudentRouteScreen routeKey="listening">{() => <ListeningPractice />}</StudentRouteScreen>;
}