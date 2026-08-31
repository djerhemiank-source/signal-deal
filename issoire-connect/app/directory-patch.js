(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const D={category:'Toutes',job:'',distance:0,openNow:false,geo:null,map:null,nearby:false};
const CATS=['Toutes','Alimentation & restaurants','Santé','Auto & mobilité','Maison & travaux','Beauté','Services & assurances','Commerces','Loisirs & sport','Hébergement','Autres'];
const _goDirectory=go,_businessCardDirectory=businessCard,_viewBusinessDirectory=viewBusiness;
function e(v){return esc(String(v??''))}
function fold(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function textOf(b){return fold([b.name,b.category,b.description,b.search_keywords,b.naf_code,b.address].filter(Boolean).join(' '))}
function categoryOf(b){
 const t=textOf(b);
 if(/boulanger|patisser|boucher|charcut|epicer|aliment|restaurant|brasserie|cafe|bar\b|bio\b|fromag|traiteur/.test(t))return 'Alimentation & restaurants';
 if(/medec|pharmac|dentist|infirm|kine|sante|hopital|clinique|opticien|orthophon|sage.femme|veterin/.test(t))return 'Santé';
 if(/garage|automobil|voiture|moto|cycle|velo|taxi|transport|carross|controle technique/.test(t))return 'Auto & mobilité';
 if(/plomb|electric|batiment|macon|menuis|peint|chauffag|clim|toitur|charpent|travaux|renov|jardin|paysag/.test(t))return 'Maison & travaux';
 if(/coiff|estheti|beaute|ongl|spa\b|massage|parfum/.test(t))return 'Beauté';
 if(/assur|banque|comptab|avocat|notair|imprimer|informat|agence|conseil|consult|communication|immobil/.test(t))return 'Services & assurances';
 if(/hotel|hebergement|camping|gite|chambre d.hote/.test(t))return 'Hébergement';
 if(/sport|fitness|gym|loisir|cinema|theatre|culture|danse|musique|jeu|association/.test(t))return 'Loisirs & sport';
 if(/magasin|boutique|commerce|vetement|chauss|fleur|bijou|librair|meuble|electromenag|optique/.test(t))return 'Commerces';
 return 'Autres';
}
function residentGeo(){
 if(D.geo&&Number.isFinite(D.geo.lat)&&Number.isFinite(D.geo.lon))return D.geo;
 const candidates=[S.residentGeo,S.geo,S.location];
 for(const x of candidates||[]){if(x){const lat=Number(x.lat??x.latitude),lon=Number(x.lon??x.lng??x.longitude);if(Number.isFinite(lat)&&Number.isFinite(lon))return D.geo={lat,lon}}}
 try{const x=JSON.parse(localStorage.getItem('ic_resident_geo')||'null');if(x){const lat=Number(x.lat??x.latitude),lon=Number(x.lon??x.lng??x.longitude);if(Number.isFinite(lat)&&Number.isFinite(lon))return D.geo={lat,lon}}}catch{}
 return null;
}
function km(a,b,c,d){const R=6371,p=Math.PI/180,x=(c-a)*p,y=(d-b)*p;const q=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function distanceOf(b){const g=residentGeo(),lat=Number(b.latitude),lon=Number(b.longitude);return g&&Number.isFinite(lat)&&Number.isFinite(lon)?km(g.lat,g.lon,lat,lon):null}
function parisNow(){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
 const o={};for(const p of parts)o[p.type]=p.value;
 const key=({Mon:'mon',Tue:'tue',Wed:'wed',Thu:'thu',Fri:'fri',Sat:'sat',Sun:'sun'})[o.weekday]||'mon';
 return {key,min:(Number(o.hour)%24)*60+Number(o.minute)};
}
function openState(b){
 const h=b?.opening_hours;if(!h||typeof h!=='object')return {known:false,open:false,label:'Horaires à compléter'};
 const n=parisNow(),raw=String(h[n.key]||'').trim();if(!raw)return {known:false,open:false,label:'Horaires à compléter'};
 const f=fold(raw);if(/ferme|closed/.test(f))return {known:true,open:false,label:'Fermé'};
 const pairs=[...raw.matchAll(/(\d{1,2})[:h](\d{2})\s*[-–—]\s*(\d{1,2})[:h](\d{2})/g)];
 if(!pairs.length)return {known:false,open:false,label:raw};
 for(const m of pairs){const a=Number(m[1])*60+Number(m[2]),z=Number(m[3])*60+Number(m[4]);if(n.min>=a&&n.min<z)return {known:true,open:true,label:'Ouvert maintenant'}}
 return {known:true,open:false,label:'Fermé maintenant'};
}
function safeUrl(v){if(!v)return null;try{const u=new URL(/^https?:\/\//i.test(v)?v:'https://'+v);return /^https?:$/.test(u.protocol)?u.href:null}catch{return null}}
function routeUrl(b){const lat=Number(b.latitude),lon=Number(b.longitude);const dest=Number.isFinite(lat)&&Number.isFinite(lon)?`${lat},${lon}`:[b.address,b.postal_code,b.city].filter(Boolean).join(' ');return dest?'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(dest):null}
function contactActions(b,detail=false){
 const phone=String(b.phone||'').replace(/[^\d+]/g,''),site=safeUrl(b.website),route=routeUrl(b);
 return `<div class="actions ic-contact-actions" style="margin-top:10px;gap:6px;flex-wrap:wrap">${detail?`<button class="btn brand" onclick="viewBusiness('${e(b.id)}')">Voir la fiche</button>`:''}${phone?`<a class="btn" href="tel:${e(phone)}">☎ Appeler</a>`:''}${site?`<a class="btn" href="${e(site)}" target="_blank" rel="noopener">🌐 Site</a>`:''}${route?`<a class="btn" href="${e(route)}" target="_blank" rel="noopener">🧭 Itinéraire</a>`:''}</div>`;
}
businessCard=function(b){let h=_businessCardDirectory(b);if(h.includes('ic-contact-actions'))return h;return h.replace('</article>',contactActions(b,false)+'</article>')};
viewBusiness=function(id){_viewBusinessDirectory(id);const b=S.businesses.find(x=>x.id===id);if(b&&modalBody&&!modalBody.querySelector('.ic-directory-contact')){const d=distanceOf(b),o=openState(b);modalBody.insertAdjacentHTML('beforeend',`<div class="notice ic-directory-contact" style="margin-top:12px"><b>${o.open?'🟢':'🕒'} ${e(o.label)}</b>${d!=null?`<br>📍 ${d.toFixed(1)} km de vous`:''}${contactActions(b,false)}</div>`)}};
function filtered(){
 let rows=(S.businesses||[]).filter(b=>b&&b.is_active!==false);
 if(typeof isBusinessVisibleToResident==='function')try{rows=rows.filter(b=>isBusinessVisibleToResident(b))}catch{}
 const q=fold(D.job.trim());
 if(D.category!=='Toutes')rows=rows.filter(b=>categoryOf(b)===D.category);
 if(q)rows=rows.filter(b=>textOf(b).includes(q));
 if(D.openNow)rows=rows.filter(b=>openState(b).open);
 if(D.distance>0&&residentGeo())rows=rows.filter(b=>{const d=distanceOf(b);return d!=null&&d<=D.distance});
 rows.sort((a,b)=>{const da=distanceOf(a),db=distanceOf(b);if(da!=null&&db!=null)return da-db;if(da!=null)return -1;if(db!=null)return 1;return String(a.name||'').localeCompare(String(b.name||''),'fr')});
 return rows;
}
function directoryCard(b){
 const d=distanceOf(b),o=openState(b),cat=categoryOf(b);
 return `<article class="card"><div class="row between"><div><span class="pill">${e(cat)}</span><h3 style="margin-top:7px">${e(b.name||'Entreprise')}</h3></div><span class="pill">${o.open?'🟢 Ouvert':o.known?'🔴 Fermé':'🕒 Horaires ?'}</span></div><div class="muted">${e(b.category||'Activité locale')}${b.address?`<br>${e(b.address)}${b.postal_code?' · '+e(b.postal_code):''}${b.city?' '+e(b.city):''}`:''}${d!=null?`<br>📍 ${d.toFixed(1)} km`:''}</div>${contactActions(b,true)}</article>`;
}
function filtersHtml(){
 return `<div class="card" style="margin-bottom:12px"><div class="two"><div><label>Métier / besoin</label><input id="dirJob" value="${e(D.job)}" placeholder="boulangerie, garage, médecin…"></div><div><label>Distance</label><select id="dirDistance"><option value="0">Toutes distances</option>${[1,2,5,10,20,50].map(x=>`<option value="${x}" ${D.distance===x?'selected':''}>${x} km</option>`).join('')}</select></div></div><label style="display:flex;align-items:center;gap:8px;margin-top:9px"><input id="dirOpen" type="checkbox" ${D.openNow?'checked':''}> 🟢 Ouvert maintenant</label><div class="actions" style="margin-top:10px;gap:6px;flex-wrap:wrap">${CATS.map(c=>`<button class="btn ${D.category===c?'brand':''}" onclick="setDirectoryCategory('${e(c)}')">${e(c)}</button>`).join('')}</div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="applyDirectoryFilters()">🔎 Filtrer</button><button class="btn" onclick="useDirectoryLocation()">📍 Utiliser ma position</button><button class="btn" onclick="resetDirectoryFilters()">↺ Réinitialiser</button></div></div>`;
}
window.setDirectoryCategory=function(c){D.category=c;renderDirectoryPage(D.nearby)};
window.applyDirectoryFilters=function(){D.job=document.getElementById('dirJob')?.value||'';D.distance=Number(document.getElementById('dirDistance')?.value||0);D.openNow=!!document.getElementById('dirOpen')?.checked;renderDirectoryPage(D.nearby)};
window.resetDirectoryFilters=function(){D.category='Toutes';D.job='';D.distance=D.nearby?10:0;D.openNow=false;renderDirectoryPage(D.nearby)};
window.useDirectoryLocation=function(){if(!navigator.geolocation)return say('La géolocalisation n’est pas disponible sur cet appareil.');navigator.geolocation.getCurrentPosition(p=>{D.geo={lat:p.coords.latitude,lon:p.coords.longitude};try{localStorage.setItem('ic_resident_geo',JSON.stringify(D.geo))}catch{};if(!D.distance)D.distance=10;renderDirectoryPage(D.nearby)},()=>say('Position refusée ou indisponible.'),{enableHighAccuracy:true,timeout:10000,maximumAge:300000})};
function ensureLeaflet(){
 if(window.L)return Promise.resolve();
 if(!document.querySelector('link[data-ic-leaflet]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';l.dataset.icLeaflet='1';document.head.appendChild(l)}
 return new Promise((resolve,reject)=>{const old=document.querySelector('script[data-ic-leaflet]');if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.dataset.icLeaflet='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
}
async function drawMap(rows){
 const host=document.getElementById('icMap');if(!host)return;
 try{await ensureLeaflet();if(D.map)try{D.map.remove()}catch{};const g=residentGeo(),center=g?[g.lat,g.lon]:[45.5442,3.2490];D.map=L.map(host).setView(center,g?13:12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(D.map);const bounds=[];if(g){L.circleMarker([g.lat,g.lon],{radius:8}).addTo(D.map).bindPopup('📍 Ma position');bounds.push([g.lat,g.lon])}for(const b of rows.slice(0,250)){const lat=Number(b.latitude),lon=Number(b.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;L.marker([lat,lon]).addTo(D.map).bindPopup(`<b>${e(b.name)}</b><br>${e(categoryOf(b))}`);bounds.push([lat,lon])}if(bounds.length>1)D.map.fitBounds(bounds,{padding:[24,24],maxZoom:15})}catch{host.innerHTML='<div class="empty">La carte n’a pas pu se charger. La liste reste disponible.</div>'}
}
window.renderDirectoryPage=function(nearby=false){
 D.nearby=!!nearby;if(D.nearby&&D.distance===0)D.distance=10;
 const rows=filtered(),shown=rows.slice(0,120),g=residentGeo();
 main.innerHTML=`<div class="sectionhead"><div><h2>${D.nearby?'📍 Autour de moi':'🏪 Annuaire local d’Issoire'}</h2><p>${rows.length} établissement(s) correspondant aux filtres${g?' · triés par proximité':''}.</p></div>${D.nearby?'<button class="btn" onclick="go(\'businesses\')">Voir tout l’annuaire</button>':'<button class="btn brand" onclick="go(\'nearby\')">🗺 Autour de moi</button>'}</div>${filtersHtml()}${!g&&D.nearby?'<div class="notice"><b>Pour calculer les distances précisément</b><br>Utilisez le bouton « Utiliser ma position ».</div>':''}<div id="icMap" style="height:360px;border-radius:16px;overflow:hidden;margin:12px 0;background:#e9eef5"></div><div class="sectionhead"><div><h2>Résultats</h2><p>${shown.length}${rows.length>shown.length?' premiers':''} affichés</p></div></div><div class="cards">${shown.length?shown.map(directoryCard).join(''):'<div class="empty">Aucun établissement ne correspond à ces filtres.</div>'}</div>`;
 drawMap(rows);
};
go=function(page,...args){const r=_goDirectory(page,...args);if(page==='businesses'||page==='nearby')setTimeout(()=>renderDirectoryPage(page==='nearby'),0);return r};
})();
