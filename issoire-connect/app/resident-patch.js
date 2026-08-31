(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const _accountPageResident=accountPage;
const _visibleBusinessesResident=typeof visibleBusinesses==='function'?visibleBusinesses:()=>Array.isArray(S.businesses)?S.businesses:[];
const GEO_KEY='ic_resident_geo_v1';
function getGeo(){try{const g=JSON.parse(localStorage.getItem(GEO_KEY)||'null');return g&&Number.isFinite(g.lat)&&Number.isFinite(g.lng)?g:null}catch{return null}}
function km(a,b,c,d){const R=6371,toRad=x=>x*Math.PI/180;const dLat=toRad(c-a),dLon=toRad(d-b);const q=Math.sin(dLat/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
visibleBusinesses=function(){
 const base=_visibleBusinessesResident();const g=getGeo();if(!g)return base;
 const radius=Math.max(1,Math.min(50,Number(S.profile?.radius_km||10)));
 return base.filter(b=>{const lat=Number(b?.latitude),lng=Number(b?.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lng))return true;return km(g.lat,g.lng,lat,lng)<=radius});
};
window.enableLocalRadius=function(){
 if(!navigator.geolocation)return say('La géolocalisation n’est pas disponible sur cet appareil.');
 say('Localisation en cours…');
 navigator.geolocation.getCurrentPosition(pos=>{
  localStorage.setItem(GEO_KEY,JSON.stringify({lat:pos.coords.latitude,lng:pos.coords.longitude,at:Date.now()}));
  say(`Autour de moi activé dans un rayon de ${S.profile?.radius_km||10} km. Votre position reste sur cet appareil.`);
  try{go('businesses')}catch{}
 },err=>say(err.code===1?'Localisation refusée. Vous pouvez continuer avec votre ville et votre rayon.':'Impossible d’obtenir votre position pour le moment.'),{enableHighAccuracy:false,timeout:10000,maximumAge:300000});
};
window.disableLocalRadius=function(){localStorage.removeItem(GEO_KEY);say('Filtre GPS désactivé.');try{go('businesses')}catch{}};
window.openResidentPreferences=function(){
 if(!S.session)return authModal('account');
 const p=S.profile||{},g=getGeo();
 openModal(`<h2>📍 Mon secteur local</h2><p class="muted">Choisissez votre ville et votre rayon. La position GPS, si vous l’activez, reste uniquement dans votre navigateur.</p><div class="form"><label>Nom affiché</label><input id="rpName" value="${E(p.display_name||'')}"><div class="two"><div><label>Ville</label><input id="rpCity" value="${E(p.city||'Issoire')}"></div><div><label>Code postal</label><input id="rpPostal" inputmode="numeric" value="${E(p.postal_code||'63500')}"></div></div><label>Rayon autour de moi : <b id="rpRadiusValue">${Number(p.radius_km||10)} km</b></label><input id="rpRadius" type="range" min="1" max="50" step="1" value="${Number(p.radius_km||10)}" oninput="rpRadiusValue.textContent=this.value+' km'"><button class="btn brand" onclick="saveResidentPreferences()">💾 Enregistrer</button><div class="notice" style="margin-top:12px"><b>📱 Position de l’appareil</b><p>${g?'Activée sur cet appareil.':'Désactivée.'} Aucune coordonnée GPS précise n’est enregistrée dans votre compte.</p><div class="actions"><button class="btn" onclick="enableLocalRadius()">📍 ${g?'Actualiser':'Activer'} Autour de moi</button>${g?'<button class="btn" onclick="disableLocalRadius()">Désactiver</button>':''}</div></div></div>`)
};
window.saveResidentPreferences=async function(){
 if(!S.session)return;
 const radius=Math.max(1,Math.min(50,Number($('#rpRadius').value||10)));
 const payload={display_name:$('#rpName').value.trim()||null,city:$('#rpCity').value.trim()||'Issoire',postal_code:$('#rpPostal').value.trim()||null,radius_km:radius,updated_at:new Date().toISOString()};
 const {data,error}=await sb.from('ic_profiles').update(payload).eq('id',S.session.user.id).select('*').single();
 if(error)return say(error.message);
 S.profile=data;closeModal();say('Préférences locales enregistrées.');go('account');
};
function residentSection(){const p=S.profile||{},g=getGeo();return `<div class="sectionhead"><div><h2>📍 Mon secteur</h2><p>${E(p.city||'Issoire')}${p.postal_code?' '+E(p.postal_code):''} · rayon ${Number(p.radius_km||10)} km · GPS ${g?'activé':'désactivé'}</p></div><button class="btn brand" onclick="openResidentPreferences()">Modifier mon secteur</button></div>`}
accountPage=function(){const out=_accountPageResident();if(!S.session||S.profile?.role==='admin')return out;try{main.insertAdjacentHTML('afterbegin',residentSection())}catch(e){console.error('Issoire Connect resident profile render',e)}return out};
})();
