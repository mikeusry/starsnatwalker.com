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
  console.error('Missing EIS_USERNAME / EIS_PASSWORD');
  process.exit(1);
}

const OUT = resolve(__dirname, 'output');
const DEBUG = resolve(__dirname, 'debug');
mkdirSync(OUT, { recursive: true });
mkdirSync(DEBUG, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
});
const page = await context.newPage();

// --- fresh login (session state from April is likely stale) ---
console.log('→ login');
await page.goto('https://extrainningsoftball.com/login/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.locator('input[name="username"], input#user_login, input[type="text"]').first().fill(USERNAME);
await page.locator('input[name="password"], input#user_pass, input[type="password"]').first().fill(PASSWORD);
await Promise.all([
  page.waitForLoadState('domcontentloaded'),
  page.locator('button:has-text("Log In"), input[type="submit"], button:has-text("Login")').first().click(),
]);
await page.waitForTimeout(3000);
console.log('  logged-in URL:', page.url());
await context.storageState({ path: resolve(__dirname, 'state.json') });

// --- candidate 2028 catcher ranking URLs (parallel to pitcher pattern) ---
const CANDIDATES = [
  'https://extrainningsoftball.com/player-rankings-class-of-2028-catchers/',
  'https://extrainningsoftball.com/class-of-2028/player-rankings-class-of-2028-catchers/',
  'https://extrainningsoftball.com/player-rankings-class-of-2028-rankings-in-calendar-year-2026-catchers/',
];

// Also discover via the 2028 pitcher page nav, in case the slug differs.
async function discoverFrom(url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a'))
        .map((a) => ({ text: (a.textContent || '').trim(), href: a.href }))
        .filter((l) => /catcher/i.test(l.text + l.href) && /2028/.test(l.text + l.href))
    );
    return links;
  } catch {
    return [];
  }
}

const discovered = await discoverFrom(
  'https://extrainningsoftball.com/player-rankings-class-of-2028-rankings-in-calendar-year-2025-pitchers/'
);
console.log('→ discovered catcher links from 2028 pitcher page:', JSON.stringify(discovered, null, 2));

const tryUrls = [...new Set([...discovered.map((d) => d.href), ...CANDIDATES])];

async function scrapeTables(url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const status = await page.evaluate(() => document.title);
  // bail if it's a 404 / not-found
  if (/not found|404|page can.?t be found/i.test(status)) return { url, title: status, tables: [] };

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  await page.evaluate(() => {
    if (typeof window.jQuery === 'undefined' || typeof window.jQuery.fn?.DataTable === 'undefined') return;
    window.jQuery('.tablepress, table.dataTable').each(function () {
      try { window.jQuery(this).DataTable().page.len(-1).draw(); } catch {}
    });
  });
  await page.waitForTimeout(2000);

  const tables = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('table[id^="tablepress-"], table.dataTable, table.tablepress').forEach((t) => {
      const headers = Array.from(t.querySelectorAll('thead th')).map((h) => {
        const titleEl = h.querySelector('.dt-column-title');
        return (titleEl ? titleEl.textContent : h.textContent).trim();
      });
      const rows = Array.from(t.querySelectorAll('tbody tr')).map((tr) =>
        Array.from(tr.querySelectorAll('td')).map((td) => td.textContent.replace(/\s+/g, ' ').trim())
      );
      if (rows.length) out.push({ id: t.id || '(no-id)', headers, rows });
    });
    return out;
  });
  return { url, title: status, tables };
}

let hit = null;
for (const url of tryUrls) {
  console.log('→ trying', url);
  const r = await scrapeTables(url);
  console.log('   title:', r.title, '| tables:', r.tables.length, '| rows:', r.tables.reduce((a, t) => a + t.rows.length, 0));
  if (r.tables.some((t) => t.rows.length)) { hit = r; break; }
}

if (!hit) {
  console.log('✗ No catcher table found on any candidate URL. Dumping discovered links for manual follow-up.');
  writeFileSync(resolve(DEBUG, 'catcher-2028-discovered.json'), JSON.stringify({ discovered, tryUrls }, null, 2));
} else {
  writeFileSync(resolve(OUT, 'catchers-2028-raw.json'), JSON.stringify(hit, null, 2));
  console.log('\n✓ Wrote output/catchers-2028-raw.json from', hit.url);
}

await browser.close();
