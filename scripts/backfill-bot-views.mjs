// One-time backfill: flag historical crawler rows in profile_views as is_bot=true.
//
// The pixel used to write is_bot:false from the browser, so a crawler flood
// (notably ~863 fake views on 2026-06-17, plus recurring spoofed-Chrome traffic
// since Feb 2026) is recorded as real. This applies the SAME conservative,
// high-confidence signature the new /api/track function uses going forward, and
// LEAVES ANY ROW WITH REAL GEO ALONE (could be a real coach).
//
// Needs the SERVICE key (anon key can INSERT but not UPDATE under RLS). Get it
// from the Cloudflare Pages env (SUPABASE_SERVICE_KEY) and run:
//
//   SUPABASE_URL=https://dludfgxxjstzpbrrysqp.supabase.co \
//   SUPABASE_SERVICE_KEY=<service key> \
//   node scripts/backfill-bot-views.mjs           # dry run, prints counts
//   ... add  --commit  to actually write.
//
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
const COMMIT = process.argv.includes('--commit');
if (!url || !key) { console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY'); process.exit(1); }
const sb = createClient(url, key);

function botReason(r) {
  const ua = r.user_agent || '';
  if (!ua) return 'ua:empty';
  if (/bot|crawl|spider|slurp|headless|python|curl|wget|axios|go-http|node-fetch/i.test(ua)) return 'ua:token';
  if (/Windows NT 6\.[01]/.test(ua)) return 'ua:win7';
  const cm = ua.match(/Chrome\/(\d+)\./);
  const hiChrome = cm && parseInt(cm[1], 10) >= 141;
  if (!r.city && hiChrome) return 'nogeo+spoofchrome'; // flood signature
  return null; // real geo → preserved as human
}

const all = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from('profile_views').select('id,user_agent,is_bot,city').range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  all.push(...data);
  if (data.length < 1000) break;
}
const toFlag = all.filter((r) => !r.is_bot && botReason(r));
const byReason = {};
for (const r of toFlag) { const w = botReason(r); byReason[w] = (byReason[w] || 0) + 1; }
console.log(`total=${all.length}  alreadyBot=${all.filter(r=>r.is_bot).length}  toFlag=${toFlag.length}`);
console.log('by reason:', byReason);
console.log(`preserved as human: ${all.length - all.filter(r=>r.is_bot).length - toFlag.length}`);

if (!COMMIT) { console.log('\nDRY RUN — re-run with --commit to write.'); process.exit(0); }

let done = 0;
const ids = toFlag.map((r) => r.id);
for (let i = 0; i < ids.length; i += 200) {
  const { error } = await sb.from('profile_views').update({ is_bot: true }).in('id', ids.slice(i, i + 200));
  if (error) { console.error('write error:', error.message); break; }
  done += Math.min(200, ids.length - i);
}
console.log(`flagged is_bot=true: ${done}`);
