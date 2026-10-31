'use strict';

/* =========================================================
   CONFIGURAÇÃO (troque aqui)
   ========================================================= */
const WHATSAPP_LINK = 'https://wa.me/5511955309218?text=Ol%C3%A1%2C%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es';
const HERO_INTERVAL = 6000; // ms entre slides do hero

// Placeholder de imagem: TROQUE por URLs das fotos reais dos produtos.
const ph = (text, w = 400, h = 400, bg = 'ffffff') =>
  `https://placehold.co/${w}x${h}/${bg}/1E55D6/png?text=${encodeURIComponent(text)}&font=poppins`;

/* ---------- Dados (substitua pelos produtos reais) ---------- */
const CATEGORIES = [
  { name: 'Computadores', icon: 'i-laptop' },
  { name: 'Câmeras', icon: 'i-camera' },
  { name: 'TVs', icon: 'i-tv' },
  { name: 'Smartwatches', icon: 'i-watch' },
  { name: 'Games', icon: 'i-game' },
  { name: 'Celulares e Tablets', icon: 'i-mobile' },
  { name: 'Fones', icon: 'i-headphones' },
  { name: 'Acessórios', icon: 'i-plug' },
];

const DEALS = [
  { cat: 'Fones', name: 'Fone de ouvido Bluetooth com cancelamento de ruído', price: 249.9, old: 399.9, rating: 4.5, reviews: 128, sold: 14, stock: 20 },
  { cat: 'Smartwatches', name: 'Smartwatch com GPS e monitor cardíaco', price: 599, old: 899, rating: 4, reviews: 76, sold: 9, stock: 20 },
  { cat: 'Games', name: 'Controle sem fio para console, cor azul', price: 329.9, old: 449.9, rating: 5, reviews: 214, sold: 17, stock: 20 },
  { cat: 'Acessórios', name: 'Carregador turbo 65W USB-C com cabo', price: 119.9, old: 189.9, rating: 4.5, reviews: 342, sold: 5, stock: 20 },
  { cat: 'Câmeras', name: 'Câmera de segurança Wi-Fi Full HD 360°', price: 189, old: 279, rating: 4, reviews: 58, sold: 11, stock: 20 },
  { cat: 'Computadores', name: 'Teclado mecânico RGB ABNT2 compacto', price: 279.9, old: 369.9, rating: 4.5, reviews: 97, sold: 8, stock: 20 },
  { cat: 'TVs', name: 'Soundbar 2.1 com subwoofer sem fio', price: 899, old: 1299, rating: 4.5, reviews: 41, sold: 6, stock: 20 },
  { cat: 'Celulares e Tablets', name: 'Tablet 10" 128 GB com caneta', price: 1499, old: 1999, rating: 4, reviews: 63, sold: 12, stock: 20 },
];

// Cada aba tem 8 itens laterais + 1 destaque central
const TRENDING = {
  best: { featured: { cat: 'Celulares e Tablets', name: 'Smartphone 256 GB, câmera tripla de 108 MP', price: 2299, old: 2799, rating: 4.5, reviews: 512, colors: ['Azul', 'Grafite', 'Prata'] },
          items: ['Notebook 15" 16 GB', 'Fone esportivo', 'Mouse sem fio', 'Caixa de som portátil', 'Smart TV 50" 4K', 'Console portátil', 'Webcam Full HD', 'Power bank 20.000 mAh'] },
  promo: { featured: { cat: 'TVs', name: 'Smart TV 55" 4K QLED com controle por voz', price: 2799, old: 3699, rating: 4.5, reviews: 233, colors: ['Preta', 'Titânio', 'Branca'] },
          items: ['Air fryer 4 L', 'Aspirador robô', 'Cafeteira expresso', 'Liquidificador 1200W', 'Ventilador de torre', 'Panela elétrica', 'Lâmpada inteligente', 'Chaleira elétrica'] },
  featured: { featured: { cat: 'Games', name: 'Console de nova geração 1 TB + 2 controles', price: 3899, old: 4499, rating: 5, reviews: 845, colors: ['Branco', 'Preto', 'Azul'] },
          items: ['Headset gamer 7.1', 'Cadeira gamer', 'Monitor 27" 144 Hz', 'Volante com pedais', 'SSD 1 TB', 'Mousepad XL', 'Microfone USB', 'Controle Pro'] },
  new: { featured: { cat: 'Smartwatches', name: 'Smartwatch Série 9 com tela AMOLED', price: 1799, old: 2099, rating: 4.5, reviews: 88, colors: ['Meia-noite', 'Estelar', 'Azul'] },
          items: ['Fone com estojo', 'Tablet infantil', 'Câmera instantânea', 'Drone com câmera', 'Projetor portátil', 'Kindle 11ª ger.', 'Echo com tela', 'Óculos VR'] },
};

