import { TestInterfacePage } from '@/components/student/TestingAnalysisScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function TestInterfaceScreen() {
  return <StudentRouteScreen routeKey="mock-tests">{() => <TestInterfacePage />}</StudentRouteScreen>;
}
