(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!Array.isArray(S.follows))S.follows=[];
if(!Array.isArray(S.notifications))S.notifications=[];
const _loadPrivateFollow=loadPrivate;
const _businessCardFollow=businessCard;
const _viewBusinessFollow=viewBusiness;
const _accountPageFollow=accountPage;

function follows(){if(!Array.isArray(S.follows))S.follows=[];return S.follows}
function notifications(){if(!Array.isArray(S.notifications))S.notifications=[];return S.notifications}
function row(id){return follows().find(f=>f.business_id===id)}
function label(id){return row(id)?'♥ Suivi':'♡ Suivre ce commerçant'}
function followButton(id,compact=false){return `<button class="btn ${row(id)?'brand':''}" data-ic-follow="${E(id)}" onclick="event.stopPropagation();toggleFollow('${E(id)}')">${compact?(row(id)?'♥ Suivi':'♡ Suivre'):label(id)}</button>`}
function syncButtons(id){document.querySelectorAll(`[data-ic-follow="${CSS.escape(String(id))}"]`).forEach(b=>{b.textContent=b.closest('.modal')?label(id):(row(id)?'♥ Suivi':'♡ Suivre');b.classList.toggle('brand',!!row(id))})}

loadPrivate=async function(){
 await _loadPrivateFollow();
 if(!S.session){S.follows=[];S.notifications=[];return}
 const uid=S.session.user.id;
 const [f,n]=await Promise.all([
  sb.from('ic_follows').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
  sb.from('ic_notifications').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(100)
 ]);
 S.follows=Array.isArray(f.data)?f.data:[];
 S.notifications=Array.isArray(n.data)?n.data:[];
};

window.toggleFollow=async function(id){
 if(!S.session){say('Connectez-vous pour suivre ce commerçant et choisir vos notifications.');authModal('businesses');return}
 const uid=S.session.user.id,existing=row(id);
 if(existing){
  const {error}=await sb.from('ic_follows').delete().eq('user_id',uid).eq('business_id',id);
  if(error)return say(error.message);
  S.follows=follows().filter(f=>f.business_id!==id);
  syncButtons(id);say('Commerce retiré de vos favoris.');
 }else{
  const payload={user_id:uid,business_id:id,notify_promos:false,notify_waste:false,notify_jobs:false,notify_events:false};
  const {data,error}=await sb.from('ic_follows').insert(payload).select('*').single();
  if(error)return say(error.message);
  follows().unshift(data);syncButtons(id);say('Commerce ajouté à vos favoris. Choisissez maintenant les notifications souhaitées.');
  openFollowPreferences(id);
 }
};

window.openFollowPreferences=function(id){
 if(!S.session)return authModal('businesses');
 const f=row(id);if(!f)return say('Suivez d’abord ce commerçant.');
 const b=(Array.isArray(S.businesses)?S.businesses:[]).find(x=>x.id===id);
 openModal(`<h2>🔔 Notifications — ${E(b?.name||'Commerce')}</h2><p class="muted">Aucune alerte n’est obligatoire. Activez uniquement ce que vous souhaitez recevoir pour ce commerce.</p><div class="form"><label><input id="fpPromos" type="checkbox" ${f.notify_promos?'checked':''}> Promotions et nouveautés</label><label><input id="fpWaste" type="checkbox" ${f.notify_waste?'checked':''}> Invendus / dernière minute</label><label><input id="fpJobs" type="checkbox" ${f.notify_jobs?'checked':''}> Offres d’emploi</label><label><input id="fpEvents" type="checkbox" ${f.notify_events?'checked':''}> Événements</label><button class="btn brand" onclick="saveFollowPreferences('${E(id)}')">💾 Enregistrer mes préférences</button></div>`)
};
window.saveFollowPreferences=async function(id){
 const f=row(id);if(!f||!S.session)return;
 const payload={notify_promos:$('#fpPromos').checked,notify_waste:$('#fpWaste').checked,notify_jobs:$('#fpJobs').checked,notify_events:$('#fpEvents').checked};
 const {data,error}=await sb.from('ic_follows').update(payload).eq('user_id',S.session.user.id).eq('business_id',id).select('*').single();
 if(error)return say(error.message);
 S.follows=follows().map(x=>x.business_id===id?data:x);closeModal();say('Préférences de notifications enregistrées.');
};

