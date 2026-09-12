import { useEffect, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCurrentUser, registerUser, requestEmailVerification, verifyEmailCode, type AuthRole } from '@/lib/auth';
import { getRemoteCurrentUser, isRemoteAuthEnabled, registerRemote } from '@/lib/remote-auth';

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
  success: '#007d73',
};

const fontFamily = 'Quicksand';

type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

type RoleOption = {
  label: string;
  value: AuthRole;
  detail: string;
};

type MessageTone = 'error' | 'success';

const symbolName = (ios: string, web: string): AppSymbolName => ({ ios: ios as SFSymbol, android: web as AndroidSymbol, web: web as AndroidSymbol });
const arrowSymbol = symbolName('arrow.right', 'arrow_forward');
const registerSymbol = symbolName('person.badge.plus', 'person_add');
const mailSymbol = symbolName('envelope', 'mail');
const eyeSymbol = symbolName('eye', 'visibility');
const eyeOffSymbol = symbolName('eye.slash', 'visibility_off');

const roleOptions: RoleOption[] = [
  { label: 'Öğrenci', value: 'student', detail: 'Kişisel hedef, ders ve beceri takibi' },
  { label: 'Öğretmen', value: 'teacher', detail: 'Öğrenci listesi, ödev ve geri bildirim takibi' },
  { label: 'Kurum', value: 'institution', detail: 'Sınıf, grup ve kurum raporlama alanı' },
];

