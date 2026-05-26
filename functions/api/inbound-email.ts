// SendGrid Inbound Parse webhook. Handles TWO recipient patterns:
//
// 1. REPLIES — t-{reply_token}@recruiting.starsnatwalker.com
//    Coach replies to an outreach email. We match the thread by token, log the
//    inbound message, pause cadence, and forward a copy to Mike.
//
// 2. CC-LOGGING — log@recruiting.starsnatwalker.com
//    A Stars PLAYER emails a college coach directly and CCs log@. We identify
//    the player by her From address (player_profiles.player_email), identify the
//    coach + program by the recipient address (coaches.email -> program_id), and
//    create/append an OUTBOUND thread so the player's self-driven outreach lands
//    in the CRM pipeline. High-confidence path = direct CC (from = known player).
//    If the player can't be matched, we forward to Mike for manual handling.
//
// SendGrid Inbound Parse posts as multipart/form-data with parsed fields:
//   from, to, cc, subject, text, html, headers, envelope, attachments, charsets, ...
// See: https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SENDGRID_API_KEY: string;
  SENDGRID_INBOUND_KEY: string;
}

const FORWARD_TO_EMAIL = 'mike@starsnatwalker.com';
const FORWARD_FROM_EMAIL = 'mike@starsnatwalker.com';
const FORWARD_FROM_NAME = 'Stars Recruiting CRM';

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

// SendGrid's "to" field can include angle-bracket form, comma-separated multiples,
// and display-name prefix: "Stars <t-abc123@recruiting.starsnatwalker.com>, other@x.com"
// We pull the first address whose local-part starts with "t-".
function extractReplyToken(toField: string): string | null {
  if (!toField) return null;
  // Match anything like t-XXXXXXXXXXXX where XXXXXXXXXXXX is the reply_token.
  // program-match generates 12-char hex tokens, but allow any alphanumeric for safety.
  const match = toField.match(/t-([a-z0-9]{6,32})@recruiting\.starsnatwalker\.com/i);
  return match ? match[1] : null;
}

function parseFromAddress(fromField: string): { name: string | null; email: string } {
  // "Coach Smith <coach@university.edu>" or "coach@university.edu"
  const match = fromField.match(/^(?:"?([^"<]+?)"?\s*)?<?([^<>\s]+@[^<>\s]+)>?\s*$/);
  if (match) return { name: (match[1] || '').trim() || null, email: match[2].trim().toLowerCase() };
  return { name: null, email: fromField.trim().toLowerCase() };
}

// The CC-logging address a player puts on her coach emails.
const LOG_ADDRESS_RE = /\blog@recruiting\.starsnatwalker\.com\b/i;

// Pull every bare email address out of a header field that may contain
// display names, angle brackets, and comma-separated multiples.
function extractEmails(field: string): string[] {
  if (!field) return [];
  const matches = field.match(/[^<>\s,]+@[^<>\s,]+/g) || [];
  return matches.map((e) => e.replace(/[>,;]+$/, '').toLowerCase());
}

// 12-char hex reply token, matching program-match's format so coach replies
// to a player-logged thread route back through this same webhook.
function generateReplyToken(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Recipient addresses that are NOT the coach: the log address itself, Mike,
// Joe, and anything on our own domains. Whatever's left is the coach.
function isOurAddress(email: string): boolean {
  return (
    LOG_ADDRESS_RE.test(email) ||
    /@(starsnatwalker\.com|recruiting\.starsnatwalker\.com|southlandorganics\.com)$/i.test(email) ||
    email === 'starsnationalwalker@gmail.com'
  );
}

async function forwardToMike(env: Env, opts: {
  fromName: string | null;
  fromEmail: string;
  subject: string;
  text: string;
  html: string;
  threadInfo: string;
}) {
  const subject = `[Stars CRM Reply] ${opts.subject}`;
  const intro = `<p style="background:#fff8e1;padding:12px;border-left:4px solid #f59e0b;margin-bottom:16px;font-size:13px;color:#444;">
    <strong>Reply received</strong> from <strong>${escapeHtml(opts.fromName || opts.fromEmail)}</strong> &lt;${escapeHtml(opts.fromEmail)}&gt;<br>
    ${escapeHtml(opts.threadInfo)}
  </p>`;
  const html = intro + (opts.html || `<pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(opts.text)}</pre>`);
  const text = `[Stars CRM Reply]\nFrom: ${opts.fromName || opts.fromEmail} <${opts.fromEmail}>\n${opts.threadInfo}\n\n---\n\n${opts.text}`;

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: FORWARD_TO_EMAIL, name: 'Mike Usry' }], subject }],
      from: { email: FORWARD_FROM_EMAIL, name: FORWARD_FROM_NAME },
      reply_to: { email: opts.fromEmail, name: opts.fromName || opts.fromEmail },
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });
}

