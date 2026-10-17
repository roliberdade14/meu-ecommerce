# meu-ecommerce

Site de [NOME DA LOJA], um e-commerce que reúne de tudo no mesmo lugar.

- [`landing/`](landing/index.html): landing page (HTML + Tailwind via CDN) com WhatsApp e formulário.
- [`loja/`](loja/index.html): página inicial da loja (HTML, CSS e JavaScript) com ofertas do dia, categorias e produtos.
- [`index.html`](index.html): página de entrada que liga as duas versões.

## Como personalizar

- **Link do WhatsApp:** constante `WHATSAPP_LINK` no início do `<script>` de cada página.
- **Cores e fontes:** `tailwind.config` (landing) e variáveis CSS no topo de `loja/index.html`.
- **Produtos:** listas `CATEGORIES`, `DEALS` e `TRENDING` no JavaScript de `loja/index.html`.
- **Imagens:** são placeholders (placehold.co). Os comentários no código mostram onde trocar pelas fotos reais.

## Antes de publicar para valer

- Os depoimentos da landing page são fictícios: troque por avaliações reais.
- O formulário ainda não envia os dados para lugar nenhum: ligue-o a um serviço (Formspree, planilha etc.).
- Troque `[NOME DA LOJA]`, telefone, e-mail e CNPJ pelos dados reais.

## Ver no computador

Abra o `index.html` no navegador.
