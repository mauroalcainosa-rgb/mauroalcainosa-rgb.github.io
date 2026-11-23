import { OCCASIONS, RECIPIENTS, STYLES, LENGTHS, TEMPLATES, STICKERS, FONTS, OCC_TEMPLATE, localGenerate, localImprove } from './data.js';

/* ---------- Estado y persistencia ---------- */
const KEY = 'saludafacil:v1';
const FREE_DAILY = 15;
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
function seed() {
  return {
    profile: { name: '', signature: '', notify: false },
    history: [], favs: [], cards: [],
    events: [
      { id: uid(), name: 'Mamá', date: shiftYear(addDays(4), -60), type: 'cumpleanos', relation: 'mama', remind: [1, 3] },
      { id: uid(), name: 'Carolina', date: shiftYear(addDays(12), -3), type: 'aniversario', relation: 'pareja', remind: [3] },
      { id: uid(), name: 'Diego (oficina)', date: shiftYear(addDays(25), -35), type: 'cumpleanos', relation: 'colega', remind: [0] },
    ],
    premium: { trialEnd: 0, plan: null, until: 0 },
    usage: { date: todayISO(), count: 0 },
    notified: {},
  };
}
function shiftYear(iso, n) { const [y, m, d] = iso.split('-'); return `${+y + n}-${m}-${d}`; }
let S;
try { S = Object.assign(seed(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch { S = seed(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('No se pudo guardar (almacenamiento lleno)'); } };
save();

const isPremium = () => (S.premium.until > Date.now()) || (S.premium.trialEnd > Date.now());
const occ = (id) => OCCASIONS.find((o) => o.id === id) || OCCASIONS[OCCASIONS.length - 1];
const rec = (id) => RECIPIENTS.find((r) => r.id === id) || RECIPIENTS[RECIPIENTS.length - 1];
const sty = (id) => STYLES.find((s) => s.id === id) || STYLES[7];
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const capCache = {};
const claudeCap = (n) => (window.claude?.use ? (capCache[n] ||= Promise.race([window.claude.use(n), new Promise((r) => setTimeout(() => r(null), 4000))]).catch(() => null)) : Promise.resolve(null));

function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2200); }

/* ---------- Fechas ---------- */
function nextDate(iso) {
  const [, m, d] = iso.split('-').map(Number);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  let n = new Date(now.getFullYear(), m - 1, d);
  if (n < now) n = new Date(now.getFullYear() + 1, m - 1, d);
  return n;
}
const daysUntil = (dt) => { const n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((dt - n) / 864e5); };
function nthSunday(year, month, nth) { const d = new Date(year, month, 1); const add = (7 - d.getDay()) % 7; return new Date(year, month, 1 + add + 7 * (nth - 1)); }
function holidays() {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const list = (y) => [
    { name: 'Navidad', type: 'navidad', d: new Date(y, 11, 25) },
    { name: 'Año Nuevo', type: 'anonuevo', d: new Date(y, 11, 31) },
    { name: 'San Valentín', type: 'amor', d: new Date(y, 1, 14) },
    { name: 'Día de la Mujer', type: 'mujer', d: new Date(y, 2, 8) },
    { name: 'Día de la Madre', type: 'madre', d: nthSunday(y, 4, 2) },
    { name: 'Día del Padre', type: 'padre', d: nthSunday(y, 5, 3) },
  ];
  return [...list(now.getFullYear()), ...list(now.getFullYear() + 1)].filter((h) => h.d >= now).map((h) => ({ ...h, holiday: true }));
}
function upcoming(limit = 8) {
  const evs = S.events.map((e) => ({ ...e, d: nextDate(e.date) }));
  const seen = new Set();
  const hol = holidays().filter((h) => { if (seen.has(h.type)) return false; seen.add(h.type); return true; });
  return [...evs, ...hol].sort((a, b) => a.d - b.d).slice(0, limit);
}
const fmtDate = (d) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
const whenTxt = (n) => (n === 0 ? '¡Hoy!' : n === 1 ? 'Mañana' : `En ${n} días`);

/* ---------- Generación ---------- */
function canGenerate() {
  if (S.usage.date !== todayISO()) S.usage = { date: todayISO(), count: 0 };
  if (isPremium() || S.usage.count < FREE_DAILY) return true;
  premiumSheet(`Usaste tus ${FREE_DAILY} generaciones gratis de hoy. Mañana se renuevan, o prueba Premium sin límites.`);
  return false;
}
async function generate(o) {
  if (!canGenerate()) return null;
  S.usage.count++; save();
  const payload = { ...o, occasionName: occ(o.occasion).name, recipientName: rec(o.recipient).name, styleName: sty(o.style).name };
  let msgs = null, source = 'local';
  const sm = await claudeCap('sample');
  if (sm) {
    try {
      const L = { muycorto: 'una sola frase', corto: '2 a 3 líneas', mediano: 'un párrafo de 4 a 6 líneas', largo: '2 o 3 párrafos emotivos' };
      const ask = o.mode === 'improve' ? `Mejora este mensaje conservando su intención. Estilo: ${sty(o.style).name}. Mensaje: «${o.text}»`
        : [`Ocasión: ${payload.occasionName}`, o.context && `Contexto: ${o.context}`, `Destinatario: ${payload.recipientName}`, `Estilo: ${payload.styleName}`, `Extensión: ${L[o.length] || L.corto}`, o.name && `Nombre: ${o.name}`, o.nickname && `Apodo: ${o.nickname}`, o.memory && `Recuerdo a mencionar: ${o.memory}`, o.phrase && `Frase a incluir: ${o.phrase}`, o.signature && `Firma: ${o.signature}`, o.whatsapp && 'Optimiza para WhatsApp con emojis moderados.'].filter(Boolean).join('\n');
      const j = await sm.json(`Eres el redactor de SaludaFácil, app chilena de saludos. Escribe en español de Chile, natural y cálido; evita clichés, adapta tú/usted al destinatario, no exageres emociones ni inventes datos. Entrega 3 propuestas distintas. Responde solo JSON {"messages":["","",""]}.\n\n${ask}`, { modelTier: 'quick' });
      if (Array.isArray(j?.messages) && j.messages.length) { msgs = j.messages.slice(0, 3).map(String); source = 'ai'; }
    } catch { /* respaldo */ }
  }
  if (!msgs) try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    const r = await fetch('./api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctl.signal });
    clearTimeout(t);
    if (r.ok) { const j = await r.json(); if (Array.isArray(j.messages) && j.messages.length) { msgs = j.messages; source = 'ai'; } }
  } catch { /* respaldo local */ }
  if (!msgs) {
    msgs = o.mode === 'improve' ? localImprove(o.text, o.style) : localGenerate(o);
    if (o.whatsapp && o.mode !== 'improve') msgs = msgs.map((m) => `${occ(o.occasion).emoji} ${m} ${occ(o.occasion).emoji}`);
  }
  const ts = Date.now();
  msgs.forEach((text) => S.history.unshift({ id: uid(), ts, text, occasion: o.occasion || 'otras', recipient: o.recipient || 'otro', name: o.name || '' }));
  S.history = S.history.slice(0, 150); save();
  return { msgs, source };
}

function resultsHTML(res, o) {
  if (!res) return '';
  return `<div class="row between"><h2 style="margin:0">Elige tu favorito</h2><span class="tag">${res.source === 'ai' ? '✨ Creado con IA' : '⚡ Modo rápido'}</span></div>
  <div class="results" style="margin-top:12px">${res.msgs.map((m) => msgHTML(m, o)).join('')}</div>`;
}
function msgHTML(text, o = {}) {
  const data = esc(JSON.stringify({ text, occasion: o.occasion || 'otras', name: o.name || '', recipient: o.recipient || 'otro' }));
  return `<article class="msg" data-msg="${data}"><p contenteditable="false">${esc(text)}</p>
  <div class="acts">
    <button class="btn sm grad" data-act="card">🎨 Hacer tarjeta</button>
    <a class="btn sm wa" data-act="wa" href="https://wa.me/" target="_blank" rel="noopener">WhatsApp</a>
    <button class="btn sm light" data-act="copy">📋 Copiar</button>
    <button class="btn sm light" data-act="share">📤 Compartir</button>
    <button class="btn sm light" data-act="mail">✉️ Correo</button>
    <button class="btn sm light" data-act="fav">⭐ Guardar</button>
    <button class="btn sm light" data-act="audio">🔊 Escuchar</button>
    <button class="btn sm light" data-act="edit">✏️ Editar</button>
  </div></article>`;
}
const msgData = (el) => { const m = el.closest('[data-msg]'); const d = JSON.parse(m.dataset.msg); d.text = $('p', m)?.innerText.trim() || d.text; return d; };

/* ---------- Compartir ---------- */
async function copy(t) { try { await navigator.clipboard.writeText(t); toast('¡Copiado! 📋'); } catch { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('¡Copiado! 📋'); } }
const waURL = (t) => `https://wa.me/?text=${encodeURIComponent(t)}`;
const openWA = (t) => { const a = document.createElement('a'); a.href = waURL(t); a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); };
const openMail = (t, subj = 'Un saludo para ti') => { location.href = `mailto:?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(t)}`; };
async function shareText(t) { if (navigator.share) { try { await navigator.share({ text: t }); return; } catch (e) { if (e.name === 'AbortError') return; } } copy(t); toast('Copiado: pégalo en la app que quieras'); }

