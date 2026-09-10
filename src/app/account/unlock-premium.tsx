import { UnlockPremiumPage } from '@/components/student/PlanningAccountScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function UnlockPremiumScreen() {
  return <StudentRouteScreen routeKey="subscription">{() => <UnlockPremiumPage />}</StudentRouteScreen>;
}
