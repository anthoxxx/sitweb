/* SKX — effets météo animés (neige, pluie, poussière, soleil) sur <canvas>. */
(function () {
  const instances = new Set();
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  class Weather {
    constructor(canvas, mode, density = 1) {
      this.c = canvas;
      this.ctx = canvas.getContext("2d");
      this.mode = mode;
      this.density = density;
      this.parts = [];
      this.visible = true;
      this.flash = canvas.parentElement.querySelector(".flash");
      this.resize = this.resize.bind(this);
      this.loop = this.loop.bind(this);
      this.resize();
      window.addEventListener("resize", this.resize);
      this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
      this.io.observe(canvas);
      instances.add(this);
      if (!reduced) this.raf = requestAnimationFrame(this.loop);
      else this.draw();
    }

    resize() {
      const r = this.c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = r.width; this.h = r.height;
      this.c.width = Math.max(1, r.width * dpr);
      this.c.height = Math.max(1, r.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = (this.w * this.h) / 10000;
      const per = { snow: 1.3, rain: 2.2, dust: .9, sun: .5 }[this.mode] || 1;
      const n = Math.min(500, Math.round(area * per * this.density));
      this.parts = Array.from({ length: n }, () => this.spawn(true));
    }

    spawn(init) {
      const w = this.w, h = this.h, R = Math.random;
      switch (this.mode) {
        case "snow": return { x: R() * w, y: init ? R() * h : -10, r: 1 + R() * 3, vy: .4 + R() * 1.2, vx: -.3 + R() * .6, ph: R() * 6.28 };
        case "rain": return { x: R() * (w + 200), y: init ? R() * h : -30, l: 12 + R() * 18, vy: 9 + R() * 8, a: .2 + R() * .4 };
        case "dust": return { x: R() * w, y: init ? R() * h : h + 5, r: .6 + R() * 2.2, vx: .3 + R() * 1.2, vy: -.1 - R() * .4, a: .15 + R() * .5, ph: R() * 6.28 };
        case "sun": return { x: R() * w, y: init ? R() * h : h + 10, r: 1 + R() * 3, vy: -.2 - R() * .6, a: .2 + R() * .6, ph: R() * 6.28 };
      }
    }

    loop() {
      if (!this.c.isConnected) return this.destroy();
      if (this.visible && !document.hidden) this.draw();
      this.raf = requestAnimationFrame(this.loop);
    }

    draw() {
      const ctx = this.ctx, w = this.w, h = this.h;
      ctx.clearRect(0, 0, w, h);
      const t = performance.now() / 1000;
      if (this.mode === "rain") {
        ctx.lineCap = "round";
        ctx.lineWidth = 1.2;
        for (const p of this.parts) {
          ctx.strokeStyle = `rgba(174,205,240,${p.a})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.l * .25, p.y + p.l);
          ctx.stroke();
          p.y += p.vy; p.x -= p.vy * .25;
          if (p.y > h) {
            // éclaboussure
            ctx.strokeStyle = `rgba(174,205,240,${p.a * .8})`;
            ctx.beginPath(); ctx.ellipse(p.x, h - 3, 4, 1.2, 0, 0, Math.PI * 2); ctx.stroke();
            Object.assign(p, this.spawn(false));
          }
        }
        // éclairs
        if (this.flash && Math.random() < .0025) this.lightning();
        return;
      }
      for (const p of this.parts) {
        if (this.mode === "snow") {
          p.ph += .02;
          p.x += p.vx + Math.sin(p.ph) * .4; p.y += p.vy;
          ctx.fillStyle = `rgba(255,255,255,${.5 + p.r / 8})`;
          if (p.y > h + 5 || p.x < -10 || p.x > w + 10) Object.assign(p, this.spawn(false));
        } else if (this.mode === "dust") {
          p.ph += .015;
          p.x += p.vx; p.y += p.vy + Math.sin(p.ph) * .3;
          ctx.fillStyle = `rgba(255,214,160,${p.a})`;
          if (p.x > w + 5 || p.y < -5) { Object.assign(p, this.spawn(false)); p.x = -5; p.y = Math.random() * h; }
        } else if (this.mode === "sun") {
          p.ph += .03;
          p.y += p.vy; p.x += Math.sin(p.ph + t) * .3;
          ctx.fillStyle = `rgba(255,255,230,${p.a * (.6 + .4 * Math.sin(p.ph * 2))})`;
          if (p.y < -10) Object.assign(p, this.spawn(false));
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    lightning() {
      const f = this.flash;
      f.animate([{ opacity: 0 }, { opacity: .5 }, { opacity: .05 }, { opacity: .35 }, { opacity: 0 }], { duration: 650, easing: "ease-out" });
    }

    destroy() {
      cancelAnimationFrame(this.raf);
      window.removeEventListener("resize", this.resize);
      this.io.disconnect();
      instances.delete(this);
    }
  }

  /* Décors SVG pour chaque univers */
  const SCENES = {
    montagne: `
      <svg class="mt" viewBox="0 0 1200 500" preserveAspectRatio="none">
        <path d="M0 500 L0 300 L140 170 L230 250 L380 80 L520 260 L640 150 L800 320 L930 120 L1060 260 L1200 180 L1200 500Z" fill="#2c4a63" opacity=".8"/>
        <path d="M380 80 L330 140 L360 135 L380 160 L405 130 L430 140Z M930 120 L885 175 L915 168 L935 190 L955 165 L975 172Z" fill="#e8f4fb" opacity=".9"/>
        <path d="M0 500 L0 380 L180 260 L300 340 L460 210 L600 360 L760 240 L900 380 L1050 280 L1200 350 L1200 500Z" fill="#16293a"/>
        <path d="M460 210 L420 250 L445 248 L462 268 L480 246 L500 252Z M760 240 L725 275 L750 272 L765 290 L780 270 L798 276Z" fill="#cfe3f0" opacity=".85"/>
        <path d="M0 500 L0 440 L200 380 L420 450 L640 400 L860 460 L1200 410 L1200 500Z" fill="#0b1520"/>
      </svg><canvas></canvas>`,
    terre: `
      <svg class="dunes" viewBox="0 0 1200 400" preserveAspectRatio="none">
        <path d="M0 400 L0 170 Q200 90 420 170 T860 150 T1200 140 L1200 400Z" fill="#8a5a33" opacity=".85"/>
        <path d="M0 400 L0 240 Q260 170 520 250 T1000 220 T1200 230 L1200 400Z" fill="#6d4426"/>
        <path d="M0 400 L0 310 Q300 260 600 320 T1200 300 L1200 400Z" fill="#4a2c17"/>
        <path d="M0 400 L0 360 Q400 330 800 370 T1200 360 L1200 400Z" fill="#2b1a0e"/>
        <g stroke="#2b1a0e" stroke-width="3" fill="none" opacity=".6">
          <path d="M880 230 v-60 M880 200 q-18 0 -18 -20 M880 190 q18 0 18 -24"/>
          <path d="M180 270 v-46 M180 250 q-14 0 -14 -16 M180 240 q14 0 14 -18"/>
        </g>
      </svg><canvas></canvas>`,
    pluie: `
      <svg class="clouds" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <g fill="#0e1822">
          <ellipse cx="150" cy="120" rx="220" ry="90"/><ellipse cx="420" cy="90" rx="260" ry="110"/>
          <ellipse cx="720" cy="130" rx="240" ry="90"/><ellipse cx="1000" cy="100" rx="280" ry="110"/>
        </g>
        <g fill="#1a2a3a" opacity=".8">
          <ellipse cx="300" cy="170" rx="200" ry="60"/><ellipse cx="850" cy="180" rx="230" ry="60"/>
        </g>
      </svg>
      <svg class="city" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 V120 h60 V80 h40 v40 h30 V60 h50 v60 h40 V100 h60 V40 h45 v80 h35 V90 h70 v30 h40 V70 h55 v50 h30 V100 h60 V50 h40 v70 h50 V85 h65 v35 h40 V60 h50 v60 h45 V95 h60 V200Z" fill="#070b10"/>
        <g fill="#ffd27a" opacity=".55"><rect x="190" y="70" width="6" height="6"/><rect x="290" y="55" width="6" height="6"/><rect x="560" y="85" width="6" height="6"/><rect x="760" y="65" width="6" height="6"/><rect x="980" y="75" width="6" height="6"/><rect x="1040" y="95" width="6" height="6"/></g>
      </svg>
      <div class="flash"></div><canvas></canvas>`,
    soleil: `
      <div class="rays"></div><div class="sun"></div>
      <svg class="heat" viewBox="0 0 1200 150" preserveAspectRatio="none">
        <path d="M0 150 V70 Q150 40 300 70 T600 60 T900 75 T1200 55 V150Z" fill="#e65100" opacity=".55"/>
        <path d="M0 150 V100 Q200 80 400 105 T800 95 T1200 100 V150Z" fill="#bf360c" opacity=".7"/>
      </svg><canvas></canvas>`
  };

  function mountScene(el, univers, density) {
    el.classList.add("scene", "scene-" + univers);
    el.innerHTML = SCENES[univers] || "";
    const canvas = el.querySelector("canvas");
    const mode = { montagne: "snow", terre: "dust", pluie: "rain", soleil: "sun" }[univers];
    if (canvas && mode) requestAnimationFrame(() => new Weather(canvas, mode, density));
  }

  function destroyAll() { for (const w of [...instances]) w.destroy(); }

  window.SKXWeather = { mountScene, destroyAll };
})();
