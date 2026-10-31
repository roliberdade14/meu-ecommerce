'use strict';
/* =========================================================
   POST /api/contato  (Função Serverless da Vercel)
   Recebe o formulário da landing page, valida e grava no Supabase.

   Variáveis de ambiente (Vercel > Settings > Environment Variables):
     SUPABASE_URL               URL do projeto (ex.: https://xxxx.supabase.co)
     SUPABASE_SECRET_KEY        chave SECRETA (sb_secret_... ou a antiga service_role).
                                Nunca usar prefixo público nem colocar no front-end.
     IP_HASH_SALT               texto aleatório longo, usado para guardar o IP só como hash
     ALLOWED_ORIGINS (opcional) domínios que podem enviar, separados por vírgula.
                                Sem ela, só o próprio domínio do site é aceito.
   ========================================================= */
const crypto = require('node:crypto');

const LIMITS = {
  maxBodyBytes: 4096,
  nome: [2, 100],
  contato: [5, 120],
  procura: [0, 1000],
  minFillMs: 3000,          // menos que isso = robô
  perIpWindowMin: 10,       // janela do limite por IP gravado no banco
  perIpMax: 3,              // envios por IP dentro da janela
  burstWindowMs: 60_000,    // limite rápido em memória (por instância)
  burstMax: 5,
};
const ALLOWED_FIELDS = new Set(['nome', 'contato', 'procura', 'empresa', 'tempo']);
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9.-]{1,180}\.[A-Za-z]{2,24}$/;
const PHONE = /^[0-9+()\s.-]{8,25}$/;

/* ---------- Respostas: sempre genéricas para o cliente ---------- */
function send(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}
function fail(res, status, codigo, id, extraHeaders) {
  const mensagens = {
    400: 'Dados inválidos.',
    403: 'Origem não permitida.',
    405: 'Método não permitido.',
    413: 'Envio grande demais.',
    415: 'Formato não suportado.',
    429: 'Muitos envios. Tente novamente mais tarde.',
    500: 'Não foi possível processar agora.',
  };
  send(res, status, { erro: mensagens[status] || mensagens[500], codigo, id }, extraHeaders);
}

/* ---------- Validação (nada que vem do navegador é confiável) ---------- */
function cleanText(value, [min, max], { multiline = false } = {}) {
  if (typeof value !== 'string') return null;
  let v = value.normalize('NFC').trim();
  if (!multiline) v = v.replace(/\s+/g, ' ');
  if (CONTROL_CHARS.test(v)) return null;
  if (!multiline && /[\r\n]/.test(v)) return null;
  if (v.length < min || v.length > max) return null;
  return v;
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'corpo' };
  for (const key of Object.keys(body)) if (!ALLOWED_FIELDS.has(key)) return { error: 'campo_desconhecido' };

  const nome = cleanText(body.nome, LIMITS.nome);
  const contato = cleanText(body.contato, LIMITS.contato);
  const procura = body.procura === undefined ? '' : cleanText(body.procura, LIMITS.procura, { multiline: true });
  if (nome === null || contato === null || procura === null) return { error: 'formato' };
  if (/[<>]/.test(nome)) return { error: 'formato' };

  const isEmail = EMAIL.test(contato);
  const digits = contato.replace(/\D/g, '');
  const isPhone = PHONE.test(contato) && digits.length >= 10 && digits.length <= 13;
  if (!isEmail && !isPhone) return { error: 'contato' };

  const empresa = typeof body.empresa === 'string' ? body.empresa : '';
  const tempo = Number.isFinite(body.tempo) ? body.tempo : 0;
  return { data: { nome, contato, procura }, suspicious: empresa.length > 0 || tempo < LIMITS.minFillMs };
}

/* ---------- Origem, IP e limite de envios ---------- */
function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  const list = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (list.length) return list.includes(origin);
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

function clientIp(req) {
  const h = req.headers;
  const raw = h['x-vercel-forwarded-for'] || h['x-real-ip'] || (h['x-forwarded-for'] || '').split(',')[0] || req.socket?.remoteAddress || '';
  return String(raw).trim().slice(0, 64);
}

