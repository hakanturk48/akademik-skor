import { TestResultsPage } from '@/components/student/TestingAnalysisScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function TestResultsScreen() {
  return <StudentRouteScreen routeKey="mock-tests">{() => <TestResultsPage />}</StudentRouteScreen>;
}
