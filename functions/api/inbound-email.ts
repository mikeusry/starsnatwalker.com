// SendGrid Inbound Parse webhook for replies to coach outreach emails.
// Replies are routed to: t-{reply_token}@recruiting.starsnatwalker.com
// We extract the token, find the matching outreach_thread, log to outreach_messages,
// pause cadence (set last_inbound_at + bump inbound_count), and forward a copy to Mike.
//
// SendGrid Inbound Parse posts as multipart/form-data with parsed fields:
//   from, to, subject, text, html, headers, envelope, attachments, charsets, ...
// See: https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SENDGRID_API_KEY: string;
  SENDGRID_INBOUND_KEY: string;
}

const FORWARD_TO_EMAIL = 'mike@southlandorganics.com';
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
  const from = (formData.get('from') as string) || '';
  const subject = (formData.get('subject') as string) || '(no subject)';
  const text = (formData.get('text') as string) || '';
  const html = (formData.get('html') as string) || '';
  const messageId = (formData.get('message_id') as string) || null;

  const replyToken = extractReplyToken(to);
  const { name: fromName, email: fromEmail } = parseFromAddress(from);

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
