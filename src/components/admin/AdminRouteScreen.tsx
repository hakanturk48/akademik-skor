import { useEffect, useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminPanel } from '@/components/admin/AdminPanel';
import { adminLabel } from '@/lib/admin/labels';
import { Button, Card, Skeleton, studentFontFamily, studentTokens } from '@/components/student/ui';
import { getAdminAccessDecision, requireAdminRole } from '@/lib/admin';
import { getCurrentUser, logoutUser, type AuthUser } from '@/lib/auth';
import { getRemoteCurrentUser, isRemoteAuthEnabled, logoutRemote } from '@/lib/remote-auth';

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const shieldSymbol = symbolName('shield.lefthalf.filled', 'admin_panel_settings');

function LoadingPanel() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.loadingShell}>
        <Skeleton lines={4} style={styles.loadingCard} />
      </View>
    </SafeAreaView>
  );
}

function AccessDeniedPanel({ user, reason, onDashboard, onLogout, isLoggingOut }: { user: AuthUser; reason: string; onDashboard: () => void; onLogout: () => void; isLoggingOut: boolean }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View testID="admin-access-denied" style={styles.accessShell}>
        <Card style={styles.accessCard} contentStyle={styles.accessBody}>
          <View style={styles.accessIcon}>
            <SymbolView name={shieldSymbol} tintColor={studentTokens.navy} size={27} style={styles.accessSymbol} />
          </View>
          <View style={styles.accessCopy}>
            <Text style={styles.kicker}>YÖNETİCİ YETKİSİ GEREKLİ</Text>
            <Text style={styles.accessTitle}>Admin paneline erişim kapalı.</Text>
            <Text style={styles.accessText}>{reason}</Text>
            <Text style={styles.accessMeta}>Kullanıcı: {user.name} · rol: {adminLabel(user.role)}</Text>
          </View>
          <View style={styles.accessActions}>
            <Button label="Öğrenci paneline dön" onPress={onDashboard} style={styles.accessButton} />
            <Button label="Çıkış yap" variant="secondary" onPress={onLogout} disabled={isLoggingOut} loading={isLoggingOut} style={styles.accessButton} />
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

export function AdminRouteScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [authResolved, setAuthResolved] = useState(() => !isRemoteAuthEnabled());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const access = getAdminAccessDecision(user);
  const verifiedAdmin = useMemo(() => (access.allowed ? requireAdminRole(user) : null), [access.allowed, user]);

  useEffect(() => {
    let active = true;
    const restoreRemoteSession = async () => {
      if (isRemoteAuthEnabled()) {
        const remoteUser = await getRemoteCurrentUser();
        if (active && remoteUser) setUser(remoteUser);
      }
      if (active) setAuthResolved(true);
    };
    void restoreRemoteSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (authResolved && !user && !isLoggingOut) router.replace('/login?next=/admin' as Href);
  }, [authResolved, isLoggingOut, router, user]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutRemote();
    } catch {
      // Local session cleanup still lets the user leave when the remote request fails.
    }
    logoutUser();
    setUser(null);
    router.replace('/login?next=/admin' as Href);
  };

  if (!user) {
    return <LoadingPanel />;
  }

  if (!access.allowed || !verifiedAdmin) {
    return (
      <AccessDeniedPanel
        user={user}
        reason={access.reason ?? 'Admin rolü doğrulanamadı.'}
        onDashboard={() => router.replace('/dashboard' as Href)}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    );
  }

  return (
    <SafeAreaView testID="admin-route-guard" style={styles.safeArea}>
      <AdminPanel user={verifiedAdmin} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: studentTokens.navy },
  loadingShell: { flex: 1, backgroundColor: studentTokens.page, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingCard: { width: '100%', maxWidth: 520 },
  accessShell: { flex: 1, backgroundColor: studentTokens.page, alignItems: 'center', justifyContent: 'center', padding: 20 },
  accessCard: { width: '100%', maxWidth: 560 },
  accessBody: { alignItems: 'flex-start', gap: 16 },
  accessIcon: { width: 58, height: 58, borderRadius: 19, backgroundColor: studentTokens.yellow, alignItems: 'center', justifyContent: 'center' },
  accessSymbol: { width: 27, height: 27 },
  accessCopy: { gap: 7 },
  kicker: { fontFamily: studentFontFamily, color: studentTokens.teal, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  accessTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 28, lineHeight: 35, fontWeight: '700' },
  accessText: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 15, lineHeight: 23, fontWeight: '500' },
  accessMeta: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  accessActions: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  accessButton: { minWidth: 160 },
});
