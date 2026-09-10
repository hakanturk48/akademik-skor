import { useMemo, useState, type ReactNode } from 'react';
import { type Href, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Modal as NativeModal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { type AuthUser } from '@/lib/auth';
import { adminLabel } from '@/lib/admin/labels';
import { adminModules, type AdminIconKey, type AdminModuleConfig, type AdminModuleKey } from '@/lib/admin';
import { Button, studentFontFamily, studentTokens } from '@/components/student/ui';

type AdminShellProps = {
  user: AuthUser;
  activeModule: AdminModuleKey;
  onModuleChange: (module: AdminModuleKey) => void;
  onLogout: () => void;
  children: ReactNode;
};

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });

const menuSymbol = symbolName('line.3.horizontal', 'menu');
const closeSymbol = symbolName('xmark', 'close');
const logoutSymbol = symbolName('rectangle.portrait.and.arrow.right', 'logout');
const studentSymbol = symbolName('graduationcap', 'school');
const collapseSymbol = symbolName('sidebar.left', 'dock_to_left');

const adminIconRegistry: Record<AdminIconKey, AppSymbolName> = {
  dashboard: symbolName('rectangle.grid.2x2', 'dashboard'),
  builder: symbolName('rectangle.3.group', 'web'),
  navigation: symbolName('sidebar.left', 'dock_to_left'),
  taxonomy: symbolName('point.3.connected.trianglepath.dotted', 'account_tree'),
  courses: symbolName('books.vertical', 'library_books'),
  video: symbolName('play.rectangle', 'smart_display'),
  vocabulary: symbolName('textformat.abc', 'abc'),
  grammar: symbolName('text.book.closed', 'article'),
  questions: symbolName('questionmark.square', 'quiz'),
  practice: symbolName('rectangle.stack.badge.play', 'view_list'),
  tests: symbolName('checklist', 'checklist'),
};

