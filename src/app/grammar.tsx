import { GrammarLearningPage } from '@/components/student/GrammarLearningScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function GrammarScreen() {
  return <StudentRouteScreen routeKey="grammar">{(user) => <GrammarLearningPage user={user} />}</StudentRouteScreen>;
}
