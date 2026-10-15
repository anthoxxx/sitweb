/* SKX — ambiances animées des 4 univers (canvas, rendu atmosphérique). */
(function () {
  const instances = new Set();
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const R = Math.random;

  /* Bruit 1D/2D simple et déterministe */
  function seeded(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function ridge(width, rough, rnd) {
    // déplacement du point médian
    let n = 1; while (n < width) n <<= 1;
    const h = new Float32Array(n + 1);
    h[0] = rnd(); h[n] = rnd();
    for (let step = n, amp = 1; step > 1; step >>= 1, amp *= rough) {
      for (let i = step >> 1; i < n; i += step) h[i] = (h[i - (step >> 1)] + h[i + (step >> 1)]) / 2 + (rnd() - .5) * amp;
    }
    return h;
  }
  function noise2D(rnd) {
    const P = 256, g = new Float32Array(P * P);
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    const at = (x, y) => g[((y & 255) * P) + (x & 255)];
    const s = (t) => t * t * (3 - 2 * t);
    const v = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = s(x - xi), yf = s(y - yi);
      const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
      return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
    };
    return (x, y) => v(x, y) * .55 + v(x * 2.1, y * 2.1) * .3 + v(x * 4.3, y * 4.3) * .15;
  }

  /* ---------- Décors statiques ---------- */
  const BACKDROPS = {
    montagne(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#07090b"); g.addColorStop(.55, "#1b232a"); g.addColorStop(1, "#2b353d");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const rnd = seeded(42);
      const layers = 6;
      for (let L = 0; L < layers; L++) {
        const t = L / (layers - 1);
        const base = h * (.38 + t * .42), amp = h * (.42 - t * .26);
        const hs = ridge(Math.ceil(w / 7), .5 - t * .04, rnd);
        const n = hs.length - 1;
        ctx.beginPath(); ctx.moveTo(0, h);
        for (let i = 0; i <= n; i++) ctx.lineTo((i / n) * w, base - hs[i] * amp);
        ctx.lineTo(w, h); ctx.closePath();
        const c = Math.round(68 - t * 60);
        ctx.fillStyle = `rgb(${c},${c + 8},${c + 14})`;
        ctx.fill();
        // crête enneigée (lisière claire sur les plans lointains)
        if (t < .6) {
          ctx.strokeStyle = `rgba(225,235,242,${.28 - t * .35})`; ctx.lineWidth = 1;
          ctx.beginPath();
          for (let i = 0; i <= n; i++) { const x = (i / n) * w, y = base - hs[i] * amp; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke();
        }
        // brume entre les plans
        const f = ctx.createLinearGradient(0, base - amp * .2, 0, base + h * .08);
        f.addColorStop(0, "rgba(160,175,186,0)"); f.addColorStop(1, `rgba(160,175,186,${.1 - t * .08})`);
        ctx.fillStyle = f; ctx.fillRect(0, base - amp * .2, w, amp * .2 + h * .08);
      }
    },
    terre(ctx, w, h) {
      const g = ctx.createRadialGradient(w * .5, h * .55, 0, w * .5, h * .55, Math.max(w, h) * .8);
      g.addColorStop(0, "#2a1c12"); g.addColorStop(1, "#0c0806");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // courbes de niveau (marching squares)
      const nz = noise2D(seeded(7));
      const cell = Math.max(6, Math.round(Math.min(w, h) / 70));
      const cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1;
      const sc = 3.2 / Math.max(w, h) * cell;
      const F = new Float32Array(cols * rows);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) F[y * cols + x] = nz(x * sc + 11, y * sc + 5);
      const levels = 22;
      for (let l = 1; l < levels; l++) {
        const iso = .15 + (l / levels) * .7;
        const major = l % 5 === 0;
        ctx.strokeStyle = major ? "rgba(196,150,104,.55)" : "rgba(176,132,92,.22)";
        ctx.lineWidth = major ? 1.2 : .8;
        ctx.beginPath();
        for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols - 1; x++) {
          const a = F[y * cols + x], b = F[y * cols + x + 1], c = F[(y + 1) * cols + x + 1], d = F[(y + 1) * cols + x];
          const idx = (a > iso) | ((b > iso) << 1) | ((c > iso) << 2) | ((d > iso) << 3);
          if (idx === 0 || idx === 15) continue;
          const X = x * cell, Y = y * cell;
          const lerp = (p, q) => (iso - p) / (q - p);
          const T = [X + lerp(a, b) * cell, Y], Rr = [X + cell, Y + lerp(b, c) * cell], B = [X + lerp(d, c) * cell, Y + cell], Lf = [X, Y + lerp(a, d) * cell];
          const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
          switch (idx) {
            case 1: case 14: seg(Lf, T); break;
            case 2: case 13: seg(T, Rr); break;
            case 3: case 12: seg(Lf, Rr); break;
            case 4: case 11: seg(Rr, B); break;
            case 6: case 9: seg(T, B); break;
            case 7: case 8: seg(Lf, B); break;
            case 5: seg(Lf, T); seg(Rr, B); break;
            case 10: seg(T, Rr); seg(Lf, B); break;
          }
        }
        ctx.stroke();
      }
      const v = ctx.createLinearGradient(0, 0, 0, h);
      v.addColorStop(0, "rgba(12,8,6,.6)"); v.addColorStop(.4, "rgba(12,8,6,0)");
      ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    },
    pluie(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#050608"); g.addColorStop(1, "#121a20");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // lumières de ville floues (bokeh)
      const rnd = seeded(3);
      const cols = [[217, 164, 65], [120, 150, 175], [200, 70, 60], [230, 220, 200]];
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 46; i++) {
        const x = rnd() * w, y = h * (.45 + rnd() * .55), r = 8 + rnd() * Math.min(w, h) * .07;
        const [cr, cg, cb] = cols[Math.floor(rnd() * cols.length)];
        const a = .05 + rnd() * .12;
        const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`); rg.addColorStop(.7, `rgba(${cr},${cg},${cb},${a * .6})`); rg.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      // reflets sur l'asphalte
      const s = ctx.createLinearGradient(0, h * .82, 0, h);
      s.addColorStop(0, "rgba(5,6,8,0)"); s.addColorStop(1, "rgba(5,6,8,.85)");
      ctx.fillStyle = s; ctx.fillRect(0, h * .82, w, h * .18);
    },
    soleil(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0b0705"); g.addColorStop(.45, "#2a150a"); g.addColorStop(.72, "#7a3b14"); g.addColorStop(1, "#140a05");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // horizon
      const rnd = seeded(11);
      const hs = ridge(Math.ceil(w / 4), .45, rnd), n = hs.length - 1;
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let i = 0; i <= n; i++) ctx.lineTo((i / n) * w, h * .76 - hs[i] * h * .05);
      ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = "#0d0805"; ctx.fill();
    }
  };

  /* ---------- Particules ---------- */
  const PARTS = {
    montagne: { per: .5, spawn: (w, h, init) => ({ x: R() * w, y: init ? R() * h : -5, r: .4 + R() * 1.4, vy: .25 + R() * .6, vx: .15 + R() * .35, ph: R() * 6.3 }) },
    terre: { per: .35, spawn: (w, h, init) => ({ x: init ? R() * w : -5, y: R() * h, r: .4 + R() * 1.1, vx: .15 + R() * .45, vy: -.05 + R() * .1, a: .1 + R() * .35, ph: R() * 6.3 }) },
    pluie: { per: 1.6, spawn: (w, h, init) => ({ x: R() * (w + 200), y: init ? R() * h : -40, l: 14 + R() * 26, vy: 14 + R() * 10, a: .05 + R() * .18 }) },
    soleil: { per: .3, spawn: (w, h, init) => ({ x: R() * w, y: init ? R() * h : h * .8, r: .4 + R() * 1.4, vy: -.1 - R() * .3, a: .1 + R() * .4, ph: R() * 6.3 }) }
  };

  class Scene {
    constructor(el, kind, density) {
      this.el = el; this.kind = kind; this.density = density;
      this.bg = document.createElement("canvas");
      this.c = document.createElement("canvas");
      el.append(this.bg, this.c);
      this.ctx = this.c.getContext("2d");
      this.visible = true; this.flash = 0;
      this.resize = this.resize.bind(this); this.loop = this.loop.bind(this);
      this.ro = new ResizeObserver(() => { clearTimeout(this.rt); this.rt = setTimeout(this.resize, 120); });
      this.ro.observe(el);
      this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
      this.io.observe(el);
      this.resize();
      instances.add(this);
      this.raf = requestAnimationFrame(this.loop);
    }
    resize() {
      const r = this.el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = r.width; this.h = r.height;
      for (const cv of [this.bg, this.c]) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
      const b = this.bg.getContext("2d"); b.setTransform(dpr, 0, 0, dpr, 0, 0);
      BACKDROPS[this.kind](b, this.w, this.h);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const P = PARTS[this.kind];
      const n = reduced ? 0 : Math.min(420, Math.round((this.w * this.h) / 10000 * P.per * this.density * 10));
      this.parts = Array.from({ length: n }, () => P.spawn(this.w, this.h, true));
    }
    loop(t) {
      if (!this.el.isConnected) return this.destroy();
      if (this.visible && !document.hidden && this.parts) this.draw(t / 1000);
      this.raf = requestAnimationFrame(this.loop);
    }
    draw(t) {
      const { ctx, w, h, kind } = this, P = PARTS[kind];
      ctx.clearRect(0, 0, w, h);
      if (kind === "soleil") {
        // halo qui respire
        const pulse = .85 + Math.sin(t * .6) * .08;
        const cx = w * .5, cy = h * .76, r = Math.max(w, h) * .62 * pulse;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, "rgba(255,232,185,.95)"); g.addColorStop(.06, "rgba(250,186,96,.7)");
        g.addColorStop(.3, "rgba(214,112,44,.28)"); g.addColorStop(1, "rgba(120,50,20,0)");
        ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
        // ondes de chaleur
        ctx.strokeStyle = "rgba(255,210,150,.05)"; ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const y = h * (.62 + i * .025);
          ctx.beginPath();
          for (let x = 0; x <= w; x += 12) ctx.lineTo(x, y + Math.sin(x * .02 + t * 2 + i) * 2);
          ctx.stroke();
        }
      }
      if (kind === "pluie") {
        ctx.lineWidth = 1; ctx.lineCap = "round";
        for (const p of this.parts) {
          ctx.strokeStyle = `rgba(190,210,225,${p.a})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.l * .18, p.y + p.l); ctx.stroke();
          p.y += p.vy; p.x -= p.vy * .18;
          if (p.y > h) Object.assign(p, P.spawn(w, h, false));
        }
        if (R() < .0015) this.flash = 1;
        if (this.flash > .01) { ctx.fillStyle = `rgba(200,215,230,${this.flash * .18})`; ctx.fillRect(0, 0, w, h); this.flash *= .88; }
        return;
      }
      for (const p of this.parts) {
        p.ph += .02;
        if (kind === "montagne") {
          p.x += p.vx + Math.sin(p.ph) * .25; p.y += p.vy;
          ctx.fillStyle = `rgba(235,240,245,${.25 + p.r * .25})`;
          if (p.y > h + 4 || p.x > w + 4) Object.assign(p, P.spawn(w, h, false), { x: R() * w * 1.2 - w * .2 });
        } else if (kind === "terre") {
          p.x += p.vx; p.y += p.vy + Math.sin(p.ph) * .15;
          ctx.fillStyle = `rgba(220,180,130,${p.a})`;
          if (p.x > w + 4) Object.assign(p, P.spawn(w, h, false));
        } else {
          p.y += p.vy; p.x += Math.sin(p.ph + t) * .2;
          ctx.fillStyle = `rgba(255,220,160,${p.a * (.6 + .4 * Math.sin(p.ph * 2))})`;
          if (p.y < -4) Object.assign(p, P.spawn(w, h, false));
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
    }
    destroy() {
      cancelAnimationFrame(this.raf); this.ro.disconnect(); this.io.disconnect(); instances.delete(this);
    }
  }

  function mountScene(el, univers, density = 1) {
    if (!BACKDROPS[univers]) return;
    el.classList.add("scene", "scene-" + univers);
    el.innerHTML = "";
    new Scene(el, univers, density);
  }
  function destroyAll() { for (const s of [...instances]) s.destroy(); }

  window.SKXWeather = { mountScene, destroyAll };
})();
