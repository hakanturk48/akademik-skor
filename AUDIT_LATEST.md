# Son Audit: Admin Yayınlama ve Sürüm Geçmişi

Tarih: 7 Eylül 2026

Proje: `C:\Users\Muhendislik\Documents\ChatGPT\akademik-skor`

Bu dosya, sonraki "son audit raporundan devam et" isteği için başlangıç kaydıdır.

## Sonuç ve Kapsam

Mevcut `/admin` paneline Draft, Review, Published ve Archived durumları eklendi. Editör; Save Draft, Submit for Review, Preview, Publish ve Versions işlemlerini destekliyor. Publish, Archive ve Restore için onay gerekiyor.

Bu uygulama şu anda **yerel admin çalışma alanıdır**. Kayıtlar tarayıcının localStorage alanında tutulur. Sunucu, veritabanı, doğrulanmış sunucu oturumu ve öğrenci kataloglarına merkezi yayın bağlantısı mevcut değildir. Bu çalışma production yayınlama veya güvenilir server-side yetkilendirme olarak değerlendirilmemelidir.

Öğrenci shell'i, ana sayfa, genel fontlar ve video oynatıcı işleyişi değiştirilmedi. Page Builder ve ödeme yönetimi eklenmedi.

## Uygulanan Davranışlar

- Save Draft yeni sürüm oluşturur; daha önce yayınlanmış sürümü değiştirmez.
- Submit for Review ayrı Review durumu oluşturur. Soru bankası filtreleri dört yayın durumunu ayırır.
- Publish temel alanları, benzersiz slug'ı, katalog ilişkilerini, taxonomy uyumunu ve soruların seçeneklerini doğrular.
- Navigation yayını yalnız mevcut izinli route registry içindeki adresleri kabul eder.
- Yayınlanmış içerikte taslak düzenleme yapılınca son yayınlanmış kopya korunur.
- Archive fiziksel silme yapmaz. Yayınlanmış bağımlılıklar varsa işlem engellenir.
- Reorder eşit sortOrder değerlerini de işler; değişen kayıtlar yeni taslak sürümleri alır.
- Versions alanında önceki içerik, kullanıcı, tarih ve alan bazlı before/after farkları görülebilir.
- Restore seçilen eski sürümden yeni bir Draft üretir. Önceki sürümler ve canlı kopya korunur.
- Kayıt hatasında editör açık kalır. Tarayıcı depolama hataları ve eski sekmeden kayıt girişimleri kullanıcıya bildirilir.

## Veri Mimarisi

`AdminDocument`: collection, entityId, status, version, published snapshot, revisions.

`AdminRevision`: version, status, snapshot, actor, timestamp, action, restoredFrom, diff.

İçerik snapshot alanları: createdBy, updatedBy, publishedBy, publishedAt, version. Kullanıcı kaydı yalnız id, email ve role alanlarını içerir. Önceden var olan kayıtlarda bilinmeyen kullanıcı ve yayın tarihi null bırakılır.

Audit kayıtları: user, action, entityType, entityId, timestamp, summary, version. Kayıtlar sürüm geçmişiyle aynı saklama işleminde yazılır; yeni audit listesi 16 kayıtla kesilmez.

`getPublishedWorkspace()` yayınlanmış kopyaları verir; taslaklar, sürüm geçmişi ve audit verisini dönen projeksiyona dahil etmez. Bu fonksiyon, henüz öğrenci ekranlarının veri kaynağına bağlanmış değildir.

Sürüm geçmişi entity bazındadır. İlişkili bütün içerik ağacının veya medya dosyalarının ayrı birer geçmiş kopyasını oluşturmaz.

## Migration ve Saklama

- Önceki anahtar: `akademik-skor.admin-workspace.v1`.
- Yeni anahtar: `akademik-skor.admin-workspace.v2`.
- İlk okumada eski katalog kayıpsız biçimde sürüm 1 başlangıç kayıtlarına dönüştürülür.
- `active` durumu Published, `draft` Draft, `inactive/archived` Archived olarak yorumlanır. Ortak öğrenci modelinin eski enum değerleri korunur.
- İlk başarılı kayıt v2 anahtarına tek localStorage yazımı yapar. v1 anahtarı yedek olarak bırakılır.
- Bozuk depolama verisi sessizce seed ile değiştirilmez.
- workspace revision kontrolü eski sekmeden yazmayı tespit eder. Bu kontrol merkezi veritabanı transaction'ı veya çok kullanıcılı concurrency garantisi değildir.
- SQL migration yoktur; mevcut projede veritabanı bağlantısı bulunmuyor.

