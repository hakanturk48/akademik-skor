import { MiniTestBuilderPage } from '@/components/student/MiniTestBuilder';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function MiniTestsScreen() {
  return <StudentRouteScreen routeKey="mini-tests">{(user) => <MiniTestBuilderPage user={user} />}</StudentRouteScreen>;
}