/* ---------- Audio ---------- */
const VOICE_STYLES = [{ id: 'calida', name: 'Cálida', rate: 0.95, pitch: 1.05 }, { id: 'alegre', name: 'Alegre', rate: 1.1, pitch: 1.3, p: 1 }, { id: 'solemne', name: 'Solemne', rate: 0.82, pitch: 0.9, p: 1 }, { id: 'narrador', name: 'Narrador', rate: 0.95, pitch: 0.75, p: 1 }];
function esVoices() { const v = (speechSynthesis?.getVoices() || []).filter((x) => x.lang.toLowerCase().startsWith('es')); const pref = ['es-cl', 'es-419', 'es-us', 'es-mx', 'es-ar', 'es-es']; return v.sort((a, b) => (pref.indexOf(a.lang.toLowerCase()) + 99) % 99 - (pref.indexOf(b.lang.toLowerCase()) + 99) % 99); }
function audioSheet(text) {
  if (!('speechSynthesis' in window)) return toast('Tu navegador no permite voz');
  const render = () => {
    const vs = esVoices();
    openSheet(`<h2>🔊 Saludo hablado</h2><p class="mut small">Escucha tu mensaje con una voz natural. Las voces dependen de tu dispositivo.</p>
    <div class="field"><span>Voz</span><select id="vz">${vs.map((v, i) => `<option value="${i}">${esc(v.name)} (${v.lang})</option>`).join('') || '<option>Voz por defecto</option>'}</select></div>
    <h3 style="margin-top:14px">Estilo de narración</h3><div class="chips" id="vst">${VOICE_STYLES.map((s, i) => `<button class="chip ${i ? '' : 'on'}" data-vs="${s.id}">${s.name}${s.p && !isPremium() ? ' 🔒' : ''}</button>`).join('')}</div>
    <div class="row" style="margin-top:16px"><button class="btn grad" id="play">▶️ Reproducir</button><button class="btn light" id="stop">⏹ Detener</button></div>`);
    let cur = VOICE_STYLES[0];
    $('#vst').onclick = (e) => { const b = e.target.closest('[data-vs]'); if (!b) return; const s = VOICE_STYLES.find((x) => x.id === b.dataset.vs); if (s.p && !isPremium()) return premiumSheet('Los estilos de voz Alegre, Solemne y Narrador son Premium.'); cur = s; $$('#vst .chip').forEach((c) => c.classList.toggle('on', c === b)); };
    $('#play').onclick = () => { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); const v = vs[+$('#vz').value]; if (v) u.voice = v; u.lang = v?.lang || 'es-CL'; u.rate = cur.rate; u.pitch = cur.pitch; speechSynthesis.speak(u); };
    $('#stop').onclick = () => speechSynthesis.cancel();
  };
  render(); if (!esVoices().length) speechSynthesis.onvoiceschanged = () => { if (!$('#sheet').hidden && $('#vz')) render(); };
}

/* ---------- Sheet ---------- */
function openSheet(html) { $('#sheet-body').innerHTML = html; $('#sheet').hidden = false; setTimeout(() => $('#sheet-card, .sheet-card')?.focus?.(), 0); }
function closeSheet() { $('#sheet').hidden = true; $('#sheet-body').innerHTML = ''; try { speechSynthesis.cancel(); } catch {} }
$('#sheet').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

function premiumSheet(reason) {
  openSheet(`<div style="font-size:48px">💎</div><h2>Desbloquea Premium</h2><p>${esc(reason)}</p>
  <ul><li>Generaciones ilimitadas</li><li>Plantillas exclusivas y tarjetas animadas (GIF/MP4)</li><li>Voces y estilos de narración</li><li>Recordatorios avanzados y sin publicidad</li></ul>
  <div class="row">${S.premium.trialEnd ? '' : '<button class="btn grad" data-act="trial">Probar 7 días gratis</button>'}<a class="btn light" href="#/premium" data-close>Ver planes</a></div>`);
}

