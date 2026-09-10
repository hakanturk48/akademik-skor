import { SettingsPage } from '@/components/student/PlanningAccountScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function SettingsScreen() {
  return <StudentRouteScreen routeKey="settings">{() => <SettingsPage />}</StudentRouteScreen>;
}
