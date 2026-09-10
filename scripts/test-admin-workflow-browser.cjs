/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const output = process.env.ADMIN_TEST_OUTPUT || path.join(__dirname, '..', '.test-results', 'admin-workflow');
const baseUrl = process.env.ADMIN_TEST_URL || 'http://localhost:8092';
const actor = { id: 'browser-workflow-admin', name: 'Workflow Test', email: 'workflow-test@example.com', role: 'admin', plan: 'free', goal: '', createdAt: '2026-09-07T00:00:00.000Z', emailVerified: true };
fs.mkdirSync(output, { recursive: true });

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 820, height: 1180 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript((user) => localStorage.setItem('akademik-skor.session', JSON.stringify(user)), actor);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.setDefaultTimeout(20000);
      const snapshot = async (name) => {
        await page.screenshot({ path: path.join(output, `${viewport.width}-${name}.png`), fullPage: true, animations: 'disabled' });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${name}: horizontal page overflow`);
      };
      const navigate = async (key) => {
        if (viewport.width < 1040) await page.getByRole('button', { name: 'Admin menüsünü aç', exact: true }).click();
        await page.getByTestId(`admin-nav-${key}`).click();
      };
      const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('akademik-skor.admin-workspace.v2')));
      try {
        await page.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.getByTestId('admin-shell').waitFor();
        await snapshot('dashboard');
        for (const id of ['admin-quick-actions', 'admin-recent-changes']) {
          const box = await page.getByTestId(id).boundingBox();
          assert.ok(box.x >= 0 && box.x + box.width <= viewport.width, `${id} must fit the viewport`);
        }
        await navigate('taxonomy');
        await page.getByRole('button', { name: 'Sınav Oluştur', exact: true }).click();
        const editor = page.getByTestId('admin-content-editor');
        await editor.getByRole('textbox', { name: 'Başlık', exact: true }).fill('Responsive workflow lesson with a longer title');
        await editor.getByRole('textbox', { name: 'Bağlantı adı', exact: true }).fill('browser-workflow-test');
        await editor.getByRole('button', { name: 'Taslağı Kaydet', exact: true }).click();
        await editor.getByText('Taslak sürüm 1 kaydedildi.', { exact: true }).waitFor();
        await snapshot('editor');
        const saveBox = await editor.getByRole('button', { name: 'Taslağı Kaydet', exact: true }).boundingBox();
        assert.ok(saveBox.height >= 44 && saveBox.y + saveBox.height <= viewport.height, 'Save action must remain reachable');
        await editor.getByRole('button', { name: 'İncelemeye Gönder', exact: true }).click();
        await editor.getByText('Sürüm 2 incelemeye gönderildi.', { exact: true }).waitFor();
        await editor.getByRole('tab', { name: 'Önizleme', exact: true }).click();
        await editor.getByTestId('admin-content-preview').getByText('Responsive workflow lesson with a longer title', { exact: true }).waitFor();
        await editor.getByRole('button', { name: 'Yayınla', exact: true }).click();
        await editor.getByRole('button', { name: 'Yayınlamayı Onayla', exact: true }).click();
        await editor.getByText('Sürüm 3 yayınlandı.', { exact: true }).waitFor();
        await editor.getByRole('tab', { name: 'Düzenle', exact: true }).click();
        await editor.getByRole('textbox', { name: 'Başlık', exact: true }).fill('Unpublished edits');
        await editor.getByRole('button', { name: 'Taslağı Kaydet', exact: true }).click();
        await editor.getByText('Taslak sürüm 4 kaydedildi.', { exact: true }).waitFor();
        let document = (await stored()).workflow.documents['exams:exams-browser-workflow-test'];
        assert.equal(document.published.title, 'Responsive workflow lesson with a longer title');
        await editor.getByRole('tab', { name: 'Sürümler', exact: true }).click();
        await snapshot('history');
        await editor.getByRole('button', { name: 'Sürüm 1 Geri Yükle', exact: true }).click();
        await editor.getByRole('button', { name: 'Taslak Olarak Geri Yükle', exact: true }).click();
        await editor.getByText('Sürüm 1, taslak sürüm 5 olarak geri yüklendi.', { exact: true }).waitFor();
        document = (await stored()).workflow.documents['exams:exams-browser-workflow-test'];
        assert.equal(document.version, 5);
        assert.equal(document.revisions.length, 5);
        assert.equal(document.published.version, 3);
        await editor.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click();
        await page.reload({ waitUntil: 'domcontentloaded' });
        assert.equal((await stored()).workflow.documents['exams:exams-browser-workflow-test'].version, 5);
        await navigate('video-lessons');
        await page.getByRole('button', { name: /^Düzenle: / }).first().click();
        await editor.getByRole('textbox', { name: 'Başlık', exact: true }).fill('Draft video preview title');
        await editor.getByRole('tab', { name: 'Önizleme', exact: true }).click();
        await editor.getByTestId('admin-content-preview').getByText('Draft video preview title', { exact: true }).waitFor();
        await snapshot('video-preview');
        await editor.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click();
        await navigate('vocabulary');
        await page.getByRole('tab', { name: 'Kelimeler', exact: true }).click();
        await page.getByRole('button', { name: /^Düzenle: / }).first().click();
        await editor.getByRole('textbox', { name: 'Başlık', exact: true }).fill('Preview vocabulary');
        await editor.getByRole('tab', { name: 'Önizleme', exact: true }).click();
        await editor.getByTestId('admin-content-preview').getByText('Preview vocabulary', { exact: true }).waitFor();
        await snapshot('word-preview');
        await editor.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click();
        await navigate('grammar');
        await page.getByRole('tab', { name: 'Dil Bilgisi Dersleri', exact: true }).click();
        await page.getByRole('button', { name: /^Düzenle: / }).first().click();
        await editor.getByRole('textbox', { name: 'Başlık', exact: true }).fill('Preview grammar');
        await editor.getByRole('tab', { name: 'Önizleme', exact: true }).click();
        await editor.getByTestId('admin-content-preview').getByText('Preview grammar', { exact: true }).waitFor();
        await snapshot('grammar-preview');
        assert.equal(errors.length, 0, errors.join('\n'));
        results.push({ viewport, workflow: 'passed', consoleErrors: errors });
      } catch (error) {
        await page.screenshot({ path: path.join(output, `${viewport.width}-failure.png`), fullPage: true });
        fs.writeFileSync(path.join(output, `${viewport.width}-failure.txt`), await page.locator('body').innerText());
        throw error;
      } finally { await context.close(); }
    }
    const deniedContext = await browser.newContext();
    await deniedContext.addInitScript((user) => localStorage.setItem('akademik-skor.session', JSON.stringify({ ...user, role: 'student' })), actor);
    const deniedPage = await deniedContext.newPage();
    await deniedPage.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded' });
    await deniedPage.getByTestId('admin-access-denied').waitFor();
    assert.equal(await deniedPage.getByTestId('admin-shell').count(), 0);
    await deniedContext.close();
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
