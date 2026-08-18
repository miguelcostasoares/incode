/* =========================================================
   InCode — script.js v2
   1. Tema  2. Navbar  3. Menu mobile
   4. Entrada  5. Aurora (blobs + estrelas)  6. Partículas orbitais
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var rm = window.matchMedia("(prefers-reduced-motion:reduce)");

  /* ── 1. Tema ──────────────────────────────────────────── */
  var themeBtn = document.getElementById("theme-toggle");

  function theme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function syncLabel() {
    if (!themeBtn) return;
    themeBtn.setAttribute(
      "aria-label",
      "Mudar para tema " + (theme() === "dark" ? "claro" : "escuro"),
    );
  }
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    try {
      localStorage.setItem("incode-theme", t);
    } catch (e) {}
    var mc = document.querySelector('meta[name="theme-color"]');
    if (mc) mc.content = t === "dark" ? "#09090b" : "#f8fafc";
    syncLabel();
    document.dispatchEvent(new CustomEvent("incode:theme", { detail: t }));
  }
  syncLabel();
  if (themeBtn)
    themeBtn.addEventListener("click", function () {
      applyTheme(theme() === "dark" ? "light" : "dark");
    });
  var sysPref = window.matchMedia("(prefers-color-scheme:light)");
  if (sysPref.addEventListener)
    sysPref.addEventListener("change", function (e) {
      try {
        if (!localStorage.getItem("incode-theme"))
          applyTheme(e.matches ? "light" : "dark");
      } catch (x) {}
    });

  /* ── 2. Navbar (scroll gerido por navbar.js) ──────────── */
  var nav = document.getElementById("nav");

  /* Indicador deslizante */
  var navMenu = document.getElementById("nav-menu");
  if (navMenu) {
    var ind = navMenu.querySelector(".nav__indicator");
    var links = navMenu.querySelectorAll(".nav__link");

    function setActive(href) {
      [].forEach.call(links, function (l) {
        var isActive = l.getAttribute("href") === href;
        l.classList.toggle("is-active", isActive);
      });
    }

    function moveInd(el) {
      if (!el || !ind) return;
      ind.style.width = el.offsetWidth + "px";
      ind.style.transform = "translate(" + el.offsetLeft + "px,-50%)";
      ind.classList.add("is-visible");
    }
    function resetInd() {
      var a = navMenu.querySelector(".nav__link.is-active");
      if (a) moveInd(a);
      else if (ind) ind.classList.remove("is-visible");
    }
    [].forEach.call(links, function (l) {
      l.addEventListener("mouseenter", function () {
        moveInd(l);
      });
      l.addEventListener("focus", function () {
        moveInd(l);
      });
    });
    navMenu.addEventListener("mouseleave", resetInd);
    navMenu.addEventListener("focusout", resetInd);
    window.addEventListener("resize", resetInd);
    requestAnimationFrame(resetInd);

    /* ── Link activo via scroll (IntersectionObserver) ── */
    /* Mapeia o href de cada link para a secção correspondente */
    var sectionMap = [];
    [].forEach.call(links, function (l) {
      var href = l.getAttribute("href");
      if (!href || href.charAt(0) !== "#") return;
      var sec = document.querySelector(href);
      if (sec) sectionMap.push({ href: href, el: sec });
    });

    if (sectionMap.length && "IntersectionObserver" in window) {
      /* rootMargin negativo: considera a secção activa quando está
         na zona central do viewport (entre 20% e 60% do topo) */
      var secObs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
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
        },
        {
          rootMargin: "-20% 0px -60% 0px",
          threshold: 0,
        },
      );

      sectionMap.forEach(function (s) {
        secObs.observe(s.el);
      });
    }
  }

  /* ── 3. Menu mobile ───────────────────────────────────── */
  var burger = document.getElementById("burger");
  var mobileM = document.getElementById("mobile-menu");

  function setMenu(open) {
    if (!burger || !mobileM) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (open) {
      mobileM.hidden = false;
      requestAnimationFrame(function () {
        mobileM.classList.add("is-open");
      });
      document.body.style.overflow = "hidden";
    } else {
      mobileM.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(function () {
        if (burger.getAttribute("aria-expanded") === "false")
          mobileM.hidden = true;
      }, 320);
    }
  }
  if (burger)
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
  if (mobileM)
    mobileM.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      burger &&
      burger.getAttribute("aria-expanded") === "true"
    ) {
      setMenu(false);
      burger.focus();
    }
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) setMenu(false);
  });

  /* ── 4. Entrada de conteúdo ───────────────────────────── */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.body.classList.add("is-ready");
    });
  });

  /* ── 5. Aurora background (blobs + estrelas) ──────────── */
  var aCanvas = document.getElementById("aurora");
  var hero = document.getElementById("hero");
  if (!aCanvas || !hero) return;

  var aC = aCanvas.getContext("2d", { alpha: true });
  var aW = 0,
    aH = 0,
    aDpr = 1;
  var aRaf = null,
    aRunning = false,
    aT0 = performance.now();

  /* Paleta dos blobs por tema */
  var BLOBS_DARK = [
    {
      cx: 0.72,
      cy: 0.22,
      rx: 0.42,
      ry: 0.38,
      color: "rgba(0,71,255,",
      alpha: 0.28,
      speed: 0.00018,
      amp: 0.09,
    },
    {
      cx: 0.18,
      cy: 0.72,
      rx: 0.36,
      ry: 0.32,
      color: "rgba(139,92,246,",
      alpha: 0.22,
      speed: 0.00014,
      amp: 0.11,
      phase: 2.1,
    },
    {
      cx: 0.6,
      cy: 0.78,
      rx: 0.3,
      ry: 0.28,
      color: "rgba(0,240,255,",
      alpha: 0.16,
      speed: 0.00022,
      amp: 0.08,
      phase: 4.2,
    },
    {
      cx: 0.1,
      cy: 0.3,
      rx: 0.28,
      ry: 0.26,
      color: "rgba(236,72,153,",
      alpha: 0.14,
      speed: 0.00016,
      amp: 0.07,
      phase: 1.4,
    },
    {
      cx: 0.85,
      cy: 0.6,
      rx: 0.25,
      ry: 0.23,
      color: "rgba(59,130,246,",
      alpha: 0.16,
      speed: 0.0002,
      amp: 0.09,
      phase: 3.8,
    },
  ];
  var BLOBS_LIGHT = [
    {
      cx: 0.72,
      cy: 0.22,
      rx: 0.42,
      ry: 0.38,
      color: "rgba(0,71,255,",
      alpha: 0.11,
      speed: 0.00018,
      amp: 0.09,
    },
    {
      cx: 0.18,
      cy: 0.72,
      rx: 0.36,
      ry: 0.32,
      color: "rgba(139,92,246,",
      alpha: 0.09,
      speed: 0.00014,
      amp: 0.11,
      phase: 2.1,
    },
    {
      cx: 0.6,
      cy: 0.78,
      rx: 0.3,
      ry: 0.28,
      color: "rgba(0,200,255,",
      alpha: 0.1,
      speed: 0.00022,
      amp: 0.08,
      phase: 4.2,
    },
    {
      cx: 0.1,
      cy: 0.3,
      rx: 0.28,
      ry: 0.26,
      color: "rgba(236,72,153,",
      alpha: 0.07,
      speed: 0.00016,
      amp: 0.07,
      phase: 1.4,
    },
    {
      cx: 0.85,
      cy: 0.6,
      rx: 0.25,
      ry: 0.23,
      color: "rgba(59,130,246,",
      alpha: 0.08,
      speed: 0.0002,
      amp: 0.09,
      phase: 3.8,
    },
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
    aCanvas.width = Math.round(aW * aDpr);
    aCanvas.height = Math.round(aH * aDpr);
    aCanvas.style.width = aW + "px";
    aCanvas.style.height = aH + "px";
    aC.setTransform(aDpr, 0, 0, aDpr, 0, 0);
  }

  function aFrame(now) {
    var t = now - aT0;
    var dark = theme() === "dark";
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
      grd.addColorStop(0, b.color + b.alpha + ")");
      grd.addColorStop(0.5, b.color + b.alpha * 0.45 + ")");
      grd.addColorStop(1, b.color + "0)");

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
      aC.fillStyle = dark ? "#ffffff" : "#0047ff";
      aC.beginPath();
      aC.arc(s.x * aW, s.y * aH, s.r, 0, Math.PI * 2);
      aC.fill();
    }
    aC.globalAlpha = 1;

    aRaf = requestAnimationFrame(aFrame);
  }

  function aStart() {
    if (aRunning || rm.matches) return;
    aRunning = true;
    aT0 = performance.now() - 1;
    aRaf = requestAnimationFrame(aFrame);
  }
  function aStop() {
    aRunning = false;
    if (aRaf) cancelAnimationFrame(aRaf);
    aRaf = null;
  }
  function aStatic() {
    aResize();
    var dark = theme() === "dark";
    var blobs = dark ? BLOBS_DARK : BLOBS_LIGHT;
    aC.clearRect(0, 0, aW, aH);
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      var cx = b.cx * aW,
        cy = b.cy * aH;
      var rx = b.rx * aW,
        ry = b.ry * aH;
      var g = aC.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      g.addColorStop(0, b.color + b.alpha + ")");
      g.addColorStop(0.5, b.color + b.alpha * 0.4 + ")");
      g.addColorStop(1, b.color + "0)");
      aC.save();
      aC.translate(cx, cy);
      aC.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
      aC.translate(-cx, -cy);
      aC.fillStyle = g;
      aC.beginPath();
      aC.arc(cx, cy, Math.max(rx, ry), 0, Math.PI * 2);
      aC.fill();
      aC.restore();
    }
  }

  var aResizeT;
  window.addEventListener("resize", function () {
    clearTimeout(aResizeT);
    aResizeT = setTimeout(function () {
      aResize();
      if (rm.matches) aStatic();
    }, 160);
  });
  document.addEventListener("incode:theme", function () {
    if (rm.matches) aStatic();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) aStop();
    else if (!rm.matches) aStart();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) aStart();
          else aStop();
        });
      },
      { threshold: 0.01 },
    ).observe(hero);
  }
  if (rm.addEventListener)
    rm.addEventListener("change", function (e) {
      if (e.matches) {
        aStop();
        aStatic();
      } else aStart();
    });

  aResize();
  if (rm.matches) aStatic();
  else aStart();

  /* ── 6. Partículas orbitais em torno da logo ──────────── */
  var oCanvas = document.getElementById("orbit-canvas");
  if (!oCanvas) return;
  var oC = oCanvas.getContext("2d", { alpha: true });
  var oDpr = Math.min(window.devicePixelRatio || 1, 2);
  var oSize = 0; /* calculado via resize */
  var oRaf = null,
    oT0 = performance.now();

  /* Raios correspondem exactamente aos anéis CSS: 72%, 88%, 100% do visual */
  /* O canvas ocupa 100% do .hero__visual, logo os raios são fracções de oSize/2 */
  var RING_R = [0.36, 0.44, 0.5]; /* 72%/2, 88%/2, 100%/2 */

  var PARTICLES = [];
  (function buildParticles() {
    var counts = [6, 4, 3];
    for (var ring = 0; ring < 3; ring++) {
      for (var k = 0; k < counts[ring]; k++) {
        PARTICLES.push({
          ring: ring,
          rFrac: RING_R[ring] /* fracção de (oSize/2) */,
          angle: (k / counts[ring]) * Math.PI * 2 + ring * 0.8,
          speed:
            (ring === 0 ? 0.5 : ring === 1 ? -0.31 : 0.2) *
            (Math.random() * 0.3 + 0.85),
          size: 1.8 + ring * 0.55,
        });
      }
    }
  })();

  function oResize() {
    var parent = oCanvas.parentElement;
    if (!parent) return;
    var rect = parent.getBoundingClientRect();
    oDpr = Math.min(window.devicePixelRatio || 1, 2);
    oSize = Math.max(rect.width, rect.height, 100);
    oCanvas.width = Math.round(oSize * oDpr);
    oCanvas.height = Math.round(oSize * oDpr);
    oCanvas.style.width = oSize + "px";
    oCanvas.style.height = oSize + "px";
    oC.setTransform(oDpr, 0, 0, oDpr, 0, 0);
  }

  function oFrame(now) {
    var t = now - oT0;
    var dark = theme() === "dark";
    var half = oSize / 2;
    oC.clearRect(0, 0, oSize, oSize);

    for (var i = 0; i < PARTICLES.length; i++) {
      var p = PARTICLES[i];
      var ang = p.angle + t * p.speed * 0.001;
      var r = p.rFrac * oSize; /* raio real em px */
      var px = half + Math.cos(ang) * r;
      var py = half + Math.sin(ang) * r;
      var sz = p.size * (oSize / 420); /* escala ao tamanho real */

      var col = dark
        ? p.ring === 0
          ? "rgba(0,240,255,"
          : p.ring === 1
            ? "rgba(0,71,255,"
            : "rgba(139,92,246,"
        : p.ring === 0
          ? "rgba(0,71,255,"
          : p.ring === 1
            ? "rgba(0,120,255,"
            : "rgba(139,92,246,";
      var ao = dark ? [0.92, 0.68, 0.48][p.ring] : [0.72, 0.52, 0.38][p.ring];

      /* Halo */
      var hg = oC.createRadialGradient(px, py, 0, px, py, sz * 4.5);
      hg.addColorStop(0, col + ao * 0.55 + ")");
      hg.addColorStop(1, col + "0)");
      oC.fillStyle = hg;
      oC.beginPath();
      oC.arc(px, py, sz * 4.5, 0, Math.PI * 2);
      oC.fill();

      /* Núcleo */
      oC.fillStyle = col + ao + ")";
      oC.beginPath();
      oC.arc(px, py, sz, 0, Math.PI * 2);
      oC.fill();
    }
    oRaf = requestAnimationFrame(oFrame);
  }

  oResize();
  var oResizeT;
  window.addEventListener("resize", function () {
    clearTimeout(oResizeT);
    oResizeT = setTimeout(oResize, 120);
  });

  if (!rm.matches) {
    oT0 = performance.now() - 1;
    oRaf = requestAnimationFrame(oFrame);
  }
  document.addEventListener("incode:theme", function () {
    /* cores re-renderizadas no próximo frame */
  });
  document.addEventListener("visibilitychange", function () {
    if (!rm.matches) {
      if (document.hidden && oRaf) {
        cancelAnimationFrame(oRaf);
        oRaf = null;
      } else if (!oRaf) {
        oT0 = performance.now() - 1;
        oRaf = requestAnimationFrame(oFrame);
      }
    }
  });
})();

