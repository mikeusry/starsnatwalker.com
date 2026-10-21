// Checks the family password against the FAMILY_PASS Pages secret.
interface Env { FAMILY_PASS?: string }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const expected = (env.FAMILY_PASS || '').trim().toLowerCase();
  let pw = '';
  try { pw = String(((await request.json()) as { password?: string }).password || '').trim().toLowerCase(); } catch {}
  const ok = !!expected && pw === expected;
  return new Response(JSON.stringify({ ok }), {
    status: ok ? 200 : 401,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
