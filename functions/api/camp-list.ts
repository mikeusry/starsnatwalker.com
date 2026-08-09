// Cloudflare Pages Function — read side of the camp tracker for /admin/camps.
//
// Returns every logged camp plus the full roster, so the coach view can show
// BOTH who is going where AND who has reported nothing. The blanks are the
// point: "we can't even send a message if we don't know."
//
// Read-only. The service key never reaches the browser — this function is the
// only thing that touches it.

import playersData from '../../src/data/players.json';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// Derived from players.json — the single roster source of truth. This used to
// be a hand-maintained mirror of PLAYER_IDS in camp-checkin.ts, and it drifted:
// Sara Utrera and Elise Barbour were added there but not here, so their rows
// rendered as "Unknown player" in the coach view even though they had written
// correctly. Every players.json id is a real program-match UUID as of 3fd816f,
// so deriving is now safe. Do not reintroduce a literal map.
const ID_TO_NAME: Record<string, string> = Object.fromEntries(
  (playersData as any[]).map((p) => [
    p.id,
    `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
  ])
);

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  try {
    const url =
      `${env.SUPABASE_URL}/rest/v1/player_camps` +
      `?select=id,player_id,camp_name,camp_date,status,notes,logged_by,created_at` +
      `&order=camp_date.asc.nullslast`;

    const res = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    });

    if (!res.ok) {
      console.error('camp-list supabase error:', res.status, await res.text());
      return new Response(JSON.stringify({ error: 'Could not load camps.' }), {
        status: 502,
        headers,
      });
    }

    const rows = (await res.json()) as Array<Record<string, unknown>>;

    const camps = rows.map((r) => ({
      id: r.id,
      playerId: r.player_id,
      playerName: ID_TO_NAME[r.player_id as string] || 'Unknown player',
      campName: r.camp_name,
      campDate: r.camp_date,
      status: r.status,
      notes: r.notes,
      loggedBy: r.logged_by || 'mike',
      createdAt: r.created_at,
    }));

    // Full roster so the UI can show who has reported nothing.
    const roster = Object.entries(ID_TO_NAME)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return new Response(JSON.stringify({ camps, roster }), { status: 200, headers });
  } catch (err) {
    console.error('camp-list error:', err);
    return new Response(JSON.stringify({ error: 'Could not load camps.' }), {
      status: 500,
      headers,
    });
  }
};