/* ── 7. Aurora da secção Produtos ─────────────────────────── */
/* ── 7. Aurora da secção Produtos ─────────────────────────── */
(function () {
  var c2 = document.getElementById("aurora-products");
  var sec = document.getElementById("produtos");
  if (!c2 || !sec) return;
  var ctx2 = c2.getContext("2d", { alpha: true });
  var w2 = 0,
    h2 = 0,
    dpr2 = 1,
    raf2 = null,
    t02 = performance.now(),
    run2 = false;

  /* Blobs mais ricos e distribuídos — cobre toda a área vertical da secção */
  var BLOBS2_DARK = [
    {
      cx: 0.22,
      cy: 0.18,
      rx: 0.45,
      ry: 0.38,
      color: "rgba(0,71,255,",
      alpha: 0.26,
      speed: 0.00016,
      amp: 0.1,
    },
    {
      cx: 0.78,
      cy: 0.55,
      rx: 0.42,
      ry: 0.36,
      color: "rgba(139,92,246,",
      alpha: 0.24,
      speed: 0.00019,
      amp: 0.09,
      phase: 2.2,
    },
    {
      cx: 0.5,
      cy: 0.85,
      rx: 0.38,
      ry: 0.32,
      color: "rgba(0,240,255,",
      alpha: 0.18,
      speed: 0.00023,
      amp: 0.08,
      phase: 3.8,
    },
    {
      cx: 0.12,
      cy: 0.7,
      rx: 0.32,
      ry: 0.28,
      color: "rgba(236,72,153,",
      alpha: 0.15,
      speed: 0.00017,
      amp: 0.09,
      phase: 1.1,
    },
    {
      cx: 0.88,
      cy: 0.25,
      rx: 0.3,
      ry: 0.26,
      color: "rgba(0,120,255,",
      alpha: 0.17,
      speed: 0.00021,
      amp: 0.07,
      phase: 5.0,
    },
    {
      cx: 0.55,
      cy: 0.42,
      rx: 0.28,
      ry: 0.24,
      color: "rgba(139,92,246,",
      alpha: 0.13,
      speed: 0.00014,
      amp: 0.06,
      phase: 0.7,
    },
  ];
  var BLOBS2_LIGHT = BLOBS2_DARK.map(function (b) {
    return Object.assign({}, b, { alpha: b.alpha * 0.38 });
  });

  function th2() {
    return document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark";
  }

  function resize2() {
    var r = sec.getBoundingClientRect();
    dpr2 = Math.min(window.devicePixelRatio || 1, 2);
    w2 = Math.max(r.width, 1);
    h2 = Math.max(r.height, 1);
    c2.width = Math.round(w2 * dpr2);
    c2.height = Math.round(h2 * dpr2);
    c2.style.width = w2 + "px";
    c2.style.height = h2 + "px";
    ctx2.setTransform(dpr2, 0, 0, dpr2, 0, 0);
  }

  function frame2(now) {
    var t = now - t02;
    var blobs = th2() === "dark" ? BLOBS2_DARK : BLOBS2_LIGHT;
    ctx2.clearRect(0, 0, w2, h2);
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i],
        ph = b.phase || 0;
      var cx = (b.cx + Math.sin(t * b.speed + ph) * b.amp) * w2;
      var cy = (b.cy + Math.cos(t * b.speed * 0.87 + ph) * b.amp) * h2;
      var rx = b.rx * w2,
        ry = b.ry * h2,
        mx = Math.max(rx, ry);
      var g = ctx2.createRadialGradient(cx, cy, 0, cx, cy, mx);
      g.addColorStop(0, b.color + b.alpha + ")");
      g.addColorStop(0.5, b.color + b.alpha * 0.4 + ")");
      g.addColorStop(1, b.color + "0)");
      ctx2.save();
      ctx2.translate(cx, cy);
      ctx2.scale(rx / mx, ry / mx);
      ctx2.translate(-cx, -cy);
      ctx2.fillStyle = g;
      ctx2.beginPath();
      ctx2.arc(cx, cy, mx, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.restore();
    }
    raf2 = requestAnimationFrame(frame2);
  }

  function start2() {
    if (run2) return;
    run2 = true;
    t02 = performance.now() - 1;
    raf2 = requestAnimationFrame(frame2);
  }
  function stop2() {
    run2 = false;
    if (raf2) {
      cancelAnimationFrame(raf2);
      raf2 = null;
    }
  }

  var rm2 = window.matchMedia("(prefers-reduced-motion:reduce)");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) start2();
          else stop2();
        });
      },
      { threshold: 0.02 },
    ).observe(sec);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop2();
    else if (!rm2.matches) start2();
  });
  window.addEventListener("resize", function () {
    resize2();
  });
  resize2();
  if (!rm2.matches) start2();
})();

