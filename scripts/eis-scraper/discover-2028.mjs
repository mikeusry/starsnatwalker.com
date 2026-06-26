import { chromium } from 'playwright';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');
dotenv.config({ path: resolve(ROOT, '.env.local') });

const DEBUG = resolve(__dirname, 'debug');
mkdirSync(DEBUG, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
});
const page = await context.newPage();

await page.goto('https://extrainningsoftball.com/login/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.locator('input[name="username"], input#user_login, input[type="text"]').first().fill(process.env.EIS_USERNAME);
await page.locator('input[name="password"], input#user_pass, input[type="password"]').first().fill(process.env.EIS_PASSWORD);
await Promise.all([page.waitForLoadState('domcontentloaded'), page.locator('button:has-text("Log In"), input[type="submit"]').first().click()]);
await page.waitForTimeout(2500);
await context.storageState({ path: resolve(__dirname, 'state.json') });

const HUBS = [
  'https://extrainningsoftball.com/rankings/',
  'https://extrainningsoftball.com/player-rankings/',
  'https://extrainningsoftball.com/class-of-2028/',
  'https://extrainningsoftball.com/player-rankings-class-of-2028-rankings-in-calendar-year-2025-pitchers/',
];

const all = new Map();
for (const url of HUBS) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
    const title = await page.title();
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a'))
        .map((a) => ({ text: (a.textContent || '').trim(), href: a.href }))
        .filter((l) => l.href)
    );
    console.log(`→ ${url} [${title}] — ${links.length} links`);
    for (const l of links) all.set(l.href, l);
  } catch (e) {
    console.log(`✗ ${url}: ${e.message}`);
  }
}

const links = [...all.values()];
const rankingish = links.filter((l) =>
  /2028|catcher|player-rankings|extra-elite|top-\d|infield|outfield|class-of/i.test(l.text + ' ' + l.href)
);
writeFileSync(resolve(DEBUG, '2028-discovery.json'), JSON.stringify(rankingish, null, 2));
console.log(`\n→ ${rankingish.length} ranking-related links written to debug/2028-discovery.json`);
rankingish.forEach((l) => console.log(`   ${l.text}  →  ${l.href}`));

await browser.close();
