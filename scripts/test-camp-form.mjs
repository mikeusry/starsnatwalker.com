// E2E test of the /camps family form through a REAL browser.
// Not curl: curl skips the page JS, the gate, and the button — exactly the
// path a human takes, and exactly where a silent failure would hide.
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

  let posted = null;
  page.on('request', (r) => {
    if (r.url().includes('/api/camp-checkin')) posted = r.postData();
  });

  console.log('1. load /camps');
  await page.goto(BASE + '/camps', { waitUntil: 'networkidle' });

  console.log('2. gate should be visible, form hidden');
  const gateVisible = await page.isVisible('#gate');
  const appHidden = !(await page.isVisible('#app'));
  console.log('   gate visible:', gateVisible, '| form hidden:', appHidden);
  if (!gateVisible || !appHidden) throw new Error('gate not enforced');

  console.log('3. wrong password rejected');
  await page.fill('#gate-pass', 'wrongpass');
  await page.click('#gate-form button[type=submit]');
  await page.waitForTimeout(300);
  if (await page.isVisible('#app')) throw new Error('wrong password let us in');
  console.log('   rejected OK');

  console.log('4. correct password unlocks');
  await page.fill('#gate-pass', 'stars27');
  await page.click('#gate-form button[type=submit]');
  await page.waitForSelector('#app', { state: 'visible', timeout: 5000 });
  console.log('   unlocked OK');

  console.log('5. fill + submit');
  await page.selectOption('#playerName', 'Ayn Parker Usry');
  await page.fill('#campName', 'ZZ Playwright Test Camp');
  await page.fill('#campDate', '2026-09-27');
  await page.selectOption('#status', 'registered');
  await page.fill('#submittedBy', 'Claude E2E');
  await page.fill('#notes', 'automated test row');
  await page.click('#submitBtn');

  const okShown = await page
    .waitForSelector('#success:not(.hidden)', { timeout: 10000 })
    .then(() => true)
    .catch(() => false);

  const errText = await page.textContent('#form-error').catch(() => '');
  console.log('   POST body:', posted);
  console.log('   success shown:', okShown);
  if (errText && errText.trim()) console.log('   form error text:', errText.trim());
  console.log('   console errors:', errors.length ? errors : 'none');

  await browser.close();
  if (!okShown) throw new Error('form did not report success');
  console.log('\nPASS — real browser submit succeeded');
};

run().catch((e) => {
  console.error('\nFAIL:', e.message);
  process.exit(1);
});
