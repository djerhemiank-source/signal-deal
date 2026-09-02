(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const escv=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const isAdmin=()=>!!(S.session&&S.profile?.role==='admin');
const planCards=()=>`<section id="icAdminPlansProfile" class="card" style="margin:0 0 14px;border:2px solid #1d6fdc"><div class="row between"><div><span class="pill">👑 PROFIL ADMINISTRATEUR</span><h2 style="margin:8px 0 4px">Tous les forfaits sont inclus</h2><p class="muted" style="margin:0">Ton compte admin possède automatiquement les droits maximums sans abonnement Stripe.</p></div><span class="pill">PRO+ EFFECTIF</span></div><div class="cards" style="margin-top:12px"><article class="card"><span class="pill">✅ INCLUS</span><h3>Essential</h3><p>5 km · 20 produits/services · 2 offres/invendus par mois · messagerie.</p></article><article class="card"><span class="pill">✅ INCLUS</span><h3>Pro</h3><p>20 km · catalogue/offres sans limite de forfait · commandes · réservations · emplois · événements · pub standard.</p></article><article class="card"><span class="pill">✅ INCLUS</span><h3>Pro+</h3><p>50 km · toutes les fonctions Pro · quotas maximums · campagnes sponsorisées · notifications maximums.</p></article></div><div class="actions"><button class="btn brand" onclick="openIcPlans()">💳 Voir les 3 forfaits</button><button class="btn" onclick="openIcAdminAudit()">🕘 Historique des corrections</button></div></section>`;
function injectAdminPlans(){if(!isAdmin()||typeof main==='undefined'||!main||document.getElementById('icAdminPlansProfile'))return;main.insertAdjacentHTML('afterbegin',planCards())}
if(typeof window.adminAccount==='function'){
 const base=window.adminAccount;
 window.adminAccount=function(...args){const r=base.apply(this,args);setTimeout(injectAdminPlans,0);return r};
}
if(typeof window.accountPage==='function'){
 const base=window.accountPage;
 window.accountPage=function(...args){const r=base.apply(this,args);setTimeout(injectAdminPlans,0);return r};
}
window.openIcAdminAudit=async function(){
 if(!isAdmin())return typeof say==='function'?say('Accès administrateur requis.'):null;
 if(typeof openModal==='function')openModal('<h2>🕘 Historique des corrections</h2><div id="icAuditRows" class="empty">Chargement…</div>');
 const {data,error}=await sb.from('ic_admin_audit_log').select('id,admin_user_id,action,table_name,record_id,before_data,after_data,created_at').order('created_at',{ascending:false}).limit(100);
 const host=document.getElementById('icAuditRows');if(!host)return;
 if(error){host.innerHTML=`<div class="notice">${escv(error.message)}</div>`;return}
 const rows=data||[];if(!rows.length){host.innerHTML='<div class="empty">Aucune correction administrateur enregistrée pour le moment.</div>';return}
 host.innerHTML=`<div class="notice"><b>${rows.length}</b> dernière(s) action(s) administrateur. Les valeurs avant/après sont conservées pour faciliter les corrections.</div><div class="cards" style="margin-top:10px">${rows.map(r=>`<article class="card"><div class="row between"><div><span class="pill">${escv(r.action)}</span><h3 style="margin:7px 0 3px">${escv(r.table_name)}</h3></div><small>${escv(new Date(r.created_at).toLocaleString('fr-FR'))}</small></div><div class="muted">Enregistrement : ${escv(r.record_id||'—')}</div><div class="actions"><button class="btn" onclick="openIcAdminAuditDetail('${escv(r.id)}')">Voir avant / après</button></div></article>`).join('')}</div>`;
 window.__icAuditRows=rows;
};
window.openIcAdminAuditDetail=function(id){if(!isAdmin())return;const r=(window.__icAuditRows||[]).find(x=>x.id===id);if(!r)return;const fmt=o=>o?escv(JSON.stringify(o,null,2)):'—';openModal(`<h2>🧾 Détail de la correction</h2><p><b>${escv(r.table_name)}</b> · ${escv(r.action)} · ${escv(new Date(r.created_at).toLocaleString('fr-FR'))}</p><h3>Avant</h3><pre style="white-space:pre-wrap;max-height:260px;overflow:auto;background:#f6f8fb;padding:10px;border-radius:10px">${fmt(r.before_data)}</pre><h3>Après</h3><pre style="white-space:pre-wrap;max-height:260px;overflow:auto;background:#f6f8fb;padding:10px;border-radius:10px">${fmt(r.after_data)}</pre><div class="actions"><button class="btn" onclick="closeModal()">Fermer</button></div>`)};
setTimeout(injectAdminPlans,0);
})();