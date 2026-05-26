import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });

const failed = [];
page.on('response', async (resp) => {
  const url = resp.url();
  const ct = resp.headers()['content-type'] || '';
  const isImg = /\.(jpg|jpeg|png|webp|gif|avif)/i.test(url) || ct.startsWith('image/') || url.includes('pbs.twimg.com') || url.includes('cloudinary');
  if (isImg && resp.status() >= 400) failed.push({ status: resp.status(), url });
});
page.on('requestfailed', (req) => {
  const url = req.url();
  if (/\.(jpg|jpeg|png|webp|gif|avif)/i.test(url) || url.includes('pbs.twimg.com') || url.includes('cloudinary')) {
    failed.push({ status: 'FAILED', url, err: req.failure()?.errorText });
  }
});

await page.goto('http://localhost:4321/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

// find broken <img> in DOM (naturalWidth === 0 after load)
const brokenImgs = await page.$$eval('img', imgs =>
  imgs.filter(i => i.complete && i.naturalWidth === 0)
      .map(i => ({ src: i.currentSrc || i.src, alt: i.alt }))
);

await page.screenshot({ path: '/tmp/snw-roster.png', fullPage: true });
await browser.close();

console.log('=== NETWORK-FAILED IMAGES ===');
console.log(JSON.stringify(failed, null, 2));
console.log('=== DOM BROKEN IMAGES (naturalWidth=0) ===');
console.log(JSON.stringify(brokenImgs, null, 2));
