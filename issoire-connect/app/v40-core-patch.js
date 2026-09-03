(()=>{
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;
const RADII=[1,5,10,20,50];
const V={items:[],last:null};
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const logged=()=>!!S.session;
const pro360=()=>typeof window.icHasPro360==='function'?window.icHasPro360():S.profile?.role==='admin'||['pro','proplus'].includes(S.subscription?.plan||'');
function radiusOptions(value=20,zero=false){const vals=zero?[0,...RADII]:RADII;return vals.map(x=>`<option value="${x}" ${Number(value)===x?'selected':''}>${x===0?'Toutes distances':x+' km'}</option>`).join('')}
function normalizeSelect(id,value){const el=document.getElementById(id);if(!el)return;const current=Number(value??el.value??10);const best=RADII.includes(current)?current:(current<=1?1:current<=5?5:current<=10?10:current<=20?20:50);el.innerHTML=radiusOptions(best);el.value=String(best)}
function currentBusiness(){return (S.myBusinesses||[])[0]||null}

window.openIcProspectRadarV40=async function(){
 if(!logged()){if(typeof authModal==='function')return authModal('account');return say('Connectez-vous pour utiliser le Radar Prospects.');}
 if(!pro360()){if(typeof openIcPlans==='function')return openIcPlans();return say('Le Radar Prospects nécessite Pro 360.');}
 let pref=null;try{const {data}=await sb.from('ic_prospect_preferences').select('*').eq('user_id',S.session.user.id).maybeSingle();pref=data}catch{}
 const b=currentBusiness(),p=S.profile||{};
 const profession=pref?.profession||b?.category||'';
 const city=pref?.city||p.city||b?.city||'Issoire';
 const postal=pref?.postal_code||p.postal_code||b?.postal_code||'63500';
 const radius=RADII.includes(Number(pref?.radius_km))?Number(pref.radius_km):20;
 openModal(`<h2>🎯 Radar Prospects — Pro 360</h2><p>Trouvez des opportunités locales à partir des besoins publiés dans Issoire Connect et des entreprises compatibles de votre zone.</p><div class="notice"><b>🔥 Besoin confirmé</b> = demande réellement publiée. <b>🔵 Cible compatible</b> = prospect pertinent à qualifier, sans besoin supposé comme certain.</div><div class="form"><label>Votre métier / activité</label><input id="icV40Profession" maxlength="160" value="${e(profession)}" placeholder="Ex. chef cuisinier, plombier, photographe…"><div class="two"><div><label>Ville</label><input id="icV40City" value="${e(city)}"></div><div><label>Code postal</label><input id="icV40Postal" value="${e(postal)}"></div></div><label>Rayon</label><select id="icV40Radius">${radiusOptions(radius)}</select><button id="icV40Run" class="btn brand" onclick="runIcProspectRadarV40()">🎯 Lancer le Radar Prospects</button></div>`);
};

window.runIcProspectRadarV40=async function(){
 if(!logged()||!pro360())return openIcProspectRadarV40();
 const profession=document.getElementById('icV40Profession')?.value.trim()||'',city=document.getElementById('icV40City')?.value.trim()||'Issoire',postal_code=document.getElementById('icV40Postal')?.value.trim()||'',radius_km=Number(document.getElementById('icV40Radius')?.value||20);
 if(profession.length<2)return say('Indiquez votre métier ou votre activité.');
 const btn=document.getElementById('icV40Run');if(btn){btn.disabled=true;btn.textContent='Recherche en cours…'}
 let geo=null;try{geo=JSON.parse(localStorage.getItem('ic_resident_geo')||'null')}catch{}
 const body={profession,city,postal_code,radius_km};if(geo){const lat=Number(geo.lat??geo.latitude),lon=Number(geo.lon??geo.lng??geo.longitude);if(Number.isFinite(lat)&&Number.isFinite(lon)){body.latitude=lat;body.longitude=lon}}
 const {data,error}=await sb.functions.invoke('ic-prospect-radar',{body});
 if(error){if(btn){btn.disabled=false;btn.textContent='🎯 Lancer le Radar Prospects'};const msg=String(error.message||'');if(/403|pro360/i.test(msg)){closeModal();return openIcPlans()}return say('Radar indisponible : '+msg)}
 if(data?.error==='pro360_required'){closeModal();return openIcPlans()}
 V.items=Array.isArray(data?.items)?data.items:[];V.last={profession,city,postal_code,radius_km};closeModal();renderIcProspectRadarV40(data);
};

function leadCard(x,i){
 const need=x.proof_level==='confirmed_need',d=x.distance_km!=null?` · 📍 ${Number(x.distance_km).toFixed(1)} km`:'';
 const b=currentBusiness();
 const reply=need&&b&&String(x.key||'').startsWith('need:')?`<button class="btn brand" onclick="replyIcNeed('${e(String(x.key).slice(5))}','${e(b.id)}')">💬 Répondre</button>`:'';
 return `<article class="card" style="border-top:4px solid ${need?'#f47721':'#1677d2'}"><div class="row between"><span class="pill">${e(x.proof_label||'Prospect')}</span><span class="pill">${Number(x.score||0)} %</span></div><h3>${e(x.title||x.company||'Opportunité')}</h3><div class="muted">${e(x.company||'')}${x.city?' · '+e(x.city):''}${d}</div>${x.why_target?`<p>${e(x.why_target)}</p>`:''}${x.why_now?`<div class="notice">${e(x.why_now)}</div>`:''}<div class="actions" style="margin-top:10px">${reply}<button class="btn" onclick="saveIcProspectV40(${i})">👥 Ajouter aux prospects</button></div></article>`;
}
window.renderIcProspectRadarV40=function(data={}){
 if(typeof main==='undefined'||!main)return;
 const zone=data.zone||V.last||{},items=V.items;
 main.innerHTML=`<div class="sectionhead"><div><span class="pill">⭐ PRO 360</span><h2 style="margin-top:8px">🎯 Radar Prospects</h2><p>${e(data.profession||V.last?.profession||'')} · ${e(zone.city||'Issoire')} · ${Number(zone.radius_km||20)} km</p></div><button class="btn brand" onclick="openIcProspectRadarV40()">Nouvelle recherche</button></div><div class="notice"><b>${items.length} résultat(s)</b> · Les demandes explicites sont distinguées des simples cibles commerciales compatibles.</div><div class="cards" style="margin-top:12px">${items.length?items.map(leadCard).join(''):'<div class="empty">Aucune opportunité correspondant à cette recherche pour le moment.</div>'}</div>`;
};
window.saveIcProspectV40=async function(i){
 if(!logged()||!pro360())return openIcPlans();const x=V.items[Number(i)];if(!x)return;
 const payload={user_id:S.session.user.id,prospect_key:String(x.key||('ic:'+Date.now())),lead_kind:x.lead_kind||'business',company:x.company||null,title:x.title||null,sector:x.sector||null,address:x.address||null,city:x.city||null,distance_km:x.distance_km??null,score:Number(x.score||0),status:'to_qualify',notes:x.proof_label||null,source_snapshot:x,updated_at:new Date().toISOString()};
 const {error}=await sb.from('sd_prospect_pipeline').upsert(payload,{onConflict:'user_id,prospect_key'});if(error)return say(error.message);say('Prospect ajouté au suivi commercial.');
};

// Route every visible "Radar Prospects" action to the secured V40 engine.
document.addEventListener('click',ev=>{const el=ev.target?.closest?.('button,a');if(!el)return;const t=(el.textContent||'').replace(/\s+/g,' ').trim();if(/Radar Prospects/i.test(t)&&!el.closest('.modalback')){ev.preventDefault();ev.stopImmediatePropagation();openIcProspectRadarV40()}},true);

// Keep the V40 entry point visible in the professional dashboard.
const basePro=typeof proAccount==='function'?proAccount:null;
if(basePro)window.proAccount=function(...args){const r=basePro.apply(this,args);setTimeout(()=>{if(typeof main==='undefined'||!main||document.getElementById('icV40RadarPanel'))return;const box=document.createElement('section');box.id='icV40RadarPanel';box.className='card';box.style.marginBottom='14px';box.innerHTML=`<div class="row between"><div><span class="pill">⭐ PRO 360</span><h2 style="margin:7px 0 3px">🎯 Radar Prospects</h2><p class="muted" style="margin:0">Besoins confirmés + cibles professionnelles compatibles, dans un seul moteur Issoire Connect.</p></div><button class="btn brand" onclick="openIcProspectRadarV40()">Ouvrir</button></div>`;main.prepend(box)},0);return r};

// Official radius set: 1 / 5 / 10 / 20 / 50 km everywhere.
for(const name of ['openIcProfileSettings','openIcNeedRequest']){const old=window[name];if(typeof old==='function')window[name]=function(...args){const r=old.apply(this,args);setTimeout(()=>normalizeSelect(name==='openIcProfileSettings'?'icpRadius':'icNeedRadius'),0);return r}}
const oldDirectory=window.renderDirectoryPage;if(typeof oldDirectory==='function')window.renderDirectoryPage=async function(...args){const r=await oldDirectory.apply(this,args);const s=document.getElementById('dirDistance');if(s){const cur=Number(s.value||0),best=cur===0?0:(RADII.includes(cur)?cur:(cur<=1?1:cur<=5?5:cur<=10?10:cur<=20?20:50));s.innerHTML=radiusOptions(best,true);s.value=String(best)}return r};

// Clean legacy commercial wording still produced by older compatibility modules.
const cleanLegacy=()=>document.querySelectorAll('body *').forEach(el=>{if(el.children.length)return;const t=el.textContent||'';if(/Connect Pro ou Pro\+|Pro\/Pro\+/.test(t))el.textContent=t.replace(/Connect Pro ou Pro\+/g,'Pro 360').replace(/Pro\/Pro\+/g,'Pro 360')});
new MutationObserver(()=>cleanLegacy()).observe(document.body,{subtree:true,childList:true});setTimeout(cleanLegacy,250);
})();
