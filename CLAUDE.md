# meu-ecommerce

Site estático (HTML, CSS e JavaScript puro) hospedado na Vercel, com uma função serverless que grava o formulário no Supabase.

- `landing/`: landing page. Estilos com Tailwind **compilado** (`npm run build:css` gera `landing/assets/app.css` a partir de `src/landing.css` e `tailwind.config.js`). Rode o build sempre que mudar classes, cores ou fontes, e commite o CSS gerado.
- `loja/`: página inicial da loja (CSS com variáveis no próprio HTML, JS em `loja/app.js`).
- `api/contato.js`: única rota de servidor (`POST /api/contato`).
- `supabase/migrations/`: SQL do banco. Toda mudança de banco vira um novo arquivo aqui.
- Testes: `npm test`. Documentação de segurança em `docs/`.

## Regras de segurança (obrigatórias)

1. **Segredos nunca no front-end.** Chaves secretas (Supabase `sb_secret_`/`service_role`, salt, tokens) só em variáveis de ambiente da Vercel e só lidas em `api/`. Nunca colocar em HTML/JS do navegador, nunca commitar `.env`. Novas variáveis entram em `.env.example` só com o nome.
2. **Nada de script inline.** Todo JavaScript fica em arquivos `.js` do próprio site (a CSP usa `script-src 'self'`). Nada de `onclick=`/`onsubmit=` no HTML, `eval`, `new Function` ou scripts de CDN. Novos domínios externos exigem atualizar a CSP no `vercel.json` **e** nas `<meta http-equiv="Content-Security-Policy">` dos HTML.
3. **Nunca renderizar texto sem escapar.** Ao montar HTML com dados, use `esc()` (ver `loja/app.js`) ou `textContent`. Não usar `innerHTML` com dados vindos de usuário, banco ou API sem escapar.
4. **Toda rota nova em `api/`:** só os métodos necessários; checagem de origem; limite de tamanho do corpo; validação estrita no servidor (tipos, tamanhos, formatos, rejeitar campos desconhecidos); limite de envios (429 + `Retry-After`); respostas de erro genéricas com ID de correlação; logs sem dados pessoais. Escrever testes em `tests/` cobrindo entradas maliciosas.
5. **Banco:** acesso só pela API REST/cliente com parâmetros (nunca concatenar SQL). Toda tabela nova com `enable row level security`; se o navegador não precisa acessar, sem policies e com `revoke all ... from anon, authenticated`. Se precisar, policies explícitas baseadas em `auth.uid()`.
6. **Senhas:** se um dia houver login, usar só o Supabase Auth (nada de tabela própria de senhas).
7. **Dados pessoais (LGPD):** guardar o mínimo; IP só como hash com salt; nunca registrar nome, e-mail ou telefone em logs.
8. **Links externos** com `target="_blank"` sempre com `rel="noopener noreferrer"`.
9. **Dependências:** fixar versões exatas; o CI roda `npm audit` e o gitleaks a cada push.
