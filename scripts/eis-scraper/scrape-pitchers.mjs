import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATE_FILE = resolve(__dirname, 'state.json');
const OUT = resolve(__dirname, 'output');
const DEBUG = resolve(__dirname, 'debug');
mkdirSync(OUT, { recursive: true });
mkdirSync(DEBUG, { recursive: true });

const PAGES = [
  ['2027', 'https://extrainningsoftball.com/player-rankings-class-of-2027-rankings-in-calendar-year-2025-pitchers/'],
  ['2028', 'https://extrainningsoftball.com/player-rankings-class-of-2028-rankings-in-calendar-year-2025-pitchers/'],
  ['2029', 'https://extrainningsoftball.com/class-of-2029/player-rankings-class-of-2029-rankings-in-calendar-year-2025-pitchers/'],
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: STATE_FILE, viewport: { width: 1440, height: 1200 } });
const page = await context.newPage();

const results = {};

for (const [year, url] of PAGES) {
  console.log(`\n=== ${year} ===`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  // scroll to load lazy content
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);

  // Set every DataTables instance to "All" entries
  await page.evaluate(() => {
    if (typeof window.jQuery === 'undefined' || typeof window.jQuery.fn.DataTable === 'undefined') {
      console.log('DataTables not present');
      return;
    }
    window.jQuery('.tablepress, table.dataTable').each(function () {
      try {
        const dt = window.jQuery(this).DataTable();
        dt.page.len(-1).draw();
      } catch (e) {
        console.log('dt err', e.message);
      }
    });
  });
  await page.waitForTimeout(2500);

  // Now dump every tablepress table by id
  const tables = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('table[id^="tablepress-"]').forEach((t) => {
      const id = t.id;
      // Section heading discovery: try common patterns + nearest preceding h2/h3
      let sectionName = id;
      const byId = document.getElementById(`${id}-name`);
      if (byId) {
        sectionName = byId.textContent.trim();
      } else {
        // walk up & back to find nearest preceding heading
        let node = t;
        while (node && node.parentElement) {
          let prev = node.previousElementSibling;
          while (prev) {
            if (/^H[1-4]$/.test(prev.tagName)) {
              sectionName = prev.textContent.trim();
              prev = null;
              node = null;
              break;
            }
            const h = prev.querySelector ? prev.querySelector('h1,h2,h3,h4') : null;
            if (h) {
              sectionName = h.textContent.trim();
              prev = null;
              node = null;
              break;
            }
            prev = prev.previousElementSibling;
          }
          if (node) node = node.parentElement;
          if (sectionName !== id) break;
        }
      }
      const headers = Array.from(t.querySelectorAll('thead th')).map((h) => {
        const titleEl = h.querySelector('.dt-column-title');
        return (titleEl ? titleEl.textContent : h.textContent).trim();
      });
      const rows = Array.from(t.querySelectorAll('tbody tr')).map((tr) =>
        Array.from(tr.querySelectorAll('td')).map((td) => {
          const text = td.textContent.replace(/\s+/g, ' ').trim();
          const link = td.querySelector('a');
          if (link) {
            const href = link.getAttribute('href') || '';
            return { text, href };
          }
          return text;
        })
      );
      out.push({ id, sectionName, headers, rows });
    });
    return out;
  });

  console.log(`  Captured ${tables.length} tables`);
  tables.forEach((t) => console.log(`    ${t.sectionName}: ${t.rows.length} rows`));
  results[year] = { url, tables };
}

writeFileSync(resolve(OUT, 'pitchers-raw.json'), JSON.stringify(results, null, 2));
console.log('\nWrote output/pitchers-raw.json');
await browser.close();
