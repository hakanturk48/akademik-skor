import { ActivityHistoryPage } from '@/components/student/PlanningAccountScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function ActivityHistoryScreen() {
  return <StudentRouteScreen routeKey="activity-history">{() => <ActivityHistoryPage />}</StudentRouteScreen>;
}