function escapeHtml(s: string) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
}

// CC-logging handler: a player CC'd log@ on an email to a college coach.
// Match player (by from), coach+program (by recipient), create/append an
// outbound thread, log the message. Always returns 200 (we own failures).
async function handleCcLog(env: Env, msg: {
  to: string; cc: string;
  fromName: string | null; fromEmail: string;
  subject: string; text: string; html: string; messageId: string | null;
}): Promise<Response> {
  const now = new Date().toISOString();

  // 1. Identify the player by her From address.
  const playerRes = await sb(env, `player_profiles?player_email=ilike.${encodeURIComponent(msg.fromEmail)}&select=id,first_name,last_name&limit=1`);
  const players = await playerRes.json();
  const player = Array.isArray(players) && players[0] ? players[0] : null;

  if (!player) {
    // Unknown sender — can't attribute. Forward to Mike to handle manually.
    await forwardToMike(env, {
      fromName: msg.fromName, fromEmail: msg.fromEmail, subject: msg.subject, text: msg.text, html: msg.html,
      threadInfo: `CC-log from unrecognized sender (${msg.fromEmail}). Not matched to a player — log manually if needed.`,
    });
    return new Response('cc-log: unknown player, forwarded', { status: 200 });
  }

  // 2. Find the coach among the recipients (To + Cc, minus our own addresses).
  const recipients = [...extractEmails(msg.to), ...extractEmails(msg.cc)].filter((e) => !isOurAddress(e));
  let coach: any = null;
  let programId: string | null = null;
  for (const addr of recipients) {
    const cRes = await sb(env, `coaches?email=ilike.${encodeURIComponent(addr)}&select=id,first_name,last_name,program_id&limit=1`);
    const cs = await cRes.json();
    if (Array.isArray(cs) && cs[0]) { coach = cs[0]; programId = cs[0].program_id; break; }
  }
  // No known coach? Fall back to domain → program via any coach on that domain.
  if (!coach && recipients.length > 0) {
    const domain = recipients[0].split('@')[1];
    if (domain) {
      const dRes = await sb(env, `coaches?email=ilike.*@${encodeURIComponent(domain)}&select=program_id&limit=1`);
      const ds = await dRes.json();
      if (Array.isArray(ds) && ds[0]) programId = ds[0].program_id;
    }
  }

  const playerName = `${player.first_name} ${player.last_name}`;
  const coachEmail = recipients[0] || '(unknown)';

  // 3. Find an existing outbound thread for this (player, program), else create one.
  let thread: any = null;
  if (programId) {
    const tRes = await sb(env, `outreach_threads?player_id=eq.${player.id}&program_id=eq.${programId}&select=id,send_count,reply_token,status&limit=1`);
    const ts = await tRes.json();
    if (Array.isArray(ts) && ts[0]) thread = ts[0];
  }
  if (!thread) {
    const createRes = await sb(env, 'outreach_threads', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        player_id: player.id,
        program_id: programId,
        primary_coach_id: coach ? coach.id : null,
        reply_token: generateReplyToken(),
        status: 'active',
        thread_type: 'coach',
        subject: msg.subject,
        send_count: 0,
        inbound_count: 0,
      }),
    });
    const created = await createRes.json();
    thread = Array.isArray(created) ? created[0] : created;
  }

  // 4. Log the player's email as an outbound message on the thread.
  await sb(env, 'outreach_messages', {
    method: 'POST',
    body: JSON.stringify({
      thread_id: thread.id,
      direction: 'outbound',
      sent_at: now,
      from_email: msg.fromEmail,
      from_name: msg.fromName || playerName,
      to_emails: extractEmails(msg.to),
      cc_emails: extractEmails(msg.cc),
      subject: msg.subject,
      body_text: msg.text,
      body_html: msg.html,
      sendgrid_message_id: msg.messageId,
      parsed_coach_id: coach ? coach.id : null,
      logged_manually: false,
    }),
  });

  // 5. Bump thread send counter.
  await sb(env, `outreach_threads?id=eq.${thread.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      send_count: (thread.send_count || 0) + 1,
      last_sent_at: now,
      updated_at: now,
    }),
  });

  // 6. Confirm to Mike so he knows it captured.
  const matchNote = programId
    ? `Logged ${playerName} → coach ${coachEmail} (matched to a program).`
    : `Logged ${playerName} → coach ${coachEmail} — but the program/coach is NOT in the CRM yet. Thread created unmatched; assign it in /admin/outreach.`;
  await forwardToMike(env, {
    fromName: msg.fromName, fromEmail: msg.fromEmail, subject: msg.subject, text: msg.text, html: msg.html,
    threadInfo: matchNote,
  });

  return new Response(JSON.stringify({ ok: true, thread_id: thread.id, player: playerName, matched_program: !!programId }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Verify shared key from URL (the only auth SendGrid Inbound Parse provides)
  const url = new URL(request.url);
  if (url.searchParams.get('key') !== env.SENDGRID_INBOUND_KEY) {
    return new Response('unauthorized', { status: 401 });
  }

  // Parse multipart/form-data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error('Failed to parse Inbound Parse form data:', err);
    return new Response('bad request', { status: 400 });
  }

  const to = (formData.get('to') as string) || '';
  const cc = (formData.get('cc') as string) || '';
  const from = (formData.get('from') as string) || '';
  const subject = (formData.get('subject') as string) || '(no subject)';
  const text = (formData.get('text') as string) || '';
  const html = (formData.get('html') as string) || '';
  const messageId = (formData.get('message_id') as string) || null;

  const replyToken = extractReplyToken(to);
  const { name: fromName, email: fromEmail } = parseFromAddress(from);

  // ── CC-LOGGING PATH ──────────────────────────────────────────────────────
  // If log@ appears anywhere in To/Cc and this is NOT a reply (no t- token),
  // treat it as a player logging her own outreach to a coach.
  if (!replyToken && (LOG_ADDRESS_RE.test(to) || LOG_ADDRESS_RE.test(cc))) {
    return handleCcLog(env, { to, cc, fromName, fromEmail, subject, text, html, messageId });
  }

  // No matching token? Log + forward to Mike with a warning, return 200.
  // (Always return 200 to SendGrid so it doesn't retry — we own the failure mode.)
  if (!replyToken) {
    console.warn('Inbound email with no reply token:', { to, from, subject });
    await forwardToMike(env, {
      fromName, fromEmail, subject, text, html,
      threadInfo: `No matching thread token in To: ${to}`,
    });
    return new Response('no token, forwarded', { status: 200 });
  }

  // Find the thread by reply_token
  const threadRes = await sb(env, `outreach_threads?reply_token=eq.${encodeURIComponent(replyToken)}&select=id,player_id,player_slug,program_id,subject,status,inbound_count`);
  const threads = await threadRes.json();
  if (!Array.isArray(threads) || threads.length === 0) {
    console.warn('Inbound reply with unknown reply_token:', replyToken);
    await forwardToMike(env, {
      fromName, fromEmail, subject, text, html,
      threadInfo: `Reply token ${replyToken} did not match any thread.`,
    });
    return new Response('unknown token, forwarded', { status: 200 });
  }

  const thread = threads[0] as any;
  const now = new Date().toISOString();

  // Log inbound message
  await sb(env, 'outreach_messages', {
    method: 'POST',
    body: JSON.stringify({
      thread_id: thread.id,
      direction: 'inbound',
      from_email: fromEmail,
      from_name: fromName,
      to_emails: [to],
      subject,
      body_text: text,
      body_html: html,
      sendgrid_message_id: messageId,
      logged_manually: false,
    }),
  });

  // Update thread: bump inbound count, set last_inbound, transition status, pause cadence
  // (Cadence pause = set status to 'replied'; cadence engine should respect this.)
  await sb(env, `outreach_threads?id=eq.${thread.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      last_inbound_at: now,
      inbound_count: (thread.inbound_count || 0) + 1,
      status: thread.status === 'closed' ? 'closed' : 'replied',
      updated_at: now,
    }),
  });

  // Look up player name for the forwarded notification
  let playerLabel: string = thread.player_slug || 'a player';
  if (thread.player_id) {
    const playerRes = await sb(env, `player_profiles?id=eq.${thread.player_id}&select=first_name,last_name`);
    const players = await playerRes.json();
    if (Array.isArray(players) && players[0]) {
      playerLabel = `${players[0].first_name} ${players[0].last_name}`;
    }
  }

  // Forward a copy to Mike (so he reads it in Gmail like normal)
  await forwardToMike(env, {
    fromName, fromEmail, subject, text, html,
    threadInfo: `Thread for ${playerLabel} — reply logged in CRM. Cadence paused.`,
  });

  return new Response(JSON.stringify({ ok: true, thread_id: thread.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// SendGrid sometimes hits the URL with HEAD or OPTIONS during setup verification.
export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method === 'POST') return new Response('use onRequestPost', { status: 500 });
  return new Response('inbound-email endpoint OK', { status: 200 });
};
