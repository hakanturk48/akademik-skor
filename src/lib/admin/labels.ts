import type { AdminAuditEntry, AdminWorkspaceState } from './types';

const labels: Record<string, string> = {
  draft: 'Taslak', review: 'İncelemede', published: 'Yayında', archived: 'Arşivlendi',
  active: 'Aktif', inactive: 'Pasif', public: 'Herkese açık', authenticated: 'Giriş yapanlar', private: 'Özel',
  migrated: 'İçe aktarıldı', created: 'Oluşturuldu', updated: 'Güncellendi', reviewed: 'İncelemeye gönderildi',
  restored: 'Geri yüklendi', reordered: 'Yeniden sıralandı',
  admin: 'Yönetici', student: 'Öğrenci', teacher: 'Öğretmen', institution: 'Kurum',
  navigationGroups: 'Menü Grupları', navigationItems: 'Menü Bağlantıları', exams: 'Sınavlar', examVersions: 'Sınav Sürümleri',
  skills: 'Beceriler', taskTypes: 'Soru Türleri', subskills: 'Alt Beceriler', topics: 'Konular', levels: 'Seviyeler',
  courses: 'Kurslar', modules: 'Modüller', lessons: 'Dersler', vocabularySets: 'Kelime Setleri', vocabularyWords: 'Kelimeler',
  grammarCategories: 'Dil Bilgisi Kategorileri', grammarTopics: 'Dil Bilgisi Konuları', grammarLessons: 'Dil Bilgisi Dersleri',
  questions: 'Sorular', questionOptions: 'Cevap Seçenekleri', readingPracticeScreens: 'Okuma Pratikleri', practiceSets: 'Alıştırma Setleri', tests: 'Testler',
  contentTypes: 'İçerik Türleri', contentTags: 'Etiketler', title: 'Başlık', slug: 'Bağlantı adı', description: 'Açıklama',
  status: 'Durum', visibility: 'Görünürlük', sortOrder: 'Sıralama', isPremium: 'Premium erişim', prompt: 'Soru metni',
  explanation: 'Cevap açıklaması', stimulus: 'Kaynak metin', taxonomy: 'Sınıflandırma',
  examId: 'Sınav', examVersionId: 'Sınav sürümü', skillId: 'Beceri', taskTypeId: 'Soru türü', subskillIds: 'Alt beceriler',
  topicIds: 'Konular', levelId: 'Seviye', contentTypeId: 'İçerik türü', tagIds: 'Etiketler', courseId: 'Kurs',
  moduleId: 'Modül', lessonIds: 'Dersler', questionId: 'Soru', optionIds: 'Seçenekler', correctOptionId: 'Doğru cevap',
  setId: 'Kelime seti', categoryId: 'Kategori', topicId: 'Konu', groupId: 'Menü grubu', parentId: 'Üst kayıt',
  term: 'Kelime', meaning: 'Anlam', body: 'Metin', rationale: 'Gerekçe', isCorrect: 'Doğru cevap',
  createdAt: 'Oluşturulma tarihi', updatedAt: 'Güncelleme tarihi', publishedAt: 'Yayın tarihi', version: 'Sürüm',
  durationSeconds: 'Süre (saniye)', estimatedMinutes: 'Tahmini süre (dakika)', route: 'Sayfa adresi',
  mediaProvider: 'Video sağlayıcısı', mediaUrl: 'Video bağlantısı', thumbnailUrl: 'Thumbnail bağlantısı',
  previewDurationSeconds: 'Önizleme süresi (saniye)', chapters: 'Bölümler', transcript: 'Altyazı / transkript',
  resources: 'Kaynaklar', resourcesText: 'Kaynaklar', subtitle: 'Alt başlık', questionType: 'Soru türü', timeLimitSeconds: 'Süre sınırı', timeRemainingSeconds: 'Kalan süre', currentQuestionIndex: 'Aktif soru', answeredCount: 'Cevaplanan soru sayısı', markedCount: 'İşaretli soru sayısı', wordCount: 'Kelime sayısı', sourceLabel: 'Kaynak etiketi', passageTitle: 'Passage başlığı', passageParagraphs: 'Passage paragrafları', passageText: 'Passage metni', readingQuestionsText: 'Reading soruları', supportFocusTitle: 'Odak başlığı', supportFocusText: 'Odak metni', supportProgress: 'Odak ilerlemesi', supportHint: 'Odak ipucu', reviewTitle: 'Tekrar başlığı', reviewTips: 'Tekrar ipuçları', reviewTipsText: 'Tekrar ipuçları', url: 'Bağlantı', sizeLabel: 'Boyut', premium: 'Premium',
  isEnabled: 'Etkin', requiredPlan: 'Gerekli plan', allowedRoles: 'İzinli roller', iconKey: 'Simge', sort: 'Sıralama',
};

