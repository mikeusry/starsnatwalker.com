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

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ storageState: STATE_FILE, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Hit homepage; check whether "Login" button or user menu shows
await page.goto('https://extrainningsoftball.com/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.screenshot({ path: resolve(SHOTS, 'check-home.png'), fullPage: false });

// MemberPress account dashboard
await page.goto('https://extrainningsoftball.com/account/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.screenshot({ path: resolve(SHOTS, 'check-account.png'), fullPage: true });
writeFileSync(resolve(DEBUG, 'check-account.html'), await page.content());

// Try alternate slug
await page.goto('https://extrainningsoftball.com/membership-account/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.screenshot({ path: resolve(SHOTS, 'check-membership-account.png'), fullPage: true });
writeFileSync(resolve(DEBUG, 'check-membership-account.html'), await page.content());

console.log('Done. Check screenshots.');
await browser.close();