/* ── 8. IntersectionObserver para [data-reveal-section] ──── */
(function () {
  var els = document.querySelectorAll("[data-reveal-section]");
  if (!els.length) return;
  var rm = window.matchMedia("(prefers-reduced-motion:reduce)");
  if (rm.matches) {
    [].forEach.call(els, function (el) {
      el.classList.add("is-visible");
    });
    return;
  }
  var obs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  [].forEach.call(els, function (el) {
    obs.observe(el);
  });
})();

/* ── 9. Paralaxe suave na logo-showcase ao mover o rato ──── */
(function () {
  var showcase = document.querySelector(".logo-showcase");
  if (!showcase) return;
  var rm = window.matchMedia("(prefers-reduced-motion:reduce)");
  var tx = 0,
    ty = 0,
    cx = -12,
    cy = 5,
    raf = null;
  document.addEventListener(
    "pointermove",
    function (e) {
      if (rm.matches) return;
      cx = (e.clientX / window.innerWidth - 0.5) * -18;
      cy = (e.clientY / window.innerHeight - 0.5) * 10;
    },
    { passive: true },
  );
  function tick() {
    tx += (cx - tx) * 0.05;
    ty += (cy - ty) * 0.05;
    showcase.style.transform =
      "rotateY(" + (-12 + tx) + "deg) rotateX(" + (5 + ty) + "deg)";
    raf = requestAnimationFrame(tick);
  }
  if (!rm.matches) tick();
})();

/* ── 10. Aurora da secção Sobre ───────────────────────────── */
(function () {
  var c3 = document.getElementById("aurora-about");
  var sec = document.getElementById("sobre");
  if (!c3 || !sec) return;
  var ctx3 = c3.getContext("2d", { alpha: true });
  var w3 = 0,
    h3 = 0,
    dpr3 = 1,
    raf3 = null,
    t03 = performance.now(),
    run3 = false;

  var BLOBS3_DARK = [
    {
      cx: 0.12,
      cy: 0.35,
      rx: 0.4,
      ry: 0.35,
      color: "rgba(0,71,255,",
      alpha: 0.2,
      speed: 0.00015,
      amp: 0.09,
    },
    {
      cx: 0.8,
      cy: 0.6,
      rx: 0.38,
      ry: 0.32,
      color: "rgba(139,92,246,",
      alpha: 0.18,
      speed: 0.00018,
      amp: 0.1,
      phase: 2.4,
    },
    {
      cx: 0.5,
      cy: 0.1,
      rx: 0.3,
      ry: 0.28,
      color: "rgba(0,240,255,",
      alpha: 0.13,
      speed: 0.00021,
      amp: 0.07,
      phase: 4.0,
    },
    {
      cx: 0.85,
      cy: 0.2,
      rx: 0.28,
      ry: 0.25,
      color: "rgba(236,72,153,",
      alpha: 0.11,
      speed: 0.00016,
      amp: 0.08,
      phase: 1.2,
    },
  ];
  var BLOBS3_LIGHT = BLOBS3_DARK.map(function (b) {
    return Object.assign({}, b, { alpha: b.alpha * 0.4 });
  });

  function th3() {
    return document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark";
  }

  function resize3() {
    var r = sec.getBoundingClientRect();
    dpr3 = Math.min(window.devicePixelRatio || 1, 2);
    w3 = Math.max(r.width, 1);
    h3 = Math.max(r.height, 1);
    c3.width = Math.round(w3 * dpr3);
    c3.height = Math.round(h3 * dpr3);
    c3.style.width = w3 + "px";
    c3.style.height = h3 + "px";
    ctx3.setTransform(dpr3, 0, 0, dpr3, 0, 0);
  }

  function frame3(now) {
    var t = now - t03;
    var blobs = th3() === "dark" ? BLOBS3_DARK : BLOBS3_LIGHT;
    ctx3.clearRect(0, 0, w3, h3);
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i],
        ph = b.phase || 0;
      var cx = (b.cx + Math.sin(t * b.speed + ph) * b.amp) * w3;
      var cy = (b.cy + Math.cos(t * b.speed * 0.87 + ph) * b.amp) * h3;
      var rx = b.rx * w3,
        ry = b.ry * h3,
        mx = Math.max(rx, ry);
      var g = ctx3.createRadialGradient(cx, cy, 0, cx, cy, mx);
      g.addColorStop(0, b.color + b.alpha + ")");
      g.addColorStop(0.5, b.color + b.alpha * 0.4 + ")");
      g.addColorStop(1, b.color + "0)");
      ctx3.save();
      ctx3.translate(cx, cy);
      ctx3.scale(rx / mx, ry / mx);
      ctx3.translate(-cx, -cy);
      ctx3.fillStyle = g;
      ctx3.beginPath();
      ctx3.arc(cx, cy, mx, 0, Math.PI * 2);
      ctx3.fill();
      ctx3.restore();
    }
    raf3 = requestAnimationFrame(frame3);
  }

  function start3() {
    if (run3) return;
    run3 = true;
    t03 = performance.now() - 1;
    raf3 = requestAnimationFrame(frame3);
  }
  function stop3() {
    run3 = false;
    if (raf3) {
      cancelAnimationFrame(raf3);
      raf3 = null;
    }
  }

  var rm3 = window.matchMedia("(prefers-reduced-motion:reduce)");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) start3();
          else stop3();
        });
      },
      { threshold: 0.02 },
    ).observe(sec);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop3();
    else if (!rm3.matches) start3();
  });
  window.addEventListener("resize", function () {
    resize3();
  });
  resize3();
  if (!rm3.matches) start3();
})();

/* ── 11. Fio de execução v3 — sticky scroll ──────────────── */
/* ── SOBRE v2: counters + reveal ─────────────────────────────
   SUBSTITUIR os blocos "11. Fio de execução" e "12. Contadores"
   existentes no script.js por este bloco.
   O reveal do #sobre agora é feito aqui, independentemente do fio.
   ──────────────────────────────────────────────────────────── */

/* ── 11. Fio de execução v3 — sticky scroll ─────────────── */
(function () {
  "use strict";

  var scroller = document.querySelector(".thread__scroller");
  var canvas = document.getElementById("thread-canvas");
  var svg = document.getElementById("thread-svg");
  var about = document.getElementById("sobre");
  if (!scroller || !canvas || !svg) return;

  var svgBase = document.getElementById("tsb");
  var svgFill = document.getElementById("tsf");
  var svgHead = document.getElementById("tsh");
  var wraps = canvas.querySelectorAll(".thread__node-wrap");
  var rm = window.matchMedia("(prefers-reduced-motion:reduce)");

  var aboutRevealed = false;
  var pending = false;

  /* Progresso monotónico: só avança, nunca recua.
     Quando chega ao fim, a animação é travada no estado final
     e o listener de scroll é removido — não volta a correr. */
  var maxP = 0;
  var locked = false;

  var CX = 0,
    TOP_Y = 0,
    BOT_Y = 0,
    canvasW = 0,
    canvasH = 0;

  function layout() {
    var cr = canvas.getBoundingClientRect();
    canvasW = cr.width;
    canvasH = cr.height;
    CX = window.innerWidth <= 680 ? canvasW * 0.08 : canvasW / 2;
    TOP_Y = canvasH * 0.04;
    BOT_Y = canvasH * 0.96;
    svg.setAttribute("viewBox", "0 0 " + canvasW + " " + canvasH);
    setLine(svgBase, CX, TOP_Y, CX, BOT_Y);
    setLine(svgFill, CX, TOP_Y, CX, BOT_Y);
    var len = BOT_Y - TOP_Y;
    svgFill.style.strokeDasharray = len;
    svgFill.style.strokeDashoffset = len;
    [].forEach.call(wraps, function (w) {
      var at = parseFloat(w.getAttribute("data-at") || 0);
      var side = w.getAttribute("data-side");
      var nSz = w.classList.contains("thread__node-wrap--key") ? 20 : 14;
      var y = TOP_Y + at * (BOT_Y - TOP_Y);
      w.style.top = y + "px";
      w.style.left = "";
      w.style.right = "";
      if (window.innerWidth > 680) {
        if (side === "left") {
          w.style.right = canvasW - CX - nSz / 2 + "px";
          w.style.left = "auto";
        } else {
          w.style.left = CX - nSz / 2 + "px";
          w.style.right = "auto";
        }
      } else {
        w.style.left = CX - nSz / 2 + "px";
        w.style.right = "auto";
      }
    });
  }

  function setLine(el, x1, y1, x2, y2) {
    el.setAttribute("x1", x1);
    el.setAttribute("y1", y1);
    el.setAttribute("x2", x2);
    el.setAttribute("y2", y2);
  }

  function revealAbout() {
    if (aboutRevealed || !about) return;
    aboutRevealed = true;
    about.classList.add("about--reveal");
    /* Inicia os contadores quando o Sobre aparece */
    if (typeof startCounters === "function") {
      startCounters();
    }
  }

  /* Desenha o estado correspondente a um progresso p (0→1).
     Os nós só acendem — nunca se apagam. */
  function render(p) {
    var len = BOT_Y - TOP_Y;
    svgFill.style.strokeDashoffset = len * (1 - p);
    var hy = TOP_Y + p * len;
    svgHead.setAttribute("cx", CX);
    svgHead.setAttribute("cy", hy);
    svgHead.style.opacity = p < 0.03 ? "0" : "1";
    var grad = document.getElementById("thread-grad");
    if (grad) {
      grad.setAttribute("y1", TOP_Y);
      grad.setAttribute("y2", BOT_Y);
    }
    [].forEach.call(wraps, function (w) {
      var at = parseFloat(w.getAttribute("data-at") || 0);
      if (p >= at) w.classList.add("is-lit");
    });
  }

  /* Trava a secção no estado final e deixa de escutar o scroll */
  function lock() {
    if (locked) return;
    locked = true;
    maxP = 1;
    window.removeEventListener("scroll", onScroll);
    render(1);
    revealAbout();
  }

  function update() {
    pending = false;
    if (locked) return;
    var sr = scroller.getBoundingClientRect();
    var scrollH = scroller.offsetHeight - (window.innerHeight || 1);
    var p = -sr.top / scrollH;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    /* Ignora qualquer recuo: o fio nunca se desfaz */
    if (p <= maxP + 0.001) return;
    maxP = p;
    render(p);
    if (p >= 0.995) lock();
  }

  function onScroll() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(update);
    }
  }

  if (rm.matches) {
    layout();
    svgFill.style.strokeDashoffset = "0";
    svgHead.style.display = "none";
    [].forEach.call(wraps, function (w) {
      w.classList.add("is-lit");
    });
    revealAbout();
    return;
  }

  layout();
  render(maxP);
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    layout();
    /* layout() repõe a calha a zero — reaplica o progresso já atingido */
    render(maxP);
    update();
  });
  if (rm.addEventListener)
    rm.addEventListener("change", function (e) {
      if (e.matches) {
        window.removeEventListener("scroll", onScroll);
        layout();
        svgFill.style.strokeDashoffset = "0";
        svgHead.style.display = "none";
        [].forEach.call(wraps, function (w) {
          w.classList.add("is-lit");
        });
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
  var rm = window.matchMedia("(prefers-reduced-motion:reduce)");

  function animCount(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    if (rm.matches) {
      el.textContent = target;
      return;
    }
    var dur = 1100,
      t0 = 0;
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
    var els = document.querySelectorAll("[data-count]");
    [].forEach.call(els, function (el) {
      animCount(el);
    });
  };
})();

/* Fallback: se o utilizador navegar directamente para #sobre sem passar pelo fio */
(function () {
  var about = document.getElementById("sobre");
  if (!about || !("IntersectionObserver" in window)) return;
  var obs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        about.classList.add("about--reveal");
        startCounters();
        obs.disconnect();
      });
    },
    { threshold: 0.05 },
  );
  obs.observe(about);
})();

