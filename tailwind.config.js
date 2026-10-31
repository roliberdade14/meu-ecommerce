/* =========================================================
   TEMA da landing page: cores da marca e fontes em um só lugar.
   Depois de trocar algo aqui, rode:  npm run build:css
   ========================================================= */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./landing/**/*.html', './landing/**/*.js'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1E55D6', // azul royal: hero, chamada final, ícones, links ativos
          dark:    '#163FA6', // círculos decorativos, hover, barra do topo
          light:   '#E8EEFC', // fundo dos círculos de categoria
        },
        accent: {
          DEFAULT: '#FFD60A', // amarelo: botão principal sobre o azul, estrelas
          dark:    '#F5C400', // hover do botão amarelo
        },
        sale:    '#E5262D',   // vermelho: só em selos pequenos
        ink:     '#111827',   // texto principal
        muted:   '#5B6270',   // texto secundário
        surface: '#F1F2F4',   // blocos cinza claro
        line:    '#E3E5E9',   // bordas finas
        whatsapp:'#25D366',   // botão flutuante
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(17,24,39,.04), 0 8px 24px rgba(17,24,39,.06)',
        lift: '0 2px 4px rgba(17,24,39,.05), 0 16px 40px rgba(17,24,39,.10)',
      },
    },
  },
};
