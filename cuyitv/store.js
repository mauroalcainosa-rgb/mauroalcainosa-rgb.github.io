/* Cuyi TV — capa de datos local.
   Todo se guarda solo en este dispositivo (localStorage): país, favoritos, historial y preferencias.
   Sin cuentas, sin servidores, sin anuncios. El catálogo viene de data/channels.js. */
(function(){
  const LS = {
    get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
    del(k){ try{ localStorage.removeItem(k); }catch(e){} }
  };
  const seed = window.TVM_SEED || {countries:[],categories:[],channels:[]};

  const norm = s => (s||'').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
  const hash = s => { let h=0; for(const c of s) h=(h*31+c.charCodeAt(0))|0; return Math.abs(h); };
  const PALETTES = [['#0ea5e9','#6366f1'],['#f43f5e','#f59e0b'],['#10b981','#0ea5e9'],['#8b5cf6','#ec4899'],['#f97316','#ef4444'],['#14b8a6','#22c55e'],['#6366f1','#22d3ee'],['#e11d48','#7c3aed'],['#0891b2','#1e3a8a'],['#ca8a04','#dc2626']];
  const safeUrl = u => /^https:\/\//i.test(u||'') ? u : '';

  function normalizeChannel(c){
    return Object.assign({tags:[], description:'', website:'', youtube:'', youtubeSource:'', logo:'', active:true, epg:[]}, c,
      {website: safeUrl(c.website), youtube: safeUrl(c.youtube)});
  }
  const CATALOG = {
    version: seed.version,
    countries: seed.countries || [],
    categories: seed.categories || [],
    channels: (seed.channels || []).map(normalizeChannel)
  };

  const Store = {
    LS, norm,
    catalog(){ return CATALOG; },
    channels(){ return CATALOG.channels.filter(c => c.active); },
    channel(id){ return CATALOG.channels.find(c => c.id === id); },
    country(code){ return CATALOG.countries.find(c => c.code === code) || {code, name:code, flag:'🏳️'}; },
    category(id){ return CATALOG.categories.find(c => c.id === id) || {id, name:id, icon:'📺'}; },

    prefs(){ return Object.assign({country:'CL', theme:'dark', profile:'Principal', profiles:['Principal'], parental:{enabled:false, pin:'', blocked:[]}}, LS.get('tvm.prefs', {})); },
    setPrefs(p){ LS.set('tvm.prefs', p); },

    _pkey(k){ return 'tvm.'+k+'.'+Store.prefs().profile; },
    favs(){ return LS.get(Store._pkey('favs'), []); },
    isFav(id){ return Store.favs().includes(id); },
    toggleFav(id){ let f = Store.favs(); f = f.includes(id) ? f.filter(x=>x!==id) : [id, ...f]; LS.set(Store._pkey('favs'), f); return f.includes(id); },
    history(){ return LS.get(Store._pkey('history'), []); },
    pushHistory(id){ const h = [ {id, at: Date.now()}, ...Store.history().filter(x=>x.id!==id) ].slice(0,30); LS.set(Store._pkey('history'), h); },
    clearHistory(){ LS.set(Store._pkey('history'), []); },

    stats(){ return LS.get('tvm.stats', {}); },
    bump(id){ const s = Store.stats(); s[id] = s[id] || {opens:0, last:0}; s[id].opens++; s[id].last = Date.now(); LS.set('tvm.stats', s); },
    popularity(id){ const s = Store.stats()[id]; return s ? s.opens : 0; },

    /* Borra todos los datos de Cuyi TV guardados en este dispositivo */
    wipe(){
      const keys = []; for(let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if(k && k.indexOf('tvm.') === 0) keys.push(k); }
      keys.forEach(LS.del);
    },

    /* Cómo se ve el canal: yt = se abre en YouTube · web = sitio oficial del canal */
    status(ch){ return ch.youtube ? 'yt' : 'web'; },
    hasYoutube(ch){ return !!ch.youtube; },

    visual(ch){
      const p = PALETTES[hash(ch.id) % PALETTES.length];
      return { bg: `linear-gradient(135deg, ${p[0]}, ${p[1]})`, mono: ch.name.length <= 8 ? ch.name : ch.name.split(/\s+/).map(w=>w[0]).join('').slice(0,4).toUpperCase() };
    },

    blocked(ch){
      const p = Store.prefs().parental;
      return p.enabled && (p.blocked||[]).some(b => b === ch.category || (ch.tags||[]).includes(b));
    }
  };
  window.TVM = Store;
})();
