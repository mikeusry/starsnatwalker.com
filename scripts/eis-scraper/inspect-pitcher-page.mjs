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

const PAGES = [
  ['2027', 'https://extrainningsoftball.com/player-rankings-class-of-2027-rankings-in-calendar-year-2025-pitchers/'],
  ['2028', 'https://extrainningsoftball.com/player-rankings-class-of-2028-rankings-in-calendar-year-2025-pitchers/'],
  ['2029', 'https://extrainningsoftball.com/class-of-2029/player-rankings-class-of-2029-rankings-in-calendar-year-2025-pitchers/'],
];

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ storageState: STATE_FILE, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

for (const [year, url] of PAGES) {
  console.log('→', year, url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  // try to scroll to trigger lazy-load
  await page.evaluate(async () => {
    await new Promise((res) => {
      let total = 0;
      const distance = 600;
      const t = setInterval(() => {
        window.scrollBy(0, distance);
        total += distance;
        if (total >= document.body.scrollHeight) {
          clearInterval(t);
          res();
        }
      }, 200);
    });
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: resolve(SHOTS, `pitchers-${year}.png`), fullPage: true });
  writeFileSync(resolve(DEBUG, `pitchers-${year}.html`), await page.content());
  console.log('  saved', year);
}
await browser.close();
console.log('Done.');
