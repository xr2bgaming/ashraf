/* =========================================================
   ANIMATIONS — VFX system
   Background particles (WebGL-free canvas), cursor trail,
   scroll reveals, 3D tilt, magnetic buttons, parallax.
   Every loop is driven by requestAnimationFrame and paused
   when the tab is hidden.
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches || !window.matchMedia("(hover: hover)").matches;
  const isSmall = window.innerWidth < 768;

  /* ---------- Background particle field ---------- */
  const bg = document.getElementById("bgCanvas");
  const bgCtx = bg ? bg.getContext("2d") : null;
  let particles = [];
  let bgW = 0, bgH = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeBg() {
    if (!bg) return;
    bgW = window.innerWidth;
    bgH = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    bg.width = bgW * dpr;
    bg.height = bgH * dpr;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(120, (bgW * bgH) / 16000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * bgW,
      y: Math.random() * bgH,
      z: 0.3 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -0.05 - Math.random() * 0.18,
      r: 0.6 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2
    }));
  }

  let t = 0;
  function drawBg(now) {
    bgCtx.clearRect(0, 0, bgW, bgH);
    // Soft aurora band
    const g = bgCtx.createRadialGradient(bgW * 0.7, bgH * 0.2, 0, bgW * 0.7, bgH * 0.2, bgW * 0.6);
    g.addColorStop(0, "rgba(47,224,166,0.06)");
    g.addColorStop(0.5, "rgba(11,26,46,0.10)");
    g.addColorStop(1, "transparent");
    bgCtx.fillStyle = g;
    bgCtx.fillRect(0, 0, bgW, bgH);

    for (const p of particles) {
      p.x += p.vx * p.z + Math.sin(t * 0.8 + p.phase) * 0.12;
      p.y += p.vy * p.z;
      if (p.y < -10) { p.y = bgH + 10; p.x = Math.random() * bgW; }
      if (p.x < -10) p.x = bgW + 10;
      if (p.x > bgW + 10) p.x = -10;

      const alpha = (0.25 + 0.5 * Math.abs(Math.sin(t + p.phase))) * p.z;
      bgCtx.beginPath();
      bgCtx.fillStyle = `rgba(160,255,220,${alpha.toFixed(3)})`;
      bgCtx.arc(p.x, p.y, p.r * p.z, 0, Math.PI * 2);
      bgCtx.fill();
    }
  }

  /* ---------- Cursor trail ---------- */
  const trailCanvas = document.getElementById("trailCanvas");
  const trailCtx = trailCanvas ? trailCanvas.getContext("2d") : null;
  const trail = [];
  const MAX_TRAIL = 28;
  let tW = 0, tH = 0;

  function resizeTrail() {
    if (!trailCanvas) return;
    tW = window.innerWidth; tH = window.innerHeight;
    trailCanvas.width = tW * dpr; trailCanvas.height = tH * dpr;
    trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.__pointer = window.__pointer || { x: -200, y: -200 };
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    window.__pointer.x = e.clientX;
    window.__pointer.y = e.clientY;
    trail.push({ x: e.clientX, y: e.clientY, life: 1 });
    if (trail.length > MAX_TRAIL) trail.shift();
  }, { passive: true });

  function drawTrail() {
    if (!trailCtx) return;
    trailCtx.clearRect(0, 0, tW, tH);
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      p.life -= 0.04;
    }
    while (trail.length && trail[0].life <= 0) trail.shift();
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const k = i / trail.length;
      trailCtx.beginPath();
      trailCtx.fillStyle = `rgba(47,224,166,${(k * p.life * 0.45).toFixed(3)})`;
      trailCtx.arc(p.x, p.y, 1 + k * 4.2, 0, Math.PI * 2);
      trailCtx.fill();
    }
  }

  /* ---------- Mouse light + card sheen ---------- */
  const mouseLight = document.getElementById("mouseLight");
  let lightX = -500, lightY = -500;

  function updateLight() {
    if (!mouseLight) return;
    const target = window.__pointer;
    lightX += (target.x - lightX) * 0.08;
    lightY += (target.y - lightY) * 0.08;
    mouseLight.style.transform = `translate3d(${lightX}px, ${lightY}px, 0)`;
  }

  /* ---------- Parallax on hero orbs ---------- */
  const orbs = document.querySelectorAll(".orb, .orb-ring");
  let scrollY = 0;

  function updateParallax() {
    if (reduceMotion) return;
    const y = window.scrollY;
    if (Math.abs(y - scrollY) < 0.5) return;
    scrollY = y;
    orbs.forEach((el, i) => {
      el.style.translate = `0 ${(y * (0.06 + i * 0.03)).toFixed(1)}px`;
    });
    const nav = document.getElementById("nav");
    if (nav) nav.classList.toggle("is-scrolled", y > 30);
  }

  /* ---------- Scroll reveals (IntersectionObserver) ---------- */
  function initReveals() {
    const items = document.querySelectorAll(".reveal-up");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Section active-link highlighting ---------- */
  function initActiveNav() {
    const links = document.querySelectorAll(".nav__links a");
    const sections = ["home", "about", "contact"].map((id) => document.getElementById(id)).filter(Boolean);
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
      });
    }, { threshold: 0.5 });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- 3D tilt on glass cards ---------- */
  function initTilt() {
    if (reduceMotion || isTouch) return;
    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", ((px - 0.5) * 10).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - py) * 10).toFixed(2) + "deg");
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (reduceMotion || isTouch) return;
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate3d(${dx * 0.22}px, ${dy * 0.3}px, 0)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- Split hero title into animated letters ---------- */
  function initSplitTitles() {
    document.querySelectorAll("[data-split]").forEach((el) => {
      const text = el.textContent;
      el.setAttribute("aria-hidden", "true");
      el.textContent = "";
      [...text].forEach((ch, i) => {
        const s = document.createElement("span");
        s.textContent = ch;
        s.style.display = "inline-block";
        s.style.transitionDelay = (i * 0.045).toFixed(3) + "s";
        el.appendChild(s);
      });
    });
  }

  /* ---------- Main loop ---------- */
  let running = true;
  function frame(now) {
    if (!running) return;
    t += 0.016;
    if (!reduceMotion && bgCtx && !isSmall) drawBg(now);
    else if (!reduceMotion && bgCtx) drawBg(now);
    if (!reduceMotion) { drawTrail(); updateLight(); }
    requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  /* ---------- Init ---------- */
  window.addEventListener("resize", () => { resizeBg(); resizeTrail(); }, { passive: true });
  window.addEventListener("scroll", updateParallax, { passive: true });

  function init() {
    resizeBg();
    resizeTrail();
    initSplitTitles();
    initReveals();
    initActiveNav();
    initTilt();
    initMagnetic();
    updateParallax();
    if (reduceMotion) {
      if (bgCtx) drawBg(0);
    }
    requestAnimationFrame(frame);
  }

  window.PortfolioAnimations = { init, reduceMotion, isTouch, isSmall };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
