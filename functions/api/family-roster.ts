// Family roster contacts. The JSON is gitignored — this GitHub repo is public.
// Requires the family password header so /api/family-roster is not a public dump.
// Roster membership comes from players.json; contacts attach by name.

import contacts from './_family-contacts.json';
import players from '../../src/data/players.json';
import { buildFamilyRoster } from '../../src/lib/family-roster';

const FAMILY_PASS = 'starsfamily';

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'private, no-store',
  'Access-Control-Allow-Origin': 'https://starsnatwalker.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-family-pass',
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const pass = (request.headers.get('x-family-pass') || '').trim().toLowerCase();
  if (pass !== FAMILY_PASS) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }

  const roster = buildFamilyRoster(
    players,
    Array.isArray(contacts) ? contacts : [],
  );
  return new Response(JSON.stringify({ roster }), { status: 200, headers });
};
