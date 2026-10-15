/* SKX — paysages de montagne animés (canvas). Une ambiance par zone. */
(function () {
  const instances = new Set();
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const R = Math.random;

  function seeded(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function ridge(points, rough, rnd) {
    let n = 1; while (n < points) n <<= 1;
    const h = new Float32Array(n + 1);
    h[0] = rnd(); h[n] = rnd();
    for (let step = n, amp = 1; step > 1; step >>= 1, amp *= rough) {
      for (let i = step >> 1; i < n; i += step) h[i] = (h[i - (step >> 1)] + h[i + (step >> 1)]) / 2 + (rnd() - .5) * amp;
    }
    return h;
  }
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* Ambiances : ciel, plans de montagne (du plus loin au plus proche), lumière, particules */
  const MOODS = {
    // nuit claire, neige fine
    streetwear: { sky: ["#040507", "#10161c", "#1e2830"], far: [92, 104, 116], near: [8, 10, 12], rim: [220, 230, 240], rimA: .3, fog: [150, 165, 178], fogA: .1, seed: 42, peaks: .44, glow: null, parts: "snow" },
    // aube froide, vent de neige
    sport: { sky: ["#0a1219", "#24394a", "#7d98a8"], far: [120, 142, 158], near: [10, 16, 22], rim: [235, 245, 255], rimA: .45, fog: [190, 210, 222], fogA: .16, seed: 7, peaks: .5, glow: { x: .78, y: .58, c: [255, 236, 214], a: .35, r: .5 }, parts: "wind" },
    // heure dorée sur le sommet
    premiere: { sky: ["#0b0704", "#3a2410", "#b9823d"], far: [150, 108, 62], near: [12, 8, 5], rim: [255, 214, 150], rimA: .6, fog: [230, 170, 100], fogA: .12, seed: 21, peaks: .62, glow: { x: .5, y: .5, c: [255, 210, 140], a: .55, r: .65 }, parts: "sparkle" },
    // brouillard du refuge
    accessoires: { sky: ["#0c0d0e", "#25282b", "#4d5257"], far: [96, 100, 104], near: [14, 15, 16], rim: [210, 210, 205], rimA: .18, fog: [170, 174, 176], fogA: .26, seed: 3, peaks: .36, glow: null, parts: "dust" },
    // crépuscule sur le lac
    cool: { sky: ["#0d0809", "#3a2026", "#a35a45"], far: [128, 82, 76], near: [14, 8, 9], rim: [255, 190, 160], rimA: .4, fog: [210, 140, 120], fogA: .12, seed: 11, peaks: .4, glow: { x: .3, y: .62, c: [255, 170, 120], a: .4, r: .5 }, parts: "firefly", lake: true }
  };
  MOODS.home = MOODS.streetwear;

  function backdrop(ctx, w, h, M) {
    const g = ctx.createLinearGradient(0, 0, 0, h * .8);
    g.addColorStop(0, M.sky[0]); g.addColorStop(.55, M.sky[1]); g.addColorStop(1, M.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // étoiles discrètes dans le haut du ciel
    const rs = seeded(M.seed + 99);
    for (let i = 0; i < (w * h) / 9000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${rs() * .35})`;
      ctx.fillRect(rs() * w, rs() * h * .45, rs() < .9 ? 1 : 1.6, rs() < .9 ? 1 : 1.6);
    }
    if (M.glow) {
      const r = Math.max(w, h) * M.glow.r;
      const gl = ctx.createRadialGradient(w * M.glow.x, h * M.glow.y, 0, w * M.glow.x, h * M.glow.y, r);
      gl.addColorStop(0, rgb(M.glow.c, M.glow.a)); gl.addColorStop(.25, rgb(M.glow.c, M.glow.a * .35)); gl.addColorStop(1, rgb(M.glow.c, 0));
      ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = "source-over";
    }
    const rnd = seeded(M.seed);
    const layers = 6, horizon = M.lake ? .74 : 1;
    for (let L = 0; L < layers; L++) {
      const t = L / (layers - 1);
      const base = h * (.46 + t * .36) * horizon + (M.lake ? h * .06 * t : 0);
      const amp = h * (M.peaks * .62 - t * .14);
      const hs = ridge(Math.ceil(w / (L < 2 ? 5 : 8)), .52 - t * .05, rnd), n = hs.length - 1;
      let lo = Infinity, hi = -Infinity; for (const v of hs) { if (v < lo) lo = v; if (v > hi) hi = v; }
      for (let i = 0; i <= n; i++) hs[i] = (hs[i] - lo) / (hi - lo || 1);
      const pts = []; for (let i = 0; i <= n; i++) pts.push([(i / n) * w, base - hs[i] * amp]);
      ctx.beginPath(); ctx.moveTo(0, h); pts.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.lineTo(w, h); ctx.closePath();
      ctx.fillStyle = rgb(mix(M.far, M.near, Math.pow(t, .8))); ctx.fill();
      if (t < .7) {
        ctx.strokeStyle = rgb(M.rim, M.rimA * (1 - t * 1.3)); ctx.lineWidth = 1;
        ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      }
      const fy = base - amp * .15;
      const f = ctx.createLinearGradient(0, fy, 0, base + h * .1);
      f.addColorStop(0, rgb(M.fog, 0)); f.addColorStop(1, rgb(M.fog, M.fogA * (1 - t * .7)));
      ctx.fillStyle = f; ctx.fillRect(0, fy, w, base + h * .1 - fy);
    }
    if (M.lake) {
      const y0 = h * .8;
      ctx.fillStyle = rgb(mix(M.far, M.near, .7)); ctx.fillRect(0, y0, w, h - y0);
      const lr = ctx.createLinearGradient(0, y0, 0, h);
      lr.addColorStop(0, rgb(M.glow.c, .22)); lr.addColorStop(1, rgb(M.glow.c, 0));
      ctx.fillStyle = lr; ctx.fillRect(0, y0, w, h - y0);
      ctx.strokeStyle = rgb(M.glow.c, .18); ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) { const y = y0 + 6 + i * (h - y0) / 14, x = w * M.glow.x + (rnd() - .5) * w * .2, l = 30 + rnd() * 90; ctx.beginPath(); ctx.moveTo(x - l, y); ctx.lineTo(x + l, y); ctx.stroke(); }
    }
  }

  const SPAWN = {
    snow: (w, h, i) => ({ x: R() * w, y: i ? R() * h : -5, r: .4 + R() * 1.4, vx: .1 + R() * .3, vy: .25 + R() * .6, ph: R() * 6.3, a: .35 + R() * .45 }),
    wind: (w, h, i) => ({ x: i ? R() * w : -10, y: R() * h, r: .4 + R() * 1.2, vx: 2.2 + R() * 3, vy: .2 + R() * .5, ph: R() * 6.3, a: .25 + R() * .45 }),
    sparkle: (w, h, i) => ({ x: R() * w, y: i ? R() * h : h + 5, r: .4 + R() * 1.3, vx: 0, vy: -.12 - R() * .35, ph: R() * 6.3, a: .2 + R() * .5 }),
    dust: (w, h, i) => ({ x: i ? R() * w : -5, y: R() * h, r: .4 + R() * 1, vx: .1 + R() * .3, vy: -.03 + R() * .06, ph: R() * 6.3, a: .1 + R() * .3 }),
    firefly: (w, h, i) => ({ x: R() * w, y: h * (.55 + R() * .4), r: .8 + R() * 1.4, vx: (R() - .5) * .3, vy: (R() - .5) * .2, ph: R() * 6.3, a: .3 + R() * .5 })
  };
  const COLOR = { snow: [240, 245, 250], wind: [240, 248, 255], sparkle: [255, 222, 160], dust: [220, 220, 215], firefly: [255, 200, 140] };
  const DENS = { snow: .9, wind: .9, sparkle: .5, dust: .5, firefly: .12 };

  class Scene {
    constructor(el, mood, density) {
      this.el = el; this.M = MOODS[mood] || MOODS.home; this.density = density;
      this.bg = document.createElement("canvas"); this.c = document.createElement("canvas");
      el.append(this.bg, this.c);
      this.ctx = this.c.getContext("2d"); this.visible = true;
      this.resize = this.resize.bind(this); this.loop = this.loop.bind(this);
      this.ro = new ResizeObserver(() => { clearTimeout(this.rt); this.rt = setTimeout(this.resize, 120); });
      this.ro.observe(el);
      this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
      this.io.observe(el);
      this.resize(); instances.add(this);
      this.raf = requestAnimationFrame(this.loop);
    }
    resize() {
      const r = this.el.getBoundingClientRect(); if (!r.width || !r.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = r.width; this.h = r.height;
      for (const cv of [this.bg, this.c]) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
      const b = this.bg.getContext("2d"); b.setTransform(dpr, 0, 0, dpr, 0, 0); backdrop(b, this.w, this.h, this.M);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const k = this.M.parts, n = reduced ? 0 : Math.min(360, Math.round((this.w * this.h) / 10000 * DENS[k] * 6 * this.density));
      this.parts = Array.from({ length: n }, () => SPAWN[k](this.w, this.h, true));
    }
    loop(t) {
      if (!this.el.isConnected) return this.destroy();
      if (this.visible && !document.hidden && this.parts) this.draw(t / 1000);
      this.raf = requestAnimationFrame(this.loop);
    }
    draw(t) {
      const { ctx, w, h } = this, k = this.M.parts, col = COLOR[k];
      ctx.clearRect(0, 0, w, h);
      for (const p of this.parts) {
        p.ph += .02;
        p.x += p.vx + (k === "snow" ? Math.sin(p.ph) * .25 : k === "firefly" ? Math.sin(p.ph * 1.3) * .3 : 0);
        p.y += p.vy + (k === "firefly" ? Math.cos(p.ph) * .2 : 0);
        let a = p.a;
        if (k === "sparkle" || k === "firefly") a *= .5 + .5 * Math.sin(p.ph * 2 + t);
        ctx.fillStyle = rgb(col, a);
        if (k === "wind") { ctx.fillRect(p.x, p.y, p.r * 6, p.r * .8); }
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
        if (p.x > w + 10 || p.x < -20 || p.y > h + 6 || p.y < -6) Object.assign(p, SPAWN[k](w, h, false));
      }
    }
    destroy() { cancelAnimationFrame(this.raf); this.ro.disconnect(); this.io.disconnect(); instances.delete(this); }
  }

  function mountScene(el, mood, density = 1) {
    el.classList.add("scene");
    el.innerHTML = "";
    new Scene(el, mood, density);
  }
  function destroyAll() { for (const s of [...instances]) s.destroy(); }
  window.SKXWeather = { mountScene, destroyAll };
})();