/* ---------- Vistas ---------- */
const routes = {};
function nav() {
  closeSheet(); stopAnim();
  const [path, ...rest] = (location.hash.replace(/^#\/?/, '') || '').split('/');
  const view = routes[path] ? path : '';
  $$('.tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === (view || 'home') || (view === 'crear' && a.dataset.tab === 'home')));
  app.innerHTML = ''; app.style.animation = 'none'; void app.offsetWidth; app.style.animation = '';
  routes[view](rest.map(decodeURIComponent));
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', nav);

routes[''] = () => {
  const up = upcoming(8);
  app.innerHTML = `
  <section class="hero"><h1>¿A quién quieres sorprender hoy?</h1><p>Tú pones el cariño. Nosotros encontramos las palabras.</p>
    <form class="search" id="srch" role="search"><input id="q" placeholder="¿Qué necesitas saludar hoy?" aria-label="Buscar ocasión" autocomplete="off"><button class="btn grad sm">Buscar</button></form></section>
  <div class="quick">
    <button class="btn grad" data-act="express">🚨 ¡Necesito un saludo urgente!<small>3 opciones al instante</small></button>
    <button class="btn" data-act="surprise">🎲 Sorpréndeme<small>Un mensaje al azar</small></button>
    <button class="btn light" data-act="improve">🪄 Mejora mi mensaje<small>Tú escribes, la IA pule</small></button>
    <button class="btn light" data-act="humor">😂 Modo humor<small>Saludos divertidos</small></button>
  </div>
  <h2>📅 No olvides saludar</h2>
  <div class="upcoming">${up.map((e) => { const n = daysUntil(e.d); return `<div class="ev"><span class="mut small">${occ(e.type).emoji} ${e.holiday ? 'Fecha especial' : occ(e.type).name}</span><b>${esc(e.name)}</b><span class="d ${n <= 3 ? 'soon' : ''}">${whenTxt(n)}</span><span class="mut small">${fmtDate(e.d)}</span><button class="btn sm grad" data-act="greet" data-occ="${e.type}" data-rec="${e.relation || 'otro'}" data-name="${esc(e.holiday ? '' : e.name)}">Saludar ahora</button></div>`; }).join('')}
  <a class="ev" href="#/calendario" style="justify-content:center;align-items:center;text-decoration:none;min-width:160px"><span style="font-size:34px">➕</span><b>Agregar fecha</b></a></div>
  <h2>Elige la ocasión</h2>
  <div class="grid" id="occs">${OCCASIONS.map(occCard).join('')}</div>
  ${isPremium() ? '' : `<aside class="ad"><span><b>Publicidad</b> · ¿Te gustan las tarjetas? Con Premium las animas y quitas este aviso.</span><a class="btn sm light" href="#/premium">Ver</a></aside>`}
  <p class="foot">SaludaFácil · Hecho en Chile 🇨🇱 · Tus datos se guardan en este dispositivo.</p>`;
  $('#q').addEventListener('input', (e) => {
    const q = norm(e.target.value);
    $$('#occs .occ').forEach((el) => { const o = occ(el.dataset.occ); el.hidden = q && !norm(o.name + ' ' + o.kw).includes(q); });
  });
  $('#srch').addEventListener('submit', (e) => {
    e.preventDefault(); const q = $('#q').value.trim(); if (!q) return;
    const vis = $$('#occs .occ').filter((x) => !x.hidden);
    location.hash = vis.length ? `#/crear/${vis[0].dataset.occ}` : `#/crear/otras/${encodeURIComponent(q)}`;
  });
};
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const occCard = (o) => `<a class="occ" href="#/crear/${o.id}" data-occ="${o.id}" style="background:linear-gradient(135deg,${o.c[0]},${o.c[1]})"><span class="e">${o.emoji}</span><b>${o.name}</b></a>`;

/* Generador */
let G = {};
routes.crear = ([o, ctx]) => {
  const pre = routes.crear.pre || {}; routes.crear.pre = null;
  G = { occasion: occ(o).id, recipient: pre.recipient || 'otro', style: pre.style || (o === 'condolencias' ? 'elegante' : 'emotivo'), length: 'corto', name: pre.name || '', nickname: '', memory: '', phrase: '', signature: S.profile.signature || '', context: ctx || '', whatsapp: false };
  const O = occ(G.occasion);
  const chips = (list, key) => list.filter((x) => !(key === 'style' && G.occasion === 'condolencias' && x.id === 'divertido')).map((x) => `<button class="chip ${G[key] === x.id ? 'on' : ''}" data-set="${key}" data-val="${x.id}">${x.emoji ? x.emoji + ' ' : ''}${x.name}</button>`).join('');
  app.innerHTML = `
  <div class="row between"><a href="#/" class="btn sm ghost">← Volver</a><span class="mut small">Paso a paso, sin complicaciones</span></div>
  <div class="hero" style="background:linear-gradient(135deg,${O.c[0]},${O.c[1]});margin-top:12px;padding:20px"><h1 style="font-size:32px">${O.emoji} ${O.name}</h1><p style="margin:0">Elige para quién y el estilo. Lo demás es opcional.</p></div>
  ${G.occasion === 'otras' ? `<div class="step"><label class="field">¿Qué ocasión es?<input data-in="context" value="${esc(G.context)}" placeholder="Ej: jubilación, mejórate pronto, bienvenida…"></label></div>` : ''}
  <div class="step"><h3>A. ¿Para quién es?</h3><div class="chips">${chips(RECIPIENTS, 'recipient')}</div></div>
  <div class="step"><h3>B. ¿Qué estilo quieres?</h3><div class="chips">${chips(STYLES, 'style')}</div></div>
  <div class="step"><h3>C. ¿Qué extensión prefieres?</h3><div class="chips">${chips(LENGTHS, 'length')}</div></div>
  <details class="more" ${G.name ? 'open' : ''}><summary>D. Personalizar (opcional)</summary>
    <div class="fields" style="margin-top:12px">
      <label class="field">Nombre del destinatario<input data-in="name" value="${esc(G.name)}" placeholder="Ej: Camila"></label>
      <label class="field">Apodo o forma de llamarlo<input data-in="nickname" placeholder="Ej: Cami, flaca, jefecito"></label>
      <label class="field">Recuerdo especial<input data-in="memory" placeholder="Ej: el viaje a Pucón"></label>
      <label class="field">Frase que quieras incluir<input data-in="phrase" placeholder="Ej: ¡Nos vemos el sábado!"></label>
      <label class="field">Tu firma<input data-in="signature" value="${esc(G.signature)}" placeholder="Ej: Tu hermano Mauro"></label>
    </div>
    <label class="row small" style="margin-top:12px"><input type="checkbox" data-in="whatsapp"> Optimizar para WhatsApp (emojis y saltos de línea)</label>
  </details>
  <div class="sticky-cta"><button class="btn grad" data-act="gen">✨ Generar 3 propuestas</button></div>
  <section id="res" style="margin-top:22px"></section>`;
  if (routes.crear.autogen) { routes.crear.autogen = false; runGen(); }
};
app.addEventListener('input', (e) => { const k = e.target.dataset?.in; if (k) G[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; });
app.addEventListener('change', (e) => { const k = e.target.dataset?.in; if (k && e.target.type === 'checkbox') G[k] = e.target.checked; });
async function runGen(target = $('#res'), o = G) {
  if (!target) return;
  target.innerHTML = '<div class="results"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>';
  if (target.id === 'res') target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const res = await generate(o);
  target.innerHTML = res ? resultsHTML(res, o) : '';
}

/* Calendario */
routes.calendario = () => {
  const evs = S.events.map((e) => ({ ...e, d: nextDate(e.date) })).sort((a, b) => a.d - b.d);
  const types = OCCASIONS.filter((o) => ['cumpleanos', 'aniversario', 'matrimonio', 'graduacion', 'familia', 'logros', 'otras'].includes(o.id));
  app.innerHTML = `<h1>📅 Fechas importantes</h1><p class="mut">Registra cumpleaños, aniversarios y celebraciones. Te avisamos antes para que nunca se te pase.</p>
  <form class="card" id="evf"><h3>Agregar fecha</h3><div class="fields">
    <label class="field">Nombre<input name="name" required maxlength="60" placeholder="Ej: Abuela Rosa"></label>
    <label class="field">Fecha<input name="date" type="date" required></label>
    <label class="field">Tipo de celebración<select name="type">${types.map((t) => `<option value="${t.id}">${t.emoji} ${t.name}</option>`).join('')}</select></label>
    <label class="field">Relación<select name="relation">${RECIPIENTS.map((r) => `<option value="${r.id}">${r.name}</option>`).join('')}</select></label></div>
    <h3 style="margin-top:14px">Recordarme</h3><div class="chips" id="rem">${[[0, 'El mismo día'], [1, 'Un día antes'], [3, 'Tres días antes'], [7, 'Una semana antes']].map(([v, t], i) => `<label class="chip"><input type="checkbox" name="remind" value="${v}" ${i === 1 ? 'checked' : ''}> ${t}</label>`).join('')}</div>
    <p class="small mut">${isPremium() ? 'Premium: puedes combinar varios avisos.' : 'Gratis: un aviso por fecha. Con Premium combinas varios.'}</p>
    <div class="row"><button class="btn grad">Guardar fecha</button>${S.profile.notify ? '<span class="badge">🔔 Notificaciones activas</span>' : '<button type="button" class="btn light" data-act="notify">🔔 Activar notificaciones</button>'}</div></form>
  <h2>Próximas fechas</h2>
  <div class="list">${evs.length ? evs.map((e) => { const n = daysUntil(e.d); return `<div class="li"><span class="ic">${occ(e.type).emoji}</span><div class="grow"><b>${esc(e.name)}</b> <span class="tag">${rec(e.relation).name}</span><p>${occ(e.type).name} · ${fmtDate(e.d)} · <b class="${n <= 3 ? 'soon' : ''}">${whenTxt(n)}</b> · Aviso: ${e.remind.map((r) => (r ? `${r} día(s) antes` : 'mismo día')).join(', ') || 'sin aviso'}</p></div>
    <div class="row"><button class="btn sm grad" data-act="greet" data-occ="${e.type}" data-rec="${e.relation}" data-name="${esc(e.name)}">Saludar</button><button class="btn sm light" data-act="ics" data-id="${e.id}" title="Agregar a mi calendario">📆</button><button class="btn sm light" data-act="delev" data-id="${e.id}" aria-label="Eliminar">🗑</button></div></div>`; }).join('') : '<div class="empty"><div class="e">🗓️</div>Aún no tienes fechas.</div>'}</div>
  ${evs.length ? '<div class="row" style="margin-top:14px"><button class="btn light" data-act="icsall">📆 Exportar todas a mi calendario (.ics)</button></div><p class="small mut">Tip: exporta a tu calendario del teléfono para recibir avisos aunque la app esté cerrada.</p>' : ''}`;
  $('#rem').addEventListener('change', (e) => { if (!isPremium() && e.target.checked) $$('#rem input').forEach((i) => { if (i !== e.target) i.checked = false; }); });
  $('#evf').addEventListener('submit', (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    S.events.push({ id: uid(), name: f.get('name').trim(), date: f.get('date'), type: f.get('type'), relation: f.get('relation'), remind: f.getAll('remind').map(Number) });
    save(); toast('Fecha guardada ✅'); checkReminders(); nav();
  });
};
function icsFor(list) {
  const p = (n) => String(n).padStart(2, '0');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SaludaFacil//ES', 'CALSCALE:GREGORIAN'];
  list.forEach((e) => {
    const d = nextDate(e.date); const ds = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
    lines.push('BEGIN:VEVENT', `UID:${e.id}@saludafacil`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTSTART;VALUE=DATE:${ds}`, 'RRULE:FREQ=YEARLY', `SUMMARY:${occ(e.type).emoji} ${occ(e.type).name}: ${e.name.replace(/[,;\\]/g, ' ')}`, `DESCRIPTION:No olvides saludar. Crea tu saludo en ${location.origin}`);
    (e.remind.length ? e.remind : [0]).forEach((r) => lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Recordatorio SaludaFácil', r ? `TRIGGER:-P${r}D` : 'TRIGGER:PT9H', 'END:VALARM'));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  download(new Blob([lines.join('\r\n')], { type: 'text/calendar' }), 'saludafacil-fechas.ics');
}
async function download(blob, name) { const dl = await claudeCap('downloads'); if (dl) { try { await dl.save({ filename: name, data: blob }); return; } catch (e) { return toast('Descarga cancelada'); } } const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }

async function checkReminders() {
  const due = [];
  S.events.forEach((e) => { const n = daysUntil(nextDate(e.date)); if (e.remind.includes(n)) { const k = `${e.id}:${nextDate(e.date).getFullYear()}:${n}`; if (!S.notified[k]) { S.notified[k] = 1; due.push({ e, n }); } } });
  if (!due.length) return; save();
  for (const { e, n } of due) {
    const body = `${occ(e.type).name} de ${e.name}: ${whenTxt(n).toLowerCase()}. ¡Toca para crear tu saludo!`;
    toast(`🔔 ${body}`);
    if (S.profile.notify && 'Notification' in window && Notification.permission === 'granted') {
      const reg = await navigator.serviceWorker?.getRegistration();
      const opt = { body, icon: './icons/icon-192.png', data: `./#/crear/${e.type}`, tag: e.id };
      reg ? reg.showNotification('No olvides saludar 💌', opt) : new Notification('No olvides saludar 💌', opt);
    }
  }
}

/* Favoritos / historial */
routes.favoritos = ([tab = 'favs']) => {
  const T = { favs: '⭐ Favoritos', cards: '🎨 Tarjetas', history: '🕘 Historial' };
  const list = (arr, kind) => arr.length ? `<div class="list">${arr.map((m) => `<div class="li" data-msg="${esc(JSON.stringify(m))}"><span class="ic">${occ(m.occasion).emoji}</span><div class="grow"><b>${occ(m.occasion).name}${m.name ? ' · ' + esc(m.name) : ''}</b><p>${esc(m.text)}</p><span class="small mut">${new Date(m.ts).toLocaleDateString('es-CL')}</span></div>
    <div class="row"><button class="btn sm light" data-act="copy">📋</button><a class="btn sm wa" data-act="wa" href="https://wa.me/" target="_blank" rel="noopener">WA</a><button class="btn sm light" data-act="editsaved" data-kind="${kind}" data-id="${m.id}">✏️</button><button class="btn sm grad" data-act="card">🎨</button>${kind === 'history' ? '<button class="btn sm light" data-act="fav">⭐</button>' : ''}<button class="btn sm light" data-act="delmsg" data-kind="${kind}" data-id="${m.id}" aria-label="Eliminar">🗑</button></div></div>`).join('')}</div>` : `<div class="empty"><div class="e">${kind === 'favs' ? '⭐' : '🕘'}</div>${kind === 'favs' ? 'Guarda tus mensajes favoritos con ⭐.' : 'Aquí aparecerán los mensajes que generes.'}<br><a class="btn grad" href="#/" style="margin-top:12px">Crear un saludo</a></div>`;
  const cards = S.cards.length ? `<div class="thumbs">${S.cards.map((c) => `<div class="thumb"><img src="${c.thumb}" alt="Tarjeta ${esc(c.state.title || '')}" loading="lazy"><b class="small">${esc(c.state.title || occ(c.state.occasion).name)}</b><div class="row" style="margin-top:6px"><button class="btn sm light" data-act="opencard" data-id="${c.id}">✏️ Editar</button><button class="btn sm light" data-act="dupcard" data-id="${c.id}">👥 Duplicar</button><button class="btn sm light" data-act="delcard" data-id="${c.id}" aria-label="Eliminar">🗑</button></div></div>`).join('')}</div>` : '<div class="empty"><div class="e">🎨</div>Tus tarjetas guardadas aparecerán aquí.</div>';
  app.innerHTML = `<h1>Mis saludos</h1><div class="tabsx">${Object.entries(T).map(([k, v]) => `<button class="${k === tab ? 'on' : ''}" data-act="ftab" data-t="${k}">${v}</button>`).join('')}</div>
  ${tab === 'cards' ? cards : list(tab === 'history' ? S.history : S.favs, tab)}`;
};

/* Premium */
routes.premium = () => {
  const p = isPremium(); const left = S.premium.trialEnd > Date.now() ? Math.ceil((S.premium.trialEnd - Date.now()) / 864e5) : 0;
  app.innerHTML = `<h1>💎 SaludaFácil Premium</h1><p class="mut">Más creatividad, cero límites. ${p ? `<span class="badge">✅ Activo${left ? ` · prueba: ${left} día(s)` : ''}</span>` : ''}</p>
  <div class="plans">
    <div class="plan"><h3>Gratis</h3><div class="price">$0</div><ul><li>${FREE_DAILY} generaciones al día</li><li>Plantillas básicas</li><li>Compartir y descargar PNG/JPG</li><li>Un recordatorio por fecha</li><li>Publicidad discreta</li></ul><span class="mut small">Hoy usaste ${S.usage.date === todayISO() ? S.usage.count : 0} de ${FREE_DAILY}.</span></div>
    <div class="plan hi"><span class="tag">Más popular</span><h3>Premium mensual</h3><div class="price">$2.990<span class="small mut"> CLP/mes</span></div><ul><li>Generaciones ilimitadas</li><li>Plantillas exclusivas</li><li>Tarjetas animadas GIF/MP4</li><li>Voces y estilos de narración</li><li>Recordatorios avanzados</li><li>Sin publicidad</li></ul>
      ${S.premium.trialEnd ? '' : '<button class="btn grad" data-act="trial" style="width:100%">Probar 7 días gratis</button>'}<button class="btn light" data-act="sub" data-plan="mensual" style="width:100%;margin-top:8px">Suscribirme mensual</button></div>
    <div class="plan"><span class="tag">Ahorra 30%</span><h3>Premium anual</h3><div class="price">$24.990<span class="small mut"> CLP/año</span></div><ul><li>Todo lo de Premium</li><li>Equivale a $2.083 al mes</li></ul><button class="btn" data-act="sub" data-plan="anual" style="width:100%">Suscribirme anual</button></div>
  </div>
  <div class="card" style="margin-top:18px"><h3>Condiciones claras</h3><p class="small mut">La prueba gratuita dura 7 días y no requiere medio de pago. Al terminar, vuelves al plan Gratis salvo que elijas suscribirte. Las suscripciones se renuevan automáticamente al mismo precio (IVA incluido) y puedes cancelarlas cuando quieras desde Perfil, sin costo; mantienes Premium hasta el fin del período pagado.</p>
  ${p ? '<button class="btn sm light" data-act="cancel">Cancelar Premium</button>' : ''}</div>`;
};

/* Perfil */
routes.perfil = () => {
  app.innerHTML = `<h1>👤 Perfil</h1>
  <form class="card" id="pf"><div class="fields"><label class="field">Tu nombre<input name="name" value="${esc(S.profile.name)}" maxlength="60"></label><label class="field">Firma por defecto<input name="signature" value="${esc(S.profile.signature)}" maxlength="80" placeholder="Ej: Con cariño, Mauro"></label></div><button class="btn grad" style="margin-top:12px">Guardar</button></form>
  <div class="card" style="margin-top:14px"><h3>🔔 Notificaciones</h3><p class="small mut">Recibe avisos de cumpleaños y aniversarios.</p>${S.profile.notify ? '<button class="btn light" data-act="notifyoff">Desactivar notificaciones</button>' : '<button class="btn" data-act="notify">Activar notificaciones</button>'}</div>
  <div class="card" style="margin-top:14px"><h3>🔄 Sincronizar entre dispositivos</h3><p class="small mut">Exporta tu respaldo y ábrelo en otro dispositivo. Tus datos viajan solo contigo.</p><div class="row"><button class="btn light" data-act="backup">⬇️ Exportar respaldo</button><label class="btn light">⬆️ Importar respaldo<input type="file" accept="application/json" id="imp" class="sr"></label></div></div>
  <div class="card" style="margin-top:14px"><h3>📲 Instalar la app</h3><p class="small mut">Instálala en tu teléfono o computador para abrirla como una app.</p><button class="btn light" data-act="install">Instalar SaludaFácil</button></div>
  <div class="card" style="margin-top:14px"><h3>🔒 Privacidad</h3><p class="small mut">Tus fechas, mensajes y tarjetas se guardan solo en este dispositivo. Para generar mensajes con IA enviamos únicamente los datos del saludo (ocasión, estilo y lo que escribas), sin guardarlos en servidores. <a href="privacidad.html" target="_blank" rel="noopener">Política de privacidad</a></p><button class="btn sm light" data-act="wipe">Borrar todos mis datos</button></div>`;
  $('#pf').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target); S.profile.name = f.get('name').trim(); S.profile.signature = f.get('signature').trim(); save(); toast('Perfil guardado ✅'); });
  $('#imp').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); if (!d || !Array.isArray(d.events)) throw 0; S = Object.assign(seed(), d); save(); toast('Respaldo importado ✅'); nav(); } catch { toast('Archivo no válido'); }
  });
};