/* ---------- Utilitários ---------- */
const $ = (s, el = document) => el.querySelector(s);
// Escapa texto antes de inserir em HTML (evita XSS se os dados vierem de um banco/API no futuro)
const esc = (v) => String(v).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const num = (v) => Number(v) || 0;
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const off = (p, o) => Math.round((1 - p / o) * 100);

function stars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    const cls = rating >= i - 0.25 ? '' : 'off';
    html += `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-star"/></svg>`;
  }
  return `<span class="stars" role="img" aria-label="Avaliação ${String(rating).replace('.', ',')} de 5">${html}</span>`;
}

function productCard(item, { deal = false } = {}) {
  const p = { ...item, cat: esc(item.cat), name: esc(item.name), price: num(item.price), old: item.old ? num(item.old) : null,
              rating: num(item.rating), reviews: num(item.reviews), sold: num(item.sold), stock: num(item.stock) || 1 };
  const discount = p.old ? off(p.price, p.old) : 0;
  return `
    <article class="product">
      ${discount ? `<span class="badge-sale">-${discount}%</span>` : ''}
      <p class="cat-name">${p.cat}</p>
      <h3><a href="#">${p.name}</a></h3>
      <div class="product-img">
        <img src="${ph(p.name.split(' ')[0])}" alt="${p.name}" width="400" height="400" loading="lazy" />
        <div class="quick">
          <button type="button" data-fav aria-pressed="false" aria-label="Favoritar ${p.name}"><svg class="icon"><use href="#i-heart"/></svg></button>
          <button type="button" data-compare aria-label="Comparar ${p.name}"><svg class="icon"><use href="#i-compare"/></svg></button>
          <button type="button" data-add="${p.price}" aria-label="Adicionar ${p.name} ao carrinho"><svg class="icon"><use href="#i-cart"/></svg></button>
        </div>
      </div>
      <div class="price"><span class="now tabular">${brl(p.price)}</span>${p.old ? `<span class="old tabular"><span class="sr-only">de </span>${brl(p.old)}</span>` : ''}</div>
      <div class="rating">${stars(p.rating)}<span>(${p.reviews})</span></div>
      ${deal ? `
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${p.stock}" aria-valuenow="${p.sold}" aria-label="Unidades vendidas"><span style="width:${(p.sold / p.stock) * 100}%"></span></div>
        <p class="sold">Já vendidos: <strong>${p.sold}/${p.stock}</strong></p>` : ''}
    </article>`;
}

/* ---------- Links do WhatsApp ---------- */
$$('[data-whatsapp]').forEach((a) => (a.href = WHATSAPP_LINK));
$('#year').textContent = new Date().getFullYear();

/* ---------- Categorias (carrossel + menu de departamentos + select da busca) ---------- */
$('#catList').innerHTML = CATEGORIES.map((c, i) => `
  <li><a href="#" class="cat" ${i === 0 ? 'aria-current="true"' : ''}>
    <span class="cat-icon"><svg class="icon"><use href="#${esc(c.icon)}"/></svg></span>${esc(c.name)}</a></li>`).join('');
$('#deptList').innerHTML = CATEGORIES.map((c) => `
  <li><a href="#"><svg class="icon"><use href="#${esc(c.icon)}"/></svg>${esc(c.name)}</a></li>`).join('');
$('#searchCat').insertAdjacentHTML('beforeend', CATEGORIES.map((c) => `<option>${esc(c.name)}</option>`).join(''));
$('#catList').addEventListener('click', (e) => {
  const link = e.target.closest('.cat');
  if (!link) return;
  e.preventDefault();
  $$('.cat', $('#catList')).forEach((c) => c.removeAttribute('aria-current'));
  link.setAttribute('aria-current', 'true');
});

/* ---------- Ofertas do dia ---------- */
$('#dealsList').innerHTML = DEALS.map((p) => `<li>${productCard(p, { deal: true })}</li>`).join('');

