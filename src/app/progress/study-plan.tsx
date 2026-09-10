import { StudyPlanPage } from '@/components/student/PlanningAccountScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function StudyPlanScreen() {
  return <StudentRouteScreen routeKey="study-plan">{() => <StudyPlanPage />}</StudentRouteScreen>;
}
