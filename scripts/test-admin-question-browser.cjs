/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const output = process.env.ADMIN_TEST_OUTPUT || path.join(__dirname, '..', '.test-results', 'admin-questions');
const baseUrl = process.env.ADMIN_TEST_URL || 'http://localhost:8092';
const actor = { id: 'question-editor-test', name: 'Editor Test', email: 'editor-test@example.com', role: 'admin', plan: 'free', goal: '', createdAt: '2026-09-09T00:00:00.000Z', emailVerified: true };
fs.mkdirSync(output, { recursive: true });

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 820, height: 1180 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript((user) => localStorage.setItem('akademik-skor.session', JSON.stringify(user)), actor);
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error' && /cannot contain|nested|hydration/i.test(message.text())) errors.push(message.text()); });
      const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('akademik-skor.admin-workspace.v2')));
      const history = async () => (await state()).workflow.documents['questions:questions-browser-question'];
      try {
        await page.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.getByTestId('admin-shell').waitFor();
        if (viewport.width < 1040) await page.getByRole('button', { name: 'Admin menüsünü aç', exact: true }).click();
        await page.getByTestId('admin-nav-question-bank').click();
        await page.getByRole('button', { name: 'Soru Oluştur', exact: true }).click();
        const editor = page.getByTestId('admin-content-editor');
        await editor.getByRole('textbox', { name: 'Başlık', exact: true }).fill('Browser question');
        await editor.getByRole('textbox', { name: 'Bağlantı adı', exact: true }).fill('browser-question');
        await editor.getByRole('textbox', { name: 'Soru metni', exact: true }).fill('Which response best summarizes the conversation?');
        await editor.getByRole('button', { name: 'Beceri seçin', exact: true }).click();
        await editor.getByRole('radio', { name: 'Beceri: Listening', exact: true }).click();
        await editor.getByRole('button', { name: 'Soru Türü seçin', exact: true }).click();
        assert.equal(await editor.getByRole('radio', { name: /Soru Türü:.*Reading/ }).count(), 0);
        await editor.getByRole('radio', { name: /^Soru Türü:/ }).first().click();
        await editor.getByRole('textbox', { name: 'Parça / kaynak metin', exact: true }).fill('A conversation about a campus event.');
        for (const [index, text] of ['The event changed location.', 'The event was cancelled.'].entries()) {
          await editor.getByRole('button', { name: 'Seçenek Ekle', exact: true }).click();
          await editor.getByRole('textbox', { name: `Seçenek ${index + 1} metni`, exact: true }).fill(text);
        }
        await editor.getByRole('radio', { name: 'Seçenek 1 doğru cevap', exact: true }).click();
        await editor.getByRole('button', { name: 'Taslağı Kaydet', exact: true }).click();
        await editor.getByText('Taslak sürüm 1 kaydedildi.', { exact: true }).waitFor();
        await editor.getByRole('textbox', { name: 'Seçenek 1 metni', exact: true }).scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `${viewport.width}-question-editor.png`), animations: 'disabled' });
        const saveBox = await editor.getByRole('button', { name: 'Taslağı Kaydet', exact: true }).boundingBox();
        assert.ok(saveBox.height >= 44 && saveBox.y + saveBox.height <= viewport.height + 1);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        assert.equal(await page.locator('button button').count(), 0);
        await editor.getByRole('tab', { name: 'Önizleme', exact: true }).click();
        await editor.getByTestId('admin-content-preview').getByText('A. The event changed location.', { exact: true }).waitFor();
        await editor.getByRole('button', { name: 'Yayınla', exact: true }).click();
        await editor.getByRole('button', { name: 'Yayınlamayı Onayla', exact: true }).click();
        await editor.getByText('Sürüm 2 yayınlandı.', { exact: true }).waitFor();
        await editor.getByRole('tab', { name: 'Düzenle', exact: true }).click();
        await editor.getByRole('textbox', { name: 'Seçenek 1 metni', exact: true }).fill('An unpublished answer.');
        await editor.getByRole('button', { name: 'Seçenek 1 aşağı taşı', exact: true }).click();
        assert.equal(await editor.getByRole('radio', { name: 'Seçenek 2 doğru cevap', exact: true }).isChecked(), true);
        await editor.getByRole('button', { name: 'Seçenek 2 kaldır', exact: true }).click();
        await editor.getByRole('button', { name: 'Kaldırmaktan vazgeç', exact: true }).click();
        assert.equal(await editor.getByRole('textbox', { name: 'Seçenek 2 metni', exact: true }).inputValue(), 'An unpublished answer.');
        await editor.getByRole('button', { name: 'Taslağı Kaydet', exact: true }).click();
        await editor.getByText('Taslak sürüm 3 kaydedildi.', { exact: true }).waitFor();
        assert.equal((await history()).published.questionOptions[0].body, 'The event changed location.');
        await editor.getByRole('tab', { name: 'Sürümler', exact: true }).click();
        await editor.getByRole('button', { name: 'Sürüm 2 Önizleme', exact: true }).click();
        await editor.getByTestId('admin-content-preview').getByText('A. The event changed location.', { exact: true }).waitFor();
        await editor.getByRole('tab', { name: 'Sürümler', exact: true }).click();
        await editor.getByRole('button', { name: 'Sürüm 2 Geri Yükle', exact: true }).click();
        await editor.getByRole('button', { name: 'Taslak Olarak Geri Yükle', exact: true }).click();
        await editor.getByText('Sürüm 2, taslak sürüm 4 olarak geri yüklendi.', { exact: true }).waitFor();
        assert.equal((await history()).revisions.at(-1).snapshot.questionOptions[0].body, 'The event changed location.');
        await editor.getByRole('tab', { name: 'Düzenle', exact: true }).click();
        await editor.getByRole('button', { name: 'Seçenek 1 kaldır', exact: true }).click();
        await editor.getByRole('button', { name: 'Kaldırmayı onayla', exact: true }).click();
        assert.equal(await editor.getByRole('textbox', { name: 'Seçenek 2 metni', exact: true }).count(), 0);
        assert.equal(await editor.getByRole('radio', { name: 'Seçenek 1 doğru cevap', exact: true }).isChecked(), false);
        await editor.getByRole('button', { name: 'Taslağı Kaydet', exact: true }).click();
        await editor.getByText('Taslak sürüm 5 kaydedildi.', { exact: true }).waitFor();
        await editor.getByRole('button', { name: 'Yayınla', exact: true }).click();
        await editor.getByRole('button', { name: 'Yayınlamayı Onayla', exact: true }).click();
        await editor.getByText(/En az iki farklı seçenek gerekli/).waitFor();
        assert.equal((await history()).version, 5);
        assert.equal((await history()).published.questionOptions.length, 2);
        await editor.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click();
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.getByTestId('admin-shell').waitFor();
        assert.equal((await history()).version, 5);
        assert.deepEqual(errors, []);
        console.log(`${viewport.width}px: create, dependent taxonomy, options, preview, publish, reorder, removal confirmation, restore and reload passed`);
      } catch (error) {
        await page.screenshot({ path: path.join(output, `${viewport.width}-failure.png`) });
        fs.writeFileSync(path.join(output, `${viewport.width}-failure.txt`), await page.locator('body').innerText());
        throw error;
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
