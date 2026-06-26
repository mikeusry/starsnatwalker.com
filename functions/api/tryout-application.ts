// Cloudflare Pages Function — handles the /tryout/#apply Player Application form.
// Previously the form had no action and silently dropped every submission.
// Now: logs to Supabase (public.tryout_applications) AND emails mikeusry@gmail.com.

interface Env {
  SENDGRID_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface TryoutApplication {
  firstName: string;
  lastName: string;
  gradYear?: string;
  position?: string;
  secondaryPosition?: string;
  highSchool?: string;
  currentTeam?: string;
  gpa?: string;
  parentName?: string;
  relationship?: string;
  email?: string;
  phone?: string;
  twitter?: string;
  videoLink?: string;
  achievements?: string;
  whyStars?: string;
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
    const data: TryoutApplication = await request.json();

    if (!data.firstName || !data.lastName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: firstName, lastName' }),
        { status: 400, headers }
      );
    }

    // 1) Durable log → Supabase
    const supabasePayload = {
      first_name: data.firstName,
      last_name: data.lastName,
      grad_year: data.gradYear || null,
      position: data.position || null,
      secondary_position: data.secondaryPosition || null,
      high_school: data.highSchool || null,
      current_team: data.currentTeam || null,
      gpa: data.gpa || null,
      parent_name: data.parentName || null,
      relationship: data.relationship || null,
      email: data.email || null,
      phone: data.phone || null,
      twitter: data.twitter || null,
      video_link: data.videoLink || null,
      achievements: data.achievements || null,
      why_stars: data.whyStars || null,
      source: data.source || 'tryout_form',
      site: 'starsnatwalker',
      user_agent: request.headers.get('user-agent') || null,
      raw: data,
    };

    const supabaseResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/tryout_applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(supabasePayload),
    });

    if (!supabaseResponse.ok) {
      console.error('Supabase error:', await supabaseResponse.text());
    }

    // 2) Notify → email mikeusry@gmail.com
    const fullName = `${data.firstName} ${data.lastName}`;
    const row = (label: string, val?: string) =>
      val ? `<p><strong>${label}:</strong> ${esc(val)}</p>` : '';

    const emailHtml = `
      <h2>New Tryout Application — Stars National Walker</h2>
      <h3>Player</h3>
      <p><strong>Name:</strong> ${esc(fullName)}</p>
      ${row('Grad Year', data.gradYear)}
      ${row('Primary Position', data.position)}
      ${row('Secondary Position', data.secondaryPosition)}
      ${row('High School', data.highSchool)}
      ${row('Current Travel Team', data.currentTeam)}
      ${row('GPA', data.gpa)}
      ${data.twitter ? `<p><strong>X / Twitter:</strong> ${esc(data.twitter)}</p>` : ''}
      ${data.videoLink ? `<p><strong>Video:</strong> <a href="${esc(data.videoLink)}">${esc(data.videoLink)}</a></p>` : ''}
      <h3>Contact</h3>
      ${row('Parent/Guardian', data.parentName)}
      ${row('Relationship', data.relationship)}
      ${data.email ? `<p><strong>Email:</strong> <a href="mailto:${esc(data.email)}">${esc(data.email)}</a></p>` : ''}
      ${row('Phone', data.phone)}
      ${data.achievements ? `<h3>Achievements</h3><p>${esc(data.achievements)}</p>` : ''}
      ${data.whyStars ? `<h3>Why Stars</h3><p>${esc(data.whyStars)}</p>` : ''}
      <hr>
      <p style="color:#666;font-size:12px;">Submitted via starsnatwalker.com/tryout at ${new Date().toLocaleString()}</p>
    `;

    const emailText =
      `New Tryout Application — Stars National Walker\n\n` +
      `Player: ${fullName}\n` +
      `Grad Year: ${data.gradYear || ''}\n` +
      `Position: ${data.position || ''}${data.secondaryPosition ? ' / ' + data.secondaryPosition : ''}\n` +
      `High School: ${data.highSchool || ''}\n` +
      `Current Team: ${data.currentTeam || ''}\n` +
      `GPA: ${data.gpa || ''}\n` +
      `X/Twitter: ${data.twitter || ''}\n` +
      `Video: ${data.videoLink || ''}\n\n` +
      `Parent/Guardian: ${data.parentName || ''} (${data.relationship || ''})\n` +
      `Email: ${data.email || ''}\n` +
      `Phone: ${data.phone || ''}\n\n` +
      `Achievements: ${data.achievements || ''}\n` +
      `Why Stars: ${data.whyStars || ''}\n`;

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
            subject: `Tryout Application: ${fullName}${data.gradYear ? ' (' + data.gradYear + ')' : ''}`,
          },
        ],
        from: { email: 'mike@southlandorganics.com', name: 'Stars National Walker' },
        ...(data.email ? { reply_to: { email: data.email, name: data.parentName || fullName } } : {}),
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
      JSON.stringify({ success: true, message: 'Application submitted successfully' }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Tryout application error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process application' }), {
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
