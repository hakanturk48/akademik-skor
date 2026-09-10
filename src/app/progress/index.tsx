import { MyProgress } from '@/components/student/PracticeScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function MyProgressScreen() {
  return <StudentRouteScreen routeKey="my-progress">{(user) => <MyProgress user={user} />}</StudentRouteScreen>;
}