/* ── 12. Contadores das métricas do Sobre ────────────────── */
(function () {
  var els = document.querySelectorAll("[data-count]");
  if (!els.length || !("IntersectionObserver" in window)) return;

  var rm = window.matchMedia("(prefers-reduced-motion:reduce)");

  function run(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    if (rm.matches) {
      el.textContent = target;
      return;
    }
    var dur = 1300,
      t0 = 0;
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

  var obs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        obs.unobserve(e.target);
      });
    },
    { threshold: 0.45 },
  );

  [].forEach.call(els, function (el) {
    el.textContent = "0";
    obs.observe(el);
  });
})();

/* ── 13. Realce deslizante nos princípios do Sobre ───────── */
/*
  Mesma linguagem de interacção do .nav__indicator: um único
  realce que desliza entre os itens em vez de 4 hovers isolados.
  Posição/altura são passadas ao CSS via --my / --mh.
*/
(function () {
  "use strict";

  var list = document.getElementById("about-values");
  if (!list) return;

  var items = list.querySelectorAll(".aval");
  if (!items.length) return;

  function move(el) {
    list.style.setProperty("--my", el.offsetTop + "px");
    list.style.setProperty("--mh", el.offsetHeight + "px");
    list.classList.add("has-marker");
  }
  function clear() {
    list.classList.remove("has-marker");
  }

  [].forEach.call(items, function (el) {
    el.addEventListener(
      "mouseenter",
      function () {
        move(el);
      },
      { passive: true },
    );
  });

  list.addEventListener("mouseleave", clear, { passive: true });
  window.addEventListener("resize", clear, { passive: true });
})();

/* =========================================================
   InCode — Quote Scroll

   Lógica:
   - Injeta cada palavra como um <span class="quote-word">
   - Algumas palavras têm data-accent para receberem o gradiente
   - O progresso de scroll (0→1) determina quantas palavras
     estão iluminadas (is-lit), com um ligeiro stagger
   - A atribuição e a barra de progresso aparecem quando
     todas as palavras estão visíveis (~90% do scroll)
   ========================================================= */
(function () {
  "use strict";

  var section = document.getElementById("quote-scroll");
  var scroller = section && section.querySelector(".quote-scroll__scroller");
  var textEl = document.getElementById("quote-text");
  var footer = document.getElementById("quote-footer");
  var progFill = document.getElementById("quote-progress-fill");
  var progBar = progFill && progFill.parentElement;
  var eyebrow = section && section.querySelector(".quote-scroll__eyebrow");

  if (!section || !scroller || !textEl) return;

  var rm = window.matchMedia("(prefers-reduced-motion:reduce)");

  /* ── 1. Texto da quote ─────────────────────────────────── */
  /* Substitua este texto pelo conteúdo real da quote.
     Palavras com asterisco (*palavra*) recebem o gradiente de destaque. */
  var QUOTE_RAW =
    "Não entregamos apenas *código.* Entregamos *sistemas* em que as pessoas confiam para gerir o que mais *importa* nos seus negócios.";

  /* Parseia o texto e injeta os spans */
  var words = QUOTE_RAW.split(" ");
  var spans = [];

  textEl.innerHTML = "";

  words.forEach(function (word, i) {
    var isAccent = /^\*.*\*$/.test(word);
    var clean = word.replace(/\*/g, "");

    var span = document.createElement("span");
    span.className = "quote-word";
    span.textContent = clean;
    if (isAccent) span.setAttribute("data-accent", "");

    /* Delay escalonado: cada palavra atrasa 28ms a mais */
    span.style.transitionDelay = i * 28 + "ms";

    textEl.appendChild(span);
    spans.push(span);
  });

  /* Modo reduced motion: tudo visível de imediato */
  if (rm.matches) {
    spans.forEach(function (s) {
      s.classList.add("is-lit");
    });
    if (footer) footer.classList.add("is-visible");
    if (eyebrow) eyebrow.classList.add("is-visible");
    if (progBar) progBar.classList.add("is-visible");
    return;
  }

  /* ── 2. Scroll driver ──────────────────────────────────── */
  var pending = false;
  var eyebrowShown = false;
  var footerShown = false;
  var totalWords = spans.length;

  /* Progresso monotónico: só avança, nunca recua.
     No fim, a quote fica travada no estado final. */
  var maxP = 0;
  var locked = false;

  /* Limiar a partir do qual o eyebrow aparece */
  var EYEBROW_AT = 0.04;
  /* Limiar a partir do qual a atribuição e a barra aparecem */
  var FOOTER_AT = 0.88;

  /* Desenha o estado correspondente a um progresso p (0→1).
     As palavras só acendem — nunca se apagam. */
  function render(p) {
    /* Eyebrow */
    if (!eyebrowShown && p >= EYEBROW_AT && eyebrow) {
      eyebrow.classList.add("is-visible");
      eyebrowShown = true;
    }

    /* Barra de progresso */
    if (progFill) progFill.style.width = p * 100 + "%";
    if (progBar && p >= EYEBROW_AT) progBar.classList.add("is-visible");

    /* Palavras: ilumina proporcionalmente ao scroll,
       com uma "janela" que vai de 5% a 85% do progresso total */
    var wordProgress = Math.min(Math.max((p - 0.05) / 0.8, 0), 1);
    var litCount = Math.round(wordProgress * totalWords);

    spans.forEach(function (span, i) {
      if (i < litCount) span.classList.add("is-lit");
    });

    /* Footer / atribuição */
    if (!footerShown && p >= FOOTER_AT) {
      footerShown = true;
      if (footer) footer.classList.add("is-visible");
    }
  }

  /* Trava a quote no estado final e deixa de escutar o scroll */
  function lock() {
    if (locked) return;
    locked = true;
    maxP = 1;
    window.removeEventListener("scroll", onScroll);
    render(1);
  }

  function update() {
    pending = false;
    if (locked) return;
    var sr = scroller.getBoundingClientRect();
    var scrollH = scroller.offsetHeight - window.innerHeight;
    if (scrollH <= 0) return;

    var p = Math.min(Math.max(-sr.top / scrollH, 0), 1);
    /* Ignora qualquer recuo: a quote nunca se apaga */
    if (p <= maxP + 0.001) return;
    maxP = p;
    render(p);
    if (p >= 0.995) lock();
  }

  function onScroll() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update);
  update();

  /* Quando muda de reduced motion em runtime */
  if (rm.addEventListener) {
    rm.addEventListener("change", function (e) {
      if (e.matches) {
        spans.forEach(function (s) {
          s.classList.add("is-lit");
        });
        if (footer) footer.classList.add("is-visible");
        if (eyebrow) eyebrow.classList.add("is-visible");
        if (progBar) progBar.classList.add("is-visible");
        window.removeEventListener("scroll", onScroll);
      }
    });
  }
})();

