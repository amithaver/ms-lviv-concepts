/**
 * Cloudflare Worker: заявки з форм пропозицій → Telegram.
 * Секрети (лише в Cloudflare, не в коді): TG_TOKEN — токен бота, TG_CHAT_ID — id чату/групи менеджерів.
 * Змінна ALLOWED_ORIGIN — сайт, з якого приймаються заявки (напр. https://amithaver.github.io).
 * Установка — README.md поруч.
 */
const MAX = 2000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const ok = allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': ok ? origin : allowed[0] || 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST' || !ok) return json({ ok: false, error: 'forbidden' }, 403, cors);

    let data;
    try { data = await request.json(); } catch { return json({ ok: false, error: 'bad json' }, 400, cors); }
    if (!data || typeof data !== 'object' || data.botcheck) return json({ ok: false, error: 'rejected' }, 400, cors);

    const lines = [`<b>${esc(data.subject || 'Заявка з сайту')}</b>`];
    for (const [k, v] of Object.entries(data)) {
      if (['subject', 'from_name', 'botcheck', 'access_key'].includes(k)) continue;
      lines.push(`<b>${esc(k)}:</b> ${esc(String(v).slice(0, MAX))}`);
    }
    const r = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    return json({ ok: r.ok }, r.ok ? 200 : 502, cors);
  },
};

function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function json(obj, status, headers) { return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json' } }); }
