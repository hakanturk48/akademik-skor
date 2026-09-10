import { useMemo, useState } from 'react';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge, Button, Card, studentFontFamily, studentTokens } from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';
import {
  addPageBuilderSection,
  currentPageBuilderVersion,
  duplicatePageBuilderSection,
  newPageBuilderTab,
  pageBuilderAudienceLabel,
  pageBuilderRegistry,
  pageBuilderRegistryItem,
  publishPageBuilder,
  removePageBuilderTab,
  reorderPageBuilderSection,
  restorePageBuilderVersion,
  togglePageBuilderSection,
  updatePageBuilderSection,
  updatePageBuilderTab,
  type AdminPageBuilderState,
  type PageBuilderComponentType,
  type PageBuilderPage,
  type PageBuilderSection,
  type PageBuilderTab,
} from '@/lib/admin';

type Props = { state: AdminPageBuilderState; user: AuthUser; isMobile: boolean; onChange: (state: AdminPageBuilderState) => void };
type SymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

const symbolName = (ios: string, web: string): SymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const upSymbol = symbolName('chevron.up', 'keyboard_arrow_up');
const downSymbol = symbolName('chevron.down', 'keyboard_arrow_down');
const copySymbol = symbolName('square.on.square', 'content_copy');
const eyeSymbol = symbolName('eye', 'visibility');
const hiddenSymbol = symbolName('eye.slash', 'visibility_off');
const lockSymbol = symbolName('lock.fill', 'lock');
const plusSymbol = symbolName('plus', 'add');

function actionIcon(name: SymbolName, label: string, onPress: () => void, disabled = false) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.iconButton, disabled ? styles.disabled : null, pressed ? styles.pressed : null]}><SymbolView name={name} tintColor={disabled ? studentTokens.muted : studentTokens.navy} size={15} style={styles.icon} /></Pressable>;
}

function cycle<T extends string>(current: T, values: T[], onChange: (next: T) => void) {
  const index = Math.max(0, values.indexOf(current));
  onChange(values[(index + 1) % values.length]);
}

const propertyLabels: Record<string, string> = {
  eyebrow: 'Üst başlık',
  title: 'Başlık',
  body: 'Açıklama',
  ctaLabel: 'Buton metni',
  actionLabel: 'Aksiyon metni',
  columns: 'Kolon sayısı',
  metricSet: 'Metrik seti',
  limit: 'Kayıt limiti',
  filters: 'Filtreler',
  categories: 'Kategoriler',
  metric: 'Gösterilecek metrik',
};

function propertyLabel(value: string) {
  return propertyLabels[value] ?? value;
}

function PreviewBlock({ section }: { section: PageBuilderSection }) {
  const registry = pageBuilderRegistryItem(section.componentType);
  const config = section.configuration;
  const title = typeof config.title === 'string' ? config.title : registry?.label;
  const body = typeof config.body === 'string' ? config.body : registry?.description;
  return (
    <View style={[styles.previewBlock, section.responsiveRules.mobile === 'hide' ? styles.previewMuted : null]}>
      <View style={styles.previewTop}><Badge label={registry?.label ?? section.componentType} tone="blue" />{section.locked ? <Badge label="Kilitli sistem" tone="default" /> : null}</View>
      <Text style={styles.previewTitle}>{title}</Text>
      <Text style={styles.previewBody}>{body}</Text>
      {typeof config.actionLabel === 'string' ? <Text style={styles.previewAction}>{config.actionLabel}</Text> : null}
    </View>
  );
}

function GeneratedPreview({ page }: { page: PageBuilderPage }) {
  const version = currentPageBuilderVersion(page);
  return (
    <Card title="Öğrenci önizlemesi" eyebrow="Registry ile oluşturulan görünüm" style={styles.previewCard}>
      <View style={styles.previewFrame}>
        {version.sections.filter((section) => section.isVisible).sort((a, b) => a.sortOrder - b.sortOrder).map((section) => <PreviewBlock key={section.id} section={section} />)}
        {version.sections.every((section) => !section.isVisible) ? <Text style={styles.muted}>Görünür bölüm yok.</Text> : null}
      </View>
      <Text style={styles.previewNote}>Bu önizleme yalnız kayıtlı registry bileşenlerini işler. Serbest HTML, CSS ve JavaScript çalıştırılmaz.</Text>
    </Card>
  );
}

