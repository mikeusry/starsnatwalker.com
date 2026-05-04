// Receives pre-camp homework from /family/. Stores in Supabase + emails Mike.
// No session auth — gated only by the shared family password on the page.
// Light spam protection: rate-limit by IP, require player_slug + from_email.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SENDGRID_API_KEY: string;
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const FROM_EMAIL = 'mike@southlandorganics.com';
const FROM_NAME = 'Stars National Walker';
const TO_EMAIL = 'mike@southlandorganics.com';

async function sb(env: Env, path: string, init: RequestInit = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

function escapeHtml(s: string) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body: any = await request.json().catch(() => ({}));
  const playerSlug = (body.player_slug || '').toString().trim();
  const playerName = (body.player_name || '').toString().trim();
  const fromEmail = (body.from_email || '').toString().toLowerCase().trim();
  const fromName = (body.from_name || '').toString().trim();

  if (!playerSlug || !fromEmail || !fromEmail.includes('@')) {
    return new Response(JSON.stringify({ error: 'player + email required' }), { status: 400, headers });
  }

  // Store
  await sb(env, 'family_homework', {
    method: 'POST',
    body: JSON.stringify({
      site: 'starsnatwalker',
      email: fromEmail,
      player_slug: playerSlug,
      player_name: playerName || null,
      schools: body.schools || null,
      last_camp: body.last_camp || null,
      last_video: body.last_video || null,
      coach_outreach: body.coach_outreach || null,
      honest_sentence: body.honest_sentence || null,
      teammate_role: body.teammate_role || null,
    }),
  });

  // Email Mike
  const subject = `Camp homework — ${playerName || playerSlug}`;
  const html = `
    <h2>Pre-camp homework — ${escapeHtml(playerName || playerSlug)}</h2>
    <p><strong>From:</strong> ${escapeHtml(fromName)} &lt;${escapeHtml(fromEmail)}&gt;</p>
    <h3>1. Top 10 schools</h3><pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(body.schools || '')}</pre>
    <h3>2. Last camp</h3><p>${escapeHtml(body.last_camp || '')}</p>
    <h3>3. Last video</h3><p>${escapeHtml(body.last_video || '')}</p>
    <h3>4. Coach outreach (last 30 days)</h3><pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(body.coach_outreach || '')}</pre>
    <h3>5. Honest sentence</h3><p>${escapeHtml(body.honest_sentence || '')}</p>
    <h3>6. What teammates rely on her for</h3><p>${escapeHtml(body.teammate_role || '')}</p>
  `;
  const text = `Pre-camp homework — ${playerName || playerSlug}
From: ${fromName} <${fromEmail}>

1. Top 10 schools:
${body.schools || ''}

2. Last camp:
${body.last_camp || ''}

3. Last video:
${body.last_video || ''}

4. Coach outreach (last 30 days):
${body.coach_outreach || ''}

5. Honest sentence:
${body.honest_sentence || ''}

6. What teammates rely on her for:
${body.teammate_role || ''}
`;

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: TO_EMAIL, name: 'Mike Usry' }],
        subject,
      }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      reply_to: { email: fromEmail, name: fromName || playerName },
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers });
