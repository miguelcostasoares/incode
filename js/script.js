/* =========================================================
   InCode — script.js v2
   1. Tema  2. Navbar  3. Menu mobile
   4. Entrada  5. Aurora (blobs + estrelas)  6. Partículas orbitais
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var rm   = window.matchMedia('(prefers-reduced-motion:reduce)');

  /* ── 1. Tema ──────────────────────────────────────────── */
  var themeBtn = document.getElementById('theme-toggle');

  function theme() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }

  function syncLabel() {
    if (!themeBtn) return;
    themeBtn.setAttribute('aria-label', 'Mudar para tema ' + (theme() === 'dark' ? 'claro' : 'escuro'));
  }
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('incode-theme', t); } catch(e){}
    var mc = document.querySelector('meta[name="theme-color"]');
    if (mc) mc.content = t === 'dark' ? '#09090b' : '#f8fafc';
    syncLabel();
    document.dispatchEvent(new CustomEvent('incode:theme', { detail: t }));
  }
  syncLabel();
  if (themeBtn) themeBtn.addEventListener('click', function() { applyTheme(theme() === 'dark' ? 'light' : 'dark'); });
  var sysPref = window.matchMedia('(prefers-color-scheme:light)');
  if (sysPref.addEventListener) sysPref.addEventListener('change', function(e) {
    try { if (!localStorage.getItem('incode-theme')) applyTheme(e.matches ? 'light' : 'dark'); } catch(x){}
  });

  /* ── 2. Navbar ────────────────────────────────────────── */
  var nav = document.getElementById('nav');
  var lastY = -1;
  function onScroll() {
    var y = window.scrollY;
    if (y === lastY) return;
    lastY = y;
    nav.classList.toggle('is-scrolled', y > 28);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });

  /* Indicador deslizante */
  var navMenu = document.getElementById('nav-menu');
  if (navMenu) {
    var ind   = navMenu.querySelector('.nav__indicator');
    var links = navMenu.querySelectorAll('.nav__link');

    function setActive(href) {
      [].forEach.call(links, function(l) {
        var isActive = l.getAttribute('href') === href;
        l.classList.toggle('is-active', isActive);
      });
    }

    function moveInd(el) {
      if (!el || !ind) return;
      ind.style.width     = el.offsetWidth + 'px';
      ind.style.transform = 'translate(' + el.offsetLeft + 'px,-50%)';
      ind.classList.add('is-visible');
    }
    function resetInd() {
      var a = navMenu.querySelector('.nav__link.is-active');
      if (a) moveInd(a); else if (ind) ind.classList.remove('is-visible');
    }
    [].forEach.call(links, function(l) {
      l.addEventListener('mouseenter', function() { moveInd(l); });
      l.addEventListener('focus',      function() { moveInd(l); });
    });
    navMenu.addEventListener('mouseleave', resetInd);
    navMenu.addEventListener('focusout',   resetInd);
    window.addEventListener('resize', resetInd);
    requestAnimationFrame(resetInd);

    /* ── Link activo via scroll (IntersectionObserver) ── */
    /* Mapeia o href de cada link para a secção correspondente */
    var sectionMap = [];
    [].forEach.call(links, function(l) {
      var href = l.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      var sec = document.querySelector(href);
      if (sec) sectionMap.push({ href: href, el: sec });
    });

    if (sectionMap.length && 'IntersectionObserver' in window) {
      /* rootMargin negativo: considera a secção activa quando está
         na zona central do viewport (entre 20% e 60% do topo) */
      var secObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (!e.isIntersecting) return;
          /* Encontra o href correspondente a esta secção */
          for (var i = 0; i < sectionMap.length; i++) {
            if (sectionMap[i].el === e.target) {
              setActive(sectionMap[i].href);
              requestAnimationFrame(resetInd);
              break;
            }
          }
        });
      }, {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
      });

      sectionMap.forEach(function(s) { secObs.observe(s.el); });
    }
  }

  /* ── 3. Menu mobile ───────────────────────────────────── */
  var burger   = document.getElementById('burger');
  var mobileM  = document.getElementById('mobile-menu');

  function setMenu(open) {
    if (!burger || !mobileM) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (open) {
      mobileM.hidden = false;
      requestAnimationFrame(function() { mobileM.classList.add('is-open'); });
      document.body.style.overflow = 'hidden';
    } else {
      mobileM.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(function() {
        if (burger.getAttribute('aria-expanded') === 'false') mobileM.hidden = true;
      }, 320);
    }
  }
  if (burger) burger.addEventListener('click', function() {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  if (mobileM) mobileM.addEventListener('click', function(e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && burger && burger.getAttribute('aria-expanded') === 'true') {
      setMenu(false); burger.focus();
    }
  });
  window.addEventListener('resize', function() {
    if (window.innerWidth > 900) setMenu(false);
  });

  /* ── 4. Entrada de conteúdo ───────────────────────────── */
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { document.body.classList.add('is-ready'); });
  });

  /* ── 5. Aurora background (blobs + estrelas) ──────────── */
  var aCanvas = document.getElementById('aurora');
  var hero    = document.getElementById('hero');
  if (!aCanvas || !hero) return;

  var aC = aCanvas.getContext('2d', { alpha: true });
  var aW = 0, aH = 0, aDpr = 1;
  var aRaf = null, aRunning = false, aT0 = performance.now();

  /* Paleta dos blobs por tema */
  var BLOBS_DARK = [
    { cx:0.72, cy:0.22, rx:0.42, ry:0.38, color:'rgba(0,71,255,',   alpha:0.28, speed:0.00018, amp:0.09 },
    { cx:0.18, cy:0.72, rx:0.36, ry:0.32, color:'rgba(139,92,246,', alpha:0.22, speed:0.00014, amp:0.11, phase:2.1 },
    { cx:0.60, cy:0.78, rx:0.30, ry:0.28, color:'rgba(0,240,255,',  alpha:0.16, speed:0.00022, amp:0.08, phase:4.2 },
    { cx:0.10, cy:0.30, rx:0.28, ry:0.26, color:'rgba(236,72,153,', alpha:0.14, speed:0.00016, amp:0.07, phase:1.4 },
    { cx:0.85, cy:0.60, rx:0.25, ry:0.23, color:'rgba(59,130,246,', alpha:0.16, speed:0.00020, amp:0.09, phase:3.8 },
  ];
  var BLOBS_LIGHT = [
    { cx:0.72, cy:0.22, rx:0.42, ry:0.38, color:'rgba(0,71,255,',   alpha:0.11, speed:0.00018, amp:0.09 },
    { cx:0.18, cy:0.72, rx:0.36, ry:0.32, color:'rgba(139,92,246,', alpha:0.09, speed:0.00014, amp:0.11, phase:2.1 },
    { cx:0.60, cy:0.78, rx:0.30, ry:0.28, color:'rgba(0,200,255,',  alpha:0.10, speed:0.00022, amp:0.08, phase:4.2 },
    { cx:0.10, cy:0.30, rx:0.28, ry:0.26, color:'rgba(236,72,153,', alpha:0.07, speed:0.00016, amp:0.07, phase:1.4 },
    { cx:0.85, cy:0.60, rx:0.25, ry:0.23, color:'rgba(59,130,246,', alpha:0.08, speed:0.00020, amp:0.09, phase:3.8 },
  ];

  /* Estrelas (posições fixas, apenas opacidade oscila) */
  var STARS_N = window.innerWidth < 700 ? 55 : 90;
  var stars = [];
  function buildStars() {
    stars = [];
    for (var i = 0; i < STARS_N; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.1 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0008 + Math.random() * 0.0016,
        maxA: 0.15 + Math.random() * 0.55,
      });
    }
  }
  buildStars();

  function aResize() {
    var rect = hero.getBoundingClientRect();
    aDpr = Math.min(window.devicePixelRatio || 1, 2);
    aW = Math.max(rect.width, 1);
    aH = Math.max(rect.height, 1);
    aCanvas.width  = Math.round(aW * aDpr);
    aCanvas.height = Math.round(aH * aDpr);
    aCanvas.style.width  = aW + 'px';
    aCanvas.style.height = aH + 'px';
    aC.setTransform(aDpr, 0, 0, aDpr, 0, 0);
  }

  function aFrame(now) {
    var t    = now - aT0;
    var dark = theme() === 'dark';
    var blobs = dark ? BLOBS_DARK : BLOBS_LIGHT;

    aC.clearRect(0, 0, aW, aH);

    /* Blobs */
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      var phase = b.phase || 0;
      var cx = (b.cx + Math.sin(t * b.speed + phase) * b.amp) * aW;
      var cy = (b.cy + Math.cos(t * b.speed * 0.87 + phase) * b.amp) * aH;
      var rx = b.rx * aW;
      var ry = b.ry * aH;

      var grd = aC.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      grd.addColorStop(0,   b.color + b.alpha + ')');
      grd.addColorStop(0.5, b.color + (b.alpha * 0.45) + ')');
      grd.addColorStop(1,   b.color + '0)');

      aC.save();
      aC.translate(cx, cy);
      aC.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
      aC.translate(-cx, -cy);
      aC.fillStyle = grd;
      aC.beginPath();
      aC.arc(cx, cy, Math.max(rx, ry), 0, Math.PI * 2);
      aC.fill();
      aC.restore();
    }

    /* Estrelas */
    for (var j = 0; j < stars.length; j++) {
      var s = stars[j];
      var a = s.maxA * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      if (!dark) a *= 0.5;
      aC.globalAlpha = a;
      aC.fillStyle   = dark ? '#ffffff' : '#0047ff';
      aC.beginPath();
      aC.arc(s.x * aW, s.y * aH, s.r, 0, Math.PI * 2);
      aC.fill();
    }
    aC.globalAlpha = 1;

    aRaf = requestAnimationFrame(aFrame);
  }

  function aStart() {
    if (aRunning || rm.matches) return;
    aRunning = true; aT0 = performance.now() - 1;
    aRaf = requestAnimationFrame(aFrame);
  }
  function aStop() {
    aRunning = false;
    if (aRaf) cancelAnimationFrame(aRaf); aRaf = null;
  }
  function aStatic() {
    aResize();
    var dark = theme() === 'dark';
    var blobs = dark ? BLOBS_DARK : BLOBS_LIGHT;
    aC.clearRect(0, 0, aW, aH);
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      var cx = b.cx * aW, cy = b.cy * aH;
      var rx = b.rx * aW, ry = b.ry * aH;
      var g = aC.createRadialGradient(cx,cy,0,cx,cy,Math.max(rx,ry));
      g.addColorStop(0,   b.color + b.alpha + ')');
      g.addColorStop(0.5, b.color + (b.alpha*0.4) + ')');
      g.addColorStop(1,   b.color + '0)');
      aC.save();
      aC.translate(cx,cy); aC.scale(rx/Math.max(rx,ry),ry/Math.max(rx,ry)); aC.translate(-cx,-cy);
      aC.fillStyle = g;
      aC.beginPath(); aC.arc(cx,cy,Math.max(rx,ry),0,Math.PI*2); aC.fill();
      aC.restore();
    }
  }

  var aResizeT;
  window.addEventListener('resize', function() {
    clearTimeout(aResizeT);
    aResizeT = setTimeout(function() {
      aResize();
      if (rm.matches) aStatic();
    }, 160);
  });
  document.addEventListener('incode:theme', function() { if (rm.matches) aStatic(); });
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) aStop(); else if (!rm.matches) aStart();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(entries) {
      entries.forEach(function(e) { if (e.isIntersecting) aStart(); else aStop(); });
    }, { threshold: 0.01 }).observe(hero);
  }
  if (rm.addEventListener) rm.addEventListener('change', function(e) {
    if (e.matches) { aStop(); aStatic(); } else aStart();
  });

  aResize();
  if (rm.matches) aStatic(); else aStart();

  /* ── 6. Partículas orbitais em torno da logo ──────────── */
  var oCanvas = document.getElementById('orbit-canvas');
  if (!oCanvas) return;
  var oC   = oCanvas.getContext('2d', { alpha: true });
  var oDpr = Math.min(window.devicePixelRatio || 1, 2);
  var oSize = 0; /* calculado via resize */
  var oRaf  = null, oT0 = performance.now();

  /* Raios correspondem exactamente aos anéis CSS: 72%, 88%, 100% do visual */
  /* O canvas ocupa 100% do .hero__visual, logo os raios são fracções de oSize/2 */
  var RING_R = [0.36, 0.44, 0.50]; /* 72%/2, 88%/2, 100%/2 */

  var PARTICLES = [];
  (function buildParticles() {
    var counts = [6, 4, 3];
    for (var ring = 0; ring < 3; ring++) {
      for (var k = 0; k < counts[ring]; k++) {
        PARTICLES.push({
          ring:  ring,
          rFrac: RING_R[ring],           /* fracção de (oSize/2) */
          angle: (k / counts[ring]) * Math.PI * 2 + ring * 0.8,
          speed: (ring === 0 ? 0.50 : ring === 1 ? -0.31 : 0.20) * (Math.random() * 0.3 + 0.85),
          size:  1.8 + ring * 0.55,
        });
      }
    }
  })();

  function oResize() {
    var parent = oCanvas.parentElement;
    if (!parent) return;
    var rect = parent.getBoundingClientRect();
    oDpr  = Math.min(window.devicePixelRatio || 1, 2);
    oSize = Math.max(rect.width, rect.height, 100);
    oCanvas.width  = Math.round(oSize * oDpr);
    oCanvas.height = Math.round(oSize * oDpr);
    oCanvas.style.width  = oSize + 'px';
    oCanvas.style.height = oSize + 'px';
    oC.setTransform(oDpr, 0, 0, oDpr, 0, 0);
  }

  function oFrame(now) {
    var t    = now - oT0;
    var dark = theme() === 'dark';
    var half = oSize / 2;
    oC.clearRect(0, 0, oSize, oSize);

    for (var i = 0; i < PARTICLES.length; i++) {
      var p   = PARTICLES[i];
      var ang = p.angle + t * p.speed * 0.001;
      var r   = p.rFrac * oSize;           /* raio real em px */
      var px  = half + Math.cos(ang) * r;
      var py  = half + Math.sin(ang) * r;
      var sz  = p.size * (oSize / 420);    /* escala ao tamanho real */

      var col = dark
        ? (p.ring === 0 ? 'rgba(0,240,255,' : p.ring === 1 ? 'rgba(0,71,255,' : 'rgba(139,92,246,')
        : (p.ring === 0 ? 'rgba(0,71,255,' : p.ring === 1 ? 'rgba(0,120,255,' : 'rgba(139,92,246,');
      var ao = dark ? [0.92, 0.68, 0.48][p.ring] : [0.72, 0.52, 0.38][p.ring];

      /* Halo */
      var hg = oC.createRadialGradient(px, py, 0, px, py, sz * 4.5);
      hg.addColorStop(0, col + (ao * 0.55) + ')');
      hg.addColorStop(1, col + '0)');
      oC.fillStyle = hg;
      oC.beginPath(); oC.arc(px, py, sz * 4.5, 0, Math.PI * 2); oC.fill();

      /* Núcleo */
      oC.fillStyle = col + ao + ')';
      oC.beginPath(); oC.arc(px, py, sz, 0, Math.PI * 2); oC.fill();
    }
    oRaf = requestAnimationFrame(oFrame);
  }

  oResize();
  var oResizeT;
  window.addEventListener('resize', function() {
    clearTimeout(oResizeT);
    oResizeT = setTimeout(oResize, 120);
  });

  if (!rm.matches) {
    oT0 = performance.now() - 1;
    oRaf = requestAnimationFrame(oFrame);
  }
  document.addEventListener('incode:theme', function() { /* cores re-renderizadas no próximo frame */ });
  document.addEventListener('visibilitychange', function() {
    if (!rm.matches) {
      if (document.hidden && oRaf) { cancelAnimationFrame(oRaf); oRaf = null; }
      else if (!oRaf) { oT0 = performance.now() - 1; oRaf = requestAnimationFrame(oFrame); }
    }
  });

})();

