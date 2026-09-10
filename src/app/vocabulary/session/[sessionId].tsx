import { useLocalSearchParams } from 'expo-router';

import { StudentRouteScreen } from '@/components/student/StudentRouteScreen';
import { VocabularySessionPage } from '@/components/student/VocabularyLearningScreens';

export default function VocabularySessionRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const resolvedSessionId = typeof sessionId === 'string' && sessionId.length ? sessionId : 'learn-new--academic-core';

  return (
    <StudentRouteScreen routeKey="vocabulary">
      {(user) => <VocabularySessionPage user={user} sessionId={resolvedSessionId} />}
    </StudentRouteScreen>
  );
}
