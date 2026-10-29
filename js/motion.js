/* SKX — motion design
   Apparitions au défilement, titres mot à mot, logo qui brille, parallaxe des montagnes,
   transition de page en ligne de crête, cartes inclinables, boutons aimantés, altimètre de défilement,
   compteurs animés et en-tête qui se cache en descendant. Tout est coupé si l'appareil demande moins d'animations. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fine = matchMedia("(pointer: fine)").matches;
  const app = $("#app");
  document.documentElement.classList.add("motion");

  /* ---------- 1. Apparitions au défilement ---------- */
  const REVEAL = ".section-head, .card, .zone-card, .perk, .pack, .review, .sf-card, .fact, .mat, .team-mini, .person, .split > *, .story-grid > *, .sf-gallery figure, .sf-kpis > div, .faq details, .sf-teaser, .sf-banner, .mini-timeline li, .rules li, .u-switch, .empty";
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -6% 0px", threshold: .06 });
  function show(el) {
    el.classList.add("in");
    if (el.matches(".sf-kpis > div, .fact, .stat")) countUp(el);
  }
  function prep(root) {
    const vh = innerHeight;
    let first = 0;
    $$(REVEAL, root).forEach((el) => {
      if (el.dataset.mo || el.closest(".modal, .drawer, .admin, .sheet")) return;
      el.dataset.mo = "1";
      // décalage en cascade entre éléments voisins (grilles)
      const sibs = el.parentElement ? [...el.parentElement.children] : [el];
      const idx = Math.max(0, sibs.indexOf(el)) % 6;
      el.style.setProperty("--d", idx * 70 + "ms");
      el.classList.add("mo");
      const r = el.getBoundingClientRect();
      if (r.top < vh * .95 && r.bottom > 0) { el.style.setProperty("--d", Math.min(first++, 8) * 70 + "ms"); requestAnimationFrame(() => requestAnimationFrame(() => show(el))); }
      else io.observe(el);
    });
    splitTitles(root);
    wrapLogos(root);
  }

  /* ---------- 2. Titres mot à mot ---------- */
  function splitTitles(root) {
    $$(".section-head h2, .u-hero h1, .story-title, .hero-claim, .teaser-title, .slide-body h2", root).forEach((h) => {
      if (h.dataset.split || h.children.length) return;
      const txt = h.textContent.trim(); if (!txt) return;
      h.dataset.split = "1";
      h.setAttribute("aria-label", txt);
      h.innerHTML = txt.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span></span>`).join(" ");
      h.classList.add("wsplit");
      const r = h.getBoundingClientRect();
      const host = h.closest(".mo");
      if (!host) { if (r.top < innerHeight) requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add("in"))); else { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { h.classList.add("in"); o.disconnect(); } }); o.observe(h); } }
    });
  }

  /* ---------- 3. Logo : apparition et reflet ---------- */
  function wrapLogos(root) {
    $$(".hero-logo, .entry-logo", root).forEach((img) => {
      if (img.parentElement.classList.contains("logo-wrap")) return;
      const w = document.createElement("span"); w.className = "logo-wrap";
      img.replaceWith(w); w.appendChild(img);
      const sh = img.cloneNode(); sh.className = "shine"; sh.alt = ""; sh.setAttribute("aria-hidden", "true");
      w.appendChild(sh);
    });
  }

  /* ---------- 4. Compteurs ---------- */
  function countUp(el) {
    const b = el.querySelector("b"); if (!b || b.dataset.counted) return;
    const m = /^(\D*)(\d[\d\s ]*)(.*)$/.exec(b.textContent.trim()); if (!m) return;
    const target = +m[2].replace(/\D/g, ""); if (!target || target > 100000) return;
    b.dataset.counted = "1";
    const t0 = performance.now(), dur = 1100;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      b.textContent = m[1] + Math.round(target * e).toLocaleString("fr-FR") + m[3];
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- 5. Transition de page : ligne de crête ---------- */
  const curtain = document.createElement("div");
  curtain.className = "curtain"; curtain.setAttribute("aria-hidden", "true");
  curtain.innerHTML = `<svg class="ridge" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0 120 V60 L80 30 L140 52 L230 8 L320 48 L390 26 L470 64 L560 18 L640 44 L720 12 L810 50 L900 22 L980 58 L1060 30 L1140 50 L1200 34 V120 Z"/></svg><span class="curtain-label"></span>`;
  document.body.appendChild(curtain);
  let lastHash = location.hash;
  addEventListener("hashchange", () => {
    if (location.hash === lastHash) return;
    lastHash = location.hash;
    const a = $(`#nav a[href="${CSS.escape(location.hash)}"]`) || $(`.footer a[href="${CSS.escape(location.hash)}"]`);
    $(".curtain-label", curtain).textContent = a ? a.textContent.trim() : "SKX";
    clearTimeout(curtain._t);
    curtain.classList.remove("go"); curtain.classList.add("cover");
    curtain._t = setTimeout(() => curtain.classList.remove("go"), 1200);
    void curtain.offsetWidth;
    requestAnimationFrame(() => { curtain.classList.add("go"); curtain.classList.remove("cover"); });
  });

  /* ---------- 6. Parallaxe (défilement + souris) ---------- */
  let sy = scrollY, mx = 0, my = 0, tmx = 0, tmy = 0, lastY = scrollY, vel = 0;
  addEventListener("scroll", () => { sy = scrollY; }, { passive: true });
  if (fine) addEventListener("pointermove", (e) => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; }, { passive: true });
  const header = $(".header");
  let hdrHidden = false;
  function frame() {
    mx += (tmx - mx) * .06; my += (tmy - my) * .06;
    const hero = $(".hero-mt, .u-hero, .story");
    if (hero) {
      const sc = $(".scene", hero), inner = $(".hero-mt-inner, .u-hero-content", hero);
      const h = hero.offsetHeight || 1, k = Math.min(1, sy / h);
      if (sc) sc.style.transform = `translate3d(${mx * -18}px, ${sy * .35 + my * -10}px, 0) scale(1.06)`;
      if (inner) { inner.style.transform = `translate3d(${mx * 8}px, ${sy * .18}px, 0)`; inner.style.opacity = String(1 - k * 1.1); }
    }
    // vitesse de défilement → inclinaison du bandeau défilant
    vel += ((sy - lastY) - vel) * .15; lastY = sy;
    const tk = $(".ticker-track");
    if (tk) tk.parentElement.style.transform = `skewX(${Math.max(-12, Math.min(12, -vel * .4))}deg)`;
    // en-tête qui se cache en descendant
    const nav = $("#nav.open");
    const hide = !nav && sy > 140 && vel > 1.2, showH = vel < -1.2 || sy < 140;
    if (hide && !hdrHidden) { header.classList.add("hdr-hide"); hdrHidden = true; }
    else if (showH && hdrHidden) { header.classList.remove("hdr-hide"); hdrHidden = false; }
    // altimètre
    updateAlti();
    requestAnimationFrame(frame);
  }

  /* ---------- 7. Altimètre de défilement ---------- */
  const alti = document.createElement("div");
  alti.className = "alti"; alti.setAttribute("aria-hidden", "true");
  alti.innerHTML = `<div class="alti-track"><i class="alti-fill"></i><span class="alti-mark"><svg viewBox="0 0 12 10" width="12" height="10"><path d="M0 10 L6 0 L12 10 Z" fill="currentColor"/></svg></span></div><span class="alti-val mono">0 m</span>`;
  document.body.appendChild(alti);
  const SUMMIT = 4808;
  function updateAlti() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const k = max > 0 ? Math.min(1, Math.max(0, sy / max)) : 0;
    alti.style.setProperty("--k", k);
    $(".alti-val", alti).textContent = Math.round(k * SUMMIT).toLocaleString("fr-FR") + " m";
    alti.classList.toggle("top", k > .995);
    alti.hidden = /^#\/(equipe|admin)/.test(location.hash) || max < innerHeight * .5;
  }

  /* ---------- 8. Cartes inclinables + reflet ---------- */
  if (fine) {
    let cur = null;
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest?.(".card-img, .pack-img, .team-av, .sf-teaser-img, .sf-gallery figure");
      if (cur && cur !== el) { cur.style.transform = ""; cur.classList.remove("tilting"); }
      cur = el; if (!el) return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add("tilting");
      el.style.setProperty("--mx", x * 100 + "%"); el.style.setProperty("--my", y * 100 + "%");
      el.style.transform = `perspective(900px) rotateX(${(.5 - y) * 6}deg) rotateY(${(x - .5) * 8}deg) translateZ(0)`;
    }, { passive: true });
    document.addEventListener("pointerleave", () => { if (cur) { cur.style.transform = ""; cur.classList.remove("tilting"); cur = null; } });

    /* ---------- 9. Boutons aimantés ---------- */
    let mag = null;
    document.addEventListener("pointermove", (e) => {
      const b = e.target.closest?.(".hero-cta .btn, .section-head .btn, .sf-teaser, .perso-block .btn, #pdpAdd, #checkoutBtn, .r-btn:not(.small)");
      if (mag && mag !== b) { mag.style.translate = ""; mag = null; }
      if (!b || b.classList.contains("sf-teaser")) return;
      mag = b;
      const r = b.getBoundingClientRect();
      b.style.translate = `${(e.clientX - (r.left + r.width / 2)) * .18}px ${(e.clientY - (r.top + r.height / 2)) * .28}px`;
    }, { passive: true });
  }

  /* ---------- 10. Au fil des pages ---------- */
  new MutationObserver(() => prep(app)).observe(app, { childList: true, subtree: true });
  new MutationObserver(() => wrapLogos(document.body)).observe(document.body, { childList: true });
  prep(app);
  requestAnimationFrame(frame);
})();