/* =========================================================
   InCode — About ↔ Stack view toggle + filtros com reflow
   Adicionar ao FINAL de js/script.js
   ========================================================= */
(function () {
  'use strict';

  var viewAbout  = document.getElementById('about-view-about');
  var viewStack  = document.getElementById('about-view-stack');
  var btnShow    = document.getElementById('btn-show-stack');
  var btnHideBar = document.getElementById('btn-hide-stack-bar');
  var section    = document.getElementById('sobre');

  /* Funciona mesmo sem btn-hide-stack (foi removido do topo) */
  if (!viewAbout || !viewStack || !btnShow) return;

  var rm = window.matchMedia('(prefers-reduced-motion:reduce)');
  var DURATION = rm.matches ? 0 : 380;

  /* Estado inicial: stack oculta */
  viewStack.style.opacity       = '0';
  viewStack.style.transform     = 'translateY(16px)';
  viewStack.style.pointerEvents = 'none';
  viewStack.style.position      = 'absolute';
  viewStack.style.inset         = '0';
  viewStack.style.zIndex        = '3';

  viewAbout.style.position = 'relative';
  viewAbout.style.zIndex   = '4';

  /* ── Mostrar stack ───────────────────────────────────── */
  function showStack() {
    var rect = section.getBoundingClientRect();
    var navH = 80;
    if (rect.top < navH) {
      window.scrollTo({ top: window.scrollY + rect.top - navH, behavior: 'smooth' });
    }

    var h = viewAbout.offsetHeight;
    section.style.minHeight = h + 'px';

    viewAbout.style.transition    = 'opacity ' + DURATION + 'ms cubic-bezier(0.16,1,0.3,1), transform ' + DURATION + 'ms cubic-bezier(0.16,1,0.3,1)';
    viewAbout.style.opacity       = '0';
    viewAbout.style.transform     = 'translateY(-12px)';
    viewAbout.style.pointerEvents = 'none';

    setTimeout(function () {
      viewAbout.style.position = 'absolute';
      viewAbout.style.inset    = '0';
      viewAbout.style.zIndex   = '3';
      viewAbout.setAttribute('aria-hidden', 'true');

      viewStack.style.position = 'relative';
      viewStack.style.zIndex   = '4';
      viewStack.setAttribute('aria-hidden', 'false');

      void viewStack.offsetHeight;

      viewStack.style.transition    = 'opacity ' + DURATION + 'ms cubic-bezier(0.16,1,0.3,1), transform ' + DURATION + 'ms cubic-bezier(0.16,1,0.3,1)';
      viewStack.style.opacity       = '1';
      viewStack.style.transform     = 'translateY(0)';
      viewStack.style.pointerEvents = 'auto';

      setTimeout(function () {
        section.style.minHeight = '';
        if (btnHideBar) btnHideBar.focus();

        /* Scroll suave para mostrar filtros e início dos cards */
        var filtersEl = viewStack.querySelector('.stack__filters');
        if (filtersEl) {
          var targetY = window.scrollY + filtersEl.getBoundingClientRect().top - 420;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      }, DURATION);
    }, DURATION);
  }

  /* ── Voltar ao Sobre ─────────────────────────────────── */
  function hideStack() {
    var rect = section.getBoundingClientRect();
    var navH = 80;
    if (rect.top < navH) {
      window.scrollTo({ top: window.scrollY + rect.top - navH, behavior: 'smooth' });
    }

    var h = viewStack.offsetHeight;
    section.style.minHeight = h + 'px';

    viewStack.style.transition    = 'opacity ' + DURATION + 'ms cubic-bezier(0.16,1,0.3,1), transform ' + DURATION + 'ms cubic-bezier(0.16,1,0.3,1)';
    viewStack.style.opacity       = '0';
    viewStack.style.transform     = 'translateY(12px)';
    viewStack.style.pointerEvents = 'none';

    setTimeout(function () {
      viewStack.style.position = 'absolute';
      viewStack.style.inset    = '0';
      viewStack.style.zIndex   = '3';
      viewStack.setAttribute('aria-hidden', 'true');

      viewAbout.style.position  = 'relative';
      viewAbout.style.zIndex    = '4';
      viewAbout.style.transform = 'translateY(12px)';
      viewAbout.setAttribute('aria-hidden', 'false');

      void viewAbout.offsetHeight;

      viewAbout.style.transition    = 'opacity ' + DURATION + 'ms cubic-bezier(0.16,1,0.3,1), transform ' + DURATION + 'ms cubic-bezier(0.16,1,0.3,1)';
      viewAbout.style.opacity       = '1';
      viewAbout.style.transform     = 'translateY(0)';
      viewAbout.style.pointerEvents = 'auto';

      setTimeout(function () {
        section.style.minHeight = '';
        btnShow.focus();
      }, DURATION);
    }, DURATION);
  }

  btnShow.addEventListener('click', showStack);
  if (btnHideBar) btnHideBar.addEventListener('click', hideStack);

  /* ── Abrir a stack a partir de fora da secção ──────────
     Qualquer link com [data-open-stack] (ex.: footer) leva
     o utilizador ao #sobre e abre a view da stack.
     Sem JS, o href="#sobre" continua a funcionar.        */
  function stackIsOpen() {
    return viewStack.getAttribute('aria-hidden') === 'false';
  }

  /* Leva a secção ao topo e só depois corre o callback,
     para a transição não competir com o scroll. */
  function bringSectionIntoView(done) {
    var navH   = 80;
    var target = window.scrollY + section.getBoundingClientRect().top - navH;

    if (rm.matches || Math.abs(window.scrollY - target) < 4) {
      window.scrollTo({ top: target, behavior: 'auto' });
      done();
      return;
    }

    window.scrollTo({ top: target, behavior: 'smooth' });

    var last = -1, still = 0, ticks = 0;
    var timer = setInterval(function () {
      still = (window.scrollY === last) ? still + 1 : 0;
      last  = window.scrollY;
      if (still >= 2 || ++ticks > 40) {
        clearInterval(timer);
        done();
      }
    }, 50);
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target && e.target.closest
      ? e.target.closest('[data-open-stack]')
      : null;
    if (!trigger) return;

    e.preventDefault();
    bringSectionIntoView(function () {
      if (!stackIsOpen()) showStack();
    });
  });

  /* ══════════════════════════════════════════════════════
     FILTROS — reflow real
     ══════════════════════════════════════════════════════ */
  var filters    = viewStack.querySelectorAll('.stack__filter');
  var grid       = viewStack.querySelector('.stack__grid');
  var allCards   = Array.prototype.slice.call(viewStack.querySelectorAll('.scard'));
  var currentCat = 'all';
  var animating  = false;

  function applyFilter(cat) {
    if (cat === currentCat || animating) return;
    animating  = true;
    currentCat = cat;

    [].forEach.call(filters, function (btn) {
      var active = btn.getAttribute('data-filter') === cat;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    var FADE = rm.matches ? 0 : 160;

    allCards.forEach(function (c) {
      /* usa `translate` (e não `transform`) para não colidir com a
         inclinação do card, que vive em transform */
      c.style.transition = 'opacity ' + FADE + 'ms ease, translate ' + FADE + 'ms ease';
      c.style.opacity    = '0';
      c.style.translate  = '0 6px';
    });

    setTimeout(function () {
      var visible = allCards.filter(function (c) {
        return cat === 'all' || c.getAttribute('data-cat') === cat;
      });
      var hidden = allCards.filter(function (c) {
        return cat !== 'all' && c.getAttribute('data-cat') !== cat;
      });

      allCards.forEach(function (c) {
        if (c.parentNode === grid) grid.removeChild(c);
      });

      visible.forEach(function (c) {
        c.style.display = '';
        grid.appendChild(c);
      });
      hidden.forEach(function (c) {
        c.style.display = 'none';
        grid.appendChild(c);
      });

      void grid.offsetHeight;

      visible.forEach(function (c, i) {
        c.style.transition = 'opacity 280ms ' + (i * 40) + 'ms cubic-bezier(0.16,1,0.3,1), translate 280ms ' + (i * 40) + 'ms cubic-bezier(0.16,1,0.3,1)';
        c.style.opacity    = '1';
        c.style.translate  = '0 0';
      });

      setTimeout(function () { animating = false; }, (visible.length - 1) * 40 + 280);
    }, FADE + 10);
  }

  [].forEach.call(filters, function (btn) {
    btn.addEventListener('click', function () {
      applyFilter(btn.getAttribute('data-filter'));
    });
    btn.addEventListener('keydown', function (e) {
      var arr = Array.prototype.slice.call(filters);
      var idx = arr.indexOf(btn);
      var next = null;
      if (e.key === 'ArrowRight') next = arr[(idx + 1) % arr.length];
      if (e.key === 'ArrowLeft')  next = arr[(idx - 1 + arr.length) % arr.length];
      if (next) { next.focus(); applyFilter(next.getAttribute('data-filter')); e.preventDefault(); }
    });
  });

})();



/* ── Produtos — showcase interativo com autoplay (v2 fixed) ─ */
(function () {
  "use strict";

  var showcase = document.getElementById("pshowcase");
  if (!showcase) return;

  var panelWrapper = document.getElementById("pshowcase-panel");
  var navBtns = showcase.querySelectorAll(".psnav__item");
  var panels = showcase.querySelectorAll(".pspanel");
  var dots = document.querySelectorAll(".products__dot");
  var rm = window.matchMedia("(prefers-reduced-motion:reduce)");

  var AUTOPLAY_MS = 6000;
  var current = 0;
  var progressRaf = null;
  var progressStart = null;
  var userPaused = false;

  /* ── Utilitários ─────────────────────────────────────────── */
  function stopProgress() {
    if (progressRaf) {
      cancelAnimationFrame(progressRaf);
      progressRaf = null;
    }
    progressStart = null;
  }

  function resetAllFills() {
    [].forEach.call(navBtns, function (btn) {
      var fill = btn.querySelector(".psnav__progress-fill");
      if (fill) fill.style.width = "0%";
    });
  }

  /* ── Mostrar painel pelo índice ──────────────────────────── */
  function showPanel(idx) {
    [].forEach.call(panels, function (p, i) {
      var isTarget = i === idx;
      /* Sempre remove a animação antes para poder re-disparar */
      p.style.animation = "none";
      p.style.display = "none";
      p.setAttribute("aria-hidden", "true");

      if (isTarget) {
        p.style.display = "block";
        /* Força reflow — necessário para a animação CSS re-disparar */
        void p.offsetHeight;
        if (!rm.matches) {
          p.style.animation =
            "pspanel-in 400ms cubic-bezier(0.16,1,0.3,1) both";
        } else {
          p.style.animation = "";
        }
        p.setAttribute("aria-hidden", "false");
      }
    });
  }

  /* ── Navegar para o índice ───────────────────────────────── */
  function goTo(idx, fromAutoplay) {
    if (idx === current && !fromAutoplay) return;

    stopProgress();
    resetAllFills();

    current = idx;

    /* Atualiza botões de nav */
    [].forEach.call(navBtns, function (btn, i) {
      var active = i === idx;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });

    /* Atualiza dots */
    [].forEach.call(dots, function (dot, i) {
      dot.classList.toggle("is-active", i === idx);
    });

    /* Atualiza borda colorida do wrapper */
    if (panelWrapper) panelWrapper.setAttribute("data-active", String(idx));

    /* Troca o painel visível */
    showPanel(idx);

    /* Reinicia autoplay se não estiver pausado */
    if (!userPaused && !rm.matches) {
      startProgress(navBtns[current]);
    }
  }

  /* ── Autoplay ────────────────────────────────────────────── */
  function startProgress(btn) {
    stopProgress();
    if (rm.matches || userPaused) return;
    var fill = btn && btn.querySelector(".psnav__progress-fill");
    if (!fill) return;
    fill.style.width = "0%";
    progressStart = performance.now();

    (function tick(now) {
      var pct = Math.min(((now - progressStart) / AUTOPLAY_MS) * 100, 100);
      fill.style.width = pct + "%";
      if (pct < 100) {
        progressRaf = requestAnimationFrame(tick);
      } else {
        goTo((current + 1) % navBtns.length, true);
      }
    })(performance.now());
  }

  /* ── Eventos dos botões de nav ───────────────────────────── */
  [].forEach.call(navBtns, function (btn, i) {
    btn.addEventListener("click", function () {
      userPaused = false;
      goTo(i, false);
    });
    btn.addEventListener("keydown", function (e) {
      var arr = Array.prototype.slice.call(navBtns);
      var cur = arr.indexOf(btn);
      var target = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight")
        target = arr[(cur + 1) % arr.length];
      if (e.key === "ArrowUp" || e.key === "ArrowLeft")
        target = arr[(cur - 1 + arr.length) % arr.length];
      if (target) {
        target.focus();
        target.click();
        e.preventDefault();
      }
    });
  });

  /* ── Eventos dos dots ────────────────────────────────────── */
  [].forEach.call(dots, function (dot, i) {
    dot.style.cursor = "pointer";
    dot.addEventListener("click", function () {
      userPaused = false;
      goTo(i, false);
    });
  });

  /* ── Pausar/retomar autoplay ─────────────────────────────── */
  function pause() {
    userPaused = true;
    stopProgress();
  }
  function resume() {
    userPaused = false;
    if (!rm.matches) startProgress(navBtns[current]);
  }

  if (panelWrapper) {
    panelWrapper.addEventListener("mouseenter", pause);
    panelWrapper.addEventListener("mouseleave", resume);
    panelWrapper.addEventListener("focusin", pause);
    panelWrapper.addEventListener("focusout", resume);
  }

  var navEl = showcase.querySelector(".pshowcase__nav");
  if (navEl) {
    navEl.addEventListener("mouseenter", pause);
    navEl.addEventListener("mouseleave", resume);
  }

  /* ── Swipe mobile ────────────────────────────────────────── */
  var touchX = 0;
  if (panelWrapper) {
    panelWrapper.addEventListener(
      "touchstart",
      function (e) {
        touchX = e.changedTouches[0].clientX;
      },
      { passive: true },
    );
    panelWrapper.addEventListener(
      "touchend",
      function (e) {
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) {
          userPaused = false;
          goTo(
            dx < 0
              ? (current + 1) % navBtns.length
              : (current - 1 + navBtns.length) % navBtns.length,
            false,
          );
        }
      },
      { passive: true },
    );
  }

  /* ── Visibilidade da aba ─────────────────────────────────── */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stopProgress();
    } else if (!rm.matches && !userPaused) {
      startProgress(navBtns[current]);
    }
  });

  /* ── Inicialização ───────────────────────────────────────── */
  /* Garante estado limpo independente do CSS/HTML inicial */
  showPanel(0);
  [].forEach.call(navBtns, function (btn, i) {
    btn.classList.toggle("is-active", i === 0);
    btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
  });
  [].forEach.call(dots, function (dot, i) {
    dot.classList.toggle("is-active", i === 0);
  });
  if (panelWrapper) panelWrapper.setAttribute("data-active", "0");

  if (!rm.matches) startProgress(navBtns[0]);
})();


