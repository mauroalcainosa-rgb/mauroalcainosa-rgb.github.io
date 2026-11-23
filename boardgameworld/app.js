/* BOARD GAME WORLD — app (vanilla JS) */
(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const rnd=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n};
const uid=()=>Date.now().toString(36)+rnd(1e6).toString(36);

/* ───────── CATÁLOGO ───────── */
const CAT={est:"Estrategia",fam:"Familiar",inf:"Infantil",coo:"Cooperativo",com:"Competitivo",car:"Cartas",dad:"Dados",ded:"Deductivo",ave:"Aventuras",con:"Construcción",eco:"Economía",gue:"Guerra",fan:"Fantasía",sci:"Ciencia ficción",par:"Party games",edu:"Educativos",sol:"Solitario",cla:"Clásicos",abs:"Abstractos",via:"Para viajes"};
const CATCOL={est:"#1E3A5F",fam:"#1F5E4E",inf:"#7A5A1E",coo:"#1E5A5A",com:"#1A2238",car:"#6E2433",dad:"#7A3A22",ded:"#3E2C5E",ave:"#5A3E22",con:"#5A4630",eco:"#6B5420",gue:"#4A1E22",sci:"#1C2340",fan:"#33204F",par:"#7A4416",edu:"#1F4F38",sol:"#3A4248",cla:"#4E3A24",abs:"#262D33",via:"#234E63"};
const MODE={C:"Competitivo",K:"Cooperativo",E:"Por equipos",S:"Roles ocultos / semicooperativo"};
const LANG=["Independiente del idioma","Poco texto","Dependiente del idioma"];
function mk(a,extra){const [id,name,designer,publisher,country,year,minP,maxP,minT,maxT,age,w,mode,lang,cats,desc,how]=a;
  const c=cats.split(/\s+/).filter(Boolean); if(mode==="C"&&!c.includes("com"))c.push("com"); if((mode==="K")&&!c.includes("coo"))c.push("coo"); if(minP===1&&!c.includes("sol"))c.push("sol");
  return {id,name,designer,publisher,country,year,minP,maxP,minT,maxT,age,w,mode,lang,cats:c,desc,how,extra:!!extra};}
let GAMES=(window.BGW_GAMES||[]).map(a=>mk(a));
const RULES=window.BGW_RULES||{};
let BYID={}; const reindex=()=>{BYID={};GAMES.forEach(g=>BYID[g.id]=g)}; reindex();
const lvl=w=>w<1.4?1:w<2?2:w<2.8?3:w<3.6?4:5;
const LVL=["","Muy fácil","Fácil","Intermedio","Avanzado","Experto"];
const learnTime=g=>RULES[g.id]?RULES[g.id].learn:(["","~5 min","~10 min","~20 min","~40 min","+60 min"][lvl(g.w)]+" (estimado)");
const players=g=>g.minP===g.maxP?`${g.minP}`:`${g.minP}–${g.maxP}`;
const mins=g=>g.minT===g.maxT?`${g.minT} min`:`${g.minT}–${g.maxT} min`;
const yearTxt=g=>g.year==null?(norm(g.designer).includes("tradicional")?"Tradicional":"Por verificar"):g.year;
const val=v=>v==null||v===""?'<span class="muted">Por verificar</span>':esc(v);

/* ───────── ICONOS ───────── */
const IC={
 pawn:'<circle cx="12" cy="6" r="3.2"/><path d="M8.5 21c.3-4.5 1.6-8 3.5-9.5 1.9 1.5 3.2 5 3.5 9.5z"/><rect x="6" y="20" width="12" height="2.5" rx="1"/>',
 die:'<rect x="3" y="3" width="18" height="18" rx="4"/><g fill="#fff"><circle cx="8" cy="8" r="1.6"/><circle cx="16" cy="16" r="1.6"/><circle cx="12" cy="12" r="1.6"/></g>',
 cards:'<rect x="3" y="6" width="11" height="15" rx="2" transform="rotate(-12 8 13)"/><rect x="10" y="3" width="11" height="15" rx="2" transform="rotate(10 15 10)"/>',
 hex:'<path d="M12 2l8.7 5v10L12 22l-8.7-5V7z"/>',
 crown:'<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
 meeple:'<path d="M12 2a3.3 3.3 0 0 1 3.3 3.3c0 1-.4 1.6-.8 2.1 3 .7 6.7 2.1 6.7 4 0 1.3-2.6 1.4-4.2 1.2l2.6 7.4h-5.2L12 16l-2.4 4h-5.2l2.6-7.4c-1.6.2-4.2.1-4.2-1.2 0-1.9 3.7-3.3 6.7-4-.4-.5-.8-1.1-.8-2.1A3.3 3.3 0 0 1 12 2z"/>',
 heart:'<path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/>',
 bubble:'<path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>',
 castle:'<path d="M3 21V8h3v3h3V8h2v3h2V8h2v3h3V8h3v13h-7v-5a2 2 0 0 0-4 0v5z"/>',
 rocket:'<path d="M12 2c4 2.5 6 7 5 12l2.5 3-3.5 1-1-2h-6l-1 2-3.5-1L7 14C6 9 8 4.5 12 2z"/><circle cx="12" cy="9" r="2" fill="#fff"/>',
 lens:'<circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15 15l6 6" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>',
 tree:'<path d="M12 2l7 10h-4l4 6H5l4-6H5z"/><rect x="10.5" y="18" width="3" height="4"/>',
 book:'<path d="M3 4h7a2 2 0 0 1 2 2v15a2 2 0 0 0-2-2H3zM21 4h-7a2 2 0 0 0-2 2v15a2 2 0 0 1 2-2h7z"/>',
 coin:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" stroke="#fff" stroke-width="1.6" fill="none"/>',
 sword:'<path d="M14 3h7v7L10 21l-3-3z"/><path d="M4 15l5 5M3 21l3-3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 board:'<rect x="3" y="3" width="18" height="18" rx="2"/><g fill="#fff"><rect x="3" y="3" width="4.5" height="4.5"/><rect x="12" y="3" width="4.5" height="4.5"/><rect x="7.5" y="7.5" width="4.5" height="4.5"/><rect x="16.5" y="7.5" width="4.5" height="4.5"/><rect x="3" y="12" width="4.5" height="4.5"/><rect x="12" y="12" width="4.5" height="4.5"/><rect x="7.5" y="16.5" width="4.5" height="4.5"/><rect x="16.5" y="16.5" width="4.5" height="4.5"/></g>',
 home:'<path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z"/>',
 compass:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
 spark:'<path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7z"/><circle cx="19" cy="19" r="2"/>',
 store:'<path d="M4 9l1.5-5h13L20 9a3 3 0 0 1-5.3 1.9A3 3 0 0 1 12 12a3 3 0 0 1-2.7-1.1A3 3 0 0 1 4 9z"/><path d="M5 12.5V21h14v-8.5"/><rect x="10" y="15" width="4" height="6" fill="#fff"/>',
 shelf:'<rect x="3" y="3" width="4" height="16" rx="1"/><rect x="8" y="5" width="4" height="14" rx="1"/><rect x="13" y="3" width="3.5" height="16" rx="1" transform="rotate(-10 15 11)"/><rect x="2" y="19" width="20" height="2.5" rx="1"/>',
 moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
 user:'<circle cx="12" cy="8" r="4.2"/><path d="M3.5 21c.6-4.6 4.1-7 8.5-7s7.9 2.4 8.5 7z"/>',
 gear:'<circle cx="12" cy="12" r="3.2" fill="#fff"/><path d="M10 2h4l.6 2.6 2 .9 2.3-1.4 2.8 2.8-1.4 2.3.9 2L24 12v0l-2.8.8-.9 2 1.4 2.3-2.8 2.8-2.3-1.4-2 .9L14 22h-4l-.6-2.6-2-.9-2.3 1.4-2.8-2.8 1.4-2.3-.9-2L0 12l2.8-.8.9-2-1.4-2.3 2.8-2.8 2.3 1.4 2-.9z" transform="scale(.92) translate(1 1)"/>'
};
const LOGO=`<rect x="3" y="3" width="58" height="58" rx="14" fill="#123A30" stroke="#C9A45C" stroke-width="2"/><rect x="10" y="10" width="44" height="44" rx="1" fill="#0C2A22"/><g fill="#1B5444"><rect x="10" y="10" width="11" height="11"/><rect x="32" y="10" width="11" height="11"/><rect x="21" y="21" width="11" height="11"/><rect x="43" y="21" width="11" height="11"/><rect x="10" y="32" width="11" height="11"/><rect x="32" y="32" width="11" height="11"/><rect x="21" y="43" width="11" height="11"/><rect x="43" y="43" width="11" height="11"/></g><ellipse cx="32" cy="49.5" rx="13" ry="2.4" fill="#06140F" opacity=".55"/><circle cx="32" cy="22.5" r="6.2" fill="#F3E9D2"/><path d="M28.5 27.5L19.5 31.2Q17 32.4 18.6 34.6L25 37.4L19.8 48.6H28.2L32 41.6L35.8 48.6H44.2L39 37.4L45.4 34.6Q47 32.4 44.5 31.2L35.5 27.5Z" fill="#F3E9D2" stroke="#F3E9D2" stroke-width="1.6" stroke-linejoin="round"/><g><circle cx="15.5" cy="15.5" r="3.2" fill="#E26D5A"/><circle cx="48.5" cy="15.5" r="3.2" fill="#5B9BD5"/><circle cx="48.5" cy="48.5" r="3.2" fill="#F2C14E"/></g>`;
const logoSvg=(s=40)=>`<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true">${LOGO}</svg>`;
const sparkles=n=>`<div class="sparkles" aria-hidden="true">${Array.from({length:n},(_,i)=>`<i class="${i%3===0?"x":""}" style="left:${rnd(100)}%;top:${rnd(100)}%;--s:${6+rnd(i%3===0?12:6)}px;--d:${2+rnd(30)/10}s;--dl:${rnd(40)/10}s"></i>`).join("")}</div>`;
const icon=(n,c="currentColor",s=24)=>`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="${c}" style="color:${c}" aria-hidden="true">${IC[n]||IC.pawn}</svg>`;
const CATICON={est:"crown",fam:"tree",inf:"heart",coo:"heart",com:"crown",car:"cards",dad:"die",ded:"lens",ave:"compass",con:"castle",eco:"coin",gue:"sword",fan:"castle",sci:"rocket",par:"bubble",edu:"book",sol:"pawn",cla:"board",abs:"hex",via:"compass"};

