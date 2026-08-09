/* =========================================================
   InCode — navbar.js
   Comportamento da navbar no scroll:
   - Após 80 px: modo compacto (.is-scrolled) com shadow
   - Após 220 px: modo mini (.is-mini) — só logo mark + toggle tema
   - Ao voltar ao topo: restaura tudo com transição suave
   Neon interactivo:
   - O fio de luz na borda segue a posição X do rato
   ========================================================= */
(function () {
  'use strict';

  var nav     = document.getElementById('nav');
  var inner   = nav ? nav.querySelector('.nav__inner') : null;
  if (!nav || !inner) return;

  var SCROLL_COMPACT = 80;   /* px para activar is-scrolled */
  var SCROLL_MINI    = 220;  /* px para activar is-mini     */

  var lastY      = -1;
  var wasMini    = false;
  var miniTimer  = null;
  var rafPending = false;

  /* Orquestra a transição em duas fases para suavidade máxima:
     → entrar mini:  elementos desaparecem primeiro (80ms), depois wrapper encolhe
     → sair do mini: wrapper cresce primeiro, depois elementos reaparecem         */
  function setMini(active) {
    if (active === wasMini) return;
    wasMini = active;
    clearTimeout(miniTimer);

    if (active) {
      nav.classList.remove('is-leaving-mini');
      nav.classList.add('is-entering-mini');
      miniTimer = setTimeout(function () {
        nav.classList.add('is-mini');
        nav.classList.remove('is-entering-mini');
      }, 80);
    } else {
      nav.classList.remove('is-mini');
      nav.classList.add('is-leaving-mini');
      miniTimer = setTimeout(function () {
        nav.classList.remove('is-leaving-mini');
      }, 440);
    }
  }

  function update() {
    rafPending = false;
    var y = window.scrollY;
    if (y === lastY) return;
    lastY = y;

    nav.classList.toggle('is-scrolled', y > SCROLL_COMPACT);
    setMini(y > SCROLL_MINI);
  }

  function onScroll() {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(update);
    }
  }

  /* Inicialização sem animação */
  var y0 = window.scrollY;
  lastY = y0;
  nav.classList.toggle('is-scrolled', y0 > SCROLL_COMPACT);
  if (y0 > SCROLL_MINI) {
    wasMini = true;
    nav.classList.add('is-mini');
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* Ao clicar na logo em modo mini, volta ao topo */
  var logoLink = nav.querySelector('.logo');
  if (logoLink) {
    logoLink.addEventListener('click', function (e) {
      if (nav.classList.contains('is-mini')) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  /* ── Neon interactivo: spotlight na borda segue o rato ── */
  var rm = window.matchMedia('(prefers-reduced-motion:reduce)');
  var targetMx = 50; /* percentagem X alvo */
  var currentMx = 50;
  var neonRaf = null;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function neonTick() {
    currentMx = lerp(currentMx, targetMx, 0.10);
    inner.style.setProperty('--mx', currentMx.toFixed(2) + '%');
    neonRaf = requestAnimationFrame(neonTick);
  }

  function onMouseMove(e) {
    var rect = inner.getBoundingClientRect();
    /* Aceita movimento dentro da navbar inteira, não só do inner */
    var x = e.clientX - rect.left;
    targetMx = Math.max(0, Math.min(100, (x / rect.width) * 100));
  }

  function onMouseLeave() {
    /* Ao sair, o spotlight volta ao centro suavemente */
    targetMx = 50;
  }

  if (!rm.matches) {
    nav.addEventListener('mousemove', onMouseMove, { passive: true });
    nav.addEventListener('mouseleave', onMouseLeave, { passive: true });
    neonRaf = requestAnimationFrame(neonTick);
  }

  /* Suporte a touch: segue o toque */
  nav.addEventListener('touchmove', function(e) {
    if (!e.touches.length) return;
    var rect = inner.getBoundingClientRect();
    var x = e.touches[0].clientX - rect.left;
    targetMx = Math.max(0, Math.min(100, (x / rect.width) * 100));
  }, { passive: true });

  nav.addEventListener('touchend', onMouseLeave, { passive: true });

})();