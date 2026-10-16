/* ================= SKX — application ================= */
(function () {
  "use strict";

  /* ---------- Outils ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch {} }
  };
  const session = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { sessionStorage.removeItem(k); } catch {} }
  };
  function cyrb53(str, seed = 7) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  const hasSubtle = !!(window.crypto && crypto.subtle);
  async function derive(pwd, salt) {
    if (!hasSubtle) return "c53$" + cyrb53(salt + "|" + pwd);
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(pwd), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 120000 }, key, 256);
    return "pbkdf2$" + [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function verify(pwd, salt, stored) {
    if (stored.startsWith("pbkdf2$") && !hasSubtle) throw new Error("Ouvre le site en https pour te connecter.");
    if (stored.startsWith("c53$")) return "c53$" + cyrb53(salt + "|" + pwd) === stored;
    return (await derive(pwd, salt)) === stored;
  }
  const DEFAULT_PASSWORD = "skx2026";

  const ZONE_IDS = ["streetwear", "sport", "premiere", "accessoires", "cool"];
  const UTINT = { streetwear: "#c9c6bd", sport: "#8fb4c9", premiere: "#d4a94f", accessoires: "#a39e93", cool: "#d0876a" };
  const GENDERS = { homme: "Homme", femme: "Femme", enfant: "Enfants", mixte: "Mixte" };
  const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
  const TYPES = { tshirt: "T-shirt", hoodie: "Hoodie", veste: "Veste", pantalon: "Pantalon", casquette: "Casquette", bonnet: "Bonnet" };
  const TYPE_CODE = { tshirt: "TS", hoodie: "HD", veste: "JK", pantalon: "PT", casquette: "CP", bonnet: "BN" };
  const MAT_CATEGORIES = ["Tissu", "Bord-côte", "Doublure", "Rembourrage", "Fil à tricoter", "Fil", "Étiquette", "Accessoire", "Emballage"];
  const MAT_UNITS = ["m", "kg", "pièce", "bobine"];
  const CERTS = ["GOTS", "OCS", "GRS", "RCS", "OEKO-TEX 100", "bluesign", "EU Ecolabel", "Fair Wear", "FSC"];
  const FIBER_CERTS = ["GOTS", "OCS", "GRS", "RCS"];
  const STATUSES = ["Prototype", "Validé", "En production", "Arrêté"];
  const NEAR_COUNTRIES = ["france", "portugal", "espagne", "italie", "allemagne", "belgique", "pays-bas", "autriche", "suisse", "grèce", "pologne", "roumanie", "bulgarie", "lituanie", "lettonie", "estonie", "république tchèque", "slovénie", "croatie", "hongrie", "slovaquie", "danemark", "suède", "irlande", "royaume-uni", "turquie", "maroc", "tunisie", "europe"];
  const ROLES = {
    admin: { label: "Admin", desc: "Accès total, gère l'équipe", tabs: ["dashboard", "products", "specs", "materials", "charter", "promos", "designs", "zones", "history", "people", "radio", "orders", "team", "settings", "account"], publish: true },
    gestion: { label: "Gestion", desc: "Boutique, stock, radio", tabs: ["dashboard", "products", "specs", "materials", "charter", "promos", "designs", "zones", "history", "people", "radio", "orders", "account"], publish: true },
    atelier: { label: "Atelier", desc: "Matières et fiches techniques", tabs: ["dashboard", "specs", "materials", "charter", "account"], publish: true },
    lecture: { label: "Lecture", desc: "Consultation seule", tabs: ["dashboard", "products", "specs", "materials", "charter", "account"], publish: false, readOnly: true }
  };
  const TAB_LABELS = { dashboard: "Tableau de bord", products: "Produits", specs: "Fiches techniques", materials: "Matières", charter: "Cahier des charges", promos: "Promotions", designs: "Personnalisation", zones: "Zones", history: "Histoire", people: "Page équipe", radio: "Radio", orders: "Commandes", team: "Accès", settings: "Réglages", account: "Mon compte" };

  /* ---------- Données ---------- */
  let PUBLISHED = normalize(clone(window.SKX_DATA || {}));
  let draft = store.get("skx_draft", null);
  let DATA = draft ? normalize(draft) : clone(PUBLISHED);

  function normalize(d) {
    const base = window.SKX_DATA || {};
    d.settings = Object.assign({}, base.settings, d.settings);
    d.zones = Object.assign({}, clone(base.zones || {}), d.zones);
    for (const u of ZONE_IDS) d.zones[u] = Object.assign({ name: u, tagline: "", description: "", metric: "" }, (base.zones || {})[u], d.zones[u]);
    d.history = d.history && Array.isArray(d.history.slides) ? d.history : clone(base.history || { intro: "", slides: [] });
    d.people = Array.isArray(d.people) ? d.people : clone(base.people || []);
    d.stations = Array.isArray(d.stations) && d.stations.length ? d.stations : clone(base.stations || []);
    d.products = Array.isArray(d.products) ? d.products : [];
    d.materials = Array.isArray(d.materials) ? d.materials : clone(base.materials || []);
    d.charter = d.charter && Array.isArray(d.charter.rules) ? d.charter : clone(base.charter || { intro: "", rules: [] });
    d.team = Array.isArray(d.team) ? d.team : [];
    d.designs = Array.isArray(d.designs) && d.designs.length ? d.designs : clone(base.designs || [{ id: "none", name: "Uni", price: 0, enabled: true, image: "" }]);
    d.promos = Object.assign(clone(base.promos || { maxCode: 70, maxSale: 50, codes: [], sales: [], volume: { enabled: false, tiers: [] }, giftWrap: { enabled: false, price: 0 } }), d.promos || {});
    d.promos.maxCode = Math.min(+d.promos.maxCode || 70, 70); d.promos.maxSale = Math.min(+d.promos.maxSale || 50, 50);
    d.people.forEach((m) => { m.avatar = Object.assign({ hair: "court", facial: "aucune", acc: "aucun", top: "#1c1f22", bg: "streetwear", skin: "#cbc3b4", hairColor: "#1b1a19" }, m.avatar || {}); });
    d.products.forEach((p) => { ensureSpec(p); if (!ZONE_IDS.includes(p.zone)) p.zone = "streetwear"; if (!GENDERS[p.gender]) p.gender = "mixte"; delete p.univers; if (!Array.isArray(p.colors) || !p.colors.length) p.colors = [{ name: "Unique", hex: p.color || "#c9c4b8" }]; if (p.customizable === undefined) p.customizable = ["tshirt", "hoodie", "veste", "casquette"].includes(p.type); });
    delete d.univers;
    return d;
  }
  function ensureSpec(p) {
    p.spec = Object.assign({ status: "Prototype", madeIn: "", workshop: "", construction: "", finishing: "", care: "", notes: "", components: [] }, p.spec || {});
    if (!Array.isArray(p.spec.components)) p.spec.components = [];
    return p;
  }
  function saveDraft() {
    draft = DATA;
    if (!store.set("skx_draft", DATA)) toast("Stockage du navigateur plein. Utilise des liens d'images plutôt que des fichiers importés.");
    applySettings();
  }
  const S = () => DATA.settings;
  const money = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: S().currency || "EUR" }).format(+n || 0);
  const num = (n, d = 0) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d }).format(+n || 0);
  const productById = (id) => DATA.products.find((p) => p.id === id);
  const materialById = (id) => DATA.materials.find((m) => m.id === id);

  /* ---------- Calculs fiche technique ---------- */
  function compMass(c, m) {
    if (!m) return 0;
    if (m.unit === "kg") return (+c.qty || 0) * 1000;
    if (m.unit === "m" && m.weight) return (+c.qty || 0) * m.weight * 1.5; // laize moyenne 150 cm
    return 0;
  }
  const isFiberCertified = (m) => (m.certifications || []).some((c) => FIBER_CERTS.includes(c));
  const isNear = (country) => { const c = String(country || "").toLowerCase().trim(); return !!c && NEAR_COUNTRIES.some((n) => c.includes(n)); };
  function specStats(p) {
    ensureSpec(p);
    let cost = 0, mass = 0, certMass = 0;
    const mats = [];
    for (const c of p.spec.components) {
      const m = materialById(c.materialId);
      if (!m) continue;
      cost += (+c.qty || 0) * (+m.price || 0);
      const ms = compMass(c, m);
      mass += ms; if (isFiberCertified(m)) certMass += ms;
      mats.push(m);
    }
    const share = mass ? certMass / mass : null;
    const ht = (+p.price || 0) / 1.2;
    const coef = cost ? ht / cost : null;
    const uniq = [...new Map(mats.map((m) => [m.id, m])).values()];
    const textiles = uniq.filter((m) => m.unit === "m" || m.unit === "kg");
    const checks = [];
    checks.push({ ok: share !== null && share >= .9, text: share === null ? "Aucun textile renseigné" : `Fibres certifiées bio ou recyclées : ${num(share * 100)} % du poids (min. 90 %)` });
    const uncert = textiles.filter((m) => !isFiberCertified(m));
    checks.push({ ok: !uncert.length, text: uncert.length ? `Textiles sans certification de fibre : ${uncert.map((m) => m.name).join(", ")}` : "Tous les textiles ont une certification de fibre (GOTS, OCS, GRS)" });
    const conv = uniq.filter((m) => /coton/i.test(m.composition) && !/bio|recycl/i.test(m.composition));
    checks.push({ ok: !conv.length, text: conv.length ? `Coton non biologique : ${conv.map((m) => m.name).join(", ")}` : "Coton 100 % biologique" });
    const virgin = uniq.filter((m) => /(polyester|polyamide|nylon)/i.test(m.composition) && !/recycl/i.test(m.composition));
    checks.push({ ok: !virgin.length, text: virgin.length ? `Synthétique non recyclé : ${virgin.map((m) => m.name).join(", ")}` : "Aucun synthétique vierge" });
    const far = uniq.filter((m) => !isNear(m.origin));
    const madeNear = isNear(p.spec.madeIn);
    checks.push({ ok: !far.length && madeNear, text: !madeNear ? "Pays de fabrication non renseigné ou hors Europe / Méditerranée" : far.length ? `Matières hors zone : ${far.map((m) => `${m.name} (${m.origin || "?"})`).join(", ")}` : "Matières et confection en Europe / Méditerranée" });
    const missing = ["workshop", "construction", "care"].filter((k) => !String(p.spec[k] || "").trim());
    checks.push({ ok: !missing.length, text: missing.length ? "Fiche incomplète : " + missing.map((k) => ({ workshop: "atelier", construction: "construction", care: "entretien" }[k])).join(", ") : "Fiche complète (atelier, construction, entretien)" });
    return { cost, mass, share, coef, checks, issues: checks.filter((c) => !c.ok).length, materials: uniq };
  }

  /* ---------- Visuels produits (dessin technique) ---------- */
  const SHAPES = {
    tshirt: { body: "M70 42 L50 48 L24 70 L39 95 L58 86 L58 178 L142 178 L142 86 L161 95 L176 70 L150 48 L130 42 Q100 62 70 42 Z", stitch: ["M58 170 H142", "M27 76 L40 98", "M173 76 L160 98", "M74 44 Q100 60 126 44"] },
    hoodie: { body: "M74 44 Q100 16 126 44 L150 52 L176 130 L157 137 L142 96 L142 180 L58 180 L58 96 L43 137 L24 130 L50 52 Z", stitch: ["M82 47 Q100 76 118 47", "M74 140 H126 V164 H74 Z", "M58 170 H142", "M30 124 L44 130", "M170 124 L156 130", "M96 70 L94 96", "M104 70 L106 96"] },
    veste: { body: "M76 40 L124 40 L152 52 L178 132 L159 138 L144 98 L144 180 L56 180 L56 98 L41 138 L22 132 L48 52 Z", stitch: ["M100 46 V180", "M76 40 L100 60 L124 40", "M64 130 H90", "M110 130 H136", "M56 110 H144", "M56 150 H144"] },
    pantalon: { body: "M64 30 L136 30 L145 182 L110 182 L100 84 L90 182 L55 182 L64 30 Z", stitch: ["M64 42 H136", "M66 70 Q76 76 86 66", "M134 70 Q124 76 114 66", "M60 120 H80 V140 H60", "M120 120 H140 V140 H120", "M57 172 H88", "M112 172 H143"] },
    casquette: { body: "M52 128 Q52 66 102 66 Q150 66 150 128 Z", stitch: ["M102 66 V128", "M76 72 Q70 100 72 128", "M128 72 Q134 100 132 128"], extra: '<path d="M44 126 L178 126 Q186 142 160 144 L44 136 Z" fill="rgba(0,0,0,.25)" stroke="rgba(0,0,0,.45)" stroke-width="1"/><circle cx="102" cy="66" r="4" fill="rgba(0,0,0,.3)"/>' },
    bonnet: { body: "M56 150 Q56 62 100 62 Q144 62 144 150 Z", stitch: ["M64 80 V150", "M74 70 V150", "M84 64 V150", "M94 62 V150", "M106 62 V150", "M116 64 V150", "M126 70 V150", "M136 80 V150"], extra: '<rect x="52" y="132" width="96" height="30" rx="2" fill="rgba(0,0,0,.18)" stroke="rgba(0,0,0,.45)" stroke-width="1"/>' }
  };
  // Règle de marquage : logo SKX brodé en bas à gauche + étiquette dans le col
  const LOGO_BL = { tshirt: [70, 168, 7], hoodie: [70, 172, 7], veste: [68, 172, 7], pantalon: [68, 164, 6], casquette: [70, 120, 6], bonnet: [66, 152, 6] };
  const COLLAR = { tshirt: [94, 47], hoodie: [94, 50], veste: [94, 44] };
  // Emplacement du motif personnalisé : [x, y, taille]
  const DESIGN_AT = { tshirt: [100, 100, 44], hoodie: [100, 104, 38], veste: [122, 88, 22], pantalon: [80, 104, 20], casquette: [101, 100, 28], bonnet: [100, 104, 28] };
  const BUILTIN_DESIGNS = {
    crete: (x, y, s, c) => `<g fill="none" stroke="${c}" stroke-width="${s / 22}" stroke-linejoin="round"><path d="M${x - s / 2} ${y + s * .22} L${x - s * .26} ${y - s * .06} L${x - s * .12} ${y + s * .08} L${x + s * .06} ${y - s * .24} L${x + s * .24} ${y + s * .02} L${x + s / 2} ${y + s * .22}"/><path d="M${x + s * .06} ${y - s * .24} L${x + s * .0} ${y - s * .14} L${x + s * .12} ${y - s * .14}" stroke-width="${s / 40}"/><line x1="${x - s / 2}" y1="${y + s * .3}" x2="${x + s / 2}" y2="${y + s * .3}"/></g>`,
    gothique: (x, y, s, c) => `<text x="${x}" y="${y + s * .18}" text-anchor="middle" font-family="Pirata One, serif" font-size="${s * .62}" fill="${c}">SKX</text>`,
    boussole: (x, y, s, c) => `<g fill="none" stroke="${c}" stroke-width="${s / 30}"><circle cx="${x}" cy="${y}" r="${s * .36}"/><circle cx="${x}" cy="${y}" r="${s * .28}" stroke-dasharray="1 2"/><path d="M${x} ${y - s * .34} L${x + s * .07} ${y} L${x} ${y + s * .34} L${x - s * .07} ${y} Z" fill="${c}" fill-opacity=".85"/></g><text x="${x}" y="${y - s * .42}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="${s * .12}" fill="${c}">N</text>`,
    altitude: (x, y, s, c) => `<path d="M${x - s * .14} ${y - s * .06} L${x} ${y - s * .3} L${x + s * .14} ${y - s * .06} Z" fill="${c}"/><text x="${x}" y="${y + s * .16}" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="${s * .26}" fill="${c}">4808</text><text x="${x}" y="${y + s * .3}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="${s * .1}" letter-spacing="1" fill="${c}">MÈTRES</text>`,
    slogan: (x, y, s, c) => `<g font-family="Archivo, sans-serif" font-weight="800" text-anchor="middle" fill="${c}"><text x="${x}" y="${y - s * .04}" font-size="${s * .17}">TA FIERTÉ,</text><text x="${x}" y="${y + s * .16}" font-size="${s * .17}">TON PROGRÈS</text></g><line x1="${x - s * .3}" y1="${y + s * .26}" x2="${x + s * .3}" y2="${y + s * .26}" stroke="${c}" stroke-width="${s / 50}"/>`
  };
  function lum(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return .5;
    const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }
  const designById = (id) => (DATA.designs || []).find((d) => d.id === id);
  function productSVG(p, opt = {}) {
    const light = !!opt.light;
    const sh = SHAPES[p.type] || SHAPES.tshirt;
    const colorHex = opt.color || p.color;
    const color = /^#[0-9a-f]{6}$/i.test(colorHex) ? colorHex : "#bbbbbb";
    const tint = UTINT[p.zone] || "#888";
    const g = "g" + Math.random().toString(36).slice(2, 8);
    const dark = lum(color) > .5;
    const stitchCol = dark ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.28)";
    const ink = dark ? "#151413" : "#efece4";
    const main = (p.spec?.components || []).map((c) => materialById(c.materialId)).find((m) => m && m.weight);
    const code = `SKX/${TYPE_CODE[p.type] || "XX"}-${String(p.id).replace(/^p-/, "").slice(0, 6).toUpperCase()}`;
    const bg = light ? "#ffffff" : "#121211";
    const meta = light ? "#555" : "#8f8d85";
    const [lx, ly, ls] = LOGO_BL[p.type] || LOGO_BL.tshirt;
    const col = COLLAR[p.type];
    const d = opt.design && opt.design !== "none" ? designById(opt.design) : null;
    const [dx, dy, ds] = DESIGN_AT[p.type] || DESIGN_AT.tshirt;
    let motif = "";
    if (d) motif = d.image ? `<image href="${esc(d.image)}" x="${dx - ds / 2}" y="${dy - ds / 2}" width="${ds}" height="${ds}" preserveAspectRatio="xMidYMid meet"/>` : (BUILTIN_DESIGNS[d.id] ? BUILTIN_DESIGNS[d.id](dx, dy, ds, ink) : "");
    return `<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.name)}">
      <defs>
        <radialGradient id="${g}b" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="${tint}" stop-opacity="${light ? 0 : .16}"/><stop offset="1" stop-color="${bg}" stop-opacity="0"/></radialGradient>
        <linearGradient id="${g}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
      </defs>
      <rect width="200" height="250" fill="${bg}"/><rect width="200" height="250" fill="url(#${g}b)"/>
      <g transform="translate(0,22)">
        <ellipse cx="100" cy="196" rx="58" ry="5" fill="#000" opacity="${light ? .08 : .45}"/>
        <path d="${sh.body}" fill="${color}" stroke="rgba(0,0,0,.55)" stroke-width="1" stroke-linejoin="round"/>
        ${sh.extra || ""}
        <path d="${sh.body}" fill="url(#${g}s)"/>
        <g fill="none" stroke="${stitchCol}" stroke-width=".7" stroke-dasharray="2 1.6">${sh.stitch.map((s) => `<path d="${s}"/>`).join("")}</g>
        ${motif}
        ${col ? `<rect x="${col[0]}" y="${col[1]}" width="12" height="6" fill="#111" stroke="rgba(255,255,255,.35)" stroke-width=".4"/><text x="${col[0] + 6}" y="${col[1] + 4.6}" text-anchor="middle" font-family="Pirata One, serif" font-size="4.6" fill="#eee">SKX</text>` : ""}
        <text x="${lx}" y="${ly}" font-family="Pirata One, serif" font-size="${ls}" fill="${ink}" opacity=".9">SKX</text>
      </g>
      <g font-family="JetBrains Mono, monospace" font-size="6.5" letter-spacing=".8" fill="${meta}">
        <text x="12" y="240">${esc(code)}</text>
        <text x="188" y="240" text-anchor="end">${main ? esc(main.weight + " G/M²") : esc((TYPES[p.type] || "").toUpperCase())}</text>
      </g>
    </svg>`;
  }
  const productVisual = (p, opt = {}) => (p.image && !opt.custom ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : productSVG(p, opt));

  /* ---------- Prix, soldes, codes promo ---------- */
  const round2 = (n) => Math.round(n * 100) / 100;
  const today = () => new Date().toISOString().slice(0, 10);
  const P = () => DATA.promos;
  function activeSales() {
    const t = today();
    return (P().sales || []).filter((s) => s.active && (!s.start || s.start <= t) && (!s.end || s.end >= t));
  }
  function saleFor(p) {
    let best = null;
    for (const s of activeSales()) if ((s.productIds || []).includes(p.id) && (!best || s.percent > best.percent)) best = s;
    return best ? { name: best.name, percent: Math.min(+best.percent || 0, +P().maxSale || 50) } : null;
  }
  function priceInfo(p) {
    const sale = saleFor(p);
    if (sale && sale.percent > 0) return { now: round2(p.price * (1 - sale.percent / 100)), was: p.price, sale };
    return { now: +p.price, was: p.oldPrice && +p.oldPrice > +p.price ? +p.oldPrice : null, sale: null };
  }
  const priceHTML = (p) => { const pi = priceInfo(p); return `${money(pi.now)}${pi.was ? `<s>${money(pi.was)}</s>` : ""}`; };
  const normCode = (c) => String(c || "").trim().toUpperCase();
  const codeHash = (c) => cyrb53(normCode(c), 2014);
  function findCode(code) {
    const h = codeHash(code), t = today();
    return (P().codes || []).find((c) => c.hash === h && c.active && (!c.expires || c.expires >= t)) || null;
  }

  /* ---------- UI générale ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }
  function applySettings() {
    const s = S();
    document.title = s.shopName || "SKX";
    const sales = activeSales();
    $("#announce").textContent = sales.length ? `${sales[0].name} : jusqu'à −${Math.min(Math.max(...sales.map((x) => +x.percent || 0)), +P().maxSale || 50)} % — ${s.announcement || ""}` : s.announcement || "";
    $("#navSoldes").hidden = !sales.length;
    $("#footerSlogan").textContent = s.slogan || "";
    $("#founded").textContent = s.founded || "2014";
    $$(".contact-mail").forEach((a) => { a.href = s.contactEmail ? `mailto:${s.contactEmail}` : "#"; a.textContent = s.contactEmail || ""; });
    const u = currentUser();
    $("#teamName").textContent = u ? u.name.split(" ")[0] : "";
  }
  function openModal(html, width) {
    const box = $("#modalBox");
    box.style.width = width ? `min(${width}px, 100%)` : "";
    box.innerHTML = `<button class="icon-btn modal-close" data-close data-ro-ok aria-label="Fermer">✕</button>` + html;
    $("#modal").classList.add("open");
    document.body.style.overflow = "hidden";
    box.scrollTop = 0;
    return box;
  }
  function closeModal() { $("#modal").classList.remove("open"); document.body.style.overflow = ""; }
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal" || e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeCart(); } });
  $("#burger").addEventListener("click", () => {
    const open = $("#nav").classList.toggle("open");
    $("#burger").setAttribute("aria-expanded", open);
  });
  $("#nav").addEventListener("click", (e) => { if (e.target.closest("a")) { $("#nav").classList.remove("open"); $("#burger").setAttribute("aria-expanded", false); } });

  /* ---------- Cartes produits ---------- */
  function productCard(p) {
    const u = DATA.zones[p.zone];
    const out = (+p.stock || 0) <= 0;
    const pi = priceInfo(p);
    const off = pi.was ? Math.round(100 - (pi.now / pi.was) * 100) : 0;
    const colors = (p.colors || []).slice(0, 5);
    return `<article class="card" data-product="${esc(p.id)}" tabindex="0">
      <div class="card-img">
        ${productVisual(p)}
        ${u ? `<span class="tag"><span class="sw sw-${p.zone}"></span>${esc(u.name)}</span>` : ""}
        ${out ? `<span class="tag tag-r tag-out">Épuisé</span>` : pi.sale ? `<span class="tag tag-r tag-sale">Soldes −${off} %</span>` : off ? `<span class="tag tag-r tag-promo">−${off} %</span>` : p.zone === "premiere" ? `<span class="tag tag-r tag-limited">Série limitée</span>` : (+p.stock || 0) <= 5 ? `<span class="tag tag-r tag-promo">Derniers</span>` : ""}
      </div>
      <div class="card-row">
        <h3>${esc(p.name)}</h3>
        <span class="price">${priceHTML(p)}</span>
      </div>
      <div class="card-row card-meta">
        <span class="sub">${esc(GENDERS[p.gender] || "")} · ${esc(TYPES[p.type] || "")}</span>
        ${colors.length > 1 ? `<span class="dots">${colors.map((c) => `<i style="background:${esc(c.hex)}" title="${esc(c.name)}"></i>`).join("")}</span>` : ""}
      </div>
    </article>`;
  }
  const grid = (list) => list.length ? `<div class="grid">${list.map(productCard).join("")}</div>` : `<div class="empty">Aucun article pour le moment. Les prochains drops arrivent.</div>`;
  document.addEventListener("click", (e) => { const c = e.target.closest("[data-product]"); if (c) openProduct(c.dataset.product); });
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches?.("[data-product]")) openProduct(e.target.dataset.product); });

  /* Recommandations : compléter la tenue */
  function recommend(exclude, n = 3, zone) {
    const inCartTypes = new Set(exclude.map((id) => productById(id)?.type).filter(Boolean));
    return DATA.products
      .filter((p) => !exclude.includes(p.id) && (+p.stock || 0) > 0)
      .map((p) => ({ p, s: (inCartTypes.has(p.type) ? 0 : 3) + (p.zone === zone ? 2 : 0) + (p.zone === "accessoires" ? 1.5 : 0) + (saleFor(p) ? 1 : 0) + (p.featured ? .5 : 0) + Math.random() * .4 }))
      .sort((a, b) => b.s - a.s).slice(0, n).map((x) => x.p);
  }
  const miniCard = (p) => `<button class="mini" data-product="${esc(p.id)}"><span class="mini-img">${productVisual(p)}</span><span class="mini-txt"><b>${esc(p.name)}</b><span class="price">${priceHTML(p)}</span></span></button>`;
  const seen = () => store.get("skx_seen", []).filter((id) => productById(id));
  function markSeen(id) { const s = seen().filter((x) => x !== id); s.unshift(id); store.set("skx_seen", s.slice(0, 8)); }

  /* ---------- Fiche produit ---------- */
  function openProduct(id) {
    const p = productById(id); if (!p) return;
    markSeen(id);
    const sizes = p.sizes && p.sizes.length ? p.sizes : ["Unique"];
    let size = sizes.length === 1 ? sizes[0] : null, qty = 1;
    const colors = p.colors && p.colors.length ? p.colors : [{ name: "Unique", hex: p.color }];
    let color = colors[0], design = "none";
    const designs = p.customizable ? (DATA.designs || []).filter((d) => d.enabled) : [];
    const stock = +p.stock || 0;
    const u = DATA.zones[p.zone];
    const st = specStats(p);
    const pi = priceInfo(p);
    const visibleMats = st.materials.filter((m) => !["Fil", "Étiquette", "Accessoire", "Emballage"].includes(m.category));
    const recos = recommend([p.id, ...cart.map((l) => l.id)], 3, p.zone);
    const box = openModal(`<div class="pdp">
      <div class="pdp-img" id="pdpImg">${productVisual(p)}</div>
      <div class="pdp-info">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${u ? `<a href="#/zone/${p.zone}" data-close class="tag"><span class="sw sw-${p.zone}"></span>${esc(u.name)}</a>` : ""}
          ${pi.sale ? `<span class="tag tag-sale">${esc(pi.sale.name)}</span>` : ""}
          ${st.share !== null && st.share >= .9 ? `<span class="tag tag-bio">${num(st.share * 100)} % fibres certifiées</span>` : ""}
        </div>
        <h2>${esc(p.name)}</h2>
        <div class="price" id="pdpPrice"></div>
        <p class="muted" style="margin:0">${esc(p.description)}</p>
        ${colors.length > 1 ? `<div class="opt"><span class="label">Coloris · <b id="colorName">${esc(color.name)}</b></span>
          <div class="swatches" id="pdpColors">${colors.map((c, i) => `<button class="swatch ${i ? "" : "active"}" data-c="${i}" style="--c:${esc(c.hex)}" aria-label="${esc(c.name)}" title="${esc(c.name)}"></button>`).join("")}</div></div>` : ""}
        ${designs.length > 1 ? `<div class="opt"><span class="label">Dessin</span>
          <div class="designs" id="pdpDesigns">${designs.map((d) => `<button class="design ${d.id === "none" ? "active" : ""}" data-d="${esc(d.id)}">${esc(d.name)}${+d.price ? ` <span class="mono">+${money(d.price)}</span>` : ""}</button>`).join("")}</div></div>` : ""}
        <div class="opt"><span class="label">Taille</span>
          <div class="sizes" id="pdpSizes">${sizes.map((s) => `<button class="size ${s === size ? "active" : ""}" data-size="${esc(s)}">${esc(s)}</button>`).join("")}</div>
        </div>
        <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
          <div class="qty"><button data-q="-1" aria-label="Moins">−</button><span id="pdpQty">1</span><button data-q="1" aria-label="Plus">+</button></div>
          ${stock <= 0 ? `<span class="stock-low">Épuisé</span>` : stock <= 5 ? `<span class="stock-low">Plus que ${stock} en stock</span>` : `<span class="label">En stock · expédié sous 48 h</span>`}
        </div>
        <button class="btn btn-block" id="pdpAdd" ${stock <= 0 ? "disabled" : ""}>Ajouter au panier</button>
        <div class="compo">
          <div class="compo-row"><span class="label">Marquage</span><div>Logo SKX brodé en bas à gauche${COLLAR[p.type] ? " · étiquette SKX dans le col" : " · étiquette tissée SKX"}</div></div>
          ${visibleMats.length ? `<div class="compo-row"><span class="label">Composition</span><div>${visibleMats.map((m) => `${esc(m.composition)} <span class="muted">· ${esc(m.name)}</span>`).join("<br>")}</div></div>` : ""}
          ${visibleMats.length ? `<div class="compo-row"><span class="label">Certifications</span><div class="certs">${[...new Set(visibleMats.flatMap((m) => m.certifications || []))].map((c) => `<span class="cert">${esc(c)}</span>`).join("")}</div></div>` : ""}
          ${p.spec.madeIn ? `<div class="compo-row"><span class="label">Fabrication</span><div>${esc(p.spec.madeIn)}</div></div>` : ""}
          ${p.spec.care ? `<div class="compo-row"><span class="label">Entretien</span><div>${esc(p.spec.care)}</div></div>` : ""}
        </div>
        ${recos.length ? `<div class="opt"><span class="label">Complète la tenue</span><div class="minis">${recos.map(miniCard).join("")}</div></div>` : ""}
        <span class="label">Livraison offerte dès ${money(S().freeShippingFrom)} · Retours 30 jours</span>
      </div>
    </div>`);
    const surcharge = () => +(designById(design)?.price || 0);
    const refresh = () => {
      const unit = pi.now + surcharge();
      $("#pdpPrice", box).innerHTML = `${money(unit)}${pi.was ? `<s>${money(pi.was + surcharge())}</s>` : ""}`;
      const custom = color !== colors[0] || design !== "none";
      $("#pdpImg", box).innerHTML = productVisual(p, { color: color.hex, design, custom });
    };
    refresh();
    $("#pdpColors", box)?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]"); if (!b) return;
      color = colors[+b.dataset.c]; $("#colorName", box).textContent = color.name;
      $$(".swatch", box).forEach((x) => x.classList.toggle("active", x === b)); refresh();
    });
    $("#pdpDesigns", box)?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-d]"); if (!b) return;
      design = b.dataset.d; $$(".design", box).forEach((x) => x.classList.toggle("active", x === b)); refresh();
    });
    $("#pdpSizes", box).addEventListener("click", (e) => {
      const b = e.target.closest("[data-size]"); if (!b) return;
      size = b.dataset.size; $$(".size", box).forEach((x) => x.classList.toggle("active", x === b));
    });
    $$("[data-q]", box).forEach((b) => b.addEventListener("click", () => {
      qty = Math.max(1, Math.min(Math.max(1, stock), qty + +b.dataset.q)); $("#pdpQty").textContent = qty;
    }));
    $("#pdpAdd").addEventListener("click", () => {
      if (!size) { toast("Choisis une taille."); return; }
      addToCart({ id: p.id, size, qty, color: colors.length > 1 ? color.name : "", colorHex: color.hex, design }); closeModal(); openCart();
    });
  }

  /* ---------- Panier ---------- */
  let cart = store.get("skx_cart", []);
  let promo = store.get("skx_promo", null);
  let gift = false;
  const lineKey = (l) => [l.id, l.size, l.color || "", l.design || "none"].join("|");
  const saveCart = () => { cart = cart.filter((l) => productById(l.id)); store.set("skx_cart", cart); renderCart(); };
  function addToCart(item) {
    const p = productById(item.id);
    const inCart = cart.filter((l) => l.id === item.id).reduce((a, l) => a + l.qty, 0);
    const max = (+p.stock || 0) - inCart;
    if (max <= 0) { toast("Tout le stock disponible est déjà dans ton panier."); return; }
    const qty = Math.min(item.qty, max);
    const line = cart.find((l) => lineKey(l) === lineKey(item));
    if (line) line.qty += qty; else cart.push({ ...item, qty });
    saveCart();
    const c = $("#cartCount"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
  }
  function lineUnit(l) {
    const p = productById(l.id);
    return priceInfo(p).now + +(designById(l.design)?.price || 0);
  }
  function totals() {
    const pr = P();
    let sub = 0, eligible = 0, count = 0;
    for (const l of cart) {
      const p = productById(l.id); if (!p) continue;
      const amount = lineUnit(l) * l.qty;
      sub += amount; count += l.qty;
      if (!saleFor(p)) eligible += amount;
    }
    let code = promo ? findCode(promo.code) : null;
    if (promo && !code) { promo = null; store.del("skx_promo"); }
    let discount = 0, discountLabel = "";
    if (code) {
      const pct = Math.min(+code.percent || 0, +pr.maxCode || 70);
      discount = round2(eligible * pct / 100); discountLabel = `Code ${normCode(promo.code)} (−${pct} %)`;
    } else if (pr.volume?.enabled) {
      const tier = (pr.volume.tiers || []).filter((t) => count >= +t.qty).sort((a, b) => b.percent - a.percent)[0];
      if (tier) { discount = round2(sub * Math.min(+tier.percent, 50) / 100); discountLabel = `Remise ${tier.qty} pièces et + (−${tier.percent} %)`; }
    }
    const afterDisc = sub - discount;
    const giftPrice = gift && pr.giftWrap?.enabled ? +pr.giftWrap.price || 0 : 0;
    const ship = sub === 0 || afterDisc >= +S().freeShippingFrom ? 0 : +S().shippingPrice;
    return { sub: round2(sub), discount, discountLabel, gift: giftPrice, ship, total: round2(afterDisc + giftPrice + ship), count, afterDisc };
  }
  function nextTier(count) {
    const v = P().volume; if (!v?.enabled || promo) return null;
    return (v.tiers || []).filter((t) => +t.qty > count).sort((a, b) => a.qty - b.qty)[0] || null;
  }
  function renderCart() {
    cart = cart.filter((l) => productById(l.id));
    $("#cartCount").textContent = cart.reduce((a, l) => a + l.qty, 0);
    const body = $("#cartItems"), foot = $("#cartFoot");
    if (!cart.length) {
      const recos = recommend([], 3);
      body.innerHTML = `<div class="empty" style="margin-top:20px">Ton panier est vide.<br><br><a class="btn btn-sm" href="#/boutique" data-closecart>Voir la boutique</a></div>
        ${recos.length ? `<div class="opt" style="margin-top:20px"><span class="label">À découvrir</span><div class="minis">${recos.map(miniCard).join("")}</div></div>` : ""}`;
      foot.innerHTML = ""; return;
    }
    const t = totals();
    const free = +S().freeShippingFrom, left = free - t.afterDisc, pct = Math.min(100, (t.afterDisc / free) * 100);
    const nt = nextTier(t.count);
    const recos = recommend(cart.map((l) => l.id), 3);
    body.innerHTML = `<div class="ship-bar"><span class="label">${left > 0 ? `Plus que <b>${money(left)}</b> pour la livraison offerte` : "Livraison offerte"}</span><div class="bar"><i style="width:${pct}%"></i></div></div>
      ${nt ? `<p class="label" style="margin:8px 0 0">Ajoute ${nt.qty - t.count} pièce${nt.qty - t.count > 1 ? "s" : ""} : −${nt.percent} % sur tout le panier</p>` : ""}
      ${cart.map((l, i) => {
        const p = productById(l.id), d = designById(l.design);
        return `<div class="line">
          <div class="line-img">${productVisual(p, { color: l.colorHex, design: l.design, custom: !!(l.color || (l.design && l.design !== "none")) })}</div>
          <div style="display:grid;gap:4px"><b style="font-weight:500">${esc(p.name)}</b>
            <span class="label">Taille ${esc(l.size)}${l.color ? " · " + esc(l.color) : ""}${d && d.id !== "none" ? " · " + esc(d.name) : ""}</span>
            <span class="label">${money(lineUnit(l))}${saleFor(p) ? " · soldé" : ""}</span>
            <div style="display:flex;gap:12px;align-items:center;margin-top:6px">
              <div class="qty"><button data-cq="${i}" data-d="-1" aria-label="Moins">−</button><span>${l.qty}</span><button data-cq="${i}" data-d="1" aria-label="Plus">+</button></div>
              <button class="rm" data-rm="${i}">Retirer</button>
            </div></div>
          <span class="price">${money(lineUnit(l) * l.qty)}</span>
        </div>`;
      }).join("")}
      ${recos.length ? `<div class="opt" style="margin-top:18px"><span class="label">Complète la tenue</span><div class="minis">${recos.map(miniCard).join("")}</div></div>` : ""}`;
    foot.innerHTML = `
      <form class="promo-form" id="promoForm">${promo ? `<span class="label">Code <b>${esc(normCode(promo.code))}</b> appliqué</span><button type="button" class="rm" id="promoRm">Retirer</button>` : `<input id="promoInput" placeholder="Code promo" aria-label="Code promo" autocomplete="off"><button class="btn btn-ghost btn-sm">Appliquer</button>`}</form>
      ${P().giftWrap?.enabled ? `<label class="check gift"><input type="checkbox" id="giftWrap" ${gift ? "checked" : ""}> Emballage cadeau (+${money(P().giftWrap.price)})</label>` : ""}
      <div class="totals">
        <div><span>Sous-total</span><span class="price">${money(t.sub)}</span></div>
        ${t.discount ? `<div class="disc"><span>${esc(t.discountLabel)}</span><span class="price">−${money(t.discount)}</span></div>` : ""}
        ${t.gift ? `<div><span>Emballage cadeau</span><span class="price">${money(t.gift)}</span></div>` : ""}
        <div><span>Livraison</span><span class="price">${t.ship ? money(t.ship) : "Offerte"}</span></div>
        <div class="total"><span>Total</span><span class="price">${money(t.total)}</span></div>
      </div>
      <button class="btn btn-block" id="checkoutBtn" style="margin-top:14px">Commander · ${money(t.total)}</button>`;
  }
  $("#cartItems").addEventListener("click", (e) => {
    const q = e.target.closest("[data-cq]"), rm = e.target.closest("[data-rm]");
    if (q) {
      const l = cart[+q.dataset.cq], p = productById(l.id);
      const others = cart.filter((x) => x.id === l.id && x !== l).reduce((a, x) => a + x.qty, 0);
      l.qty = Math.max(1, Math.min((+p.stock || 0) - others, l.qty + +q.dataset.d));
      saveCart();
    }
    if (rm) { cart.splice(+rm.dataset.rm, 1); saveCart(); }
    if (e.target.closest("[data-closecart]")) closeCart();
    if (e.target.closest("[data-product]")) closeCart();
  });
  $("#cartFoot").addEventListener("click", (e) => {
    if (e.target.id === "checkoutBtn") checkout();
    if (e.target.id === "promoRm") { promo = null; store.del("skx_promo"); renderCart(); }
  });
  $("#cartFoot").addEventListener("change", (e) => { if (e.target.id === "giftWrap") { gift = e.target.checked; renderCart(); } });
  $("#cartFoot").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("#promoInput")?.value || "";
    if (!v.trim()) return;
    const c = findCode(v);
    if (!c) { toast("Code inconnu ou expiré."); return; }
    promo = { code: normCode(v) }; store.set("skx_promo", promo);
    toast(`Code appliqué : −${Math.min(+c.percent, +P().maxCode || 70)} % (hors articles soldés).`); renderCart();
  });
  function openCart() { renderCart(); $("#drawer").classList.add("open"); $("#overlay").classList.add("open"); }
  function closeCart() { $("#drawer").classList.remove("open"); $("#overlay").classList.remove("open"); }
  $("#cartBtn").addEventListener("click", openCart);
  $("#closeDrawer").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);

  /* ---------- Commande ---------- */
  function checkout() {
    closeCart();
    const t = totals();
    openModal(`<div class="modal-pad">
      <h2>Finaliser la commande</h2>
      <p class="muted" style="margin:0 0 20px">Total : <span class="price" style="color:var(--text)">${money(t.total)}</span>${t.discount ? ` · dont ${money(t.discount)} de remise` : ""}</p>
      <form class="form" id="orderForm">
        <div class="row"><label><span>Prénom</span><input id="o-prenom" name="prenom" required autocomplete="given-name"></label><label><span>Nom</span><input id="o-nom" name="nom" required autocomplete="family-name"></label></div>
        <div class="row"><label><span>Email</span><input id="o-email" type="email" name="email" required autocomplete="email"></label><label><span>Téléphone</span><input id="o-tel" name="tel" autocomplete="tel"></label></div>
        <label><span>Adresse</span><input id="o-adresse" name="adresse" required autocomplete="street-address"></label>
        <div class="row"><label><span>Code postal</span><input id="o-cp" name="cp" required autocomplete="postal-code"></label><label><span>Ville</span><input id="o-ville" name="ville" required autocomplete="address-level2"></label></div>
        <label><span>Message</span><textarea id="o-message" name="message" placeholder="Optionnel${gift ? " — mot pour le cadeau" : ""}"></textarea></label>
        <button class="btn btn-block">Valider la commande</button>
      </form>
    </div>`, 560);
    $("#orderForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("button", e.target); btn.disabled = true; btn.textContent = "Envoi…";
      const customer = Object.fromEntries(new FormData(e.target));
      const tt = totals();
      const order = {
        ref: "SKX-" + Date.now().toString(36).toUpperCase(),
        date: new Date().toISOString(),
        customer,
        items: cart.map((l) => { const p = productById(l.id); const d = designById(l.design); return { id: p.id, name: p.name, size: l.size, color: l.color || "", design: d && d.id !== "none" ? d.name : "", qty: l.qty, price: lineUnit(l) }; }),
        promoCode: promo ? normCode(promo.code) : "", giftWrap: gift,
        ...tt
      };
      let sent = false;
      if (S().orderEndpoint) {
        try {
          const r = await fetch(S().orderEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ...order, _subject: `Nouvelle commande ${order.ref}`, email: customer.email }) });
          sent = r.ok;
        } catch { sent = false; }
      }
      const orders = store.get("skx_orders", []); orders.unshift(order); store.set("skx_orders", orders);
      cart = []; promo = null; gift = false; store.del("skx_promo"); saveCart();
      orderDone(order, sent);
    });
  }
  function orderText(o) {
    const c = o.customer;
    return `Commande ${o.ref}\n\n` + o.items.map((i) => `- ${i.name} (${i.size}${i.color ? ", " + i.color : ""}${i.design ? ", dessin " + i.design : ""}) x${i.qty} : ${money(i.price * i.qty)}`).join("\n") +
      `\n\nSous-total : ${money(o.sub)}` + (o.discount ? `\n${o.discountLabel} : -${money(o.discount)}` : "") + (o.gift ? `\nEmballage cadeau : ${money(o.gift)}` : "") +
      `\nLivraison : ${o.ship ? money(o.ship) : "Offerte"}\nTOTAL : ${money(o.total)}\n\n` +
      `${c.prenom} ${c.nom}\n${c.adresse}\n${c.cp} ${c.ville}\n${c.email} ${c.tel || ""}\n${c.message ? "\nMessage : " + c.message : ""}`;
  }
  function orderDone(o, sent) {
    const s = S();
    const mailto = s.contactEmail ? `mailto:${s.contactEmail}?subject=${encodeURIComponent("Commande " + o.ref)}&body=${encodeURIComponent(orderText(o))}` : "";
    openModal(`<div class="modal-pad" style="text-align:center;display:grid;gap:12px">
      <span class="label">Commande ${esc(o.ref)}</span>
      <h2>Merci ${esc(o.customer.prenom)}.</h2>
      <p class="muted" style="margin:0">Ta commande de <span class="price" style="color:var(--text)">${money(o.total)}</span> est enregistrée.</p>
      ${sent ? `<p style="margin:0">Elle a été transmise à l'équipe SKX.</p>` : mailto ? `<p class="muted" style="margin:0">Envoie-la à SKX avec le bouton ci-dessous pour qu'elle soit traitée.</p>` : ""}
      <div style="display:grid;gap:8px;margin-top:10px">
        ${s.paymentLink ? `<a class="btn" href="${esc(s.paymentLink)}" target="_blank" rel="noopener">Payer ${money(o.total)}</a>` : ""}
        ${!sent && mailto ? `<a class="btn ${s.paymentLink ? "btn-ghost" : ""}" href="${esc(mailto)}">Envoyer ma commande par email</a>` : ""}
        <button class="btn btn-ghost" data-close>Continuer mes achats</button>
      </div>
    </div>`, 480);
  }

  /* ---------- Pages publiques ---------- */
  const app = $("#app");
  const sceneDiv = (u, d = 1) => `<div class="js-scene" data-scene="${u}" data-density="${d}"></div>`;
  const mountScenes = () => $$(".js-scene", app).forEach((el) => window.SKXWeather.mountScene(el, el.dataset.scene, +el.dataset.density || 1));

  function brandFacts() {
    const sts = DATA.products.map(specStats).filter((s) => s.share !== null);
    const avg = sts.length ? sts.reduce((a, s) => a + s.share, 0) / sts.length : 0;
    const countries = new Set(DATA.products.map((p) => p.spec.madeIn).filter(Boolean));
    return { avg, mats: DATA.materials.length, countries: countries.size, countryList: [...countries] };
  }

  const zoneCard = (u, big) => {
    const z = DATA.zones[u];
    return `<a class="zone-card ${big ? "zone-big" : ""}" href="#/zone/${u}">
      ${sceneDiv(u, .7)}
      <span class="label metric">${esc(z.metric)}</span>
      <div class="zone-body"><h3>${esc(z.name)}</h3><span class="tagline">${esc(z.tagline)}</span><span class="go">Entrer →</span></div>
    </a>`;
  };

  function pageHome() {
    const s = S();
    const featured = DATA.products.filter((p) => p.featured);
    const f = brandFacts();
    const Z = DATA.zones;
    const tick = [`<b>SKX</b> pensé en ${esc(s.founded || "2014")}`, ...ZONE_IDS.map((u) => `<b>${esc(Z[u].name)}</b> ${esc(Z[u].metric)}`), `<b>XS → 3XL</b> Homme, Femme, Enfants`, `<b>${num(f.avg * 100)} %</b> fibres certifiées`];
    const slides = DATA.history.slides;
    app.innerHTML = `
      <section class="hero-mt">
        ${sceneDiv("home", 1)}
        <div class="container hero-mt-inner">
          <span class="label hero-alt">Alt. 0 m → 4 808 m · depuis ${esc(s.founded || "2014")}</span>
          <img class="hero-logo" src="assets/logo-skx.png" alt="${esc(s.shopName)}">
          <p class="hero-claim">${esc(s.slogan)}</p>
          <div class="hero-cta">
            <a class="btn" href="#/homme">Homme</a><a class="btn" href="#/femme">Femme</a><a class="btn" href="#/enfants">Enfants</a>
          </div>
        </div>
      </section>
      <div class="ticker" aria-hidden="true"><div class="ticker-track">${[...tick, ...tick].map((t) => `<span>${t}</span>`).join("")}</div></div>
      <section class="section"><div class="container">
        <div class="section-head"><div><span class="label">L'ascension</span><h2>Cinq zones</h2><p>Du camp de base au sommet : chaque zone de la boutique est une étape de la montagne SKX.</p></div></div>
        <div class="zones">${ZONE_IDS.map((u, i) => zoneCard(u, i === 0)).join("")}</div>
      </div></section>
      <section class="section" style="padding-top:0"><div class="container">
        <div class="section-head"><div><h2>Sélection</h2><p>Les pièces phares de la saison.</p></div><a class="btn btn-ghost btn-sm" href="#/boutique">Toute la boutique</a></div>
        ${grid((featured.length ? featured : DATA.products).slice(0, 8))}
      </div></section>
      ${slides.length ? `<section class="section" style="padding-top:0"><div class="container">
        <div class="story-teaser">
          <div style="display:grid;gap:14px;align-content:start"><span class="label">Histoire</span><h2 class="teaser-title">${esc(slides[0].year)} — ${esc(slides[0].title)}</h2><p class="muted" style="margin:0;max-width:52ch">${esc(slides[0].text)}</p>
            <div><a class="btn btn-ghost btn-sm" href="#/histoire">Lire l'histoire</a></div></div>
          <ol class="mini-timeline">${slides.map((sl) => `<li><span class="mono">${esc(sl.year)}</span><span>${esc(sl.title)}</span></li>`).join("")}</ol>
        </div>
      </div></section>` : ""}
      ${seen().length >= 2 ? `<section class="section" style="padding-top:0"><div class="container">
        <div class="section-head"><div><h2>Vus récemment</h2><p>Reprends là où tu t'es arrêté.</p></div></div>
        ${grid(seen().slice(0, 4).map(productById))}
      </div></section>` : ""}
      <section class="section" style="padding-top:0"><div class="container perks">
        <div class="perk"><b>Personnalise</b><span>coloris et dessin au choix</span></div>
        <div class="perk"><b>Du XS au 3XL</b><span>Homme, Femme, Enfants</span></div>
        <div class="perk"><b>Livraison offerte</b><span>dès ${money(s.freeShippingFrom)} d'achat</span></div>
        <div class="perk"><b>Retours 30 jours</b><span><a class="link" href="#/guide">voir le guide</a></span></div>
      </div></section>`;
    mountScenes();
  }

  function pageZone(id) {
    const z = DATA.zones[id];
    if (!z) return pageNotFound();
    document.body.dataset.zone = id;
    const list = DATA.products.filter((p) => p.zone === id);
    app.innerHTML = `
      <section class="u-hero">
        ${sceneDiv(id)}
        <div class="container u-hero-content">
          <div class="u-meta"><span class="label">${esc(z.metric)}</span><span class="label">${list.length} pièce${list.length > 1 ? "s" : ""}</span></div>
          <h1>${esc(z.name)}</h1>
          <div class="tagline">${esc(z.tagline)}</div>
          <p class="desc">${esc(z.description)}</p>
        </div>
      </section>
      <section class="section" style="padding-top:32px"><div class="container">
        <div id="zoneShop"></div>
        <div class="u-switch"><span class="label" style="align-self:center;margin-right:8px">Autres zones</span>${ZONE_IDS.filter((x) => x !== id).map((x) => `<a class="chip" href="#/zone/${x}"><span class="sw sw-${x}"></span>${esc(DATA.zones[x].name)}</a>`).join("")}</div>
      </div></section>`;
    mountScenes();
    shopView($("#zoneShop"), { zone: id });
  }

  const shopState = { g: "all", u: "all", size: "", q: "", sort: "default" };
  function pageShop(gender) {
    if (gender) shopState.g = gender;
    const title = gender ? GENDERS[gender] : "Boutique";
    app.innerHTML = `<section class="section"><div class="container">
      <div class="section-head"><div><h2>${esc(title)}</h2><p>Du XS au 3XL, cinq zones.</p></div></div>
      <div id="shop"></div>
    </div></section>`;
    shopView($("#shop"), {});
  }
  function shopView(el, fixed) {
    const st = fixed.zone ? { g: shopState.g, u: fixed.zone, size: shopState.size, q: "", sort: shopState.sort } : shopState;
    el.innerHTML = `<div class="toolbar">
        <div class="seg" role="group" aria-label="Genre">${[["all", "Tous"], ["homme", "Homme"], ["femme", "Femme"], ["enfant", "Enfants"]].map(([k, v]) => `<button class="chip" data-g="${k}">${v}</button>`).join("")}</div>
        ${fixed.zone ? "" : `<div class="seg" role="group" aria-label="Zone"><button class="chip" data-u="all">Toutes zones</button>${ZONE_IDS.map((u) => `<button class="chip" data-u="${u}"><span class="sw sw-${u}"></span>${esc(DATA.zones[u].name)}</button>`).join("")}</div>`}
      </div>
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Taille"><button class="chip" data-s="">Toutes tailles</button>${SIZES.map((x) => `<button class="chip" data-s="${x}">${x}</button>`).join("")}</div>
        <span class="grow"></span>
        ${fixed.zone ? "" : `<input type="search" id="shopQ" placeholder="Rechercher" value="${esc(st.q)}" aria-label="Rechercher">`}
        <select id="shopSort" aria-label="Trier"><option value="default">Sélection</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option><option value="name">Nom</option></select>
      </div>
      <div class="shop-grid"></div>`;
    $("#shopSort", el).value = st.sort;
    const render = () => {
      $$("[data-g]", el).forEach((c) => c.classList.toggle("active", c.dataset.g === st.g));
      $$("[data-u]", el).forEach((c) => c.classList.toggle("active", c.dataset.u === st.u));
      $$("[data-s]", el).forEach((c) => c.classList.toggle("active", c.dataset.s === st.size));
      const q = st.q.trim().toLowerCase();
      const list = DATA.products.filter((p) => (st.u === "all" || p.zone === st.u) &&
        (st.g === "all" || p.gender === st.g || (p.gender === "mixte" && st.g !== "enfant")) &&
        (!st.size || (p.sizes || []).includes(st.size) || (p.sizes || []).includes("Unique")) &&
        (!q || (p.name + " " + p.description + " " + (TYPES[p.type] || "")).toLowerCase().includes(q)));
      if (st.sort === "asc") list.sort((a, b) => a.price - b.price);
      if (st.sort === "desc") list.sort((a, b) => b.price - a.price);
      if (st.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
      $(".shop-grid", el).innerHTML = grid(list);
    };
    el.addEventListener("click", (e) => {
      const c = e.target.closest(".chip"); if (!c) return;
      if (c.dataset.g) st.g = c.dataset.g;
      if (c.dataset.u) st.u = c.dataset.u;
      if (c.dataset.s !== undefined) st.size = c.dataset.s;
      if (!fixed.zone) Object.assign(shopState, st); else { shopState.g = st.g; shopState.size = st.size; }
      render();
    });
    $("#shopQ", el)?.addEventListener("input", (e) => { st.q = e.target.value; render(); });
    $("#shopSort", el).addEventListener("change", (e) => { st.sort = e.target.value; shopState.sort = st.sort; render(); });
    render();
  }

  /* Histoire en slides */
  let slideIdx = 0;
  function pageHistoire() {
    const H = DATA.history, slides = H.slides;
    if (!slides.length) { app.innerHTML = `<section class="section"><div class="container empty">L'histoire arrive bientôt.</div></section>`; return; }
    slideIdx = Math.min(slideIdx, slides.length - 1);
    app.innerHTML = `<section class="story">
      ${sceneDiv("home", .6)}
      <div class="container story-inner">
        <div class="story-head"><span class="label">Histoire de la marque</span><p class="muted" style="margin:0">${esc(H.intro)}</p></div>
        <div class="story-stage" id="stage" tabindex="0" aria-roledescription="carrousel" aria-label="Histoire SKX">
          ${slides.map((sl, i) => `<article class="slide" data-i="${i}" aria-hidden="${i !== slideIdx}">
            <div class="slide-year ${String(sl.year).length > 5 ? "long" : ""}">${esc(sl.year)}</div>
            <div class="slide-body">
              <span class="label">${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}</span>
              <h2>${esc(sl.title)}</h2>
              <p>${esc(sl.text)}</p>
              ${sl.image ? `<img src="${esc(sl.image)}" alt="" class="slide-img">` : ""}
            </div>
          </article>`).join("")}
        </div>
        <div class="story-nav">
          <button class="icon-btn" id="prevSlide" aria-label="Précédent">←</button>
          <div class="ridge-line" id="ridge">${slides.map((sl, i) => `<button class="ridge-pt" data-go="${i}" style="--h:${20 + Math.round((i / Math.max(1, slides.length - 1)) * 70)}%" aria-label="${esc(sl.year)} ${esc(sl.title)}"><span class="mono">${esc(sl.year)}</span></button>`).join("")}</div>
          <button class="icon-btn" id="nextSlide" aria-label="Suivant">→</button>
        </div>
      </div>
    </section>`;
    mountScenes();
    const show = (i) => {
      slideIdx = (i + slides.length) % slides.length;
      $$(".slide", app).forEach((s) => s.setAttribute("aria-hidden", +s.dataset.i !== slideIdx));
      $$(".ridge-pt", app).forEach((b) => b.classList.toggle("active", +b.dataset.go <= slideIdx));
      $$(".ridge-pt", app).forEach((b) => b.classList.toggle("current", +b.dataset.go === slideIdx));
    };
    show(slideIdx);
    $("#prevSlide").addEventListener("click", () => show(slideIdx - 1));
    $("#nextSlide").addEventListener("click", () => show(slideIdx + 1));
    $("#ridge").addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) show(+b.dataset.go); });
    const onKey = (e) => {
      if (!$("#stage")) return document.removeEventListener("keydown", onKey);
      if (e.target.matches("input, textarea, select")) return;
      if (e.key === "ArrowRight") show(slideIdx + 1);
      if (e.key === "ArrowLeft") show(slideIdx - 1);
    };
    document.addEventListener("keydown", onKey);
    let x0 = null;
    $("#stage").addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    $("#stage").addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(slideIdx + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  /* L'équipe SKX (page publique) */
  /* Avatars illustrés (style SKX, réglables dans l'espace équipe) */
  const AV_HAIR = { court: "Court", meche: "Mèche", boucle: "Bouclé", long: "Long", rase: "Rasé" };
  const AV_FACIAL = { aucune: "Aucune", barbe: "Barbe", moustache: "Moustache", bouc: "Bouc" };
  const AV_ACC = { aucun: "Aucun", lunettes: "Lunettes", casquette: "Casquette", bonnet: "Bonnet", casque: "Casque audio" };
  const AV_BG = { streetwear: ["#05070a", "#1e2830", "#5c6874"], sport: ["#0a1219", "#24394a", "#7d98a8"], premiere: ["#0b0704", "#3a2410", "#b9823d"], accessoires: ["#0c0d0e", "#25282b", "#6d7277"], cool: ["#0d0809", "#3a2026", "#a35a45"] };
  function avatarSVG(m) {
    const a = m.avatar || {};
    const [b0, b1, b2] = AV_BG[a.bg] || AV_BG.streetwear;
    const skin = a.skin || "#cbc3b4", hc = a.hairColor || "#1b1a19", top = a.top || "#1c1f22";
    const g = "a" + Math.random().toString(36).slice(2, 7);
    const shade = "rgba(0,0,0,.18)";
    const hair = {
      court: `<path d="M64 108 Q60 64 100 60 Q142 64 136 108 Q132 86 118 80 Q100 88 80 80 Q68 88 64 108 Z" fill="${hc}"/>`,
      meche: `<path d="M64 110 Q58 62 104 58 Q146 62 138 104 Q134 84 122 78 Q96 92 70 84 Q66 94 64 110 Z" fill="${hc}"/><path d="M70 84 Q96 66 140 70 Q130 60 104 58 Q76 60 70 84 Z" fill="${hc}"/>`,
      boucle: [[68, 92], [76, 76], [90, 66], [106, 63], [122, 68], [133, 80], [136, 96], [64, 106], [138, 108], [82, 70], [114, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="${hc}"/>`).join(""),
      long: `<path d="M62 150 Q54 70 100 60 Q148 70 138 150 Q136 112 130 92 Q100 84 70 92 Q64 112 62 150 Z" fill="${hc}"/>`,
      rase: `<path d="M66 104 Q64 66 100 64 Q136 66 134 104 Q128 82 100 80 Q72 82 66 104 Z" fill="${hc}" opacity=".45"/>`
    }[a.hair] || "";
    const facial = {
      barbe: `<path d="M67 112 Q68 152 100 156 Q132 152 133 112 Q128 132 116 138 Q100 144 84 138 Q72 132 67 112 Z" fill="${hc}"/>`,
      moustache: `<path d="M88 128 Q100 122 112 128 Q100 126 88 128 Z" fill="${hc}" stroke="${hc}" stroke-width="3" stroke-linejoin="round"/>`,
      bouc: `<path d="M92 136 Q100 152 108 136 Q100 140 92 136 Z" fill="${hc}"/>`
    }[a.facial] || "";
    const acc = {
      lunettes: `<g fill="rgba(255,255,255,.08)" stroke="#111" stroke-width="2.4"><rect x="74" y="104" width="22" height="15" rx="4"/><rect x="104" y="104" width="22" height="15" rx="4"/><path d="M96 110 H104 M74 109 L66 106 M126 109 L134 106" fill="none"/></g>`,
      casquette: `<path d="M64 98 Q64 60 100 58 Q136 60 136 98 Z" fill="${top}"/><path d="M60 98 L150 98 Q156 106 140 108 L60 104 Z" fill="${top}" stroke="rgba(0,0,0,.35)"/><text x="100" y="88" text-anchor="middle" font-family="Pirata One, serif" font-size="12" fill="#eee">SKX</text>`,
      bonnet: `<path d="M64 102 Q62 54 100 52 Q138 54 136 102 Z" fill="${top}"/><rect x="62" y="92" width="76" height="14" rx="3" fill="${top}" stroke="rgba(0,0,0,.3)"/><text x="100" y="103" text-anchor="middle" font-family="Pirata One, serif" font-size="9" fill="#eee">SKX</text>`,
      casque: `<path d="M62 112 Q60 52 100 50 Q140 52 138 112" fill="none" stroke="#111" stroke-width="6"/><rect x="54" y="102" width="14" height="26" rx="6" fill="#111"/><rect x="132" y="102" width="14" height="26" rx="6" fill="#111"/>`
    }[a.acc] || "";
    return `<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(m.name)}">
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b0}"/><stop offset=".6" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></linearGradient></defs>
      <rect width="200" height="250" fill="url(#${g})"/>
      <path d="M0 170 L30 130 L52 150 L84 104 L112 146 L140 118 L170 150 L200 126 V250 H0 Z" fill="${b0}" opacity=".55"/>
      <path d="M84 104 L76 116 L84 114 L90 120 L94 112 Z M140 118 L134 128 L141 126 L146 130 Z" fill="#fff" opacity=".25"/>
      <path d="M28 250 Q32 186 100 176 Q168 186 172 250 Z" fill="${top}"/>
      <path d="M70 182 Q100 206 130 182 Q118 196 100 198 Q82 196 70 182 Z" fill="${shade}"/>
      <path d="M100 200 V250" stroke="rgba(255,255,255,.08)"/>
      <text x="52" y="238" font-family="Pirata One, serif" font-size="10" fill="#eee" opacity=".85">SKX</text>
      <rect x="88" y="150" width="24" height="30" rx="8" fill="${skin}"/><rect x="88" y="150" width="24" height="12" fill="${shade}"/>
      <ellipse cx="66" cy="114" rx="6" ry="9" fill="${skin}"/><ellipse cx="134" cy="114" rx="6" ry="9" fill="${skin}"/>
      <ellipse cx="100" cy="110" rx="34" ry="42" fill="${skin}"/>
      <path d="M100 68 Q134 72 134 110 Q132 140 112 150 Q128 128 126 104 Q122 80 100 68 Z" fill="${shade}"/>
      ${hair}${facial}
      <ellipse cx="86" cy="112" rx="2.6" ry="3" fill="#161514"/><ellipse cx="114" cy="112" rx="2.6" ry="3" fill="#161514"/>
      <path d="M93 134 Q100 138 107 134" fill="none" stroke="#161514" stroke-width="1.6" stroke-linecap="round" opacity="${a.facial === "barbe" || a.facial === "moustache" ? 0 : .7}"/>
      ${acc}
    </svg>`;
  }
  function pagePeople() {
    const P = DATA.people;
    app.innerHTML = `<section class="section"><div class="container">
      <div class="section-head"><div><span class="label">Du fondateur aux collaborateurs</span><h2>L'équipe SKX</h2><p>Les personnes qui pensent, dessinent et font vivre SKX.</p></div></div>
      ${P.length ? `<div class="people">${P.map((m, i) => `<article class="person ${i === 0 ? "person-lead" : ""}">
        <div class="person-photo">${m.photo ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}">` : avatarSVG(m)}</div>
        <div class="person-body"><span class="label">${esc(m.title)}${m.since ? " · depuis " + esc(m.since) : ""}</span><h3>${esc(m.name)}</h3><p>${esc(m.bio)}</p>
          ${m.quote ? `<blockquote class="quote">« ${esc(m.quote)} »</blockquote>` : ""}</div>
      </article>`).join("")}</div>` : `<div class="empty">L'équipe sera présentée ici.</div>`}
    </div></section>`;
  }

  function pageMatieres() {
    const f = brandFacts();
    const mats = DATA.materials.filter((m) => ["Tissu", "Bord-côte", "Doublure", "Rembourrage", "Fil à tricoter"].includes(m.category));
    app.innerHTML = `<section class="section"><div class="container">
      <div class="section-head"><div><h2>Nos matières</h2><p>${esc(DATA.charter.intro)}</p></div></div>
      <div class="facts" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-bottom:56px">
        <div class="fact"><b>${num(f.avg * 100)} %</b><span class="muted">fibres certifiées en moyenne</span></div>
        <div class="fact"><b>${mats.length}</b><span class="muted">textiles référencés</span></div>
        <div class="fact"><b>${f.countries}</b><span class="muted">pays de confection</span></div>
        <div class="fact"><b>0</b><span class="muted">PFC</span></div>
      </div>
      <div class="mat-grid">${mats.map((m) => `<div class="mat">
        <span class="label">${esc(m.category)}</span>
        <h3>${esc(m.name)}</h3>
        <dl class="kv"><dt>Composition</dt><dd>${esc(m.composition)}</dd>${m.weight ? `<dt>Grammage</dt><dd class="mono">${esc(m.weight)} g/m²</dd>` : ""}<dt>Origine</dt><dd>${esc(m.origin)}</dd></dl>
        <div class="certs">${(m.certifications || []).map((c) => `<span class="cert">${esc(c)}</span>`).join("")}</div>
      </div>`).join("")}</div>
      <div class="section-head" style="margin-top:80px"><div><h2>Nos règles</h2><p>Extrait du cahier des charges appliqué à chaque pièce.</p></div></div>
      <ul class="rules">${DATA.charter.rules.map((r) => `<li><span class="label">${esc(r.cat)}</span><span>${esc(r.text)}</span><span></span></li>`).join("")}</ul>
    </div></section>`;
  }

  function pageGuide() {
    const s = S(), pr = P();
    app.innerHTML = `<section class="section"><div class="container prose">
      <div class="section-head" style="margin-bottom:0"><div><span class="label">Guide</span><h2 style="margin:0">Livraison, tailles et plus</h2></div></div>
      <nav class="guide-toc">${[["livraison", "Livraison"], ["retours", "Retours"], ["tailles", "Tailles"], ["perso", "Personnalisation"], ["promos", "Soldes et codes"], ["marquage", "Marquage SKX"], ["entretien", "Entretien"]].map(([k, v]) => `<a class="chip" href="#g-${k}" data-anchor="g-${k}">${v}</a>`).join("")}</nav>
      <h2 id="g-livraison">Livraison</h2>
      <p>Expédition sous 48 h ouvrées. Livraison à ${money(s.shippingPrice)}, offerte dès ${money(s.freeShippingFrom)} d'achat.</p>
      <h2 id="g-retours">Retours</h2>
      <p>Tu as 30 jours pour changer d'avis. Les articles doivent être neufs, non portés, avec leurs étiquettes. Les pièces personnalisées (motif ajouté) ne sont ni reprises ni échangées, sauf défaut.${s.contactEmail ? ` Écris-nous à <a class="link" href="mailto:${esc(s.contactEmail)}">${esc(s.contactEmail)}</a>.` : ""}</p>
      <h2 id="g-tailles">Guide des tailles</h2>
      <p>Homme, Femme et Enfants : du XS au 3XL.</p>
      <div class="table-wrap"><table class="table"><thead><tr><th>Taille</th><th class="num">Poitrine (cm)</th><th class="num">Taille (cm)</th><th class="num">Longueur (cm)</th></tr></thead><tbody>
        ${[["XS", "86–90", "72–76", 66], ["S", "90–96", "76–82", 69], ["M", "96–102", "82–88", 72], ["L", "102–108", "88–94", 74], ["XL", "108–116", "94–102", 76], ["2XL", "116–124", "102–110", 78], ["3XL", "124–132", "110–118", 80]].map((r) => `<tr><td class="mono">${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[3]}</td></tr>`).join("")}
      </tbody></table></div>
      <p>Les coupes SKX sont amples. Prends ta taille habituelle pour un tombé oversize, une taille en dessous pour un tombé ajusté.</p>
      <h2 id="g-perso">Personnalisation</h2>
      <p>Sur les pièces marquées personnalisables, choisis ton coloris et ajoute un dessin : ${(DATA.designs || []).filter((d) => d.enabled && d.id !== "none").map((d) => `${esc(d.name)} (+${money(d.price)})`).join(", ")}. L'aperçu se met à jour en direct sur la fiche produit.</p>
      <h2 id="g-promos">Soldes et codes promo</h2>
      <p>Soldes d'hiver et d'été sur les fins de stock, jusqu'à −${pr.maxSale} %. Les codes promo s'appliquent aux articles non soldés et ne se cumulent pas avec la remise par quantité.</p>
      <h2 id="g-marquage">Marquage SKX</h2>
      <p>Chaque pièce porte le logo SKX brodé en bas à gauche, et une étiquette SKX dans le col ou sur l'étiquette intérieure.</p>
      <h2 id="g-entretien">Entretien</h2>
      <p>Lavage à 30 °C à l'envers, pas de sèche-linge pour les molletons, séchage à plat pour les mailles. Le détail est indiqué sur chaque fiche produit.</p>
    </div></section>`;
    $(".guide-toc", app).addEventListener("click", (e) => { const a = e.target.closest("[data-anchor]"); if (!a) return; e.preventDefault(); document.getElementById(a.dataset.anchor)?.scrollIntoView({ behavior: "smooth" }); });
  }

  function pageSoldes() {
    const list = DATA.products.filter((p) => saleFor(p));
    const sales = activeSales();
    app.innerHTML = `<section class="section"><div class="container">
      <div class="section-head"><div><span class="label">${sales.map((x) => esc(x.name)).join(" · ") || "Soldes"}</span><h2>Soldes</h2><p>Fins de stock, jusqu'à −${P().maxSale} %. Quand c'est parti, c'est parti.</p></div></div>
      ${grid(list)}
    </div></section>`;
  }

  function pageNotFound() {
    app.innerHTML = `<section class="section"><div class="container empty"><h2 style="font-family:var(--gothic);font-weight:400;font-size:72px;margin:0">404</h2><p>Cette page s'est perdue dans le brouillard.</p><a class="btn" href="#/">Retour à l'accueil</a></div></section>`;
  }

  /* ================= ESPACE ÉQUIPE ================= */
  function currentUser() {
    const s = session.get("skx_user");
    if (!s) return null;
    if (s.id === "bootstrap") return DATA.team.length ? null : s;
    const m = DATA.team.find((x) => x.id === s.id);
    return m ? { id: m.id, name: m.name, login: m.login, role: m.role } : null;
  }
  const role = () => ROLES[currentUser()?.role] || ROLES.lecture;
  const canPublish = () => role().publish;
  let adminTab = "dashboard";

  function pageTeam() {
    const user = currentUser();
    if (!user) return pageLogin();
    const R = role();
    if (!R.tabs.includes(adminTab)) adminTab = "dashboard";
    const initials = user.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    app.innerHTML = `<div class="container admin">
      <div class="admin-head">
        <div style="display:grid;gap:10px"><span class="label">Espace équipe</span><h1>${esc(TAB_LABELS[adminTab])}</h1></div>
        <div class="who"><span class="avatar">${esc(initials)}</span><div style="display:grid"><b style="font-weight:500">${esc(user.name)}</b><span class="role role-${user.role}" style="justify-self:start">${esc(ROLES[user.role]?.label || user.role)}</span></div>
          <a class="btn btn-ghost btn-sm" href="#/">Site</a><button class="btn btn-ghost btn-sm" id="logout">Déconnexion</button></div>
      </div>
      <div class="tabs">${R.tabs.map((k) => `<button class="tab ${k === adminTab ? "active" : ""}" data-tab="${k}">${TAB_LABELS[k]}</button>`).join("")}</div>
      <div id="adminBody"></div>
    </div>`;
    $(".tabs", app).addEventListener("click", (e) => { const t = e.target.closest("[data-tab]"); if (t) { adminTab = t.dataset.tab; pageTeam(); } });
    $("#logout").addEventListener("click", () => { session.del("skx_user"); applySettings(); location.hash = "#/"; });
    const body = $("#adminBody");
    TABS[adminTab](body);
    if (R.readOnly) lockReadOnly(body);
  }
  function lockReadOnly(el) {
    $$("input, select, textarea, button", el).forEach((x) => { if (!x.closest("[data-ro-ok]") && !x.hasAttribute("data-ro-ok")) x.disabled = true; });
  }

  function pageLogin() {
    const boot = !DATA.team.length;
    app.innerHTML = `<div class="container"><div class="login">
      <img src="assets/logo-skx-small.png" alt="SKX">
      <h1>Espace équipe</h1>
      <p class="muted" style="margin:0 0 22px">Accès réservé aux collaborateurs SKX.</p>
      ${boot ? `<div class="notice info">Première connexion : identifiant <b>admin</b>, mot de passe <b>${DEFAULT_PASSWORD}</b>. Tu créeras ensuite ton compte et ceux de ton équipe.</div>` : ""}
      <form class="form" id="loginForm">
        <label><span>Identifiant</span><input id="loginId" autocomplete="username" required value="${boot ? "admin" : ""}"></label>
        <label><span>Mot de passe</span><input type="password" id="loginPwd" autocomplete="current-password" required></label>
        <button class="btn btn-block">Se connecter</button>
      </form>
    </div></div>`;
    $(boot ? "#loginPwd" : "#loginId").focus();
    $("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("button", e.target); btn.disabled = true;
      const id = $("#loginId").value.trim().toLowerCase(), pwd = $("#loginPwd").value;
      try {
        if (!DATA.team.length) {
          const legacy = S().adminPasswordHash;
          const ok = id === "admin" && (legacy ? cyrb53(pwd) === legacy : pwd === DEFAULT_PASSWORD);
          if (!ok) throw new Error("Identifiant ou mot de passe incorrect.");
          session.set("skx_user", { id: "bootstrap", name: "Administrateur", login: "admin", role: "admin" });
          adminTab = "team";
        } else {
          const m = DATA.team.find((x) => x.login.toLowerCase() === id);
          if (!m || !(await verify(pwd, m.salt, m.hash))) throw new Error("Identifiant ou mot de passe incorrect.");
          session.set("skx_user", { id: m.id });
          adminTab = "dashboard";
        }
        applySettings(); pageTeam(); toast(`Bienvenue ${currentUser().name.split(" ")[0]}.`);
      } catch (err) { toast(err.message); btn.disabled = false; $("#loginPwd").select(); }
    });
  }

  function publishNotice() {
    return draft ? `<div class="notice">Modifications non publiées : elles ne sont visibles que sur ce navigateur. ${canPublish() ? `Va dans <b>Tableau de bord</b> pour les publier.` : ""}</div>` : "";
  }

  /* --- Tableau de bord --- */
  function tabDashboard(el) {
    const P = DATA.products;
    const stock = P.reduce((a, p) => a + (+p.stock || 0), 0);
    const value = P.reduce((a, p) => a + (+p.stock || 0) * (+p.price || 0), 0);
    const out = P.filter((p) => (+p.stock || 0) <= 0).length;
    const nonConf = P.filter((p) => specStats(p).issues > 0);
    const token = store.get("skx_gh_token", "");
    el.innerHTML = `${publishNotice()}
      <div class="stats">
        <div class="stat"><b>${P.length}</b><span class="label">Produits</span></div>
        <div class="stat"><b>${num(stock)}</b><span class="label">Pièces en stock</span></div>
        <div class="stat"><b>${money(value)}</b><span class="label">Valeur du stock</span></div>
        <div class="stat"><b>${out}</b><span class="label">En rupture</span></div>
      </div>
      ${nonConf.length ? `<div class="box"><h3>Points à corriger dans les fiches techniques</h3><p>${nonConf.length} produit${nonConf.length > 1 ? "s ne respectent" : " ne respecte"} pas encore tout le cahier des charges.</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${nonConf.map((p) => `<button class="chip" data-ro-ok data-spec="${esc(p.id)}">${esc(p.name)} · ${specStats(p).issues}</button>`).join("")}</div></div>` : ""}
      ${canPublish() ? `<div class="box"><h3>Publier en ligne</h3>
        <p>Tes changements sont d'abord enregistrés sur ce navigateur. Publie-les pour que les clients et toute l'équipe les voient (y compris les nouveaux comptes collaborateurs).</p>
        <form class="form" id="ghForm" style="max-width:640px">
          <label><span>Jeton GitHub <span class="hint">— jeton « fine-grained » avec l'accès Contents en écriture sur ${esc(S().githubRepo)}</span></span><input type="password" id="ghToken" value="${esc(token)}" placeholder="github_pat_…" autocomplete="off"></label>
          <label class="check"><input type="checkbox" id="ghRemember" ${token ? "checked" : ""}> Mémoriser le jeton sur cet appareil</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" id="ghPublish">Publier en ligne</button>
            <button type="button" class="btn btn-ghost" id="dlPublish">Télécharger boutique-data.js</button>
            <label class="btn btn-ghost" style="cursor:pointer">Importer un fichier<input type="file" id="importFile" accept=".js,.json" hidden></label>
            ${draft ? `<button type="button" class="btn btn-danger" id="discard">Annuler le brouillon</button>` : ""}
          </div>
        </form>
        <p class="muted" style="margin:14px 0 0;font-size:13px">Le site en ligne se met à jour environ une minute après la publication.</p>
      </div>` : ""}`;
    $$("[data-spec]", el).forEach((b) => b.addEventListener("click", () => editSpec(b.dataset.spec)));
    if (!canPublish()) return;
    $("#ghForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const tk = $("#ghToken").value.trim();
      if (!tk) { toast("Colle ton jeton GitHub, ou utilise « Télécharger »."); return; }
      if ($("#ghRemember").checked) store.set("skx_gh_token", tk); else store.del("skx_gh_token");
      const btn = $("#ghPublish"); btn.disabled = true; btn.textContent = "Publication…";
      try { await githubPublish(tk); toast("Publié. Le site en ligne sera à jour dans une minute."); pageTeam(); }
      catch (err) { toast(err.message); btn.disabled = false; btn.textContent = "Publier en ligne"; }
    });
    $("#dlPublish").addEventListener("click", () => { download("boutique-data.js", dataFile(), "text/javascript"); toast("Remplace js/boutique-data.js sur ton site par ce fichier."); });
    $("#importFile").addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { DATA = normalize(parseDataFile(await f.text())); saveDraft(); pageTeam(); toast("Données importées."); }
      catch { toast("Fichier invalide."); }
    });
    $("#discard")?.addEventListener("click", () => {
      if (!confirm("Supprimer toutes les modifications non publiées ?")) return;
      store.del("skx_draft"); draft = null; DATA = clone(PUBLISHED); applySettings(); radio.reload(); pageTeam();
    });
  }
  function dataFile() {
    const who = currentUser()?.name || "équipe";
    return `/*\n * SKX — données publiées de la boutique.\n * Publié par ${who} le ${new Date().toLocaleString("fr-FR")}.\n */\nwindow.SKX_DATA = ${JSON.stringify(DATA, null, 2)};\n`;
  }
  const parseDataFile = (txt) => JSON.parse(txt.replace(/^[\s\S]*?window\.SKX_DATA\s*=\s*/, "").replace(/;\s*$/, ""));
  function b64(str) {
    const bytes = new TextEncoder().encode(str); let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function unb64(s) { const bin = atob(s.replace(/\s/g, "")); return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))); }
  async function githubPublish(token) {
    const repo = S().githubRepo, branch = S().githubBranch;
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo || "")) throw new Error("Dépôt GitHub mal réglé (Réglages).");
    const api = `https://api.github.com/repos/${repo}/contents/js/boutique-data.js`;
    const headers = { Authorization: "Bearer " + token, Accept: "application/vnd.github+json" };
    const cur = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers, cache: "no-store" });
    if (cur.status === 401) throw new Error("Jeton GitHub refusé.");
    if (cur.status === 404) throw new Error("Dépôt, branche ou fichier introuvable. Vérifie les Réglages et les droits du jeton.");
    if (!cur.ok) throw new Error("GitHub ne répond pas (" + cur.status + ").");
    const curJson = await cur.json();
    try {
      const remote = normalize(parseDataFile(unb64(curJson.content)));
      if (JSON.stringify(remote) !== JSON.stringify(PUBLISHED) && !confirm("Quelqu'un de l'équipe a publié depuis que tu as ouvert le site. Publier quand même et remplacer sa version ?")) throw new Error("Publication annulée.");
    } catch (e) { if (e.message === "Publication annulée.") throw e; }
    const res = await fetch(api, {
      method: "PUT", headers,
      body: JSON.stringify({ message: `Boutique : mise à jour par ${currentUser()?.name || "l'équipe"}`, content: b64(dataFile()), sha: curJson.sha, branch })
    });
    if (res.status === 403 || res.status === 404) throw new Error("Le jeton n'a pas le droit d'écrire sur ce dépôt.");
    if (res.status === 409) throw new Error("Conflit : recharge la page et réessaie.");
    if (!res.ok) throw new Error("Échec de la publication (" + res.status + ").");
    PUBLISHED = clone(DATA); store.del("skx_draft"); draft = null;
  }
  function download(name, content, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* --- Produits --- */
  function tabProducts(el) {
    el.innerHTML = `${publishNotice()}
      <div class="toolbar"><button class="btn btn-sm" id="newProduct">Nouveau produit</button><span class="grow"></span>
        <select id="admFilter" data-ro-ok aria-label="Filtrer"><option value="all">Toutes les zones</option>${ZONE_IDS.map((u) => `<option value="${u}">${esc(DATA.zones[u].name)}</option>`).join("")}</select></div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th></th><th>Produit</th><th>Zone</th><th class="num">Prix</th><th class="num">Stock</th><th>Vedette</th><th></th></tr></thead>
        <tbody id="admRows"></tbody></table></div>`;
    const rows = () => {
      const f = $("#admFilter").value;
      $("#admRows").innerHTML = DATA.products.filter((p) => f === "all" || p.zone === f).map((p) => `<tr>
        <td><div class="thumb">${productVisual(p)}</div></td>
        <td><b style="font-weight:500">${esc(p.name)}</b><div class="label" style="margin-top:2px">${esc(TYPES[p.type] || p.type)} · ${esc((p.sizes || []).join(" "))}</div></td>
        <td><span class="tag" style="background:none"><span class="sw sw-${p.zone}"></span>${esc(DATA.zones[p.zone]?.name || p.zone)}</span></td>
        <td class="num">${money(p.price)}</td>
        <td class="num"><input class="input" type="number" min="0" value="${+p.stock || 0}" data-stock="${esc(p.id)}" style="width:76px;padding:6px 8px;text-align:right" aria-label="Stock"></td>
        <td><input type="checkbox" ${p.featured ? "checked" : ""} data-feat="${esc(p.id)}" aria-label="Vedette"></td>
        <td><div class="actions"><button class="btn btn-ghost btn-sm" data-edit="${esc(p.id)}">Modifier</button><button class="btn btn-ghost btn-sm" data-ro-ok data-sp="${esc(p.id)}">Fiche</button><button class="btn btn-ghost btn-sm" data-dup="${esc(p.id)}" title="Dupliquer">Dupliquer</button><button class="btn btn-danger btn-sm" data-del="${esc(p.id)}">Suppr.</button></div></td>
      </tr>`).join("") || `<tr><td colspan="7" class="muted">Aucun produit.</td></tr>`;
      if (role().readOnly) lockReadOnly($("#admRows"));
    };
    rows();
    $("#admFilter").addEventListener("change", rows);
    $("#newProduct").addEventListener("click", () => editProduct(null));
    el.addEventListener("click", (e) => {
      const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]"), dup = e.target.closest("[data-dup]"), sp = e.target.closest("[data-sp]");
      if (ed) editProduct(ed.dataset.edit);
      if (sp) editSpec(sp.dataset.sp);
      if (dup) { const p = clone(productById(dup.dataset.dup)); p.id = uid("p"); p.name += " (copie)"; DATA.products.push(p); saveDraft(); pageTeam(); }
      if (del) {
        const p = productById(del.dataset.del);
        if (confirm(`Supprimer « ${p.name} » ?`)) { DATA.products = DATA.products.filter((x) => x !== p); saveDraft(); saveCart(); pageTeam(); toast("Produit supprimé."); }
      }
    });
    el.addEventListener("change", (e) => {
      const st = e.target.closest("[data-stock]"), ft = e.target.closest("[data-feat]");
      if (st) { productById(st.dataset.stock).stock = Math.max(0, +st.value || 0); saveDraft(); toast("Stock mis à jour."); }
      if (ft) { productById(ft.dataset.feat).featured = ft.checked; saveDraft(); }
    });
  }

  function editProduct(id) {
    const existing = id ? productById(id) : null;
    const p = existing ? clone(existing) : ensureSpec({ id: uid("p"), name: "", zone: "streetwear", gender: "mixte", type: "tshirt", color: "#c9c4b8", price: 35, oldPrice: null, sizes: SIZES.slice(), stock: 10, image: "", featured: false, description: "" });
    const box = openModal(`<div class="modal-pad">
      <h2>${existing ? "Modifier le produit" : "Nouveau produit"}</h2>
      <form class="form" id="pForm" style="margin-top:18px">
        <label><span>Nom</span><input id="pf-name" name="name" required value="${esc(p.name)}"></label>
        <div class="row3">
          <label><span>Zone</span><select id="pf-zone" name="zone">${ZONE_IDS.map((u) => `<option value="${u}" ${u === p.zone ? "selected" : ""}>${esc(DATA.zones[u].name)}</option>`).join("")}</select></label>
          <label><span>Genre</span><select id="pf-gender" name="gender">${Object.entries(GENDERS).map(([k, v]) => `<option value="${k}" ${k === p.gender ? "selected" : ""}>${v}</option>`).join("")}</select></label>
          <label><span>Type</span><select id="pf-type" name="type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${k === p.type ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        </div>
        <div class="row3">
          <label><span>Prix TTC (€)</span><input id="pf-price" name="price" type="number" step="0.01" min="0" required value="${+p.price}"></label>
          <label><span>Ancien prix <span class="hint">promo</span></span><input id="pf-old" name="oldPrice" type="number" step="0.01" min="0" value="${p.oldPrice ?? ""}"></label>
          <label><span>Stock</span><input id="pf-stock" name="stock" type="number" min="0" value="${+p.stock || 0}"></label>
        </div>
        <label><span>Tailles <span class="hint">séparées par des virgules</span></span><input id="pf-sizes" name="sizes" value="${esc((p.sizes || []).join(", "))}"></label>
        <label><span>Coloris <span class="hint">Nom:#couleur, séparés par des virgules — le premier est le coloris principal</span></span><input id="pf-colors" name="colors" value="${esc((p.colors || []).map((c) => c.name + ":" + c.hex).join(", "))}" placeholder="Noir:#18191b, Sable:#c8b79a"></label>
        <label class="check"><input type="checkbox" id="pf-custom" name="customizable" ${p.customizable ? "checked" : ""}> Personnalisable (dessins au choix)</label>
        <label><span>Description</span><textarea id="pf-desc" name="description">${esc(p.description)}</textarea></label>
        <div class="row" style="align-items:start">
          <div class="form">
            <label><span>Photo <span class="hint">lien ou chemin assets/…</span></span><input name="image" id="pImg" value="${esc(p.image && p.image.startsWith("data:") ? "" : p.image)}" placeholder="assets/produits/hoodie.jpg"></label>
            <label class="btn btn-ghost btn-sm" style="cursor:pointer;justify-self:start">Importer une photo<input type="file" id="pFile" accept="image/*" hidden></label>
            <label class="check"><input type="checkbox" id="pf-feat" name="featured" ${p.featured ? "checked" : ""}> Mettre en avant sur l'accueil</label>
          </div>
          <div style="display:grid;gap:8px;justify-items:start"><div class="img-preview" id="pPrev"></div><button type="button" class="btn btn-ghost btn-sm" id="pClearImg">Retirer la photo</button></div>
        </div>
        <button class="btn btn-block">${existing ? "Enregistrer" : "Ajouter le produit"}</button>
      </form>
    </div>`, 680);
    const form = $("#pForm", box);
    const read = () => {
      const f = Object.fromEntries(new FormData(form));
      p.name = f.name.trim(); p.zone = f.zone; p.gender = f.gender; p.type = f.type;
      p.price = Math.max(0, +f.price || 0); p.oldPrice = f.oldPrice ? +f.oldPrice : null;
      p.sizes = f.sizes.split(",").map((s) => s.trim()).filter(Boolean); if (!p.sizes.length) p.sizes = ["Unique"];
      const cols = (f.colors || "").split(",").map((x) => { const [n, h] = x.split(":").map((y) => (y || "").trim()); return /^#[0-9a-f]{6}$/i.test(h || "") ? { name: n || h, hex: h } : null; }).filter(Boolean);
      p.colors = cols.length ? cols : [{ name: "Unique", hex: p.color || "#c9c4b8" }];
      p.color = p.colors[0].hex;
      p.customizable = !!f.customizable;
      p.stock = Math.max(0, parseInt(f.stock) || 0); p.description = f.description.trim(); p.featured = !!f.featured;
      if (f.image.trim()) p.image = f.image.trim(); else if (!(p.image || "").startsWith("data:")) p.image = "";
    };
    const preview = () => { read(); $("#pPrev").innerHTML = productVisual(p); };
    form.addEventListener("input", preview); preview();
    $("#pClearImg").addEventListener("click", () => { p.image = ""; $("#pImg").value = ""; $("#pPrev").innerHTML = productVisual(p); });
    $("#pFile").addEventListener("change", async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { p.image = await resizeImage(file, 1000); $("#pImg").value = ""; $("#pPrev").innerHTML = productVisual(p); toast("Photo importée."); }
      catch { toast("Impossible de lire cette image."); }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault(); read();
      if (existing) Object.assign(existing, p); else DATA.products.unshift(p);
      saveDraft(); closeModal(); pageTeam(); toast(existing ? "Produit enregistré." : "Produit ajouté.");
    });
  }
  function resizeImage(file, max) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src); res(c.toDataURL("image/jpeg", .84));
      };
      img.onerror = rej; img.src = URL.createObjectURL(file);
    });
  }

  /* --- Fiches techniques --- */
  function tabSpecs(el) {
    el.innerHTML = `${publishNotice()}
      <div class="notice info">Chaque fiche décrit l'assemblage d'un produit : matières, quantités par pièce, construction, atelier. Le contrôle automatique compare la fiche au cahier des charges.</div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Produit</th><th>Statut</th><th>Atelier</th><th>Fibres certifiées</th><th class="num">Coût matière</th><th class="num">Coef.</th><th>Contrôle</th></tr></thead>
        <tbody>${DATA.products.map((p) => {
          const st = specStats(p);
          return `<tr class="clickable" data-spec="${esc(p.id)}">
            <td><b style="font-weight:500">${esc(p.name)}</b><div class="label" style="margin-top:2px">${esc(TYPES[p.type] || "")}</div></td>
            <td><span class="status status-${esc(p.spec.status.replace(/\s/g, "-"))}">${esc(p.spec.status)}</span></td>
            <td>${esc(p.spec.workshop || "—")}<div class="label" style="margin-top:2px">${esc(p.spec.madeIn || "")}</div></td>
            <td class="mono">${st.share === null ? "—" : `<span class="meter ${st.share < .9 ? "low" : ""}"><i style="width:${num(st.share * 100)}%"></i></span>${num(st.share * 100)} %`}</td>
            <td class="num">${money(st.cost)}</td>
            <td class="num">${st.coef ? "×" + num(st.coef, 1) : "—"}</td>
            <td>${st.issues ? `<span class="status status-Arrêté">${st.issues} point${st.issues > 1 ? "s" : ""}</span>` : `<span class="status status-En-production">Conforme</span>`}</td>
          </tr>`;
        }).join("")}</tbody></table></div>`;
    $$("[data-spec]", el).forEach((r) => r.addEventListener("click", () => editSpec(r.dataset.spec)));
  }

  function matOptions(sel) {
    return MAT_CATEGORIES.map((cat) => {
      const ms = DATA.materials.filter((m) => m.category === cat);
      return ms.length ? `<optgroup label="${esc(cat)}">${ms.map((m) => `<option value="${esc(m.id)}" ${m.id === sel ? "selected" : ""}>${esc(m.name)} — ${esc(m.composition)}</option>`).join("")}</optgroup>` : "";
    }).join("");
  }
  function editSpec(id) {
    const original = productById(id); if (!original) return;
    const p = clone(original); ensureSpec(p);
    const ro = role().readOnly;
    const box = openModal(`<div class="modal-pad">
      <span class="label">Fiche technique · ${esc(TYPES[p.type] || "")} · ${esc(DATA.zones[p.zone]?.name || "")}</span>
      <h2 style="margin-top:6px">${esc(p.name)}</h2>
      <div id="specKpis" style="margin:18px 0"></div>
      <form class="form" id="specForm">
        <div class="row3">
          <label><span>Statut</span><select id="sf-status" name="status">${STATUSES.map((s) => `<option ${s === p.spec.status ? "selected" : ""}>${s}</option>`).join("")}</select></label>
          <label><span>Atelier de confection</span><input id="sf-workshop" name="workshop" value="${esc(p.spec.workshop)}"></label>
          <label><span>Fabriqué en</span><input id="sf-madein" name="madeIn" value="${esc(p.spec.madeIn)}" placeholder="Portugal"></label>
        </div>
        <div style="display:grid;gap:8px;margin-top:6px">
          <span class="label">Assemblage — matières par pièce</span>
          <div class="comp-row comp-head"><span>Rôle</span><span>Matière</span><span>Qté / pièce</span><span></span></div>
          <div id="comps"></div>
          <button type="button" class="btn btn-ghost btn-sm" id="addComp" style="justify-self:start">Ajouter une matière</button>
        </div>
        <label><span>Construction et coutures</span><textarea id="sf-construction" name="construction">${esc(p.spec.construction)}</textarea></label>
        <div class="row">
          <label><span>Finitions</span><textarea id="sf-finishing" name="finishing">${esc(p.spec.finishing)}</textarea></label>
          <label><span>Entretien</span><textarea id="sf-care" name="care">${esc(p.spec.care)}</textarea></label>
        </div>
        <label><span>Notes internes</span><textarea id="sf-notes" name="notes">${esc(p.spec.notes)}</textarea></label>
        <div style="display:grid;gap:8px"><span class="label">Contrôle cahier des charges</span><ul class="checklist" id="specChecks"></ul></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${ro ? "" : `<button class="btn">Enregistrer la fiche</button>`}
          <button type="button" class="btn btn-ghost" id="printSpec" data-ro-ok>Imprimer / PDF</button>
        </div>
      </form>
    </div>`, 900);
    const comps = $("#comps", box);
    const renderComps = () => {
      comps.innerHTML = p.spec.components.map((c, i) => {
        const m = materialById(c.materialId);
        return `<div class="comp-row" data-i="${i}">
          <input class="input" data-k="role" value="${esc(c.role)}" placeholder="Corps, manches…" aria-label="Rôle">
          <select class="input" data-k="materialId" aria-label="Matière"><option value="">Choisir…</option>${matOptions(c.materialId)}</select>
          <div style="display:grid;grid-template-columns:1fr 46px;align-items:center;gap:6px"><input class="input" data-k="qty" type="number" step="0.01" min="0" value="${+c.qty || 0}" style="width:100%;min-width:0;text-align:right" aria-label="Quantité"><span class="label">${esc(m?.unit || "")}</span></div>
          <button type="button" class="icon-btn" data-rmc="${i}" aria-label="Retirer">✕</button>
        </div>`;
      }).join("") || `<div class="muted" style="font-size:14px">Aucune matière. Ajoute le tissu principal, le bord-côte, le fil, l'étiquette…</div>`;
      if (ro) lockReadOnly(comps);
    };
    const refresh = () => {
      const st = specStats(p);
      $("#specKpis", box).innerHTML = `<div class="kpis">
        <div><span class="label">Coût matière</span><b>${money(st.cost)}</b></div>
        <div><span class="label">Prix HT</span><b>${money((+p.price || 0) / 1.2)}</b></div>
        <div><span class="label">Coefficient</span><b>${st.coef ? "×" + num(st.coef, 2) : "—"}</b></div>
        <div><span class="label">Fibres certifiées</span><b>${st.share === null ? "—" : num(st.share * 100) + " %"}</b></div>
      </div>`;
      $("#specChecks", box).innerHTML = st.checks.map((c) => `<li><span class="${c.ok ? "ok" : "ko"}">${c.ok ? "✓" : "✕"}</span><span>${esc(c.text)}</span></li>`).join("");
    };
    const readFields = () => { const f = Object.fromEntries(new FormData($("#specForm", box))); Object.assign(p.spec, f); };
    renderComps(); refresh();
    if (ro) lockReadOnly(box);
    comps.addEventListener("input", (e) => {
      const row = e.target.closest("[data-i]"), k = e.target.dataset.k; if (!row || !k) return;
      const c = p.spec.components[+row.dataset.i];
      c[k] = k === "qty" ? Math.max(0, +e.target.value || 0) : e.target.value;
      if (k === "materialId") renderComps();
      refresh();
    });
    comps.addEventListener("change", (e) => { if (e.target.dataset.k === "materialId") { renderComps(); refresh(); } });
    comps.addEventListener("click", (e) => { const b = e.target.closest("[data-rmc]"); if (b) { p.spec.components.splice(+b.dataset.rmc, 1); renderComps(); refresh(); } });
    $("#addComp", box).addEventListener("click", () => { p.spec.components.push({ role: "", materialId: "", qty: 1 }); renderComps(); });
    $("#specForm", box).addEventListener("input", (e) => { if (!e.target.closest("#comps")) { readFields(); refresh(); } });
    $("#printSpec", box).addEventListener("click", () => { readFields(); printSheet(specSheetHTML(p)); });
    $("#specForm", box).addEventListener("submit", (e) => {
      e.preventDefault(); readFields();
      p.spec.components = p.spec.components.filter((c) => c.materialId);
      original.spec = p.spec; saveDraft(); closeModal(); if (location.hash.startsWith("#/equipe")) pageTeam(); toast("Fiche technique enregistrée.");
    });
  }
  function specSheetHTML(p) {
    const st = specStats(p);
    return `<div class="sheet">
      <div class="head">
        <div><span class="label">Fiche technique</span><h1>${esc(p.name)}</h1>
          <div class="label" style="margin-top:6px">${esc(TYPES[p.type] || "")} · ${esc(DATA.zones[p.zone]?.name || "")} · Réf. ${esc(p.id)} · ${esc(p.spec.status)}</div></div>
        <img src="assets/logo-skx-small.png" alt="SKX">
      </div>
      <div class="cols">
        <div><div class="flat">${productVisual(p, { light: true })}</div></div>
        <div>
          <h4>Fabrication</h4><p>${esc(p.spec.workshop || "—")} · ${esc(p.spec.madeIn || "—")}</p>
          <h4>Tailles</h4><p>${esc((p.sizes || []).join(", "))}</p>
          <h4>Indicateurs</h4><p>Coût matière ${money(st.cost)} · Prix TTC ${money(p.price)} · Coef. ${st.coef ? "×" + num(st.coef, 2) : "—"} · Fibres certifiées ${st.share === null ? "—" : num(st.share * 100) + " %"}</p>
        </div>
      </div>
      <h4>Nomenclature matières</h4>
      <table><thead><tr><th>Rôle</th><th>Matière</th><th>Composition</th><th>Certifications</th><th>Fournisseur / origine</th><th class="num">Qté</th><th class="num">Coût</th></tr></thead><tbody>
        ${p.spec.components.map((c) => { const m = materialById(c.materialId); if (!m) return ""; return `<tr><td>${esc(c.role)}</td><td>${esc(m.name)}${m.weight ? ` (${m.weight} g/m²)` : ""}</td><td>${esc(m.composition)}</td><td>${esc((m.certifications || []).join(", ") || "—")}</td><td>${esc(m.supplier)} · ${esc(m.origin)}</td><td class="num">${num(c.qty, 2)} ${esc(m.unit)}</td><td class="num">${money(c.qty * m.price)}</td></tr>`; }).join("")}
      </tbody></table>
      <div class="cols">
        <div><h4>Construction et coutures</h4><p>${esc(p.spec.construction || "—")}</p><h4>Finitions</h4><p>${esc(p.spec.finishing || "—")}</p></div>
        <div><h4>Entretien</h4><p>${esc(p.spec.care || "—")}</p><h4>Contrôle cahier des charges</h4>${st.checks.map((c) => `<p>${c.ok ? "✓" : "✕"} ${esc(c.text)}</p>`).join("")}</div>
      </div>
      ${p.spec.notes ? `<h4>Notes</h4><p>${esc(p.spec.notes)}</p>` : ""}
      <p class="label" style="margin-top:20px">Édité le ${new Date().toLocaleDateString("fr-FR")} par ${esc(currentUser()?.name || "SKX")}</p>
    </div>`;
  }
  function printSheet(html) {
    openModal(`<div class="no-print" style="padding:14px 60px 14px 20px;display:flex;gap:8px;border-bottom:1px solid var(--line)"><button class="btn btn-sm" id="doPrint">Imprimer / enregistrer en PDF</button></div>${html}`, 960);
    $("#doPrint").addEventListener("click", () => window.print());
  }

  /* --- Matières --- */
  function tabMaterials(el) {
    const used = (id) => DATA.products.filter((p) => p.spec.components.some((c) => c.materialId === id));
    el.innerHTML = `${publishNotice()}
      <div class="toolbar"><button class="btn btn-sm" id="newMat">Nouvelle matière</button><span class="grow"></span>
        <select id="matFilter" data-ro-ok aria-label="Catégorie"><option value="">Toutes catégories</option>${MAT_CATEGORIES.map((c) => `<option>${esc(c)}</option>`).join("")}</select></div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Matière</th><th>Composition</th><th class="num">g/m²</th><th>Certifications</th><th>Fournisseur</th><th class="num">Prix</th><th class="num">Stock</th><th>Utilisée</th></tr></thead>
        <tbody id="matRows"></tbody></table></div>`;
    const rows = () => {
      const f = $("#matFilter").value;
      $("#matRows").innerHTML = DATA.materials.filter((m) => !f || m.category === f).map((m) => `<tr class="clickable" data-mat="${esc(m.id)}">
        <td><b style="font-weight:500">${esc(m.name)}</b><div class="label" style="margin-top:2px">${esc(m.category)}</div></td>
        <td>${esc(m.composition)}</td>
        <td class="num">${m.weight ? esc(m.weight) : "—"}</td>
        <td><div class="certs">${(m.certifications || []).map((c) => `<span class="cert">${esc(c)}</span>`).join("") || `<span class="cert none">Aucune</span>`}</div></td>
        <td>${esc(m.supplier)}<div class="label" style="margin-top:2px">${esc(m.origin)}</div></td>
        <td class="num">${money(m.price)}<span class="muted">/${esc(m.unit)}</span></td>
        <td class="num">${num(m.stock)} ${esc(m.unit)}</td>
        <td class="mono">${used(m.id).length}</td>
      </tr>`).join("") || `<tr><td colspan="8" class="muted">Aucune matière.</td></tr>`;
    };
    rows();
    $("#matFilter").addEventListener("change", rows);
    $("#newMat").addEventListener("click", () => editMaterial(null));
    el.addEventListener("click", (e) => { const r = e.target.closest("[data-mat]"); if (r) editMaterial(r.dataset.mat); });
  }
  function editMaterial(id) {
    const existing = id ? materialById(id) : null;
    const m = existing ? clone(existing) : { id: uid("m"), name: "", category: "Tissu", composition: "", weight: null, certifications: [], supplier: "", origin: "", price: 0, unit: "m", stock: 0, notes: "" };
    const ro = role().readOnly;
    const usedBy = DATA.products.filter((p) => p.spec.components.some((c) => c.materialId === m.id));
    const box = openModal(`<div class="modal-pad">
      <h2>${existing ? esc(m.name) : "Nouvelle matière"}</h2>
      ${usedBy.length ? `<p class="label" style="margin:4px 0 0">Utilisée dans : ${usedBy.map((p) => esc(p.name)).join(", ")}</p>` : ""}
      <form class="form" id="mForm" style="margin-top:18px">
        <div class="row"><label><span>Nom</span><input id="mf-name" name="name" required value="${esc(m.name)}"></label>
          <label><span>Catégorie</span><select id="mf-cat" name="category">${MAT_CATEGORIES.map((c) => `<option ${c === m.category ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label></div>
        <label><span>Composition</span><input id="mf-compo" name="composition" required value="${esc(m.composition)}" placeholder="100 % coton biologique"></label>
        <div style="display:grid;gap:8px"><span class="label">Certifications</span>
          <div class="checks">${CERTS.map((c) => `<label><input type="checkbox" name="cert" value="${esc(c)}" ${(m.certifications || []).includes(c) ? "checked" : ""}> ${esc(c)}</label>`).join("")}</div></div>
        <div class="row3">
          <label><span>Grammage (g/m²)</span><input id="mf-weight" name="weight" type="number" min="0" value="${m.weight ?? ""}"></label>
          <label><span>Prix (€)</span><input id="mf-price" name="price" type="number" step="0.01" min="0" value="${+m.price || 0}"></label>
          <label><span>Unité</span><select id="mf-unit" name="unit">${MAT_UNITS.map((u) => `<option ${u === m.unit ? "selected" : ""}>${u}</option>`).join("")}</select></label>
        </div>
        <div class="row3">
          <label><span>Fournisseur</span><input id="mf-supplier" name="supplier" value="${esc(m.supplier)}"></label>
          <label><span>Origine (pays)</span><input id="mf-origin" name="origin" value="${esc(m.origin)}"></label>
          <label><span>Stock</span><input id="mf-stock" name="stock" type="number" step="0.01" min="0" value="${+m.stock || 0}"></label>
        </div>
        <label><span>Notes</span><textarea id="mf-notes" name="notes">${esc(m.notes)}</textarea></label>
        ${ro ? "" : `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn">${existing ? "Enregistrer" : "Ajouter la matière"}</button>${existing ? `<button type="button" class="btn btn-danger" id="delMat">Supprimer</button>` : ""}</div>`}
      </form>
    </div>`, 720);
    if (ro) lockReadOnly(box);
    $("#mForm", box).addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      Object.assign(m, {
        name: fd.get("name").trim(), category: fd.get("category"), composition: fd.get("composition").trim(),
        certifications: fd.getAll("cert"), weight: fd.get("weight") ? +fd.get("weight") : null, price: +fd.get("price") || 0,
        unit: fd.get("unit"), supplier: fd.get("supplier").trim(), origin: fd.get("origin").trim(), stock: +fd.get("stock") || 0, notes: fd.get("notes").trim()
      });
      if (existing) Object.assign(existing, m); else DATA.materials.push(m);
      saveDraft(); closeModal(); pageTeam(); toast("Matière enregistrée.");
    });
    $("#delMat", box)?.addEventListener("click", () => {
      if (usedBy.length) { toast(`Matière utilisée dans ${usedBy.length} fiche(s) : retire-la d'abord des fiches.`); return; }
      if (!confirm(`Supprimer « ${m.name} » ?`)) return;
      DATA.materials = DATA.materials.filter((x) => x.id !== m.id); saveDraft(); closeModal(); pageTeam(); toast("Matière supprimée.");
    });
  }

  /* --- Cahier des charges --- */
  function tabCharter(el) {
    const ch = clone(DATA.charter);
    el.innerHTML = `${publishNotice()}
      <div class="box"><h3>Introduction</h3>
        <textarea class="input" id="chIntro" style="width:100%;min-height:80px" aria-label="Introduction">${esc(ch.intro)}</textarea></div>
      <div class="box"><h3>Exigences</h3><p>Une règle par ligne. La catégorie sert de titre dans le document imprimé.</p>
        <div id="chRules" style="display:grid;gap:8px"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
          <button class="btn btn-ghost btn-sm" id="chAdd">Ajouter une exigence</button>
          <button class="btn btn-sm" id="chSave">Enregistrer</button>
          <button class="btn btn-ghost btn-sm" id="chPrint" data-ro-ok>Imprimer le cahier des charges</button>
        </div></div>`;
    const render = () => {
      $("#chRules").innerHTML = ch.rules.map((r, i) => `<div class="comp-row" style="grid-template-columns:160px 1fr auto auto" data-i="${i}">
        <input class="input" data-k="cat" value="${esc(r.cat)}" placeholder="Catégorie" aria-label="Catégorie">
        <textarea class="input" data-k="text" style="min-height:44px" aria-label="Exigence">${esc(r.text)}</textarea>
        <button class="icon-btn" data-up="${i}" ${i === 0 ? "disabled" : ""} aria-label="Monter">↑</button>
        <button class="icon-btn" data-rmr="${i}" aria-label="Supprimer">✕</button>
      </div>`).join("");
      if (role().readOnly) lockReadOnly($("#chRules"));
    };
    render();
    $("#chRules").addEventListener("input", (e) => { const row = e.target.closest("[data-i]"); if (row) ch.rules[+row.dataset.i][e.target.dataset.k] = e.target.value; });
    $("#chRules").addEventListener("click", (e) => {
      const up = e.target.closest("[data-up]"), rm = e.target.closest("[data-rmr]");
      if (up) { const i = +up.dataset.up; ch.rules.splice(i - 1, 0, ch.rules.splice(i, 1)[0]); render(); }
      if (rm) { ch.rules.splice(+rm.dataset.rmr, 1); render(); }
    });
    $("#chIntro").addEventListener("input", (e) => { ch.intro = e.target.value; });
    $("#chAdd").addEventListener("click", () => { ch.rules.push({ cat: "", text: "" }); render(); });
    $("#chSave").addEventListener("click", () => { ch.rules = ch.rules.filter((r) => r.text.trim()); DATA.charter = ch; saveDraft(); toast("Cahier des charges enregistré."); pageTeam(); });
    $("#chPrint").addEventListener("click", () => printSheet(charterSheetHTML(ch)));
  }
  function charterSheetHTML(ch) {
    return `<div class="sheet">
      <div class="head"><div><span class="label">Document interne</span><h1>Cahier des charges matières</h1><div class="label" style="margin-top:6px">Version du ${new Date().toLocaleDateString("fr-FR")}</div></div><img src="assets/logo-skx-small.png" alt="SKX"></div>
      <p>${esc(ch.intro)}</p>
      <h4>Exigences</h4>
      <table><tbody>${ch.rules.map((r) => `<tr><th style="width:150px">${esc(r.cat)}</th><td>${esc(r.text)}</td></tr>`).join("")}</tbody></table>
      <h4>Matières référencées</h4>
      <table><thead><tr><th>Matière</th><th>Catégorie</th><th>Composition</th><th class="num">g/m²</th><th>Certifications</th><th>Fournisseur</th><th>Origine</th></tr></thead><tbody>
        ${DATA.materials.map((m) => `<tr><td>${esc(m.name)}</td><td>${esc(m.category)}</td><td>${esc(m.composition)}</td><td class="num">${m.weight || "—"}</td><td>${esc((m.certifications || []).join(", ") || "—")}</td><td>${esc(m.supplier)}</td><td>${esc(m.origin)}</td></tr>`).join("")}
      </tbody></table>
      <h4>Validation</h4>
      <table><tbody><tr><th style="width:150px">Fournisseur</th><td style="height:50px"></td><th style="width:150px">SKX</th><td></td></tr></tbody></table>
    </div>`;
  }

  /* --- Zones --- */
  function tabZones(el) {
    el.innerHTML = publishNotice() + ZONE_IDS.map((u) => {
      const x = DATA.zones[u];
      return `<div class="box"><h3><span class="sw sw-${u}" style="margin-right:8px"></span>${esc(x.name)}</h3>
        <form class="form" data-uform="${u}">
          <div class="row3"><label><span>Nom affiché</span><input id="z-${u}-name" name="name" value="${esc(x.name)}"></label><label><span>Accroche</span><input id="z-${u}-tag" name="tagline" value="${esc(x.tagline)}"></label><label><span>Repère montagne</span><input id="z-${u}-metric" name="metric" value="${esc(x.metric)}"></label></div>
          <label><span>Description</span><textarea id="z-${u}-desc" name="description">${esc(x.description)}</textarea></label>
          <button class="btn btn-sm" style="justify-self:start">Enregistrer</button>
        </form></div>`;
    }).join("");
    $$("[data-uform]", el).forEach((f) => f.addEventListener("submit", (e) => {
      e.preventDefault(); Object.assign(DATA.zones[f.dataset.uform], Object.fromEntries(new FormData(f))); saveDraft(); toast("Zone enregistrée."); pageTeam();
    }));
  }

  /* --- Histoire --- */
  function tabHistory(el) {
    const H = clone(DATA.history);
    el.innerHTML = `${publishNotice()}
      <div class="notice info">Chaque bloc est une slide de la page Histoire, dans l'ordre. Le repère peut être une année ou un mot court.</div>
      <div class="box"><label class="form"><span class="label">Introduction</span><input class="input" id="hIntro" value="${esc(H.intro)}"></label></div>
      <div id="hSlides"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" id="hAdd">Ajouter une slide</button><button class="btn btn-sm" id="hSave">Enregistrer</button><a class="btn btn-ghost btn-sm" href="#/histoire" data-ro-ok>Voir la page</a></div>`;
    const render = () => {
      $("#hSlides").innerHTML = H.slides.map((sl, i) => `<div class="box form" data-i="${i}">
        <div class="row3" style="grid-template-columns:160px 1fr auto"><label><span>Repère</span><input data-k="year" value="${esc(sl.year)}"></label><label><span>Titre</span><input data-k="title" value="${esc(sl.title)}"></label>
          <div style="display:flex;gap:6px;align-self:end"><button class="icon-btn" data-up="${i}" ${i ? "" : "disabled"} aria-label="Monter">↑</button><button class="icon-btn" data-rm="${i}" aria-label="Supprimer">✕</button></div></div>
        <label><span>Texte</span><textarea data-k="text">${esc(sl.text)}</textarea></label>
        <label><span>Image <span class="hint">optionnel, lien ou assets/…</span></span><input data-k="image" value="${esc(sl.image || "")}"></label>
      </div>`).join("");
      if (role().readOnly) lockReadOnly($("#hSlides"));
    };
    render();
    $("#hSlides").addEventListener("input", (e) => { const b = e.target.closest("[data-i]"); if (b && e.target.dataset.k) H.slides[+b.dataset.i][e.target.dataset.k] = e.target.value; });
    $("#hSlides").addEventListener("click", (e) => {
      const up = e.target.closest("[data-up]"), rm = e.target.closest("[data-rm]");
      if (up) { const i = +up.dataset.up; H.slides.splice(i - 1, 0, H.slides.splice(i, 1)[0]); render(); }
      if (rm && confirm("Supprimer cette slide ?")) { H.slides.splice(+rm.dataset.rm, 1); render(); }
    });
    $("#hIntro").addEventListener("input", (e) => { H.intro = e.target.value; });
    $("#hAdd").addEventListener("click", () => { H.slides.push({ year: "", title: "", text: "", image: "" }); render(); });
    $("#hSave").addEventListener("click", () => { H.slides = H.slides.filter((x) => x.title.trim() || x.text.trim()); DATA.history = H; saveDraft(); toast("Histoire enregistrée."); pageTeam(); });
  }

  /* --- Page équipe (publique) --- */
  function tabPeople(el) {
    const P = clone(DATA.people);
    el.innerHTML = `${publishNotice()}
      <div class="notice info">Les personnes présentées sur la page publique « L'équipe ». C'est indépendant des accès à l'espace équipe. La première personne est mise en avant.</div>
      <div id="pList"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" id="pAdd">Ajouter une personne</button><button class="btn btn-sm" id="pSave">Enregistrer</button><a class="btn btn-ghost btn-sm" href="#/lequipe" data-ro-ok>Voir la page</a></div>`;
    const render = () => {
      $("#pList").innerHTML = P.map((m, i) => `<div class="box form" data-i="${i}">
        <div class="row3" style="grid-template-columns:1fr 1fr 120px auto"><label><span>Nom</span><input data-k="name" value="${esc(m.name)}"></label><label><span>Rôle affiché</span><input data-k="title" value="${esc(m.title)}" placeholder="Fondateur, Designer, Atelier…"></label><label><span>Depuis</span><input data-k="since" value="${esc(m.since || "")}"></label>
          <div style="display:flex;gap:6px;align-self:end"><button class="icon-btn" data-up="${i}" ${i ? "" : "disabled"} aria-label="Monter">↑</button><button class="icon-btn" data-rm="${i}" aria-label="Retirer">✕</button></div></div>
        <label><span>Présentation</span><textarea data-k="bio">${esc(m.bio)}</textarea></label>
        <label><span>Citation</span><textarea data-k="quote" style="min-height:56px">${esc(m.quote || "")}</textarea></label>
        <div class="av-edit"><div class="av-prev" data-prev="${i}">${avatarSVG(m)}</div>
          <div class="form" style="flex:1;min-width:240px"><span class="label">Avatar <span class="hint">(utilisé s'il n'y a pas de photo)</span></span>
            <div class="row3">
              <label><span>Cheveux</span><select data-av="hair">${Object.entries(AV_HAIR).map(([k, v]) => `<option value="${k}" ${k === m.avatar.hair ? "selected" : ""}>${v}</option>`).join("")}</select></label>
              <label><span>Visage</span><select data-av="facial">${Object.entries(AV_FACIAL).map(([k, v]) => `<option value="${k}" ${k === m.avatar.facial ? "selected" : ""}>${v}</option>`).join("")}</select></label>
              <label><span>Accessoire</span><select data-av="acc">${Object.entries(AV_ACC).map(([k, v]) => `<option value="${k}" ${k === m.avatar.acc ? "selected" : ""}>${v}</option>`).join("")}</select></label>
            </div>
            <div class="row3" style="grid-template-columns:repeat(4,1fr)">
              <label><span>Fond</span><select data-av="bg">${ZONE_IDS.map((z) => `<option value="${z}" ${z === m.avatar.bg ? "selected" : ""}>${esc(DATA.zones[z].name)}</option>`).join("")}</select></label>
              <label><span>Haut</span><input type="color" data-av="top" value="${esc(m.avatar.top)}" style="height:42px;padding:4px"></label>
              <label><span>Peau</span><input type="color" data-av="skin" value="${esc(m.avatar.skin)}" style="height:42px;padding:4px"></label>
              <label><span>Cheveux</span><input type="color" data-av="hairColor" value="${esc(m.avatar.hairColor)}" style="height:42px;padding:4px"></label>
            </div></div></div>
        <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap"><label style="flex:1;min-width:200px"><span>Photo <span class="hint">lien ou assets/…</span></span><input data-k="photo" value="${esc(m.photo && m.photo.startsWith("data:") ? "" : m.photo || "")}"></label>
          <label class="btn btn-ghost btn-sm" style="cursor:pointer">Importer une photo<input type="file" accept="image/*" data-file="${i}" hidden></label></div>
      </div>`).join("");
      if (role().readOnly) lockReadOnly($("#pList"));
    };
    render();
    $("#pList").addEventListener("input", (e) => {
      const b = e.target.closest("[data-i]"); if (!b) return;
      const m = P[+b.dataset.i];
      if (e.target.dataset.k) m[e.target.dataset.k] = e.target.value;
      if (e.target.dataset.av) { m.avatar[e.target.dataset.av] = e.target.value; $(`[data-prev="${b.dataset.i}"]`, b).innerHTML = avatarSVG(m); }
    });
    $("#pList").addEventListener("change", async (e) => {
      const f = e.target.closest("[data-file]"); if (!f || !f.files[0]) return;
      try { P[+f.dataset.file].photo = await resizeImage(f.files[0], 700); toast("Photo importée."); } catch { toast("Impossible de lire cette image."); }
    });
    $("#pList").addEventListener("click", (e) => {
      const up = e.target.closest("[data-up]"), rm = e.target.closest("[data-rm]");
      if (up) { const i = +up.dataset.up; P.splice(i - 1, 0, P.splice(i, 1)[0]); render(); }
      if (rm && confirm("Retirer cette personne de la page ?")) { P.splice(+rm.dataset.rm, 1); render(); }
    });
    $("#pAdd").addEventListener("click", () => { P.push({ id: uid("pp"), name: "", title: "", bio: "", quote: "", photo: "", since: "", avatar: { hair: "court", facial: "aucune", acc: "aucun", top: "#1c1f22", bg: "streetwear", skin: "#cbc3b4", hairColor: "#1b1a19" } }); render(); });
    $("#pSave").addEventListener("click", () => { DATA.people = P.filter((m) => m.name.trim()); saveDraft(); toast("Page équipe enregistrée."); pageTeam(); });
  }

  /* --- Promotions : codes, soldes, remises --- */
  function nthWeekday(y, m, wd, n) { const d = new Date(Date.UTC(y, m, 1)); let c = 0; while (true) { if (d.getUTCDay() === wd && ++c === n) return d; d.setUTCDate(d.getUTCDate() + 1); } }
  function lastWeekday(y, m, wd) { const d = new Date(Date.UTC(y, m + 1, 0)); while (d.getUTCDay() !== wd) d.setUTCDate(d.getUTCDate() - 1); return d; }
  const iso = (d) => d.toISOString().slice(0, 10);
  const plusDays = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };
  function salePreset(kind) {
    const now = new Date(), y = now.getUTCFullYear();
    // Soldes d'hiver : 2e mercredi de janvier · Soldes d'été : dernier mercredi de juin · 4 semaines
    let start = kind === "hiver" ? nthWeekday(y, 0, 3, 2) : lastWeekday(y, 5, 3);
    if (plusDays(start, 27) < now) start = kind === "hiver" ? nthWeekday(y + 1, 0, 3, 2) : lastWeekday(y + 1, 5, 3);
    return { id: uid("sale"), name: kind === "hiver" ? `Soldes d'hiver ${start.getUTCFullYear()}` : `Soldes d'été ${start.getUTCFullYear()}`, start: iso(start), end: iso(plusDays(start, 27)), percent: 30, active: true, productIds: [] };
  }
  function tabPromos(el) {
    const pr = clone(DATA.promos);
    const t = today();
    el.innerHTML = `${publishNotice()}
      <div class="box"><h3>Codes promo pour les proches</h3><p>Réduction maximale : ${pr.maxCode} %. Les codes ne s'appliquent pas aux articles soldés. Ils sont enregistrés chiffrés : note-les bien à la création, on ne peut plus les relire ensuite.</p>
        <div class="table-wrap"><table class="table"><thead><tr><th>Code</th><th>Pour</th><th class="num">Remise</th><th>Expire</th><th>Actif</th><th></th></tr></thead><tbody>
          ${pr.codes.map((c, i) => `<tr><td class="mono">${esc(c.hint)}</td><td>${esc(c.note || "—")}</td><td class="num">−${c.percent} %</td><td>${c.expires ? new Date(c.expires).toLocaleDateString("fr-FR") : "—"}${c.expires && c.expires < t ? ` <span class="status status-Arrêté">expiré</span>` : ""}</td>
            <td><input type="checkbox" data-code-on="${i}" ${c.active ? "checked" : ""} aria-label="Actif"></td><td><div class="actions"><button class="btn btn-danger btn-sm" data-code-del="${i}">Suppr.</button></div></td></tr>`).join("") || `<tr><td colspan="6" class="muted">Aucun code.</td></tr>`}
        </tbody></table></div>
        <form class="form" id="codeForm" style="margin-top:16px">
          <div class="row3" style="grid-template-columns:1.2fr 100px 1fr 1fr">
            <label><span>Code</span><input id="cf-code" name="code" required pattern="[A-Za-z0-9_\\-]{3,20}" placeholder="FAMILLE50" style="text-transform:uppercase"></label>
            <label><span>Remise %</span><input id="cf-pct" name="percent" type="number" min="1" max="${pr.maxCode}" value="30" required></label>
            <label><span>Pour <span class="hint">note interne</span></span><input id="cf-note" name="note" placeholder="Famille, amis…"></label>
            <label><span>Expire le <span class="hint">optionnel</span></span><input id="cf-exp" name="expires" type="date"></label>
          </div>
          <button class="btn btn-sm" style="justify-self:start">Créer le code</button>
        </form></div>

      <div class="box"><h3>Soldes</h3><p>Soldes générales d'hiver et d'été sur les fins de stock. Réduction maximale : ${pr.maxSale} %. Coche les articles concernés.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><button class="btn btn-ghost btn-sm" data-preset="hiver">+ Soldes d'hiver</button><button class="btn btn-ghost btn-sm" data-preset="ete">+ Soldes d'été</button></div>
        <div id="salesList"></div></div>

      <div class="box"><h3>Remise par quantité</h3><p>Pousse à ajouter une pièce de plus. Ne se cumule pas avec un code promo.</p>
        <label class="check" style="margin-bottom:12px"><input type="checkbox" id="volOn" ${pr.volume.enabled ? "checked" : ""}> Activer</label>
        <div id="tiers" style="display:grid;gap:8px;max-width:420px">${pr.volume.tiers.map((x, i) => `<div style="display:flex;gap:8px;align-items:center"><span class="label">Dès</span><input class="input" type="number" min="2" value="${x.qty}" data-tier="${i}" data-tk="qty" style="width:70px" aria-label="Pièces"><span class="label">pièces</span><input class="input" type="number" min="1" max="50" value="${x.percent}" data-tier="${i}" data-tk="percent" style="width:70px" aria-label="Remise"><span class="label">%</span></div>`).join("")}</div></div>

      <div class="box"><h3>Emballage cadeau</h3>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><label class="check"><input type="checkbox" id="giftOn" ${pr.giftWrap.enabled ? "checked" : ""}> Proposer l'emballage cadeau</label>
        <label class="form" style="display:flex;align-items:center;gap:8px"><span class="label">Prix</span><input class="input" type="number" step="0.5" min="0" id="giftPrice" value="${+pr.giftWrap.price}" style="width:90px"></label></div></div>

      <button class="btn" id="promoSave">Enregistrer les promotions</button>`;
    const renderSales = () => {
      $("#salesList").innerHTML = pr.sales.map((x, i) => {
        const live = x.active && x.start <= t && x.end >= t;
        return `<div class="box sale-box" data-si="${i}" style="background:var(--bg)">
          <div class="row3" style="grid-template-columns:1.4fr 1fr 1fr 90px auto;display:grid;gap:10px;align-items:end">
            <label class="form"><span class="label">Nom</span><input class="input" data-sk="name" value="${esc(x.name)}"></label>
            <label class="form"><span class="label">Début</span><input class="input" type="date" data-sk="start" value="${esc(x.start)}"></label>
            <label class="form"><span class="label">Fin</span><input class="input" type="date" data-sk="end" value="${esc(x.end)}"></label>
            <label class="form"><span class="label">Remise %</span><input class="input" type="number" min="1" max="${pr.maxSale}" data-sk="percent" value="${x.percent}"></label>
            <div style="display:flex;gap:6px;align-items:center"><label class="check"><input type="checkbox" data-sk="active" ${x.active ? "checked" : ""}> Active</label><button class="icon-btn" data-sdel="${i}" aria-label="Supprimer">✕</button></div>
          </div>
          <p class="label" style="margin:10px 0">${live ? `<span style="color:var(--ok)">En cours</span>` : x.start > t ? "À venir" : "Terminée ou inactive"} · ${x.productIds.length} article(s)
            · <button class="rm" data-sauto="${i}">Cocher les fins de stock (≤ 10)</button> · <button class="rm" data-sall="${i}">Tout cocher</button> · <button class="rm" data-snone="${i}">Tout décocher</button></p>
          <div class="checks">${DATA.products.map((p) => `<label><input type="checkbox" data-sp="${esc(p.id)}" ${x.productIds.includes(p.id) ? "checked" : ""}> ${esc(p.name)} <span class="muted">· ${+p.stock || 0}</span></label>`).join("")}</div>
        </div>`;
      }).join("") || `<p class="muted">Aucune période de soldes.</p>`;
      if (role().readOnly) lockReadOnly($("#salesList"));
    };
    renderSales();
    $$("[data-preset]", el).forEach((b) => b.addEventListener("click", () => { pr.sales.push(salePreset(b.dataset.preset)); renderSales(); }));
    $("#salesList").addEventListener("input", (e) => {
      const box = e.target.closest("[data-si]"); if (!box) return;
      const x = pr.sales[+box.dataset.si];
      const k = e.target.dataset.sk;
      if (k === "active") x.active = e.target.checked;
      else if (k === "percent") x.percent = Math.max(1, Math.min(+e.target.value || 0, pr.maxSale));
      else if (k) x[k] = e.target.value;
      if (e.target.dataset.sp) { const id = e.target.dataset.sp; x.productIds = e.target.checked ? [...new Set([...x.productIds, id])] : x.productIds.filter((y) => y !== id); }
    });
    $("#salesList").addEventListener("click", (e) => {
      const d = e.target.closest("[data-sdel]"), au = e.target.closest("[data-sauto]"), al = e.target.closest("[data-sall]"), no = e.target.closest("[data-snone]");
      if (d && confirm("Supprimer cette période de soldes ?")) { pr.sales.splice(+d.dataset.sdel, 1); renderSales(); }
      if (au) { pr.sales[+au.dataset.sauto].productIds = DATA.products.filter((p) => (+p.stock || 0) > 0 && (+p.stock || 0) <= 10).map((p) => p.id); renderSales(); }
      if (al) { pr.sales[+al.dataset.sall].productIds = DATA.products.map((p) => p.id); renderSales(); }
      if (no) { pr.sales[+no.dataset.snone].productIds = []; renderSales(); }
    });
    $("#tiers").addEventListener("input", (e) => { const i = e.target.dataset.tier; if (i !== undefined) pr.volume.tiers[+i][e.target.dataset.tk] = Math.max(1, Math.min(+e.target.value || 0, e.target.dataset.tk === "percent" ? 50 : 99)); });
    $("#codeForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const code = normCode(f.code);
      if (pr.codes.some((c) => c.hash === codeHash(code))) { toast("Ce code existe déjà."); return; }
      const pct = Math.max(1, Math.min(+f.percent || 0, pr.maxCode));
      pr.codes.push({ id: uid("code"), hash: codeHash(code), hint: code.slice(0, 3) + "•".repeat(Math.max(2, code.length - 3)), percent: pct, note: f.note.trim(), expires: f.expires || "", active: true });
      DATA.promos = pr; saveDraft(); pageTeam();
      toast(`Code ${code} créé (−${pct} %). Note-le : il ne sera plus affiché en clair.`);
    });
    el.addEventListener("change", (e) => {
      const on = e.target.closest("[data-code-on]"); if (on) pr.codes[+on.dataset.codeOn].active = on.checked;
    });
    el.addEventListener("click", (e) => {
      const del = e.target.closest("[data-code-del]");
      if (del && confirm("Supprimer ce code ?")) { pr.codes.splice(+del.dataset.codeDel, 1); DATA.promos = pr; saveDraft(); pageTeam(); }
    });
    $("#promoSave").addEventListener("click", () => {
      pr.volume.enabled = $("#volOn").checked;
      pr.giftWrap.enabled = $("#giftOn").checked; pr.giftWrap.price = Math.max(0, +$("#giftPrice").value || 0);
      for (const x of pr.sales) if (x.start && x.end && x.end < x.start) { toast(`« ${x.name} » : la fin est avant le début.`); return; }
      DATA.promos = pr; saveDraft(); toast("Promotions enregistrées."); pageTeam();
    });
  }

  /* --- Personnalisation : dessins proposés --- */
  function tabDesigns(el) {
    const list = clone(DATA.designs);
    const demo = DATA.products.find((p) => p.type === "tshirt") || DATA.products[0];
    el.innerHTML = `${publishNotice()}
      <div class="notice info">Les dessins que les clients peuvent ajouter sur les pièces personnalisables, avec leur supplément. Le logo SKX reste toujours brodé en bas à gauche, en plus du dessin choisi.</div>
      <div id="dList" class="design-admin"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-ghost btn-sm" id="dAdd">Ajouter un dessin (image)</button><button class="btn btn-sm" id="dSave">Enregistrer</button></div>`;
    const render = () => {
      $("#dList").innerHTML = list.map((d, i) => `<div class="box d-row" data-i="${i}">
        <div class="d-prev">${demo ? productSVG(demo, { design: d.id === "none" ? "none" : d.id, color: "#18191b" }) : ""}</div>
        <div class="form" style="flex:1">
          <div class="row3" style="grid-template-columns:1fr 110px auto">
            <label><span>Nom</span><input data-k="name" value="${esc(d.name)}" ${d.id === "none" ? "readonly" : ""}></label>
            <label><span>Supplément €</span><input type="number" step="0.5" min="0" data-k="price" value="${+d.price || 0}" ${d.id === "none" ? "readonly" : ""}></label>
            <label class="check" style="align-self:end"><input type="checkbox" data-k="enabled" ${d.enabled ? "checked" : ""} ${d.id === "none" ? "disabled" : ""}> Proposé</label>
          </div>
          ${BUILTIN_DESIGNS[d.id] || d.id === "none" ? "" : `<label><span>Image du dessin <span class="hint">PNG transparent conseillé — lien ou assets/…</span></span><input data-k="image" value="${esc(d.image && d.image.startsWith("data:") ? "" : d.image)}"></label>
            <div style="display:flex;gap:8px"><label class="btn btn-ghost btn-sm" style="cursor:pointer">Importer l'image<input type="file" accept="image/*" data-file="${i}" hidden></label><button class="btn btn-danger btn-sm" data-del="${i}">Supprimer</button></div>`}
        </div></div>`).join("");
      if (role().readOnly) lockReadOnly($("#dList"));
    };
    // l'aperçu lit DATA.designs : on synchronise temporairement
    const preview = () => { const keep = DATA.designs; DATA.designs = list; render(); DATA.designs = keep; };
    preview();
    $("#dList").addEventListener("change", async (e) => {
      const row = e.target.closest("[data-i]"); if (!row) return;
      const d = list[+row.dataset.i], k = e.target.dataset.k;
      if (k === "enabled") d.enabled = e.target.checked;
      else if (k === "price") d.price = Math.max(0, +e.target.value || 0);
      else if (k) { d[k] = e.target.value; if (k === "image") preview(); }
      if (e.target.dataset.file && e.target.files[0]) { try { d.image = await resizeImage(e.target.files[0], 500); preview(); toast("Image importée."); } catch { toast("Impossible de lire cette image."); } }
    });
    $("#dList").addEventListener("click", (e) => { const b = e.target.closest("[data-del]"); if (b && confirm("Supprimer ce dessin ?")) { list.splice(+b.dataset.del, 1); preview(); } });
    $("#dAdd").addEventListener("click", () => { list.push({ id: uid("d"), name: "Nouveau dessin", price: 5, enabled: false, image: "" }); preview(); });
    $("#dSave").addEventListener("click", () => { DATA.designs = list; saveDraft(); toast("Dessins enregistrés."); pageTeam(); });
  }

  /* --- Radio --- */
  function tabRadio(el) {
    el.innerHTML = `${publishNotice()}
      <div class="notice info">La première station est jouée par défaut. Chaque adresse doit être un flux audio direct (MP3 ou AAC) en https. Mets plusieurs adresses, une par ligne : si la première ne répond pas, la suivante est essayée.</div>
      <div class="box"><h3>Stations</h3><div id="stations" style="margin-top:14px"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <button class="btn btn-ghost btn-sm" id="addStation">Ajouter une station</button>
          <button class="btn btn-sm" id="saveStations">Enregistrer</button>
        </div></div>`;
    const list = clone(DATA.stations);
    const render = () => {
      $("#stations").innerHTML = list.map((s, i) => `<div class="station-row form" data-i="${i}">
        <input class="input" data-k="name" value="${esc(s.name)}" placeholder="Nom" aria-label="Nom">
        <textarea class="input" data-k="urls" placeholder="https://…" aria-label="Adresses">${esc((s.urls || []).join("\n"))}</textarea>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" data-act="test">Écouter</button>
          <button class="btn btn-ghost btn-sm" data-act="up" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="btn btn-danger btn-sm" data-act="del" ${list.length < 2 ? "disabled" : ""}>Suppr.</button>
        </div></div>`).join("");
    };
    render();
    $("#stations").addEventListener("input", (e) => {
      const row = e.target.closest("[data-i]"), k = e.target.dataset.k; if (!row || !k) return;
      const s = list[+row.dataset.i];
      if (k === "urls") s.urls = e.target.value.split(/\s+/).filter(Boolean); else s.name = e.target.value;
    });
    $("#stations").addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return;
      const i = +b.closest("[data-i]").dataset.i;
      if (b.dataset.act === "del") list.splice(i, 1);
      if (b.dataset.act === "up") list.splice(i - 1, 0, list.splice(i, 1)[0]);
      if (b.dataset.act === "test") { radio.playStation(list[i]); return; }
      render();
    });
    $("#addStation").addEventListener("click", () => { list.push({ name: "Nouvelle radio", urls: [] }); render(); });
    $("#saveStations").addEventListener("click", () => {
      const clean = list.filter((s) => s.name.trim() && s.urls.length);
      if (!clean.length) { toast("Il faut au moins une station avec une adresse."); return; }
      DATA.stations = clean; saveDraft(); radio.reload(); toast("Radio enregistrée."); pageTeam();
    });
  }

  /* --- Commandes --- */
  function tabOrders(el) {
    const orders = store.get("skx_orders", []);
    el.innerHTML = `<div class="notice info">Les commandes clients arrivent par email, ou par Formspree si une adresse est réglée dans Réglages. Cette liste ne montre que les commandes passées depuis ce navigateur, pour tester.</div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Réf.</th><th>Date</th><th>Client</th><th>Articles</th><th class="num">Total</th></tr></thead>
        <tbody>${orders.map((o) => `<tr><td class="mono">${esc(o.ref)}</td><td>${new Date(o.date).toLocaleString("fr-FR")}</td>
          <td>${esc(o.customer.prenom)} ${esc(o.customer.nom)}<div class="label" style="margin-top:2px">${esc(o.customer.email)}</div></td>
          <td>${o.items.map((i) => `${esc(i.name)} (${esc(i.size)}) ×${i.qty}`).join("<br>")}</td><td class="num">${money(o.total)}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Aucune commande.</td></tr>`}</tbody>
      </table></div>
      ${orders.length ? `<button class="btn btn-ghost btn-sm" id="clearOrders" style="margin-top:14px">Vider la liste</button>` : ""}`;
    $("#clearOrders")?.addEventListener("click", () => { if (confirm("Vider la liste des commandes de test ?")) { store.del("skx_orders"); pageTeam(); } });
  }

  /* --- Équipe --- */
  function tabTeam(el) {
    const me = currentUser();
    const boot = me.id === "bootstrap";
    el.innerHTML = `${publishNotice()}
      ${boot ? `<div class="notice">Tu es connecté avec le compte de démarrage. Crée ton propre compte administrateur ci-dessous : le compte « admin » sera alors désactivé.</div>` : ""}
      <div class="notice info">Les comptes fonctionnent pour les collaborateurs une fois le site <b>publié</b>. Les mots de passe ne sont jamais enregistrés en clair.</div>
      ${DATA.team.length ? `<div class="table-wrap" style="margin-bottom:16px"><table class="table">
        <thead><tr><th>Nom</th><th>Identifiant</th><th>Rôle</th><th>Créé le</th><th></th></tr></thead>
        <tbody>${DATA.team.map((m) => `<tr>
          <td><b style="font-weight:500">${esc(m.name)}</b>${m.id === me.id ? ` <span class="label">(toi)</span>` : ""}</td>
          <td class="mono">${esc(m.login)}</td>
          <td><select class="input" data-role="${esc(m.id)}" aria-label="Rôle">${Object.entries(ROLES).map(([k, r]) => `<option value="${k}" ${k === m.role ? "selected" : ""}>${r.label}</option>`).join("")}</select></td>
          <td>${m.created ? new Date(m.created).toLocaleDateString("fr-FR") : "—"}</td>
          <td><div class="actions"><button class="btn btn-ghost btn-sm" data-reset="${esc(m.id)}">Nouveau mot de passe</button>${m.id !== me.id ? `<button class="btn btn-danger btn-sm" data-delm="${esc(m.id)}">Retirer</button>` : ""}</div></td>
        </tr>`).join("")}</tbody></table></div>` : ""}
      <div class="box"><h3>${boot ? "Créer ton compte administrateur" : "Ajouter un collaborateur"}</h3>
        <p>${Object.values(ROLES).map((r) => `<b>${r.label}</b> : ${r.desc.toLowerCase()}`).join(" · ")}</p>
        <form class="form" id="memberForm">
          <div class="row"><label><span>Nom complet</span><input id="mb-name" name="name" required value="${boot ? "Anthony F" : ""}"></label>
            <label><span>Identifiant</span><input id="mb-login" name="login" required pattern="[a-zA-Z0-9._\\-]{3,}" title="3 caractères minimum : lettres, chiffres, . _ -" value="${boot ? "anthony" : ""}" autocomplete="off"></label></div>
          <div class="row"><label><span>Rôle</span><select id="mb-role" name="role" ${boot ? "disabled" : ""}>${Object.entries(ROLES).map(([k, r]) => `<option value="${k}" ${k === (boot ? "admin" : "atelier") ? "selected" : ""}>${r.label}</option>`).join("")}</select></label>
            <label><span>Mot de passe <span class="hint">8 caractères minimum</span></span><input id="mb-pwd" name="pwd" type="password" minlength="8" required autocomplete="new-password"></label></div>
          <button class="btn btn-sm" style="justify-self:start">${boot ? "Créer mon compte" : "Ajouter"}</button>
        </form></div>`;
    $("#memberForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const login = fd.get("login").trim().toLowerCase();
      if (DATA.team.some((m) => m.login === login)) { toast("Cet identifiant existe déjà."); return; }
      const salt = uid("s");
      const m = { id: uid("u"), name: fd.get("name").trim(), login, role: boot ? "admin" : fd.get("role"), salt, hash: await derive(fd.get("pwd"), salt), created: new Date().toISOString() };
      DATA.team.push(m); saveDraft();
      if (boot) { session.set("skx_user", { id: m.id }); applySettings(); toast("Compte créé. Publie le site pour l'activer partout."); adminTab = "dashboard"; }
      else toast(`${m.name} ajouté. Publie le site pour activer son compte.`);
      pageTeam();
    });
    el.addEventListener("change", (e) => {
      const s = e.target.closest("[data-role]"); if (!s) return;
      const m = DATA.team.find((x) => x.id === s.dataset.role);
      if (m.role === "admin" && s.value !== "admin" && DATA.team.filter((x) => x.role === "admin").length < 2) { toast("Il faut au moins un administrateur."); s.value = "admin"; return; }
      m.role = s.value; saveDraft(); toast("Rôle mis à jour."); if (m.id === me.id) pageTeam();
    });
    el.addEventListener("click", (e) => {
      const r = e.target.closest("[data-reset]"), d = e.target.closest("[data-delm]");
      if (r) resetPassword(DATA.team.find((x) => x.id === r.dataset.reset));
      if (d) {
        const m = DATA.team.find((x) => x.id === d.dataset.delm);
        if (m.role === "admin" && DATA.team.filter((x) => x.role === "admin").length < 2) { toast("Il faut au moins un administrateur."); return; }
        if (confirm(`Retirer ${m.name} de l'équipe ?`)) { DATA.team = DATA.team.filter((x) => x !== m); saveDraft(); pageTeam(); toast("Collaborateur retiré. Publie pour appliquer."); }
      }
    });
  }
  function resetPassword(m) {
    const box = openModal(`<div class="modal-pad"><h2>Mot de passe de ${esc(m.name)}</h2>
      <form class="form" id="rpForm" style="margin-top:16px">
        <label><span>Nouveau mot de passe</span><input id="rp-1" type="password" minlength="8" required autocomplete="new-password"></label>
        <label><span>Confirmer</span><input id="rp-2" type="password" minlength="8" required autocomplete="new-password"></label>
        <button class="btn">Enregistrer</button>
      </form></div>`, 440);
    $("#rpForm", box).addEventListener("submit", async (e) => {
      e.preventDefault();
      if ($("#rp-1").value !== $("#rp-2").value) { toast("Les deux mots de passe sont différents."); return; }
      m.salt = uid("s"); m.hash = await derive($("#rp-1").value, m.salt); saveDraft(); closeModal(); pageTeam(); toast("Mot de passe changé. Publie pour l'appliquer partout.");
    });
  }

  /* --- Mon compte --- */
  function tabAccount(el) {
    const me = currentUser();
    if (me.id === "bootstrap") { el.innerHTML = `<div class="notice">Crée d'abord ton compte dans l'onglet Équipe.</div>`; return; }
    const m = DATA.team.find((x) => x.id === me.id);
    el.innerHTML = `<div class="box" style="max-width:520px" data-ro-ok><h3>${esc(m.name)}</h3><p><span class="mono">${esc(m.login)}</span> · ${esc(ROLES[m.role]?.label)}</p>
      <form class="form" id="accForm" data-ro-ok>
        <label><span>Mot de passe actuel</span><input id="acc-0" type="password" required autocomplete="current-password" data-ro-ok></label>
        <label><span>Nouveau mot de passe</span><input id="acc-1" type="password" minlength="8" required autocomplete="new-password" data-ro-ok></label>
        <label><span>Confirmer</span><input id="acc-2" type="password" minlength="8" required autocomplete="new-password" data-ro-ok></label>
        <button class="btn btn-sm" style="justify-self:start" data-ro-ok>Changer mon mot de passe</button>
      </form>
      ${!canPublish() ? `<p class="muted" style="margin-top:14px;font-size:13px">Ton changement sera actif partout quand un responsable publiera le site.</p>` : ""}</div>`;
    $("#accForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        if (!(await verify($("#acc-0").value, m.salt, m.hash))) { toast("Mot de passe actuel incorrect."); return; }
        if ($("#acc-1").value !== $("#acc-2").value) { toast("Les deux mots de passe sont différents."); return; }
        m.salt = uid("s"); m.hash = await derive($("#acc-1").value, m.salt); saveDraft(); toast("Mot de passe changé."); pageTeam();
      } catch (err) { toast(err.message); }
    });
  }

  /* --- Réglages --- */
  function tabSettings(el) {
    const s = S();
    el.innerHTML = `${publishNotice()}
      <div class="box"><h3>Boutique</h3><form class="form" id="setForm">
        <div class="row"><label><span>Nom de la boutique</span><input id="st-name" name="shopName" value="${esc(s.shopName)}"></label><label><span>Slogan</span><input id="st-slogan" name="slogan" value="${esc(s.slogan)}"></label></div>
        <label><span>Année de création</span><input id="st-founded" name="founded" value="${esc(s.founded || "")}"></label>
        <label><span>Bandeau d'annonce</span><input id="st-ann" name="announcement" value="${esc(s.announcement)}"></label>
        <div class="row"><label><span>Email de contact <span class="hint">reçoit les commandes</span></span><input id="st-mail" type="email" name="contactEmail" value="${esc(s.contactEmail)}"></label>
          <label><span>Lien de paiement <span class="hint">Stripe, PayPal.me, SumUp…</span></span><input id="st-pay" name="paymentLink" value="${esc(s.paymentLink)}" placeholder="https://"></label></div>
        <label><span>Réception des commandes <span class="hint">optionnel, ex. https://formspree.io/f/xxxx</span></span><input id="st-end" name="orderEndpoint" value="${esc(s.orderEndpoint)}"></label>
        <div class="row"><label><span>Livraison offerte dès (€)</span><input id="st-free" type="number" step="0.01" name="freeShippingFrom" value="${+s.freeShippingFrom}"></label><label><span>Prix de la livraison (€)</span><input id="st-ship" type="number" step="0.01" name="shippingPrice" value="${+s.shippingPrice}"></label></div>
        <div class="row"><label><span>Dépôt GitHub</span><input id="st-repo" name="githubRepo" value="${esc(s.githubRepo)}" placeholder="utilisateur/depot"></label><label><span>Branche publiée</span><input id="st-branch" name="githubBranch" value="${esc(s.githubBranch)}"></label></div>
        <button class="btn btn-sm" style="justify-self:start">Enregistrer</button>
      </form></div>`;
    $("#setForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      f.freeShippingFrom = +f.freeShippingFrom || 0; f.shippingPrice = +f.shippingPrice || 0;
      Object.assign(DATA.settings, f); saveDraft(); toast("Réglages enregistrés."); pageTeam();
    });
  }

  const TABS = { dashboard: tabDashboard, products: tabProducts, specs: tabSpecs, materials: tabMaterials, charter: tabCharter, zones: tabZones, history: tabHistory, people: tabPeople, promos: tabPromos, designs: tabDesigns, radio: tabRadio, orders: tabOrders, team: tabTeam, settings: tabSettings, account: tabAccount };

  /* ================= RADIO ================= */
  const radio = (() => {
    const audio = $("#audio"), box = $("#radio"), sel = $("#stationSelect"), status = $("#radioStatus");
    const vol = $("#volume"), volVal = $("#volVal");
    const prefs = Object.assign({ station: 0, volume: 60, muted: false, want: true, mini: false }, store.get("skx_radio", {}));
    const savePrefs = () => store.set("skx_radio", prefs);
    let current = null, urlIdx = 0, playing = false;

    function setStatus(txt, cls) {
      status.textContent = txt;
      box.classList.toggle("playing", cls === "playing");
      box.classList.toggle("loading", cls === "loading");
    }
    function fill() {
      sel.innerHTML = DATA.stations.map((s, i) => `<option value="${i}">${esc(s.name)}</option>`).join("");
      if (prefs.station >= DATA.stations.length) prefs.station = 0;
      sel.value = prefs.station;
      current = DATA.stations[prefs.station];
    }
    function setVolume(v) {
      v = Math.max(0, Math.min(100, Math.round(v)));
      prefs.volume = v; audio.volume = v / 100; vol.value = v; volVal.textContent = v;
      if (v > 0 && prefs.muted) setMuted(false);
      savePrefs();
    }
    function setMuted(m) { prefs.muted = m; audio.muted = m; box.classList.toggle("muted", m); savePrefs(); }
    function play(station) {
      if (station) current = station;
      if (!current || !current.urls || !current.urls.length) { setStatus("Aucune station", ""); return Promise.resolve(true); }
      urlIdx = urlIdx % current.urls.length;
      audio.src = current.urls[urlIdx];
      setStatus("Connexion", "loading");
      playing = true;
      const pr = audio.play() || Promise.resolve();
      const result = pr.then(() => true, (err) => { if (err.name === "NotAllowedError") { setStatus("Appuie sur lecture", ""); playing = false; return false; } return true; });
      if ("mediaSession" in navigator && window.MediaMetadata) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: current.name, artist: (S().shopName || "SKX") + " Radio", artwork: [{ src: "assets/favicon.png", sizes: "256x256", type: "image/png" }] });
      }
      return result;
    }
    function stop() {
      playing = false;
      audio.pause(); audio.removeAttribute("src"); audio.load();
      setStatus("En pause", "");
    }
    function toggle() {
      if (playing) { stop(); prefs.want = false; } else { urlIdx = 0; play(); prefs.want = true; }
      savePrefs();
    }
    audio.addEventListener("playing", () => setStatus("En direct", "playing"));
    audio.addEventListener("waiting", () => { if (playing) setStatus("Chargement", "loading"); });
    audio.addEventListener("error", () => {
      if (!playing || !audio.getAttribute("src")) return;
      urlIdx++;
      if (current && urlIdx < current.urls.length) play();
      else { playing = false; urlIdx = 0; setStatus("Flux indisponible", ""); toast("La radio ne répond pas. Réessaie dans un instant ou change de station."); }
    });
    $("#radioPlay").addEventListener("click", toggle);
    $("#radioMute").addEventListener("click", () => setMuted(!prefs.muted));
    $("#volDown").addEventListener("click", () => setVolume(prefs.volume - 10));
    $("#volUp").addEventListener("click", () => setVolume(prefs.volume + 10));
    vol.addEventListener("input", () => setVolume(+vol.value));
    sel.addEventListener("change", () => {
      prefs.station = +sel.value; current = DATA.stations[prefs.station]; urlIdx = 0; prefs.want = true; savePrefs(); play();
    });
    $("#radioHide").addEventListener("click", () => { prefs.mini = !prefs.mini; box.classList.toggle("mini", prefs.mini); savePrefs(); });
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", () => { if (!playing) toggle(); });
        navigator.mediaSession.setActionHandler("pause", () => { if (playing) toggle(); });
      } catch {}
    }
    // La radio essaie de démarrer dès l'arrivée sur le site. Si le navigateur bloque le son
    // automatique, un écran d'entrée propose d'entrer avec la radio (le clic débloque le son).
    const autoStart = (e) => {
      removeAuto();
      if (e.target.closest && e.target.closest("#radio, #entry")) return;
      if (prefs.want && !playing) { urlIdx = 0; play(); }
    };
    const removeAuto = () => ["pointerdown", "keydown", "touchstart"].forEach((t) => document.removeEventListener(t, autoStart, true));
    const addAuto = () => ["pointerdown", "keydown", "touchstart"].forEach((t) => document.addEventListener(t, autoStart, true));
    function showEntry() {
      const el = document.createElement("div");
      el.id = "entry"; el.className = "entry"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Entrer sur SKX");
      el.innerHTML = `<div class="entry-scene"></div>
        <div class="entry-inner">
          <img src="assets/logo-skx.png" alt="SKX" class="entry-logo">
          <p class="entry-claim">${esc(S().slogan || "")}</p>
          <button class="btn" id="entryGo">Entrer · ${esc(current?.name || "radio")}</button>
          <button class="entry-mute" id="entryMute">Entrer sans le son</button>
        </div>`;
      document.body.appendChild(el);
      window.SKXWeather.mountScene($(".entry-scene", el), "home", .8);
      requestAnimationFrame(() => el.classList.add("show"));
      const close = () => { session.set("skx_entered", 1); el.classList.remove("show"); setTimeout(() => el.remove(), 600); };
      $("#entryGo", el).addEventListener("click", () => { removeAuto(); urlIdx = 0; play(); close(); });
      $("#entryMute", el).addEventListener("click", () => { removeAuto(); close(); });
      $("#entryGo", el).focus();
    }
    fill(); setVolume(prefs.volume); setMuted(prefs.muted); box.classList.toggle("mini", prefs.mini);
    if (prefs.want) {
      addAuto();
      urlIdx = 0;
      play().then((ok) => {
        if (ok) { removeAuto(); return; }
        const inTeam = /^#\/(equipe|admin)/.test(location.hash);
        if (!session.get("skx_entered") && !inTeam) showEntry();
      });
    }

    if (!prefs.want) setStatus("En pause", "");
    return {
      reload() { const was = playing; if (was) stop(); fill(); if (was) play(); },
      playStation(s) { urlIdx = 0; play(clone(s)); toast("Écoute : " + s.name); }
    };
  })();

  /* ================= ROUTEUR ================= */
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    window.SKXWeather.destroyAll();
    document.body.dataset.zone = "";
    closeModal();
    const [page, arg] = h.split("/");
    $$("#nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === (page === "zone" ? arg : page)));
    if (!page) pageHome();
    else if (page === "zone") pageZone(arg);
    else if (page === "boutique") { shopState.g = "all"; pageShop(); }
    else if (page === "homme") pageShop("homme");
    else if (page === "femme") pageShop("femme");
    else if (page === "enfants") pageShop("enfant");
    else if (page === "histoire") pageHistoire();
    else if (page === "lequipe") pagePeople();
    else if (page === "matieres") pageMatieres();
    else if (page === "infos" || page === "guide") pageGuide();
    else if (page === "soldes") pageSoldes();
    else if (page === "equipe" || page === "admin") pageTeam();
    else pageNotFound();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  applySettings();
  renderCart();
  route();
})();
