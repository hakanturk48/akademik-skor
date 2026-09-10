import { useRef, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCurrentUser, type AuthUser } from '@/lib/auth';
import { submitDemoRequest } from '@/lib/demo-requests';

const homeFontFamily = 'Quicksand, ui-sans-serif, system-ui, sans-serif';

const palette = {
  ink: '#20233a',
  text: '#565d70',
  muted: '#7a8092',
  page: '#f6f6f3',
  surface: '#ffffff',
  soft: '#eef0f7',
  navy: '#373a5b',
  navyDeep: '#24263f',
  navySoft: '#dfe3f2',
  yellow: '#f4c431',
  yellowDeep: '#d99b00',
  yellowSoft: '#fff3c6',
  orange: '#f06a3d',
  orangeSoft: '#fff0e9',
  teal: '#007d73',
  tealSoft: '#e4f4f1',
  blue: '#5b75d8',
  blueSoft: '#edf1ff',
  line: '#dddeda',
};

const homepageAssets = {
  logo: require('@/assets/images/homepage/logo_A.png'),
  loginUser: require('@/assets/images/homepage/login_user.png'),
  carouselLeft: require('@/assets/images/homepage/carousel_left.png'),
  carouselRight: require('@/assets/images/homepage/carousel_right.png'),
  arrowRightWhite: require('@/assets/images/homepage/arrow_right_white.png'),
  details: {
    yellow: require('@/assets/images/homepage/details_button_yellow.png'),
    teal: require('@/assets/images/homepage/details_button_teal.png'),
    orange: require('@/assets/images/homepage/details_button_orange.png'),
    blue: require('@/assets/images/homepage/details_button_blue.png'),
  },
  resourceBadges: {
    T: require('@/assets/images/homepage/resource_badge_T.png'),
    W: require('@/assets/images/homepage/resource_badge_W.png'),
    S: require('@/assets/images/homepage/resource_badge_S.png'),
    L: require('@/assets/images/homepage/resource_badge_L.png'),
  },
  resourceArrows: {
    yellow: require('@/assets/images/homepage/resource_arrow_yellow.png'),
    blue: require('@/assets/images/homepage/resource_arrow_blue.png'),
    purple: require('@/assets/images/homepage/resource_arrow_purple.png'),
    orange: require('@/assets/images/homepage/resource_arrow_orange.png'),
  },
};
type SectionKey = 'home' | 'why' | 'toefl' | 'resources' | 'contact';
type NavIconKey = 'home' | 'people' | 'book' | 'document' | 'mail' | 'user';
type DemoRequestMessageTone = 'error' | 'success';
const navItems: { label: string; target: SectionKey; icon: NavIconKey }[] = [
  { label: 'Ana Sayfa', target: 'home', icon: 'home' },
  { label: 'Neden Biz?', target: 'why', icon: 'people' },
  { label: 'TOEFL iBT', target: 'toefl', icon: 'book' },
  { label: 'Ücretsiz Kaynaklar', target: 'resources', icon: 'document' },
  { label: 'İletişim', target: 'contact', icon: 'mail' },
];

const capabilities = [
  {
    code: '01',
    title: 'Video derslerle net öğrenme',
    text: 'Sınav stratejileri kısa, anlaşılır ve tekrar edilebilir derslerle sunulur.',
  },
  {
    code: '02',
    title: 'Yapay zeka konuşma analizi',
    text: 'Speaking cevapları akıcılık, süre, telaffuz ve içerik düzeni açısından yorumlanır.',
  },
  {
    code: '03',
    title: 'Rubrik bazlı writing geri bildirimi',
    text: 'Essay cevapları görev, organizasyon, dil kullanımı ve örnek kalitesiyle değerlendirilir.',
  },
  {
    code: '04',
    title: 'Kişiselleştirilmiş eğitim koçluğu',
    text: 'Giriş sonrası hedef skor, sınav tarihi ve güçlü-zayıf becerilere göre çalışma önerilir.',
  },
];


const capabilityTones = [palette.blue, palette.teal, palette.yellowDeep, palette.orange];

const programs = [
  {
    tag: 'TOEFL iBT',
    title: 'Dört beceriyi birlikte geliştiren hazırlık sistemi',
    text: 'Reading, Listening, Speaking ve Writing becerileri tek bir sınav mantığı içinde ele alınır.',
    tone: palette.yellow,
    actionBg: '#fff8df',
  },
  {
    tag: 'Speaking',
    title: 'Ses kaydı, tekrar deneme ve AI destekli analiz',
    text: 'Öğrenci cevabını kaydeder; sistem yanıtın anlaşılabilirliğini ve yapısını görünür hale getirir.',
    tone: palette.teal,
    actionBg: '#e7f7f4',
  },
  {
    tag: 'Writing',
    title: 'Akademik yazma için sade rubrik rehberliği',
    text: 'Paragraf düzeni, örnek kullanımı ve dil doğruluğu anlaşılır adımlarla geliştirilir.',
    tone: palette.orange,
    actionBg: '#fff0e9',
  },
  {
    tag: 'Planlama',
    title: 'Hedefe göre çalışma yolu',
    text: 'Seviye, sınav tarihi ve zayıf beceriler tek planda birleşir.',
    tone: palette.blue,
    actionBg: '#edf1ff',
  },
];

const toeflSkills = [
  {
    icon: 'R',
    title: 'Reading',
    text: 'Ana fikir, çıkarım, kelime ve paragraf yapısı odaklı strateji dersleri.',
    image: require('@/assets/images/skill-reading.png'),
    imageLabel: 'Reading becerisi için kitap ve ampul görseli',
    bg: palette.blueSoft,
    color: palette.blue,
  },
  {
    icon: 'L',
    title: 'Listening',
    text: 'Lecture ve conversation türlerinde not alma, amaç ve detay yakalama çalışmaları.',
    image: require('@/assets/images/skill-listening.png'),
    imageLabel: 'Listening becerisi için kulaklık ve ses dalgası görseli',
    bg: palette.tealSoft,
    color: palette.teal,
  },
  {
    icon: 'S',
    title: 'Speaking',
    text: '45-60 saniyelik cevap kurma, akıcılık ve telaffuz için yapay zeka destekli pratik.',
    image: require('@/assets/images/skill-speaking.png'),
    imageLabel: 'Speaking becerisi için mikrofon ve konuşma balonu görseli',
    bg: palette.yellowSoft,
    color: palette.yellowDeep,
  },
  {
    icon: 'W',
    title: 'Writing',
    text: 'Integrated ve academic essay görevleri için planlama, geliştirme ve rubrik analizi.',
    image: require('@/assets/images/skill-writing.png'),
    imageLabel: 'Writing becerisi için defter ve kalem görseli',
    bg: palette.orangeSoft,
    color: palette.orange,
  },
];

const announcements = [
  {
    category: 'Video ders',
    title: 'Reading inference mini dersleri yayında',
    text: 'Çıkarım sorularında paragrafı önce haritalama, sonra seçenekleri eleme yöntemi anlatılıyor.',
    meta: '10 dk',
    color: palette.blue,
  },
  {
    category: 'AI araçları',
    title: 'Speaking cevap kontrolü için yeni analiz alanı',
    text: 'Kayıt sonrası cevap organizasyonu, süre kullanımı ve anlaşılabilirlik için sade geri bildirim alınır.',
    meta: 'Beta',
    color: palette.teal,
  },
  {
    category: 'Ücretsiz kaynak',
    title: 'TOEFL iBT başlangıç kontrol listesi',
    text: 'Sınava ilk kez hazırlanan öğrenciler için beceri bazlı başlangıç rehberi hazırlandı.',
    meta: 'PDF',
    color: palette.yellowDeep,
  },
  {
    category: 'Kurumlar',
    title: 'Sınıf bazlı ilerleme takibi planlanıyor',
    text: 'Öğretmenler ileride öğrencilerin speaking ve writing gelişimini tek panelden görebilecek.',
    meta: 'Yakında',
    color: palette.orange,
  },
];

const resources = [
  {
    title: 'TOEFL iBT sınav formatı rehberi',
    text: 'Sınav bölümleri, süreler ve puanlama sistemi hakkında kapsamlı rehber.',
    glyph: 'T',
    color: palette.yellow,
    badgeImage: homepageAssets.resourceBadges.T,
    arrowImage: homepageAssets.resourceArrows.yellow,
  },
  {
    title: 'Academic writing paragraf kontrol listesi',
    text: 'Paragraf yazarken dikkat edilmesi gereken kritik noktalar.',
    glyph: 'W',
    color: palette.blue,
    badgeImage: homepageAssets.resourceBadges.W,
    arrowImage: homepageAssets.resourceArrows.blue,
  },
  {
    title: 'Speaking cevap şablonları',
    text: 'Yaygın konular için etkili cevap şablonları ve örnekler.',
    glyph: 'S',
    color: '#7f72ea',
    badgeImage: homepageAssets.resourceBadges.S,
    arrowImage: homepageAssets.resourceArrows.purple,
  },
  {
    title: 'Listening not alma çalışma kağıdı',
    text: 'Not alma becerisini geliştirmek için pratik sayfalar.',
    glyph: 'L',
    color: '#dd6b20',
    badgeImage: homepageAssets.resourceBadges.L,
    arrowImage: homepageAssets.resourceArrows.orange,
  },
];