## Önizleme

- Video: öğrenci VideoCard bileşeni kullanılır; taslak başlığı statik sunum metniyle ezilmez.
- Vocabulary Word: öğrenci WordFlashcard bileşeni kullanılır.
- Grammar Topic/Lesson: öğrenci LearnPanel bileşeni kullanılır.
- Diğer kayıtlar mevcut öğrenci Card, Badge ve içerik metni bileşenleriyle katalog önizlemesi gösterir.
- Önizleme öğrenme ilerlemesini kaydetmez, öğrenci sayfasına yönlendirme yapmaz ve içerik yayınlamaz.
- Admin katalog modelinde olmayan instructor/thumbnail, ayrıntılı kelime alanları ve grammar kural/gövde alanları için gerçek içerik henüz mevcut değildir. Bu nedenle önizleme, katalogda bulunan alanlarla sınırlıdır; tüm öğrenci dersinin eksiksiz canlı simülasyonu değildir.

## Doğrulama Sonuçları

| Kontrol | Sonuç |
| --- | --- |
| `npx tsc --noEmit` | Geçti |
| Değişen admin/öğrenci bileşenleri ve test dosyalarında ESLint | Geçti, hata/uyarı yok |
| `node --test scripts/test-admin-workflow.cjs` | 13/13 geçti |
| `node scripts/validate-admin-foundation.cjs` | Geçti; yalnız yapısal smoke kontrolüdür |
| Chrome: 1440x1000 | Geçti |
| Chrome: 820x1180 | Geçti |
| Chrome: 390x844 | Geçti |
| Chrome: 320x740 | Geçti |
| `expo export --platform web` | Geçti; 37 statik route |

Davranış testleri: migration, bilinmeyen attribution, Draft/Review/Published geçişleri, metadata, değişmez geçmiş, alan farkları, yayın/taslak ayrımı, restore, eski sürüm kontrolü, slug çakışması, istemci admin rolü, eksik seçenekler, taxonomy/ilişki doğrulaması, archive bağımlılıkları, eşit sıralama, v1 yedeği, depolama hatası, eski sekme, yan etkisiz preview, Review filtresi ve izinli navigation adresleri.

Tarayıcı testi izole Chrome context'lerinde demo admin hesabı kullanır; gerçek kullanıcı oturumunu ve verisini değiştirmez. Draft -> Review -> Preview -> Publish -> yeni Draft -> Restore -> reload akışı, mobil menü, görünür Save alanı, yatay sayfa taşması, dashboard panel sınırları, video/kelime/grammar preview ve student rolüne erişim reddi kontrol edildi. Testlerde pageerror oluşmadı. Ekran görüntüleri ayrıca görsel olarak incelendi.

Test sırasında dashboard hızlı işlem kartlarında kesilme görüldü ve düzeltildi. Modal ekran görüntüleri animasyon tamamlanmış halde alındı.

Build sırasında yalnız ortamın NO_COLOR/FORCE_COLOR uyarıları görüldü. Geliştirme sunucusunda mevcut React Native Web shadow prop deprecation uyarıları bulunuyor; bunlar build hatası değildir.

## Değişen Dosyalar

- `src/lib/admin/workflow.ts`: yeni sürüm, yayın, restore, diff, audit ve saklama katmanı.
- `src/lib/admin/types.ts`: workflow modelleri ve durum filtreleri.
- `src/lib/admin/service.ts`: CRUD, sıralama ve kayıt işlemlerinin workflow'a bağlanması.
- `src/lib/admin/index.ts`: servis export'ları.
- `src/lib/admin/access.ts`: istemci rol kontrolünün yanıltıcı Server isminden arındırılması.
- `src/components/admin/AdminRouteScreen.tsx`: güncel istemci guard adı.
- `src/components/admin/AdminPanel.tsx`: editör, yayın aksiyonları, audit, durum filtreleri ve responsive düzeltmeler.
- `src/components/admin/AdminPublishingTools.tsx`: yeni metadata, geçmiş/diff ve preview bileşenleri.
- `src/components/student/VideoLessons.tsx`: kart export'u ve varsayılanı kapalı preview modu.
- `src/components/student/VocabularyLearningScreens.tsx`: WordFlashcard export'u ve varsayılanı kapalı preview modu.
- `src/components/student/GrammarLearningScreens.tsx`: LearnPanel export'u ve varsayılanı kapalı preview modu.
- `scripts/test-admin-workflow.cjs`: gerçek servis testleri.
- `scripts/test-admin-workflow-browser.cjs`: responsive/entegrasyon tarayıcı testi.
- `scripts/validate-admin-foundation.cjs`: yeni sözleşmeler ve doğru client-side kapsam açıklaması.
- `package.json`: `test:admin-workflow` komutu.
- `AUDIT_LATEST.md`: bu rapor.

