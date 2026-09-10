import { ProfilePage } from '@/components/student/PlanningAccountScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function ProfileScreen() {
  return <StudentRouteScreen routeKey="profile">{(user) => <ProfilePage user={user} />}</StudentRouteScreen>;
}
