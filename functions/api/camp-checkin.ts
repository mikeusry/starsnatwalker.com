// Cloudflare Pages Function — handles the /camps family camp check-in form.
//
// Families tell us which camps a player is attending. Writes to the existing
// program-match `player_camps` table so a submission lands where the CRM's
// thank-you tracking and coach outreach already live — not in a side list.
//
// WHY name-based player resolution instead of the id in players.json:
// only 11 of 15 ids in src/data/players.json are real Supabase UUIDs; the
// other 4 are synthetic placeholders (e.g. "...-baygiese000001"). Trusting
// them would write orphan rows that never surface in the coach view. The
// roster is small and stable, so the mapping is pinned here explicitly and a
// name that does not resolve fails LOUDLY (400) rather than writing an orphan.
//
// Regenerate this map if a player is added/removed. Cross-check against
// program-match `player_profiles` — SNW roster and player_profiles disagree
// (SNW has 15, player_profiles has 17: Isabel Findlay and Sara Utrera are off
// the SNW roster as of commit 4299d2c but still active in program-match).

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SENDGRID_API_KEY: string;
}

// name (normalized) -> program-match player_profiles.id
const PLAYER_IDS: Record<string, string> = {
  bayleegieseedney: '6a1cfd10-1f6a-4a6e-87dd-779fede79f36',
  maddiediaz: 'f283f6e0-53bd-4f94-b2f8-a333f16c556a',
  kelseyfliss: '7ea706e2-37be-44bd-8155-fd9b58ab21f7',
  keirafrazier: '06218f21-1a8c-4a57-9700-a8e6ff3cf775',
  averyjones: '0533eba8-cf63-40a8-8a9f-7d9191799522',
  kendalllamanche: '0bbe1bfb-bdfa-4496-9cad-d52fcd297601',
  charlottellaneza: 'a7c04e0c-db7c-4097-bdfe-9165511d081c',
  caraorlando: 'b98b5e83-80b7-4f5b-aa70-41c84335f61b',
  sophiaperez: '48fec156-a722-47d2-9cdb-b182de64836a',
  lylaseibert: '43331d7c-c06d-433f-ac37-e4262b3387c2',
  rileywalker: 'b3fe1ac9-9a22-4738-ba37-2b36e4a432db',
  aynparkerusry: 'd142c6b0-0c32-4557-bfc5-619095df585b',
  kierrawunderlich: '5b354126-07b6-467e-b253-ddfb545256e5',
  natalieirelandhall: '77dfb624-8ce2-4516-a4a1-b4ee7cef6786',
  austynkinch: 'cecb335b-08af-4b50-8a73-8a76976238fc',
};

const VALID_STATUS = ['considering', 'registered', 'attending', 'attended'];

// player_camps.program_id is NOT NULL and FKs to programs(id). A family typing
// a camp name gives us no program, so unmatched entries are parked against this
// placeholder program row and the real name is kept in camp_name. Mike
// reassigns from the CRM. See ensure-unassigned-program.cjs.
const UNASSIGNED_PROGRAM_ID = '00000000-0000-0000-0000-0000000000ff';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

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
