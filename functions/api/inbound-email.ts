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

// SendGrid Inbound Parse sends an `envelope` JSON field with the ACTUAL SMTP
// recipients: {"to":["a@x.com","log@..."],"from":"sender@y.com"}. This is the
// ONLY place a BCC'd address shows up — the visible `to`/`cc` header fields do
// NOT include BCC. Players naturally BCC log@ (so coaches don't see the tracking
// address), so we MUST look here or every BCC'd email falls through unlogged.
function parseEnvelopeRecipients(envelopeField: string): string[] {
  if (!envelopeField) return [];
  try {
    const env = JSON.parse(envelopeField);
    const tos = Array.isArray(env?.to) ? env.to : env?.to ? [env.to] : [];
    return tos.map((e: string) => String(e).trim().toLowerCase()).filter(Boolean);
  } catch {
    // Fallback: scrape any addresses out of the raw string.
    return extractEmails(envelopeField);
  }
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

// When Mike FORWARDS a player's recruiting email to log@ (instead of the player
// CC'ing log@ at send time), the envelope From is Mike, not the player, and the
// real To/Cc are gone from the envelope. But the forwarded body carries the
// original headers ("From: Riley Walker <...>", "To: coach@...", "Cc: ..."). This
// scans the body to recover them so forwarded emails attribute correctly.
function parseForwardedHeaders(body: string): {
  fromEmail: string | null;
  fromName: string | null;
  recipients: string[];
} {
  const out = { fromEmail: null as string | null, fromName: null as string | null, recipients: [] as string[] };
  if (!body) return out;
  // Only look at the top chunk where forwarded headers live.
  const head = body.slice(0, 4000);

  const fromLine = head.match(/^\s*From:\s*(.+)$/im);
  if (fromLine) {
    const parsed = parseFromAddress(fromLine[1].trim());
    out.fromEmail = parsed.email || null;
    out.fromName = parsed.name;
  }
  const toLine = head.match(/^\s*To:\s*(.+)$/im);
  const ccLine = head.match(/^\s*Cc:\s*(.+)$/im);
  out.recipients = [
    ...(toLine ? extractEmails(toLine[1]) : []),
    ...(ccLine ? extractEmails(ccLine[1]) : []),
  ];
  return out;
}

// CC-logging handler: a player CC'd log@ on an email to a college coach (or Mike
// forwarded it to log@). Match player (by from, or forwarded-from), coach+program
// (by recipient, or forwarded-recipients), create/append an outbound thread, log
// the message. Always returns 200 (we own failures).
async function handleCcLog(env: Env, msg: {
  to: string; cc: string;
  fromName: string | null; fromEmail: string;
  subject: string; text: string; html: string; messageId: string | null;
  envelopeRecipients?: string[];
}): Promise<Response> {
  const now = new Date().toISOString();

  // 1. Identify the player by the envelope From address.
  let actualFromEmail = msg.fromEmail;
  let actualFromName = msg.fromName;
  let playerRes = await sb(env, `player_profiles?player_email=ilike.${encodeURIComponent(msg.fromEmail)}&select=id,slug,first_name,last_name&limit=1`);
  let players = await playerRes.json();
  let player = Array.isArray(players) && players[0] ? players[0] : null;

  // 1b. Fallback: this looks like a FORWARD. Parse the original sender out of the
  // body and retry. This makes Mike-forwards-to-log@ work the same as a direct CC.
  const fwd = parseForwardedHeaders(msg.text || msg.html);
  if (!player && fwd.fromEmail) {
    actualFromEmail = fwd.fromEmail;
    actualFromName = fwd.fromName;
    playerRes = await sb(env, `player_profiles?player_email=ilike.${encodeURIComponent(fwd.fromEmail)}&select=id,slug,first_name,last_name&limit=1`);
    players = await playerRes.json();
    player = Array.isArray(players) && players[0] ? players[0] : null;
  }

  if (!player) {
    // Unknown sender even after forward-parsing — can't attribute.
    await forwardToMike(env, {
      fromName: msg.fromName, fromEmail: msg.fromEmail, subject: msg.subject, text: msg.text, html: msg.html,
      threadInfo: `CC-log from unrecognized sender (${msg.fromEmail}${fwd.fromEmail ? `, forwarded-from ${fwd.fromEmail}` : ''}). Not matched to a player — log manually if needed.`,
    });
    return new Response('cc-log: unknown player, forwarded', { status: 200 });
  }

  // 2. Find the coach among recipients. Combine visible To/Cc with the SMTP
  // envelope recipients (which include addresses when log@ was BCC'd — the coach
  // is in the envelope too). Strip our own addresses (log@, Mike, Joe, domains).
  // If nothing's left (true for forwards), fall back to recipients parsed from
  // the forwarded body.
  let recipients = [
    ...extractEmails(msg.to),
    ...extractEmails(msg.cc),
    ...(msg.envelopeRecipients || []),
  ].filter((e) => !isOurAddress(e));
  recipients = Array.from(new Set(recipients)); // dedupe (coach may be in both)
  if (recipients.length === 0 && fwd.recipients.length > 0) {
    recipients = fwd.recipients.filter((e) => !isOurAddress(e));
  }
  // Match the coach by EXACT email across all recipients. A player emails a list,
  // so prefer a recipient that's a known coach; remember which address we matched.
  let coach: any = null;
  let programId: string | null = null;
  let matchedCoachEmail: string | null = null;
  for (const addr of recipients) {
    const cRes = await sb(env, `coaches?email=ilike.${encodeURIComponent(addr)}&select=id,first_name,last_name,program_id&limit=1`);
    const cs = await cRes.json();
    if (Array.isArray(cs) && cs[0]) { coach = cs[0]; programId = cs[0].program_id; matchedCoachEmail = addr; break; }
  }

  // No exact coach match. Try domain → program (any coach on that domain shares
  // the school), and — crucially — AUTO-CREATE the coach from the recipient
  // address so attribution is real and the next email matches cleanly. Without
  // this, every coach not yet in the CRM logged as "matched to a program" with a
  // NULL coach, which read as a phantom match. We now create the row instead.
  let coachCreated = false;
  if (!coach && recipients.length > 0) {
    // Use the first NON-our recipient as the coach we're attributing to.
    const coachAddr = recipients[0];
    const domain = coachAddr.split('@')[1];
    if (domain) {
      const dRes = await sb(env, `coaches?email=ilike.*@${encodeURIComponent(domain)}&select=program_id&limit=1`);
      const ds = await dRes.json();
      if (Array.isArray(ds) && ds[0]) programId = ds[0].program_id;
    }
    // If we resolved a program from the domain, create the coach on it so the
    // thread attributes to a real person (name parsed from the local-part).
    if (programId) {
      const local = coachAddr.split('@')[0];
      const guessName = local.replace(/[._\d]+/g, ' ').trim();
      const parts = guessName ? guessName.split(' ').filter(Boolean) : [];
      // coaches.first_name/last_name are NOT NULL. Many addresses (rzf0046@,
      // cpatterson1025@) yield no real name — fall back so the insert never
      // violates the constraint. last_name defaults to "(unverified)" so it's
      // obviously a stub to clean up; first_name to the local-part.
      const first = parts[0] || local;
      const last = parts.length > 1 ? parts.slice(1).join(' ') : '(unverified)';
      const createCoach = await sb(env, 'coaches', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          program_id: programId,
          email: coachAddr,
          first_name: first,
          last_name: last,
          position: 'Coach',
          is_active: true,
          source: 'player_email_autocreate',
        }),
      });
      const createdCoach = await createCoach.json();
      coach = Array.isArray(createdCoach) ? createdCoach[0] : createdCoach;
      if (coach?.id) { matchedCoachEmail = coachAddr; coachCreated = true; }
    }
  }

  const playerName = `${player.first_name} ${player.last_name}`;
  const coachEmail = matchedCoachEmail || recipients[0] || '(unknown)';

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
        player_slug: player.slug,
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

  // 3b. Auto-add this school to the player's target list. The model is
  // "build her list from who she emails" — so emailing a coach surfaces the
  // school on her Target Schools list (tier=target, status=contacted). Upsert:
  // skip if a non-removed row already exists for this (player, program).
  if (programId) {
    const existingTs = await sb(env, `player_target_schools?player_id=eq.${player.id}&program_id=eq.${programId}&status=neq.removed&select=id,status,first_contact_date,contact_count&limit=1`);
    const tsRows = await existingTs.json();
    if (Array.isArray(tsRows) && tsRows[0]) {
      // Already on the list — bump contact info.
      const row = tsRows[0];
      await sb(env, `player_target_schools?id=eq.${row.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: row.status === 'identified' ? 'contacted' : row.status,
          first_contact_date: row.first_contact_date || now.slice(0, 10),
          last_contact_date: now.slice(0, 10),
          contact_count: (row.contact_count || 0) + 1,
        }),
      });
    } else {
      // Not on the list — add it, already marked contacted.
      await sb(env, 'player_target_schools', {
        method: 'POST',
        body: JSON.stringify({
          player_id: player.id,
          program_id: programId,
          tier: 'target',
          status: 'contacted',
          heat_level: 'cold',
          source: 'player_email',
          first_contact_date: now.slice(0, 10),
          last_contact_date: now.slice(0, 10),
          contact_count: 1,
          primary_coach_id: coach ? coach.id : null,
        }),
      });
    }
  }

  // 4. Log the player's email as an outbound message on the thread.
  const loggedToEmails = recipients.length ? recipients : extractEmails(msg.to);
  await sb(env, 'outreach_messages', {
    method: 'POST',
    body: JSON.stringify({
      thread_id: thread.id,
      direction: 'outbound',
      sent_at: now,
      from_email: actualFromEmail,
      from_name: actualFromName || playerName,
      to_emails: loggedToEmails,
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

  // 6. Confirm to Mike so he knows it captured — and be HONEST about the match
  // quality (a domain-guess is not the same as a known coach).
  let matchNote: string;
  if (coach && !coachCreated) {
    matchNote = `Logged ${playerName} → coach ${coachEmail} (matched to a coach already in the CRM).`;
  } else if (coachCreated) {
    matchNote = `Logged ${playerName} → ${coachEmail} — coach was NOT in the CRM, so I created the coach on the matched program (name guessed from the address; fix it in /admin if needed).`;
  } else {
    matchNote = `Logged ${playerName} → ${coachEmail} — the program/coach is NOT in the CRM and I couldn't resolve the school from the domain. Thread created unmatched; assign it in /admin/outreach.`;
  }
  await forwardToMike(env, {
    fromName: actualFromName, fromEmail: actualFromEmail, subject: msg.subject, text: msg.text, html: msg.html,
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
  const envelope = (formData.get('envelope') as string) || '';

  const replyToken = extractReplyToken(to);
  const { name: fromName, email: fromEmail } = parseFromAddress(from);

  // The real SMTP recipients (incl. BCC). log@ is almost always BCC'd, so it
  // lands here and NOT in the visible to/cc fields.
  const envelopeRecipients = parseEnvelopeRecipients(envelope);
  const logInEnvelope = envelopeRecipients.some((e) => LOG_ADDRESS_RE.test(e));

  // ── CC-LOGGING PATH ──────────────────────────────────────────────────────
  // If log@ appears in To/Cc OR in the SMTP envelope (BCC), and this is NOT a
  // reply (no t- token), treat it as a player logging her own outreach.
  if (!replyToken && (LOG_ADDRESS_RE.test(to) || LOG_ADDRESS_RE.test(cc) || logInEnvelope)) {
    return handleCcLog(env, { to, cc, fromName, fromEmail, subject, text, html, messageId, envelopeRecipients });
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
