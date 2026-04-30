import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 1400 }, deviceScaleFactor: 2 });
const page = await context.newPage();

page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
});

await page.goto('http://localhost:4322/');
await page.evaluate(() => sessionStorage.setItem('snw_admin_auth', 'true'));
await page.goto('http://localhost:4322/admin/pitchers', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
// Click "All" tier to show peer rows too
await page.click('button.tier-btn[data-tier=""]');
await page.waitForTimeout(500);
// Filter for Gonglik
await page.fill('input[data-col="fullName"]', 'gonglik');
await page.waitForTimeout(500);

const tbodyHtml = await page.evaluate(() => document.getElementById('pitcher-tbody')?.innerHTML?.length || -1);
console.log('tbody innerHTML length:', tbodyHtml);
const dataLen = await page.evaluate(() => (typeof window !== 'undefined' && Array.isArray(window.__pitchers__)) ? window.__pitchers__.length : 'not exposed');
console.log('window pitchers:', dataLen);

await page.screenshot({ path: '/tmp/admin-pitchers.png', fullPage: false });
console.log('Saved');
await browser.close();