Mevcut değişiklikler geri alınmadı. Kaynak dosyaların işlem öncesi kopyaları `C:\Users\Muhendislik\Documents\ChatGPT\Dil Uygulaması\admin-workflow-original` klasöründe tutuldu.

## Çalıştırma ve Kanıtlar

Uygulama: `http://localhost:8092/admin`.

Unit test: `npm run test:admin-workflow`.

Tarayıcı testi: `node scripts/test-admin-workflow-browser.cjs`. Bu ortamda Playwright, Codex'in Node paketlerinden `NODE_PATH` ile sağlandı; proje bağımlılıklarına eklenmedi. Başka bir ortamda Playwright ve Chrome sağlanmalıdır. `ADMIN_TEST_URL` ve `ADMIN_TEST_OUTPUT` ile adres/çıktı klasörü değiştirilebilir.

Ekran görüntüleri ve `results.json`: `C:\Users\Muhendislik\Documents\ChatGPT\Dil Uygulaması\admin-workflow-checks`.

Son web export: `C:\Users\Muhendislik\Documents\ChatGPT\Dil Uygulaması\admin-workflow-export-final`.

## Devam Noktası

### 07 Eylül 2026: Admin Girişi ve İlk Yerel Hesap

- Kullanıcının bildirdiği eksik giriş akışı giderildi: `/admin`, oturum yoksa `/login?next=/admin` adresine yönlenir. Admin hesabıyla girişten sonra `/admin` açılır. Admin çıkışı aynı giriş ekranına döner.
- Admin giriş ekranında, yalnız localhost geliştirme ortamında ve mevcut admin yoksa `İlk yerel admin hesabını oluştur` seçeneği bulunur. Ad, e-posta ve en az 12 karakterlik şifre istenir. Kullanıcı kendi yerel test bilgilerini seçer; varsayılan admin şifresi eklenmedi.
- Hesap yalnız aynı tarayıcı ve origin localStorage alanında saklanır. Gerçek hesap şifresi kullanılmaması ekranda belirtilir. E-posta doğrulanmış gibi işaretlenmez. Normal üyelik üzerinden admin rolü atanamaz; mevcut öğrenci hesabı otomatik yükseltilmez.
- Yerel admin kurulumu ve bu hesaplarla giriş production derlemesinde ve localhost dışındaki hostlarda kapalıdır. Bu, gerçek sunucu oturumu/rol kontrolünün yerine geçmez. Mevcut demo parola hash'i production için uygun değildir.
- Bozuk kullanıcı verisi sessizce sıfırlanmaz. Depolama hatası başarı olarak gösterilmez. Redirect adresi izinli `/admin` ve `/dashboard` rotalarıyla sınırlıdır.
- Kullanıcının ekranındaki `button cannot contain a nested button` uyarısı temiz giriş/admin oturumlarında yeniden üretilemedi. Uyarı gizlenmedi ve kaynak hatası bulundu/düzeltildi iddiasında bulunulmadı. Giriş formundaki durum yönetimi ve erişilebilir buton adı düzeltildi.
- Önceki workflow tarayıcı testleri enjekte edilmiş demo oturumu kullanıyordu. Yeni test gerçek formdan hesap oluşturma, şifre göster/gizle, çıkış, yanlış şifre, tekrar giriş ve admin yönlendirmesini kapsar.

Doğrulama: `node --test scripts/test-admin-login.cjs scripts/test-admin-workflow.cjs` 19/19 geçti. TypeScript ve değişen dosyalarda ESLint geçti. Chrome 1440, 390 ve 320 piksel genişliklerinde giriş akışı geçti; yatay sayfa taşması, iç içe HTML butonu veya nested-button/hydration konsol hatası görülmedi. Testler izole tarayıcı context'lerinde çalıştı; kullanıcının gerçek hesabı oluşturulmadı/değiştirilmedi. Web export 37 route ile geçti.

