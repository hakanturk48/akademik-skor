import { Dashboard } from '@/components/student/Dashboard';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function DashboardScreen() {
  return (
    <StudentRouteScreen routeKey="dashboard">{(user) => <Dashboard user={user} />}</StudentRouteScreen>
  );
}