/* ---------- Em alta (abas) ---------- */
function renderTrending(key) {
  const data = TRENDING[key];
  const f = { ...data.featured, cat: esc(data.featured.cat), name: esc(data.featured.name), colors: data.featured.colors.map(esc),
              price: num(data.featured.price), old: num(data.featured.old), rating: num(data.featured.rating), reviews: num(data.featured.reviews) };
  const side = data.items.map((name, i) => {
    const price = 99 + ((i * 137 + key.length * 53) % 900) + 0.9;
    return productCard({ cat: f.cat, name, price, old: i % 2 ? Math.round(price * 1.25) : null, rating: 4 + (i % 3) * 0.25, reviews: 20 + i * 17 });
  });
  const discount = off(f.price, f.old);
  const featured = `
    <article class="product featured">
      <span class="badge-sale">-${discount}%</span>
      <p class="cat-name">${f.cat}</p>
      <h3><a href="#">${f.name}</a></h3>
      <div class="product-img">
        <img id="featImg" src="${ph(f.colors[0], 600, 520)}" alt="${f.name}, cor ${f.colors[0]}" width="600" height="520" loading="lazy" />
        <div class="quick">
          <button type="button" data-fav aria-pressed="false" aria-label="Favoritar ${f.name}"><svg class="icon"><use href="#i-heart"/></svg></button>
          <button type="button" data-compare aria-label="Comparar ${f.name}"><svg class="icon"><use href="#i-compare"/></svg></button>
          <button type="button" data-add="${f.price}" aria-label="Adicionar ${f.name} ao carrinho"><svg class="icon"><use href="#i-cart"/></svg></button>
        </div>
      </div>
      <div class="swatches" role="group" aria-label="Cores disponíveis">
        ${f.colors.map((c, i) => `<button type="button" class="swatch" data-color="${c}" aria-pressed="${i === 0}" aria-label="Cor ${c}"><img src="${ph(c, 100, 100, 'F1F2F4')}" alt="" width="100" height="100" loading="lazy" /></button>`).join('')}
      </div>
      <div class="price"><span class="now tabular">${brl(f.price)}</span><span class="old tabular"><span class="sr-only">de </span>${brl(f.old)}</span></div>
      <div class="rating">${stars(f.rating)}<span>(${f.reviews} avaliações)</span></div>
      <a href="#" class="btn btn-primary" style="margin-top:16px;min-height:44px">Comprar agora</a>
    </article>`;
  // Ordem: 4 cards à esquerda, destaque no centro, 4 à direita (o CSS posiciona)
  $('#trendGrid').innerHTML = side.slice(0, 4).join('') + featured + side.slice(4).join('');
}
renderTrending('best');

$('#tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (!tab || tab.getAttribute('aria-selected') === 'true') return;
  $$('[data-tab]').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
  const panel = $('#trendPanel');
  panel.classList.add('fading');
  setTimeout(() => { renderTrending(tab.dataset.tab); panel.classList.remove('fading'); }, reduceMotion ? 0 : 180);
});

// Troca de cor no card destaque
$('#trendGrid').addEventListener('click', (e) => {
  const sw = e.target.closest('.swatch');
  if (!sw) return;
  $$('.swatch').forEach((s) => s.setAttribute('aria-pressed', String(s === sw)));
  const img = $('#featImg');
  img.src = ph(sw.dataset.color, 600, 520);
  img.alt = img.alt.replace(/cor .*$/, 'cor ' + sw.dataset.color);
});

/* ---------- Ações rápidas: favoritar, comparar, carrinho ---------- */
let cartCount = 0, cartTotal = 0, favCount = 2;
const toast = $('#toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  const fav = e.target.closest('[data-fav]');
  const cmp = e.target.closest('[data-compare]');
  if (add) {
    cartCount++; cartTotal += Number(add.dataset.add);
    $('#cartCount').textContent = cartCount;
    $('#cartTotal').textContent = brl(cartTotal);
    $('#cartLink').setAttribute('aria-label', `Carrinho: ${cartCount} itens, ${brl(cartTotal)}`);
    showToast('Produto adicionado ao carrinho');
  } else if (fav) {
    const on = fav.getAttribute('aria-pressed') !== 'true';
    fav.setAttribute('aria-pressed', String(on));
    favCount += on ? 1 : -1;
    $('#favCount').textContent = favCount;
    $('#favLink').setAttribute('aria-label', `Favoritos (${favCount} itens)`);
    showToast(on ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
  } else if (cmp) {
    showToast('Produto adicionado à comparação');
  }
});

/* ---------- Setas dos carrosséis (o arraste no celular é nativo) ---------- */
$$('[data-scroll]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const list = $(btn.dataset.scroll);
    list.scrollBy({ left: Number(btn.dataset.dir) * list.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});
// Desativa a seta quando chega ao início/fim
['#catList', '#dealsList'].forEach((sel) => {
  const list = $(sel);
  const update = () => {
    $$(`[data-scroll="${sel}"]`).forEach((b) => {
      const atStart = list.scrollLeft <= 2;
      const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
      b.disabled = b.dataset.dir === '-1' ? atStart : atEnd;
    });
  };
  list.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
});

/* ---------- Arraste com o mouse nos carrosséis (desktop) ---------- */
['#catList', '#dealsList'].forEach((sel) => {
  const el = $(sel);
  let down = false, startX = 0, startLeft = 0, moved = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return; // toque já arrasta nativamente
    down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft;
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 6) { moved = true; el.style.scrollSnapType = 'none'; el.style.scrollBehavior = 'auto'; }
    if (moved) el.scrollLeft = startLeft - dx;
  });
  addEventListener('pointerup', () => { if (!down) return; down = false; el.style.scrollSnapType = ''; el.style.scrollBehavior = ''; });
  el.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  el.addEventListener('dragstart', (e) => e.preventDefault());
});