/* ── 7. Aurora da secção Produtos ─────────────────────────── */
(function() {
  var c2 = document.getElementById('aurora-products');
  var sec = document.getElementById('produtos');
  if (!c2 || !sec) return;
  var ctx2 = c2.getContext('2d', { alpha: true });
  var w2=0, h2=0, dpr2=1, raf2=null, t02=performance.now(), run2=false;

  var BLOBS2_DARK = [
    { cx:.22, cy:.25, rx:.38, ry:.32, color:'rgba(139,92,246,', alpha:.22, speed:.00016, amp:.10 },
    { cx:.78, cy:.70, rx:.34, ry:.30, color:'rgba(0,71,255,',   alpha:.20, speed:.00019, amp:.09, phase:2.2 },
    { cx:.55, cy:.15, rx:.28, ry:.26, color:'rgba(0,240,255,',  alpha:.14, speed:.00023, amp:.07, phase:3.8 },
    { cx:.15, cy:.75, rx:.26, ry:.24, color:'rgba(236,72,153,', alpha:.13, speed:.00017, amp:.08, phase:1.1 },
  ];
  var BLOBS2_LIGHT = BLOBS2_DARK.map(function(b){
    return Object.assign({}, b, { alpha: b.alpha * 0.45 });
  });

  function th2() { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }

  function resize2() {
    var r = sec.getBoundingClientRect();
    dpr2 = Math.min(window.devicePixelRatio||1, 2);
    w2 = Math.max(r.width,1); h2 = Math.max(r.height,1);
    c2.width = Math.round(w2*dpr2); c2.height = Math.round(h2*dpr2);
    c2.style.width = w2+'px'; c2.style.height = h2+'px';
    ctx2.setTransform(dpr2,0,0,dpr2,0,0);
  }

  function frame2(now) {
    var t = now - t02;
    var blobs = th2()==='dark' ? BLOBS2_DARK : BLOBS2_LIGHT;
    ctx2.clearRect(0,0,w2,h2);
    for (var i=0;i<blobs.length;i++) {
      var b=blobs[i], ph=b.phase||0;
      var cx=(b.cx+Math.sin(t*b.speed+ph)*b.amp)*w2;
      var cy=(b.cy+Math.cos(t*b.speed*.87+ph)*b.amp)*h2;
      var rx=b.rx*w2, ry=b.ry*h2, mx=Math.max(rx,ry);
      var g=ctx2.createRadialGradient(cx,cy,0,cx,cy,mx);
      g.addColorStop(0,b.color+b.alpha+')');
      g.addColorStop(.5,b.color+(b.alpha*.4)+')');
      g.addColorStop(1,b.color+'0)');
      ctx2.save(); ctx2.translate(cx,cy); ctx2.scale(rx/mx,ry/mx); ctx2.translate(-cx,-cy);
      ctx2.fillStyle=g; ctx2.beginPath(); ctx2.arc(cx,cy,mx,0,Math.PI*2); ctx2.fill();
      ctx2.restore();
    }
    raf2=requestAnimationFrame(frame2);
  }

  function start2() { if(run2) return; run2=true; t02=performance.now()-1; raf2=requestAnimationFrame(frame2); }
  function stop2()  { run2=false; if(raf2){cancelAnimationFrame(raf2);raf2=null;} }

  var rm2=window.matchMedia('(prefers-reduced-motion:reduce)');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting)start2(); else stop2(); });
    },{threshold:.02}).observe(sec);
  }
  document.addEventListener('visibilitychange',function(){if(document.hidden)stop2();else if(!rm2.matches)start2();});
  window.addEventListener('resize',function(){resize2();});
  resize2();
  if(!rm2.matches) start2();
})();

