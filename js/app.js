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
  const TYPES = { maillot: "Maillot", tshirt: "T-shirt", hoodie: "Hoodie", veste: "Veste", pantalon: "Pantalon", casquette: "Casquette", bonnet: "Bonnet" };
  const TYPE_CODE = { maillot: "MJ", tshirt: "TS", hoodie: "HD", veste: "JK", pantalon: "PT", casquette: "CP", bonnet: "BN" };
  const MAT_CATEGORIES = ["Tissu", "Bord-côte", "Doublure", "Rembourrage", "Fil à tricoter", "Fil", "Étiquette", "Accessoire", "Emballage"];
  const MAT_UNITS = ["m", "kg", "pièce", "bobine"];
  const CERTS = ["GOTS", "OCS", "GRS", "RCS", "OEKO-TEX 100", "bluesign", "EU Ecolabel", "Fair Wear", "FSC"];
  const FIBER_CERTS = ["GOTS", "OCS", "GRS", "RCS"];
  const STATUSES = ["Prototype", "Validé", "En production", "Arrêté"];
  const NEAR_COUNTRIES = ["france", "portugal", "espagne", "italie", "allemagne", "belgique", "pays-bas", "autriche", "suisse", "grèce", "pologne", "roumanie", "bulgarie", "lituanie", "lettonie", "estonie", "république tchèque", "slovénie", "croatie", "hongrie", "slovaquie", "danemark", "suède", "irlande", "royaume-uni", "turquie", "maroc", "tunisie", "europe"];
  const ROLES = {
    admin: { label: "Admin", desc: "Accès total, gère l'équipe", tabs: ["dashboard", "products", "specs", "materials", "charter", "promos", "designs", "reviews", "zones", "history", "people", "radio", "orders", "team", "settings", "account"], publish: true },
    gestion: { label: "Gestion", desc: "Boutique, stock, radio", tabs: ["dashboard", "products", "specs", "materials", "charter", "promos", "designs", "reviews", "zones", "history", "people", "radio", "orders", "account"], publish: true },
    atelier: { label: "Atelier", desc: "Matières et fiches techniques", tabs: ["dashboard", "specs", "materials", "charter", "account"], publish: true },
    lecture: { label: "Lecture", desc: "Consultation seule", tabs: ["dashboard", "products", "specs", "materials", "charter", "account"], publish: false, readOnly: true }
  };
  const TAB_LABELS = { dashboard: "Tableau de bord", products: "Produits", specs: "Fiches techniques", materials: "Matières", charter: "Cahier des charges", promos: "Promotions", designs: "Personnalisation", reviews: "Avis & FAQ", zones: "Zones", history: "Histoire", people: "Page équipe", radio: "Radio", orders: "Commandes", team: "Accès", settings: "Réglages", account: "Mon compte" };

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
    d.packs = Array.isArray(d.packs) ? d.packs : clone(base.packs || []);
    d.reviews = Array.isArray(d.reviews) ? d.reviews : [];
    d.faq = Array.isArray(d.faq) ? d.faq : clone(base.faq || []);
    d.story = Object.assign(clone(base.story || {}), d.story || {});
    d.superfit = Object.assign(clone(base.superfit || { targets: [], steps: [], images: [] }), d.superfit || {});
    for (const bp of base.products || []) if (!d.products.some((x) => x.id === bp.id) && bp.id === "p-bicolore") d.products.unshift(clone(bp));
    d.textOptions = Object.assign(clone(base.textOptions || { enabled: false }), d.textOptions || {});
    d.settings.welcome = Object.assign({ enabled: false, code: "", percent: 10, delay: 12 }, (base.settings || {}).welcome, d.settings.welcome);
    d.settings.legal = Object.assign({}, (base.settings || {}).legal, d.settings.legal);
    d.settings.social = Object.assign({}, (base.settings || {}).social, d.settings.social);
    d.promos.maxCode = Math.min(+d.promos.maxCode || 70, 70); d.promos.maxSale = Math.min(+d.promos.maxSale || 50, 50);
    // Avatars uniquement (plus de photos) ; les anciens réglages d'avatar reprennent ceux publiés
    d.people.forEach((m) => { m.photo = ""; const b = (base.people || []).find((x) => x.id === m.id); if (b && (!m.avatar || !m.avatar.cap)) m.avatar = clone(b.avatar); });
    d.people.forEach((m) => { m.avatar = Object.assign({ hair: "court", facial: "aucune", acc: "aucun", top: "#1c1f22", bg: "streetwear", skin: "#cbc3b4", hairColor: "#1b1a19", cap: "#141414" }, m.avatar || {}); });
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
    maillot: { body: "M84 41 Q100 50 116 41 L130 50 L142 70 L142 180 L58 180 L58 70 L70 50 Z",
      sleeves: ["M84 41 L58 50 Q42 58 38 86 L26 172 L42 176 L56 100 L58 70 L70 50 Z", "M116 41 L142 50 Q158 58 162 86 L174 172 L158 176 L144 100 L142 70 L130 50 Z"],
      stitch: ["M84 41 L70 50 L58 70", "M116 41 L130 50 L142 70", "M64 98 Q80 140 72 178", "M136 98 Q120 140 128 178", "M58 172 H142", "M28 164 L42 168", "M172 164 L158 168"] },
    tshirt: { body: "M70 42 L50 48 L24 70 L39 95 L58 86 L58 178 L142 178 L142 86 L161 95 L176 70 L150 48 L130 42 Q100 62 70 42 Z", stitch: ["M58 170 H142", "M27 76 L40 98", "M173 76 L160 98", "M74 44 Q100 60 126 44"] },
    hoodie: { body: "M74 44 Q100 16 126 44 L150 52 L176 130 L157 137 L142 96 L142 180 L58 180 L58 96 L43 137 L24 130 L50 52 Z", stitch: ["M82 47 Q100 76 118 47", "M74 140 H126 V164 H74 Z", "M58 170 H142", "M30 124 L44 130", "M170 124 L156 130", "M96 70 L94 96", "M104 70 L106 96"] },
    veste: { body: "M76 40 L124 40 L152 52 L178 132 L159 138 L144 98 L144 180 L56 180 L56 98 L41 138 L22 132 L48 52 Z", stitch: ["M100 46 V180", "M76 40 L100 60 L124 40", "M64 130 H90", "M110 130 H136", "M56 110 H144", "M56 150 H144"] },
    pantalon: { body: "M64 30 L136 30 L145 182 L110 182 L100 84 L90 182 L55 182 L64 30 Z", stitch: ["M64 42 H136", "M66 70 Q76 76 86 66", "M134 70 Q124 76 114 66", "M60 120 H80 V140 H60", "M120 120 H140 V140 H120", "M57 172 H88", "M112 172 H143"] },
    casquette: { body: "M52 128 Q52 66 102 66 Q150 66 150 128 Z", stitch: ["M102 66 V128", "M76 72 Q70 100 72 128", "M128 72 Q134 100 132 128"], extra: '<path d="M44 126 L178 126 Q186 142 160 144 L44 136 Z" fill="rgba(0,0,0,.25)" stroke="rgba(0,0,0,.45)" stroke-width="1"/><circle cx="102" cy="66" r="4" fill="rgba(0,0,0,.3)"/>' },
    bonnet: { body: "M56 150 Q56 62 100 62 Q144 62 144 150 Z", stitch: ["M64 80 V150", "M74 70 V150", "M84 64 V150", "M94 62 V150", "M106 62 V150", "M116 64 V150", "M126 70 V150", "M136 80 V150"], extra: '<rect x="52" y="132" width="96" height="30" rx="2" fill="rgba(0,0,0,.18)" stroke="rgba(0,0,0,.45)" stroke-width="1"/>' }
  };
  // Règle de marquage : logo SKX brodé en bas à gauche + étiquette dans le col
  const LOGO_BL = { maillot: [66, 172, 7], tshirt: [70, 168, 7], hoodie: [70, 172, 7], veste: [68, 172, 7], pantalon: [68, 164, 6], casquette: [70, 120, 6], bonnet: [66, 152, 6] };
  const COLLAR = { maillot: [94, 43], tshirt: [94, 47], hoodie: [94, 50], veste: [94, 44] };
  // Emplacement du motif personnalisé : [x, y, taille]
  const DESIGN_AT = { maillot: [100, 100, 40], tshirt: [100, 100, 44], hoodie: [100, 104, 38], veste: [122, 88, 22], pantalon: [80, 104, 20], casquette: [101, 100, 28], bonnet: [100, 104, 28] };
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
    const c2raw = opt.color2 || (p.colors || []).find((c) => c.hex === colorHex)?.hex2 || color;
    const color2 = /^#[0-9a-f]{6}$/i.test(c2raw) ? c2raw : color;
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
        ${(sh.sleeves || []).map((d) => `<path d="${d}" fill="${color2}" stroke="rgba(0,0,0,.55)" stroke-width="1" stroke-linejoin="round"/><path d="${d}" fill="url(#${g}s)"/>`).join("")}
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
  const productVisual = (p, opt = {}) => {
    const ci = opt.color && (p.colors || []).find((c) => c.hex === opt.color)?.image;
    if (ci && (!opt.design || opt.design === "none")) return `<img src="${esc(ci)}" alt="${esc(p.name)}" loading="lazy">`;
    return p.image && !opt.custom ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : productSVG(p, opt);
  };

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
    const w = S().welcome;
    if (w && w.enabled && w.code && normCode(code) === normCode(w.code)) return { percent: Math.min(+w.percent || 0, 70), active: true };
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
    const so = s.social || {};
    $("#socialLinks").innerHTML = [["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"]].filter(([k]) => so[k]).map(([k, n]) => `<a href="${esc(so[k])}" target="_blank" rel="noopener">${n}</a>`).join("");
    $$(".contact-mail").forEach((a) => { a.href = s.contactEmail ? `mailto:${s.contactEmail}` : "#"; a.textContent = s.contactEmail || ""; });

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

  /* ---------- Avis, envies ---------- */
  const reviewsFor = (id) => (DATA.reviews || []).filter((r) => r.approved !== false && (!id || r.productId === id));
  function ratingOf(id) { const r = reviewsFor(id); return r.length ? { avg: r.reduce((a, x) => a + (+x.rating || 0), 0) / r.length, n: r.length } : null; }
  const stars = (v) => `<span class="stars" aria-label="${num(v, 1)} sur 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${v >= i - .25 ? "on" : v >= i - .75 ? "half" : ""}"></i>`).join("")}</span>`;
  let wish = store.get("skx_wish", []);
  const isWished = (id) => wish.includes(id);
  function toggleWish(id) {
    wish = isWished(id) ? wish.filter((x) => x !== id) : [id, ...wish];
    store.set("skx_wish", wish); renderWishCount(); Accounts.push();
    $$(`[data-wish="${id}"]`).forEach((b) => b.classList.toggle("on", isWished(id)));
    toast(isWished(id) ? "Ajouté à ta liste d'envies." : "Retiré de ta liste d'envies.");
  }
  function renderWishCount() { const c = $("#wishCount"); if (c) { c.textContent = wish.filter((id) => productById(id)).length; c.hidden = !+c.textContent; } }
  const heart = (id) => `<button class="wish ${isWished(id) ? "on" : ""}" data-wish="${esc(id)}" aria-label="Liste d'envies"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg></button>`;

  /* ---------- Cartes produits ---------- */
  function badgeFor(p, pi, off) {
    if ((+p.stock || 0) <= 0) return `<span class="tag tag-r tag-out">Épuisé</span>`;
    if (pi.sale) return `<span class="tag tag-r tag-sale">${pi.sale.percent >= 50 ? "Dernière démarque" : "Soldes"} −${off} %</span>`;
    if (off) return `<span class="tag tag-r tag-promo">Promo −${off} %</span>`;
    if (p.isNew) return `<span class="tag tag-r tag-new">Nouveau</span>`;
    if (p.bestseller) return `<span class="tag tag-r tag-best">Best-seller</span>`;
    if (p.zone === "premiere") return `<span class="tag tag-r tag-limited">Édition limitée</span>`;
    if ((+p.stock || 0) <= 5) return `<span class="tag tag-r tag-promo">Derniers</span>`;
    return "";
  }
  function productCard(p) {
    const u = DATA.zones[p.zone];
    const out = (+p.stock || 0) <= 0;
    const pi = priceInfo(p);
    const off = pi.was ? Math.round(100 - (pi.now / pi.was) * 100) : 0;
    const colors = (p.colors || []).slice(0, 5);
    const rt = ratingOf(p.id);
    const second = (p.images || [])[0];
    return `<article class="card" data-product="${esc(p.id)}" tabindex="0">
      <div class="card-img ${second ? "has-alt" : ""}">
        ${productVisual(p)}
        ${second ? `<img class="alt" src="${esc(second)}" alt="${esc(p.name)} porté" loading="lazy">` : ""}
        ${u ? `<span class="tag"><span class="sw sw-${p.zone}"></span>${esc(u.name)}</span>` : ""}
        ${badgeFor(p, pi, off)}
        ${heart(p.id)}
        ${out ? "" : `<div class="qa" aria-label="Ajout rapide"><span class="label">Ajout rapide</span><div>${(p.sizes || ["Unique"]).map((s) => `<button data-qa="${esc(p.id)}" data-qs="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>`}
      </div>
      <div class="card-row">
        <h3>${esc(p.name)}</h3>
        <span class="price">${priceHTML(p)}</span>
      </div>
      <div class="card-row card-meta">
        <span class="sub">${rt ? `${stars(rt.avg)} <span>(${rt.n})</span>` : `${esc(GENDERS[p.gender] || "")} · ${esc(TYPES[p.type] || "")}`}</span>
        ${colors.length > 1 ? `<span class="dots">${colors.map((c) => `<i style="background:${esc(c.hex)}" title="${esc(c.name)}"></i>`).join("")}</span>` : ""}
      </div>
    </article>`;
  }
  const grid = (list) => list.length ? `<div class="grid">${list.map(productCard).join("")}</div>` : `<div class="empty">Aucun article ici pour le moment. Les prochains drops arrivent.</div>`;
  document.addEventListener("click", (e) => {
    const w = e.target.closest("[data-wish]"); if (w) { e.stopPropagation(); toggleWish(w.dataset.wish); return; }
    const qa = e.target.closest("[data-qa]");
    if (qa) {
      const p = productById(qa.dataset.qa);
      addToCart({ id: p.id, size: qa.dataset.qs, qty: 1, color: (p.colors || []).length > 1 ? p.colors[0].name : "", colorHex: p.color, design: "none" });
      toast(`${p.name}, taille ${qa.dataset.qs}, ajouté au panier.`); return;
    }
    if (e.target.closest(".qa")) return;
    const c = e.target.closest("[data-product]"); if (c) openProduct(c.dataset.product);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches?.("[data-product]")) openProduct(e.target.dataset.product); });

  /* Recommandations : compléter la tenue */
  function recommend(exclude, n = 3, zone) {
    const inCartTypes = new Set(exclude.map((id) => productById(id)?.type).filter(Boolean));
    return DATA.products
      .filter((p) => !exclude.includes(p.id) && (+p.stock || 0) > 0)
      .map((p) => ({ p, s: (inCartTypes.has(p.type) ? 0 : 3) + (p.zone === zone ? 2 : 0) + (p.zone === "accessoires" ? 1.5 : 0) + (saleFor(p) ? 1 : 0) + (p.bestseller ? 1 : 0) + Math.random() * .4 }))
      .sort((a, b) => b.s - a.s).slice(0, n).map((x) => x.p);
  }
  const miniCard = (p) => `<button class="mini" data-product="${esc(p.id)}"><span class="mini-img">${productVisual(p)}</span><span class="mini-txt"><b>${esc(p.name)}</b><span class="price">${priceHTML(p)}</span></span></button>`;
  const seen = () => store.get("skx_seen", []).filter((id) => productById(id));
  function markSeen(id) { const s = seen().filter((x) => x !== id); s.unshift(id); store.set("skx_seen", s.slice(0, 8)); }

  /* Packs */
  const packItems = (pk) => (pk.items || []).map(productById).filter(Boolean);
  function packPrice(pk) { const items = packItems(pk); const full = items.reduce((a, p) => a + priceInfo(p).now, 0); return { full, now: round2(full * (1 - Math.min(+pk.percent || 0, 50) / 100)) }; }
  function packCard(pk) {
    const items = packItems(pk); if (!items.length) return "";
    const pp = packPrice(pk);
    return `<article class="pack">
      <div class="pack-imgs">${items.map((p) => `<button class="pack-img" data-product="${esc(p.id)}" aria-label="${esc(p.name)}">${productVisual(p)}</button>`).join("")}</div>
      <div class="pack-body"><span class="label">Pack · −${pk.percent} %</span><h3>${esc(pk.name)}</h3><p class="muted">${esc(pk.description || "")}</p>
        <div class="price">${money(pp.now)} <s>${money(pp.full)}</s></div>
        <span class="label">Ajoute ces ${items.length} pièces au panier (dans la taille de ton choix) : la remise s'applique automatiquement.</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${items.map((p) => `<button class="chip" data-product="${esc(p.id)}">${esc(p.name)}</button>`).join("")}</div>
      </div></article>`;
  }

  /* ---------- Personnalisation : prix des options ---------- */
  const TO = () => DATA.textOptions || { enabled: false };
  function extrasPrice(design, number, name) {
    const d = +(designById(design)?.price || 0);
    const n = number ? +TO().numberPrice || 0 : 0, m = name ? +TO().namePrice || 0 : 0;
    const sum = d + n + m;
    return design && design !== "none" && number && name ? Math.min(sum, +TO().packPrice || sum) : sum;
  }
  function backSVG(p, color, number, name) {
    const sh = SHAPES[p.type] || SHAPES.tshirt;
    const ink = lum(color) > .5 ? "#151413" : "#efece4";
    return `<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dos personnalisé">
      <rect width="200" height="250" fill="#121211"/>
      <g transform="translate(0,22)">${(sh.sleeves || []).map((d) => `<path d="${d}" fill="${esc((p.colors || []).find((c) => c.hex === color)?.hex2 || color)}" stroke="rgba(0,0,0,.55)" stroke-width="1"/>`).join("")}<path d="${sh.body}" fill="${esc(color)}" stroke="rgba(0,0,0,.55)" stroke-width="1"/>
      ${name ? `<text x="100" y="80" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="13" letter-spacing="2" fill="${ink}">${esc(String(name).toUpperCase())}</text>` : ""}
      ${number ? `<text x="100" y="${name ? 140 : 128}" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="52" fill="${ink}">${esc(number)}</text>` : ""}</g>
      <text x="12" y="240" font-family="JetBrains Mono, monospace" font-size="6.5" fill="#8f8d85">DOS</text>
    </svg>`;
  }

  /* ---------- Fiche produit ---------- */
  function openProduct(id) {
    const p = productById(id); if (!p) return;
    markSeen(id);
    const sizes = p.sizes && p.sizes.length ? p.sizes : ["Unique"];
    let size = sizes.length === 1 ? sizes[0] : null, qty = 1;
    const colors = p.colors && p.colors.length ? p.colors : [{ name: "Unique", hex: p.color }];
    let color = colors[0], design = "none", number = "", name = "";
    const designs = p.customizable ? (DATA.designs || []).filter((d) => d.enabled) : [];
    const textOk = p.customizable && TO().enabled && ["maillot", "tshirt", "hoodie", "veste"].includes(p.type);
    const stock = +p.stock || 0;
    const u = DATA.zones[p.zone];
    const st = specStats(p);
    const pi = priceInfo(p);
    const sale = pi.sale ? activeSales().find((x) => x.name === pi.sale.name) : null;
    const daysLeft = sale ? Math.max(0, Math.ceil((new Date(sale.end + "T23:59:59") - new Date()) / 864e5)) : null;
    const visibleMats = st.materials.filter((m) => !["Fil", "Étiquette", "Accessoire", "Emballage"].includes(m.category));
    const recos = recommend([p.id, ...cart.map((l) => l.id)], 3, p.zone);
    const packs = (DATA.packs || []).filter((pk) => (pk.items || []).includes(p.id));
    const revs = reviewsFor(p.id), rt = ratingOf(p.id);
    const benefits = (p.benefits && p.benefits.length ? p.benefits : ["Matière confortable et résistante", "Coupe sportive et moderne", "Logo brodé en bas à gauche", "Idéal pour le sport, le lifestyle et les aventures urbaines", "Entretien facile"]);
    const colorPhotos = (p.colors || []).some((c) => c.image);
    const pics = colorPhotos ? [null, "draw"] : [null, ...(p.image ? [p.image] : []), ...(p.images || [])];
    const box = openModal(`<div class="pdp">
      <div class="pdp-media">
        <div class="pdp-img" id="pdpImg"></div>
        <div class="thumbs" id="thumbs">${pics.map((src, i) => `<button class="thumb ${i ? "" : "active"}" data-pic="${i}" aria-label="Vue ${i + 1}">${src === "draw" ? productSVG(p) : src ? `<img src="${esc(src)}" alt="">` : productSVG(p)}</button>`).join("")}<button class="thumb" data-pic="back" id="backThumb" hidden aria-label="Vue dos"></button></div>
      </div>
      <div class="pdp-info">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          ${u ? `<a href="#/zone/${p.zone}" data-close class="tag"><span class="sw sw-${p.zone}"></span>${esc(u.name)}</a>` : ""}
          ${pi.sale ? `<span class="tag tag-sale">${esc(pi.sale.name)}${daysLeft !== null ? ` · encore ${daysLeft} j` : ""}</span>` : ""}
          ${p.isNew ? `<span class="tag tag-new">Nouveau</span>` : ""}${p.bestseller ? `<span class="tag tag-best">Best-seller</span>` : ""}
          ${st.share !== null && st.share >= .9 ? `<span class="tag tag-bio">${num(st.share * 100)} % fibres certifiées</span>` : ""}
          <span style="margin-left:auto">${heart(p.id)}</span>
        </div>
        <h2>${esc(p.name)}</h2>
        ${rt ? `<a href="#pdpReviews" class="rating-link" data-anchor-in="pdpReviews">${stars(rt.avg)} ${num(rt.avg, 1)} · ${rt.n} avis</a>` : ""}
        <div class="price" id="pdpPrice"></div>
        <p class="muted" style="margin:0">${esc(p.description)}</p>
        ${colors.length > 1 ? `<div class="opt"><span class="label">Coloris · <b id="colorName">${esc(color.name)}</b></span>
          <div class="swatches" id="pdpColors">${colors.map((c, i) => `<button class="swatch ${i ? "" : "active"}" data-c="${i}" style="--c:${c.hex2 && c.hex2 !== c.hex ? `linear-gradient(135deg, ${esc(c.hex)} 50%, ${esc(c.hex2)} 50%)` : esc(c.hex)}" aria-label="${esc(c.name)}" title="${esc(c.name)}"></button>`).join("")}</div></div>` : ""}
        ${designs.length > 1 ? `<div class="opt"><span class="label">Dessin</span>
          <div class="designs" id="pdpDesigns">${designs.map((d) => `<button class="design ${d.id === "none" ? "active" : ""}" data-d="${esc(d.id)}">${esc(d.name)}${+d.price ? ` <span class="mono">+${money(d.price)}</span>` : ""}</button>`).join("")}</div></div>` : ""}
        ${textOk ? `<div class="opt"><span class="label">Personnalisation du dos</span>
          <div class="perso">
            <label><span class="label">Numéro +${money(TO().numberPrice)}</span><input id="pNum" class="input" inputmode="numeric" maxlength="2" placeholder="10"></label>
            <label><span class="label">Prénom +${money(TO().namePrice)}</span><input id="pName" class="input" maxlength="12" placeholder="KARIM"></label>
          </div>
          <span class="label">Pack personnalisation complète (dessin + numéro + prénom) : ${money(TO().packPrice)}</span></div>` : ""}
        <div class="opt"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="label">Taille</span><a class="link label" href="#/guide" data-close>Guide des tailles</a></div>
          <div class="sizes" id="pdpSizes">${sizes.map((s) => `<button class="size ${s === size ? "active" : ""}" data-size="${esc(s)}">${esc(s)}</button>`).join("")}</div>
          ${p.fitTip ? `<p class="fit">${esc(p.fitTip)}</p>` : ""}
        </div>
        <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
          <div class="qty"><button data-q="-1" aria-label="Moins">−</button><span id="pdpQty">1</span><button data-q="1" aria-label="Plus">+</button></div>
          ${stock <= 0 ? `<span class="stock-low">Épuisé</span>` : stock <= 5 ? `<span class="stock-low">Plus que ${stock} pièce${stock > 1 ? "s" : ""}</span>` : `<span class="label">En stock · expédié sous ${esc(S().shipDelay || "48 h")}</span>`}
        </div>
        <div class="buy" id="buyBar">
          <button class="btn" id="pdpAdd" ${stock <= 0 ? "disabled" : ""}>Ajouter au panier</button>
          <button class="btn btn-ghost" id="pdpBuy" ${stock <= 0 ? "disabled" : ""}>Acheter maintenant</button>
        </div>
        <ul class="benefits">${benefits.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
        ${packs.length ? `<div class="opt"><span class="label">Économise avec un pack</span>${packs.map((pk) => { const pp = packPrice(pk); return `<div class="pack-mini"><b>${esc(pk.name)}</b> <span class="price">${money(pp.now)} <s>${money(pp.full)}</s></span><div class="minis">${packItems(pk).map(miniCard).join("")}</div></div>`; }).join("")}</div>` : ""}
        <div class="compo">
          <div class="compo-row"><span class="label">Marquage</span><div>Chaque pièce est pensée dans les moindres détails. Le logo est brodé en bas à gauche${COLLAR[p.type] ? ", et une étiquette SKX est présente dans le col" : ", avec une étiquette tissée SKX"}.</div></div>
          ${visibleMats.length ? `<div class="compo-row"><span class="label">Composition</span><div>${visibleMats.map((m) => `${esc(m.composition)} <span class="muted">· ${esc(m.name)}</span>`).join("<br>")}</div></div>` : ""}
          ${visibleMats.length ? `<div class="compo-row"><span class="label">Certifications</span><div class="certs">${[...new Set(visibleMats.flatMap((m) => m.certifications || []))].map((c) => `<span class="cert">${esc(c)}</span>`).join("")}</div></div>` : ""}
          ${p.spec.madeIn ? `<div class="compo-row"><span class="label">Fabrication</span><div>${esc(p.spec.madeIn)}</div></div>` : ""}
          ${p.spec.care ? `<div class="compo-row"><span class="label">Entretien</span><div>${esc(p.spec.care)}</div></div>` : ""}
        </div>
        ${recos.length ? `<div class="opt"><span class="label">Complète ton style</span><div class="minis">${recos.map(miniCard).join("")}</div></div>` : ""}
        <div class="opt" id="pdpReviews"><span class="label">Ils portent déjà nos pièces</span>
          ${revs.length ? revs.slice(0, 4).map(reviewHTML).join("") : `<p class="muted" style="margin:0;font-size:14px">Pas encore d'avis sur cette pièce.</p>`}
          <button class="btn btn-ghost btn-sm" style="justify-self:start" data-review="${esc(p.id)}">Donner mon avis</button></div>
        <div class="opt"><span class="label">Questions fréquentes</span>${faqHTML(DATA.faq.slice(0, 6))}</div>
        <span class="label">Livraison offerte dès ${money(S().freeShippingFrom)} · Retours ${S().returnDays || 30} jours · Paiement sécurisé</span>
      </div>
    </div>`);
    let pic = 0;
    const surcharge = () => extrasPrice(design, number, name);
    const refresh = () => {
      const unit = pi.now + surcharge();
      $("#pdpPrice", box).innerHTML = `${money(unit)}${pi.was ? `<s>${money(pi.was + surcharge())}</s>` : ""}${surcharge() ? ` <span class="label">dont personnalisation ${money(surcharge())}</span>` : ""}`;
      const custom = color !== colors[0] || design !== "none";
      const bt = $("#backThumb", box); bt.hidden = !(number || name);
      if (!bt.hidden) bt.innerHTML = backSVG(p, color.hex, number, name);
      if (pic === "back" && bt.hidden) pic = 0;
      $("#pdpImg", box).innerHTML = pic === "back" ? backSVG(p, color.hex, number, name) : pics[pic] === "draw" ? productSVG(p, { color: color.hex, design }) : pic ? `<img src="${esc(pics[pic])}" alt="${esc(p.name)}">` : productVisual(p, { color: color.hex, design, custom: !color.image });
      $$(".thumb", box).forEach((t) => t.classList.toggle("active", String(t.dataset.pic) === String(pic)));
      $(".thumb[data-pic='0']", box).innerHTML = productVisual(p, { color: color.hex, design, custom });
    };
    refresh();
    $("#thumbs", box).addEventListener("click", (e) => { const t = e.target.closest("[data-pic]"); if (!t) return; pic = t.dataset.pic === "back" ? "back" : +t.dataset.pic; refresh(); });
    $("#pdpColors", box)?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]"); if (!b) return;
      color = colors[+b.dataset.c]; $("#colorName", box).textContent = color.name; pic = pic === "back" ? "back" : 0;
      $$(".swatch", box).forEach((x) => x.classList.toggle("active", x === b)); refresh();
    });
    $("#pdpDesigns", box)?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-d]"); if (!b) return;
      design = b.dataset.d; pic = 0; $$(".design", box).forEach((x) => x.classList.toggle("active", x === b)); refresh();
    });
    $("#pNum", box)?.addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 2); number = e.target.value; pic = number || name ? "back" : 0; refresh(); });
    $("#pName", box)?.addEventListener("input", (e) => { e.target.value = e.target.value.replace(/[^A-Za-zÀ-ÿ' -]/g, "").slice(0, 12); name = e.target.value.trim(); pic = number || name ? "back" : 0; refresh(); });
    $("#pdpSizes", box).addEventListener("click", (e) => {
      const b = e.target.closest("[data-size]"); if (!b) return;
      size = b.dataset.size; $$(".size", box).forEach((x) => x.classList.toggle("active", x === b));
    });
    $$("[data-q]", box).forEach((b) => b.addEventListener("click", () => {
      qty = Math.max(1, Math.min(Math.max(1, stock), qty + +b.dataset.q)); $("#pdpQty").textContent = qty;
    }));
    $("[data-anchor-in]", box)?.addEventListener("click", (e) => { e.preventDefault(); $("#pdpReviews", box).scrollIntoView({ behavior: "smooth" }); });
    const add = () => {
      if (!size) { toast("Choisis une taille."); $("#pdpSizes", box).scrollIntoView({ behavior: "smooth", block: "center" }); return false; }
      addToCart({ id: p.id, size, qty, color: colors.length > 1 ? color.name : "", colorHex: color.hex, design, number, name }); return true;
    };
    $("#pdpAdd").addEventListener("click", () => { if (add()) { closeModal(); openCart(); } });
    $("#pdpBuy").addEventListener("click", () => { if (add()) { closeModal(); checkout(); } });
  }

  /* Avis clients */
  const reviewHTML = (r) => `<figure class="review">${stars(+r.rating || 0)}<blockquote>${esc(r.text)}</blockquote><figcaption class="label">${esc(r.name)}${r.productId && productById(r.productId) ? ` · ${esc(productById(r.productId).name)}` : ""}${r.verified ? " · achat vérifié" : ""}</figcaption></figure>`;
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-review]"); if (b) { e.stopPropagation(); reviewForm(b.dataset.review); } }, true);
  function reviewForm(productId) {
    const box = openModal(`<div class="modal-pad"><h2>Donner mon avis</h2>
      <p class="muted" style="margin:0 0 16px">Ton avis est publié après vérification par l'équipe SKX.</p>
      <form class="form" id="revForm">
        <div class="row"><label><span>Prénom</span><input id="rv-name" name="name" required maxlength="30"></label>
          <label><span>Pièce</span><select id="rv-prod" name="productId"><option value="">Avis sur la marque</option>${DATA.products.map((p) => `<option value="${esc(p.id)}" ${p.id === productId ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label></div>
        <div class="opt"><span class="label">Note</span><div class="rate" id="rvRate">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-r="${i}" aria-label="${i} sur 5">★</button>`).join("")}</div></div>
        <label><span>Ton avis</span><textarea id="rv-text" name="text" required maxlength="500" placeholder="Qualité, coupe, livraison…"></textarea></label>
        <button class="btn btn-block">Envoyer mon avis</button>
      </form></div>`, 520);
    let rating = 5;
    const paint = () => $$("#rvRate button", box).forEach((b) => b.classList.toggle("on", +b.dataset.r <= rating));
    paint();
    $("#rvRate", box).addEventListener("click", (e) => { const b = e.target.closest("[data-r]"); if (b) { rating = +b.dataset.r; paint(); } });
    $("#revForm", box).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const review = { type: "avis", name: f.name.trim(), productId: f.productId, rating, text: f.text.trim(), date: new Date().toISOString() };
      const ok = await sendToTeam(review, `Nouvel avis client (${rating}/5)`, `Avis de ${review.name} (${rating}/5)${review.productId ? " sur " + productById(review.productId)?.name : ""} :\n\n${review.text}`);
      openModal(`<div class="modal-pad" style="text-align:center;display:grid;gap:12px"><h2>Merci ${esc(review.name)}.</h2><p class="muted" style="margin:0">${ok ? "Ton avis a été envoyé à l'équipe. Il sera publié après vérification." : "Envoie-le à l'équipe avec le bouton ci-dessous."}</p>${ok ? "" : `<a class="btn" href="${esc(mailtoTeam(`Avis client`, `Avis de ${review.name} (${rating}/5)${review.productId ? " sur " + (productById(review.productId)?.name || "") : ""} :\n\n${review.text}`))}">Envoyer par email</a>`}<button class="btn btn-ghost" data-close>Fermer</button></div>`, 460);
    });
  }
  /* Envoi à l'équipe : Formspree si réglé, sinon email */
  async function sendToTeam(payload, subject) {
    if (!S().orderEndpoint) return false;
    try { const r = await fetch(S().orderEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ...payload, _subject: subject }) }); return r.ok; }
    catch { return false; }
  }
  const mailtoTeam = (subject, body) => S().contactEmail ? `mailto:${S().contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : "#";

  /* FAQ */
  const faqHTML = (list) => `<div class="faq">${list.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>`;

  /* ---------- Panier ---------- */
  let cart = store.get("skx_cart", []);
  let promo = store.get("skx_promo", null);
  let gift = false;
  const lineKey = (l) => [l.id, l.size, l.color || "", l.design || "none", l.number || "", l.name || ""].join("|");
  const saveCart = () => { cart = cart.filter((l) => productById(l.id)); store.set("skx_cart", cart); store.set("skx_cart_at", Date.now()); renderCart(); Accounts.push(); };
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
  const lineExtras = (l) => extrasPrice(l.design, l.number, l.name);
  const lineUnit = (l) => priceInfo(productById(l.id)).now + lineExtras(l);
  const upsell = () => { const u = session.get("skx_upsell"); return u && u.until > Date.now() ? u : null; };
  function totals() {
    const pr = P();
    let sub = 0, eligible = 0, count = 0;
    for (const l of cart) {
      const p = productById(l.id); if (!p) continue;
      const amount = lineUnit(l) * l.qty;
      sub += amount; count += l.qty;
      if (!saleFor(p)) eligible += amount;
    }
    // Remises non cumulables : on applique la meilleure
    const options = [];
    const code = promo ? findCode(promo.code) : null;
    if (promo && !code) { promo = null; store.del("skx_promo"); }
    if (code) { const pct = Math.min(+code.percent || 0, +pr.maxCode || 70); options.push({ v: round2(eligible * pct / 100), label: `Code ${normCode(promo.code)} (−${pct} %)` }); }
    if (pr.volume?.enabled) {
      const tier = (pr.volume.tiers || []).filter((t) => count >= +t.qty).sort((a, b) => b.percent - a.percent)[0];
      if (tier) options.push({ v: round2(sub * Math.min(+tier.percent, 50) / 100), label: `Remise ${tier.qty} pièces et + (−${tier.percent} %)` });
    }
    for (const pk of DATA.packs || []) {
      const items = packItems(pk); if (!items.length) continue;
      const times = Math.min(...items.map((p) => cart.filter((l) => l.id === p.id).reduce((a, l) => a + l.qty, 0)));
      if (times > 0) options.push({ v: round2(times * items.reduce((a, p) => a + priceInfo(p).now, 0) * Math.min(+pk.percent || 0, 50) / 100), label: `${pk.name} (−${pk.percent} %)` });
    }
    const up = upsell();
    if (up) options.push({ v: round2(sub * .1), label: `Ajout à la commande ${up.ref} (−10 %)` });
    const best = options.sort((a, b) => b.v - a.v)[0];
    const discount = best ? best.v : 0, discountLabel = best ? best.label : "";
    const afterDisc = sub - discount;
    const giftPrice = gift && pr.giftWrap?.enabled ? +pr.giftWrap.price || 0 : 0;
    const ship = sub === 0 || afterDisc >= +S().freeShippingFrom ? 0 : +S().shippingPrice;
    return { sub: round2(sub), discount, discountLabel, gift: giftPrice, ship, total: round2(afterDisc + giftPrice + ship), count, afterDisc, codeOverridden: !!(code && best && !best.label.startsWith("Code")) };
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
        ${recos.length ? `<div class="opt" style="margin-top:20px"><span class="label">Meilleures ventes</span><div class="minis">${recos.map(miniCard).join("")}</div></div>` : ""}`;
      foot.innerHTML = ""; return;
    }
    const t = totals();
    const free = +S().freeShippingFrom, left = free - t.afterDisc, pct = Math.min(100, (t.afterDisc / free) * 100);
    const nt = nextTier(t.count);
    const recos = recommend(cart.map((l) => l.id), 3);
    const up = upsell();
    body.innerHTML = `<div class="ship-bar"><span class="label">${left > 0 ? `Plus que <b>${money(left)}</b> pour profiter de la livraison offerte` : "Livraison offerte"}</span><div class="bar"><i style="width:${pct}%"></i></div></div>
      ${up ? `<p class="label" style="margin:8px 0 0;color:var(--ok)">Complément de ta commande ${esc(up.ref)} : −10 % et expédié avec elle.</p>` : ""}
      ${nt ? `<p class="label" style="margin:8px 0 0">Ajoute ${nt.qty - t.count} pièce${nt.qty - t.count > 1 ? "s" : ""} : −${nt.percent} % sur tout le panier</p>` : ""}
      ${cart.map((l, i) => {
        const p = productById(l.id), d = designById(l.design);
        const opts = [l.color, d && d.id !== "none" ? d.name : "", l.number ? "n° " + l.number : "", l.name ? l.name.toUpperCase() : ""].filter(Boolean);
        return `<div class="line">
          <div class="line-img">${productVisual(p, { color: l.colorHex, design: l.design, custom: !!(l.color || (l.design && l.design !== "none")) })}</div>
          <div style="display:grid;gap:4px"><b style="font-weight:500">${esc(p.name)}</b>
            <span class="label">Taille ${esc(l.size)}${opts.length ? " · " + opts.map(esc).join(" · ") : ""}</span>
            <span class="label">${money(lineUnit(l))}${saleFor(p) ? " · soldé" : ""}</span>
            <div style="display:flex;gap:12px;align-items:center;margin-top:6px">
              <div class="qty"><button data-cq="${i}" data-d="-1" aria-label="Moins">−</button><span>${l.qty}</span><button data-cq="${i}" data-d="1" aria-label="Plus">+</button></div>
              <button class="rm" data-rm="${i}">Retirer</button>
            </div></div>
          <span class="price">${money(lineUnit(l) * l.qty)}</span>
        </div>`;
      }).join("")}
      ${recos.length ? `<div class="opt" style="margin-top:18px"><span class="label">Complète ton style</span><div class="minis">${recos.map(miniCard).join("")}</div></div>` : ""}`;
    foot.innerHTML = `
      <form class="promo-form" id="promoForm">${promo ? `<span class="label">Code <b>${esc(normCode(promo.code))}</b> ${t.codeOverridden ? "(une meilleure remise s'applique)" : "appliqué"}</span><button type="button" class="rm" id="promoRm">Retirer</button>` : `<input id="promoInput" placeholder="Code promo" aria-label="Code promo" autocomplete="off"><button class="btn btn-ghost btn-sm">Appliquer</button>`}</form>
      ${P().giftWrap?.enabled ? `<label class="check gift"><input type="checkbox" id="giftWrap" ${gift ? "checked" : ""}> Emballage cadeau (+${money(P().giftWrap.price)})</label>` : ""}
      <div class="totals">
        <div><span>Sous-total</span><span class="price">${money(t.sub)}</span></div>
        ${t.discount ? `<div class="disc"><span>${esc(t.discountLabel)}</span><span class="price">−${money(t.discount)}</span></div>` : ""}
        ${t.gift ? `<div><span>Emballage cadeau</span><span class="price">${money(t.gift)}</span></div>` : ""}
        <div><span>Livraison estimée</span><span class="price">${t.ship ? money(t.ship) : "Offerte"}</span></div>
        <div class="total"><span>Total</span><span class="price">${money(t.total)}</span></div>
      </div>
      <button class="btn btn-block" id="checkoutBtn" style="margin-top:14px">Commander · ${money(t.total)}</button>
      <div class="reassure"><span>Paiement sécurisé${S().paymentMethods ? " · " + esc(S().paymentMethods) : ""}</span><span>Retours ${S().returnDays || 30} jours</span><span>Expédition sous ${esc(S().shipDelay || "48 h")}</span></div>
      <p class="label" style="margin:8px 0 0">Remises non cumulables : la plus avantageuse est appliquée.</p>`;
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
    applyCode(v);
  });
  function applyCode(v) {
    const c = findCode(v);
    if (!c) { toast("Code inconnu ou expiré."); return false; }
    promo = { code: normCode(v) }; store.set("skx_promo", promo);
    toast(`Code appliqué : −${Math.min(+c.percent, +P().maxCode || 70)} % (hors articles soldés).`); renderCart(); return true;
  }
  function openCart() { renderCart(); $("#drawer").classList.add("open"); $("#overlay").classList.add("open"); }
  function closeCart() { $("#drawer").classList.remove("open"); $("#overlay").classList.remove("open"); }
  $("#cartBtn").addEventListener("click", openCart);
  $("#closeDrawer").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);

  /* ---------- Commande ---------- */
  function checkout() {
    closeCart();
    if (!cart.length) return;
    const t = totals();
    const up = upsell();
    const pf = Accounts.profile() || {}, au = Accounts.user();
    openModal(`<div class="modal-pad">
      <h2>Finaliser la commande</h2>
      ${au ? `<p class="label" style="margin:0 0 8px">Connecté : ${esc(au.email)} · la commande sera ajoutée à ton historique</p>` : `<p class="label" style="margin:0 0 8px"><a class="link" href="#/compte" data-close>Connecte-toi</a> pour pré-remplir tes infos et suivre ta commande.</p>`}
      <p class="muted" style="margin:0 0 20px">Total : <span class="price" style="color:var(--text)">${money(t.total)}</span>${t.discount ? ` · dont ${money(t.discount)} de remise` : ""}</p>
      <form class="form" id="orderForm">
        <div class="row"><label><span>Prénom</span><input id="o-prenom" value="${esc(pf.firstName || "")}" name="prenom" required autocomplete="given-name"></label><label><span>Nom</span><input id="o-nom" value="${esc(pf.lastName || "")}" name="nom" required autocomplete="family-name"></label></div>
        <div class="row"><label><span>Email</span><input id="o-email" value="${esc(au?.email || "")}" type="email" name="email" required autocomplete="email"></label><label><span>Téléphone</span><input id="o-tel" value="${esc(pf.phone || "")}" name="tel" autocomplete="tel"></label></div>
        <label><span>Adresse</span><input id="o-adresse" value="${esc(pf.address || "")}" name="adresse" required autocomplete="street-address"></label>
        <div class="row"><label><span>Code postal</span><input id="o-cp" value="${esc(pf.zip || "")}" name="cp" required autocomplete="postal-code"></label><label><span>Ville</span><input id="o-ville" value="${esc(pf.city || "")}" name="ville" required autocomplete="address-level2"></label></div>
        <label><span>Message</span><textarea id="o-message" name="message" placeholder="Optionnel${gift ? " — mot pour le cadeau" : ""}">${up ? `Complément de la commande ${esc(up.ref)}, à expédier avec elle.` : ""}</textarea></label>
        <label class="check"><input type="checkbox" id="o-cgv" required> J'accepte les <a class="link" href="#/cgv" target="_blank">conditions générales de vente</a></label>
        <button class="btn btn-block">Valider la commande</button>
        <div class="reassure"><span>Paiement sécurisé</span><span>Retours ${S().returnDays || 30} jours</span><span>Support : ${esc(S().contactEmail || "")}</span></div>
      </form>
    </div>`, 560);
    $("#orderForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("button.btn-block", e.target); btn.disabled = true; btn.textContent = "Envoi…";
      const customer = Object.fromEntries(new FormData(e.target));
      const tt = totals();
      const order = {
        ref: "SKX-" + Date.now().toString(36).toUpperCase(),
        date: new Date().toISOString(),
        customer,
        items: cart.map((l) => { const p = productById(l.id); const d = designById(l.design); return { id: p.id, name: p.name, size: l.size, color: l.color || "", design: d && d.id !== "none" ? d.name : "", number: l.number || "", flocName: l.name || "", qty: l.qty, price: lineUnit(l) }; }),
        promoCode: promo ? normCode(promo.code) : "", giftWrap: gift, upsellOf: up ? up.ref : "",
        ...tt
      };
      const sent = await sendToTeam({ ...order, email: customer.email }, `Nouvelle commande ${order.ref}`);
      try { await Accounts.addOrder(order); } catch {}
      const orders = store.get("skx_orders", []); orders.unshift(order); store.set("skx_orders", orders);
      cart = []; promo = null; gift = false; store.del("skx_promo"); session.del("skx_upsell"); saveCart();
      orderDone(order, sent);
    });
  }
  function orderText(o) {
    const c = o.customer;
    return `Commande ${o.ref}${o.upsellOf ? " (complément de " + o.upsellOf + ")" : ""}\n\n` + o.items.map((i) => `- ${i.name} (${[i.size, i.color, i.design ? "dessin " + i.design : "", i.number ? "n°" + i.number : "", i.flocName ? "prénom " + i.flocName : ""].filter(Boolean).join(", ")}) x${i.qty} : ${money(i.price * i.qty)}`).join("\n") +
      `\n\nSous-total : ${money(o.sub)}` + (o.discount ? `\n${o.discountLabel} : -${money(o.discount)}` : "") + (o.gift ? `\nEmballage cadeau : ${money(o.gift)}` : "") +
      `\nLivraison : ${o.ship ? money(o.ship) : "Offerte"}\nTOTAL : ${money(o.total)}\n\n` +
      `${c.prenom} ${c.nom}\n${c.adresse}\n${c.cp} ${c.ville}\n${c.email} ${c.tel || ""}\n${c.message ? "\nMessage : " + c.message : ""}`;
  }
  function orderDone(o, sent) {
    const s = S();
    const mailto = s.contactEmail ? `mailto:${s.contactEmail}?subject=${encodeURIComponent("Commande " + o.ref)}&body=${encodeURIComponent(orderText(o))}` : "";
    const recos = recommend(o.items.map((i) => i.id), 3);
    if (!o.upsellOf) session.set("skx_upsell", { ref: o.ref, until: Date.now() + 2 * 3600e3 });
    openModal(`<div class="modal-pad" style="text-align:center;display:grid;gap:12px">
      <span class="label">Commande ${esc(o.ref)}</span>
      <h2>Merci pour ta commande, ${esc(o.customer.prenom)}.</h2>
      <p class="muted" style="margin:0">Ta commande de <span class="price" style="color:var(--text)">${money(o.total)}</span> est enregistrée.</p>
      ${sent ? `<p style="margin:0">Elle a été transmise à l'équipe SKX.</p>` : mailto ? `<p class="muted" style="margin:0">Envoie-la à SKX avec le bouton ci-dessous pour qu'elle soit traitée.</p>` : ""}
      <div style="display:grid;gap:8px;margin-top:10px">
        ${s.paymentLink ? `<a class="btn" href="${esc(s.paymentLink)}" target="_blank" rel="noopener">Payer ${money(o.total)}</a>` : ""}
        ${!sent && mailto ? `<a class="btn ${s.paymentLink ? "btn-ghost" : ""}" href="${esc(mailto)}">Envoyer ma commande par email</a>` : ""}
      </div>
      ${!o.upsellOf && recos.length ? `<div class="opt" style="text-align:left;margin-top:10px"><span class="label">Avant expédition, ajoute un article complémentaire à −10 %</span><div class="minis">${recos.map(miniCard).join("")}</div></div>` : ""}
      <button class="btn btn-ghost" data-close>Continuer mes achats</button>
    </div>`, 520);
  }

  /* ---------- Code de bienvenue (pop-up) ---------- */
  function welcomePopup(force) {
    const w = S().welcome;
    if (!w || !w.enabled || !w.code) return;
    if (!force && (store.get("skx_welcome_seen", false) || /^#\/(equipe|admin)/.test(location.hash) || $("#entry") || $("#modal").classList.contains("open"))) return;
    store.set("skx_welcome_seen", true);
    const box = openModal(`<div class="welcome">
      <div class="welcome-scene"></div>
      <div class="modal-pad" style="display:grid;gap:12px;position:relative">
        <span class="label">Bienvenue chez SKX</span>
        <h2>−${w.percent} % sur ta première commande</h2>
        <p class="muted" style="margin:0">Reçois ton code de bienvenue et sois le premier informé des nouveaux drops. Accès prioritaire et codes privés.</p>
        <form class="form" id="welcomeForm"><div style="display:flex;gap:8px"><input id="welcomeEmail" type="email" required placeholder="ton@email.fr" style="flex:1"><button class="btn">Recevoir</button></div></form>
        <button class="rm" data-close style="justify-self:start">Non merci</button>
      </div></div>`, 520);
    window.SKXWeather.mountScene($(".welcome-scene", box), "premiere", .5);
    $("#welcomeForm", box).addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#welcomeEmail").value;
      const list = store.get("skx_newsletter", []); list.push(email); store.set("skx_newsletter", list);
      await sendToTeam({ type: "newsletter", email }, "Inscription newsletter");
      $(".modal-pad", box).innerHTML = `<span class="label">C'est fait</span><h2>Ton code : <span class="mono code-big">${esc(w.code)}</span></h2><p class="muted" style="margin:0">−${w.percent} % sur ta première commande (hors articles soldés).</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="useCode">Appliquer à mon panier</button><button class="btn btn-ghost" data-close>Continuer</button></div>`;
      $("#useCode", box).addEventListener("click", () => { applyCode(w.code); closeModal(); });
    });
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

  const reassureBar = () => `<div class="reassure-bar"><div class="container">
    <span>Livraison rapide · ${esc(S().shipDelay || "48 h")}</span><span>Paiement sécurisé</span><span>Retours faciles · ${S().returnDays || 30} jours</span><span>Logo brodé inclus</span><span>Support : ${esc(S().contactEmail || "")}</span>
  </div></div>`;

  function pageHome() {
    const s = S(), st = DATA.story || {};
    const best = DATA.products.filter((p) => p.bestseller);
    const news = DATA.products.filter((p) => p.isNew);
    const Z = DATA.zones;
    const tick = [`<b>SKX</b> pensé en ${esc(s.founded || "2014")}`, ...ZONE_IDS.map((u) => `<b>${esc(Z[u].name)}</b> ${esc(Z[u].metric)}`), `<b>XS → 3XL</b> Homme, Femme, Enfants`, `<b>${esc(s.slogan || "")}</b>`];
    const custom = DATA.products.find((p) => p.customizable && p.type === "hoodie") || DATA.products.find((p) => p.customizable);
    const revs = reviewsFor().slice(0, 3);
    app.innerHTML = `
      <section class="hero-mt">
        ${sceneDiv("home", 1)}
        <div class="container hero-mt-inner">
          <span class="label hero-alt">Alt. 0 m → 4 808 m · depuis ${esc(s.founded || "2014")}</span>
          <img class="hero-logo" src="assets/logo-skx.png" alt="${esc(s.shopName)}">
          <p class="hero-claim">${esc(s.slogan)}</p>
          <p class="hero-sub">${esc(s.heroText || "")}</p>
          <div class="hero-cta">
            <a class="btn" href="#/nouveautes">Voir les nouveautés</a>
            <a class="btn btn-ghost hero-ghost" href="#/homme">Homme</a><a class="btn btn-ghost hero-ghost" href="#/femme">Femme</a><a class="btn btn-ghost hero-ghost" href="#/enfants">Enfants</a>
          </div>
        </div>
      </section>
      ${reassureBar()}
      <section class="section"><div class="container">
        <div class="section-head"><div><span class="label">Ce qui part le plus</span><h2>Meilleures ventes</h2></div><a class="btn btn-ghost btn-sm" href="#/meilleures-ventes">Tout voir</a></div>
        ${grid((best.length ? best : DATA.products).slice(0, 4))}
      </div></section>
      ${news.length ? `<section class="section" style="padding-top:0"><div class="container">
        <div class="section-head"><div><span class="label">Nouveautés</span><h2>Derniers drops</h2></div><a class="btn btn-ghost btn-sm" href="#/nouveautes">Voir les nouveautés</a></div>
        ${grid(news.slice(0, 4))}
      </div></section>` : ""}
      <section class="section" style="padding-top:0"><div class="container">
        <div class="section-head"><div><span class="label">Collections</span><h2>Cinq zones</h2><p>Du camp de base au sommet : chaque collection est une étape de la montagne SKX.</p></div></div>
        <div class="zones">${ZONE_IDS.map((u, i) => zoneCard(u, i === 0)).join("")}</div>
      </div></section>
      ${DATA.superfit?.name ? `<section class="section" style="padding-top:0"><div class="container"><a class="sf-teaser" href="#/superfit">
        <div class="sf-teaser-img"><img src="${esc((DATA.superfit.images || [])[0] || "")}" alt="" loading="lazy"></div>
        <div style="display:grid;gap:12px;align-content:center"><span class="label">Projet de recherche · gamme Sport</span><h2 class="teaser-title">${esc(DATA.superfit.name)}</h2><p class="muted" style="margin:0">${esc(DATA.superfit.tagline)} Moins de 60 g, fibres végétales, texture inspirée du requin mako.</p><span class="go label">Découvrir le projet →</span></div>
      </a></div></section>` : ""}
      ${(DATA.packs || []).length ? `<section class="section" style="padding-top:0"><div class="container">
        <div class="section-head"><div><span class="label">Packs</span><h2>La tenue complète</h2><p>Prends le pack, la remise s'applique toute seule dans le panier.</p></div></div>
        <div class="packs">${DATA.packs.map(packCard).join("")}</div>
      </div></section>` : ""}
      <div class="ticker" aria-hidden="true"><div class="ticker-track">${[...tick, ...tick].map((t) => `<span>${t}</span>`).join("")}</div></div>
      <section class="section"><div class="container split">
        <div style="display:grid;gap:16px;align-content:start"><span class="label">Notre histoire</span><h2 class="teaser-title">${esc(st.title || "")}</h2><p class="muted" style="margin:0;max-width:56ch">${esc(st.history || "")}</p>
          <div><a class="btn btn-ghost btn-sm" href="#/histoire">Découvrir notre histoire</a></div></div>
        <div class="team-strip">${DATA.people.slice(0, 3).map((m) => `<a href="#/lequipe" class="team-mini"><span class="team-av">${avatarSVG(m)}</span><b>${esc(m.name)}</b><span class="label">${esc(m.title)}</span></a>`).join("")}
          <a class="link label" href="#/lequipe" style="grid-column:1/-1">Rencontrer l'équipe →</a></div>
      </div></section>
      ${custom ? `<section class="section" style="padding-top:0"><div class="container split perso-block">
        <div class="perso-prev">${productSVG(custom, { color: "#18191b", design: "gothique" })}${TO().enabled ? backSVG(custom, "#18191b", "14", "SKX") : ""}</div>
        <div style="display:grid;gap:16px;align-content:center"><span class="label">Personnalisation</span><h2 class="teaser-title">Ton maillot, à ta façon.</h2>
          <p class="muted" style="margin:0">Chaque maillot est pensé avec précision. Le logo est brodé en bas à gauche pour une finition durable et élégante. Selon le modèle, il est aussi présent dans le col ou sur l'étiquette.</p>
          <ul class="benefits">${(DATA.designs || []).filter((d) => d.enabled && +d.price).slice(0, 1).map((d) => `<li>Dessin au choix · dès +${money(d.price)}</li>`).join("")}${TO().enabled ? `<li>Ajoute ton numéro · +${money(TO().numberPrice)}</li><li>Ajoute ton prénom · +${money(TO().namePrice)}</li><li>Pack personnalisation complète · ${money(TO().packPrice)}</li>` : ""}</ul>
          <div><button class="btn" data-product="${esc(custom.id)}">Personnaliser mon maillot</button></div></div>
      </div></section>` : ""}
      <section class="section" style="padding-top:0"><div class="container">
        <div class="section-head"><div><span class="label">Avis clients</span><h2>Ils portent déjà nos pièces</h2></div><button class="btn btn-ghost btn-sm" data-review="">Donner mon avis</button></div>
        ${revs.length ? `<div class="reviews">${revs.map(reviewHTML).join("")}</div>` : `<div class="empty">Les premiers avis arrivent. Tu as une pièce SKX ? Raconte-nous.</div>`}
      </div></section>
      ${seen().length >= 2 ? `<section class="section" style="padding-top:0"><div class="container">
        <div class="section-head"><div><h2>Vus récemment</h2><p>Reprends là où tu t'es arrêté.</p></div></div>
        ${grid(seen().slice(0, 4).map(productById))}
      </div></section>` : ""}
      <section class="section" style="padding-top:0"><div class="container split">
        <div style="display:grid;gap:16px;align-content:start"><span class="label">Besoin d'aide ?</span><h2 class="teaser-title">Tailles, livraison, retours : tout est dans le guide.</h2>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-ghost btn-sm" href="#/guide">Consulter le guide</a><a class="btn btn-ghost btn-sm" href="#/contact">Nous contacter</a></div></div>
        <div>${faqHTML(DATA.faq.slice(0, 5))}</div>
      </div></section>
      <section class="section" style="padding-top:0"><div class="container perks">
        <div class="perk"><b>Personnalise</b><span>coloris, dessin, numéro, prénom</span></div>
        <div class="perk"><b>Du XS au 3XL</b><span>Homme, Femme, Enfants</span></div>
        <div class="perk"><b>Livraison offerte</b><span>dès ${money(s.freeShippingFrom)} d'achat</span></div>
        <div class="perk"><b>Retours ${s.returnDays || 30} jours</b><span><a class="link" href="#/guide">voir le guide</a></span></div>
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
        ${id === "sport" && DATA.superfit?.name ? `<a class="sf-banner" href="#/superfit"><span class="label">En développement</span><b>${esc(DATA.superfit.name)}</b><span class="muted">Le maillot de moins de 60 g en fibres végétales. Découvre le projet →</span></a>` : ""}
        <div id="zoneShop"></div>
        <div class="u-switch"><span class="label" style="align-self:center;margin-right:8px">Autres zones</span>${ZONE_IDS.filter((x) => x !== id).map((x) => `<a class="chip" href="#/zone/${x}"><span class="sw sw-${x}"></span>${esc(DATA.zones[x].name)}</a>`).join("")}</div>
      </div></section>`;
    mountScenes();
    shopView($("#zoneShop"), { zone: id });
  }

  /* ---------- Boutique ---------- */
  const SECTIONS = [["all", "Tout"], ["new", "Nouveautés"], ["best", "Meilleures ventes"], ["promo", "Promotions"], ["hauts", "Hauts"], ["bas", "Bas"], ["acc", "Accessoires"], ["limited", "Éditions limitées"], ["packs", "Packs"]];
  const inSection = (p, sec) => ({
    all: true, new: p.isNew, best: p.bestseller, promo: !!priceInfo(p).was, hauts: ["maillot", "tshirt", "hoodie", "veste"].includes(p.type),
    bas: p.type === "pantalon", acc: ["casquette", "bonnet"].includes(p.type) || p.zone === "accessoires", limited: p.zone === "premiere"
  })[sec];
  const shopState = { sec: "all", g: "all", u: "all", size: "", color: "", max: 0, stock: false, q: "", sort: "default" };
  function pageShop(gender, sec) {
    shopState.g = gender || "all";
    shopState.sec = sec || "all";
    const title = gender ? GENDERS[gender] : sec ? SECTIONS.find((x) => x[0] === sec)?.[1] : "Boutique";
    app.innerHTML = `<section class="section"><div class="container">
      <div class="section-head"><div><h2>${esc(title)}</h2><p>Du XS au 3XL, cinq collections.</p></div></div>
      <div id="shop"></div>
    </div></section>`;
    shopView($("#shop"), {});
  }
  function shopView(el, fixed) {
    const st = fixed.zone ? Object.assign({}, shopState, { u: fixed.zone, sec: "all", q: "" }) : shopState;
    const colorNames = [...new Set(DATA.products.flatMap((p) => (p.colors || []).map((c) => c.name)))].filter((n) => n !== "Unique").sort((a, b) => a.localeCompare(b));
    const colorHex = (n) => DATA.products.flatMap((p) => p.colors || []).find((c) => c.name === n)?.hex || "#888";
    const maxPrice = Math.ceil(Math.max(...DATA.products.map((p) => priceInfo(p).now), 10) / 10) * 10;
    if (!st.max) st.max = maxPrice;
    el.innerHTML = `${fixed.zone ? "" : `<div class="sections">${SECTIONS.map(([k, v]) => `<button class="sec" data-sec="${k}">${v}</button>`).join("")}</div>`}
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Genre">${[["all", "Tous"], ["homme", "Homme"], ["femme", "Femme"], ["enfant", "Enfants"]].map(([k, v]) => `<button class="chip" data-g="${k}">${v}</button>`).join("")}</div>
        ${fixed.zone ? "" : `<div class="seg" role="group" aria-label="Collection"><button class="chip" data-u="all">Toutes collections</button>${ZONE_IDS.map((u) => `<button class="chip" data-u="${u}"><span class="sw sw-${u}"></span>${esc(DATA.zones[u].name)}</button>`).join("")}</div>`}
      </div>
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Taille"><button class="chip" data-s="">Toutes tailles</button>${SIZES.map((x) => `<button class="chip" data-s="${x}">${x}</button>`).join("")}</div>
      </div>
      <div class="toolbar">
        <select id="shopColor" aria-label="Couleur"><option value="">Toutes couleurs</option>${colorNames.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join("")}</select>
        <label class="price-range"><span class="label">Prix max</span><input type="range" id="shopMax" min="10" max="${maxPrice}" step="5" value="${Math.min(st.max, maxPrice)}"><b class="mono" id="shopMaxVal"></b></label>
        <label class="check"><input type="checkbox" id="shopStock" ${st.stock ? "checked" : ""}> En stock</label>
        <span class="grow"></span>
        ${fixed.zone ? "" : `<input type="search" id="shopQ" placeholder="Rechercher" value="${esc(st.q)}" aria-label="Rechercher">`}
        <select id="shopSort" aria-label="Trier"><option value="default">Pertinence</option><option value="best">Meilleures ventes</option><option value="new">Nouveautés</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option><option value="name">Nom</option></select>
      </div>
      <div class="shop-grid"></div>`;
    $("#shopSort", el).value = st.sort;
    $("#shopColor", el).value = st.color;
    const render = () => {
      $$("[data-sec]", el).forEach((c) => c.classList.toggle("active", c.dataset.sec === st.sec));
      $$("[data-g]", el).forEach((c) => c.classList.toggle("active", c.dataset.g === st.g));
      $$("[data-u]", el).forEach((c) => c.classList.toggle("active", c.dataset.u === st.u));
      $$("[data-s]", el).forEach((c) => c.classList.toggle("active", c.dataset.s === st.size));
      $("#shopMaxVal", el).textContent = money(st.max);
      if (st.sec === "packs") { $(".shop-grid", el).innerHTML = (DATA.packs || []).length ? `<div class="packs">${DATA.packs.map(packCard).join("")}</div>` : `<div class="empty">Aucun pack pour le moment.</div>`; return; }
      const q = (st.q || "").trim().toLowerCase();
      const list = DATA.products.filter((p) => inSection(p, st.sec) && (st.u === "all" || p.zone === st.u) &&
        (st.g === "all" || p.gender === st.g || (p.gender === "mixte" && st.g !== "enfant")) &&
        (!st.size || (p.sizes || []).includes(st.size) || (p.sizes || []).includes("Unique")) &&
        (!st.color || (p.colors || []).some((c) => c.name === st.color)) &&
        priceInfo(p).now <= st.max && (!st.stock || (+p.stock || 0) > 0) &&
        (!q || (p.name + " " + p.description + " " + (TYPES[p.type] || "")).toLowerCase().includes(q)));
      if (st.sort === "best") list.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
      if (st.sort === "new") list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      if (st.sort === "asc") list.sort((a, b) => priceInfo(a).now - priceInfo(b).now);
      if (st.sort === "desc") list.sort((a, b) => priceInfo(b).now - priceInfo(a).now);
      if (st.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
      $(".shop-grid", el).innerHTML = `<p class="label" style="margin:0 0 16px">${list.length} pièce${list.length > 1 ? "s" : ""}</p>` + grid(list);
    };
    const sync = () => { if (!fixed.zone) Object.assign(shopState, st); else Object.assign(shopState, { g: st.g, size: st.size, color: st.color, max: st.max, stock: st.stock, sort: st.sort }); };
    el.addEventListener("click", (e) => {
      const sc = e.target.closest("[data-sec]"); if (sc) { st.sec = sc.dataset.sec; sync(); render(); return; }
      const c = e.target.closest(".chip"); if (!c || c.dataset.product) return;
      if (c.dataset.g) st.g = c.dataset.g;
      if (c.dataset.u) st.u = c.dataset.u;
      if (c.dataset.s !== undefined) st.size = c.dataset.s;
      sync(); render();
    });
    $("#shopQ", el)?.addEventListener("input", (e) => { st.q = e.target.value; sync(); render(); });
    $("#shopSort", el).addEventListener("change", (e) => { st.sort = e.target.value; sync(); render(); });
    $("#shopColor", el).addEventListener("change", (e) => { st.color = e.target.value; sync(); render(); });
    $("#shopMax", el).addEventListener("input", (e) => { st.max = +e.target.value; sync(); render(); });
    $("#shopStock", el).addEventListener("change", (e) => { st.stock = e.target.checked; sync(); render(); });
    render();
  }

  /* ---------- Projet SKX SuperFit (gamme Sport) ---------- */
  const SF_STATUS = { "Faisable": "ok", "En partie faisable": "mid", "À valider": "mid", "Recherche": "rd", "Provisoire": "rd" };
  function pageSuperfit() {
    const F = DATA.superfit;
    document.body.dataset.zone = "sport";
    app.innerHTML = `
      <section class="u-hero sf-hero">
        ${sceneDiv("sport")}
        <div class="container u-hero-content">
          <div class="u-meta"><span class="label">Gamme Sport · projet de recherche</span><span class="label">Objectif < 60 g</span></div>
          <h1>${esc(F.name)}</h1>
          <div class="tagline">${esc(F.tagline)}</div>
          <p class="desc">${esc(F.intro)}</p>
        </div>
      </section>
      <section class="section" style="padding-top:32px"><div class="container">
        <div class="sf-kpis">
          <div><b>40 g</b><span class="label">objectif de poids</span></div>
          <div><b>3</b><span class="label">gains visés : endurance, récupération, aéro</span></div>
          <div><b>100 %</b><span class="label">fibres végétales visées</span></div>
          <div><b>0</b><span class="label">déchet en fin de vie</span></div>
        </div>
      </div></section>
      <section class="section" style="padding-top:0"><div class="container">
        <div class="section-head"><div><span class="label">Cahier des charges</span><h2>Ce qu'on vise</h2><p>Chaque objectif avec son niveau de faisabilité aujourd'hui. On avance étape par étape, sans promettre ce qu'on n'a pas encore testé.</p></div></div>
        <div class="sf-grid">${F.targets.map((t) => `<article class="sf-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><span class="label">${esc(t.label)}</span><span class="sf-status sf-${SF_STATUS[t.status] || "mid"}">${esc(t.status)}</span></div><h3>${esc(t.value)}</h3><p>${esc(t.note)}</p></article>`).join("")}</div>
      </div></section>
      <section class="section" style="padding-top:0"><div class="container">
        <div class="section-head"><div><span class="label">Inspiration</span><h2>Le requin et la loutre</h2><p>La peau du requin mako est couverte de micro-écailles qui réduisent les turbulences. La fourrure de la loutre piège une fine couche d'air qui isole sans peser. SuperFit veut reproduire les deux en maille végétale.</p></div></div>
        <div class="sf-skin" aria-hidden="true"><svg viewBox="0 0 600 120" preserveAspectRatio="none"><defs><pattern id="denticle" width="24" height="16" patternUnits="userSpaceOnUse" patternTransform="skewX(-18)"><path d="M2 14 Q6 2 12 1 Q18 2 22 14 Z" fill="none" stroke="currentColor" stroke-width="1"/><path d="M8 13 L9 5 M12 13 V3 M16 13 L15 5" stroke="currentColor" stroke-width=".6"/></pattern></defs><rect width="600" height="120" fill="url(#denticle)"/></svg></div>
      </div></section>
      <section class="section" style="padding-top:0"><div class="container">
        <div class="section-head"><div><span class="label">Premières maquettes</span><h2>La base : le maillot bicolore</h2><p>Coupe raglan, coutures plates apparentes, logo brodé en bas à gauche. Disponible dès maintenant en version streetwear.</p></div><button class="btn btn-ghost btn-sm" data-product="p-bicolore">Voir le Maillot Bicolore</button></div>
        <div class="sf-gallery">${(F.images || []).map((src) => `<figure><img src="${esc(src)}" alt="Maquette maillot SKX" loading="lazy"></figure>`).join("")}</div>
        <p class="label" style="margin-top:10px">Visuels de maquette générés par IA, non contractuels.</p>
      </div></section>
      <section class="section" style="padding-top:0"><div class="container split">
        <div><span class="label">Les étapes</span><ol class="sf-steps">${(F.steps || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div>
        <div class="box" style="display:grid;gap:14px;align-content:start"><span class="label">Liste d'attente</span><h3 style="margin:0;font-size:22px">Sois parmi les premiers à le porter.</h3>
          <p class="muted" style="margin:0">Laisse ton e-mail : on te prévient à chaque prototype, et tu auras accès à la première série en avant-première.</p>
          <form id="sfForm" style="display:flex;gap:8px;flex-wrap:wrap"><input class="input" id="sfEmail" type="email" required placeholder="ton@email.fr" style="flex:1;min-width:200px"><select class="input" id="sfSport" aria-label="Ton sport"><option>Vélo</option><option>Ski</option><option>Course</option><option>Trail</option><option>Autre</option></select><button class="btn">Je m'inscris</button></form></div>
      </div></section>`;
    mountScenes();
    $("#sfForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#sfEmail").value, sport = $("#sfSport").value;
      const list = store.get("skx_superfit", []); list.push({ email, sport, date: today() }); store.set("skx_superfit", list);
      await sendToTeam({ type: "liste SuperFit", email, sport }, "Liste d'attente SKX SuperFit");
      e.target.outerHTML = `<p style="margin:0">C'est noté. On te prévient dès le premier prototype.</p>`;
    });
  }
  function superfitSheetHTML() {
    const F = DATA.superfit;
    return `<div class="sheet">
      <div class="head"><div><span class="label">Cahier des charges · gamme Sport</span><h1>${esc(F.name)}</h1><div class="label" style="margin-top:6px">Version du ${new Date().toLocaleDateString("fr-FR")}</div></div><img src="assets/logo-skx-small.png" alt="SKX"></div>
      <p>${esc(F.intro)}</p>
      <h4>Objectifs</h4>
      <table><thead><tr><th>Critère</th><th>Objectif</th><th>Faisabilité</th><th>Piste technique</th></tr></thead><tbody>${F.targets.map((t) => `<tr><td>${esc(t.label)}</td><td>${esc(t.value)}</td><td>${esc(t.status)}</td><td>${esc(t.note)}</td></tr>`).join("")}</tbody></table>
      <h4>Contraintes SKX</h4><p>Logo brodé en bas à gauche et étiquette dans le col · fibres conformes au cahier des charges matières · fabrication Europe / Méditerranée.</p>
      <h4>Étapes</h4><ol>${(F.steps || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      <h4>Validation</h4><table><tbody><tr><th style="width:150px">Bureau d'études</th><td style="height:50px"></td><th style="width:150px">SKX</th><td></td></tr></tbody></table>
    </div>`;
  }

  function pageWish() {
    const list = wish.map(productById).filter(Boolean);
    app.innerHTML = `<section class="section"><div class="container">
      <div class="section-head"><div><span class="label">Sur cet appareil</span><h2>Ma liste d'envies</h2><p>Garde tes pièces préférées sous la main.</p></div></div>
      ${list.length ? grid(list) : `<div class="empty">Ta liste est vide. Touche le cœur sur une pièce pour l'ajouter.<br><br><a class="btn btn-sm" href="#/boutique">Voir la boutique</a></div>`}
    </div></section>`;
  }

  function pageContact() {
    const s = S();
    app.innerHTML = `<section class="section"><div class="container split">
      <div style="display:grid;gap:16px;align-content:start"><span class="label">Contact</span><h2 class="teaser-title">Une question, une commande, une idée ?</h2>
        <p class="muted" style="margin:0">L'équipe SKX te répond rapidement.</p>
        <p style="margin:0"><a class="link" href="mailto:${esc(s.contactEmail)}">${esc(s.contactEmail)}</a></p>
        <div>${faqHTML(DATA.faq.slice(0, 4))}</div></div>
      <form class="form box" id="contactForm">
        <div class="row"><label><span>Nom</span><input id="ct-name" name="name" required></label><label><span>Email</span><input id="ct-email" type="email" name="email" required></label></div>
        <label><span>Sujet</span><select id="ct-subject" name="subject"><option>Commande</option><option>Taille / produit</option><option>Personnalisation</option><option>Retour / échange</option><option>Partenariat</option><option>Autre</option></select></label>
        <label><span>Message</span><textarea id="ct-msg" name="message" required style="min-height:140px"></textarea></label>
        <button class="btn">Envoyer</button>
      </form>
    </div></section>`;
    $("#contactForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const ok = await sendToTeam({ type: "contact", ...f }, `Contact : ${f.subject}`);
      e.target.innerHTML = ok ? `<h3>Message envoyé.</h3><p class="muted">Merci ${esc(f.name)}, on te répond par email.</p>` : `<h3>Dernière étape</h3><p class="muted">Envoie ton message avec ta messagerie :</p><a class="btn" href="${esc(mailtoTeam(`${f.subject} — ${f.name}`, f.message + "\n\n" + f.name + " · " + f.email))}">Envoyer par email</a>`;
    });
  }

  function pageLegal(kind) {
    const s = S(), L = s.legal || {};
    const v = (x, ph) => x ? esc(x) : `<mark>[${ph} à compléter]</mark>`;
    const pages = {
      mentions: ["Mentions légales", `
        <h2>Éditeur du site</h2><p>${v(L.company, "Raison sociale")} — ${v(L.form, "Forme juridique et capital")}<br>${v(L.address, "Adresse du siège")}<br>SIRET : ${v(L.siret, "SIRET")}<br>Directeur de la publication : ${v(L.director, "Nom")}<br>Contact : ${esc(s.contactEmail)}</p>
        <h2>Hébergement</h2><p>${v(L.host, "Hébergeur")}</p>
        <h2>Propriété intellectuelle</h2><p>Le nom SKX, le logo, les visuels et les textes du site sont protégés. Toute reproduction sans autorisation est interdite.</p>`],
      cgv: ["Conditions générales de vente", `
        <h2>1. Objet</h2><p>Les présentes conditions régissent les ventes de vêtements et accessoires SKX conclues sur ce site entre ${v(L.company, "Raison sociale")} et tout client consommateur.</p>
        <h2>2. Prix</h2><p>Les prix sont indiqués en euros, toutes taxes comprises, hors frais de livraison. Les frais de livraison (${money(s.shippingPrice)}, offerts dès ${money(s.freeShippingFrom)}) sont indiqués avant la validation de la commande.</p>
        <h2>3. Commande et paiement</h2><p>La commande est validée après acceptation des présentes conditions et paiement. Les moyens de paiement acceptés sont : ${esc(s.paymentMethods || "carte bancaire")}.</p>
        <h2>4. Promotions et codes</h2><p>Les codes promo ne sont pas cumulables sauf mention contraire. Les offres sont valables selon les dates indiquées et dans la limite des stocks disponibles.</p>
        <h2>5. Livraison</h2><p>Les commandes sont expédiées sous ${esc(s.shipDelay || "48 h")}. Un numéro de suivi est envoyé par e-mail dès l'expédition.</p>
        <h2>6. Droit de rétractation et retours</h2><p>Le client dispose de 14 jours à compter de la réception pour exercer son droit de rétractation. SKX prolonge ce délai à ${s.returnDays || 30} jours. Les articles doivent être non portés, non lavés et avec leurs étiquettes. Les articles personnalisés (dessin, numéro, prénom) sont exclus du droit de rétractation, sauf défaut.</p>
        <h2>7. Garanties</h2><p>Les produits bénéficient de la garantie légale de conformité et de la garantie des vices cachés.</p>
        <h2>8. Médiation</h2><p>En cas de litige, le client peut recourir gratuitement au médiateur de la consommation : ${v(L.mediator, "Nom et coordonnées du médiateur")}.</p>`],
      confidentialite: ["Politique de confidentialité", `
        <h2>Données collectées</h2><p>Lors d'une commande, d'un message ou d'une inscription, nous collectons : nom, prénom, adresse, e-mail et téléphone. Ces données servent uniquement à traiter ta commande et à te répondre.</p>
        <h2>Stockage sur ton appareil</h2><p>Le site enregistre sur ton navigateur ton panier, ta liste d'envies, tes préférences radio et les pièces consultées. Rien de cela n'est envoyé ailleurs.</p>
        <h2>Tes droits</h2><p>Tu peux demander l'accès, la rectification ou la suppression de tes données à ${esc(s.contactEmail)}.</p>
        <h2>Responsable du traitement</h2><p>${v(L.company, "Raison sociale")}, ${v(L.address, "Adresse")}.</p>`]
    };
    const [title, body] = pages[kind];
    app.innerHTML = `<section class="section"><div class="container prose">
      <div class="section-head" style="margin-bottom:0"><div><span class="label">Informations légales</span><h2 style="margin:0">${title}</h2></div></div>
      ${/<mark>/.test(body) ? `<div class="notice">Les champs surlignés sont à compléter dans l'espace équipe (Réglages → Informations légales). Fais relire ces textes par un professionnel avant l'ouverture.</div>` : ""}
      ${body}
    </div></section>`;
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
    const st = DATA.story || {};
    app.insertAdjacentHTML("afterbegin", `<section class="section story-intro"><div class="container">
      <span class="label">Notre histoire</span><h1 class="story-title">${esc(st.title || "")}</h1>
      <p class="story-lead">${esc(st.history || "")}</p></div></section>`);
    app.insertAdjacentHTML("beforeend", `
      <section class="section"><div class="container story-grid">
        <div><span class="label">Nos valeurs</span><p class="story-p">${esc(st.values || "")}</p></div>
        <div><span class="label">Notre mission</span><p class="story-p">${esc(st.mission || "")}</p></div>
      </div></section>
      <section class="section" style="padding-top:0"><div class="container">
        <div class="section-head"><div><span class="label">L'équipe</span><h2>Qui porte SKX</h2><p>${esc(st.team || "")}</p></div><a class="btn btn-ghost btn-sm" href="#/lequipe">Toute l'équipe</a></div>
        <div class="team-strip wide">${DATA.people.map((m) => `<a href="#/lequipe" class="team-mini"><span class="team-av">${avatarSVG(m)}</span><b>${esc(m.name)}</b><span class="label">${esc(m.title)}</span></a>`).join("")}</div>
      </div></section>
      <section class="section" style="padding-top:0"><div class="container story-grid">
        <div><span class="label">Qualité</span><p class="story-p">${esc(st.quality || "")}</p></div>
        <div><span class="label">Nos engagements</span><ul class="benefits">${(st.commitments || []).map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>
      </div></section>
      <section class="section" style="padding-top:0"><div class="container">
        <div class="section-head"><div><span class="label">Besoin d'aide ?</span><h2>Infos pratiques</h2></div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${[["#/guide", "Guide des tailles"], ["#/guide", "Livraison et retours"], ["#/guide", "Entretien des produits"], ["#/guide", "FAQ"], ["#/contact", "Contact"]].map(([h, t]) => `<a class="btn btn-ghost btn-sm" href="${h}">${t}</a>`).join("")}</div>
      </div></section>`);
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
  const AV_FACIAL = { aucune: "Aucune", barbe: "Barbe", courte: "Barbe courte", moustache: "Moustache", bouc: "Bouc" };
  const AV_ACC = { aucun: "Aucun", lunettes: "Lunettes", casquette: "Casquette", bonnet: "Bonnet", casque: "Casque audio" };
  const AV_BG = { streetwear: ["#05070a", "#1e2830", "#5c6874"], sport: ["#0a1219", "#24394a", "#7d98a8"], premiere: ["#0b0704", "#3a2410", "#b9823d"], accessoires: ["#0c0d0e", "#25282b", "#6d7277"], cool: ["#0d0809", "#3a2026", "#a35a45"] };
  function avatarSVG(m) {
    const a = m.avatar || {};
    const [b0, b1, b2] = AV_BG[a.bg] || AV_BG.streetwear;
    const skin = a.skin || "#cbc3b4", hc = a.hairColor || "#1b1a19", top = a.top || "#1c1f22", cap = a.cap || "#141414";
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
      bouc: `<path d="M92 136 Q100 152 108 136 Q100 140 92 136 Z" fill="${hc}"/>`,
      courte: `<path d="M67 112 Q68 152 100 156 Q132 152 133 112 Q128 132 116 138 Q100 144 84 138 Q72 132 67 112 Z" fill="${hc}" opacity=".45"/><path d="M88 129 Q100 124 112 129" fill="none" stroke="${hc}" stroke-width="3" opacity=".6" stroke-linecap="round"/>`
    }[a.facial] || "";
    const acc = {
      lunettes: `<g fill="rgba(255,255,255,.08)" stroke="#111" stroke-width="2.4"><rect x="74" y="104" width="22" height="15" rx="4"/><rect x="104" y="104" width="22" height="15" rx="4"/><path d="M96 110 H104 M74 109 L66 106 M126 109 L134 106" fill="none"/></g>`,
      casquette: `<path d="M64 98 Q64 60 100 58 Q136 60 136 98 Z" fill="${cap}"/><path d="M56 96 Q100 88 146 96 Q150 106 138 108 Q100 100 62 108 Q52 106 56 96 Z" fill="${cap}" stroke="rgba(255,255,255,.18)"/><rect x="82" y="99" width="36" height="5" rx="2.5" fill="rgba(255,255,255,.15)"/><text x="100" y="88" text-anchor="middle" font-family="Pirata One, serif" font-size="16" fill="#eee">SKX</text>`,
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
        <div class="person-photo">${avatarSVG(m)}</div>
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
      <nav class="guide-toc">${[["livraison", "Livraison"], ["retours", "Retours"], ["tailles", "Tailles"], ["perso", "Personnalisation"], ["promos", "Soldes et codes"], ["marquage", "Marquage SKX"], ["entretien", "Entretien"], ["faq", "FAQ"]].map(([k, v]) => `<a class="chip" href="#g-${k}" data-anchor="g-${k}">${v}</a>`).join("")}</nav>
      <h2 id="g-livraison">Livraison</h2>
      <p>Nous préparons tes commandes avec soin. Les commandes sont expédiées sous ${esc(s.shipDelay || "48 h")}. Un numéro de suivi t'est envoyé par e-mail dès l'expédition.</p>
      <p>Livraison en France métropolitaine à ${money(s.shippingPrice)}, offerte dès ${money(s.freeShippingFrom)} d'achat.</p>
      <h2 id="g-retours">Retours</h2>
      <p>Tu disposes de ${s.returnDays || 30} jours après réception pour changer d'avis. Les articles doivent être non portés, non lavés et avec leurs étiquettes. Échange ou remboursement, au choix. Les pièces personnalisées (motif ajouté) ne sont ni reprises ni échangées, sauf défaut.${s.contactEmail ? ` Écris-nous à <a class="link" href="mailto:${esc(s.contactEmail)}">${esc(s.contactEmail)}</a>.` : ""}</p>
      <h2 id="g-tailles">Guide des tailles</h2>
      <p>Homme, Femme et Enfants : du XS au 3XL.</p>
      <div class="table-wrap"><table class="table"><thead><tr><th>Taille</th><th class="num">Poitrine (cm)</th><th class="num">Taille (cm)</th><th class="num">Longueur (cm)</th></tr></thead><tbody>
        ${[["XS", "86–90", "72–76", 66], ["S", "90–96", "76–82", 69], ["M", "96–102", "82–88", 72], ["L", "102–108", "88–94", 74], ["XL", "108–116", "94–102", 76], ["2XL", "116–124", "102–110", 78], ["3XL", "124–132", "110–118", 80]].map((r) => `<tr><td class="mono">${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[3]}</td></tr>`).join("")}
      </tbody></table></div>
      <p>Les coupes SKX sont amples. Entre deux tailles ? Prends la taille au-dessus pour plus de confort. Le conseil de coupe de chaque pièce est indiqué sur sa fiche.</p>
      <h2 id="g-perso">Personnalisation</h2>
      <p>Sur les pièces personnalisables, choisis ton coloris, ajoute ton numéro (+${money(TO().numberPrice)}), ton prénom (+${money(TO().namePrice)}) ou le pack complet (${money(TO().packPrice)}), et un dessin : ${(DATA.designs || []).filter((d) => d.enabled && d.id !== "none").map((d) => `${esc(d.name)} (+${money(d.price)})`).join(", ")}. L'aperçu se met à jour en direct sur la fiche produit.</p>
      <h2 id="g-promos">Soldes et codes promo</h2>
      <p>Soldes d'hiver et d'été sur les fins de stock, jusqu'à −${pr.maxSale} %. Les codes promo s'appliquent aux articles non soldés. Les codes promo ne sont pas cumulables sauf mention contraire : la remise la plus avantageuse est appliquée. Les offres sont valables selon les dates indiquées et dans la limite des stocks disponibles.</p>
      <h2 id="g-marquage">Marquage SKX</h2>
      <p>Chaque pièce porte le logo SKX brodé en bas à gauche, et une étiquette SKX dans le col ou sur l'étiquette intérieure.</p>
      <h2 id="g-entretien">Entretien</h2>
      <p>Lavage à 30 °C à l'envers, pas de sèche-linge pour les molletons, séchage à plat pour les mailles. Le détail est indiqué sur chaque fiche produit.</p>
      <h2 id="g-faq">FAQ</h2>
      ${faqHTML(DATA.faq)}
      <h2>Contact</h2>
      <p>Une autre question ? <a class="link" href="#/contact">Écris-nous</a> ou envoie un e-mail à <a class="link" href="mailto:${esc(s.contactEmail)}">${esc(s.contactEmail)}</a>.</p>
    </div></section>`;
    $(".guide-toc", app).addEventListener("click", (e) => { const a = e.target.closest("[data-anchor]"); if (!a) return; e.preventDefault(); document.getElementById(a.dataset.anchor)?.scrollIntoView({ behavior: "smooth" }); });
  }

  function pageSoldes() {
    const sales = activeSales();
    const last = DATA.products.filter((p) => (+p.stock || 0) > 0 && (+p.stock || 0) <= 3);
    app.innerHTML = `<section class="section"><div class="container">
      <div class="section-head"><div><span class="label">Promotions</span><h2>Soldes</h2><p>Fins de stock, jusqu'à −${P().maxSale} %. Offres valables selon les dates indiquées et dans la limite des stocks disponibles.</p></div></div>
      ${sales.length ? sales.map((x) => { const list = DATA.products.filter((p) => (x.productIds || []).includes(p.id)); const d = Math.max(0, Math.ceil((new Date(x.end + "T23:59:59") - new Date()) / 864e5)); return `<div class="sale-group"><div class="section-head" style="margin-bottom:20px"><div><h3 class="sale-title">${esc(x.name)}</h3><p class="label">−${Math.min(+x.percent, P().maxSale)} % · se termine dans ${d} jour${d > 1 ? "s" : ""}</p></div></div>${grid(list)}</div>`; }).join("") : `<div class="empty">Pas de soldes en ce moment. Reviens bientôt.</div>`}
      ${last.length ? `<div class="sale-group"><div class="section-head" style="margin-bottom:20px"><div><h3 class="sale-title">Dernières tailles</h3><p class="label">3 pièces ou moins</p></div></div>${grid(last)}</div>` : ""}
    </div></section>`;
  }

  function pageNotFound() {
    app.innerHTML = `<section class="section"><div class="container empty"><h2 style="font-family:var(--gothic);font-weight:400;font-size:72px;margin:0">404</h2><p>Cette page s'est perdue dans le brouillard.</p><a class="btn" href="#/">Retour à l'accueil</a></div></section>`;
  }

  /* ================= ESPACE CLIENT ================= */
  // Deux modes : Supabase (vrais comptes, synchronisés sur tous les appareils) quand l'URL et la clé
  // sont réglées dans l'espace équipe ; sinon comptes enregistrés sur cet appareil uniquement.
  const Accounts = (() => {
    let sb = null, user = null, profile = null, ready = null;
    const cloud = () => !!(S().supabaseUrl && S().supabaseKey);
    const loadSDK = () => new Promise((res, rej) => {
      if (window.supabase) return res();
      const sc = document.createElement("script");
      sc.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
      sc.onload = res; sc.onerror = () => rej(new Error("Service de comptes injoignable."));
      document.head.appendChild(sc);
    });
    const blank = () => ({ firstName: "", lastName: "", phone: "", address: "", zip: "", city: "", cart: [], wishlist: [] });
    // --- mode appareil ---
    const localDB = () => store.get("skx_customers", {});
    const saveLocal = (db) => store.set("skx_customers", db);
    function init() {
      if (ready) return ready;
      ready = (async () => {
        if (cloud()) {
          try {
            await loadSDK();
            sb = window.supabase.createClient(S().supabaseUrl, S().supabaseKey, { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true } });
            const { data } = await sb.auth.getSession();
            if (data.session) { user = { id: data.session.user.id, email: data.session.user.email, meta: data.session.user.user_metadata || {} }; await loadProfile(); }
            // retour de la connexion Google : on nettoie l'adresse et on ouvre l'espace client
            if (/[?&]code=/.test(location.search)) history.replaceState(null, "", location.pathname + (session.get("skx_oauth") ? "#/compte" : location.hash));
            if (user && session.get("skx_oauth")) { session.del("skx_oauth"); location.hash = "#/compte"; }
            sb.auth.onAuthStateChange((_e, sess) => { if (!sess) { user = null; profile = null; refreshHeader(); } });
          } catch (e) { console.warn(e); sb = null; }
        } else {
          const em = store.get("skx_customer", null), db = localDB();
          if (em && db[em]) { user = { id: em, email: em }; profile = Object.assign(blank(), db[em].profile); }
        }
        refreshHeader();
      })();
      return ready;
    }
    async function loadProfile() {
      if (sb) {
        const { data } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
        profile = Object.assign(blank(), data ? { firstName: data.first_name || "", lastName: data.last_name || "", phone: data.phone || "", address: data.address || "", zip: data.zip || "", city: data.city || "", cart: data.cart || [], wishlist: data.wishlist || [] } : {});
        if (!data) { const m = user.meta || {}; profile.firstName = m.given_name || (m.full_name || m.name || "").split(" ")[0] || ""; profile.lastName = m.family_name || ""; await saveProfile(profile); }
      }
      mergeOnLogin();
    }
    function mergeOnLogin() {
      // panier et envies : on fusionne ce qui était sur l'appareil avec le compte
      const key = (l) => lineKey(l);
      const merged = [...(profile.cart || [])];
      for (const l of cart) if (!merged.some((m) => key(m) === key(l))) merged.push(l);
      cart = merged.filter((l) => productById(l.id)); store.set("skx_cart", cart);
      wish = [...new Set([...(profile.wishlist || []), ...wish])]; store.set("skx_wish", wish);
      renderCart(); renderWishCount(); push();
    }
    async function saveProfile(p) {
      profile = Object.assign(profile || blank(), p);
      if (sb && user) {
        const { error } = await sb.from("profiles").upsert({ id: user.id, first_name: profile.firstName, last_name: profile.lastName, phone: profile.phone, address: profile.address, zip: profile.zip, city: profile.city, cart: profile.cart, wishlist: profile.wishlist, updated_at: new Date().toISOString() });
        if (error) throw new Error("Enregistrement impossible : " + error.message);
      } else if (user) { const db = localDB(); db[user.email].profile = profile; saveLocal(db); }
      refreshHeader();
    }
    let pushT;
    function push() { if (!user) return; clearTimeout(pushT); pushT = setTimeout(() => saveProfile({ cart, wishlist: wish }).catch(() => {}), 600); }
    async function signup(email, pwd, first) {
      email = email.trim().toLowerCase();
      if (sb) {
        const { data, error } = await sb.auth.signUp({ email, password: pwd, options: { data: { first_name: first } } });
        if (error) throw new Error(trad(error.message));
        if (!data.session) return "confirm";
        user = { id: data.user.id, email }; profile = blank(); profile.firstName = first; await saveProfile(profile); mergeOnLogin(); return "ok";
      }
      const db = localDB();
      if (db[email]) throw new Error("Un compte existe déjà avec cet e-mail.");
      const salt = uid("s");
      db[email] = { salt, hash: await derive(pwd, salt), profile: Object.assign(blank(), { firstName: first }), created: new Date().toISOString() };
      saveLocal(db); store.set("skx_customer", email);
      user = { id: email, email }; profile = db[email].profile; mergeOnLogin(); refreshHeader(); return "ok";
    }
    async function login(email, pwd) {
      email = email.trim().toLowerCase();
      if (sb) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pwd });
        if (error) throw new Error(trad(error.message));
        user = { id: data.user.id, email }; await loadProfile(); refreshHeader(); return;
      }
      const db = localDB(), c = db[email];
      if (!c || !(await verify(pwd, c.salt, c.hash))) throw new Error("E-mail ou mot de passe incorrect.");
      store.set("skx_customer", email); user = { id: email, email }; profile = Object.assign(blank(), c.profile); mergeOnLogin(); refreshHeader();
    }
    async function logout() {
      if (sb) await sb.auth.signOut();
      store.del("skx_customer"); user = null; profile = null;
      cart = []; wish = []; store.set("skx_cart", cart); store.set("skx_wish", wish); renderCart(); renderWishCount(); refreshHeader();
    }
    async function google() {
      if (!sb) throw new Error("La connexion Google sera disponible dès que les comptes en ligne (Supabase) seront activés.");
      session.set("skx_oauth", 1);
      const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
      if (error) { session.del("skx_oauth"); throw new Error(/not enabled/i.test(error.message) ? "La connexion Google n'est pas encore activée dans Supabase." : error.message); }
    }
    async function reset(email) {
      if (!sb) throw new Error("La réinitialisation par e-mail sera disponible quand les comptes en ligne seront activés. Contacte-nous en attendant.");
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + location.pathname + "#/compte" });
      if (error) throw new Error(trad(error.message));
    }
    async function changePassword(pwd) {
      if (sb) { const { error } = await sb.auth.updateUser({ password: pwd }); if (error) throw new Error(trad(error.message)); return; }
      const db = localDB(); db[user.email].salt = uid("s"); db[user.email].hash = await derive(pwd, db[user.email].salt); saveLocal(db);
    }
    async function addOrder(o) {
      if (!user) return;
      if (sb) { await sb.from("orders").insert({ user_id: user.id, ref: o.ref, data: o, total: o.total }); return; }
      const db = localDB(); (db[user.email].orders = db[user.email].orders || []).unshift(o); saveLocal(db);
    }
    async function orders() {
      if (!user) return [];
      if (sb) { const { data } = await sb.from("orders").select("ref,data,total,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }); return (data || []).map((r) => ({ ...r.data, status: r.status })); }
      return localDB()[user.email]?.orders || [];
    }
    const trad = (m) => /Invalid login/i.test(m) ? "E-mail ou mot de passe incorrect." : /already registered/i.test(m) ? "Un compte existe déjà avec cet e-mail." : /Password should/i.test(m) ? "Mot de passe trop court (8 caractères minimum)." : /Email not confirmed/i.test(m) ? "Confirme d'abord ton e-mail (lien reçu par e-mail)." : m;
    function refreshHeader() {
      const n = profile?.firstName || (user ? user.email.split("@")[0] : "");
      $("#accountName").textContent = user ? n : "";
      $("#accountBtn").title = user ? "Mon compte" : "Se connecter";
    }
    return { init, google, cloud: () => !!sb, user: () => user, profile: () => profile, signup, login, logout, reset, saveProfile, push, addOrder, orders, changePassword };
  })();

  let accountTab = "panier";
  async function pageAccount() {
    app.innerHTML = `<section class="section"><div class="container"><p class="muted">Chargement…</p></div></section>`;
    await Accounts.init();
    const u = Accounts.user();
    const modeNote = Accounts.cloud() ? "" : `<p class="label" style="margin:12px 0 0">Compte enregistré sur cet appareil</p>`;
    if (!u) {
      app.innerHTML = `<section class="section"><div class="container account-auth">
        <div class="auth-intro"><span class="label">Espace client</span><h2 class="teaser-title">Ton compte SKX</h2>
          <ul class="benefits"><li>Retrouve ton panier sur tous tes appareils</li><li>Suis tes commandes et ton historique</li><li>Garde ta liste d'envies</li><li>Adresse pré-remplie pour commander plus vite</li><li>Tes codes et offres privées</li></ul></div>
        <div class="box auth-box">
          <div class="tabs" style="margin-bottom:18px"><button class="tab active" data-auth="login">Se connecter</button><button class="tab" data-auth="signup">Créer un compte</button></div>
          ${Accounts.cloud() ? `<button class="btn btn-ghost btn-block google-btn" id="googleBtn" type="button"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z"/></svg>Continuer avec Google</button>
          <div class="or"><span>ou avec ton e-mail</span></div>` : ""}
          <form class="form" id="authForm">
            <label class="only-signup" hidden><span>Prénom</span><input id="au-first" name="first" autocomplete="given-name"></label>
            <label><span>E-mail</span><input id="au-email" name="email" type="email" required autocomplete="email"></label>
            <label><span>Mot de passe</span><input id="au-pwd" name="pwd" type="password" required minlength="8" autocomplete="current-password"></label>
            <button class="btn btn-block" id="authBtn">Se connecter</button>
            <button type="button" class="rm only-login" id="forgot" style="justify-self:start">Mot de passe oublié ?</button>
          </form>${modeNote}
        </div></div></section>`;
      let mode = "login";
      const setMode = (m) => {
        mode = m;
        $$("[data-auth]", app).forEach((b) => b.classList.toggle("active", b.dataset.auth === m));
        $$(".only-signup", app).forEach((x) => { x.hidden = m !== "signup"; });
        $$(".only-login", app).forEach((x) => { x.hidden = m !== "login"; });
        $("#au-first").required = m === "signup";
        $("#au-pwd").autocomplete = m === "signup" ? "new-password" : "current-password";
        $("#authBtn").textContent = m === "signup" ? "Créer mon compte" : "Se connecter";
      };
      $$("[data-auth]", app).forEach((b) => b.addEventListener("click", () => setMode(b.dataset.auth)));
      $("#googleBtn")?.addEventListener("click", async () => { try { await Accounts.google(); } catch (e) { toast(e.message); } });
      $("#forgot").addEventListener("click", async () => {
        const em = $("#au-email").value; if (!em) { toast("Écris d'abord ton e-mail."); return; }
        try { await Accounts.reset(em); toast("Un lien pour changer ton mot de passe t'a été envoyé."); } catch (e) { toast(e.message); }
      });
      $("#authForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = $("#authBtn"); btn.disabled = true;
        const f = Object.fromEntries(new FormData(e.target));
        try {
          if (mode === "signup") {
            const r = await Accounts.signup(f.email, f.pwd, (f.first || "").trim());
            if (r === "confirm") { toast("Compte créé : confirme ton e-mail avec le lien reçu, puis connecte-toi."); setMode("login"); btn.disabled = false; return; }
            toast("Bienvenue chez SKX !");
          } else { await Accounts.login(f.email, f.pwd); toast("Content de te revoir."); }
          pageAccount();
        } catch (err) { toast(err.message); btn.disabled = false; }
      });
      return;
    }
    const p = Accounts.profile() || {};
    const tabs = { panier: "Mon panier", commandes: "Mes commandes", envies: "Mes envies", infos: "Mes infos", codes: "Mes codes" };
    app.innerHTML = `<section class="section"><div class="container">
      <div class="admin-head"><div style="display:grid;gap:8px"><span class="label">Espace client</span><h1>Salut ${esc(p.firstName || "")}</h1><span class="muted">${esc(u.email)}</span>${modeNote}</div>
        <button class="btn btn-ghost btn-sm" id="accLogout">Déconnexion</button></div>
      <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="tab ${k === accountTab ? "active" : ""}" data-at="${k}">${v}</button>`).join("")}</div>
      <div id="accBody"></div></div></section>`;
    $(".tabs", app).addEventListener("click", (e) => { const t = e.target.closest("[data-at]"); if (t) { accountTab = t.dataset.at; pageAccount(); } });
    $("#accLogout").addEventListener("click", async () => { await Accounts.logout(); toast("Tu es déconnecté."); location.hash = "#/"; });
    const body = $("#accBody");
    if (accountTab === "panier") {
      const t = totals();
      body.innerHTML = cart.length ? `<div class="split"><div>${cart.map((l) => { const pr = productById(l.id); return `<div class="line"><div class="line-img">${productVisual(pr, { color: l.colorHex, design: l.design, custom: true })}</div><div style="display:grid;gap:4px"><b style="font-weight:500">${esc(pr.name)}</b><span class="label">Taille ${esc(l.size)}${l.color ? " · " + esc(l.color) : ""} · ×${l.qty}</span></div><span class="price">${money(lineUnit(l) * l.qty)}</span></div>`; }).join("")}</div>
        <div class="box"><div class="totals"><div><span>Sous-total</span><span class="price">${money(t.sub)}</span></div>${t.discount ? `<div class="disc"><span>${esc(t.discountLabel)}</span><span class="price">−${money(t.discount)}</span></div>` : ""}<div><span>Livraison</span><span class="price">${t.ship ? money(t.ship) : "Offerte"}</span></div><div class="total"><span>Total</span><span class="price">${money(t.total)}</span></div></div>
        <div style="display:grid;gap:8px;margin-top:14px"><button class="btn" id="accCheckout">Commander</button><button class="btn btn-ghost" id="accEdit">Modifier le panier</button></div></div></div>`
        : `<div class="empty">Ton panier est vide.<br><br><a class="btn btn-sm" href="#/boutique">Voir la boutique</a></div>`;
      $("#accCheckout")?.addEventListener("click", checkout);
      $("#accEdit")?.addEventListener("click", openCart);
    }
    if (accountTab === "commandes") {
      body.innerHTML = `<p class="muted">Chargement…</p>`;
      const list = await Accounts.orders();
      body.innerHTML = list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Commande</th><th>Date</th><th>Articles</th><th>Statut</th><th class="num">Total</th><th></th></tr></thead><tbody>${list.map((o, i) => `<tr><td class="mono">${esc(o.ref)}</td><td>${new Date(o.date).toLocaleDateString("fr-FR")}</td><td>${o.items.map((it) => `${esc(it.name)} (${esc(it.size)}) ×${it.qty}`).join("<br>")}</td><td><span class="status status-Validé">${esc(o.status || "Reçue")}</span></td><td class="num">${money(o.total)}</td><td><button class="btn btn-ghost btn-sm" data-again="${i}">Racheter</button></td></tr>`).join("")}</tbody></table></div>`
        : `<div class="empty">Pas encore de commande.<br><br><a class="btn btn-sm" href="#/boutique">Découvrir la boutique</a></div>`;
      body.addEventListener("click", (e) => {
        const b = e.target.closest("[data-again]"); if (!b) return;
        const o = list[+b.dataset.again]; let n = 0;
        for (const it of o.items) { const pr = productById(it.id); if (pr && (+pr.stock || 0) > 0) { addToCart({ id: it.id, size: it.size, qty: it.qty, color: it.color || "", colorHex: (pr.colors || []).find((c) => c.name === it.color)?.hex || pr.color, design: (DATA.designs || []).find((d) => d.name === it.design)?.id || "none", number: it.number || "", name: it.flocName || "" }); n++; } }
        toast(n ? "Articles ajoutés au panier." : "Ces articles ne sont plus disponibles."); if (n) openCart();
      });
    }
    if (accountTab === "envies") body.innerHTML = wish.filter((id) => productById(id)).length ? grid(wish.map(productById).filter(Boolean)) : `<div class="empty">Ta liste est vide. Touche le cœur sur une pièce pour l'ajouter.</div>`;
    if (accountTab === "infos") {
      body.innerHTML = `<div class="split"><form class="form box" id="infoForm"><h3>Adresse de livraison</h3>
          <div class="row"><label><span>Prénom</span><input id="ac-first" name="firstName" value="${esc(p.firstName)}" autocomplete="given-name"></label><label><span>Nom</span><input id="ac-last" name="lastName" value="${esc(p.lastName)}" autocomplete="family-name"></label></div>
          <label><span>Téléphone</span><input id="ac-tel" name="phone" value="${esc(p.phone)}" autocomplete="tel"></label>
          <label><span>Adresse</span><input id="ac-addr" name="address" value="${esc(p.address)}" autocomplete="street-address"></label>
          <div class="row"><label><span>Code postal</span><input id="ac-zip" name="zip" value="${esc(p.zip)}" autocomplete="postal-code"></label><label><span>Ville</span><input id="ac-city" name="city" value="${esc(p.city)}" autocomplete="address-level2"></label></div>
          <button class="btn btn-sm" style="justify-self:start">Enregistrer</button></form>
        <form class="form box" id="pwdForm2"><h3>Mot de passe</h3>
          <label><span>Nouveau mot de passe</span><input id="ac-p1" type="password" minlength="8" required autocomplete="new-password"></label>
          <label><span>Confirmer</span><input id="ac-p2" type="password" minlength="8" required autocomplete="new-password"></label>
          <button class="btn btn-ghost btn-sm" style="justify-self:start">Changer</button>
          <p class="label" style="margin:10px 0 0">Pour supprimer ton compte et tes données, écris à ${esc(S().contactEmail)}.</p></form></div>`;
      $("#infoForm").addEventListener("submit", async (e) => { e.preventDefault(); try { await Accounts.saveProfile(Object.fromEntries(new FormData(e.target))); toast("Infos enregistrées."); } catch (err) { toast(err.message); } });
      $("#pwdForm2").addEventListener("submit", async (e) => { e.preventDefault(); if ($("#ac-p1").value !== $("#ac-p2").value) { toast("Les deux mots de passe sont différents."); return; } try { await Accounts.changePassword($("#ac-p1").value); toast("Mot de passe changé."); e.target.reset(); } catch (err) { toast(err.message); } });
    }
    if (accountTab === "codes") {
      const w = S().welcome;
      body.innerHTML = `<div class="reviews">${w && w.enabled ? `<div class="box"><span class="label">Bienvenue</span><h3 class="mono" style="margin:8px 0">${esc(w.code)}</h3><p class="muted" style="margin:0 0 12px">−${w.percent} % sur ta première commande, hors articles soldés.</p><button class="btn btn-sm" data-use="${esc(w.code)}">Appliquer à mon panier</button></div>` : ""}
        ${activeSales().length ? `<div class="box"><span class="label">En ce moment</span><h3 style="margin:8px 0">${esc(activeSales()[0].name)}</h3><p class="muted" style="margin:0 0 12px">Jusqu'à −${P().maxSale} % sur une sélection.</p><a class="btn btn-ghost btn-sm" href="#/soldes">Voir les soldes</a></div>` : ""}
        <div class="box"><span class="label">Code privé</span><p class="muted" style="margin:8px 0 12px">Tu as reçu un code de l'équipe SKX ? Ajoute-le à ton panier.</p><form id="codeIn" style="display:flex;gap:8px"><input class="input" id="codeVal" placeholder="CODE" style="flex:1;text-transform:uppercase"><button class="btn btn-sm">Appliquer</button></form></div></div>`;
      body.addEventListener("click", (e) => { const b = e.target.closest("[data-use]"); if (b) applyCode(b.dataset.use); });
      $("#codeIn").addEventListener("submit", (e) => { e.preventDefault(); applyCode($("#codeVal").value); });
    }
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
        <div style="display:flex;gap:18px;flex-wrap:wrap">
          <label class="check"><input type="checkbox" id="pf-custom" name="customizable" ${p.customizable ? "checked" : ""}> Personnalisable</label>
          <label class="check"><input type="checkbox" id="pf-new" name="isNew" ${p.isNew ? "checked" : ""}> Nouveauté</label>
          <label class="check"><input type="checkbox" id="pf-best" name="bestseller" ${p.bestseller ? "checked" : ""}> Meilleure vente</label>
        </div>
        <label><span>Conseil de coupe</span><input id="pf-fit" name="fitTip" value="${esc(p.fitTip || "")}" placeholder="Ce modèle taille normalement. Entre deux tailles, prends la taille au-dessus."></label>
        <label><span>Points forts <span class="hint">un par ligne — vide = liste standard</span></span><textarea id="pf-ben" name="benefits">${esc((p.benefits || []).join("\n"))}</textarea></label>
        <label><span>Autres photos <span class="hint">liens séparés par des virgules : porté, zoom matière, zoom logo, col, dos…</span></span><input id="pf-imgs" name="images" value="${esc((p.images || []).filter((x) => !x.startsWith("data:")).join(", "))}"></label>
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
      p.customizable = !!f.customizable; p.isNew = !!f.isNew; p.bestseller = !!f.bestseller;
      p.fitTip = (f.fitTip || "").trim();
      p.benefits = (f.benefits || "").split("\n").map((x) => x.trim()).filter(Boolean);
      p.images = [...(p.images || []).filter((x) => x.startsWith("data:")), ...(f.images || "").split(",").map((x) => x.trim()).filter(Boolean)];
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
        </div></div>
      <div class="box"><h3>Projet ${esc(DATA.superfit.name || "SuperFit")}</h3><p>Une ligne par objectif : <span class="mono">Critère | Objectif | Statut | Piste</span>. Statuts : Faisable, En partie faisable, À valider, Recherche, Provisoire.</p>
        <form class="form" id="sfAdm">
          <div class="row"><label><span>Nom</span><input name="name" value="${esc(DATA.superfit.name || "")}"></label><label><span>Accroche</span><input name="tagline" value="${esc(DATA.superfit.tagline || "")}"></label></div>
          <label><span>Présentation</span><textarea name="intro">${esc(DATA.superfit.intro || "")}</textarea></label>
          <label><span>Objectifs</span><textarea name="targets" style="min-height:200px;font-family:var(--mono);font-size:12px">${esc((DATA.superfit.targets || []).map((t) => [t.label, t.value, t.status, t.note].join(" | ")).join("\n"))}</textarea></label>
          <label><span>Étapes <span class="hint">une par ligne</span></span><textarea name="steps">${esc((DATA.superfit.steps || []).join("\n"))}</textarea></label>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm">Enregistrer</button><button type="button" class="btn btn-ghost btn-sm" id="sfPrint" data-ro-ok>Imprimer le cahier des charges SuperFit</button><a class="btn btn-ghost btn-sm" href="#/superfit" data-ro-ok>Voir la page</a></div>
        </form></div>`;
    $("#sfPrint").addEventListener("click", () => printSheet(superfitSheetHTML()));
    $("#sfAdm").addEventListener("submit", (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
      DATA.superfit = Object.assign(DATA.superfit, { name: f.name.trim(), tagline: f.tagline.trim(), intro: f.intro.trim(),
        targets: f.targets.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((a) => a[0]).map(([label, value = "", status = "À valider", note = ""]) => ({ label, value, status, note })),
        steps: f.steps.split("\n").map((x) => x.trim()).filter(Boolean) });
      saveDraft(); toast("Projet enregistré."); pageTeam();
    });
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
      <div class="box"><h3>Textes de la page « Notre histoire »</h3><form class="form" id="storyForm">
        <label><span>Titre</span><input name="title" value="${esc(DATA.story.title || "")}"></label>
        <label><span>Histoire</span><textarea name="history">${esc(DATA.story.history || "")}</textarea></label>
        <div class="row"><label><span>Valeurs</span><textarea name="values">${esc(DATA.story.values || "")}</textarea></label><label><span>Mission</span><textarea name="mission">${esc(DATA.story.mission || "")}</textarea></label></div>
        <div class="row"><label><span>Équipe</span><textarea name="team">${esc(DATA.story.team || "")}</textarea></label><label><span>Qualité</span><textarea name="quality">${esc(DATA.story.quality || "")}</textarea></label></div>
        <label><span>Engagements <span class="hint">un par ligne</span></span><textarea name="commitments">${esc((DATA.story.commitments || []).join("\n"))}</textarea></label>
        <button class="btn btn-sm" style="justify-self:start">Enregistrer les textes</button></form></div>
      <div class="box"><label class="form"><span class="label">Introduction des slides</span><input class="input" id="hIntro" value="${esc(H.intro)}"></label></div>
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
    $("#storyForm").addEventListener("submit", (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
      f.commitments = f.commitments.split("\n").map((x) => x.trim()).filter(Boolean);
      DATA.story = f; saveDraft(); toast("Textes enregistrés."); pageTeam();
    });
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
          <div class="form" style="flex:1;min-width:240px"><span class="label">Avatar</span>
            <div class="row3">
              <label><span>Cheveux</span><select data-av="hair">${Object.entries(AV_HAIR).map(([k, v]) => `<option value="${k}" ${k === m.avatar.hair ? "selected" : ""}>${v}</option>`).join("")}</select></label>
              <label><span>Visage</span><select data-av="facial">${Object.entries(AV_FACIAL).map(([k, v]) => `<option value="${k}" ${k === m.avatar.facial ? "selected" : ""}>${v}</option>`).join("")}</select></label>
              <label><span>Accessoire</span><select data-av="acc">${Object.entries(AV_ACC).map(([k, v]) => `<option value="${k}" ${k === m.avatar.acc ? "selected" : ""}>${v}</option>`).join("")}</select></label>
            </div>
            <div class="row3" style="grid-template-columns:repeat(5,1fr)">
              <label><span>Fond</span><select data-av="bg">${ZONE_IDS.map((z) => `<option value="${z}" ${z === m.avatar.bg ? "selected" : ""}>${esc(DATA.zones[z].name)}</option>`).join("")}</select></label>
              <label><span>Haut</span><input type="color" data-av="top" value="${esc(m.avatar.top)}" style="height:42px;padding:4px"></label>
              <label><span>Casquette</span><input type="color" data-av="cap" value="${esc(m.avatar.cap || "#141414")}" style="height:42px;padding:4px"></label>
              <label><span>Peau</span><input type="color" data-av="skin" value="${esc(m.avatar.skin)}" style="height:42px;padding:4px"></label>
              <label><span>Cheveux</span><input type="color" data-av="hairColor" value="${esc(m.avatar.hairColor)}" style="height:42px;padding:4px"></label>
            </div></div></div>
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
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:14px"><span class="label" style="align-self:center">Modèles :</span>${[["TEAM", 20, "Équipe"], ["FAMILY", 30, "Famille"], ["VIP", 40, "Lancement / très proches"], ["STOCK", 50, "Anciens stocks"], ["LASTCHANCE", 70, "Dernières pièces, déstockage final"]].map(([c, v, n]) => `<button class="chip" data-tpl="${c}" data-tpv="${v}" data-tpn="${esc(n)}">${c} · −${v} %</button>`).join("")}</div>
        <p class="label" style="margin:8px 0 0">Conseil : −20 à −30 % standard, −40 % exceptionnel, −50 % et −70 % seulement sur anciens stocks et dernières pièces. Ajoute des chiffres ou lettres au modèle pour qu'il ne soit pas devinable.</p>
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

      <div class="box"><h3>Code de bienvenue</h3><p>Proposé dans une fenêtre aux nouveaux visiteurs, en échange de leur e-mail. Si une adresse Formspree est réglée, les e-mails te sont envoyés.</p>
        <div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
          <label class="check"><input type="checkbox" id="wOn" ${S().welcome.enabled ? "checked" : ""}> Activer</label>
          <label class="form"><span class="label">Code</span><input class="input" id="wCode" value="${esc(S().welcome.code)}" style="text-transform:uppercase"></label>
          <label class="form"><span class="label">Remise %</span><input class="input" type="number" min="1" max="${pr.maxCode}" id="wPct" value="${+S().welcome.percent}" style="width:90px"></label>
          <label class="form"><span class="label">Délai (s)</span><input class="input" type="number" min="3" id="wDelay" value="${+S().welcome.delay}" style="width:90px"></label>
        </div></div>

      <div class="box"><h3>Numéro et prénom</h3><p>Personnalisation du dos sur les hauts personnalisables.</p>
        <div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
          <label class="check"><input type="checkbox" id="toOn" ${DATA.textOptions.enabled ? "checked" : ""}> Proposer</label>
          <label class="form"><span class="label">Numéro €</span><input class="input" type="number" step="0.1" min="0" id="toNum" value="${+DATA.textOptions.numberPrice}" style="width:90px"></label>
          <label class="form"><span class="label">Prénom €</span><input class="input" type="number" step="0.1" min="0" id="toName" value="${+DATA.textOptions.namePrice}" style="width:90px"></label>
          <label class="form"><span class="label">Pack complet €</span><input class="input" type="number" step="0.1" min="0" id="toPack" value="${+DATA.textOptions.packPrice}" style="width:90px"></label>
        </div></div>

      <div class="box"><h3>Packs</h3><p>Quand toutes les pièces d'un pack sont dans le panier, la remise s'applique (50 % max, non cumulable).</p>
        <div id="packList" style="display:grid;gap:12px"></div>
        <button class="btn btn-ghost btn-sm" id="packAdd" style="margin-top:12px">Ajouter un pack</button></div>

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
    const packs = clone(DATA.packs || []);
    const renderPacks = () => {
      $("#packList").innerHTML = packs.map((pk, i) => `<div class="box" data-pk="${i}" style="background:var(--bg);margin:0">
        <div style="display:grid;grid-template-columns:1.2fr 90px auto;gap:10px;align-items:end">
          <label class="form"><span class="label">Nom</span><input class="input" data-pkk="name" value="${esc(pk.name)}"></label>
          <label class="form"><span class="label">Remise %</span><input class="input" type="number" min="1" max="50" data-pkk="percent" value="${+pk.percent}"></label>
          <button class="icon-btn" data-pkdel="${i}" aria-label="Supprimer">✕</button></div>
        <label class="form" style="margin:10px 0"><span class="label">Description</span><input class="input" data-pkk="description" value="${esc(pk.description || "")}"></label>
        <div class="checks">${DATA.products.map((p) => `<label><input type="checkbox" data-pkp="${esc(p.id)}" ${(pk.items || []).includes(p.id) ? "checked" : ""}> ${esc(p.name)}</label>`).join("")}</div></div>`).join("") || `<p class="muted">Aucun pack.</p>`;
      if (role().readOnly) lockReadOnly($("#packList"));
    };
    renderPacks();
    $("#packList").addEventListener("input", (e) => {
      const b = e.target.closest("[data-pk]"); if (!b) return; const pk = packs[+b.dataset.pk];
      if (e.target.dataset.pkk) pk[e.target.dataset.pkk] = e.target.dataset.pkk === "percent" ? Math.max(1, Math.min(+e.target.value || 0, 50)) : e.target.value;
      if (e.target.dataset.pkp) { const id = e.target.dataset.pkp; pk.items = e.target.checked ? [...new Set([...(pk.items || []), id])] : pk.items.filter((x) => x !== id); }
    });
    $("#packList").addEventListener("click", (e) => { const d = e.target.closest("[data-pkdel]"); if (d && confirm("Supprimer ce pack ?")) { packs.splice(+d.dataset.pkdel, 1); renderPacks(); } });
    $("#packAdd").addEventListener("click", () => { packs.push({ id: uid("pk"), name: "Nouveau pack", items: [], percent: 10, description: "" }); renderPacks(); });
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
    $$("[data-tpl]", el).forEach((b) => b.addEventListener("click", () => {
      $("#cf-code").value = b.dataset.tpl + b.dataset.tpv + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      $("#cf-pct").value = b.dataset.tpv; $("#cf-note").value = b.dataset.tpn;
    }));
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
      DATA.settings.welcome = { enabled: $("#wOn").checked, code: normCode($("#wCode").value), percent: Math.max(1, Math.min(+$("#wPct").value || 10, pr.maxCode)), delay: Math.max(3, +$("#wDelay").value || 12) };
      DATA.textOptions = { enabled: $("#toOn").checked, numberPrice: Math.max(0, +$("#toNum").value || 0), namePrice: Math.max(0, +$("#toName").value || 0), packPrice: Math.max(0, +$("#toPack").value || 0) };
      DATA.packs = packs.filter((pk) => pk.name.trim() && (pk.items || []).length >= 2);
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

  /* --- Avis & FAQ --- */
  function tabReviews(el) {
    const R = clone(DATA.reviews), F = clone(DATA.faq);
    el.innerHTML = `${publishNotice()}
      <div class="notice info">Les avis envoyés par les clients t'arrivent par e-mail (ou Formspree). Ajoute ici ceux que tu veux publier. N'invente pas d'avis : utilise de vrais retours de clients ou de testeurs.</div>
      <div class="box"><h3>Avis publiés</h3><div id="revList" style="display:grid;gap:10px"></div>
        <button class="btn btn-ghost btn-sm" id="revAdd" style="margin-top:12px">Ajouter un avis</button></div>
      <div class="box"><h3>FAQ</h3><p>Affichée sur l'accueil, les fiches produits, le guide et la page contact.</p><div id="faqList" style="display:grid;gap:10px"></div>
        <button class="btn btn-ghost btn-sm" id="faqAdd" style="margin-top:12px">Ajouter une question</button></div>
      <button class="btn" id="rfSave">Enregistrer</button>`;
    const renderR = () => {
      $("#revList").innerHTML = R.map((r, i) => `<div class="box" data-ri="${i}" style="background:var(--bg);margin:0">
        <div style="display:grid;grid-template-columns:1fr 1.4fr 90px 130px auto;gap:10px;align-items:end">
          <label class="form"><span class="label">Prénom</span><input class="input" data-rk="name" value="${esc(r.name)}"></label>
          <label class="form"><span class="label">Pièce</span><select class="input" data-rk="productId"><option value="">Marque</option>${DATA.products.map((p) => `<option value="${esc(p.id)}" ${p.id === r.productId ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>
          <label class="form"><span class="label">Note</span><input class="input" type="number" min="1" max="5" data-rk="rating" value="${+r.rating || 5}"></label>
          <label class="check"><input type="checkbox" data-rk="verified" ${r.verified ? "checked" : ""}> Achat vérifié</label>
          <button class="icon-btn" data-rdel="${i}" aria-label="Supprimer">✕</button></div>
        <label class="form" style="margin-top:10px"><span class="label">Avis</span><textarea class="input" data-rk="text">${esc(r.text)}</textarea></label></div>`).join("") || `<p class="muted">Aucun avis publié.</p>`;
      if (role().readOnly) lockReadOnly($("#revList"));
    };
    const renderF = () => {
      $("#faqList").innerHTML = F.map((f, i) => `<div data-fi="${i}" style="display:grid;grid-template-columns:1fr 2fr auto;gap:8px;align-items:start">
        <input class="input" data-fk="q" value="${esc(f.q)}" aria-label="Question"><textarea class="input" data-fk="a" style="min-height:44px" aria-label="Réponse">${esc(f.a)}</textarea><button class="icon-btn" data-fdel="${i}" aria-label="Supprimer">✕</button></div>`).join("");
      if (role().readOnly) lockReadOnly($("#faqList"));
    };
    renderR(); renderF();
    $("#revList").addEventListener("input", (e) => { const b = e.target.closest("[data-ri]"), k = e.target.dataset.rk; if (!b || !k) return; R[+b.dataset.ri][k] = k === "verified" ? e.target.checked : k === "rating" ? Math.max(1, Math.min(5, +e.target.value || 5)) : e.target.value; });
    $("#revList").addEventListener("click", (e) => { const d = e.target.closest("[data-rdel]"); if (d && confirm("Supprimer cet avis ?")) { R.splice(+d.dataset.rdel, 1); renderR(); } });
    $("#revAdd").addEventListener("click", () => { R.unshift({ id: uid("rv"), name: "", productId: "", rating: 5, text: "", verified: false, approved: true, date: today() }); renderR(); });
    $("#faqList").addEventListener("input", (e) => { const b = e.target.closest("[data-fi]"), k = e.target.dataset.fk; if (b && k) F[+b.dataset.fi][k] = e.target.value; });
    $("#faqList").addEventListener("click", (e) => { const d = e.target.closest("[data-fdel]"); if (d) { F.splice(+d.dataset.fdel, 1); renderF(); } });
    $("#faqAdd").addEventListener("click", () => { F.push({ q: "", a: "" }); renderF(); });
    $("#rfSave").addEventListener("click", () => { DATA.reviews = R.filter((r) => r.name.trim() && r.text.trim()); DATA.faq = F.filter((f) => f.q.trim() && f.a.trim()); saveDraft(); toast("Avis et FAQ enregistrés."); pageTeam(); });
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
        <div style="display:grid;gap:6px"><input class="input" data-k="name" value="${esc(s.name)}" placeholder="Nom" aria-label="Nom"><input class="input" data-k="region" value="${esc(s.region || "")}" placeholder="Région (ex. France · Sud)" aria-label="Région"></div>
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
      if (k === "urls") s.urls = e.target.value.split(/\s+/).filter(Boolean); else s[k] = e.target.value;
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
        <label><span>Texte d'accueil</span><input id="st-hero" name="heroText" value="${esc(s.heroText || "")}"></label>
        <div class="row3"><label><span>Délai d'expédition</span><input id="st-delay" name="shipDelay" value="${esc(s.shipDelay || "")}"></label><label><span>Jours pour retourner</span><input id="st-ret" type="number" name="returnDays" value="${+s.returnDays || 30}"></label><label><span>Moyens de paiement affichés</span><input id="st-pm" name="paymentMethods" value="${esc(s.paymentMethods || "")}" placeholder="Carte bancaire, PayPal…"></label></div>
        <div class="row"><label><span>Comptes clients · URL Supabase <span class="hint">vide = comptes sur l'appareil</span></span><input id="st-sbu" name="supabaseUrl" value="${esc(s.supabaseUrl || "")}" placeholder="https://xxxx.supabase.co"></label><label><span>Clé publique (anon) Supabase</span><input id="st-sbk" name="supabaseKey" value="${esc(s.supabaseKey || "")}" placeholder="eyJhbGciOi…"></label></div>
        <div class="row"><label><span>Dépôt GitHub</span><input id="st-repo" name="githubRepo" value="${esc(s.githubRepo)}" placeholder="utilisateur/depot"></label><label><span>Branche publiée</span><input id="st-branch" name="githubBranch" value="${esc(s.githubBranch)}"></label></div>
        <button class="btn btn-sm" style="justify-self:start">Enregistrer</button>
      </form></div>
      <div class="box"><h3>Informations légales et réseaux</h3><p>Utilisées dans les mentions légales, les CGV et la politique de confidentialité. Fais relire ces pages avant l'ouverture.</p>
        <form class="form" id="legalForm">
          <div class="row"><label><span>Raison sociale</span><input id="lg-co" name="company" value="${esc(s.legal.company || "")}"></label><label><span>Forme juridique et capital</span><input id="lg-form" name="form" value="${esc(s.legal.form || "")}" placeholder="SAS au capital de …"></label></div>
          <div class="row"><label><span>Adresse du siège</span><input id="lg-addr" name="address" value="${esc(s.legal.address || "")}"></label><label><span>SIRET</span><input id="lg-siret" name="siret" value="${esc(s.legal.siret || "")}"></label></div>
          <div class="row"><label><span>Directeur de la publication</span><input id="lg-dir" name="director" value="${esc(s.legal.director || "")}"></label><label><span>Médiateur de la consommation</span><input id="lg-med" name="mediator" value="${esc(s.legal.mediator || "")}"></label></div>
          <label><span>Hébergeur</span><input id="lg-host" name="host" value="${esc(s.legal.host || "")}"></label>
          <div class="row3"><label><span>Instagram</span><input id="so-ig" name="instagram" value="${esc(s.social.instagram || "")}" placeholder="https://instagram.com/…"></label><label><span>TikTok</span><input id="so-tt" name="tiktok" value="${esc(s.social.tiktok || "")}"></label><label><span>YouTube</span><input id="so-yt" name="youtube" value="${esc(s.social.youtube || "")}"></label></div>
          <button class="btn btn-sm" style="justify-self:start">Enregistrer</button>
        </form></div>`;
    $("#legalForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const { instagram, tiktok, youtube, ...legal } = f;
      DATA.settings.legal = legal; DATA.settings.social = { instagram, tiktok, youtube };
      saveDraft(); toast("Informations enregistrées."); pageTeam();
    });
    $("#setForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      f.freeShippingFrom = +f.freeShippingFrom || 0; f.shippingPrice = +f.shippingPrice || 0; f.returnDays = +f.returnDays || 30;
      Object.assign(DATA.settings, f); saveDraft(); toast("Réglages enregistrés."); pageTeam();
    });
  }

  const TABS = { dashboard: tabDashboard, products: tabProducts, specs: tabSpecs, materials: tabMaterials, charter: tabCharter, zones: tabZones, history: tabHistory, people: tabPeople, promos: tabPromos, designs: tabDesigns, reviews: tabReviews, radio: tabRadio, orders: tabOrders, team: tabTeam, settings: tabSettings, account: tabAccount };

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
      const groups = [];
      DATA.stations.forEach((st, i) => { const r = st.region || "Radios"; let g = groups.find((x) => x.r === r); if (!g) groups.push(g = { r, items: [] }); g.items.push(`<option value="${i}">${esc(st.name)}</option>`); });
      sel.innerHTML = groups.map((g) => `<optgroup label="${esc(g.r)}">${g.items.join("")}</optgroup>`).join("");
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
      else { playing = false; urlIdx = 0; setStatus("Flux indisponible", ""); toast(`${current?.name || "Cette radio"} ne répond pas. Choisis une autre station dans la liste.`); }
    });
    $("#radioPlay").addEventListener("click", toggle);
    const zap = (d) => { const n = DATA.stations.length; prefs.station = (prefs.station + d + n) % n; sel.value = prefs.station; current = DATA.stations[prefs.station]; urlIdx = 0; prefs.want = true; savePrefs(); play(); toast(`${current.name}${current.region ? " · " + current.region : ""}`); };
    $("#radioPrev").addEventListener("click", () => zap(-1));
    $("#radioNext").addEventListener("click", () => zap(1));
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
    closeModal(); closeCart();
    const [page, arg] = h.split("/");
    $$("#nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === (page === "zone" ? arg : page)));
    if (!page) pageHome();
    else if (page === "zone") pageZone(arg);
    else if (page === "boutique") pageShop("", arg || "");
    else if (page === "nouveautes") pageShop("", "new");
    else if (page === "meilleures-ventes") pageShop("", "best");
    else if (page === "packs") pageShop("", "packs");
    else if (page === "homme") pageShop("homme");
    else if (page === "femme") pageShop("femme");
    else if (page === "enfants") pageShop("enfant");
    else if (page === "envies") pageWish();
    else if (page === "compte") pageAccount();
    else if (page === "superfit") pageSuperfit();
    else if (page === "contact") pageContact();
    else if (page === "mentions" || page === "cgv" || page === "confidentialite") pageLegal(page);
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

  /* Traînée du curseur : neige de montagne (couleur de la zone en cours) — souris uniquement */
  if (matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const cv = document.createElement("canvas"); cv.className = "trail"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, parts = [], running = false, lx = null, ly = null;
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener("resize", size);
    const hex = (h) => { const m = /#?([0-9a-f]{6})/i.exec(h || ""); const n = m ? parseInt(m[1], 16) : 0xecebe6; return [n >> 16, (n >> 8) & 255, n & 255]; };
    const flake = (x, y, r) => { ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.stroke(); };
    let inside = false, frame = 0;
    const spawn = (x, y, spread) => {
      if (parts.length > 220) parts.shift();
      const acc = getComputedStyle(document.body).getPropertyValue("--accent").trim();
      const base = document.body.dataset.zone ? hex(acc) : [236, 235, 230];
      const max = 120 + Math.random() * 90;
      parts.push({ x: x + (Math.random() - .5) * spread, y: y + (Math.random() - .5) * spread, vx: (Math.random() - .5) * .35, vy: .05 + Math.random() * .2, r: .8 + Math.random() * 1.6, life: max, max, ph: Math.random() * 6, flake: Math.random() < .3, c: Math.random() < .5 ? [255, 255, 255] : base });
    };
    const tick = () => {
      frame++;
      // la neige continue de tomber même quand la souris est immobile
      if (inside && lx !== null && !document.hidden && frame % 4 === 0) spawn(lx, ly, 14);
      ctx.clearRect(0, 0, W, H);
      parts = parts.filter((p) => p.life > 0);
      for (const p of parts) {
        p.life -= 1; p.vy = Math.min(p.vy + .006, .55); p.x += p.vx + Math.sin(p.ph += .04) * .25; p.y += p.vy;
        const a = Math.min(1, p.life / p.max * 1.4) * .85;
        ctx.fillStyle = ctx.strokeStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${a})`;
        if (p.flake) { ctx.lineWidth = 1; flake(p.x, p.y, p.r * 2.2); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
      }
      if (parts.length || inside) requestAnimationFrame(tick); else { running = false; ctx.clearRect(0, 0, W, H); }
    };
    const start = () => { if (!running) { running = true; requestAnimationFrame(tick); } };
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const x = e.clientX, y = e.clientY;
      const d = lx === null ? 0 : Math.hypot(x - lx, y - ly); lx = x; ly = y; inside = true;
      for (let i = 0, n = Math.min(4, Math.ceil(d / 14)); i < n; i++) spawn(x, y, 8);
      start();
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { inside = false; });
    addEventListener("blur", () => { inside = false; });
  }

  applySettings();
  renderCart();
  renderWishCount();
  Accounts.init();
  route();
  // Code de bienvenue après quelques secondes (une seule fois par visiteur)
  setTimeout(() => welcomePopup(false), (+(S().welcome?.delay) || 12) * 1000);
  // Rappel du panier pour un visiteur qui revient
  const lastCart = store.get("skx_cart_at", 0);
  if (cart.length && Date.now() - lastCart > 30 * 60e3) setTimeout(() => { toast("Ton panier t'attend. Finalise ta commande quand tu veux."); }, 2500);
})();
