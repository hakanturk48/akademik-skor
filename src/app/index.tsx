import { Image } from 'expo-image';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const palette = {
  ink: '#10231f',
  muted: '#5b6c66',
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
};

const navItems = ['Programlar', 'Video Dersler', 'AI Araçları', '4 Beceri', 'Öğretmen Paneli'];
const audienceItems = ['Öğrenciler', 'Öğretmenler', 'Kurumlar'];

const skills = [
  {
    short: 'R',
    title: 'Reading',
    label: 'Akademik pasaj okuma',
    score: '5.0',
    routine: 'Günlük 20 dk',
    text: 'Pasaj yapısı, ana fikir, çıkarım, kelime ve referans soruları Türkçe açıklamalı çözümle ilerler.',
    chips: ['Inference', 'Vocabulary', 'Purpose'],
    dots: 5,
    accent: palette.blue,
    bg: palette.blueSoft,
  },
  {
    short: 'L',
    title: 'Listening',
    label: 'Ders ve kampüs dinleme',
    score: '4.5',
    routine: 'Günlük 18 dk',
    text: 'Lecture ve conversation kayıtlarında not alma, detay yakalama ve transkript üstünden hata analizi yapılır.',
    chips: ['Lecture', 'Note-taking', 'Detail'],
    dots: 4,
    accent: palette.sea,
    bg: palette.seaSoft,
  },
  {
    short: 'S',
    title: 'Speaking',
    label: 'Mikrofonla cevap pratiği',
    score: '3.5',
    routine: 'Günlük 12 dk',
    text: 'Kayıt alınır, transkript çıkarılır; akıcılık, telaffuz, süre kullanımı ve cevap organizasyonu puanlanır.',
    chips: ['Fluency', 'Pronunciation', 'Timing'],
    dots: 3,
    accent: palette.amber,
    bg: palette.amberSoft,
  },
  {
    short: 'W',
    title: 'Writing',
    label: 'Rubrik bazlı essay',
    score: '4.0',
    routine: 'Günlük 25 dk',
    text: 'Essay yapısı, gramer, akademik kelime ve örnek kullanımı rubrik üzerinden ayrı ayrı değerlendirilir.',
    chips: ['Cohesion', 'Grammar', 'Examples'],
    dots: 4,
    accent: palette.rose,
    bg: palette.roseSoft,
  },
];

const programs = [
  'TOEFL tarzı sınav hazırlığı',
  'Akademik writing geliştirme',
  'Speaking ve telaffuz pratiği',
  'Okullar için öğretmen paneli',
];

const videos = [
  { title: 'Reading strateji dersi', time: '10 dk', text: 'Pasajı önce haritalandır, sonra soru tipine göre oku.', accent: palette.blue, bg: palette.blueSoft },
  { title: 'Listening not alma', time: '8 dk', text: 'Lecture akışında örnekleri ve karşıt fikirleri kaçırma.', accent: palette.sea, bg: palette.seaSoft },
  { title: 'Speaking cevap kurgusu', time: '7 dk', text: '45 saniyelik cevabı giriş, gerekçe ve örnekle toparla.', accent: palette.amber, bg: palette.amberSoft },
  { title: 'Writing rubrik analizi', time: '12 dk', text: 'AI puanını rubrik kırılımlarına göre nasıl okuyacağını gör.', accent: palette.rose, bg: palette.roseSoft },
];

const aiTools = [
  { title: 'AI Speaking Coach', tag: 'Ses analizi', text: 'Ses kaydını transkripte çevirir, akıcılık ve süre kullanımını görselleştirir.', type: 'wave', accent: palette.sea, bg: '#e8f6f2' },
  { title: 'Writing Rubric AI', tag: 'Rubrik skoru', text: 'Essay cevabını task response, grammar, cohesion ve akademik kelime açısından puanlar.', type: 'rubric', accent: palette.rose, bg: '#fff0f0' },
  { title: 'Akıllı Çalışma Planı', tag: 'Plan motoru', text: 'Hedef skor ve sınav tarihine göre günlük görevleri otomatik dengeler.', type: 'timeline', accent: palette.blue, bg: '#edf4f8' },
  { title: 'Hata Defteri', tag: 'Tekrar sistemi', text: 'Yanlışları konu, beceri ve soru tipine göre kaydeder; tekrar zamanını önerir.', type: 'notebook', accent: palette.amber, bg: '#fff5d8' },
];

