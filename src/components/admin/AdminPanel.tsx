import { useEffect, useMemo, useState } from 'react';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Modal as NativeModal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { AdminShell } from '@/components/admin/AdminShell';
import { PageBuilderPanel } from '@/components/admin/PageBuilderPanel';
import { AdminQuestionFields } from './AdminQuestionFields';
import { adminAuditSummary, adminLabel, adminMessage } from '@/lib/admin/labels';
import { AdminContentPreview, PublicationBadge, PublicationMetadata, VersionHistory } from './AdminPublishingTools';
import { Badge, Button, Card, EmptyState, studentFontFamily, studentTokens } from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';
import {
  adminModuleCollections,
  adminModules,
  publicationStatuses,
  adminVisibilityOptions,
  collectionSupportsPremium,
  saveAdminContent,
  defaultQuestionFilters,
  archiveAdminEntity,
  getAdminDashboardMetrics,
  initialAdminDraft,
  listAdminQuestionRows,
  listAdminRows,
  loadAdminWorkspaceState,
  loadSharedAdminWorkspaceState,
  reorderAdminEntity,
  saveSharedAdminWorkspaceState,
  toggleAdminNavigationVisibility,
  getAdminDocument,
  previewAdminDraft,
  restoreAdminVersion,
  type AdminSnapshot,
  type PublicationStatus,
  validateAdminEntityDraft,
  validateAdminQuestion,
  type AdminCollectionConfig,
  type AdminEntityDraft,
  type AdminEntityRow,
  type AdminModuleConfig,
  type AdminModuleKey,
  type AdminMutableCollectionKey,
  type AdminQuestionFilters,
  type AdminWorkspaceState,
  defaultPageBuilderState,
} from '@/lib/admin';
import type { Visibility } from '@/lib/content';
import { videoMediaProviders, type VideoMediaProvider } from '@/lib/video-media';

type AdminPanelProps = {
  user: AuthUser;
  onLogout: () => void;
  isLoggingOut?: boolean;
};

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

type EditorState = {
  mode: 'create' | 'edit';
  module: AdminModuleKey;
  collection: AdminMutableCollectionKey;
  config: AdminCollectionConfig;
  row?: AdminEntityRow;
  draft: AdminEntityDraft;
};

type PublicationResultState = {
  status: Extract<PublicationStatus, 'published' | 'review'>;
  module: AdminModuleKey;
  collection: AdminMutableCollectionKey;
  config: AdminCollectionConfig;
  row: AdminEntityRow;
  notice?: string;
};

type DisableTarget = {
  module: AdminModuleKey;
  collection: AdminMutableCollectionKey;
  row: AdminEntityRow;
};

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });

const plusSymbol = symbolName('plus', 'add');
const editSymbol = symbolName('square.and.pencil', 'edit');
const disableSymbol = symbolName('nosign', 'block');
const upSymbol = symbolName('chevron.up', 'keyboard_arrow_up');
const downSymbol = symbolName('chevron.down', 'keyboard_arrow_down');
const filterSymbol = symbolName('line.3.horizontal.decrease.circle', 'filter_alt');
const warningSymbol = symbolName('exclamationmark.triangle', 'warning');
const checkSymbol = symbolName('checkmark.circle', 'check_circle');
const reviewSymbol = symbolName('paperplane', 'send');
const eyeSymbol = symbolName('eye', 'visibility');
const hiddenEyeSymbol = symbolName('eye.slash', 'visibility_off');


const initialCollectionByModule: Partial<Record<AdminModuleKey, AdminMutableCollectionKey>> = {
  navigation: 'navigationGroups',
  taxonomy: 'exams',
  courses: 'courses',
  'video-lessons': 'lessons',
  'reading-practice': 'readingPracticeScreens',
  vocabulary: 'vocabularySets',
  grammar: 'grammarCategories',
  'question-bank': 'questions',
  'practice-sets': 'practiceSets',
  'mini-tests': 'tests',
};

function makeSelectOptions<T extends string>(items: { id: T; title: string }[], allLabel: string) {
  return [{ value: 'all', label: allLabel }, ...items.map((item) => ({ value: item.id, label: item.title }))];
}

function shortDate(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 'Bekleniyor';
  return new Intl.DateTimeFormat('tr-TR', { month: 'short', day: '2-digit' }).format(new Date(parsed));
}

function statusLabel(status: string) {
  return adminLabel(status);
}

function visibilityLabel(visibility: Visibility) {
  return adminLabel(visibility);
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'yellow' | 'teal' | 'blue' | 'orange' }) {
  const color = tone === 'yellow' ? studentTokens.yellowDeep : tone === 'teal' ? studentTokens.teal : tone === 'orange' ? studentTokens.orange : studentTokens.blue;
  return (
    <Card style={styles.metricCard} contentStyle={styles.metricBody}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}18` }]} />
      <View style={styles.metricCopy}>
        <Text style={styles.metricLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
        <Text style={[styles.metricDetail, { color }]} numberOfLines={1}>{detail}</Text>
      </View>
    </Card>
  );
}

function DashboardView({ state, onQuickAction }: { state: AdminWorkspaceState; onQuickAction: (module: AdminModuleKey) => void }) {
  const metrics = useMemo(() => getAdminDashboardMetrics(state), [state]);
  const quickModules = adminModules.filter((module) => module.key !== 'dashboard').slice(0, 6);

  return (
    <View style={styles.stack}>
      <View style={styles.pageHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>YÖNETİM PANELİ</Text>
          <Text style={styles.pageTitle}>İçerik Yönetimi</Text>
          <Text style={styles.pageText}>Taslakları inceleyin, içerikleri yayınlayın ve son değişiklikleri takip edin.</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <MetricCard label="Yayınlanan İçerikler" value={String(metrics.publishedContent)} detail="Yayındaki sürümler" tone="teal" />
        <MetricCard label="Taslaklar" value={String(metrics.drafts)} detail="İnceleme bekleyen" tone="blue" />
        <MetricCard label="Devre Dışı" value={String(metrics.disabledContent)} detail="Pasif veya arşivlenmiş" tone="orange" />
        <MetricCard label="Aktif Kullanıcılar" value={metrics.activeUsers === null ? 'API' : String(metrics.activeUsers)} detail="Sunucu bağlantısı bekleniyor" tone="yellow" />
      </View>

      <View style={styles.dashboardGrid}>
        <Card testID="admin-quick-actions" title="Hızlı İşlemler" eyebrow="Oluştur veya incele" style={styles.dashboardPanel}>
          <View style={styles.quickGrid}>
            {quickModules.map((module) => (
              <Pressable key={module.key} accessibilityRole="button" onPress={() => onQuickAction(module.key)} style={({ pressed }) => [styles.quickCard, pressed ? styles.pressed : null]}>
                <Text style={styles.quickTitle}>{module.title}</Text>
                <Text style={styles.quickText}>{module.description}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card testID="admin-recent-changes" title="Son İçerik Değişiklikleri" eyebrow="İşlem geçmişi" style={styles.dashboardPanel}>
          <View style={styles.changeList}>
            {(state.workflow?.audit.length ?? 0) > 0 ? state.workflow!.audit.slice(0, 6).map((change) => (
              <View key={change.id} style={styles.changeRow}>
                <View style={styles.changeDot} />
                <View style={styles.changeCopy}>
                  <Text style={styles.changeTitle}>{adminAuditSummary(state, change)}</Text>
                  <Text style={styles.changeText}>{change.user?.email ?? 'Kullanıcı kaydedilmemiş'} / {adminLabel(change.entityType)}</Text>
                  <Text style={styles.changeText}>{change.entityId}</Text>
                </View>
                <Text style={styles.changeDate}>{new Date(change.timestamp).toLocaleString('tr-TR')}</Text>
              </View>
            )) : <Text style={styles.mutedText}>Henüz değişiklik yok.</Text>}
          </View>
        </Card>
      </View>

      <Card title="Katalog Kontrolü" eyebrow="İlişkiler">
        {metrics.validationIssues.length === 0 ? (
          <View style={styles.validationOk}>
            <SymbolView name={checkSymbol} tintColor={studentTokens.teal} size={22} style={styles.inlineIcon} />
            <Text style={styles.bodyText}>İlişkiler, bağlantı adları, durumlar, sıralama ve erişim ayarları geçerli.</Text>
          </View>
        ) : (
          <View style={styles.validationList}>
            {metrics.validationIssues.slice(0, 5).map((issue, index) => (
              <View key={`${issue.code}-${issue.entityId ?? index}`} style={styles.validationIssue}>
                <SymbolView name={warningSymbol} tintColor={studentTokens.orange} size={17} style={styles.inlineIcon} />
                <Text style={styles.bodyText}>{adminLabel(issue.collection ?? '')}: {adminMessage(issue.message)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </View>
  );
}

function CollectionTabs({ collections, value, onChange }: { collections: AdminCollectionConfig[]; value: AdminMutableCollectionKey; onChange: (value: AdminMutableCollectionKey) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionTabs}>
      {collections.map((item) => {
        const selected = item.key === value;
        return (
          <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(item.key)} style={({ pressed }) => [styles.collectionTab, selected ? styles.collectionTabActive : null, pressed ? styles.pressed : null]}>
            <Text style={[styles.collectionTabText, selected ? styles.collectionTabTextActive : null]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function CycleFilter<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  const currentIndex = Math.max(0, options.findIndex((item) => item.value === value));
  const current = options[currentIndex] ?? options[0];
  const next = () => onChange(options[(currentIndex + 1) % options.length].value);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${current.label}`} onPress={next} style={({ pressed }) => [styles.filterButton, pressed ? styles.pressed : null]}>
      <Text style={styles.filterLabel}>{label}</Text>
      <Text style={styles.filterValue} numberOfLines={1}>{current.label}</Text>
    </Pressable>
  );
}

