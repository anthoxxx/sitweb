/* ================= SKX — application boutique ================= */
(function () {
  "use strict";

  /* ---------- Outils ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch {} }
  };
  const session = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
    del(k) { try { sessionStorage.removeItem(k); } catch {} }
  };
  // Hash non cryptographique (cyrb53) — suffisant pour ne pas stocker le mot de passe en clair.
  function hash(str, seed = 7) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  const DEFAULT_PASSWORD = "skx2026";

  const UNIVERS_IDS = ["montagne", "terre", "pluie", "soleil"];
  const UCOLORS = {
    montagne: ["#0d1b2a", "#6b8fa8"], terre: ["#2b1a0e", "#c98a4b"],
    pluie: ["#05080c", "#2b4a66"], soleil: ["#ff6f00", "#ffd54f"]
  };
  const TYPES = { tshirt: "T-shirt", hoodie: "Hoodie", veste: "Veste", pantalon: "Pantalon", casquette: "Casquette", bonnet: "Bonnet" };

  /* ---------- Données ---------- */
  const PUBLISHED = clone(window.SKX_DATA || {});
  let draft = store.get("skx_draft", null);
  let DATA = normalize(draft || clone(PUBLISHED));

  function normalize(d) {
    d.settings = Object.assign({}, PUBLISHED.settings, d.settings);
    d.univers = Object.assign({}, PUBLISHED.univers, d.univers);
    d.stations = Array.isArray(d.stations) && d.stations.length ? d.stations : clone(PUBLISHED.stations || []);
    d.products = Array.isArray(d.products) ? d.products : [];
    return d;
  }
  function saveDraft() {
    draft = DATA;
    if (!store.set("skx_draft", DATA)) toast("⚠️ Stockage plein : utilise des liens d'images plutôt que des fichiers importés.");
    applySettings();
  }
  const S = () => DATA.settings;
  const money = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: S().currency || "EUR" }).format(+n || 0);
  const productById = (id) => DATA.products.find((p) => p.id === id);

  /* ---------- Visuels produits (SVG générés) ---------- */
  const SHAPES = {
    tshirt: `<path d="M70 42 L52 47 L26 68 L40 92 L58 84 L58 168 L142 168 L142 84 L160 92 L174 68 L148 47 L130 42 Q100 62 70 42 Z"/>`,
    hoodie: `<path d="M74 44 Q100 18 126 44 L150 52 L174 124 L156 130 L142 92 L142 170 L58 170 L58 92 L44 130 L26 124 L50 52 Z"/>
             <path d="M82 46 Q100 74 118 46" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3"/>
             <path d="M74 138 h52 v22 h-52z" fill="rgba(0,0,0,.15)"/>`,
    veste: `<path d="M76 40 L124 40 L152 52 L176 126 L158 132 L144 94 L144 170 L56 170 L56 94 L42 132 L24 126 L48 52 Z"/>
            <path d="M100 46 V170" stroke="rgba(0,0,0,.45)" stroke-width="3"/>
            <path d="M76 40 L100 60 L124 40" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3"/>`,
    pantalon: `<path d="M64 32 L136 32 L144 172 L110 172 L100 82 L90 172 L56 172 Z"/>
               <path d="M64 44 H136" stroke="rgba(0,0,0,.3)" stroke-width="3"/>`,
    casquette: `<path d="M52 122 Q52 62 102 62 Q150 62 150 122 Z"/>
                <path d="M44 120 L176 120 Q184 134 160 136 L44 130 Z" fill="rgba(0,0,0,.25)"/>
                <circle cx="101" cy="62" r="5" fill="rgba(0,0,0,.3)"/>`,
    bonnet: `<path d="M56 142 Q56 58 100 58 Q144 58 144 142 Z"/>
             <rect x="52" y="124" width="96" height="30" rx="6" fill="rgba(0,0,0,.18)"/>
             <circle cx="100" cy="52" r="14"/>`
  };
  const LOGO_POS = { tshirt: [100, 100, 20], hoodie: [100, 108, 20], veste: [122, 92, 12], pantalon: [80, 60, 10], casquette: [101, 104, 20], bonnet: [100, 145, 16] };
  function lum(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return .5;
    const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }
  function productSVG(p) {
    const [c1, c2] = UCOLORS[p.univers] || ["#111", "#333"];
    const shape = SHAPES[p.type] || SHAPES.tshirt;
    const [lx, ly, ls] = LOGO_POS[p.type] || LOGO_POS.tshirt;
    const color = /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : "#cccccc";
    const ink = lum(color) > .55 ? "#111" : "#fff";
    const gid = "g" + Math.random().toString(36).slice(2, 8);
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.name)}">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#${gid})"/>
      <ellipse cx="100" cy="182" rx="62" ry="7" fill="rgba(0,0,0,.35)"/>
      <g fill="${color}" stroke="rgba(0,0,0,.35)" stroke-width="1.5" stroke-linejoin="round">${shape}</g>
      <text x="${lx}" y="${ly}" text-anchor="middle" font-family="Pirata One, serif" font-size="${ls}" fill="${ink}" opacity=".9">SKX</text>
    </svg>`;
  }
  const productVisual = (p) => (p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : productSVG(p));

  /* ---------- UI générale ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
  }
  function applySettings() {
    const s = S();
    document.title = `${s.shopName} — Boutique de vêtements`;
    $("#announce").textContent = s.announcement || "";
    $("#footerSlogan").textContent = s.slogan || "";
    const mail = $("#footerMail"); mail.href = s.contactEmail ? `mailto:${s.contactEmail}` : "#";
    $("#year").textContent = new Date().getFullYear();
  }
  function openModal(html, wide = true) {
    const box = $("#modalBox");
    box.style.width = wide ? "" : "min(520px, 100%)";
    box.innerHTML = `<button class="icon-btn modal-close" data-close aria-label="Fermer">✕</button>` + html;
    $("#modal").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() { $("#modal").classList.remove("open"); document.body.style.overflow = ""; }
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal" || e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeCart(); } });

  $("#burger").addEventListener("click", () => {
    const open = $("#nav").classList.toggle("open");
    $("#burger").setAttribute("aria-expanded", open);
  });
  $("#nav").addEventListener("click", (e) => { if (e.target.closest("a")) $("#nav").classList.remove("open"); });
  $("#newsletter").addEventListener("submit", (e) => {
    e.preventDefault();
    const list = store.get("skx_newsletter", []); list.push($("input", e.target).value); store.set("skx_newsletter", list);
    e.target.reset(); toast("Merci ! Tu es inscrit·e à la newsletter SKX.");
  });

  /* ---------- Cartes produits ---------- */
  function productCard(p) {
    const u = DATA.univers[p.univers];
    const out = (+p.stock || 0) <= 0;
    const promo = p.oldPrice && +p.oldPrice > +p.price;
    return `<article class="card" data-product="${esc(p.id)}">
      <div class="card-img">
        ${productVisual(p)}
        ${u ? `<span class="badge badge-${p.univers}">${esc(u.name)}</span>` : ""}
        ${out ? `<span class="badge badge-out">Épuisé</span>` : promo ? `<span class="badge badge-promo">-${Math.round(100 - (p.price / p.oldPrice) * 100)}%</span>` : ""}
      </div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <span class="muted" style="font-size:13px">${esc(TYPES[p.type] || "")}</span>
        <div class="card-foot">
          <span class="price">${money(p.price)}${promo ? `<s>${money(p.oldPrice)}</s>` : ""}</span>
          <button class="btn btn-sm" data-quick="${esc(p.id)}" ${out ? "disabled" : ""}>${out ? "Épuisé" : "Voir"}</button>
        </div>
      </div>
    </article>`;
  }
  const grid = (list) => list.length ? `<div class="grid">${list.map(productCard).join("")}</div>` : `<div class="empty">Aucun article pour le moment… les prochains drops arrivent bientôt.</div>`;

  document.addEventListener("click", (e) => {
    const card = e.target.closest("[data-product]");
    if (card) openProduct(card.dataset.product);
  });

  /* ---------- Fiche produit ---------- */
  function openProduct(id) {
    const p = productById(id); if (!p) return;
    const sizes = (p.sizes && p.sizes.length) ? p.sizes : ["Unique"];
    let size = sizes.length === 1 ? sizes[0] : null, qty = 1;
    const stock = +p.stock || 0;
    const u = DATA.univers[p.univers];
    openModal(`<div class="pdp">
      <div class="pdp-img">${productVisual(p)}</div>
      <div class="pdp-info">
        ${u ? `<a href="#/univers/${p.univers}" data-close><span class="badge badge-${p.univers}" style="position:static">${esc(u.name)}</span></a>` : ""}
        <h2>${esc(p.name)}</h2>
        <div class="price" style="font-size:24px">${money(p.price)}${p.oldPrice && +p.oldPrice > +p.price ? `<s>${money(p.oldPrice)}</s>` : ""}</div>
        <p class="muted" style="margin:0">${esc(p.description)}</p>
        <div><b>Taille</b>
          <div class="sizes" id="pdpSizes" style="margin-top:8px">${sizes.map((s) => `<button class="size ${s === size ? "active" : ""}" data-size="${esc(s)}">${esc(s)}</button>`).join("")}</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <div class="qty"><button data-q="-1" aria-label="Moins">−</button><span id="pdpQty">1</span><button data-q="1" aria-label="Plus">+</button></div>
          ${stock <= 0 ? `<span class="stock-low">Épuisé</span>` : stock <= 5 ? `<span class="stock-low">Plus que ${stock} en stock</span>` : `<span class="muted" style="font-size:14px">✔ En stock</span>`}
        </div>
        <button class="btn btn-block" id="pdpAdd" ${stock <= 0 ? "disabled" : ""}>Ajouter au panier</button>
        <div class="muted" style="font-size:13px">🚚 Livraison offerte dès ${money(S().freeShippingFrom)} · ↩︎ Retours 30 jours</div>
      </div>
    </div>`);
    const box = $("#modalBox");
    box.querySelector("#pdpSizes").addEventListener("click", (e) => {
      const b = e.target.closest("[data-size]"); if (!b) return;
      size = b.dataset.size; $$(".size", box).forEach((x) => x.classList.toggle("active", x === b));
    });
    $$("[data-q]", box).forEach((b) => b.addEventListener("click", () => {
      qty = Math.max(1, Math.min(Math.max(1, stock), qty + +b.dataset.q)); $("#pdpQty").textContent = qty;
    }));
    $("#pdpAdd").addEventListener("click", () => {
      if (!size) { toast("Choisis une taille 😉"); return; }
      addToCart(p.id, size, qty); closeModal();
    });
  }

  /* ---------- Panier ---------- */
  let cart = store.get("skx_cart", []);
  const saveCart = () => { cart = cart.filter((l) => productById(l.id)); store.set("skx_cart", cart); renderCart(); };
  function addToCart(id, size, qty) {
    const p = productById(id);
    const line = cart.find((l) => l.id === id && l.size === size);
    const inCart = cart.filter((l) => l.id === id).reduce((a, l) => a + l.qty, 0);
    const max = (+p.stock || 0) - inCart;
    if (max <= 0) { toast("Stock maximum déjà dans ton panier"); return; }
    qty = Math.min(qty, max);
    if (line) line.qty += qty; else cart.push({ id, size, qty });
    saveCart();
    const c = $("#cartCount"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
    toast(`${p.name} (${size}) ajouté au panier ✔`);
  }
  function totals() {
    const sub = cart.reduce((a, l) => a + (productById(l.id)?.price || 0) * l.qty, 0);
    const ship = sub === 0 || sub >= +S().freeShippingFrom ? 0 : +S().shippingPrice;
    return { sub, ship, total: sub + ship };
  }
  function renderCart() {
    $("#cartCount").textContent = cart.reduce((a, l) => a + l.qty, 0);
    const body = $("#cartItems"), foot = $("#cartFoot");
    if (!cart.length) {
      body.innerHTML = `<div class="empty" style="margin-top:20px">Ton panier est vide.<br><br><a class="btn btn-sm" href="#/boutique" data-closecart>Découvrir la boutique</a></div>`;
      foot.innerHTML = ""; return;
    }
    body.innerHTML = cart.map((l, i) => {
      const p = productById(l.id);
      return `<div class="line">
        <div class="line-img">${productVisual(p)}</div>
        <div><b>${esc(p.name)}</b><div class="muted" style="font-size:13px">Taille ${esc(l.size)} · ${money(p.price)}</div>
          <div style="display:flex;gap:10px;align-items:center;margin-top:6px">
            <div class="qty"><button data-cq="${i}" data-d="-1">−</button><span>${l.qty}</span><button data-cq="${i}" data-d="1">+</button></div>
            <button class="rm" data-rm="${i}">Retirer</button>
          </div></div>
        <b>${money(p.price * l.qty)}</b>
      </div>`;
    }).join("");
    const t = totals();
    const left = +S().freeShippingFrom - t.sub;
    foot.innerHTML = `<div class="totals">
        <div><span>Sous-total</span><span>${money(t.sub)}</span></div>
        <div><span>Livraison</span><span>${t.ship ? money(t.ship) : "Offerte"}</span></div>
        ${left > 0 ? `<div class="muted" style="font-size:13px">Plus que ${money(left)} pour la livraison offerte</div>` : ""}
        <div class="total"><span>Total</span><span>${money(t.total)}</span></div>
      </div>
      <button class="btn btn-block" id="checkoutBtn" style="margin-top:14px">Commander</button>`;
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
  });
  $("#cartFoot").addEventListener("click", (e) => { if (e.target.id === "checkoutBtn") checkout(); });
  function openCart() { renderCart(); $("#drawer").classList.add("open"); $("#overlay").classList.add("open"); }
  function closeCart() { $("#drawer").classList.remove("open"); $("#overlay").classList.remove("open"); }
  $("#cartBtn").addEventListener("click", openCart);
  $("#closeDrawer").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);

  /* ---------- Commande ---------- */
  function checkout() {
    closeCart();
    const t = totals();
    openModal(`<div style="padding:28px">
      <h2 style="margin:0 0 4px">Finaliser la commande</h2>
      <p class="muted" style="margin:0 0 18px">Total : <b style="color:var(--text)">${money(t.total)}</b></p>
      <form class="form" id="orderForm">
        <div class="row"><label>Prénom<input name="prenom" required autocomplete="given-name"></label><label>Nom<input name="nom" required autocomplete="family-name"></label></div>
        <label>Email<input type="email" name="email" required autocomplete="email"></label>
        <label>Téléphone<input name="tel" autocomplete="tel"></label>
        <label>Adresse<input name="adresse" required autocomplete="street-address"></label>
        <div class="row"><label>Code postal<input name="cp" required autocomplete="postal-code"></label><label>Ville<input name="ville" required autocomplete="address-level2"></label></div>
        <label>Message (optionnel)<textarea name="message"></textarea></label>
        <button class="btn btn-block">Valider la commande</button>
      </form>
    </div>`, false);
    $("#orderForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("button", e.target); btn.disabled = true; btn.textContent = "Envoi…";
      const customer = Object.fromEntries(new FormData(e.target));
      const order = {
        ref: "SKX-" + Date.now().toString(36).toUpperCase(),
        date: new Date().toISOString(),
        customer,
        items: cart.map((l) => { const p = productById(l.id); return { id: p.id, name: p.name, size: l.size, qty: l.qty, price: p.price }; }),
        ...totals()
      };
      let sent = false;
      if (S().orderEndpoint) {
        try {
          const r = await fetch(S().orderEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ...order, _subject: `Nouvelle commande ${order.ref}`, email: customer.email }) });
          sent = r.ok;
        } catch { sent = false; }
      }
      const orders = store.get("skx_orders", []); orders.unshift(order); store.set("skx_orders", orders);
      cart = []; saveCart();
      orderDone(order, sent);
    });
  }
  function orderText(o) {
    const c = o.customer;
    return `Commande ${o.ref}\n\n` + o.items.map((i) => `- ${i.name} (${i.size}) x${i.qty} : ${money(i.price * i.qty)}`).join("\n") +
      `\n\nSous-total : ${money(o.sub)}\nLivraison : ${o.ship ? money(o.ship) : "Offerte"}\nTOTAL : ${money(o.total)}\n\n` +
      `${c.prenom} ${c.nom}\n${c.adresse}\n${c.cp} ${c.ville}\n${c.email} ${c.tel || ""}\n${c.message ? "\nMessage : " + c.message : ""}`;
  }
  function orderDone(o, sent) {
    const s = S();
    const mailto = s.contactEmail ? `mailto:${s.contactEmail}?subject=${encodeURIComponent("Commande " + o.ref)}&body=${encodeURIComponent(orderText(o))}` : "";
    openModal(`<div style="padding:32px;text-align:center">
      <div style="font-size:48px">🖤</div>
      <h2 style="margin:6px 0">Merci ${esc(o.customer.prenom)} !</h2>
      <p class="muted">Ta commande <b style="color:var(--text)">${esc(o.ref)}</b> d'un montant de <b style="color:var(--text)">${money(o.total)}</b> est enregistrée.</p>
      ${sent ? `<p>✔ Elle a bien été transmise à l'équipe SKX.</p>` : mailto ? `<p class="muted">Clique sur « Envoyer ma commande » pour la transmettre à SKX par email.</p>` : ""}
      <div style="display:grid;gap:10px;margin-top:18px">
        ${s.paymentLink ? `<a class="btn" href="${esc(s.paymentLink)}" target="_blank" rel="noopener">💳 Payer ${money(o.total)}</a>` : ""}
        ${!sent && mailto ? `<a class="btn ${s.paymentLink ? "btn-ghost" : ""}" href="${esc(mailto)}">✉️ Envoyer ma commande</a>` : ""}
        <button class="btn btn-ghost" data-close>Continuer mes achats</button>
      </div>
    </div>`, false);
  }

  /* ---------- Pages ---------- */
  const app = $("#app");
  const sceneDiv = (u, extra = "") => `<div class="js-scene" data-scene="${u}" ${extra}></div>`;
  function mountScenes(density) {
    $$(".js-scene", app).forEach((el) => window.SKXWeather.mountScene(el, el.dataset.scene, +(el.dataset.density || density || 1)));
  }

  function pageHome() {
    const U = DATA.univers, s = S();
    const featured = DATA.products.filter((p) => p.featured);
    const words = Array(4).fill(UNIVERS_IDS.map((u) => `<span>${esc(U[u].name)}</span><span style="color:#555">✦</span>`).join("")).join("");
    app.innerHTML = `
      <section class="hero">
        <div class="hero-quads">${UNIVERS_IDS.map((u) => `<div>${sceneDiv(u, 'data-density=".5"')}</div>`).join("")}</div>
        <div class="hero-content">
          <img class="hero-logo" src="assets/logo-skx.png" alt="${esc(s.shopName)}">
          <h1>${esc(s.slogan)}</h1>
          <p>Montagne, Terre, Pluie, Soleil — choisis ton élément.</p>
          <div class="cta"><a class="btn" href="#/boutique">Voir la boutique</a><a class="btn btn-ghost" href="#univers">Les 4 univers</a></div>
        </div>
      </section>
      <div class="marquee"><div class="marquee-track">${words}</div></div>
      <section class="section" id="univers"><div class="container">
        <div class="section-title"><div><h2>Les 4 univers</h2><p>Chaque collection a son climat.</p></div></div>
        <div class="tiles">${UNIVERS_IDS.map((u) => `
          <a class="tile tile-${u}" href="#/univers/${u}">
            ${sceneDiv(u, 'data-density=".7"')}
            <div class="tile-body"><h3>${esc(U[u].name)}</h3><p>${esc(U[u].tagline)}</p><span class="arrow">Explorer →</span></div>
          </a>`).join("")}</div>
      </div></section>
      <section class="section" style="padding-top:0"><div class="container">
        <div class="section-title"><div><h2>Sélection SKX</h2><p>Les pièces phares du moment.</p></div><a class="btn btn-ghost btn-sm" href="#/boutique">Tout voir →</a></div>
        ${grid(featured.length ? featured : DATA.products.slice(0, 8))}
      </div></section>
      <section class="section" style="padding-top:0"><div class="container perks">
        <div class="perk"><div class="ico">🚚</div><b>Livraison offerte</b><span class="muted">dès ${money(s.freeShippingFrom)} d'achat</span></div>
        <div class="perk"><div class="ico">↩︎</div><b>Retours 30 jours</b><span class="muted">simples et gratuits</span></div>
        <div class="perk"><div class="ico">🔒</div><b>Paiement sécurisé</b><span class="muted">CB, PayPal…</span></div>
        <div class="perk"><div class="ico">📻</div><b>Radio en fond</b><span class="muted">shoppe en musique</span></div>
      </div></section>`;
    mountScenes();
  }

  function pageUnivers(id) {
    const u = DATA.univers[id];
    if (!u) return pageNotFound();
    document.body.dataset.univers = id;
    const list = DATA.products.filter((p) => p.univers === id);
    app.innerHTML = `
      <section class="u-hero">
        ${sceneDiv(id)}
        <div class="container u-hero-content">
          <h1>${esc(u.name)}</h1>
          <div class="tagline">${esc(u.tagline)}</div>
          <p class="desc">${esc(u.description)}</p>
        </div>
      </section>
      <section class="section" style="padding-top:30px"><div class="container">
        <div class="section-title"><div><h2>Collection ${esc(u.name)}</h2><p>${list.length} article${list.length > 1 ? "s" : ""}</p></div></div>
        ${grid(list)}
        <div class="u-switch">${UNIVERS_IDS.filter((x) => x !== id).map((x) => `<a href="#/univers/${x}">→ Univers ${esc(DATA.univers[x].name)}</a>`).join("")}</div>
      </div></section>`;
    mountScenes();
  }

  let shopState = { u: "all", q: "", sort: "default" };
  function pageShop() {
    app.innerHTML = `<section class="section"><div class="container">
      <div class="section-title"><div><h2>Boutique</h2><p>Tous les vêtements SKX.</p></div></div>
      <div class="toolbar">
        <button class="chip" data-u="all">Tout</button>
        ${UNIVERS_IDS.map((u) => `<button class="chip" data-u="${u}">${esc(DATA.univers[u].name)}</button>`).join("")}
        <span class="grow"></span>
        <input type="search" id="shopQ" placeholder="Rechercher…" value="${esc(shopState.q)}">
        <select id="shopSort">
          <option value="default">Tri : sélection</option>
          <option value="asc">Prix croissant</option>
          <option value="desc">Prix décroissant</option>
          <option value="name">Nom A→Z</option>
        </select>
      </div>
      <div id="shopGrid"></div>
    </div></section>`;
    $("#shopSort").value = shopState.sort;
    const render = () => {
      $$(".chip", app).forEach((c) => c.classList.toggle("active", c.dataset.u === shopState.u));
      const q = shopState.q.trim().toLowerCase();
      let list = DATA.products.filter((p) => (shopState.u === "all" || p.univers === shopState.u) &&
        (!q || (p.name + " " + p.description + " " + (TYPES[p.type] || "")).toLowerCase().includes(q)));
      if (shopState.sort === "asc") list.sort((a, b) => a.price - b.price);
      if (shopState.sort === "desc") list.sort((a, b) => b.price - a.price);
      if (shopState.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
      $("#shopGrid").innerHTML = grid(list);
    };
    $(".toolbar", app).addEventListener("click", (e) => { const c = e.target.closest(".chip"); if (c) { shopState.u = c.dataset.u; render(); } });
    $("#shopQ").addEventListener("input", (e) => { shopState.q = e.target.value; render(); });
    $("#shopSort").addEventListener("change", (e) => { shopState.sort = e.target.value; render(); });
    render();
  }

  function pageInfos() {
    const s = S();
    app.innerHTML = `<section class="section"><div class="container prose">
      <h2>Livraison</h2>
      <p>Expédition sous 48 h ouvrées. Livraison à ${money(s.shippingPrice)}, offerte dès ${money(s.freeShippingFrom)} d'achat.</p>
      <h2>Retours</h2>
      <p>Tu as 30 jours pour changer d'avis. Les articles doivent être neufs, non portés, avec leurs étiquettes.${s.contactEmail ? ` Écris-nous à <a href="mailto:${esc(s.contactEmail)}" style="text-decoration:underline">${esc(s.contactEmail)}</a>.` : ""}</p>
      <h2>Guide des tailles</h2>
      <table><tr><th>Taille</th><th>Poitrine (cm)</th><th>Taille (cm)</th><th>Longueur (cm)</th></tr>
        <tr><td>XS</td><td>86–90</td><td>72–76</td><td>66</td></tr>
        <tr><td>S</td><td>90–96</td><td>76–82</td><td>69</td></tr>
        <tr><td>M</td><td>96–102</td><td>82–88</td><td>72</td></tr>
        <tr><td>L</td><td>102–108</td><td>88–94</td><td>74</td></tr>
        <tr><td>XL</td><td>108–116</td><td>94–102</td><td>76</td></tr>
        <tr><td>XXL</td><td>116–124</td><td>102–110</td><td>78</td></tr></table>
      <p class="muted">Nos coupes sont plutôt oversize : prends ta taille habituelle pour un style ample, une taille en dessous pour un style ajusté.</p>
    </div></section>`;
  }

  function pageNotFound() {
    app.innerHTML = `<section class="section"><div class="container empty"><h2 class="gothic" style="font-size:60px;margin:0">404</h2><p>Cette page s'est perdue dans le brouillard.</p><a class="btn" href="#/">Retour à l'accueil</a></div></section>`;
  }

  /* ================= ADMIN ================= */
  let adminTab = "dashboard";
  const isAdmin = () => session.get("skx_admin") === "1";

  function pageAdmin() {
    if (!isAdmin()) {
      app.innerHTML = `<div class="container"><div class="admin-login">
        <img src="assets/logo-skx-small.png" alt="SKX">
        <h2 style="margin:0 0 6px">Espace admin</h2>
        <p class="muted" style="margin:0 0 18px">Accès réservé au propriétaire de la boutique.</p>
        <form class="form" id="loginForm"><input type="password" id="pwd" placeholder="Mot de passe" autocomplete="current-password" required><button class="btn btn-block">Entrer</button></form>
      </div></div>`;
      $("#loginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const pwd = $("#pwd").value;
        const ok = S().adminPasswordHash ? hash(pwd) === S().adminPasswordHash : pwd === DEFAULT_PASSWORD;
        if (ok) { session.set("skx_admin", "1"); pageAdmin(); toast("Bienvenue dans ton espace SKX 👑"); }
        else { toast("Mot de passe incorrect"); $("#pwd").select(); }
      });
      return;
    }
    const tabs = { dashboard: "Tableau de bord", products: "Produits", univers: "Univers", radio: "Radio", settings: "Réglages", orders: "Commandes" };
    app.innerHTML = `<div class="container admin">
      <div class="admin-head"><h1>Admin ${esc(S().shopName)}</h1>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-ghost btn-sm" href="#/">Voir le site</a><button class="btn btn-ghost btn-sm" id="logout">Déconnexion</button></div></div>
      <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="tab ${k === adminTab ? "active" : ""}" data-tab="${k}">${v}</button>`).join("")}</div>
      <div id="adminBody"></div>
    </div>`;
    $(".tabs", app).addEventListener("click", (e) => { const t = e.target.closest("[data-tab]"); if (t) { adminTab = t.dataset.tab; pageAdmin(); } });
    $("#logout").addEventListener("click", () => { session.del("skx_admin"); location.hash = "#/"; });
    ({ dashboard: adminDashboard, products: adminProducts, univers: adminUnivers, radio: adminRadio, settings: adminSettings, orders: adminOrders })[adminTab]($("#adminBody"));
  }

  function publishNotice() {
    return draft ? `<div class="notice">✏️ Tu as des modifications <b>non publiées</b>. Elles sont visibles uniquement sur ce navigateur.
      Pour les mettre en ligne pour tout le monde : <b>Tableau de bord → Publier</b>.</div>` : "";
  }

  function adminDashboard(el) {
    const P = DATA.products;
    const stock = P.reduce((a, p) => a + (+p.stock || 0), 0);
    const value = P.reduce((a, p) => a + (+p.stock || 0) * (+p.price || 0), 0);
    const out = P.filter((p) => (+p.stock || 0) <= 0).length;
    el.innerHTML = `${publishNotice()}
      <div class="stats">
        <div class="stat"><b>${P.length}</b><span>produits</span></div>
        <div class="stat"><b>${stock}</b><span>pièces en stock</span></div>
        <div class="stat"><b>${money(value)}</b><span>valeur du stock</span></div>
        <div class="stat"><b>${out}</b><span>en rupture</span></div>
      </div>
      <div class="panel"><h3>🚀 Publier le site</h3>
        <p class="muted">Le site est un site statique : tes changements sont d'abord enregistrés dans ce navigateur (brouillon).
        Pour que <b>tous les visiteurs</b> les voient, télécharge le fichier <code>boutique-data.js</code> et remplace celui du dossier <code>js/</code> de ton site (sur GitHub : « Add file → Upload files » dans le dossier <code>js</code>).</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn" id="publish">⬇️ Publier → télécharger boutique-data.js</button>
          <label class="btn btn-ghost" style="cursor:pointer">⬆️ Importer un fichier<input type="file" id="importFile" accept=".js,.json" hidden></label>
          ${draft ? `<button class="btn btn-ghost" id="discard">↺ Annuler le brouillon</button>` : ""}
        </div>
      </div>
      <div class="panel"><h3>Raccourcis</h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" data-go="products">+ Ajouter un produit</button>
          <button class="btn btn-ghost btn-sm" data-go="radio">📻 Changer la radio</button>
          <button class="btn btn-ghost btn-sm" data-go="settings">🔑 Changer le mot de passe</button>
        </div>
      </div>`;
    $("#publish").addEventListener("click", () => {
      const out = clone(DATA);
      const content = `/*\n * SKX — données publiées de la boutique.\n * Généré depuis l'espace admin le ${new Date().toLocaleString("fr-FR")}.\n */\nwindow.SKX_DATA = ${JSON.stringify(out, null, 2)};\n`;
      download("boutique-data.js", content, "text/javascript");
      toast("Fichier téléchargé ! Remplace js/boutique-data.js sur ton site.");
    });
    $("#importFile").addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        let txt = await f.text();
        txt = txt.replace(/^[\s\S]*?window\.SKX_DATA\s*=\s*/, "").replace(/;\s*$/, "");
        DATA = normalize(JSON.parse(txt)); saveDraft(); pageAdmin(); toast("Données importées ✔");
      } catch { toast("Fichier invalide"); }
    });
    const d = $("#discard");
    if (d) d.addEventListener("click", () => {
      if (!confirm("Supprimer toutes les modifications non publiées ?")) return;
      store.del("skx_draft"); draft = null; DATA = normalize(clone(PUBLISHED)); applySettings(); radio.reload(); pageAdmin();
    });
    $$("[data-go]", el).forEach((b) => b.addEventListener("click", () => { adminTab = b.dataset.go; pageAdmin(); if (adminTab === "products") editProduct(null); }));
  }

  function download(name, content, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function adminProducts(el) {
    el.innerHTML = `${publishNotice()}
      <div class="toolbar"><button class="btn" id="newProduct">+ Nouveau produit</button><span class="grow"></span>
        <select id="admFilter"><option value="all">Tous les univers</option>${UNIVERS_IDS.map((u) => `<option value="${u}">${esc(DATA.univers[u].name)}</option>`).join("")}</select></div>
      <div class="panel table-wrap" style="padding:8px 14px"><table class="table">
        <thead><tr><th></th><th>Produit</th><th>Univers</th><th>Prix</th><th>Stock</th><th>Vedette</th><th></th></tr></thead>
        <tbody id="admRows"></tbody></table></div>`;
    const rows = () => {
      const f = $("#admFilter").value;
      $("#admRows").innerHTML = DATA.products.filter((p) => f === "all" || p.univers === f).map((p) => `<tr>
        <td><div class="thumb">${productVisual(p)}</div></td>
        <td><b>${esc(p.name)}</b><div class="muted" style="font-size:12px">${esc(TYPES[p.type] || p.type)} · ${esc((p.sizes || []).join(", "))}</div></td>
        <td><span class="badge badge-${p.univers}" style="position:static">${esc(DATA.univers[p.univers]?.name || p.univers)}</span></td>
        <td>${money(p.price)}</td>
        <td><input class="input" type="number" min="0" value="${+p.stock || 0}" data-stock="${esc(p.id)}" style="width:80px;padding:6px 8px"></td>
        <td><input type="checkbox" ${p.featured ? "checked" : ""} data-feat="${esc(p.id)}"></td>
        <td><div class="actions"><button class="btn btn-ghost btn-sm" data-edit="${esc(p.id)}">Modifier</button><button class="btn btn-ghost btn-sm" data-dup="${esc(p.id)}" title="Dupliquer">⧉</button><button class="btn btn-danger btn-sm" data-del="${esc(p.id)}" title="Supprimer">🗑</button></div></td>
      </tr>`).join("") || `<tr><td colspan="7" class="muted">Aucun produit.</td></tr>`;
    };
    rows();
    $("#admFilter").addEventListener("change", rows);
    $("#newProduct").addEventListener("click", () => editProduct(null));
    el.addEventListener("click", (e) => {
      const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]"), dup = e.target.closest("[data-dup]");
      if (ed) editProduct(ed.dataset.edit);
      if (dup) { const p = clone(productById(dup.dataset.dup)); p.id = "p-" + Date.now().toString(36); p.name += " (copie)"; DATA.products.push(p); saveDraft(); pageAdmin(); }
      if (del) {
        const p = productById(del.dataset.del);
        if (confirm(`Supprimer « ${p.name} » ?`)) { DATA.products = DATA.products.filter((x) => x !== p); saveDraft(); saveCart(); pageAdmin(); toast("Produit supprimé"); }
      }
    });
    el.addEventListener("change", (e) => {
      const st = e.target.closest("[data-stock]"), ft = e.target.closest("[data-feat]");
      if (st) { productById(st.dataset.stock).stock = Math.max(0, +st.value || 0); saveDraft(); toast("Stock mis à jour"); }
      if (ft) { productById(ft.dataset.feat).featured = ft.checked; saveDraft(); }
    });
  }

  function editProduct(id) {
    const existing = id ? productById(id) : null;
    const p = existing ? clone(existing) : { id: "p-" + Date.now().toString(36), name: "", univers: "montagne", type: "tshirt", color: "#ffffff", price: 35, oldPrice: null, sizes: ["S", "M", "L", "XL"], stock: 10, image: "", featured: false, description: "" };
    openModal(`<div style="padding:28px">
      <h2 style="margin:0 0 16px">${existing ? "Modifier le produit" : "Nouveau produit"}</h2>
      <form class="form" id="pForm">
        <label>Nom<input name="name" required value="${esc(p.name)}"></label>
        <div class="row">
          <label>Univers<select name="univers">${UNIVERS_IDS.map((u) => `<option value="${u}" ${u === p.univers ? "selected" : ""}>${esc(DATA.univers[u].name)}</option>`).join("")}</select></label>
          <label>Type<select name="type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${k === p.type ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        </div>
        <div class="row">
          <label>Prix (€)<input name="price" type="number" step="0.01" min="0" required value="${+p.price}"></label>
          <label>Ancien prix (€) <span class="hint">pour afficher une promo</span><input name="oldPrice" type="number" step="0.01" min="0" value="${p.oldPrice ?? ""}"></label>
        </div>
        <div class="row">
          <label>Tailles <span class="hint">séparées par des virgules</span><input name="sizes" value="${esc((p.sizes || []).join(", "))}"></label>
          <label>Stock<input name="stock" type="number" min="0" value="${+p.stock || 0}"></label>
        </div>
        <label>Description<textarea name="description">${esc(p.description)}</textarea></label>
        <div class="row" style="align-items:start">
          <div class="form">
            <label>Photo : lien (URL ou chemin <code>assets/…</code>)<input name="image" id="pImg" value="${esc(p.image && p.image.startsWith("data:") ? "" : p.image)}" placeholder="https://… ou assets/produits/hoodie.jpg"></label>
            <label class="btn btn-ghost btn-sm" style="cursor:pointer;display:inline-flex">📷 Importer une photo<input type="file" id="pFile" accept="image/*" hidden></label>
            <label>Couleur (visuel auto si pas de photo)<input name="color" type="color" value="${esc(p.color || "#ffffff")}" style="height:44px;padding:4px"></label>
            <label class="check"><input type="checkbox" name="featured" ${p.featured ? "checked" : ""}> Mettre en avant sur l'accueil</label>
          </div>
          <div><div class="img-preview" id="pPrev"></div><button type="button" class="btn btn-ghost btn-sm" id="pClearImg" style="margin-top:8px">Retirer la photo</button></div>
        </div>
        <button class="btn btn-block">${existing ? "Enregistrer" : "Ajouter le produit"}</button>
      </form>
    </div>`, false);
    const form = $("#pForm");
    const read = () => {
      const f = Object.fromEntries(new FormData(form));
      p.name = f.name.trim(); p.univers = f.univers; p.type = f.type; p.color = f.color;
      p.price = Math.max(0, +f.price || 0); p.oldPrice = f.oldPrice ? +f.oldPrice : null;
      p.sizes = f.sizes.split(",").map((s) => s.trim()).filter(Boolean); if (!p.sizes.length) p.sizes = ["Unique"];
      p.stock = Math.max(0, parseInt(f.stock) || 0); p.description = f.description.trim(); p.featured = !!f.featured;
      if (f.image.trim()) p.image = f.image.trim(); else if (!(p.image || "").startsWith("data:")) p.image = "";
    };
    const preview = () => { read(); $("#pPrev").innerHTML = productVisual(p); };
    form.addEventListener("input", preview);
    preview();
    $("#pClearImg").addEventListener("click", () => { p.image = ""; $("#pImg").value = ""; $("#pPrev").innerHTML = productVisual(p); });
    $("#pFile").addEventListener("change", async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { p.image = await resizeImage(file, 900); $("#pImg").value = ""; $("#pPrev").innerHTML = productVisual(p); toast("Photo importée ✔"); }
      catch { toast("Impossible de lire cette image"); }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault(); read();
      if (existing) Object.assign(existing, p); else DATA.products.unshift(p);
      saveDraft(); closeModal(); adminTab = "products"; pageAdmin(); toast(existing ? "Produit modifié ✔" : "Produit ajouté ✔");
    });
  }

  function resizeImage(file, max) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src); res(c.toDataURL("image/jpeg", .82));
      };
      img.onerror = rej; img.src = URL.createObjectURL(file);
    });
  }

  function adminUnivers(el) {
    el.innerHTML = publishNotice() + UNIVERS_IDS.map((u) => {
      const x = DATA.univers[u];
      return `<div class="panel"><h3><span class="badge badge-${u}" style="position:static">${u}</span></h3>
        <form class="form" data-uform="${u}">
          <div class="row"><label>Nom affiché<input name="name" value="${esc(x.name)}"></label><label>Accroche<input name="tagline" value="${esc(x.tagline)}"></label></div>
          <label>Description<textarea name="description">${esc(x.description)}</textarea></label>
          <button class="btn btn-sm" style="justify-self:start">Enregistrer</button>
        </form></div>`;
    }).join("");
    $$("[data-uform]", el).forEach((f) => f.addEventListener("submit", (e) => {
      e.preventDefault(); Object.assign(DATA.univers[f.dataset.uform], Object.fromEntries(new FormData(f))); saveDraft(); toast("Univers enregistré ✔"); pageAdmin();
    }));
  }

  function adminRadio(el) {
    el.innerHTML = `${publishNotice()}
      <div class="notice info">📻 La première station de la liste est celle jouée par défaut. Un flux doit être une adresse audio directe (MP3/AAC), en <b>https</b>. Tu peux mettre plusieurs adresses (une par ligne) : si la première ne marche pas, la suivante est essayée.</div>
      <div class="panel"><h3>Stations</h3><div id="stations"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
          <button class="btn btn-ghost btn-sm" id="addStation">+ Ajouter une station</button>
          <button class="btn btn-sm" id="saveStations">Enregistrer</button>
        </div></div>`;
    const list = clone(DATA.stations);
    const render = () => {
      $("#stations").innerHTML = list.map((s, i) => `<div class="station-row form" data-i="${i}">
        <input class="input" data-k="name" value="${esc(s.name)}" placeholder="Nom">
        <textarea class="input" data-k="urls" placeholder="https://…">${esc((s.urls || []).join("\n"))}</textarea>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" data-act="test" title="Écouter">▶</button>
          <button class="btn btn-ghost btn-sm" data-act="up" title="Monter" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="btn btn-danger btn-sm" data-act="del" title="Supprimer" ${list.length < 2 ? "disabled" : ""}>🗑</button>
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
      if (!clean.length) { toast("Il faut au moins une station avec une adresse"); return; }
      DATA.stations = clean; saveDraft(); radio.reload(); toast("Radio enregistrée ✔"); pageAdmin();
    });
  }

  function adminSettings(el) {
    const s = S();
    el.innerHTML = `${publishNotice()}
      <div class="panel"><h3>Boutique</h3><form class="form" id="setForm">
        <div class="row"><label>Nom de la boutique<input name="shopName" value="${esc(s.shopName)}"></label><label>Slogan<input name="slogan" value="${esc(s.slogan)}"></label></div>
        <label>Bandeau d'annonce (en haut du site)<input name="announcement" value="${esc(s.announcement)}"></label>
        <div class="row"><label>Email de contact (reçoit les commandes)<input type="email" name="contactEmail" value="${esc(s.contactEmail)}"></label>
          <label>Lien de paiement <span class="hint">Stripe Payment Link, PayPal.me, SumUp…</span><input name="paymentLink" value="${esc(s.paymentLink)}" placeholder="https://"></label></div>
        <label>Adresse de réception des commandes <span class="hint">optionnel — ex. un formulaire Formspree (https://formspree.io/f/xxxx). Sinon, le client envoie sa commande par email.</span><input name="orderEndpoint" value="${esc(s.orderEndpoint)}" placeholder="https://formspree.io/f/…"></label>
        <div class="row"><label>Livraison offerte dès (€)<input type="number" step="0.01" name="freeShippingFrom" value="${+s.freeShippingFrom}"></label><label>Prix de la livraison (€)<input type="number" step="0.01" name="shippingPrice" value="${+s.shippingPrice}"></label></div>
        <button class="btn btn-sm" style="justify-self:start">Enregistrer</button>
      </form></div>
      <div class="panel"><h3>🔑 Mot de passe admin</h3>
        <p class="muted" style="margin-top:0">Mot de passe par défaut : <code>${DEFAULT_PASSWORD}</code> — change-le puis publie le site.</p>
        <form class="form" id="pwdForm">
          <div class="row"><label>Nouveau mot de passe<input type="password" name="p1" minlength="6" required autocomplete="new-password"></label><label>Confirmer<input type="password" name="p2" minlength="6" required autocomplete="new-password"></label></div>
          <button class="btn btn-sm" style="justify-self:start">Changer le mot de passe</button>
        </form></div>`;
    $("#setForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      f.freeShippingFrom = +f.freeShippingFrom || 0; f.shippingPrice = +f.shippingPrice || 0;
      Object.assign(DATA.settings, f); saveDraft(); toast("Réglages enregistrés ✔"); pageAdmin();
    });
    $("#pwdForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      if (f.p1 !== f.p2) { toast("Les deux mots de passe ne correspondent pas"); return; }
      DATA.settings.adminPasswordHash = hash(f.p1); saveDraft(); toast("Mot de passe changé ✔ — pense à publier"); pageAdmin();
    });
  }

  function adminOrders(el) {
    const orders = store.get("skx_orders", []);
    el.innerHTML = `<div class="notice info">ℹ️ Les commandes des clients te parviennent <b>par email</b> (ou via l'adresse Formspree réglée dans « Réglages »).
      Cette liste ne montre que les commandes passées <b>depuis ce navigateur</b> (pratique pour tester).</div>
      <div class="panel table-wrap" style="padding:8px 14px"><table class="table">
        <thead><tr><th>Réf.</th><th>Date</th><th>Client</th><th>Articles</th><th>Total</th></tr></thead>
        <tbody>${orders.map((o) => `<tr><td><b>${esc(o.ref)}</b></td><td>${new Date(o.date).toLocaleString("fr-FR")}</td>
          <td>${esc(o.customer.prenom)} ${esc(o.customer.nom)}<div class="muted" style="font-size:12px">${esc(o.customer.email)}</div></td>
          <td>${o.items.map((i) => `${esc(i.name)} (${esc(i.size)}) ×${i.qty}`).join("<br>")}</td><td><b>${money(o.total)}</b></td></tr>`).join("") || `<tr><td colspan="5" class="muted">Aucune commande.</td></tr>`}</tbody>
      </table></div>
      ${orders.length ? `<button class="btn btn-ghost btn-sm" id="clearOrders">Vider la liste</button>` : ""}`;
    const c = $("#clearOrders");
    if (c) c.addEventListener("click", () => { if (confirm("Vider la liste des commandes de test ?")) { store.del("skx_orders"); pageAdmin(); } });
  }

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
      prefs.volume = v; audio.volume = v / 100; vol.value = v; volVal.textContent = v + "%";
      vol.style.background = "";
      if (v > 0 && prefs.muted) setMuted(false);
      savePrefs();
    }
    function setMuted(m) { prefs.muted = m; audio.muted = m; box.classList.toggle("muted", m); savePrefs(); }

    function play(station) {
      if (station) current = station;
      if (!current || !current.urls || !current.urls.length) { setStatus("Aucune station", ""); return; }
      if (!station) urlIdx = urlIdx % current.urls.length;
      audio.src = current.urls[urlIdx];
      setStatus("Connexion…", "loading");
      const pr = audio.play();
      if (pr) pr.catch((err) => {
        if (err.name === "NotAllowedError") { setStatus("Clique sur ▶", ""); playing = false; }
      });
      playing = true;
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: current.name, artist: S().shopName + " Radio", artwork: [{ src: "assets/favicon.png", sizes: "256x256", type: "image/png" }] });
      }
    }
    function stop() {
      playing = false;
      audio.pause();
      audio.removeAttribute("src"); audio.load(); // coupe le flux pour reprendre en direct
      setStatus("En pause", "");
    }
    function toggle() {
      if (playing) { stop(); prefs.want = false; } else { urlIdx = 0; play(); prefs.want = true; }
      savePrefs();
    }

    audio.addEventListener("playing", () => setStatus("En direct", "playing"));
    audio.addEventListener("waiting", () => { if (playing) setStatus("Chargement…", "loading"); });
    audio.addEventListener("error", () => {
      if (!playing || !audio.getAttribute("src")) return;
      urlIdx++;
      if (current && urlIdx < current.urls.length) play();
      else { playing = false; urlIdx = 0; setStatus("Flux indisponible", ""); toast("La radio ne répond pas, réessaie dans un instant."); }
    });

    $("#radioPlay").addEventListener("click", toggle);
    $("#radioMute").addEventListener("click", () => setMuted(!prefs.muted));
    $("#volDown").addEventListener("click", () => setVolume(prefs.volume - 10));
    $("#volUp").addEventListener("click", () => setVolume(prefs.volume + 10));
    vol.addEventListener("input", () => setVolume(+vol.value));
    sel.addEventListener("change", () => {
      prefs.station = +sel.value; current = DATA.stations[prefs.station]; urlIdx = 0; savePrefs();
      play(); prefs.want = true; savePrefs();
    });
    $("#radioHide").addEventListener("click", () => { prefs.mini = !prefs.mini; box.classList.toggle("mini", prefs.mini); savePrefs(); });
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => { if (!playing) toggle(); });
      navigator.mediaSession.setActionHandler("pause", () => { if (playing) toggle(); });
    }

    // Les navigateurs bloquent la lecture automatique : la radio démarre au premier clic sur la page.
    const autoStart = (e) => {
      document.removeEventListener("pointerdown", autoStart, true);
      document.removeEventListener("keydown", autoStart, true);
      if (e.target.closest && e.target.closest("#radio")) return;
      if (prefs.want && !playing) { urlIdx = 0; play(); }
    };
    document.addEventListener("pointerdown", autoStart, true);
    document.addEventListener("keydown", autoStart, true);

    fill(); setVolume(prefs.volume); setMuted(prefs.muted); box.classList.toggle("mini", prefs.mini);
    setStatus(prefs.want ? "Radio · clique pour écouter" : "En pause", "");

    return {
      reload() { const was = playing; if (was) stop(); fill(); if (was) play(); },
      playStation(s) { urlIdx = 0; play(clone(s)); toast("Test : " + s.name); }
    };
  })();

  /* ================= ROUTEUR ================= */
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    if (h === "univers") return; // ancre interne de l'accueil
    window.SKXWeather.destroyAll();
    document.body.dataset.univers = "";
    closeModal();
    const [page, arg] = h.split("/");
    $$("#nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === (page === "univers" ? arg : page || "home")));
    if (!page) pageHome();
    else if (page === "univers") pageUnivers(arg);
    else if (page === "boutique") pageShop();
    else if (page === "infos") pageInfos();
    else if (page === "admin") pageAdmin();
    else pageNotFound();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  // Ancre « Les 4 univers » sur l'accueil
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href="#univers"]'); if (!a) return;
    e.preventDefault(); $("#univers")?.scrollIntoView({ behavior: "smooth" });
  });

  applySettings();
  renderCart();
  route();
})();
