(()=>{
if(typeof S==='undefined'||typeof go!=='function')return;
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const _goFavoritesPage=go;
const businesses=()=>Array.isArray(S.businesses)?S.businesses:[];
const followRows=()=>Array.isArray(S.followRows)?S.followRows:[];
const followedIds=()=>S.follows instanceof Set?[...S.follows]:followRows().map(x=>x.business_id).filter(Boolean);
const offers=()=>Array.isArray(S.offers)?S.offers:[];
const jobs=()=>Array.isArray(S.jobs)?S.jobs:[];
const events=()=>Array.isArray(S.events)?S.events:[];
const activeOffer=o=>o?.is_active!==false&&(!o?.starts_at||new Date(o.starts_at)<=new Date())&&(!o?.ends_at||new Date(o.ends_at)>new Date());
const activeJob=j=>j?.is_active!==false;
const futureEvent=e=>!e?.starts_at||new Date(e.starts_at)>=new Date(Date.now()-24*60*60*1000);
function setActive(){document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active',el.getAttribute('data-page')==='favorites'))}
function notificationSummary(id){const r=followRows().find(x=>x.business_id===id);if(!r)return 'Aucune alerte activée';const names=[];if(r.notify_promos)names.push('promos');if(r.notify_waste)names.push('invendus');if(r.notify_jobs)names.push('emploi');if(r.notify_events)names.push('événements');return names.length?`Alertes : ${names.join(', ')}`:'Aucune alerte activée'}
function businessFavoriteCard(b){
 const os=offers().filter(o=>o.business_id===b.id&&activeOffer(o));
 const js=jobs().filter(j=>j.business_id===b.id&&activeJob(j));
 const es=events().filter(e=>e.business_id===b.id&&futureEvent(e));
 const waste=os.filter(o=>['invendu','derniere_minute'].includes(o.offer_type)).length;
 return `<article class="card"><div class="row between"><div><span class="pill">${E(b.category||'Professionnel')}</span><h3>${E(b.name||'Établissement')}</h3></div><span class="pill">♥ Suivi</span></div><div class="muted">📍 ${E(b.address||b.city||'Issoire')}</div><div class="notice" style="margin-top:10px"><b>${os.length} offre${os.length>1?'s':''}</b>${waste?` · ${waste} invendu${waste>1?'s':''}/dernière minute`:''} · ${js.length} emploi${js.length>1?'s':''} · ${es.length} événement${es.length>1?'s':''}<br><span class="muted">${E(notificationSummary(b.id))}</span></div><div class="actions" style="margin-top:10px"><button class="btn brand" onclick="viewBusiness('${E(b.id)}')">Voir la fiche</button><button class="btn" onclick="openFollowPreferences('${E(b.id)}')">🔔 Régler les alertes</button><button class="btn" onclick="toggleFollow('${E(b.id)}').then(()=>go('favorites'))">Ne plus suivre</button></div></article>`;
}
window.renderFavoritesPage=function(){
 setActive();
 if(typeof main==='undefined'||!main)return;
 if(!S.session){
  main.innerHTML=`<div class="sectionhead"><div><h1>❤️ Mes favoris</h1><p>Retrouvez ici les commerces que vous suivez, leurs offres, invendus, emplois, événements et nouveautés.</p></div></div><div class="card"><h2>Connectez-vous pour retrouver vos commerces suivis</h2><p class="muted">Les favoris sont liés à votre compte afin de rester disponibles sur vos appareils. Les notifications restent désactivées tant que vous ne les activez pas commerce par commerce.</p><div class="actions"><button class="btn brand" onclick="authModal('favorites')">Connexion / inscription</button><button class="btn" onclick="go('search')">Découvrir les commerces</button></div></div>`;
  return;
 }
 const ids=[...new Set(followedIds())],found=ids.map(id=>businesses().find(b=>b.id===id)).filter(Boolean);
 const missing=ids.length-found.length;
 const unread=(Array.isArray(S.notifications)?S.notifications:[]).filter(n=>!n.read_at).length;
 main.innerHTML=`<div class="sectionhead"><div><h1>❤️ Mes favoris / Je suis</h1><p>Vos commerces suivis et leurs nouveautés, sans spam : chaque type d’alerte se règle séparément.</p></div><div class="actions"><span class="pill">${ids.length} suivi${ids.length>1?'s':''}</span>${unread?`<span class="pill">🔔 ${unread} nouvelle${unread>1?'s':''}</span>`:''}</div></div>${found.length?`<div class="cards">${found.map(businessFavoriteCard).join('')}</div>`:'<div class="empty">Vous ne suivez encore aucun commerce. Recherchez un établissement puis choisissez « Suivre ce commerçant ».</div>'}${missing?`<div class="notice" style="margin-top:12px">${missing} commerce${missing>1?'s':''} suivi${missing>1?'s':''} n’est plus visible dans l’annuaire actuel.</div>`:''}<div class="actions" style="margin-top:14px"><button class="btn brand" onclick="go('search')">＋ Ajouter des favoris</button><button class="btn" onclick="go('account')">Mon compte et mes notifications</button></div>`;
};
go=function(page,...args){if(page==='favorites')return window.renderFavoritesPage();return _goFavoritesPage(page,...args)};
window.go=go;
})();
