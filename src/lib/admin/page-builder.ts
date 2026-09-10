import type {
  AdminActor,
  AdminPageBuilderState,
  PageBuilderAuditEntry,
  AdminWorkspaceState,
  PageBuilderAudience,
  PageBuilderComponentType,
  PageBuilderPage,
  PageBuilderResponsiveRules,
  PageBuilderSection,
  PageBuilderSectionConfiguration,
  PageBuilderStatus,
  PageBuilderTab,
  PageBuilderVersion,
} from './types';

export type PageBuilderRegistryItem = {
  id: string;
  type: PageBuilderComponentType;
  label: string;
  description: string;
  allowedPages: ('system' | 'content' | 'all')[];
  defaultProps: PageBuilderSectionConfiguration;
  editableProps: string[];
  responsiveRules: PageBuilderResponsiveRules;
};

const allPages: ('system' | 'content' | 'all')[] = ['all'];
const registryItem = (type: PageBuilderComponentType, label: string, description: string, defaults: PageBuilderSectionConfiguration, editableProps: string[], responsiveRules: PageBuilderResponsiveRules = { desktopWidth: 'wide', tablet: 'stack', mobile: 'stack' }): PageBuilderRegistryItem => ({
  id: type,
  type,
  label,
  description,
  allowedPages: allPages,
  defaultProps: defaults,
  editableProps,
  responsiveRules,
});