Yeni dosyalar: `scripts/test-admin-login.cjs`, `scripts/test-admin-login-browser.cjs`. Değişen giriş dosyaları: `src/lib/auth.ts`, `src/app/login.tsx`, `src/components/admin/AdminRouteScreen.tsx`, `package.json`. Komut: `npm run test:admin-login`.

Kanıtlar: `C:\Users\Muhendislik\Documents\ChatGPT\Dil Uygulaması\admin-login-checks`. Export: `C:\Users\Muhendislik\Documents\ChatGPT\Dil Uygulaması\admin-login-export`.

**Kapsam sonucu: Önceki Admin Foundation ve Publishing istekleri kısmen tamamlandı.** Yerel shell, katalog yönetimi ve yayın/sürüm akışı mevcut. Sunucu taraflı rol kontrolü, gerçek hesap oluşturma/davet yönetimi, merkezi kalıcı veritabanı, güvenilir audit kayıtları ve öğrenci kataloglarına merkezi yayın bağlantısı henüz yok. Ayrıntılı içerik alanları ve ilişkili editörler de ortak katalog modelinin mevcut sınırları içinde. Page Builder veya ödeme yönetimi eklenmedi.

Bu aşama sonunda duruldu. Production'a geçiş için ayrı iş: güvenilir sunucu oturumu ve rol doğrulaması, kalıcı veritabanı transaction'ları, backend audit/version repository, öğrenci kataloglarının yayınlanmış kayıtlara bağlanması ve ayrıntılı içerik alanlarının ortak modele taşınması. Mevcut client guard veya localStorage audit kaydı güvenlik sınırı sayılmamalıdır.

### 09 Eylül 2026: Question Bank Editörü

Son audit üzerinden, ayrıntılı içerik editörleri açığının Question Bank kısmı ele alındı. Student UI yeniden tasarlanmadı. Sunucu/kimlik altyapısı bu turda kurulmadı; aşağıdaki tamamlanan işler yerel admin iş akışına aittir.

Tamamlananlar:

- Soru editöründen Exam, Exam Version, Skill, Task Type, Subskills, Topics ve Difficulty seçilebilir. Skill değişince uyumsuz alt seçimler temizlenir; listeler ilişkili aktif kayıtlara göre daralır. Çoklu subskill/topic seçimi desteklenir.
- Passage/stimulus, seçenek metinleri, seçenek gerekçeleri ve tek doğru cevap düzenlenebilir. Seçenek ekleme, sıralama ve onaylı kaldırma bulunur. Sıra değişiminde doğru cevap indeksle değil seçenek kimliğiyle korunur. Doğru seçenek kaldırılırsa seçim temizlenir.
- Eksik seçenekli soru taslak olarak kaydedilebilir; yayın için en az iki dolu ve farklı seçenek, tek doğru cevap ve geçerli/aktif taxonomy ilişkileri zorunludur. Başka soruya ait seçenek kimlikleri kabul edilmez.
- Seçenekler soru snapshot'ına dahil edilir. Taslak seçenek değişikliği yayınlanmış seçeneği değiştirmez. Yeni soru sürümlerinin restore işlemi seçenekleri ve doğru cevabı birlikte yeni Draft sürümüne getirir; eski sürümler korunur.
- Unsaved preview güncel seçenekleri gösterir; geçmiş önizlemesi o sürümün seçeneklerini kullanır. Yayınlanmış projeksiyon yalnız yayınlanmış soruların seçeneklerini içerir; taslak soruların seçenekleri bu listeye taşınmaz.
- Mevcut v2 verisinde seçenek snapshot'ı olmayan canlı soruların seçenekleri ilk migration okumada mevcut katalogdan sabitlenir. Eski revision kayıtları geriye dönük uydurma seçenek geçmişiyle doldurulmaz. Seçenek snapshot'ı olmayan eski soru sürümünün restore işlemi açıklayıcı hata verir; geçmiş preview de bu sınırı belirtir.
- Mobilde form alanları stack olur; alt Save Draft / Preview / Publish alanı görünür kalır. Seçenek aksiyonları mevcut Expo simgeleriyle ve 44px kontrollerle sunulur.
- Tarayıcı testinde görsel seçim korunmasına rağmen radio checked bilgisinin DOM'a aktarılmadığı tespit edildi. Yeni kontrollerde açık `aria-checked` / `aria-expanded` özellikleriyle düzeltildi.

