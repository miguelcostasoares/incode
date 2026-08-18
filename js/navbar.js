/* =========================================================
   InCode — navbar.js
   Comportamento da navbar no scroll:
   - Após 80 px: modo compacto (.is-scrolled) com shadow
     → esconde theme-toggle, mantém logo completa + burger
   Neon interactivo:
   - O fio de luz na borda segue a posição X do rato
   ========================================================= */
(function () {
  'use strict';

  var nav     = document.getElementById('nav');
  var inner   = nav ? nav.querySelector('.nav__inner') : null;
  if (!nav || !inner) return;

  var SCROLL_COMPACT = 80;   /* px para activar is-scrolled */

  var lastY      = -1;
  var rafPending = false;

  function update() {
    rafPending = false;
    var y = window.scrollY;
    if (y === lastY) return;
    lastY = y;

    nav.classList.toggle('is-scrolled', y > SCROLL_COMPACT);
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

  window.addEventListener('scroll', onScroll, { passive: true });

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
    var x = e.clientX - rect.left;
    targetMx = Math.max(0, Math.min(100, (x / rect.width) * 100));
  }

  function onMouseLeave() {
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