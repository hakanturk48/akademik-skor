import { Image } from 'expo-image';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const skills = [
  {
    short: 'R',
    title: 'Reading',
    score: '5.0',
    text: 'Akademik pasaj, çıkarım soruları, bağlamdan kelime ve açıklamalı çözüm.',
  },
  {
    short: 'L',
    title: 'Listening',
    score: '4.5',
    text: 'Ders anlatımı, kampüs diyaloğu, not alma ve transkript üzerinden analiz.',
  },
  {
    short: 'S',
    title: 'Speaking',
    score: '3.5',
    text: 'Mikrofon kaydı, otomatik transkript, akıcılık ve telaffuz geri bildirimi.',
  },
  {
    short: 'W',
    title: 'Writing',
    score: '4.0',
    text: 'Rubrik bazlı skor, cümle düzeltme, daha akademik ifade önerileri.',
  },
];

const programs = [
  'TOEFL tarzı sınav hazırlığı',
  'Akademik writing geliştirme',
  'Speaking ve telaffuz pratiği',
  'Okullar için öğretmen paneli',
];

const resources = [
  'Ücretsiz seviye testi',
  'Haftalık çalışma planı',
  'Hata defteri',
  'Mini deneme sınavı',
  'Türkçe açıklamalı çözümler',
  'AI koç raporu',
];

const steps = [
  { number: '01', title: 'Ölç', text: 'Kısa tanı testiyle öğrencinin başlangıç skoru ve zayıf becerileri belirlenir.' },
  { number: '02', title: 'Planla', text: 'Hedef skor, sınav tarihi ve günlük süreye göre kişisel çalışma yolu açılır.' },
  { number: '03', title: 'Çalış', text: 'Her gün okuma, dinleme, konuşma, yazma ve kelime tekrarları tek ekranda verilir.' },
  { number: '04', title: 'Düzelt', text: 'AI koç yanlışları Türkçe açıklar, hata defterine işler ve tekrar planlar.' },
];

