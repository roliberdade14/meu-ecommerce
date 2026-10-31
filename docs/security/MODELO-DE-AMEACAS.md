# Modelo de ameaças

## Dados sensíveis

| Dado | Onde fica | Proteção |
|---|---|---|
| Nome, WhatsApp ou e-mail e interesse de quem preenche o formulário (dados pessoais, LGPD) | Supabase, tabela `public.leads` | RLS sem policies; só a função do servidor grava; ninguém lê pelo navegador |
| IP de quem envia | Não é guardado. Só um hash HMAC-SHA256 com salt secreto, usado no limite de envios | Salt na Vercel |
| Chave secreta do Supabase e salt | Variáveis de ambiente da Vercel | Nunca no código nem no navegador |

## Papéis

| Papel | O que pode fazer |
|---|---|
| Visitante (anônimo) | Ver as páginas; enviar o formulário (com limite de envios) |
| Dono da loja | Ver os contatos no painel do Supabase (Table Editor), logado na conta do Supabase |
| Função `api/contato` | Só inserir e contar linhas em `leads` (usa a chave secreta) |

Não existe login de clientes nem painel administrativo no site.

## Superfície

| Rota | Acesso | Proteções |
|---|---|---|
| `/`, `/landing/`, `/loja/` | Pública, estática | CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy |
| `POST /api/contato` | Pública | Só POST; só a origem do próprio site; JSON até 4 KB; validação estrita; campo-isca e tempo mínimo; 5 envios/min por instância e 3 por 10 min por IP; erros genéricos |

## Integrações externas

| Serviço | Uso | Risco controlado por |
|---|---|---|
| Supabase | Banco do formulário | Chave só no servidor, RLS, CHECKs no banco |
| Google Fonts | Fontes | CSP limita a `fonts.googleapis.com` e `fonts.gstatic.com` (só CSS e fontes, sem script) |
| placehold.co | Imagens de exemplo | CSP `img-src`; trocar por fotos próprias |
| WhatsApp (wa.me) | Link de contato | Só navegação, com `noopener noreferrer` |

## Ameaças principais e resposta

- **Spam/robôs no formulário**: campo-isca, tempo mínimo de preenchimento, limite por IP e checagem de origem. Se ainda houver muito spam, adicionar o Cloudflare Turnstile (ver `RELATORIO-FINAL.md`).
- **Vazamento dos contatos**: a tabela não pode ser lida com a chave pública; só pelo painel do Supabase.
- **Código malicioso na página (XSS ou terceiro comprometido)**: CSP `script-src 'self'`, sem scripts de CDN, dados escapados.
- **Clickjacking**: `frame-ancestors 'none'` e `X-Frame-Options: DENY` (só na Vercel; o GitHub Pages não permite esses headers).