export const pageBuilderRegistry: PageBuilderRegistryItem[] = [
  registryItem('HeroBanner', 'Karşılama alanı', 'Sayfanın ana mesajı ve birincil aksiyonu.', { eyebrow: 'Akademik Skor', title: 'Çalışma planına kaldığın yerden devam et.', body: 'Öğrenme akışını tek bir görünümde takip et.', ctaLabel: 'Devam et' }, ['eyebrow', 'title', 'body', 'ctaLabel'], { desktopWidth: 'full', tablet: 'stack', mobile: 'stack' }),
  registryItem('StatsGrid', 'İstatistikler', 'Özet metrikleri güvenli kartlarla gösterir.', { columns: 4, metricSet: 'progress' }, ['columns', 'metricSet']),
  registryItem('ContinueLearning', 'Öğrenmeye devam et', 'Son çalışmayı kaldığı yerden açar.', { title: 'Öğrenmeye devam et', actionLabel: 'Derse devam et' }, ['title', 'actionLabel']),
  registryItem('SkillCards', 'Beceri kartları', 'Reading, Listening, Speaking ve Writing kartlarını listeler.', { title: 'Becerilerine odaklan', columns: 4 }, ['title', 'columns']),
  registryItem('CourseGrid', 'Kurs ızgarası', 'Yayınlanmış kursları kart düzeninde sunar.', { title: 'Kurslar', columns: 3 }, ['title', 'columns']),
  registryItem('VideoGrid', 'Video ızgarası', 'Video dersleri katalog verisine göre listeler.', { title: 'Önerilen dersler', columns: 3, limit: 6 }, ['title', 'columns', 'limit']),
  registryItem('FilterBar', 'Filtre çubuğu', 'Katalog filtrelerini registry sınırları içinde sunar.', { filters: ['skill', 'level', 'duration'] }, ['filters']),
  registryItem('CategoryTabs', 'Kategori sekmeleri', 'İzin verilen içerik kategorilerini sekme olarak sunar.', { categories: ['all', 'reading', 'listening'] }, ['categories']),
  registryItem('VocabularySetGrid', 'Kelime setleri', 'Yayınlanmış kelime setlerini gösterir.', { title: 'Kelime setleri', columns: 3 }, ['title', 'columns']),
  registryItem('VocabularyPracticeLauncher', 'Kelime pratiği başlatıcı', 'Kelime tekrarını güvenli aksiyonla başlatır.', { title: 'Bugünkü kelime pratiği', actionLabel: 'Pratiğe başla' }, ['title', 'actionLabel']),
  registryItem('GrammarTopicGrid', 'Dil bilgisi konuları', 'Dil bilgisi konu kartlarını gösterir.', { title: 'Dil bilgisi konuları', columns: 3 }, ['title', 'columns']),
  registryItem('GrammarPracticeLauncher', 'Dil bilgisi pratiği', 'Dil bilgisi pratiğini başlatır.', { title: 'Kısa dil bilgisi pratiği', actionLabel: 'Pratiğe başla' }, ['title', 'actionLabel']),
  registryItem('MiniTestBuilder', 'Mini test oluşturucu', 'Mini test oluşturma akışını başlatır.', { title: 'Mini testini oluştur', actionLabel: 'Test oluştur' }, ['title', 'actionLabel']),
  registryItem('AudioPractice', 'Ses pratiği', 'Sesli çalışma alanını açar.', { title: 'Listening pratiği', actionLabel: 'Pratiğe başla' }, ['title', 'actionLabel']),
  registryItem('Recommendations', 'Öneriler', 'Rule-based öneri kartlarını gösterir.', { title: 'Sana özel öneriler', limit: 3 }, ['title', 'limit']),
  registryItem('RecentActivity', 'Son aktiviteler', 'Son çalışma aktivitelerini listeler.', { title: 'Son aktiviteler', limit: 5 }, ['title', 'limit']),
  registryItem('StudyPlanWidget', 'Çalışma planı', 'Hedef ve çalışma planını gösterir.', { title: 'Çalışma planın', actionLabel: 'Planı gör' }, ['title', 'actionLabel']),
  registryItem('ProgressChart', 'İlerleme grafiği', 'Beceri ilerlemesini güvenli grafik bileşeniyle gösterir.', { title: 'İlerleme', metric: 'mastery' }, ['title', 'metric']),
  registryItem('Heatmap', 'Çalışma ısı haritası', 'Çalışma sıklığını gösterir.', { title: 'Çalışma düzenin' }, ['title']),
  registryItem('PricingCards', 'Plan kartları', 'Plan seçeneklerini gösterir.', { title: 'Planını seç', columns: 3 }, ['title', 'columns']),
  registryItem('FAQ', 'Sık sorulan sorular', 'Güvenli soru-cevap listesini gösterir.', { title: 'Sık sorulan sorular' }, ['title']),
  registryItem('CustomCTA', 'Özel aksiyon alanı', 'Registry içindeki tek bir aksiyonu öne çıkarır.', { title: 'Bir sonraki adımın hazır', body: 'Çalışmana devam etmek için bir aksiyon seç.', actionLabel: 'Başla' }, ['title', 'body', 'actionLabel']),
];

const now = () => new Date().toISOString();
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const actor = (email = 'system@akademikskor.local'): AdminActor => ({ id: 'page-builder-system', email, role: 'admin' });

function createSection(pageId: string, type: PageBuilderComponentType, sortOrder: number, locked = false): PageBuilderSection {
  const item = pageBuilderRegistry.find((entry) => entry.type === type);
  if (!item) throw new Error('Bu bileşen registry içinde bulunamadı.');
  return {
    id: `section-${pageId}-${Date.now()}-${sortOrder}`,
    pageId,
    componentType: type,
    sortOrder,
    isVisible: true,
    configuration: clone(item.defaultProps),
    responsiveRules: clone(item.responsiveRules),
    audience: 'all',
    requiredPlan: null,
    locked,
  };
}

function createVersion(pageId: string, sections: PageBuilderSection[], tabs: PageBuilderTab[], status: PageBuilderStatus, createdBy: AdminActor | null, version = 1): PageBuilderVersion {
  const at = now();
  return { version, status, sections, tabs, createdBy, updatedBy: createdBy, publishedBy: status === 'published' ? createdBy : null, publishedAt: status === 'published' ? at : null, createdAt: at, updatedAt: at };
}

