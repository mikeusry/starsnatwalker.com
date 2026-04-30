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

const HUBS = [
  'https://extrainningsoftball.com/rankings/',
  'https://extrainningsoftball.com/player-rankings/',
  'https://extrainningsoftball.com/category/all-region/',
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: STATE_FILE });
const page = await context.newPage();

const allLinks = new Set();

for (const url of HUBS) {
  console.log('→', url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const slug = url.replace(/https?:\/\//, '').replace(/\W+/g, '_');
  await page.screenshot({ path: resolve(SHOTS, `hub-${slug}.png`), fullPage: true });
  writeFileSync(resolve(DEBUG, `hub-${slug}.html`), await page.content());

  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a'))
      .map((a) => ({ text: (a.textContent || '').trim(), href: a.href }))
      .filter((l) => l.text && l.href)
  );
  for (const l of links) {
    allLinks.add(JSON.stringify(l));
  }
}

const dedup = [...allLinks].map((s) => JSON.parse(s));
writeFileSync(resolve(DEBUG, 'hub-links.json'), JSON.stringify(dedup, null, 2));
console.log('→', dedup.length, 'unique links across hubs');

await browser.close();
