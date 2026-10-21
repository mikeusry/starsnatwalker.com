// Family roster contacts. Contacts and password live in Cloudflare Pages secrets
// (FAMILY_CONTACTS as JSON, FAMILY_PASS) — this GitHub repo is public.
// Requires the family password header so /api/family-roster is not a public dump.
// Roster membership comes from players.json; contacts attach by name.

import players from '../../src/data/players.json';
import { buildFamilyRoster } from '../../src/lib/family-roster';

interface Env { FAMILY_PASS?: string; FAMILY_CONTACTS?: string }

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'private, no-store',
  'Access-Control-Allow-Origin': 'https://starsnatwalker.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-family-pass',
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const expected = (env.FAMILY_PASS || '').trim().toLowerCase();
  const pass = (request.headers.get('x-family-pass') || '').trim().toLowerCase();
  if (!expected || pass !== expected) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }

  let contacts: unknown = [];
  try { contacts = JSON.parse(env.FAMILY_CONTACTS || '[]'); } catch { contacts = []; }
  const roster = buildFamilyRoster(
    players,
    Array.isArray(contacts) ? contacts : [],
  );
  return new Response(JSON.stringify({ roster }), { status: 200, headers });
};