Doğrulama:

| Kontrol | Sonuç |
| --- | --- |
| `node --test scripts/test-admin-workflow.cjs scripts/test-admin-login.cjs` | 26/26 geçti |
| `npx tsc --noEmit` | Geçti |
| Değişen kaynak ve test dosyalarında ESLint | Geçti |
| Yeni soru browser testi: 1440 / 820 / 390 / 320 px | Geçti |
| Mevcut admin workflow browser regresyonu: aynı dört genişlik | Geçti |
| Web export | 37 route ile geçti |

Yeni tarayıcı testi oluşturma, ilişkili task seçimi, seçenekler, Save Draft, preview, publish, sıralama, doğru cevap işareti, kaldırmayı iptal/onay, restore, eksik sorunun yayın reddi ve reload kalıcılığını doğrular. İç içe buton, hydration/pageerror ve yatay sayfa taşması görülmedi. 1440px ve 320px soru editörü ekran görüntüleri ayrıca görsel olarak incelendi. Testler izole demo oturumları kullanır; kullanıcının gerçek verisini değiştirmez. Mevcut shadow prop ve build ortamı renk uyarıları sürüyor.

Yeni dosyalar: `src/lib/admin/question-editor.ts`, `src/components/admin/AdminQuestionFields.tsx`, `scripts/test-admin-question-browser.cjs`.

Güncellenenler: `src/lib/admin/types.ts`, `src/lib/admin/service.ts`, `src/lib/admin/workflow.ts`, `src/components/admin/AdminPanel.tsx`, `src/components/admin/AdminPublishingTools.tsx`, `scripts/test-admin-workflow.cjs`.

Kanıt klasörleri: `C:\Users\Muhendislik\Documents\ChatGPT\Dil Uygulaması\admin-question-checks` ve `admin-question-regression`. Web export: aynı workspace altında `admin-question-export`. Browser komutu: `node scripts/test-admin-question-browser.cjs`; diğer browser testleri gibi Playwright/Chrome ve bu ortamda `NODE_PATH` gerekir.

Geliştirme sunucusu kapalı bulundu ve `http://localhost:8092` adresinde yeniden başlatıldı. Admin girişi: `/login?next=/admin`; panelde Question Bank -> Create Question veya Edit.

**Güncel devam noktası:** Soru editörü mevcut tek doğru cevaplı Question modelini yönetiyor; sesli/açık uçlu/çoklu doğru cevaplı soru türleri eklenmedi. Diğer içerik türlerinin ayrıntılı editörleri, gerçek sunucu oturumu ve rol kontrolü, kalıcı merkezi veri/audit katmanı ve öğrenci kataloglarına yayın bağlantısı halen bekliyor. Bu çalışma production'a hazır admin paneli anlamına gelmez. Page Builder ve ödeme yönetimine dokunulmadı.

### 09 Eylül 2026: Admin Panelinin Türkçeleştirilmesi

Son audit üzerinden yarım kalan admin arayüzü çevirisi tamamlandı. Bu tur yalnız yönetici arayüzünün dilini ve Türkçe metinlerin responsive yerleşimini ele aldı.

- On admin modülünün menüleri, açıklamaları, koleksiyon adları, formlar, filtreler, erişilebilir kontrol adları, onay pencereleri ve durum mesajları Türkçeleştirildi.
- Yayınlama arayüzünde Taslak / İncelemede / Yayında / Arşivlendi kullanılıyor. Taslağı Kaydet, Önizleme, Yayınla, sürüm geçmişi, fark alanları ve geri yükleme kontrolleri Türkçe.
- Ortak `src/lib/admin/labels.ts` sunum katmanı durum, alan, rol, hata ve işlem geçmişi etiketlerini yönetiyor. Tarihler `tr-TR` biçiminde gösteriliyor. Dahili enum/kimlik değerleri değiştirilmedi; kayıtlı audit/snapshot verileri yeniden yazılmadı. Bilinmeyen hata ayrıntıları gizlenmiyor.
- İçerik başlıkları, soru/seçenek metinleri ve taxonomy kayıtları kullanıcı verisi olarak korundu. Gerçek öğrenci bileşenleriyle gösterilen önizlemede öğrenci arayüzünün kendi dili korunuyor. Student UI yeniden tasarlanmadı.
- Dar mobil üst çubukta yinelenen logo/alt başlık kaldırıldı; öğrenci paneli bağlantısı erişilebilir simge kontrolüne dönüştürüldü. Yönetim sayfası başlığı kesilmeden gösteriliyor. Alt form aksiyonları görünür kalıyor.
- Browser testlerinin arayüz seçicileri Türkçeye uyarlandı. Ortak etiketler, hata ayrıntıları ve geçmişin değiştirilmediği için üç regresyon testi eklendi.

