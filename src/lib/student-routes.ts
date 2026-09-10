import { getNavigationRouteEntry, getStudentRouteHref as getNavigationHref, navigationGroups, navigationItems, type StudentRouteKey } from '@/lib/navigation';

export type StudentRouteMeta = {
  key: StudentRouteKey;
  label: string;
  href: string;
  title: string;
  subtitle: string;
  phase: string;
  description: string;
};

export type StudentSidebarGroup = {
  title: string;
  items: StudentRouteKey[];
};

export const studentSidebarGroups: StudentSidebarGroup[] = navigationGroups
  .filter((group) => group.placement === 'sidebar')
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((group) => ({
    title: group.title,
    items: navigationItems
      .filter((item) => item.groupId === group.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => getNavigationRouteEntry(item.route)?.routeKey)
      .filter((routeKey): routeKey is StudentRouteKey => Boolean(routeKey)),
  }));

export const studentRouteMeta: Record<StudentRouteKey, StudentRouteMeta> = {
  dashboard: { key: 'dashboard', label: 'Dashboard', href: '/dashboard', title: 'Dashboard', subtitle: 'TOEFL iBT çalışma özeti', phase: 'Faz 0', description: 'Günlük plan, hedef skor, devam eden dersler, section score kartları ve son aktiviteler.' },
  'my-learning': { key: 'my-learning', label: 'My Learning', href: '/my-learning', title: 'My Learning', subtitle: 'Tüm öğrenme içerikleri', phase: 'Faz 1', description: 'Kurs ilerlemesi, arama, filtreler, önerilen sonraki ders ve haftalık çalışma planı.' },
  'video-lessons': { key: 'video-lessons', label: 'Video Lessons', href: '/learning/videos', title: 'Video Lessons', subtitle: 'TOEFL video ders kataloğu', phase: 'Faz 1', description: 'Skill tabları, seviye filtreleri, preview/premium durumu, kaydedilen dersler ve ilerleme.' },
  reading: { key: 'reading', label: 'Reading', href: '/practice/reading', title: 'Reading Practice', subtitle: 'Passage ve soru çözümü', phase: 'Faz 2', description: 'Passage/question görünümü, soru navigasyonu, timer, review ve responsive practice akışı.' },
  listening: { key: 'listening', label: 'Listening', href: '/listening', title: 'Listening', subtitle: 'Listening hub ve odaklı pratik', phase: 'Faz 2', description: 'Hub, task type, subskill, difficulty, length seçimi ve mevcut practice/player ekranı.' },
  speaking: { key: 'speaking', label: 'Speaking', href: '/practice/speaking', title: 'Speaking Practice', subtitle: 'TOEFL /30 konuşma denemeleri', phase: 'Faz 2', description: 'Hazırlık timerı, kayıt state machine, Estimated Speaking /30 ve rubric breakdown.' },
  writing: { key: 'writing', label: 'Writing', href: '/practice/writing', title: 'Writing Practice', subtitle: 'Integrated ve independent writing', phase: 'Faz 2', description: 'Editor, word count, autosave, rubric feedback ve final estimated writing /30.' },
  vocabulary: { key: 'vocabulary', label: 'Vocabulary', href: '/vocabulary', title: 'Vocabulary', subtitle: 'TOEFL kelime çalışma alanı', phase: 'Faz 2', description: 'Word sets, mastery, review queue, learned/new/difficult ayrımı ve örnek cümleler.' },
  grammar: { key: 'grammar', label: 'Grammar', href: '/grammar', title: 'Grammar', subtitle: 'Akademik dil yapıları', phase: 'Faz 2', description: 'Grammar topic kartları, mini practice, hata türleri ve kişisel tekrar önerileri.' },
  'mini-tests': { key: 'mini-tests', label: 'Mini Tests', href: '/tests/mini', title: 'Mini Tests', subtitle: 'Kısa TOEFL pratik testleri', phase: 'Faz 3', description: 'Skill/topic filtreleri, 5-20 dakikalık testler, latest score ve review aksiyonları.' },
  'mock-tests': { key: 'mock-tests', label: 'Mock Tests', href: '/tests/mock', title: 'Mock Tests', subtitle: 'Tam deneme ve readiness', phase: 'Faz 3', description: 'Estimated TOEFL /120, section scores /30, attempt geçmişi ve premium entitlement.' },
  'my-progress': { key: 'my-progress', label: 'My Progress', href: '/progress', title: 'My Progress', subtitle: 'Gelişim ve hedef farkı', phase: 'Faz 4', description: 'Score trend, target line, Skill Mastery /100, consistency heatmap ve öneriler.' },
  'score-analysis': { key: 'score-analysis', label: 'Score Analysis', href: '/progress/score-analysis', title: 'Score Analysis', subtitle: 'TOEFL skor analitiği', phase: 'Faz 4', description: 'Overall /120 ve section /30 skorlarının trend, gap ve readiness analizi.' },
  'skill-analysis': { key: 'skill-analysis', label: 'Skill Analysis', href: '/progress/skill-analysis', title: 'Skill Analysis', subtitle: 'Beceri bazlı performans', phase: 'Faz 4', description: 'Reading, Listening, Speaking ve Writing için mastery, accuracy ve önerilen aksiyonlar.' },
  'study-plan': { key: 'study-plan', label: 'Study Plan', href: '/progress/study-plan', title: 'Study Plan', subtitle: 'Kişisel çalışma planı', phase: 'Faz 4', description: 'Haftalık görevler, hedef skor farkı, sınav tarihi ve tamamlanma durumu.' },
  'activity-history': { key: 'activity-history', label: 'Activity History', href: '/progress/activity', title: 'Activity History', subtitle: 'Tüm çalışma hareketleri', phase: 'Faz 4', description: 'Ders, test, submission, feedback ve plan aktivitelerinin filtrelenebilir geçmişi.' },
  profile: { key: 'profile', label: 'Profile', href: '/account/profile', title: 'Profile', subtitle: 'Hesap ve hedef bilgileri', phase: 'Faz 6', description: 'Kişisel bilgiler, hedef skor, sınav tarihi ve kullanım türü.' },
  settings: { key: 'settings', label: 'Settings', href: '/account/settings', title: 'Settings', subtitle: 'Bildirim ve uygulama tercihleri', phase: 'Faz 6', description: 'Bildirimler, erişilebilirlik tercihleri, dil ve çalışma ayarları.' },
  subscription: { key: 'subscription', label: 'Subscription', href: '/account/subscription', title: 'Subscription', subtitle: 'Plan ve ödeme durumu', phase: 'Faz 5', description: 'Free/Premium plan durumu, upgrade akışı ve ödeme doğrulama altyapısı.' },
};

export function getStudentRouteHref(route: StudentRouteKey) {
  return getNavigationHref(route);
}

export function getStudentRouteLabel(route: StudentRouteKey) {
  return studentRouteMeta[route].label;
}