const resources = ['Ücretsiz seviye testi', 'Haftalık çalışma planı', 'Hata defteri', 'Mini deneme sınavı', 'Türkçe açıklamalı çözümler', 'AI koç raporu'];
const steps = [
  { number: '01', title: 'Ölç', text: 'Kısa tanı testiyle başlangıç skoru ve zayıf beceriler belirlenir.' },
  { number: '02', title: 'Planla', text: 'Hedef skor, sınav tarihi ve günlük süreye göre kişisel çalışma yolu açılır.' },
  { number: '03', title: 'Çalış', text: 'Video ders, soru pratiği, speaking kaydı ve writing görevi tek akışta verilir.' },
  { number: '04', title: 'Düzelt', text: 'AI koç yanlışları Türkçe açıklar, hata defterine işler ve tekrar planlar.' },
];

function MiniVisual({ type, color }: { type: string; color: string }) {
  if (type === 'wave') {
    return (
      <View style={styles.wave} accessible={false}>
        {[18, 34, 24, 44, 30, 52, 26, 38].map((height, index) => <View key={`${height}-${index}`} style={[styles.waveBar, { height, backgroundColor: color }]} />)}
      </View>
    );
  }

  if (type === 'rubric') {
    return (
      <View style={styles.rubric} accessible={false}>
        {['Task', 'Grammar', 'Cohesion'].map((item, index) => (
          <View key={item} style={styles.rubricRow}>
            <Text style={styles.rubricLabel}>{item}</Text>
            <View style={styles.rubricTrack}><View style={[styles.rubricFill, { width: `${74 - index * 12}%`, backgroundColor: color }]} /></View>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'timeline') {
    return (
      <View style={styles.timeline} accessible={false}>
        {['Bugün', '3 gün', 'Hafta'].map((item, index) => (
          <View key={item} style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: color }]} />
            <Text style={styles.timelineLabel}>{item}</Text>
            {index < 2 ? <View style={styles.timelineLine} /> : null}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.notebook} accessible={false}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.noteLine}>
          <View style={[styles.noteBullet, { backgroundColor: color }]} />
          <View style={[styles.noteTextLine, item === 2 ? styles.noteTextShort : null]} />
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 980;
  const isTablet = width >= 720;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.noticeBar}>
          <Text style={styles.noticeText}>Yeni dönem hazırlığı: AI destekli speaking, writing ve video ders sistemi kuruluyor.</Text>
          {isTablet ? <Text style={styles.noticeLink}>Canlı demo | Kurum tanıtımı</Text> : null}
        </View>

        <View style={styles.headerShell}>
          {isTablet ? (
            <View style={styles.utilityRow}>
              <View style={styles.utilityLinks}>{audienceItems.map((item) => <Text key={item} style={styles.utilityLink}>{item}</Text>)}</View>
              <Text style={styles.utilityHelp}>Sınava kaç gün kaldı? Hedef skora göre plan çıkar.</Text>
            </View>
          ) : null}

          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>A</Text></View>
              <View>
                <Text style={styles.brandName}>Akademik Skor</Text>
                <Text style={styles.brandSub}>TOEFL Style Prep</Text>
              </View>
            </View>

            {isDesktop ? <View style={styles.searchBox}><Text style={styles.searchText}>Video ders, AI araç veya soru tipi ara</Text></View> : null}

            <View style={styles.headerActions}>
              {isTablet ? <Pressable accessibilityRole="button" style={({ pressed }) => [styles.loginButton, pressed ? styles.pressed : null]}><Text style={styles.loginText}>Giriş</Text></Pressable> : null}
              <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}><Text style={styles.primaryText}>{isTablet ? 'Ücretsiz Başla' : 'Başla'}</Text></Pressable>
            </View>
          </View>

          {isTablet ? <View style={styles.navRow}>{navItems.map((item) => <Text key={item} style={styles.navItem}>{item}</Text>)}</View> : <Text style={styles.mobileNav}>4 beceri, video ders ve AI koç tek panelde</Text>}
        </View>
      </SafeAreaView>

      <View style={[styles.hero, isDesktop ? styles.row : styles.stack]}>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>Türk öğrenciler için sınav odaklı akademik İngilizce</Text>
          <Text style={[styles.heroTitle, !isTablet ? styles.heroTitleSmall : null]}>Hedef skoruna giden yolu tek panelde gör.</Text>
          <Text style={styles.heroText}>Reading, Listening, Speaking ve Writing çalışmalarını video dersler, seviye testi, günlük plan, AI geri bildirim ve hata defteriyle birleştiren sade bir hazırlık platformu.</Text>
          <View style={styles.heroButtons}>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.heroPrimary, pressed ? styles.pressed : null]}><Text style={styles.primaryText}>Seviyemi Ölç</Text></Pressable>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.heroSecondary, pressed ? styles.pressed : null]}><Text style={styles.secondaryText}>Demo Paneli Gör</Text></Pressable>
          </View>
          <View style={[styles.trustRow, !isTablet ? styles.stack : null]}>
            <View style={styles.trustItem}><Text style={styles.trustValue}>4 / 4</Text><Text style={styles.trustLabel}>beceri takibi</Text></View>
            <View style={styles.trustItem}><Text style={styles.trustValue}>28+</Text><Text style={styles.trustLabel}>video ders fikri</Text></View>
            <View style={styles.trustItem}><Text style={styles.trustValue}>AI</Text><Text style={styles.trustLabel}>kişisel geri bildirim</Text></View>
          </View>
        </View>

        <View style={styles.heroVisual}>
          <Image source={require('@/assets/images/academic-hero.png')} style={styles.heroImage} contentFit="cover" accessibilityLabel="Akademik İngilizce çalışması için laptop, kulaklık ve not defteri olan çalışma masası" />
          <View style={styles.heroAiCard}><Text style={styles.aiLabel}>AI Koç</Text><Text style={styles.heroAiText}>Son speaking cevabında örnek kısmı zayıf. 1 somut akademik örnek ekle.</Text></View>
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}><Text style={styles.cardTitle}>Bugünkü çalışma</Text><Text style={styles.scorePill}>4.5 tahmini</Text></View>
            <View style={styles.taskRow}><View><Text style={styles.taskTitle}>Reading passage</Text><Text style={styles.taskMeta}>10 soru - çıkarım</Text></View><Text style={styles.taskScore}>5.0</Text></View>
            <View style={styles.taskRow}><View><Text style={styles.taskTitle}>Video: note-taking</Text><Text style={styles.taskMeta}>8 dk - lecture</Text></View><Text style={styles.taskScore}>4.5</Text></View>
            <View style={styles.taskRow}><View><Text style={styles.taskTitle}>Independent speaking</Text><Text style={styles.taskMeta}>45 sn - AI analiz</Text></View><Text style={styles.taskScore}>3.5</Text></View>
          </View>
        </View>
      </View>

      <View style={styles.quickBand}><View style={[styles.content, styles.quickLinks]}>{programs.map((program) => <Pressable key={program} accessibilityRole="button" style={({ pressed }) => [styles.quickLink, pressed ? styles.pressed : null]}><Text style={styles.quickText}>{program}</Text><Text style={styles.quickArrow}>{'>'}</Text></Pressable>)}</View></View>

      <View style={styles.videoBand}>
        <View style={styles.content}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionKicker}>Video dersler</Text>
            <Text style={styles.sectionTitle}>Sınav stratejisini sadece okuyarak değil, görerek öğren.</Text>
            <Text style={styles.sectionText}>Ana sayfada eğitim içerikleri katalog gibi görünür; öğrenci hangi beceride hangi stratejiyi çalışacağını hızlıca seçer.</Text>
          </View>

          <View style={[styles.videoLayout, isDesktop ? styles.row : styles.stack]}>
            <View style={styles.featuredVideo}>
              <View style={styles.poster}>
                <Image source={require('@/assets/images/academic-hero.png')} style={styles.posterImage} contentFit="cover" accessibilityLabel="Video ders önizleme görseli" />
                <View style={styles.posterOverlay} />
                <View style={styles.playButton}><Text style={styles.playText}>▶</Text></View>
                <Text style={styles.videoTime}>14 dk</Text>
              </View>
              <View style={styles.featuredBody}>
                <Text style={styles.videoEyebrow}>Öne çıkan ders</Text>
                <Text style={styles.featuredTitle}>TOEFL tarzı sınavda 4 beceri nasıl birlikte çalışılır?</Text>
                <Text style={styles.featuredText}>Öğrenci ilk girişte video ders, mini görev ve AI geri bildirimi aynı sırada görür. Böylece içerik kalabalığı yerine günlük aksiyon oluşur.</Text>
              </View>
            </View>

            <View style={[styles.videoList, isTablet && !isDesktop ? styles.twoCols : null]}>
              {videos.map((video) => (
                <View key={video.title} style={[styles.videoCard, { backgroundColor: video.bg, borderColor: video.accent }]}>
                  <View style={styles.videoCardTop}><View style={[styles.smallPlay, { backgroundColor: video.accent }]}><Text style={styles.smallPlayText}>▶</Text></View><Text style={[styles.videoTag, { color: video.accent }]}>{video.time}</Text></View>
                  <Text style={styles.videoTitle}>{video.title}</Text>
                  <Text style={styles.videoText}>{video.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.aiBand}>
        <View style={styles.content}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionKicker}>AI araçları</Text>
            <Text style={styles.sectionTitle}>Yapay zeka sadece puan vermez; öğrencinin bir sonraki adımını da gösterir.</Text>
            <Text style={styles.sectionText}>AI alanını ana sayfada daha görünür yapıyoruz: speaking, writing, çalışma planı ve hata defteri ayrı araçlar gibi sunulur.</Text>
          </View>

          <View style={[styles.aiLayout, isDesktop ? styles.row : styles.stack]}>
            <View style={styles.aiWorkbench}>
              <View style={styles.aiWorkbenchHeader}><Text style={styles.aiWorkbenchTitle}>AI çalışma masası</Text><Text style={styles.aiLive}>Canlı analiz</Text></View>
              <View style={styles.transcriptBox}><Text style={styles.transcriptTitle}>Speaking transkripti</Text><Text style={styles.transcriptText}>I believe online education is useful because students can access lectures anytime...</Text></View>
              <View style={styles.aiScores}>{['Akıcılık 3.8', 'Gramer 4.3', 'Örnek 3.3', 'Süre 4.1'].map((item) => <View key={item} style={styles.aiScoreCell}><Text style={styles.aiScoreText}>{item}</Text></View>)}</View>
              <View style={styles.aiSuggestion}><Text style={styles.suggestionTitle}>AI önerisi</Text><Text style={styles.suggestionText}>Son cümleden önce kısa bir akademik örnek ekle; cevap daha ikna edici olur.</Text></View>
            </View>

            <View style={[styles.aiGrid, isTablet ? styles.twoCols : styles.stack]}>
              {aiTools.map((tool) => (
                <View key={tool.title} style={[styles.aiToolCard, { backgroundColor: tool.bg, borderColor: tool.accent }]}>
                  <View style={styles.aiToolTop}><Text style={[styles.aiToolTag, { color: tool.accent }]}>{tool.tag}</Text><View style={[styles.aiMark, { backgroundColor: tool.accent }]}><Text style={styles.aiMarkText}>AI</Text></View></View>
                  <MiniVisual type={tool.type} color={tool.accent} />
                  <Text style={styles.aiToolTitle}>{tool.title}</Text>
                  <Text style={styles.aiToolText}>{tool.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.content}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionKicker}>4 beceri sistemi</Text>
            <Text style={styles.sectionTitle}>Her beceri ayrı tanıtılır, sonuçlar tek çalışma planında birleşir.</Text>
            <Text style={styles.sectionText}>Öğrenci ana sayfadan hangi beceride ne çalışacağını anlar; panelde ise skor, görev ve tekrar döngüsünü görür.</Text>
          </View>

          <View style={[styles.skillGrid, isDesktop ? styles.fourCols : isTablet ? styles.twoCols : styles.stack]}>
            {skills.map((skill) => (
              <View key={skill.title} style={[styles.skillCard, { backgroundColor: skill.bg, borderColor: skill.accent }]}>
                <View style={styles.skillTop}><View style={[styles.skillIcon, { backgroundColor: skill.accent }]}><Text style={styles.skillIconText}>{skill.short}</Text></View><View style={styles.scoreBox}><Text style={[styles.skillScore, { color: skill.accent }]}>{skill.score}</Text><Text style={styles.scoreLabel}>tahmini</Text></View></View>
                <Text style={styles.skillLabel}>{skill.label}</Text>
                <Text style={styles.skillTitle}>{skill.title}</Text>
                <Text style={styles.skillText}>{skill.text}</Text>
                <View style={styles.skillMeter}>{[0, 1, 2, 3, 4].map((dot) => <View key={dot} style={[styles.skillDot, dot < skill.dots ? { backgroundColor: skill.accent } : null]} />)}</View>
                <View style={styles.chips}>{skill.chips.map((chip) => <Text key={chip} style={styles.chip}>{chip}</Text>)}</View>
                <Text style={[styles.skillRoutine, { color: skill.accent }]}>{skill.routine}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.resourceBand}>
        <View style={[styles.content, isDesktop ? styles.row : styles.stack]}>
          <View style={styles.resourceCopy}>
            <Text style={styles.sectionKicker}>Kaynak merkezi</Text>
            <Text style={styles.sectionTitle}>Öğrenci, öğretmen ve kurum için tek yerden yönetilen içerik.</Text>
            <Text style={styles.sectionText}>Benchmark Education sayfasındaki düzenli kaynak merkezi yaklaşımını; sınav pratiği, AI raporları ve öğretmen paneliyle daha ürün odaklı hale getiriyoruz.</Text>
          </View>
          <View style={[styles.resourceGrid, isTablet ? styles.twoCols : styles.stack]}>{resources.map((item) => <View key={item} style={styles.resourceItem}><Text style={styles.resourceDot}>•</Text><Text style={styles.resourceText}>{item}</Text></View>)}</View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.content}>
          <View style={styles.sectionHead}><Text style={styles.sectionKicker}>Çalışma akışı</Text><Text style={styles.sectionTitle}>Basit, ölçülebilir ve tekrar edilebilir.</Text></View>
          <View style={[styles.stepsGrid, isDesktop ? styles.fourCols : isTablet ? styles.twoCols : styles.stack]}>{steps.map((step) => <View key={step.number} style={styles.stepCard}><Text style={styles.stepNumber}>{step.number}</Text><Text style={styles.stepTitle}>{step.title}</Text><Text style={styles.stepText}>{step.text}</Text></View>)}</View>
        </View>
      </View>

      <View style={styles.teacherBand}>
        <View style={[styles.content, isDesktop ? styles.row : styles.stack]}>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Haftalık AI raporu</Text>
            <View style={styles.reportRow}><Text style={styles.reportLabel}>En hızlı gelişecek alan</Text><Text style={styles.reportValue}>Speaking</Text></View>
            <View style={styles.reportRow}><Text style={styles.reportLabel}>Hata defteri</Text><Text style={styles.reportValue}>18 kayıt</Text></View>
            <View style={styles.reportRow}><Text style={styles.reportLabel}>Önerilen çalışma</Text><Text style={styles.reportValue}>38 dk/gün</Text></View>
          </View>
          <View style={styles.resourceCopy}>
            <Text style={styles.lightKicker}>Öğretmen paneli</Text>
            <Text style={styles.lightTitle}>Bireysel öğrenciyle başlayıp kurumsal kullanıma büyüyebilir.</Text>
            <Text style={styles.lightText}>İlk sürüm öğrenci odaklı olur. Sonrasında öğretmenler sınıf açabilir, ödev atayabilir, speaking ve writing gelişimini toplu takip edebilir.</Text>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.outlineButton, pressed ? styles.pressed : null]} onPress={() => Linking.openURL('mailto:info@akademikskor.com')}><Text style={styles.outlineText}>Kurum paketi için iletişim</Text></Pressable>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.content, styles.footerContent]}>
          <View><Text style={styles.footerBrand}>Akademik Skor</Text><Text style={styles.footerText}>TOEFL tarzı akademik İngilizce hazırlık için bağımsız AI destekli çalışma platformu.</Text></View>
          <View style={styles.footerLinks}><Text style={styles.footerLink}>Gizlilik</Text><Text style={styles.footerLink}>Kullanım</Text><Text style={styles.footerLink}>İletişim</Text></View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  pageContent: { backgroundColor: palette.paper },
  safeArea: { backgroundColor: palette.paper },
  noticeBar: { backgroundColor: palette.seaDark, paddingVertical: 9, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18 },
  noticeText: { color: '#f4fbf8', fontSize: 13, lineHeight: 18, textAlign: 'center', fontWeight: '600' },
  noticeLink: { color: '#d9f4ee', fontSize: 12, lineHeight: 17, fontWeight: '800' },
  headerShell: { borderBottomWidth: 1, borderBottomColor: palette.line, backgroundColor: palette.paper },
  utilityRow: { width: '100%', maxWidth: 1160, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14 },
  utilityLinks: { flexDirection: 'row', gap: 16 },
  utilityLink: { color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  utilityHelp: { color: palette.seaDark, fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'right' },
  headerTop: { width: '100%', maxWidth: 1160, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  brandMark: { width: 42, height: 42, borderRadius: 8, backgroundColor: palette.sea, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  brandName: { color: palette.ink, fontSize: 20, lineHeight: 24, fontWeight: '800' },
  brandSub: { color: palette.muted, fontSize: 11, lineHeight: 15, fontWeight: '600' },
  searchBox: { flex: 1, maxWidth: 420, minHeight: 42, borderWidth: 1, borderColor: palette.line, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: '#ffffff' },
  searchText: { color: palette.muted, fontSize: 13 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  loginButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: palette.line, justifyContent: 'center', backgroundColor: '#ffffff' },
  loginText: { color: palette.ink, fontSize: 13, fontWeight: '700' },
  primaryButton: { minHeight: 40, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', backgroundColor: palette.sea },
  primaryText: { color: '#ffffff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  navRow: { maxWidth: 1160, width: '100%', alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', gap: 22 },
  navItem: { color: palette.seaDark, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  mobileNav: { color: palette.seaDark, fontSize: 12, lineHeight: 17, fontWeight: '800', paddingHorizontal: 20, paddingBottom: 12 },
  content: { maxWidth: 1160, width: '100%', alignSelf: 'center', paddingHorizontal: 20 },
  row: { flexDirection: 'row' },
  stack: { flexDirection: 'column' },
  hero: { maxWidth: 1160, width: '100%', alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 42, gap: 28, alignItems: 'center' },
  heroCopy: { flex: 1, gap: 18 },
  kicker: { alignSelf: 'flex-start', backgroundColor: palette.seaSoft, color: palette.seaDark, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, fontSize: 12, lineHeight: 16, fontWeight: '800' },
  heroTitle: { color: palette.ink, fontSize: 58, lineHeight: 62, fontWeight: '900', maxWidth: 650 },
  heroTitleSmall: { fontSize: 36, lineHeight: 41 },
  heroText: { color: palette.muted, fontSize: 17, lineHeight: 27, maxWidth: 610, fontWeight: '500' },
  heroButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  heroPrimary: { minHeight: 48, paddingHorizontal: 20, borderRadius: 8, backgroundColor: palette.sea, justifyContent: 'center' },
  heroSecondary: { minHeight: 48, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: '#ffffff', justifyContent: 'center' },
  secondaryText: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  trustRow: { flexDirection: 'row', gap: 22, paddingTop: 8 },
  trustItem: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 10, minWidth: 110 },
  trustValue: { color: palette.ink, fontSize: 24, lineHeight: 29, fontWeight: '900' },
  trustLabel: { color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  heroVisual: { flex: 1, width: '100%', minHeight: 440, borderRadius: 8, overflow: 'hidden', backgroundColor: palette.seaDark, position: 'relative' },
  heroImage: { width: '100%', height: '100%', minHeight: 440 },
  heroAiCard: { position: 'absolute', top: 22, right: 22, width: 220, borderRadius: 8, backgroundColor: 'rgba(255,240,202,0.96)', borderWidth: 1, borderColor: 'rgba(201,131,33,0.45)', padding: 12, gap: 5 },
  aiLabel: { color: palette.amber, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  heroAiText: { color: palette.ink, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  dashboardCard: { position: 'absolute', left: 22, right: 22, bottom: 22, backgroundColor: 'rgba(255,253,247,0.94)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(216,222,216,0.86)', padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardTitle: { color: palette.ink, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  scorePill: { backgroundColor: palette.sea, color: '#ffffff', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, overflow: 'hidden', fontSize: 12, fontWeight: '800' },
  taskRow: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 9, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  taskTitle: { color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: '800' },
  taskMeta: { color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  taskScore: { color: palette.sea, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  quickBand: { backgroundColor: palette.seaDark },
  quickLinks: { paddingVertical: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickLink: { flexGrow: 1, minWidth: 220, minHeight: 54, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quickText: { color: '#ffffff', fontSize: 14, lineHeight: 19, fontWeight: '800' },
  quickArrow: { color: '#ffffff', fontSize: 20, lineHeight: 24, fontWeight: '700' },
  section: { backgroundColor: palette.paper, paddingVertical: 56 },
  videoBand: { backgroundColor: '#f2f7f4', paddingVertical: 56, borderBottomWidth: 1, borderBottomColor: palette.line },
  aiBand: { backgroundColor: '#fff8e6', paddingVertical: 56, borderBottomWidth: 1, borderBottomColor: palette.line },
  sectionHead: { maxWidth: 780, gap: 10, marginBottom: 26 },
  sectionKicker: { color: palette.sea, fontSize: 12, lineHeight: 17, fontWeight: '900', textTransform: 'uppercase' },
  sectionTitle: { color: palette.ink, fontSize: 34, lineHeight: 40, fontWeight: '900' },
  sectionText: { color: palette.muted, fontSize: 15, lineHeight: 24, fontWeight: '500' },
  videoLayout: { gap: 16 },
  featuredVideo: { flex: 1.25, borderRadius: 8, overflow: 'hidden', backgroundColor: '#ffffff', borderWidth: 1, borderColor: palette.line },
  poster: { minHeight: 280, position: 'relative', backgroundColor: palette.seaDark },
  posterImage: { width: '100%', height: '100%', minHeight: 280 },
  posterOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(6,62,57,0.18)' },
  playButton: { position: 'absolute', left: 22, bottom: 22, width: 58, height: 58, borderRadius: 29, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  playText: { color: palette.sea, fontSize: 22, lineHeight: 26, fontWeight: '900' },
  videoTime: { position: 'absolute', right: 18, bottom: 18, backgroundColor: 'rgba(16,35,31,0.78)', color: '#ffffff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, overflow: 'hidden', fontSize: 12, lineHeight: 16, fontWeight: '800' },
  featuredBody: { padding: 20, gap: 8 },
  videoEyebrow: { color: palette.sea, fontSize: 12, lineHeight: 16, fontWeight: '900', textTransform: 'uppercase' },
  featuredTitle: { color: palette.ink, fontSize: 25, lineHeight: 31, fontWeight: '900' },
  featuredText: { color: palette.muted, fontSize: 14, lineHeight: 23, fontWeight: '600' },
  videoList: { flex: 1, gap: 12 },
  twoCols: { flexDirection: 'row', flexWrap: 'wrap' },
  fourCols: { flexDirection: 'row' },
  videoCard: { flex: 1, minWidth: 235, borderRadius: 8, borderWidth: 1, padding: 16, gap: 10 },
  videoCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  smallPlay: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  smallPlayText: { color: '#ffffff', fontSize: 13, lineHeight: 16, fontWeight: '900' },
  videoTag: { fontSize: 12, lineHeight: 16, fontWeight: '900' },
  videoTitle: { color: palette.ink, fontSize: 17, lineHeight: 22, fontWeight: '900' },
  videoText: { color: palette.muted, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  aiLayout: { gap: 18 },
  aiWorkbench: { flex: 0.9, borderRadius: 8, backgroundColor: palette.seaDark, padding: 18, gap: 14 },
  aiWorkbenchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  aiWorkbenchTitle: { color: '#ffffff', fontSize: 22, lineHeight: 28, fontWeight: '900' },
  aiLive: { color: palette.seaDark, backgroundColor: '#d9f4ee', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, overflow: 'hidden', fontSize: 11, lineHeight: 15, fontWeight: '900' },
  transcriptBox: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', padding: 14, backgroundColor: 'rgba(255,255,255,0.08)', gap: 7 },
  transcriptTitle: { color: '#dff2ed', fontSize: 12, lineHeight: 16, fontWeight: '900' },
  transcriptText: { color: '#ffffff', fontSize: 14, lineHeight: 22, fontWeight: '600' },
  aiScores: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aiScoreCell: { flexGrow: 1, minWidth: 120, minHeight: 42, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  aiScoreText: { color: '#ffffff', fontSize: 12, lineHeight: 16, fontWeight: '800' },
  aiSuggestion: { borderRadius: 8, backgroundColor: palette.amberSoft, padding: 14, gap: 6 },
  suggestionTitle: { color: palette.amber, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  suggestionText: { color: palette.ink, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  aiGrid: { flex: 1.35, gap: 12 },
  aiToolCard: { flex: 1, minWidth: 245, borderRadius: 8, borderWidth: 1, padding: 16, gap: 12 },
  aiToolTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiToolTag: { fontSize: 12, lineHeight: 16, fontWeight: '900' },
  aiMark: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  aiMarkText: { color: '#ffffff', fontSize: 12, lineHeight: 16, fontWeight: '900' },
  aiToolTitle: { color: palette.ink, fontSize: 18, lineHeight: 23, fontWeight: '900' },
  aiToolText: { color: palette.muted, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  wave: { height: 58, flexDirection: 'row', alignItems: 'center', gap: 7 },
  waveBar: { width: 8, borderRadius: 4, opacity: 0.82 },
  rubric: { gap: 8, paddingVertical: 4 },
  rubricRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rubricLabel: { width: 64, color: palette.ink, fontSize: 11, lineHeight: 15, fontWeight: '800' },
  rubricTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(16,35,31,0.1)', overflow: 'hidden' },
  rubricFill: { height: '100%', borderRadius: 4 },
  timeline: { flexDirection: 'row', alignItems: 'center', minHeight: 58 },
  timelineItem: { flex: 1, alignItems: 'center', gap: 6, position: 'relative' },
  timelineDot: { width: 14, height: 14, borderRadius: 7 },
  timelineLine: { position: 'absolute', top: 6, left: '58%', right: '-42%', height: 2, backgroundColor: 'rgba(16,35,31,0.14)' },
  timelineLabel: { color: palette.ink, fontSize: 11, lineHeight: 15, fontWeight: '800' },
  notebook: { gap: 10, minHeight: 58, justifyContent: 'center' },
  noteLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteBullet: { width: 9, height: 9, borderRadius: 5 },
  noteTextLine: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(16,35,31,0.14)' },
  noteTextShort: { maxWidth: '72%' },
  skillGrid: { gap: 12 },
  skillCard: { flex: 1, minWidth: 245, borderRadius: 8, borderWidth: 1, padding: 18, gap: 12 },
  skillTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skillIcon: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  skillIconText: { color: '#ffffff', fontSize: 19, fontWeight: '900' },
  scoreBox: { alignItems: 'flex-end' },
  skillScore: { fontSize: 19, lineHeight: 23, fontWeight: '900' },
  scoreLabel: { color: palette.muted, fontSize: 10, lineHeight: 14, fontWeight: '800' },
  skillLabel: { color: palette.muted, fontSize: 12, lineHeight: 16, fontWeight: '900', textTransform: 'uppercase' },
  skillTitle: { color: palette.ink, fontSize: 22, lineHeight: 27, fontWeight: '900' },
  skillText: { color: palette.muted, fontSize: 14, lineHeight: 22, fontWeight: '600' },
  skillMeter: { flexDirection: 'row', gap: 6, paddingTop: 2 },
  skillDot: { flex: 1, height: 7, borderRadius: 4, backgroundColor: 'rgba(16,35,31,0.12)' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { color: palette.ink, backgroundColor: 'rgba(255,255,255,0.62)', borderRadius: 8, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, fontSize: 11, lineHeight: 15, fontWeight: '800' },
  skillRoutine: { fontSize: 13, lineHeight: 18, fontWeight: '900' },
  resourceBand: { backgroundColor: '#edf5f1', paddingVertical: 56, borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.line },
  resourceCopy: { flex: 1, gap: 10 },
  resourceGrid: { flex: 1, gap: 10 },
  resourceItem: { flex: 1, minWidth: 210, minHeight: 58, borderRadius: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: '#ffffff', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resourceDot: { color: palette.sea, fontSize: 24, lineHeight: 28, fontWeight: '900' },
  resourceText: { color: palette.ink, fontSize: 14, lineHeight: 20, fontWeight: '800' },
  stepsGrid: { gap: 12 },
  stepCard: { flex: 1, minWidth: 220, borderTopWidth: 3, borderTopColor: palette.sea, paddingTop: 16, paddingRight: 16, gap: 8 },
  stepNumber: { color: palette.sea, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  stepTitle: { color: palette.ink, fontSize: 21, lineHeight: 26, fontWeight: '900' },
  stepText: { color: palette.muted, fontSize: 14, lineHeight: 22, fontWeight: '600' },
  teacherBand: { backgroundColor: palette.seaDark, paddingVertical: 56 },
  reportCard: { flex: 1, borderRadius: 8, backgroundColor: palette.paper, padding: 20, gap: 12 },
  reportTitle: { color: palette.ink, fontSize: 24, lineHeight: 30, fontWeight: '900', marginBottom: 4 },
  reportRow: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  reportLabel: { color: palette.muted, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  reportValue: { color: palette.sea, fontSize: 14, lineHeight: 19, fontWeight: '900', textAlign: 'right' },
  lightKicker: { color: '#9de4d6', fontSize: 12, lineHeight: 17, fontWeight: '900', textTransform: 'uppercase' },
  lightTitle: { color: '#ffffff', fontSize: 34, lineHeight: 40, fontWeight: '900' },
  lightText: { color: '#c9dfda', fontSize: 15, lineHeight: 24, fontWeight: '500' },
  outlineButton: { alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.38)', justifyContent: 'center', marginTop: 6 },
  outlineText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  footer: { backgroundColor: '#082923', paddingVertical: 28 },
  footerContent: { flexDirection: Platform.select({ web: 'row', default: 'column' }), justifyContent: 'space-between', gap: 18 },
  footerBrand: { color: '#ffffff', fontSize: 22, lineHeight: 28, fontWeight: '900' },
  footerText: { color: '#b9cbc6', fontSize: 13, lineHeight: 20, maxWidth: 560, marginTop: 6 },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  footerLink: { color: '#d9f0eb', fontSize: 13, lineHeight: 20, fontWeight: '700' },
  pressed: { opacity: 0.76 },
});
