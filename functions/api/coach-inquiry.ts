// Cloudflare Pages Function to handle coach inquiry form submissions
// Stores in Supabase and sends email via SendGrid

interface Env {
  SENDGRID_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface CoachInquiry {
  coachName: string;
  coachTitle?: string;
  school: string;
  division?: string;
  coachEmail: string;
  coachPhone?: string;
  players: string;
  message?: string;
  timestamp: string;
  source: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const data: CoachInquiry = await request.json();

    // Validate required fields
    if (!data.coachName || !data.school || !data.coachEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: coachName, school, coachEmail' }),
        { status: 400, headers }
      );
    }

    // Store in Supabase
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_KEY;

    const supabasePayload = {
      coach_name: data.coachName,
      coach_title: data.coachTitle || null,
      school: data.school,
      division: data.division || null,
      coach_email: data.coachEmail,
      coach_phone: data.coachPhone || null,
      players: data.players || null,
      message: data.message || null,
      source: data.source || 'recruiting_hub',
      timestamp: data.timestamp || new Date().toISOString(),
      site: 'starsnatwalker',
    };

    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/coach_inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(supabasePayload),
    });

    if (!supabaseResponse.ok) {
      console.error('Supabase error:', await supabaseResponse.text());
    }

    // Send email via SendGrid
    const sendgridKey = env.SENDGRID_API_KEY;

    const emailHtml = `
      <h2>New Coach Inquiry - Stars National Walker</h2>

      <h3>Coach Information</h3>
      <p><strong>Name:</strong> ${data.coachName}</p>
      ${data.coachTitle ? `<p><strong>Title:</strong> ${data.coachTitle}</p>` : ''}
      <p><strong>School:</strong> ${data.school}</p>
      ${data.division ? `<p><strong>Division:</strong> ${data.division}</p>` : ''}
      <p><strong>Email:</strong> <a href="mailto:${data.coachEmail}">${data.coachEmail}</a></p>
      ${data.coachPhone ? `<p><strong>Phone:</strong> ${data.coachPhone}</p>` : ''}

      <h3>Interested In</h3>
      <p>${data.players || 'Not specified'}</p>

      ${data.message ? `<h3>Message</h3><p>${data.message}</p>` : ''}

      <hr>
      <p style="color: #666; font-size: 12px;">
        Submitted via starsnatwalker.com/recruiting at ${new Date().toLocaleString()}
      </p>
    `;

    const emailText = `
New Coach Inquiry - Stars National Walker

Coach: ${data.coachName}
${data.coachTitle ? `Title: ${data.coachTitle}` : ''}
School: ${data.school}
${data.division ? `Division: ${data.division}` : ''}
Email: ${data.coachEmail}
${data.coachPhone ? `Phone: ${data.coachPhone}` : ''}

Interested In: ${data.players || 'Not specified'}

${data.message ? `Message: ${data.message}` : ''}
    `;

    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [
              { email: 'mike@southlandorganics.com', name: 'Mike Usry' },
              { email: 'mikeusry@gmail.com', name: 'Mike Usry' },
            ],
            subject: `Coach Inquiry: ${data.school} - ${data.coachName}`,
          },
        ],
        from: {
          email: 'mike@southlandorganics.com',
          name: 'Stars National Walker',
        },
        reply_to: {
          email: data.coachEmail,
          name: data.coachName,
        },
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
    console.error('Form submission error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process inquiry' }),
      { status: 500, headers }
    );
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