/* ───────── PORTADAS PROPIAS (ilustración generada) ───────── */
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
/* ───────── PORTADAS ILUSTRADAS ORIGINALES (temáticas) ───────── */
const hexP=(x,y,r)=>`M${x} ${y-r}L${(x+r*.866).toFixed(1)} ${y-r/2}L${(x+r*.866).toFixed(1)} ${y+r/2}L${x} ${y+r}L${(x-r*.866).toFixed(1)} ${y+r/2}L${(x-r*.866).toFixed(1)} ${y-r/2}Z`;
const pips=(x,y,s,n,c)=>{const P={1:[[.5,.5]],2:[[.25,.25],[.75,.75]],3:[[.25,.25],[.5,.5],[.75,.75]],4:[[.25,.25],[.75,.25],[.25,.75],[.75,.75]],5:[[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]],6:[[.25,.22],[.75,.22],[.25,.5],[.75,.5],[.25,.78],[.75,.78]]}[n];return P.map(([a,b])=>`<circle cx="${x+a*s}" cy="${y+b*s}" r="${s*.08}" fill="${c}"/>`).join("")};
const IV="#ECE5D5";
const MOT={
 hex:(G,S)=>{const c=[[210,70],[241,70],[179,70],[194.5,43],[225.5,43],[194.5,97],[225.5,97]];return c.map(([x,y],i)=>`<path d="${hexP(x,y,17)}" fill="${G}" fill-opacity="${[.35,.15,.22,.12,.28,.18,.1][i]}" stroke="${S}" stroke-width="2"/>`).join("")+`<path d="M203 74v-8l7-6 7 6v8z" fill="${S}"/><circle cx="241" cy="70" r="4" fill="${IV}"/><path d="M175 66l4-8 4 8z" fill="${IV}" opacity=".8"/>`},
 train:(G,S)=>`<path d="M135 112H292" stroke="${S}" stroke-width="2.5"/>${Array.from({length:9},(_,i)=>`<path d="M${142+i*17} 108v8" stroke="${S}" stroke-width="2"/>`).join("")}<rect x="160" y="60" width="72" height="36" rx="6" fill="${G}" fill-opacity=".3" stroke="${S}" stroke-width="2.5"/><rect x="226" y="40" width="34" height="56" rx="4" fill="${G}" fill-opacity=".45" stroke="${S}" stroke-width="2.5"/><rect x="233" y="48" width="20" height="16" rx="2" fill="${IV}" opacity=".8"/><rect x="170" y="38" width="12" height="22" fill="${S}"/><circle cx="176" cy="28" r="7" fill="${IV}" opacity=".35"/><circle cx="166" cy="16" r="10" fill="${IV}" opacity=".2"/>${[180,207,245].map(x=>`<circle cx="${x}" cy="100" r="10" fill="#0E0F13" stroke="${S}" stroke-width="2.5"/><circle cx="${x}" cy="100" r="3" fill="${S}"/>`).join("")}<path d="M150 96l10-8v8z" fill="${S}"/>`,
 tiles:(G,S)=>{let o="";const col=[G,IV,"#7a2e3a","#1F5E4E"];for(let i=0;i<4;i++)for(let j=0;j<4;j++){const k=(i*3+j*2)%4;o+=`<rect x="${158+i*28}" y="${14+j*28}" width="24" height="24" rx="4" fill="${col[k]}" fill-opacity="${k===1?.85:.7}" stroke="${S}" stroke-width="1.5"/>`+(k===0?`<path d="M${170+i*28} ${18+j*28}l8 8-8 8-8-8z" fill="none" stroke="#0E0F13" stroke-width="1.5" opacity=".6"/>`:"")}return o},
 chess:(G,S)=>{let o="";for(let i=0;i<6;i++)for(let j=0;j<3;j++)if((i+j)%2)o+=`<rect x="${150+i*24}" y="${92+j*10}" width="24" height="10" fill="${S}" opacity=".35"/>`;return o+`<rect x="150" y="92" width="144" height="30" fill="none" stroke="${S}" stroke-width="1.5"/><path d="M196 92h44v-8h-6c3-20-2-36-16-46l3-12-11 7c-15 5-24 18-26 32l11 3 7-9c5 7 3 15-4 22l-8 3z" fill="${G}" stroke="${S}" stroke-width="2"/><circle cx="214" cy="46" r="2.5" fill="#0E0F13"/><path d="M258 92h22v-6h-4v-22h4v-6h-6v-6h4v-8h-4v4h-4v-4h-4v4h-4v-4h-4v8h4v6h-6v6h4v22h-4z" fill="${IV}" opacity=".85"/>`},
 stones:(G,S)=>{let o="";for(let i=0;i<6;i++){o+=`<path d="M${160+i*22} 14V124M160 ${14+i*22}H270" stroke="${S}" stroke-width="1.3" opacity=".7"/>`}const st=[[1,1,0],[2,2,1],[3,1,0],[2,3,0],[3,3,1],[4,2,1],[1,3,1],[3,2,0]];return o+st.map(([i,j,w])=>`<circle cx="${160+i*22}" cy="${14+j*22}" r="9.5" fill="${w?IV:"#0E0F13"}" stroke="${S}" stroke-width="1.8"/>`).join("")},
 dice:(G,S)=>`<g transform="rotate(-14 185 70)"><rect x="160" y="45" width="50" height="50" rx="10" fill="${G}" stroke="${S}" stroke-width="2"/>${pips(160,45,50,5,"#0E0F13")}</g><g transform="rotate(12 245 60)"><rect x="222" y="36" width="46" height="46" rx="9" fill="#0E0F13" stroke="${S}" stroke-width="2.5"/>${pips(222,36,46,3,S)}</g><g transform="rotate(30 232 108)"><rect x="216" y="92" width="30" height="30" rx="7" fill="${IV}" stroke="${S}" stroke-width="2"/>${pips(216,92,30,6,"#0E0F13")}</g>`,
 cards:(G,S)=>[-32,-12,8,28].map((r,i)=>`<g transform="rotate(${r} 215 140)"><rect x="190" y="30" width="50" height="74" rx="7" fill="${i===3?IV:"#0E0F13"}" stroke="${S}" stroke-width="2"/>${i===3?`<path d="M215 52l11 15-11 15-11-15z" fill="#7a2e3a"/><text x="196" y="44" font-size="11" font-weight="800" fill="#7a2e3a" font-family="Georgia">A</text>`:`<rect x="196" y="36" width="38" height="62" rx="4" fill="none" stroke="${S}" stroke-width="1" opacity=".6"/>`}</g>`).join(""),
 domino:(G,S)=>[[170,40,-18,[3,5]],[215,30,8,[6,2]],[248,58,28,[1,4]]].map(([x,y,r,[a,b]])=>`<g transform="rotate(${r} ${x+16} ${y+32})"><rect x="${x}" y="${y}" width="32" height="64" rx="5" fill="${IV}" stroke="${S}" stroke-width="2"/><path d="M${x+4} ${y+32}h24" stroke="#0E0F13" stroke-width="1.5"/>${pips(x,y,32,a,"#0E0F13")}${pips(x,y+32,32,b,"#0E0F13")}</g>`).join(""),
 triangles:(G,S)=>{let o=`<rect x="150" y="14" width="140" height="112" rx="6" fill="none" stroke="${S}" stroke-width="2"/>`;for(let i=0;i<6;i++){const x=152+i*23;o+=`<path d="M${x} 16l11.5 44 11.5-44z" fill="${i%2?G:IV}" fill-opacity=".7"/><path d="M${x} 124l11.5-44 11.5 44z" fill="${i%2?IV:G}" fill-opacity=".7"/>`}return o+[[175,30,1],[175,46,1],[244,110,0],[244,94,0],[221,110,0]].map(([x,y,w])=>`<circle cx="${x}" cy="${y}" r="8" fill="${w?"#0E0F13":"#7a2e3a"}" stroke="${S}" stroke-width="1.8"/>`).join("")},
 castle:(G,S)=>`<path d="M160 120V60h10v-8h8v8h8v-8h8v8h10v60M236 120V60h10v-8h8v8h8v-8h8v8h10v60" fill="${G}" fill-opacity=".3" stroke="${S}" stroke-width="2.2"/><path d="M204 120V72h32v48" fill="${G}" fill-opacity=".45" stroke="${S}" stroke-width="2.2"/><path d="M204 72l16-26 16 26" fill="${G}" stroke="${S}" stroke-width="2"/><path d="M212 120v-20a8 8 0 0 1 16 0v20" fill="#0E0F13" stroke="${S}" stroke-width="2"/><path d="M220 46V24l14 6-14 6" fill="${IV}" stroke="${S}" stroke-width="1.5"/><path d="M150 120H290" stroke="${S}" stroke-width="2"/><rect x="170" y="74" width="7" height="12" rx="3" fill="${IV}" opacity=".8"/><rect x="250" y="74" width="7" height="12" rx="3" fill="${IV}" opacity=".8"/>`,
 bird:(G,S)=>`<path d="M158 88c18-34 62-44 88-22l26-10-12 20c-10 30-54 46-90 30l-26 12 10-22z" fill="${G}" fill-opacity=".35" stroke="${S}" stroke-width="2.2"/><path d="M196 72c14-30 40-40 60-34-16 6-30 22-36 40" fill="${G}" fill-opacity=".6" stroke="${S}" stroke-width="2"/><circle cx="252" cy="66" r="3" fill="${IV}"/><path d="M272 56l14-2-12 8" fill="${S}"/><path d="M170 120c20-6 50-6 80 0" stroke="${S}" stroke-width="2" fill="none"/><path d="M200 118l6-14M226 118l-4-14" stroke="${S}" stroke-width="2"/><circle cx="270" cy="24" r="2" fill="${IV}"/><circle cx="160" cy="30" r="1.6" fill="${IV}"/>`,
 planet:(G,S)=>`<circle cx="214" cy="70" r="34" fill="${G}" fill-opacity=".3" stroke="${S}" stroke-width="2.5"/><path d="M190 60c14 6 30 6 48-2M186 78c18 8 38 8 56 0" stroke="${S}" stroke-width="1.5" fill="none" opacity=".7"/><ellipse cx="214" cy="72" rx="64" ry="13" transform="rotate(-16 214 72)" fill="none" stroke="${IV}" stroke-width="2.2"/><circle cx="272" cy="28" r="8" fill="${IV}" opacity=".8"/>${[[160,22],[284,104],[170,116],[250,120],[150,70]].map(([x,y])=>`<path d="M${x} ${y-5}l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="${S}"/>`).join("")}`,
 globe:(G,S)=>`<circle cx="215" cy="70" r="46" fill="${G}" fill-opacity=".15" stroke="${S}" stroke-width="2.5"/><ellipse cx="215" cy="70" rx="20" ry="46" fill="none" stroke="${S}" stroke-width="1.4" opacity=".7"/><path d="M169 70h92M175 48h80M175 92h80" stroke="${S}" stroke-width="1.4" opacity=".7"/>${(()=>{const n=[[188,50],[226,40],[246,74],[200,92],[230,104],[182,76]];return `<path d="M${n.map(p=>p.join(" ")).join("L")}Z" stroke="${IV}" stroke-width="1.5" fill="none" opacity=".8"/>`+n.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="5" fill="${["#7a2e3a",IV,"#1F5E4E",G][i%4]}" stroke="${S}" stroke-width="1.5"/>`).join("")})()}`,
 gems:(G,S)=>`<path d="M182 46h64l18 22-50 56-50-56z" fill="${G}" fill-opacity=".35" stroke="${S}" stroke-width="2.5"/><path d="M164 68h100M196 46l-14 22 32 56 32-56-14-22M214 46v22" stroke="${S}" stroke-width="1.6" fill="none"/><path d="M262 92l12 14-12 16-12-16z" fill="#1F5E4E" stroke="${S}" stroke-width="1.8"/><path d="M160 98l10 12-10 14-10-14z" fill="#7a2e3a" stroke="${S}" stroke-width="1.8"/><path d="M270 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${IV}"/>`,
 columns:(G,S)=>`<path d="M160 50l55-28 55 28z" fill="${G}" fill-opacity=".4" stroke="${S}" stroke-width="2.2"/><rect x="158" y="50" width="114" height="8" fill="${S}"/>${[166,192,218,244].map(x=>`<rect x="${x}" y="60" width="16" height="52" fill="${G}" fill-opacity=".25" stroke="${S}" stroke-width="1.8"/><path d="M${x+5} 62v48M${x+11} 62v48" stroke="${S}" stroke-width="1" opacity=".6"/>`).join("")}<rect x="152" y="112" width="126" height="8" fill="${S}"/><rect x="146" y="120" width="138" height="6" fill="${S}" opacity=".7"/>`,
 crystal:(G,S)=>`<circle cx="215" cy="62" r="38" fill="${G}" fill-opacity=".18" stroke="${S}" stroke-width="2.5"/><path d="M196 46c6-10 18-14 28-10" stroke="${IV}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/><path d="M190 104h50l8 16h-66z" fill="${G}" fill-opacity=".5" stroke="${S}" stroke-width="2"/>${[[170,30,6],[262,40,5],[250,96,4],[178,90,3],[230,20,4]].map(([x,y,r])=>`<path d="M${x} ${y-r}l${r*.3} ${r*.7} ${r*.7} ${r*.3}-${r*.7} ${r*.3}-${r*.3} ${r*.7}-${r*.3}-${r*.7}-${r*.7}-${r*.3} ${r*.7}-${r*.3}z" fill="${IV}"/>`).join("")}<circle cx="215" cy="62" r="12" fill="#3E2C5E" opacity=".7"/>`,
 detective:(G,S)=>`<circle cx="200" cy="58" r="30" fill="${G}" fill-opacity=".15" stroke="${S}" stroke-width="5"/><path d="M222 80l34 34" stroke="${S}" stroke-width="10" stroke-linecap="round"/><path d="M188 46c4-6 12-9 18-8" stroke="${IV}" stroke-width="3" fill="none" stroke-linecap="round"/>${[[160,118],[176,104],[262,40],[276,26]].map(([x,y],i)=>`<ellipse cx="${x}" cy="${y}" rx="5" ry="8" transform="rotate(${i<2?-40:40} ${x} ${y})" fill="${IV}" opacity=".55"/>`).join("")}`,
 swords:(G,S)=>`<path d="M178 30l70 74M252 30l-70 74" stroke="${S}" stroke-width="5" stroke-linecap="round"/><path d="M172 24l8 2 2 8M258 24l-8 2-2 8" stroke="${IV}" stroke-width="3" fill="none"/><path d="M238 96l18-2-2 18M192 96l-18-2 2 18" stroke="${S}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M215 46c14 6 26 6 32 4 0 30-12 50-32 60-20-10-32-30-32-60 6 2 18 2 32-4z" fill="${G}" fill-opacity=".55" stroke="${S}" stroke-width="2.2"/><path d="M215 58v40M202 74h26" stroke="#0E0F13" stroke-width="3"/>`,
 party:(G,S)=>`<path d="M162 40h52a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8h-34l-12 10v-10h-6a8 8 0 0 1-8-8v-24a8 8 0 0 1 8-8z" fill="${G}" fill-opacity=".4" stroke="${S}" stroke-width="2"/><path d="M220 70h52a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8h-6v10l-12-10h-34a8 8 0 0 1-8-8v-22a8 8 0 0 1 8-8z" fill="${IV}" fill-opacity=".85" stroke="${S}" stroke-width="2"/><text x="178" y="66" font-size="20" font-weight="800" fill="${IV}" font-family="Georgia">?!</text><text x="236" y="97" font-size="18" font-weight="800" fill="#0E0F13" font-family="Georgia">¡Ja!</text>${[[262,30,"#7a2e3a"],[280,52,G],[160,108,"#1F5E4E"],[250,22,IV],[176,118,G]].map(([x,y,c],i)=>`<rect x="${x}" y="${y}" width="6" height="10" rx="2" transform="rotate(${i*37} ${x} ${y})" fill="${c}"/>`).join("")}`,
 forest:(G,S)=>`<path d="M146 122l40-58 26 34 22-30 50 54z" fill="${G}" fill-opacity=".18" stroke="${S}" stroke-width="2"/><path d="M186 64l8 12-8 -2-8 2z" fill="${IV}"/>${[[170,120,30],[200,122,40],[236,122,32],[266,122,26]].map(([x,y,h])=>`<path d="M${x} ${y-h*2}l${h*.55} ${h*.9}h-${h*.25}l${h*.45} ${h*.7}h-${h*.3}l${h*.4} ${h*.4}h-${h*1.8}l${h*.4}-${h*.4}h-${h*.3}l${h*.45}-${h*.7}h-${h*.25}z" fill="#1F5E4E" stroke="${S}" stroke-width="1.6"/>`).join("")}<circle cx="258" cy="30" r="12" fill="${IV}" opacity=".85"/>`,
 ship:(G,S)=>`<path d="M160 96h112l-16 22h-80z" fill="${G}" fill-opacity=".5" stroke="${S}" stroke-width="2.2"/><path d="M214 96V22" stroke="${S}" stroke-width="2.5"/><path d="M216 26c22 12 34 34 34 60h-34z" fill="${IV}" fill-opacity=".85" stroke="${S}" stroke-width="1.6"/><path d="M212 34c-18 12-28 30-28 52h28z" fill="${IV}" fill-opacity=".6" stroke="${S}" stroke-width="1.6"/><path d="M214 22l16 5-16 5" fill="#7a2e3a"/><path d="M146 124c10-6 20 6 30 0s20 6 30 0 20 6 30 0 20 6 30 0 14 4 20 0" stroke="${S}" stroke-width="2" fill="none"/>`,
 farm:(G,S)=>`<path d="M166 120V70l32-26 32 26v50z" fill="#6E2433" stroke="${S}" stroke-width="2.2"/><path d="M184 120V92h28v28M184 92l28 28M212 92l-28 28" stroke="${S}" stroke-width="2" fill="none"/><circle cx="198" cy="70" r="6" fill="none" stroke="${S}" stroke-width="2"/>${[0,1,2,3].map(i=>`<path d="M238 ${120-i*12}c14-4 30-4 46 0" stroke="${S}" stroke-width="2" fill="none"/>`).join("")}<ellipse cx="262" cy="56" rx="14" ry="10" fill="${IV}" stroke="${S}" stroke-width="1.6"/><circle cx="276" cy="52" r="5" fill="#0E0F13"/><path d="M254 64v8M268 64v8" stroke="${S}" stroke-width="2"/>`,
 city:(G,S)=>[[156,70,22],[180,40,24],[206,58,20],[228,26,26],[256,64,22],[280,48,14]].map(([x,y,w],i)=>`<rect x="${x}" y="${y}" width="${w}" height="${124-y}" fill="${i%2?G:"#0E0F13"}" fill-opacity="${i%2?.35:1}" stroke="${S}" stroke-width="1.8"/>`+Array.from({length:Math.floor((118-y)/14)},(_,k)=>`<rect x="${x+5}" y="${y+6+k*14}" width="4" height="6" fill="${IV}" opacity="${(k+i)%3?.85:.25}"/><rect x="${x+w-9}" y="${y+6+k*14}" width="4" height="6" fill="${IV}" opacity="${(k+i)%2?.85:.25}"/>`).join("")).join("")+`<circle cx="164" cy="26" r="9" fill="${IV}" opacity=".7"/>`,
 money:(G,S)=>`${[0,1,2,3,4].map(i=>`<ellipse cx="182" cy="${114-i*10}" rx="24" ry="7" fill="${G}" stroke="${S}" stroke-width="1.8"/>`).join("")}${[0,1,2].map(i=>`<ellipse cx="226" cy="${114-i*10}" rx="20" ry="6" fill="${G}" fill-opacity=".8" stroke="${S}" stroke-width="1.8"/>`).join("")}<path d="M160 50l28-14 24 12 28-24 30 6" stroke="${IV}" stroke-width="3" fill="none"/><path d="M262 22l10 8-12 4" stroke="${IV}" stroke-width="3" fill="none"/><text x="176" y="78" font-size="18" font-weight="800" fill="#0E0F13" font-family="Georgia">$</text>`,
 blocks:(G,S)=>[[166,82,"A","#6E2433"],[212,82,"B","#1F5E4E"],[189,40,"C","#1E3A5F"]].map(([x,y,l,c])=>`<rect x="${x}" y="${y}" width="42" height="42" rx="6" fill="${c}" stroke="${S}" stroke-width="2.2"/><text x="${x+21}" y="${y+30}" text-anchor="middle" font-size="26" font-weight="800" fill="${IV}" font-family="Georgia">${l}</text>`).join("")+`<circle cx="268" cy="40" r="14" fill="${G}" stroke="${S}" stroke-width="2"/><path d="M268 54c-4 20 4 40-6 64" stroke="${S}" stroke-width="1.5" fill="none"/>`,
 rings:(G,S)=>[[192,62,G],[238,62,IV],[215,96,"#1F5E4E"]].map(([x,y,c])=>`<circle cx="${x}" cy="${y}" r="30" fill="none" stroke="${c}" stroke-width="6" opacity=".9"/>`).join("")+`<path d="M215 66c-6-8-18-6-18 4 0 8 18 18 18 18s18-10 18-18c0-10-12-12-18-4z" fill="#7a2e3a" stroke="${S}" stroke-width="1.6"/>`,
 mask:(G,S)=>`<path d="M162 34c22-6 44-6 62 0 2 40-10 64-31 70-21-6-33-30-31-70z" fill="${IV}" fill-opacity=".9" stroke="${S}" stroke-width="2"/><path d="M176 58c4-4 10-4 14 0M198 58c4-4 10-4 14 0" stroke="#0E0F13" stroke-width="3" fill="none"/><path d="M182 82c8 8 16 8 24 0" stroke="#0E0F13" stroke-width="3" fill="none"/><path d="M214 50c20-8 42-8 62 0 2 40-10 64-31 70-21-6-33-30-31-70z" fill="#0E0F13" stroke="${S}" stroke-width="2.2"/><path d="M228 72c4 4 10 4 14 0M250 72c4 4 10 4 14 0" stroke="${S}" stroke-width="3" fill="none"/><path d="M234 102c8-8 16-8 24 0" stroke="${S}" stroke-width="3" fill="none"/>`,
 desert:(G,S)=>`<circle cx="256" cy="38" r="16" fill="${IV}" opacity=".85"/><path d="M150 112l42-64 42 64z" fill="${G}" fill-opacity=".55" stroke="${S}" stroke-width="2"/><path d="M192 48l14 64" stroke="#0E0F13" stroke-width="1.5" opacity=".5"/><path d="M214 112l30-44 30 44z" fill="${G}" fill-opacity=".35" stroke="${S}" stroke-width="2"/><path d="M144 124c30-10 60-10 90-2s50 6 60 2" stroke="${S}" stroke-width="2" fill="none"/>`,
 japan:(G,S)=>`<circle cx="236" cy="48" r="26" fill="#7a2e3a" opacity=".9"/><path d="M160 40c30 6 80 6 110 0v8c-30 6-80 6-110 0z" fill="#9E3A4C" stroke="${S}" stroke-width="2"/><path d="M168 62h96" stroke="#9E3A4C" stroke-width="7"/><path d="M180 48v76M252 48v76" stroke="#9E3A4C" stroke-width="8"/><path d="M180 48v76M252 48v76" stroke="${S}" stroke-width="1.2" fill="none"/><path d="M150 124h140" stroke="${S}" stroke-width="2"/>`,
 haunted:(G,S)=>`<circle cx="258" cy="34" r="18" fill="${IV}" opacity=".9"/><circle cx="266" cy="30" r="16" fill="#1A1A22"/><path d="M168 122V72l-8 2 34-38 34 38-8-2v50z" fill="#1A1A22" stroke="${S}" stroke-width="2.2"/><path d="M220 122V86l14-14 16 14v36z" fill="#1A1A22" stroke="${S}" stroke-width="2"/><rect x="182" y="84" width="10" height="12" fill="${G}" opacity=".9"/><rect x="200" y="84" width="10" height="12" fill="${G}" opacity=".5"/><path d="M188 122v-14h16v14" fill="${G}" fill-opacity=".3" stroke="${S}" stroke-width="1.5"/><path d="M196 26l-6-4-6 4M276 72l-5-4-5 4M160 44l-5-3-5 3" stroke="${IV}" stroke-width="2" fill="none"/>`,
 factory:(G,S)=>`<path d="M154 122V82l26-14v14l26-14v14l26-14v54z" fill="${G}" fill-opacity=".3" stroke="${S}" stroke-width="2.2"/><rect x="238" y="40" width="14" height="82" fill="#0E0F13" stroke="${S}" stroke-width="2"/><rect x="262" y="58" width="12" height="64" fill="#0E0F13" stroke="${S}" stroke-width="2"/><circle cx="246" cy="28" r="9" fill="${IV}" opacity=".35"/><circle cx="258" cy="16" r="12" fill="${IV}" opacity=".2"/><circle cx="270" cy="46" r="7" fill="${IV}" opacity=".3"/>${[164,190,216].map(x=>`<rect x="${x}" y="96" width="10" height="10" fill="${IV}" opacity=".8"/>`).join("")}`,
 mountain:(G,S)=>`<path d="M144 122l44-70 24 34 22-28 52 64z" fill="${G}" fill-opacity=".25" stroke="${S}" stroke-width="2.2"/><path d="M188 52l10 16-10-4-10 4z" fill="${IV}"/><path d="M234 58l8 10-8-3-8 3z" fill="${IV}"/><circle cx="262" cy="40" r="20" fill="#0E0F13" stroke="${S}" stroke-width="2"/><path d="M262 24l5 16-5 16-5-16z" fill="#7a2e3a"/><path d="M262 24l5 16h-10z" fill="${S}"/><path d="M246 40h32" stroke="${S}" stroke-width="1"/><path d="M160 108c20-10 30 4 46-6" stroke="${IV}" stroke-width="2" stroke-dasharray="4 5" fill="none"/>`,
 flower:(G,S)=>[0,60,120,180,240,300].map(a=>`<ellipse cx="214" cy="44" rx="13" ry="22" transform="rotate(${a} 214 70)" fill="${a%120?IV:G}" fill-opacity=".8" stroke="${S}" stroke-width="1.6"/>`).join("")+`<circle cx="214" cy="70" r="12" fill="#7a2e3a" stroke="${S}" stroke-width="2"/><path d="M214 96c0 10 4 20 0 30M214 112c10-10 24-10 30-4-10 8-20 8-30 4" stroke="${S}" stroke-width="2" fill="#1F5E4E"/>`,
 wine:(G,S)=>`${[[190,52],[204,52],[218,52],[197,64],[211,64],[204,76],[183,64],[225,64],[190,76],[218,76],[197,88],[211,88],[204,100]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7.5" fill="#6E2433" stroke="${S}" stroke-width="1.6"/>`).join("")}<path d="M204 44c0-10 6-16 14-18" stroke="${S}" stroke-width="2.5" fill="none"/><path d="M218 30c10-8 26-6 30 4-10 6-24 6-30-4z" fill="#1F5E4E" stroke="${S}" stroke-width="1.6"/><path d="M248 70h28l-4 22c-2 8-8 12-10 12s-8-4-10-12z" fill="#6E2433" fill-opacity=".8" stroke="${S}" stroke-width="2"/><path d="M262 104v14M252 120h20" stroke="${S}" stroke-width="2.5"/>`,
 paw:(G,S)=>`<path d="M214 118c-24 0-34-16-28-28s20-18 28-18 22 6 28 18-4 28-28 28z" fill="${G}" fill-opacity=".55" stroke="${S}" stroke-width="2.2"/>${[[180,62,10,13,-20],[200,40,10,14,-6],[228,40,10,14,6],[248,62,10,13,20]].map(([x,y,rx,ry,r])=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${y})" fill="${G}" fill-opacity=".55" stroke="${S}" stroke-width="2"/>`).join("")}`,
 letters:(G,S,g)=>{const L=(norm(g.name).replace(/[^a-z]/g,"").toUpperCase()+"LUD").slice(0,3).split("");return L.map((l,i)=>`<g transform="rotate(${[-8,4,-3][i]} ${178+i*40} 70)"><rect x="${158+i*40}" y="${46+[0,10,-4][i]}" width="38" height="40" rx="6" fill="${IV}" stroke="${S}" stroke-width="2"/><text x="${177+i*40}" y="${76+[0,10,-4][i]}" text-anchor="middle" font-size="24" font-weight="800" fill="#0E0F13" font-family="Georgia">${l}</text><text x="${190+i*40}" y="${83+[0,10,-4][i]}" font-size="8" fill="#0E0F13">${[1,3,2][i]}</text></g>`).join("")+`<path d="M156 112h126" stroke="${S}" stroke-width="2"/>`},
 pencil:(G,S)=>{let o=`<rect x="160" y="22" width="86" height="102" rx="4" fill="${IV}" fill-opacity=".9" stroke="${S}" stroke-width="2"/>`;for(let i=1;i<6;i++)o+=`<path d="M${160+i*14.3} 22v102M160 ${22+i*17}h86" stroke="#0E0F13" stroke-width=".8" opacity=".35"/>`;return o+`<path d="M175 44l9 9 15-18M190 78h40M190 96h30" stroke="#7a2e3a" stroke-width="2.4" fill="none"/><g transform="rotate(35 260 70)"><rect x="252" y="20" width="16" height="80" fill="${G}" stroke="${S}" stroke-width="1.8"/><path d="M252 100l8 18 8-18z" fill="${IV}" stroke="${S}" stroke-width="1.5"/><rect x="252" y="12" width="16" height="10" fill="#7a2e3a"/></g>`},
 stack:(G,S)=>Array.from({length:7},(_,i)=>i%2?`<rect x="186" y="${112-i*14}" width="58" height="12" rx="2" fill="${G}" fill-opacity="${i===3?0:.6}" stroke="${S}" stroke-width="1.6"/>`:[0,1,2].map(k=>`<rect x="${186+k*20}" y="${112-i*14}" width="18" height="12" rx="2" fill="${(k+i)%3?G:IV}" fill-opacity=".7" stroke="${S}" stroke-width="1.6"/>`).join("")).join("")+`<rect x="248" y="104" width="34" height="10" rx="2" transform="rotate(-18 265 109)" fill="${IV}" stroke="${S}" stroke-width="1.6"/>`,
 race:(G,S)=>{let o="";for(let i=0;i<5;i++)for(let j=0;j<4;j++)if((i+j)%2)o+=`<rect x="${212+i*14}" y="${24+j*12}" width="14" height="12" fill="${IV}"/>`;return `<path d="M210 22v100" stroke="${S}" stroke-width="3"/><rect x="212" y="24" width="70" height="48" fill="#0E0F13" stroke="${S}" stroke-width="1.5"/>`+o+`<path d="M150 92h46M160 104h40M146 116h56" stroke="${S}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`},
 board:(G,S)=>{let o="";for(let i=0;i<5;i++)for(let j=0;j<5;j++)o+=`<rect x="${162+i*20}" y="${20+j*20}" width="20" height="20" fill="${(i+j)%2?G:"#0E0F13"}" fill-opacity="${(i+j)%2?.55:1}"/>`;return o+`<rect x="162" y="20" width="100" height="100" fill="none" stroke="${S}" stroke-width="2"/><circle cx="242" cy="50" r="7" fill="${IV}"/><path d="M234 74c2-10 4-14 8-17 4 3 6 7 8 17z" fill="${IV}"/><circle cx="182" cy="90" r="7" fill="#7a2e3a" stroke="${S}"/>`},
 crown:(G,S)=>`<path d="M166 104l-8-58 30 26 26-42 26 42 30-26-8 58z" fill="${G}" fill-opacity=".55" stroke="${S}" stroke-width="2.5"/><rect x="164" y="104" width="102" height="14" rx="3" fill="${G}" stroke="${S}" stroke-width="2"/>${[[158,46],[214,30],[270,46]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6" fill="${IV}" stroke="${S}" stroke-width="1.5"/>`).join("")}<circle cx="214" cy="111" r="4" fill="#7a2e3a"/><circle cx="188" cy="111" r="3.5" fill="#1F5E4E"/><circle cx="240" cy="111" r="3.5" fill="#1F5E4E"/>`,
 pawn:(G,S)=>`<circle cx="214" cy="42" r="18" fill="${G}" stroke="${S}" stroke-width="2.2"/><path d="M196 112c2-28 8-46 18-52 10 6 16 24 18 52z" fill="${G}" stroke="${S}" stroke-width="2.2"/><rect x="186" y="110" width="56" height="12" rx="4" fill="${G}" stroke="${S}" stroke-width="2"/><path d="M206 34c3-4 7-5 11-4" stroke="${IV}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
 fireworks:(G,S)=>[[200,50,30,G],[252,40,20,IV],[236,92,24,"#9E3A4C"]].map(([x,y,r,c])=>Array.from({length:12},(_,k)=>{const a=k*Math.PI/6;return `<path d="M${x+Math.cos(a)*r*.35} ${y+Math.sin(a)*r*.35}L${(x+Math.cos(a)*r).toFixed(1)} ${(y+Math.sin(a)*r).toFixed(1)}" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`}).join("")+`<circle cx="${x}" cy="${y}" r="3" fill="${IV}"/>`).join("")
};
const THEME_ID={uno:"cards","quien-es-quien":"detective","batalla-naval":"ship",barrage:"factory",barenpark:"paw",blokus:"tiles","hey-fish":"ship","conecta-4":"stones",mastermind:"stones",rummikub:"tiles",qwirkle:"tiles",dudo:"dice",ludo:"board",parchis:"board",mahjong:"tiles",ingenious:"tiles","patchwork":"tiles",trivial:"party",catan:"hex","ticket-to-ride":"train","ticket-to-ride-europe":"train","ticket-to-ride-nordic":"train","ticket-to-ride-london":"train","brass-birmingham":"factory","brass-lancashire":"factory","power-grid":"factory",scythe:"factory",azul:"tiles","azul-pabellon":"tiles","azul-sintra":"tiles",sagrada:"tiles",calico:"tiles",ajedrez:"chess",shogi:"chess",xiangqi:"chess",go:"stones",othello:"stones",hex:"stones","gobblet-gobblers":"stones",quarto:"stones",abalone:"stones",backgammon:"triangles",domino:"domino",carcassonne:"castle","mi-primer-carcassonne":"castle",kingdomino:"castle",dragomino:"castle",torres:"castle","castillos-borgona":"castle",caylus:"castle","el-grande":"castle","castles-mad-king":"castle",citadels:"castle",wingspan:"bird","terraforming-mars":"planet","gaia-project":"planet","twilight-imperium-4":"planet","star-wars-rebellion":"planet","race-for-the-galaxy":"planet","roll-for-the-galaxy":"planet","cosmic-encounter":"planet","tiny-epic-galaxies":"planet","galaxy-trucker":"planet",pandemic:"globe","pandemic-legacy-1":"globe","pandemic-legacy-2":"globe","twilight-struggle":"globe",diplomacy:"globe",splendor:"gems","splendor-duel":"gems","7-wonders":"columns","7-wonders-duel":"columns","7-wonders-architects":"columns","through-the-ages":"columns",concordia:"columns",tapestry:"columns",dixit:"crystal","dixit-odyssey":"crystal",mysterium:"crystal","res-arcana":"crystal",hanabi:"fireworks","forbidden-island":"ship","puerto-rico":"ship",jamaica:"ship",maracaibo:"ship","port-royal":"ship","sea-salt-paper":"ship","le-havre":"ship","forbidden-desert":"desert",jaipur:"desert","camel-up":"desert",istanbul:"desert","five-tribes":"desert",ra:"desert",kemet:"desert",senet:"desert",cascadia:"forest",everdell:"forest",root:"forest","spirit-island":"forest",parks:"forest",meadow:"forest","living-forest":"forest",dorfromantik:"forest",takenoko:"japan",tokaido:"japan",hanamikoji:"japan",viticulture:"wine","ark-nova":"paw",zooloretto:"paw",agricola:"farm",caverna:"farm","all-creatures":"farm","stone-age":"farm",nusfjord:"farm","feast-for-odin":"farm",bohnanza:"farm",jenga:"stack","rhino-hero":"stack","animal-sobre-animal":"stack",heat:"race","flamme-rouge":"race","welcome-to":"pencil",cartographers:"pencil","railroad-ink":"pencil",qwixx:"pencil","ganz-schon-clever":"pencil",yahtzee:"pencil",generala:"pencil",monopoly:"city","monopoly-deal":"city","machi-koro":"city",suburbia:"city","tiny-towns":"city",acquire:"city",gloomhaven:"mountain","gloomhaven-jaws":"mountain","mage-knight":"mountain","legends-of-andor":"mountain","el-dorado":"mountain","lost-ruins-arnak":"mountain",clank:"mountain","descent-2":"mountain",paleo:"mountain",tikal:"mountain",zombicide:"haunted","dead-of-winter":"haunted","betrayal-house":"haunted","mansions-madness":"haunted","eldritch-horror":"haunted","arkham-lcg":"haunted",horrified:"haunted",nemesis:"haunted",cluedo:"detective","sherlock-holmes-cd":"detective",microMacro:"detective","scotland-yard":"detective","mr-jack":"detective","chronicles-of-crime":"detective","detective-modern":"detective",codenames:"detective","codenames-duet":"detective","codenames-pictures":"detective",coup:"mask",skull:"mask","love-letter":"mask",avalon:"mask","the-resistance":"mask","one-night-werewolf":"mask","hombres-lobo":"mask","mafia-de-cuba":"mask",spyfall:"mask",deception:"mask",bang:"mask","bang-dados":"mask","sheriff-nottingham":"mask",risk:"swords","axis-allies":"swords","memoir-44":"swords","war-of-the-ring":"swords","commands-colors-ancients":"swords","undaunted-normandy":"swords","blood-rage":"swords",cyclades:"swords",inis:"swords",stratego:"swords","cottage-garden":"flower",harmonies:"flower",scrabble:"letters",boggle:"letters",bananagrams:"letters","just-one":"letters",taboo:"letters",scattergories:"letters","so-clover":"letters",concept:"party",wavelength:"party","times-up":"party",telestrations:"party",pictionary:"party","trivial-pursuit":"party",dobble:"rings","dobble-kids":"rings","the-mind":"rings","the-crew":"rings","crew-deep-sea":"rings"};
const THEME_RX=[[/tren|ferrocarril|locomot/,"train"],[/isla|barco|pirata|mar |puerto|caribe|navega/,"ship"],[/castillo|medieval|caballero|reino/,"castle"],[/aves?\b|pajaro/,"bird"],[/espacio|galaxia|planeta|marte|nave|galactic/,"planet"],[/zombi|embrujad|horror|lovecraft|monstruo/,"haunted"],[/egipto|desierto|camello|faraon/,"desert"],[/japon|geisha/,"japan"],[/granja|ovej|cultiv|agricult/,"farm"],[/bosque|naturaleza|fauna|jardin|parque|selva/,"forest"],[/vino|vinedo/,"wine"],[/zoologico|animales/,"paw"],[/palabra|letras/,"letters"],[/hoja|dibuj|tachar|lapiz/,"pencil"],[/apila|torre/,"stack"],[/carrera|ciclis|autos/,"race"],[/detective|crimen|asesin|misterio|investig/,"detective"],[/farol|oculto|traidor|espia/,"mask"],[/comerci|subasta|accion|mercader|dinero|econom/,"money"],[/ciudad|pueblo|urban|hotel/,"city"],[/civiliz|imperio|romano|griego/,"columns"],[/gema|diamante|joya/,"gems"],[/guerra|batalla|ejercito|militar/,"swords"],[/montan|aventura|expedic|mazmorra/,"mountain"]];
const CAT_THEME={cla:"board",car:"cards",dad:"dice",par:"party",ded:"detective",coo:"rings",inf:"blocks",gue:"swords",fan:"crystal",sci:"planet",eco:"money",abs:"stones",est:"crown",fam:"forest",edu:"letters",sol:"pawn",ave:"mountain",con:"castle"};
function themeOf(g){if(THEME_ID[g.id])return THEME_ID[g.id];const t=norm(g.name+" "+(g.desc||""));for(const [rx,m] of THEME_RX)if(rx.test(t))return m;for(const c of ["car","dad","ded","par","coo","gue","fan","sci","eco","abs","inf","ave","con","edu","est","fam","cla","sol"])if(g.cats.includes(c))return CAT_THEME[c];return "pawn"}
function cover(g){
  const prim=g.cats.find(c=>c!=="com"&&c!=="via"&&c!=="sol")||g.cats[0]||"est";
  const bg=CATCOL[prim]||"#1E3A5F",h=hash(g.id),uid="c"+h.toString(36),G=`url(#${uid}g)`,S="#E2C27A";
  const mot=(MOT[themeOf(g)]||MOT.pawn)(G,S,g);
  const words=g.name.replace(/\s*\(.*\)/,"").split(" ");let l1="",l2="";for(const w of words){if((l1+" "+w).trim().length<=16&&!l2)l1=(l1+" "+w).trim();else l2=(l2+" "+w).trim()}
  if(l2.length>18)l2=l2.slice(0,17)+"…";const fs=l1.length>13||l2?20:25;
  const stars=Array.from({length:7},(_,i)=>`<circle cx="${(h>>(i*3))%300}" cy="${(h>>(i*2+5))%120}" r="${.8+(i%3)*.5}" fill="#FFF1C8" opacity="${.25+(i%3)*.2}"/>`).join("");
  return `<svg viewBox="0 0 300 200" role="img" aria-label="Ilustración original de ${esc(g.name)}"><defs><linearGradient id="${uid}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1C8"/><stop offset=".45" stop-color="#E2C27A"/><stop offset="1" stop-color="#8C6B3E"/></linearGradient><radialGradient id="${uid}r" cx=".72" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs>
  <rect width="300" height="200" fill="${bg}"/><rect width="300" height="200" fill="url(#${uid}r)"/>${stars}
  <g>${mot}</g>
  <rect x="0" y="${l2?130:142}" width="300" height="${l2?70:58}" fill="#0A0B0E" opacity=".82"/><rect x="0" y="${l2?130:142}" width="300" height="1.5" fill="#C9A45C" opacity=".7"/>
  <text x="14" y="${l2?156:176}" fill="#ECE5D5" font-family="Playfair Display,Georgia,serif" font-weight="700" font-size="${fs}">${esc(l1)}</text>
  ${l2?`<text x="14" y="183" fill="#ECE5D5" font-family="Playfair Display,Georgia,serif" font-weight="700" font-size="${fs}">${esc(l2)}</text>`:""}
  <text x="14" y="22" fill="#E2C27A" font-family="Nunito Sans,system-ui" font-weight="800" font-size="9.5" letter-spacing="2.2">${esc((CAT[prim]||"").toUpperCase())}</text>
  <rect x="3" y="3" width="294" height="194" fill="none" stroke="#C9A45C" stroke-opacity=".35"/></svg>`;
}

