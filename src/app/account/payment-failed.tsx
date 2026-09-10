import { PaymentResultPage } from '@/components/student/PlanningAccountScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function PaymentFailedScreen() {
  return <StudentRouteScreen routeKey="subscription">{() => <PaymentResultPage status="failed" />}</StudentRouteScreen>;
}
