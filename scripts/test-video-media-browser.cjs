/* global __dirname, Buffer */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const output = process.env.ADMIN_TEST_OUTPUT || path.join(__dirname, '..', '.test-results', 'video-media');
const baseUrl = process.env.ADMIN_TEST_URL || 'http://localhost:8092';
const actor = { id: 'video-media-browser-admin', name: 'Video Media Test', email: 'video-media@example.com', role: 'admin', plan: 'premium', goal: '', createdAt: '2026-09-10T00:00:00.000Z', emailVerified: true };
fs.mkdirSync(output, { recursive: true });

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 820, height: 1180 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript((user) => {
        if (!localStorage.getItem('video-media-browser-seeded')) {
          localStorage.setItem('akademik-skor.session', JSON.stringify(user));
          localStorage.removeItem('akademik-skor.admin-workspace.v2');
          localStorage.setItem('video-media-browser-seeded', '1');
        }
      }, actor);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.setDefaultTimeout(20000);
      try {
        await page.goto(baseUrl + '/admin', { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.getByTestId('admin-shell').waitFor();
        if (viewport.width < 1040) await page.getByRole('button', { name: 'Admin menüsünü aç', exact: true }).click();
        await page.getByTestId('admin-nav-video-lessons').click();
        await page.getByRole('button', { name: 'Video Ders Oluştur', exact: true }).click();
        const editor = page.getByTestId('admin-content-editor');
        await editor.getByRole('textbox', { name: 'Başlık', exact: true }).fill('Browser YouTube Lesson');
        await editor.getByRole('textbox', { name: 'Bağlantı adı', exact: true }).fill('browser-youtube-lesson');
        await editor.getByRole('textbox', { name: 'Açıklama', exact: true }).fill('Browser media workflow test lesson');
        await editor.getByRole('radio', { name: 'YouTube', exact: true }).click();
        await editor.getByRole('textbox', { name: 'Video bağlantısı', exact: true }).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        await editor.getByRole('textbox', { name: 'Video süresi', exact: true }).fill('600');
        await editor.getByRole('textbox', { name: 'Önizleme süresi', exact: true }).fill('120');
        await editor.getByRole('textbox', { name: 'Thumbnail bağlantısı', exact: true }).fill('https://cdn.example.com/youtube-lesson.jpg');
        await editor.getByRole('textbox', { name: 'Bölümler', exact: true }).fill('00:00|Giriş\n04:00|Ana strateji');
        await editor.getByRole('textbox', { name: 'Altyazı / transkript', exact: true }).fill('00:00|Browser transcript line');
        await editor.getByRole('button', { name: 'Taslağı Kaydet', exact: true }).click();
        await editor.getByText('Taslak sürüm 1 kaydedildi.', { exact: true }).waitFor();
        await editor.getByRole('button', { name: 'Önizleme', exact: true }).click();
        const previewFrame = editor.locator('iframe[title="Browser YouTube Lesson"]');
        await previewFrame.waitFor();
        assert.equal(await previewFrame.getAttribute('src'), 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1');
        await editor.getByRole('button', { name: 'Yayınla', exact: true }).click();
        await editor.getByRole('button', { name: 'Yayınlamayı Onayla', exact: true }).click();
        await editor.getByText('Sürüm 2 yayınlandı.', { exact: true }).waitFor();
        await editor.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click();

        await page.evaluate((user) => localStorage.setItem('akademik-skor.session', JSON.stringify({ ...user, role: 'student', id: 'video-media-browser-student', email: 'video-media-student@example.com' })), actor);
        await page.goto(baseUrl + '/learning/videos', { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.getByText('Browser YouTube Lesson', { exact: true }).first().waitFor();
        await page.getByText('2 min preview', { exact: true }).first().waitFor();
        await page.goto(baseUrl + '/learning/videos/lessons-browser-youtube-lesson', { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.getByTestId('video-player-screen').waitFor();
        await page.locator('iframe[title="Browser YouTube Lesson"]').waitFor();
        await page.getByRole('tab', { name: 'Transcript', exact: true }).click();
        await page.getByText('Browser transcript line', { exact: true }).waitFor();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), viewport.width + ': horizontal overflow');
        assert.equal(errors.length, 0, errors.join('\n'));
        await page.screenshot({ path: path.join(output, viewport.width + '-video-media.png'), fullPage: true, animations: 'disabled' });

        await page.evaluate((user) => localStorage.setItem('akademik-skor.session', JSON.stringify(user)), actor);
        await page.goto(baseUrl + '/admin', { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.getByTestId('admin-shell').waitFor();
        if (viewport.width < 1040) await page.getByRole('button', { name: 'Admin menüsünü aç', exact: true }).click();
        await page.getByTestId('admin-nav-video-lessons').click();
        await page.getByRole('button', { name: 'Video Ders Oluştur', exact: true }).click();
        await editor.getByRole('textbox', { name: 'Başlık', exact: true }).fill('Browser Uploaded Lesson');
        await editor.getByRole('textbox', { name: 'Bağlantı adı', exact: true }).fill('browser-upload-lesson');
        await editor.getByRole('textbox', { name: 'Açıklama', exact: true }).fill('Browser upload workflow test lesson');
        await editor.getByRole('radio', { name: 'Yüklenen video', exact: true }).click();
        const chooserPromise = page.waitForEvent('filechooser');
        await editor.getByRole('button', { name: 'Video dosyası seç', exact: true }).click();
        const chooser = await chooserPromise;
        await chooser.setFiles({ name: 'browser-upload.mp4', mimeType: 'video/mp4', buffer: Buffer.from('browser-upload-test') });
        await editor.getByText('Video dosyası seçildi', { exact: true }).waitFor();
        await editor.getByRole('textbox', { name: 'Video süresi', exact: true }).fill('90');
        await editor.getByRole('button', { name: 'Taslağı Kaydet', exact: true }).click();
        await editor.getByText('Taslak sürüm 1 kaydedildi.', { exact: true }).waitFor();
        await editor.getByRole('button', { name: 'Yayınla', exact: true }).click();
        await editor.getByRole('button', { name: 'Yayınlamayı Onayla', exact: true }).click();
        await editor.getByText('Sürüm 2 yayınlandı.', { exact: true }).waitFor();
        await editor.getByRole('button', { name: 'Düzenleyiciyi kapat', exact: true }).click();

        await page.evaluate((user) => localStorage.setItem('akademik-skor.session', JSON.stringify({ ...user, role: 'student', id: 'video-media-browser-student', email: 'video-media-student@example.com' })), actor);
        await page.goto(baseUrl + '/learning/videos/lessons-browser-upload-lesson', { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.getByTestId('video-player-screen').waitFor();
        await page.locator('video[controls]').waitFor();
        await page.screenshot({ path: path.join(output, viewport.width + '-video-upload.png'), fullPage: true, animations: 'disabled' });
        results.push({ viewport, status: 'passed', consoleErrors: errors });
      } catch (error) {
        await page.screenshot({ path: path.join(output, viewport.width + '-failure.png'), fullPage: true });
        fs.writeFileSync(path.join(output, viewport.width + '-failure.txt'), await page.locator('body').innerText());
        throw error;
      } finally {
        await context.close();
      }
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
