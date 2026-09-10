import { MyLearning } from '@/components/student/MyLearning';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function MyLearningScreen() {
  return <StudentRouteScreen routeKey="my-learning">{(user) => <MyLearning user={user} />}</StudentRouteScreen>;
}