const testimonials = [
  {
    quote: 'Speaking cevaplarımı tekrar dinlemek ve kısa AI notları almak eksiklerimi daha net görmemi sağladı.',
    name: 'Elif K.',
    meta: 'İstanbul - hedef TOEFL 90',
    initials: 'EK',
  },
  {
    quote: 'Writing çalışırken sadece doğru-yanlış değil, paragraf düzeni ve örnek kalitesi hakkında yönlendirme almak çok faydalı.',
    name: 'Mert A.',
    meta: 'Ankara - yüksek lisans hazırlığı',
    initials: 'MA',
  },
  {
    quote: 'Video derslerin kısa olması ve dört becerinin aynı planda ilerlemesi hazırlığımı daha düzenli hale getirdi.',
    name: 'Zeynep D.',
    meta: 'İzmir - akademik başvuru',
    initials: 'ZD',
  },
  {
    quote: 'Türkçe açıklamalı geri bildirim sayesinde hatanın nereden kaynaklandığını daha hızlı anlıyorum.',
    name: 'Burak T.',
    meta: 'Bursa - TOEFL iBT hazırlığı',
    initials: 'BT',
  },
];

function NavIcon({ name, color = palette.ink }: { name: NavIconKey; color?: string }) {
  const strokeStyle = { borderColor: color };
  const fillStyle = { backgroundColor: color };

  if (name === 'home') {
    return (
      <View style={styles.navLineIcon} accessible={false}>
        <View style={[styles.homeRoofLeft, fillStyle]} />
        <View style={[styles.homeRoofRight, fillStyle]} />
        <View style={[styles.homeBase, strokeStyle]} />
      </View>
    );
  }

  if (name === 'people') {
    return (
      <View style={styles.navLineIcon} accessible={false}>
        <View style={[styles.peopleHeadLeft, strokeStyle]} />
        <View style={[styles.peopleHeadRight, strokeStyle]} />
        <View style={[styles.peopleBodyLeft, strokeStyle]} />
        <View style={[styles.peopleBodyRight, strokeStyle]} />
      </View>
    );
  }

  if (name === 'book') {
    return (
      <View style={styles.navLineIcon} accessible={false}>
        <View style={[styles.bookPageLeft, strokeStyle]} />
        <View style={[styles.bookPageRight, strokeStyle]} />
        <View style={[styles.bookSpine, fillStyle]} />
      </View>
    );
  }

  if (name === 'document') {
    return (
      <View style={styles.navLineIcon} accessible={false}>
        <View style={[styles.documentFrame, strokeStyle]} />
        <View style={[styles.documentFold, strokeStyle]} />
        <View style={[styles.documentLineOne, fillStyle]} />
        <View style={[styles.documentLineTwo, fillStyle]} />
      </View>
    );
  }

  if (name === 'mail') {
    return (
      <View style={styles.navLineIcon} accessible={false}>
        <View style={[styles.mailFrame, strokeStyle]} />
        <View style={[styles.mailDiagonalLeft, fillStyle]} />
        <View style={[styles.mailDiagonalRight, fillStyle]} />
      </View>
    );
  }

  return (
    <View style={styles.navLineIcon} accessible={false}>
      <View style={[styles.userHead, strokeStyle]} />
      <View style={[styles.userBody, strokeStyle]} />
    </View>
  );
}
export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1080;
  const isTablet = width >= 760;
  const isCompact = width < 760;
  const isTabletHeader = !isCompact && width < 1700;
  const isHeaderCompact = isCompact;
  const showHeaderActions = !isCompact;
  const mobileWidth = Math.max(280, Math.min(width - 36, 430));
  const cardWidth = isDesktop ? 324 : isTablet ? 300 : mobileWidth;
  const testimonialWidth = isDesktop ? 350 : isTablet ? 318 : mobileWidth;
  const heroImageHeight = isCompact ? Math.min(240, Math.max(205, mobileWidth * 0.58)) : isDesktop ? 444 : 360;
  const whyVisualHeight = isCompact ? Math.min(150, Math.max(124, mobileWidth * 0.34)) : isDesktop ? 260 : 220;
  const skillImageWidth = isCompact ? Math.min(128, Math.max(104, mobileWidth * 0.32)) : isTablet ? 174 : 160;
  const skillImageHeight = Math.round(skillImageWidth * 0.72);
  const contactImageHeight = isCompact ? Math.min(230, Math.max(190, mobileWidth * 0.52)) : isDesktop ? 255 : 235;
  const resourcesVisualWidth = isCompact ? Math.min(180, Math.max(146, mobileWidth * 0.45)) : isTablet ? 178 : 198;
  const resourcesVisualHeight = Math.round(resourcesVisualWidth * 0.83);

  const scrollRef = useRef<ScrollView>(null);
  const announcementRef = useRef<ScrollView>(null);
  const testimonialRef = useRef<ScrollView>(null);
  const [sectionTops, setSectionTops] = useState<Record<SectionKey, number>>({
    home: 0,
    why: 0,
    toefl: 0,
    resources: 0,
    contact: 0,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentUser] = useState<AuthUser | null>(() => getCurrentUser());

  const [demoName, setDemoName] = useState('');
  const [demoContact, setDemoContact] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [demoMessageTone, setDemoMessageTone] = useState<DemoRequestMessageTone>('success');
  const markSection = (target: SectionKey) => (event: LayoutChangeEvent) => {
    const nextTop = event.nativeEvent.layout.y;
    setSectionTops((current) => ({ ...current, [target]: nextTop }));
  };

  const goToSection = (target: SectionKey) => {
    setMobileMenuOpen(false);
    const top = sectionTops[target] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, top - (isCompact ? 76 : 92)), animated: true });
  };

  const moveAnnouncement = (direction: number) => {
    const next = (activeAnnouncement + direction + announcements.length) % announcements.length;
    setActiveAnnouncement(next);
    announcementRef.current?.scrollTo({ x: next * (cardWidth + 16), animated: true });
  };

  const moveTestimonial = (direction: number) => {
    const next = (activeTestimonial + direction + testimonials.length) % testimonials.length;
    setActiveTestimonial(next);
    testimonialRef.current?.scrollTo({ x: next * (testimonialWidth + 16), animated: true });
  };

  const openAccount = () => {
    setMobileMenuOpen(false);
    router.push((currentUser ? '/dashboard' : '/login') as Href);
  };
  const handleDemoRequest = () => {
    const result = submitDemoRequest({ name: demoName, contact: demoContact, source: 'public-home-contact' });

    if (!result.ok) {
      setDemoMessageTone('error');
      setDemoMessage(result.message);
      return;
    }

    setDemoName('');
    setDemoContact('');
    setDemoMessageTone('success');
    setDemoMessage('Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.');
  };

  return (
    <SafeAreaView testID="public-home" style={styles.safe}>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.page} showsVerticalScrollIndicator={Platform.OS === 'web'}>
        <View style={styles.topStrip}>
          <View style={[styles.container, styles.topStripInner, isCompact ? styles.topStripInnerMobile : null]}>
            <Text style={styles.topText}>AI destekli TOEFL iBT hazırlık platformu kuruluyor.</Text>
            {!isCompact ? <Text style={styles.topLink}>Yeni video dersler ve ücretsiz kaynaklar yakında</Text> : null}
          </View>
        </View>

        <View style={[styles.header, isCompact ? styles.headerMobile : null]} onLayout={markSection('home')}>
          <View style={[styles.container, styles.headerInner, isHeaderCompact ? styles.headerInnerCompact : null, isTabletHeader ? styles.headerInnerTablet : null, isCompact ? styles.headerInnerMobile : null]}>
            {isHeaderCompact ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Menüyü aç"
                onPress={() => setMobileMenuOpen((value) => !value)}
                style={({ pressed }) => [styles.menuButton, pressed ? styles.pressed : null]}
              >
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
              </Pressable>
            ) : null}

            <Pressable accessibilityRole="button" onPress={() => goToSection('home')} style={({ pressed }) => [styles.brand, isHeaderCompact ? styles.brandCompactHeader : null, isTabletHeader ? styles.brandTablet : null, isCompact ? styles.brandMobile : null, pressed ? styles.pressed : null]}>
              <View style={[styles.logoMark, isTabletHeader ? styles.logoMarkTablet : null, isCompact ? styles.logoMarkMobile : null]}>
                <Image source={homepageAssets.logo} style={[styles.logoImage, isCompact ? styles.logoImageMobile : null]} contentFit="contain" accessibilityLabel="Akademik Skor logosu" />
              </View>
              <View style={[styles.brandCopy, isTabletHeader ? styles.brandCopyTablet : null, isCompact ? styles.brandCopyMobile : null]}>
                <Text
                  style={[styles.brandTitle, isTabletHeader ? styles.brandTitleTablet : null, isCompact ? styles.brandTitleMobile : null]}
                  numberOfLines={isCompact || isTabletHeader ? 1 : undefined}
                  adjustsFontSizeToFit={isCompact}
                  minimumFontScale={0.76}
                >
                  Akademik Skor
                </Text>
                <Text style={[styles.brandSub, isTabletHeader ? styles.brandSubTablet : null, isCompact ? styles.brandSubMobile : null]}>TOEFL Style Prep</Text>
              </View>
            </Pressable>
            {!isHeaderCompact ? (
              <View style={[styles.nav, isTabletHeader ? styles.navTablet : null]}>
                {navItems.map((item, index) => (
                  <Pressable
                    key={item.label}
                    accessibilityRole="button"
                    onPress={() => goToSection(item.target)}
                    style={({ pressed }) => [styles.navItem, isTabletHeader ? styles.navItemTablet : null, index === 0 ? styles.navItemActive : null, pressed ? styles.pressed : null]}
                  >
                    <NavIcon name={item.icon} color={index === 0 ? palette.yellow : palette.ink} />
                    <Text style={[styles.navText, isTabletHeader ? styles.navTextTablet : null]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{item.label}</Text>
                    {index === 0 ? <View style={[styles.navActiveLine, isTabletHeader ? styles.navActiveLineTablet : null]} /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}

            {showHeaderActions ? (
              <View style={styles.headerActions}>
                <View style={styles.headerDivider} />
                <Pressable accessibilityRole="button" onPress={openAccount} style={({ pressed }) => [styles.ghostButton, isTabletHeader ? styles.ghostButtonTablet : null, pressed ? styles.pressed : null]}>
                  <Image source={homepageAssets.loginUser} style={[styles.headerUserImage, isTabletHeader ? styles.headerUserImageTablet : null]} contentFit="contain" accessibilityLabel="Giriş ikonu" />
                  <Text style={[styles.ghostButtonText, isTabletHeader ? styles.ghostButtonTextTablet : null]}>{currentUser ? 'Panel' : 'Giriş'}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => goToSection('contact')} style={({ pressed }) => [styles.headerButton, isTabletHeader ? styles.headerButtonTablet : null, pressed ? styles.pressed : null]}>
                  <Text style={[styles.headerButtonText, isTabletHeader ? styles.headerButtonTextTablet : null]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Demo Talep Et</Text>
                  <Text style={styles.headerButtonArrow}>{'>'}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {isHeaderCompact && mobileMenuOpen ? (
            <View style={styles.mobileDrawer}>
              {navItems.map((item) => (
                <Pressable key={item.label} accessibilityRole="button" onPress={() => goToSection(item.target)} style={({ pressed }) => [styles.mobileNavItem, pressed ? styles.pressed : null]}>
                  <NavIcon name={item.icon} color={palette.ink} />
                  <Text style={styles.mobileNavText}>{item.label}</Text>
                </Pressable>
              ))}
              <View style={styles.mobileActionRow}>
                <Pressable accessibilityRole="button" onPress={openAccount} style={({ pressed }) => [styles.mobileGhost, pressed ? styles.pressed : null]}>
                  <Text style={styles.mobileGhostText} numberOfLines={1}>{currentUser ? 'Panel' : 'Giriş'}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => goToSection('contact')} style={({ pressed }) => [styles.mobilePrimary, pressed ? styles.pressed : null]}>
                  <Text style={styles.mobilePrimaryText} numberOfLines={1}>Demo Talep Et</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <View style={[styles.heroSection, isCompact ? styles.heroSectionMobile : null]}>
          <View style={[styles.container, styles.heroLayout, isDesktop ? styles.heroLayoutDesktop : styles.heroLayoutStack]}>
            {!isCompact ? (
              <View style={[styles.heroMedia, styles.heroMediaDesktop]}>
                <Image source={require('@/assets/images/academic-hero.png')} style={[styles.heroImage, { height: heroImageHeight }]} contentFit="cover" accessibilityLabel="TOEFL iBT hazırlığı için çevrimiçi çalışma masası" />
              </View>
            ) : null}

            <View style={[styles.heroCard, isDesktop ? styles.heroCardDesktop : null, isCompact ? styles.heroCardMobile : null]}>
              <Text style={styles.heroEyebrow}>ONLINE TOEFL İBT HAZIRLIK</Text>
              <Text style={[styles.heroTitle, isCompact ? styles.heroTitleMobile : null]}>Akademik İngilizce hedefiniz için doğru yerdesiniz.</Text>
              <Text style={styles.heroText}>
                Akademik Skor; çevrimiçi video dersleri, yapay zeka destekli konuşma analizi, writing değerlendirmesi ve kişiselleştirilmiş eğitim koçluğunu tek bir sade platformda buluşturur.
              </Text>
              <View style={[styles.heroActions, isCompact ? styles.heroActionsMobile : null]}>
                <Pressable accessibilityRole="button" onPress={() => goToSection('why')} style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}>
                  <Text style={styles.primaryButtonText}>Platformu İncele</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => goToSection('resources')} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
                  <Text style={styles.secondaryButtonText}>Ücretsiz Kaynaklar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.container, styles.capabilityTimeline, isCompact ? styles.capabilityTimelineMobile : null]}>
          {!isCompact ? <View style={styles.capabilityConnector} /> : null}
          {capabilities.map((item, index) => {
            const tone = capabilityTones[index] ?? palette.yellow;
            return (
              <View key={item.code} style={[styles.capabilityStep, isCompact ? styles.capabilityStepMobile : null]}>
                <View style={[styles.capabilityNode, isCompact ? styles.capabilityNodeMobile : null, { borderColor: tone, shadowColor: tone }]}>
                  <Text style={[styles.capabilityNodeText, { color: tone }]}>{item.code}</Text>
                </View>
                {isCompact ? <View style={[styles.capabilityStem, styles.capabilityStemMobile, { backgroundColor: tone }]} /> : null}
                <Text style={[styles.capabilityTitle, isCompact ? styles.capabilityTitleMobile : null]}>{item.title}</Text>
                <Text style={[styles.capabilityText, isCompact ? styles.capabilityTextMobile : null]}>{item.text}</Text>
              </View>
            );
          })}
        </View>
        <View style={[styles.programSection, isCompact ? styles.programSectionMobile : null]} onLayout={markSection('why')}>
          <View style={styles.container}>
            <View style={[styles.whyTop, isDesktop ? styles.whyTopDesktop : styles.whyTopStack]}>
              <View style={[styles.sectionIntro, styles.whyIntroCopy, isDesktop ? styles.whyIntroCopyDesktop : null, isCompact ? styles.whyIntroCopyMobile : null, isCompact ? styles.sectionIntroMobile : null]}>
                <Text style={styles.sectionKicker}>NEDEN BİZ?</Text>
                <Text style={[styles.sectionTitle, isCompact ? styles.sectionTitleMobile : null]}>Sınav hazırlığını ölçülebilir ve anlaşılır hale getirir.</Text>
                <Text style={styles.sectionText}>
                  Akademik Skor; hedef belirleme, beceri takibi, video dersler ve yapay zeka destekli geri bildirimleri aynı öğrenme yolunda toplar.
                </Text>
              </View>

              {!isCompact ? (
                <View style={[styles.whyVisual, isDesktop ? styles.whyVisualDesktop : null, { height: whyVisualHeight }]}>
                  <Image
                    source={require('@/assets/images/why-target.png')}
                    style={styles.whyVisualImage}
                    contentFit="contain"
                    accessibilityLabel="Akademik Skor hedef ve ilerleme görseli"
                  />
                </View>
              ) : null}
            </View>

            <View style={[styles.programGrid, isDesktop ? styles.programGridDesktop : null]}>
              {programs.map((item) => (
                <View key={item.title} style={[styles.programCard, isDesktop ? styles.programCardDesktop : null]}>
                  <View style={[styles.programAccent, { backgroundColor: item.tone }]} />
                  <Text style={styles.programTag}>{item.tag}</Text>
                  <Text style={styles.programTitle}>{item.title}</Text>
                  <Text style={styles.programText}>{item.text}</Text>
                  <View style={[styles.programAction, { backgroundColor: item.actionBg }]}>
                    <View style={[styles.programActionIcon, { backgroundColor: item.tone }]}>
                      <Image source={homepageAssets.arrowRightWhite} style={styles.programActionArrowImage} contentFit="contain" accessibilityLabel="Detay ok ikonu" />
                    </View>
                    <Text style={styles.programActionText}>Detayları incele</Text>
                  </View>
                  <Text style={[styles.programGhost, { color: item.tone }]}>{item.tag === 'TOEFL iBT' ? '4' : item.tag === 'Speaking' ? 'S' : item.tag === 'Writing' ? 'W' : 'P'}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={[styles.darkSection, isCompact ? styles.darkSectionMobile : null]} onLayout={markSection('toefl')}>
          <View style={[styles.container, styles.darkContent, isDesktop ? null : styles.darkContentStack]}>
            <View style={[styles.darkCopy, isDesktop ? styles.darkCopyDesktop : styles.darkCopyStack]}>
              <Text style={styles.darkKicker}>TOEFL iBT</Text>
              <Text style={[styles.darkTitle, isCompact ? styles.darkTitleMobile : null]}>Dört beceri ayrı çalışılır, sonuç tek hazırlık yolunda birleşir.</Text>
              <Text style={[styles.darkText, isCompact ? styles.darkTextMobile : null]}>
                Akademik Skor öğrencinin okuma, dinleme, konuşma ve yazma becerilerini ayrı ayrı tanıtır. Giriş sonrası bu beceriler hedefe göre planlanan çalışma akışına dönüşür.
              </Text>
            </View>
            <View style={[styles.skillGrid, isDesktop ? styles.skillGridDesktop : styles.skillGridStack, isTablet ? styles.skillGridWide : null, isCompact ? styles.skillGridMobile : null]}>
              {toeflSkills.map((item) => (
                <View
                  key={item.title}
                  style={[
                    styles.skillCard,
                    isTablet ? styles.skillCardWide : styles.skillCardMobile,
                    { backgroundColor: item.bg, borderColor: item.color },
                  ]}
                >
                  <View style={[styles.skillMedia, isCompact ? styles.skillMediaMobile : { minHeight: skillImageHeight + 18 }]}>
                    <Image
                      source={item.image}
                      style={[styles.skillImage, isCompact ? styles.skillImageMobile : { width: skillImageWidth, height: skillImageHeight }]}
                      contentFit="contain"
                      accessibilityLabel={item.imageLabel}
                    />
                    <View style={[styles.skillIcon, isCompact ? styles.skillIconMobile : styles.skillIconFloating, { backgroundColor: item.color }]}>
                      <Text style={styles.skillIconText}>{item.icon}</Text>
                    </View>
                  </View>
                  <Text style={styles.skillTitle}>{item.title}</Text>
                  <Text style={styles.skillText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.announcementSection}>
          <View style={styles.container}>
            <View style={styles.compactSliderHead}>
              <Text style={styles.compactSliderTitle}>Duyurular ve Haberler</Text>
              <View style={styles.sliderControls}>
                <Pressable accessibilityRole="button" accessibilityLabel="Önceki duyuru" onPress={() => moveAnnouncement(-1)} style={({ pressed }) => [styles.roundButton, pressed ? styles.pressed : null]}>
                  <Image source={homepageAssets.carouselLeft} style={styles.roundButtonImage} contentFit="contain" accessibilityLabel="Önceki" />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Sonraki duyuru" onPress={() => moveAnnouncement(1)} style={({ pressed }) => [styles.roundButton, pressed ? styles.pressed : null]}>
                  <Image source={homepageAssets.carouselRight} style={styles.roundButtonImage} contentFit="contain" accessibilityLabel="Sonraki" />
                </Pressable>
              </View>
            </View>

            <ScrollView ref={announcementRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalTrack}>
              {announcements.map((item) => (
                <View key={item.title} style={[styles.announcementCard, { width: cardWidth }]}>
                  <View style={[styles.announcementMark, { backgroundColor: item.color }]} />
                  <Text style={styles.announcementCategory}>{item.category}</Text>
                  <Text style={styles.announcementTitle}>{item.title}</Text>
                  <Text style={styles.announcementText}>{item.text}</Text>
                  <View style={styles.announcementMetaRow}>
                    <Text style={styles.announcementMeta}>{item.meta}</Text>
                    <Text style={[styles.announcementMore, { color: item.color }]}>{'Detay >'}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.dots}>
              {announcements.map((item, index) => (
                <View key={item.title} style={[styles.dot, activeAnnouncement === index ? styles.dotActive : null]} />
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.resourcesSection, isCompact ? styles.resourcesSectionMobile : null]} onLayout={markSection('resources')}>
          <View style={[styles.container, styles.resourcesLayout, isDesktop ? null : styles.resourcesLayoutStack]}>
            {!isCompact ? (
              <View style={styles.resourcesVisualColumn}>
                <Image
                  source={require('@/assets/images/skill-listening.png')}
                  style={[styles.resourcesImage, { width: resourcesVisualWidth, height: resourcesVisualHeight }]}
                  contentFit="contain"
                  accessibilityLabel="Ücretsiz kaynaklar için kulaklık ve çalışma görseli"
                />
                <Text style={styles.resourcesVisualArrow}>{'→'}</Text>
              </View>
            ) : null}

            <View style={[styles.resourcesCopy, isDesktop ? styles.resourcesCopyDesktop : null, isCompact ? styles.resourcesCopyMobile : null]}>
              <Text style={styles.sectionKicker}>ÜCRETSİZ KAYNAKLAR</Text>
              <Text style={[styles.resourcesTitle, isCompact ? styles.resourcesTitleMobile : null]}>Başlamadan önce sınavı ve çalışma yolunu netleştirin.</Text>
              <Text style={styles.resourcesText}>
                Öğrencinin platforma girmeden önce inceleyebileceği rehberler, örnek çalışma sayfaları ve kısa video içerikleri bu bölümde toplanır.
              </Text>
              <Pressable accessibilityRole="button" onPress={() => goToSection('contact')} style={({ pressed }) => [styles.resourcesButton, isCompact ? styles.resourcesButtonMobile : null, pressed ? styles.pressed : null]}>
                <Text style={styles.resourcesButtonText}>Kaynaklardan Haberdar Ol</Text>
                <Text style={styles.resourcesButtonIcon}>{'>'}</Text>
              </Pressable>
            </View>

            <View style={[styles.resourceList, isCompact ? styles.resourceListMobile : null]}>
              {resources.map((item, index) => (
                <View key={item.title} style={[styles.resourceRow, isCompact ? styles.resourceRowMobile : null, index === resources.length - 1 ? styles.resourceRowLast : null]}>
                  <Image source={item.badgeImage} style={[styles.resourceBadgeImage, isCompact ? styles.resourceBadgeImageMobile : null]} contentFit="contain" accessibilityLabel={`${item.glyph} kaynak rozeti`} />
                  <View style={styles.resourceTextBlock}>
                    <Text style={[styles.resourceTitle, isCompact ? styles.resourceTitleMobile : null]}>{item.title}</Text>
                    <Text style={[styles.resourceDescription, isCompact ? styles.resourceDescriptionMobile : null]}>{item.text}</Text>
                  </View>
                  <Image source={item.arrowImage} style={[styles.resourceArrowImage, isCompact ? styles.resourceArrowImageMobile : null]} contentFit="contain" accessibilityLabel="Kaynak aç" />
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.testimonialSection}>
          <View style={styles.container}>
            <View style={[styles.sliderHead, isCompact ? styles.sliderHeadMobile : null]}>
              <View style={styles.sectionIntro}>
                <Text style={styles.sectionKicker}>ÖĞRENCİ GÖRÜŞLERİ</Text>
                <Text style={styles.sectionTitle}>Akademik Skor öğrencileri ne söylüyor?</Text>
                <Text style={styles.sectionText}>İlk yayında gerçek kullanıcı yorumları ve başarı hikayeleri bu alanda güncellenecek.</Text>
              </View>
              <View style={styles.sliderControls}>
                <Pressable accessibilityRole="button" accessibilityLabel="Önceki yorum" onPress={() => moveTestimonial(-1)} style={({ pressed }) => [styles.roundButton, pressed ? styles.pressed : null]}>
                  <Image source={homepageAssets.carouselLeft} style={styles.roundButtonImage} contentFit="contain" accessibilityLabel="Önceki" />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Sonraki yorum" onPress={() => moveTestimonial(1)} style={({ pressed }) => [styles.roundButton, pressed ? styles.pressed : null]}>
                  <Image source={homepageAssets.carouselRight} style={styles.roundButtonImage} contentFit="contain" accessibilityLabel="Sonraki" />
                </Pressable>
              </View>
            </View>
            <ScrollView
              ref={testimonialRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={testimonialWidth + 16}
              decelerationRate="fast"
              contentContainerStyle={styles.testimonialTrack}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / (testimonialWidth + 16));
                setActiveTestimonial(Math.max(0, Math.min(testimonials.length - 1, index)));
              }}
            >
              {testimonials.map((item) => (
                <View key={item.name} style={[styles.testimonialCard, { width: testimonialWidth }]}>
                  <Text style={styles.quoteMark}>{'“'}</Text>
                  <Text style={styles.testimonialText}>{item.quote}</Text>
                  <View style={styles.testimonialPerson}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.initials}</Text>
                    </View>
                    <View style={styles.personCopy}>
                      <Text style={styles.personName}>{item.name}</Text>
                      <Text style={styles.personMeta}>{item.meta}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.dots}>
              {testimonials.map((item, index) => (
                <View key={item.name} style={[styles.dot, activeTestimonial === index ? styles.dotActive : null]} />
              ))}
            </View>
          </View>
        </View>
        <View style={styles.contactSection} onLayout={markSection('contact')}>
          <View style={[styles.container, styles.contactLayout, isDesktop ? null : styles.contactLayoutStack]}>
            <View style={[styles.contactLeftColumn, isDesktop ? styles.contactLeftColumnDesktop : styles.contactLeftColumnMobile]}>
              {!isCompact ? (
                <View style={[styles.contactImageShell, { height: contactImageHeight }]}>
                  <Image
                    source={require('@/assets/images/contact-support.png')}
                    style={styles.contactImageStandalone}
                    contentFit="contain"
                    accessibilityLabel="Akademik Skor demo ve iletişim görüşmesi"
                  />
                </View>
              ) : null}
              <View style={styles.contactCopy}>
                <Text style={styles.contactKicker}>İLETİŞİM</Text>
                <Text style={[styles.contactTitle, isCompact ? styles.contactTitleMobile : null]}>Demo ve bilgilendirme için bize ulaşın.</Text>
                <Text style={styles.contactText}>
                  Akademik Skor platformunu öğrenci, öğretmen veya kurum kullanımı için birlikte planlayalım. İhtiyacınızı yazın; size uygun kullanım senaryosunu ve ilk kurulum adımlarını paylaşalım.
                </Text>
              </View>
            </View>

            <View style={[styles.contactCard, isDesktop ? styles.contactCardDesktop : null, isCompact ? styles.contactCardMobile : null]}>
              <Text style={styles.contactCardTitle}>Demo talebi</Text>
              <Text style={styles.contactCardText}>Video ders, AI analiz ve kurum kullanım seçeneklerini kısa bir görüşmede birlikte netleştirelim.</Text>
              <TextInput
                accessibilityLabel="Ad Soyad"
                autoCapitalize="words"
                placeholder="Ad Soyad"
                placeholderTextColor={palette.muted}
                value={demoName}
                onChangeText={setDemoName}
                style={styles.contactInput}
              />
              <TextInput
                accessibilityLabel="E-posta veya telefon"
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="E-posta veya telefon"
                placeholderTextColor={palette.muted}
                value={demoContact}
                onChangeText={setDemoContact}
                onSubmitEditing={handleDemoRequest}
                style={styles.contactInput}
              />
              {demoMessage ? (
                <Text accessibilityLiveRegion="polite" style={[styles.contactFeedback, demoMessageTone === 'success' ? styles.contactFeedbackSuccess : styles.contactFeedbackError]}>
                  {demoMessage}
                </Text>
              ) : null}
              <Pressable accessibilityRole="button" accessibilityLabel="Demo talebi oluştur" onPress={handleDemoRequest} style={({ pressed }) => [styles.contactButton, pressed ? styles.pressed : null]}>
                <Text style={styles.contactButtonText}>Talep Oluştur</Text>
              </Pressable>
            </View>
          </View>
        </View>
        <View style={styles.footer}>
          <View style={[styles.container, styles.footerInner, isCompact ? styles.footerInnerMobile : null]}>
            <View style={styles.footerBrandArea}>
              <Text style={styles.footerBrand}>Akademik Skor</Text>
              <Text style={styles.footerText}>TOEFL iBT ve akademik İngilizce hazırlığı için sade, ölçülebilir ve yapay zeka destekli öğrenme platformu.</Text>
            </View>
            <View style={styles.footerLinks}>
              {navItems.map((item) => (
                <Pressable key={item.label} accessibilityRole="button" onPress={() => goToSection(item.target)} style={({ pressed }) => [pressed ? styles.pressed : null]}>
                  <Text style={styles.footerLink}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.chatLayer, isCompact ? styles.chatLayerMobile : null]}>
        {isChatOpen ? (
          <View style={[styles.chatPanel, { width: isTablet ? 388 : mobileWidth }]}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderBrand}>
                <View style={styles.chatMiniIcon}>
                  <Text style={styles.chatMiniText}>AI</Text>
                </View>
                <View style={styles.chatHeaderText}>
                  <Text style={styles.chatTitle}>Akademik Skor Asistanı</Text>
                  <Text style={styles.chatSub}>Hedefinizi anlamak için hazır</Text>
                </View>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Chatbot penceresini kapat" onPress={() => setIsChatOpen(false)} style={({ pressed }) => [styles.chatClose, pressed ? styles.pressed : null]}>
                <Text style={styles.chatCloseText}>x</Text>
              </Pressable>
            </View>
            <View style={styles.chatBody}>
              <Text style={styles.chatNotice}>Bu alan giriş öncesi kısa bilgilendirme içindir. Kişisel çalışma planı için hesap açıldıktan sonra hedef skor ve sınav tarihi alınır.</Text>
              <View style={[styles.chatBubble, styles.botBubble]}>
                <Text style={styles.botText}>Merhaba, TOEFL iBT hedefin için hangi alanda destek arıyorsun?</Text>
              </View>
              <View style={[styles.chatBubble, styles.userBubble]}>
                <Text style={styles.userText}>Speaking ve writing geliştirmek istiyorum.</Text>
              </View>
              <View style={[styles.chatBubble, styles.botBubble]}>
                <Text style={styles.botText}>Harika. Sana video ders, speaking kaydı ve writing rubriğiyle başlayan bir yol önerebilirim.</Text>
              </View>
            </View>
            <View style={styles.chatInput}>
              <Text style={styles.chatInputText}>Mesajınızı yazın...</Text>
              <Text style={styles.chatSend}>{'>'}</Text>
            </View>
          </View>
        ) : null}

        <Pressable accessibilityRole="button" accessibilityLabel="Akademik Skor chatbot" onPress={() => setIsChatOpen((value) => !value)} style={({ pressed }) => [styles.chatLauncher, isCompact ? styles.chatLauncherMobile : null, pressed ? styles.pressed : null]}>
          <View style={[styles.chatFace, isCompact ? styles.chatFaceMobile : null]}>
            <View style={styles.chatEyes}>
              <View style={styles.chatEye} />
              <View style={styles.chatEye} />
            </View>
            <View style={styles.chatMouth} />
            <View style={styles.chatTail} />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.page, fontFamily: homeFontFamily },
  scroll: { flex: 1, backgroundColor: palette.page, fontFamily: homeFontFamily },
  page: { minHeight: '100%', backgroundColor: palette.page, fontFamily: homeFontFamily },
  container: { width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 26 },
  navLineIcon: { width: 28, height: 28, position: 'relative', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  homeRoofLeft: { position: 'absolute', top: 6, left: 5, width: 10, height: 2.5, borderRadius: 2, transform: [{ rotate: '-42deg' }] },
  homeRoofRight: { position: 'absolute', top: 6, right: 5, width: 10, height: 2.5, borderRadius: 2, transform: [{ rotate: '42deg' }] },
  homeBase: { position: 'absolute', left: 6, bottom: 4, width: 12, height: 11, borderWidth: 2.2, borderTopWidth: 0, borderRadius: 2 },
  peopleHeadLeft: { position: 'absolute', left: 4, top: 4, width: 7, height: 7, borderWidth: 2, borderRadius: 4 },
  peopleHeadRight: { position: 'absolute', right: 4, top: 4, width: 7, height: 7, borderWidth: 2, borderRadius: 4 },
  peopleBodyLeft: { position: 'absolute', left: 2, bottom: 4, width: 11, height: 8, borderWidth: 2, borderBottomWidth: 0, borderRadius: 8 },
  peopleBodyRight: { position: 'absolute', right: 2, bottom: 4, width: 11, height: 8, borderWidth: 2, borderBottomWidth: 0, borderRadius: 8 },
  bookPageLeft: { position: 'absolute', left: 3, top: 4, width: 9, height: 16, borderWidth: 2, borderRightWidth: 1, borderRadius: 2 },
  bookPageRight: { position: 'absolute', right: 3, top: 4, width: 9, height: 16, borderWidth: 2, borderLeftWidth: 1, borderRadius: 2 },
  bookSpine: { position: 'absolute', top: 5, width: 2, height: 15, borderRadius: 1 },
  documentFrame: { position: 'absolute', left: 5, top: 3, width: 14, height: 18, borderWidth: 2, borderRadius: 2 },
  documentFold: { position: 'absolute', right: 5, top: 3, width: 6, height: 6, borderLeftWidth: 2, borderBottomWidth: 2 },
  documentLineOne: { position: 'absolute', left: 8, top: 11, width: 8, height: 2, borderRadius: 1 },
  documentLineTwo: { position: 'absolute', left: 8, top: 15, width: 7, height: 2, borderRadius: 1 },
  mailFrame: { position: 'absolute', left: 3, top: 6, width: 18, height: 13, borderWidth: 2, borderRadius: 2 },
  mailDiagonalLeft: { position: 'absolute', left: 5, top: 10, width: 10, height: 2, borderRadius: 1, transform: [{ rotate: '35deg' }] },
  mailDiagonalRight: { position: 'absolute', right: 5, top: 10, width: 10, height: 2, borderRadius: 1, transform: [{ rotate: '-35deg' }] },
  userHead: { position: 'absolute', top: 4, width: 8, height: 8, borderWidth: 2, borderRadius: 5 },
  userBody: { position: 'absolute', bottom: 4, width: 15, height: 8, borderWidth: 2, borderBottomWidth: 0, borderRadius: 9 },  topStrip: { display: 'none', backgroundColor: palette.navyDeep },
  topStripInner: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  topStripInnerMobile: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 18 },
  topText: { fontFamily: homeFontFamily, color: palette.yellow, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  topLink: { fontFamily: homeFontFamily, color: '#ffffff', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  header: { backgroundColor: palette.navyDeep, paddingHorizontal: 12, paddingTop: 28, paddingBottom: 0 },
  headerMobile: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12 },
  headerInner: { maxWidth: 2020, minHeight: 118, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)', paddingHorizontal: 38, shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 4 },
  headerInnerCompact: { justifyContent: 'flex-start' },
  headerInnerTablet: { minHeight: 110, flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 14 },
  headerInnerMobile: { minHeight: 74, paddingHorizontal: 12, justifyContent: 'flex-start', gap: 10, borderRadius: 12 },
  menuButton: { width: 42, height: 42, borderRadius: 8, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#ffffff' },
  menuLine: { width: 19, height: 2, borderRadius: 1, backgroundColor: palette.ink },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14, minWidth: 0, flexShrink: 0 },
  brandCompactHeader: { flex: 1, flexShrink: 1 },
  brandTablet: { flexBasis: 286, flexGrow: 0, flexShrink: 1, minWidth: 210 },
  brandMobile: { gap: 10 },
  logoMark: { width: 66, height: 66, borderRadius: 8, backgroundColor: palette.yellow, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoMarkTablet: { width: 54, height: 54 },
  logoMarkMobile: { width: 54, height: 54 },
  logoImage: { width: '100%', height: '100%' },
  logoImageMobile: { width: '100%', height: '100%' },
  logoText: { fontFamily: homeFontFamily, color: palette.navyDeep, fontSize: 31, lineHeight: 36, fontWeight: '700' },
  logoTextMobile: { fontFamily: homeFontFamily, fontSize: 29, lineHeight: 34 },
  brandCopy: { minWidth: 0, flexShrink: 1 },
  brandCopyTablet: { flexShrink: 1 },
  brandCopyMobile: { flex: 1, minWidth: 0 },
  brandTitle: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 28, lineHeight: 34, fontWeight: '700', flexShrink: 1 },
  brandTitleTablet: { fontSize: 24, lineHeight: 29 },
  brandTitleMobile: { fontFamily: homeFontFamily, fontSize: 22, lineHeight: 26, flexShrink: 1 },
  brandSub: { fontFamily: homeFontFamily, color: palette.text, fontSize: 15, lineHeight: 20, fontWeight: '600', flexShrink: 1 },
  brandSubTablet: { fontSize: 12, lineHeight: 17 },
  brandSubMobile: { fontFamily: homeFontFamily, fontSize: 13, lineHeight: 17 },
  nav: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, minWidth: 0, marginLeft: 12 },
  navItem: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 0, position: 'relative', minWidth: 0, flexShrink: 1 },
  navItemActive: {},
  navTablet: { flex: 1, flexBasis: 0, flexShrink: 1, width: 'auto', marginLeft: 0, justifyContent: 'space-between', gap: 10, paddingTop: 0, borderTopWidth: 0 },
  navItemTablet: { minHeight: 50, gap: 6 },
  navActiveLine: { position: 'absolute', bottom: -18, width: 100, height: 4, borderRadius: 2, backgroundColor: palette.yellow },
  navActiveLineTablet: { bottom: -18, width: 70, height: 3 },
  navText: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 15, lineHeight: 20, fontWeight: '600', flexShrink: 0 },
  navTextTablet: { fontSize: 13, lineHeight: 18, flexShrink: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 0, marginLeft: 12 },
  headerActionsTablet: { marginLeft: 8, gap: 10 },
  headerDivider: { width: 1, height: 36, backgroundColor: palette.line, marginRight: 4 },
  ghostButton: { minHeight: 64, borderRadius: 8, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ffffff', shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  ghostButtonTablet: { minHeight: 52, paddingHorizontal: 14, gap: 7 },
  headerUserImage: { width: 28, height: 28, flexShrink: 0 },
  headerUserImageTablet: { width: 22, height: 22 },
  ghostButtonText: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 16, lineHeight: 21, fontWeight: '600' },
  ghostButtonTextTablet: { fontSize: 14, lineHeight: 18 },
  headerButton: { minHeight: 64, minWidth: 220, borderRadius: 8, paddingHorizontal: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: palette.yellow, shadowColor: '#d99b00', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  headerButtonTablet: { minHeight: 52, minWidth: 176, paddingHorizontal: 16, gap: 7 },
  headerButtonText: { fontFamily: homeFontFamily, color: palette.navyDeep, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  headerButtonTextTablet: { fontSize: 14, lineHeight: 18 },
  headerButtonArrow: { fontFamily: homeFontFamily, color: palette.navyDeep, fontSize: 17, lineHeight: 21, fontWeight: '700' },
  mobileDrawer: { marginHorizontal: 18, marginBottom: 14, borderRadius: 8, overflow: 'hidden', backgroundColor: '#ffffff', borderWidth: 1, borderColor: palette.line },
  mobileNavItem: { minHeight: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 10, borderBottomWidth: 1, borderBottomColor: palette.line },
  mobileNavText: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  mobileActionRow: { flexDirection: 'row', gap: 8, padding: 12 },
  mobileGhost: { flex: 0.82, minWidth: 0, minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  mobileGhostText: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  mobilePrimary: { flex: 1.18, minWidth: 0, minHeight: 44, borderRadius: 8, backgroundColor: palette.yellow, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  mobilePrimaryText: { fontFamily: homeFontFamily, color: palette.navyDeep, fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  heroSection: { backgroundColor: palette.navy, paddingTop: 46, paddingBottom: 64 },
  heroSectionMobile: { paddingTop: 18, paddingBottom: 34 },
  heroLayout: { alignItems: 'center' },
  heroLayoutDesktop: { flexDirection: 'row' },
  heroLayoutStack: { gap: 0 },
  heroMedia: { minWidth: 0, width: '100%', backgroundColor: 'transparent', overflow: 'hidden' },
  heroMediaDesktop: { flex: 1.08, backgroundColor: palette.yellow },
  heroMediaMobile: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  heroImage: { width: '100%' },
  heroCard: { minWidth: 0, backgroundColor: '#ffffff', padding: 38, borderRadius: 0, borderTopWidth: 8, borderTopColor: palette.yellow, shadowColor: '#000000', shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  heroCardDesktop: { flex: 0.92, marginLeft: -76 },
  heroCardMobile: { width: '92%', alignSelf: 'center', marginTop: 0, padding: 24, flexGrow: 0, flexShrink: 0 },
  heroEyebrow: { fontFamily: homeFontFamily, color: palette.orange, fontSize: 13, lineHeight: 18, fontWeight: '700', marginBottom: 12 },
  heroTitle: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 50, lineHeight: 55, fontWeight: '700', maxWidth: 560, flexShrink: 1 },
  heroTitleMobile: { fontFamily: homeFontFamily, fontSize: 32, lineHeight: 37 },
  heroText: { fontFamily: homeFontFamily, color: palette.text, fontSize: 16, lineHeight: 26, fontWeight: '500', marginTop: 18, maxWidth: 560, flexShrink: 1 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 28 },
  heroActionsMobile: { flexDirection: 'column' },
  primaryButton: { minHeight: 50, borderRadius: 6, backgroundColor: palette.yellow, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  primaryButtonText: { fontFamily: homeFontFamily, color: palette.navyDeep, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  secondaryButton: { minHeight: 50, borderRadius: 6, borderWidth: 1, borderColor: palette.line, backgroundColor: '#ffffff', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  secondaryButtonText: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  capabilityTimeline: {
    flexDirection: 'row',
    alignItems: 'stretch',
    position: 'relative',
    gap: 0,
    paddingTop: 32,
    paddingBottom: 32,
  },
  capabilityTimelineMobile: {
    flexDirection: 'column',
    gap: 12,
    paddingTop: 18,
    paddingBottom: 26,
  },
  capabilityConnector: {
    position: 'absolute',
    left: 44,
    right: 44,
    top: 57,
    height: 1,
    backgroundColor: '#cfd2df',
  },
  capabilityStep: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 6,
  },
  capabilityStepMobile: {
    width: '100%',
    minWidth: 0,
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    paddingVertical: 16,
    paddingLeft: 72,
    paddingRight: 18,
    borderLeftWidth: 3,
    borderLeftColor: '#e2e4ee',
    backgroundColor: palette.surface,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  capabilityNode: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    zIndex: 2,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
  },
  capabilityNodeText: {
    fontFamily: homeFontFamily, fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  capabilityNodeMobile: {
    position: 'absolute',
    left: 16,
    top: 16,
    marginBottom: 0,
  },
  capabilityStem: {
    position: 'absolute',
    left: 44,
    top: 56,
    bottom: 6,
    width: 1,
    opacity: 0.28,
  },
  capabilityStemMobile: {
    left: 40,
    top: 66,
    bottom: 16,
  },
  capabilityTitle: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 9,
    flexShrink: 1,
  },
  capabilityTitleMobile: {
    fontFamily: homeFontFamily, fontSize: 20,
    lineHeight: 26,
  },
  capabilityText: {
    color: palette.text,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '500',
    flexShrink: 1,
  },
  capabilityTextMobile: {
    fontFamily: homeFontFamily, fontSize: 14,
    lineHeight: 22,
  },
  programSection: { backgroundColor: '#fbfbf8', paddingVertical: 64 },
  programSectionMobile: { paddingVertical: 42 },
  whyTop: { marginBottom: 32 },
  whyTopDesktop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 44 },
  whyTopStack: { gap: 24 },
  whyIntroCopy: { width: '100%', minWidth: 0, maxWidth: 860, flexGrow: 1, flexShrink: 1, flexBasis: 0 },
  whyIntroCopyDesktop: { flexBasis: '58%', maxWidth: 760 },
  whyIntroCopyMobile: { maxWidth: '100%', flexBasis: 'auto', flexGrow: 0, flexShrink: 0, marginBottom: 0 },
  whyVisual: { minWidth: 0, alignItems: 'center', justifyContent: 'center', flexGrow: 0, flexShrink: 0 },
  whyVisualDesktop: { flexBasis: 360, width: 360, maxWidth: 380 },
  whyVisualMobile: { width: '74%', maxWidth: 260, alignSelf: 'center', marginTop: 0 },
  whyVisualImage: { width: '100%', height: '100%' },
  sectionIntro: { width: '100%', maxWidth: 820, marginBottom: 28 },
  sectionIntroMobile: { marginBottom: 0 },
  sectionKicker: { fontFamily: homeFontFamily, color: palette.teal, fontSize: 13, lineHeight: 18, fontWeight: '700', marginBottom: 10 },
  sectionTitle: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 40, lineHeight: 46, fontWeight: '700', flexShrink: 1 },
  sectionTitleMobile: { fontFamily: homeFontFamily, fontSize: 30, lineHeight: 36 },
  sectionText: { fontFamily: homeFontFamily, color: palette.text, fontSize: 16, lineHeight: 26, fontWeight: '500', marginTop: 12, maxWidth: 820, flexShrink: 1 },
  programGrid: { gap: 16 },
  programGridDesktop: { flexDirection: 'row', alignItems: 'stretch', flexWrap: 'wrap' },
  programCard: { flexGrow: 0, flexShrink: 0, minWidth: 240, backgroundColor: '#ffffff', borderRadius: 6, padding: 26, borderWidth: 1, borderColor: palette.line, position: 'relative', overflow: 'hidden' },
  programCardDesktop: { flex: 1, minHeight: 430 },
  programAccent: { position: 'absolute', left: 0, top: 0, width: 7, bottom: 0 },
  programTag: { fontFamily: homeFontFamily, color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: '700', marginLeft: 2 },
  programTitle: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 23, lineHeight: 30, fontWeight: '700', marginTop: 20, flexShrink: 1 },
  programText: { fontFamily: homeFontFamily, color: palette.text, fontSize: 14, lineHeight: 23, fontWeight: '500', marginTop: 10, flexShrink: 1 },
  programAction: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'flex-start', marginTop: 'auto', backgroundColor: '#fff8df', borderRadius: 28, paddingRight: 20, minHeight: 52 },
  programActionIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  programActionArrowImage: { width: 34, height: 34 },
  programActionArrow: { fontFamily: homeFontFamily, color: '#ffffff', fontSize: 22, lineHeight: 24, fontWeight: '700', marginTop: -1 },
  programActionText: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  programGhost: { fontFamily: homeFontFamily, position: 'absolute', right: 24, bottom: 76, fontSize: 60, lineHeight: 66, fontWeight: '700', opacity: 0.08 },
  programArrow: { fontFamily: homeFontFamily, fontSize: 22, lineHeight: 26, fontWeight: '700', marginTop: 18 },
  darkSection: { backgroundColor: palette.navyDeep, paddingVertical: 58 },
  darkSectionMobile: { paddingTop: 42, paddingBottom: 36 },
  darkContent: { flexDirection: 'row', alignItems: 'center', gap: 48 },
  darkContentStack: { flexDirection: 'column', alignItems: 'stretch', gap: 22 },
  darkCopy: { flex: 0.92, minWidth: 0 },
  darkCopyDesktop: { maxWidth: 520 },
  darkCopyStack: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', width: '100%' },
  darkKicker: { fontFamily: homeFontFamily, color: palette.yellow, fontSize: 13, lineHeight: 18, fontWeight: '700', marginBottom: 14 },
  darkTitle: { fontFamily: homeFontFamily, color: '#ffffff', fontSize: 42, lineHeight: 52, fontWeight: '700', flexShrink: 1 },
  darkTitleMobile: { fontFamily: homeFontFamily, fontSize: 34, lineHeight: 42 },
  darkText: { fontFamily: homeFontFamily, color: '#eef1fb', fontSize: 16, lineHeight: 27, fontWeight: '600', marginTop: 16, flexShrink: 1 },
  darkTextMobile: { fontFamily: homeFontFamily, fontSize: 15, lineHeight: 25, marginTop: 14 },
  skillGrid: { flex: 1.35, gap: 16 },
  skillGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  skillGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  skillGridStack: { flexDirection: 'column', flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  skillGridMobile: { gap: 20 },
  skillCard: { borderWidth: 1, borderRadius: 0, padding: 24, minHeight: 250, position: 'relative', overflow: 'hidden' },
  skillCardWide: { flexBasis: '47.5%', flexGrow: 1 },
  skillCardMobile: { width: '100%', minHeight: 0, flexGrow: 0, flexShrink: 0, flexBasis: 'auto', paddingTop: 24, paddingBottom: 28 },
  skillMedia: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  skillMediaMobile: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 },
  skillImage: { maxWidth: '82%' },
  skillImageMobile: { width: 128, height: 92, maxWidth: '46%', flexShrink: 1, opacity: 0.96 },
  skillIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  skillIconMobile: { width: 58, height: 58, borderRadius: 29, flexShrink: 0 },
  skillIconFloating: { position: 'absolute', left: 0, top: 0 },
  skillIconText: { fontFamily: homeFontFamily, color: '#ffffff', fontSize: 17, lineHeight: 22, fontWeight: '700' },
  skillTitle: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 23, lineHeight: 30, fontWeight: '700', flexShrink: 1 },
  skillText: { fontFamily: homeFontFamily, color: palette.text, fontSize: 14, lineHeight: 23, fontWeight: '500', marginTop: 10, flexShrink: 1 },
  announcementSection: { backgroundColor: palette.page, paddingVertical: 58 },
  compactSliderHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 },
  compactSliderTitle: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 24, lineHeight: 30, fontWeight: '700' },
  sliderControls: { flexDirection: 'row', gap: 10, flexShrink: 0 },
  roundButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#ffffff', borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  roundButtonText: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 28, lineHeight: 31, fontWeight: '700' },
  roundButtonImage: { width: 34, height: 34 },
  horizontalTrack: { gap: 16, paddingRight: 26 },
  announcementCard: { minHeight: 238, backgroundColor: '#ffffff', borderRadius: 0, borderWidth: 1, borderColor: palette.line, padding: 22, overflow: 'hidden' },
  announcementMark: { width: 46, height: 5, marginBottom: 18 },
  announcementCategory: { fontFamily: homeFontFamily, color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: '700', textTransform: 'uppercase' },
  announcementTitle: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 22, lineHeight: 29, fontWeight: '700', marginTop: 10, flexShrink: 1 },
  announcementText: { fontFamily: homeFontFamily, color: palette.text, fontSize: 14, lineHeight: 23, fontWeight: '500', marginTop: 9, flexShrink: 1 },
  announcementMetaRow: { marginTop: 'auto', paddingTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  announcementMeta: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  announcementMore: { fontFamily: homeFontFamily, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  dots: { flexDirection: 'row', alignSelf: 'center', gap: 8, marginTop: 22, backgroundColor: '#ffffff', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#c4c8d3' },
  dotActive: { width: 28, backgroundColor: palette.orange },
  resourcesSection: { backgroundColor: '#e8f7f5', paddingVertical: 48, overflow: 'hidden' },
  resourcesSectionMobile: { paddingVertical: 34 },
  resourcesLayout: { flexDirection: 'row', gap: 28, alignItems: 'center' },
  resourcesLayoutStack: { flexDirection: 'column', alignItems: 'stretch', gap: 22 },
  resourcesVisualColumn: { flex: 0.42, minWidth: 170, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  resourcesVisualColumnMobile: { width: '100%', minWidth: 0, flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  resourcesImage: { flexShrink: 0 },
  resourcesVisualArrow: { fontFamily: homeFontFamily, position: 'absolute', right: -16, color: '#a6adba', fontSize: 28, lineHeight: 32, fontWeight: '700' },
  resourcesCopy: { flex: 0.86, minWidth: 0, maxWidth: 420 },
  resourcesCopyDesktop: { paddingLeft: 30, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.86)' },
  resourcesCopyMobile: { width: '100%', maxWidth: '100%', paddingLeft: 0, paddingBottom: 8, borderLeftWidth: 0, flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  resourcesTitle: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 28, lineHeight: 34, fontWeight: '700', flexShrink: 1 },
  resourcesTitleMobile: { fontFamily: homeFontFamily, fontSize: 28, lineHeight: 34 },
  resourcesText: { fontFamily: homeFontFamily, color: palette.text, fontSize: 15, lineHeight: 24, fontWeight: '500', marginTop: 14, maxWidth: 500, flexShrink: 1 },
  resourcesButton: { minHeight: 46, borderRadius: 6, backgroundColor: palette.yellow, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, alignSelf: 'flex-start', marginTop: 20, flexShrink: 0 },
  resourcesButtonMobile: { minHeight: 46, width: '100%', maxWidth: 266, marginTop: 18, marginBottom: 10, zIndex: 1 },
  resourcesButtonText: { fontFamily: homeFontFamily, color: palette.navyDeep, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  resourcesButtonIcon: { fontFamily: homeFontFamily, color: palette.navyDeep, fontSize: 15, lineHeight: 17, fontWeight: '700' },
  resourceList: { flex: 1.22, minWidth: 0, backgroundColor: '#ffffff', borderWidth: 1, borderColor: palette.line, borderRadius: 8, overflow: 'hidden', shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  resourceListMobile: { width: '100%', flexGrow: 0, flexShrink: 0, flexBasis: 'auto', marginTop: 24, zIndex: 0 },
  resourceRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: palette.line },
  resourceRowMobile: { minHeight: 74, gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  resourceRowLast: { borderBottomWidth: 0 },
  resourceIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  resourceBadgeImage: { width: 48, height: 48, flexShrink: 0 },
  resourceBadgeImageMobile: { width: 44, height: 44 },
  resourceIconMobile: { width: 42, height: 42, borderRadius: 21 },
  resourceIconText: { fontFamily: homeFontFamily, color: '#ffffff', fontSize: 13, lineHeight: 17, fontWeight: '700', textAlign: 'center' },
  resourceTextBlock: { flex: 1, minWidth: 0 },
  resourceTitle: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 13, lineHeight: 17, fontWeight: '700', flexShrink: 1 },
  resourceTitleMobile: { fontFamily: homeFontFamily, fontSize: 15, lineHeight: 20 },
  resourceDescription: { fontFamily: homeFontFamily, color: palette.text, fontSize: 11, lineHeight: 15, fontWeight: '500', marginTop: 2, flexShrink: 1 },
  resourceDescriptionMobile: { fontFamily: homeFontFamily, fontSize: 12, lineHeight: 17, marginTop: 3 },
  resourceArrowIcon: { fontFamily: homeFontFamily, color: palette.teal, fontSize: 18, lineHeight: 20, fontWeight: '700', flexShrink: 0 },
  resourceArrowImage: { width: 42, height: 42, flexShrink: 0 },
  resourceArrowImageMobile: { width: 38, height: 38 },
  testimonialSection: { backgroundColor: palette.page, paddingVertical: 58 },
  sliderHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginBottom: 22 },
  sliderHeadMobile: { flexDirection: 'column', alignItems: 'flex-start' },
  testimonialTrack: { gap: 16, paddingRight: 26 },
  testimonialCard: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: palette.line, borderRadius: 0, padding: 22, minHeight: 222 },
  quoteMark: { fontFamily: homeFontFamily, color: palette.teal, fontSize: 38, lineHeight: 34, fontWeight: '700', marginBottom: 6 },
  testimonialText: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 15, lineHeight: 24, fontWeight: '700', flexShrink: 1 },
  testimonialPerson: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderTopColor: palette.line },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.teal, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontFamily: homeFontFamily, color: '#ffffff', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  personCopy: { flex: 1, minWidth: 0 },
  personName: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  personMeta: { fontFamily: homeFontFamily, color: palette.text, fontSize: 12, lineHeight: 17, fontWeight: '600' },  contactSection: { backgroundColor: palette.navy, paddingVertical: 40 },
  contactLayout: { flexDirection: 'row', alignItems: 'center', gap: 42 },
  contactLayoutStack: { flexDirection: 'column', alignItems: 'stretch', gap: 22 },
  contactLeftColumn: { minWidth: 0, gap: 16 },
  contactLeftColumnDesktop: { flex: 1 },
  contactLeftColumnMobile: { width: '100%', flexGrow: 0, flexShrink: 0 },
  contactImageShell: { width: '100%', maxWidth: 500, alignSelf: 'flex-start', justifyContent: 'center', overflow: 'hidden' },
  contactImageStandalone: { width: '100%', height: '100%' },
  contactCopy: { minWidth: 0, maxWidth: 620, flexGrow: 0, flexShrink: 0 },
  contactKicker: { fontFamily: homeFontFamily, color: palette.yellow, fontSize: 13, lineHeight: 18, fontWeight: '700', marginBottom: 10 },
  contactTitle: { fontFamily: homeFontFamily, color: '#ffffff', fontSize: 36, lineHeight: 42, fontWeight: '700', flexShrink: 1 },
  contactTitleMobile: { fontFamily: homeFontFamily, fontSize: 29, lineHeight: 35 },
  contactText: { fontFamily: homeFontFamily, color: '#e2e4ef', fontSize: 15, lineHeight: 25, fontWeight: '500', marginTop: 12, flexShrink: 1 },
  contactCard: { minWidth: 0, backgroundColor: '#ffffff', borderRadius: 0, padding: 24, shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  contactCardDesktop: { flex: 0.78, minWidth: 330, alignSelf: 'center' },
  contactCardMobile: { width: '100%', alignSelf: 'stretch', padding: 20, flexGrow: 0, flexShrink: 0 },
  contactCardTitle: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 22, lineHeight: 28, fontWeight: '700', flexShrink: 1 },
  contactCardText: { fontFamily: homeFontFamily, color: palette.text, fontSize: 14, lineHeight: 22, fontWeight: '500', marginTop: 7, marginBottom: 14, flexShrink: 1 },
  contactInput: { fontFamily: homeFontFamily, minHeight: 45, borderWidth: 1, borderColor: palette.line, color: palette.ink, justifyContent: 'center', paddingHorizontal: 13, marginBottom: 10, backgroundColor: '#fbfbf8', fontSize: 13, lineHeight: 18, fontWeight: '600', outlineStyle: 'none' as never },
  contactFeedback: { fontFamily: homeFontFamily, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  contactFeedbackSuccess: { color: palette.teal, backgroundColor: palette.tealSoft, borderWidth: 1, borderColor: '#bfe3dd' },
  contactFeedbackError: { color: '#b42318', backgroundColor: '#fff1f0', borderWidth: 1, borderColor: '#ffd0cb' },
  contactButton: { minHeight: 47, borderRadius: 6, backgroundColor: palette.yellow, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  contactButtonText: { fontFamily: homeFontFamily, color: palette.navyDeep, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  footer: { backgroundColor: '#151728', paddingVertical: 34 },
  footerInner: { flexDirection: 'row', justifyContent: 'space-between', gap: 28 },
  footerInnerMobile: { flexDirection: 'column' },
  footerBrandArea: { flex: 1, minWidth: 0 },
  footerBrand: { fontFamily: homeFontFamily, color: '#ffffff', fontSize: 22, lineHeight: 28, fontWeight: '700' },
  footerText: { fontFamily: homeFontFamily, color: '#cfd2df', fontSize: 13, lineHeight: 21, fontWeight: '500', marginTop: 7, maxWidth: 520 },
  footerLinks: { flex: 1.1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'flex-end' },
  footerLink: { fontFamily: homeFontFamily, color: '#ffffff', fontSize: 13, lineHeight: 19, fontWeight: '700' },
  chatLayer: { position: Platform.select({ web: 'fixed', default: 'absolute' }) as 'absolute', right: 20, bottom: 20, zIndex: 1000, alignItems: 'flex-end', gap: 12 },
  chatLayerMobile: { right: 14, bottom: 14 },
  chatLauncher: { width: 62, height: 62, borderRadius: 31, backgroundColor: palette.teal, borderWidth: 4, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  chatLauncherMobile: { width: 58, height: 58, borderRadius: 29 },
  chatFace: { width: 38, height: 32, borderRadius: 13, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  chatFaceMobile: { width: 35, height: 30 },
  chatEyes: { flexDirection: 'row', gap: 7, marginBottom: 5 },
  chatEye: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.teal },
  chatMouth: { width: 18, height: 4, borderRadius: 2, backgroundColor: palette.tealSoft },
  chatTail: { position: 'absolute', right: -4, bottom: 6, width: 10, height: 10, borderRadius: 3, backgroundColor: '#ffffff', transform: [{ rotate: '45deg' }] },
  chatPanel: { height: 520, maxHeight: 620, backgroundColor: '#ffffff', borderRadius: 0, borderWidth: 1, borderColor: palette.line, overflow: 'hidden', shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  chatHeader: { minHeight: 72, backgroundColor: palette.navyDeep, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  chatHeaderBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  chatMiniIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.yellow, alignItems: 'center', justifyContent: 'center' },
  chatMiniText: { fontFamily: homeFontFamily, color: palette.navyDeep, fontSize: 13, lineHeight: 17, fontWeight: '700' },
  chatHeaderText: { flex: 1, minWidth: 0 },
  chatTitle: { fontFamily: homeFontFamily, color: '#ffffff', fontSize: 16, lineHeight: 21, fontWeight: '700' },
  chatSub: { fontFamily: homeFontFamily, color: '#d8dbea', fontSize: 12, lineHeight: 16, fontWeight: '500' },
  chatClose: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  chatCloseText: { fontFamily: homeFontFamily, color: '#ffffff', fontSize: 24, lineHeight: 28, fontWeight: '600' },
  chatBody: { flex: 1, padding: 16, gap: 10 },
  chatNotice: { fontFamily: homeFontFamily, color: palette.text, fontSize: 13, lineHeight: 21, fontWeight: '500', borderWidth: 1, borderColor: palette.line, padding: 12 },
  chatBubble: { maxWidth: '88%', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  botBubble: { alignSelf: 'flex-start', backgroundColor: palette.soft },
  userBubble: { alignSelf: 'flex-end', backgroundColor: palette.teal },
  botText: { fontFamily: homeFontFamily, color: palette.ink, fontSize: 13, lineHeight: 20, fontWeight: '500' },
  userText: { fontFamily: homeFontFamily, color: '#ffffff', fontSize: 13, lineHeight: 20, fontWeight: '700' },
  chatInput: { minHeight: 56, margin: 14, borderWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  chatInputText: { fontFamily: homeFontFamily, flex: 1, minWidth: 0, color: palette.muted, fontSize: 14, lineHeight: 19, fontWeight: '500', paddingHorizontal: 14 },
  chatSend: { fontFamily: homeFontFamily, width: 52, textAlign: 'center', color: palette.teal, fontSize: 22, lineHeight: 27, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});

