function AdminSidebar({ collapsed, activeModule, onModuleChange, onClose, showClose, onToggleCollapse }: { collapsed: boolean; activeModule: AdminModuleKey; onModuleChange: (module: AdminModuleKey) => void; onClose?: () => void; showClose?: boolean; onToggleCollapse?: () => void }) {
  const handlePress = (module: AdminModuleConfig) => {
    onModuleChange(module.key);
    onClose?.();
  };

  return (
    <View style={styles.sidebarContent}>
      <View style={[styles.sidebarBrand, collapsed ? styles.sidebarBrandCollapsed : null]}>
        <View style={styles.logoMark}><Text style={styles.logoText}>A</Text></View>
        {!collapsed ? (
          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>Akademik Skor</Text>
            <Text style={styles.brandSub}>Yönetici</Text>
          </View>
        ) : null}
        {showClose ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Admin menüsünü kapat" onPress={onClose} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
            <SymbolView name={closeSymbol} tintColor={studentTokens.text} size={18} style={styles.iconSymbol} />
          </Pressable>
        ) : onToggleCollapse ? (
          <Pressable accessibilityRole="button" accessibilityLabel={collapsed ? 'Admin menüsünü genişlet' : 'Admin menüsünü daralt'} onPress={onToggleCollapse} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
            <SymbolView name={collapseSymbol} tintColor={studentTokens.text} size={18} style={styles.iconSymbol} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={styles.sidebarScroll} contentContainerStyle={styles.sidebarList} showsVerticalScrollIndicator={false}>
        {adminModules.map((module) => {
          const active = module.key === activeModule;
          const icon = adminIconRegistry[module.iconKey];
          return (
            <Pressable
              key={module.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={module.title}
              testID={`admin-nav-${module.key}`}
              onPress={() => handlePress(module)}
              style={({ pressed }) => [styles.navItem, collapsed ? styles.navItemCollapsed : null, active ? styles.navItemActive : null, pressed ? styles.pressed : null]}
            >
              <View style={[styles.navIconBox, active ? styles.navIconBoxActive : null]}>
                <SymbolView name={icon} tintColor={active ? studentTokens.navy : studentTokens.muted} size={17} style={styles.navIcon} />
              </View>
              {!collapsed ? (
                <View style={styles.navCopy}>
                  <Text style={[styles.navTitle, active ? styles.navTitleActive : null]} numberOfLines={1}>{module.title}</Text>
                  <Text style={styles.navDescription} numberOfLines={1}>{module.description}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function AdminShell({ user, activeModule, onModuleChange, onLogout, children }: AdminShellProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1040;
  const isMobile = width < 760;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeConfig = useMemo(() => adminModules.find((module) => module.key === activeModule) ?? adminModules[0], [activeModule]);

  const goStudent = () => router.push('/dashboard' as Href);

  return (
    <View testID="admin-shell" style={styles.shell}>
      <View testID="admin-topbar" style={[styles.topbar, isMobile ? styles.topbarMobile : null]}>
        <View style={styles.topbarLeft}>
          {!isDesktop ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Admin menüsünü aç" onPress={() => setDrawerOpen(true)} style={({ pressed }) => [styles.topbarIconButton, pressed ? styles.pressed : null]}>
              <SymbolView name={menuSymbol} tintColor="#ffffff" size={20} style={styles.iconSymbol} />
            </Pressable>
          ) : null}
          {!isMobile ? <View style={styles.topbarLogo}><Text style={styles.topbarLogoText}>A</Text></View> : null}
          <View style={styles.topbarTitleGroup}>
            <Text style={styles.topbarTitle}>{activeConfig.title}</Text>
            {!isMobile ? <Text style={styles.topbarSub}>İçerik yönetimi</Text> : null}
          </View>
        </View>

        <View style={styles.topbarRight}>
          {!isMobile ? <Text style={styles.rolePill}>{adminLabel(user.role)}</Text> : null}
          {isMobile ? <Pressable accessibilityRole="button" accessibilityLabel="Öğrenci paneline dön" onPress={goStudent} style={styles.topbarIconButton}><SymbolView name={studentSymbol} tintColor="#ffffff" size={20} style={styles.iconSymbol} /></Pressable> : <Button label="Öğrenci Paneli" size="sm" variant="secondary" left={<SymbolView name={studentSymbol} tintColor={studentTokens.navy} size={15} style={styles.buttonSymbol} />} onPress={goStudent} />}
          <Pressable accessibilityRole="button" accessibilityLabel="Admin çıkış" onPress={onLogout} style={({ pressed }) => [styles.topbarIconButton, pressed ? styles.pressed : null]}>
            <SymbolView name={logoutSymbol} tintColor="#ffffff" size={18} style={styles.iconSymbol} />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        {isDesktop ? (
          <View testID="admin-sidebar" style={[styles.sidebar, collapsed ? styles.sidebarCollapsed : null]}>
            <AdminSidebar collapsed={collapsed} activeModule={activeModule} onModuleChange={onModuleChange} onToggleCollapse={() => setCollapsed((value) => !value)} />
          </View>
        ) : null}

        <ScrollView style={styles.mainScroll} contentContainerStyle={[styles.mainContent, isMobile ? styles.mainContentMobile : null]} showsVerticalScrollIndicator>
          {children}
        </ScrollView>
      </View>

      <NativeModal transparent visible={drawerOpen} animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.drawerOverlay}>
          <Pressable accessibilityRole="button" accessibilityLabel="Admin menüsünü kapat" onPress={() => setDrawerOpen(false)} style={styles.drawerBackdrop} />
          <View testID="admin-mobile-drawer" style={[styles.drawerPanel, isMobile ? styles.drawerPanelMobile : null]}>
            <AdminSidebar collapsed={false} activeModule={activeModule} onModuleChange={onModuleChange} onClose={() => setDrawerOpen(false)} showClose />
          </View>
        </View>
      </NativeModal>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, minHeight: '100%', backgroundColor: '#f5f7fb' },
  topbar: { minHeight: 58, backgroundColor: '#001b48', paddingHorizontal: 18, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)' },
  topbarMobile: { minHeight: 62, paddingHorizontal: 10, gap: 8 },
  topbarLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  topbarLogo: { width: 32, height: 32, borderRadius: 8, backgroundColor: studentTokens.yellow, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  topbarLogoText: { fontFamily: studentFontFamily, color: studentTokens.navy, fontSize: 20, lineHeight: 24, fontWeight: '700' },
  topbarTitleGroup: { flex: 1, minWidth: 0 },
  topbarTitle: { fontFamily: studentFontFamily, color: '#ffffff', fontSize: 18, lineHeight: 23, fontWeight: '700' },
  topbarSub: { fontFamily: studentFontFamily, color: '#cbd7f5', fontSize: 11, lineHeight: 15, fontWeight: '600' },
  topbarRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 9, flexShrink: 0 },
  topbarIconButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rolePill: { fontFamily: studentFontFamily, color: studentTokens.navy, fontSize: 12, lineHeight: 17, fontWeight: '700', backgroundColor: '#eaf7f5', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden' },
  buttonSymbol: { width: 15, height: 15 },
  iconSymbol: { width: 20, height: 20 },
  body: { flex: 1, minHeight: 0, flexDirection: 'row' },
  sidebar: { width: 260, backgroundColor: '#ffffff', borderRightWidth: 1, borderRightColor: '#e0e6f0' },
  sidebarCollapsed: { width: 78 },
  sidebarContent: { flex: 1, paddingHorizontal: 12, paddingVertical: 14, gap: 10 },
  sidebarBrand: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sidebarBrandCollapsed: { justifyContent: 'center' },
  logoMark: { width: 38, height: 38, borderRadius: 10, backgroundColor: studentTokens.yellow, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoText: { fontFamily: studentFontFamily, color: studentTokens.navy, fontSize: 23, lineHeight: 28, fontWeight: '700' },
  brandCopy: { flex: 1, minWidth: 0 },
  brandTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 17, lineHeight: 21, fontWeight: '700' },
  brandSub: { fontFamily: studentFontFamily, color: studentTokens.teal, fontSize: 11, lineHeight: 15, fontWeight: '700', textTransform: 'uppercase' },
  iconButton: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, borderColor: '#e1e6ef', backgroundColor: '#f7f9fc', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sidebarScroll: { flex: 1, minHeight: 0 },
  sidebarList: { gap: 5, paddingBottom: 10 },
  navItem: { minHeight: 50, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 8, borderWidth: 1, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 10 },
  navItemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  navItemActive: { backgroundColor: '#eaf1ff', borderColor: '#dce7ff' },
  navIconBox: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#f2f5fa', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  navIconBoxActive: { backgroundColor: studentTokens.yellow },
  navIcon: { width: 17, height: 17 },
  navCopy: { flex: 1, minWidth: 0 },
  navTitle: { fontFamily: studentFontFamily, color: '#4c556b', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  navTitleActive: { color: studentTokens.navy },
  navDescription: { fontFamily: studentFontFamily, color: '#8790a4', fontSize: 9, lineHeight: 12, fontWeight: '600', marginTop: 1 },
  mainScroll: { flex: 1, minWidth: 0, backgroundColor: '#f5f7fb' },
  mainContent: { width: '100%', maxWidth: 1180, alignSelf: 'center', padding: 20, paddingBottom: 30, gap: 16 },
  mainContentMobile: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 24 },
  drawerOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(8,12,30,0.58)' },
  drawerBackdrop: { flex: 1 },
  drawerPanel: { width: 340, maxWidth: '90%', height: '100%', backgroundColor: '#ffffff' },
  drawerPanelMobile: { width: '88%' },
  pressed: { opacity: 0.72 },
});
