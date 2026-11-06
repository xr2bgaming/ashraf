/* =========================================================
   DRAGONFLY — living digital creature
   - Follows the pointer with eased, velocity-aware motion
   - Wings flap continuously; speed increases while flying
   - Body banks and yaws toward the direction of travel
   - Hovers with a gentle bob when the pointer is still
   - Pointer-events: none, so it never blocks clicks/scroll
   - Mobile / touch: a lightweight dot-style companion instead
   ========================================================= */
(function () {
  "use strict";

  const cfg = (window.PORTFOLIO_CONFIG && window.PORTFOLIO_CONFIG.dragonfly) || {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches || !window.matchMedia("(hover: hover)").matches;

  const wrap = document.getElementById("dragonflyWrap");
  const svg = document.getElementById("dragonflySvg");
  if (!wrap || !svg) return;

  /* ---------- Touch / small screens: lightweight alternative ---------- */
  if (isTouch || window.innerWidth < 768 || cfg.enabled === false) {
    wrap.classList.add("is-lite");
    buildLiteCompanion();
    return;
  }
  if (reduceMotion) {
    // Keep it static and calm for users who ask for reduced motion
    wrap.style.display = "none";
    return;
  }

  const wingsL = svg.querySelectorAll(".wing--left-back, .wing--left-front");
  const wingsR = svg.querySelectorAll(".wing--right-back, .wing--right-front");
  const body = svg.querySelector("#dfBody");
  const shadow = svg.querySelector("#dfShadow");

  /* State */
  const state = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.4,
    vx: 0,
    vy: 0,
    targetX: window.innerWidth * 0.5,
    targetY: window.innerHeight * 0.4,
    heading: 0,        // radians, smoothed facing direction
    bank: 0,           // body roll (deg)
    flapPhase: 0,
    flapSpeed: cfg.wingFlapSpeed || 28,
    hoverT: 0,
    lastMove: performance.now(),
    hasPointer: false,
    lastTime: performance.now()
  };

  const SMOOTH = cfg.followSmoothing || 0.085;
  const OFFSET_RADIUS = 46;  // hover halo so it doesn't sit exactly under cursor
  let hoverOffsetA = 0;

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    state.targetX = e.clientX;
    state.targetY = e.clientY;
    state.lastMove = performance.now();
    state.hasPointer = true;
  }, { passive: true });

  document.addEventListener("pointerleave", () => { state.hasPointer = false; });

  /* Frame update */
  function tick(now) {
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;

    const idleFor = now - state.lastMove;
    const isHovering = idleFor > 350;

    // Orbit the target slightly while hovering to feel alive
    hoverOffsetA += dt * 0.9;
    const hoverR = isHovering ? OFFSET_RADIUS * 0.55 : OFFSET_RADIUS;
    const offX = Math.cos(hoverOffsetA) * hoverR;
    const offY = Math.sin(hoverOffsetA * 1.3) * hoverR * 0.45;

    const goalX = state.targetX + offX;
    const goalY = state.targetY + offY - 14;

    // Critically-damped-ish spring toward the goal (frame-rate independent)
    const k = 1 - Math.pow(1 - SMOOTH, dt * 60);
    const prevX = state.x, prevY = state.y;
    state.x += (goalX - state.x) * k;
    state.y += (goalY - state.y) * k;

    // Hover bob when still
    const bobY = isHovering ? Math.sin(now * 0.0045) * 4 : 0;
    const bobX = isHovering ? Math.cos(now * 0.0031) * 2.5 : 0;

    state.vx = (state.x - prevX) / Math.max(dt, 0.001);
    state.vy = (state.y - prevY) / Math.max(dt, 0.001);
    const speed = Math.hypot(state.vx, state.vy);

    // Heading follows velocity, shortest-arc smoothing
    if (speed > 40) {
      const targetHeading = Math.atan2(state.vy, state.vx);
      let diff = targetHeading - state.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      state.heading += diff * Math.min(1, dt * 9);
    }

    // Bank proportional to lateral turn rate
    const targetBank = Math.max(-28, Math.min(28, (state.vx / 60) * -6));
    state.bank += (targetBank - state.bank) * Math.min(1, dt * 6);

    // Wing flap: faster when moving, slower when hovering
    const flapBoost = Math.min(1, speed / 500);
    const flapRate = (isHovering ? 14 : state.flapSpeed * (0.6 + flapBoost * 0.6));
    state.flapPhase += flapRate * dt;
    const flap = Math.sin(state.flapPhase);             // -1..1
    const fwd = Math.sin(state.flapPhase * 0.9 + 0.6);  // slight phase offset for front pair

    const backAngle = flap * 18;
    const frontAngle = fwd * 24;
    wingsL.forEach((w, i) => w.setAttribute("transform", `rotate(${(i === 0 ? -backAngle * 0.9 : -frontAngle).toFixed(2)})`));
    wingsR.forEach((w, i) => w.setAttribute("transform", `rotate(${(i === 0 ? backAngle * 0.9 : frontAngle).toFixed(2)})`));

    // Glossy body rotation: yaw by heading, subtle bank
    const deg = state.heading * 180 / Math.PI;
    const headingDeg = deg + 90; // body is drawn pointing "up" (-y); offset to align
    if (body) {
      body.setAttribute("transform", `rotate(${(headingDeg + state.bank * 0.15).toFixed(2)})`);
    }
    if (shadow) {
      shadow.setAttribute("cx", (6 + state.vx * 0.01).toFixed(2));
      shadow.setAttribute("cy", (14 + state.vy * 0.01).toFixed(2));
    }

    // Position: wrap is positioned via transform; SVG rotation is applied inside
    const scale = 1 + Math.sin(now * 0.004) * (isHovering ? 0.015 : 0);
    wrap.style.transform = `translate3d(${(state.x + bobX).toFixed(2)}px, ${(state.y + bobY).toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;

    requestAnimationFrame(tick);
  }

  /* Visibility: pause work when tab hidden */
  let paused = false;
  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    if (!paused) {
      state.lastTime = performance.now();
      requestAnimationFrame(tick);
    }
  });

  requestAnimationFrame(tick);

  /* ---------- Lite companion for touch devices ---------- */
  function buildLiteCompanion() {
    if (reduceMotion) return;
    const lite = document.createElement("div");
    lite.className = "lite-dragonfly";
    lite.setAttribute("aria-hidden", "true");
    lite.innerHTML = `
      <svg viewBox="-30 -30 60 60" width="46" height="46">
        <ellipse cx="-10" cy="-6" rx="13" ry="5" fill="rgba(160,255,220,0.35)" transform="rotate(-25 -10 -6)"/>
        <ellipse cx="10" cy="-6" rx="13" ry="5" fill="rgba(160,255,220,0.35)" transform="rotate(25 10 -6)"/>
        <ellipse cx="0" cy="0" rx="3" ry="14" fill="#0a0d10"/>
        <circle cx="0" cy="-14" r="3.2" fill="#2fe0a6"/>
      </svg>`;
    document.body.appendChild(lite);

    const wingEls = lite.querySelectorAll("ellipse");
    let x = window.innerWidth * 0.8, y = window.innerHeight * 0.25;
    let tx = x, ty = y, phase = 0, last = performance.now();
    let idle = 0;

    // Gentle autonomous drift on touch devices (no cursor to follow)
    function drift(now) {
      const w = window.innerWidth, h = window.innerHeight;
      tx = w * (0.5 + 0.35 * Math.sin(now * 0.00022));
      ty = h * (0.3 + 0.2 * Math.cos(now * 0.00017));
    }

    function liteTick(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      drift(now);
      const k = 1 - Math.pow(1 - 0.03, dt * 60);
      x += (tx - x) * k;
      y += (ty - y) * k;
      phase += dt * 16;
      const f = Math.sin(phase) * 0.5 + 0.5;
      wingEls.forEach((el, i) => {
        if (i < 2) el.setAttribute("ry", (4 + f * 3).toFixed(2));
      });
      lite.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-23px,-23px)`;
      requestAnimationFrame(liteTick);
    }
    requestAnimationFrame(liteTick);
  }
})();
