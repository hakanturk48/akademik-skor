import { PaymentResultPage } from '@/components/student/PlanningAccountScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function PaymentSuccessScreen() {
  return <StudentRouteScreen routeKey="subscription">{() => <PaymentResultPage status="success" />}</StudentRouteScreen>;
}