/* ── Produtos — animação de surgimento via IntersectionObserver ── */
/*
  Sem paralaxe de mouse. O mockup surge com inclinação 3D + float
  suave contínuo, totalmente via CSS. O JS apenas garante que a
  animação re-dispara cada vez que o painel se torna visível e que
  o surgimento ocorre quando a secção entra na viewport.
*/
(function () {
  "use strict";

  var rm = window.matchMedia("(prefers-reduced-motion:reduce)");

  /* ── Re-dispara animação ao trocar de painel ──────────────── */
  /* O showcase JS já faz isso via aria-hidden; aqui garantimos
     que o .pspanel__mockup também reinicia o float ao aparecer */
  var showcase = document.getElementById("pshowcase");
  if (!showcase) return;

  var panels = showcase.querySelectorAll(".pspanel");

  function resetMockupAnim(panel) {
    if (rm.matches) return;
    var mockup = panel.querySelector(".pspanel__mockup");
    var emerge = panel.querySelector(".pspanel__mockup-emerge");
    if (emerge) {
      emerge.style.animation = "none";
      emerge.style.opacity = "0";
      void emerge.offsetHeight; /* força reflow */
      emerge.style.animation = "";
      emerge.style.opacity = "";
    }
    if (mockup) {
      mockup.style.animation = "none";
      void mockup.offsetHeight; /* força reflow */
      mockup.style.animation = "";
    }
  }

  /* Observa mudanças de aria-hidden nos painéis */
  var mo = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      if (m.type === "attributes" && m.attributeName === "aria-hidden") {
        var panel = m.target;
        if (panel.getAttribute("aria-hidden") === "false") {
          resetMockupAnim(panel);
        }
      }
    });
  });

  [].forEach.call(panels, function (p) {
    mo.observe(p, { attributes: true });
  });

  /* ── Surge ao entrar na viewport pela primeira vez ────────── */
  if (!("IntersectionObserver" in window)) return;

  var section = document.getElementById("produtos");
  if (!section) return;

  var triggered = false;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !triggered) {
        triggered = true;
        /* Pequeno delay para deixar o scroll assentar */
        setTimeout(function () {
          var activePanel = showcase.querySelector(".pspanel[aria-hidden='false']");
          if (activePanel) resetMockupAnim(activePanel);
        }, 80);
        io.disconnect();
      }
    });
  }, { threshold: 0.15 });

  io.observe(section);
})();

