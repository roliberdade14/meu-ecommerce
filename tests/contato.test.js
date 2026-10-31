'use strict';
// Testes da função /api/contato (rodar com: npm test). O Supabase é simulado; nada sai para a internet.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL = 'https://projeto-teste.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'sb_secret_teste';
process.env.IP_HASH_SALT = 'sal-de-teste-com-mais-de-16-caracteres';
delete process.env.ALLOWED_ORIGINS;

const handler = require('../api/contato.js');
const { burst } = handler._test;

let calls, recentTotal, insertStatus;
beforeEach(() => {
  calls = []; recentTotal = 0; insertStatus = 201;
  burst.clear();
  global.fetch = async (url, opts) => {
    calls.push({ url, opts });
    if (opts.method === 'HEAD') return new Response(null, { status: 200, headers: { 'content-range': `*/${recentTotal}` } });
    return new Response(null, { status: insertStatus });
  };
});

let ipCounter = 0;
function call(body, { method = 'POST', headers = {}, ip } = {}) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  const req = {
    method,
    body: typeof body === 'string' ? body : body,
    headers: {
      host: 'meu-ecommerce.vercel.app',
      origin: 'https://meu-ecommerce.vercel.app',
      'content-type': 'application/json',
      'content-length': String(Buffer.byteLength(raw || '')),
      'x-vercel-forwarded-for': ip || `10.0.0.${++ipCounter}`,
      ...headers,
    },
  };
  return new Promise((resolve) => {
    const res = {
      statusCode: 0, headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(data) { resolve({ status: this.statusCode, headers: this.headers, body: JSON.parse(data) }); },
    };
    handler(req, res);
  });
}

const valido = { nome: 'Maria Silva', contato: 'maria@exemplo.com', procura: 'Um fone sem fio', empresa: '', tempo: 8000 };

test('aceita um envio válido e grava no Supabase só com campos permitidos', async () => {
  const r = await call(valido);
  assert.equal(r.status, 201);
  const insert = calls.find((c) => c.opts.method === 'POST');
  const row = JSON.parse(insert.opts.body);
  assert.deepEqual(Object.keys(row).sort(), ['contato', 'ip_hash', 'nome', 'origem', 'procura']);
  assert.equal(row.ip_hash.length, 64);
  assert.ok(!insert.opts.body.includes('10.0.0.'), 'IP real não pode ser gravado');
  assert.equal(insert.opts.headers.Authorization, undefined, 'chave sb_secret_ vai só no apikey');
});

test('aceita WhatsApp como contato', async () => {
  assert.equal((await call({ ...valido, contato: '(11) 95530-9218' })).status, 201);
});

test('recusa métodos diferentes de POST', async () => {
  const r = await call(valido, { method: 'GET' });
  assert.equal(r.status, 405);
  assert.equal(r.headers.allow, 'POST');
});

test('recusa origem de outro site', async () => {
  assert.equal((await call(valido, { headers: { origin: 'https://site-malicioso.com' } })).status, 403);
  assert.equal((await call(valido, { headers: { origin: undefined } })).status, 403);
});

test('recusa conteúdo que não é JSON e corpo grande demais', async () => {
  assert.equal((await call(valido, { headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await call(valido, { headers: { 'content-length': '999999' } })).status, 413);
});

test('recusa campos desconhecidos (mass assignment)', async () => {
  assert.equal((await call({ ...valido, ip_hash: 'x', id: '1' })).status, 400);
});

test('recusa campos fora do tamanho ou do tipo', async () => {
  assert.equal((await call({ ...valido, nome: 'A' })).status, 400);
  assert.equal((await call({ ...valido, nome: 'x'.repeat(101) })).status, 400);
  assert.equal((await call({ ...valido, procura: 'x'.repeat(1001) })).status, 400);
  assert.equal((await call({ ...valido, nome: ['Maria'] })).status, 400);
  assert.equal((await call({ ...valido, contato: 'nao-e-contato' })).status, 400);
  assert.equal((await call('{json quebrado')).status, 400);
});

test('bloqueia payloads de injeção nos campos', async () => {
  for (const nome of ['<img src=x onerror=alert(1)>', '<script>alert(1)</script>']) {
    assert.equal((await call({ ...valido, nome })).status, 400, nome);
  }
  for (const contato of ["' OR '1'='1", 'a@b.com; DROP TABLE leads', 'javascript:alert(1)']) {
    assert.equal((await call({ ...valido, contato })).status, 400, contato);
  }
  assert.equal((await call({ ...valido, nome: 'Maria\u0000' })).status, 400);
});

test('texto com aspas vai como dado (sem montar SQL) e a resposta não ecoa a entrada', async () => {
  const r = await call({ ...valido, procura: "'; DROP TABLE leads; --" });
  assert.equal(r.status, 201);
  assert.ok(!JSON.stringify(r.body).includes('DROP'));
});

test('robôs (campo-isca ou envio rápido) recebem sucesso falso e nada é gravado', async () => {
  assert.equal((await call({ ...valido, empresa: 'Spam LTDA' })).status, 200);
  assert.equal((await call({ ...valido, tempo: 200 })).status, 200);
  assert.equal(calls.length, 0);
});

test('limite por IP no banco devolve 429 com Retry-After', async () => {
  recentTotal = 3;
  const r = await call(valido);
  assert.equal(r.status, 429);
  assert.equal(r.headers['retry-after'], '600');
});

test('limite rápido em memória devolve 429 na sexta tentativa seguida', async () => {
  let last;
  for (let i = 0; i < 6; i++) last = await call(valido, { ip: '200.1.1.1' });
  assert.equal(last.status, 429);
});

test('erro do Supabase vira mensagem genérica com ID, sem detalhes internos', async () => {
  insertStatus = 500;
  const r = await call(valido);
  assert.equal(r.status, 500);
  assert.equal(r.body.erro, 'Não foi possível processar agora.');
  assert.match(r.body.id, /^[0-9a-f-]{36}$/);
  assert.ok(!JSON.stringify(r.body).includes('supabase'));
});

test('sem configuração, responde 500 genérico', async () => {
  const saved = process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  const r = await call(valido);
  process.env.SUPABASE_SECRET_KEY = saved;
  assert.equal(r.status, 500);
  assert.equal(calls.length, 0);
});
