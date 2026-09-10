import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';
import { VocabularyLearningPage } from '@/components/student/VocabularyLearningScreens';

export default function VocabularyScreen() {
  return <StudentRouteScreen routeKey="vocabulary">{(user) => <VocabularyLearningPage user={user} />}</StudentRouteScreen>;
}
