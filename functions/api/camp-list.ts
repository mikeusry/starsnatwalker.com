// Cloudflare Pages Function — read side of the camp tracker for /admin/camps.
//
// Returns every logged camp plus the full roster, so the coach view can show
// BOTH who is going where AND who has reported nothing. The blanks are the
// point: "we can't even send a message if we don't know."
//
// Read-only. The service key never reaches the browser — this function is the
// only thing that touches it.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// Mirrors PLAYER_IDS in camp-checkin.ts, inverted. Keep the two in sync.
const ID_TO_NAME: Record<string, string> = {
  '6a1cfd10-1f6a-4a6e-87dd-779fede79f36': 'Baylee Giese Edney',
  'f283f6e0-53bd-4f94-b2f8-a333f16c556a': 'Maddie Diaz',
  '7ea706e2-37be-44bd-8155-fd9b58ab21f7': 'Kelsey Fliss',
  '06218f21-1a8c-4a57-9700-a8e6ff3cf775': 'Keira Frazier',
  '0533eba8-cf63-40a8-8a9f-7d9191799522': 'Avery Jones',
  '0bbe1bfb-bdfa-4496-9cad-d52fcd297601': 'Kendall LaManche',
  'a7c04e0c-db7c-4097-bdfe-9165511d081c': 'Charlotte Llaneza',
  'b98b5e83-80b7-4f5b-aa70-41c84335f61b': 'Cara Orlando',
  '48fec156-a722-47d2-9cdb-b182de64836a': 'Sophia Perez',
  '43331d7c-c06d-433f-ac37-e4262b3387c2': 'Lyla Seibert',
  'b3fe1ac9-9a22-4738-ba37-2b36e4a432db': 'Riley Walker',
  'd142c6b0-0c32-4557-bfc5-619095df585b': 'Ayn Parker Usry',
  '5b354126-07b6-467e-b253-ddfb545256e5': 'Kierra Wunderlich',
  '77dfb624-8ce2-4516-a4a1-b4ee7cef6786': 'Natalie Ireland Hall',
  'cecb335b-08af-4b50-8a73-8a76976238fc': 'Austyn Kinch',
};

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