/* ---------- Hero: carrossel automático ---------- */
const slides = $$('.slide');
const dotsWrap = $('#heroDots');
let current = 0, timer;
slides.forEach((_, i) => {
  dotsWrap.insertAdjacentHTML('beforeend', `<button class="dot" aria-label="Ir para o destaque ${i + 1}" ${i === 0 ? 'aria-current="true"' : ''}></button>`);
});
const dots = $$('.dot', dotsWrap);
function goTo(i) {
  slides[current].classList.remove('active');
  dots[current].removeAttribute('aria-current');
  current = (i + slides.length) % slides.length;
  slides[current].classList.add('active');
  dots[current].setAttribute('aria-current', 'true');
}
function play() { if (!reduceMotion) { clearInterval(timer); timer = setInterval(() => goTo(current + 1), HERO_INTERVAL); } }
function pause() { clearInterval(timer); }
$('#heroPrev').addEventListener('click', () => { goTo(current - 1); play(); });
$('#heroNext').addEventListener('click', () => { goTo(current + 1); play(); });
dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); play(); }));
const hero = $('.hero');
hero.addEventListener('mouseenter', pause);
hero.addEventListener('mouseleave', play);
hero.addEventListener('focusin', pause);
hero.addEventListener('focusout', play);
// Arraste/swipe no hero
let sx = null;
hero.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
hero.addEventListener('touchend', (e) => {
  if (sx === null) return;
  const dx = e.changedTouches[0].clientX - sx;
  if (Math.abs(dx) > 50) { goTo(current + (dx < 0 ? 1 : -1)); play(); }
  sx = null;
});
play();

/* ---------- Contagem regressiva (até a meia-noite de hoje) ---------- */
const pad = (n) => String(n).padStart(2, '0');
function tick() {
  const now = new Date();
  const end = new Date(now); end.setHours(24, 0, 0, 0);
  const diff = Math.max(0, end - now);
  $('#cdH').textContent = pad(Math.floor(diff / 3.6e6));
  $('#cdM').textContent = pad(Math.floor((diff % 3.6e6) / 6e4));
  $('#cdS').textContent = pad(Math.floor((diff % 6e4) / 1000));
}
tick(); setInterval(tick, 1000);

/* ---------- Menu de departamentos ---------- */
const deptBtn = $('#deptBtn'), deptMenu = $('#deptMenu');
function setDept(open) { deptMenu.classList.toggle('open', open); deptBtn.setAttribute('aria-expanded', String(open)); }
deptBtn.addEventListener('click', (e) => { e.stopPropagation(); setDept(!deptMenu.classList.contains('open')); });
document.addEventListener('click', (e) => { if (!e.target.closest('.dept')) setDept(false); });

/* ---------- Gaveta (menu hambúrguer) ---------- */
const drawer = $('#drawer'), menuBtn = $('#menuBtn');
function setDrawer(open) {
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  menuBtn.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) $('[data-close-drawer].icon-btn', drawer).focus(); else menuBtn.focus();
}
menuBtn.addEventListener('click', () => setDrawer(true));
$$('[data-close-drawer]').forEach((el) => el.addEventListener('click', () => setDrawer(false)));
$$('.drawer nav a').forEach((a) => a.addEventListener('click', () => setDrawer(false)));

/* ---------- Busca: sem back-end ainda, então só evita recarregar a página ---------- */
$('#searchForm').addEventListener('submit', (e) => e.preventDefault());

/* ---------- Busca recolhível (celular) ---------- */
const searchToggle = $('#searchToggle');
searchToggle.addEventListener('click', () => {
  const open = $('#bluebar').classList.toggle('search-open');
  searchToggle.setAttribute('aria-expanded', String(open));
  searchToggle.setAttribute('aria-label', open ? 'Esconder busca' : 'Mostrar busca');
  if (open) $('#q').focus();
});

/* ---------- Tecla Esc fecha menus abertos ---------- */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (drawer.classList.contains('open')) setDrawer(false);
  if (deptMenu.classList.contains('open')) { setDept(false); deptBtn.focus(); }
});
