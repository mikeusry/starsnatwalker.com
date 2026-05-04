// Family bridge: Stars /family/ portal -> program-match /recruiting
//
// Flow:
// 1. User picks a player on Stars /family/ (gated by shared family password)
// 2. POST /api/family-bridge?player_slug=lyla-seibert
// 3. We look up the player's email from player_profiles in Supabase
// 4. Call Supabase Admin API to generate a magic-link URL (no email sent)
// 5. 302 redirect the user directly to that magic-link URL
// 6. Magic link consumes the code at program-match /auth/callback,
//    exchanges for a session, lands user on /recruiting
//
// No email round-trip. The token never touches Outlook.
// Trust model: anyone with the family password can pick any player. Same as today.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

const PROGRAM_MATCH_URL = "https://program-match.vercel.app";
const DEFAULT_NEXT_PATH = "/recruiting";

async function sb(env: Env, path: string, init: RequestInit = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findPlayerByslug(env: Env, slug: string) {
  // player_profiles doesn't store slugs — derive from first/last
  const res = await sb(
    env,
    `player_profiles?travel_org_name=eq.Stars%20National%20Walker&select=id,first_name,last_name,player_email,family_id`,
  );
  const players = (await res.json()) as any[];
  if (!Array.isArray(players)) return null;
  const match = players.find(
    (p) => slugify(`${p.first_name}-${p.last_name}`) === slug,
  );
  return match || null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const playerSlug = url.searchParams.get("player_slug");
  const next = url.searchParams.get("next") || DEFAULT_NEXT_PATH;

  if (!playerSlug) {
    return new Response("missing player_slug", { status: 400 });
  }

  const player = await findPlayerByslug(env, playerSlug);
  if (!player) {
    return new Response(`player not found: ${playerSlug}`, { status: 404 });
  }
  if (!player.player_email) {
    return new Response(`player has no email on file: ${playerSlug}`, {
      status: 400,
    });
  }

  // Step 1: ensure auth.users exists for this email. If we generate a magiclink
  // for a non-existent user, Supabase returns a signup-flow link (implicit
  // grant, fragment-based) instead of a true magiclink (PKCE code exchange).
  // Pre-creating the user with email_confirm: true forces magiclink behavior.
  const ensureRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: player.player_email,
      email_confirm: true,
      user_metadata: {
        first_name: player.first_name,
        last_name: player.last_name,
      },
    }),
  });
  // 422 = already exists (fine). Other failures we log but try anyway.
  if (!ensureRes.ok && ensureRes.status !== 422) {
    const errBody = await ensureRes.text();
    console.warn("admin/users create failed (may already exist):", ensureRes.status, errBody);
  }

  // Step 2: generate the magic-link URL.
  // We pass the bare program-match origin as redirect_to (Supabase requires it
  // to match site_url or uri_allow_list exactly). The auth/callback route on
  // program-match will receive ?code=... and redirect onward to /recruiting.
  const callbackUrl = `${PROGRAM_MATCH_URL}/auth/callback?next=${encodeURIComponent(next)}`;
  const adminRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "magiclink",
      email: player.player_email,
      options: {
        redirect_to: callbackUrl,
      },
    }),
  });

  if (!adminRes.ok) {
    const errBody = await adminRes.text();
    console.error("generate_link failed:", adminRes.status, errBody);
    return new Response(`auth setup failed: ${adminRes.status}`, {
      status: 500,
    });
  }

  const linkData = (await adminRes.json()) as any;
  // Response shape (top-level): { action_link, hashed_token, redirect_to,
  // verification_type, ... }. We use hashed_token (server-side verifyOtp on
  // program-match) instead of action_link (which goes through Supabase's
  // verify endpoint and triggers implicit-flow fragment redirects).
  const tokenHash: string | undefined = linkData.hashed_token;

  if (!tokenHash) {
    console.error("generate_link returned no hashed_token:", linkData);
    return new Response("auth response missing hashed_token", { status: 500 });
  }

  // Redirect to program-match's /auth/confirm route with the token_hash. That
  // route calls supabase.auth.verifyOtp server-side, which sets SSR cookies +
  // redirects to `next`. Pure code-flow, no fragment shenanigans.
  const confirmUrl =
    `${PROGRAM_MATCH_URL}/auth/confirm` +
    `?token_hash=${encodeURIComponent(tokenHash)}` +
    `&type=magiclink` +
    `&next=${encodeURIComponent(next)}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: confirmUrl,
      "Cache-Control": "no-store",
    },
  });
};
