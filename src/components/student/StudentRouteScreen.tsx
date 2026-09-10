import { useEffect, useState, type ReactNode } from 'react';
import { type Href, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudentShell } from '@/components/student/StudentShell';
import { Button, Card, ErrorState, Skeleton, studentTokens } from '@/components/student/ui';
import { getCurrentUser, logoutUser, type AuthUser } from '@/lib/auth';
import { getRemoteCurrentUser, isRemoteAuthEnabled, logoutRemote } from '@/lib/remote-auth';
import { getStudentRouteAccess, type StudentRouteKey } from '@/lib/permissions';
import { studentRouteMeta } from '@/lib/student-routes';

const fontFamily = 'Quicksand';

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

type StudentRouteScreenProps = {
  routeKey: StudentRouteKey;
  children?: (user: AuthUser) => ReactNode;
};

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const lockSymbol = symbolName('lock.fill', 'lock');
const roadmapSymbol = symbolName('map', 'map');

function LoadingPanel() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.loadingShell}>
        <Skeleton lines={4} style={styles.loadingCard} />
      </View>
    </SafeAreaView>
  );
}

function LockedPanel({ routeKey, onPlanAction }: { routeKey: StudentRouteKey; onPlanAction: () => void }) {
  const meta = studentRouteMeta[routeKey];

  return (
    <View style={styles.stateGrid}>
      <Card style={styles.lockedHero}>
        <View style={styles.inlineHead}>
          <View style={styles.lockIcon}>
            <SymbolView name={lockSymbol} tintColor={studentTokens.navy} size={24} style={styles.symbol} />
          </View>
          <View style={styles.inlineCopy}>
            <Text style={styles.kicker}>PREMIUM ERİŞİM</Text>
            <Text style={styles.stateTitle}>{meta.label} Premium plan gerektirir.</Text>
            <Text style={styles.stateText}>Bu route frontend tarafında gizlenmiyor; ortak permission kararı üzerinden kilitleniyor. Backend bağlandığında aynı karar server/session kontrolüyle doğrulanacak.</Text>
          </View>
        </View>
        <Button label="Plan durumunu gör" variant="primary" onPress={onPlanAction} style={styles.stateButton} />
      </Card>
      <ErrorState title="Server guard hazırlığı" text="Şu an demo auth localStorage üzerinde çalışıyor. Gerçek üyelik ve ödeme altyapısı Faz 5'te server verified subscription ile bağlanmalı." />
    </View>
  );
}

function PendingPanel({ routeKey }: { routeKey: StudentRouteKey }) {
  const meta = studentRouteMeta[routeKey];

  return (
    <View style={styles.stateGrid}>
      <Card style={styles.pendingHero}>
        <View style={styles.inlineHead}>
          <View style={styles.roadmapIcon}>
            <SymbolView name={roadmapSymbol} tintColor={studentTokens.navy} size={25} style={styles.symbol} />
          </View>
          <View style={styles.inlineCopy}>
            <Text style={styles.kicker}>{meta.phase.toUpperCase()}</Text>
            <Text style={styles.stateTitle}>{meta.label} ekranı sıradaki fazda geliştirilecek.</Text>
            <Text style={styles.stateText}>{meta.description}</Text>
          </View>
        </View>
      </Card>
      <Card title="Hazır altyapı" eyebrow="Route & permission">
        <View style={styles.checkList}>
          <Text style={styles.checkText}>Route: {meta.href}</Text>
          <Text style={styles.checkText}>Sidebar aktif durumu ve mobile drawer aynı shell üzerinden çalışır.</Text>
          <Text style={styles.checkText}>Free/Premium kararları ortak permission helper ile okunur.</Text>
        </View>
      </Card>
    </View>
  );
}

export function StudentRouteScreen({ routeKey, children }: StudentRouteScreenProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [authResolved, setAuthResolved] = useState(() => !isRemoteAuthEnabled());
  const meta = studentRouteMeta[routeKey];

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
    if (authResolved && !user) router.replace('/login' as Href);
  }, [authResolved, router, user]);

  const handleLogout = () => {
    void logoutRemote();
    logoutUser();
    setUser(null);
    router.replace('/login' as Href);
  };

  const handlePlanAction = () => {
    router.push('/account/subscription' as Href);
  };

  if (!user) {
    return <LoadingPanel />;
  }

  const access = getStudentRouteAccess(user, routeKey);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentShell user={user} activeRoute={routeKey} title={meta.title} subtitle={meta.subtitle} onLogout={handleLogout}>
        {access.allowed ? children?.(user) ?? <PendingPanel routeKey={routeKey} /> : <LockedPanel routeKey={routeKey} onPlanAction={handlePlanAction} />}
      </StudentShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: studentTokens.navy },
  loadingShell: { flex: 1, backgroundColor: studentTokens.page, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingCard: { width: '100%', maxWidth: 520 },
  stateGrid: { gap: 18 },
  pendingHero: { backgroundColor: '#ffffff' },
  lockedHero: { backgroundColor: studentTokens.yellowSoft, borderColor: '#f3dfa3' },
  inlineHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  inlineCopy: { flex: 1, minWidth: 0 },
  roadmapIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: studentTokens.yellow, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  lockIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: studentTokens.yellow, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  symbol: { width: 25, height: 25 },
  kicker: { fontFamily: fontFamily, color: studentTokens.teal, fontSize: 12, lineHeight: 17, fontWeight: '700', marginBottom: 8 },
  stateTitle: { fontFamily: fontFamily, color: studentTokens.ink, fontSize: 28, lineHeight: 35, fontWeight: '700', flexShrink: 1 },
  stateText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 15, lineHeight: 24, fontWeight: '600', marginTop: 8, maxWidth: 780, flexShrink: 1 },
  stateButton: { alignSelf: 'flex-start', marginTop: 20 },
  checkList: { gap: 10 },
  checkText: { fontFamily: fontFamily, color: studentTokens.text, fontSize: 14, lineHeight: 22, fontWeight: '700' },
});
