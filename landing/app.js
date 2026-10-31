'use strict';

/* =========================================================
   CONFIGURAÇÃO: troque o link do WhatsApp SÓ AQUI.
   Formato: https://wa.me/55DDDNUMERO (ex.: https://wa.me/5541999999999)
   Dá para incluir uma mensagem pronta: ?text=Olá!%20Vim%20pelo%20site
   ========================================================= */
const WHATSAPP_LINK = 'https://wa.me/5511955309218?text=Ol%C3%A1%2C%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es';

document.querySelectorAll('[data-whatsapp]').forEach((a) => (a.href = WHATSAPP_LINK));
document.getElementById('ano').textContent = new Date().getFullYear();

/* ---------- Menu hambúrguer ---------- */
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
function setMenu(open) {
  mobileMenu.classList.toggle('hidden', !open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  document.getElementById('iconOpen').classList.toggle('hidden', open);
  document.getElementById('iconClose').classList.toggle('hidden', !open);
}
menuBtn.addEventListener('click', () => setMenu(mobileMenu.classList.contains('hidden')));
// Fecha o menu ao tocar em um link
mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

/* ---------- Rolagem suave nas âncoras ----------
   O CSS (scroll-behavior) já faz a maior parte; aqui garantimos o mesmo
   comportamento em navegadores antigos e respeitamos "reduzir movimento". */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });
});

/* ---------- Formulário (abrir e fechar) ---------- */
const dialog = document.getElementById('formDialog');
const form = document.getElementById('leadForm');
const success = document.getElementById('formSuccess');

const submitBtn = document.getElementById('leadSubmit');
const formError = document.getElementById('formError');
let formOpenedAt = 0; // usado pelo servidor para barrar robôs que enviam instantaneamente

document.querySelectorAll('[data-open-form]').forEach((btn) =>
  btn.addEventListener('click', () => {
    form.classList.remove('hidden');
    success.classList.add('hidden');
    formError.classList.add('hidden');
    formOpenedAt = Date.now();
    dialog.showModal(); // já prende o foco e fecha com Esc
  })
);
dialog.querySelectorAll('[data-close-form]').forEach((btn) => btn.addEventListener('click', () => dialog.close()));
// Fecha ao clicar fora do card
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

/* ---------- Formulário (envio) ----------
   A validação aqui é só para ajudar quem preenche. A validação que vale
   como segurança acontece no servidor, em api/contato.js. */
const FORM_ENDPOINT = '/api/contato';

function setSending(sending) {
  submitBtn.disabled = sending;
  submitBtn.textContent = sending ? 'Enviando…' : 'Enviar';
  submitBtn.classList.toggle('opacity-60', sending);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.classList.add('hidden');
  let firstInvalid = null;
  form.querySelectorAll('[required]').forEach((input) => {
    const error = input.parentElement.querySelector('.field-error');
    const invalid = !input.value.trim();
    error.classList.toggle('hidden', !invalid);
    input.setAttribute('aria-invalid', String(invalid));
    input.classList.toggle('border-sale', invalid);
    if (invalid && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) { firstInvalid.focus(); return; }

  const data = new FormData(form);
  const payload = {
    nome: String(data.get('nome') || '').trim(),
    contato: String(data.get('contato') || '').trim(),
    procura: String(data.get('procura') || '').trim(),
    empresa: String(data.get('empresa') || ''), // campo-isca: pessoas não veem, robôs preenchem
    tempo: Date.now() - formOpenedAt,
  };

  setSending(true);
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(String(res.status));
    form.reset();
    form.classList.add('hidden');
    success.classList.remove('hidden');
  } catch (err) {
    formError.textContent = err.message === '429'
      ? 'Você já enviou alguns contatos agora há pouco. Tente de novo em alguns minutos ou chame no WhatsApp.'
      : 'Não foi possível enviar agora. Tente de novo ou chame a gente no WhatsApp.';
    formError.classList.remove('hidden');
  } finally {
    setSending(false);
  }
});
