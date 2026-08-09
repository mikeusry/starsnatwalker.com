// Cloudflare Pages Function — handles the /camps family camp check-in form.
//
// Families tell us which camps a player is attending. Writes to the existing
// program-match `player_camps` table so a submission lands where the CRM's
// thank-you tracking and coach outreach already live — not in a side list.
//
// WHY name-based player resolution instead of the id in players.json: ids
// there were historically a mix of real Supabase UUIDs and synthetic
// placeholders (e.g. "...-baygiese000001"), and trusting a synthetic one would
// write orphan rows that never surface in the coach view. All 17 SNW ids are
// real UUIDs as of 2026-08-08, but name resolution is kept because it fails
// LOUDLY (400) on an unknown player rather than writing an orphan.
//
// Regenerate this map if a player is added/removed. Cross-check against
// program-match `player_profiles` — SNW roster and player_profiles disagree
// (SNW has 17, player_profiles has 18 — Isabel Findlay is the only one off the
// SNW roster but still active in program-match. Verified 2026-08-08).

import playersData from '../../src/data/players.json';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SENDGRID_API_KEY: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

// name (normalized) -> program-match player_profiles.id, derived from
// players.json so adding a player to the roster is the ONLY edit required.
// This was a hand-maintained literal and it drifted twice in one day: a player
// restored to players.json appeared in the dropdown but was rejected on submit,
// and camp-list.ts's inverse map fell out of sync and showed "Unknown player".
// Do not reintroduce a literal map.
const PLAYER_IDS: Record<string, string> = Object.fromEntries(
  (playersData as any[]).map((p) => [
    norm(`${p.firstName ?? ''} ${p.lastName ?? ''}`),
    p.id,
  ])
);

const VALID_STATUS = ['considering', 'registered', 'attending', 'attended'];

// player_camps.program_id is NOT NULL and FKs to programs(id). A family typing
// a camp name gives us no program, so unmatched entries are parked against this
// placeholder program row and the real name is kept in camp_name. Mike
// reassigns from the CRM. See ensure-unassigned-program.cjs.
const UNASSIGNED_PROGRAM_ID = '00000000-0000-0000-0000-0000000000ff';

interface CampCheckin {
  playerName?: string;
  campName?: string;
  campDate?: string;
  status?: string;
  notes?: string;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const data: CampCheckin = await request.json();

    const playerName = (data.playerName || '').trim();
    const campName = (data.campName || '').trim();

    if (!playerName || !campName) {
      return json({ error: 'Please choose a player and enter a camp.' }, 400);
    }

    const playerId = PLAYER_IDS[norm(playerName)];
    if (!playerId) {
      // Loud failure: better a visible error than a row nobody can see.
      console.error('camp-checkin: unresolved player name:', playerName);
      return json(
        { error: `Could not match player "${playerName}". Please tell Mike.` },
        400
      );
    }

    const status =
      data.status && VALID_STATUS.includes(data.status) ? data.status : 'registered';

    // camp_date is a DATE column, and the table's camp_reference_check requires
    // (camp_name AND camp_date) whenever camp_id is null — which is always for
    // a free-text family entry. So the date is REQUIRED here, not optional.
    if (!data.campDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.campDate)) {
      return json({ error: 'Please pick the camp date.' }, 400);
    }
    const campDate = data.campDate;

    // logged_by is a UUID FK to app_users — it cannot carry a "family" label.
    // Origin is marked in the notes instead, which is what Mike actually reads.
    const notes = ['[family submission]', (data.notes || '').trim()]
      .filter(Boolean)
      .join('\n');

    const payload: Record<string, unknown> = {
      player_id: playerId,
      program_id: UNASSIGNED_PROGRAM_ID,
      camp_name: campName,
      camp_date: campDate,
      status,
      notes,
    };
    if (status === 'registered') payload.registered_at = new Date().toISOString();
    if (status === 'attended') payload.attended_at = campDate;

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/player_camps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('camp-checkin supabase error:', res.status, detail);
      // 23505 = unique violation: this player already logged this camp/date.
      if (detail.includes('23505')) {
        return json(
          { error: 'That camp is already on the list for this player.' },
          409
        );
      }
      // Unlike the tryout form, a failed write is surfaced, not swallowed —
      // a silent success here means a camp nobody knows about.
      return json({ error: 'Could not save. Please tell Mike.' }, 502);
    }

    return json({ success: true }, 200);
  } catch (err) {
    console.error('camp-checkin error:', err);
    return json({ error: 'Something went wrong. Please tell Mike.' }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