/* ---------- Editor de tarjetas ---------- */
const FORMATS = { vertical: [1080, 1350], cuadrado: [1080, 1080], horizontal: [1350, 1080] };
const ANIMS = [['none', 'Sin animación'], ['confetti', '🎊 Confeti'], ['snow', '❄️ Nieve'], ['hearts', '💕 Corazones'], ['sparkle', '✨ Destellos'], ['balloons', '🎈 Globos']];
let E = null, raf = 0, imgCache = new Map();
const stopAnim = () => { cancelAnimationFrame(raf); raf = 0; };
function newCard(d) {
  const t = TEMPLATES.find((x) => x.id === OCC_TEMPLATE[d.occasion]) || TEMPLATES[0];
  return { id: null, tpl: t.id, bg: [...t.bg], fg: t.fg, font: t.font, pattern: t.pattern, text: d.text, title: d.name ? `Para ${d.name}` : occ(d.occasion).name, signature: S.profile.signature || '', format: 'vertical', stickers: [{ e: occ(d.occasion).emoji, x: 0.82, y: 0.12, s: 0.12 }], photo: null, anim: 'none', occasion: d.occasion };
}
routes.tarjeta = () => {
  if (!E) { location.hash = '#/'; return; }
  const tabs = [['tpl', '🖼 Plantillas'], ['txt', '✏️ Texto'], ['col', '🎨 Colores'], ['img', '📷 Imagen'], ['stk', '😀 Stickers'], ['fmt', '📐 Formato'], ['ani', '✨ Animación']];
  const cats = [...new Set(TEMPLATES.map((t) => t.cat))];
  const palette = ['#ff6b6b', '#ff4ecd', '#7c4dff', '#2cb67d', '#00d2ff', '#ffca28', '#1b1b2f', '#ffffff', '#f4e1c1', '#0b3d2e', '#b71c1c', '#283593'];
  app.innerHTML = `<div class="row between"><button class="btn sm ghost" data-act="back">← Volver</button><h2 style="margin:0">Tu tarjeta</h2><span></span></div>
  <div class="editor" style="margin-top:14px">
    <div class="stage"><canvas id="cv" aria-label="Vista previa de la tarjeta"></canvas><span class="small mut">Arrastra los stickers para moverlos</span>
      <div class="row" style="justify-content:center"><button class="btn sm grad" data-act="dl" data-f="png">⬇️ PNG</button><button class="btn sm light" data-act="dl" data-f="jpg">⬇️ JPG</button><button class="btn sm wa" data-act="sharecard">WhatsApp / Compartir</button><button class="btn sm light" data-act="savecard">⭐ Guardar</button></div>
      <div class="row" style="justify-content:center"><button class="btn sm light" data-act="gif">🎞 GIF animado${isPremium() ? '' : ' 🔒'}</button><button class="btn sm light" data-act="video">🎬 Video${isPremium() ? '' : ' 🔒'}</button></div></div>
    <div class="card"><div class="tabsx">${tabs.map(([k, v], i) => `<button class="${i ? '' : 'on'}" data-act="etab" data-t="${k}">${v}</button>`).join('')}</div>
      <div class="panel on" data-p="tpl">${cats.map((c) => `<h3 class="small" style="margin:10px 0 6px">${c}</h3><div class="tpls">${TEMPLATES.filter((t) => t.cat === c).map((t) => `<button class="tpl ${E.tpl === t.id ? 'on' : ''}" data-act="tpl" data-id="${t.id}" style="background:linear-gradient(160deg,${t.bg[0]},${t.bg[1]});color:${t.fg};font-family:'${t.font}'">${t.premium && !isPremium() ? '<span class="lock">🔒</span>' : ''}${t.name}</button>`).join('')}</div>`).join('')}</div>
      <div class="panel" data-p="txt"><div class="fields" style="grid-template-columns:1fr">
        <label class="field">Título / destinatario<input data-e="title" value="${esc(E.title)}" maxlength="50"></label>
        <label class="field">Mensaje<textarea data-e="text" rows="6">${esc(E.text)}</textarea></label>
        <label class="field">Firma<input data-e="signature" value="${esc(E.signature)}" maxlength="60"></label>
        <label class="field">Tipografía<select data-e="font">${FONTS.map((f) => `<option ${E.font === f ? 'selected' : ''} style="font-family:'${f}'">${f}</option>`).join('')}</select></label></div></div>
      <div class="panel" data-p="col"><h3 class="small">Color del texto</h3><div class="swatches" data-cset="fg">${palette.map((c) => `<button class="sw" style="background:${c}" data-c="${c}" aria-label="${c}"></button>`).join('')}<input type="color" data-e="fg" value="${E.fg}" aria-label="Color personalizado"></div>
        <h3 class="small" style="margin-top:12px">Fondo (degradado)</h3><div class="row"><label class="field">Color 1<input type="color" data-e="bg0" value="${E.bg[0]}"></label><label class="field">Color 2<input type="color" data-e="bg1" value="${E.bg[1]}"></label></div>
        <h3 class="small" style="margin-top:12px">Decoración de fondo</h3><div class="chips">${['none', 'confetti', 'dots', 'hearts', 'stars', 'snow', 'balloons', 'flowers', 'stripes', 'blobs', 'frame', 'line', 'marble'].map((p) => `<button class="chip ${E.pattern === p ? 'on' : ''}" data-act="pat" data-p="${p}">${p === 'none' ? 'Ninguna' : p}</button>`).join('')}</div></div>
      <div class="panel" data-p="img"><p class="small mut">Agrega una fotografía personal (se queda en tu dispositivo).</p><label class="btn light">📷 Elegir foto<input type="file" accept="image/*" id="ph" class="sr"></label> ${E.photo ? '<button class="btn sm light" data-act="rmphoto">Quitar foto</button>' : ''}</div>
      <div class="panel" data-p="stk"><div class="row">${STICKERS.map((s) => `<button class="stk" data-act="addstk" data-s="${s}">${s}</button>`).join('')}</div>
        <div class="row" style="margin-top:10px"><span class="small mut">Sticker seleccionado:</span><button class="btn sm light" data-act="stksize" data-d="-1">➖</button><button class="btn sm light" data-act="stksize" data-d="1">➕</button><button class="btn sm light" data-act="stkdel">🗑 Quitar</button></div></div>
      <div class="panel" data-p="fmt"><div class="chips">${Object.keys(FORMATS).map((f) => `<button class="chip ${E.format === f ? 'on' : ''}" data-act="fmt" data-f="${f}">${{ vertical: '📱 Vertical', cuadrado: '⬛ Cuadrado', horizontal: '🖥 Horizontal' }[f]}</button>`).join('')}</div></div>
      <div class="panel" data-p="ani"><p class="small mut">Agrega movimiento y expórtala como GIF o video.${isPremium() ? '' : ' Exportar animaciones es Premium.'}</p><div class="chips">${ANIMS.map(([k, v]) => `<button class="chip ${E.anim === k ? 'on' : ''}" data-act="anim" data-a="${k}">${v}</button>`).join('')}</div></div>
    </div></div>`;
  setupCanvas();
  $('#ph').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const s = Math.min(1, 900 / Math.max(img.width, img.height)); c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); E.photo = c.toDataURL('image/jpeg', 0.85); URL.revokeObjectURL(img.src); redraw(); toast('Foto agregada 📷'); };
    img.src = URL.createObjectURL(f);
  });
};
app.addEventListener('input', (e) => {
  const k = e.target.dataset?.e; if (!k || !E) return;
  if (k === 'bg0') E.bg[0] = e.target.value; else if (k === 'bg1') E.bg[1] = e.target.value; else E[k] = e.target.value;
  if (k === 'font') document.fonts?.load(`40px "${E.font}"`).then(redraw);
  redraw();
});

