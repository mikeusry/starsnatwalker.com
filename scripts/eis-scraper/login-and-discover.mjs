import { chromium } from 'playwright';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');

dotenv.config({ path: resolve(ROOT, '.env.local') });

const USERNAME = process.env.EIS_USERNAME;
const PASSWORD = process.env.EIS_PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error('Missing EIS_USERNAME or EIS_PASSWORD in .env.local');
  process.exit(1);
}

const DEBUG_DIR = resolve(__dirname, 'debug');
const SCREENSHOTS = resolve(__dirname, 'screenshots');
const STATE_FILE = resolve(__dirname, 'state.json');
mkdirSync(DEBUG_DIR, { recursive: true });
mkdirSync(SCREENSHOTS, { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
});
const page = await context.newPage();

console.log('→ Going to login page');
await page.goto('https://extrainningsoftball.com/login/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.screenshot({ path: resolve(SCREENSHOTS, '01-login-page.png'), fullPage: true });

const html = await page.content();
writeFileSync(resolve(DEBUG_DIR, '01-login-page.html'), html);

console.log('→ Filling login form');
const usernameSel = await page.locator('input[name="username"], input#user_login, input[type="text"]').first();
const passwordSel = await page.locator('input[name="password"], input#user_pass, input[type="password"]').first();

await usernameSel.fill(USERNAME);
await passwordSel.fill(PASSWORD);
await page.screenshot({ path: resolve(SCREENSHOTS, '02-filled.png'), fullPage: true });

const submitSel = await page.locator('button:has-text("Log In"), input[type="submit"], button:has-text("Login")').first();
await Promise.all([
  page.waitForLoadState('domcontentloaded'),
  submitSel.click(),
]);
await page.waitForTimeout(3000);
await page.screenshot({ path: resolve(SCREENSHOTS, '03-after-login.png'), fullPage: true });
writeFileSync(resolve(DEBUG_DIR, '03-after-login.html'), await page.content());

console.log('→ Logged in URL:', page.url());

await context.storageState({ path: STATE_FILE });
console.log('→ Saved session state to', STATE_FILE);

console.log('→ Looking for navigation links');
const links = await page.evaluate(() =>
  Array.from(document.querySelectorAll('a'))
    .map((a) => ({ text: (a.textContent || '').trim(), href: a.href }))
    .filter((l) => l.text && l.href && !l.href.startsWith('mailto:') && !l.href.startsWith('tel:'))
);
const ranking = links.filter((l) =>
  /rank|top|pitcher|class of|2027|2028|2029|extra elite/i.test(l.text + l.href)
);
writeFileSync(resolve(DEBUG_DIR, 'all-links.json'), JSON.stringify(links, null, 2));
writeFileSync(resolve(DEBUG_DIR, 'ranking-links.json'), JSON.stringify(ranking, null, 2));
console.log('→ Found', links.length, 'links total,', ranking.length, 'ranking-related');

console.log('→ Browser stays open 15s for inspection');
await page.waitForTimeout(15000);
await browser.close();
console.log('Done.');
