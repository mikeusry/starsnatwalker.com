import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATE_FILE = resolve(__dirname, 'state.json');
const DEBUG = resolve(__dirname, 'debug');
const SHOTS = resolve(__dirname, 'screenshots');
mkdirSync(DEBUG, { recursive: true });
mkdirSync(SHOTS, { recursive: true });

// Try class-of-XXXX pages; also try category archives for class years
const URLS = [
  'https://extrainningsoftball.com/class-of-2027/',
  'https://extrainningsoftball.com/class-of-2028/',
  'https://extrainningsoftball.com/class-of-2029/',
  'https://extrainningsoftball.com/category/class-of-2027/',
  'https://extrainningsoftball.com/category/class-of-2028/',
  'https://extrainningsoftball.com/category/class-of-2029/',
  // Sample pitcher list page to understand HTML structure
  'https://extrainningsoftball.com/2027-uncommitted-pitchers/',
  'https://extrainningsoftball.com/top-10-uncommitted-2027-pitchers/',
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: STATE_FILE });
const page = await context.newPage();

const allLinks = new Map();
for (const url of URLS) {
  console.log('→', url);
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const status = resp ? resp.status() : 0;
    const slug = url.replace(/https?:\/\//, '').replace(/\W+/g, '_');
    await page.screenshot({ path: resolve(SHOTS, `cls-${slug}.png`), fullPage: true });
    writeFileSync(resolve(DEBUG, `cls-${slug}.html`), await page.content());
    console.log(`  status=${status} title="${await page.title()}"`);
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a'))
        .map((a) => ({ text: (a.textContent || '').trim(), href: a.href }))
        .filter((l) => l.text && l.href)
    );
    for (const l of links) allLinks.set(l.href, l);
  } catch (e) {
    console.log('  error:', e.message);
  }
}
writeFileSync(resolve(DEBUG, 'class-pages-links.json'), JSON.stringify([...allLinks.values()], null, 2));
console.log('→', allLinks.size, 'unique links');
await browser.close();
