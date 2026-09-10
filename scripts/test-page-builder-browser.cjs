/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const output = process.env.ADMIN_TEST_OUTPUT || path.join(__dirname, '..', '.test-results', 'page-builder');
const baseUrl = process.env.ADMIN_TEST_URL || 'http://localhost:8092';
const actor = { id: 'page-builder-browser-admin', name: 'Page Builder Test', email: 'page-builder@example.com', role: 'admin', plan: 'free', goal: '', createdAt: '2026-09-09T00:00:00.000Z', emailVerified: true };
fs.mkdirSync(output, { recursive: true });

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 820, height: 1180 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript((user) => { localStorage.setItem('akademik-skor.session', JSON.stringify(user)); localStorage.removeItem('akademik-skor.admin-workspace.v2'); }, actor);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.setDefaultTimeout(20000);
      try {
        await page.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        if (viewport.width < 1040) await page.getByRole('button', { name: 'Admin menüsünü aç', exact: true }).click();
        await page.getByTestId('admin-nav-page-builder').click();
        await page.getByText('Sayfa Oluşturucu', { exact: true }).first().waitFor();
        await page.getByRole('tab', { name: /Video Lessons/ }).click();
        await page.getByRole('button', { name: 'Öneriler bölümü ekle', exact: true }).click();
        await page.getByText('Öneriler', { exact: true }).first().waitFor();
        await page.getByRole('button', { name: 'Önizleme', exact: true }).click();
        await page.getByText('Öğrenci önizlemesi', { exact: true }).waitFor();
        await page.getByText('Serbest HTML, CSS ve JavaScript çalıştırılmaz.', { exact: false }).waitFor();
        await page.getByRole('button', { name: 'Düzenleyici', exact: true }).click();
        await page.getByRole('button', { name: 'Yayınla', exact: true }).click();
        await page.getByText(/Yayında · 1\. sürüm/, { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Sekme ekle', exact: true }).click();
        await page.getByRole('button', { name: 'Content Tab', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${viewport.width}: horizontal overflow`);
        assert.equal(errors.length, 0, errors.join('\n'));
        await page.screenshot({ path: path.join(output, `${viewport.width}-page-builder.png`), fullPage: true, animations: 'disabled' });
        results.push({ viewport, status: 'passed', consoleErrors: errors });
      } catch (error) {
        await page.screenshot({ path: path.join(output, `${viewport.width}-failure.png`), fullPage: true });
        fs.writeFileSync(path.join(output, `${viewport.width}-failure.txt`), await page.locator('body').innerText());
        throw error;
      } finally { await context.close(); }
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
