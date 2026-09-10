import { useMemo, useState, type ReactNode } from 'react';
import { type Href, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Modal as NativeModal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { getPlanLabel, type AuthUser } from '@/lib/auth';
import { getPlanActionLabel, type StudentRouteKey } from '@/lib/permissions';
import { getBottomNavigationItem, getVisibleNavigationGroups, type NavigationIconKey, type ResolvedNavigationGroup, type ResolvedNavigationItem } from '@/lib/navigation';
import { Badge, Button, studentFontFamily, studentTokens } from '@/components/student/ui';

type StudentShellProps = {
  user: AuthUser;
  activeRoute: StudentRouteKey;
  title: string;
  subtitle: string;
  onLogout: () => void;
  children: ReactNode;
};

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const menuSymbol = symbolName('line.3.horizontal', 'menu');
const collapseSymbol = symbolName('sidebar.left', 'dock_to_left');
const logoutSymbol = symbolName('rectangle.portrait.and.arrow.right', 'logout');
const crownSymbol = symbolName('star.fill', 'workspace_premium');
const helpSymbol = symbolName('questionmark.circle', 'help');
const bellSymbol = symbolName('bell', 'notifications');
const chevronSymbol = symbolName('chevron.down', 'expand_more');

const navigationIconRegistry: Record<NavigationIconKey, AppSymbolName> = {
  dashboard: symbolName('rectangle.grid.2x2', 'dashboard'),
  'my-learning': symbolName('bookmark', 'bookmark'),
  'video-lessons': symbolName('play.rectangle', 'smart_display'),
  reading: symbolName('book', 'menu_book'),
  listening: symbolName('headphones', 'headphones'),
  speaking: symbolName('mic', 'mic'),
  writing: symbolName('square.and.pencil', 'edit_square'),
  vocabulary: symbolName('textformat.abc', 'abc'),
  grammar: symbolName('text.book.closed', 'library_books'),
  'mini-tests': symbolName('checklist', 'checklist'),
  'mock-tests': symbolName('timer', 'timer'),
  'my-progress': symbolName('chart.bar', 'bar_chart'),
  'score-analysis': symbolName('chart.line.uptrend.xyaxis', 'show_chart'),
  'skill-analysis': symbolName('chart.pie', 'pie_chart'),
  'study-plan': symbolName('calendar', 'calendar_month'),
  'activity-history': symbolName('clock.arrow.circlepath', 'history'),
  profile: symbolName('person.crop.circle', 'account_circle'),
  settings: symbolName('gearshape', 'settings'),
  subscription: symbolName('creditcard', 'payments'),
  premium: crownSymbol,
};

function getNavigationIcon(iconKey: NavigationIconKey) {
  return navigationIconRegistry[iconKey] ?? navigationIconRegistry.dashboard;
}

function SidebarContent({ collapsed, user, groups, bottomItem, showBrand = true, showCollapse, onToggleCollapse, onNavigate, onPlanAction }: { collapsed: boolean; user: AuthUser; groups: ResolvedNavigationGroup[]; bottomItem?: ResolvedNavigationItem; showBrand?: boolean; showCollapse: boolean; onToggleCollapse?: () => void; onNavigate: (item: ResolvedNavigationItem) => void; onPlanAction: () => void }) {
  return (
    <View style={styles.sidebarContent}>
      {showBrand ? (
        <View style={[styles.sidebarBrandCompact, collapsed ? styles.sidebarBrandCollapsed : null]}>
          <View style={styles.sidebarLogo}><Text style={styles.sidebarLogoText}>A</Text></View>
          {!collapsed ? (
            <View style={styles.sidebarBrandCopy}>
              <Text style={styles.sidebarBrandTitle}>Akademik Skor</Text>
              <Text style={styles.sidebarBrandSub}>Student App</Text>
            </View>
          ) : null}
          {showCollapse ? (
            <Pressable accessibilityRole="button" accessibilityLabel={collapsed ? 'Sidebar genişlet' : 'Sidebar daralt'} onPress={onToggleCollapse} style={({ pressed }) => [styles.sidebarToggle, pressed ? styles.pressed : null]}>
              <SymbolView name={collapseSymbol} tintColor={studentTokens.text} size={16} style={styles.sidebarToggleIcon} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarScrollContent}>
        {groups.map((group) => (
          <View key={group.id} style={styles.sidebarGroup}>
            {!collapsed ? <Text style={styles.sidebarGroupTitle}>{group.title}</Text> : null}
            {group.items.map((item) => {
              const active = item.isActive;
              const premiumOnly = item.requiredPlan === 'premium' || item.badgeVariant === 'premium';
              const icon = getNavigationIcon(item.iconKey);
              return (
                <Pressable
                  key={item.id}
                  testID={`student-nav-${item.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  accessibilityState={{ selected: active, disabled: !item.isEnabled }}
                  disabled={!item.isEnabled}
                  onPress={() => onNavigate(item)}
                  style={({ pressed }) => [styles.sidebarItem, collapsed ? styles.sidebarItemCollapsed : null, active ? styles.sidebarItemActive : null, !item.isEnabled ? styles.sidebarItemDisabled : null, pressed ? styles.pressed : null]}
                >
                  <View style={[styles.sidebarIconBox, active ? styles.sidebarIconBoxActive : null]}>
                    <SymbolView name={icon} tintColor={active ? studentTokens.navy : studentTokens.muted} size={14} style={styles.sidebarIcon} />
                  </View>
                  {!collapsed ? <Text style={[styles.sidebarItemText, active ? styles.sidebarItemTextActive : null]} numberOfLines={1}>{item.title}</Text> : null}
                  {!collapsed && premiumOnly ? <View style={styles.premiumDot} /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.planBox, collapsed ? styles.planBoxCollapsed : null]}>
        <SymbolView name={crownSymbol} tintColor={studentTokens.yellowDeep} size={17} style={styles.planIcon} />
        {!collapsed ? (
          <>
            <Text style={styles.planTitle}>{user.plan === 'premium' ? 'Premium plan' : 'Free plan'}</Text>
            <Text style={styles.planText}>{user.plan === 'premium' ? 'Tüm deneme ve analizler açık.' : 'Mock Tests ve analiz ekranları Premium ile açılır.'}</Text>
            <Button label={getPlanActionLabel(user)} size="sm" onPress={onPlanAction} disabled={bottomItem ? !bottomItem.isEnabled : false} style={styles.planButton} textStyle={styles.planButtonText} />
          </>
        ) : null}
      </View>
    </View>
  );
}

export function StudentShell({ user, activeRoute, title, subtitle, onLogout, children }: StudentShellProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 940;
  const isTablet = width >= 760;
  const showTopbarName = width >= 720;
  const showMobileRouteTitle = !isDesktop && width >= 520;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const userInitials = useMemo(() => {
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] ?? 'O') + (parts[1]?.[0] ?? '');
  }, [user.name]);
  const sidebarGroups = useMemo(() => getVisibleNavigationGroups(user, { activeRoute, includeLocked: true, includeDisabled: true, placement: 'sidebar' }), [activeRoute, user]);
  const bottomNavigationItem = useMemo(() => getBottomNavigationItem(user), [user]);

  const handleNavigate = (item: ResolvedNavigationItem) => {
    if (!item.isEnabled) {
      return;
    }

    if (item.routeKey === activeRoute) {
      setDrawerOpen(false);
      return;
    }

    router.push(item.route as Href);
    setDrawerOpen(false);
  };

  const handlePlanAction = () => {
    router.push((bottomNavigationItem?.route ?? '/account/subscription') as Href);
    setDrawerOpen(false);
  };

  return (
    <View testID="student-shell" style={styles.shell}>
      <View testID="student-topbar" style={[styles.topbar, !isTablet ? styles.topbarMobile : null]}>
        <View style={styles.topbarBrandWrap}>
          {!isDesktop ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Menüyü aç" onPress={() => setDrawerOpen(true)} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
              <SymbolView name={menuSymbol} tintColor="#ffffff" size={18} style={styles.iconSymbol} />
            </Pressable>
          ) : null}
          <View style={styles.topbarLogo}><Text style={styles.topbarLogoText}>A</Text></View>
          <View style={styles.topbarBrandCopy}>
            <Text style={styles.topbarBrandTitle}>Akademik</Text>
            <Text style={styles.topbarBrandTitle}>Skor</Text>
          </View>
          {showMobileRouteTitle ? (
            <View style={styles.mobileTitleGroup}>
              <Text style={styles.mobileTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.mobileSubtitle} numberOfLines={1}>{subtitle}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.topbarRight}>
          {isTablet ? (
            <>
              <Pressable accessibilityRole="button" accessibilityLabel="Yardım" style={({ pressed }) => [styles.topIconButton, pressed ? styles.pressed : null]}>
                <SymbolView name={helpSymbol} tintColor="#ffffff" size={17} style={styles.iconSymbol} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Bildirimler" style={({ pressed }) => [styles.topIconButton, pressed ? styles.pressed : null]}>
                <SymbolView name={bellSymbol} tintColor="#ffffff" size={17} style={styles.iconSymbol} />
                <View style={styles.notificationBadge}><Text style={styles.notificationText}>3</Text></View>
              </Pressable>
            </>
          ) : null}
          <Badge label={getPlanLabel(user.plan)} tone={user.plan === 'premium' ? 'yellow' : 'teal'} style={!isTablet ? styles.hideOnMobile : null} />
          <View style={styles.userChip}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{userInitials.toUpperCase()}</Text></View>
            {showTopbarName ? (
              <>
                <Text style={styles.userName}>{user.name.split(' ')[0] || user.name}</Text>
                <SymbolView name={chevronSymbol} tintColor="#ffffff" size={15} style={styles.chevronIcon} />
              </>
            ) : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Çıkış yap" onPress={onLogout} style={({ pressed }) => [styles.topIconButton, pressed ? styles.pressed : null]}>
            <SymbolView name={logoutSymbol} tintColor="#ffffff" size={17} style={styles.iconSymbol} />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        {isDesktop ? (
          <View testID="student-sidebar" style={[styles.sidebar, collapsed ? styles.sidebarCollapsed : null]}>
            <SidebarContent collapsed={collapsed} user={user} groups={sidebarGroups} bottomItem={bottomNavigationItem} showBrand={false} showCollapse={false} onToggleCollapse={() => setCollapsed((value) => !value)} onNavigate={handleNavigate} onPlanAction={handlePlanAction} />
          </View>
        ) : null}

        <ScrollView style={styles.mainScroll} contentContainerStyle={[styles.mainContent, !isTablet ? styles.mainContentMobile : null]} showsVerticalScrollIndicator>
          {children}
        </ScrollView>
      </View>

      <NativeModal transparent visible={drawerOpen} animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.drawerOverlay}>
          <Pressable accessibilityRole="button" accessibilityLabel="Menüyü kapat" onPress={() => setDrawerOpen(false)} style={styles.drawerBackdrop} />
          <View testID="student-mobile-drawer" style={styles.drawerPanel}>
            <SidebarContent collapsed={false} user={user} groups={sidebarGroups} bottomItem={bottomNavigationItem} showCollapse={false} onNavigate={handleNavigate} onPlanAction={handlePlanAction} />
          </View>
        </View>
      </NativeModal>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, minHeight: '100%', backgroundColor: '#f7f9fc' },
  topbar: { minHeight: 42, backgroundColor: '#001b48', paddingHorizontal: 14, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  topbarMobile: { minHeight: 58, paddingHorizontal: 10, gap: 8 },
  topbarBrandWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  topbarLogo: { width: 24, height: 24, borderRadius: 6, backgroundColor: studentTokens.yellow, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  topbarLogoText: { fontFamily: studentFontFamily, color: studentTokens.navy, fontSize: 15, lineHeight: 19, fontWeight: '700' },
  topbarBrandCopy: { minWidth: 0, flexShrink: 0 },
  topbarBrandTitle: { fontFamily: studentFontFamily, color: '#ffffff', fontSize: 10, lineHeight: 10, fontWeight: '700', textTransform: 'uppercase' },
  mobileTitleGroup: { marginLeft: 6, paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.16)', flex: 1, minWidth: 0 },
  mobileTitle: { fontFamily: studentFontFamily, color: '#ffffff', fontSize: 13, lineHeight: 17, fontWeight: '700' },
  mobileSubtitle: { fontFamily: studentFontFamily, color: '#c9d4ee', fontSize: 10, lineHeight: 14, fontWeight: '700' },
  topbarRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 9, flexShrink: 0 },
  iconButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  topIconButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconSymbol: { width: 18, height: 18 },
  notificationBadge: { position: 'absolute', right: -3, top: -3, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: studentTokens.yellow, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notificationText: { fontFamily: studentFontFamily, color: studentTokens.navy, fontSize: 8, lineHeight: 10, fontWeight: '700' },
  hideOnMobile: { display: 'none' },
  userChip: { minHeight: 30, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 2, paddingRight: 6, flexShrink: 0 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffe3bf', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontFamily: studentFontFamily, color: studentTokens.navy, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  userName: { fontFamily: studentFontFamily, color: '#ffffff', fontSize: 12, lineHeight: 16, fontWeight: '700', maxWidth: 98 },
  chevronIcon: { width: 15, height: 15 },
  body: { flex: 1, flexDirection: 'row', minHeight: 0 },
  sidebar: { width: 164, backgroundColor: '#ffffff', borderRightWidth: 1, borderRightColor: '#e6ebf2' },
  sidebarCollapsed: { width: 62 },
  sidebarContent: { flex: 1, paddingHorizontal: 10, paddingTop: 12, paddingBottom: 10, gap: 8 },
  sidebarBrandCompact: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 38 },
  sidebarBrandCollapsed: { justifyContent: 'center' },
  sidebarLogo: { width: 34, height: 34, borderRadius: 9, backgroundColor: studentTokens.yellow, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sidebarLogoText: { fontFamily: studentFontFamily, color: studentTokens.navy, fontSize: 20, lineHeight: 25, fontWeight: '700' },
  sidebarBrandCopy: { flex: 1, minWidth: 0 },
  sidebarBrandTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 17, lineHeight: 20, fontWeight: '700' },
  sidebarBrandSub: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 10, lineHeight: 13, fontWeight: '700' },
  sidebarToggle: { width: 26, height: 26, borderRadius: 9, backgroundColor: '#f4f6fa', borderWidth: 1, borderColor: '#e5eaf2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sidebarToggleIcon: { width: 16, height: 16 },
  sidebarScroll: { flex: 1, minHeight: 0 },
  sidebarScrollContent: { paddingBottom: 4, gap: 10 },
  sidebarGroup: { gap: 3 },
  sidebarGroupTitle: { fontFamily: studentFontFamily, color: '#8790a4', fontSize: 9, lineHeight: 13, fontWeight: '700', letterSpacing: 0, marginLeft: 2, textTransform: 'uppercase' },
  sidebarItem: { minHeight: 26, borderRadius: 7, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 7, borderWidth: 1, borderColor: 'transparent' },
  sidebarItemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  sidebarItemActive: { backgroundColor: '#eaf1ff', borderColor: '#dce7ff' },
  sidebarItemDisabled: { opacity: 0.48 },
  sidebarIconBox: { width: 18, height: 18, borderRadius: 5, backgroundColor: '#f4f6fa', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sidebarIconBoxActive: { backgroundColor: studentTokens.navy },
  sidebarIcon: { width: 14, height: 14, flexShrink: 0 },
  sidebarItemText: { fontFamily: studentFontFamily, flex: 1, minWidth: 0, color: '#4f5870', fontSize: 10, lineHeight: 14, fontWeight: '600' },
  sidebarItemTextActive: { color: studentTokens.navy, fontWeight: '700' },
  premiumDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: studentTokens.yellow, flexShrink: 0 },
  planBox: { borderRadius: 10, backgroundColor: '#fff5d8', borderWidth: 1, borderColor: '#f2dea5', padding: 9, gap: 6 },
  planBoxCollapsed: { alignItems: 'center', paddingHorizontal: 5 },
  planIcon: { width: 17, height: 17 },
  planTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 12, lineHeight: 16, fontWeight: '700' },
  planText: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 10, lineHeight: 15, fontWeight: '600' },
  planButton: { minHeight: 29, borderRadius: 8, width: '100%' },
  planButtonText: { fontFamily: studentFontFamily, fontSize: 10, lineHeight: 14 },
  mainScroll: { flex: 1, backgroundColor: '#f7f9fc' },
  mainContent: { padding: 18, paddingBottom: 24, maxWidth: 1024, width: '100%', alignSelf: 'center' },
  mainContentMobile: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 24 },
  drawerOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(12,14,28,0.55)' },
  drawerBackdrop: { flex: 1 },
  drawerPanel: { width: '86%', maxWidth: 300, height: '100%', backgroundColor: '#ffffff' },
  pressed: { opacity: 0.72 },
});