export function defaultPageBuilderState(): AdminPageBuilderState {
  const dashboardSections = [createSection('dashboard', 'HeroBanner', 10, true), createSection('dashboard', 'StatsGrid', 20, true), createSection('dashboard', 'Recommendations', 30, true), createSection('dashboard', 'RecentActivity', 40)];
  const dashboardTabs: PageBuilderTab[] = [
    { id: 'tab-dashboard-overview', pageId: 'dashboard', type: 'system', title: 'Genel Bakış', slug: 'overview', sortOrder: 10, isVisible: true, componentType: 'StatsGrid', locked: true },
    { id: 'tab-dashboard-progress', pageId: 'dashboard', type: 'system', title: 'İlerleme', slug: 'progress', sortOrder: 20, isVisible: true, componentType: 'ProgressChart', locked: true },
  ];
  const videoSections = [createSection('video-lessons', 'CategoryTabs', 10), createSection('video-lessons', 'FilterBar', 20), createSection('video-lessons', 'VideoGrid', 30)];
  const videoTabs: PageBuilderTab[] = [{ id: 'tab-video-library', pageId: 'video-lessons', type: 'system', title: 'Video Dersler', slug: 'library', sortOrder: 10, isVisible: true, componentType: 'VideoGrid', locked: true }];
  const pages: PageBuilderPage[] = [
    { id: 'dashboard', slug: 'dashboard', title: 'Dashboard', kind: 'system', locked: true, allowedComponentTypes: pageBuilderRegistry.map((item) => item.type), versions: [createVersion('dashboard', dashboardSections, dashboardTabs, 'published', actor(), 1)], currentVersion: 1, createdAt: now(), updatedAt: now() },
    { id: 'video-lessons', slug: 'learning/videos', title: 'Video Lessons', kind: 'content', locked: false, allowedComponentTypes: pageBuilderRegistry.map((item) => item.type), versions: [createVersion('video-lessons', videoSections, videoTabs, 'draft', actor(), 1)], currentVersion: 1, createdAt: now(), updatedAt: now() },
  ];
  return { schemaVersion: 1, pages, audit: [] };
}

export function ensurePageBuilderState(state: AdminWorkspaceState): AdminPageBuilderState {
  return state.pageBuilder ?? defaultPageBuilderState();
}

export function pageBuilderRegistryItem(type: PageBuilderComponentType) {
  return pageBuilderRegistry.find((item) => item.type === type);
}

export function currentPageBuilderVersion(page: PageBuilderPage) {
  return page.versions.find((version) => version.version === page.currentVersion) ?? page.versions[page.versions.length - 1];
}

function pageFor(state: AdminPageBuilderState, pageId: string) {
  const page = state.pages.find((item) => item.id === pageId);
  if (!page) throw new Error('Sayfa bulunamadı.');
  return page;
}

function validateComponent(page: PageBuilderPage, type: PageBuilderComponentType) {
  if (!pageBuilderRegistryItem(type) || !page.allowedComponentTypes.includes(type)) throw new Error('Bu bileşen seçilen sayfa için izinli değil.');
}

function draftVersion(page: PageBuilderPage, user: AdminActor) {
  const current = currentPageBuilderVersion(page);
  if (current.status === 'draft' || current.status === 'review') return clone(current);
  return createVersion(page.id, clone(current.sections), clone(current.tabs), 'draft', user, page.currentVersion + 1);
}

