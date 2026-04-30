import { chromium } from 'playwright';

const TARGET = process.argv[2] || 'http://localhost:4322/admin/teams';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 1400 }, deviceScaleFactor: 2 });
const page = await context.newPage();

page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
});

await page.goto('http://localhost:4322/');
await page.evaluate(() => sessionStorage.setItem('snw_admin_auth', 'true'));
await page.goto(TARGET, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

await page.screenshot({ path: '/tmp/admin-pitchers.png', fullPage: false });
console.log('Saved /tmp/admin-pitchers.png');
await browser.close();
