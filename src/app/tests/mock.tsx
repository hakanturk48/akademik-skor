import { MockTests } from '@/components/student/PracticeScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function MockTestsScreen() {
  return <StudentRouteScreen routeKey="mock-tests">{(user) => <MockTests user={user} />}</StudentRouteScreen>;
}