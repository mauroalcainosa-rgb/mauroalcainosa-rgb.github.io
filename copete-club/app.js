/* Copete Club — versión interactiva de revisión (todo corre en el navegador). */
(() => {
"use strict";

// ───────────── utilidades ─────────────
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fold = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const store = {
  get(k, d) { try { const v = localStorage.getItem("wcc-" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("wcc-" + k, JSON.stringify(v)); } catch {} },
};
const CLP = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) => new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric" }).format(d);

// Versión app (Android / Google Play): sin compras dentro de la app.
const APP = (() => { try { if (new URLSearchParams(location.search).get("src") === "twa" || document.referrer.startsWith("android-app://")) sessionStorage.setItem("cc-app", "1"); return sessionStorage.getItem("cc-app") === "1"; } catch { return false; } })();
let DATA, WORLD;
const S = {
  country: store.get("country", "CL"),
  fav: new Set(store.get("fav", [])),
  pending: new Set(store.get("pending", [])),
  history: store.get("history", {}), // slug -> {n, last}
  ratings: store.get("ratings", {}), // slug -> {stars, note}
  cols: store.get("cols", []), // {id,name,items:[]}
  home: new Set(store.get("home", [])),
  shop: store.get("shop", []), // {id,name,checked}
  recipes: store.get("recipes", []),
  filters: {},
  chat: [],
};
const save = () => {
  store.set("fav", [...S.fav]); store.set("pending", [...S.pending]); store.set("history", S.history);
  store.set("ratings", S.ratings); store.set("cols", S.cols); store.set("home", [...S.home]);
  store.set("shop", S.shop); store.set("recipes", S.recipes); store.set("country", S.country);
};
const uid = () => Math.random().toString(36).slice(2, 10);

const CONTINENTS = [
  ["america_norte", "América del Norte"], ["america_central_caribe", "América Central y Caribe"], ["america_sur", "América del Sur"],
  ["europa", "Europa"], ["africa", "África"], ["asia", "Asia"], ["oceania", "Oceanía"],
];
const KIND = { original: "Receta original", variacion_tradicional: "Variación tradicional", adaptacion_moderna: "Adaptación moderna", creacion_club: "Creación original del club", comunidad: "Creación de la comunidad" };
const DIFF = ["", "Fácil", "Media", "Avanzada"];
const METHOD = (k) => DATA.methods?.find((m) => m.key === k);
const AXES = [["flavor_sweet", "Dulce"], ["flavor_sour", "Ácido"], ["flavor_bitter", "Amargo"], ["flavor_dry", "Seco"], ["flavor_fruity", "Frutal"], ["flavor_spicy", "Especiado"], ["flavor_strength", "Intensidad"]];
const OCC = { aperitivo: "Aperitivo", cena: "Cena", sobremesa: "Sobremesa", brunch: "Brunch", fiesta: "Fiesta", celebracion: "Celebración", tarde: "Tarde", noche: "Noche", verano: "Verano", invierno: "Invierno" };
const SEAS = { verano: "Verano", otono: "Otoño", invierno: "Invierno", primavera: "Primavera", "todo-el-ano": "Todo el año" };
const SPIRITS = { gin: "Gin", vodka: "Vodka", "ron-blanco": "Ron blanco", "ron-oscuro": "Ron oscuro", "ron-jamaicano": "Ron jamaicano", tequila: "Tequila", mezcal: "Mezcal", pisco: "Pisco", cachaca: "Cachaça", bourbon: "Bourbon", rye: "Rye", "whisky-escoces": "Whisky escocés", "whisky-japones": "Whisky japonés", "whiskey-irlandes": "Whiskey irlandés", cognac: "Cognac / brandy", "vino-tinto": "Vino tinto", "vino-blanco": "Vino blanco", prosecco: "Prosecco", espumante: "Espumante", campari: "Bitter", fernet: "Fernet", aguardiente: "Aguardiente" };

const country = (c) => DATA.countries.find((x) => x.code === c);
const cocktail = (s) => DATA.cocktails.find((x) => x.slug === s);
const ingName = (s) => DATA.ingredients.find((i) => i.slug === s)?.name ?? s;

// ───────────── ilustración de neón ─────────────
const SHAPES = {
  coupe: ["M18 46 Q60 98 102 46 M18 46 L102 46 M60 84 L60 138 M38 140 Q60 133 82 140", "M21 49 Q60 95 99 49 Z", 50, [96, 44]],
  martini: ["M16 34 L60 88 L104 34 Z M60 88 L60 138 M38 140 Q60 133 82 140", "M20 37 L60 85 L100 37 Z", 42, [100, 32]],
  flute: ["M46 16 Q42 74 60 96 Q78 74 74 16 Z M60 96 L60 140 M44 142 Q60 136 76 142", "M48.5 19 Q45.5 72 60 92 Q74.5 72 71.5 19 Z", 30, [72, 14]],
  rocks: ["M28 66 L33 142 L87 142 L92 66", "M31 69 L35.5 139 L84.5 139 L89 69 Z", 84, [90, 64]],
  highball: ["M36 22 L40 146 L80 146 L84 22", "M39 25 L42.5 143 L77.5 143 L81 25 Z", 40, [82, 20]],
  wine: ["M28 26 Q22 92 60 100 Q98 92 92 26 M60 100 L60 140 M40 142 Q60 135 80 142", "M31 29 Q26 89 60 96.5 Q94 89 89 29 Z", 48, [90, 24]],
  mug: ["M30 50 L32 140 L84 140 L86 50 M86 68 Q104 70 102 94 Q100 116 85 118", "M33 53 L35 137 L81 137 L83 53 Z", 62, [84, 48]],
  hurricane: ["M42 18 Q34 54 46 80 Q30 108 44 136 L76 136 Q90 108 74 80 Q86 54 78 18 M48 140 L72 140", "M45 21 Q37.5 54 49 80 Q33.5 107 46.5 133 L73.5 133 Q86.5 107 71 80 Q82.5 54 75 21 Z", 34, [76, 16]],
  pitcher: ["M30 30 L26 140 L90 140 L86 30 L96 22 M86 52 Q106 60 102 92 Q98 112 88 116", "M33 34 L29.5 137 L86.5 137 L83 34 Z", 54, [84, 28]],
  clay: ["M24 60 Q22 132 60 136 Q98 132 96 60 Z M30 60 Q60 52 90 60", "M27 63 Q26 129 60 133 Q94 129 93 63 Z", 72, [92, 58]],
};
function glassKind(glass) {
  const g = fold(glass);
  if (g.includes("coupe")) return "coupe";
  if (g.includes("martini") || g.includes("margarita")) return "martini";
  if (g.includes("flauta")) return "flute";
  if (g.includes("hurricane")) return "hurricane";
  if (/cobre|taza|tarro|cerveza/.test(g)) return "mug";
  if (/barro|greda|cuenco/.test(g)) return "clay";
  if (g.startsWith("jarra")) return "pitcher";
  if (/old fashioned|corto|pequeno|julep/.test(g)) return "rocks";
  if (/highball|collins|alto|zombie|medio litro/.test(g)) return "highball";
  if (/vino|balon|copa/.test(g)) return "wine";
  return "rocks";
}
function neonColor(hex) {
  const n = parseInt(hex.replace("#", ""), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, sat = Math.max(r, g, b) - Math.min(r, g, b);
  if (lum < 0.28) return "#b98cff";
  if (lum > 0.86 && sat < 40) return "#22e5d4";
  return hex;
}
let gid = 0;
function glass(c, size = 140, cls = "") {
  const k = glassKind(c.glass), [outline, inner, level, [gx, gy]] = SHAPES[k], neon = neonColor(c.color), id = "g" + gid++;
  const gar = fold(c.garnish), ice = fold(c.ice);
  const hasIce = /cubo|hielo|picado|lanza/.test(ice) && !/sin hielo|se sirve sin/.test(ice) && ["rocks", "highball", "mug", "pitcher", "wine", "hurricane"].includes(k);
  const bubbles = /highball|espumante|spritz|fizz|cerveza/.test(fold(c.category)) || k === "flute";
  let g = "";
  if (/(limon|lima|naranja|pomelo)/.test(gar)) {
    const col = /naranja/.test(gar) ? "#ffa53a" : "#d7ff5a";
    g = `<g class="neon-line" style="--neon:${col}"><circle cx="${gx}" cy="${gy}" r="10" fill="none" stroke="${col}" stroke-width="2"/><path d="M${gx - 10} ${gy} L${gx + 10} ${gy} M${gx} ${gy - 10} L${gx} ${gy + 10} M${gx - 7} ${gy - 7} L${gx + 7} ${gy + 7} M${gx + 7} ${gy - 7} L${gx - 7} ${gy + 7}" stroke="${col}" stroke-width=".8"/></g>`;
  } else if (/cereza/.test(gar)) {
    g = `<g class="neon-line" style="--neon:#ff2b5a"><circle cx="${gx - 4}" cy="${gy + 4}" r="5.5" fill="#ff2b5a" fill-opacity=".5" stroke="#ff2b5a" stroke-width="1.8"/><path d="M${gx - 3} ${gy - 1} Q${gx + 2} ${gy - 14} ${gx + 9} ${gy - 16}" stroke="#ff2b5a" stroke-width="1.5" fill="none"/></g>`;
  } else if (/(menta|hierbabuena|apio|pepino)/.test(gar)) {
    g = `<g class="neon-line" style="--neon:#4dff9a"><path d="M${gx - 4} ${gy + 6} Q${gx - 14} ${gy - 8} ${gx - 2} ${gy - 16} Q${gx + 6} ${gy - 4} ${gx - 4} ${gy + 6} Z" fill="#4dff9a" fill-opacity=".3" stroke="#4dff9a" stroke-width="1.6"/><path d="M${gx} ${gy + 4} Q${gx + 12} ${gy - 6} ${gx + 8} ${gy - 18}" stroke="#4dff9a" stroke-width="1.6" fill="none"/></g>`;
  }
  return `<svg viewBox="0 0 120 160" width="${size}" height="${(size * 160) / 120}" role="img" aria-label="${esc(c.international_name)}" class="${cls}" style="--neon:${neon}">
  <defs><clipPath id="${id}c"><path d="${inner}"/></clipPath>
  <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.color}" stop-opacity=".95"/><stop offset="1" stop-color="${c.color}" stop-opacity=".55"/></linearGradient>
  <radialGradient id="${id}h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${neon}" stop-opacity=".28"/><stop offset="1" stop-color="${neon}" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="60" cy="96" rx="58" ry="62" fill="url(#${id}h)"/>
  <g clip-path="url(#${id}c)"><rect x="0" y="${level}" width="120" height="160" fill="url(#${id}l)"/>
  <path d="M0 ${level} Q30 ${level - 2.5} 60 ${level} T120 ${level}" stroke="#fff" stroke-opacity=".55" fill="none"/>
  ${hasIce ? `<g stroke="#fff" stroke-opacity=".5" stroke-width="1.2" fill="#fff" fill-opacity=".08"><rect x="44" y="${level + 6}" width="16" height="16" rx="3" transform="rotate(-8 52 ${level + 14})"/><rect x="60" y="${level + 14}" width="15" height="15" rx="3" transform="rotate(10 67 ${level + 21})"/>${k === "highball" ? `<rect x="48" y="${level + 34}" width="15" height="15" rx="3"/>` : ""}</g>` : ""}
  ${bubbles ? `<g fill="#fff" fill-opacity=".7"><circle cx="52" cy="${level + 30}" r="1.4"/><circle cx="66" cy="${level + 18}" r="1.1"/><circle cx="58" cy="${level + 44}" r="1"/><circle cx="70" cy="${level + 38}" r="1.3"/></g>` : ""}
  </g>
  <path d="${outline}" fill="none" stroke="${neon}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="neon-line"/>
  <path d="${outline}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/>${g}</svg>`;
}

// ───────────── íconos ─────────────
const ic = (d, cls = "h-5 w-5", fill = "none") => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true" fill="${fill}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  home: '<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  bar: '<path d="M5 4h14l-7 8z M12 12v7M8 20h8"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1-3.5 3.8-5 7-5s6 1.5 7 5"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
  star: '<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>',
};
// Marca Copete Club: una copa cuya silueta forma la "C", con la línea del líquido y una aceituna en su palillo.
const logo = (size = 34) => `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path class="neon-line" style="--neon:#ff2ba6" d="M50 18 A20 20 0 1 0 50 40" stroke="#ff5cbb" stroke-width="3.6"/>
  <path class="neon-line" style="--neon:#22e5d4" d="M17 27 Q31 33 45 27" stroke="#5ff3e6" stroke-width="2"/>
  <path class="neon-line" style="--neon:#b98cff" d="M32 49 L32 58 M24 59.5 Q32 56.5 40 59.5" stroke="#cfb0ff" stroke-width="3.2"/>
  <circle class="neon-line" style="--neon:#d8b46a" cx="51" cy="12" r="3.8" stroke="#f0d08a" stroke-width="2.2"/>
  <path class="neon-line" style="--neon:#d8b46a" d="M48.5 14.5 L44 22" stroke="#f0d08a" stroke-width="1.8"/></g></svg>`;
const wordmark = () => `<span class="inline-flex items-center gap-2">${logo(38)}<span class="flex flex-col leading-none"><span class="font-display text-[1.7rem] font-extrabold uppercase tracking-[.01em]">Copete</span><span class="font-ui text-[.72rem] font-semibold uppercase tracking-[.42em] text-gold">Club</span></span></span>`;

// ───────────── búsqueda ─────────────
function search(f = {}) {
  const fk = { dulce: "flavor_sweet", acido: "flavor_sour", amargo: "flavor_bitter", seco: "flavor_dry", frutal: "flavor_fruity", especiado: "flavor_spicy", intenso: "flavor_strength" };
  return DATA.cocktails.filter((c) => {
    const co = country(c.origin_country);
    if (f.q && !fold([c.international_name, c.original_name, c.origin_city, c.creator, c.category, co?.name, ...c.ingredient_slugs].join(" ")).includes(fold(f.q))) return false;
    if (f.country && c.origin_country !== f.country) return false;
    if (f.continent && co?.continent !== f.continent) return false;
    if (f.ing && !c.ingredient_slugs.includes(f.ing)) return false;
    if (f.spirit && !c.base_spirits.includes(f.spirit)) return false;
    if (f.flavor && c[fk[f.flavor]] < (f.flavor === "intenso" ? 4 : 3)) return false;
    const abv = c.abv_est ?? 0;
    if (f.abv === "suave" && abv > 12) return false;
    if (f.abv === "media" && (abv < 12 || abv > 20)) return false;
    if (f.abv === "alta" && abv < 20) return false;
    if (f.difficulty && c.difficulty !== +f.difficulty) return false;
    if (f.time && c.prep_minutes > +f.time) return false;
    if (f.occasion && !c.occasions.includes(f.occasion)) return false;
    if (f.season && !c.seasons.includes(f.season)) return false;
    if (f.era && c.era !== f.era) return false;
    if (f.method && c.prep_method !== f.method) return false;
    if (f.type === "mocktail" && !c.is_mocktail) return false;
    if (f.type === "alcohol" && c.is_mocktail) return false;
    return true;
  }).sort((a, b) => b.featured - a.featured || a.international_name.localeCompare(b.international_name));
}
const topNotes = (c) => AXES.slice(0, 6).map(([k, l]) => [l, c[k]]).sort((a, b) => b[1] - a[1]).slice(0, 2).filter((x) => x[1] > 0).map((x) => x[0].toLowerCase());
const dots = (n) => `<span class="inline-flex items-center gap-1" aria-label="Dificultad ${n} de 3">${[1, 2, 3].map((i) => `<span class="h-1.5 w-1.5 rounded-full ${i <= n ? "bg-fuchsia shadow-[0_0_6px_#ff2ba6]" : "bg-white/15"}"></span>`).join("")}</span>`;

function card(c, wide = false) {
  const co = country(c.origin_country), notes = topNotes(c);
  return `<a href="#c-${c.slug}" class="group surface relative flex flex-col overflow-hidden transition-[border-color,box-shadow] duration-300 hover:border-violet/60 hover:shadow-[0_0_40px_-12px_rgb(139_61_255/.7)] ${wide ? "w-[15.5rem] shrink-0" : ""}">
    <div class="relative flex h-44 items-end justify-center overflow-hidden">${glass(c, 112, "transition-transform duration-500 group-hover:-translate-y-1")}
    ${c.is_mocktail ? `<span class="absolute left-3 top-3 chip !border-turq/50 !text-turq">0,0 %</span>` : ""}${S.fav.has(c.slug) ? `<span class="absolute right-3 top-3 text-fuchsia">${ic(I.heart, "h-5 w-5", "currentColor")}</span>` : ""}</div>
    <div class="flex flex-1 flex-col gap-1.5 p-4 pt-3"><h3 class="font-display text-[1.6rem] font-bold leading-[.95]">${esc(c.international_name)}</h3>
    <p class="font-ui text-sm text-muted">${co?.flag ?? ""} ${esc(co?.name ?? "")}</p>
    <div class="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2 font-ui text-[.8rem] text-muted"><span class="inline-flex items-center gap-2">${dots(c.difficulty)}${DIFF[c.difficulty]}</span>${notes.length ? `<span class="text-turq/90">${notes.join(" y ")}</span>` : ""}</div></div></a>`;
}
const grid = (list) => `<div class="reveal grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">${list.map((c) => card(c)).join("")}</div>`;
const shelf = (title, list, href, note) => `<section class="flex flex-col gap-4"><div class="flex items-baseline justify-between gap-4"><div class="min-w-0"><h2 class="font-display text-[clamp(1.9rem,8.5vw,2.25rem)] font-bold uppercase leading-[.95] [overflow-wrap:anywhere]">${title}</h2>${note ? `<p class="font-ui text-sm text-muted">${note}</p>` : ""}</div>${href ? `<a href="${href}" class="shrink-0 font-ui text-sm text-turq hover:underline">Ver todos</a>` : ""}</div><div class="scroll-x reveal -mx-4 flex gap-3 px-4 pb-2 sm:-mx-6 sm:px-6">${list.map((c) => card(c, true)).join("")}</div></section>`;
const countrySelect = (label, id = "country-select") => `<label class="inline-flex items-center gap-2 font-ui text-sm text-muted"><span>${label}</span><select data-country id="${id}" class="rounded-full border border-white/15 bg-smoke px-3 py-1.5 font-ui text-sm text-white">
  <optgroup label="Mercados con Local Twist">${DATA.countries.filter((c) => c.is_market).map((c) => `<option value="${c.code}" ${c.code === S.country ? "selected" : ""}>${c.flag} ${esc(c.name)}</option>`).join("")}</optgroup>
  <optgroup label="Otros países">${DATA.countries.filter((c) => !c.is_market).map((c) => `<option value="${c.code}" ${c.code === S.country ? "selected" : ""}>${c.flag} ${esc(c.name)}</option>`).join("")}</optgroup></select></label>`;

// ───────────── vistas ─────────────
function cocktailOfDay() {
  const list = DATA.cocktails.filter((c) => !c.is_mocktail && c.history_status === "verificada");
  return list[Math.floor(Date.now() / 864e5) % list.length];
}
function recs() {
  const spirits = {};
  [...S.fav].forEach((s) => cocktail(s)?.base_spirits.forEach((x) => (spirits[x] = (spirits[x] || 0) + 1)));
  const top = Object.entries(spirits).sort((a, b) => b[1] - a[1])[0]?.[0];
  const pool = top ? search({ spirit: top }) : search({ country: S.country });
  return [...pool, ...search({})].filter((c, i, a) => !S.fav.has(c.slug) && a.findIndex((x) => x.slug === c.slug) === i).slice(0, 6);
}

function viewHome() {
  const t = cocktailOfDay(), me = country(S.country), tco = country(t.origin_country), neon = neonColor(t.color);
  const popular = search({}).filter((c) => !c.is_mocktail && c.featured).concat(search({ era: "clasico" })).filter((c, i, a) => a.indexOf(c) === i).slice(0, 10);
  return `<div class="flex flex-col gap-14">
  <section class="flex flex-col gap-3 pt-2 sm:flex-row sm:items-end sm:justify-between"><div>
    <p class="font-ui text-[.95rem] font-semibold uppercase tracking-[.14em] text-violet-soft">Bienvenido a tu club.</p>
    <p class="font-ui text-[.95rem] uppercase tracking-[.14em] text-muted">El mundo de la coctelería te espera</p></div>
    ${countrySelect(`Estás en ${me?.flag ?? ""}`)}</section>
  <section class="flex flex-col items-center gap-4 text-center"><h1 class="neon-sign text-[clamp(2.4rem,7vw,4.2rem)] uppercase" style="--neon:#ff2ba6">Descubre tu próximo cóctel</h1>
    <div id="wheel-inline" class="flex w-full max-w-md flex-col items-center gap-5" aria-label="Ruleta: descubre tu próximo cóctel"></div></section>
  <section class="flex flex-col gap-5"><p class="font-display text-[clamp(2rem,6vw,3.4rem)] font-extrabold uppercase leading-[.9]">The world is your bar.</p>
    <form data-home-search class="relative max-w-2xl" role="search"><label for="hq" class="sr-only">Buscar recetas</label><span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">${ic(I.search)}</span>
    <input id="hq" name="q" placeholder="Busca por nombre, país o ingrediente: negroni, Perú, pisco…" class="field !rounded-full !py-3.5 !pl-12"></form>
    <div class="flex flex-wrap gap-2">${[["#explore", "Buscar", I.search], ["#my-bar", "Favoritos", I.heart], [`#c-${t.slug}`, "Cóctel del día", I.clock], ...(APP ? [] : [["#suscripcion", "Mi suscripción", I.card]])].map(([h, l, i]) => `<a href="${h}" class="btn-ghost !py-2 !text-sm">${ic(i, "h-4 w-4")}${l}</a>`).join("")}</div></section>
  ${APP ? "" : `  <section class="surface flex flex-col gap-4 border-gold/30 p-6 sm:flex-row sm:items-center sm:justify-between"><div><p class="font-display text-3xl font-bold uppercase text-gold">7 días gratis</p>
    <p class="text-muted">Historias completas, recetas, Local Twist y el bartender con IA. Luego ${CLP(2990)} al mes; cancelas cuando quieras.</p></div><a href="#suscripcion" class="btn-neon shrink-0">Comenzar mi experiencia gratuita</a></section>`}
  ${shelf("Populares en el club", popular, "#explore")}
  ${shelf(`Para ti en ${esc(me?.name ?? "tu país")}`, recs(), null, S.fav.size ? "Según tus favoritos" : "Según tu país")}
  <section class="flex flex-col gap-4"><div class="flex items-baseline justify-between"><h2 class="font-display text-4xl font-bold uppercase">Explora por países</h2><a href="#world-tour" class="font-ui text-sm text-turq hover:underline">Abrir el mapa</a></div>
    <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">${DATA.countries.filter((c) => c.in_world_tour).map((c) => `<li><a href="#pais-${c.code.toLowerCase()}" class="flex items-center gap-3 rounded-xl border border-white/[.07] px-4 py-3 transition-colors hover:border-turq/60 hover:bg-turq/5"><span class="text-2xl">${c.flag}</span><span class="min-w-0 font-display text-xl font-semibold uppercase leading-none [overflow-wrap:anywhere]">${esc(c.name)}</span></a></li>`).join("")}</ul></section>
  <section class="surface relative overflow-hidden p-6 sm:p-8"><div class="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-violet/25 blur-3xl"></div><div class="relative flex flex-col gap-4">
    <h2 class="flex items-center gap-3 font-display text-[clamp(1.9rem,8.5vw,2.25rem)] font-bold uppercase"><span class="text-violet-soft">${ic(I.spark, "h-8 w-8")}</span>Mixology AI</h2>
    <p class="max-w-[52ch] text-muted">Dile al bartender qué tienes en casa o qué te provoca, y te propone un cóctel de la biblioteca con su receta y alternativas locales.</p>
    <form data-ask class="flex max-w-2xl flex-col gap-2 sm:flex-row"><input name="q" class="field !rounded-full" placeholder="Tengo ron, menta y azúcar. ¿Qué puedo hacer?"><button class="btn-neon shrink-0">Preguntar</button></form></div></section>
  ${shelf("Últimos descubrimientos", search({ era: "moderno" }).slice(0, 8), "#explore")}
  <section class="relative grid items-center gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
    <div class="flex flex-col gap-5"><p class="font-ui text-sm text-muted">Cóctel del día · ${esc(tco?.name)}</p>
      <h2 class="neon-sign ignite text-[clamp(2.6rem,8vw,5rem)] uppercase" style="--neon:${neon}">${esc(t.international_name)}</h2>
      <p class="prose-club max-w-[46ch] text-muted">${esc(t.summary)}</p>
      <a href="#c-${t.slug}" class="btn-ghost self-start">Ver la receta y su historia</a></div>
    <div class="relative flex justify-center"><div class="absolute inset-x-8 bottom-4 h-10 rounded-[50%] blur-2xl" style="background:${neon};opacity:.35"></div>${glass(t, 220, "relative h-auto w-36 sm:w-44 md:w-[220px]")}</div></section></div>`;
}

const FLAV = [["", "Cualquiera"], ["dulce", "Dulce"], ["acido", "Ácido"], ["amargo", "Amargo"], ["seco", "Seco"], ["frutal", "Frutal"], ["especiado", "Especiado"], ["intenso", "Intenso"]];
function sel(name, label, opts) {
  const v = S.filters[name] ?? "";
  return `<label class="flex flex-col gap-1 font-ui text-sm text-muted">${label}<select data-filter="${name}" class="field !py-2.5">${opts.map(([k, l]) => `<option value="${esc(k)}" ${k === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
}
function viewExplore() {
  const f = S.filters, res = search(f), active = Object.values(f).some(Boolean);
  return `<div class="flex flex-col gap-8"><header><h1 class="font-display text-[clamp(3rem,10vw,5.5rem)] font-extrabold uppercase leading-[.85]">Explore</h1>
  <p class="mt-2 max-w-[60ch] text-muted">Combina filtros para encontrar tu próximo cóctel entre más de 170 recetas de todo el mundo.</p></header>
  <div class="surface flex flex-col gap-5 p-4 sm:p-5">
    <input data-filter="q" value="${esc(f.q ?? "")}" class="field !rounded-full" placeholder="Nombre, país, ingrediente o creador" aria-label="Buscar">
    <div class="flex flex-col gap-2"><p class="font-ui text-sm text-muted">Perfil de sabor</p><div class="flex flex-wrap gap-2">${FLAV.map(([k, l]) => `<button data-flavor="${k}" aria-pressed="${(f.flavor ?? "") === k}" class="chip">${l}</button>`).join("")}</div></div>
    <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
      ${sel("type", "Tipo", [["", "Todos"], ["alcohol", "Con alcohol"], ["mocktail", "Mocktails"]])}
      ${sel("method", "Cómo se prepara", [["", "Cualquier forma"], ...(DATA.methods ?? []).map((m) => [m.key, m.label])])}
      ${sel("era", "Estilo", [["", "Todos"], ["clasico", "Clásicos"], ["moderno", "Modernos"], ["tradicional", "Tradicionales"]])}
      ${sel("continent", "Continente", [["", "Todos"], ...CONTINENTS])}
      ${sel("country", "País", [["", "Todos"], ...DATA.countries.map((c) => [c.code, `${c.flag} ${c.name}`])])}
      ${sel("spirit", "Destilado", [["", "Todos"], ...Object.entries(SPIRITS)])}
      ${sel("ing", "Ingrediente", [["", "Cualquiera"], ...DATA.ingredients.map((i) => [i.slug, i.name]).sort((a, b) => a[1].localeCompare(b[1]))])}
      ${sel("abv", "Graduación", [["", "Cualquiera"], ["suave", "Suave (hasta 12 %)"], ["media", "Media (12–20 %)"], ["alta", "Alta (más de 20 %)"]])}
      ${sel("difficulty", "Dificultad", [["", "Cualquiera"], ["1", "Fácil"], ["2", "Media"], ["3", "Avanzada"]])}
      ${sel("time", "Tiempo", [["", "Cualquiera"], ["3", "Hasta 3 min"], ["5", "Hasta 5 min"], ["15", "Hasta 15 min"]])}
      ${sel("occasion", "Ocasión", [["", "Cualquiera"], ...Object.entries(OCC)])}
      ${sel("season", "Temporada", [["", "Cualquiera"], ...Object.entries(SEAS)])}
    </div>${active ? `<button data-clear class="self-start font-ui text-sm text-fuchsia hover:underline">Quitar filtros</button>` : ""}</div>
  <section id="results" aria-live="polite">${results(res)}</section></div>`;
}
const results = (res) => `<p class="mb-4 font-ui text-sm text-muted">${res.length} ${res.length === 1 ? "cóctel" : "cócteles"}</p>` + (res.length ? grid(res) :
  `<div class="surface flex flex-col items-start gap-3 p-6"><p class="font-display text-3xl font-bold uppercase">Nada en la barra con esa combinación</p><p class="text-muted">Quita un filtro o pregúntale al bartender con tus ingredientes.</p><a href="#mixology-ai" class="btn-ghost">Preguntar a Mixology AI</a></div>`);

const UNIT = { ml: ["ml", "ml"], g: ["g", "g"], gotas: ["gota", "gotas"], golpe: ["golpe", "golpes"], golpes: ["golpe", "golpes"], hojas: ["hoja", "hojas"], unidad: ["unidad", "unidades"], bocha: ["bocha", "bochas"], bochas: ["bocha", "bochas"], pizca: ["pizca", "pizcas"] };
function amount(i, n = 1) {
  if (i.amount == null || i.unit === "al gusto") return i.display_text ?? "al gusto";
  if (i.display_text && n === 1) return i.display_text;
  let v = i.amount * n; v = v >= 20 ? Math.round(v / 5) * 5 : v >= 5 ? Math.round(v) : Math.round(v * 2) / 2;
  const [one, many] = UNIT[i.unit] ?? [i.unit, i.unit];
  return `${String(v).replace(".", ",")} ${v === 1 ? one : many}`;
}
const fmtT = (s) => (s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ""}` : `${s} s`);
const flavorBars = (c) => `<div class="grid grid-cols-7 gap-2">${AXES.map(([k, l]) => `<div class="flex flex-col items-center gap-1.5" aria-label="${l}: ${c[k]} de 5"><div class="flex h-20 w-3 flex-col-reverse gap-[3px]">${[1, 2, 3, 4, 5].map((n) => `<span class="flex-1 rounded-[2px]" style="background:${n <= c[k] ? (k === "flavor_strength" ? "var(--color-gold)" : "var(--color-turq)") : "rgb(255 255 255 / .07)"};box-shadow:${n <= c[k] ? `0 0 8px ${k === "flavor_strength" ? "rgb(216 180 106/.6)" : "rgb(34 229 212/.55)"}` : "none"}"></span>`).join("")}</div><span class="font-ui text-[.72rem] text-muted">${l}</span></div>`).join("")}</div>`;

function twist(c) {
  return c.ingredients.map((i) => {
    const subs = DATA.substitutions.filter((s) => s.ingredient_slug === i.slug && (s.country_code === S.country || s.country_code === null));
    const s = subs.find((x) => x.country_code === S.country) ?? subs[0];
    const common = i.availability === "global" || i.native_countries.includes(S.country);
    if (common || !s) return `<li class="flex items-center justify-between gap-3 rounded-xl border border-white/[.07] px-4 py-3"><span>${esc(i.name)}</span><span class="font-ui text-sm ${common ? "text-turq" : "text-muted"}">${common ? "Habitual en tu mercado" : "Sin sustitución registrada todavía"}</span></li>`;
    return `<li class="surface border-turq/30 p-4"><div class="flex flex-wrap items-baseline justify-between gap-2"><p><span class="text-muted line-through decoration-fuchsia/70">${esc(i.name)}</span><span class="mx-2 text-faint">→</span><span class="font-semibold">${esc(s.alternative)}</span></p>
      <span class="chip ${s.has_equivalent ? "!border-turq/50 !text-turq" : "!border-gold/50 !text-gold"}">${s.has_equivalent ? (s.country_code ? "Alternativa para tu país" : "Alternativa general") : "Sin equivalente exacto"}</span></div>
      <dl class="mt-3 grid gap-3 font-ui text-sm sm:grid-cols-2 lg:grid-cols-4">${[["Características", s.characteristics], ["Proporción", s.ratio], ["Diferencia de sabor", s.flavor_difference], ["Resultado esperado", s.expected_result]].map(([k, v]) => `<div><dt class="text-faint">${k}</dt><dd class="text-text">${esc(v)}</dd></div>`).join("")}</dl></li>`;
  }).join("");
}

function methodCard(c) {
  const m = METHOD(c.prep_method); if (!m) return "";
  const tech = c.technique && fold(c.technique) !== fold(m.label) ? ` Técnica de esta receta: ${esc(c.technique.toLowerCase())}.` : "";
  return `<div class="surface flex flex-col gap-4 border-l-2 !border-l-turq p-5">
    <div><p class="font-ui text-sm text-faint">Cómo se prepara</p><p class="font-display text-3xl font-bold uppercase text-turq">${esc(m.label)}</p>
    <p class="mt-1 text-muted">${esc(m.short)}${tech}</p></div>
    <div class="grid gap-5 md:grid-cols-2"><div><p class="font-ui text-sm text-faint">Necesitas</p><ul class="mt-2 flex flex-wrap gap-2">${(c.tools ?? []).map((t) => `<li class="chip">${esc(t)}</li>`).join("")}</ul></div>
    <div><p class="font-ui text-sm text-faint">La técnica, en general</p><ol class="mt-2 list-decimal pl-5 text-[.98rem]">${m.how.map((h) => `<li>${esc(h)}</li>`).join("")}</ol></div></div>
    <p class="font-ui text-sm text-gold">${esc(m.alt)}</p></div>`;
}
let servings = 1;
function viewCocktail(slug) {
  const c = cocktail(slug); if (!c) return viewNotFound();
  servings = 1;
  const co = country(c.origin_country), me = country(S.country), neon = neonColor(c.color), st = c.story;
  const year = c.year_created ? `${/aprox|hacia|década|disput/.test(c.year_note ?? "") ? "c. " : ""}${c.year_created}` : c.year_note;
  const r = S.ratings[slug] ?? { stars: 0, note: "" };
  const facts = [["Categoría", c.category], ["Vaso", c.glass], ["Graduación estimada", c.is_mocktail ? "0 %" : c.abv_est != null ? `≈ ${String(c.abv_est).replace(".", ",")} %` : "—"], ["Preparación", `${c.prep_minutes} min`],
    ["Dificultad", `<span class="inline-flex items-center gap-2">${dots(c.difficulty)}${DIFF[c.difficulty]}</span>`], ["Autor o creador", esc(c.creator ?? "Desconocido")], ["Se popularizó en", esc(c.popularized_in ?? co?.name ?? "—")], ["Momento", esc(c.best_moment ?? (c.occasions.map((o) => OCC[o]).filter(Boolean).join(", ") || "—"))]];
  const hasStory = st && (st.origin_text || st.context_text);
  return `<article class="flex flex-col gap-14">
  <header class="grid items-center gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"><div class="flex flex-col gap-4">
    <p class="font-ui text-sm text-muted"><a href="#pais-${(c.origin_country ?? "").toLowerCase()}" class="hover:text-turq">${co?.flag ?? ""} ${esc(co?.name)}</a>${c.origin_city ? ` · ${esc(c.origin_city)}` : ""}${year ? ` · ${esc(year)}` : ""}</p>
    <h1 class="neon-sign text-[clamp(3.2rem,11vw,7rem)] uppercase" style="--neon:${neon}">${esc(c.international_name)}</h1>
    ${c.original_name !== c.international_name ? `<p class="font-serif text-xl italic text-muted">${esc(c.original_name)}</p>` : ""}
    <p class="prose-club max-w-[52ch]">${esc(c.summary)}</p>
    <div class="flex flex-wrap gap-2"><span class="chip !border-gold/50 !text-gold">${KIND[c.recipe_kind]}</span><span class="chip ${c.history_status === "verificada" ? "!border-turq/50 !text-turq" : ""}">${c.history_status === "verificada" ? "Historia revisada" : "Historia en revisión editorial"}</span>${c.is_mocktail ? `<span class="chip !border-turq/50 !text-turq">Sin alcohol</span>` : ""}</div></div>
    <div class="relative flex justify-center"><div class="absolute bottom-6 h-10 w-2/3 rounded-[50%] blur-2xl" style="background:${neon};opacity:.35"></div>${glass(c, 230, "relative h-auto w-36 sm:w-48 md:w-[230px]")}</div></header>
  <section class="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-white/[.07] bg-white/[.07] sm:grid-cols-4">${facts.map(([k, v]) => `<div class="bg-graphite p-4"><p class="font-ui text-xs text-faint">${k}</p><p class="mt-1 font-ui text-[1.02rem]">${v}</p></div>`).join("")}</section>
  <div class="flex flex-col gap-3"><div class="flex flex-wrap gap-2">
    <button data-fav="${slug}" aria-pressed="${S.fav.has(slug)}" class="btn-ghost ${S.fav.has(slug) ? "!border-fuchsia !text-fuchsia" : ""}">${ic(I.heart, "h-5 w-5", S.fav.has(slug) ? "currentColor" : "none")} ${S.fav.has(slug) ? "En favoritos" : "Favorito"}</button>
    <button data-pending="${slug}" aria-pressed="${S.pending.has(slug)}" class="btn-ghost ${S.pending.has(slug) ? "!border-turq !text-turq" : ""}">${S.pending.has(slug) ? "Por probar ✓" : "Por probar"}</button>
    <button data-togglecols class="btn-ghost">Colecciones</button><button data-missing="${slug}" class="btn-ghost">A la lista de compras</button></div>
    <div id="cols-box" class="hidden surface flex-col gap-2 p-3">${colsBox(slug)}</div><p id="bar-msg" role="status" class="font-ui text-sm text-muted"></p></div>
  <section class="flex flex-col gap-6"><div class="flex flex-wrap items-end justify-between gap-4"><h2 id="receta" class="font-display text-5xl font-bold uppercase">Receta</h2>
    <div class="flex flex-wrap items-center gap-3"><div class="inline-flex items-center rounded-full border border-white/15 font-ui" role="group" aria-label="Porciones"><button data-serv="-1" class="px-3.5 py-2 text-lg">−</button><span id="serv" class="min-w-[6.5rem] text-center text-sm" aria-live="polite">1 porción</span><button data-serv="1" class="px-3.5 py-2 text-lg">+</button></div>
    <button data-bmode="${slug}" class="btn-neon whitespace-nowrap !py-3">Modo bartender</button></div></div>
    ${methodCard(c)}
    <div class="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"><ul id="ings" class="surface divide-y divide-white/[.06] p-2">${ingRows(c)}</ul>
    <ol class="flex flex-col gap-4">${c.steps.map((s) => `<li class="grid grid-cols-[2.2rem_1fr] gap-3"><span class="font-display text-3xl font-bold leading-none text-fuchsia">${s.position}</span><p class="pt-1">${esc(s.instruction)}${s.timer_seconds ? `<span class="ml-2 inline-flex items-center gap-1 font-ui text-sm text-gold">${ic(I.clock, "h-4 w-4")}${fmtT(s.timer_seconds)}</span>` : ""}</p></li>`).join("")}</ol></div>
    <dl class="grid grid-cols-2 gap-3 font-ui text-sm sm:grid-cols-4">${[["Técnica", c.technique], ["Hielo", c.ice], ["Vaso", c.glass], ["Decoración", c.garnish]].map(([k, v]) => `<div class="rounded-xl border border-white/[.07] p-3"><dt class="text-faint">${k}</dt><dd class="mt-1 text-[.98rem] text-text">${esc(v ?? "—")}</dd></div>`).join("")}</dl>
    ${c.presentation ? `<p class="prose-club max-w-[64ch] text-muted"><span class="font-ui text-sm text-faint">Presentación final: </span>${esc(c.presentation)}</p>` : ""}</section>
  <section class="flex flex-col gap-6"><h2 id="historia" class="font-display text-5xl font-bold uppercase">La historia</h2>
  ${hasStory ? `<div class="prose-club grid gap-x-10 md:grid-cols-2"><div>${st.origin_text ? `<p class="first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[4.2rem] first-letter:font-bold first-letter:leading-[.8] first-letter:text-fuchsia">${esc(st.origin_text)}</p>` : ""}${st.context_text ? `<p>${esc(st.context_text)}</p>` : ""}</div><div>${st.evolution_text ? `<p>${esc(st.evolution_text)}</p>` : ""}${st.cultural_text ? `<p>${esc(st.cultural_text)}</p>` : ""}</div></div>
    <div class="grid gap-4 md:grid-cols-2">${st.documented.length ? `<div class="surface border-turq/25 p-5"><h3 class="font-display text-2xl font-bold uppercase text-turq">Lo documentado</h3><ul class="mt-3 flex list-disc flex-col gap-2 pl-5 marker:text-turq">${st.documented.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></div>` : ""}
    ${st.legends.length ? `<div class="surface border-fuchsia/25 p-5"><h3 class="font-display text-2xl font-bold uppercase text-fuchsia">Leyendas y versiones populares</h3><ul class="mt-3 flex list-disc flex-col gap-2 pl-5 italic marker:text-fuchsia">${st.legends.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></div>` : ""}</div>
    ${st.curiosities.length ? `<div><h3 class="font-display text-2xl font-bold uppercase text-gold">Curiosidades</h3><ul class="mt-2 flex flex-col gap-1.5">${st.curiosities.map((d) => `<li>— ${esc(d)}</li>`).join("")}</ul></div>` : ""}
    ${st.uncertainty_note ? `<p class="font-ui text-sm text-muted"><span class="text-gold">Incertidumbre histórica: </span>${esc(st.uncertainty_note)}</p>` : ""}
    ${st.sources.length ? `<div class="font-ui text-sm text-muted"><p class="text-faint">Fuentes y referencias</p><ul class="mt-1">${st.sources.map((s) => `<li>${esc(s.title)}</li>`).join("")}</ul></div>` : ""}`
  : `<div class="surface p-5"><p>Esta ficha aún no tiene su historia completa: el equipo editorial la está verificando con fuentes antes de publicarla.</p>${st?.uncertainty_note ? `<p class="mt-2 text-muted"><span class="font-ui text-sm text-gold">Lo que sabemos hasta ahora: </span>${esc(st.uncertainty_note)}</p>` : ""}</div>`}</section>
  <section class="flex flex-col gap-5"><div class="flex flex-wrap items-end justify-between gap-3"><div><h2 id="twist" class="font-display text-5xl font-bold uppercase leading-[.9]">Local Twist: adáptalo a tu país</h2>
    <p class="mt-2 text-muted">Ingredientes de esta receta frente a lo habitual en ${esc(me?.name ?? "tu país")}.</p></div>${countrySelect("Preparar en", "twist-country")}</div>
    <ul class="flex flex-col gap-3">${twist(c)}</ul><p class="font-ui text-xs text-faint">La disponibilidad es orientativa y puede cambiar; no indicamos marcas ni garantizamos stock. Verifica en tu comercio local.</p></section>
  <section class="grid gap-8 md:grid-cols-2"><div class="flex flex-col gap-4"><h2 class="font-display text-4xl font-bold uppercase">Perfil sensorial</h2>${flavorBars(c)}</div>
    <div class="flex flex-col gap-4"><h2 class="font-display text-4xl font-bold uppercase">Para acompañar</h2><dl class="flex flex-col gap-3">
    ${c.pairing ? `<div><dt class="font-ui text-sm text-faint">Maridaje</dt><dd>${esc(c.pairing)}</dd></div>` : ""}${c.best_moment ? `<div><dt class="font-ui text-sm text-faint">Momento recomendado</dt><dd>${esc(c.best_moment)}</dd></div>` : ""}
    ${c.variations.length ? `<div><dt class="font-ui text-sm text-faint">Variaciones conocidas</dt><dd>${c.variations.map(esc).join(" · ")}</dd></div>` : ""}</dl></div></section>
  ${c.pro_tips.length ? `<section class="flex flex-col gap-3"><h2 class="font-display text-4xl font-bold uppercase">Consejos de barra</h2><ul class="grid gap-3 md:grid-cols-3">${c.pro_tips.map((t) => `<li class="surface p-4">${esc(t)}</li>`).join("")}</ul></section>` : ""}
  <section class="flex max-w-xl flex-col gap-3"><h2 class="font-display text-4xl font-bold uppercase">Tu valoración</h2>
    <div class="flex items-center gap-1" role="radiogroup" aria-label="Tu valoración">${[1, 2, 3, 4, 5].map((n) => `<button data-star="${n}" data-slug="${slug}" role="radio" aria-checked="${r.stars === n}" aria-label="${n} de 5" class="p-1 ${n <= r.stars ? "text-gold drop-shadow-[0_0_6px_#d8b46a]" : "text-white/25"}">${ic(I.star, "h-7 w-7")}</button>`).join("")}</div>
    <label for="note" class="font-ui text-sm text-muted">Notas personales</label><textarea id="note" data-note="${slug}" rows="3" class="field" placeholder="Con menos jarabe me gustó más; probar con limón de Pica…">${esc(r.note)}</textarea></section></article>`;
}
const ingRows = (c) => c.ingredients.map((i) => `<li class="flex items-baseline justify-between gap-4 px-3 py-3"><span>${esc(i.name)}${i.is_optional ? `<span class="ml-2 font-ui text-xs text-faint">opcional</span>` : ""}</span><span class="shrink-0 font-ui text-lg font-semibold tabular-nums text-turq">${esc(amount(i, servings))}</span></li>`).join("");
function colsBox(slug) {
  return `${S.cols.length ? "" : `<p class="text-sm text-muted">Aún no tienes colecciones. Crea la primera:</p>`}${S.cols.map((c) => `<label class="flex items-center gap-2 font-ui"><input type="checkbox" data-col="${c.id}" data-slug="${slug}" ${c.items.includes(slug) ? "checked" : ""} class="accent-violet">${esc(c.name)}</label>`).join("")}
  <form data-newcol="${slug}" class="flex gap-2"><input name="name" maxlength="60" required placeholder="Noche de amigos, Cócteles para el verano…" class="field !py-2"><button class="btn-ghost shrink-0 !py-2">Crear</button></form>`;
}

// mapa
const GEO = { CL: ["152", [-70.6, -33.4]], PE: ["604", [-77, -12]], AR: ["032", [-64.2, -31.4]], BR: ["076", [-46.6, -23.5]], MX: ["484", [-103.8, 20.9]], CU: ["192", [-82.4, 23.1]], US: ["840", [-74, 40.7]], IT: ["380", [11.2, 43.8]], ES: ["724", [-0.4, 39.5]], GB: ["826", [-0.1, 51.5]], SG: ["702", [103.8, 1.3]], JP: ["392", [139.7, 35.7]], FR: ["250", [2.35, 48.85]], DE: ["276", [11.6, 48.1]], AU: ["036", [151.2, -33.9]], CA: ["124", [-114.1, 51]], UY: ["858", [-56.2, -34.9]], BO: ["068", [-68.1, -16.5]], EC: ["218", [-78.5, -0.2]], CO: ["170", [-75.5, 10.4]], PR: ["630", [-66.1, 18.5]], JM: ["388", [-76.8, 18]], BM: ["060", [-64.8, 32.3]], MQ: ["474", [-61, 14.6]], VG: ["092", [-64.6, 18.4]], DO: ["214", [-69.9, 18.5]], IE: ["372", [-9, 52.6]], BE: ["056", [4.35, 50.85]], KR: ["410", [127, 37.6]], KE: ["404", [36.8, -1.3]], ZA: ["710", [18.4, -33.9]], NZ: ["554", [174.8, -41.3]], MY: ["458", [101.7, 3.1]], BB: ["052", [-59.6, 13.1]], VE: ["862", [-66.9, 10.5]], PY: ["600", [-57.6, -25.3]], TR: ["792", [29, 41]], IN: ["356", [77.2, 28.6]], TH: ["764", [100.5, 13.75]], PH: ["608", [121, 14.6]], MA: ["504", [-7.6, 33.6]], SN: ["686", [-17.4, 14.7]] };
const BOUNDS = { mundo: [[-170, -56], [180, 75]], america_norte: [[-130, 12], [-55, 58]], america_central_caribe: [[-90, 8], [-58, 33]], america_sur: [[-85, -56], [-33, 13]], europa: [[-12, 35], [32, 61]], africa: [[-20, -36], [52, 38]], asia: [[60, -10], [150, 52]], oceania: [[110, -48], [180, -8]] };
let zone = "mundo";
const counts = () => DATA.cocktails.reduce((a, c) => ((a[c.origin_country] = (a[c.origin_country] || 0) + 1), a), {});
function viewWorld() {
  return `<div class="flex flex-col gap-8"><header><h1 class="font-display text-[clamp(3rem,10vw,5.5rem)] font-extrabold uppercase leading-[.85]">Cocktail World Tour</h1>
  <p class="mt-2 max-w-[60ch] text-muted">Elige un continente y luego un país para recorrer su cultura coctelera: sus clásicos, sus destilados y sus ingredientes. Los puntos fucsia tienen guía cultural completa.</p></header>
  <div class="scroll-x -mx-4 flex gap-2 px-4" role="tablist">${[["mundo", "Todo el mundo"], ...CONTINENTS].map(([k, l]) => `<button data-zone="${k}" role="tab" aria-selected="${zone === k}" class="chip shrink-0 !py-1.5 !text-[.9rem] ${zone === k ? "!border-turq !bg-turq/15 !text-white" : ""}">${l}</button>`).join("")}</div>
  <div class="surface relative overflow-hidden"><div id="map" class="min-h-[200px]">${WORLD ? "" : `<p class="p-6 text-muted">Cargando mapa…</p>`}</div><div id="map-tip" class="pointer-events-none absolute left-4 top-4 rounded-lg bg-ink/80 px-3 py-2 font-ui text-sm backdrop-blur">Toca un país para descubrir su cultura coctelera</div></div>
  <ul id="map-list" class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">${mapList()}</ul></div>`;
}
function mapList() {
  const n = counts();
  return DATA.countries.filter((c) => n[c.code] && (zone === "mundo" || c.continent === zone)).sort((a, b) => n[b.code] - n[a.code]).map((c) => `<li><a href="#pais-${c.code.toLowerCase()}" class="flex items-center justify-between gap-2 rounded-xl border border-white/[.07] px-4 py-3 transition-colors hover:border-fuchsia/60"><span class="flex items-center gap-2"><span class="text-xl">${c.flag}</span><span class="font-display text-xl font-semibold uppercase">${esc(c.name)}</span></span><span class="font-ui text-sm text-muted">${n[c.code]}</span></a></li>`).join("");
}
function drawMap() {
  const el = $("#map"); if (!el || !WORLD || !window.d3 || !window.topojson) return;
  const W = 960, H = 520, n = counts();
  const land = topojson.feature(WORLD, WORLD.objects.countries);
  const [[x0, y0], [x1, y1]] = BOUNDS[zone];
  const proj = d3.geoNaturalEarth1().fitExtent([[20, 20], [W - 20, H - 20]], { type: "Feature", geometry: { type: "MultiPoint", coordinates: [[x0, y0], [x1, y1], [x0, y1], [x1, y0]] } });
  const path = d3.geoPath(proj);
  const byNum = {}; DATA.countries.forEach((c) => { if (n[c.code] && GEO[c.code]) byNum[GEO[c.code][0]] = c; });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="block h-auto w-full" role="img" aria-label="Mapa mundial de la coctelería">${land.features.map((f) => {
    const c = byNum[String(f.id)];
    return `<path d="${path(f) || ""}" ${c ? `data-go="${c.code}" data-tip="${c.code}" class="cursor-pointer" fill="rgb(139 61 255 / .35)" stroke="#b98cff" stroke-width=".9"` : `fill="rgb(255 255 255 / .045)" stroke="rgb(255 255 255 / .1)" stroke-width=".4"`}/>`;
  }).join("")}${DATA.countries.filter((c) => n[c.code] && GEO[c.code] && (zone === "mundo" || c.continent === zone)).map((c) => {
    const p = proj(GEO[c.code][1]); if (!p) return "";
    const col = c.in_world_tour ? "#ff2ba6" : "#22e5d4";
    return `<circle data-go="${c.code}" data-tip="${c.code}" cx="${p[0]}" cy="${p[1]}" r="6" fill="${col}" opacity=".9" style="filter:drop-shadow(0 0 6px ${col});cursor:pointer"/>`;
  }).join("")}</svg>`;
}
function viewCountry(code) {
  const c = country(code.toUpperCase()); if (!c) return viewNotFound();
  const list = search({ country: c.code }), emb = list.filter((x) => x.history_status === "verificada" && x.era !== "tradicional"), trad = list.filter((x) => !emb.includes(x));
  return `<div class="flex flex-col gap-12"><header class="flex flex-col gap-4"><a href="#world-tour" class="font-ui text-sm text-turq hover:underline">World Tour · ${CONTINENTS.find((x) => x[0] === c.continent)?.[1]}</a>
  <h1 class="flex items-center gap-4 font-display text-[clamp(3.2rem,11vw,6.5rem)] font-extrabold uppercase leading-[.85]"><span class="text-[.7em]">${c.flag}</span>${esc(c.name)}</h1>
  ${c.culture_history ? `<p class="prose-club max-w-[64ch]">${esc(c.culture_history)}</p>` : `<p class="text-muted">La guía cultural de este país está en preparación. Mientras tanto, estos son sus cócteles en la biblioteca.</p>`}</header>
  <section class="scroll-x -mx-4 flex gap-6 px-4">${list.slice(0, 8).map((x) => `<a href="#c-${x.slug}" class="flex shrink-0 flex-col items-center gap-1">${glass(x, 84)}<span class="font-ui text-xs text-muted">${esc(x.international_name)}</span></a>`).join("")}</section>
  ${c.local_spirits.length || c.typical_ingredients.length ? `<section class="grid gap-4 md:grid-cols-2">${c.local_spirits.length ? `<div class="surface p-5"><h2 class="font-display text-3xl font-bold uppercase text-gold">Destilados locales</h2><ul class="mt-3 flex flex-wrap gap-2">${c.local_spirits.map((s) => `<li class="chip !text-text">${esc(s)}</li>`).join("")}</ul></div>` : ""}${c.typical_ingredients.length ? `<div class="surface p-5"><h2 class="font-display text-3xl font-bold uppercase text-turq">Ingredientes típicos</h2><ul class="mt-3 flex flex-wrap gap-2">${c.typical_ingredients.map((s) => `<li class="chip !text-text">${esc(s)}</li>`).join("")}</ul></div>` : ""}</section>` : ""}
  ${emb.length ? `<section class="flex flex-col gap-4"><h2 class="font-display text-4xl font-bold uppercase">Cócteles emblemáticos</h2>${grid(emb)}</section>` : ""}
  ${trad.length ? `<section class="flex flex-col gap-4"><h2 class="font-display text-4xl font-bold uppercase">Tradicionales y populares</h2>${grid(trad)}</section>` : ""}
  ${c.curiosities.length ? `<section class="flex flex-col gap-3"><h2 class="font-display text-4xl font-bold uppercase">Curiosidades</h2><ul class="flex flex-col gap-2">${c.curiosities.map((t) => `<li class="prose-club">— ${esc(t)}</li>`).join("")}</ul></section>` : ""}
  <p class="font-ui text-xs text-faint">El país indica dónde nació cada cóctel. Cuando se popularizó en otro lugar, la ficha lo señala aparte.</p></div>`;
}

// bartender
const WORDS = [[/\bgin(ebra)?\b/, ["gin"]], [/\bvodka\b/, ["vodka"]], [/\bron\b|\brum\b/, ["ron-blanco", "ron-oscuro", "ron-jamaicano"]], [/\btequila\b/, ["tequila"]], [/\bmezcal\b/, ["mezcal"]], [/\bpisco\b/, ["pisco"]], [/\bcachaca\b/, ["cachaca"]], [/\bbourbon\b/, ["bourbon"]], [/\bwhisk(e)?y\b/, ["bourbon", "rye", "whisky-escoces", "whisky-japones", "whiskey-irlandes"]], [/\bcognac|brandy\b/, ["cognac", "brandy-espanol"]], [/\bvino tinto\b/, ["vino-tinto"]], [/\bvino blanco\b/, ["vino-blanco"]], [/\bvino\b/, ["vino-tinto", "vino-blanco", "pipeno"]], [/\bespumante|champagne|champana|cava|prosecco\b/, ["espumante", "prosecco", "champagne"]], [/\bcerveza\b/, ["cerveza-lager"]], [/\blimon(es)?\b/, ["limon", "limon-pica"]], [/\blima(s)?\b/, ["lima", "lima-entera"]], [/\bmenta|hierbabuena\b/, ["menta", "hierbabuena"]], [/\bazucar\b/, ["azucar", "jarabe-simple", "azucar-rubia"]], [/\bmiel\b/, ["miel"]], [/\bfrutos rojos|frambuesa|mora(s)?\b/, ["frutos-rojos", "creme-mure", "jarabe-frambuesa"]], [/\bfrutilla(s)?|fresa(s)?\b/, ["frutillas", "pure-frutilla"]], [/\bnaranja\b/, ["naranja", "triple-sec"]], [/\bpomelo|toronja\b/, ["pomelo", "gaseosa-pomelo"]], [/\bpina\b/, ["pina", "helado-pina"]], [/\bcoco\b/, ["crema-coco", "leche-coco", "agua-coco"]], [/\bcafe\b/, ["cafe-espresso", "licor-cafe", "cafe-caliente"]], [/\bjengibre|ginger\b/, ["ginger-beer", "ginger-ale", "jengibre", "jarabe-miel-jengibre"]], [/\btonica\b/, ["tonica"]], [/\bcola\b/, ["cola"]], [/\bsoda\b/, ["soda"]], [/\bvermut|vermouth\b/, ["vermut-rosso", "vermut-dry"]], [/\bcampari|bitter\b/, ["campari"]], [/\baperol\b/, ["aperol"]], [/\bfernet\b/, ["fernet"]], [/\bhuevo|clara\b/, ["clara-huevo"]], [/\bmaracuya\b/, ["jarabe-maracuya", "maracuya"]], [/\bpepino\b/, ["pepino", "pepino-rodaja"]], [/\btomate\b/, ["tomate"]]];
const CWORDS = [[/\bchile(no|na|nos|nas)?\b/, "CL"], [/\bperu(ano|ana)?\b/, "PE"], [/\bargentin(o|a|os|as)?\b/, "AR"], [/\bbrasil(eno|ena)?\b/, "BR"], [/\bmexic(o|ano|ana)\b/, "MX"], [/\bcuba(no|na)?\b/, "CU"], [/\b(estados unidos|estadounidense|americano)\b/, "US"], [/\bital(ia|iano|iana)\b/, "IT"], [/\bespan(a|ol|ola)\b/, "ES"], [/\b(reino unido|ingles|inglesa|britanic(o|a)|londres)\b/, "GB"], [/\bfranc(ia|es|esa)\b/, "FR"], [/\bjapon(es|esa)?\b/, "JP"], [/\bsingapur\b/, "SG"]];
function bartender(text) {
  const t = fold(text), pool = DATA.cocktails, ing = new Set();
  WORDS.forEach(([re, s]) => re.test(t) && s.forEach((x) => ing.add(x)));
  const cs = CWORDS.filter(([re]) => re.test(t)).map((x) => x[1]);
  const ref = /parecido|similar|como (un|el|una)|estilo/.test(t) ? pool.find((c) => t.includes(fold(c.international_name))) : null;
  const occ = []; if (/cena|elegante|sofisticad/.test(t)) occ.push("cena", "aperitivo"); if (/fiesta|amigos|carrete/.test(t)) occ.push("fiesta"); if (/brunch|desayuno/.test(t)) occ.push("brunch"); if (/postre|sobremesa|bajativo/.test(t)) occ.push("sobremesa");
  const mock = /sin alcohol|mocktail|0[.,]0|sin licor/.test(t), low = /poco dulce|no (muy )?dulce|seco|sin azucar/.test(t), fresh = /refrescante|fresco|verano|calor|liviano|ligero/.test(t), strong = /fuerte|intenso|potente/.test(t), bitter = /amargo/.test(t), fruity = /frutal|fruta/.test(t);
  const vec = (c) => AXES.map(([k]) => c[k]);
  const picks = pool.filter((c) => (mock ? c.is_mocktail : true) && c !== ref).map((c) => {
    let s = 0; const why = [];
    if (ing.size) {
      const groups = WORDS.filter(([, sl]) => sl.some((x) => ing.has(x)) && sl.some((x) => c.ingredient_slugs.includes(x))).length;
      s += groups * 3 + c.ingredient_slugs.filter((i) => ing.has(i)).length;
      s -= c.ingredient_slugs.filter((i) => !ing.has(i) && !/jarabe-simple|azucar|soda|agua|sal|rodaja|piel/.test(i)).length * 0.6;
      if (groups) why.push(`usa ${groups === 1 ? "uno" : groups} de tus ingredientes`);
    }
    if (cs.includes(c.origin_country)) { s += 5; why.push("es del país que buscas"); }
    if (occ.length && c.occasions.some((o) => occ.includes(o))) { s += 2; why.push("encaja con la ocasión"); }
    if (low) s += (3 - c.flavor_sweet) * 0.8;
    if (fresh) s += (c.occasions.includes("verano") || c.seasons.includes("verano") ? 2 : 0) + (5 - c.flavor_strength) * 0.4;
    if (strong) s += c.flavor_strength * 0.7; if (bitter) s += c.flavor_bitter * 0.8; if (fruity) s += c.flavor_fruity * 0.8;
    if (ref) { const a = vec(ref), b = vec(c); s += 8 - Math.sqrt(a.reduce((x, v, i) => x + (v - b[i]) ** 2, 0)); if (c.base_spirits.some((x) => ref.base_spirits.includes(x))) s += 1; why.push(`perfil cercano al ${ref.international_name}`); }
    if (mock) why.push("sin alcohol");
    return { c, s, why };
  }).sort((a, b) => b.s - a.s).slice(0, 3);
  if (!picks.length) return { answer: "No encontré un cóctel de la biblioteca que encaje. Prueba nombrando un destilado, un país o un sabor.", picks };
  const [f, ...rest] = picks;
  let answer = `Te propongo un ${f.c.international_name}${f.why.length ? ` (${[...new Set(f.why)].join(", ")})` : ""}. ${f.c.summary}`;
  if (rest.length) answer += ` Si quieres otras opciones: ${rest.map((r) => r.c.international_name).join(" o ")}.`;
  if (ing.size) answer += " Revisa en cada ficha qué ingredientes te faltan y la sección Local Twist para reemplazarlos.";
  return { answer, picks };
}
const EXAMPLES = ["¿Qué cóctel puedo preparar con gin, limón y frutos rojos?", "Tengo ron, menta y azúcar. ¿Qué puedo hacer?", "Recomiéndame un cóctel italiano", "Quiero preparar algo elegante para una cena", "Busco un cóctel refrescante y poco dulce", "¿Qué puedo preparar con ingredientes típicos de Chile?", "Recomiéndame algo parecido a un Negroni", "Quiero preparar un cóctel sin alcohol"];
let pantry = [];
function viewAI() {
  return `<div class="flex flex-col gap-8"><header class="flex flex-col gap-3"><h1 class="neon-sign text-[clamp(3.2rem,11vw,6.5rem)] uppercase">Mixology AI</h1>
  <p class="max-w-[60ch] text-muted">Tu bartender personal. Cuéntale qué tienes, qué te gusta o para qué ocasión es: te propone cócteles de la biblioteca con receta, historia y alternativas para tu país.</p></header>
  <div class="flex flex-col gap-5">${S.chat.length ? "" : `<ul class="flex flex-wrap gap-2">${EXAMPLES.map((e) => `<li><button data-example="${esc(e)}" class="chip text-left !text-[.92rem] hover:!border-violet hover:!text-white">${esc(e)}</button></li>`).join("")}</ul>`}
  <div class="flex flex-col gap-5" aria-live="polite">${S.chat.map((m, i) => m.role === "user" ? `<p class="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-violet/25 px-4 py-2.5 font-ui text-[1.02rem]">${esc(m.text)}</p>`
    : `<div class="flex flex-col gap-3"><p class="prose-club max-w-[64ch]">${esc(m.text)}</p>${m.picks.length ? `<ul class="grid gap-3 sm:grid-cols-3">${m.picks.map((p) => `<li><a href="#c-${p.c.slug}" class="surface flex h-full items-center gap-3 p-3 transition-colors hover:border-violet/60">${glass(p.c, 56)}<span class="flex flex-col"><span class="font-display text-2xl font-bold uppercase leading-none">${esc(p.c.international_name)}</span><span class="mt-1 font-ui text-xs text-muted">${esc([...new Set(p.why)].slice(0, 2).join(" · ") || "Receta, historia y Local Twist")}</span></span></a></li>`).join("")}</ul>` : ""}
    <p class="font-ui text-xs text-faint">Respuesta basada en la biblioteca del club. En la versión publicada, con la clave de IA configurada, Claude redacta la respuesta a partir de estas mismas recetas.</p></div>`).join("")}</div>
  <form data-chat class="sticky bottom-20 flex flex-col gap-2 rounded-2xl border border-white/10 bg-graphite/95 p-3 backdrop-blur lg:bottom-4">
    <div class="flex flex-wrap items-center gap-2"><label for="pantry" class="font-ui text-sm text-muted">Tengo en casa:</label><select id="pantry" data-pantry class="rounded-full border border-white/15 bg-smoke px-3 py-1 font-ui text-sm"><option value="">Agregar ingrediente…</option>${DATA.ingredients.map((i) => [i.slug, i.name]).sort((a, b) => a[1].localeCompare(b[1])).map(([s, n]) => `<option value="${s}">${esc(n)}</option>`).join("")}</select>
    ${pantry.map((s) => `<button type="button" data-unpantry="${s}" class="chip !text-text">${esc(ingName(s))} ×</button>`).join("")}${pantry.length ? `<button type="button" data-askpantry class="font-ui text-sm text-turq underline">Preguntar con estos</button>` : ""}
    <button type="button" disabled class="ml-auto chip opacity-50">Fotografiar ingredientes · pronto</button></div>
    <div class="flex gap-2"><input id="msg" name="msg" maxlength="600" class="field !rounded-full" placeholder="Pídele algo al bartender…" aria-label="Mensaje"><button class="btn-neon shrink-0 !px-5">Enviar</button></div></form></div></div>`;
}
function ask(text) {
  if (!text.trim()) return;
  const r = bartender(text);
  S.chat.push({ role: "user", text }, { role: "assistant", text: r.answer, picks: r.picks });
  if (location.hash !== "#mixology-ai") location.hash = "mixology-ai"; else render();
  setTimeout(() => window.scrollTo({ top: document.body.scrollHeight }), 50);
}

function viewMocktails() {
  return `<div class="flex flex-col gap-8"><header class="flex flex-col gap-3"><h1 class="neon-sign text-[clamp(3.2rem,11vw,6.5rem)] uppercase" style="--neon:#22e5d4">Mocktails</h1>
  <p class="max-w-[60ch] text-muted">Bebidas sin alcohol con identidad propia: tradiciones de todo el mundo, clásicos de hace un siglo y creaciones del club. Ninguna es un cóctel al que solo le quitamos el alcohol.</p>
  <button data-discover="mock" class="btn-neon self-start">Girar la ruleta sin alcohol</button></header>${grid(search({ type: "mocktail" }))}
  <p class="font-ui text-xs text-faint">Algunas preparaciones llevan amargos aromáticos en gotas, que aportan trazas de alcohol; la ficha lo indica.</p></div>`;
}

function viewBar() {
  const fav = [...S.fav].map(cocktail).filter(Boolean), pend = [...S.pending].map(cocktail).filter(Boolean);
  const have = new Set([...S.home, "azucar", "jarabe-simple", "agua", "sal", "azucar-rubia", "terron-azucar"]);
  const make = S.home.size ? DATA.cocktails.map((c) => ({ c, miss: c.ingredient_slugs.filter((s) => !have.has(s) && !/^(rodaja|piel|pepino-rodaja|cereza)/.test(s)).length })).filter((x) => x.miss <= 1).sort((a, b) => a.miss - b.miss).slice(0, 8) : [];
  const hist = Object.entries(S.history).sort((a, b) => b[1].last - a[1].last);
  const block = (id, title, body, empty) => `<section id="${id}" class="flex scroll-mt-24 flex-col gap-4"><h2 class="font-display text-4xl font-bold uppercase">${title}</h2>${body || `<p class="text-muted">${empty}</p>`}</section>`;
  return `<div class="flex flex-col gap-12"><header class="flex flex-col gap-4"><h1 class="font-display text-[clamp(3rem,10vw,5.5rem)] font-extrabold uppercase leading-[.85]">My Bar</h1>
  <p class="font-ui text-sm text-gold">${APP ? "Tu bar se guarda en este teléfono." : "En esta versión de revisión tu bar se guarda solo en este navegador. En la app publicada queda en tu cuenta."}</p>
  <nav class="scroll-x -mx-4 flex gap-2 px-4">${[["favoritos", "Favoritos"], ["colecciones", "Colecciones"], ["pendientes", "Por probar"], ["casa", "En casa"], ["compras", "Lista de compras"], ["historial", "Historial"], ["notas", "Valoraciones y notas"], ["propias", "Recetas propias"]].map(([i, l]) => `<button data-scroll="${i}" class="chip shrink-0 hover:!text-white">${l}</button>`).join("")}</nav></header>
  ${block("favoritos", "Favoritos", fav.length ? grid(fav) : "", "Aún no guardas favoritos. Toca «Favorito» en cualquier cóctel.")}
  ${block("colecciones", "Colecciones", S.cols.map((c) => `<div class="flex flex-col gap-3"><div class="flex items-baseline justify-between"><h3 class="font-display text-2xl font-bold uppercase text-violet-soft">${esc(c.name)} <span class="font-ui text-sm font-normal text-muted">· ${c.items.length}</span></h3><button data-delcol="${c.id}" class="font-ui text-xs text-faint hover:text-danger">Eliminar colección</button></div>${c.items.length ? grid(c.items.map(cocktail).filter(Boolean)) : `<p class="text-muted">Colección vacía.</p>`}</div>`).join(""), "Crea colecciones como «Noche de amigos» o «Clásicos internacionales» desde cualquier ficha.")}
  ${block("pendientes", "Cócteles por probar", pend.length ? grid(pend) : "", "Marca «Por probar» en las fichas que te llamen la atención.")}
  <section id="casa" class="flex scroll-mt-24 flex-col gap-4"><h2 class="font-display text-4xl font-bold uppercase">Ingredientes en casa</h2>
    <ul class="flex flex-wrap gap-2">${[...S.home].map((s) => `<li><button data-unhome="${s}" class="chip !border-turq/50 !text-text">${esc(ingName(s))} ×</button></li>`).join("") || `<li class="text-muted">Marca lo que tienes en casa y te diremos qué puedes preparar.</li>`}</ul>
    <label class="flex max-w-sm flex-col gap-1 font-ui text-sm text-muted">Agregar ingrediente<select data-home class="field !py-2"><option value="">Elegir…</option>${DATA.ingredients.filter((i) => !S.home.has(i.slug)).sort((a, b) => a.name.localeCompare(b.name)).map((i) => `<option value="${i.slug}">${esc(i.name)}</option>`).join("")}</select></label>
    ${make.length ? `<h3 class="font-display text-2xl font-bold uppercase text-turq">Con lo que tienes puedes preparar</h3><div class="reveal grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">${make.map((x) => `<div class="relative">${card(x.c)}${x.miss ? `<span class="absolute right-3 top-3 chip !border-gold/50 !bg-ink/80 !text-gold">Falta 1</span>` : ""}</div>`).join("")}</div>` : ""}</section>
  <section id="compras" class="flex scroll-mt-24 flex-col gap-4"><h2 class="font-display text-4xl font-bold uppercase">Lista de compras</h2>
    <ul class="flex flex-col">${S.shop.map((i) => `<li class="flex items-center gap-3 border-b border-white/[.06] py-2"><input type="checkbox" data-shopcheck="${i.id}" ${i.checked ? "checked" : ""} class="accent-turq" aria-label="${esc(i.name)}"><span class="${i.checked ? "text-faint line-through" : ""}">${esc(i.name)}</span><button data-shopdel="${i.id}" class="ml-auto font-ui text-xs text-faint hover:text-danger">Quitar</button></li>`).join("") || `<li class="text-muted">Tu lista está vacía. Desde cualquier receta puedes agregar lo que te falta.</li>`}</ul>
    <form data-shopadd class="flex max-w-md gap-2"><input name="name" maxlength="120" required class="field !py-2" placeholder="Limones, hielo, tónica…" aria-label="Agregar a la lista"><button class="btn-ghost shrink-0 !py-2">Agregar</button></form></section>
  ${block("historial", "Historial de preparación", hist.length ? `<ul class="flex flex-col">${hist.map(([s, h]) => `<li class="flex items-baseline justify-between gap-3 border-b border-white/[.06] py-3"><a href="#c-${s}" class="font-display text-2xl font-semibold uppercase hover:text-turq">${esc(cocktail(s)?.international_name)}</a><span class="font-ui text-sm text-muted">${h.n} ${h.n === 1 ? "vez" : "veces"} · ${fmtDate(new Date(h.last))}</span></li>`).join("")}</ul>` : "", "Cuando termines una receta en Modo bartender, quedará registrada aquí.")}
  ${block("notas", "Valoraciones y notas", Object.keys(S.ratings).length ? `<ul class="grid gap-3 md:grid-cols-2">${Object.entries(S.ratings).map(([s, r]) => `<li class="surface p-4"><a href="#c-${s}" class="font-display text-2xl font-bold uppercase hover:text-turq">${esc(cocktail(s)?.international_name)}</a>${r.stars ? `<p class="text-gold">${"★".repeat(r.stars)}<span class="text-white/20">${"★".repeat(5 - r.stars)}</span></p>` : ""}${r.note ? `<p class="mt-1 text-muted">${esc(r.note)}</p>` : ""}</li>`).join("")}</ul>` : "", "Valora y anota tus ajustes al final de cada receta.")}
  <section id="propias" class="flex scroll-mt-24 flex-col gap-4"><h2 class="font-display text-4xl font-bold uppercase">Recetas propias</h2>
    <form data-recipe class="surface flex flex-col gap-3 p-4"><label class="flex flex-col gap-1 font-ui text-sm text-muted">Nombre<input name="name" required maxlength="80" class="field"></label>
    <label class="flex flex-col gap-1 font-ui text-sm text-muted">Ingredientes (uno por línea)<textarea name="ing" rows="3" class="field" placeholder="60 ml pisco&#10;30 ml limón de Pica"></textarea></label>
    <label class="flex flex-col gap-1 font-ui text-sm text-muted">Preparación (un paso por línea)<textarea name="steps" rows="3" class="field"></textarea></label><button class="btn-neon self-start">Guardar receta</button></form>
    <ul class="grid gap-3 md:grid-cols-2">${S.recipes.map((r) => `<li class="surface flex flex-col gap-2 p-4"><div class="flex items-baseline justify-between"><p class="font-display text-2xl font-bold uppercase">${esc(r.name)}</p><button data-delrecipe="${r.id}" class="font-ui text-xs text-faint hover:text-danger">Eliminar</button></div><p class="font-ui text-xs text-gold">Creación propia · privada</p>${r.ing.length ? `<ul class="text-muted">${r.ing.map((l) => `<li>· ${esc(l)}</li>`).join("")}</ul>` : ""}${r.steps.length ? `<ol class="list-decimal pl-5">${r.steps.map((l) => `<li>${esc(l)}</li>`).join("")}</ol>` : ""}</li>`).join("")}</ul></section></div>`;
}

function viewSub() {
  const first = new Date(Date.now() + 7 * 864e5);
  return `<div class="mx-auto flex max-w-3xl flex-col gap-10 py-4"><header class="flex flex-col gap-5 text-center">
  <h1 class="neon-sign ignite text-[clamp(2.8rem,9vw,5.6rem)] uppercase" style="--neon:#ff2ba6">Tu club privado de coctelería te espera</h1>
  <p class="prose-club mx-auto max-w-[48ch] text-muted">Descubre los sabores del mundo, aprende las historias detrás de cada cóctel y conviértete en el bartender de tu propia casa.</p></header>
  <section class="surface relative mx-auto flex w-full max-w-md flex-col items-center gap-2 overflow-hidden border-gold/40 p-8 text-center"><div class="pointer-events-none absolute -top-20 h-40 w-64 rounded-full bg-gold/20 blur-3xl"></div>
  <p class="relative font-display text-6xl font-extrabold uppercase text-gold">7 días gratis</p><p class="font-ui text-muted">Después</p><p class="font-display text-4xl font-bold">${CLP(2990)} CLP / mes</p>
  <button data-start class="btn-neon mt-5 w-full">Comenzar mi experiencia gratuita</button>
  <p id="start-msg" class="mt-2 hidden font-ui text-sm text-gold">Versión de revisión: en la app publicada este botón abre el registro. La prueba no pide tarjeta y aquí no se realiza ningún cobro.</p></section>
  <section class="grid gap-4 font-ui text-[.95rem] sm:grid-cols-2">${[["Duración de la prueba", "7 días corridos con acceso completo, una vez por persona. No pide tarjeta."], ["Precio posterior", `${CLP(2990)} CLP al mes, precio final.`], ["Primer cobro", `Solo si activas la suscripción. Si la activas durante la prueba, el primer cobro es el día en que termina (${fmtDate(first)} si empiezas hoy).`], ["Renovación automática", "Al activar la suscripción, se renueva cada mes a través de Mercado Pago. Te avisamos antes del primer cobro y de cada renovación."], ["Cómo cancelar", "Desde «Mi suscripción», en cualquier momento, con un clic. Mantienes el acceso hasta el término del período ya pagado."], ["Pagos seguros", "Los datos de tu tarjeta los gestiona Mercado Pago; Copete Club nunca los almacena."]].map(([k, v]) => `<div class="rounded-xl border border-white/[.07] p-4"><p class="text-gold">${k}</p><p class="mt-1 text-muted">${v}</p></div>`).join("")}</section></div>`;
}
function viewProfile() {
  const reduced = document.documentElement.dataset.motion === "reduced";
  return `<div class="flex max-w-3xl flex-col gap-10"><header><h1 class="font-display text-[clamp(3rem,10vw,5.5rem)] font-extrabold uppercase leading-[.85]">Profile</h1></header>
  <section class="flex flex-col gap-4"><h2 class="font-display text-3xl font-bold uppercase">Tu país</h2>${countrySelect("País para recetas y Local Twist", "profile-country")}
  <p class="font-ui text-sm text-faint">No usamos tu ubicación precisa: solo el país que eliges.</p></section>
  ${APP ? "" : `<section class="flex flex-col gap-3"><h2 class="font-display text-3xl font-bold uppercase">Membresía</h2><p>Versión de revisión con acceso completo.</p><a href="#suscripcion" class="btn-ghost self-start">Mi suscripción</a></section>`}
  <section class="flex flex-col gap-4"><h2 class="font-display text-3xl font-bold uppercase">Accesibilidad</h2><label class="flex items-center justify-between gap-4"><span>Reducir animaciones<span class="block font-ui text-sm text-muted">También respetamos la preferencia de tu sistema.</span></span>
  <button data-motion role="switch" aria-checked="${reduced}" class="relative h-7 w-12 shrink-0 rounded-full border border-white/20 ${reduced ? "bg-turq/60" : "bg-smoke"}"><span class="absolute top-0.5 h-5 w-5 rounded-full bg-white ${reduced ? "left-6" : "left-0.5"}"></span></button></label></section>
  <section class="flex flex-col items-start gap-3 border-t border-white/[.07] pt-6"><a href="privacidad.html" class="font-ui text-sm text-muted underline hover:text-white">Política de privacidad</a><button data-reset class="font-ui text-sm text-faint underline hover:text-danger">Borrar mis datos de este dispositivo</button><p class="font-ui text-sm text-faint">Copete Club es para mayores de 18 años. Disfruta con moderación.</p></section></div>`;
}
const viewNotFound = () => `<div class="flex flex-col items-start gap-4 py-16"><p class="neon-sign text-[clamp(4rem,14vw,9rem)]" style="--neon:#ff2ba6">404</p><p class="text-xl">Esta barra está cerrada. La página que buscas no existe.</p><a href="#explore" class="btn-neon">Volver a explorar</a></div>`;


// ───────────── ruleta "Descubrir mi próximo cóctel" ─────────────
const WHEEL_N = 12;
let wheel = null;
function wheelPool(f) {
  let list = DATA.cocktails;
  if (f === "mock") list = list.filter((c) => c.is_mocktail);
  else if (f === "pais") list = list.filter((c) => c.origin_country === S.country);
  else if (f === "clasico") list = list.filter((c) => c.era === "clasico" && !c.is_mocktail);
  else list = list.filter((c) => !c.is_mocktail);
  if (list.length < 4) list = DATA.cocktails.filter((c) => !c.is_mocktail);
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(WHEEL_N, shuffled.length));
}
const SEG_COLORS = ["#2a1747", "#14111c", "#3a0f2c", "#14111c", "#0f2b2c", "#14111c"];
function wheelSVG(items) {
  const n = items.length, seg = 360 / n, R = 150, rad = (d) => ((d - 90) * Math.PI) / 180;
  const pt = (d, r = R) => [160 + r * Math.cos(rad(d)), 160 + r * Math.sin(rad(d))];
  const slices = items.map((c, i) => {
    const [x1, y1] = pt(i * seg), [x2, y2] = pt((i + 1) * seg);
    const base = c.international_name.replace(/\s*\(.*\)/, ""); const name = base.length > 13 ? base.slice(0, 12) + "…" : base;
    return `<path d="M160 160 L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} Z" fill="${SEG_COLORS[i % SEG_COLORS.length]}" stroke="rgb(255 255 255 / .12)"/>
      <g transform="rotate(${(i + 0.5) * seg} 160 160)"><circle cx="160" cy="${160 - R + 13}" r="3.2" fill="${neonColor(c.color)}" style="filter:drop-shadow(0 0 4px ${neonColor(c.color)})"/>
      <text x="160" y="${160 - R + 24}" transform="rotate(90 160 ${160 - R + 24})" fill="#f4effa" font-family="Big Shoulders Text, Arial Narrow, sans-serif" font-weight="700" font-size="12" letter-spacing=".04em" dominant-baseline="middle">${esc(name.toUpperCase())}</text></g>`;
  }).join("");
  const bulbs = Array.from({ length: 24 }, (_, i) => { const [x, y] = pt(i * 15, R + 8); return `<circle cx="${x}" cy="${y}" r="2.6" fill="${i % 2 ? "#ff2ba6" : "#d8b46a"}" class="wheel-bulb" style="animation-delay:${(i % 2) * 0.35}s"/>`; }).join("");
  return `<svg viewBox="0 0 320 320" class="h-auto w-full max-w-[22rem]" role="img" aria-label="Ruleta de cócteles">
    <circle cx="160" cy="160" r="${R + 14}" fill="#0b0912" stroke="#8b3dff" stroke-width="2.5" class="neon-line" style="--neon:#8b3dff"/>
    ${bulbs}
    <g id="wheel-rot" style="transform-origin:160px 160px;transform:rotate(${wheel?.rot ?? 0}deg)">${slices}</g>
    <circle cx="160" cy="160" r="30" fill="#07050c" stroke="#ff2ba6" stroke-width="2" class="neon-line" style="--neon:#ff2ba6"/>
    <g transform="translate(138 138) scale(.69)">${logo(64).replace(/<svg[^>]*>/, "").replace("</svg>", "")}</g>
  </svg>`;
}
function openWheel(filter = "", inline = false) {
  wheel = { filter, inline, items: wheelPool(filter), rot: 0, spinning: false, result: null };
  renderWheel();
  if (!inline) document.body.style.overflow = "hidden";
}
function closeWheel() { const inl = wheel?.inline; wheel = null; if (!inl) { $("#wheel").innerHTML = ""; document.body.style.overflow = ""; } }
function wheelBody(w) {
  const r = w.result;
  const chips = [["", "Con alcohol"], ["mock", "Sin alcohol"], ["pais", `De ${country(S.country)?.name ?? "mi país"}`], ["clasico", "Clásicos"]];
  return `<div class="flex flex-wrap justify-center gap-2">${chips.map(([k, l]) => `<button data-wheelfilter="${k}" aria-pressed="${w.filter === k}" ${w.spinning ? "disabled" : ""} class="chip">${esc(l)}</button>`).join("")}</div>
    <div class="relative w-full max-w-[22rem]">
      <svg viewBox="0 0 40 40" class="absolute left-1/2 top-[-6px] z-10 h-9 w-9 -translate-x-1/2" aria-hidden="true"><path d="M8 4 L32 4 L20 30 Z" fill="#ff2ba6" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px #ff2ba6)"/></svg>
      ${wheelSVG(w.items)}
    </div>
    <div aria-live="polite" class="flex w-full flex-col gap-3">${r ? `<div class="surface flex w-full items-center gap-4 border-fuchsia/40 p-4 text-left">${glass(r, 70)}<div class="flex min-w-0 flex-col gap-1"><p class="font-ui text-sm text-muted">${country(r.origin_country)?.flag ?? ""} ${esc(country(r.origin_country)?.name)}</p><p class="neon-sign text-4xl uppercase" style="--neon:${neonColor(r.color)}">${esc(r.international_name)}</p><p class="text-sm text-muted">${esc(r.summary)}</p></div></div>
      <div class="flex w-full gap-3"><button data-wheel="spin" class="btn-ghost flex-1">Girar de nuevo</button><a href="#c-${r.slug}" class="btn-neon flex-1">Ver receta</a></div>`
    : `<button data-wheel="spin" ${w.spinning ? "disabled" : ""} class="btn-neon w-full !py-4 text-lg">${w.spinning ? "Girando…" : "Descubrir mi próximo cóctel"}</button>`}</div>`;
}
function renderWheel() {
  const w = wheel;
  if (w.inline) { const el = $("#wheel-inline"); if (el) el.innerHTML = wheelBody(w); return; }
  $("#wheel").innerHTML = `<div role="dialog" aria-modal="true" aria-label="Ruleta de cócteles" class="fixed inset-0 z-[110] flex flex-col overflow-y-auto bg-ink/95 backdrop-blur-md">
  <div class="flex items-center justify-between px-4 py-3"><p class="font-display text-2xl font-bold uppercase">Tu próximo cóctel</p><button data-wheel="close" class="btn-ghost !py-2">Cerrar</button></div>
  <div class="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-5 px-5 pb-10">${wheelBody(w)}</div></div>`;
}
function spinWheel() {
  const w = wheel; if (!w || w.spinning) return;
  if (w.result) { w.items = wheelPool(w.filter); w.result = null; w.rot = 0; renderWheel(); }
  const n = w.items.length, seg = 360 / n, i = Math.floor(Math.random() * n);
  const jitter = (Math.random() - 0.5) * seg * 0.6;
  const target = 360 * 6 + (360 - (i + 0.5) * seg) + jitter;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced";
  w.spinning = true; renderWheel();
  const g = $("#wheel-rot");
  requestAnimationFrame(() => {
    g.style.transition = reduced ? "none" : "transform 4.6s cubic-bezier(.12,.72,.1,1)";
    g.style.transform = `rotate(${target}deg)`;
    setTimeout(() => {
      if (wheel !== w) return;
      w.rot = target % 360; w.spinning = false; w.result = w.items[i];
      try { navigator.vibrate?.(60); } catch {}
      renderWheel();
    }, reduced ? 50 : 4700);
  });
}

// modo bartender
let bm = null;
function openBM(slug) { bm = { c: cocktail(slug), i: -1, left: null, timer: null }; renderBM(); document.body.style.overflow = "hidden"; try { navigator.wakeLock?.request("screen").then((l) => (bm.lock = l)).catch(() => {}); } catch {} }
function closeBM() { clearInterval(bm?.timer); bm?.lock?.release?.().catch(() => {}); bm = null; $("#bm").innerHTML = ""; document.body.style.overflow = ""; }
function renderBM() {
  const { c, i } = bm, st = c.steps[i], total = c.steps.length, fin = i === total - 1;
  $("#bm").innerHTML = `<div role="dialog" aria-modal="true" aria-label="Modo bartender: ${esc(c.international_name)}" class="fixed inset-0 z-[100] flex flex-col bg-ink">
  <div class="flex items-center justify-between border-b border-white/10 px-4 py-3"><p class="font-display text-2xl font-bold uppercase">${esc(c.international_name)}</p><button data-bm="close" class="btn-ghost !py-2">Salir</button></div>
  <div class="h-1 bg-white/5"><div class="h-full bg-fuchsia shadow-[0_0_10px_#ff2ba6]" style="width:${((i + 1) / total) * 100}%"></div></div>
  <div class="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-5 py-8 text-center">${i === -1 ? `<div>${glass(c, 150)}</div><p class="font-ui text-muted">Prepara todo antes de empezar</p>
    <ul class="w-full max-w-md text-left">${c.ingredients.map((x) => `<li class="flex justify-between gap-3 border-b border-white/[.07] py-2.5 text-lg"><span>${esc(x.name)}</span><span class="font-ui font-semibold text-turq">${esc(amount(x, servings))}</span></li>`).join("")}</ul>
    <p class="font-ui text-sm text-muted">${servings} ${servings === 1 ? "porción" : "porciones"} · ${esc(METHOD(c.prep_method)?.label ?? c.technique ?? "")} · ${esc(c.glass)} · Hielo: ${esc(c.ice ?? "—")}</p>
    ${c.tools?.length ? `<p class="font-ui text-sm text-muted">Necesitas: ${esc(c.tools.join(", "))}</p>` : ""}`
  : `<p class="font-ui text-lg text-fuchsia">Paso ${i + 1} de ${total}</p><p class="max-w-[24ch] font-display text-[clamp(2.2rem,8vw,4rem)] font-bold leading-[1.02]">${esc(st.instruction)}</p>
    ${st.timer_seconds ? `<div class="flex flex-col items-center gap-3"><p class="font-display text-6xl font-bold tabular-nums text-gold" aria-live="polite">${fmtT(bm.left ?? st.timer_seconds)}</p><button data-bm="timer" class="btn-ghost">${bm.timer ? "Detener temporizador" : "Iniciar temporizador"}</button></div>` : ""}
    ${fin && c.garnish ? `<p class="font-ui text-muted">Decoración: ${esc(c.garnish)}</p>` : ""}`}</div>
  <div class="grid grid-cols-2 gap-3 border-t border-white/10 p-4"><button data-bm="prev" ${i === -1 ? "disabled" : ""} class="btn-ghost !py-4 text-lg disabled:opacity-30">Anterior</button>
  ${fin ? `<button data-bm="done" class="btn-neon !py-4 text-lg">¡Listo! Salud</button>` : `<button data-bm="next" class="btn-neon !py-4 text-lg">${i === -1 ? "Empezar" : "Siguiente"}</button>`}</div></div>`;
}
function bmAction(a) {
  if (!bm) return;
  if (a === "close") return closeBM();
  if (a === "next" || a === "prev") { clearInterval(bm.timer); bm.timer = null; bm.left = null; bm.i = Math.max(-1, Math.min(bm.c.steps.length - 1, bm.i + (a === "next" ? 1 : -1))); return renderBM(); }
  if (a === "timer") {
    if (bm.timer) { clearInterval(bm.timer); bm.timer = null; bm.left = null; return renderBM(); }
    bm.left = bm.c.steps[bm.i].timer_seconds;
    bm.timer = setInterval(() => { bm.left--; if (bm.left <= 0) { clearInterval(bm.timer); bm.timer = null; bm.left = 0; try { navigator.vibrate?.(300); } catch {} } renderBM(); }, 1000);
    return renderBM();
  }
  if (a === "done") { const h = S.history[bm.c.slug] ?? { n: 0 }; S.history[bm.c.slug] = { n: h.n + 1, last: Date.now() }; S.pending.delete(bm.c.slug); save(); closeBM(); toast("Preparación registrada en Mi bar. ¡Salud!"); }
}

// ───────────── router y navegación ─────────────
const NAV = [["inicio", "Home", I.home], ["explore", "Explore", I.search], ["world-tour", "World Tour", I.globe], ["mixology-ai", "Mixology AI", I.spark], ["my-bar", "My Bar", I.bar], ["mocktails", "Mocktails", I.leaf], ["profile", "Profile", I.user]];
function navActive(r) { return r.startsWith("c-") ? "explore" : r.startsWith("pais-") ? "world-tour" : r === "suscripcion" ? "profile" : r; }
function renderNav(r) {
  const a = navActive(r);
  $("#side").innerHTML = `<a href="#inicio" class="mb-10 block">${wordmark()}</a><ul class="flex flex-col gap-1">${NAV.map(([h, l, i]) => `<li><a href="#${h}" ${a === h ? 'aria-current="page"' : ""} class="flex items-center gap-3 rounded-lg px-3 py-2.5 font-ui text-[1.02rem] font-semibold uppercase tracking-[.08em] transition-colors ${a === h ? "bg-violet/15 text-white shadow-[inset_2px_0_0_#8b3dff]" : "text-muted hover:text-white"}"><span class="${a === h ? "text-violet-soft" : ""}">${ic(i)}</span>${l}</a></li>`).join("")}</ul><div class="mt-auto font-ui text-sm text-muted">${APP ? `<a href="privacidad.html" class="hover:text-white">Privacidad</a>` : `<a href="#suscripcion" class="hover:text-white">Mi suscripción</a>`}</div>`;
  $("#top").innerHTML = `<a href="#inicio">${wordmark()}</a><div class="flex items-center gap-1"><a href="#mocktails" aria-label="Mocktails" class="rounded-full p-2.5 ${a === "mocktails" ? "text-turq" : "text-muted"}">${ic(I.leaf)}</a><a href="#profile" aria-label="Perfil" class="rounded-full p-2.5 ${a === "profile" ? "text-violet-soft" : "text-muted"}">${ic(I.user)}</a></div>`;
  $("#bottom").innerHTML = `<ul class="grid grid-cols-5">${NAV.slice(0, 5).map(([h, l, i]) => `<li><a href="#${h}" ${a === h ? 'aria-current="page"' : ""} class="flex flex-col items-center gap-1 py-2.5 font-ui text-[.68rem] font-semibold uppercase tracking-[.06em] ${a === h ? "text-white" : "text-faint"}"><span class="${a === h ? "text-fuchsia drop-shadow-[0_0_6px_#ff2ba6]" : ""}">${ic(i, "h-[22px] w-[22px]")}</span>${l}</a></li>`).join("")}</ul>`;
}
function route() { return decodeURIComponent(location.hash.slice(1)) || "inicio"; }
function render(keepScroll = false) {
  const r = route(); renderNav(r);
  const v = r === "inicio" ? viewHome() : r === "explore" ? viewExplore() : r === "world-tour" ? viewWorld() : r === "mixology-ai" ? viewAI() : r === "my-bar" ? viewBar()
    : r === "mocktails" ? viewMocktails() : r === "profile" ? viewProfile() : r === "suscripcion" ? (APP ? viewProfile() : viewSub()) : r.startsWith("c-") ? viewCocktail(r.slice(2)) : r.startsWith("pais-") ? viewCountry(r.slice(5)) : viewNotFound();
  const y = window.scrollY;
  $("#main").innerHTML = v;
  if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
  if (r === "world-tour") drawMap();
  if (r === "inicio") { if (!wheel?.inline || wheel.spinning) openWheel(wheel?.inline ? wheel.filter : "", true); else renderWheel(); }
  const t = { inicio: "Home", explore: "Explore", "world-tour": "Cocktail World Tour", "mixology-ai": "Mixology AI", "my-bar": "My Bar", mocktails: "Mocktails", profile: "Profile", suscripcion: "Mi suscripción" }[r] ?? (r.startsWith("c-") ? cocktail(r.slice(2))?.international_name : r.startsWith("pais-") ? country(r.slice(5).toUpperCase())?.name : "");
  document.title = `${t ? t + " · " : ""}Copete Club`;
}
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("opacity-0", "translate-y-4");
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.add("opacity-0", "translate-y-4"), 2600);
}

// ───────────── eventos ─────────────
document.addEventListener("click", (e) => {
  const el = e.target.closest("button, [data-go]"); if (!el) return;
  const d = el.dataset;
  if (d.bm) return bmAction(d.bm);
  if (d.go) { location.hash = "pais-" + d.go.toLowerCase(); return; }
  if ("discover" in d) return openWheel(d.discover === "mock" ? "mock" : "");
  if (d.wheel === "close") return closeWheel();
  if (d.wheel === "spin") return spinWheel();
  if (d.wheelfilter !== undefined && wheel && !wheel.spinning) { wheel.filter = d.wheelfilter; wheel.items = wheelPool(d.wheelfilter); wheel.result = null; wheel.rot = 0; return renderWheel(); }
  if (d.flavor !== undefined) { S.filters.flavor = d.flavor; render(true); return; }
  if ("clear" in d) { S.filters = {}; render(true); return; }
  if (d.zone) { zone = d.zone; document.querySelectorAll("[data-zone]").forEach((b) => { const on = b.dataset.zone === zone; b.setAttribute("aria-selected", on); b.classList.toggle("!border-turq", on); b.classList.toggle("!bg-turq/15", on); b.classList.toggle("!text-white", on); }); $("#map-list").innerHTML = mapList(); drawMap(); return; }
  if (d.fav) { S.fav.has(d.fav) ? S.fav.delete(d.fav) : S.fav.add(d.fav); save(); render(true); toast(S.fav.has(d.fav) ? "Guardado en favoritos" : "Quitado de favoritos"); return; }
  if (d.pending) { S.pending.has(d.pending) ? S.pending.delete(d.pending) : S.pending.add(d.pending); save(); render(true); return; }
  if ("togglecols" in d) { const b = $("#cols-box"); b.classList.toggle("hidden"); b.classList.toggle("flex"); return; }
  if (d.missing) { const c = cocktail(d.missing); const names = new Set(S.shop.filter((x) => !x.checked).map((x) => x.name.toLowerCase())); let n = 0; c.ingredients.forEach((i) => { if (!i.is_optional && !S.home.has(i.slug) && !names.has(i.name.toLowerCase())) { S.shop.push({ id: uid(), name: i.name, checked: false }); n++; } }); save(); toast(`${n} ingredientes agregados a tu lista de compras`); return; }
  if (d.serv) { servings = Math.max(1, Math.min(12, servings + +d.serv)); const c = cocktail(route().slice(2)); $("#ings").innerHTML = ingRows(c); $("#serv").textContent = `${servings} ${servings === 1 ? "porción" : "porciones"}`; return; }
  if (d.bmode) return openBM(d.bmode);
  if (d.star) { const r = S.ratings[d.slug] ?? { stars: 0, note: "" }; r.stars = +d.star; S.ratings[d.slug] = r; save(); render(true); toast("Valoración guardada"); return; }
  if (d.example) return ask(d.example);
  if (d.unpantry) { pantry = pantry.filter((x) => x !== d.unpantry); render(true); return; }
  if ("askpantry" in d) { const q = `Tengo ${pantry.map(ingName).join(", ")}. ¿Qué puedo preparar?`; pantry = []; return ask(q); }
  if (d.delcol) { S.cols = S.cols.filter((c) => c.id !== d.delcol); save(); render(true); return; }
  if (d.unhome) { S.home.delete(d.unhome); save(); render(true); return; }
  if (d.shopdel) { S.shop = S.shop.filter((x) => x.id !== d.shopdel); save(); render(true); return; }
  if (d.delrecipe) { S.recipes = S.recipes.filter((x) => x.id !== d.delrecipe); save(); render(true); return; }
  if (d.scroll) { document.getElementById(d.scroll)?.scrollIntoView({ behavior: "smooth" }); return; }
  if ("start" in d) { $("#start-msg").classList.remove("hidden"); return; }
  if ("motion" in d) { const on = document.documentElement.dataset.motion !== "reduced"; if (on) document.documentElement.dataset.motion = "reduced"; else delete document.documentElement.dataset.motion; store.set("motion", on ? "reduced" : "full"); render(true); return; }
  if ("reset" in d) { ["fav", "pending", "history", "ratings", "cols", "home", "shop", "recipes"].forEach((k) => store.set(k, k === "history" || k === "ratings" ? {} : [])); location.reload(); }
});
document.addEventListener("change", (e) => {
  const el = e.target, d = el.dataset;
  if ("country" in d) { S.country = el.value; save(); render(true); toast(`País: ${country(S.country).name}`); return; }
  if (d.filter) { S.filters[d.filter] = el.value; $("#results").innerHTML = results(search(S.filters)); return; }
  if ("pantry" in d && el.value) { pantry = [...new Set([...pantry, el.value])]; render(true); return; }
  if ("home" in d && el.value) { S.home.add(el.value); save(); render(true); return; }
  if (d.shopcheck) { const i = S.shop.find((x) => x.id === d.shopcheck); i.checked = el.checked; save(); render(true); return; }
  if (d.col) { const c = S.cols.find((x) => x.id === d.col); c.items = el.checked ? [...new Set([...c.items, d.slug])] : c.items.filter((x) => x !== d.slug); save(); toast("Colección actualizada"); return; }
  if (d.note) { const r = S.ratings[d.note] ?? { stars: 0, note: "" }; r.note = el.value.slice(0, 2000); S.ratings[d.note] = r; save(); toast("Nota guardada"); }
});
document.addEventListener("input", (e) => { if (e.target.dataset.filter === "q") { S.filters.q = e.target.value; $("#results").innerHTML = results(search(S.filters)); } });
document.addEventListener("submit", (e) => {
  e.preventDefault(); const f = e.target, d = f.dataset, fd = new FormData(f);
  if ("homeSearch" in d) { S.filters = { q: fd.get("q") }; location.hash = "explore"; return; }
  if ("ask" in d) return ask(String(fd.get("q") ?? ""));
  if ("chat" in d) return ask(String(fd.get("msg") ?? ""));
  if (d.newcol) { const name = String(fd.get("name")).trim(); if (!name) return; S.cols.push({ id: uid(), name, items: [d.newcol] }); save(); $("#cols-box").innerHTML = colsBox(d.newcol); toast("Colección creada"); return; }
  if ("shopadd" in d) { S.shop.push({ id: uid(), name: String(fd.get("name")).trim().slice(0, 120), checked: false }); save(); render(true); return; }
  if ("recipe" in d) { const lines = (k) => String(fd.get(k) ?? "").split("\n").map((l) => l.trim()).filter(Boolean); S.recipes.unshift({ id: uid(), name: String(fd.get("name")).trim(), ing: lines("ing"), steps: lines("steps") }); save(); render(true); toast("Receta guardada"); }
});
document.addEventListener("keydown", (e) => { if (wheel && !wheel.inline && e.key === "Escape") return closeWheel(); if (!bm) return; if (e.key === "Escape") closeBM(); if (e.key === "ArrowRight") bmAction("next"); if (e.key === "ArrowLeft") bmAction("prev"); });
document.addEventListener("mouseover", (e) => { const el = e.target.closest("[data-tip]"); const tip = $("#map-tip"); if (!tip) return; if (el) { const c = country(el.dataset.tip), n = counts()[c.code]; tip.textContent = `${c.flag} ${c.name} · ${n} ${n === 1 ? "cóctel" : "cócteles"}`; } });
window.addEventListener("hashchange", () => { if (bm) closeBM(); if (wheel && !wheel.inline) closeWheel(); else if (wheel?.inline) wheel = null; render(); });

// ───────────── verificación de edad ─────────────
function ageGate() {
  if (store.get("adult", false)) return;
  const el = document.createElement("div");
  el.id = "age-gate";
  el.innerHTML = `<div role="dialog" aria-modal="true" aria-labelledby="age-t" class="fixed inset-0 z-[200] flex items-center justify-center bg-ink/95 p-6 backdrop-blur">
    <div class="surface flex w-full max-w-sm flex-col items-center gap-5 p-8 text-center">${logo(64)}
    <h2 id="age-t" class="font-display text-4xl font-bold uppercase">¿Tienes 18 años o más?</h2>
    <p class="text-muted">Copete Club tiene recetas con alcohol y es solo para personas mayores de edad.</p>
    <div class="flex w-full flex-col gap-3"><button data-age="yes" class="btn-neon w-full">Sí, tengo 18 o más</button><button data-age="no" class="btn-ghost w-full">No</button></div>
    <p id="age-no" class="hidden font-ui text-sm text-gold">Vuelve cuando cumplas 18. Mientras, no podemos mostrarte el contenido.</p></div></div>`;
  document.body.appendChild(el); document.body.style.overflow = "hidden";
  el.addEventListener("click", (e) => {
    const a = e.target.closest("[data-age]")?.dataset.age; if (!a) return;
    if (a === "yes") { store.set("adult", true); el.remove(); document.body.style.overflow = ""; }
    else $("#age-no").classList.remove("hidden");
  });
  setTimeout(() => el.querySelector('[data-age="yes"]').focus(), 50);
}

// ───────────── arranque ─────────────
ageGate();
if (APP && $("#foot")) $("#foot").textContent = "Copete Club · 175 cócteles y mocktails del mundo. Tus favoritos y tu bar se guardan en este teléfono. Disfruta con responsabilidad · Solo para mayores de 18 años.";
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
if (store.get("motion", "full") === "reduced") document.documentElement.dataset.motion = "reduced";
fetch("data.json?v=4").then((r) => r.json()).then((d) => {
  DATA = d; render();
  fetch("world.json?v=2").then((r) => r.json()).then((w) => { WORLD = w; if (route() === "world-tour") drawMap(); }).catch(() => {});
}).catch(() => { $("#main").innerHTML = `<p class="p-6 text-danger">No se pudo cargar el catálogo. Recarga la página.</p>`; });
})();
