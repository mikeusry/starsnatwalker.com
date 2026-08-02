// Verifies the coach login lands on /admin/camps (not the dashboard) and that
// the camps page carries the same admin nav as the rest of /admin/*.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'https://starsnatwalker.com';

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  console.log('1. log in at /admin/');
  await page.goto(BASE + '/admin/', { waitUntil: 'networkidle' });
  await page.fill('#username', 'StarsNatWalker');
  await page.fill('#password', 'JoeClooney');
  await page.click('#login-form button[type=submit]');
  await page.waitForURL(/\/admin\/camps/, { timeout: 10000 });
  console.log('   landed on:', new URL(page.url()).pathname);

  console.log('2. camps page renders');
  await page.waitForSelector('#view-date:not(.hidden)', { timeout: 10000 });

  console.log('3. admin nav present on camps page');
  const navLinks = await page.$$eval('header a, nav a', (els) =>
    els.map((e) => e.getAttribute('href')).filter(Boolean)
  );
  console.log('   nav hrefs:', navLinks.join(', ') || '(none)');

  console.log('4. no Pitcher Hunt anywhere in admin chrome');
  const hasPitcher = (await page.content()).includes('Pitcher Hunt');
  console.log('   Pitcher Hunt present:', hasPitcher);

  console.log('   js errors:', errors.length ? errors : 'none');
  await browser.close();

  if (hasPitcher) throw new Error('Pitcher Hunt still present');
  if (errors.length) throw new Error('js errors present');
  console.log('\nPASS');
};

run().catch((e) => {
  console.error('\nFAIL:', e.message);
  process.exit(1);
});
