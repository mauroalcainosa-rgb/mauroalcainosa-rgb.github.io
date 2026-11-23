/* Cuyi TV — aplicación del espectador (versión Play, opción B)
   La app no reproduce video: los canales con transmisión oficial en YouTube se abren en la app/sitio de YouTube
   y los demás en su sitio oficial. Sin anuncios, sin cuentas, sin ubicación. */
(function(){
  const S = window.TVM;
  const $ = (q, el=document) => el.querySelector(q);
  const app = $('#app');
  const esc = s => (s??'').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const LANGS = {es:'Español', pt:'Portugués', en:'Inglés', fr:'Francés', it:'Italiano', de:'Alemán', ja:'Japonés', ko:'Coreano'};
  const YT_TERMS = 'https://www.youtube.com/t/terms';
  const EXT = 'target="_blank" rel="noopener noreferrer"';

  /* ---------- utilidades UI ---------- */
  function toast(msg){ const t = $('#toast'); if(!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('show'), 2600); }
  function visible(list){ return list.filter(c => !S.blocked(c)); }
  function statusPill(ch){
    return S.hasYoutube(ch) ? '<span class="pill live">▶ YouTube</span>' : '<span class="pill web">↗ Sitio oficial</span>';
  }
  function card(ch){
    const v = S.visual(ch), co = S.country(ch.country);
    const logo = `<span class="ch-logo">${esc(v.mono)}</span>`;
    return `<button class="ch-card" data-play="${esc(ch.id)}" aria-label="${esc(ch.name)}, ${esc(co.name)}">
      <div class="ch-art" style="background:${v.bg}">${logo}<span class="flag">${co.flag}</span><span class="st">${statusPill(ch)}</span></div>
      ${S.isFav(ch.id) ? '<span class="fav-dot">♥</span>' : ''}
      <div class="ch-body"><h3>${esc(ch.name)}</h3><p>${esc(co.name)} · ${esc(S.category(ch.category).name)}</p></div>
    </button>`;
  }
  function row(title, list, link){
    if(!list.length) return '';
    return `<section class="row"><div class="row-head"><h2>${title}</h2>${link ? `<a href="${link}">Ver todo →</a>` : ''}</div><div class="track">${list.map(card).join('')}</div></section>`;
  }
  function byPopularity(list){ return [...list].sort((a,b) => S.popularity(b.id) - S.popularity(a.id) || (S.hasYoutube(b) - S.hasYoutube(a))); }
  function inCat(ch, cat){ return ch.category === cat || (ch.tags||[]).includes(cat); }
  function myCountry(){ return S.prefs().country || 'CL'; }
  const legalNote = () => `<p class="kbd">Los videos se ven en YouTube o en el sitio oficial de cada canal, bajo sus propias condiciones. <a href="${YT_TERMS}" ${EXT} style="color:var(--accent)">Términos de servicio de YouTube</a> · <a href="privacidad.html" style="color:var(--accent)">Política de privacidad</a></p>`;

  /* ---------- vistas ---------- */
  const views = {
    inicio(){
      const all = visible(S.channels());
      const mine = all.filter(c => c.country === myCountry());
      const pool = mine.length ? mine : all;
      const featured = byPopularity(pool.filter(S.hasYoutube))[0] || byPopularity(pool)[0];
      const hist = S.history().map(h => S.channel(h.id)).filter(c => c && c.active && !S.blocked(c));
      const favs = S.favs().map(S.channel).filter(c => c && c.active && !S.blocked(c));
      const countries = S.catalog().countries.filter(co => all.some(c => c.country === co.code));
      const co0 = S.country(myCountry());
      let html = '';
      if(featured){
        const v = S.visual(featured), co = S.country(featured.country);
        html += `<section class="hero"><div class="blob b1"></div><div class="blob b2"></div>
          <div class="hero-content">
            <span class="kicker">Destacado de hoy</span>
            <h1>${esc(featured.name)}</h1>
            <div class="meta"><span>${co.flag} ${esc(co.name)}</span><span>·</span><span>${esc(S.category(featured.category).name)}</span></div>
            <p>${esc(featured.description)}</p>
            <div class="btns"><button class="btn primary" data-play="${esc(featured.id)}">Ver canal</button>
            <button class="btn ghost" data-fav="${esc(featured.id)}">${S.isFav(featured.id) ? '♥ En favoritos' : '♡ Favorito'}</button></div>
          </div>
          <div class="hero-tv" aria-hidden="true"><div class="screen" style="background:${v.bg}"><span>${esc(v.mono)}</span><i class="live-dot" style="background:#0009">CUYI TV</i></div><div class="stand"></div><img class="peek" src="icons/icon.svg" alt=""></div>
        </section>`;
      }
      html += `<div class="quick">${S.catalog().categories.filter(k => all.some(c => inCat(c,k.id))).map(k => `<button class="chip" data-go="#cat-${k.id}">${k.icon} ${esc(k.name)}</button>`).join('')}</div>`;
      html += row(`${co0.flag} Canales de ${esc(co0.name)}`, mine, '#pais-' + myCountry());
      html += row('▶ Transmisiones oficiales en YouTube', byPopularity(all.filter(S.hasYoutube)), '#envivo');
      html += row('Vistos recientemente', hist.slice(0,12));
      html += row('Mis favoritos', favs.slice(0,12), '#favoritos');
      html += row('📰 Noticias de otros países', byPopularity(all.filter(c => inCat(c,'noticias') && c.country !== myCountry())).slice(0,12), '#cat-noticias');
      html += `<section class="row"><div class="row-head"><h2>Explorar por país</h2><a href="#paises">Ver todos →</a></div><div class="track">
        <button class="flag-card" data-go="#mundo"><span class="f">🌎</span><b>Todos</b><small>${all.length} canales</small></button>
        ${countries.filter(c => c.code !== 'INT').map(co => `<button class="flag-card" data-go="#pais-${co.code}"><span class="f">${co.flag}</span><b>${esc(co.name)}</b><small>${all.filter(c=>c.country===co.code).length} canales</small></button>`).join('')}</div></section>`;
      return html;
    },
    envivo(){
      const all = visible(S.channels());
      const yt = all.filter(S.hasYoutube);
      return `<div class="page"><h1>Canales</h1><p class="sub">${yt.length} con transmisión oficial en YouTube · ${all.length - yt.length} disponibles en su sitio oficial</p>
        ${chipsCats('envivo')}${legalNote()}</div>
        ${yt.length ? `<section class="row"><div class="row-head"><h2>▶ Se abren en YouTube</h2></div><div class="grid">${yt.map(card).join('')}</div></section>` : ''}
        <section class="row"><div class="row-head"><h2>↗ En su sitio oficial</h2></div><div class="grid">${all.filter(c=>!S.hasYoutube(c)).map(card).join('')}</div></section>`;
    },
    paises(){
      const all = visible(S.channels());
      const regions = {};
      S.catalog().countries.forEach(co => { (regions[co.region] = regions[co.region] || []).push(co); });
      return `<div class="page"><h1>Países</h1><p class="sub">Elige un país para ver sus canales oficiales.</p>
        <button class="flag-card" data-go="#mundo" style="width:auto;display:inline-flex;gap:12px;align-items:center;margin-bottom:18px"><span class="f" style="font-size:30px;margin:0">🌎</span><b>Todos · ${all.length} canales</b></button>
        ${Object.entries(regions).map(([r, list]) => `<h2 style="font-family:var(--display);margin:18px 0 10px">${esc(r)}</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px">${list.map(co => `<button class="flag-card" style="width:auto" data-go="#pais-${co.code}"><span class="f">${co.flag}</span><b>${esc(co.name)}</b><small>${all.filter(c=>c.country===co.code).length} canales</small></button>`).join('')}</div>`).join('')}</div>`;
    },
    pais(code){
      const co = S.country(code);
      const list = visible(S.channels()).filter(c => c.country === code);
      return `<div class="page"><h1>${co.flag} ${esc(co.name)}</h1><p class="sub">${list.length} canales oficiales</p>
        <div class="btns" style="margin-bottom:16px">${code !== myCountry() ? `<button class="btn ghost small" data-setcountry="${esc(code)}">Usar como mi país</button>` : '<span class="pill web">Tu país predeterminado</span>'}</div>
        ${chipsCats('pais-'+code, list)}</div>
        ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<div class="empty"><b>Sin canales todavía</b>Pronto agregaremos canales oficiales de este país.</div>`}`;
    },
    mundo(){
      const list = byPopularity(visible(S.channels()));
      return `<div class="page"><h1>🌎 Todos los canales</h1><p class="sub">${list.length} canales de ${new Set(list.map(c=>c.country)).size} países</p>${chipsCats('mundo')}</div><div class="grid">${list.map(card).join('')}</div>`;
    },
    categorias(){
      return `<div class="page"><h1>Categorías</h1><p class="sub">Explora por tipo de contenido.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px">${S.catalog().categories.map(c => `<button class="cat-card" style="width:auto;background:${S.visual({id:c.id,name:c.name}).bg}" data-go="#cat-${c.id}"><span>${c.icon}</span>${esc(c.name)}</button>`).join('')}</div></div>`;
    },
    cat(id){
      const cat = S.category(id);
      const list = byPopularity(visible(S.channels()).filter(c => inCat(c, id)));
      return `<div class="page"><h1>${cat.icon} ${esc(cat.name)}</h1><p class="sub">${list.length} canales</p></div>
        ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<div class="empty"><b>Sin canales en esta categoría</b></div>'}`;
    },
    favoritos(){
      const list = S.favs().map(S.channel).filter(c => c && c.active);
      return `<div class="page"><h1>Favoritos</h1><p class="sub">Perfil: ${esc(S.prefs().profile)}</p></div>
        ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<div class="empty"><b>Todavía no tienes favoritos</b>Toca ♡ en cualquier canal para guardarlo aquí.</div>'}`;
    },
    historial(){
      const list = S.history().map(h => S.channel(h.id)).filter(Boolean);
      return `<div class="page"><h1>Historial</h1><p class="sub">Últimos canales abiertos</p>${list.length ? '<button class="btn ghost small" data-act="clearhist">Borrar historial</button>' : ''}</div>
        ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<div class="empty"><b>Sin historial</b>Los canales que abras aparecerán aquí.</div>'}`;
    },
    buscar(q=''){
      return `<div class="page"><h1>Buscar</h1><p class="sub">Prueba: “noticias de Chile”, “deportes de Argentina”, “televisión pública de Brasil”.</p>
        <div class="search-box"><span class="ico">🔍</span><input id="q" type="search" autocomplete="off" placeholder="Canal, país, idioma o categoría…" value="${esc(q)}"><div class="suggest" id="sug" hidden></div></div></div>
        <div id="results"></div>`;
    },
    guia(){
      const list = visible(S.channels()).filter(c => c.country === myCountry() || S.isFav(c.id)).slice(0,40);
      const rows = list.map(ch => {
        const v = S.visual(ch);
        return `<tr><td><button data-play="${esc(ch.id)}" style="display:flex;gap:8px;align-items:center;text-align:left"><span class="m" style="width:44px;height:28px;border-radius:6px;background:${v.bg};display:grid;place-items:center;color:#fff;font-size:9px;font-weight:700">${esc(v.mono)}</span>${esc(ch.name)}</button></td>
          <td colspan="3" class="na">${ch.website ? `<a href="${esc(ch.website)}" ${EXT} data-open="${esc(ch.id)}" style="color:var(--accent)">Ver programación en el sitio oficial ↗</a>` : '—'}</td></tr>`;
      }).join('');
      return `<div class="page"><h1>Programación</h1><p class="sub">Canales de ${esc(S.country(myCountry()).name)} y favoritos. Cuyi TV no publica horarios propios: consulta la programación en el sitio oficial de cada canal.</p>
        <div class="epg"><table><thead><tr><th>Canal</th><th colspan="3">Programación</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
    },
    perfil(){
      const p = S.prefs();
      return `<div class="page"><h1>Perfiles</h1><p class="sub">Cada perfil tiene sus propios favoritos e historial. Se guardan solo en este dispositivo; no hay cuentas.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px">${p.profiles.map(n => `<button data-profile="${esc(n)}" style="text-align:center"><div class="avatar" style="width:84px;height:84px;font-size:30px;${n===p.profile?'outline:3px solid var(--accent);outline-offset:3px':''};background:${S.visual({id:n,name:n}).bg}">${esc(n[0].toUpperCase())}</div><div style="margin-top:8px">${esc(n)}</div></button>`).join('')}
        <button data-act="addprofile" style="text-align:center"><div class="avatar" style="width:84px;height:84px;font-size:30px;background:var(--card2);color:var(--muted)">+</div><div style="margin-top:8px;color:var(--muted)">Agregar</div></button></div></div>`;
    },
    config(){
      const p = S.prefs();
      const tg = (k, on) => `<button class="toggle ${on?'on':''}" data-toggle="${k}" aria-pressed="${on}"></button>`;
      return `<div class="page" style="max-width:860px"><h1>Configuración</h1><p class="sub">Preferencias de ${esc(p.profile)}</p>
        <div class="panel"><h2>General</h2>
          <div class="switch"><span>País predeterminado</span><button class="btn ghost small" data-act="country">${S.country(myCountry()).flag} ${esc(S.country(myCountry()).name)}</button></div>
          <div class="switch"><span>Modo claro</span>${tg('theme', p.theme==='light')}</div>
        </div>
        <div class="panel"><h2>Control parental</h2>
          <div class="switch"><span>Activar control parental ${p.parental.pin ? '(protegido con PIN)' : ''}</span>${tg('parental', p.parental.enabled)}</div>
          <p class="sub" style="margin:10px 0">Categorías ocultas cuando está activo:</p>
          <div class="chips">${S.catalog().categories.map(c => `<button class="chip ${p.parental.blocked.includes(c.id)?'on':''}" data-block="${c.id}">${c.icon} ${esc(c.name)}</button>`).join('')}</div>
          <button class="btn ghost small" data-act="pin">${p.parental.pin ? 'Cambiar PIN' : 'Definir PIN'}</button>
        </div>
        <div class="panel"><h2>Tus datos</h2><p class="sub" style="margin:0 0 12px">Favoritos, historial y preferencias se guardan solo en este dispositivo.</p>
          <div class="btns"><button class="btn ghost small" data-act="clearhist">Borrar historial</button><button class="btn ghost small" data-act="wipe">Borrar todos mis datos</button></div></div>
        <div class="panel"><h2>Legal</h2><div class="btns"><a class="btn ghost small" href="privacidad.html">Política de privacidad</a><a class="btn ghost small" href="${YT_TERMS}" ${EXT}>Términos de servicio de YouTube ↗</a></div></div>
        <p class="sub">Cuyi TV es un directorio de canales oficiales: no aloja, retransmite ni reproduce señales. Los videos se ven en YouTube o en el sitio oficial de cada canal, bajo sus propias condiciones. Las marcas pertenecen a sus dueños.</p></div>`;
    },
    canal(id){
      const ch = S.channel(id);
      if(!ch || !ch.active) return `<div class="empty" style="margin-top:30px"><b>Canal no disponible</b><a href="#inicio" style="color:var(--accent)">Volver al inicio</a></div>`;
      if(S.blocked(ch)) return `<div class="empty" style="margin-top:30px"><b>Contenido bloqueado por control parental</b>Desactívalo en Configuración.</div>`;
      const co = S.country(ch.country), v = S.visual(ch);
      const yt = S.hasYoutube(ch);
      const siblings = visible(S.channels()).filter(c => c.country === ch.country || inCat(c, ch.category));
      const main = yt
        ? `<a class="btn primary" href="${esc(ch.youtube)}" ${EXT} data-open="${esc(ch.id)}">▶ Ver en YouTube</a>${ch.website ? `<a class="btn ghost" href="${esc(ch.website)}" ${EXT} data-open="${esc(ch.id)}">Sitio oficial ↗</a>` : ''}`
        : (ch.website ? `<a class="btn primary" href="${esc(ch.website)}" ${EXT} data-open="${esc(ch.id)}">Abrir sitio oficial ↗</a>` : '');
      return `<div class="player-wrap">
        <div>
          <div class="player fb" id="player">
            <div id="stage" style="position:relative"><div class="fallback" style="background:${v.bg}"><div class="inner">
              <span style="font-size:40px">${yt ? '▶' : '📡'}</span>
              <h3>${esc(ch.name)}</h3>
              <p>${yt ? 'Este canal transmite en su canal oficial de YouTube. Se abrirá en la app de YouTube (o en youtube.com).' : 'Este canal se ve en su sitio oficial. Se abrirá en tu navegador.'}</p>
              <div class="btns" style="justify-content:center">${main}</div>
            </div></div></div>
          </div>
          <div class="info-card">
            <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:14px">
              <div><h2 style="font-family:var(--display)">${esc(ch.name)}</h2><span class="sub">${co.flag} ${esc(co.name)} · ${esc(S.category(ch.category).name)} · ${esc(LANGS[ch.lang]||ch.lang)}</span></div>
              <div class="btns"><button class="btn ghost small" data-fav="${esc(ch.id)}">${S.isFav(ch.id) ? '♥ En favoritos' : '♡ Favorito'}</button><button class="btn ghost small" data-share="${esc(ch.id)}">⤴ Compartir</button></div>
            </div>
            <p style="color:var(--muted);line-height:1.6;margin-bottom:14px">${esc(ch.description)}</p>
            <dl><dt>Dónde se ve</dt><dd>${yt ? 'Canal oficial en YouTube' : 'Sitio oficial del canal'}</dd>
            <dt>Sitio oficial</dt><dd>${ch.website ? `<a href="${esc(ch.website)}" ${EXT} style="color:var(--accent)">${esc(ch.website.replace(/^https?:\/\//,''))} ↗</a>` : '—'}</dd>
            ${yt && ch.youtubeSource ? `<dt>YouTube</dt><dd>${esc(ch.youtubeSource)}</dd>` : ''}</dl>
            ${legalNote()}
          </div>
        </div>
        <aside class="side"><h3>Otros canales</h3><div class="zap">${siblings.map(c => { const vv = S.visual(c); return `<button data-play="${esc(c.id)}" class="${c.id===ch.id?'on':''}"><span class="m" style="background:${vv.bg}">${esc(vv.mono.slice(0,6))}</span><span><b>${esc(c.name)}</b><small>${S.country(c.country).flag} ${S.hasYoutube(c) ? '▶ YouTube' : 'Sitio oficial'}</small></span></button>`; }).join('')}</div></aside>
      </div>`;
    }
  };

  function chipsCats(route, base){
    const list = base || visible(S.channels());
    const cats = S.catalog().categories.filter(c => list.some(ch => inCat(ch, c.id)));
    return `<div class="chips">${cats.map(c => `<button class="chip" data-go="#cat-${c.id}">${c.icon} ${esc(c.name)}</button>`).join('')}</div>`;
  }

  /* ---------- buscador ---------- */
  const CAT_SYN = {noticias:['noticia','noticias','informativo','news','prensa'], deportes:['deporte','deportes','deportivo','deportivos','futbol','sports'], cultura:['cultura','cultural','culturales','educativo','educativos','educacion','documental'], musica:['musica','musical','musicales'], entretenimiento:['entretenimiento','series','peliculas','novelas'], publica:['publica','publico','publicas','estatal','estado'], abierta:['abierta','aire','nacional'], internacional:['internacional','internacionales','mundo'], regional:['regional','local','locales'], especializado:['especializado','ciencia','espacio']};
  const LANG_SYN = {es:['espanol','castellano'], pt:['portugues'], en:['ingles','english'], fr:['frances'], it:['italiano'], de:['aleman'], ja:['japones'], ko:['coreano']};
  const STOP = new Set(['de','del','la','el','los','las','en','canales','canal','ver','buscar','television','tv','y','para','con','señal','senal','me','quiero']);
  function parseQuery(q){
    const n = S.norm(q);
    const out = {cats:[], countries:[], langs:[], text:[]};
    let rest = ' ' + n + ' ';
    S.catalog().countries.forEach(co => { const cn = S.norm(co.name); if(rest.includes(' '+cn+' ')){ out.countries.push(co.code); rest = rest.replace(' '+cn+' ', ' '); } });
    rest.split(/\s+/).filter(Boolean).forEach(w => {
      if(STOP.has(w)) return;
      const cat = Object.entries(CAT_SYN).find(([k,v]) => v.includes(w)); if(cat){ out.cats.push(cat[0]); return; }
      const lg = Object.entries(LANG_SYN).find(([k,v]) => v.includes(w)); if(lg){ out.langs.push(lg[0]); return; }
      out.text.push(w);
    });
    return out;
  }
  function search(q){
    const pq = parseQuery(q);
    const list = visible(S.channels()).map(c => {
      if(pq.countries.length && !pq.countries.includes(c.country)) return null;
      if(pq.langs.length && !pq.langs.includes(c.lang)) return null;
      if(pq.cats.length && !pq.cats.some(k => inCat(c, k))) return null;
      let score = S.popularity(c.id) * 0.01;
      if(pq.text.length){
        const hay = S.norm([c.name, c.description, S.country(c.country).name, S.category(c.category).name, ...(c.tags||[])].join(' '));
        const nm = S.norm(c.name);
        for(const w of pq.text){ if(nm.startsWith(w)) score += 10; else if(nm.includes(w)) score += 6; else if(hay.includes(w)) score += 2; else return null; }
      }
      return [c, score];
    }).filter(Boolean).sort((a,b) => b[1]-a[1]).map(x => x[0]);
    return {list, pq};
  }
  function bindSearch(){
    const inp = $('#q'), sug = $('#sug'), res = $('#results'); if(!inp) return;
    let sel = -1;
    const render = () => {
      const q = inp.value.trim();
      if(!q){ res.innerHTML = ''; sug.hidden = true; return; }
      const {list, pq} = search(q);
      const filt = [...pq.countries.map(c => S.country(c).flag+' '+S.country(c).name), ...pq.cats.map(c => S.category(c).name), ...pq.langs.map(l => LANGS[l])];
      res.innerHTML = `<div class="page" style="padding-top:0"><p class="sub">${list.length} resultados${filt.length ? ' · filtros: ' + filt.map(esc).join(', ') : ''}</p></div>` + (list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<div class="empty"><b>Sin resultados</b>Prueba con otro nombre, país o categoría.</div>');
      const top = list.slice(0,6); sel = -1;
      sug.innerHTML = top.map(c => `<button data-play="${esc(c.id)}"><span>${S.country(c.country).flag}</span>${esc(c.name)}<small>${esc(S.category(c.category).name)}</small></button>`).join('');
      sug.hidden = !top.length || document.activeElement !== inp;
    };
    inp.addEventListener('input', render);
    inp.addEventListener('focus', render);
    inp.addEventListener('blur', () => setTimeout(()=> sug.hidden = true, 200));
    inp.addEventListener('keydown', e => {
      const items = [...sug.querySelectorAll('button')];
      if(e.key === 'ArrowDown'){ sel = Math.min(sel+1, items.length-1); e.preventDefault(); }
      else if(e.key === 'ArrowUp'){ sel = Math.max(sel-1, -1); e.preventDefault(); }
      else if(e.key === 'Enter' && sel >= 0){ items[sel].click(); return; }
      else if(e.key === 'Escape'){ sug.hidden = true; return; } else return;
      items.forEach((b,i) => b.classList.toggle('on', i===sel));
    });
    render(); setTimeout(() => inp.focus(), 50);
  }

  /* ---------- modales ---------- */
  function modal(html){ const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`; bg.addEventListener('click', e => { if(e.target === bg) bg.remove(); }); document.body.appendChild(bg); return bg; }
  function countryModal(){
    const cur = myCountry();
    const m = modal(`<h2>Elige tu país</h2><p class="sub" style="color:var(--muted)">Tu país define la sección “Canales de mi país”. Chile viene seleccionado por defecto.</p>
      <div class="flags">${S.catalog().countries.filter(c=>c.code!=='INT').map(co => `<button class="${co.code===cur?'on':''}" data-c="${co.code}"><span style="font-size:24px">${co.flag}</span>${esc(co.name)}</button>`).join('')}</div>
      <div class="btns"><button class="btn ghost small" id="cls">Cerrar</button></div>`);
    m.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { setCountry(b.dataset.c); m.remove(); });
    m.querySelector('#cls').onclick = () => m.remove();
  }
  function setCountry(code){ const p = S.prefs(); p.country = code; S.setPrefs(p); toast(`País: ${S.country(code).flag} ${S.country(code).name}`); render(); }
  function pinModal(onOk){
    const p = S.prefs(); if(!p.parental.pin){ onOk(); return; }
    const m = modal(`<h2>PIN de control parental</h2><input id="pin" type="password" inputmode="numeric" maxlength="6" placeholder="••••" style="margin:14px 0"><div class="btns"><button class="btn primary small" id="ok">Confirmar</button><button class="btn ghost small" id="no">Cancelar</button></div>`);
    m.querySelector('#pin').focus();
    const go = () => { if(m.querySelector('#pin').value === p.parental.pin){ m.remove(); onOk(); } else toast('PIN incorrecto'); };
    m.querySelector('#ok').onclick = go; m.querySelector('#pin').onkeydown = e => e.key==='Enter' && go(); m.querySelector('#no').onclick = () => m.remove();
  }
  function inputModal(title, ph, onOk, type='text'){
    const m = modal(`<h2>${esc(title)}</h2><input id="iv" type="${type}" placeholder="${esc(ph)}" style="margin:14px 0" maxlength="24"><div class="btns"><button class="btn primary small" id="ok">Guardar</button><button class="btn ghost small" id="no">Cancelar</button></div>`);
    const i = m.querySelector('#iv'); i.focus();
    const go = () => { const v = i.value.trim(); if(v){ onOk(v); m.remove(); } };
    m.querySelector('#ok').onclick = go; i.onkeydown = e => e.key==='Enter' && go(); m.querySelector('#no').onclick = () => m.remove();
  }
  function confirmModal(title, text, onOk){
    const m = modal(`<h2>${esc(title)}</h2><p class="sub" style="color:var(--muted);margin:10px 0 16px">${esc(text)}</p><div class="btns"><button class="btn primary small" id="ok">Sí, borrar</button><button class="btn ghost small" id="no">Cancelar</button></div>`);
    m.querySelector('#ok').onclick = () => { m.remove(); onOk(); }; m.querySelector('#no').onclick = () => m.remove();
  }
  async function share(id){
    const ch = S.channel(id); if(!ch) return;
    const url = location.href.split('#')[0] + '#canal-' + id;
    const text = `Mira ${ch.name} en Cuyi TV`;
    try{ if(navigator.share){ await navigator.share({title:'Cuyi TV', text, url}); return; } }catch(e){ if(e.name === 'AbortError') return; }
    try{ await navigator.clipboard.writeText(url); toast('Enlace copiado'); }
    catch(e){ const m = modal(`<h2>Compartir ${esc(ch.name)}</h2><p class="sub" style="color:var(--muted)">Copia este enlace:</p><input readonly value="${esc(url)}" style="margin:12px 0"><button class="btn ghost small" id="cls">Cerrar</button>`); const i = m.querySelector('input'); i.onclick = () => i.select(); i.select(); m.querySelector('#cls').onclick = () => m.remove(); }
  }

  /* ---------- router ---------- */
  let lastHash = null;
  function render(){
    lastHash = location.hash;
    const h = (location.hash || '#inicio').slice(1);
    const [name, ...rest] = h.split('-'); const arg = rest.join('-');
    const v = views[name] ? name : 'inicio';
    app.innerHTML = `<div class="view">${views[v](arg)}</div>`;
    const navKey = {pais:'paises', mundo:'paises', cat:'categorias', historial:'inicio', canal:'envivo'}[v] || v;
    document.querySelectorAll('nav a[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === navKey));
    if(v === 'buscar') bindSearch();
    try{ window.scrollTo({top:0, behavior:'instant'}); }catch(e){}
    document.title = v === 'canal' && S.channel(arg) ? `${S.channel(arg).name} · Cuyi TV` : 'Cuyi TV — Canales oficiales de Chile y Latinoamérica';
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-play],[data-go],[data-fav],[data-share],[data-setcountry],[data-open],[data-act],[data-toggle],[data-block],[data-profile]');
    if(!t) return;
    const d = t.dataset;
    if(d.play){ e.preventDefault(); location.hash = '#canal-' + d.play; render(); }
    else if(d.go){ location.hash = d.go; }
    else if(d.fav){ const on = S.toggleFav(d.fav); toast(on ? '♥ Agregado a favoritos' : 'Quitado de favoritos'); t.innerHTML = on ? '♥ En favoritos' : '♡ Favorito'; }
    else if(d.share){ share(d.share); }
    else if(d.setcountry){ setCountry(d.setcountry); }
    else if(d.open){ S.bump(d.open); S.pushHistory(d.open); }
    else if(d.profile){ const p = S.prefs(); p.profile = d.profile; S.setPrefs(p); toast('Perfil: ' + d.profile); render(); }
    else if(d.block){ const p = S.prefs(); const b = new Set(p.parental.blocked); b.has(d.block) ? b.delete(d.block) : b.add(d.block); pinModal(() => { p.parental.blocked = [...b]; S.setPrefs(p); render(); }); }
    else if(d.toggle){
      const p = S.prefs();
      if(d.toggle === 'theme'){ p.theme = p.theme === 'light' ? 'dark' : 'light'; S.setPrefs(p); applyTheme(); render(); }
      else if(d.toggle === 'parental'){ pinModal(() => { p.parental.enabled = !p.parental.enabled; S.setPrefs(p); toast(p.parental.enabled ? 'Control parental activado' : 'Control parental desactivado'); render(); }); }
    }
    else if(d.act === 'country'){ countryModal(); }
    else if(d.act === 'clearhist'){ S.clearHistory(); toast('Historial borrado'); render(); }
    else if(d.act === 'wipe'){ confirmModal('Borrar todos mis datos', 'Se eliminarán favoritos, historial, perfiles y preferencias guardados en este dispositivo.', () => { S.wipe(); applyTheme(); toast('Datos borrados'); location.hash = '#inicio'; render(); }); }
    else if(d.act === 'addprofile'){ inputModal('Nuevo perfil', 'Nombre del perfil', v => { const p = S.prefs(); if(!p.profiles.includes(v)) p.profiles.push(v); p.profile = v; S.setPrefs(p); render(); }); }
    else if(d.act === 'pin'){ pinModal(() => inputModal('Nuevo PIN (4 a 6 dígitos)', '••••', v => { if(!/^\d{4,6}$/.test(v)){ toast('El PIN debe tener 4 a 6 dígitos'); return; } const p = S.prefs(); p.parental.pin = v; S.setPrefs(p); toast('PIN guardado'); render(); }, 'password')); }
  });

  document.addEventListener('keydown', e => {
    if(e.target.matches && e.target.matches('input,textarea,select')) return;
    if(e.key === '/'){ e.preventDefault(); location.hash = '#buscar'; return; }
    if(e.key === 'Escape'){ const m = document.querySelector('.modal-bg'); if(m){ m.remove(); return; } if(location.hash.indexOf('#canal-') === 0) history.length > 1 ? history.back() : (location.hash = '#inicio'); }
  });

  function applyTheme(){ document.documentElement.classList.toggle('light', S.prefs().theme === 'light'); }

  window.addEventListener('hashchange', () => { if(location.hash !== lastHash) render(); });
  applyTheme();
  render();
  setTimeout(() => { const sp = $('#splash'); if(sp) sp.classList.add('hide'); }, 700);
  if('serviceWorker' in navigator && location.protocol === 'https:' || (location.hostname === 'localhost' && 'serviceWorker' in navigator)){
    navigator.serviceWorker.register('./sw.js', {scope:'./'}).catch(()=>{});
  }
})();