function updatePage(state: AdminPageBuilderState, pageId: string, user: AdminActor, action: PageBuilderAuditEntry['action'], summary: string, mutate: (version: ReturnType<typeof draftVersion>, page: PageBuilderPage) => void): AdminPageBuilderState {
  const page = pageFor(state, pageId);
  const version = draftVersion(page, user);
  mutate(version, page);
  version.status = 'draft';
  version.updatedBy = user;
  version.updatedAt = now();
  const nextPage = { ...page, currentVersion: version.version, updatedAt: version.updatedAt, versions: [...page.versions.filter((item) => item.version !== version.version), version].sort((a, b) => a.version - b.version) };
  return { ...state, pages: state.pages.map((item) => item.id === pageId ? nextPage : item), audit: [{ id: `page-audit-${Date.now()}`, action, pageId, user, timestamp: now(), summary }, ...state.audit].slice(0, 100) };
}

export function addPageBuilderSection(state: AdminPageBuilderState, pageId: string, type: PageBuilderComponentType, user: AdminActor) {
  return updatePage(state, pageId, user, 'created', `${type} bölümü eklendi.`, (version, page) => {
    validateComponent(page, type);
    version.sections.push(createSection(pageId, type, Math.max(0, ...version.sections.map((item) => item.sortOrder)) + 10));
  });
}

export function duplicatePageBuilderSection(state: AdminPageBuilderState, pageId: string, sectionId: string, user: AdminActor) {
  return updatePage(state, pageId, user, 'created', 'Bölüm kopyalandı.', (version) => {
    const source = version.sections.find((item) => item.id === sectionId);
    if (!source) throw new Error('Bölüm bulunamadı.');
    if (source.locked) throw new Error('Kilitli sistem bölümü kopyalanamaz.');
    const copy = clone(source);
    copy.id = `section-${pageId}-${Date.now()}`;
    copy.sortOrder = Math.max(0, ...version.sections.map((item) => item.sortOrder)) + 10;
    copy.locked = false;
    version.sections.push(copy);
  });
}

export function updatePageBuilderSection(state: AdminPageBuilderState, pageId: string, sectionId: string, changes: Partial<Pick<PageBuilderSection, 'configuration' | 'responsiveRules' | 'audience' | 'requiredPlan'>>, user: AdminActor) {
  return updatePage(state, pageId, user, 'updated', 'Bölüm ayarları güncellendi.', (version) => {
    const section = version.sections.find((item) => item.id === sectionId);
    if (!section) throw new Error('Bölüm bulunamadı.');
    if (section.locked) throw new Error('Kilitli sistem bölümü değiştirilemez.');
    Object.assign(section, changes);
  });
}

export function togglePageBuilderSection(state: AdminPageBuilderState, pageId: string, sectionId: string, user: AdminActor) {
  return updatePage(state, pageId, user, 'updated', 'Bölüm görünürlüğü güncellendi.', (version) => {
    const section = version.sections.find((item) => item.id === sectionId);
    if (!section) throw new Error('Bölüm bulunamadı.');
    if (section.locked) throw new Error('Kilitli sistem bölümü gizlenemez.');
    section.isVisible = !section.isVisible;
  });
}

export function reorderPageBuilderSection(state: AdminPageBuilderState, pageId: string, sectionId: string, direction: 'up' | 'down', user: AdminActor) {
  return updatePage(state, pageId, user, 'updated', 'Bölüm sırası güncellendi.', (version) => {
    const sections = [...version.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sections.findIndex((item) => item.id === sectionId);
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || !sections[nextIndex]) return;
    if (sections[index].locked || sections[nextIndex].locked) throw new Error('Kilitli sistem bölümleri taşınamaz.');
    const currentOrder = sections[index].sortOrder;
    sections[index].sortOrder = sections[nextIndex].sortOrder;
    sections[nextIndex].sortOrder = currentOrder;
    version.sections = sections;
  });
}

export function updatePageBuilderTab(state: AdminPageBuilderState, pageId: string, tab: PageBuilderTab, user: AdminActor) {
  return updatePage(state, pageId, user, 'tab-updated', 'Sayfa sekmeleri güncellendi.', (version) => {
    if (tab.type === 'system' && (!tab.componentType || !pageBuilderRegistryItem(tab.componentType))) throw new Error('Sistem sekmesi izinli bir bileşene bağlı olmalı.');
    const index = version.tabs.findIndex((item) => item.id === tab.id);
    if (index >= 0 && version.tabs[index].locked) throw new Error('Kilitli sistem sekmesi değiştirilemez.');
    if (index >= 0) version.tabs[index] = clone(tab); else version.tabs.push(clone(tab));
  });
}

