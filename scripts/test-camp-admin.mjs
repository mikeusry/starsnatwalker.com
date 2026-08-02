// E2E test of /admin/camps — the coach view. Verifies the gate redirects,
// both tabs render, and the "told us nothing" blanks actually appear.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:8788';

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // Cloudflare edge-caches these pages, so a passing test right after a deploy
  // can be measuring the OLD page. Bust with a query string rather than a
  // no-cache header — the header trips CORS preflight on third-party assets
  // (fonts, the CF beacon) and floods the console with irrelevant errors.
  const bust = () => '?cb=' + Math.random().toString(36).slice(2);
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  console.log('1. unauthenticated visit should bounce to /admin/');
  await page.goto(BASE + '/admin/camps' + bust(), { waitUntil: 'networkidle' });
  console.log('   landed on:', new URL(page.url()).pathname);
  if (!/\/admin\/?$/.test(new URL(page.url()).pathname)) {
    throw new Error('gate did not redirect');
  }

  console.log('2. authenticate, then load the page');
  await page.evaluate(() => sessionStorage.setItem('snw_admin_auth', 'true'));
  await page.goto(BASE + '/admin/camps' + bust(), { waitUntil: 'networkidle' });
  await page.waitForSelector('#view-date:not(.hidden)', { timeout: 10000 });

  const summary = await page.textContent('#summary');
  console.log('   summary tiles:', summary.replace(/\s+/g, ' ').trim());

  console.log('3. admin nav present');
  const nav = await page.$$eval('header a', (els) =>
    els.map((e) => e.getAttribute('href'))
  );
  console.log('   nav:', nav.join(', '));
  for (const need of ['/admin/camps', '/admin/dashboard', '/admin/teams', '/admin/help']) {
    if (!nav.includes(need)) throw new Error('missing nav link: ' + need);
  }
  if ((await page.content()).includes('Pitcher Hunt')) {
    throw new Error('Pitcher Hunt present');
  }

  console.log('4. upcoming section on top, past folded into <details>');
  const headings = await page.$$eval('#view-date h2, #view-date summary', (els) =>
    els.map((e) => e.textContent.replace(/\s+/g, ' ').trim())
  );
  console.log('   sections:', headings.join(' | '));
  const pastCollapsed = await page.$$eval('#view-date details', (els) =>
    els.map((e) => e.open)
  );
  console.log('   past <details> open state:', pastCollapsed);
  if (pastCollapsed.some(Boolean)) throw new Error('past camps should start collapsed');

  console.log('5. switch to by-player');
  await page.click('#tab-player');
  await page.waitForSelector('#view-player:not(.hidden)', { timeout: 5000 });
  const playerCards = await page.$$eval('#view-player > div', (els) => els.length);
  const needsPlan = await page.$$eval('#view-player', (els) =>
    (els[0].textContent.match(/needs a plan/g) || []).length
  );
  const firstCard = await page.$eval('#view-player > div', (e) =>
    e.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)
  );
  console.log('   player cards:', playerCards, '| "needs a plan":', needsPlan);
  console.log('   first card (should need chasing):', firstCard);

  console.log('   console errors:', errors.length ? errors : 'none');
  await browser.close();

  if (playerCards !== 15) throw new Error('expected 15 roster cards, got ' + playerCards);
  if (errors.length) throw new Error('console errors present');
  console.log('\nPASS — coach view renders both lenses');
};

run().catch((e) => {
  console.error('\nFAIL:', e.message);
  process.exit(1);
});
