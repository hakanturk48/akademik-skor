import { SkillAnalysisPage } from '@/components/student/TestingAnalysisScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function SkillAnalysisScreen() {
  return <StudentRouteScreen routeKey="skill-analysis">{() => <SkillAnalysisPage />}</StudentRouteScreen>;
}