Doğrulama:

| Kontrol | Sonuç |
| --- | --- |
| Admin workflow ve giriş birim testleri | 29/29 geçti (23 + 6) |
| `node scripts/validate-admin-foundation.cjs` | Geçti |
| `npx tsc --noEmit` | Geçti |
| Değişen admin kaynakları ve testlerinde ESLint | Geçti |
| Workflow browser: 1440 / 820 / 390 / 320 px | Geçti; konsol hatası yok |
| Soru editörü browser: aynı dört genişlik | Geçti |
| Web export | 37 route ile geçti |

Masaüstü yönetim özeti ve 320px form/sürüm geçmişi ekran görüntüleri ayrıca görsel olarak incelendi. Browser testleri izole demo oturumları kullanır; gerçek kullanıcı verisini değiştirmez. Build sırasında yalnız bilinen NO_COLOR/FORCE_COLOR ortam uyarıları görüldü.

Kanıtlar: `C:\Users\Muhendislik\Documents\ChatGPT\Dil Uygulaması\admin-tr-workflow-checks` ve `admin-tr-question-checks`. Web export: aynı workspace altında `admin-tr-export`. Workflow kanıt klasöründeki eski `1440-failure.*` dosyaları sunucu kapalıyken yapılan ilk denemeye aittir; son `results.json` ve ekran görüntüleri başarılı tekrar koşumundandır.

Geliştirme sunucusu `http://localhost:8092` adresinde yeniden başlatıldı. Panel: `/admin`; giriş: `/login?next=/admin`.

**Devam noktası:** Türkçeleştirme tamamlandı. Önceki audit'teki backend rol doğrulaması, merkezi kalıcı veri/audit, ayrıntılı diğer içerik editörleri ve öğrenci kataloglarına yayın bağlantısı sınırları değişmedi. Bu turda sunucu altyapısı, Page Builder veya ödeme yönetimi eklenmedi.

### 09 Eylül 2026: Safe Component-Based Page Builder

Admin paneline serbest HTML/CSS/JavaScript çalıştırmayan, registry tabanlı Page Builder eklendi. Student UI yeniden tasarlanmadı; mevcut admin shell ve yayınlama yaklaşımı korundu.

- `Page`, `PageVersion`, `PageSection`, tab ve builder audit modelleri admin workspace içine eklendi. Mevcut localStorage migration’ı eski workspace’lerde Page Builder varsayılanını güvenli biçimde oluşturuyor.
- HeroBanner, StatsGrid, ContinueLearning, SkillCards, CourseGrid, VideoGrid, FilterBar, CategoryTabs, VocabularySetGrid, VocabularyPracticeLauncher, GrammarTopicGrid, GrammarPracticeLauncher, MiniTestBuilder, AudioPractice, Recommendations, RecentActivity, StudyPlanWidget, ProgressChart, Heatmap, PricingCards, FAQ ve CustomCTA olmak üzere 22 registry bileşeni tanımlandı.
- Her registry kaydında `id`, `type`, `allowedPages`, `defaultProps`, `editableProps` ve `responsiveRules` bulunuyor. Editör yalnız bu tanımlı property’leri açıyor; arbitrary component, route, script veya CSS girişi yok.
- Bölüm ekleme, duplicate, görünürlük, düzenleme, sınırlı responsive ayarlar, yukarı/aşağı klavye-dokunmatik sıralama, önizleme, yayınlama ve eski sürümü fiziksel silmeden yeni taslak olarak geri yükleme eklendi.
- Dashboard kritik sistem sayfası ve içindeki sistem bölümleri kilitli. Kilitli bölümler gizlenemiyor, taşınamıyor veya değiştirilemiyor. System Tab yalnız registry bileşenine bağlı; Content Tab için serbest metin alanı dışında script/component enjeksiyonu yok.
- Sekme yöneticisinde Content Tab / System Tab oluşturma, düzenleme, görünürlük, sıralama, kaldırma ve kilit koruması bulunuyor. Mevcut Navigation modülüne menü göster/gizle aksiyonu eklendi; add/edit/reorder akışı korunuyor.
- Üretilen önizleme registry bileşenlerini işler ve responsive kuralları görünür kılar. Builder’ın kendisi mobilde bölüm başlıklarını ve aksiyonlarını ayrı satırlara stack eder; yatay taşma oluşmaz.