export const adminLabel = (value: string) => labels[value] ?? value;
export const adminFieldLabel = (path: string) => path.split('.').map(adminLabel).join(' / ');

const errors: Record<string, string> = {
  'Persistent admin storage is unavailable.': 'Yönetim verileri için kalıcı depolama kullanılamıyor.',
  'Unsupported admin workspace. Existing data has not been overwritten.': 'Yönetim verilerinin biçimi desteklenmiyor. Mevcut veriler değiştirilmedi.',
  'Title must contain at least two characters.': 'Başlık en az iki karakter olmalı.',
  'A valid unique slug is required.': 'Geçerli ve benzersiz bir bağlantı adı gerekli.',
  'Sort order must be a non-negative number.': 'Sıralama sıfır veya pozitif bir sayı olmalı.',
  'This slug is already in use.': 'Bu bağlantı adı başka bir kayıtta kullanılıyor.',
  'Select a route from the approved navigation registry.': 'İzin verilen sayfa adreslerinden birini seçin.',
  'Publish the navigation group first.': 'Önce ilgili menü grubunu yayınlayın.',
  'Exam version does not belong to the selected exam.': 'Sınav sürümü seçilen sınava ait değil.',
  'Task type does not belong to the selected skill.': 'Soru türü seçilen beceriye ait değil.',
  'Subskill does not match the selected skill/task.': 'Alt beceri seçilen beceri ve soru türüyle eşleşmiyor.',
  'Topic does not match the selected skill.': 'Konu seçilen beceriyle eşleşmiyor.',
  'Question prompt is too short.': 'Soru metni çok kısa.',
  'At least two distinct options are required.': 'En az iki farklı seçenek gerekli.',
  'Select a correct answer from the question options.': 'Soru seçeneklerinden doğru cevabı seçin.',
  'Every option must be active and belong to this question.': 'Her seçenek aktif olmalı ve bu soruya ait olmalı.',
  'Option text cannot be empty.': 'Seçenek metni boş olamaz.',
  'Option texts must be distinct.': 'Seçenek metinleri birbirinden farklı olmalı.',
  'Exactly one option must match the correct answer.': 'Yalnızca bir seçenek doğru cevap olarak işaretlenmeli.',
  'Task type and difficulty are required.': 'Soru türü ve zorluk seçimi gerekli.',
  'Question content type is required.': 'İçerik türü soru olmalı.',
  'Video URL is required before publishing.': 'Yayınlamadan önce video bağlantısı eklenmeli.',
  'A valid YouTube video URL is required before publishing.': 'Yayınlamadan önce geçerli bir YouTube bağlantısı eklenmeli.',
  'A valid Vimeo video URL is required before publishing.': 'Yayınlamadan önce geçerli bir Vimeo bağlantısı eklenmeli.',
  'A stored video file is required before publishing.': 'Yayınlamadan önce yüklenmiş bir video dosyası seçilmeli.',
  'Yüklenen video dosyası seçilmeli.': 'Yayınlamadan önce yüklenmiş bir video dosyası seçilmeli.',
  'Reading passage is required before publishing.': 'Yayınlamadan önce okuma metni eklenmeli.',
  'Reading practice needs at least one question.': 'Okuma pratiğinde en az bir soru olmalı.',
  'Every reading question needs at least two options.': 'Her okuma sorusunda en az iki seçenek olmalı.',
  'Every reading question needs a correct option.': 'Her okuma sorusunda doğru seçenek işaretlenmeli.',
  'Admin access is required.': 'Yönetici yetkisi gerekli.',
  'This content changed. Reopen it before saving.': 'Bu içerik başka bir işlemde değiştirildi. Kaydetmeden önce yeniden açın.',
  'Content was not found.': 'İçerik bulunamadı.',
  'Version was not found.': 'Sürüm bulunamadı.',
  'This legacy version has no option snapshot. Restore is unavailable; edit a new draft instead.': 'Bu eski sürümün seçenek kopyası bulunmuyor. Geri yüklemek yerine yeni bir taslak düzenleyin.',
  'Stored admin data could not be read. It has not been reset or overwritten.': 'Kayıtlı yönetim verileri okunamadı. Veriler sıfırlanmadı veya değiştirilmedi.',
  'Another tab saved changes. Reload the workspace before saving.': 'Başka bir sekmede değişiklik kaydedildi. Kaydetmeden önce yönetim panelini yeniden yükleyin.',
  'Save failed. Browser storage may be full or unavailable. Your changes remain in the editor.': 'Kayıt başarısız. Tarayıcı depolaması dolu veya kullanılamıyor olabilir. Değişiklikleriniz düzenleyicide korunuyor.',
  'Option IDs must be unique and non-empty.': 'Seçenek kimlikleri benzersiz olmalı ve boş olmamalı.',
  'An option belongs to another question.': 'Seçeneklerden biri başka bir soruya ait.',
  'The correct answer must belong to this question.': 'Doğru cevap bu sorunun seçenekleri arasında olmalı.',
  'Title en az 2 karakter olmalı.': 'Başlık en az 2 karakter olmalı.',
  'Slug kebab-case olmalı.': 'Bağlantı adı küçük harflerden ve tirelerden oluşmalı.',
  'Status geçerli değil.': 'Durum geçerli değil.',
  'Visibility geçerli değil.': 'Görünürlük geçerli değil.',
  'Question prompt en az 8 karakter olmalı.': 'Soru metni en az 8 karakter olmalı.',
  'Prompt eksik veya çok kısa.': 'Soru metni eksik veya çok kısa.',
  'Question bulunamadı.': 'Soru bulunamadı.',
  'Correct option, optionIds içinde bulunmalı.': 'Doğru cevap sorunun seçenekleri arasında bulunmalı.',
  'Aktif soruda correctOptionId tanımlı olmalı.': 'Aktif sorunun doğru cevabı seçilmiş olmalı.',
  'sortOrder must be a number': 'Sıralama bir sayı olmalı.',
  'isPremium must be a boolean': 'Premium erişim açık veya kapalı olmalı.',
};

