import { SubscriptionPage } from '@/components/student/PlanningAccountScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function SubscriptionScreen() {
  return <StudentRouteScreen routeKey="subscription">{(user) => <SubscriptionPage user={user} />}</StudentRouteScreen>;
}