Doğrulama:

| Kontrol | Sonuç |
| --- | --- |
| Admin workflow + giriş birim testleri | 30/30 geçti (24 + 6) |
| Page Builder registry/sürüm/sekme birim testleri | 4/4 geçti |
| `npx tsc --noEmit` | Geçti |
| Page Builder/admin kaynak ve testlerinde ESLint | Hata yok |
| Page Builder browser QA: 1440 / 820 / 390 / 320 px | 4/4 geçti; konsol hatası ve yatay taşma yok |
| Web export | 37 route ile geçti |

Kanıtlar: `C:\Users\Muhendislik\Documents\ChatGPT\Dil Uygulaması\page-builder-checks-final2`. Web export: `C:\Users\Muhendislik\Documents\ChatGPT\Dil Uygulaması\page-builder-export`. Birim test: `npm run test:page-builder`; browser testi: `node scripts/test-page-builder-browser.cjs`.

Geliştirme sunucusu `http://localhost:8092` adresinde çalışıyor. Admin panelinde Sayfa Oluşturucu modülünü açarak Dashboard veya Video Lessons sayfasını seçebilirsiniz.

**Kapsam sınırı:** Bu çalışma güvenli client-side/local workspace foundation’dır. Gerçek sunucu tarafı yetkilendirme, merkezi veritabanı transaction’ları, ortak öğrenci sayfalarının published PageVersion’dan server-side üretilmesi ve kalıcı backend audit repository önceki audit’teki gibi ayrıca gereklidir. Page Builder, Page Builder dışı ödeme yönetimi veya serbest kod editörü eklenmedi.

### 10 Eylül 2026: Video Ders Medya Kaynağı ve Metadata MVP

Son audit üzerinden Video Ders oluşturma akışındaki gerçek medya bağlantısı açığı ele alındı. Student UI yeniden tasarlanmadı; mevcut Video Lessons kartları ve VideoPlayer bileşeni genişletildi.

Tamamlananlar:

- `Lesson` ve `AdminEntityDraft` modellerine `mediaProvider`, `mediaUrl`, `durationSeconds` ve `estimatedMinutes` alanları eklendi.
- Admin Video Ders editöründe YouTube/Vimeo kaynak seçimi, HTTPS video bağlantısı, tarayıcıya video dosyası yükleme ve süre alanları bulunuyor. Diğer içerik formları bu alanları göstermiyor.
- Video ders draft modeline kurs, modül, thumbnail HTTPS bağlantısı, önizleme saniyesi, zaman damgalı bölüm satırları ve zaman damgalı altyazı/transkript satırları eklendi.
- Bölüm ve transkript girişleri serbest JSON değil; zaman|metin satırları olarak parse edilir, sıralanır ve geçersiz satırlar yayın öncesi hata üretir. Kurs/modül seçenekleri mevcut katalogla sınırlıdır.
- Thumbnail öğrenci kartı ve oynatıcı posterine, önizleme süresi kart CTA alanına, bölümler ve transkript ise gerçek öğrenci VideoPlayer preview modeline taşınır.
- YouTube/Vimeo için yalnız izinli URL biçimleri kabul ediliyor; yüklenen videolar için yalnız IndexedDB asset referansı kabul ediliyor. Serbest iframe, HTML, CSS veya JavaScript girişi yok. YouTube için `youtube-nocookie.com`, Vimeo için `player.vimeo.com` embed adresi üretiliyor.
- Taslak eksik medya bilgisiyle kaydedilebilir. İnceleme/yayın öncesi bağlantı doğrulaması yapılır; geçersiz sağlayıcı, alan adı veya video kimliği yayınlanamaz.
- Admin önizlemesi gerçek öğrenci VideoCard bileşenini ve doğrulanmış web embed’i veya yüklenmiş HTML5 videoyu gösterir.
- Yayınlanmış ve medya bağlantısı olan dersler localStorage’daki yayın projeksiyonundan öğrenci Video Lessons kataloğuna bağlanır. Taslaklar öğrenci kataloğuna sızmaz.
- Öğrenci VideoPlayer web’de gerçek YouTube/Vimeo embed’i veya IndexedDB’den çözülen HTML5 videoyu gösterir. Premium derslerde entitlement yoksa medya açılmaz; yerel/native ortamda doğrulanmış bağlantı harici oynatıcıyla açılabilir.
- Yüklenen video binary’si admin workspace localStorage’ına yazılmaz; tarayıcı IndexedDB medya adapter’ında tutulur ve snapshot yalnız `asset:<id>` referansını saklar. Adapter ileride backend/S3/Supabase storage ile değiştirilebilir.
- Önceki sürüm, yayınlama, audit ve restore altyapısı korunmuştur; medya alanları diff metadata içinde tutulur.

