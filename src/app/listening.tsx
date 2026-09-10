import { ListeningLearningHub } from '@/components/student/ListeningLearningHub';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function ListeningHubScreen() {
  return <StudentRouteScreen routeKey="listening">{(user) => <ListeningLearningHub user={user} />}</StudentRouteScreen>;
}
