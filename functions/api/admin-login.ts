// Checks the /admin/ login against the ADMIN_USER and ADMIN_PASS Pages secrets.
interface Env { ADMIN_USER?: string; ADMIN_PASS?: string }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const expectedUser = env.ADMIN_USER || '';
  const expectedPass = env.ADMIN_PASS || '';
  let user = '';
  let pass = '';
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    user = String(body.username || '');
    pass = String(body.password || '');
  } catch {}
  const ok = !!expectedUser && !!expectedPass && user === expectedUser && pass === expectedPass;
  return new Response(JSON.stringify({ ok }), {
    status: ok ? 200 : 401,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
