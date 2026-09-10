import { ScoreAnalysisPage } from '@/components/student/TestingAnalysisScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function ScoreAnalysisScreen() {
  return <StudentRouteScreen routeKey="score-analysis">{() => <ScoreAnalysisPage />}</StudentRouteScreen>;
}
