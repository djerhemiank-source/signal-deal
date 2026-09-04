(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const V='52.0';
const A={current:null,timer:null,lastPage:null};
const RESIDENT_PAGES=new Set(['home','search','deals','favorites','directory','classifieds','events','jobs','account']);
const e52=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function geo(){for(const x of [S.residentGeo,S.geo,S.location]){if(x){const lat=Number(x.lat??x.latitude),lon=Number(x.lon??x.lng??x.longitude);if(Number.isFinite(lat)&&Number.isFinite(lon))return{lat,lon}}}try{const x=JSON.parse(localStorage.getItem('ic_resident_geo')||'null');if(x){const lat=Number(x.lat??x.latitude),lon=Number(x.lon??x.lng??x.longitude);if(Number.isFinite(lat)&&Number.isFinite(lon))return{lat,lon}}}catch{}return null}
function km(a,b,c,d){const R=6371,p=Math.PI/180,x=(c-a)*p,y=(d-b)*p,q=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function sessionKey(){let k=localStorage.getItem('ic_ad_session');if(!k){k=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(16).slice(2));localStorage.setItem('ic_ad_session',k)}return k}
async function track(id,type){try{await sb.rpc('ic_track_ad_event',{p_campaign_id:id,p_event_type:type,p_session_key:sessionKey()})}catch{}}
function safeUrl(v){if(!v)return null;try{const u=new URL(/^https?:\/\//i.test(v)?v:'https://'+v);return /^https?:$/.test(u.protocol)?u.href:null}catch{return null}}
async function businessMap(ids){const out=new Map();for(const b of [...(S.businesses||[]),...(S.myBusinesses||[])])if(ids.includes(b.id))out.set(b.id,b);const missing=ids.filter(x=>!out.has(x));if(missing.length){const{data}=await sb.from('ic_businesses').select('id,name,city,category,latitude,longitude,is_active,owner_id').in('id',missing);for(const b of data||[])out.set(b.id,b)}return out}
function isResidentSurface(){return RESIDENT_PAGES.has(String(S.page||'home'))}
function seenKey(id,page){return `ic_ad_seen_v52_${id}_${page||'resident'}`}
async function chooseResidentAd({ignoreFrequency=false}={}){
 const nowIso=new Date().toISOString();
 const{data,error}=await sb.from('ic_ad_campaigns').select('id,business_id,title,image_url,target_url,duration_seconds,frequency_minutes,target_radius_km,target_audience,placement,starts_at,ends_at,is_active').eq('is_active',true).in('target_audience',['residents','all']).lte('starts_at',nowIso).limit(50);
 if(error)throw error;
 let rows=(data||[]).filter(a=>!a.ends_at||new Date(a.ends_at)>new Date());
 if(!rows.length)return null;
 const map=await businessMap([...new Set(rows.map(r=>r.business_id))]);
 const g=geo();
 rows=rows.filter(a=>{const b=map.get(a.business_id);if(!b||b.is_active===false)return false;if(!g)return true;const lat=Number(b.latitude),lon=Number(b.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lon))return true;return km(g.lat,g.lon,lat,lon)<=Number(a.target_radius_km||5)});
 if(!ignoreFrequency){const now=Date.now(),page=String(S.page||'home');rows=rows.filter(a=>now-Number(localStorage.getItem(seenKey(a.id,page))||0)>=Math.max(1,Number(a.frequency_minutes||5))*60000)}
 if(!rows.length)return null;
 rows.sort((a,b)=>(b.placement==='premium'?1:0)-(a.placement==='premium'?1:0)||new Date(b.starts_at||0)-new Date(a.starts_at||0));
 const a=rows[0];a.business=map.get(a.business_id)||null;return a;
}
function adMarkup(a,{preview=false}={}){const b=a.business||{};return `<div class="row between" style="gap:10px"><div><span class="pill">${preview?'👁 APERÇU HABITANT · ':''}${a.placement==='premium'?'⭐ SPONSORISÉ PREMIUM':'📢 SPONSORISÉ'}</span><div class="muted" style="margin-top:5px">Publicité locale ciblée · ${Number(a.target_radius_km||0)} km</div></div>${preview?'':'<button class="btn" style="padding:4px 8px" onclick="document.getElementById(\'icSponsoredAd\')?.remove()">×</button>'}</div>${a.image_url?`<img src="${e52(a.image_url)}" alt="Publicité locale" style="width:100%;max-height:230px;object-fit:cover;border-radius:14px;margin-top:10px" onerror="this.remove()">`:''}<h3 style="margin:11px 0 3px">${e52(a.title||'Offre locale')}</h3><div><b>${e52(b.name||'Professionnel local')}</b>${b.city?` <span class="muted">· ${e52(b.city)}</span>`:''}</div><div class="actions" style="margin-top:11px"><button class="btn brand" onclick="openIcSponsoredAd('${e52(a.id)}')">En savoir plus</button></div>`}
async function injectResidentAd(force=false){
 if(!isResidentSurface()||document.querySelector('[data-ic-demo-screen]'))return false;
 if(typeof main==='undefined'||!main)return false;
 if(document.getElementById('icSponsoredAd')&&!force)return true;
 try{
   const a=await chooseResidentAd({ignoreFrequency:force});if(!a)return false;
   document.getElementById('icSponsoredAd')?.remove();A.current=a;
   if(!force)localStorage.setItem(seenKey(a.id,String(S.page||'home')),String(Date.now()));
   const box=document.createElement('section');box.id='icSponsoredAd';box.className='card';box.style.cssText='margin:12px 0;border:1px solid #ffd2a6;background:linear-gradient(135deg,#fff9f1,#fff)';box.innerHTML=adMarkup(a);
   const hero=main.querySelector('.hero');if(hero?.nextSibling)hero.parentNode.insertBefore(box,hero.nextSibling);else main.prepend(box);
   if(!force)track(a.id,'impression');return true;
 }catch(err){console.warn('IC V52 ad',err);return false}
}
window.openIcSponsoredAd=async function(id){
 let a=A.current?.id===id?A.current:null;
 if(!a){try{const{data}=await sb.from('ic_ad_campaigns').select('id,business_id,title,image_url,target_url,target_radius_km,target_audience,placement,is_active').eq('id',id).maybeSingle();if(data){const map=await businessMap([data.business_id]);a={...data,business:map.get(data.business_id)}}}catch{}}
 if(!a)return typeof say==='function'?say('Publicité indisponible.'):null;
 await track(id,'click');const u=safeUrl(a.target_url);if(u)return window.open(u,'_blank','noopener,noreferrer');
 const b=a.business;if(b&&typeof viewBusiness==='function'){if(!(S.businesses||[]).some(x=>x.id===b.id))S.businesses.push(b);return viewBusiness(b.id)}
};
window.previewIcResidentAd=async function(){
 try{const a=await chooseResidentAd({ignoreFrequency:true});if(!a)return openModal('<h2>👁 Aperçu Habitant</h2><div class="empty">Aucune campagne Habitant active actuellement.</div>');A.current=a;openModal(`<h2>👁 Voilà ce que voit un Habitant</h2><div class="notice"><b>Aperçu sans tenir compte de la fréquence d’affichage.</b><br>La campagne réelle respecte ensuite son rayon et sa fréquence.</div><article class="card" style="margin-top:12px;border:1px solid #ffd2a6;background:#fffaf3">${adMarkup(a,{preview:true})}</article>`)}catch(err){say(err?.message||String(err))}
};
function paidPro360Plan(b){const p=String(b?.plan||'free').toLowerCase();return p==='pro'||p==='proplus'}
function ownedBusiness(id){return (S.myBusinesses||[]).find(x=>String(x.id)===String(id))||(S.businesses||[]).find(x=>String(x.id)===String(id))||null}
window.newAd=function(bid){
 const b=ownedBusiness(bid);if(!b)return typeof say==='function'?say('Entreprise introuvable.'):null;
 if(!paidPro360Plan(b)&&S.profile?.role!=='admin')return typeof openIcPlans==='function'?openIcPlans():say('La publicité locale est incluse dans Pro 360.');
 openModal(`<h2>📢 Nouvelle campagne sponsorisée</h2><div class="notice"><b>Pro 360</b> · campagnes standard ou premium · rayon jusqu’à 50 km.</div><div class="form"><label>Titre</label><input id="icaTitle" maxlength="120" placeholder="Votre offre ou message"><label>Image URL — facultatif</label><input id="icaImage" placeholder="https://…"><label>Lien cible — facultatif</label><input id="icaUrl" placeholder="https://…"><label>Audience</label><select id="icaAudience"><option value="residents">Habitants</option><option value="professionals">Professionnels</option><option value="all">Tout le monde</option></select><label>Rayon</label><select id="icaRadius">${[1,5,10,20,50].map(x=>`<option value="${x}" ${x===50?'selected':''}>${x} km</option>`).join('')}</select><label>Placement</label><select id="icaPlacement"><option value="standard">Standard</option><option value="premium">⭐ Premium</option></select><div class="two"><div><label>Durée affichage</label><select id="icaDuration"><option value="10">10 s</option><option value="15" selected>15 s</option><option value="20">20 s</option><option value="30">30 s</option></select></div><div><label>Fréquence par appareil</label><select id="icaFreq"><option value="5">5 min</option><option value="15">15 min</option><option value="30" selected>30 min</option><option value="60">60 min</option></select></div></div><label>Fin de campagne — facultatif</label><input id="icaEnd" type="datetime-local"><button class="btn brand" onclick="saveIcAd('${e52(bid)}')">Lancer la campagne</button></div>`)
};
function addPreviewButton(){
 const tools=document.getElementById('icAdTools');if(!tools)return;
 const muted=tools.querySelector('.muted');if(muted)muted.textContent='Pro 360 · Standard + premium · jusqu’à 50 km';
 if(tools.querySelector('[data-ic52-preview]'))return;
 const actions=tools.querySelector('.actions');if(!actions)return;
 const btn=document.createElement('button');btn.className='btn';btn.dataset.ic52Preview='1';btn.textContent='👁 Voir comme un Habitant';btn.onclick=()=>previewIcResidentAd();actions.appendChild(btn)
}
const baseGo=window.go;
if(typeof baseGo==='function')window.go=function(page,...args){const r=baseGo.call(this,page,...args);clearTimeout(A.timer);A.timer=setTimeout(()=>{addPreviewButton();injectResidentAd(false)},520);return r};
const observer=new MutationObserver(()=>{addPreviewButton();if(isResidentSurface()&&!document.getElementById('icSponsoredAd')&&!document.querySelector('[data-ic-demo-screen]')){clearTimeout(A.timer);A.timer=setTimeout(()=>injectResidentAd(false),650)}});
if(typeof main!=='undefined'&&main)observer.observe(main,{childList:true,subtree:false});
setTimeout(()=>{addPreviewButton();injectResidentAd(false)},800);
window.icV52Ads={version:V,chooseResidentAd,injectResidentAd,preview:window.previewIcResidentAd};
})();
// V52 clean-source regeneration anchor
