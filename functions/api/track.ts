// Cloudflare Pages Function — server-side pixel ingest for profile_views.
//
// WHY THIS EXISTS: the old pixel POSTed straight from the browser to Supabase
// REST with the anon key and a CLIENT-COMPUTED is_bot flag. That is trivially
// bypassed — a headless crawler reports a normal Chrome UA, the weak
// /bot|crawl/ regex misses it, and it writes is_bot:false at will. On
// 2026-06-17 a single crawler flooded 863 fake "views" across 3 player pages in
// ~75 min, inflating site traffic from a real ~26 to a fake 872.
//
// This endpoint moves bot scoring SERVER-SIDE where the client can't override
// it, using Cloudflare's own bot intelligence (request.cf.botManagement) plus
// the real client IP and heuristics the flood actually exhibited (spoofed
// Chrome build numbers, Windows 7, datacenter ASNs, missing geo). The browser
// can no longer assert is_bot — we decide it here and write with the service key.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface TrackPayload {
  site: string;
  player_slug: string;
  player_name?: string | null;
  page_path?: string | null;
  referrer?: string | null;
  user_agent?: string | null; // ignored for trust; we use the real request UA
  session_id?: string | null;
  event_type?: string | null;
  event_data?: Record<string, unknown> | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
}

// Heuristic bot scoring. Returns { isBot, reason } — server-authoritative.
function scoreBot(request: Request, body: TrackPayload): { isBot: boolean; reason: string } {
  const ua = request.headers.get('user-agent') || '';
  const cf = (request as unknown as { cf?: Record<string, any> }).cf || {};

  // 1) Cloudflare Bot Management verdict (most reliable; present on CF).
  const bm = cf.botManagement || {};
  if (bm.verifiedBot === true) return { isBot: true, reason: 'cf:verifiedBot' };
  if (typeof bm.score === 'number' && bm.score <= 30) return { isBot: true, reason: `cf:score=${bm.score}` };

  // 2) Obvious UA tokens (kept from the old filter; cheap).
  if (/bot|crawl|spider|slurp|bingpreview|facebookexternalhit|mediapartners|headless|python-requests|axios|curl|wget|go-http|node-fetch/i.test(ua)) {
    return { isBot: true, reason: 'ua:token' };
  }
  if (!ua) return { isBot: true, reason: 'ua:empty' };

  // 3) Spoofed / implausible Chrome build numbers. Real Chrome majors track ~stable
  //    releases; the flood used fabricated builds (e.g. 142.0.7444.175, 141.0.7390.0).
  //    Flag Chrome majors far above the current real channel as fabricated.
  const chrome = ua.match(/Chrome\/(\d+)\./);
  if (chrome) {
    const major = parseInt(chrome[1], 10);
    // Current real Chrome stable as of this writing is ~13x. Anything >= 141 with a
    // desktop UA and no CF score is almost certainly a fabricated crawler UA.
    if (major >= 141) return { isBot: true, reason: `ua:chrome_major=${major}` };
  }

  // 4) End-of-life desktop OS strongly correlates with crawler UAs (Win7 = NT 6.1).
  if (/Windows NT 6\.[01]/.test(ua)) return { isBot: true, reason: 'ua:win7' };

  // 5) Datacenter / hosting ASN = not a coach on a campus/home network.
  const asOrg = (cf.asOrganization || '').toLowerCase();
  if (/amazon|aws|google cloud|microsoft|azure|digitalocean|linode|hetzner|ovh|vultr|datacamp|cloudflare/.test(asOrg)) {
    return { isBot: true, reason: `asn:${asOrg}` };
  }

  return { isBot: false, reason: 'human' };
}

function extractDomain(referrer?: string | null): string | null {
  if (!referrer || referrer === 'direct') return null;
  try { return new URL(referrer).hostname.replace(/^www\./, ''); } catch { return null; }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: CORS });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  try {
    const body = (await request.json()) as TrackPayload;
    if (!body || !body.site || !body.player_slug) {
      return new Response(JSON.stringify({ error: 'site and player_slug required' }), { status: 400, headers: CORS });
    }

    const { isBot, reason } = scoreBot(request, body);
    const cf = (request as unknown as { cf?: Record<string, any> }).cf || {};

    // Trust server-derived geo (CF) over the client's ipapi.co guess when present.
    const row = {
      site: body.site,
      player_slug: body.player_slug,
      player_name: body.player_name ?? null,
      page_path: body.page_path ?? null,
      referrer: body.referrer ?? null,
      referrer_domain: extractDomain(body.referrer),
      user_agent: request.headers.get('user-agent') || body.user_agent || null,
      country: cf.country || body.country || null,
      region: cf.region || body.region || null,
      city: cf.city || body.city || null,
      session_id: body.session_id ?? null,
      is_bot: isBot,                                  // SERVER-AUTHORITATIVE
      event_type: body.event_type || 'page_view',
      event_data: { ...(body.event_data || {}), _bot_reason: reason },
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/profile_views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'store failed', detail: await res.text() }), { status: 502, headers: CORS });
    }
    // Echo the verdict so we can debug from the browser if needed.
    return new Response(JSON.stringify({ ok: true, is_bot: isBot }), { status: 200, headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'error' }), { status: 500, headers: CORS });
  }
};
