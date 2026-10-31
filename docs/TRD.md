# TRD: requisitos técnicos

## Stack

| Camada | Escolha |
|---|---|
| Páginas | HTML, CSS e JavaScript puro |
| CSS da landing | Tailwind CSS 3.4.16 compilado (`npm run build:css`) |
| Servidor | 1 função serverless Node.js na Vercel (`api/contato.js`), sem dependências |
| Banco | Supabase (Postgres), acessado pela API REST |
| Hospedagem | Vercel (principal, com headers de segurança). O GitHub Pages pode continuar, mas lá o formulário não funciona (não há servidor) e os headers não se aplicam |
| Testes | `node:test` (`npm test`) |
| CI | GitHub Actions: testes, `npm audit`, CSS atualizado, sem script inline, gitleaks. Dependabot semanal |

## Onde ficam os segredos

| Segredo | Onde fica | Quem usa |
|---|---|---|
| `SUPABASE_SECRET_KEY` | Vercel > Settings > Environment Variables (Production e Preview) | `api/contato.js` |
| `IP_HASH_SALT` | Vercel (idem) | `api/contato.js` |
| `SUPABASE_URL` | Vercel (não é secreta, mas fica junto) | `api/contato.js` |

Nada disso vai para o navegador nem para o git. A lista de nomes fica em `.env.example`.

## Proteções de borda

| Item | Escolha |
|---|---|
| Rate limit | No código: 5 envios/min por instância (memória) e 3 por 10 min por IP (contagem no Supabase). Sem Redis externo |
| WAF/CDN | Vercel Firewall (ativar o Attack Challenge Mode se houver ataque; criar regra de rate limit para `/api/contato` no painel) |
| Anti-bot | Campo-isca + tempo mínimo de preenchimento. Cloudflare Turnstile fica como próximo passo se aparecer spam |
| Headers | `vercel.json` + `<meta>` CSP em cada HTML |
