import { useLocalSearchParams } from 'expo-router';

import { GrammarTopicPage } from '@/components/student/GrammarLearningScreens';
import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';

export default function GrammarTopicScreen() {
  const { topicSlug } = useLocalSearchParams<{ topicSlug?: string }>();
  const resolvedTopicSlug = typeof topicSlug === 'string' && topicSlug.length ? topicSlug : 'relative-clauses';

  return <StudentRouteScreen routeKey="grammar">{(user) => <GrammarTopicPage user={user} topicSlug={resolvedTopicSlug} />}</StudentRouteScreen>;
}
