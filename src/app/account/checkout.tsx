import { CheckoutPage } from '@/components/student/PlanningAccountScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function CheckoutScreen() {
  return <StudentRouteScreen routeKey="subscription">{() => <CheckoutPage />}</StudentRouteScreen>;
}