Doğrulama:

| Kontrol | Sonuç |
| --- | --- |
| Admin giriş + workflow birim testleri | 30/30 geçti |
| Page Builder birim testleri | 4/4 geçti |
| `node scripts/test-video-media.cjs` | Geçti; URL/asset doğrulama, zaman satırı ayrıştırma, yayın reddi, snapshot ve öğrenci kataloğu bağlantısı |
| `npx tsc --noEmit` | Geçti |
| Değişen dosyalarda ESLint | Geçti; hata/uyarı yok |
| Video medya browser QA: 1440 / 820 / 390 / 320 px | 4/4 geçti; YouTube akışı, upload/IndexedDB akışı, metadata alanları, öğrenci iframe/HTML5 oynatıcı ve Transcript sekmesi doğrulandı |
| Mevcut admin workflow browser regresyonu: aynı dört genişlik | 4/4 geçti; konsol hatası ve yatay taşma yok |
| Page Builder browser regresyonu: aynı dört genişlik | 4/4 geçti; konsol hatası ve yatay taşma yok |

Kapsam sınırı:

- Bu turda tarayıcı IndexedDB tabanlı dosya yükleme/storage eklendi. Production transcoding, signed URL, merkezi backend storage ve backend media API henüz eklenmedi.
- Admin rol kontrolü ve workspace saklama hâlâ önceki audit’te belirtilen client-side/localStorage sınırları içindedir.
- Browser QA, Playwright/Chrome ile izole admin ve Premium öğrenci oturumlarında tamamlandı. Video medya testi `scripts/test-video-media-browser.cjs`, mevcut regresyon testleri ise `scripts/test-admin-workflow-browser.cjs` ve `scripts/test-page-builder-browser.cjs` ile çalıştırıldı.

### 10 Eylül 2026: GitHub Pages Yayın Hazırlığı

GitHub Pages static preview yayını için repository temizliği ve Actions workflow temeli hazırlandı. Öğrenci UI yeniden tasarlanmadı.

- .test-results/ ve kök QA ekran görüntüleri .gitignore kapsamına alındı. Audit raporu, kaynak kod, yeni öğrenci/admin asset'leri ve test script'leri korunuyor.
- .github/workflows/deploy-pages.yml eklendi. main push'larında npm ci, lint, TypeScript kontrolü, Expo web export, Pages artifact yükleme ve Pages deploy adımları çalışacak.
- scripts/prepare-github-pages.cjs eklendi. Repository alt yolu için local asset URL'lerini /akademik-skor/ altına taşır, route'ları Pages'in doğrudan açabileceği index.html kopyalarına hazırlar ve 404.html üretir.
- README'ye Pages adresi, GitHub repository Pages ayarı ve static preview/backend sınırı eklendi.

Doğrulama:

| Kontrol | Sonuç |
| --- | --- |
| npm ci | Geçti |
| npm run lint | Geçti |
| npx tsc --noEmit | Geçti |
| EXPO_BASE_URL=akademik-skor npx expo export --platform web | 37 route ile geçti |
| GitHub Pages route/asset hazırlama | Geçti; /akademik-skor/, 404.html, /admin/ ve /learning/videos/ doğrulandı |
| npm audit --omit=dev | 15 advisory; Expo bağımlılık zinciri, kırıcı --force yükseltmesi uygulanmadı |

Kapsam sınırı:

- Workflow yerelde hazırlandı ve CI eşdeğeri doğrulandı; GitHub Actions sonucu bu commit'in push'undan sonra GitHub üzerinde izlenmelidir.
- GitHub repository Settings > Pages > Source değerinin GitHub Actions yapılması gerekiyor.
- Gerçek auth, admin role check, merkezi veritabanı, içerik API'si ve medya storage sonraki backend aşamasıdır.

