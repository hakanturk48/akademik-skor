import { useEffect, useState, useSyncExternalStore } from 'react';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createLocalAdminAccount, getCurrentUser, getLocalAdminSetupState, getPostLoginRoute, loginUser } from '@/lib/auth';
import { getRemoteCurrentUser, isRemoteAuthEnabled, loginRemote } from '@/lib/remote-auth';

const palette = {
  ink: '#20233a',
  text: '#565d70',
  muted: '#7a8092',
  page: '#f6f6f3',
  surface: '#ffffff',
  navy: '#24263f',
  navySoft: '#373a5b',
  yellow: '#f4c431',
  teal: '#007d73',
  line: '#dddeda',
  danger: '#b42318',
};

const fontFamily = 'Quicksand';

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const arrowSymbol = symbolName('arrow.right', 'arrow_forward');
const loginSymbol = symbolName('rectangle.portrait.and.arrow.right', 'login');
const eyeSymbol = symbolName('eye', 'visibility');
const eyeOffSymbol = symbolName('eye.slash', 'visibility_off');

const subscribeToLocalAccounts = (onChange: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};
const localSetupSnapshot = () => JSON.stringify(isRemoteAuthEnabled() ? { available: false, message: 'Merkezi üyelik aktif. Admin hesabı Supabase üzerinden yetkilendirilir.' } : getLocalAdminSetupState());
const serverSetupSnapshot = () => '{"available":false,"message":""}';
function getAuthErrorMessage() {
  if (typeof window === 'undefined' || !window.location.hash) return '';
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const errorCode = hashParams.get('error_code') ?? hashParams.get('error');
  if (!errorCode) return '';
  return errorCode === 'otp_expired'
    ? 'Doğrulama bağlantısı geçersiz veya süresi dolmuş. Kayıt ekranından yeni bir doğrulama e-postası isteyin.'
    : 'E-posta doğrulaması tamamlanamadı. Lütfen yeni bir doğrulama bağlantısı isteyin.';
}

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const isAdminLogin = params.next === '/admin';
  const [setupRequested, setIsSetup] = useState(false);
  const isSetup = isAdminLogin && setupRequested;
  const [name, setName] = useState('');
  const setup: ReturnType<typeof getLocalAdminSetupState> = JSON.parse(useSyncExternalStore(subscribeToLocalAccounts, localSetupSnapshot, serverSetupSnapshot));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(getAuthErrorMessage);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      const user = isRemoteAuthEnabled() ? await getRemoteCurrentUser() : getCurrentUser();
      if (active && user) {
        router.replace(getPostLoginRoute(user, isAdminLogin ? '/admin' : undefined) as Href);
      }
    };
    void restoreSession();
    return () => { active = false; };
  }, [router, isAdminLogin]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) return;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (!hashParams.get('error_code') && !hashParams.get('error')) return;
    window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
  }, []);
  const handleLogin = async () => {
    let result;
    try {
      result = isAdminLogin && isSetup
        ? createLocalAdminAccount({ name, email, password })
        : isRemoteAuthEnabled()
          ? await loginRemote(email, password)
          : loginUser(email, password);
    } catch {
      setMessage('Giriş tamamlanamadı. Lütfen bağlantınızı ve hesap bilgilerinizi kontrol edin.');
      return;
    }
    if (!result.ok) {
      setMessage(result.message);
      if (!isRemoteAuthEnabled() && !getLocalAdminSetupState().available) setIsSetup(false);
      return;
    }

    setMessage('');
    router.replace(getPostLoginRoute(result.user, isAdminLogin ? '/admin' : undefined) as Href);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View testID="auth-shell" style={styles.authShell}>
          <View style={styles.introPanel}>
            <Pressable accessibilityRole="button" onPress={() => router.push('/')} style={({ pressed }) => [styles.brand, pressed ? styles.pressed : null]}>
              <View style={styles.logoMark}>
                <Text style={styles.logoText}>A</Text>
              </View>
              <View style={styles.brandCopy}>
                <Text style={styles.brandTitle}>Akademik Skor</Text>
                <Text style={styles.brandSub}>TOEFL Style Prep</Text>
              </View>
            </Pressable>

            <View style={styles.introCopy}>
              <Text style={styles.kicker}>{isAdminLogin ? 'ADMİN PANELİ' : 'ÖĞRENCİ PANELİ'}</Text>
              <Text style={styles.introTitle}>{isAdminLogin ? 'İçeriklerinizi ve yayınlarınızı yönetin.' : 'Çalışma planınıza kaldığınız yerden devam edin.'}</Text>
              <Text style={styles.introText}>{isAdminLogin ? 'Yetkili hesabınızla dersleri, taslakları ve sürüm geçmişini açın.' : 'Video dersler, speaking kayıtları, writing geri bildirimleri ve kişisel çalışma önerileri giriş yaptıktan sonra tek panelde toplanır.'}</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHead}>
              <View style={styles.formIcon}>
                <SymbolView name={loginSymbol} tintColor={palette.navy} size={25} style={styles.formIconSymbol} />
              </View>
              <View style={styles.formTitleGroup}>
              <Text style={styles.formTitle}>{isSetup ? 'Yerel admin kurulumu' : isAdminLogin ? 'Admin girişi' : 'Giriş yap'}</Text>
              <Text style={styles.formSubtitle}>{isSetup ? 'Yalnızca yerel geliştirme hesabı oluşturun.' : isRemoteAuthEnabled() ? 'Kalıcı hesabınızla güvenli şekilde giriş yapın.' : isAdminLogin ? 'Admin yetkili hesabınızla giriş yapın.' : 'Akademik Skor hesabınıza erişin.'}</Text>
              </View>
            </View>

            {isSetup ? <View style={styles.fieldGroup}>
              <Text style={styles.label}>Ad Soyad</Text>
              <TextInput accessibilityLabel="Ad Soyad" value={name} onChangeText={setName} placeholder="Adınız ve soyadınız" style={styles.input} />
            </View> : null}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                accessibilityLabel="E-posta"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="ornek@eposta.com"
                placeholderTextColor={palette.muted}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Şifre</Text>
              <View style={styles.passwordBox}>
                <TextInput
                  accessibilityLabel="Şifre"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder={isSetup ? 'En az 12 karakter' : 'Şifreniz'}
                  placeholderTextColor={palette.muted}
                  style={styles.passwordInput}
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  accessibilityLabel={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  accessibilityRole="button"
                  onPress={() => setShowPassword((value) => !value)}
                  style={({ pressed }) => [styles.eyeButton, pressed ? styles.pressed : null]}
                >
                  <SymbolView name={showPassword ? eyeOffSymbol : eyeSymbol} tintColor={palette.text} size={21} style={styles.eyeIcon} />
                </Pressable>
              </View>
            </View>

            {message ? <Text accessibilityRole="alert" style={styles.errorText}>{message}</Text> : null}

            <Pressable accessibilityRole="button" accessibilityLabel={isSetup ? 'Yerel Admin Hesabı Oluştur' : isAdminLogin ? 'Admin Paneline Giriş Yap' : 'Panele Giriş Yap'} onPress={handleLogin} style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}>
              <Text style={styles.primaryButtonText}>{isSetup ? 'Yerel Admin Hesabı Oluştur' : isAdminLogin ? 'Admin Paneline Giriş Yap' : 'Panele Giriş Yap'}</Text>
              <SymbolView name={arrowSymbol} tintColor={palette.navy} size={18} style={styles.buttonIcon} />
            </Pressable>

            <View style={styles.switchBox}>
              {isAdminLogin ? <>
                <Text style={styles.switchText}>{isSetup ? 'Zaten bir admin hesabınız var mı?' : setup.message}</Text>
                {isSetup || setup.available ? <Pressable accessibilityRole="button" onPress={() => { setIsSetup(!isSetup); setMessage(''); setPassword(''); }} style={styles.linkButton}>
                  <Text style={styles.linkText}>{isSetup ? 'Admin girişine dön' : 'İlk yerel admin hesabını oluştur'}</Text>
                </Pressable> : null}
                <Pressable accessibilityRole="button" onPress={() => router.replace('/login' as Href)} style={styles.linkButton}><Text style={styles.linkText}>Öğrenci girişine dön</Text></Pressable>
              </> : <>
              <Text style={styles.switchText}>Henüz hesabınız yok mu?</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/register' as Href)} style={({ pressed }) => [styles.linkButton, pressed ? styles.pressed : null]}>
                <Text style={styles.linkText}>Ücretsiz üye ol</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.replace('/login?next=/admin' as Href)} style={styles.linkButton}><Text style={styles.linkText}>Admin girişi</Text></Pressable>
              </>}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.navy },
  scroll: { flex: 1, backgroundColor: palette.navy },
  page: { minHeight: '100%', paddingHorizontal: 22, paddingVertical: 28, alignItems: 'center', justifyContent: 'flex-start' },

  authShell: { width: '100%', maxWidth: 1120, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center', gap: 20 },

  introPanel: { flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 540, alignSelf: 'flex-start', borderRadius: 12, backgroundColor: palette.navySoft, padding: 28, justifyContent: 'flex-start', gap: 34, overflow: 'hidden' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'flex-start' },
  logoMark: { width: 46, height: 46, borderRadius: 9, backgroundColor: palette.yellow, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: fontFamily, color: palette.navy, fontSize: 25, lineHeight: 30, fontWeight: '700' },
  brandCopy: { minWidth: 0, flexShrink: 1 },
  brandTitle: { fontFamily: fontFamily, color: '#ffffff', fontSize: 22, lineHeight: 27, fontWeight: '700' },
  brandSub: { fontFamily: fontFamily, color: '#dfe2f1', fontSize: 14, lineHeight: 19, fontWeight: '700' },
  introCopy: { maxWidth: 480 },
  kicker: { fontFamily: fontFamily, color: palette.yellow, fontSize: 13, lineHeight: 18, fontWeight: '700', marginBottom: 12 },
  introTitle: { fontFamily: fontFamily, color: '#ffffff', fontSize: 34, lineHeight: 41, fontWeight: '700', flexShrink: 1 },
  introText: { fontFamily: fontFamily, color: '#eef1fb', fontSize: 14, lineHeight: 22, fontWeight: '500', marginTop: 12, flexShrink: 1 },
  formCard: { flexGrow: 0, flexShrink: 1, flexBasis: 430, width: 430, maxWidth: '100%', alignSelf: 'flex-start', borderRadius: 12, backgroundColor: palette.surface, padding: 24, justifyContent: 'center', shadowColor: '#000000', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  formHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  formIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.yellow, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  formIconSymbol: { width: 25, height: 25 },
  formTitleGroup: { flex: 1, minWidth: 0 },
  formTitle: { fontFamily: fontFamily, color: palette.ink, fontSize: 29, lineHeight: 36, fontWeight: '700' },
  formSubtitle: { fontFamily: fontFamily, color: palette.text, fontSize: 14, lineHeight: 21, fontWeight: '400' },
  fieldGroup: { gap: 7, marginBottom: 14 },
  label: { fontFamily: fontFamily, color: palette.ink, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  input: { fontFamily: fontFamily, minHeight: 50, borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: '#fbfbf8', paddingHorizontal: 14, color: palette.ink, fontSize: 15, lineHeight: 21, fontWeight: '400', outlineStyle: 'none' as never },
  passwordBox: { minHeight: 50, borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: '#fbfbf8', flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  passwordInput: { fontFamily: fontFamily, flex: 1, minWidth: 0, minHeight: 48, borderWidth: 0, paddingLeft: 14, paddingRight: 8, color: palette.ink, fontSize: 15, lineHeight: 21, fontWeight: '400', outlineStyle: 'none' as never },
  eyeButton: { width: 46, height: 48, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  eyeIcon: { width: 21, height: 21 },
  errorText: { fontFamily: fontFamily, color: palette.danger, fontSize: 13, lineHeight: 19, fontWeight: '700', marginBottom: 12 },
  primaryButton: { minHeight: 52, borderRadius: 8, backgroundColor: palette.yellow, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 4 },
  primaryButtonText: { fontFamily: fontFamily, color: palette.navy, fontSize: 15, lineHeight: 21, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  buttonIcon: { width: 18, height: 18 },
  switchBox: { marginTop: 18, borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  switchText: { fontFamily: fontFamily, color: palette.text, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  linkButton: { minHeight: 44, justifyContent: 'center', paddingVertical: 6 },
  linkText: { fontFamily: fontFamily, color: palette.teal, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});