function SectionEditor({ section, onChange }: { section: PageBuilderSection; onChange: (changes: Partial<Pick<PageBuilderSection, 'configuration' | 'responsiveRules' | 'audience' | 'requiredPlan'>>) => void }) {
  const registry = pageBuilderRegistryItem(section.componentType);
  if (!registry) return <Text style={styles.formError}>Bileşen registry içinde bulunamadı.</Text>;
  const values = section.configuration;
  const setValue = (key: string, raw: string) => {
    const current = values[key];
    const value = typeof current === 'number' ? Number(raw.replace(/[^0-9]/g, '')) || 0 : Array.isArray(current) ? raw.split(',').map((item) => item.trim()).filter(Boolean) : raw;
    onChange({ configuration: { ...values, [key]: value } });
  };
  return (
    <Card title="Bölüm özellikleri" eyebrow={registry.label} style={styles.editorCard}>
      <Text style={styles.description}>{registry.description}</Text>
      {registry.editableProps.map((key) => <View key={key} style={styles.formGroup}><Text style={styles.label}>{propertyLabel(key)}</Text><TextInput accessibilityLabel={`${registry.label} ${propertyLabel(key)}`} value={Array.isArray(values[key]) ? values[key].join(', ') : String(values[key] ?? '')} onChangeText={(value) => setValue(key, value)} style={styles.input} /></View>)}
      <View style={styles.optionGrid}>
        <Option label="Masaüstü genişliği" value={section.responsiveRules.desktopWidth} values={['full', 'wide', 'half']} labels={['Tam genişlik', 'Geniş', 'Yarım']} onChange={(desktopWidth) => onChange({ responsiveRules: { ...section.responsiveRules, desktopWidth: desktopWidth as 'full' | 'wide' | 'half' } })} />
        <Option label="Tablet davranışı" value={section.responsiveRules.tablet} values={['stack', 'columns']} labels={['Alt alta', 'Kolonlar']} onChange={(tablet) => onChange({ responsiveRules: { ...section.responsiveRules, tablet: tablet as 'stack' | 'columns' } })} />
        <Option label="Mobil davranışı" value={section.responsiveRules.mobile} values={['stack', 'hide']} labels={['Alt alta', 'Gizle']} onChange={(mobile) => onChange({ responsiveRules: { ...section.responsiveRules, mobile: mobile as 'stack' | 'hide' } })} />
        <Option label="Hedef kitle" value={section.audience} values={['all', 'authenticated', 'premium']} labels={['Herkes', 'Giriş yapanlar', 'Premium']} onChange={(audience) => onChange({ audience: audience as PageBuilderSection['audience'] })} />
        <Option label="Gerekli plan" value={section.requiredPlan ?? 'none'} values={['none', 'free', 'premium']} labels={['Yok', 'Ücretsiz', 'Premium']} onChange={(plan) => onChange({ requiredPlan: plan === 'none' ? null : plan as 'free' | 'premium' })} />
      </View>
    </Card>
  );
}