const palette = {
  ink: '#10231f',
  muted: '#5b6c66',
  cream: '#f7f3e8',
  paper: '#fffdf7',
  sea: '#006c61',
  seaDark: '#063e39',
  seaSoft: '#dff2ed',
  blue: '#245d85',
  blueSoft: '#e1edf4',
  amber: '#c98321',
  amberSoft: '#fff0ca',
  rose: '#b45757',
  roseSoft: '#ffe4e4',
  line: '#d8ded8',
  darkBand: '#073d38',
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 980;
  const isTablet = width >= 720;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.noticeBar}>
          <Text style={styles.noticeText}>Yeni: AI destekli speaking ve writing değerlendirme sistemi hazırlanıyor.</Text>
        </View>

        <View style={styles.headerShell}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>A</Text>
              </View>
              <View>
                <Text style={styles.brandName}>Akademik Skor</Text>
                <Text style={styles.brandSub}>Academic English Prep</Text>
              </View>
            </View>

            {isTablet ? (
              <View style={styles.searchBox}>
                <Text style={styles.searchText}>Program, beceri veya konu ara</Text>
              </View>
            ) : null}

            <View style={styles.headerActions}>
              <Pressable accessibilityRole="button" style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
                <Text style={styles.loginButtonText}>Giriş</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>Ücretsiz Başla</Text>
              </Pressable>
            </View>
          </View>

          {isTablet ? (
            <View style={styles.navRow}>
              {['4 Beceri', 'AI Koç', 'Deneme Sınavı', 'Öğretmen Paneli', 'Fiyatlar'].map((item) => (
                <Text key={item} style={styles.navItem}>{item}</Text>
              ))}
            </View>
          ) : null}
        </View>
      </SafeAreaView>

      <View style={[styles.hero, isDesktop ? styles.heroDesktop : styles.heroStack]}>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>Türk öğrenciler için sınav odaklı akademik İngilizce</Text>
          <Text style={[styles.heroTitle, !isTablet && styles.heroTitleSmall]}>
            Hedef skoruna giden yolu tek panelde gör.
          </Text>
          <Text style={styles.heroText}>
            Reading, Listening, Speaking ve Writing çalışmalarını seviye testi, günlük plan, AI geri bildirim ve hata defteriyle birleştiren sade bir hazırlık platformu.
          </Text>
          <View style={styles.heroButtons}>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.heroPrimary, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>Seviyemi Ölç</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.heroSecondary, pressed && styles.pressed]}>
              <Text style={styles.heroSecondaryText}>Demo Paneli Gör</Text>
            </Pressable>
          </View>
          <View style={[styles.trustRow, !isTablet && styles.trustStack]}>
            <View style={styles.trustItem}><Text style={styles.trustValue}>4 / 4</Text><Text style={styles.trustLabel}>beceri takibi</Text></View>
            <View style={styles.trustItem}><Text style={styles.trustValue}>1-6</Text><Text style={styles.trustLabel}>skor tahmini</Text></View>
            <View style={styles.trustItem}><Text style={styles.trustValue}>TR</Text><Text style={styles.trustLabel}>Türkçe açıklama</Text></View>
          </View>
        </View>

        <View style={styles.heroVisual}>
          <Image
            source={require('@/assets/images/academic-hero.png')}
            style={styles.heroImage}
            contentFit="cover"
            accessibilityLabel="Akademik İngilizce çalışması için laptop, kulaklık ve not defteri olan çalışma masası"
          />
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Bugünkü çalışma</Text>
              <Text style={styles.scorePill}>4.5 tahmini</Text>
            </View>
            <View style={styles.taskRow}><Text style={styles.taskTitle}>Reading passage</Text><Text style={styles.taskMeta}>10 soru · çıkarım</Text><Text style={styles.taskScore}>5.0</Text></View>
            <View style={styles.taskRow}><Text style={styles.taskTitle}>Lecture listening</Text><Text style={styles.taskMeta}>not alma · detay</Text><Text style={styles.taskScore}>4.5</Text></View>
            <View style={styles.taskRow}><Text style={styles.taskTitle}>Independent speaking</Text><Text style={styles.taskMeta}>45 sn · tekrar</Text><Text style={styles.taskScore}>3.5</Text></View>
          </View>
        </View>
      </View>

      <View style={styles.quickLinksBand}>
        <View style={[styles.content, styles.quickLinks]}>
          {programs.map((program) => (
            <Pressable key={program} accessibilityRole="button" style={({ pressed }) => [styles.quickLink, pressed && styles.pressed]}>
              <Text style={styles.quickLinkText}>{program}</Text>
              <Text style={styles.quickArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.content}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionKicker}>Platform</Text>
            <Text style={styles.sectionTitle}>Benchmark tarzı net eğitim kataloğu, bizim ürün için AI odaklı çalışma sistemine dönüşür.</Text>
            <Text style={styles.sectionText}>Ana sayfa öğrenciyi kalabalık içerikte kaybettirmez. Önce seviye testi, sonra 4 beceriye ayrılmış programlar ve kişisel çalışma paneli görünür.</Text>
          </View>

          <View style={[styles.skillGrid, isDesktop ? styles.fourColumns : isTablet ? styles.twoColumns : styles.oneColumn]}>
            {skills.map((skill, index) => (
              <View key={skill.title} style={[styles.skillCard, index === 0 && styles.skillCardReading, index === 1 && styles.skillCardListening, index === 2 && styles.skillCardSpeaking, index === 3 && styles.skillCardWriting]}>
                <View style={styles.skillTop}>
                  <View style={styles.skillIcon}><Text style={styles.skillIconText}>{skill.short}</Text></View>
                  <Text style={styles.skillScore}>{skill.score}</Text>
                </View>
                <Text style={styles.skillTitle}>{skill.title}</Text>
                <Text style={styles.skillText}>{skill.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.resourceBand}>
        <View style={[styles.content, isDesktop ? styles.resourceLayout : styles.resourceStack]}>
          <View style={styles.resourceCopy}>
            <Text style={styles.sectionKicker}>Kaynak merkezi</Text>
            <Text style={styles.sectionTitle}>Öğrenci, öğretmen ve kurum için tek yerden yönetilen içerik.</Text>
            <Text style={styles.sectionText}>Benchmark Education sayfasındaki düzenli kaynak merkezi yaklaşımını; sınav pratiği, AI raporları ve öğretmen paneliyle daha ürün odaklı hale getiriyoruz.</Text>
          </View>
          <View style={[styles.resourceGrid, isTablet ? styles.twoColumns : styles.oneColumn]}>
            {resources.map((item) => (
              <View key={item} style={styles.resourceItem}>
                <Text style={styles.resourceDot}>•</Text>
                <Text style={styles.resourceText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.content}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionKicker}>Çalışma akışı</Text>
            <Text style={styles.sectionTitle}>Basit, ölçülebilir ve tekrar edilebilir.</Text>
          </View>
          <View style={[styles.stepsGrid, isDesktop ? styles.fourColumns : isTablet ? styles.twoColumns : styles.oneColumn]}>
            {steps.map((step) => (
              <View key={step.number} style={styles.stepCard}>
                <Text style={styles.stepNumber}>{step.number}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.teacherBand}>
        <View style={[styles.content, isDesktop ? styles.teacherLayout : styles.resourceStack]}>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Haftalık AI raporu</Text>
            <View style={styles.reportRow}><Text style={styles.reportLabel}>En hızlı gelişecek alan</Text><Text style={styles.reportValue}>Speaking</Text></View>
            <View style={styles.reportRow}><Text style={styles.reportLabel}>Hata defteri</Text><Text style={styles.reportValue}>18 kayıt</Text></View>
            <View style={styles.reportRow}><Text style={styles.reportLabel}>Önerilen çalışma</Text><Text style={styles.reportValue}>38 dk/gün</Text></View>
          </View>
          <View style={styles.resourceCopy}>
            <Text style={styles.sectionKicker}>Öğretmen paneli</Text>
            <Text style={styles.sectionTitle}>Bireysel öğrenciyle başlayıp kurumsal kullanıma büyüyebilir.</Text>
            <Text style={styles.sectionText}>İlk sürüm öğrenci odaklı olur. Sonrasında öğretmenler sınıf açabilir, ödev atayabilir, speaking ve writing gelişimini toplu takip edebilir.</Text>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]} onPress={() => Linking.openURL('mailto:info@akademikskor.com')}>
              <Text style={styles.outlineButtonText}>Kurum paketi için iletişim</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.content, styles.footerContent]}>
          <View>
            <Text style={styles.footerBrand}>Akademik Skor</Text>
            <Text style={styles.footerText}>TOEFL tarzı akademik İngilizce hazırlık için bağımsız AI destekli çalışma platformu.</Text>
          </View>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>Gizlilik</Text>
            <Text style={styles.footerLink}>Kullanım</Text>
            <Text style={styles.footerLink}>İletişim</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  pageContent: {
    backgroundColor: palette.paper,
  },
  safeArea: {
    backgroundColor: palette.paper,
  },
  noticeBar: {
    backgroundColor: palette.seaDark,
    paddingVertical: 9,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  noticeText: {
    color: '#f4fbf8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  headerShell: {
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    backgroundColor: palette.paper,
  },
  headerTop: {
    width: '100%',
    maxWidth: 1160,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: palette.sea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  brandName: {
    color: palette.ink,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  brandSub: {
    color: palette.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  searchBox: {
    flex: 1,
    maxWidth: 380,
    minHeight: 42,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
  },
  searchText: {
    color: palette.muted,
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loginButtonText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    backgroundColor: palette.sea,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  navRow: {
    maxWidth: 1160,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    gap: 22,
  },
  navItem: {
    color: palette.seaDark,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  hero: {
    maxWidth: 1160,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 42,
    gap: 28,
  },
  heroDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStack: {
    flexDirection: 'column',
  },
  heroCopy: {
    flex: 1,
    gap: 18,
  },
  kicker: {
    alignSelf: 'flex-start',
    backgroundColor: palette.seaSoft,
    color: palette.seaDark,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  heroTitle: {
    color: palette.ink,
    fontSize: 58,
    lineHeight: 62,
    fontWeight: '900',
    maxWidth: 650,
  },
  heroTitleSmall: {
    fontSize: 36,
    lineHeight: 41,
  },
  heroText: {
    color: palette.muted,
    fontSize: 17,
    lineHeight: 27,
    maxWidth: 610,
    fontWeight: '500',
  },
  heroButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroPrimary: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: palette.sea,
    justifyContent: 'center',
  },
  heroSecondary: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  heroSecondaryText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  trustRow: {
    flexDirection: 'row',
    gap: 22,
    paddingTop: 8,
  },
  trustStack: {
    flexDirection: 'column',
    gap: 8,
  },
  trustItem: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 10,
    minWidth: 110,
  },
  trustValue: {
    color: palette.ink,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
  },
  trustLabel: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  heroVisual: {
    flex: 1,
    minHeight: 420,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: palette.seaDark,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    minHeight: 420,
  },
  dashboardCard: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 22,
    backgroundColor: 'rgba(255, 253, 247, 0.94)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(216, 222, 216, 0.86)',
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    color: palette.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  scorePill: {
    backgroundColor: palette.sea,
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '800',
  },
  taskRow: {
    display: 'flex',
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 9,
  },
  taskTitle: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  taskMeta: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  taskScore: {
    position: 'absolute',
    right: 0,
    top: 9,
    color: palette.sea,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  quickLinksBand: {
    backgroundColor: palette.seaDark,
  },
  content: {
    maxWidth: 1160,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  quickLinks: {
    paddingVertical: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickLink: {
    flexGrow: 1,
    minWidth: 220,
    minHeight: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickLinkText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  quickArrow: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },
  section: {
    backgroundColor: palette.paper,
    paddingVertical: 56,
  },
  sectionHead: {
    maxWidth: 760,
    gap: 10,
    marginBottom: 26,
  },
  sectionKicker: {
    color: palette.sea,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
  },
  sectionText: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  skillGrid: {
    gap: 12,
  },
  fourColumns: {
    flexDirection: 'row',
  },
  twoColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  oneColumn: {
    flexDirection: 'column',
  },
  skillCard: {
    flex: 1,
    minWidth: 245,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: '#ffffff',
    padding: 18,
    gap: 12,
  },
  skillCardReading: { backgroundColor: palette.blueSoft },
  skillCardListening: { backgroundColor: palette.seaSoft },
  skillCardSpeaking: { backgroundColor: palette.amberSoft },
  skillCardWriting: { backgroundColor: palette.roseSoft },
  skillTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillIconText: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  skillScore: {
    color: palette.seaDark,
    fontSize: 16,
    fontWeight: '900',
  },
  skillTitle: {
    color: palette.ink,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
  },
  skillText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  resourceBand: {
    backgroundColor: '#edf5f1',
    paddingVertical: 56,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.line,
  },
  resourceLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 36,
  },
  resourceStack: {
    flexDirection: 'column',
    gap: 24,
  },
  resourceCopy: {
    flex: 1,
    gap: 10,
  },
  resourceGrid: {
    flex: 1,
    gap: 10,
  },
  resourceItem: {
    flex: 1,
    minWidth: 210,
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resourceDot: {
    color: palette.sea,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  resourceText: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  stepsGrid: {
    gap: 12,
  },
  stepCard: {
    flex: 1,
    minWidth: 220,
    borderTopWidth: 3,
    borderTopColor: palette.sea,
    paddingTop: 16,
    paddingRight: 16,
    gap: 8,
  },
  stepNumber: {
    color: palette.sea,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  stepTitle: {
    color: palette.ink,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
  },
  stepText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  teacherBand: {
    backgroundColor: palette.seaDark,
    paddingVertical: 56,
  },
  teacherLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 34,
  },
  reportCard: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: palette.paper,
    padding: 20,
    gap: 12,
  },
  reportTitle: {
    color: palette.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    marginBottom: 4,
  },
  reportRow: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  reportLabel: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  reportValue: {
    color: palette.sea,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
    textAlign: 'right',
  },
  outlineButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    justifyContent: 'center',
    marginTop: 6,
  },
  outlineButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    backgroundColor: '#082923',
    paddingVertical: 28,
  },
  footerContent: {
    flexDirection: Platform.select({ web: 'row', default: 'column' }),
    justifyContent: 'space-between',
    gap: 18,
  },
  footerBrand: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  footerText: {
    color: '#b9cbc6',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 560,
    marginTop: 6,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  footerLink: {
    color: '#d9f0eb',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.76,
  },
});
