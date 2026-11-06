/* =========================================================
   SCRIPT — core app logic
   Loader · sound (OFF by default) · contact links · form
   ========================================================= */
(function () {
  "use strict";

  const CFG = window.PORTFOLIO_CONFIG || {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- WebGL feature detection ---------- */
  (function detectWebGL() {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) document.documentElement.classList.add("no-webgl");
    } catch (e) {
      document.documentElement.classList.add("no-webgl");
    }
  })();

  /* Mark JS as active so content-hiding CSS only applies when scripts run */
  document.documentElement.classList.add("js");

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Loader ---------- */
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loaderBar");
  let progress = 0;

  function finishLoading() {
    document.body.classList.add("is-loaded");
    if (loader) {
      loader.classList.add("is-done");
      setTimeout(() => loader.remove(), 1000);
    }
  }

  function runLoader() {
    if (!loader || reduceMotion) {
      finishLoading();
      return;
    }
    const timer = setInterval(() => {
      progress = Math.min(100, progress + 4 + Math.random() * 9);
      if (loaderBar) loaderBar.style.width = progress + "%";
      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(finishLoading, 280);
      }
    }, 90);
    // Safety net so the page never stays hidden
    setTimeout(() => { if (progress < 100) { progress = 100; finishLoading(); } }, 3500);
  }

  /* ---------- Sound system (OFF by default, no autoplay) ---------- */
  const soundBtn = document.getElementById("soundToggle");
  const volumeEl = document.getElementById("volume");
  const soundLabel = soundBtn ? soundBtn.querySelector(".sound-label") : null;

  let ambient = null;
  let clickFx = null;
  let soundOn = false;

  function loadAudio() {
    if (ambient) return;
    try {
      ambient = new Audio(CFG.ambientSound || "assets/sounds/ambient.mp3");
      ambient.loop = true;
      ambient.preload = "none";
      ambient.volume = volumeEl ? parseFloat(volumeEl.value) : 0.35;
      ambient.addEventListener("error", () => disableSoundUI("Sound file not found"));

      clickFx = new Audio(CFG.clickSound || "assets/sounds/click.mp3");
      clickFx.preload = "none";
      clickFx.volume = 0.25;
      clickFx.addEventListener("error", () => { clickFx = null; });
    } catch (err) {
      disableSoundUI("Audio unsupported");
    }
  }

  function disableSoundUI(reason) {
    if (soundBtn) {
      soundBtn.disabled = true;
      soundBtn.title = reason;
    }
    if (volumeEl) volumeEl.disabled = true;
    if (soundLabel) soundLabel.textContent = "Unavailable";
    soundOn = false;
  }

  function setSound(on) {
    if (!soundBtn) return;
    loadAudio();
    soundOn = on;
    soundBtn.setAttribute("aria-pressed", String(on));
    soundBtn.setAttribute("aria-label", on ? "Disable ambient sound" : "Enable ambient sound");
    if (soundLabel) soundLabel.textContent = on ? "Sound on" : "Sound off";
    if (!ambient) return;
    if (on) {
      const p = ambient.play();
      if (p && typeof p.catch === "function") p.catch(() => disableSoundUI("Playback blocked"));
    } else {
      ambient.pause();
    }
  }

  if (soundBtn) {
    soundBtn.addEventListener("click", () => setSound(!soundOn));
  }

  if (volumeEl) {
    volumeEl.addEventListener("input", () => {
      const v = parseFloat(volumeEl.value);
      if (ambient) ambient.volume = v;
    });
  }

  // Subtle interaction sound on buttons and cards (only when sound is on)
  document.addEventListener("click", (e) => {
    if (!soundOn || !clickFx) return;
    if (e.target.closest("a, button, .glass")) {
      const fx = clickFx.cloneNode();
      fx.volume = 0.25;
      fx.play().catch(() => {});
    }
  });

  /* ---------- Contact links ---------- */
  const owner = CFG.owner || {};

  const waBtn = document.getElementById("whatsappBtn");
  if (waBtn && owner.whatsapp) {
    waBtn.href = "https://wa.me/" + owner.whatsapp.replace(/\D/g, "") +
      "?text=" + encodeURIComponent("Hi Lizon, I found your portfolio and would like to connect.");
  }

  const mailBtn = document.getElementById("emailBtn");
  if (mailBtn && owner.email) {
    mailBtn.href = "mailto:" + owner.email + "?subject=" + encodeURIComponent("Portfolio enquiry");
  }

  const fbBtn = document.getElementById("facebookBtn");
  if (fbBtn && owner.facebookUrl) {
    fbBtn.href = owner.facebookUrl;
  }

  /* ---------- Contact form ---------- */
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  const submitBtn = document.getElementById("cfSubmit");

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (kind ? " is-" + kind : "");
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  function sanitize(v) {
    return String(v || "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = sanitize(form.name.value);
      const email = sanitize(form.email.value);
      const message = sanitize(form.message.value);

      if (!name || !email || !message) return setStatus("Please fill in all fields.", "err");
      if (!validEmail(email)) return setStatus("Please enter a valid email address.", "err");
      if (message.length < 5) return setStatus("Your message is a little too short.", "err");

      const endpoint = CFG.contactEndpoint;

      // Backend mode: POST to Flask
      if (endpoint) {
        submitBtn.disabled = true;
        setStatus("Sending…");
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, message })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error(data.error || "Request failed");
          setStatus("Thank you! Your message has been sent.", "ok");
          form.reset();
        } catch (err) {
          setStatus("Could not send right now. Please use the email or WhatsApp buttons above.", "err");
        } finally {
          submitBtn.disabled = false;
        }
        return;
      }

      // Static mode: open the user's mail client, no server needed
      const subject = encodeURIComponent("Portfolio message from " + name);
      const body = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
      window.location.href = "mailto:" + owner.email + "?subject=" + subject + "&body=" + body;
      setStatus("Opening your email app…", "ok");
    });
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    const dot = document.getElementById("cursorDot");
    const ring = document.getElementById("cursorRing");
    if (!dot || !ring) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let rx = -100, ry = -100, dx = -100, dy = -100;
    let visible = false;

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      dx = e.clientX; dy = e.clientY;
      dot.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      if (!visible) { visible = true; dot.style.opacity = "1"; ring.style.opacity = "1"; }
    }, { passive: true });

    document.addEventListener("pointerleave", () => {
      dot.style.opacity = "0"; ring.style.opacity = "0"; visible = false;
    });

    // Hover state on interactive elements
    const hoverSel = "a, button, input, textarea, .glass, .tilt";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest && e.target.closest(hoverSel)) ring.classList.add("is-hover");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest && e.target.closest(hoverSel)) ring.classList.remove("is-hover");
    });

    function loop() {
      rx += (dx - rx) * 0.18;
      ry += (dy - ry) * 0.18;
      ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ---------- Boot ---------- */
  function boot() {
    runLoader();
    initCursor();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
