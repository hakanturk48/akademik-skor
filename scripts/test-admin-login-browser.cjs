const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const output = process.env.ADMIN_TEST_OUTPUT;
const base = process.env.ADMIN_TEST_URL || 'http://localhost:8092';
async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error' && /nested|cannot contain|hydration/i.test(message.text())) errors.push(message.text()); });
      page.setDefaultTimeout(20000);
      await page.goto(`${base}/admin`);
      await page.waitForURL(/\/login\?next=/);
      await page.getByText('Admin girişi', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'İlk yerel admin hesabını oluştur', exact: true }).click();
      await page.getByRole('textbox', { name: 'Ad Soyad', exact: true }).fill('Browser Admin');
      await page.getByRole('textbox', { name: 'E-posta', exact: true }).fill('browser-admin@example.com');
      await page.getByLabel('Şifre', { exact: true }).fill('Local-Only-Test-123!');
      await page.getByRole('button', { name: 'Şifreyi göster', exact: true }).click();
      await page.getByRole('button', { name: 'Şifreyi gizle', exact: true }).click();
      assert.equal(await page.locator('button button').count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if (output) { fs.mkdirSync(output, { recursive: true }); await page.screenshot({ path: path.join(output, `${width}-admin-setup.png`), fullPage: true, animations: 'disabled' }); }
      await page.getByRole('button', { name: 'Yerel Admin Hesabı Oluştur', exact: true }).click();
      await page.getByTestId('admin-shell').waitFor();
      await page.getByRole('button', { name: 'Admin çıkış', exact: true }).click();
      await page.waitForURL(/\/login\?next=/);
      assert.equal(await page.getByRole('button', { name: 'İlk yerel admin hesabını oluştur', exact: true }).count(), 0);
      await page.getByRole('textbox', { name: 'E-posta', exact: true }).fill('browser-admin@example.com');
      await page.getByLabel('Şifre', { exact: true }).fill('wrong-password');
      await page.getByRole('button', { name: 'Admin Paneline Giriş Yap', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'E-posta veya şifre hatalı.' }).waitFor();
      await page.getByLabel('Şifre', { exact: true }).fill('Local-Only-Test-123!');
      await page.getByRole('button', { name: 'Admin Paneline Giriş Yap', exact: true }).click();
      await page.getByTestId('admin-shell').waitFor();
      await page.goto(`${base}/login`);
      await page.waitForURL(/\/admin$/);
      assert.equal(await page.locator('button button').count(), 0);
      assert.deepEqual(errors, []);
      console.log(`${width}px: setup, login, logout, redirect, password toggle, no nested buttons: passed`);
      await context.close();
    }
  } finally { await browser.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