function PasswordField({
  label,
  value,
  visible,
  onChangeText,
  onToggleVisible,
  placeholder,
}: {
  label: string;
  value: string;
  visible: boolean;
  onChangeText: (text: string) => void;
  onToggleVisible: () => void;
  placeholder: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordBox}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder={placeholder}
          placeholderTextColor={palette.muted}
          style={styles.passwordInput}
        />
        <Pressable
          accessibilityLabel={visible ? `${label} alanını gizle` : `${label} alanını göster`}
          accessibilityRole="button"
          onPress={onToggleVisible}
          style={({ pressed }) => [styles.eyeButton, pressed ? styles.pressed : null]}
        >
          <SymbolView name={visible ? eyeOffSymbol : eyeSymbol} tintColor={palette.text} size={21} style={styles.eyeIcon} />
        </Pressable>
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [goal, setGoal] = useState('TOEFL iBT 90 hedefi');
  const [role, setRole] = useState<AuthRole>('student');
  const [verificationCode, setVerificationCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<MessageTone>('error');
  const [confirmationPending, setConfirmationPending] = useState(false);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      const user = isRemoteAuthEnabled() ? await getRemoteCurrentUser() : getCurrentUser();
      if (active && user) router.replace('/dashboard' as Href);
    };
    void restoreSession();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (!confirmationPending) return;

    const timeout = setTimeout(() => router.replace('/login' as Href), 5000);
    return () => clearTimeout(timeout);
  }, [confirmationPending, router]);

  const normalizedEmail = email.trim().toLowerCase();
  const emailIsVerified = Boolean(verifiedEmail) && verifiedEmail === normalizedEmail;

  const showMessage = (nextMessage: string, tone: MessageTone = 'error') => {
    setMessage(nextMessage);
    setMessageTone(tone);
  };

  const validateDraft = () => {
    if (name.trim().length < 2) {
      return 'Lütfen ad soyad bilgisini girin.';
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return 'Geçerli bir e-posta adresi girin.';
    }

    if (password.trim().length < 6) {
      return 'Şifre en az 6 karakter olmalı.';
    }

    if (password.trim() !== confirmPassword.trim()) {
      return 'Şifreler birbiriyle aynı olmalı.';
    }

    return '';
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setVerifiedEmail('');
    setDemoCode('');
    setVerificationCode('');
  };

  const handleRequestVerification = () => {
    const validationMessage = validateDraft();
    if (validationMessage) {
      showMessage(validationMessage);
      return;
    }

    const result = requestEmailVerification(email);
    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    setDemoCode(result.code);
    setVerificationCode('');
    setVerifiedEmail('');
    showMessage(`Demo doğrulama kodu: ${result.code}`, 'success');
  };

  const handleVerifyEmail = () => {
    const result = verifyEmailCode(email, verificationCode);
    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    setVerifiedEmail(normalizedEmail);
    showMessage('E-posta doğrulandı. Üyeliği oluşturabilirsiniz.', 'success');
  };

  const handleRegister = async () => {
    const validationMessage = validateDraft();
    if (validationMessage) {
      showMessage(validationMessage);
      return;
    }

    if (isRemoteAuthEnabled()) {
      try {
        const result = await registerRemote({ name, email, password, goal, role: role === 'admin' ? 'student' : role });
        if (!result.ok) {
          const emailConfirmationPending = result.message.startsWith('Hesabınız oluşturuldu.');
          if (emailConfirmationPending) {
            setConfirmationPending(true);
            setMessage('');
            return;
          }
          showMessage(result.message);
          return;
        }
        setMessage('');
        router.replace('/dashboard' as Href);
        return;
      } catch {
        showMessage('Üyelik oluşturulamadı. Lütfen bağlantınızı kontrol edin.');
        return;
      }
    }

    if (!emailIsVerified) {
      showMessage('Üyeliği oluşturmak için e-postanızı doğrulayın.');
      return;
    }

    const result = registerUser({ name, email, password, goal, role });
    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    setMessage('');
    router.replace('/dashboard' as Href);
  };

  if (confirmationPending) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.confirmationPage}>
          <View style={styles.confirmationCard}>
            <View style={styles.confirmationIcon}>
              <SymbolView name={mailSymbol} tintColor={palette.teal} size={28} style={styles.confirmationIconSymbol} />
            </View>
            <Text style={styles.confirmationTitle}>Hesabınız oluşturuldu.</Text>
            <Text style={styles.confirmationText}>
              E-posta adresinize gelen doğrulama bağlantısını açtıktan sonra giriş yapabilirsiniz.
            </Text>
            <Text style={styles.confirmationCountdown}>
              5 saniye içinde giriş ekranına yönlendirileceksiniz.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
              <Text style={styles.kicker}>ÜYELİK OLUŞTUR</Text>
              <Text style={styles.introTitle}>Hedefinize göre kişisel çalışma alanınızı hazırlayın.</Text>
              <Text style={styles.introText}>Kullanım türünüz panelin çalışma mantığını belirler: öğrenci bireysel plan, öğretmen takip ve geri bildirim, kurum ise grup raporlama alanına yönlenir.</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHead}>
              <View style={styles.formIcon}>
                <SymbolView name={registerSymbol} tintColor={palette.navy} size={25} style={styles.formIconSymbol} />
              </View>
              <View style={styles.formTitleGroup}>
                <Text style={styles.formTitle}>Ücretsiz üye ol</Text>
                <Text style={styles.formSubtitle}>{isRemoteAuthEnabled() ? 'E-posta doğrulamasıyla kalıcı hesabınızı oluşturun.' : 'E-postanızı doğrulayarak demo paneli kullanmaya başlayın.'}</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Ad Soyad</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Adınız Soyadınız" placeholderTextColor={palette.muted} style={styles.input} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput value={email} onChangeText={handleEmailChange} autoCapitalize="none" keyboardType="email-address" placeholder="ornek@eposta.com" placeholderTextColor={palette.muted} style={styles.input} />
            </View>

            <PasswordField
              label="Şifre"
              value={password}
              visible={showPassword}
              onChangeText={setPassword}
              onToggleVisible={() => setShowPassword((value) => !value)}
              placeholder="En az 6 karakter"
            />

            <PasswordField
              label="Şifre tekrar"
              value={confirmPassword}
              visible={showConfirmPassword}
              onChangeText={setConfirmPassword}
              onToggleVisible={() => setShowConfirmPassword((value) => !value)}
              placeholder="Şifrenizi tekrar girin"
            />

            {!isRemoteAuthEnabled() ? (<>
            <View style={styles.verificationBox}>
              <View style={styles.verificationHead}>
                <View style={styles.verificationCopy}>
                  <Text style={styles.label}>E-posta doğrulama</Text>
                  <Text style={styles.verificationText}>{emailIsVerified ? 'Bu e-posta doğrulandı.' : 'Kod gönderip üyelikten önce doğrulayın.'}</Text>
                </View>
                {emailIsVerified ? <Text style={styles.verifiedBadge}>Doğrulandı</Text> : null}
              </View>
              <View style={styles.codeRow}>
                <TextInput
                  value={verificationCode}
                  onChangeText={(value) => setVerificationCode(value.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  placeholder="6 haneli kod"
                  placeholderTextColor={palette.muted}
                  style={[styles.input, styles.codeInput]}
                />
                <Pressable accessibilityRole="button" onPress={handleRequestVerification} style={({ pressed }) => [styles.codeButton, pressed ? styles.pressed : null]}>
                  <Text style={styles.codeButtonText}>{demoCode ? 'Tekrar Gönder' : 'Kod Gönder'}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={handleVerifyEmail} style={({ pressed }) => [styles.verifyButton, pressed ? styles.pressed : null]}>
                  <Text style={styles.verifyButtonText}>Doğrula</Text>
                </Pressable>
              </View>
            </View>
            </>) : null}


            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Hedef / kullanım notu</Text>
              <TextInput value={goal} onChangeText={setGoal} placeholder="TOEFL iBT hedefiniz" placeholderTextColor={palette.muted} style={styles.input} />
            </View>

            <View style={styles.roleGroup}>
              <Text style={styles.label}>Kullanım türü</Text>
              <View style={styles.roleGrid}>
                {roleOptions.map((item) => {
                  const selected = role === item.value;
                  return (
                    <Pressable key={item.value} accessibilityRole="button" onPress={() => setRole(item.value)} style={({ pressed }) => [styles.roleCard, selected ? styles.roleCardSelected : null, pressed ? styles.pressed : null]}>
                      <Text style={[styles.roleLabel, selected ? styles.roleLabelSelected : null]}>{item.label}</Text>
                      <Text style={[styles.roleDetail, selected ? styles.roleDetailSelected : null]}>{item.detail}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {message ? <Text style={[styles.feedbackText, messageTone === 'success' ? styles.successText : styles.errorText]}>{message}</Text> : null}

            <Pressable accessibilityRole="button" onPress={handleRegister} style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}>
              <Text style={styles.primaryButtonText}>Üyeliği Oluştur</Text>
              <SymbolView name={arrowSymbol} tintColor={palette.navy} size={18} style={styles.buttonIcon} />
            </Pressable>

            <View style={styles.switchBox}>
              <Text style={styles.switchText}>Zaten hesabınız var mı?</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/login' as Href)} style={({ pressed }) => [styles.linkButton, pressed ? styles.pressed : null]}>
                <Text style={styles.linkText}>Giriş yap</Text>
              </Pressable>
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
  introPanel: { flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 280, maxWidth: 540, alignSelf: 'flex-start', borderRadius: 12, backgroundColor: palette.navySoft, padding: 28, justifyContent: 'flex-start', gap: 34 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'flex-start' },
  logoMark: { width: 46, height: 46, borderRadius: 9, backgroundColor: palette.yellow, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: fontFamily, color: palette.navy, fontSize: 25, lineHeight: 30, fontWeight: '700' },
  brandCopy: { minWidth: 0 },
  brandTitle: { fontFamily: fontFamily, color: '#ffffff', fontSize: 22, lineHeight: 27, fontWeight: '700' },
  brandSub: { fontFamily: fontFamily, color: '#dfe2f1', fontSize: 14, lineHeight: 19, fontWeight: '700' },
  introCopy: { maxWidth: 480 },
  kicker: { fontFamily: fontFamily, color: palette.yellow, fontSize: 13, lineHeight: 18, fontWeight: '700', marginBottom: 12 },
  introTitle: { fontFamily: fontFamily, color: '#ffffff', fontSize: 34, lineHeight: 41, fontWeight: '700', flexShrink: 1 },
  introText: { fontFamily: fontFamily, color: '#eef1fb', fontSize: 14, lineHeight: 22, fontWeight: '600', marginTop: 12, flexShrink: 1 },
  formCard: { flexGrow: 0, flexShrink: 1, flexBasis: 520, width: 520, maxWidth: '100%', alignSelf: 'flex-start', borderRadius: 12, backgroundColor: palette.surface, padding: 22, justifyContent: 'center', shadowColor: '#000000', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  formHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  formIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.yellow, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  formIconSymbol: { width: 25, height: 25 },
  formTitleGroup: { flex: 1, minWidth: 0 },
  formTitle: { fontFamily: fontFamily, color: palette.ink, fontSize: 24, lineHeight: 30, fontWeight: '700' },
  formSubtitle: { fontFamily: fontFamily, color: palette.text, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  fieldGroup: { gap: 6, marginBottom: 9 },
  label: { fontFamily: fontFamily, color: palette.ink, fontSize: 12, lineHeight: 16, fontWeight: '700' },
  input: { fontFamily: fontFamily, minHeight: 42, borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: '#fbfbf8', paddingHorizontal: 12, color: palette.ink, fontSize: 14, lineHeight: 20, fontWeight: '600', outlineStyle: 'none' as never },
  passwordBox: { minHeight: 42, borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: '#fbfbf8', flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  passwordInput: { fontFamily: fontFamily, flex: 1, minWidth: 0, minHeight: 40, borderWidth: 0, paddingLeft: 12, paddingRight: 8, color: palette.ink, fontSize: 14, lineHeight: 20, fontWeight: '600', outlineStyle: 'none' as never },
  eyeButton: { width: 42, height: 40, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  eyeIcon: { width: 19, height: 19 },
  verificationBox: { borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: '#fbfbf8', padding: 10, gap: 8, marginBottom: 9 },
  verificationHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  verificationCopy: { flex: 1, minWidth: 0, gap: 3 },
  verificationText: { fontFamily: fontFamily, color: palette.text, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  verifiedBadge: { fontFamily: fontFamily, color: palette.success, backgroundColor: '#e8f7f5', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, lineHeight: 14, fontWeight: '700' },
  codeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'stretch' },
  codeInput: { flex: 1, minWidth: 128, marginBottom: 0 },
  codeButton: { minHeight: 42, minWidth: 108, borderRadius: 8, backgroundColor: palette.navy, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  codeButtonText: { fontFamily: fontFamily, color: '#ffffff', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  verifyButton: { minHeight: 42, minWidth: 86, borderRadius: 8, borderWidth: 1, borderColor: palette.teal, backgroundColor: '#ffffff', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  verifyButtonText: { fontFamily: fontFamily, color: palette.teal, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  roleGroup: { gap: 8, marginBottom: 10 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleGridMobile: { flexDirection: 'column' },
  roleCard: { flex: 1, minWidth: 130, borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: '#fbfbf8', paddingHorizontal: 10, paddingVertical: 8 },
  roleCardSelected: { borderColor: palette.teal, backgroundColor: '#e8f7f5' },
  roleLabel: { fontFamily: fontFamily, color: palette.ink, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  roleLabelSelected: { color: palette.teal },
  roleDetail: { fontFamily: fontFamily, color: palette.text, fontSize: 11, lineHeight: 16, fontWeight: '600', marginTop: 2 },
  roleDetailSelected: { color: palette.ink },
  feedbackText: { fontFamily: fontFamily, fontSize: 12, lineHeight: 18, fontWeight: '700', marginBottom: 9 },
  errorText: { color: palette.danger },
  successText: { color: palette.success },
  primaryButton: { minHeight: 46, borderRadius: 8, backgroundColor: palette.yellow, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2 },
  primaryButtonText: { fontFamily: fontFamily, color: palette.navy, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  buttonIcon: { width: 18, height: 18 },
  switchBox: { marginTop: 12, borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  switchText: { fontFamily: fontFamily, color: palette.text, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  linkButton: { paddingVertical: 2 },
  linkText: { fontFamily: fontFamily, color: palette.teal, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  confirmationPage: { flex: 1, padding: 22, alignItems: 'center', justifyContent: 'center' },
  confirmationCard: { width: '100%', maxWidth: 520, borderRadius: 12, backgroundColor: palette.surface, padding: 32, alignItems: 'center', gap: 14, shadowColor: '#000000', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  confirmationIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e8f7f5', alignItems: 'center', justifyContent: 'center' },
  confirmationIconSymbol: { width: 28, height: 28 },
  confirmationTitle: { fontFamily: fontFamily, color: palette.ink, fontSize: 28, lineHeight: 34, fontWeight: '700', textAlign: 'center' },
  confirmationText: { fontFamily: fontFamily, color: palette.text, fontSize: 15, lineHeight: 23, fontWeight: '600', textAlign: 'center' },
  confirmationCountdown: { fontFamily: fontFamily, color: palette.muted, fontSize: 13, lineHeight: 20, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  pressed: { opacity: 0.72 },
});