/* ───────── ESTADO (db + local) ───────── */
const LS={get(k,d){try{const v=localStorage.getItem("bgw:"+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem("bgw:"+k,JSON.stringify(v))}catch(e){}}};
const blank=()=>({own:[],want:[],played:[],fav:[],notes:{},plays:[],nights:[],myRating:{}});
const S={me:LS.get("state",blank()),db:null,user:null,uid:null,isOwner:false,canWrite:null,
  reviews:{},videos:{},images:{},assets:null,offers:[],reqs:[],reports:[],stores:[],extra:[],adsCfg:{},online:false};
const A=LS.get("analytics",{views:{},searches:0,recos:0,buyClicks:0,adImp:{},adClicks:0,sessions:0,first:Date.now()});
A.sessions++; LS.set("analytics",A);
const track=(k,sub)=>{if(sub){A[k][sub]=(A[k][sub]||0)+1}else A[k]++;LS.set("analytics",A)};
let saveT=null;
function save(){LS.set("state",S.me);clearTimeout(saveT);saveT=setTimeout(async()=>{if(S.db&&S.uid){try{await S.db.doc(`data/users/${S.uid}/state`).set(JSON.parse(JSON.stringify(S.me)))}catch(e){}}},700)}
async function initCloud(){
  if(!window.claude||!window.claude.use)return;
  try{
    const [db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);
    S.db=db;S.user=user;if(!db)return;
    S.isOwner=user?!!user.isOwner():false;
    try{S.canWrite=user?await user.can("data.write"):null}catch(e){}
    try{S.uid=user?await user.id():null}catch(e){}
    S.online=true;
    if(S.uid){const snap=await S.db.doc(`data/users/${S.uid}/state`).get().catch(()=>null);
      if(snap&&snap.exists){S.me=Object.assign(blank(),snap.data());LS.set("state",S.me)}
      else if(S.me.own.length||S.me.plays.length||S.me.nights.length){save()}}
    S.db.collection("reviews").onSnapshot(q=>{S.reviews={};q.docs.forEach(d=>S.reviews[d.id]=d.data());render()},()=>{});
    S.db.collection("storesVerified").onSnapshot(q=>{S.stores=q.docs.map(d=>Object.assign({id:d.id},d.data()));if(cur==="stores")render()},()=>{});
    S.db.collection("gamesExtra").onSnapshot(q=>{S.extra=q.docs.map(d=>d.data());mergeExtra();render()},()=>{});
    S.db.collection("videos").onSnapshot(q=>{S.videos={};q.docs.forEach(d=>S.videos[d.id]=(d.data().items||[]));if(cur==="game"||cur==="learn"||cur==="admin")render()},()=>{});
    S.db.collection("gameImages").onSnapshot(q=>{S.images={};q.docs.forEach(d=>{const x=d.data();if(x&&x.asset)S.images[d.id]=x});render()},()=>{});
    if(S.isOwner){try{S.assets=await window.claude.use("assets")}catch(e){}}
    S.db.collection("offers").onSnapshot(q=>{S.offers=q.docs.map(d=>Object.assign({id:d.id},d.data()));if(["home","stores","game","admin"].includes(cur))render()},()=>{});
    S.db.doc("config/ads").onSnapshot(d=>{S.adsCfg=d.exists?d.data():{}},()=>{});
    if(S.isOwner||(user&&user.canEdit&&user.canEdit())){
      S.db.collection("storeRequests").onSnapshot(q=>{S.reqs=[];q.docs.forEach(d=>(d.data().items||[]).forEach(it=>S.reqs.push(Object.assign({by:d.id},it))));if(cur==="admin")render()},()=>{});
      S.db.collection("reports").onSnapshot(q=>{S.reports=[];q.docs.forEach(d=>(d.data().items||[]).forEach(it=>S.reports.push(Object.assign({by:d.id},it))));if(cur==="admin")render()},()=>{});
    }
    renderNav();render();
  }catch(e){}
}
function mergeExtra(){const base=(window.BGW_GAMES||[]).map(a=>mk(a));const ids=new Set(base.map(g=>g.id));
  S.extra.forEach(x=>{if(x&&x.row&&!ids.has(x.row[0])){try{base.push(mk(x.row,true))}catch(e){}}});GAMES=base;reindex()}
const ratingOf=id=>{let n=0,s=0;for(const k in S.reviews){const it=(S.reviews[k].items||{})[id];if(it&&it.s){n++;s+=it.s}}return n?{avg:s/n,n}:null};


/* ───────── IMÁGENES REALES (autorizadas) ───────── */
const imgUrl=x=>x.url||("/_blob/"+encodeURIComponent(x.asset));
function art(g,big){const im=S.images[g.id];
  if(!im)return cover(g);
  return `<span class="realimg"><img src="${esc(imgUrl(im))}" alt="Foto de ${esc(g.name)}" loading="lazy" onerror="this.parentNode.outerHTML=window.__bgwCover('${g.id}')">${big&&im.credit?`<span class="credit">© ${esc(im.credit)}</span>`:""}</span>`}
window.__bgwCover=id=>BYID[id]?cover(BYID[id]):"";
const LICS=[["own","Foto propia (tomada por mí)"],["press","Kit de prensa de la editorial, con permiso"],["license","Licencia o autorización escrita de la editorial"],["cc","Creative Commons (indicar licencia en el crédito)"]];
function imageDlg(g){const im=S.images[g.id];
  dialog(`<h3 style="margin-top:0">Foto real de ${esc(g.name)}</h3>
  ${im?`<div style="border-radius:14px;overflow:hidden;margin-bottom:10px">${art(g,true)}</div><p class="small muted">Origen: ${esc((LICS.find(l=>l[0]===im.license)||["",""])[1])}</p>`:""}
  <p class="small muted">Sube solo imágenes propias, licenciadas o autorizadas por la editorial. Formatos JPG, PNG o WEBP.</p>
  <form id="imF"><label class="f" for="imFile">Archivo de imagen</label><input id="imFile" type="file" accept="image/jpeg,image/png,image/webp" required>
  <label class="f" for="imLic">Origen y permiso</label><select id="imLic">${LICS.map(([k,l])=>`<option value="${k}">${l}</option>`).join("")}</select>
  <label class="f" for="imCred">Crédito (autor o editorial)</label><input id="imCred" type="text" maxlength="80" placeholder="Ej.: Foto: Mauro A. / Devir">
  <label class="f" for="imSrc">Enlace a la fuente o al permiso (opcional)</label><input id="imSrc" type="text" maxlength="300" placeholder="https://">
  <label style="margin-top:12px;font-weight:700;display:flex;gap:8px;align-items:center"><input type="checkbox" id="imOk" required style="width:18px;height:18px;flex:none"> Confirmo que tengo derecho a usar esta imagen</label>
  <div class="row" style="margin-top:14px"><button class="btn green" id="imGo">Subir foto</button>${im?`<button type="button" class="btn coral" id="imDel">Quitar foto</button>`:""}<button type="button" class="btn ghost" data-close>Cancelar</button></div><p id="imMsg" class="small"></p></form>`);
  $$("#dlgBox [data-close]").forEach(b=>b.addEventListener("click",closeDlg));
  $("#imF").onsubmit=async e=>{e.preventDefault();const f=$("#imFile").files[0];if(!f)return;
    if(f.size>8*1024*1024)return toast("La imagen supera 8 MB");
    if(!S.assets){$("#imMsg").textContent="La subida de imágenes no está disponible en esta vista.";return}
    $("#imGo").disabled=true;$("#imMsg").textContent="Subiendo…";
    try{const r=await S.assets.upload(f);
      await S.db.doc("gameImages/"+g.id).set({asset:r.id,url:r.url||"",license:$("#imLic").value,credit:$("#imCred").value.trim(),source:$("#imSrc").value.trim(),d:Date.now()});
      toast("Foto publicada");closeDlg()}catch(err){$("#imMsg").textContent="No se pudo subir la imagen.";$("#imGo").disabled=false}};
  $("#imDel")&&($("#imDel").onclick=async()=>{try{await S.db.doc("gameImages/"+g.id).delete();if(S.assets&&im.asset){try{await S.assets.delete(im.asset)}catch(e){}}toast("Foto quitada");closeDlg()}catch(e){toast("No se pudo quitar")}})}
/* ───────── UI HELPERS ───────── */
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("on"),2600)}
function dialog(html){$("#dlgBox").innerHTML=html;$("#dlg").classList.add("open");$("#dlgBox").querySelector("[data-close]")?.addEventListener("click",closeDlg)}
function closeDlg(){$("#dlg").classList.remove("open")}
$("#dlg").addEventListener("click",e=>{if(e.target.id==="dlg")closeDlg()});
async function copy(text){try{await navigator.clipboard.writeText(text);toast("Copiado al portapapeles")}catch(e){dialog(`<h3>Copia este texto</h3><textarea rows="8">${esc(text)}</textarea><div class="row" style="margin-top:12px"><button class="btn" data-close>Cerrar</button></div>`)}}
function gcard(g,extra=""){const r=ratingOf(g.id);
  return `<a class="gc discover" href="#game-${g.id}"><span class="cv">${art(g)}</span><span class="meta"><span class="t">${esc(g.name)}</span>
  <span class="stats"><span>👥 ${players(g)}</span><span>⏱ ${mins(g)}</span><span>${g.age}+</span></span>
  <span class="row" style="gap:5px"><span class="tag ${lvl(g.w)<=2?"g":lvl(g.w)>=4?"c":""}">${LVL[lvl(g.w)]}</span>${r?`<span class="tag y">★ ${r.avg.toFixed(1)}</span>`:""}${extra}</span></span></a>`}
function adSlot(place,native){return ""; /* v1 sin publicidad */ track("adImp",place);
  const cfg=S.adsCfg||{}; if(cfg.disabled&&cfg.disabled.includes(place))return "";
  return `<aside class="ad ${native?"native":""}" aria-label="Espacio publicitario"><div><div class="lbl">Publicidad</div><div style="font-weight:800">Espacio disponible para anunciantes</div><div class="small muted">Tiendas, editoriales y jugueterías · ${esc(place)}</div></div><a class="btn sm orange" href="#profile" data-adclick>Anúnciate</a></aside>`}