/* ── 7b. Aurora da secção Serviços ────────────────────────── */
(function () {
  var c3 = document.getElementById("aurora-services");
  var sec = document.getElementById("servicos");
  if (!c3 || !sec) return;
  var ctx3 = c3.getContext("2d", { alpha: true });
  var w3 = 0,
    h3 = 0,
    dpr3 = 1,
    raf3 = null,
    t03 = performance.now(),
    run3 = false;

  var BLOBS3_DARK = [
    { cx: 0.18, cy: 0.22, rx: 0.4,  ry: 0.34, color: "rgba(139,92,246,", alpha: 0.22, speed: 0.00015, amp: 0.09 },
    { cx: 0.82, cy: 0.35, rx: 0.38, ry: 0.32, color: "rgba(0,71,255,",   alpha: 0.24, speed: 0.00018, amp: 0.08, phase: 2.6 },
    { cx: 0.45, cy: 0.82, rx: 0.36, ry: 0.3,  color: "rgba(236,72,153,",alpha: 0.16, speed: 0.0002,  amp: 0.07, phase: 4.1 },
    { cx: 0.85, cy: 0.85, rx: 0.3,  ry: 0.26, color: "rgba(0,240,255,", alpha: 0.14, speed: 0.00016, amp: 0.06, phase: 1.4 },
  ];
  var BLOBS3_LIGHT = BLOBS3_DARK.map(function (b) {
    return Object.assign({}, b, { alpha: b.alpha * 0.38 });
  });

  function th3() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function resize3() {
    var r = sec.getBoundingClientRect();
    dpr3 = Math.min(window.devicePixelRatio || 1, 2);
    w3 = Math.max(r.width, 1);
    h3 = Math.max(r.height, 1);
    c3.width = Math.round(w3 * dpr3);
    c3.height = Math.round(h3 * dpr3);
    c3.style.width = w3 + "px";
    c3.style.height = h3 + "px";
    ctx3.setTransform(dpr3, 0, 0, dpr3, 0, 0);
  }

  function frame3(now) {
    var t = now - t03;
    var blobs = th3() === "dark" ? BLOBS3_DARK : BLOBS3_LIGHT;
    ctx3.clearRect(0, 0, w3, h3);
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i], ph = b.phase || 0;
      var cx = (b.cx + Math.sin(t * b.speed + ph) * b.amp) * w3;
      var cy = (b.cy + Math.cos(t * b.speed * 0.87 + ph) * b.amp) * h3;
      var rx = b.rx * w3, ry = b.ry * h3, mx = Math.max(rx, ry);
      var g = ctx3.createRadialGradient(cx, cy, 0, cx, cy, mx);
      g.addColorStop(0, b.color + b.alpha + ")");
      g.addColorStop(0.5, b.color + b.alpha * 0.4 + ")");
      g.addColorStop(1, b.color + "0)");
      ctx3.save();
      ctx3.translate(cx, cy);
      ctx3.scale(rx / mx, ry / mx);
      ctx3.translate(-cx, -cy);
      ctx3.fillStyle = g;
      ctx3.beginPath();
      ctx3.arc(cx, cy, mx, 0, Math.PI * 2);
      ctx3.fill();
      ctx3.restore();
    }
    raf3 = requestAnimationFrame(frame3);
  }

  function start3() {
    if (run3) return;
    run3 = true;
    t03 = performance.now() - 1;
    raf3 = requestAnimationFrame(frame3);
  }
  function stop3() {
    run3 = false;
    if (raf3) {
      cancelAnimationFrame(raf3);
      raf3 = null;
    }
  }

  var rm3 = window.matchMedia("(prefers-reduced-motion:reduce)");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) start3();
          else stop3();
        });
      },
      { threshold: 0.02 },
    ).observe(sec);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop3();
    else if (!rm3.matches) start3();
  });
  window.addEventListener("resize", function () {
    resize3();
  });
  resize3();
  if (!rm3.matches) start3();
})();

/* ── 15. Aurora da secção Contato ─────────────────────────── */
(function () {
  var c3 = document.getElementById("aurora-contact");
  var sec = document.getElementById("contato");
  if (!c3 || !sec) return;
  var ctx3 = c3.getContext("2d", { alpha: true });
  var w3 = 0,
    h3 = 0,
    dpr3 = 1,
    raf3 = null,
    t03 = performance.now(),
    run3 = false;

  var BLOBS3_DARK = [
    { cx: 0.16, cy: 0.2,  rx: 0.4,  ry: 0.34, color: "rgba(0,71,255,",   alpha: 0.22, speed: 0.00015, amp: 0.09 },
    { cx: 0.84, cy: 0.3,  rx: 0.36, ry: 0.3,  color: "rgba(34,197,94,", alpha: 0.16, speed: 0.00017, amp: 0.08, phase: 2.1 },
    { cx: 0.5,  cy: 0.85, rx: 0.42, ry: 0.32, color: "rgba(139,92,246,",alpha: 0.18, speed: 0.0002,  amp: 0.07, phase: 4.1 },
  ];
  var BLOBS3_LIGHT = BLOBS3_DARK.map(function (b) {
    return Object.assign({}, b, { alpha: b.alpha * 0.38 });
  });

  function th3() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function resize3() {
    var r = sec.getBoundingClientRect();
    dpr3 = Math.min(window.devicePixelRatio || 1, 2);
    w3 = Math.max(r.width, 1);
    h3 = Math.max(r.height, 1);
    c3.width = Math.round(w3 * dpr3);
    c3.height = Math.round(h3 * dpr3);
    c3.style.width = w3 + "px";
    c3.style.height = h3 + "px";
    ctx3.setTransform(dpr3, 0, 0, dpr3, 0, 0);
  }

  function frame3(now) {
    var t = now - t03;
    var blobs = th3() === "dark" ? BLOBS3_DARK : BLOBS3_LIGHT;
    ctx3.clearRect(0, 0, w3, h3);
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i], ph = b.phase || 0;
      var cx = (b.cx + Math.sin(t * b.speed + ph) * b.amp) * w3;
      var cy = (b.cy + Math.cos(t * b.speed * 0.87 + ph) * b.amp) * h3;
      var rx = b.rx * w3, ry = b.ry * h3, mx = Math.max(rx, ry);
      var g = ctx3.createRadialGradient(cx, cy, 0, cx, cy, mx);
      g.addColorStop(0, b.color + b.alpha + ")");
      g.addColorStop(0.5, b.color + b.alpha * 0.4 + ")");
      g.addColorStop(1, b.color + "0)");
      ctx3.save();
      ctx3.translate(cx, cy);
      ctx3.scale(rx / mx, ry / mx);
      ctx3.translate(-cx, -cy);
      ctx3.fillStyle = g;
      ctx3.beginPath();
      ctx3.arc(cx, cy, mx, 0, Math.PI * 2);
      ctx3.fill();
      ctx3.restore();
    }
    raf3 = requestAnimationFrame(frame3);
  }

  function start3() {
    if (run3) return;
    run3 = true;
    t03 = performance.now() - 1;
    raf3 = requestAnimationFrame(frame3);
  }
  function stop3() {
    run3 = false;
    if (raf3) {
      cancelAnimationFrame(raf3);
      raf3 = null;
    }
  }

  var rm3 = window.matchMedia("(prefers-reduced-motion:reduce)");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) start3();
          else stop3();
        });
      },
      { threshold: 0.02 },
    ).observe(sec);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop3();
    else if (!rm3.matches) start3();
  });
  window.addEventListener("resize", function () {
    resize3();
  });
  resize3();
  if (!rm3.matches) start3();
})();

/* =========================================================
   InCode — Stack: cards reativos ao cursor
   Atualiza --mx/--my (halo + moldura) e --rx/--ry (inclinação)
   ========================================================= */
(function () {
  'use strict';

  var grid = document.getElementById('stack-grid');
  if (!grid) return;

  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var rm   = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Só faz sentido onde existe um cursor real e sem redução de movimento */
  if (!fine.matches || rm.matches) return;

  var MAX_TILT = 3.2;          /* graus — deliberadamente subtil */
  var active   = null;
  var px = 0, py = 0, raf = null;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function reset(card) {
    card.classList.remove('is-live');
    card.style.removeProperty('--mx');
    card.style.removeProperty('--my');
    card.style.removeProperty('--rx');
    card.style.removeProperty('--ry');
  }

  function release() {
    if (active) reset(active);
    active = null;
  }

  function paint() {
    raf = null;
    if (!active) return;

    /* Card escondido por um filtro a meio da interação */
    if (!active.isConnected || active.offsetParent === null) { release(); return; }

    var r = active.getBoundingClientRect();
    if (!r.width || !r.height) return;

    var x = clamp01((px - r.left) / r.width);
    var y = clamp01((py - r.top) / r.height);

    active.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    active.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    active.style.setProperty('--ry', ((x - 0.5) * 2 * MAX_TILT).toFixed(2) + 'deg');
    active.style.setProperty('--rx', ((0.5 - y) * 2 * MAX_TILT).toFixed(2) + 'deg');
  }

  grid.addEventListener('pointerover', function (e) {
    var card = e.target.closest && e.target.closest('.scard');
    if (!card || card === active) return;
    if (active) reset(active);
    active = card;
    card.classList.add('is-live');
  });

  grid.addEventListener('pointerout', function (e) {
    if (!active) return;
    if (e.relatedTarget && active.contains(e.relatedTarget)) return;
    release();
  });

  grid.addEventListener('pointermove', function (e) {
    if (!active) return;
    px = e.clientX;
    py = e.clientY;
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });

  /* Segurança: rato sai da janela ou o separador muda */
  window.addEventListener('blur', release);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) release();
  });
})();

