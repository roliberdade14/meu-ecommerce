# Esquema do back-end

## Fluxo do formulário

1. O visitante preenche o formulário em `/landing/` (`landing/app.js`).
2. O navegador envia `POST /api/contato` com JSON `{ nome, contato, procura, empresa, tempo }`.
3. A função `api/contato.js` (Vercel) confere método, origem, tipo e tamanho, valida os campos, descarta robôs e aplica o limite de envios.
4. A função grava em `public.leads` pela API REST do Supabase, com a chave secreta.
5. O dono da loja vê os contatos no painel do Supabase (Table Editor > `leads`).

Não há autenticação de usuários: o site não tem login.

## Tabela `public.leads`

Migração: `supabase/migrations/20261031000000_leads.sql`.

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid | `gen_random_uuid()`, chave primária |
| `created_at` | timestamptz | `now()` |
| `nome` | text | 2 a 100 caracteres |
| `contato` | text | 5 a 120 caracteres (e-mail ou telefone, validado na função) |
| `procura` | text | até 1000 caracteres |
| `origem` | text | só `'landing'` |
| `ip_hash` | text | 64 caracteres (HMAC-SHA256 do IP) |

Índice: `(ip_hash, created_at desc)`, usado pelo limite de envios.

## Quem pode ler e escrever

| Papel do Supabase | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `anon` (chave pública) | não | não | não | não |
| `authenticated` | não | não | não | não |
| `service_role` / chave secreta (só a função da Vercel) | sim (só conta envios recentes) | sim | não usado | não usado |

RLS: `enable` + `force row level security`, **sem nenhuma policy**, e `revoke all` para `anon` e `authenticated`. A chave secreta ignora RLS por definição, por isso ela existe só na Vercel.

Toda tabela nova segue o mesmo padrão: RLS ligado e policies só se o navegador realmente precisar acessar.