businessCard=function(b){
 let h=_businessCardFollow(b);
 if(!h.includes(`data-ic-follow="${b.id}"`))h=h.replace('</article>',`<div class="actions" style="margin-top:8px">${followButton(b.id,true)}${row(b.id)?`<button class="btn" onclick="event.stopPropagation();openFollowPreferences('${E(b.id)}')">🔔 Régler</button>`:''}</div></article>`);
 return h;
};
viewBusiness=function(id){
 _viewBusinessFollow(id);
 const b=(Array.isArray(S.businesses)?S.businesses:[]).find(x=>x.id===id);if(!b||!modalBody)return;
 if(!modalBody.querySelector?.(`[data-ic-follow="${CSS.escape(String(id))}"]`))modalBody.insertAdjacentHTML('beforeend',`<div class="actions" style="margin-top:14px">${followButton(id)}${row(id)?`<button class="btn" onclick="openFollowPreferences('${E(id)}')">🔔 Mes notifications</button>`:''}</div>`);
};

function notifCard(n){const unread=!n.read_at;return `<article class="card" style="${unread?'border-width:2px':''}"><div class="row between"><h3>${E(n.title)}</h3>${unread?'<span class="pill">Nouveau</span>':''}</div><p>${E(n.body||'')}</p><div class="muted">${new Date(n.created_at).toLocaleString('fr-FR')}</div>${unread?`<button class="btn" style="margin-top:8px" onclick="markNotificationRead('${E(n.id)}')">✓ Marquer comme lue</button>`:''}</article>`}
window.markNotificationRead=async function(id){if(!S.session)return;const {error}=await sb.from('ic_notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('user_id',S.session.user.id);if(error)return say(error.message);S.notifications=notifications().map(n=>n.id===id?{...n,read_at:new Date().toISOString()}:n);go('account')};

function followingSection(){
 const businesses=Array.isArray(S.businesses)?S.businesses:[];
 const followed=follows().map(f=>businesses.find(b=>b.id===f.business_id)).filter(Boolean);
 const unread=notifications().filter(n=>!n.read_at).length;
 return `<div class="sectionhead"><div><h2>❤️ Mes favoris / Je suis</h2><p>Accès rapide aux commerces que vous suivez. Les notifications sont désactivées par défaut et réglables commerce par commerce.</p></div><span class="pill">${followed.length} suivi${followed.length>1?'s':''}</span></div>${followed.length?`<div class="cards">${followed.map(b=>`<article class="card"><h3>${E(b.name)}</h3><div class="muted">${E(b.category||'Professionnel')} · ${E(b.city||'Issoire')}</div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="viewBusiness('${E(b.id)}')">Voir la fiche</button><button class="btn" onclick="openFollowPreferences('${E(b.id)}')">🔔 Notifications</button><button class="btn" onclick="toggleFollow('${E(b.id)}')">Ne plus suivre</button></div></article>`).join('')}</div>`:'<div class="empty">Vous ne suivez encore aucun commerce. Ouvrez une fiche puis choisissez « Suivre ce commerçant ».</div>'}<div class="sectionhead"><div><h2>🔔 Mes notifications</h2><p>${unread} non lue${unread>1?'s':''}</p></div></div>${notifications().length?`<div class="cards">${notifications().slice(0,20).map(notifCard).join('')}</div>`:'<div class="empty">Aucune notification pour le moment.</div>'}`;
}

accountPage=function(){
 const out=_accountPageFollow();
 if(!S.session||S.profile?.role==='admin')return out;
 try{main.insertAdjacentHTML('beforeend',followingSection())}catch(e){console.error('Issoire Connect follows account render',e)}
 return out;
};
})();