/* ── 16. Cards de Serviços — luz e inclinação com o cursor ── */
(function () {
  var cards = document.querySelectorAll(".svc__card");
  if (!cards.length) return;

  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var rm = window.matchMedia("(prefers-reduced-motion:reduce)");

  var MAX_TILT = 3.2; /* graus — inclinação máxima */
  var LERP = 0.16;

  var states = [];

  [].forEach.call(cards, function (card) {
    var link = card.querySelector(".svc__link");

    var st = {
      card: card,
      tx: 0,
      ty: 0,
      cx: 0,
      cy: 0,
      raf: null,
      active: false,
    };
    states.push(st);

    function tick() {
      st.cx += (st.tx - st.cx) * LERP;
      st.cy += (st.ty - st.cy) * LERP;
      card.style.setProperty("--svc-ry", st.cx.toFixed(3) + "deg");
      card.style.setProperty("--svc-rx", st.cy.toFixed(3) + "deg");

      if (
        st.active ||
        Math.abs(st.tx - st.cx) > 0.03 ||
        Math.abs(st.ty - st.cy) > 0.03
      ) {
        st.raf = requestAnimationFrame(tick);
      } else {
        st.raf = null;
        card.style.removeProperty("--svc-rx");
        card.style.removeProperty("--svc-ry");
        card.classList.remove("is-tilting");
      }
    }

    function start() {
      if (!st.raf) st.raf = requestAnimationFrame(tick);
    }

    function rest() {
      st.active = false;
      st.tx = 0;
      st.ty = 0;
      start();
    }

    card.addEventListener(
      "pointerenter",
      function (e) {
        if (e.pointerType !== "mouse" || !fine.matches || rm.matches) return;
        st.active = true;
        card.classList.add("is-tilting");
        start();
      },
      { passive: true },
    );

    card.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType !== "mouse" || !fine.matches) return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;

        /* Luz segue o cursor — sempre, mesmo com reduced-motion */
        card.style.setProperty("--svc-mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--svc-my", (py * 100).toFixed(1) + "%");

        if (rm.matches) return;
        st.tx = (px - 0.5) * MAX_TILT * 2;
        st.ty = -(py - 0.5) * MAX_TILT * 2;
      },
      { passive: true },
    );

    card.addEventListener("pointerleave", rest, { passive: true });
    card.addEventListener("pointercancel", rest, { passive: true });

    /* Navegação por teclado recebe o mesmo destaque do hover */
    if (link) {
      link.addEventListener("focus", function () {
        card.classList.add("is-active");
      });
      link.addEventListener("blur", function () {
        card.classList.remove("is-active");
      });
    }
  });

  /* Se a preferência de movimento mudar em runtime, repõe tudo */
  if (rm.addEventListener) {
    rm.addEventListener("change", function (e) {
      if (!e.matches) return;
      states.forEach(function (st) {
        st.active = false;
        if (st.raf) {
          cancelAnimationFrame(st.raf);
          st.raf = null;
        }
        st.cx = st.cy = st.tx = st.ty = 0;
        st.card.classList.remove("is-tilting");
        st.card.style.removeProperty("--svc-rx");
        st.card.style.removeProperty("--svc-ry");
      });
    });
  }
})();

/* =========================================================
   InCode — Contato: formulário de e-mail
   Validação progressiva, envio por fetch e estados do botão.
   ========================================================= */
(function () {
  "use strict";

  /* Endpoint do backend. Deve aceitar POST com JSON e responder
     2xx em caso de sucesso. Ajuste aqui quando a API subir. */
  var ENDPOINT = "/api/contato";
  var TIMEOUT = 15000;
  var EMAIL_FALLBACK = "incode.support@gmail.com";

  var form = document.getElementById("contact-form");
  if (!form) return;

  var submitBtn = document.getElementById("cform-submit");
  var submitLabel = form.querySelector(".cform__submit-label");
  var alertBox = document.getElementById("cform-alert");
  var alertMailto = document.getElementById("cform-alert-mailto");
  var doneBox = document.getElementById("cform-done");
  var echo = document.getElementById("cform-echo");
  var againBtn = document.getElementById("cform-again");
  var statusEl = document.getElementById("cform-status");
  var counter = document.getElementById("cf-count");
  var trap = document.getElementById("cf-site");

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  /* Cada regra devolve string (erro) ou "" (válido) */
  var rules = {
    nome: function (v) {
      if (!v) return "Diga-nos como devemos chamar você.";
      if (v.length < 2) return "Nome muito curto.";
      return "";
    },
    email: function (v) {
      if (!v) return "Precisamos de um e-mail para responder.";
      if (!EMAIL_RE.test(v)) return "Esse e-mail não parece válido.";
      return "";
    },
    assunto: function (v) {
      if (!v) return "Escolha o motivo do contato.";
      return "";
    },
    mensagem: function (v) {
      if (!v) return "Conte-nos o que você precisa.";
      if (v.length < 12) return "Escreva um pouco mais — pelo menos uma frase.";
      return "";
    }
  };

  var fields = Object.keys(rules).map(function (name) {
    var input = form.elements[name];
    return {
      name: name,
      input: input,
      wrap: input.closest(".field"),
      msg: document.getElementById(input.getAttribute("aria-describedby"))
    };
  });

  var touched = false; /* passa a true depois da primeira tentativa de envio */

  function setError(f, message) {
    if (message) {
      f.wrap.classList.add("is-invalid");
      f.input.setAttribute("aria-invalid", "true");
      f.msg.textContent = message;
      f.msg.hidden = false;
    } else {
      f.wrap.classList.remove("is-invalid");
      f.input.removeAttribute("aria-invalid");
      f.msg.hidden = true;
      f.msg.textContent = "";
    }
  }

  function check(f) {
    var error = rules[f.name](String(f.input.value || "").trim());
    setError(f, error);
    return !error;
  }

  fields.forEach(function (f) {
    f.input.addEventListener("blur", function () {
      if (f.input.value) check(f);
    });
    /* Depois da primeira tentativa, o erro some assim que é corrigido */
    f.input.addEventListener("input", function () {
      if (touched || f.wrap.classList.contains("is-invalid")) check(f);
    });
    if (f.input.tagName === "SELECT") {
      f.input.addEventListener("change", function () {
        check(f);
      });
    }
  });

  /* ── Contador da mensagem ──────────────────────────────── */
  var textarea = form.elements.mensagem;
  if (counter && textarea) {
    var max = parseInt(textarea.getAttribute("maxlength"), 10) || 1200;
    textarea.addEventListener("input", function () {
      var n = textarea.value.length;
      counter.textContent = n + "/" + max;
      counter.classList.toggle("is-near", n > max * 0.9);
    });
  }

  /* ── Estados do botão ──────────────────────────────────── */
  function sending(on) {
    submitBtn.disabled = on;
    submitBtn.classList.toggle("is-sending", on);
    submitLabel.textContent = on ? "Enviando…" : "Enviar mensagem";
  }

  function say(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function showAlert(on, payload) {
    if (!alertBox) return;
    alertBox.hidden = !on;
    if (on && alertMailto && payload) {
      alertMailto.href =
        "mailto:" +
        EMAIL_FALLBACK +
        "?subject=" +
        encodeURIComponent("Contato pelo site — " + payload.assunto) +
        "&body=" +
        encodeURIComponent(
          payload.nome + " (" + payload.email + ")\n\n" + payload.mensagem
        );
    }
  }

  /* ── Envio ─────────────────────────────────────────────── */
  function send(payload) {
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT) : null;

    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res;
    });
  }

  function succeed(payload) {
    if (echo) echo.textContent = payload.email;
    doneBox.hidden = false;
    /* Um frame antes de animar, para a transição existir */
    requestAnimationFrame(function () {
      form.classList.add("is-sent");
    });
    say("Mensagem enviada. Responderemos para " + payload.email + " em até 24h.");
    doneBox.focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    touched = true;
    showAlert(false);

    var firstInvalid = null;
    fields.forEach(function (f) {
      if (!check(f) && !firstInvalid) firstInvalid = f;
    });

    if (firstInvalid) {
      say("O formulário tem campos por corrigir.");
      firstInvalid.input.focus();
      return;
    }

    var assuntoField = form.elements.assunto;
    var payload = {
      nome: form.elements.nome.value.trim(),
      email: form.elements.email.value.trim(),
      assunto: assuntoField.options[assuntoField.selectedIndex].text,
      assuntoId: assuntoField.value,
      mensagem: form.elements.mensagem.value.trim(),
      origem: "site-contato",
      enviadoEm: new Date().toISOString()
    };

    /* Bot preencheu a armadilha: encerramos sem chamar a API */
    if (trap && trap.value) {
      succeed(payload);
      return;
    }

    sending(true);
    say("Enviando a sua mensagem.");

    send(payload)
      .then(function () {
        sending(false);
        succeed(payload);
      })
      .catch(function () {
        sending(false);
        showAlert(true, payload);
        say("Não foi possível enviar. Tente novamente ou escreva para " + EMAIL_FALLBACK + ".");
        submitBtn.focus();
      });
  });

  /* ── Recomeçar ─────────────────────────────────────────── */
  if (againBtn) {
    againBtn.addEventListener("click", function () {
      form.classList.remove("is-sent");
      form.reset();
      touched = false;
      fields.forEach(function (f) { setError(f, ""); });
      if (counter) {
        counter.textContent = "0/1200";
        counter.classList.remove("is-near");
      }
      showAlert(false);
      say("");
      setTimeout(function () { doneBox.hidden = true; }, 340);
      form.elements.nome.focus();
    });
  }

  /* ── Copiar o endereço ─────────────────────────────────── */
  var copyBtn = document.getElementById("cform-copy");
  if (copyBtn) {
    var copyTxt = copyBtn.querySelector(".cform__copy-txt");
    var resetTimer = null;

    copyBtn.addEventListener("click", function () {
      var value = copyBtn.getAttribute("data-copy");

      function done() {
        copyBtn.classList.add("is-copied");
        if (copyTxt) copyTxt.textContent = "Copiado";
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () {
          copyBtn.classList.remove("is-copied");
          if (copyTxt) copyTxt.textContent = "Copiar";
        }, 1800);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, function () {});
        return;
      }
      /* Navegadores sem Clipboard API */
      var tmp = document.createElement("textarea");
      tmp.value = value;
      tmp.setAttribute("readonly", "");
      tmp.style.position = "absolute";
      tmp.style.left = "-9999px";
      document.body.appendChild(tmp);
      tmp.select();
      try { document.execCommand("copy"); done(); } catch (err) {}
      document.body.removeChild(tmp);
    });
  }
})();