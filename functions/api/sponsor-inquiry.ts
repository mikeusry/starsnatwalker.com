// Cloudflare Pages Function — /sponsors/#become form.
// Emails Mike. No public inbox on the page.

interface Env {
  SENDGRID_API_KEY: string;
}

interface SponsorInquiry {
  name: string;
  company: string;
  email: string;
  phone?: string;
  message?: string;
  timestamp?: string;
  source?: string;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const data: SponsorInquiry = await request.json();

    if (!data.name || !data.company || !data.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, company, email' }),
        { status: 400, headers }
      );
    }

    const row = (label: string, val?: string) =>
      val ? `<p><strong>${label}:</strong> ${esc(val)}</p>` : '';

    const emailHtml = `
      <h2>New Sponsor Inquiry — Stars National Walker</h2>
      ${row('Name', data.name)}
      ${row('Company', data.company)}
      <p><strong>Email:</strong> <a href="mailto:${esc(data.email)}">${esc(data.email)}</a></p>
      ${row('Phone', data.phone)}
      ${data.message ? `<h3>Message</h3><p>${esc(data.message)}</p>` : ''}
      <hr>
      <p style="color:#666;font-size:12px;">Submitted via starsnatwalker.com/sponsors/ at ${new Date().toLocaleString()}</p>
    `;

    const emailText =
      `New Sponsor Inquiry — Stars National Walker\n\n` +
      `Name: ${data.name}\n` +
      `Company: ${data.company}\n` +
      `Email: ${data.email}\n` +
      `Phone: ${data.phone || ''}\n\n` +
      `Message: ${data.message || ''}\n`;

    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [
              { email: 'mikeusry@gmail.com', name: 'Mike Usry' },
              { email: 'mike@starsnatwalker.com', name: 'Mike Usry' },
            ],
            subject: `Sponsor inquiry: ${data.company} — ${data.name}`,
          },
        ],
        from: { email: 'mike@southlandorganics.com', name: 'Stars National Walker' },
        reply_to: { email: data.email, name: data.name },
        content: [
          { type: 'text/plain', value: emailText },
          { type: 'text/html', value: emailHtml },
        ],
      }),
    });

    if (!sendgridResponse.ok) {
      console.error('SendGrid error:', await sendgridResponse.text());
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Inquiry submitted successfully' }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Sponsor inquiry error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process inquiry' }), {
      status: 500,
      headers,
    });
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