const burst = new Map(); // ipHash -> [timestamps]; limite rápido, vale por instância da função
function burstLimited(ipHash, now = Date.now()) {
  const recent = (burst.get(ipHash) || []).filter((t) => now - t < LIMITS.burstWindowMs);
  recent.push(now);
  burst.set(ipHash, recent);
  if (burst.size > 5000) burst.clear(); // evita crescer sem limite
  return recent.length > LIMITS.burstMax;
}

/* ---------- Supabase (REST, sem dependências) ---------- */
function supabaseHeaders(key) {
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  // Chaves novas (sb_secret_...) vão só no "apikey"; a antiga service_role (JWT) também no Authorization
  if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function recentCount(cfg, ipHash) {
  const since = new Date(Date.now() - LIMITS.perIpWindowMin * 60_000).toISOString();
  const url = `${cfg.url}/rest/v1/leads?select=id&ip_hash=eq.${ipHash}&created_at=gte.${encodeURIComponent(since)}`;
  const r = await fetch(url, { method: 'HEAD', headers: { ...supabaseHeaders(cfg.key), Prefer: 'count=exact' }, signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(`supabase_count_${r.status}`);
  const total = Number((r.headers.get('content-range') || '').split('/')[1]);
  return Number.isFinite(total) ? total : 0;
}

async function insertLead(cfg, row) {
  const r = await fetch(`${cfg.url}/rest/v1/leads`, {
    method: 'POST',
    headers: { ...supabaseHeaders(cfg.key), Prefer: 'return=minimal' },
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) throw new Error(`supabase_insert_${r.status}`);
}

/* ---------- Handler ---------- */
async function handler(req, res) {
  const id = crypto.randomUUID(); // ID de correlação: aparece para o cliente e no log

  if (req.method !== 'POST') return fail(res, 405, 'metodo', id, { Allow: 'POST' });
  if (!originAllowed(req)) return fail(res, 403, 'origem', id);
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return fail(res, 415, 'tipo', id);
  if (Number(req.headers['content-length'] || 0) > LIMITS.maxBodyBytes) return fail(res, 413, 'tamanho', id);

  const cfg = { url: (process.env.SUPABASE_URL || '').replace(/\/+$/, ''), key: process.env.SUPABASE_SECRET_KEY || '', salt: process.env.IP_HASH_SALT || '' };
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.url) || !cfg.key || cfg.salt.length < 16) {
    console.error(JSON.stringify({ id, evento: 'config_incompleta' }));
    return fail(res, 500, 'config', id);
  }

  let body = req.body;
  if (typeof body === 'string') {
    if (Buffer.byteLength(body) > LIMITS.maxBodyBytes) return fail(res, 413, 'tamanho', id);
    try { body = JSON.parse(body); } catch { return fail(res, 400, 'json', id); }
  }
  const result = validate(body);
  if (result.error) return fail(res, 400, result.error, id);

  const ipHash = crypto.createHmac('sha256', cfg.salt).update(clientIp(req)).digest('hex');
  if (burstLimited(ipHash)) return fail(res, 429, 'limite', id, { 'Retry-After': '60' });

  // Robô (campo-isca preenchido ou envio instantâneo): finge sucesso e não grava nada
  if (result.suspicious) {
    console.warn(JSON.stringify({ id, evento: 'bot_descartado' }));
    return send(res, 200, { ok: true, id });
  }

  try {
    if ((await recentCount(cfg, ipHash)) >= LIMITS.perIpMax) {
      return fail(res, 429, 'limite', id, { 'Retry-After': String(LIMITS.perIpWindowMin * 60) });
    }
    await insertLead(cfg, { ...result.data, origem: 'landing', ip_hash: ipHash });
    return send(res, 201, { ok: true, id });
  } catch (err) {
    // Log sem dados pessoais (nome/contato nunca vão para o log)
    console.error(JSON.stringify({ id, evento: 'erro_supabase', detalhe: String(err && err.message).slice(0, 80) }));
    return fail(res, 500, 'servidor', id);
  }
}

module.exports = handler;
module.exports._test = { validate, originAllowed, clientIp, burst, LIMITS };
