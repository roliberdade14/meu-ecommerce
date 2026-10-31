# meu-ecommerce

Site de [NOME DA LOJA], um e-commerce que reúne de tudo no mesmo lugar.

- [`landing/`](landing/index.html): landing page com WhatsApp e formulário (Tailwind compilado).
- [`loja/`](loja/index.html): página inicial da loja com ofertas do dia, categorias e produtos.
- [`index.html`](index.html): página de entrada que liga as duas versões.
- [`api/contato.js`](api/contato.js): função da Vercel que valida o formulário e salva no Supabase.

## Como personalizar

- **Link do WhatsApp:** constante `WHATSAPP_LINK` em `landing/app.js` e `loja/app.js`.
- **Cores e fontes da landing:** `tailwind.config.js`. Depois de mudar, rode `npm run build:css` e commite `landing/assets/app.css`.
- **Cores e fontes da loja:** variáveis CSS no topo de `loja/index.html`.
- **Produtos:** listas `CATEGORIES`, `DEALS` e `TRENDING` em `loja/app.js`.
- **Imagens:** são placeholders (placehold.co). Os comentários no código mostram onde trocar pelas fotos reais.

## Publicar (Vercel + Supabase)

Passo a passo em [`docs/security/RELATORIO-FINAL.md`](docs/security/RELATORIO-FINAL.md#o-que-depende-de-você-configuração-manual). Resumo:

1. Supabase: rodar `supabase/migrations/20261031000000_leads.sql` no SQL Editor.
2. Vercel: importar este repositório e criar as variáveis de `.env.example`.
3. Os contatos do formulário aparecem no Supabase, em Table Editor > `leads`.

## Desenvolvimento

```bash
npm install
npm run build:css   # gera o CSS da landing
npm test            # testes de segurança da API
```

Regras de segurança do projeto: [`CLAUDE.md`](CLAUDE.md). Documentação: [`docs/`](docs/).

## Antes de publicar para valer

- Os depoimentos da landing page são fictícios: troque por avaliações reais.
- Troque `[NOME DA LOJA]`, e-mail e CNPJ pelos dados reais.
