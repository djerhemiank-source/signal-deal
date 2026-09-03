(()=>{
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;
const IC_RADII=[1,5,10,20,50];
const ee=v=>typeof esc==='function'?esc(String(v??'')):String(v??'');
const currentBusiness=()=>Array.isArray(S.myBusinesses)&&S.myBusinesses.length?S.myBusinesses[0]:null;
const hasPro360=()=>typeof window.icHasPro360==='function'?window.icHasPro360():S.profile?.role==='admin'||['pro','proplus'].includes(S.subscription?.plan||'');
const isMobile=()=>window.matchMedia('(max-width:699px)').matches;
const radiusOptions=value=>IC_RADII.map(x=>`<option value="${x}" ${Number(value)===x?'selected':''}>${x} km</option>`).join('');
function defaultRadius(pref,b){const pr=Number(pref?.radius_km),br=Number(b?.visibility_radius_km);if(IC_RADII.includes(pr))return pr;if(IC_RADII.includes(br))return br;return 20}
function radarForm({profession,city,postal,radius}){return `<div class="ic-radar-form"><div class="notice"><b>🔥 Besoin confirmé</b> = demande réellement publiée. <b>🔵 Cible compatible</b> = prospect pertinent à qualifier, sans besoin supposé comme certain.</div><div class="form" style="margin-top:12px"><label>Votre métier / activité</label><input id="icV40Profession" maxlength="160" value="${ee(profession)}" placeholder="Ex. chef cuisinier, plombier, photographe…"><div class="two"><div><label>Ville</label><input id="icV40City" value="${ee(city)}"></div><div><label>Code postal</label><input id="icV40Postal" value="${ee(postal)}"></div></div><label>Rayon</label><select id="icV40Radius">${radiusOptions(radius)}</select><button id="icV40Run" class="btn brand" onclick="runIcProspectRadarV40()">🎯 Lancer le Radar Prospects</button></div></div>`}
window.openIcProspectRadarV40=async function(){
 if(!S.session){if(typeof authModal==='function')return authModal('account');return say('Connectez-vous pour utiliser le Radar Prospects.');}
 if(!hasPro360()){if(typeof openIcPlans==='function')return openIcPlans();return say('Le Radar Prospects nécessite Pro 360.');}
 let pref=null;try{const {data}=await sb.from('ic_prospect_preferences').select('*').eq('user_id',S.session.user.id).maybeSingle();pref=data}catch{}
 const b=currentBusiness(),p=S.profile||{};
 const profession=pref?.profession||b?.category||'';
 const city=pref?.city||b?.city||p.city||'Issoire';
 const postal=pref?.postal_code||b?.postal_code||p.postal_code||'63500';
 const radius=defaultRadius(pref,b);
 const form=radarForm({profession,city,postal,radius});
 if(isMobile()){
   if(typeof closeModal==='function')closeModal();
   if(typeof main!=='undefined'&&main){main.innerHTML=`<div class="sectionhead"><div><span class="pill">⭐ PRO 360</span><h2 style="margin-top:8px">🎯 Radar Prospects</h2><p>Recherchez des opportunités locales sans quitter cet écran.</p></div></div><button class="btn" onclick="go('account')" style="margin-bottom:12px">← Retour à mon espace Pro</button>${form}`;window.scrollTo({top:0,behavior:'smooth'});}
   return;
 }
 openModal(`<h2>🎯 Radar Prospects — Pro 360</h2><p>Trouvez des opportunités locales à partir des besoins publiés dans Issoire Connect et des entreprises compatibles de votre zone.</p>${form}`);
};
window.runIcProspectRadarV40=async function(){
 if(!S.session||!hasPro360())return openIcProspectRadarV40();
 const profession=document.getElementById('icV40Profession')?.value.trim()||'';
 const city=document.getElementById('icV40City')?.value.trim()||'Issoire';
 const postal_code=document.getElementById('icV40Postal')?.value.trim()||'';
 const radius_km=Number(document.getElementById('icV40Radius')?.value||currentBusiness()?.visibility_radius_km||20);
 if(profession.length<2)return say('Indiquez votre métier ou votre activité.');
 if(!IC_RADII.includes(radius_km))return say('Choisissez un rayon valide.');
 const btn=document.getElementById('icV40Run');if(btn){btn.disabled=true;btn.textContent='Recherche en cours…'}
 let geo=null;try{geo=JSON.parse(localStorage.getItem('ic_resident_geo')||'null')}catch{}
 const body={profession,city,postal_code,radius_km};if(geo){const lat=Number(geo.lat??geo.latitude),lon=Number(geo.lon??geo.lng??geo.longitude);if(Number.isFinite(lat)&&Number.isFinite(lon)){body.latitude=lat;body.longitude=lon}}
 try{
   const timeout=new Promise(resolve=>setTimeout(()=>resolve({data:null,error:{message:'La recherche prend trop de temps. Réessayez dans quelques secondes.'}}),20000));
   const {data,error}=await Promise.race([sb.functions.invoke('ic-prospect-radar',{body}),timeout]);
   if(error){const msg=String(error.message||'Radar indisponible');if(/403|pro360/i.test(msg)){if(typeof closeModal==='function')closeModal();if(typeof openIcPlans==='function')return openIcPlans()}return say(msg)}
   if(data?.error==='pro360_required'){if(typeof closeModal==='function')closeModal();if(typeof openIcPlans==='function')return openIcPlans();return}
   if(window.V&&Array.isArray(data?.items))window.V.items=data.items;
   if(typeof closeModal==='function')closeModal();
   if(typeof window.renderIcProspectRadarV40==='function')window.renderIcProspectRadarV40(data||{});else say(`${data?.items?.length||0} résultat(s) trouvé(s).`);
   window.scrollTo({top:0,behavior:'smooth'});
 }catch(err){say('Radar indisponible : '+String(err?.message||err));}
 finally{if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent='🎯 Lancer le Radar Prospects'}}
};
})();