let sel = 0, drag = null;
function setupCanvas() {
  const cv = $('#cv'); if (!cv) return;
  const [W, H] = FORMATS[E.format]; cv.width = W / 2; cv.height = H / 2;
  const pos = (ev) => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height]; };
  cv.onpointerdown = (ev) => {
    const [x, y] = pos(ev); const asp = W / H;
    for (let i = E.stickers.length - 1; i >= 0; i--) { const s = E.stickers[i]; if (Math.abs(s.x - x) < s.s * 0.6 && Math.abs(s.y - y) < s.s * 0.6 * asp) { sel = i; drag = { i, dx: s.x - x, dy: s.y - y }; cv.setPointerCapture(ev.pointerId); return; } }
  };
  cv.onpointermove = (ev) => { if (!drag) return; const [x, y] = pos(ev); const s = E.stickers[drag.i]; s.x = Math.min(1, Math.max(0, x + drag.dx)); s.y = Math.min(1, Math.max(0, y + drag.dy)); if (!raf) redraw(); };
  cv.onpointerup = () => { drag = null; };
  const fontsReady = document.fonts ? Promise.all([document.fonts.load(`40px "${E.font}"`), document.fonts.load('40px "Poppins"')]).catch(() => {}) : Promise.resolve();
  fontsReady.then(redraw); redraw();
}
function redraw() {
  const cv = $('#cv'); if (!cv) return;
  const [W, H] = FORMATS[E.format]; if (cv.width !== W / 2) { cv.width = W / 2; cv.height = H / 2; }
  const ctx = cv.getContext('2d');
  if (E.anim !== 'none') { if (!raf) { const t0 = performance.now(); const loop = (now) => { if (!$('#cv')) return stopAnim(); drawCard(ctx, W / 2, H / 2, ((now - t0) / 3000) % 1); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); } }
  else { stopAnim(); drawCard(ctx, W / 2, H / 2, 0); }
}
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function getImg(src) { if (!src) return null; if (imgCache.has(src)) return imgCache.get(src); const i = new Image(); i.onload = () => redraw(); i.src = src; imgCache.set(src, i); return i; }
function heart(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s * 0.3); ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3); ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s); ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3); ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3); ctx.fill(); }
function star(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
function drawPattern(ctx, W, H, p) {
  const R = rng(7); const u = W / 540; ctx.save();
  const cols = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#ff4ecd', '#ffffff'];
  if (p === 'confetti') for (let i = 0; i < 70; i++) { ctx.fillStyle = cols[i % 6]; ctx.globalAlpha = 0.7; ctx.save(); ctx.translate(R() * W, R() * H); ctx.rotate(R() * 6); ctx.fillRect(-6 * u, -3 * u, 12 * u, 6 * u); ctx.restore(); }
  if (p === 'dots') { ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.18; for (let x = 0; x < W; x += 36 * u) for (let y = 0; y < H; y += 36 * u) { ctx.beginPath(); ctx.arc(x + ((y / (36 * u)) % 2) * 18 * u, y, 5 * u, 0, 7); ctx.fill(); } }
  if (p === 'hearts') { ctx.fillStyle = '#fff'; for (let i = 0; i < 26; i++) { ctx.globalAlpha = 0.12 + R() * 0.2; heart(ctx, R() * W, R() * H, (14 + R() * 30) * u); } }
  if (p === 'stars') { for (let i = 0; i < 60; i++) { ctx.fillStyle = i % 3 ? '#fff' : '#ffe66d'; ctx.globalAlpha = 0.25 + R() * 0.5; star(ctx, R() * W, R() * H, (3 + R() * 9) * u); } }
  if (p === 'snow') { ctx.fillStyle = '#fff'; for (let i = 0; i < 90; i++) { ctx.globalAlpha = 0.3 + R() * 0.5; ctx.beginPath(); ctx.arc(R() * W, R() * H, (2 + R() * 5) * u, 0, 7); ctx.fill(); } }
  if (p === 'balloons') for (let i = 0; i < 8; i++) { const x = R() * W, y = R() * H * 0.5 + (i % 2 ? H * 0.5 : 0), r = (22 + R() * 18) * u; ctx.globalAlpha = 0.35; ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.2, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x, y + r * 1.2); ctx.quadraticCurveTo(x + 8 * u, y + r * 2, x, y + r * 2.8); ctx.stroke(); }
  if (p === 'flowers') for (let i = 0; i < 14; i++) { const x = (i % 2 ? R() * 0.2 : 0.8 + R() * 0.2) * W, y = R() * H, r = (10 + R() * 12) * u; ctx.globalAlpha = 0.5; ctx.fillStyle = ['#f4a6b8', '#ffd6a5', '#cdb4db', '#a0c4ff'][i % 4]; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + Math.cos(k * 1.256) * r, y + Math.sin(k * 1.256) * r, r * 0.7, 0, 7); ctx.fill(); } ctx.fillStyle = '#ffe66d'; ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, 7); ctx.fill(); }
  if (p === 'stripes') { ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff'; for (let x = -H; x < W; x += 40 * u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 18 * u, 0); ctx.lineTo(x + 18 * u + H, H); ctx.lineTo(x + H, H); ctx.fill(); } }
  if (p === 'blobs') { ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.14; [[0.1, 0.1, 0.35], [0.95, 0.4, 0.3], [0.2, 0.95, 0.4]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x * W, y * H, r * W, 0, 7); ctx.fill(); }); }
  if (p === 'frame') { ctx.strokeStyle = E.fg; ctx.globalAlpha = 0.7; ctx.lineWidth = 2 * u; ctx.strokeRect(20 * u, 20 * u, W - 40 * u, H - 40 * u); ctx.lineWidth = 1 * u; ctx.strokeRect(28 * u, 28 * u, W - 56 * u, H - 56 * u); }
  if (p === 'line') { ctx.fillStyle = E.fg; ctx.globalAlpha = 0.8; ctx.fillRect(W / 2 - 30 * u, H * 0.2, 60 * u, 3 * u); }
  if (p === 'marble') { ctx.strokeStyle = '#adb5bd'; ctx.globalAlpha = 0.25; for (let i = 0; i < 9; i++) { ctx.lineWidth = (1 + R() * 3) * u; ctx.beginPath(); let x = R() * W, y = 0; ctx.moveTo(x, y); while (y < H) { x += (R() - 0.5) * 60 * u; y += 30 * u; ctx.lineTo(x, y); } ctx.stroke(); } ctx.globalAlpha = 0.8; ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 3 * u; ctx.strokeRect(24 * u, 24 * u, W - 48 * u, H - 48 * u); }
  ctx.restore();
}
function drawAnim(ctx, W, H, t) {
  if (E.anim === 'none') return; const R = rng(42); const u = W / 540; ctx.save();
  const n = { confetti: 50, snow: 70, hearts: 22, sparkle: 30, balloons: 9 }[E.anim] || 0;
  const cols = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#ff4ecd'];
  for (let i = 0; i < n; i++) {
    const x0 = R() * W, ph = R(), sp = 0.6 + R() * 0.8, sz = R();
    const prog = (ph + t * sp) % 1;
    if (E.anim === 'balloons') { const y = H * (1.15 - prog * 1.3); const x = x0 + Math.sin((t + ph) * 6.28) * 10 * u; const r = (18 + sz * 14) * u; ctx.globalAlpha = 0.85; ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.2, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(x, y + r * 1.2); ctx.lineTo(x, y + r * 2.6); ctx.stroke(); continue; }
    const y = prog * (H + 40 * u) - 20 * u; const x = x0 + Math.sin((t * 2 + ph) * 6.28) * 14 * u;
    if (E.anim === 'confetti') { ctx.globalAlpha = 0.9; ctx.fillStyle = cols[i % 5]; ctx.save(); ctx.translate(x, y); ctx.rotate((t * 4 + ph) * 6.28); ctx.fillRect(-5 * u, -2.5 * u, 10 * u, 5 * u); ctx.restore(); }
    if (E.anim === 'snow') { ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, (2 + sz * 4) * u, 0, 7); ctx.fill(); }
    if (E.anim === 'hearts') { ctx.globalAlpha = 0.85; ctx.fillStyle = i % 2 ? '#ff4e7a' : '#ff9ab5'; heart(ctx, x, H - y, (10 + sz * 16) * u); }
    if (E.anim === 'sparkle') { const a = Math.abs(Math.sin((t * 2 + ph) * 6.28)); ctx.globalAlpha = a; ctx.fillStyle = i % 2 ? '#fff' : '#ffe66d'; star(ctx, x0, R() * H, (4 + sz * 10) * u * a + 1); }
  }
  ctx.restore();
}
function wrap(ctx, text, maxW) {
  const out = []; text.split('\n').forEach((para) => { if (!para.trim()) { out.push(''); return; } let line = ''; para.split(/\s+/).forEach((w) => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }); out.push(line); });
  while (out.length && out[out.length - 1] === '') out.pop(); return out;
}
function drawCard(ctx, W, H, t) {
  const u = W / 540;
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H); g.addColorStop(0, E.bg[0]); g.addColorStop(1, E.bg[1]);
  ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  drawPattern(ctx, W, H, E.pattern);
  let top = H * 0.1;
  const img = getImg(E.photo);
  if (img && img.complete && img.naturalWidth) {
    const r = Math.min(W, H) * 0.17, cx = W / 2, cy = top + r; ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.closePath(); ctx.clip();
    const s = Math.max((2 * r) / img.width, (2 * r) / img.height); ctx.drawImage(img, cx - (img.width * s) / 2, cy - (img.height * s) / 2, img.width * s, img.height * s); ctx.restore();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); top = cy + r + 24 * u;
  }
  const appear = E.anim === 'none' ? 1 : Math.min(1, t * 4);
  ctx.globalAlpha = appear; ctx.fillStyle = E.fg; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const font = `"${E.font}", Poppins, sans-serif`;
  let ts = 44 * u; ctx.font = `700 ${ts}px ${font}`; while (ctx.measureText(E.title).width > W * 0.84 && ts > 18 * u) { ts -= 2 * u; ctx.font = `700 ${ts}px ${font}`; }
  if (E.title) { ctx.fillText(E.title, W / 2, top); top += ts * 1.5; }
  const bottomReserve = E.signature ? 70 * u : 30 * u; const avail = H - top - bottomReserve - H * 0.05;
  let fs = 34 * u, lines, lh;
  for (; fs > 12 * u; fs -= 1 * u) { ctx.font = `500 ${fs}px ${font}`; lines = wrap(ctx, E.text, W * 0.8); lh = fs * 1.35; if (lines.length * lh <= avail) break; }
  const blockH = lines.length * lh; let y = top + Math.max(0, (avail - blockH) / 2);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.12)'; ctx.shadowBlur = 6 * u;
  lines.forEach((l) => { ctx.fillText(l, W / 2, y + (1 - appear) * 10 * u); y += lh; }); ctx.restore();
  if (E.signature) { ctx.font = `600 ${22 * u}px ${font}`; ctx.fillText(E.signature, W / 2, H - H * 0.05 - 40 * u); }
  ctx.globalAlpha = 1;
  E.stickers.forEach((s, i) => { const sz = s.s * W; ctx.font = `${sz}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textBaseline = 'middle'; const bob = E.anim === 'none' ? 0 : Math.sin((t + i * 0.2) * 6.28) * 4 * u; ctx.fillText(s.e, s.x * W, s.y * H + bob); });
  drawAnim(ctx, W, H, t);
  ctx.globalAlpha = 0.35; ctx.fillStyle = E.fg; ctx.font = `500 ${11 * u}px Poppins, sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; if (!isPremium()) ctx.fillText('SaludaFácil', W - 12 * u, H - 10 * u); ctx.globalAlpha = 1; ctx.textAlign = 'center';
}
function renderFull(scale = 1, t = 0.999) { const [W, H] = FORMATS[E.format]; const c = document.createElement('canvas'); c.width = W * scale; c.height = H * scale; drawCard(c.getContext('2d'), c.width, c.height, t); return c; }
const cardBlob = (type = 'image/png') => new Promise((r) => renderFull().toBlob(r, type, 0.92));
const fname = (ext) => `saludafacil-${occ(E.occasion).id}-${Date.now().toString(36)}.${ext}`;
async function exportGIF() {
  if (!isPremium()) return premiumSheet('Las tarjetas animadas en GIF son parte de Premium.');
  if (E.anim === 'none') E.anim = 'confetti';
  toast('Creando GIF… ⏳');
  const { GIFEncoder, quantize, applyPalette } = await import('./vendor/gifenc.esm.js');
  const [W, H] = FORMATS[E.format]; const sc = 480 / W; const c = document.createElement('canvas'); c.width = Math.round(W * sc); c.height = Math.round(H * sc); const ctx = c.getContext('2d', { willReadFrequently: true });
  const gif = GIFEncoder(); const N = 30;
  for (let i = 0; i < N; i++) { drawCard(ctx, c.width, c.height, i / N); const d = ctx.getImageData(0, 0, c.width, c.height).data; const pal = quantize(d, 256); gif.writeFrame(applyPalette(d, pal), c.width, c.height, { palette: pal, delay: 100 }); if (i % 6 === 5) await new Promise((r) => setTimeout(r)); }
  gif.finish(); download(new Blob([gif.bytes()], { type: 'image/gif' }), fname('gif')); toast('GIF descargado 🎞');
}
async function exportVideo() {
  if (!isPremium()) return premiumSheet('Exportar tarjetas en video es parte de Premium.');
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return toast('Tu navegador no permite exportar video. Prueba el GIF.');
  if (E.anim === 'none') E.anim = 'confetti';
  const mime = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
  const [W, H] = FORMATS[E.format]; const c = document.createElement('canvas'); c.width = W * (720 / W); c.height = Math.round(H * (720 / W)); const ctx = c.getContext('2d');
  const rec = new MediaRecorder(c.captureStream(30), mime ? { mimeType: mime } : undefined); const parts = [];
  rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
  toast('Grabando video… 🎬 (6 s)');
  const done = new Promise((r) => (rec.onstop = r)); rec.start();
  const t0 = performance.now(); await new Promise((res) => { const step = (now) => { const el = now - t0; drawCard(ctx, c.width, c.height, (el / 3000) % 1); if (el < 6000) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
  rec.stop(); await done;
  const type = rec.mimeType || mime || 'video/webm'; download(new Blob(parts, { type }), fname(type.includes('mp4') ? 'mp4' : 'webm')); toast('Video descargado 🎬');
}
function openEditor(state) { E = state; sel = 0; if (location.hash === '#/tarjeta') nav(); else location.hash = '#/tarjeta'; }

/* ---------- Acciones globales ---------- */
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act], [data-set]'); if (!b) return;
  if (b.dataset.set) { G[b.dataset.set] = b.dataset.val; $$(`[data-set="${b.dataset.set}"]`).forEach((c) => c.classList.toggle('on', c === b)); return; }
  const a = b.dataset.act;
  const M = () => msgData(b);
  switch (a) {
    case 'gen': return runGen();
    case 'copy': return copy(M().text);
    case 'wa': b.href = waURL(M().text); return;
    case 'mail': return openMail(M().text, `${occ(M().occasion).emoji} ${occ(M().occasion).name}`);
    case 'share': return shareText(M().text);
    case 'audio': return audioSheet(M().text);
    case 'fav': { const d = M(); if (S.favs.some((f) => f.text === d.text)) return toast('Ya está en favoritos ⭐'); S.favs.unshift({ id: uid(), ts: Date.now(), ...d }); save(); b.textContent = '⭐ Guardado'; return toast('Guardado en favoritos ⭐'); }
    case 'edit': { const p = $('p', b.closest('.msg')); const on = p.contentEditable !== 'true'; p.contentEditable = String(on); b.textContent = on ? '✅ Listo' : '✏️ Editar'; if (on) { p.focus(); p.style.outline = '2px dashed var(--p)'; p.style.borderRadius = '10px'; p.style.padding = '6px'; } else { p.style.outline = ''; p.style.padding = ''; const m = b.closest('[data-msg]'); const d = JSON.parse(m.dataset.msg); d.text = p.innerText.trim(); m.dataset.msg = JSON.stringify(d); toast('Mensaje actualizado'); } return; }
    case 'card': closeSheet(); return openEditor(newCard(M()));
    case 'greet': routes.crear.pre = { recipient: b.dataset.rec, name: b.dataset.name }; location.hash = `#/crear/${b.dataset.occ}`; return;
    case 'humor': routes.crear.pre = { style: 'divertido', recipient: 'amigo' }; location.hash = '#/crear/cumpleanos'; return;
    case 'express': return expressSheet();
    case 'expressgo': { const o = { occasion: b.dataset.occ, recipient: 'otro', style: 'espontaneo', length: 'corto', signature: S.profile.signature }; $$('[data-act="expressgo"]').forEach((c) => c.classList.toggle('on', c === b)); return runGen($('#xres'), o); }
    case 'surprise': return surpriseSheet();
    case 'improve': return improveSheet();
    case 'improvego': { const text = $('#imtxt').value.trim(); if (!text) return toast('Escribe tu frase primero ✍️'); const style = $('#imst .on')?.dataset.s || 'emotivo'; return runGen($('#imres'), { mode: 'improve', text, style, occasion: 'otras', recipient: 'otro' }); }
    case 'imst': $$('#imst .chip').forEach((c) => c.classList.toggle('on', c === b)); return;
    case 'notify': return enableNotify();
    case 'notifyoff': S.profile.notify = false; save(); toast('Notificaciones desactivadas'); return nav();
    case 'delev': S.events = S.events.filter((x) => x.id !== b.dataset.id); save(); toast('Fecha eliminada'); return nav();
    case 'ics': return icsFor(S.events.filter((x) => x.id === b.dataset.id));
    case 'icsall': return icsFor(S.events);
    case 'ftab': location.hash = `#/favoritos/${b.dataset.t}`; return;
    case 'delmsg': { const k = b.dataset.kind; S[k] = S[k].filter((x) => x.id !== b.dataset.id); save(); toast('Eliminado'); return nav(); }
    case 'editsaved': { const k = b.dataset.kind; const it = S[k].find((x) => x.id === b.dataset.id); openSheet(`<h2>✏️ Editar mensaje</h2><textarea id="edt" rows="7" style="width:100%;border:1.5px solid var(--line);border-radius:12px;padding:10px;font-size:16px">${esc(it.text)}</textarea><div class="row" style="margin-top:10px"><button class="btn grad" id="edsv">Guardar cambios</button><button class="btn light" id="edcp">Guardar como copia</button></div>`);
      $('#edsv').onclick = () => { it.text = $('#edt').value.trim(); save(); closeSheet(); toast('Actualizado ✅'); nav(); };
      $('#edcp').onclick = () => { S.favs.unshift({ ...it, id: uid(), ts: Date.now(), text: $('#edt').value.trim() }); save(); closeSheet(); toast('Copia guardada en favoritos ⭐'); nav(); }; return; }
    case 'opencard': { const c = S.cards.find((x) => x.id === b.dataset.id); return openEditor({ ...structuredClone(c.state), id: c.id }); }
    case 'dupcard': { const c = S.cards.find((x) => x.id === b.dataset.id); openSheet(`<h2>👥 Duplicar para otra persona</h2><label class="field">¿Para quién es?<input id="dupn" placeholder="Ej: Tía Marta" maxlength="40"></label><button class="btn grad" id="dupgo" style="margin-top:12px">Crear copia</button>`);
      $('#dupgo').onclick = () => { const n = $('#dupn').value.trim(); const st = structuredClone(c.state); st.id = null; if (n) { st.title = `Para ${n}`; } closeSheet(); openEditor(st); toast('Copia lista para editar'); }; return; }
    case 'delcard': S.cards = S.cards.filter((x) => x.id !== b.dataset.id); save(); toast('Tarjeta eliminada'); return nav();
    case 'trial': S.premium.trialEnd = Date.now() + 7 * 864e5; save(); closeSheet(); toast('¡Prueba Premium activa por 7 días! 💎'); return nav();
    case 'sub': return subSheet(b.dataset.plan);
    case 'subok': S.premium.plan = b.dataset.plan; S.premium.until = Date.now() + (b.dataset.plan === 'anual' ? 365 : 30) * 864e5; save(); closeSheet(); toast('¡Bienvenido/a a Premium! 💎'); return nav();
    case 'cancel': S.premium = { trialEnd: S.premium.trialEnd ? 1 : 0, plan: null, until: 0 }; save(); toast('Premium cancelado'); return nav();
    case 'backup': return download(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }), `saludafacil-respaldo-${todayISO()}.json`);
    case 'install': if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; } else toast('En tu navegador: menú ⋮ o Compartir → "Agregar a pantalla de inicio"'); return;
    case 'wipe': openSheet(`<h2>¿Borrar todo?</h2><p>Se eliminarán tus fechas, mensajes, tarjetas y ajustes de este dispositivo. No se puede deshacer.</p><button class="btn" id="wipeok" style="background:#dc2626">Sí, borrar todo</button>`); $('#wipeok').onclick = () => { localStorage.removeItem(KEY); S = seed(); S.events = []; save(); closeSheet(); toast('Datos borrados'); location.hash = '#/'; }; return;
    // editor
    case 'back': history.length > 1 ? history.back() : (location.hash = '#/'); return;
    case 'etab': $$('[data-act="etab"]').forEach((x) => x.classList.toggle('on', x === b)); $$('.panel').forEach((p) => p.classList.toggle('on', p.dataset.p === b.dataset.t)); return;
    case 'tpl': { const t = TEMPLATES.find((x) => x.id === b.dataset.id); if (t.premium && !isPremium()) return premiumSheet('Esta plantilla es exclusiva de Premium.'); Object.assign(E, { tpl: t.id, bg: [...t.bg], fg: t.fg, font: t.font, pattern: t.pattern }); $$('.tpl').forEach((x) => x.classList.toggle('on', x === b)); document.fonts?.load(`40px "${t.font}"`).then(redraw); const fs = $('[data-e="font"]'); if (fs) fs.value = t.font; return redraw(); }
    case 'pat': E.pattern = b.dataset.p; $$('[data-act="pat"]').forEach((x) => x.classList.toggle('on', x === b)); return redraw();
    case 'addstk': E.stickers.push({ e: b.dataset.s, x: 0.2 + Math.random() * 0.6, y: 0.75 + Math.random() * 0.15, s: 0.1 }); sel = E.stickers.length - 1; return redraw();
    case 'stksize': { const s = E.stickers[sel]; if (!s) return toast('Toca un sticker primero'); s.s = Math.min(0.4, Math.max(0.04, s.s + 0.02 * +b.dataset.d)); return redraw(); }
    case 'stkdel': if (!E.stickers[sel]) return toast('No hay sticker seleccionado'); E.stickers.splice(sel, 1); sel = Math.max(0, E.stickers.length - 1); return redraw();
    case 'rmphoto': E.photo = null; toast('Foto quitada'); return nav();
    case 'fmt': E.format = b.dataset.f; $$('[data-act="fmt"]').forEach((x) => x.classList.toggle('on', x === b)); return redraw();
    case 'anim': E.anim = b.dataset.a; $$('[data-act="anim"]').forEach((x) => x.classList.toggle('on', x === b)); stopAnim(); return redraw();
    case 'dl': { const jpg = b.dataset.f === 'jpg'; const bl = await cardBlob(jpg ? 'image/jpeg' : 'image/png'); download(bl, fname(jpg ? 'jpg' : 'png')); return toast('Tarjeta descargada ⬇️'); }
    case 'sharecard': { const bl = await cardBlob('image/png'); const f = new File([bl], fname('png'), { type: 'image/png' }); if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f], text: E.text }); } catch {} } else { download(bl, f.name); openWA(E.text); toast('Imagen descargada: adjúntala en WhatsApp 📎'); } return; }
    case 'savecard': { const thumb = renderFull(0.25).toDataURL('image/jpeg', 0.8); const st = structuredClone(E); if (E.id) { const c = S.cards.find((x) => x.id === E.id); if (c) Object.assign(c, { state: st, thumb, ts: Date.now() }); } else { E.id = uid(); st.id = E.id; S.cards.unshift({ id: E.id, ts: Date.now(), state: st, thumb }); } S.cards = S.cards.slice(0, 40); save(); return toast('Tarjeta guardada en Mis saludos ⭐'); }
    case 'gif': return exportGIF();
    case 'video': return exportVideo();
  }
});

