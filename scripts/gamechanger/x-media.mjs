// List photo or video-preview media from players' X timelines (own posts + RTs)
// via twitterapi.io. Used to find EIS action photos and the team's posted
// tournament schedule graphics.
//
//   TWITTERAPI_IO_KEY=... node scripts/gamechanger/x-media.mjs [--video] <handle> ... > media.json
//
// The key lives in ~/CODING/program-match/.env (TWITTERAPI_IO_KEY), so from
// program-match: node --env-file=.env ../starsnatwalker.com/scripts/gamechanger/x-media.mjs ...
// Append ?name=large to a pbs.twimg.com media URL for full size.

const KEY = process.env.TWITTERAPI_IO_KEY;
if (!KEY) throw new Error('TWITTERAPI_IO_KEY not set');

const args = process.argv.slice(2);
const video = args.includes('--video');
const handles = args.filter((a) => a !== '--video');
const wanted = video ? new Set(['video', 'animated_gif']) : new Set(['photo']);

const out = {};
for (const h of handles) {
  out[h] = [];
  let cursor = '';
  for (let page = 0; page < 6; page++) {
    const r = await fetch(`https://api.twitterapi.io/twitter/user/last_tweets?userName=${h}&includeReplies=false${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { headers: { 'X-API-Key': KEY } });
    const j = await r.json();
    const tweets = j.data?.tweets || j.tweets || [];
    for (const t of tweets) {
      const media = t.extendedEntities?.media || t.extended_entities?.media || [];
      for (const m of media) {
        if (!wanted.has(m.type)) continue;
        out[h].push({
          id: t.id,
          date: t.createdAt,
          rt: !!t.retweeted_tweet,
          author: t.author?.userName,
          text: (t.text || '').slice(0, 140).replace(/\s+/g, ' '),
          url: m.media_url_https,
          w: m.original_info?.width,
          h: m.original_info?.height,
        });
      }
    }
    if (!(j.has_next_page ?? j.data?.has_next_page) || !(cursor = j.next_cursor || j.data?.next_cursor)) break;
  }
  console.error(h, out[h].length);
}
console.log(JSON.stringify(out, null, 1));