/* ── 8. IntersectionObserver para [data-reveal-section] ──── */
(function() {
  var els = document.querySelectorAll('[data-reveal-section]');
  if (!els.length) return;
  var rm = window.matchMedia('(prefers-reduced-motion:reduce)');
  if (rm.matches) {
    [].forEach.call(els, function(el){ el.classList.add('is-visible'); });
    return;
  }
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  [].forEach.call(els, function(el){ obs.observe(el); });
})();

/* ── 9. Paralaxe suave na logo-showcase ao mover o rato ──── */
(function() {
  var showcase = document.querySelector('.logo-showcase');
  if (!showcase) return;
  var rm = window.matchMedia('(prefers-reduced-motion:reduce)');
  var tx=0, ty=0, cx=-12, cy=5, raf=null;
  document.addEventListener('pointermove', function(e) {
    if (rm.matches) return;
    cx = ((e.clientX / window.innerWidth) - .5) * -18;
    cy = ((e.clientY / window.innerHeight) - .5) * 10;
  }, { passive: true });
  function tick() {
    tx += (cx - tx) * .05;
    ty += (cy - ty) * .05;
    showcase.style.transform = 'rotateY(' + (-12 + tx) + 'deg) rotateX(' + (5 + ty) + 'deg)';
    raf = requestAnimationFrame(tick);
  }
  if (!rm.matches) tick();
})();

