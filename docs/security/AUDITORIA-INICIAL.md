# Auditoria inicial de segurança (Prompt 0)

Data: 31/10/2026. Versão auditada: commit `e44306e` (branch `main`, antes das correções).

## Stack encontrada

| Item | Situação |
|---|---|
| Framework / linguagem | HTML, CSS e JavaScript puro, sem framework |
| CSS | Landing: Tailwind pelo CDN (`cdn.tailwindcss.com`) rodando no navegador. Loja: CSS próprio |
| Banco de dados | Nenhum |
| Autenticação | Nenhuma (não há login nem senhas) |
| Hospedagem | GitHub Pages |
| APIs externas | Google Fonts, placehold.co (imagens de exemplo), links do WhatsApp |
| IA | Não usa |

## Rotas e páginas

| Rota | Tipo | Autenticação | Entradas |
|---|---|---|---|
| `/` | Página estática | Pública | Nenhuma |
| `/landing/` | Página estática | Pública | Formulário (nome, contato, procura), **sem envio para lugar nenhum** |
| `/loja/` | Página estática | Pública | Campo de busca (não envia nada) |

Não existem rotas de API, server actions, webhooks nem páginas administrativas.

## Achados

| # | Achado | Onde | Risco | Como explorar | Correção recomendada |
|---|---|---|---|---|---|
| 1 | Script de terceiro sem verificação de integridade: o Tailwind era baixado do CDN a cada visita e executado com acesso total à página. O CDN não envia CORS, então nem dá para usar SRI | `landing/index.html:18` | ALTO | Se o CDN fosse comprometido, o código injetado rodaria para todos os visitantes (trocar o link do WhatsApp, roubar o que for digitado no formulário) | Compilar o Tailwind localmente e servir o CSS do próprio site |
| 2 | Sem Content-Security-Policy | todas as páginas | MÉDIO | Qualquer XSS futuro roda sem barreira; scripts de qualquer domínio são aceitos | CSP com `script-src 'self'` (exige tirar scripts inline) |
| 3 | Sem headers de segurança (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy). O GitHub Pages não deixa configurar headers | hospedagem | MÉDIO | Clickjacking (o site dentro de um iframe de outro site) e vazamento de URL no Referer | Hospedar na Vercel com `vercel.json` |
| 4 | Scripts e handlers inline (`<script>` no HTML e `onsubmit=`) impedem uma CSP estrita | `landing/index.html:484`, `loja/index.html:581`, `loja/index.html:839` | BAIXO | Indireto: obriga a usar `'unsafe-inline'` | Mover para arquivos `.js` |
| 5 | HTML montado com `innerHTML` a partir de dados sem escapar. Hoje os dados são fixos no código, mas viram XSS assim que vierem de banco ou API | `loja/index.html:930-977` | BAIXO | Um produto com nome `<img src=x onerror=...>` executaria código | Escapar com `esc()` |
| 6 | O formulário não tinha destino nem proteção. Ao ligá-lo a um banco, faltariam validação no servidor, limite de envios e anti-spam | `landing/index.html:541` | MÉDIO (ao ligar) | Spam em massa, lixo no banco, abuso de custo | Função de servidor com validação, rate limit, campo-isca e RLS |
| 7 | Links `target="_blank"` sem `noreferrer` | links do WhatsApp | BAIXO | O destino recebe a URL de origem | `rel="noopener noreferrer"` |
| 8 | Segredos e `.env` | repositório e histórico | OK | Nenhuma chave, token ou `.env` encontrado em todo o histórico do git | Manter `.env*` no `.gitignore` e o gitleaks no CI |

## Quais prompts se aplicam

| Prompt | Aplica? | Motivo |
|---|---|---|
| 1. Segredos | Sim, preventivo | Nada vazado, mas a nova chave do Supabase precisa ficar só no servidor |
| 2. IDOR/RLS | Sim | Nova tabela no Supabase: RLS sem policies, só o servidor grava |
| 3. Senhas | Não | Não há login. Regra registrada no CLAUDE.md para o futuro |
| 4. Validação/SQL Injection | Sim | Nova rota `/api/contato` |
| 5. XSS e headers | Sim | Achados 1 a 5 e 7 |
| 6. Rate limit e anti-bot | Sim | Nova rota pública de formulário |
| 7. Prompt Injection | Não | Não usa IA |
| 8. SSRF | Não | O servidor só chama a URL fixa do Supabase |
| 9. Admin e enumeração | Parcial | Não há admin; checado que arquivos internos não ficam públicos |
| 10. Erros e logs | Sim | Na nova rota |
| 11. Regras permanentes | Sim | |
| 12. Verificação final | Sim | Ver `RELATORIO-FINAL.md` |