function QuestionFilters({ state, value, onChange }: { state: AdminWorkspaceState; value: AdminQuestionFilters; onChange: (value: AdminQuestionFilters) => void }) {
  const statusOptions = [{ value: 'all', label: 'Tüm Durumlar' }, ...publicationStatuses.map((status) => ({ value: status, label: statusLabel(status) }))] as { value: AdminQuestionFilters['status']; label: string }[];

  return (
    <Card style={styles.filterCard} contentStyle={styles.filterCardBody}>
      <View style={styles.filterHeader}>
        <SymbolView name={filterSymbol} tintColor={studentTokens.teal} size={18} style={styles.inlineIcon} />
        <Text style={styles.filterTitle}>Soru filtreleri</Text>
      </View>
      <View style={styles.filterGrid}>
        <CycleFilter label="Beceri" value={value.skillId} options={makeSelectOptions(state.catalog.skills, 'Tüm Beceriler')} onChange={(skillId) => onChange({ ...value, skillId })} />
        <CycleFilter label="Soru Türü" value={value.taskTypeId} options={makeSelectOptions(state.catalog.taskTypes, 'Tüm Soru Türleri')} onChange={(taskTypeId) => onChange({ ...value, taskTypeId })} />
        <CycleFilter label="Alt Beceri" value={value.subskillId} options={makeSelectOptions(state.catalog.subskills, 'Tüm Alt Beceriler')} onChange={(subskillId) => onChange({ ...value, subskillId })} />
        <CycleFilter label="Konu" value={value.topicId} options={makeSelectOptions(state.catalog.topics, 'Tüm Konular')} onChange={(topicId) => onChange({ ...value, topicId })} />
        <CycleFilter label="Zorluk" value={value.levelId} options={makeSelectOptions(state.catalog.levels, 'Tüm Seviyeler')} onChange={(levelId) => onChange({ ...value, levelId })} />
        <CycleFilter label="Durum" value={value.status} options={statusOptions} onChange={(status) => onChange({ ...value, status })} />
      </View>
    </Card>
  );
}
function RowActions({ row, onEdit, onDisable, onMoveUp, onMoveDown, onToggle, isNavigation }: { row: AdminEntityRow; onEdit: () => void; onDisable: () => void; onMoveUp: () => void; onMoveDown: () => void; onToggle?: () => void; isNavigation?: boolean }) {
  const disabled = row.status === 'inactive' || row.status === 'archived';
  const navigationEnabled = 'isEnabled' in row.raw ? row.raw.isEnabled : true;
  return (
    <View style={styles.rowActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Düzenle: ${row.title}`} onPress={onEdit} style={({ pressed }) => [styles.actionIcon, pressed ? styles.pressed : null]}>
        <SymbolView name={editSymbol} tintColor={studentTokens.navy} size={15} style={styles.actionSymbol} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Yukarı taşı: ${row.title}`} onPress={onMoveUp} style={({ pressed }) => [styles.actionIcon, pressed ? styles.pressed : null]}>
        <SymbolView name={upSymbol} tintColor={studentTokens.text} size={15} style={styles.actionSymbol} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Aşağı taşı: ${row.title}`} onPress={onMoveDown} style={({ pressed }) => [styles.actionIcon, pressed ? styles.pressed : null]}>
        <SymbolView name={downSymbol} tintColor={studentTokens.text} size={15} style={styles.actionSymbol} />
      </Pressable>
      <Pressable disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} accessibilityLabel={`Arşivle: ${row.title}`} onPress={onDisable} style={({ pressed }) => [styles.actionIcon, disabled ? styles.actionDisabled : null, pressed ? styles.pressed : null]}>
        <SymbolView name={disableSymbol} tintColor={disabled ? studentTokens.muted : studentTokens.danger} size={15} style={styles.actionSymbol} />
      </Pressable>
      {isNavigation && onToggle ? <Pressable accessibilityRole="button" accessibilityLabel={`${navigationEnabled ? 'Gizle' : 'Göster'}: ${row.title}`} onPress={onToggle} style={({ pressed }) => [styles.actionIcon, pressed ? styles.pressed : null]}><SymbolView name={navigationEnabled ? eyeSymbol : hiddenEyeSymbol} tintColor={studentTokens.navy} size={15} style={styles.actionSymbol} /></Pressable> : null}
    </View>
  );
}

function AdminTable({ rows, isMobile, isNavigation, onEdit, onDisable, onToggle, onMove }: { rows: AdminEntityRow[]; isMobile: boolean; isNavigation?: boolean; onEdit: (row: AdminEntityRow) => void; onDisable: (row: AdminEntityRow) => void; onToggle?: (row: AdminEntityRow) => void; onMove: (row: AdminEntityRow, direction: 'up' | 'down') => void }) {
  if (rows.length === 0) {
    return <EmptyState title="Kayıt bulunamadı" text="Filtreleri değiştirin veya bu bölüme ilk kaydı ekleyin." />;
  }

  if (isMobile) {
    return (
      <View style={styles.mobileList}>
        {rows.map((row) => (
          <Card key={row.id} style={styles.mobileRecordCard} contentStyle={styles.mobileRecordBody}>
            <View style={styles.mobileRecordTop}>
              <View style={styles.recordTitleWrap}>
                <Text style={styles.recordTitle}>{row.title}</Text>
                <Text style={styles.recordSlug}>{row.slug}</Text>
              </View>
              <PublicationBadge status={row.publicationStatus} version={row.version} />
            </View>
            <Text style={styles.recordDescription}>{row.description || row.relationSummary}</Text>
            <View style={styles.recordMetaGrid}>
              <Text style={styles.recordMeta}>Görünürlük: {visibilityLabel(row.visibility)}</Text>
              <Text style={styles.recordMeta}>Erişim: {row.isPremium ? 'Premium' : 'Ücretsiz'}</Text>
              <Text style={styles.recordMeta}>İlişkiler: {row.referenceCount}</Text>
              <Text style={styles.recordMeta}>Sıra: {row.sortOrder}</Text>
            </View>
            <RowActions row={row} isNavigation={isNavigation} onToggle={() => onToggle?.(row)} onEdit={() => onEdit(row)} onDisable={() => onDisable(row)} onMoveUp={() => onMove(row, 'up')} onMoveDown={() => onMove(row, 'down')} />
          </Card>
        ))}
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableScrollContent}>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHead]}>
          <Text style={[styles.tableHeadText, styles.colTitle]}>Başlık</Text>
          <Text style={[styles.tableHeadText, styles.colStatus]}>Durum</Text>
          <Text style={[styles.tableHeadText, styles.colRelation]}>Sınıflandırma / ilişki</Text>
          <Text style={[styles.tableHeadText, styles.colSmall]}>Erişim</Text>
          <Text style={[styles.tableHeadText, styles.colSmall]}>Sıra</Text>
          <Text style={[styles.tableHeadText, styles.colDate]}>Güncelleme</Text>
          <Text style={[styles.tableHeadText, styles.colActions]}>İşlemler</Text>
        </View>
        {rows.map((row) => (
          <View key={row.id} style={styles.tableRow}>
            <View style={styles.colTitle}>
              <Text style={styles.recordTitle} numberOfLines={1}>{row.title}</Text>
              <Text style={styles.recordSlug} numberOfLines={1}>{row.slug}</Text>
            </View>
            <View style={styles.colStatus}><PublicationBadge status={row.publicationStatus} version={row.version} /></View>
            <Text style={[styles.recordDescription, styles.colRelation]} numberOfLines={2}>{row.relationSummary}</Text>
            <Text style={[styles.recordMeta, styles.colSmall]}>{row.isPremium ? 'Premium' : 'Ücretsiz'}</Text>
            <Text style={[styles.recordMeta, styles.colSmall]}>{row.sortOrder}</Text>
            <Text style={[styles.recordMeta, styles.colDate]}>{shortDate(row.updatedAt)}</Text>
            <View style={styles.colActions}><RowActions row={row} isNavigation={isNavigation} onToggle={() => onToggle?.(row)} onEdit={() => onEdit(row)} onDisable={() => onDisable(row)} onMoveUp={() => onMove(row, 'up')} onMoveDown={() => onMove(row, 'down')} /></View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function QuestionValidationPanel({ state, rows }: { state: AdminWorkspaceState; rows: AdminEntityRow[] }) {
  const issues = rows.flatMap((row) => validateAdminQuestion(state, row.id).map((issue) => ({ row, issue })));
  if (issues.length === 0) {
    return null;
  }

  return (
    <Card title="Soru Kontrolü" eyebrow="İnceleme gerekiyor" style={styles.validationCard}>
      <View style={styles.validationList}>
        {issues.slice(0, 4).map(({ row, issue }) => (
          <View key={`${row.id}-${issue}`} style={styles.validationIssue}>
            <SymbolView name={warningSymbol} tintColor={studentTokens.orange} size={17} style={styles.inlineIcon} />
            <Text style={styles.bodyText}>{row.title}: {adminMessage(issue)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function ModuleManager({ module, state, collection, onCollectionChange, query, onQueryChange, questionFilters, onQuestionFiltersChange, isMobile, onCreate, onEdit, onDisable, onToggle, onMove }: { module: AdminModuleConfig; state: AdminWorkspaceState; collection: AdminMutableCollectionKey; onCollectionChange: (collection: AdminMutableCollectionKey) => void; query: string; onQueryChange: (query: string) => void; questionFilters: AdminQuestionFilters; onQuestionFiltersChange: (filters: AdminQuestionFilters) => void; isMobile: boolean; onCreate: (config: AdminCollectionConfig) => void; onEdit: (row: AdminEntityRow, config: AdminCollectionConfig) => void; onDisable: (row: AdminEntityRow, config: AdminCollectionConfig) => void; onToggle: (row: AdminEntityRow, config: AdminCollectionConfig) => void; onMove: (row: AdminEntityRow, config: AdminCollectionConfig, direction: 'up' | 'down') => void }) {
  const collections = adminModuleCollections[module.key as Exclude<AdminModuleKey, 'dashboard'>] ?? [];
  const activeConfig = collections.find((item) => item.key === collection) ?? collections[0];
  const rows = useMemo(() => {
    const baseRows = module.key === 'question-bank' ? listAdminQuestionRows(state, questionFilters) : listAdminRows(state, activeConfig.key, activeConfig);
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return baseRows;
    return baseRows.filter((row) => `${row.title} ${row.slug} ${row.description} ${row.relationSummary}`.toLowerCase().includes(normalizedQuery));
  }, [activeConfig, module.key, query, questionFilters, state]);

  return (
    <View style={styles.stack}>
      <View style={styles.pageHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>YÖNETİM BÖLÜMÜ</Text>
          <Text style={styles.pageTitle}>{module.title}</Text>
          <Text style={styles.pageText}>{module.description}</Text>
        </View>
        <Button label={`${activeConfig.singularLabel} Oluştur`} left={<SymbolView name={plusSymbol} tintColor={studentTokens.navy} size={16} style={styles.inlineIcon} />} onPress={() => onCreate(activeConfig)} style={styles.createButton} />
      </View>

      {collections.length > 1 ? <CollectionTabs collections={collections} value={activeConfig.key} onChange={onCollectionChange} /> : null}

      {module.key === 'question-bank' ? <QuestionFilters state={state} value={questionFilters} onChange={onQuestionFiltersChange} /> : null}

      <Card style={styles.managerCard} contentStyle={styles.managerBody}>
        <View style={styles.managerToolbar}>
          <View style={styles.searchBox}>
            <TextInput accessibilityLabel="Yönetim kayıtlarında ara" value={query} onChangeText={onQueryChange} placeholder="Kayıtlarda ara..." placeholderTextColor={studentTokens.muted} style={styles.searchInput} />
          </View>
          <View style={styles.toolbarMeta}>
            <Badge label={`${rows.length} kayıt`} tone="blue" />
            <Badge label={activeConfig.label} tone="default" />
          </View>
        </View>
        <Text style={styles.collectionDescription}>{activeConfig.description}</Text>
      <AdminTable rows={rows} isMobile={isMobile} isNavigation={module.key === 'navigation'} onEdit={(row) => onEdit(row, activeConfig)} onDisable={(row) => onDisable(row, activeConfig)} onToggle={(row) => onToggle(row, activeConfig)} onMove={(row, direction) => onMove(row, activeConfig, direction)} />
      </Card>

      {module.key === 'question-bank' ? <QuestionValidationPanel state={state} rows={rows} /> : null}
    </View>
  );
}
function OptionSelector<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T; onChange: (value: T) => void }) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => onChange(option)} style={({ pressed }) => [styles.optionPill, selected ? styles.optionPillActive : null, pressed ? styles.pressed : null]}>
              <Text style={[styles.optionText, selected ? styles.optionTextActive : null]}>{adminLabel(option)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function VideoProviderSelector({ value, onChange }: { value: VideoMediaProvider; onChange: (value: VideoMediaProvider) => void }) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>Video sağlayıcısı</Text>
      <View style={styles.optionWrap}>
        {videoMediaProviders.map((provider) => {
          const selected = provider.value === value;
          return (
            <Pressable key={provider.value} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => onChange(provider.value)} style={({ pressed }) => [styles.optionPill, selected ? styles.optionPillActive : null, pressed ? styles.pressed : null]}>
              <Text style={[styles.optionText, selected ? styles.optionTextActive : null]}>{provider.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function nextLessonSortOrder(state: AdminWorkspaceState, courseId?: string) {
  return state.catalog.lessons
    .filter((lesson) => !courseId || lesson.courseId === courseId)
    .reduce((max, lesson) => Math.max(max, lesson.sortOrder), 0) + 10;
}

function CatalogSelector({ label, options, value, onChange }: { label: string; options: { id: string; title: string }[]; value?: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => onChange(option.id)} style={({ pressed }) => [styles.optionPill, selected ? styles.optionPillActive : null, pressed ? styles.pressed : null]}>
              <Text style={[styles.optionText, selected ? styles.optionTextActive : null]} numberOfLines={1}>{option.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AdminEntityEditor({ editor, issues, isMobile, onChange, onClose, onSave, onPublish, onReview, onRestore, state, user, message, error }: { editor: EditorState; issues: string[]; isMobile: boolean; onChange: (draft: AdminEntityDraft) => void; onClose: () => void; onSave: () => void; onPublish: () => void; onReview: () => void; onRestore: (version: number) => void; state: AdminWorkspaceState; user: AuthUser; message: string; error: string }) {
  const [tab, setTab] = useState<'edit' | 'preview' | 'history'>('edit');
  const [historicalPreview, setHistoricalPreview] = useState<AdminSnapshot | null>(null);
  const [confirmation, setConfirmation] = useState<'publish' | number | null>(null);
  if (!editor) return null;

  const draft = editor.draft;
  const supportsPremium = collectionSupportsPremium(editor.collection);
  const setField = <TKey extends keyof AdminEntityDraft>(key: TKey, value: AdminEntityDraft[TKey]) => onChange({ ...draft, [key]: value });
  const document = editor.row ? getAdminDocument(state, editor.collection, editor.row.id) : undefined;
  const preview = historicalPreview ?? previewAdminDraft(state, editor.collection, draft, editor.row?.id);

  return (
    <NativeModal transparent visible animationType={isMobile ? 'slide' : 'fade'} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, isMobile ? styles.modalOverlayMobile : null]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Düzenleyiciyi kapat" onPress={onClose} style={styles.modalBackdrop} />
        <View testID="admin-content-editor" style={[styles.editorCard, isMobile ? styles.editorCardMobile : null]}>
          <View style={styles.editorHead}>
            <View style={styles.editorTitleGroup}>
              <Text style={styles.kicker}>{editor.mode === 'create' ? 'OLUŞTUR' : 'DÜZENLE'}</Text>
              <Text style={styles.editorTitle}>{editor.config.singularLabel}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Düzenleyiciyi kapat" onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}>
              <Text style={styles.closeText}>x</Text>
            </Pressable>
          </View>

          <View style={styles.editorTabs}>
            {(['edit', 'preview', 'history'] as const).map((value) => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }} onPress={() => { setTab(value); setHistoricalPreview(null); setConfirmation(null); }} style={[styles.editorTab, tab === value ? styles.collectionTabActive : null]}><Text style={[styles.collectionTabText, tab === value ? styles.collectionTabTextActive : null]}>{value === 'history' ? 'Sürümler' : value === 'preview' ? 'Önizleme' : 'Düzenle'}</Text></Pressable>)}
          </View>

          <ScrollView style={styles.editorScroll} contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled">
            {error ? <Text accessibilityRole="alert" style={styles.formIssueText}>{error}</Text> : null}
            {message ? <Text accessibilityLiveRegion="polite" style={styles.bodyText}>{message}</Text> : null}
            {confirmation !== null ? <View style={styles.stack}>
              <Text style={styles.editorTitle}>{confirmation === 'publish' ? 'Bu sürüm yayınlansın mı?' : `Sürüm ${confirmation} geri yüklensin mi?`}</Text>
              <Text style={styles.bodyText}>{confirmation === 'publish' ? 'Kontroller tamamlandıktan sonra mevcut değişiklikler yayınlanan sürümün yerini alacak.' : 'Bu sürümden yeni bir taslak oluşturulacak. Formdaki kaydedilmemiş değişiklikler değiştirilecek. Yayınlanan sürüm ve tüm geçmiş korunacak.'}</Text>
            </View> : tab === 'preview' ? <>
              {historicalPreview ? <Text style={styles.kicker}>SÜRÜM {historicalPreview.version}</Text> : <Text style={styles.kicker}>GÜNCEL DEĞİŞİKLİKLER</Text>}
              <AdminContentPreview snapshot={preview} collection={editor.collection} state={state} user={user} />
            </> : tab === 'history' ? <VersionHistory document={document} onPreview={(snapshot) => { setHistoricalPreview(snapshot); setTab('preview'); }} onRestore={setConfirmation} /> : <>
            <PublicationMetadata document={document} />
            <View style={[styles.formGrid, isMobile ? styles.formGridMobile : null]}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Başlık</Text>
                <TextInput accessibilityLabel="Başlık" value={draft.title} onChangeText={(value) => setField('title', value)} placeholder="Kayıt başlığı" placeholderTextColor={studentTokens.muted} style={styles.formInput} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bağlantı adı</Text>
                <TextInput accessibilityLabel="Bağlantı adı" value={draft.slug} onChangeText={(value) => setField('slug', value)} placeholder="Başlıktan otomatik oluşturulur" placeholderTextColor={studentTokens.muted} autoCapitalize="none" style={styles.formInput} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{editor.collection === 'questions' ? 'Soru metni' : 'Açıklama'}</Text>
              <TextInput accessibilityLabel={editor.collection === 'questions' ? 'Soru metni' : 'Açıklama'} value={editor.collection === 'questions' ? draft.prompt : draft.description} onChangeText={(value) => setField(editor.collection === 'questions' ? 'prompt' : 'description', value)} placeholder="Kısa açıklama" placeholderTextColor={studentTokens.muted} multiline style={[styles.formInput, styles.textArea]} />
            </View>

            {editor.collection === 'lessons' ? (
              <View style={styles.videoSourceSection}>
                <View>
                  <Text style={styles.formLabel}>Video kaynağı</Text>
                  <Text style={styles.formHelper}>Şimdilik YouTube veya Vimeo bağlantısı kullanılır. Bilgisayardan dosya yükleme, Storage/domain taşıma aşamasında yeniden açılacak.</Text>
                </View>
                <VideoProviderSelector value={draft.mediaProvider ?? 'youtube'} onChange={(mediaProvider) => setField('mediaProvider', mediaProvider)} />
                <View style={[styles.formGrid, isMobile ? styles.formGridMobile : null]}>
                  <CatalogSelector label="Kurs" options={state.catalog.courses} value={draft.courseId} onChange={(courseId) => {
                    const nextModule = state.catalog.modules.find((module) => module.courseId === courseId);
                    onChange({ ...draft, courseId, moduleId: nextModule?.id ?? draft.moduleId, sortOrder: nextLessonSortOrder(state, courseId) });
                  }} />
                  <CatalogSelector label="Modül" options={state.catalog.modules.filter((module) => !draft.courseId || module.courseId === draft.courseId)} value={draft.moduleId} onChange={(moduleId) => setField('moduleId', moduleId)} />
                </View>
                <View style={[styles.formGrid, isMobile ? styles.formGridMobile : null]}>
                  {draft.mediaProvider === 'upload' ? (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Video dosyası</Text>
                      <Text style={styles.formHelper}>Bu kayıt eski bir dosya yükleme kaydı. Şimdilik canlı kurulumda dosya yükleme kapalı; YouTube veya Vimeo seçip bağlantı girin.</Text>
                    </View>
                  ) : (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Video bağlantısı</Text>
                      <TextInput accessibilityLabel="Video bağlantısı" value={draft.mediaUrl ?? ''} onChangeText={(value) => setField('mediaUrl', value)} placeholder="https://www.youtube.com/watch?v=..." placeholderTextColor={studentTokens.muted} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.formInput} />
                    </View>
                  )}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Süre (saniye)</Text>
                    <TextInput accessibilityLabel="Video süresi" value={String(draft.durationSeconds ?? 900)} onChangeText={(value) => { const seconds = Number(value.replace(/[^0-9]/g, '')); onChange({ ...draft, durationSeconds: seconds, estimatedMinutes: Math.ceil(seconds / 60) }); }} keyboardType="number-pad" style={styles.formInput} />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Önizleme süresi (saniye)</Text>
                    <TextInput accessibilityLabel="Önizleme süresi" value={String(draft.previewDurationSeconds ?? 0)} onChangeText={(value) => setField('previewDurationSeconds', Number(value.replace(/[^0-9]/g, '')) || 0)} keyboardType="number-pad" style={styles.formInput} />
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Thumbnail bağlantısı</Text>
                  <TextInput accessibilityLabel="Thumbnail bağlantısı" value={draft.thumbnailUrl ?? ''} onChangeText={(value) => setField('thumbnailUrl', value)} placeholder="https://.../thumbnail.jpg" placeholderTextColor={studentTokens.muted} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.formInput} />
                  <Text style={styles.formHelper}>Thumbnail için şimdilik HTTPS görsel bağlantısı kullanılır.</Text>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Bölümler</Text>
                  <TextInput accessibilityLabel="Bölümler" value={draft.chaptersText ?? ''} onChangeText={(value) => setField('chaptersText', value)} placeholder={'00:00|Giriş\n04:30|Ana strateji'} placeholderTextColor={studentTokens.muted} multiline style={[styles.formInput, styles.textArea]} />
                  <Text style={styles.formHelper}>Her satır: zaman|başlık. Zaman biçimi mm:ss veya hh:mm:ss.</Text>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Kaynaklar</Text>
                  <TextInput accessibilityLabel="Kaynaklar" value={draft.resourcesText ?? ''} onChangeText={(value) => setField('resourcesText', value)} placeholder={'Note Taking Strategies|PDF|1.2 MB|https://example.com/file.pdf\nLecture Worksheet|Worksheet|premium'} placeholderTextColor={studentTokens.muted} multiline style={[styles.formInput, styles.textArea]} />
                  <Text style={styles.formHelper}>Her satır: başlık|tür|boyut|url|premium. Tür: PDF, Checklist, Worksheet veya Template. Boyut, URL ve premium isteğe bağlıdır.</Text>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Altyazı / transkript</Text>
                  <TextInput accessibilityLabel="Altyazı / transkript" value={draft.transcriptText ?? ''} onChangeText={(value) => setField('transcriptText', value)} placeholder={'00:00|Dersin giriş cümlesi\n00:18|İlk önemli nokta'} placeholderTextColor={studentTokens.muted} multiline style={[styles.formInput, styles.textArea]} />
                  <Text style={styles.formHelper}>Her satır: zaman|metin. Satırlar öğrenci VideoPlayer içindeki Transcript sekmesine taşınır.</Text>
                </View>
              </View>
            ) : null}


            {editor.collection === 'readingPracticeScreens' ? (
              <View style={styles.videoSourceSection}>
                <View>
                  <Text style={styles.formLabel}>Reading Practice içeriği</Text>
                  <Text style={styles.formHelper}>Bu ekran soru bankası veya alıştırma setlerine bağlı değildir. Passage, soru akışı ve destek kutuları ayrı yayınlanır.</Text>
                </View>
                <View style={[styles.formGrid, isMobile ? styles.formGridMobile : null]}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Alt başlık</Text>
                    <TextInput accessibilityLabel="Alt başlık" value={draft.subtitle ?? ''} onChangeText={(value) => setField('subtitle', value)} placeholder="Main Idea · Practice Set 3 · TOEFL iBT Reading" placeholderTextColor={studentTokens.muted} style={styles.formInput} />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Soru türü</Text>
                    <TextInput accessibilityLabel="Soru türü" value={draft.questionType ?? ''} onChangeText={(value) => setField('questionType', value)} placeholder="Main Idea" placeholderTextColor={studentTokens.muted} style={styles.formInput} />
                  </View>
                </View>
                <View style={[styles.formGrid, isMobile ? styles.formGridMobile : null]}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Süre sınırı (saniye)</Text>
                    <TextInput accessibilityLabel="Süre sınırı" value={String(draft.timeLimitSeconds ?? 0)} onChangeText={(value) => setField('timeLimitSeconds', Number(value.replace(/[^0-9]/g, '')) || 0)} keyboardType="number-pad" style={styles.formInput} />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Kalan süre (saniye)</Text>
                    <TextInput accessibilityLabel="Kalan süre" value={String(draft.timeRemainingSeconds ?? 0)} onChangeText={(value) => setField('timeRemainingSeconds', Number(value.replace(/[^0-9]/g, '')) || 0)} keyboardType="number-pad" style={styles.formInput} />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Aktif soru numarası</Text>
                    <TextInput accessibilityLabel="Aktif soru numarası" value={String((draft.currentQuestionIndex ?? 0) + 1)} onChangeText={(value) => setField('currentQuestionIndex', Math.max(0, (Number(value.replace(/[^0-9]/g, '')) || 1) - 1))} keyboardType="number-pad" style={styles.formInput} />
                  </View>
                </View>
                <View style={[styles.formGrid, isMobile ? styles.formGridMobile : null]}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Cevaplanan soru sayısı</Text>
                    <TextInput accessibilityLabel="Cevaplanan soru sayısı" value={String(draft.answeredCount ?? 0)} onChangeText={(value) => setField('answeredCount', Number(value.replace(/[^0-9]/g, '')) || 0)} keyboardType="number-pad" style={styles.formInput} />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>İşaretli soru sayısı</Text>
                    <TextInput accessibilityLabel="İşaretli soru sayısı" value={String(draft.markedCount ?? 0)} onChangeText={(value) => setField('markedCount', Number(value.replace(/[^0-9]/g, '')) || 0)} keyboardType="number-pad" style={styles.formInput} />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Kelime sayısı</Text>
                    <TextInput accessibilityLabel="Kelime sayısı" value={String(draft.wordCount ?? 0)} onChangeText={(value) => setField('wordCount', Number(value.replace(/[^0-9]/g, '')) || 0)} keyboardType="number-pad" style={styles.formInput} />
                  </View>
                </View>
                <View style={[styles.formGrid, isMobile ? styles.formGridMobile : null]}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Passage başlığı</Text>
                    <TextInput accessibilityLabel="Passage başlığı" value={draft.passageTitle ?? ''} onChangeText={(value) => setField('passageTitle', value)} placeholder="The Science of Sleep: Why Rest Matters" placeholderTextColor={studentTokens.muted} style={styles.formInput} />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Kaynak etiketi</Text>
                    <TextInput accessibilityLabel="Kaynak etiketi" value={draft.sourceLabel ?? ''} onChangeText={(value) => setField('sourceLabel', value)} placeholder="Adapted from ..." placeholderTextColor={studentTokens.muted} style={styles.formInput} />
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Passage metni</Text>
                  <TextInput accessibilityLabel="Passage metni" value={draft.passageText ?? ''} onChangeText={(value) => setField('passageText', value)} placeholder="Paragrafları boş satırla ayırın." placeholderTextColor={studentTokens.muted} multiline style={[styles.formInput, styles.textArea]} />
                  <Text style={styles.formHelper}>Paragraflar öğrenci ekranındaki sol okuma kartında gösterilir.</Text>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Sorular ve seçenekler</Text>
                  <TextInput accessibilityLabel="Reading soruları" value={draft.readingQuestionsText ?? ''} onChangeText={(value) => setField('readingQuestionsText', value)} placeholder={'Soru metni\nA|Seçenek A\nB*|Doğru seçenek\nC|Seçenek C\n---\nİkinci soru metni'} placeholderTextColor={studentTokens.muted} multiline style={[styles.formInput, styles.textArea]} />
                  <Text style={styles.formHelper}>Her soru bloğunu --- ile ayırın. Doğru seçeneği yıldızla işaretleyin: B*|metin.</Text>
                </View>
                <View style={[styles.formGrid, isMobile ? styles.formGridMobile : null]}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Odak başlığı</Text>
                    <TextInput accessibilityLabel="Odak başlığı" value={draft.supportFocusTitle ?? ''} onChangeText={(value) => setField('supportFocusTitle', value)} placeholder="READING FOCUS" placeholderTextColor={studentTokens.muted} style={styles.formInput} />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Odak ilerlemesi</Text>
                    <TextInput accessibilityLabel="Odak ilerlemesi" value={String(draft.supportProgress ?? 0)} onChangeText={(value) => setField('supportProgress', Number(value.replace(/[^0-9]/g, '')) || 0)} keyboardType="number-pad" style={styles.formInput} />
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Odak metni</Text>
                  <TextInput accessibilityLabel="Odak metni" value={draft.supportFocusText ?? ''} onChangeText={(value) => setField('supportFocusText', value)} placeholder="Main idea questions reward structure..." placeholderTextColor={studentTokens.muted} multiline style={[styles.formInput, styles.textArea]} />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Odak ipucu</Text>
                  <TextInput accessibilityLabel="Odak ipucu" value={draft.supportHint ?? ''} onChangeText={(value) => setField('supportHint', value)} placeholder="Practice Accuracy /100: 72 ..." placeholderTextColor={studentTokens.muted} style={styles.formInput} />
                </View>
                <View style={[styles.formGrid, isMobile ? styles.formGridMobile : null]}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Tekrar başlığı</Text>
                    <TextInput accessibilityLabel="Tekrar başlığı" value={draft.reviewTitle ?? ''} onChangeText={(value) => setField('reviewTitle', value)} placeholder="NEXT REVIEW" placeholderTextColor={studentTokens.muted} style={styles.formInput} />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Tekrar ipuçları</Text>
                    <TextInput accessibilityLabel="Tekrar ipuçları" value={draft.reviewTipsText ?? ''} onChangeText={(value) => setField('reviewTipsText', value)} placeholder={'Her satıra bir ipucu yazın.'} placeholderTextColor={studentTokens.muted} multiline style={[styles.formInput, styles.textArea]} />
                  </View>
                </View>
              </View>
            ) : null}

            {editor.collection === 'questions' ? (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Cevap açıklaması</Text>
                <TextInput accessibilityLabel="Cevap açıklaması" value={draft.explanation} onChangeText={(value) => setField('explanation', value)} placeholder="Cevabın açıklaması" placeholderTextColor={studentTokens.muted} multiline style={[styles.formInput, styles.textArea]} />
                {draft.question ? <AdminQuestionFields catalog={state.catalog} value={draft.question} onChange={(question) => setField('question', question)} /> : null}
              </View>
            ) : null}

            <View style={[styles.formGrid, isMobile ? styles.formGridMobile : null]}>
              <OptionSelector label="Görünürlük" options={adminVisibilityOptions} value={draft.visibility} onChange={(visibility) => setField('visibility', visibility)} />
            </View>

            <View style={[styles.formGrid, isMobile ? styles.formGridMobile : null]}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Sıralama</Text>
                <TextInput value={String(draft.sortOrder)} onChangeText={(value) => setField('sortOrder', Number(value.replace(/[^0-9]/g, '')) || 0)} keyboardType="number-pad" style={styles.formInput} />
              </View>
              {supportsPremium ? (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Erişim</Text>
                  <Pressable accessibilityRole="switch" accessibilityState={{ checked: draft.isPremium }} onPress={() => setField('isPremium', !draft.isPremium)} style={({ pressed }) => [styles.switchRow, draft.isPremium ? styles.switchRowActive : null, pressed ? styles.pressed : null]}>
                    <View style={[styles.switchDot, draft.isPremium ? styles.switchDotActive : null]} />
                    <Text style={styles.switchText}>{draft.isPremium ? 'Premium içerik' : 'Ücretsiz içerik'}</Text>
                  </Pressable>
                </View>
              ) : <View />}
            </View>

            {issues.length > 0 ? (
              <View style={styles.formIssues}>
                {issues.map((issue) => <Text key={issue} style={styles.formIssueText}>{adminMessage(issue)}</Text>)}
              </View>
            ) : null}
            <Button label="İncelemeye Gönder" variant="secondary" onPress={onReview} disabled={issues.length > 0} />
            </>}
          </ScrollView>

          <View style={[styles.editorActions, isMobile ? styles.editorActionsMobile : null]}>
            {confirmation !== null ? <>
              <Button label="Vazgeç" variant="secondary" onPress={() => setConfirmation(null)} style={styles.editorActionButton} />
              <Button label={confirmation === 'publish' ? 'Yayınlamayı Onayla' : 'Taslak Olarak Geri Yükle'} onPress={() => { if (confirmation === 'publish') onPublish(); else onRestore(confirmation); setConfirmation(null); }} style={styles.editorActionButton} />
            </> : <>
              <Button label="Taslağı Kaydet" variant="secondary" onPress={onSave} disabled={issues.length > 0} style={styles.editorActionButton} />
              <Button label="Önizleme" variant="secondary" onPress={() => { setHistoricalPreview(null); setTab('preview'); }} style={styles.editorActionButton} />
              <Button label="Yayınla" onPress={() => setConfirmation('publish')} disabled={issues.length > 0} style={styles.editorActionButton} />
            </>}
          </View>
        </View>
      </View>
    </NativeModal>
  );
}

function PublicationResultScreen({ result, isMobile, onClose, onEdit }: { result: PublicationResultState | null; isMobile: boolean; onClose: () => void; onEdit: (result: PublicationResultState) => void }) {
  if (!result) return null;

  const isPublished = result.status === 'published';
  const title = isPublished ? 'Yayınlandı' : 'İncelemeye gönderildi';
  const detail = isPublished
    ? `${result.row.title} yayındaki kataloğa aktarıldı. Öğrencilerin göreceği aktif sürüm olarak kaydedildi.`
    : `${result.row.title} inceleme kuyruğuna alındı. Yayın öncesi kontroller için bekleyen sürüm olarak kaydedildi.`;
  const timestamp = result.row.updatedAt ? new Date(result.row.updatedAt).toLocaleString('tr-TR') : 'Az önce';

  return (
    <NativeModal transparent visible animationType={isMobile ? 'slide' : 'fade'} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, isMobile ? styles.modalOverlayMobile : null]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Sonuç ekranını kapat" onPress={onClose} style={styles.modalBackdrop} />
        <View testID="admin-publication-result" style={[styles.resultCard, isMobile ? styles.resultCardMobile : null]}>
          <View style={[styles.resultIcon, isPublished ? styles.resultIconPublished : styles.resultIconReview]}>
            <SymbolView name={isPublished ? checkSymbol : reviewSymbol} tintColor={isPublished ? studentTokens.teal : studentTokens.orange} size={28} style={styles.resultSymbol} />
          </View>
          <View style={styles.stack}>
            <Text style={styles.kicker}>{isPublished ? 'YAYIN AKIŞI' : 'İNCELEME AKIŞI'}</Text>
            <Text style={styles.resultTitle}>{title}</Text>
            <Text style={styles.resultText}>{detail}</Text>
            {result.notice ? <Text accessibilityRole="alert" style={styles.resultNotice}>{result.notice}</Text> : null}
          </View>
          <View style={styles.resultMeta}>
            <View style={styles.resultMetaRow}>
              <Text style={styles.resultMetaLabel}>Kayıt</Text>
              <Text style={styles.resultMetaValue} numberOfLines={1}>{result.row.title}</Text>
            </View>
            <View style={styles.resultMetaRow}>
              <Text style={styles.resultMetaLabel}>Durum</Text>
              <PublicationBadge status={result.status} version={result.row.version} />
            </View>
            <View style={styles.resultMetaRow}>
              <Text style={styles.resultMetaLabel}>Güncelleme</Text>
              <Text style={styles.resultMetaValue}>{timestamp}</Text>
            </View>
          </View>
          <View style={styles.resultActions}>
            <Button label="Listeye Dön" variant="secondary" onPress={onClose} style={styles.resultButton} />
            <Button label="Kaydı Aç" onPress={() => onEdit(result)} style={styles.resultButton} />
          </View>
        </View>
      </View>
    </NativeModal>
  );
}

function DisableConfirmation({ target, isMobile, onCancel, onConfirm, error }: { target: DisableTarget | null; isMobile: boolean; onCancel: () => void; onConfirm: () => void; error: string }) {
  if (!target) return null;
  return (
    <NativeModal transparent visible animationType={isMobile ? 'slide' : 'fade'} onRequestClose={onCancel}>
      <View style={[styles.modalOverlay, isMobile ? styles.modalOverlayMobile : null]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Arşivlemekten vazgeç" onPress={onCancel} style={styles.modalBackdrop} />
        <View style={[styles.confirmCard, isMobile ? styles.confirmCardMobile : null]}>
          <View style={styles.confirmIcon}>
            <SymbolView name={warningSymbol} tintColor={studentTokens.orange} size={24} style={styles.confirmSymbol} />
          </View>
          <Text style={styles.confirmTitle}>Bu kayıt arşivlensin mi?</Text>
          <Text style={styles.confirmText}>{target.row.title} yayınlanan katalogdan kaldırılacak. Geçmişi korunacak. Yayındaki içeriklerle ilişkileri varsa işlem engellenebilir.</Text>
          <View style={styles.confirmMeta}>
            <Text style={styles.recordMeta}>Tespit edilen ilişkiler: {target.row.referenceCount}</Text>
            <Text style={styles.recordMeta}>Kayıt türü: {adminLabel(target.collection)}</Text>
          </View>
          <View style={styles.confirmActions}>
            <Button label="Vazgeç" variant="secondary" onPress={onCancel} style={styles.confirmButton} />
            <Button label="Arşivle" onPress={onConfirm} style={styles.confirmButton} />
          </View>
          {error ? <Text accessibilityRole="alert" style={styles.formIssueText}>{error}</Text> : null}
        </View>
      </View>
    </NativeModal>
  );
}

type AdminPanelInitialState = {
  state: AdminWorkspaceState | null;
  error: string;
  notice: string;
  source: 'local' | 'remote';
};

function readLocalAdminInitial(): AdminPanelInitialState {
  try { return { state: loadAdminWorkspaceState(), error: '', notice: '', source: 'local' }; }
  catch (error) { return { state: null, error: error instanceof Error ? adminMessage(error.message) : 'Yönetim verileri yüklenemedi.', notice: '', source: 'local' }; }
}

export function AdminPanel(props: AdminPanelProps) {
  const [initial, setInitial] = useState<AdminPanelInitialState>(readLocalAdminInitial);

  const reloadSharedState = () => {
    void loadSharedAdminWorkspaceState(props.user)
      .then((result) => setInitial({ state: result.state, error: '', notice: result.message, source: result.source }))
      .catch((error) => setInitial({ state: null, error: error instanceof Error ? adminMessage(error.message) : 'Yönetim verileri yüklenemedi.', notice: '', source: 'local' }));
  };

  useEffect(() => {
    let active = true;
    void loadSharedAdminWorkspaceState(props.user)
      .then((result) => { if (active) setInitial({ state: result.state, error: '', notice: result.message, source: result.source }); })
      .catch((error) => { if (active) setInitial((current) => ({ ...current, error: error instanceof Error ? adminMessage(error.message) : 'Yönetim verileri yüklenemedi.', notice: '' })); });
    return () => { active = false; };
  }, [props.user]);

  if (!initial.state) return <AdminShell {...props} activeModule="dashboard" onModuleChange={() => {}}><EmptyState title="Yönetim verilerine erişilemiyor" text={initial.error} action={<Button label="Yeniden Dene" onPress={reloadSharedState} />} /></AdminShell>;
  return <AdminPanelContent key={initial.source + '-' + String(initial.state.workflow?.revision ?? 0) + '-' + initial.notice} {...props} initialState={initial.state} initialNotice={initial.notice} />;
}
function AdminPanelContent({ user, onLogout, isLoggingOut = false, initialState, initialNotice = '' }: AdminPanelProps & { initialState: AdminWorkspaceState; initialNotice?: string }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 760;
  const [state, setState] = useState<AdminWorkspaceState>(initialState);
  const [activeModule, setActiveModule] = useState<AdminModuleKey>('dashboard');
  const [collectionByModule, setCollectionByModule] = useState<Partial<Record<AdminModuleKey, AdminMutableCollectionKey>>>(initialCollectionByModule);
  const [query, setQuery] = useState('');
  const [questionFilters, setQuestionFilters] = useState<AdminQuestionFilters>(() => defaultQuestionFilters());
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [publicationResult, setPublicationResult] = useState<PublicationResultState | null>(null);
  const [disableTarget, setDisableTarget] = useState<DisableTarget | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(initialNotice);
  const [isSaving, setIsSaving] = useState(false);

  const activeConfig = adminModules.find((module) => module.key === activeModule) ?? adminModules[0];
  const collections = activeModule === 'dashboard' || activeModule === 'page-builder' ? [] : adminModuleCollections[activeModule as Exclude<AdminModuleKey, 'dashboard'>];
  const activeCollection = collectionByModule[activeModule] ?? collections?.[0]?.key ?? 'exams';
  const editorIssues = editor ? validateAdminEntityDraft(editor.collection, editor.draft) : [];

  const commit = async (next: AdminWorkspaceState) => {
    setIsSaving(true);
    try {
      const result = await saveSharedAdminWorkspaceState(next, state.workflow?.revision ?? 0, user);
      setState(next);
      setError('');
      return result.notice ?? '';
    } finally {
      setIsSaving(false);
    }
  };
  const attempt = async (action: () => void | Promise<void>) => { try { await action(); } catch (cause) { setError(cause instanceof Error ? adminMessage(cause.message) : 'İşlem tamamlanamadı.'); setMessage(''); } };

  const handleCollectionChange = (collection: AdminMutableCollectionKey) => {
    setCollectionByModule((current) => ({ ...current, [activeModule]: collection }));
    setQuery('');
  };

  const openCreate = (config: AdminCollectionConfig) => {
    setError(''); setMessage('');
    setPublicationResult(null);
    const draft = initialAdminDraft(config.key, undefined, state.catalog);
    if (config.key === 'lessons') draft.sortOrder = nextLessonSortOrder(state, draft.courseId);
    setEditor({ mode: 'create', module: activeModule, collection: config.key, config, draft });
  };

  const openEdit = (row: AdminEntityRow, config: AdminCollectionConfig) => {
    setError(''); setMessage('');
    setPublicationResult(null);
    setEditor({ mode: 'edit', module: activeModule, collection: config.key, config, row, draft: initialAdminDraft(config.key, row, state.catalog) });
  };

  const saveEditor = (status: Exclude<PublicationStatus, 'archived'>) => {
    void attempt(async () => {
      if (!editor) return;
      const next = saveAdminContent(state, editor.module, editor.collection, editor.draft, user, status, editor.row?.id, editor.row?.version ?? 0);
      const saveNotice = await commit(next);
      const id = next.workflow!.audit[0].entityId;
      const row = listAdminRows(next, editor.collection).find((item) => item.id === id)!;
      if (status === 'draft') {
        setEditor({ ...editor, mode: 'edit', row, draft: initialAdminDraft(editor.collection, row, next.catalog) });
        setMessage((saveNotice ? saveNotice + ' ' : '') + 'Taslak sürüm ' + String(row.version) + ' kaydedildi.');
        return;
      }
      setEditor(null);
      setPublicationResult({ status, module: editor.module, collection: editor.collection, config: editor.config, row, notice: saveNotice || undefined });
      setMessage('');
    });
  };

  const restoreVersion = (version: number) => {
    void attempt(async () => {
      if (!editor?.row) return;
      const next = restoreAdminVersion(state, editor.collection, editor.row.id, version, user, editor.row.version ?? 0);
      await commit(next);
      const row = listAdminRows(next, editor.collection).find((item) => item.id === editor.row!.id)!;
      setEditor({ ...editor, row, draft: initialAdminDraft(editor.collection, row, next.catalog) });
      setMessage('Sürüm ' + String(version) + ', taslak sürüm ' + String(row.version) + ' olarak geri yüklendi.');
    });
  };

  const handleDisable = () => {
    void attempt(async () => {
      if (!disableTarget) return;
      await commit(archiveAdminEntity(state, disableTarget.collection, disableTarget.row.id, user, disableTarget.row.version ?? 0));
      setDisableTarget(null);
      setMessage('İçerik arşivlendi. Sürüm geçmişi korundu.');
    });
  };

  const moveRow = (row: AdminEntityRow, config: AdminCollectionConfig, direction: 'up' | 'down') => {
    void attempt(async () => {
      await commit(reorderAdminEntity(state, activeModule, config.key, row.id, direction, user));
      setMessage('Sıralama taslak olarak kaydedildi. Yayındaki kataloğa uygulamak için yayınlayın.');
    });
  };

  const toggleNavigation = (row: AdminEntityRow, config: AdminCollectionConfig) => {
    void attempt(async () => {
      await commit(toggleAdminNavigationVisibility(state, config.key, row.id, user));
      setMessage(row.title + ' menüde ' + ('isEnabled' in row.raw && row.raw.isEnabled ? 'gösterildi' : 'gizlendi') + '.');
    });
  };

  const pageBuilder = state.pageBuilder ?? defaultPageBuilderState();
  const updatePageBuilder = (nextPageBuilder: NonNullable<AdminWorkspaceState['pageBuilder']>) => {
    void attempt(async () => {
      await commit({ ...state, pageBuilder: nextPageBuilder });
      setMessage('Sayfa düzeni kaydedildi.');
    });
  };
  const openPublicationResultRecord = (result: PublicationResultState) => {
    const row = listAdminRows(state, result.collection).find((item) => item.id === result.row.id) ?? result.row;
    setPublicationResult(null);
    setError('');
    setMessage('');
    setActiveModule(result.module);
    setCollectionByModule((current) => ({ ...current, [result.module]: result.collection }));
    setEditor({ mode: 'edit', module: result.module, collection: result.collection, config: result.config, row, draft: initialAdminDraft(result.collection, row, state.catalog) });
  };

  return (
    <AdminShell user={user} activeModule={activeModule} onModuleChange={(module) => { setActiveModule(module); setQuery(''); setPublicationResult(null); }} onLogout={onLogout} isLoggingOut={isLoggingOut}>
      {!editor && error ? <View style={styles.formIssues}><Text accessibilityRole="alert" style={styles.formIssueText}>{error}</Text><Button label="Paneli Yeniden Yükle" variant="secondary" onPress={() => { void attempt(async () => { const result = await loadSharedAdminWorkspaceState(user); setState(result.state); setError(''); setMessage(result.message); }); }} /></View> : null}
      {!editor && isSaving ? <Text accessibilityLiveRegion="polite" style={styles.pageText}>Merkezi içerik kaydediliyor...</Text> : null}
      {!editor && message ? <Text accessibilityLiveRegion="polite" style={styles.pageText}>{message}</Text> : null}
      {activeModule === 'dashboard' ? (
        <DashboardView state={state} onQuickAction={(module) => { setActiveModule(module); setQuery(''); }} />
      ) : activeModule === 'page-builder' ? (
        <PageBuilderPanel state={pageBuilder} user={user} isMobile={isMobile} onChange={updatePageBuilder} />
      ) : (
        <ModuleManager
          module={activeConfig}
          state={state}
          collection={activeCollection}
          onCollectionChange={handleCollectionChange}
          query={query}
          onQueryChange={setQuery}
          questionFilters={questionFilters}
          onQuestionFiltersChange={setQuestionFilters}
          isMobile={isMobile}
          onCreate={openCreate}
          onEdit={openEdit}
          onDisable={(row, config) => setDisableTarget({ module: activeModule, collection: config.key, row })}
          onToggle={toggleNavigation}
          onMove={moveRow}
        />
      )}
      {editor ? <AdminEntityEditor editor={editor} issues={editorIssues} isMobile={isMobile} state={state} user={user} message={message} error={error} onChange={(draft) => { setMessage(''); setEditor((current) => current ? { ...current, draft } : current); }} onClose={() => setEditor(null)} onSave={() => saveEditor('draft')} onReview={() => saveEditor('review')} onPublish={() => saveEditor('published')} onRestore={restoreVersion} /> : null}
      <PublicationResultScreen result={publicationResult} isMobile={isMobile} onClose={() => setPublicationResult(null)} onEdit={openPublicationResultRecord} />
      <DisableConfirmation target={disableTarget} isMobile={isMobile} error={error} onCancel={() => setDisableTarget(null)} onConfirm={handleDisable} />
    </AdminShell>
  );
}
const styles = StyleSheet.create({
  stack: { gap: 16 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: { fontFamily: studentFontFamily, color: studentTokens.teal, fontSize: 11, lineHeight: 15, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5 },
  pageTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 28, lineHeight: 35, fontWeight: '700' },
  pageText: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 14, lineHeight: 22, fontWeight: '500', marginTop: 6, maxWidth: 720 },
  bodyText: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 14, lineHeight: 21, fontWeight: '500', flex: 1, minWidth: 0 },
  mutedText: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 14, lineHeight: 21, fontWeight: '500' },
  pressed: { opacity: 0.72 },
  inlineIcon: { width: 18, height: 18 },

  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  metricCard: { flexGrow: 1, flexShrink: 1, flexBasis: 210, minWidth: 210 },
  metricBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metricIcon: { width: 42, height: 42, borderRadius: 14, flexShrink: 0 },
  metricCopy: { flex: 1, minWidth: 0 },
  metricLabel: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  metricValue: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 24, lineHeight: 30, fontWeight: '700' },
  metricDetail: { fontFamily: studentFontFamily, fontSize: 12, lineHeight: 17, fontWeight: '700' },

  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  dashboardPanel: { flexGrow: 1, flexShrink: 1, flexBasis: 440, minWidth: 0, maxWidth: '100%' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { flexGrow: 1, flexShrink: 1, flexBasis: 210, minWidth: 180, minHeight: 98, borderRadius: 14, borderWidth: 1, borderColor: studentTokens.lineSoft, backgroundColor: studentTokens.neutral, padding: 14, justifyContent: 'center' },
  quickTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  quickText: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 12, lineHeight: 18, fontWeight: '500', marginTop: 5 },
  changeList: { gap: 11 },
  changeRow: { minHeight: 48, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  changeDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: studentTokens.yellow, marginTop: 6 },
  changeCopy: { flex: 1, minWidth: 0 },
  changeTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  changeText: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 12, lineHeight: 18, fontWeight: '500', marginTop: 2 },
  changeDate: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 11, lineHeight: 16, maxWidth: 95, flexShrink: 1 },
  validationOk: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, backgroundColor: studentTokens.tealSoft, padding: 13 },
  validationList: { gap: 10 },
  validationIssue: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 13, backgroundColor: studentTokens.yellowSoft, padding: 11 },
  validationCard: { borderColor: '#f3dfa3', backgroundColor: '#fffdf6' },

  collectionTabs: { gap: 9, paddingVertical: 2, paddingRight: 6 },
  collectionTab: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: studentTokens.line, backgroundColor: studentTokens.surface, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  collectionTabActive: { backgroundColor: studentTokens.navy, borderColor: studentTokens.navy },
  collectionTabText: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  collectionTabTextActive: { color: '#ffffff' },

  filterCard: { backgroundColor: '#ffffff' },
  filterCardBody: { gap: 12 },
  filterHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterButton: { minHeight: 58, flexGrow: 1, flexShrink: 1, flexBasis: 154, borderRadius: 12, borderWidth: 1, borderColor: studentTokens.line, backgroundColor: studentTokens.neutral, paddingHorizontal: 14, justifyContent: 'center' },
  filterLabel: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  filterValue: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 2 },

  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  actionIcon: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: studentTokens.lineSoft, backgroundColor: studentTokens.surface, alignItems: 'center', justifyContent: 'center' },
  actionDisabled: { backgroundColor: studentTokens.neutral, opacity: 0.5 },
  actionSymbol: { width: 15, height: 15 },

  mobileList: { gap: 12 },
  mobileRecordCard: { padding: 15 },
  mobileRecordBody: { gap: 12 },
  mobileRecordTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  recordTitleWrap: { flex: 1, minWidth: 0 },
  recordTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  recordSlug: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
  recordDescription: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  recordMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recordMeta: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 12, lineHeight: 17, fontWeight: '600' },

  tableScrollContent: { paddingBottom: 6 },
  table: { minWidth: 980, width: '100%', borderRadius: 16, borderWidth: 1, borderColor: studentTokens.lineSoft, overflow: 'hidden', backgroundColor: studentTokens.surface },
  tableRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: studentTokens.lineSoft },
  tableHead: { minHeight: 44, backgroundColor: studentTokens.neutral },
  tableHeadText: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 11, lineHeight: 15, fontWeight: '700', textTransform: 'uppercase' },
  colTitle: { width: 220, minWidth: 220 },
  colStatus: { width: 116, minWidth: 116 },
  colRelation: { width: 260, minWidth: 260 },
  colSmall: { width: 84, minWidth: 84 },
  colDate: { width: 92, minWidth: 92 },
  colActions: { width: 212, minWidth: 212 },

  managerCard: { backgroundColor: studentTokens.surface },
  managerBody: { gap: 14 },
  managerToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  searchBox: { minHeight: 48, flexGrow: 1, flexShrink: 1, flexBasis: 260, borderRadius: 14, borderWidth: 1, borderColor: studentTokens.line, backgroundColor: studentTokens.neutral, justifyContent: 'center' },
  searchInput: { fontFamily: studentFontFamily, minHeight: 46, paddingHorizontal: 14, color: studentTokens.ink, fontSize: 14, lineHeight: 20, fontWeight: '500', outlineStyle: 'none' as never },
  toolbarMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  collectionDescription: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  createButton: { minWidth: 170 },

  formGroup: { gap: 7, minWidth: 0, flexGrow: 1, flexShrink: 1 },
  videoSourceSection: { gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: studentTokens.line, backgroundColor: '#f7fbfc' },
  formHelper: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 12, lineHeight: 18, fontWeight: '500', marginTop: 3 },
  formLabel: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionPill: { minHeight: 40, borderRadius: 999, borderWidth: 1, borderColor: studentTokens.line, backgroundColor: studentTokens.surface, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  optionPillActive: { backgroundColor: studentTokens.navy, borderColor: studentTokens.navy },
  optionText: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  optionTextActive: { color: '#ffffff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(20, 22, 35, 0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalOverlayMobile: { justifyContent: 'flex-end', padding: 0 },
  modalBackdrop: { ...StyleSheet.absoluteFill },
  editorCard: { width: '100%', maxWidth: 800, height: '90%', maxHeight: '90%', borderRadius: 8, backgroundColor: studentTokens.surface, overflow: 'hidden', shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 12 } },
  editorCardMobile: { maxWidth: '100%', maxHeight: '92%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  editorHead: { minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: studentTokens.lineSoft },
  editorTitleGroup: { flex: 1, minWidth: 0 },
  editorTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 24, lineHeight: 30, fontWeight: '700' },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: studentTokens.neutral, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 22, lineHeight: 24, fontWeight: '700' },
  editorScroll: { flex: 1 },
  editorContent: { padding: 18, gap: 15 },
  formGrid: { flexDirection: 'row', gap: 12 },
  formGridMobile: { flexDirection: 'column' },
  formInput: { fontFamily: studentFontFamily, flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: studentTokens.line, backgroundColor: studentTokens.neutral, paddingHorizontal: 13, color: studentTokens.ink, fontSize: 14, lineHeight: 20, fontWeight: '500', outlineStyle: 'none' as never },
  textArea: { minHeight: 92, paddingTop: 12, textAlignVertical: 'top' },
  switchRow: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: studentTokens.line, backgroundColor: studentTokens.neutral, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchRowActive: { borderColor: '#c7e8e3', backgroundColor: studentTokens.tealSoft },
  switchDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: studentTokens.line, backgroundColor: studentTokens.surface },
  switchDotActive: { backgroundColor: studentTokens.teal, borderColor: studentTokens.teal },
  switchText: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  formIssues: { borderRadius: 14, backgroundColor: studentTokens.dangerSoft, borderWidth: 1, borderColor: '#ffd0cb', padding: 12, gap: 5 },
  formIssueText: { fontFamily: studentFontFamily, color: studentTokens.danger, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  editorActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, padding: 14, borderTopWidth: 1, borderTopColor: studentTokens.lineSoft, backgroundColor: studentTokens.surface },
  editorActionsMobile: { paddingHorizontal: 12, paddingBottom: 20 },
  editorActionButton: { flexGrow: 1, flexBasis: 110, minHeight: 44 },
  editorTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  editorTab: { flex: 1, minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: studentTokens.neutral },
  resultCard: { width: '100%', maxWidth: 520, borderRadius: 8, backgroundColor: studentTokens.surface, padding: 20, alignItems: 'flex-start', gap: 14, shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 12 } },
  resultCardMobile: { maxWidth: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  resultIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  resultIconPublished: { backgroundColor: studentTokens.tealSoft },
  resultIconReview: { backgroundColor: studentTokens.yellowSoft },
  resultSymbol: { width: 28, height: 28 },
  resultTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 26, lineHeight: 32, fontWeight: '700' },
  resultText: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 14, lineHeight: 22, fontWeight: '500' },
  resultNotice: { fontFamily: studentFontFamily, color: studentTokens.danger, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  resultMeta: { width: '100%', borderRadius: 8, backgroundColor: studentTokens.neutral, borderWidth: 1, borderColor: studentTokens.lineSoft, padding: 12, gap: 10 },
  resultMetaRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  resultMetaLabel: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  resultMetaValue: { flex: 1, minWidth: 0, textAlign: 'right', fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  resultActions: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10, marginTop: 2 },
  resultButton: { minWidth: 132 },
  confirmCard: { width: '100%', maxWidth: 460, borderRadius: 22, backgroundColor: studentTokens.surface, padding: 20, alignItems: 'flex-start', gap: 12, shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 12 } },
  confirmCardMobile: { maxWidth: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  confirmIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: studentTokens.yellowSoft, alignItems: 'center', justifyContent: 'center' },
  confirmSymbol: { width: 24, height: 24 },
  confirmTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 24, lineHeight: 30, fontWeight: '700' },
  confirmText: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 14, lineHeight: 22, fontWeight: '500' },
  confirmMeta: { width: '100%', borderRadius: 14, backgroundColor: studentTokens.neutral, borderWidth: 1, borderColor: studentTokens.lineSoft, padding: 12, gap: 4 },
  confirmActions: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  confirmButton: { minWidth: 132 },
});

