/**
 * Post a confirmed Cynthia hotel block onto the family portal.
 *
 *   node scripts/post-hotel-block.mjs \
 *     --id east-coast-fall-showcase-2026 \
 *     --name "Courtyard Pennsville" \
 *     --url "https://..."
 *
 * Refuses a missing https URL. Does not invent hotels.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return null;
  return process.argv[i + 1] ?? null;
}

const id = arg('id');
const name = arg('name');
const url = arg('url');
if (!id || !name || !url) {
  console.error('Need --id --name --url. Only run this when Cynthia’s block is real.');
  process.exit(1);
}
if (!/^https:\/\//.test(url)) {
  console.error('URL must start with https:// — will not post an unconfirmed hotel.');
  process.exit(1);
}

const root = resolve(import.meta.dirname, '..');
const schedulePath = resolve(root, 'src/data/schedule.json');
const travelPath = resolve(root, 'src/data/family-travel.json');
const noticesPath = resolve(root, 'src/data/family-notices.json');
const today = new Date().toISOString().slice(0, 10);

const schedule = JSON.parse(readFileSync(schedulePath, 'utf8'));
const event = (schedule.events ?? []).find((e) => e.id === id);
if (!event) {
  console.error(`No event ${id} in schedule.json`);
  process.exit(1);
}

event.hotel = name;
event.hotelUrl = url;
writeFileSync(schedulePath, `${JSON.stringify(schedule, null, 2)}\n`);

const posted = (schedule.events ?? []).filter((e) => e.hotel && e.hotelUrl);
const travel = JSON.parse(readFileSync(travelPath, 'utf8'));
travel.updated = today;
travel.hotels =
  posted.length === 0
    ? travel.hotels
    : `Team hotel blocks: ${posted.map((e) => `${e.name} — ${e.hotel}`).join('; ')}.`;
const rules = travel.rules ?? [];
travel.rules = rules.map((r) =>
  r.includes('links coming')
    ? 'Cynthia books the team hotel blocks. Links on this page when they are real.'
    : r
);
writeFileSync(travelPath, `${JSON.stringify(travel, null, 2)}\n`);

const notices = JSON.parse(readFileSync(noticesPath, 'utf8'));
const title = `Hotel block: ${event.name}`;
const body = `${name} for ${event.name}. Book through Cynthia’s link.`;
const href = `/family/travel/${id}/`;
const existing = notices.find((n) => n.title === title);
if (existing) {
  existing.date = today;
  existing.body = body;
  existing.href = href;
  existing.hrefLabel = 'Open the weekend kit';
} else {
  notices.unshift({
    date: today,
    title,
    body,
    href,
    hrefLabel: 'Open the weekend kit',
  });
}
writeFileSync(noticesPath, `${JSON.stringify(notices, null, 2)}\n`);

console.log(`Posted ${name} on ${id}. Deploy starsnatwalker.com when you want families to see it.`);