export function adminMessage(message: string): string {
  return message.split('\n').map((line) => {
    if (errors[line]) return errors[line];
    let match = /^Publish an active (.+) record before using it\.$/.exec(line);
    if (match) return `Önce ilgili aktif kaydı yayınlayın: ${adminLabel(match[1])}.`;
    match = /^Archive blocked: referenced by (.+)\.$/.exec(line);
    if (match) return `Arşivleme engellendi. İlişkili içerikler: ${match[1]}.`;
    match = /^Missing (.+): (.+)$/.exec(line);
    if (match) return `Eksik ilişki: ${adminFieldLabel(match[1])} (${match[2]}).`;
    match = /^Duplicate slug in (.+): (.+)$/.exec(line);
    if (match) return `Tekrarlanan bağlantı adı: ${adminLabel(match[1])} / ${match[2]}.`;
    match = /^Slug must be kebab-case: (.+)$/.exec(line);
    if (match) return `Bağlantı adı küçük harf ve tirelerden oluşmalı: ${match[1]}.`;
    match = /^Invalid (status|visibility): (.+)$/.exec(line);
    if (match) return `Geçersiz ${adminLabel(match[1]).toLocaleLowerCase('tr-TR')}: ${match[2]}.`;
    return line;
  }).join('\n');
}

export function adminAuditSummary(state: AdminWorkspaceState, entry: AdminAuditEntry) {
  const revision = state.workflow?.documents[`${entry.entityType}:${entry.entityId}`]?.revisions.find((item) => item.version === entry.version);
  const title = revision?.snapshot.title ?? entry.entityId;
  return `${title}: ${adminLabel(entry.action)} (${entry.version}. sürüm)`;
}

export function adminDiffValue(path: string, value: unknown): string {
  if (value === null || value === undefined) return 'Yok';
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
  if (typeof value === 'string') return ['status', 'visibility'].includes(path) ? adminLabel(value) : value;
  return JSON.stringify(value);
}
