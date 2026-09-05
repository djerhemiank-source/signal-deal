(function(){
'use strict';
const BUILD='2026-09-05-v62-release-gate';
if(typeof S==='undefined')return;
S.v62=S.v62||{};S.v62.releaseGate=null;
function gateHtml(g){
 if(!g)return '<p class="muted">Contrôle de release non chargé.</p>';
 const blockers=Array.isArray(g.blockers)?g.blockers:[];
 return `<div class="card ${g.ready_for_live?'v61-ok':'v61-alert'}"><h3>${g.ready_for_live?'✅ 1.0 prête pour validation LIVE':'🔒 1.0 LIVE verrouillée'}</h3><p class="muted">Le mode LIVE reste désactivé tant que tous les prérequis ne sont pas validés.</p>${blockers.map(b=>`<div class="v59-row"><span>${esc(b.label||b.id)}</span><b>${b.ok?'✅ OK':'❌ À faire'}</b></div>`).join('')}<hr><div class="v59-row"><span>Checkouts Stripe TEST enregistrés</span><b>${Number(g.metrics?.checkout_completed_events||0)}</b></div><div class="v59-row"><span>Abonnements TEST actifs</span><b>${Number(g.metrics?.paid_test_active||0)}</b></div><div class="v59-row"><span>Abonnements LIVE actifs</span><b>${Number(g.metrics?.paid_live_active||0)}</b></div></div>`;
}
window.loadReleaseGateV62=async function(){
 const box=document.getElementById('admin62ReleaseGate');
 if(box)box.innerHTML='<p class="muted">Vérification des prérequis…</p>';
 if(!sb||!S.session||!S.v59?.isAdmin){if(box)box.innerHTML='<p class="muted">Accès administrateur requis.</p>';return}
 try{const {data,error}=await sb.functions.invoke('ic-v62-release-gate',{body:{}});if(error)throw error;if(data?.error)throw new Error(data.error);S.v62.releaseGate=data;if(box)box.innerHTML=gateHtml(data)}catch(e){if(box)box.innerHTML=`<p class="muted">Contrôle indisponible : ${esc(e?.message||String(e))}</p>`}
};
const oldAdminV62Gate=window.admin59Page;
window.admin59Page=function(){oldAdminV62Gate();if(!S.v59?.isAdmin)return;main.insertAdjacentHTML('beforeend',`<section class="section"><div class="card"><div class="section-head"><div><span class="v61-tag">1.0 PRE-LAUNCH</span><h3>🚦 Verrou de mise en production</h3><p>Ce contrôle empêche de présenter l’application comme prête pour les paiements LIVE tant que les prérequis sont incomplets.</p></div><button class="btn" onclick="loadReleaseGateV62()">Revérifier</button></div><div id="admin62ReleaseGate"><p class="muted">Chargement…</p></div></div></section>`);loadReleaseGateV62()};
console.info('Issoire Connect V.62 release gate',BUILD);
})();