/* ── 10. Aurora da secção Sobre ───────────────────────────── */
(function() {
  var c3 = document.getElementById('aurora-about');
  var sec = document.getElementById('sobre');
  if (!c3 || !sec) return;
  var ctx3 = c3.getContext('2d', { alpha: true });
  var w3=0, h3=0, dpr3=1, raf3=null, t03=performance.now(), run3=false;

  var BLOBS3_DARK = [
    { cx:.12, cy:.35, rx:.40, ry:.35, color:'rgba(0,71,255,',   alpha:.20, speed:.00015, amp:.09 },
    { cx:.80, cy:.60, rx:.38, ry:.32, color:'rgba(139,92,246,', alpha:.18, speed:.00018, amp:.10, phase:2.4 },
    { cx:.50, cy:.10, rx:.30, ry:.28, color:'rgba(0,240,255,',  alpha:.13, speed:.00021, amp:.07, phase:4.0 },
    { cx:.85, cy:.20, rx:.28, ry:.25, color:'rgba(236,72,153,', alpha:.11, speed:.00016, amp:.08, phase:1.2 },
  ];
  var BLOBS3_LIGHT = BLOBS3_DARK.map(function(b){
    return Object.assign({},b,{alpha:b.alpha*0.4});
  });

  function th3(){return document.documentElement.getAttribute('data-theme')==='light'?'light':'dark';}

  function resize3(){
    var r=sec.getBoundingClientRect();
    dpr3=Math.min(window.devicePixelRatio||1,2);
    w3=Math.max(r.width,1); h3=Math.max(r.height,1);
    c3.width=Math.round(w3*dpr3); c3.height=Math.round(h3*dpr3);
    c3.style.width=w3+'px'; c3.style.height=h3+'px';
    ctx3.setTransform(dpr3,0,0,dpr3,0,0);
  }

  function frame3(now){
    var t=now-t03;
    var blobs=th3()==='dark'?BLOBS3_DARK:BLOBS3_LIGHT;
    ctx3.clearRect(0,0,w3,h3);
    for(var i=0;i<blobs.length;i++){
      var b=blobs[i],ph=b.phase||0;
      var cx=(b.cx+Math.sin(t*b.speed+ph)*b.amp)*w3;
      var cy=(b.cy+Math.cos(t*b.speed*.87+ph)*b.amp)*h3;
      var rx=b.rx*w3,ry=b.ry*h3,mx=Math.max(rx,ry);
      var g=ctx3.createRadialGradient(cx,cy,0,cx,cy,mx);
      g.addColorStop(0,b.color+b.alpha+')');
      g.addColorStop(.5,b.color+(b.alpha*.4)+')');
      g.addColorStop(1,b.color+'0)');
      ctx3.save();ctx3.translate(cx,cy);ctx3.scale(rx/mx,ry/mx);ctx3.translate(-cx,-cy);
      ctx3.fillStyle=g;ctx3.beginPath();ctx3.arc(cx,cy,mx,0,Math.PI*2);ctx3.fill();
      ctx3.restore();
    }
    raf3=requestAnimationFrame(frame3);
  }

  function start3(){if(run3)return;run3=true;t03=performance.now()-1;raf3=requestAnimationFrame(frame3);}
  function stop3(){run3=false;if(raf3){cancelAnimationFrame(raf3);raf3=null;}}

  var rm3=window.matchMedia('(prefers-reduced-motion:reduce)');
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      entries.forEach(function(e){if(e.isIntersecting)start3();else stop3();});
    },{threshold:.02}).observe(sec);
  }
  document.addEventListener('visibilitychange',function(){if(document.hidden)stop3();else if(!rm3.matches)start3();});
  window.addEventListener('resize',function(){resize3();});
  resize3();
  if(!rm3.matches)start3();
})();

