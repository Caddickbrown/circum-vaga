// Password gate for the main Circum Vaga site.
// The football subdomain and /football stay public. The password is read from the
// SITE_PASSWORD environment variable (Vercel project settings), never stored in the repo.

const COOKIE = 'cv_auth';
const OPEN = new Set(['/assets/logo.png', '/assets/favicon-32.png', '/assets/favicon-64.png']);

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/login')
    ? value
    : '/';
}

function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function loginPage(next, failed) {
  const html = `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Circum Vaga</title>
<link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600&family=Libre+Caslon+Display&display=swap">
<style>
  :root { --cream:#f7f3ea; --paper:#fffdf7; --ink:#1c2b30; --red:#a61e2a; --rule:#cfc4b0; --muted:#6b6b6b; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:var(--cream); color:var(--ink); font-family:'Figtree',system-ui,sans-serif; }
  main { width:min(92vw,360px); text-align:center; padding:32px 0; }
  img { display:block; margin:0 auto 18px; }
  h1 { font-family:'Libre Caslon Display',Georgia,serif; font-weight:400; font-size:34px; margin:0 0 6px; }
  p { margin:0 0 22px; color:var(--muted); }
  form { display:grid; gap:12px; }
  label { text-align:left; font-size:14px; font-weight:600; }
  input { width:100%; font:inherit; font-size:16px; padding:12px 14px; border:1px solid var(--rule); border-radius:2px; background:var(--paper); color:var(--ink); }
  input:focus-visible { outline:2px solid var(--ink); outline-offset:2px; }
  button { font:inherit; font-weight:600; padding:12px 14px; border:0; border-radius:2px; background:var(--ink); color:var(--cream); cursor:pointer; }
  button:hover { background:#000; }
  .err { color:var(--red); font-size:14px; margin:0 0 4px; text-align:left; }
</style></head>
<body><main>
<img src="/assets/logo.png" alt="" width="36" height="79">
<h1>Circum Vaga</h1>
<p>Enter the password to continue.</p>
<form method="post" action="/login">
  ${failed ? '<p class="err" role="alert">That password isn’t right.</p>' : ''}
  <input type="hidden" name="next" value="${esc(next)}">
  <label for="pw">Password</label>
  <input id="pw" name="password" type="password" autocomplete="current-password" autofocus required>
  <button type="submit">Enter</button>
</form>
</main></body></html>`;
  return new Response(html, {
    status: failed ? 401 : 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

export const config = { matcher: '/((?!_vercel).*)' };

export default async function middleware(request) {
  const url = new URL(request.url);
  const host = (request.headers.get('host') || url.host).toLowerCase();

  // Public: the football game and anything under /football.
  if (host.startsWith('football.') || url.pathname === '/football' || url.pathname.startsWith('/football/')) return;
  if (OPEN.has(url.pathname)) return;

  const password = process.env.SITE_PASSWORD;
  if (!password) return new Response('Site locked: no password configured.', { status: 503 });
  const expected = await sha256('circumvaga:' + password);

  if (url.pathname === '/login' && request.method === 'POST') {
    const form = await request.formData();
    const next = safeNext(form.get('next'));
    const given = await sha256('circumvaga:' + String(form.get('password') || ''));
    if (given !== expected) return loginPage(next, true);
    return new Response(null, {
      status: 303,
      headers: {
        location: next,
        'cache-control': 'no-store',
        'set-cookie': `${COOKIE}=${expected}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  const cookies = (request.headers.get('cookie') || '').split(/;\s*/);
  if (cookies.includes(`${COOKIE}=${expected}`)) {
    if (url.pathname === '/login') return new Response(null, { status: 303, headers: { location: '/' } });
    return;
  }

  return loginPage(url.pathname === '/login' ? '/' : safeNext(url.pathname + url.search), false);
}
