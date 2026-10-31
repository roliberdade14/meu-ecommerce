# Relatório final de segurança (Prompt 12)

Data: 31/10/2026. Branch `seguranca`.

## O que foi corrigido

| # (auditoria) | Correção | Onde |
|---|---|---|
| 1 | Tailwind compilado no próprio site; nenhum script de terceiros | `tailwind.config.js`, `src/landing.css`, `landing/assets/app.css` |
| 2 | CSP com `script-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` | `vercel.json` e `<meta>` em `index.html`, `landing/index.html`, `loja/index.html` |
| 3 | HSTS, X-Frame-Options DENY, `frame-ancestors 'none'`, nosniff, Referrer-Policy, Permissions-Policy, COOP | `vercel.json` |
| 4 | Scripts movidos para arquivos; `onsubmit=` removido | `landing/app.js`, `loja/app.js` |
| 5 | Dados escapados com `esc()` antes de virar HTML | `loja/app.js` |
| 6 | Formulário grava no Supabase por uma função de servidor: só POST, checagem de origem, limite de 4 KB, validação estrita com rejeição de campos desconhecidos, campo-isca, tempo mínimo, limites de envio (429 + Retry-After), erros genéricos com ID, logs sem dados pessoais | `api/contato.js` |
| 6 | Tabela `leads` com RLS forçado, sem policies, `revoke` para anon/authenticated e CHECKs de tamanho | `supabase/migrations/20261031000000_leads.sql` |
| 7 | `rel="noopener noreferrer"` em todos os links externos | HTML |
| — | Regras permanentes para o agente, `.env.example`, `.gitignore` para `.env*`, CI com testes, `npm audit`, gitleaks e Dependabot | `CLAUDE.md`, `.github/` |
| — | Arquivos internos (testes, SQL, docs, fonte do CSS) fora do site publicado na Vercel | `.vercelignore` |

## Verificações feitas

- `npm test`: 14 testes passando. Cobrem método errado, outra origem, corpo grande, campos extras (mass assignment), tamanhos e tipos, payloads de XSS (`<img src=x onerror=alert(1)>`, `<script>`) e de SQL Injection (`' OR '1'='1`, `; DROP TABLE`), robôs, limite por IP (429), erro do banco sem vazar detalhes e configuração ausente.
- `npm audit`: 0 vulnerabilidades.
- Nenhum segredo nos arquivos servidos ao navegador nem no histórico do git.
- No navegador, com os headers do `vercel.json` aplicados por um servidor local: as 3 páginas carregam sem nenhuma violação de CSP no console; o formulário envia e mostra sucesso (Supabase simulado), e mostra erro amigável quando o servidor falha; um POST de outra origem recebe 403.

## Não verificado

- O deploy real na Vercel e a gravação no Supabase real: dependem da configuração abaixo.
- O CI no GitHub: roda no primeiro envio da branch.

## O que depende de você (configuração manual)

1. **Supabase**: criar o projeto (se ainda não tiver), abrir **SQL Editor**, colar `supabase/migrations/20261031000000_leads.sql` e clicar em **Run**.
2. **Vercel**: em vercel.com/new, importar o repositório `meu-ecommerce` (Framework Preset: **Other**, sem build). Em **Settings > Environment Variables**, criar `SUPABASE_URL`, `SUPABASE_SECRET_KEY` e `IP_HASH_SALT` (ver `.env.example`). Depois, **Redeploy**.
3. **Chave**: use a chave secreta (**Project Settings > API Keys > Secret keys**). Nunca a coloque em arquivo do site. Se um dia ela aparecer em algum lugar público, gere outra e revogue a antiga no Supabase.
4. **Domínio próprio**: ao ligar um domínio, coloque-o em `ALLOWED_ORIGINS` (ex.: `https://www.sualoja.com.br`).
5. **Vercel Firewall** (recomendado): criar uma regra de rate limit para `/api/contato`; em caso de ataque, ativar o Attack Challenge Mode.
6. **Se aparecer spam mesmo assim**: adicionar o Cloudflare Turnstile ao formulário (exige conta na Cloudflare; o código e a CSP precisam ser ajustados).
7. **GitHub Pages**: com a Vercel no ar, vale desativar o Pages (Settings > Pages). Lá o formulário não funciona e os headers de proteção não se aplicam.

## Risco residual

**Baixo.** O site não tem login nem dados de clientes expostos ao navegador. Os riscos que sobram são spam sofisticado (resolvido com Turnstile), a dependência do Google Fonts e do placehold.co (só CSS, fontes e imagens) e o `style-src 'unsafe-inline'`, necessário pelos estilos inline da loja e de baixo impacto, porque scripts continuam bloqueados.