/* ── 11. Fio de execução v3 — sticky scroll ──────────────── */
/* ── SOBRE v2: counters + reveal ─────────────────────────────
   SUBSTITUIR os blocos "11. Fio de execução" e "12. Contadores"
   existentes no script.js por este bloco.
   O reveal do #sobre agora é feito aqui, independentemente do fio.
   ──────────────────────────────────────────────────────────── */

/* ── 11. Fio de execução v3 — sticky scroll ─────────────── */
(function () {
  'use strict';

  var scroller = document.querySelector('.thread__scroller');
  var canvas   = document.getElementById('thread-canvas');
  var svg      = document.getElementById('thread-svg');
  var about    = document.getElementById('sobre');
  if (!scroller || !canvas || !svg) return;

  var svgBase = document.getElementById('tsb');
  var svgFill = document.getElementById('tsf');
  var svgHead = document.getElementById('tsh');
  var wraps   = canvas.querySelectorAll('.thread__node-wrap');
  var rm      = window.matchMedia('(prefers-reduced-motion:reduce)');

  var aboutRevealed = false;
  var lastP         = -1;
  var pending       = false;

  var CX = 0, TOP_Y = 0, BOT_Y = 0, canvasW = 0, canvasH = 0;

  function layout() {
    var cr  = canvas.getBoundingClientRect();
    canvasW = cr.width;
    canvasH = cr.height;
    CX    = canvasW / 2;
    TOP_Y = canvasH * 0.04;
    BOT_Y = canvasH * 0.96;
    svg.setAttribute('viewBox', '0 0 ' + canvasW + ' ' + canvasH);
    setLine(svgBase, CX, TOP_Y, CX, BOT_Y);
    setLine(svgFill, CX, TOP_Y, CX, BOT_Y);
    var len = BOT_Y - TOP_Y;
    svgFill.style.strokeDasharray  = len;
    svgFill.style.strokeDashoffset = len;
    [].forEach.call(wraps, function (w) {
      var at   = parseFloat(w.getAttribute('data-at') || 0);
      var side = w.getAttribute('data-side');
      var nSz  = w.classList.contains('thread__node-wrap--key') ? 20 : 14;
      var y    = TOP_Y + at * (BOT_Y - TOP_Y);
      w.style.top   = y + 'px';
      w.style.left  = '';
      w.style.right = '';
      if (window.innerWidth > 680) {
        if (side === 'left') {
          w.style.right = (canvasW - CX - nSz / 2) + 'px';
          w.style.left  = 'auto';
        } else {
          w.style.left  = (CX - nSz / 2) + 'px';
          w.style.right = 'auto';
        }
      } else {
        w.style.left  = (CX - nSz / 2) + 'px';
        w.style.right = 'auto';
      }
    });
  }

  function setLine(el, x1, y1, x2, y2) {
    el.setAttribute('x1', x1); el.setAttribute('y1', y1);
    el.setAttribute('x2', x2); el.setAttribute('y2', y2);
  }

  function revealAbout() {
    if (aboutRevealed || !about) return;
    aboutRevealed = true;
    about.classList.add('about--reveal');
    /* Inicia os contadores quando o Sobre aparece */
    startCounters();
  }

  function update() {
    pending = false;
    var sr      = scroller.getBoundingClientRect();
    var scrollH = scroller.offsetHeight - (window.innerHeight || 1);
    var p       = -sr.top / scrollH;
    p = p < 0 ? 0 : (p > 1 ? 1 : p);
    if (Math.abs(p - lastP) < 0.001) return;
    lastP = p;
    var len = BOT_Y - TOP_Y;
    svgFill.style.strokeDashoffset = (len * (1 - p));
    var hy = TOP_Y + p * len;
    svgHead.setAttribute('cx', CX);
    svgHead.setAttribute('cy', hy);
    svgHead.style.opacity = p < 0.03 ? '0' : '1';
    var grad = document.getElementById('thread-grad');
    if (grad) { grad.setAttribute('y1', TOP_Y); grad.setAttribute('y2', BOT_Y); }
    [].forEach.call(wraps, function (w) {
      var at = parseFloat(w.getAttribute('data-at') || 0);
      w.classList.toggle('is-lit', p >= at);
    });
    if (p >= 0.995) revealAbout();
  }

  function onScroll() {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }

  if (rm.matches) {
    layout();
    svgFill.style.strokeDashoffset = '0';
    svgHead.style.display = 'none';
    [].forEach.call(wraps, function (w) { w.classList.add('is-lit'); });
    revealAbout();
    return;
  }

  layout();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { layout(); update(); });
  if (rm.addEventListener) rm.addEventListener('change', function (e) {
    if (e.matches) {
      window.removeEventListener('scroll', onScroll);
      layout();
      svgFill.style.strokeDashoffset = '0';
      svgHead.style.display = 'none';
      [].forEach.call(wraps, function (w) { w.classList.add('is-lit'); });
      revealAbout();
    }
  });

})();