document.addEventListener("click",e=>{if(e.target.closest("[data-adclick]"))track("adClicks")});
const meter=n=>`<span class="meter" aria-label="${n} de 5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?"on":""}"></i>`).join("")}</span>`;
const starsTxt=n=>"★★★★★".slice(0,Math.round(n))+"☆☆☆☆☆".slice(0,5-Math.round(n));

/* ───────── NAVEGACIÓN ───────── */
const NAV=[["home","INICIO","home"],["explore","EXPLORAR JUEGOS","compass"],["find","¿QUÉ JUGAMOS?","spark"],["learn","APRENDE A JUGAR","book"],["stores","TIENDAS","store"],["collection","MI COLECCIÓN","shelf"],["night","NOCHE DE JUEGOS","moon"],["profile","PERFIL","user"]];
const NAVES={home:"Inicio",explore:"Explorar",find:"¿Qué jugamos?",learn:"Aprender",stores:"Tiendas",collection:"Colección",night:"Noche de juegos",profile:"Perfil",admin:"Admin"};
let cur="home",curGame=null;
function renderNav(){
  const items=NAV.concat(S.isOwner?[["admin","ADMIN","gear"]]:[]);
  $("#topnav").innerHTML=items.map(([k,l])=>`<a href="#${k}" data-v="${k}">${l}</a>`).join("");
  const b=[["home","Inicio","home"],["explore","Explorar","compass"],["find","Elegir","spark"],["learn","Aprender","book"]];
  $("#bottomnav").innerHTML=b.map(([k,l,i])=>`<a href="#${k}" data-v="${k}">${icon(i)}<span>${l}</span></a>`).join("")+`<a href="#" id="moreBtn">${icon("board")}<span>Más</span></a>`;
  $("#sheetGrid").innerHTML=items.map(([k,l,i])=>`<a href="#${k}">${icon(i,"#1F4E8C")}${NAVES[k]}</a>`).join("");
  $("#moreBtn").onclick=e=>{e.preventDefault();$("#sheet").classList.add("open")};
  markNav();
}
function markNav(){const v=cur==="game"?"explore":cur;$$("[data-v]").forEach(a=>a.classList.toggle("on",a.dataset.v===v))}
$("#menuBtn").onclick=()=>$("#sheet").classList.add("open");
$("#sheetClose").onclick=()=>$("#sheet").classList.remove("open");
$("#sheet").addEventListener("click",e=>{if(e.target.id==="sheet"||e.target.closest("a"))$("#sheet").classList.remove("open")});
const NAVSTACK=[];
function route(){const h=(location.hash||"#home").slice(1);
  if(NAVSTACK.length>1&&NAVSTACK[NAVSTACK.length-2]===h)NAVSTACK.pop();else if(NAVSTACK[NAVSTACK.length-1]!==h)NAVSTACK.push(h);
  if(h.startsWith("game-")){cur="game";curGame=h.slice(5);track("views",curGame)}else cur=NAVES[h]?h:"home";
  $$(".view").forEach(v=>v.classList.remove("on"));$("#v-"+cur).classList.add("on");markNav();
  $("#vnav").hidden=cur==="home";$("#vtitle").textContent=cur==="game"?(BYID[curGame]?.name||""):NAVES[cur]||"";render();window.scrollTo({top:0,behavior:"instant"in window?"instant":"auto"})}
window.addEventListener("hashchange",route);
function render(){const f={home:vHome,explore:vExplore,game:vGame,find:vFind,learn:vLearn,stores:vStores,collection:vCollection,night:vNight,profile:vProfile,admin:vAdmin}[cur];
  try{f&&f()}catch(e){console.error(e);$("#v-"+cur).innerHTML=`<div class="card pad">Algo falló al mostrar esta sección.</div>`}}

/* ───────── HOME ───────── */
const POPULAR=["catan","ticket-to-ride","carcassonne","codenames","azul","dixit","uno","pandemic","7-wonders","wingspan","splendor","dobble","exploding-kittens","ajedrez","monopoly"];
function season(){const m=new Date().getMonth()+1;
  if(m>=11||m===12)return["Fiestas de fin de año","Para reunir a toda la familia y amigos",g=>(g.cats.includes("par")||g.cats.includes("fam"))&&g.maxP>=6&&g.w<2.2];
  if(m<=2)return["Vacaciones de verano","Juegos que caben en la mochila",g=>g.cats.includes("via")];
  if(m<=5)return["Otoño de estrategia","Tardes largas para pensar",g=>g.cats.includes("est")&&g.w>=2.3&&g.w<3.6];
  if(m<=8)return["Invierno en casa","Cooperativos y campañas para días de lluvia",g=>g.mode==="K"];
  return["Fiestas Patrias y primavera","Clásicos de mesa y juegos de grupo",g=>g.cats.includes("cla")||(g.cats.includes("par")&&g.w<1.6)]}
function rail(title,list,link){if(!list.length)return"";return `<div class="sec"><h2>${title}</h2>${link?`<a href="${link}">Ver todos →</a>`:""}</div><div class="rail">${list.slice(0,14).map(g=>gcard(g)).join("")}</div>`}
function vHome(){
  const pop=POPULAR.map(i=>BYID[i]).filter(Boolean);
  const rated=GAMES.map(g=>[g,ratingOf(g.id)]).filter(x=>x[1]&&x[1].n>=1).sort((a,b)=>b[1].avg-a[1].avg||b[1].n-a[1].n).map(x=>x[0]);
  const news=GAMES.filter(g=>g.year).sort((a,b)=>b.year-a.year);
  const [sT,sD,sF]=season();
  $("#v-home").innerHTML=`
  <div class="hero">
    <svg class="deco" viewBox="0 0 300 260" aria-hidden="true"><g opacity=".9"><rect x="150" y="40" width="90" height="90" rx="18" fill="#F6C445" transform="rotate(14 195 85)"/><circle cx="178" cy="68" r="8" fill="#13294B"/><circle cx="212" cy="102" r="8" fill="#13294B"/><circle cx="195" cy="85" r="8" fill="#13294B"/><path d="M80 210c4-40 14-66 30-76-12-6-14-30 6-34 20 4 18 28 6 34 16 10 26 36 30 76z" fill="#F26B5B"/><path d="M240 190l22 12v26l-22 12-22-12v-26z" fill="#0F9D74"/><rect x="40" y="60" width="54" height="76" rx="8" fill="#FBF5E9" transform="rotate(-16 67 98)"/><rect x="58" y="72" width="54" height="76" rx="8" fill="#F28C28" transform="rotate(-4 85 110)"/></g></svg>
    ${sparkles(26)}<div class="row" style="gap:14px;align-items:center"><span class="logo">${logoSvg(72)}</span><div><div class="slogan">EL ARTE DE LOS JUEGOS DE MESA</div>
    <h1 class="wm shine">BOARD GAME <span class="y">WORLD</span></h1></div></div>
    <p>Descubre juegos de mesa, aprende sus reglas sin manuales eternos, decide quién empieza y encuentra el juego perfecto para tu grupo.</p>
    <form class="searchbar" id="homeSearch"><label class="sr" for="hs">Buscar juegos</label><input id="hs" type="search" placeholder="Busca un juego, autor o categoría…"><button class="btn orange">Buscar</button></form>
    <div class="row" style="margin-top:14px;position:relative;z-index:2"><a class="btn green cta" href="#find">ENCUENTRA TU PRÓXIMO JUEGO</a></div>
  </div>
  <div style="margin-top:16px">${offerBanner("inicio")}</div>
  <div class="sec"><h2>Accesos rápidos</h2></div>
  <div class="quick">${[["Para dos","p:2","heart","#6E2433"],["Familiares","o:fam","tree","#1F5E4E"],["Rápidos","d:15-30","spark","#7A4416"],["Infantiles","c:inf","heart","#7A5A1E"],["Estrategia","c:est","crown","#1E3A5F"],["Grupos grandes","p:7-10","bubble","#3E2C5E"],["Principiantes","o:beg","pawn","#1E5A5A"]].map(([l,q,i,c])=>`<a href="#explore" data-q="${q}"><span class="i" style="background:${c}">${icon(i,"#fff",20)}</span>${l}</a>`).join("")}</div>
  <div class="today marquee" style="margin-top:22px"><div><div class="small" style="font-weight:800;letter-spacing:.12em">RECOMENDADOR</div><h2>¿QUÉ VAMOS A JUGAR HOY?</h2><div>Dinos cuántos son, sus edades y cuánto tiempo tienen${S.me.own.length?`: elegimos entre tus ${S.me.own.length} juegos`:""}.</div></div><div class="row"><a class="btn" href="#find">Empezar</a><button class="btn ghost" style="color:#fff;box-shadow:inset 0 0 0 2px #fff" id="surpriseHome">Sorpréndeme</button><button class="btn ghost" style="color:#fff;box-shadow:inset 0 0 0 2px #fff" id="whoHome">🎲 ¿Quién empieza?</button></div></div>
  ${rail("Juegos populares",pop)}
  ${adSlot("inicio")}
  ${rated.length?rail("Mejor valorados por la comunidad",rated):rail("Imprescindibles",["carcassonne","azul","codenames","pandemic","7-wonders","splendor","brass-birmingham","wingspan","ajedrez","go"].map(i=>BYID[i]).filter(Boolean))}
  ${rail("Novedades del catálogo",news)}
  ${rail(`Temporada: ${sT}`,GAMES.filter(sF))}
  ${rail("Juegos familiares",GAMES.filter(g=>g.cats.includes("fam")&&g.w<2.2),"#explore")}
  ${rail("Estrategia",GAMES.filter(g=>g.cats.includes("est")&&g.w>=2.3))}
  ${rail("Para dos personas",GAMES.filter(g=>g.minP<=2&&g.maxP===2))}
  ${rail("Rápidos (30 min o menos)",GAMES.filter(g=>g.maxT<=30))}
  ${rail("Para grupos grandes",GAMES.filter(g=>g.maxP>=7&&g.minP<=6))}
  <div class="sec"><h2>EXPLORA EL UNIVERSO DE LOS JUEGOS DE MESA</h2></div>
  <div class="cats">${["est","fam","inf","coo","car","dad","ded","ave","eco","gue","fan","sci","par","edu","sol","cla","abs","con"].map(c=>`<a href="#explore" data-q="c:${c}" style="background:${CATCOL[c]}">${icon(CATICON[c],"#fff")}${CAT[c]}<br><span class="small" style="opacity:.8">${GAMES.filter(g=>g.cats.includes(c)).length} juegos</span></a>`).join("")}</div>`;
  $("#homeSearch").onsubmit=e=>{e.preventDefault();F.q=$("#hs").value;resetFilters(true);track("searches");location.hash="explore"};
  $("#surpriseHome").onclick=surprise;$("#whoHome").onclick=()=>turnPicker();
  $$("#v-home [data-q]").forEach(a=>a.addEventListener("click",()=>applyQuick(a.dataset.q)));
}
function surprise(){const pool=S.me.own.length?S.me.own.map(i=>BYID[i]).filter(Boolean):GAMES;const g=pool[rnd(pool.length)];dialog(`<div class="discover"><div style="border-radius:16px;overflow:hidden">${art(g)}</div><h2 style="margin-top:12px">${esc(g.name)}</h2><p class="muted">${esc(g.desc||"")}</p><p class="small">👥 ${players(g)} · ⏱ ${mins(g)} · ${g.age}+ · ${LVL[lvl(g.w)]}</p><div class="row"><a class="btn green" href="#game-${g.id}" data-close>Ver ficha</a><button class="btn ghost" id="again">Otro</button></div></div>`);$("#again").onclick=surprise;$("#dlgBox [data-close]").addEventListener("click",closeDlg)}

/* ───────── EXPLORE ───────── */
const F={q:"",p:new Set(),d:new Set(),a:new Set(),c:new Set(),x:new Set(),o:new Set(),sort:"pop",show:false};
function resetFilters(keepQ){if(!keepQ)F.q="";["p","d","a","c","x","o"].forEach(k=>F[k].clear())}
function applyQuick(q){resetFilters();const [k,v]=q.split(":");F[k].add(v)}
const PB=["1","2","3","4","5","6","7-10","10+"],DB=[["<15","Menos de 15 min",0,14],["15-30","15 a 30 min",15,30],["30-45","30 a 45 min",31,45],["45-60","45 a 60 min",46,60],["60-90","60 a 90 min",61,90],["90+","Más de 90 min",91,1e4]];
const AB=[["3-5","3 a 5 años",5],["6-8","6 a 8 años",8],["9-12","9 a 12 años",12],["13-15","13 a 15 años",15],["16-17","16 a 17 años",17],["ad","Adultos",99]];
const OB=[["few","Con poco texto",g=>g.lang<=1],["ind","Independiente del idioma",g=>g.lang===0],["beg","Ideal para principiantes",g=>g.w<=1.8],["pair","Para parejas",g=>g.minP<=2&&g.maxP>=2],["fam","Para familias",g=>g.cats.includes("fam")||g.cats.includes("inf")||(g.age<=8&&g.w<=2)],["party","Para fiestas",g=>g.cats.includes("par")||(g.maxP>=7&&g.w<2)],["trip","Para viajes",g=>g.cats.includes("via")],["exp","Para jugadores experimentados",g=>g.w>=3]];
function matchP(g,b){if(b==="7-10")return g.maxP>=7&&g.minP<=10;if(b==="10+")return g.maxP>10;const n=+b;return g.minP<=n&&n<=g.maxP}
function matchD(g,b){const r=DB.find(x=>x[0]===b);return g.minT<=r[3]&&g.maxT>=r[2]}
function matchA(g,b){const r=AB.find(x=>x[0]===b);return g.age<=r[2]}
function filtered(){const q=norm(F.q).trim();
  let L=GAMES.filter(g=>{
    if(q){const hay=norm([g.name,g.designer,g.publisher,g.country,g.cats.map(c=>CAT[c]).join(" "),MODE[g.mode]].join(" "));if(!q.split(/\s+/).every(t=>hay.includes(t)))return false}
    if(F.p.size&&![...F.p].some(b=>matchP(g,b)))return false;
    if(F.d.size&&![...F.d].some(b=>matchD(g,b)))return false;
    if(F.a.size&&![...F.a].some(b=>matchA(g,b)))return false;
    if(F.c.size&&![...F.c].every(c=>g.cats.includes(c)))return false;
    if(F.x.size&&!F.x.has(String(lvl(g.w))))return false;
    if(F.o.size&&![...F.o].every(o=>OB.find(x=>x[0]===o)[2](g)))return false;
    return true});
  const pi=id=>{const i=POPULAR.indexOf(id);return i<0?999:i};
  const s={pop:(a,b)=>pi(a.id)-pi(b.id)||((A.views[b.id]||0)-(A.views[a.id]||0))||a.name.localeCompare(b.name),az:(a,b)=>a.name.localeCompare(b.name),new:(a,b)=>(b.year||0)-(a.year||0),easy:(a,b)=>a.w-b.w,hard:(a,b)=>b.w-a.w,short:(a,b)=>a.minT-b.minT,rate:(a,b)=>((ratingOf(b.id)||{avg:0}).avg-(ratingOf(a.id)||{avg:0}).avg)}[F.sort];
  return L.sort(s)}
function chipset(key,items){return `<div class="chips">${items.map(([v,l])=>`<button class="chip ${F[key].has(v)?"on":""}" data-k="${key}" data-val="${v}" aria-pressed="${F[key].has(v)}">${l}</button>`).join("")}</div>`}
function vExplore(){
  const L=filtered(), nF=["p","d","a","c","x","o"].reduce((n,k)=>n+F[k].size,0);
  $("#v-explore").innerHTML=`<div class="row" style="justify-content:space-between;margin-bottom:12px"><h2>Explora ${GAMES.length} juegos</h2></div>
  <div class="explore">
   <div><div class="row" style="margin-bottom:10px"><button class="btn sm fbtn" id="fToggle">Filtros${nF?` (${nF})`:""}</button>${nF||F.q?`<button class="btn sm ghost" id="fClear">Limpiar</button>`:""}</div>
   <aside class="filters card pad ${F.show?"":"hide-m"}" id="filters">
    <label class="f" for="eq" style="margin-top:0">Buscar</label><input id="eq" type="search" value="${esc(F.q)}" placeholder="Nombre, autor, editorial…">
    <h4>Jugadores</h4>${chipset("p",PB.map(b=>[b,b==="10+"?"Más de 10":b==="7-10"?"7 a 10":b]))}
    <h4>Duración</h4>${chipset("d",DB.map(x=>[x[0],x[1]]))}
    <h4>Edad (apto para)</h4>${chipset("a",AB.map(x=>[x[0],x[1]]))}
    <h4>Categoría</h4>${chipset("c",Object.keys(CAT).filter(c=>c!=="via").map(c=>[c,CAT[c]]))}
    <h4>Complejidad</h4>${chipset("x",[1,2,3,4,5].map(n=>[String(n),LVL[n]]))}
    <h4>Otros</h4>${chipset("o",OB.map(x=>[x[0],x[1]]))}
    <p class="small muted" style="margin-top:14px">Edad recomendada según la caja de la editorial. «Apto para» muestra juegos cuya edad mínima es igual o menor al rango elegido.</p>
   </aside></div>
   <div><div class="row" style="justify-content:space-between;margin-bottom:12px"><b>${L.length} resultado${L.length===1?"":"s"}</b>
    <label class="row small" style="gap:6px">Ordenar <select id="sort" style="width:auto">${[["pop","Populares"],["az","A–Z"],["rate","Mejor valorados"],["new","Más recientes"],["easy","Más fáciles"],["hard","Más complejos"],["short","Más cortos"]].map(([v,l])=>`<option value="${v}" ${F.sort===v?"selected":""}>${l}</option>`).join("")}</select></label></div>
    ${L.length?`<div class="grid">${L.map((g,i)=>gcard(g)+(i===7?adSlot("catálogo",true):"")).join("")}</div>`:`<div class="empty card">No hay juegos con esa combinación de filtros. Prueba quitando alguno.</div>`}
    ${L.length>8?adSlot("resultados del buscador"):""}
   </div></div>`;
  $("#eq").oninput=e=>{F.q=e.target.value;clearTimeout(vExplore.t);vExplore.t=setTimeout(()=>{track("searches");const p=e.target.selectionStart;vExplore();const i=$("#eq");i.focus();i.setSelectionRange(p,p)},300)};
  $("#sort").onchange=e=>{F.sort=e.target.value;vExplore()};
  $("#fToggle").onclick=()=>{F.show=!F.show;vExplore()};
  $("#fClear")&&($("#fClear").onclick=()=>{resetFilters();vExplore()});
  $$("#filters .chip").forEach(b=>b.onclick=()=>{const s=F[b.dataset.k];s.has(b.dataset.val)?s.delete(b.dataset.val):s.add(b.dataset.val);vExplore()});
}

/* ───────── FICHA DE JUEGO ───────── */
let gTab="quick";
function similar(g){return GAMES.filter(x=>x.id!==g.id).map(x=>[x,x.cats.filter(c=>g.cats.includes(c)&&c!=="com").length*2-Math.abs(x.w-g.w)*1.6-(x.mode===g.mode?0:1.5)-(Math.abs(x.maxP-g.maxP)>3?1:0)]).sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0])}
function turnDiagram(steps){const n=Math.min(steps.length,6),w=Math.max(n*150,300);
  return `<svg viewBox="0 0 ${w} 120" style="width:100%;max-width:${w}px" role="img" aria-label="Secuencia de un turno">${steps.slice(0,6).map((s,i)=>{const x=i*150+8,ci=s.indexOf(":"),t=(ci>3&&ci<45?s.slice(0,ci):s).replace(/\.$/,"");const words=t.split(" ");let l=[""];words.forEach(w=>{if((l[l.length-1]+" "+w).length>18)l.push(w);else l[l.length-1]=(l[l.length-1]+" "+w).trim()});
  return `<g><rect x="${x}" y="10" width="132" height="100" rx="14" fill="${["#1F4E8C","#0F9D74","#F28C28","#F26B5B","#6B4C9A","#138A8A"][i]}"/><circle cx="${x+22}" cy="30" r="12" fill="#fff"/><text x="${x+22}" y="35" text-anchor="middle" font-weight="800" font-size="14" fill="#13294B">${i+1}</text>${l.slice(0,4).map((ln,j)=>`<text x="${x+12}" y="${58+j*15}" font-size="12" font-weight="700" fill="#fff">${esc(ln.length>19?ln.slice(0,18)+"…":ln)}</text>`).join("")}${i<n-1?`<path d="M${x+134} 60l12 0" stroke="#13294B" stroke-width="3"/><path d="M${x+144} 54l6 6-6 6" fill="none" stroke="#13294B" stroke-width="3"/>`:""}</g>`}).join("")}</svg>`}
function vGame(){
  const g=BYID[curGame];const V=$("#v-game");
  if(!g){V.innerHTML=`<div class="empty card">No encontramos ese juego. <a href="#explore">Volver al catálogo</a></div>`;return}
  const R=RULES[g.id], me=S.me, r=ratingOf(g.id), myRev=S.uid&&S.reviews[S.uid]&&(S.reviews[S.uid].items||{})[g.id];
  const ref=`https://boardgamegeek.com/geeksearch.php?action=search&objecttype=boardgame&q=${encodeURIComponent(g.name.replace(/\s*\(.*\)/,""))}`;
  const inL=k=>me[k].includes(g.id);
  const tabs=R?[["quick","Aprende en 2 min"],["basic","Básica"],["full","Completa"],["ex","Ejemplo práctico"],["faq","Preguntas"]]:[["quick","Resumen"]];
  if(!tabs.find(t=>t[0]===gTab))gTab="quick";
  let body="";
  if(!R){body=`<p>${esc(g.how||"Guía en preparación.")}</p><div class="official">Explicación resumida de Board Game World. La guía completa paso a paso de este juego está en preparación; consulta el reglamento oficial de la editorial.</div>`}
  else if(gTab==="quick"){body=`<ol>${R.quick.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>`}
  else if(gTab==="basic"){body=`<h4>1. Objetivo</h4><p>${esc(R.obj)}</p><h4>Preparación</h4><ul>${R.prep.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><h4>Tu turno</h4><ol>${R.turn.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>${turnDiagram(R.turn)}<h4>Cómo se gana</h4><p>${esc(R.win)}</p>`}
  else if(gTab==="full"){body=`<h4>1. Objetivo del juego</h4><p>${esc(R.obj)}</p><h4>2. Componentes incluidos</h4><ul>${R.comp.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><h4>3. Preparación inicial</h4><ol>${R.prep.map(x=>`<li>${esc(x)}</li>`).join("")}</ol><h4>4. Distribución de jugadores</h4><p>${esc(R.dist)}</p><h4>5. Desarrollo de un turno</h4><ol>${R.turn.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>${turnDiagram(R.turn)}<h4>6. Acciones permitidas</h4><ul>${R.acc.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><h4>7. Reglas especiales</h4><ul>${R.esp.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><h4>8. Condiciones para ganar</h4><p>${esc(R.win)}</p><h4>9. Ejemplo de una partida</h4><p>${esc(R.ej)}</p><h4>10. Consejos para principiantes</h4><ul>${R.tips.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`}
  else if(gTab==="ex"){body=`<h4>Ejemplo práctico</h4><p>${esc(R.ej)}</p><h4>Secuencia de turno</h4>${turnDiagram(R.turn)}<h4>Consejos</h4><ul>${R.tips.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`}
  else if(gTab==="faq"){body=R.faq.length?R.faq.map(([q,a])=>`<h4>${esc(q)}</h4><p>${esc(a)}</p>`).join(""):"<p class='muted'>Sin preguntas frecuentes por ahora.</p>"}
  const revs=[];for(const k in S.reviews){const it=(S.reviews[k].items||{})[g.id];if(it&&it.s)revs.push(Object.assign({by:k},it))}revs.sort((a,b)=>(b.d||0)-(a.d||0));
  V.innerHTML=`  <div class="gp">
   <div><div class="cvbig">${art(g,true)}</div>${S.isOwner?`<button class="btn sm ghost" id="imgBtn" style="margin-top:8px">📷 ${S.images[g.id]?"Cambiar foto real":"Subir foto real"}</button>`:""}
    <div class="row" style="margin-top:12px">
      <button class="btn sm ${inL("own")?"green":"ghost"}" data-l="own">${inL("own")?"✓ En mi colección":"+ Mi colección"}</button>
      <button class="btn sm ${inL("want")?"orange":"ghost"}" data-l="want">${inL("want")?"✓ Lo quiero":"Lo quiero"}</button>
      <button class="btn sm ${inL("played")?"coral":"ghost"}" data-l="played">${inL("played")?"✓ Jugado":"Ya lo jugué"}</button>
      <button class="btn sm ${inL("fav")?"":"ghost"}" data-l="fav">${inL("fav")?"♥ Favorito":"♡ Favorito"}</button>
      <button class="btn sm orange" id="whoStarts">🎲 ¿Quién empieza?</button>
    </div>
    <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Ficha técnica</h3><div class="facts">
     ${[["Diseño",val(g.designer)],["Editorial",val(g.publisher)],["País",val(g.country)],["Año",esc(yearTxt(g))],["Jugadores",players(g)],["Duración",mins(g)],["Edad",g.age+"+"],["Complejidad",LVL[lvl(g.w)]+` <span class="muted small">(${g.w.toFixed(1)}/5)</span>`],["Modalidad",MODE[g.mode]],["Idioma",LANG[g.lang]],["Categorías",g.cats.filter(c=>c!=="com").map(c=>CAT[c]).join(", ")],["Aprender",learnTime(g)]].map(([b,s])=>`<div class="fact"><b>${b}</b><span>${s}</span></div>`).join("")}
    </div><p class="small muted" style="margin-bottom:0">Fuente de referencia: ficha de la editorial y <a href="${ref}" target="_blank" rel="noopener">BoardGameGeek</a>. Los datos marcados «Por verificar» se completan solo con fuente confiable.${g.extra?" Juego agregado desde el panel de administración.":""}</p></div>
   </div>
   <div>
    <div class="row"><h1 style="margin:0;font-size:clamp(1.6rem,4vw,2.4rem)">${esc(g.name)}</h1></div>
    <p class="row small" style="margin:6px 0 12px">${r?`<span class="stars">${starsTxt(r.avg)}</span> <b>${r.avg.toFixed(1)}</b> <span class="muted">(${r.n} reseña${r.n>1?"s":""})</span>`:`<span class="muted">Aún sin valoraciones</span>`}</p>
    <div class="card pad"><h3 style="margin-top:0">De qué trata</h3><p>${esc(g.desc||"")}</p>
     <p><b>Qué experiencia ofrece:</b> ${esc(MODE[g.mode].toLowerCase())}, ${esc(LVL[lvl(g.w)].toLowerCase())} de aprender, partidas de ${mins(g)}.</p>
     <p><b>Recomendado para:</b> ${esc(recFor(g))}.</p></div>
    <div class="card pad" style="margin-top:14px"><div class="row" style="justify-content:space-between"><h2>¿CÓMO SE JUEGA?</h2>${R?`<span class="tag g">Guía completa</span>`:`<span class="tag y">Resumen</span>`}</div>
     <div class="tabs" style="margin:12px 0" role="tablist">${tabs.map(([k,l])=>`<button role="tab" class="${gTab===k?"on":""}" data-t="${k}" aria-selected="${gTab===k}">${l}</button>`).join("")}</div>
     <div class="rules">${body}</div>
     <div class="official" style="margin-top:14px"><b>Reglas oficiales vs. explicación simplificada:</b> este texto es una explicación propia de Board Game World para empezar a jugar; no reproduce el manual. Ante dudas, manda el reglamento oficial de la editorial${R&&R.site?` (<a href="${R.site}" target="_blank" rel="noopener">sitio de la editorial</a>)`:""}.</div>
    </div>
    ${videoBox(g)}
    ${offerBanner("ficha de juego",g.id)}
    ${adSlot("ficha de juego")}
    <div class="card pad"><h3 style="margin-top:0">Información complementaria</h3>
     <table><tbody>
      <tr><th>Nivel de dificultad</th><td>${meter(lvl(g.w))} ${LVL[lvl(g.w)]}</td></tr>
      <tr><th>Tiempo para aprender</th><td>${learnTime(g)}</td></tr>
      ${R?`<tr><th>Interacción</th><td>${meter(R.inter)}</td></tr><tr><th>Azar</th><td>${meter(R.azar)}</td></tr><tr><th>Estrategia</th><td>${meter(R.estr)}</td></tr><tr><th>Rejugabilidad</th><td>${meter(R.rejug)}</td></tr>`:`<tr><td colspan="2" class="small muted">Interacción, azar, estrategia y rejugabilidad se publican junto con la guía completa.</td></tr>`}
      <tr><th>Expansiones</th><td>${R&&R.exp.length?R.exp.map(esc).join(" · "):'<span class="muted">Sin información cargada</span>'}</td></tr>
     </tbody></table></div>
    <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">¿DÓNDE PUEDO COMPRARLO?</h3>${buyBox(g)}</div>
    <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Reseñas de la comunidad</h3>${reviewBox(g,myRev,revs)}</div>
   </div></div>
  ${rail("Juegos similares",similar(g))}`;
  $$("#v-game [data-l]").forEach(b=>b.onclick=()=>{const k=b.dataset.l,a=S.me[k],i=a.indexOf(g.id);i<0?a.push(g.id):a.splice(i,1);save();vGame();if(i<0)toast("Guardado")});
  $$("#v-game [data-t]").forEach(b=>b.onclick=()=>{gTab=b.dataset.t;vGame();$(".rules").scrollIntoView({block:"nearest"})});
  $$("#v-game [data-buy]").forEach(a=>a.addEventListener("click",()=>track("buyClicks")));
  $("#whoStarts").onclick=()=>turnPicker(null,g.name);
  $("#imgBtn")&&($("#imgBtn").onclick=()=>imageDlg(g));
  $$("#v-game [data-vid]").forEach(b=>b.onclick=()=>videoWindow(g.id,+b.dataset.vid));
  bindReview(g,myRev);
}