function expressSheet() {
  const sug = upcoming(3).map((x) => x.type);
  const list = [...new Set([...sug, 'cumpleanos', 'buenosdias', 'gracias', 'logros', 'navidad', 'amor', 'condolencias', 'buenasnoches'])].slice(0, 9);
  openSheet(`<h2>🚨 Saludo urgente</h2><p class="mut small">Toca la ocasión y tendrás 3 opciones al instante.</p><div class="chips">${list.map((o) => `<button class="chip" data-act="expressgo" data-occ="${o}">${occ(o).emoji} ${occ(o).name}</button>`).join('')}</div><div id="xres" style="margin-top:16px"></div>`);
}
function surpriseSheet() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const o = { occasion: pick(OCCASIONS.filter((x) => x.id !== 'condolencias')).id, recipient: pick(RECIPIENTS).id, style: pick(['original', 'divertido', 'inspirador', 'emotivo', 'espontaneo']), length: pick(['corto', 'mediano']), signature: S.profile.signature };
  openSheet(`<h2>🎲 ¡Sorpresa!</h2><p class="mut small">${occ(o.occasion).emoji} ${occ(o.occasion).name} · para ${rec(o.recipient).name} · ${sty(o.style).name}</p><div id="sres"></div><button class="btn light" data-act="surprise" style="margin-top:12px">🎲 Otra sorpresa</button>`);
  runGen($('#sres'), o);
}
function improveSheet() {
  openSheet(`<h2>🪄 Mejora mi mensaje</h2><p class="mut small">Escribe algo simple y lo transformamos conservando tu intención.</p>
  <textarea id="imtxt" rows="3" maxlength="800" style="width:100%;border:1.5px solid var(--line);border-radius:12px;padding:10px;font-size:16px" placeholder="Ej: feliz cumple compadre que lo pase bien"></textarea>
  <div class="chips" id="imst" style="margin:10px 0">${['emotivo', 'divertido', 'elegante', 'romantico', 'inspirador'].map((s, i) => `<button class="chip ${i ? '' : 'on'}" data-act="imst" data-s="${s}">${sty(s).emoji} ${sty(s).name}</button>`).join('')}</div>
  <button class="btn grad" data-act="improvego">✨ Mejorar</button><div id="imres" style="margin-top:16px"></div>`);
}
function subSheet(plan) {
  const price = plan === 'anual' ? '$24.990 CLP al año' : '$2.990 CLP al mes';
  openSheet(`<h2>Confirmar suscripción</h2><p><b>Plan ${plan}:</b> ${price}, IVA incluido. Renovación automática; cancela cuando quieras desde Premium.</p><p class="small mut">Versión de demostración: el cobro real se activa al conectar la pasarela de pago. Al confirmar se activa Premium en este dispositivo sin cargo.</p><button class="btn grad" data-act="subok" data-plan="${plan}">Confirmar (demo)</button>`);
}
async function enableNotify() {
  if (!('Notification' in window)) { S.profile.notify = false; toast('Este navegador no permite notificaciones. Usa "Exportar a mi calendario".'); return; }
  const p = await Notification.requestPermission();
  S.profile.notify = p === 'granted'; save();
  toast(p === 'granted' ? 'Notificaciones activadas 🔔' : 'Permiso denegado. Puedes exportar a tu calendario.');
  nav(); checkReminders();
}

/* ---------- PWA ---------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {});

nav();
setTimeout(checkReminders, 1200);
setInterval(checkReminders, 60 * 60 * 1000);