function Option({ label, value, values, labels, onChange }: { label: string; value: string; values: string[]; labels: string[]; onChange: (value: string) => void }) {
  const index = Math.max(0, values.indexOf(value));
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${labels[index]}`} onPress={() => cycle(value, values, onChange)} style={({ pressed }) => [styles.option, pressed ? styles.pressed : null]}><Text style={styles.optionLabel}>{label}</Text><Text style={styles.optionValue}>{labels[index]}</Text></Pressable>;
}

function TabManager({ page, onChange, user, isMobile }: { page: PageBuilderPage; onChange: (next: AdminPageBuilderState) => void; user: AuthUser; isMobile: boolean }) {
  const version = currentPageBuilderVersion(page);
  const [draft, setDraft] = useState<PageBuilderTab | null>(null);
  const [tabType, setTabType] = useState<'content' | 'system'>('content');
  const saveTab = () => { if (!draft) return; try { onChange(updatePageBuilderTab({ schemaVersion: 1, pages: [page], audit: [] }, page.id, draft, user)); setDraft(null); } catch { /* parent keeps the last valid state */ } };
  const changeTab = (tab: PageBuilderTab) => { try { onChange(updatePageBuilderTab({ schemaVersion: 1, pages: [page], audit: [] }, page.id, tab, user)); } catch { /* locked tabs are protected */ } };
  const moveTab = (tab: PageBuilderTab, direction: 'up' | 'down') => { const ordered = [...version.tabs].sort((a, b) => a.sortOrder - b.sortOrder); const index = ordered.findIndex((item) => item.id === tab.id); const other = ordered[direction === 'up' ? index - 1 : index + 1]; if (!other || tab.locked || other.locked) return; try { let next = updatePageBuilderTab({ schemaVersion: 1, pages: [page], audit: [] }, page.id, { ...tab, sortOrder: other.sortOrder }, user); next = updatePageBuilderTab(next, page.id, { ...other, sortOrder: tab.sortOrder }, user); onChange(next); } catch { /* locked tabs are protected */ } };
  const startNew = () => { setTabType('content'); setDraft(newPageBuilderTab(page.id, 'content')); };
  return <Card title="Sekme yöneticisi" eyebrow="Content Tab / System Tab" style={styles.sectionCard}>
    <Text style={styles.description}>System Tab yalnız registry bileşenine bağlanabilir. Route, script veya serbest component eklenemez.</Text>
    {[...version.tabs].sort((a, b) => a.sortOrder - b.sortOrder).map((tab) => <View key={tab.id} style={[styles.tabRow, isMobile ? styles.tabRowMobile : null]}><View style={[styles.rowCopy, isMobile ? styles.tabRowCopyMobile : null]}><Text style={styles.rowTitle}>{tab.title}</Text><Text style={styles.rowMeta}>{tab.type === 'system' ? 'System Tab' : 'Content Tab'} · {tab.slug}</Text></View><Badge label={tab.locked ? 'Kilitli' : tab.isVisible ? 'Görünür' : 'Gizli'} tone={tab.locked ? 'blue' : 'default'} />{!tab.locked ? <><Button label={tab.isVisible ? 'Gizle' : 'Göster'} size="sm" variant="secondary" onPress={() => changeTab({ ...tab, isVisible: !tab.isVisible })} /><Button label="Yukarı" size="sm" variant="secondary" onPress={() => moveTab(tab, 'up')} /><Button label="Aşağı" size="sm" variant="secondary" onPress={() => moveTab(tab, 'down')} /><Button label="Düzenle" size="sm" variant="secondary" onPress={() => { setTabType(tab.type); setDraft(tab); }} /><Button label="Kaldır" size="sm" variant="secondary" onPress={() => { try { onChange(removePageBuilderTab({ schemaVersion: 1, pages: [page], audit: [] }, page.id, tab.id, user)); } catch { /* locked tabs are protected */ } }} /></> : null}</View>)}
    {draft ? <View style={styles.tabEditor}><Text style={styles.label}>Sekme başlığı</Text><TextInput value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} style={styles.input} /><Text style={styles.label}>Sekme türü</Text><View style={styles.inlineOptions}><Button label="Content Tab" size="sm" variant={tabType === 'content' ? 'primary' : 'secondary'} onPress={() => { setTabType('content'); setDraft({ ...draft, type: 'content', componentType: undefined, content: draft.content ?? 'Sekme içeriği' }); }} /><Button label="System Tab" size="sm" variant={tabType === 'system' ? 'primary' : 'secondary'} onPress={() => { setTabType('system'); setDraft({ ...draft, type: 'system', componentType: draft.componentType ?? 'CustomCTA', content: undefined }); }} /></View>{tabType === 'system' ? <Option label="Registry bileşeni" value={draft.componentType ?? 'CustomCTA'} values={pageBuilderRegistry.map((item) => item.type)} labels={pageBuilderRegistry.map((item) => item.label)} onChange={(componentType) => setDraft({ ...draft, componentType: componentType as PageBuilderComponentType })} /> : <TextInput value={draft.content ?? ''} onChangeText={(content) => setDraft({ ...draft, content })} style={[styles.input, styles.multiline]} multiline />}{draft.id ? <View style={styles.inlineOptions}><Button label="Kaydet" onPress={saveTab} /><Button label="Vazgeç" variant="secondary" onPress={() => setDraft(null)} /></View> : null}</View> : <Button label="Sekme ekle" left={<SymbolView name={plusSymbol} tintColor={studentTokens.navy} size={16} style={styles.icon} />} variant="secondary" onPress={startNew} />}
  </Card>;
}

export function PageBuilderPanel({ state, user, isMobile, onChange }: Props) {
  const pages = state.pages;
  const [pageId, setPageId] = useState(pages[0]?.id ?? 'dashboard');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const page = pages.find((item) => item.id === pageId) ?? pages[0];
  const version = currentPageBuilderVersion(page);
  const selectedSection = version.sections.find((section) => section.id === selectedSectionId) ?? version.sections[0];
  const run = (operation: () => AdminPageBuilderState) => { try { onChange(operation()); } catch { /* invalid registry input cannot replace the current state */ } };
  const changeSection = (changes: Partial<Pick<PageBuilderSection, 'configuration' | 'responsiveRules' | 'audience' | 'requiredPlan'>>) => run(() => updatePageBuilderSection(state, page.id, selectedSection.id, changes, user));
  const pageStatus = version.status === 'published' ? 'Yayında' : version.status === 'review' ? 'İncelemede' : version.status === 'draft' ? 'Taslak' : 'Arşivlendi';
  const sectionRows = useMemo(() => [...version.sections].sort((a, b) => a.sortOrder - b.sortOrder), [version.sections]);
  if (!page) return <EmptyBuilder />;
  return <View style={styles.stack}>
    <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.kicker}>GÜVENLİ COMPONENT REGISTRY</Text><Text style={styles.title}>Sayfa Oluşturucu</Text><Text style={styles.description}>Sayfaları yalnız izin verilen bileşenlerle oluşturun. Serbest HTML, CSS ve JavaScript desteklenmez.</Text></View><View style={styles.headerActions}><Button label={preview ? 'Düzenleyici' : 'Önizleme'} variant="secondary" onPress={() => setPreview((value) => !value)} /><Button label="Yayınla" onPress={() => run(() => publishPageBuilder(state, page.id, user))} /></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pageTabs}>{pages.map((item) => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: item.id === page.id }} onPress={() => { setPageId(item.id); setSelectedSectionId(null); setPreview(false); }} style={[styles.pageTab, item.id === page.id ? styles.pageTabActive : null]}><Text style={[styles.pageTabTitle, item.id === page.id ? styles.pageTabTitleActive : null]}>{item.title}</Text><Text style={styles.pageTabMeta}>{item.kind === 'system' ? 'System page' : 'Content page'}</Text></Pressable>)}</ScrollView>
    <View style={styles.statusRow}><Badge label={`${pageStatus} · ${version.version}. sürüm`} tone="blue" />{page.locked ? <Badge label="Kritik sistem sayfası kilitli" tone="default" /> : null}<Text style={styles.muted}>Sadece registry bileşenleri ve sınırlı responsive ayarlar</Text></View>
    {preview ? <GeneratedPreview page={page} /> : <>
      <Card title="Bölümler" eyebrow={`${sectionRows.length} bölüm`} style={styles.sectionCard}><Text style={styles.description}>Sıralama için yukarı/aşağı kontrolleri klavye ve dokunmatik alternatif olarak kullanılabilir. Kilitli bölümler değiştirilemez.</Text>{sectionRows.map((section) => { const registry = pageBuilderRegistryItem(section.componentType); return <View key={section.id} style={[styles.sectionRow, isMobile ? styles.sectionRowMobile : null, selectedSection?.id === section.id ? styles.sectionRowActive : null]}><Pressable accessibilityRole="button" onPress={() => setSelectedSectionId(section.id)} style={[styles.rowCopy, isMobile ? styles.sectionRowCopyMobile : null]}><View style={styles.inlineOptions}><Text style={styles.rowTitle}>{registry?.label ?? section.componentType}</Text>{section.locked ? <SymbolView name={lockSymbol} tintColor={studentTokens.muted} size={14} style={styles.icon} /> : null}</View><Text style={styles.rowMeta}>{section.isVisible ? 'Görünür' : 'Gizli'} · {pageBuilderAudienceLabel(section.audience)} · {section.responsiveRules.mobile === 'hide' ? 'Mobilde gizli' : 'Mobil alt alta'}</Text></Pressable>{actionIcon(section.isVisible ? eyeSymbol : hiddenSymbol, section.isVisible ? 'Bölümü gizle' : 'Bölümü göster', () => run(() => togglePageBuilderSection(state, page.id, section.id, user)), Boolean(section.locked))}{actionIcon(copySymbol, 'Bölümü kopyala', () => run(() => duplicatePageBuilderSection(state, page.id, section.id, user)))}{actionIcon(upSymbol, 'Bölümü yukarı taşı', () => run(() => reorderPageBuilderSection(state, page.id, section.id, 'up', user)), Boolean(section.locked))}{actionIcon(downSymbol, 'Bölümü aşağı taşı', () => run(() => reorderPageBuilderSection(state, page.id, section.id, 'down', user)), Boolean(section.locked))}</View>; })}</Card>
      <Card title="Bölüm ekle" eyebrow="Registry" style={styles.sectionCard}><View style={[styles.registryList, isMobile ? styles.registryListMobile : null]}>{pageBuilderRegistry.filter((item) => page.allowedComponentTypes.includes(item.type)).map((item) => <Pressable key={item.type} accessibilityRole="button" accessibilityLabel={`${item.label} bölümü ekle`} onPress={() => run(() => addPageBuilderSection(state, page.id, item.type, user))} style={({ pressed }) => [styles.registryChip, pressed ? styles.pressed : null]}><Text style={styles.registryTitle}>{item.label}</Text><Text style={styles.registryType}>{item.type}</Text></Pressable>)}</View></Card>
      {selectedSection ? <SectionEditor section={selectedSection} onChange={changeSection} /> : null}
      <TabManager page={page} isMobile={isMobile} onChange={(next) => onChange({ ...state, pages: state.pages.map((item) => item.id === page.id ? next.pages[0] : item), audit: [...state.audit, ...(next.audit ?? [])].slice(-100) })} user={user} />
      <Card title="Sürüm geçmişi" eyebrow="Yayınlama akışı" style={styles.sectionCard}>{[...page.versions].sort((a, b) => b.version - a.version).map((item) => <View key={item.version} style={styles.historyRow}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{item.version}. sürüm · {item.status === 'published' ? 'Yayında' : item.status === 'draft' ? 'Taslak' : item.status === 'review' ? 'İncelemede' : 'Arşivlendi'}</Text><Text style={styles.rowMeta}>{new Date(item.updatedAt).toLocaleString('tr-TR')}</Text></View>{item.version !== version.version ? <Button label="Taslak olarak geri yükle" size="sm" variant="secondary" onPress={() => run(() => restorePageBuilderVersion(state, page.id, item.version, user))} /> : <Badge label="Aktif" tone="blue" />}</View>)}</Card>
    </>}
  </View>;
}

function EmptyBuilder() { return <Card title="Sayfa bulunamadı"><Text style={styles.description}>Page Builder için yapılandırılmış sayfa yok.</Text></Card>; }

const styles = StyleSheet.create({
  stack: { gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' },
  headerCopy: { flex: 1, minWidth: 0 },
  headerActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  kicker: { fontFamily: studentFontFamily, color: studentTokens.teal, fontSize: 11, lineHeight: 15, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 28, lineHeight: 35, fontWeight: '700', marginTop: 4 },
  description: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 13, lineHeight: 20, fontWeight: '500', marginTop: 6 },
  muted: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 12, lineHeight: 18, fontWeight: '500', flex: 1 },
  pageTabs: { gap: 8 },
  pageTab: { minWidth: 160, borderWidth: 1, borderColor: studentTokens.lineSoft, borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  pageTabActive: { borderColor: studentTokens.navy, backgroundColor: '#eef3ff' },
  pageTabTitle: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  pageTabTitleActive: { color: studentTokens.navy },
  pageTabMeta: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 11, lineHeight: 16, fontWeight: '500', marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  sectionCard: { width: '100%' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: studentTokens.lineSoft, borderRadius: 12, padding: 10, marginTop: 8, backgroundColor: '#fff' },
  sectionRowActive: { borderColor: studentTokens.blue, backgroundColor: '#f4f7ff' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  rowMeta: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 11, lineHeight: 16, fontWeight: '500', marginTop: 2 },
  inlineOptions: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  iconButton: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: studentTokens.lineSoft, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  icon: { width: 16, height: 16 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
  registryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 8 },
  registryListMobile: { width: '100%' },
  registryChip: { flexGrow: 1, flexBasis: 170, minWidth: 150, maxWidth: 240, minHeight: 72, borderWidth: 1, borderColor: studentTokens.lineSoft, borderRadius: 12, padding: 10, backgroundColor: studentTokens.neutral },
  registryTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 13, lineHeight: 17, fontWeight: '700' },
  registryType: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 10, lineHeight: 14, fontWeight: '500', marginTop: 4 },
  editorCard: { width: '100%' },
  formGroup: { gap: 6, marginTop: 10 },
  label: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 12, lineHeight: 16, fontWeight: '700' },
  input: { minHeight: 42, borderWidth: 1, borderColor: studentTokens.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: studentTokens.ink, fontFamily: studentFontFamily, fontSize: 13, lineHeight: 19, backgroundColor: '#fff' },
  multiline: { minHeight: 74, textAlignVertical: 'top' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  option: { flexGrow: 1, flexBasis: 170, minWidth: 150, borderWidth: 1, borderColor: studentTokens.lineSoft, borderRadius: 10, padding: 10, backgroundColor: studentTokens.neutral },
  optionLabel: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 11, lineHeight: 15, fontWeight: '600' },
  optionValue: { fontFamily: studentFontFamily, color: studentTokens.navy, fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 3 },
  previewCard: { width: '100%' },
  previewFrame: { gap: 10, padding: 12, borderRadius: 14, backgroundColor: '#f4f7fb', borderWidth: 1, borderColor: studentTokens.lineSoft },
  previewBlock: { padding: 14, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: studentTokens.lineSoft, gap: 6 },
  previewMuted: { opacity: 0.55 },
  previewTop: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  previewTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  previewBody: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  previewAction: { alignSelf: 'flex-start', color: studentTokens.navy, backgroundColor: studentTokens.yellow, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontFamily: studentFontFamily, fontSize: 12, fontWeight: '700' },
  previewNote: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },
  tabRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: studentTokens.lineSoft, paddingVertical: 9 },
  tabEditor: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: studentTokens.neutral, gap: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: studentTokens.lineSoft },
  formError: { fontFamily: studentFontFamily, color: studentTokens.danger, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  tabRowMobile: { flexWrap: 'wrap', alignItems: 'flex-start' },
  tabRowCopyMobile: { flexBasis: '100%' },
  sectionRowMobile: { flexWrap: 'wrap', alignItems: 'flex-start' },
  sectionRowCopyMobile: { flexBasis: '100%' },
});