/* ───────── SELECCIONADOR DE TURNO ───────── */
const TPM=[["dice","🎲 Dados"],["wheel","🎡 Ruleta"],["finger","☝️ Dedo"],["order","🔀 Orden de turnos"]];
const WCOL=["#1E3A5F","#1F5E4E","#6E2433","#8C6B3E","#3E2C5E","#7A4416","#1E5A5A","#4E3A24","#33204F","#5A3E22"];
function turnPicker(pre,gameName,mode){
  let names=(pre&&pre.length?pre:LS.get("names",[])).slice(0,12);let m=mode||"dice";
  const draw=()=>{dialog(`<div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="small" style="font-weight:800;letter-spacing:.12em;color:var(--orange)">SELECCIONADOR DE TURNO</div><h3 style="margin:4px 0">¿Quién empieza${gameName?" en "+esc(gameName):""}?</h3></div><button class="btn sm ghost" data-close aria-label="Cerrar">✕</button></div>
   ${m!=="finger"?`<label class="f" for="tpN">Jugadores (separados por coma)</label><input id="tpN" type="text" value="${esc(names.join(", "))}" placeholder="Ana, Beto, Carla">`:""}
   <div class="tabs" style="margin:12px 0">${TPM.map(([k,l])=>`<button class="${m===k?"on":""}" data-tm="${k}">${l}</button>`).join("")}</div>
   <div id="tpBody"></div>
   ${gameName&&RULES[curGame]?`<p class="small muted">Si el reglamento del juego indica quién empieza, sigue esa regla oficial.</p>`:""}`);
   $$("#dlgBox [data-close]").forEach(b=>b.addEventListener("click",closeDlg));
   $$("#dlgBox [data-tm]").forEach(b=>b.onclick=()=>{readN();m=b.dataset.tm;draw()});
   body()};
  const readN=()=>{const i=$("#tpN");if(i){names=i.value.split(",").map(s=>s.trim()).filter(Boolean).slice(0,12);LS.set("names",names)}};
  const need=()=>{readN();if(names.length<2){toast("Escribe al menos 2 jugadores");return false}return true};
  function body(){const B=$("#tpBody");
   if(m==="dice"){B.innerHTML=`<button class="btn orange" id="tpGo">Lanzar dados</button><div class="dice-zone" id="tpDz"></div><div id="tpRes" class="pl" style="font-size:1.15rem"></div>`;
     $("#tpGo").onclick=()=>{if(need())rollDice(names,"#tpDz","#tpRes")}}
   if(m==="wheel"){B.innerHTML=`<div style="position:relative;max-width:300px;margin:0 auto"><svg viewBox="-110 -118 220 228" style="width:100%"><polygon points="-10,-116 10,-116 0,-96" fill="#13294B"/><g id="tpW" style="transition:transform 3.2s cubic-bezier(.17,.67,.21,1);transform-origin:0 0"></g><circle r="14" fill="#fff" stroke="#13294B" stroke-width="3"/></svg></div><div class="row" style="justify-content:center;margin-top:6px"><button class="btn orange" id="tpGo">Girar la ruleta</button></div><div id="tpRes" class="pl" style="font-size:1.15rem;margin-top:10px"></div>`;
     let rot=0;const paint=()=>{const n=Math.max(names.length,2),L=names.length?names:["Jugador 1","Jugador 2"];const a=2*Math.PI/n;
       $("#tpW").innerHTML=L.map((nm,i)=>{const a0=i*a-Math.PI/2,a1=a0+a,r=100,x0=r*Math.cos(a0),y0=r*Math.sin(a0),x1=r*Math.cos(a1),y1=r*Math.sin(a1),am=a0+a/2;
         return `<path d="M0 0L${x0} ${y0}A${r} ${r} 0 ${a>Math.PI?1:0} 1 ${x1} ${y1}Z" fill="${WCOL[i%WCOL.length]}" stroke="#fff" stroke-width="2"/><text x="${62*Math.cos(am)}" y="${62*Math.sin(am)}" fill="#fff" font-size="${n>8?9:12}" font-weight="800" text-anchor="middle" dominant-baseline="middle" transform="rotate(${am*180/Math.PI} ${62*Math.cos(am)} ${62*Math.sin(am)})">${esc(nm.length>11?nm.slice(0,10)+"…":nm)}</text>`}).join("")};
     paint();$("#tpN").oninput=()=>{readN();paint()};
     $("#tpGo").onclick=()=>{if(!need())return;paint();const n=names.length,w=rnd(n),seg=360/n;
       const target=360-(w*seg+seg/2)+((rnd(1000)/1000)-.5)*seg*.6;rot+=360*5+((target-(rot%360))+360)%360;
       $("#tpW").style.transform=`rotate(${rot}deg)`;$("#tpRes").textContent="Girando…";
       setTimeout(()=>{$("#tpRes").innerHTML=`🎉 Empieza <b>${esc(names[w])}</b>`},3300)}}
   if(m==="order"){B.innerHTML=`<button class="btn orange" id="tpGo">Sortear orden de turnos</button><ol id="tpRes" style="font-weight:800;font-size:1.05rem;margin-top:12px"></ol><p class="small muted">El turno sigue este orden; en juegos de mesa suele ser en sentido horario a partir del primero.</p>`;
     $("#tpGo").onclick=()=>{if(!need())return;const o=names.slice();for(let i=o.length-1;i>0;i--){const j=rnd(i+1);[o[i],o[j]]=[o[j],o[i]]}
       $("#tpRes").innerHTML=o.map((x,i)=>`<li class="discover" style="animation-delay:${i*120}ms;margin:6px 0">${i===0?"👑 ":""}${esc(x)}${i===0?' <span class="tag o">empieza</span>':""}</li>`).join("")}}
   if(m==="finger"){B.innerHTML=`<p class="small" style="margin-top:0">Cada jugador apoya un dedo en el recuadro y lo mantiene. Tras 2 segundos sin cambios, se elige a uno al azar.</p><div id="tpF" style="position:relative;height:300px;border-radius:18px;background:repeating-linear-gradient(45deg,#13294B,#13294B 18px,#173260 18px,#173260 36px);touch-action:none;overflow:hidden;user-select:none;-webkit-user-select:none"><div id="tpFm" style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-weight:800;text-align:center;padding:20px;pointer-events:none">Pongan sus dedos aquí</div></div><div id="tpRes" class="pl" style="font-size:1.1rem;margin-top:10px"></div><p class="small muted">Funciona en pantallas táctiles. En computador usa Dados o Ruleta.</p>`;
     const box=$("#tpF"),P=new Map();let t=null,done=false;
     const paintF=()=>{box.querySelectorAll(".fp").forEach(e=>e.remove());let i=0;for(const [id,p] of P){const d=document.createElement("div");d.className="fp";d.style.cssText=`position:absolute;left:${p.x-38}px;top:${p.y-38}px;width:76px;height:76px;border-radius:50%;border:6px solid ${WCOL[i%WCOL.length]};background:${p.win?WCOL[i%WCOL.length]:"rgba(255,255,255,.15)"};transition:transform .2s;${p.win?"transform:scale(1.5)":""};pointer-events:none`;box.appendChild(d);i++}
       $("#tpFm").textContent=done?"":P.size?`${P.size} dedo${P.size>1?"s":""}… mantengan`:"Pongan sus dedos aquí"};
     const arm=()=>{clearTimeout(t);if(done)return;if(P.size>=2)t=setTimeout(()=>{const ids=[...P.keys()],w=ids[rnd(ids.length)];P.get(w).win=true;done=true;for(const id of ids)if(id!==w)P.delete(id);paintF();$("#tpRes").innerHTML=`🎉 ¡Empieza el dedo elegido!`;try{navigator.vibrate&&navigator.vibrate(200)}catch(e){}},2000)};
     const pos=e=>{const r=box.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
     box.addEventListener("pointerdown",e=>{if(done){done=false;P.clear();$("#tpRes").textContent=""}try{box.setPointerCapture(e.pointerId)}catch(_){}P.set(e.pointerId,pos(e));paintF();arm()});
     box.addEventListener("pointermove",e=>{if(P.has(e.pointerId)&&!done){P.set(e.pointerId,pos(e));paintF()}});
     const up=e=>{if(done)return;P.delete(e.pointerId);paintF();arm()};box.addEventListener("pointerup",up);box.addEventListener("pointercancel",up)}
  }
  draw()}

/* ───────── BANNER DE OFERTAS ───────── */
const today=()=>new Date().toISOString().slice(0,10);
const liveOffers=gid=>S.offers.filter(o=>o.active!==false&&(!o.start||o.start<=today())&&(!o.end||o.end>=today())&&(!gid||(o.games||[]).includes(gid))).sort((a,b)=>(b.featured?1:0)-(a.featured?1:0)||(b.d||0)-(a.d||0));
function offerBanner(place,gid){return ""; /* v1 sin publicidad */ const L=liveOffers(gid);
  if(!L.length){if(gid)return"";return `<aside class="offers" aria-label="Ofertas"><div class="ofs on" style="background:linear-gradient(110deg,#2A2214,#0E0F13)"><div><div class="olbl">OFERTAS · ESPACIO PUBLICITARIO</div><div class="ot">¿Tienes una tienda de juegos?</div><div class="od">Publica tus ofertas, lanzamientos y eventos aquí. Siempre identificadas como publicidad.</div></div><a class="btn sm orange" href="#profile">Publicar oferta</a></div></aside>`}
  L.slice(0,6).forEach(o=>track("adImp","oferta:"+place));
  return `<aside class="offers" aria-label="Ofertas de tiendas" data-place="${esc(place)}">${L.slice(0,6).map((o,i)=>`<div class="ofs ${i===0?"on":""}" style="background:linear-gradient(110deg,${WCOL[i%WCOL.length]},#0E0F13)"><div><div class="olbl">PUBLICIDAD · OFERTA DE ${esc((o.store||"").toUpperCase())}</div><div class="ot">${esc(o.title||"")}</div><div class="od">${esc(o.desc||"")}${o.code?` · Código <b>${esc(o.code)}</b>`:""}${o.end?` · Hasta el ${esc(o.end.split("-").reverse().join("-"))}`:""}</div><div class="small" style="opacity:.75;margin-top:4px">Condiciones, precio y stock según la tienda.</div></div>${o.url?`<a class="btn sm orange" href="${esc(o.url)}" target="_blank" rel="noopener sponsored" data-adclick>Ver oferta</a>`:""}</div>`).join("")}${L.length>1?`<div class="odots">${L.slice(0,6).map((_,i)=>`<button class="${i===0?"on":""}" data-od="${i}" aria-label="Oferta ${i+1}"></button>`).join("")}</div>`:""}</aside>`}
function showOffer(el,i){const s=$$(".ofs",el),d=$$(".odots button",el);if(!s.length)return;i=(i+s.length)%s.length;s.forEach((x,k)=>x.classList.toggle("on",k===i));d.forEach((x,k)=>x.classList.toggle("on",k===i));el.dataset.i=i}
document.addEventListener("click",e=>{const b=e.target.closest("[data-od]");if(b){const el=b.closest(".offers");showOffer(el,+b.dataset.od);el.dataset.hold=Date.now()}});
setInterval(()=>{$$(".offers").forEach(el=>{if($$(".ofs",el).length<2)return;if(el.dataset.hold&&Date.now()-el.dataset.hold<8000)return;showOffer(el,(+el.dataset.i||0)+1)})},5000);
/* ───────── VIDEOS DE INSTRUCCIONES ───────── */
function vidInfo(url){try{const u=new URL(url);const h=u.hostname.replace(/^www\.|^m\./,"");let m;
  if(h==="youtu.be")return{p:"YouTube",id:u.pathname.slice(1).split("/")[0]};
  if(h.endsWith("youtube.com")){if(u.searchParams.get("v"))return{p:"YouTube",id:u.searchParams.get("v")};if(m=u.pathname.match(/\/(shorts|embed|live)\/([\w-]{6,})/))return{p:"YouTube",id:m[2]}}
  if(h.endsWith("vimeo.com")&&(m=u.pathname.match(/\/(\d{5,})/)))return{p:"Vimeo",id:m[1]};
  return null}catch(e){return null}}
const embedUrl=v=>v.p==="YouTube"?`https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0`:`https://player.vimeo.com/video/${encodeURIComponent(v.id)}`;
const canEmbed=()=>!(window.claude&&window.claude.use); // dentro de Claude los iframes externos están bloqueados
const vids=id=>(S.videos[id]||[]).filter(x=>vidInfo(x.url));
function videoWindow(gid,i){const g=BYID[gid],x=vids(gid)[i];if(!x)return;const v=vidInfo(x.url);track("views","video:"+gid);
  dialog(`<div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="small" style="font-weight:800;letter-spacing:.12em;color:var(--coral)">VIDEO DE INSTRUCCIONES</div><h3 style="margin:4px 0">${esc(x.title||g.name)}</h3><div class="small muted">${esc(x.channel||"")}${x.channel?" · ":""}${esc(x.lang||"")}${x.official?' · <span class="tag g">Oficial de la editorial</span>':""}</div></div><button class="btn sm ghost" data-close aria-label="Cerrar">✕</button></div>
  ${canEmbed()?`<div style="position:relative;aspect-ratio:16/9;margin-top:12px;border-radius:14px;overflow:hidden;background:#000"><iframe src="${embedUrl(v)}" title="${esc(x.title||g.name)}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
  :`<a href="${esc(x.url)}" target="_blank" rel="noopener" style="display:grid;place-items:center;aspect-ratio:16/9;margin-top:12px;border-radius:14px;background:linear-gradient(135deg,#13294B,#1F4E8C);color:#fff;text-decoration:none"><span style="text-align:center"><span style="display:inline-grid;place-items:center;width:74px;height:74px;border-radius:50%;background:#F26B5B;font-size:30px">▶</span><br><b style="display:block;margin-top:10px">Ver en ${v.p}</b><span class="small" style="opacity:.8">Se abre en una ventana nueva</span></span></a>
  `}
  <div class="row" style="margin-top:12px"><a class="btn sm" href="${esc(x.url)}" target="_blank" rel="noopener">Abrir en ${v.p}</a><button class="btn sm ghost" data-close>Cerrar</button></div>`);
  $$("#dlgBox [data-close]").forEach(b=>b.addEventListener("click",closeDlg))}
function videoBox(g){const L=vids(g.id),n=encodeURIComponent,base=g.name.replace(/\s*\(.*\)/,"");
  return `<div class="card pad" style="margin-top:14px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">▶ Videos de instrucciones</h3>${L.length?`<span class="tag c">${L.length} video${L.length>1?"s":""}</span>`:""}</div>
  ${L.length?`<div style="display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin-top:12px">${L.map((x,i)=>`<button class="vcard" data-vid="${i}" style="text-align:left;border:1px solid var(--line);border-radius:14px;background:var(--paper);padding:0;overflow:hidden"><span style="display:grid;place-items:center;aspect-ratio:16/9;background:linear-gradient(135deg,${["#1F4E8C","#0F9D74","#F28C28","#6B4C9A"][i%4]},#13294B);color:#fff"><span style="display:inline-grid;place-items:center;width:50px;height:50px;border-radius:50%;background:#F26B5B;font-size:20px">▶</span></span><span style="display:block;padding:10px"><b style="display:block;line-height:1.2">${esc(x.title||"Cómo jugar "+base)}</b><span class="small muted">${esc(x.channel||vidInfo(x.url).p)}${x.lang?" · "+esc(x.lang):""}</span>${x.official?'<br><span class="tag g" style="margin-top:4px">Oficial</span>':""}</span></button>`).join("")}</div>`
  :`<p class="small muted">Aún no hay videos verificados vinculados a este juego. Mientras tanto, estas búsquedas abren resultados reales:</p>`}
  <div class="row" style="margin-top:10px"><a class="btn sm coral" href="https://www.youtube.com/results?search_query=${n("cómo jugar "+base+" juego de mesa")}" target="_blank" rel="noopener">Buscar en YouTube (español)</a><a class="btn sm ghost" href="https://www.youtube.com/results?search_query=${n("how to play "+base+" board game")}" target="_blank" rel="noopener">How to play (inglés)</a></div>
  <p class="small muted" style="margin-bottom:0">Los videos son de sus autores y se enlazan o incrustan con el reproductor oficial de la plataforma; no se descargan ni se copian.</p></div>`}
function recFor(g){const r=[];if(g.age<=6)r.push("familias con niños pequeños");else if(g.age<=8&&g.w<2)r.push("familias");
  if(g.w<=1.8)r.push("principiantes");if(g.w>=3)r.push("jugadores con experiencia");if(g.cats.includes("par"))r.push("fiestas y grupos");
  if(g.maxP===2)r.push("parejas");if(g.mode==="K")r.push("quienes prefieren colaborar");if(g.cats.includes("via"))r.push("viajes");
  if(g.cats.includes("est")&&g.w>=2.3)r.push("amantes de la estrategia");return r.length?r.join(", "):"jugadores en general"}
function buyBox(g){const n=encodeURIComponent(g.name.replace(/\s*\(.*\)/,"")+" juego de mesa");
  const ver=S.stores.filter(s=>(s.games||[]).includes(g.id));
  return `${ver.length?`<table><thead><tr><th>Tienda</th><th>Modalidad</th><th>Precio</th></tr></thead><tbody>${ver.map(s=>`<tr><td><b>${esc(s.name)}</b><br><span class="small muted">${esc(s.city||"")}</span></td><td>${esc(s.mode||"")}</td><td class="small muted">Sin integración de precios</td></tr>`).join("")}</tbody></table>`:`<p class="small muted">Aún no hay tiendas verificadas que declaren este juego. Estas búsquedas abren resultados reales en sitios externos:</p>`}
  <div class="row"><a class="btn sm" data-buy href="https://www.google.com/search?tbm=shop&q=${n}" target="_blank" rel="noopener">Buscar precios online</a><a class="btn sm ghost" data-buy href="https://www.google.com/maps/search/${encodeURIComponent("tienda de juegos de mesa")}" target="_blank" rel="noopener">Tiendas cercanas en Maps</a><a class="btn sm ghost" href="#stores">Directorio Board Game World</a></div>
  <p class="small muted">No mostramos precios ni stock como confirmados sin una integración verificable con la tienda.</p>`}
function reviewBox(g,my,revs){
  const can=S.online&&S.uid;
  const list=revs.length?revs.slice(0,20).map(rv=>`<div style="border-top:1px solid var(--line);padding:10px 0"><div class="row" style="justify-content:space-between"><span><span class="stars">${starsTxt(rv.s)}</span> <b data-name="${esc(rv.by)}">Jugador</b></span><button class="btn sm ghost" data-report="${esc(rv.by)}" title="Denunciar">Denunciar</button></div>${rv.t?`<p style="margin:6px 0 0">${esc(rv.t)}</p>`:""}</div>`).join(""):`<p class="muted small">Sé el primero en reseñar este juego.</p>`;
  return `${can?`<div class="starpick" id="sp">${[1,2,3,4,5].map(i=>`<button data-s="${i}" class="${my&&my.s>=i?"on":""}" aria-label="${i} estrellas">★</button>`).join("")}</div>
  <textarea id="rvT" rows="3" maxlength="600" placeholder="¿Cómo fue tu experiencia? (opcional)">${esc(my&&my.t||"")}</textarea>
  <div class="row" style="margin-top:8px"><button class="btn sm green" id="rvSave">${my?"Actualizar reseña":"Publicar reseña"}</button>${my?`<button class="btn sm ghost" id="rvDel">Borrar</button>`:""}<span class="small muted">Una reseña por persona y juego, con cuenta verificada.</span></div>`
  :`<p class="small muted">Las reseñas públicas no están disponibles en esta versión. Puedes guardar tu nota personal en tu colección.</p>`}${list}`}
function bindReview(g,my){let s=my?my.s:0;
  $$("#sp [data-s]").forEach(b=>b.onclick=()=>{s=+b.dataset.s;$$("#sp [data-s]").forEach(x=>x.classList.toggle("on",+x.dataset.s<=s))});
  const doc=()=>S.db.doc("reviews/"+S.uid);
  $("#rvSave")&&($("#rvSave").onclick=async()=>{if(!s)return toast("Elige de 1 a 5 estrellas");
    const items=Object.assign({},(S.reviews[S.uid]||{}).items||{});items[g.id]={s,t:$("#rvT").value.slice(0,600),d:Date.now()};
    try{await doc().set({items});toast("Reseña publicada")}catch(e){toast("No se pudo publicar (permiso de colaborador necesario)")}});
  $("#rvDel")&&($("#rvDel").onclick=async()=>{const items=Object.assign({},(S.reviews[S.uid]||{}).items||{});delete items[g.id];try{await doc().set({items});toast("Reseña borrada")}catch(e){}});
  $$("#v-game [data-report]").forEach(b=>b.onclick=()=>reportDlg(g,b.dataset.report));
  resolveNames();}
async function resolveNames(){const els=$$("[data-name]");if(!els.length||!S.user||!S.user.profiles)return;try{const ids=[...new Set(els.map(e=>e.dataset.name))];const ps=await S.user.profiles(ids);els.forEach(e=>{e.textContent=(ps[e.dataset.name]&&ps[e.dataset.name].name)||"Jugador"})}catch(e){}}
function reportDlg(g,by){dialog(`<h3>Denunciar reseña</h3><label class="f" for="rr">Motivo</label><select id="rr"><option>Lenguaje ofensivo</option><option>Spam o publicidad encubierta</option><option>Información falsa</option><option>Otro</option></select><div class="row" style="margin-top:14px"><button class="btn coral" id="rrOk">Enviar</button><button class="btn ghost" data-close>Cancelar</button></div>`);
  $("#rrOk").onclick=async()=>{if(!S.db||!S.uid){toast("Necesitas sesión para denunciar");return closeDlg()}
    try{const d=S.db.doc("reports/"+S.uid);const sn=await d.get();const items=sn.exists?(sn.data().items||[]):[];items.push({game:g.id,target:by,reason:$("#rr").value,d:Date.now()});await d.set({items:items.slice(-50)});toast("Denuncia enviada a moderación")}catch(e){toast("No se pudo enviar")}closeDlg()}}

/* ───────── FIND MY GAME ───────── */
const FM={mine:null,n:4,young:"",old:"",time:45,exp:new Set(),cx:"any",mode:"any",kids:false,level:"mix"};
const EXP=[["est","Estratégico"],["risa","Risas y party"],["coo","Colaborar"],["relax","Relajado"],["ded","Deducción"],["fam","Familiar"],["fast","Muy rápido"],["bluff","Faroleo"]];
const NUMW={un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12};
function parseNL(t){t=norm(t);const n=s=>NUMW[s]||+s;let m;
  if(m=t.match(/(?:somos|seremos|para)\s+(\d+|\w+)/)||t.match(/(\d+|\w+)\s+(?:personas|jugadores|amigos|adultos)/)){const v=n(m[1]);if(v>0)FM.n=v}
  if(m=t.match(/entre\s+(\d+)\s+y\s+(\d+)\s+anos/)){FM.young=+m[1];FM.old=+m[2]}else if(m=t.match(/(\d+)\s+anos/))FM.young=+m[1];
  if(m=t.match(/(\d+)\s*(?:min|minutos)/))FM.time=+m[1];else if(m=t.match(/(\d+|una|media)\s+horas?/))FM.time=m[1]==="media"?30:n(m[1])*60;else if(/media hora/.test(t))FM.time=30;
  if(/nin|hij|peque/.test(t))FM.kids=true;
  if(/competitiv/.test(t))FM.mode="C";if(/cooperativ|colabor|en equipo/.test(t))FM.mode="K";
  if(/facil|sencill|simple|aprender rapido|facil de aprender/.test(t))FM.cx="easy";if(/complej|dificil|pesad/.test(t))FM.cx="hard";
  if(/principiante|novato|nunca/.test(t))FM.level="beg";if(/experto|experimentad|gamer/.test(t))FM.level="exp";
  const add=k=>FM.exp.add(k);if(/estrateg/.test(t))add("est");if(/risa|divertid|entretenid|fiesta|party|reir/.test(t))add("risa");if(/relaj|tranquil/.test(t))add("relax");if(/deduc|misterio|detective/.test(t))add("ded");if(/familia/.test(t))add("fam");if(/rapid|corto/.test(t)&&!/aprender rapido/.test(t))add("fast");if(/farol|mentir|bluff/.test(t))add("bluff")}
function recommend(){
  const n=+FM.n||1,T=+FM.time||30,young=FM.young===""?null:+FM.young;
  const out=[];const mine=useMine();
  for(const g of (mine?S.me.own.map(i=>BYID[i]).filter(Boolean):GAMES)){
    if(!(g.minP<=n&&n<=g.maxP))continue;
    if(g.minT>T)continue;
    if(young!=null&&g.age>young)continue;
    if(young==null&&FM.kids&&g.age>8)continue;
    let s=50;const why=[];
    why.push(`Admite ${n} jugador${n>1?"es":""} (${players(g)})`);
    if(g.maxT<=T){s+=12;why.push(`${mins(g)} cabe en tus ${T} min`)}else{s+=2;why.push(`partidas cortas de ${g.minT} min caben en tu tiempo`)}
    if(young!=null)why.push(`edad recomendada ${g.age}+ (el menor tiene ${young})`);
    const L=lvl(g.w);
    if(FM.cx==="easy"){s+=L<=2?14:L===3?0:-25;if(L<=2)why.push("fácil de aprender")}
    if(FM.cx==="mid"){s+=L===3?14:L===2||L===4?4:-10}
    if(FM.cx==="hard"){s+=L>=4?14:L===3?4:-15;if(L>=4)why.push("profundidad estratégica")}
    if(FM.level==="beg"){s+=g.w<=2?10:g.w>2.8?-22:0}
    if(FM.level==="exp"){s+=g.w>=2.5?8:-4}
    if(FM.mode==="C"){if(g.mode==="C"||g.mode==="E"){s+=10;why.push(g.mode==="E"?"competitivo por equipos":"competitivo")}else s-=25}
    if(FM.mode==="K"){if(g.mode==="K"){s+=14;why.push("cooperativo: ganan o pierden juntos")}else s-=25}
    const hit=(k,cond,label)=>{if(FM.exp.has(k)){if(cond){s+=12;why.push(label)}else s-=4}};
    hit("est",g.cats.includes("est")||g.cats.includes("eco"),"estratégico");
    hit("risa",g.cats.includes("par"),"ideal para reírse en grupo");
    hit("coo",g.mode==="K","colaborativo");
    hit("relax",g.w<2.2&&!g.cats.includes("gue")&&g.mode!=="S","ritmo relajado");
    hit("ded",g.cats.includes("ded"),"deducción");
    hit("fam",g.cats.includes("fam")||g.cats.includes("inf"),"pensado para familias");
    hit("fast",g.maxT<=20,"se juega muy rápido");
    hit("bluff",/farol|oculto|mient/.test(norm(g.desc+" "+g.how))||g.mode==="S","faroleo e intriga");
    if((young!=null&&young<9)||FM.kids){if(g.lang===0){s+=6;why.push("sin texto que leer")}}
    const r=ratingOf(g.id);if(r)s+=Math.min(8,(r.avg-3)*3);
    if(n===g.maxP||n===g.minP)s-=2;
    out.push({g,s,why})}
  return out.sort((a,b)=>b.s-a.s)}
const useMine=()=>S.me.own.length>0&&FM.mine!==false;
function vFind(){
  const V=$("#v-find");
  const res=recommend().slice(0,9);
  V.innerHTML=`<div class="row" style="justify-content:space-between"><div><div class="small" style="font-weight:800;letter-spacing:.14em;color:var(--orange)">RECOMENDADOR</div><h1 style="margin:2px 0 12px">¿Qué vamos a jugar hoy?</h1></div></div>
  <div class="find"><div class="card pad">
   <div class="official" style="margin-bottom:12px">${S.me.own.length?`<b>¿Entre qué juegos elijo?</b><div class="chips" style="margin-top:8px"><button class="chip ${useMine()?"on":""}" data-mine="1">🎲 Los que tengo (${S.me.own.length})</button><button class="chip ${useMine()?"":"on"}" data-mine="0">Todo el catálogo</button></div>`:`<b>Aún no tienes juegos en tu colección.</b> Agrégalos con «+ Mi colección» en cada ficha o desde <a href="#collection">Mi colección</a> y aquí elegiremos solo entre los que tienes. Mientras tanto, busco en todo el catálogo.`}</div>
   <label class="f" for="nl" style="margin-top:0">Cuéntanos en una frase (opcional)</label>
   <textarea id="nl" rows="3" placeholder="Ej.: Somos cuatro personas, tenemos entre 30 y 40 años, disponemos de 45 minutos y queremos un juego entretenido, competitivo y fácil de aprender"></textarea>
   <button class="btn sm" id="nlGo" style="margin-top:8px">Interpretar</button>
   <div class="row" style="gap:12px;margin-top:6px">
    <div style="flex:1;min-width:120px"><label class="f" for="fn">¿Cuántos juegan?</label><input id="fn" type="number" min="1" max="30" value="${FM.n}"></div>
    <div style="flex:1;min-width:120px"><label class="f" for="ft">Minutos disponibles</label><input id="ft" type="number" min="5" max="600" step="5" value="${FM.time}"></div></div>
   <div class="row" style="gap:12px">
    <div style="flex:1;min-width:120px"><label class="f" for="fy">Edad del menor</label><input id="fy" type="number" min="2" max="99" value="${FM.young}" placeholder="—"></div>
    <div style="flex:1;min-width:120px"><label class="f" for="fo">Edad del mayor</label><input id="fo" type="number" min="2" max="110" value="${FM.old}" placeholder="—"></div></div>
   <label class="f">Tipo de experiencia</label><div class="chips">${EXP.map(([k,l])=>`<button class="chip ${FM.exp.has(k)?"on":""}" data-e="${k}">${l}</button>`).join("")}</div>
   <label class="f">Complejidad</label><div class="chips">${[["any","Me da igual"],["easy","Fácil"],["mid","Intermedia"],["hard","Compleja"]].map(([k,l])=>`<button class="chip ${FM.cx===k?"on":""}" data-cx="${k}">${l}</button>`).join("")}</div>
   <label class="f">Modalidad</label><div class="chips">${[["any","Cualquiera"],["C","Competitivo"],["K","Cooperativo"]].map(([k,l])=>`<button class="chip ${FM.mode===k?"on":""}" data-m="${k}">${l}</button>`).join("")}</div>
   <label class="f">Los jugadores son…</label><div class="chips">${[["beg","Principiantes"],["mix","Mezcla"],["exp","Experimentados"]].map(([k,l])=>`<button class="chip ${FM.level===k?"on":""}" data-lv="${k}">${l}</button>`).join("")}</div>
   <label class="row" style="margin-top:14px;font-weight:800"><input type="checkbox" id="fk" ${FM.kids?"checked":""} style="width:20px;height:20px"> Hay niños presentes</label>
   <div class="row" style="margin-top:16px"><button class="btn coral" id="sur">SORPRÉNDEME: ELIGE UN JUEGO AL AZAR</button></div>
   <p class="small muted">Las recomendaciones usan solo los datos reales del catálogo (jugadores, duración, edad, complejidad y categorías). No se inventan compatibilidades.</p>
  </div>
  <div>${res.length?`<p style="margin-top:0"><b>${res.length} juego${res.length>1?"s":""} ideal${res.length>1?"es":""}</b> para ${FM.n} jugador${FM.n>1?"es":""}, ${FM.time} min${FM.young!==""?`, desde ${FM.young} años`:""}.</p>`:""}
   ${useMine()?`<p class="small muted" style="margin-top:-6px">Elegidos entre los ${S.me.own.length} juegos de tu colección.</p>`:""}<div style="display:grid;gap:12px">${res.length?res.map((x,i)=>`<div class="card reco discover" style="animation-delay:${i*40}ms"><a class="cv" href="#game-${x.g.id}">${art(x.g)}</a><div><a href="#game-${x.g.id}" style="color:inherit;text-decoration:none"><b style="font-size:1.05rem">${i+1}. ${esc(x.g.name)}</b></a>
    <div class="small muted">👥 ${players(x.g)} · ⏱ ${mins(x.g)} · ${x.g.age}+ · ${LVL[lvl(x.g.w)]}</div>
    <div class="why">✔ ${x.why.slice(0,5).map(esc).join(" · ")}</div>
    <div class="row" style="margin-top:8px"><a class="btn sm green" href="#game-${x.g.id}">Ver reglas</a><a class="btn sm ghost" href="#game-${x.g.id}" data-buyjump="${x.g.id}">Dónde comprarlo</a></div></div></div>${i===2?adSlot("recomendaciones"):""}`).join(""):`<div class="empty card">${useMine()?`Ninguno de tus juegos cumple todas las condiciones. Prueba con más minutos o menos restricciones, o <button class="btn sm ghost" data-mine="0">busca en todo el catálogo</button>.`:"Ningún juego del catálogo cumple todas las condiciones. Prueba con más minutos o menos restricciones."}</div>`}</div></div></div>`;
  const upd=()=>{FM.n=+$("#fn").value||1;FM.time=+$("#ft").value||30;FM.young=$("#fy").value;FM.old=$("#fo").value;FM.kids=$("#fk").checked;track("recos");vFind()};
  ["#fn","#ft","#fy","#fo"].forEach(s=>$(s).onchange=upd);$("#fk").onchange=upd;
  $$("#v-find [data-e]").forEach(b=>b.onclick=()=>{FM.exp.has(b.dataset.e)?FM.exp.delete(b.dataset.e):FM.exp.add(b.dataset.e);upd()});
  $$("#v-find [data-mine]").forEach(b=>b.onclick=()=>{FM.mine=b.dataset.mine==="1";vFind()});
  $$("#v-find [data-cx]").forEach(b=>b.onclick=()=>{FM.cx=b.dataset.cx;upd()});
  $$("#v-find [data-m]").forEach(b=>b.onclick=()=>{FM.mode=b.dataset.m;upd()});
  $$("#v-find [data-lv]").forEach(b=>b.onclick=()=>{FM.level=b.dataset.lv;upd()});
  $("#nlGo").onclick=()=>{const t=$("#nl").value;if(!t.trim())return;FM.exp.clear();parseNL(t);track("recos");vFind();$("#nl").value=t;toast("Listo: ajusté los filtros según tu frase")};
  $("#sur").onclick=()=>{const pool=recommend();if(!pool.length)return surprise();const x=pool[rnd(Math.min(pool.length,15))];location.hash="game-"+x.g.id};
}

/* ───────── LEARN ───────── */
function vLearn(){const ids=Object.keys(RULES).filter(i=>BYID[i]);
  $("#v-learn").innerHTML=`<div class="small" style="font-weight:800;letter-spacing:.14em;color:var(--emerald)">GUÍAS DE REGLAS</div><h1 style="margin:2px 0 6px">Aprende a jugar</h1>
  <p class="muted">Elige un juego y luego tu nivel: <b>aprende en 2 minutos</b>, explicación <b>básica</b>, reglas <b>completas</b> o un <b>ejemplo práctico</b>. Las guías son explicaciones propias, no copias de manuales.</p>
  <div class="row" style="margin:12px 0"><input type="search" id="lq" placeholder="Buscar guía…" style="max-width:360px"></div>
  <div class="grid" id="lgrid">${ids.map(i=>gcard(BYID[i],`<span class="tag g">Guía completa</span>${vids(i).length?`<span class="tag c">▶ Video</span>`:""}`)).join("")}</div>
  <div class="sec"><h2>Resúmenes de todo el catálogo</h2></div><p class="small muted">Los demás juegos tienen un resumen de cómo se juega en su ficha; sus guías completas se suman progresivamente.</p>
  <div class="card pad"><table><tbody>${GAMES.filter(g=>!RULES[g.id]).slice(0,400).map(g=>`<tr><td><a href="#game-${g.id}"><b>${esc(g.name)}</b></a></td><td class="small">${esc(g.how||"")}</td></tr>`).join("")}</tbody></table></div>`;
  $("#lq").oninput=e=>{const q=norm(e.target.value);$("#lgrid").innerHTML=ids.filter(i=>norm(BYID[i].name).includes(q)).map(i=>gcard(BYID[i],`<span class="tag g">Guía completa</span>${vids(i).length?`<span class="tag c">▶ Video</span>`:""}`)).join("")};
  $$("#v-learn .gc").forEach(a=>a.addEventListener("click",()=>{gTab="quick"}))}

/* ───────── STORES ───────── */
const ST={place:LS.get("place",""),dist:"city",type:"all"};
function vStores(){
  const q=ST.place.trim(), qn=norm(q);
  const list=S.stores.filter(s=>(!qn||norm([s.city,s.comuna,s.address,s.country].join(" ")).includes(qn))&&(ST.type==="all"||(ST.type==="online"?s.online:s.physical)));
  const enc=encodeURIComponent;
  $("#v-stores").innerHTML=`<div class="small" style="font-weight:800;letter-spacing:.14em;color:var(--coral)">TIENDAS DE JUEGOS</div><h1 style="margin:2px 0 6px">Encuentra tu tienda</h1>
  <div class="card pad">
   <form id="placeF" class="row" style="margin-top:12px"><label class="sr" for="pl">Ciudad, comuna, código postal o dirección</label><input id="pl" type="search" value="${esc(q)}" placeholder="Ciudad, comuna, código postal o dirección" style="flex:1;min-width:220px"><button class="btn">Buscar</button></form>
   <label class="f">Tipo de comercio</label><div class="chips">${[["all","Todos"],["physical","Tienda física"],["online","Tienda online"]].map(([k,l])=>`<button class="chip ${ST.type===k?"on":""}" data-ty="${k}">${l}</button>`).join("")}</div>
  </div>
  ${q?`<div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Resultados reales para «${esc(q)}»</h3><p class="small muted">Se abren en mapas externos con datos de cada proveedor. Board Game World no inventa establecimientos.</p>
   <div class="row"><a class="btn" href="https://www.openstreetmap.org/search?query=${enc("tienda de juegos de mesa "+q)}" target="_blank" rel="noopener">OpenStreetMap</a><a class="btn ghost" href="https://www.google.com/maps/search/${enc("tienda de juegos de mesa "+q)}" target="_blank" rel="noopener">Google Maps</a><a class="btn ghost" href="https://www.google.com/maps/search/${enc("juguetería "+q)}" target="_blank" rel="noopener">Jugueterías</a><a class="btn ghost" href="https://www.google.com/maps/search/${enc("librería "+q)}" target="_blank" rel="noopener">Librerías</a></div></div>`:""}
  <div style="margin-top:14px">${offerBanner("tiendas")}</div>
  ${adSlot("tiendas")}
  <div class="sec"><h2>Directorio verificado</h2><button class="btn sm orange" id="reqBtn">Inscribir mi tienda</button></div>
  ${list.length?`<div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${list.map(s=>`<div class="card pad">${s.featured?`<span class="tag o">Comercio destacado · Publicidad</span>`:""}<h3 style="margin:6px 0">${esc(s.name)}</h3>
    <p class="small" style="margin:0">${esc(s.address||"")}${s.comuna?", "+esc(s.comuna):""}${s.city?", "+esc(s.city):""}</p>
    <p class="small muted">${s.physical?"Tienda física":""}${s.physical&&s.online?" · ":""}${s.online?"Compra online":""}${s.hours?" · "+esc(s.hours):""}</p>
    ${s.phone?`<p class="small">Tel.: ${esc(s.phone)}</p>`:""}
    <div class="row">${s.web?`<a class="btn sm" href="${esc(s.web)}" target="_blank" rel="noopener">Sitio web</a>`:""}${s.social?`<a class="btn sm ghost" href="${esc(s.social)}" target="_blank" rel="noopener">Redes</a>`:""}${s.address?`<a class="btn sm green" href="https://www.google.com/maps/dir/?api=1&destination=${enc([s.address,s.comuna,s.city].filter(Boolean).join(", "))}" target="_blank" rel="noopener">Cómo llegar</a>`:""}</div>
    ${(s.games||[]).length?`<p class="small muted" style="margin-bottom:0">Declara tener: ${(s.games||[]).map(i=>BYID[i]?esc(BYID[i].name):"").filter(Boolean).slice(0,8).join(", ")}</p>`:""}</div>`).join("")}</div>`
  :`<div class="empty card">${S.stores.length?"No hay tiendas verificadas en esa zona todavía.":"El directorio verificado aún no tiene tiendas. Las tiendas pueden solicitar su incorporación y el equipo las valida antes de publicarlas."}</div>`}`;
  $("#placeF").onsubmit=e=>{e.preventDefault();ST.place=$("#pl").value;LS.set("place",ST.place);vStores()};
  $$("#v-stores [data-ty]").forEach(b=>b.onclick=()=>{ST.type=b.dataset.ty;vStores()});
  $("#reqBtn").onclick=storeReq;
}
function storeReq(){dialog(`<h3>Solicitar incorporación al directorio</h3><p class="small muted">El equipo valida cada tienda antes de publicarla.</p>
 <form id="sr">${[["name","Nombre comercial*"],["address","Dirección"],["comuna","Comuna"],["city","Ciudad*"],["country","País"],["phone","Teléfono"],["web","Sitio web"],["social","Redes sociales"],["hours","Horarios"]].map(([k,l])=>`<label class="f" for="s_${k}">${l}</label><input type="text" id="s_${k}" ${l.endsWith("*")?"required":""} maxlength="160">`).join("")}
 <label class="row" style="margin-top:10px"><input type="checkbox" id="s_phys" checked style="width:18px;height:18px"> Tienda física</label><label class="row"><input type="checkbox" id="s_onl" style="width:18px;height:18px"> Venta online</label>
 <div class="row" style="margin-top:14px"><button class="btn green">Enviar solicitud</button><button type="button" class="btn ghost" data-close>Cancelar</button></div></form>`);
 $("#sr").onsubmit=async e=>{e.preventDefault();const it={};["name","address","comuna","city","country","phone","web","social","hours"].forEach(k=>it[k]=$("#s_"+k).value.trim());it.physical=$("#s_phys").checked;it.online=$("#s_onl").checked;it.d=Date.now();
  if(!S.db||!S.uid){const L=["name","address","comuna","city","country","phone","web","social","hours"].map(k=>k+": "+(it[k]||"")).join("\n");location.href="mailto:mauroalcainosa@gmail.com?subject="+encodeURIComponent("Inscripción de tienda - Board Game World")+"&body="+encodeURIComponent(L+"\nTienda física: "+(it.physical?"sí":"no")+"\nVenta online: "+(it.online?"sí":"no"));closeDlg();return}
  try{const d=S.db.doc("storeRequests/"+S.uid);const sn=await d.get();const items=sn.exists?(sn.data().items||[]):[];items.push(it);await d.set({items:items.slice(-20)});toast("Solicitud enviada. Gracias.");closeDlg()}catch(err){toast("No se pudo enviar (se requiere permiso de colaborador)")}}}

/* ───────── MY COLLECTION ───────── */
let colTab="own";
function vCollection(){const m=S.me;
  const own=m.own.map(i=>BYID[i]).filter(Boolean);
  const cc={};own.forEach(g=>g.cats.filter(c=>c!=="com"&&c!=="via").forEach(c=>cc[c]=(cc[c]||0)+1));const topC=Object.entries(cc).sort((a,b)=>b[1]-a[1])[0];
  const pc={};m.plays.forEach(p=>pc[p.game]=(pc[p.game]||0)+1);const most=Object.entries(pc).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const minsT=m.plays.reduce((s,p)=>s+(+p.minutes||0),0);const pend=m.own.filter(i=>!m.played.includes(i)&&!pc[i]);
  const lists={own:["Tengo",m.own],want:["Quiero comprar",m.want],played:["Ya jugados",m.played],fav:["Favoritos",m.fav]};
  const cur=lists[colTab]||lists.own;
  $("#v-collection").innerHTML=`<div class="small" style="font-weight:800;letter-spacing:.14em;color:var(--blue2)">MI COLECCIÓN</div><h1 style="margin:2px 0 12px">Mi colección</h1>
  <div class="kpis"><div class="kpi"><b>${own.length}</b><span>Juegos en colección</span></div><div class="kpi"><b>${topC?esc(CAT[topC[0]]):"—"}</b><span>Categoría predominante</span></div><div class="kpi"><b>${most.length?esc(BYID[most[0][0]]?.name||"—"):"—"}</b><span>Más jugado</span></div><div class="kpi"><b>${Math.floor(minsT/60)} h ${minsT%60} m</b><span>Tiempo de juego registrado</span></div><div class="kpi"><b>${pend.length}</b><span>Pendientes de probar</span></div><div class="kpi"><b>${m.want.length}</b><span>Lista de deseos</span></div></div>
  <div class="tabs" style="margin:16px 0">${Object.entries(lists).map(([k,[l,a]])=>`<button class="${colTab===k?"on":""}" data-ct="${k}">${l} (${a.length})</button>`).join("")}<button class="${colTab==="plays"?"on":""}" data-ct="plays">Partidas (${m.plays.length})</button></div>
  ${colTab==="plays"?playsView():(cur[1].length?`<div class="grid">${cur[1].map(i=>BYID[i]).filter(Boolean).map(g=>gcard(g)).join("")}</div>`:`<div class="empty card">Aún no hay juegos aquí. Agrégalos desde cualquier ficha con los botones «Mi colección», «Lo quiero» o «Ya lo jugué».</div>`)}
  <div class="row" style="margin-top:16px"><button class="btn sm" id="shareCol">Compartir colección</button><span class="small muted">${S.online&&S.uid?"Tu colección se guarda en tu cuenta (privada).":"Tu colección se guarda en este navegador."}</span></div>`;
  $$("#v-collection [data-ct]").forEach(b=>b.onclick=()=>{colTab=b.dataset.ct;vCollection()});
  $("#shareCol").onclick=()=>copy(`Mi colección en Board Game World (${own.length} juegos):\n`+own.map(g=>"• "+g.name).join("\n")+(m.want.length?`\n\nQuiero: `+m.want.map(i=>BYID[i]?.name).filter(Boolean).join(", "):""));
  if(colTab==="plays")bindPlays();}
function playsView(){const m=S.me;return `<div class="card pad"><h3 style="margin-top:0">Registrar partida</h3><form id="pf" class="row" style="align-items:flex-end">
  <div style="flex:2;min-width:200px"><label class="f" for="pg">Juego</label><select id="pg">${GAMES.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("")}</select></div>
  <div style="flex:1;min-width:130px"><label class="f" for="pd">Fecha</label><input id="pd" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
  <div style="flex:1;min-width:100px"><label class="f" for="pm">Minutos</label><input id="pm" type="number" min="1" value="45"></div>
  <div style="flex:2;min-width:200px"><label class="f" for="pp">Jugadores (separados por coma)</label><input id="pp" type="text"></div>
  <div style="flex:1;min-width:140px"><label class="f" for="pw">Ganador</label><input id="pw" type="text"></div>
  <button class="btn green">Guardar</button></form></div>
  ${m.plays.length?`<div class="card pad" style="margin-top:12px"><table><thead><tr><th>Fecha</th><th>Juego</th><th>Min</th><th>Ganador</th><th></th></tr></thead><tbody>${m.plays.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(p=>`<tr><td>${esc(p.date)}</td><td><a href="#game-${p.game}">${esc(BYID[p.game]?.name||p.game)}</a><br><span class="small muted">${esc((p.players||[]).join(", "))}</span></td><td>${p.minutes}</td><td>${esc(p.winner||"")}</td><td><button class="btn sm ghost" data-delp="${p.id}">×</button></td></tr>`).join("")}</tbody></table></div>`:""}`}
function bindPlays(){$("#pf").onsubmit=e=>{e.preventDefault();const p={id:uid(),game:$("#pg").value,date:$("#pd").value,minutes:+$("#pm").value||0,players:$("#pp").value.split(",").map(s=>s.trim()).filter(Boolean),winner:$("#pw").value.trim()};S.me.plays.push(p);if(!S.me.played.includes(p.game))S.me.played.push(p.game);save();toast("Partida registrada");vCollection()};
  $$("[data-delp]").forEach(b=>b.onclick=()=>{S.me.plays=S.me.plays.filter(p=>p.id!==b.dataset.delp);save();vCollection()})}

/* ───────── GAME NIGHT ───────── */
let nightSel=null;
function vNight(){const ns=S.me.nights;const n=ns.find(x=>x.id===nightSel);
  const rank={};ns.forEach(x=>(x.results||[]).forEach(r=>{if(r.winner)rank[r.winner]=(rank[r.winner]||0)+1}));const rk=Object.entries(rank).sort((a,b)=>b[1]-a[1]);
  $("#v-night").innerHTML=`<div class="small" style="font-weight:800;letter-spacing:.14em;color:var(--orange)">NOCHE DE JUEGOS</div><h1 style="margin:2px 0 12px">Organiza tu noche de juegos</h1>
  <div class="find"><div>
   <div class="card pad"><h3 style="margin-top:0">${n?"Editar sesión":"Nueva sesión"}</h3><form id="nf">
    <label class="f" for="nt" style="margin-top:0">Nombre</label><input id="nt" type="text" required value="${esc(n?.title||"Noche de juegos")}">
    <div class="row" style="gap:12px"><div style="flex:1"><label class="f" for="nd">Fecha</label><input id="nd" type="date" value="${esc(n?.date||new Date().toISOString().slice(0,10))}"></div><div style="flex:1"><label class="f" for="nh">Hora</label><input id="nh" type="time" value="${esc(n?.time||"20:00")}"></div></div>
    <label class="f" for="nl2">Lugar</label><input id="nl2" type="text" value="${esc(n?.place||"")}">
    <label class="f" for="np">Participantes (separados por coma)</label><input id="np" type="text" value="${esc((n?.players||[]).join(", "))}" placeholder="Ana, Beto, Carla">
    <label class="f">Juegos de la noche</label><div class="chips" id="ng">${(S.me.own.length?S.me.own:POPULAR).map(i=>BYID[i]).filter(Boolean).map(g=>`<button type="button" class="chip ${(n?.games||[]).includes(g.id)?"on":""}" data-g="${g.id}">${esc(g.name)}</button>`).join("")}</div>
    <p class="small muted">${S.me.own.length?"Se muestran los juegos de tu colección.":"Agrega juegos a tu colección para verlos aquí; mientras tanto, mostramos populares."}</p>
    <div class="row" style="margin-top:12px"><button class="btn green">${n?"Guardar cambios":"Crear sesión"}</button>${n?`<button type="button" class="btn ghost" id="newN">Nueva</button><button type="button" class="btn ghost" id="invite">Invitar por enlace</button><button type="button" class="btn coral" id="delN">Eliminar</button>`:""}</div></form></div>
   <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Ranking amistoso</h3>${rk.length?`<table><tbody>${rk.map(([p,w],i)=>`<tr><td>${["🥇","🥈","🥉"][i]||i+1}</td><td><b>${esc(p)}</b></td><td>${w} victoria${w>1?"s":""}</td></tr>`).join("")}</tbody></table>`:`<p class="small muted">Registra resultados para ver el ranking.</p>`}</div>
   <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Historial</h3>${ns.length?ns.slice().sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(x=>`<button class="chip ${x.id===nightSel?"on":""}" data-n="${x.id}" style="margin:3px">${esc(x.date)} · ${esc(x.title)}</button>`).join(""):`<p class="small muted">Sin sesiones todavía.</p>`}</div>
  </div>
  <div>
   <div class="card pad"><h3 style="margin-top:0">¿Quién empieza?</h3>
    <label class="f" for="wp" style="margin-top:0">Jugadores</label><input id="wp" type="text" value="${esc((n?.players||[]).join(", "))}" placeholder="Ana, Beto, Carla">
    <div class="row" style="margin-top:10px">${TPM.map(([k,l])=>`<button class="btn sm ${k==="dice"?"orange":"ghost"}" data-tpm="${k}">${l}</button>`).join("")}</div>
    <p class="small muted" style="margin-bottom:0">Dados, ruleta, dedo (pantalla táctil) u orden completo de turnos.</p></div>
   ${n?`<div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Resultados de «${esc(n.title)}»</h3>
    <form id="rf" class="row" style="align-items:flex-end"><div style="flex:2;min-width:180px"><label class="f" for="rg">Juego</label><select id="rg">${(n.games.length?n.games:GAMES.map(g=>g.id)).map(i=>BYID[i]).filter(Boolean).map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("")}</select></div><div style="flex:1;min-width:140px"><label class="f" for="rw">Ganador</label><select id="rw"><option value="">—</option>${n.players.map(p=>`<option>${esc(p)}</option>`).join("")}</select></div><div style="flex:1;min-width:100px"><label class="f" for="rm">Minutos</label><input id="rm" type="number" min="1" value="45"></div><button class="btn green">Agregar</button></form>
    ${(n.results||[]).length?`<table style="margin-top:10px"><tbody>${n.results.map(r=>`<tr><td>${esc(BYID[r.game]?.name||r.game)}</td><td>🏆 ${esc(r.winner||"—")}</td><td>${r.minutes} min</td></tr>`).join("")}</tbody></table>`:""}</div>`:""}
  </div></div>`;
  let sel=new Set(n?.games||[]);
  $$("#ng [data-g]").forEach(b=>b.onclick=()=>{const i=b.dataset.g;sel.has(i)?sel.delete(i):sel.add(i);b.classList.toggle("on")});
  $("#nf").onsubmit=e=>{e.preventDefault();const o=n||{id:uid(),results:[]};Object.assign(o,{title:$("#nt").value.trim()||"Noche de juegos",date:$("#nd").value,time:$("#nh").value,place:$("#nl2").value.trim(),players:$("#np").value.split(",").map(s=>s.trim()).filter(Boolean),games:[...sel]});if(!n)S.me.nights.push(o);nightSel=o.id;save();toast("Sesión guardada");vNight()};
  $$("[data-n]").forEach(b=>b.onclick=()=>{nightSel=b.dataset.n;vNight()});
  $("#newN")&&($("#newN").onclick=()=>{nightSel=null;vNight()});
  $("#delN")&&($("#delN").onclick=()=>{S.me.nights=S.me.nights.filter(x=>x.id!==nightSel);nightSel=null;save();vNight()});
  $("#invite")&&($("#invite").onclick=()=>copy(`¡Te invito a ${n.title}! 🎲\n📅 ${n.date} ${n.time||""}${n.place?`\n📍 ${n.place}`:""}\n🎮 ${n.games.map(i=>BYID[i]?.name).filter(Boolean).join(", ")||"Juegos por definir"}\nOrganizado con Board Game World — El arte de los juegos de mesa.`));
  $("#rf")&&($("#rf").onsubmit=e=>{e.preventDefault();const r={game:$("#rg").value,winner:$("#rw").value,minutes:+$("#rm").value||0};n.results.push(r);S.me.plays.push({id:uid(),game:r.game,date:n.date,minutes:r.minutes,players:n.players,winner:r.winner});if(!S.me.played.includes(r.game))S.me.played.push(r.game);save();vNight()});
  const names=()=>$("#wp").value.split(",").map(s=>s.trim()).filter(Boolean);
  $$("#v-night [data-tpm]").forEach(b=>b.onclick=()=>turnPicker(names(),null,b.dataset.tpm))}
const PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function rollDice(p,dzSel="#dz",resSel="#dres"){const dz=$(dzSel);if(!dz)return;const vals=p.map(()=>1+rnd(6));
  dz.innerHTML=p.map((n,i)=>`<div><div class="die roll" id="d${i}">${Array.from({length:9},(_,k)=>`<i style="visibility:${PIPS[vals[i]].includes(k)?"visible":"hidden"}"></i>`).join("")}</div><div class="pl" style="margin-top:6px">${esc(n)}</div></div>`).join("");
  const mx=Math.max(...vals),top=p.filter((_,i)=>vals[i]===mx);
  setTimeout(()=>{const R=$(resSel);if(!R)return;if(top.length>1){R.textContent=`Empate entre ${top.join(" y ")} — se vuelve a lanzar…`;setTimeout(()=>rollDice(top,dzSel,resSel),900)}else{R.innerHTML=`🎉 Empieza <b>${esc(top[0])}</b> (sacó ${mx})`;const i=p.indexOf(top[0]);$("#d"+i)?.classList.add("win")}},650)}

/* ───────── PROFILE ───────── */
async function vProfile(){const C=LS.get("consent",null);
  let name="";try{if(S.user){const me=await S.user.me();name=me&&me.name||""}}catch(e){}
  $("#v-profile").innerHTML=`<div class="small" style="font-weight:800;letter-spacing:.14em;color:var(--blue2)">PERFIL</div><h1 style="margin:2px 0 12px">${name?esc(name):"Tu perfil"}</h1>
  <div class="find"><div>
   <div class="card pad"><h3 style="margin-top:0">Cuenta</h3>${S.online?`<p>Sesión activa mediante Claude${S.uid?"":" (sin identificador de usuario)"}. ${S.isOwner?"<span class='tag o'>Administrador</span>":""}</p><p class="small muted">Registro e inicio de sesión: en esta versión se usa tu cuenta de Claude. En la versión desplegada se activa Supabase Auth (correo, Google o Apple).</p>`:`<p>Estás usando la app sin sesión: tu colección se guarda solo en este navegador.</p>`}
    ${S.isOwner?`<a class="btn" href="#admin">Abrir panel administrativo</a>`:""}</div>
   <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Privacidad y consentimiento</h3>
    <label class="row" style="font-weight:700"><input type="checkbox" id="cMinor" ${C&&C.minor?"checked":""} style="width:20px;height:20px"> Soy menor de 18 años</label>
    <p class="small muted">Sin cuentas, sin anuncios y sin ubicación: tus datos se guardan solo en este dispositivo.</p>
    <div class="row"><a class="btn sm ghost" id="pol" href="privacidad.html" target="_blank" rel="noopener">Política de privacidad</a><button class="btn sm ghost" id="exp">Exportar mis datos</button><button class="btn sm coral" id="wipe">Borrar mis datos locales</button></div></div>
  </div><div>
   <div class="card pad"><h3 style="margin-top:0">Resumen</h3><p>${S.me.own.length} juegos en colección · ${S.me.want.length} deseados · ${S.me.plays.length} partidas · ${S.me.nights.length} noches de juego.</p></div>
  </div></div>`;
  const setC=o=>{const c=Object.assign({ads:"contextual",minor:false,d:Date.now()},LS.get("consent",{}),o);if(c.minor)c.ads="contextual";LS.set("consent",c);vProfile()};
  $("#cMinor").onchange=e=>setC({minor:e.target.checked});
  $("#exp").onclick=()=>copy(JSON.stringify(S.me,null,2));
  $("#wipe").onclick=()=>{dialog(`<h3>¿Borrar datos de este navegador?</h3><p>Se borrarán colección, partidas y preferencias guardadas localmente.${S.uid?" Tu copia en la cuenta no se toca.":""}</p><div class="row"><button class="btn coral" id="wok">Borrar</button><button class="btn ghost" data-close>Cancelar</button></div>`);$("#wok").onclick=()=>{["state","analytics","consent","place"].forEach(k=>{try{localStorage.removeItem("bgw:"+k)}catch(e){}});S.me=blank();closeDlg();toast("Datos locales borrados");vProfile()}};
}
function policy(){window.open("privacidad.html","_blank","noopener")}
function consentBanner(){if(LS.get("consent",null))return;const c=$("#consent");c.innerHTML=`<b>Tu privacidad</b><p class="small" style="margin:6px 0 10px">Tu colección y tus partidas se guardan solo en este dispositivo. Sin cuentas, sin anuncios y sin ubicación. <a href="privacidad.html" target="_blank" rel="noopener">Política de privacidad</a></p><div class="row"><button class="btn sm green" id="cOk">Entendido</button></div>`;c.classList.add("on");
  $("#cOk").onclick=()=>{LS.set("consent",{minor:false,d:Date.now()});c.classList.remove("on")}}

/* ───────── ADMIN ───────── */
let admTab="dash";
function vAdmin(){const V=$("#v-admin");
  if(!S.isOwner){V.innerHTML=`<div class="empty card">Panel reservado al administrador.</div>`;return}
  const topViews=Object.entries(A.views).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const adImp=Object.values(A.adImp).reduce((a,b)=>a+b,0);
  const nRev=Object.values(S.reviews).reduce((n,d)=>n+Object.keys(d.items||{}).length,0);
  V.innerHTML=`<div class="small" style="font-weight:800;letter-spacing:.14em;color:var(--coral)">ADMINISTRACIÓN</div><h1 style="margin:2px 0 12px">Panel administrativo</h1>
  <div class="tabs" style="margin-bottom:14px">${[["dash","Indicadores"],["games","Juegos"],["stores","Tiendas"],["mod","Moderación"],["images","Imágenes"],["videos","Videos"],["offers","Ofertas"],["ads","Publicidad"],["deploy","Producción"]].map(([k,l])=>`<button class="${admTab===k?"on":""}" data-at="${k}">${l}</button>`).join("")}</div>
  <div id="admBody"></div>`;
  const B=$("#admBody");
  if(admTab==="dash"){B.innerHTML=`<div class="kpis">${[[GAMES.length,"Juegos publicados"],[Object.keys(RULES).length,"Guías completas"],[S.stores.length,"Tiendas verificadas"],[S.reqs.length,"Solicitudes de tiendas"],[Object.keys(S.reviews).length,"Usuarios con reseñas"],[nRev,"Reseñas"],[S.reports.length,"Denuncias"],[A.sessions,"Sesiones (este dispositivo)"],[A.searches,"Búsquedas (este dispositivo)"],[A.recos,"Recomendaciones (este dispositivo)"],[A.buyClicks,"Clics en compra (este dispositivo)"],[adImp,"Impresiones publicitarias (este dispositivo)"],[A.adClicks,"Clics en anuncios (este dispositivo)"],[adImp?((A.adClicks/adImp)*100).toFixed(2)+"%":"—","CTR"],["$0","Ingresos estimados (sin red activa)"]].map(([b,s])=>`<div class="kpi"><b>${b}</b><span>${s}</span></div>`).join("")}</div>
   <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Juegos más consultados (este dispositivo)</h3>${topViews.length?`<table><tbody>${topViews.map(([i,n])=>`<tr><td>${esc(BYID[i]?.name||i)}</td><td>${n}</td></tr>`).join("")}</tbody></table>`:`<p class="small muted">Sin datos.</p>`}
   <p class="small muted">Usuarios activos, nuevos, sesiones globales y rendimiento por país y formato requieren el backend de analítica (Supabase + eventos). Aquí se muestran datos reales de la base compartida y métricas locales de este dispositivo, sin estimaciones inventadas.</p></div>`}
  if(admTab==="games"){B.innerHTML=`<div class="card pad"><h3 style="margin-top:0">Agregar juego al catálogo</h3><p class="small muted">Completa solo con datos de fuente confiable (editorial o BoardGameGeek). Deja vacío lo que no puedas verificar.</p>
   <form id="ag" class="row" style="align-items:flex-end">${[["id","ID (slug)*","text"],["name","Nombre*","text"],["designer","Diseño","text"],["publisher","Editorial","text"],["country","País","text"],["year","Año","number"],["minP","Mín. jugadores*","number"],["maxP","Máx. jugadores*","number"],["minT","Mín. minutos*","number"],["maxT","Máx. minutos*","number"],["age","Edad*","number"],["w","Peso 1–5*","number"]].map(([k,l,t])=>`<div style="flex:1;min-width:150px"><label class="f" for="a_${k}">${l}</label><input id="a_${k}" type="${t}" ${t==="number"?'step="any"':""} ${l.endsWith("*")?"required":""}></div>`).join("")}
   <div style="flex:1;min-width:150px"><label class="f" for="a_mode">Modo</label><select id="a_mode">${Object.entries(MODE).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></div>
   <div style="flex:1;min-width:150px"><label class="f" for="a_lang">Idioma</label><select id="a_lang">${LANG.map((v,i)=>`<option value="${i}">${v}</option>`).join("")}</select></div>
   <div style="flex:1 1 100%"><label class="f" for="a_cats">Categorías (códigos separados por espacio: ${Object.keys(CAT).join(" ")})</label><input id="a_cats" type="text"></div>
   <div style="flex:1 1 100%"><label class="f" for="a_desc">Descripción</label><textarea id="a_desc" rows="2"></textarea></div>
   <div style="flex:1 1 100%"><label class="f" for="a_how">Cómo se juega (resumen propio)</label><textarea id="a_how" rows="2"></textarea></div>
   <button class="btn green">Publicar juego</button></form></div>
   <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Juegos agregados desde el panel (${S.extra.length})</h3>${S.extra.length?`<table><tbody>${S.extra.map(x=>`<tr><td>${esc(x.row[1])}</td><td><button class="btn sm ghost" data-dg="${esc(x.row[0])}">Eliminar</button></td></tr>`).join("")}</tbody></table>`:`<p class="small muted">Ninguno.</p>`}</div>`;
   $("#ag").onsubmit=async e=>{e.preventDefault();const v=k=>$("#a_"+k).value.trim();const id=norm(v("id")).replace(/[^a-z0-9-]+/g,"-").replace(/^-|-$/g,"");if(BYID[id])return toast("Ese ID ya existe");
    const num=k=>v(k)===""?null:+v(k);const row=[id,v("name"),v("designer")||null,v("publisher")||null,v("country")||null,num("year"),num("minP"),num("maxP"),num("minT"),num("maxT"),num("age"),num("w"),v("mode"),+v("lang"),v("cats").split(/\s+/).filter(c=>CAT[c]).join(" ")||"fam",v("desc"),v("how")];
    try{await S.db.doc("gamesExtra/"+id).set({row,d:Date.now()});toast("Juego publicado");}catch(err){toast("No se pudo publicar")}};
   $$("[data-dg]").forEach(b=>b.onclick=async()=>{try{await S.db.doc("gamesExtra/"+b.dataset.dg).delete();toast("Eliminado")}catch(e){}})}
  if(admTab==="stores"){B.innerHTML=`<div class="card pad"><h3 style="margin-top:0">Solicitudes pendientes (${S.reqs.length})</h3>${S.reqs.length?`<table><thead><tr><th>Tienda</th><th>Ubicación</th><th>Contacto</th><th></th></tr></thead><tbody>${S.reqs.map((r,i)=>`<tr><td><b>${esc(r.name)}</b><br><span class="small muted">${r.physical?"Física ":""}${r.online?"Online":""}</span></td><td class="small">${esc([r.address,r.comuna,r.city,r.country].filter(Boolean).join(", "))}</td><td class="small">${esc(r.phone||"")}<br>${esc(r.web||"")}</td><td><button class="btn sm green" data-ok="${i}">Validar y publicar</button></td></tr>`).join("")}</tbody></table>`:`<p class="small muted">Sin solicitudes.</p>`}</div>
   <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Tiendas verificadas (${S.stores.length})</h3>${S.stores.length?`<table><tbody>${S.stores.map(s=>`<tr><td><b>${esc(s.name)}</b><br><span class="small muted">${esc(s.city||"")}</span></td><td><label class="small"><input type="checkbox" data-feat="${esc(s.id)}" ${s.featured?"checked":""}> Destacada (pagada)</label></td><td><button class="btn sm ghost" data-games="${esc(s.id)}">Juegos</button> <button class="btn sm coral" data-ds="${esc(s.id)}">Quitar</button></td></tr>`).join("")}</tbody></table>`:`<p class="small muted">Ninguna todavía.</p>`}</div>`;
   $$("[data-ok]").forEach(b=>b.onclick=async()=>{const r=S.reqs[+b.dataset.ok];const id=norm(r.name+"-"+(r.city||"")).replace(/[^a-z0-9-]+/g,"-").slice(0,80)||uid();const o=Object.assign({},r);delete o.by;o.verified=Date.now();o.games=[];try{await S.db.doc("storesVerified/"+id).set(o);toast("Tienda publicada en el directorio")}catch(e){toast("Error al publicar")}});
   $$("[data-ds]").forEach(b=>b.onclick=async()=>{try{await S.db.doc("storesVerified/"+b.dataset.ds).delete()}catch(e){}});
   $$("[data-feat]").forEach(b=>b.onchange=async()=>{try{await S.db.doc("storesVerified/"+b.dataset.feat).update({featured:b.checked})}catch(e){}});
   $$("[data-games]").forEach(b=>b.onclick=()=>{const s=S.stores.find(x=>x.id===b.dataset.games);dialog(`<h3>Juegos que declara ${esc(s.name)}</h3><p class="small muted">IDs separados por coma. Sin precios ni stock: solo lo que la tienda confirma.</p><textarea id="sg" rows="4">${esc((s.games||[]).join(", "))}</textarea><div class="row" style="margin-top:10px"><button class="btn green" id="sgok">Guardar</button><button class="btn ghost" data-close>Cancelar</button></div>`);$("#sgok").onclick=async()=>{const games=$("#sg").value.split(",").map(x=>x.trim()).filter(x=>BYID[x]);try{await S.db.doc("storesVerified/"+s.id).update({games});toast("Guardado")}catch(e){}closeDlg()}})}
  if(admTab==="mod"){const rows=[];for(const k in S.reviews)for(const gid in (S.reviews[k].items||{}))rows.push({by:k,gid,...S.reviews[k].items[gid]});rows.sort((a,b)=>(b.d||0)-(a.d||0));
   const reported=new Set(S.reports.map(r=>r.target+"|"+r.game));
   B.innerHTML=`<div class="card pad"><h3 style="margin-top:0">Denuncias (${S.reports.length})</h3>${S.reports.length?`<table><tbody>${S.reports.map(r=>`<tr><td>${esc(BYID[r.game]?.name||r.game)}</td><td>${esc(r.reason)}</td><td class="small muted">${new Date(r.d).toLocaleString("es-CL")}</td></tr>`).join("")}</tbody></table>`:`<p class="small muted">Sin denuncias.</p>`}</div>
   <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Reseñas (${rows.length})</h3>${rows.length?`<table><tbody>${rows.slice(0,200).map(r=>`<tr ${reported.has(r.by+"|"+r.gid)?'style="background:#FDE5E2"':""}><td>${esc(BYID[r.gid]?.name||r.gid)}<br><span class="stars">${starsTxt(r.s)}</span></td><td class="small">${esc(r.t||"")}</td><td><button class="btn sm coral" data-dr="${esc(r.by)}|${esc(r.gid)}">Eliminar</button></td></tr>`).join("")}</tbody></table>`:`<p class="small muted">Sin reseñas.</p>`}</div>`;
   $$("[data-dr]").forEach(b=>b.onclick=async()=>{const [by,gid]=b.dataset.dr.split("|");const items=Object.assign({},(S.reviews[by]||{}).items||{});delete items[gid];try{await S.db.doc("reviews/"+by).set({items});toast("Reseña eliminada")}catch(e){toast("No se pudo eliminar")}})}
  if(admTab==="ads"){const c=S.adsCfg||{},dis=new Set(c.disabled||[]);const places=["inicio","catálogo","resultados del buscador","recomendaciones","ficha de juego","tiendas"];
   B.innerHTML=`<div class="card pad"><h3 style="margin-top:0">Espacios publicitarios</h3>${places.map(p=>`<label class="row" style="margin:6px 0"><input type="checkbox" data-slot="${p}" ${dis.has(p)?"":"checked"} style="width:18px;height:18px"> ${p} <span class="small muted">· ${A.adImp[p]||0} impresiones locales</span></label>`).join("")}
    <label class="f" for="adsC">Google AdSense — ID de cliente (ca-pub-…)</label><input id="adsC" type="text" value="${esc(c.adsense||"")}" placeholder="ca-pub-0000000000000000">
    <p class="small muted">Se guarda para la versión desplegada. Dentro de Claude no se pueden cargar scripts de AdSense; por eso los espacios muestran «Espacio disponible». AdMob se configura en la futura app nativa.</p>
    <button class="btn green" id="adsSave">Guardar configuración</button></div>`;
   $("#adsSave").onclick=async()=>{const disabled=$$("[data-slot]").filter(x=>!x.checked).map(x=>x.dataset.slot);try{await S.db.doc("config/ads").set({disabled,adsense:$("#adsC").value.trim(),d:Date.now()});toast("Configuración guardada")}catch(e){toast("No se pudo guardar")}}}
  if(admTab==="images"){const withI=GAMES.filter(g=>S.images[g.id]),sinI=GAMES.filter(g=>!S.images[g.id]);
   B.innerHTML=`<div class="card pad"><h3 style="margin-top:0">Fotos reales de juegos (${withI.length} de ${GAMES.length})</h3>
   <p class="small muted">Las fotos reemplazan la portada ilustrada en todo el catálogo. Usa solo imágenes propias, de kits de prensa con permiso o con licencia, y registra el crédito. ${S.assets?"":"<b>La subida no está disponible en esta vista.</b>"}</p>
   <label class="f" for="imPick">Elegir juego para subir foto</label><div class="row"><select id="imPick" style="flex:1;min-width:200px">${sinI.concat(withI).map(g=>`<option value="${g.id}">${S.images[g.id]?"✓ ":""}${esc(g.name)}</option>`).join("")}</select><button class="btn green" id="imOpen">Subir o cambiar</button></div></div>
   <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Con foto</h3>${withI.length?`<div class="grid">${withI.map(g=>`<div><div style="border-radius:12px;overflow:hidden">${art(g)}</div><div class="small"><b>${esc(g.name)}</b><br><span class="muted">${esc(S.images[g.id].credit||"Sin crédito")} · ${esc((LICS.find(l=>l[0]===S.images[g.id].license)||["",""])[1])}</span></div></div>`).join("")}</div>`:`<p class="small muted">Ninguna todavía.</p>`}</div>`;
   $("#imOpen").onclick=()=>imageDlg(BYID[$("#imPick").value])}
  if(admTab==="videos"){const withV=Object.keys(S.videos).filter(k=>vids(k).length&&BYID[k]);
   B.innerHTML=`<div class="card pad"><h3 style="margin-top:0">Vincular video de instrucciones</h3><p class="small muted">Pega el enlace de YouTube o Vimeo. Prioriza videos oficiales de la editorial o de canales reconocidos, y revisa que el video corresponda a la edición del juego.</p>
   <form id="vf" class="row" style="align-items:flex-end">
    <div style="flex:2;min-width:220px"><label class="f" for="vg">Juego</label><select id="vg">${GAMES.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("")}</select></div>
    <div style="flex:3;min-width:240px"><label class="f" for="vu">Enlace del video*</label><input id="vu" type="text" required placeholder="https://www.youtube.com/watch?v=…"></div>
    <div style="flex:2;min-width:200px"><label class="f" for="vt">Título</label><input id="vt" type="text" maxlength="140"></div>
    <div style="flex:1;min-width:160px"><label class="f" for="vc">Canal o autor</label><input id="vc" type="text" maxlength="80"></div>
    <div style="flex:1;min-width:130px"><label class="f" for="vl">Idioma</label><select id="vl"><option>Español</option><option>Inglés</option><option>Portugués</option><option>Otro</option></select></div>
    <label class="row" style="min-width:160px"><input type="checkbox" id="vo" style="width:18px;height:18px"> Oficial de la editorial</label>
    <button class="btn green">Vincular</button></form><p id="vmsg" class="small"></p></div>
   <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Videos vinculados (${withV.reduce((n,k)=>n+vids(k).length,0)})</h3>${withV.length?`<table><tbody>${withV.flatMap(k=>vids(k).map((x,i)=>`<tr><td><b>${esc(BYID[k].name)}</b><br><span class="small muted">${esc(x.title||"")} · ${esc(x.channel||"")} · ${esc(x.lang||"")}${x.official?" · oficial":""}</span></td><td class="small"><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(vidInfo(x.url).p)}</a></td><td><button class="btn sm coral" data-dv="${k}|${i}">Quitar</button></td></tr>`)).join("")}</tbody></table>`:`<p class="small muted">Ninguno todavía.</p>`}</div>`;
   $("#vu").oninput=e=>{const v=vidInfo(e.target.value.trim());$("#vmsg").textContent=e.target.value.trim()?(v?`✓ Enlace de ${v.p} válido`:"Solo se aceptan enlaces de YouTube o Vimeo"):""};
   $("#vf").onsubmit=async e=>{e.preventDefault();const url=$("#vu").value.trim();if(!vidInfo(url))return toast("Enlace no válido");const gid=$("#vg").value;
    const items=(S.videos[gid]||[]).slice();if(items.some(x=>x.url===url))return toast("Ese video ya está vinculado");
    items.push({url,title:$("#vt").value.trim(),channel:$("#vc").value.trim(),lang:$("#vl").value,official:$("#vo").checked,d:Date.now()});
    try{await S.db.doc("videos/"+gid).set({items});toast("Video vinculado a "+BYID[gid].name)}catch(err){toast("No se pudo guardar")}};
   $$("[data-dv]").forEach(b=>b.onclick=async()=>{const [k,i]=b.dataset.dv.split("|");const all=(S.videos[k]||[]).filter(x=>vidInfo(x.url));all.splice(+i,1);try{await S.db.doc("videos/"+k).set({items:all});toast("Video quitado")}catch(e){}})}
  if(admTab==="offers"){const L=S.offers.slice().sort((a,b)=>(b.d||0)-(a.d||0));
   B.innerHTML=`<div class="card pad"><h3 style="margin-top:0">Publicar oferta en el banner</h3><p class="small muted">Solo ofertas informadas por la tienda o editorial. Se muestran siempre con la etiqueta «Publicidad».</p>
   <form id="of" class="row" style="align-items:flex-end">
    <div style="flex:1;min-width:180px"><label class="f" for="o_store">Tienda o anunciante*</label><input id="o_store" type="text" required maxlength="60" list="o_sl"><datalist id="o_sl">${S.stores.map(s=>`<option value="${esc(s.name)}">`).join("")}</datalist></div>
    <div style="flex:2;min-width:220px"><label class="f" for="o_title">Título de la oferta*</label><input id="o_title" type="text" required maxlength="80" placeholder="20% en juegos familiares"></div>
    <div style="flex:1 1 100%"><label class="f" for="o_desc">Detalle</label><input id="o_desc" type="text" maxlength="160"></div>
    <div style="flex:2;min-width:220px"><label class="f" for="o_url">Enlace a la oferta</label><input id="o_url" type="text" placeholder="https://"></div>
    <div style="flex:1;min-width:130px"><label class="f" for="o_code">Código</label><input id="o_code" type="text" maxlength="30"></div>
    <div style="flex:1;min-width:140px"><label class="f" for="o_start">Desde</label><input id="o_start" type="date" value="${today()}"></div>
    <div style="flex:1;min-width:140px"><label class="f" for="o_end">Hasta</label><input id="o_end" type="date"></div>
    <div style="flex:1 1 100%"><label class="f" for="o_games">Juegos asociados (IDs separados por coma, opcional; aparece también en sus fichas)</label><input id="o_games" type="text" placeholder="catan, azul"></div>
    <label class="row"><input type="checkbox" id="o_feat" style="width:18px;height:18px"> Destacada (primera en el banner)</label>
    <button class="btn green">Publicar oferta</button></form></div>
   <div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Ofertas (${L.length})</h3>${L.length?`<table><thead><tr><th>Oferta</th><th>Vigencia</th><th>Estado</th><th></th></tr></thead><tbody>${L.map(o=>{const live=liveOffers().some(x=>x.id===o.id);return `<tr><td><b>${esc(o.title)}</b><br><span class="small muted">${esc(o.store)}${(o.games||[]).length?" · "+o.games.map(i=>BYID[i]?.name||i).join(", "):""}</span></td><td class="small">${esc(o.start||"—")} → ${esc(o.end||"sin término")}</td><td>${live?'<span class="tag g">Visible</span>':'<span class="tag">Oculta</span>'}</td><td><button class="btn sm ghost" data-otog="${esc(o.id)}">${o.active===false?"Activar":"Pausar"}</button> <button class="btn sm coral" data-odel="${esc(o.id)}">Borrar</button></td></tr>`}).join("")}</tbody></table>`:`<p class="small muted">Sin ofertas. Mientras no haya, el banner invita a las tiendas a publicar.</p>`}
   <p class="small muted">Impresiones locales del banner: ${Object.entries(A.adImp).filter(([k])=>k.startsWith("oferta:")).reduce((n,[,v])=>n+v,0)}.</p></div>`;
   $("#of").onsubmit=async e=>{e.preventDefault();const v=k=>$("#o_"+k).value.trim();const url=v("url");if(url&&!/^https?:\/\//i.test(url))return toast("El enlace debe empezar con https://");
    if(v("end")&&v("start")&&v("end")<v("start"))return toast("La fecha de término es anterior al inicio");
    const o={store:v("store"),title:v("title"),desc:v("desc"),url,code:v("code"),start:v("start"),end:v("end"),games:v("games").split(",").map(x=>x.trim()).filter(x=>BYID[x]),featured:$("#o_feat").checked,active:true,d:Date.now()};
    try{await S.db.collection("offers").add(o);toast("Oferta publicada")}catch(err){toast("No se pudo publicar")}};
   $$("[data-otog]").forEach(b=>b.onclick=async()=>{const o=S.offers.find(x=>x.id===b.dataset.otog);try{await S.db.doc("offers/"+o.id).update({active:o.active===false})}catch(e){}});
   $$("[data-odel]").forEach(b=>b.onclick=async()=>{try{await S.db.doc("offers/"+b.dataset.odel).delete();toast("Oferta borrada")}catch(e){}})}
  if(admTab==="deploy"){B.innerHTML=`<div class="card pad rules"><h3 style="margin-top:0">Paso a producción (Etapa 1 completa)</h3><ol>
   <li><b>Supabase:</b> crear proyecto, tablas (juegos, autores, editoriales, categorías, mecánicas, reglas, tiendas, direcciones, productos/disponibilidad, colecciones, favoritos, reseñas, partidas, participantes, publicidad, estadísticas) con Row Level Security y roles admin/usuario.</li>
   <li><b>Auth:</b> Supabase Auth (correo + Google/Apple), verificación de correo y rate-limit para frenar cuentas automatizadas en reseñas.</li>
   <li><b>Frontend:</b> Next.js + TypeScript + Tailwind, reutilizando este diseño; desplegar en Vercel.</li>
   <li><b>Mapa:</b> Leaflet + teselas de OpenStreetMap (gratis, con atribución) y geocodificación Nominatim con caché propia; o Mapbox/Google si el volumen lo justifica.</li>
   <li><b>Publicidad:</b> alta en Google AdSense con dominio propio y política de privacidad; gestor de consentimiento certificado (CMP); anuncios no personalizados para menores.</li>
   <li><b>IA (Etapa 2):</b> asistente de reglas limitado a la base de datos y fuentes documentadas.</li>
   <li><b>Migración:</b> importar <code>data/games.js</code>, <code>data/rules.js</code> y las colecciones de esta base compartida.</li></ol></div>`}
  $$("[data-at]").forEach(b=>b.onclick=()=>{admTab=b.dataset.at;vAdmin()});
}

/* ───────── FOOTER + INIT ───────── */
$("#foot").innerHTML=`<div class="row" style="justify-content:space-between"><div><b>BOARD GAME WORLD</b> · El arte de los juegos de mesa<br>Catálogo de ${GAMES.length} juegos. Portadas ilustradas por Board Game World; no se usan imágenes comerciales protegidas.</div><div><a href="privacidad.html" id="polF" target="_blank" rel="noopener">Política de privacidad</a> · <a href="#stores">Inscribe tu tienda</a></div></div><p>Las explicaciones de reglas son simplificaciones propias; no reemplazan el reglamento oficial. Marcas y nombres de juegos pertenecen a sus respectivos dueños.</p>`;
$("#vlogo").innerHTML=LOGO;
$("#backBtn").onclick=()=>{closeDlg();if(NAVSTACK.length>1)history.back();else location.hash="home"};
renderNav();route();consentBanner();
setTimeout(initCloud,0);
})();