/* ── 12. Contadores da secção Sobre v2 ───────────────────── */
/*
  startCounters() é chamado pelo bloco do fio quando o Sobre se revela.
  Também dispara via IntersectionObserver como fallback.
*/
var startCounters = (function () {
  var ran = false;
  var rm  = window.matchMedia('(prefers-reduced-motion:reduce)');

  function animCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    if (rm.matches) { el.textContent = target; return; }
    var dur = 1100, t0 = 0;
    function step(now) {
      if (!t0) t0 = now;
      var p = Math.min((now - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  return function () {
    if (ran) return;
    ran = true;
    var els = document.querySelectorAll('[data-count]');
    [].forEach.call(els, function (el) { animCount(el); });
  };
})();

/* Fallback: se o utilizador navegar directamente para #sobre sem passar pelo fio */
(function () {
  var about = document.getElementById('sobre');
  if (!about || !('IntersectionObserver' in window)) return;
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      about.classList.add('about--reveal');
      startCounters();
      obs.disconnect();
    });
  }, { threshold: 0.05 });
  obs.observe(about);
})();

/* ── 12. Contadores das métricas do Sobre ────────────────── */
(function () {
  var els = document.querySelectorAll('[data-count]');
  if (!els.length || !('IntersectionObserver' in window)) return;

  var rm = window.matchMedia('(prefers-reduced-motion:reduce)');

  function run(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    if (rm.matches) { el.textContent = target; return; }
    var dur = 1300, t0 = 0;
    function step(now) {
      if (!t0) t0 = now;
      var p = Math.min((now - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      run(e.target);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.45 });

  [].forEach.call(els, function (el) {
    el.textContent = '0';
    obs.observe(el);
  });
})();