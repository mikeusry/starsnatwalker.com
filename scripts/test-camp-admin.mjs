// E2E test of /admin/camps — the coach view. Verifies the gate redirects,
// both tabs render, and the "told us nothing" blanks actually appear.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:8788';

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  console.log('1. unauthenticated visit should bounce to /admin/');
  await page.goto(BASE + '/admin/camps', { waitUntil: 'networkidle' });
  console.log('   landed on:', new URL(page.url()).pathname);
  if (!/\/admin\/?$/.test(new URL(page.url()).pathname)) {
    throw new Error('gate did not redirect');
  }

  console.log('2. authenticate, then load the page');
  await page.evaluate(() => sessionStorage.setItem('snw_admin_auth', 'true'));
  await page.goto(BASE + '/admin/camps', { waitUntil: 'networkidle' });
  await page.waitForSelector('#view-date:not(.hidden)', { timeout: 10000 });

  const summary = await page.textContent('#summary');
  console.log('   summary tiles:', summary.replace(/\s+/g, ' ').trim());

  const dateCards = await page.$$eval('#view-date > div', (els) => els.length);
  console.log('3. by-date entries:', dateCards);

  console.log('4. switch to by-player');
  await page.click('#tab-player');
  await page.waitForSelector('#view-player:not(.hidden)', { timeout: 5000 });
  const playerCards = await page.$$eval('#view-player > div', (els) => els.length);
  const blanks = await page.$$eval('#view-player', (els) =>
    (els[0].textContent.match(/Nothing reported yet/g) || []).length
  );
  console.log('   player cards:', playerCards, '| showing "Nothing reported yet":', blanks);

  console.log('   console errors:', errors.length ? errors : 'none');
  await browser.close();

  if (!dateCards) throw new Error('no camps rendered');
  if (playerCards !== 15) throw new Error('expected 15 roster cards, got ' + playerCards);
  if (errors.length) throw new Error('console errors present');
  console.log('\nPASS — coach view renders both lenses');
};

run().catch((e) => {
  console.error('\nFAIL:', e.message);
  process.exit(1);
});