export function removePageBuilderTab(state: AdminPageBuilderState, pageId: string, tabId: string, user: AdminActor) {
  return updatePage(state, pageId, user, 'tab-updated', 'Sayfa sekmesi kaldırıldı.', (version) => {
    const tab = version.tabs.find((item) => item.id === tabId);
    if (tab?.locked) throw new Error('Kilitli sistem sekmesi kaldırılamaz.');
    version.tabs = version.tabs.filter((item) => item.id !== tabId);
  });
}

export function publishPageBuilder(state: AdminPageBuilderState, pageId: string, user: AdminActor) {
  const page = pageFor(state, pageId);
  const current = currentPageBuilderVersion(page);
  const visible = current.sections.filter((section) => section.isVisible);
  if (visible.some((section) => !pageBuilderRegistryItem(section.componentType))) throw new Error('Registry dışında bileşen yayınlanamaz.');
  const published = clone(current);
  published.status = 'published';
  published.publishedBy = user;
  published.publishedAt = now();
  published.updatedBy = user;
  published.updatedAt = now();
  const nextPage = { ...page, versions: [...page.versions.filter((item) => item.version !== published.version), published], updatedAt: published.updatedAt };
  return { ...state, pages: state.pages.map((item) => item.id === pageId ? nextPage : item), audit: [{ id: `page-audit-${Date.now()}`, action: 'published' as const, pageId, user, timestamp: now(), summary: `Sayfa ${published.version}. sürüm olarak yayınlandı.` }, ...state.audit] };
}

export function restorePageBuilderVersion(state: AdminPageBuilderState, pageId: string, versionNumber: number, user: AdminActor) {
  const page = pageFor(state, pageId);
  const source = page.versions.find((version) => version.version === versionNumber);
  if (!source) throw new Error('Sürüm bulunamadı.');
  const restored = createVersion(pageId, clone(source.sections), clone(source.tabs), 'draft', user, Math.max(...page.versions.map((version) => version.version)) + 1);
  restored.restoredFrom = versionNumber;
  const nextPage = { ...page, currentVersion: restored.version, updatedAt: restored.updatedAt, versions: [...page.versions, restored] };
  return { ...state, pages: state.pages.map((item) => item.id === pageId ? nextPage : item), audit: [{ id: `page-audit-${Date.now()}`, action: 'restored' as const, pageId, user, timestamp: now(), summary: `Sürüm ${versionNumber} yeni taslak olarak geri yüklendi.` }, ...state.audit] };
}

export function newPageBuilderTab(pageId: string, type: 'content' | 'system' = 'content'): PageBuilderTab {
  return { id: `tab-${pageId}-${Date.now()}`, pageId, type, title: type === 'system' ? 'Yeni sistem sekmesi' : 'Yeni içerik sekmesi', slug: `tab-${Date.now()}`, sortOrder: 100, isVisible: true, componentType: type === 'system' ? 'CustomCTA' : undefined, content: type === 'content' ? 'Sekme içeriği' : undefined };
}

export function newResponsiveRules(): PageBuilderResponsiveRules { return { desktopWidth: 'wide', tablet: 'stack', mobile: 'stack' }; }
export function newSectionConfiguration(type: PageBuilderComponentType) { return clone(pageBuilderRegistryItem(type)?.defaultProps ?? {}); }
export function pageBuilderAudienceLabel(value: PageBuilderAudience) { return value === 'all' ? 'Herkes' : value === 'premium' ? 'Premium' : 'Giriş yapanlar'; }
