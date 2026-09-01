(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const M={reports:[]};
const REASONS={spam:'Spam / publicité abusive',fraud:'Fraude / arnaque suspectée',inappropriate:'Contenu inapproprié',outdated:'Information obsolète ou erronée',other:'Autre'};
const TARGETS={business:{table:'ic_businesses',label:'Entreprise'},classified:{table:'ic_classifieds',label:'Annonce'}};
const DISABLE_TABLE={business:'ic_businesses',offer:'ic_offers',product:'ic_products',job:'ic_jobs',classified:'ic_classifieds',event:'ic_events'};
function e(v){return typeof esc==='function'?esc(String(v??'')):String(v??'')}
function admin(){return !!(S.session&&S.profile?.role==='admin')}
function statusBadge(s){return `<span class="pill">${s==='pending'?'🟠 En attente':s==='reviewed'?'🔵 Examiné':s==='actioned'?'🔴 Action effectuée':'⚪ Ignoré'}</span>`}
async function targetSnapshot(type,id,label){
 try{
  if(type==='business'){
   const {data}=await sb.from('ic_businesses').select('id,name,category,address,city,postal_code,siret,is_active').eq('id',id).maybeSingle();
   return data||{label};
  }
  if(type==='classified'){
   const {data}=await sb.from('ic_classifieds').select('id,kind,title,description,price,price_label,city,is_active').eq('id',id).maybeSingle();
   return data||{label};
  }
 }catch{}
 return {label};
}
window.openReportContent=async function(type,id,label='Contenu'){
 if(!S.session)return authModal('account');
 if(!TARGETS[type])return say('Ce type de contenu ne peut pas être signalé ici.');
 const {data:existing,error}=await sb.from('ic_reports').select('id').eq('reporter_id',S.session.user.id).eq('target_type',type).eq('target_id',id).eq('status','pending').limit(1);
 if(error)return say(error.message);
 if(existing?.length)return say('Vous avez déjà un signalement en attente pour ce contenu.');
 openModal(`<h2>🚩 Signaler ce contenu</h2><p><b>${e(label)}</b></p><div class="notice">Le signalement est envoyé uniquement à l’administration d’Issoire Connect. Il ne supprime pas automatiquement le contenu.</div><label>Motif</label><select id="reportReason">${Object.entries(REASONS).map(([v,l])=>`<option value="${v}">${e(l)}</option>`).join('')}</select><label>Détails — facultatif</label><textarea id="reportDetails" rows="5" maxlength="2000" placeholder="Expliquez brièvement le problème constaté."></textarea><button id="reportSendBtn" class="btn brand" onclick="submitContentReport('${e(type)}','${e(id)}','${e(label).replace(/'/g,'&#39;')}')">🚩 Envoyer le signalement</button>`);
};
window.submitContentReport=async function(type,id,label){
 if(!S.session)return authModal('account');
 const reason=document.getElementById('reportReason')?.value||'other',details=document.getElementById('reportDetails')?.value.trim()||null;
 const btn=document.getElementById('reportSendBtn');if(btn){btn.disabled=true;btn.textContent='Envoi…'}
 const snapshot=await targetSnapshot(type,id,label);
 const {error}=await sb.from('ic_reports').insert({reporter_id:S.session.user.id,target_type:type,target_id:id,target_label:label,target_snapshot:snapshot,reason,details,status:'pending'});
 if(error){if(btn){btn.disabled=false;btn.textContent='🚩 Envoyer le signalement'}return say(error.message)}
 closeModal();say('Signalement envoyé à l’administration. Merci.');
};
function decorateClassifiedReports(){
 document.querySelectorAll('article.ic-public-ad').forEach(card=>{
  if(card.querySelector('[data-report-classified]'))return;
  const contact=[...card.querySelectorAll('button')].find(b=>/openClassifiedContact/.test(b.getAttribute('onclick')||''));
  if(!contact)return;
  const m=(contact.getAttribute('onclick')||'').match(/openClassifiedContact\('([^']+)'\)/);if(!m)return;
  const id=m[1],label=card.querySelector('h3')?.textContent?.trim()||'Petite annonce';
  const b=document.createElement('button');b.className='btn';b.dataset.reportClassified='1';b.textContent='🚩 Signaler';b.onclick=()=>openReportContent('classified',id,label);
  contact.parentElement?.appendChild(b);
 });
}
if(typeof renderPublicClassifieds==='function'){
 const _renderPublicClassifieds=renderPublicClassifieds;
 window.renderPublicClassifieds=async function(...args){const r=await _renderPublicClassifieds(...args);decorateClassifiedReports();return r};
}
if(typeof viewBusiness==='function'){
 const _viewBusinessModeration=viewBusiness;
 window.viewBusiness=function(id){
  const r=_viewBusinessModeration(id);
  const b=(S.businesses||[]).find(x=>x.id===id)||(S.myBusinesses||[]).find(x=>x.id===id);
  setTimeout(()=>{
   if(!b||!window.modalBody||modalBody.querySelector('[data-report-business]'))return;
   modalBody.insertAdjacentHTML('beforeend',`<div class="actions" style="margin-top:10px"><button class="btn" data-report-business="1" onclick="openReportContent('business','${e(id)}','${e(b.name||'Entreprise').replace(/'/g,'&#39;')}')">🚩 Signaler une erreur / un problème</button></div>`);
  },0);
  return r;
 };
}
async function loadReports(){
 if(!admin())return [];
 const {data,error}=await sb.from('ic_reports').select('*').order('created_at',{ascending:false}).limit(150);
 if(error)throw error;M.reports=data||[];return M.reports;
}
function moderationCard(r){
 const canDisable=!!DISABLE_TABLE[r.target_type]&&r.status!=='actioned';
 return `<article class="card"><div class="row between"><div>${statusBadge(r.status)}<h3 style="margin-top:7px">${e(r.target_label)}</h3></div><span class="pill">${e(r.target_type)}</span></div><div class="muted">${new Date(r.created_at).toLocaleString('fr-FR')} · ${e(REASONS[r.reason]||r.reason)}</div>${r.details?`<p>${e(r.details)}</p>`:'<p class="muted">Aucun détail supplémentaire.</p>'}${r.admin_note?`<div class="notice"><b>Note admin :</b> ${e(r.admin_note)}</div>`:''}<div class="actions"><button class="btn brand" onclick="openReportReview('${e(r.id)}')">👁 Examiner</button>${canDisable?`<button class="btn" onclick="confirmDisableReportedContent('${e(r.id)}')">⛔ Désactiver le contenu</button>`:''}</div></article>`;
}
window.openReportsAdmin=async function(){
 if(!admin())return say('Accès administrateur requis.');
 main.innerHTML='<div class="sectionhead"><div><span class="pill">👑 ADMIN</span><h2 style="margin-top:8px">🚨 Signalements & modération</h2><p>Chargement…</p></div><button class="btn" onclick="adminAccount()">← Administration</button></div><div class="empty">Chargement des signalements…</div>';
 try{await loadReports()}catch(err){main.innerHTML=`<div class="notice">Erreur : ${e(err.message||err)}</div>`;return}
 const pending=M.reports.filter(r=>r.status==='pending').length;
 main.innerHTML=`<div class="sectionhead"><div><span class="pill">👑 ADMIN</span><h2 style="margin-top:8px">🚨 Signalements & modération</h2><p>${pending} en attente · ${M.reports.length} signalement(s) affiché(s)</p></div><button class="btn" onclick="adminAccount()">← Administration</button></div>${M.reports.length?`<div class="cards">${M.reports.map(moderationCard).join('')}</div>`:'<div class="empty">Aucun signalement pour le moment.</div>'}`;
};
window.openReportReview=function(id){
 if(!admin())return;const r=M.reports.find(x=>x.id===id);if(!r)return say('Signalement introuvable.');
 openModal(`<h2>👁 Examiner le signalement</h2><p><b>${e(r.target_label)}</b></p><div class="notice">${e(REASONS[r.reason]||r.reason)}${r.details?'<br>'+e(r.details):''}</div><label>Décision</label><select id="reviewStatus"><option value="reviewed" ${r.status==='reviewed'?'selected':''}>Examiné</option><option value="dismissed" ${r.status==='dismissed'?'selected':''}>Ignoré / non fondé</option><option value="actioned" ${r.status==='actioned'?'selected':''}>Action effectuée</option><option value="pending" ${r.status==='pending'?'selected':''}>Remettre en attente</option></select><label>Note administrateur — facultative</label><textarea id="reviewNote" rows="4" maxlength="2000">${e(r.admin_note||'')}</textarea><button class="btn brand" onclick="saveReportReview('${e(id)}')">💾 Enregistrer</button>`);
};
window.saveReportReview=async function(id){
 if(!admin())return;const status=document.getElementById('reviewStatus')?.value||'reviewed',admin_note=document.getElementById('reviewNote')?.value.trim()||null;
 const payload={status,admin_note,reviewed_by:S.session.user.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
 if(status==='pending'){payload.reviewed_by=null;payload.reviewed_at=null}
 const {error}=await sb.from('ic_reports').update(payload).eq('id',id);if(error)return say(error.message);closeModal();say('Signalement mis à jour.');openReportsAdmin();
};
window.confirmDisableReportedContent=function(id){
 if(!admin())return;const r=M.reports.find(x=>x.id===id);if(!r)return;openModal(`<h2>⛔ Désactiver ce contenu ?</h2><p><b>${e(r.target_label)}</b></p><div class="notice">Le contenu sera rendu invisible mais pas supprimé. Vous pourrez le réactiver depuis l’administration.</div><div class="actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn primary" onclick="disableReportedContent('${e(id)}')">Désactiver</button></div>`);
};
window.disableReportedContent=async function(id){
 if(!admin())return;const r=M.reports.find(x=>x.id===id),table=r&&DISABLE_TABLE[r.target_type];if(!r||!table)return say('Ce contenu ne peut pas être désactivé automatiquement.');
 const {error}=await sb.from(table).update({is_active:false}).eq('id',r.target_id);if(error)return say(error.message);
 const {error:reportError}=await sb.from('ic_reports').update({status:'actioned',admin_note:r.admin_note||'Contenu désactivé depuis la file de modération.',reviewed_by:S.session.user.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);
 if(reportError)return say(reportError.message);closeModal();say('Contenu désactivé et signalement traité.');try{if(typeof refresh==='function')await refresh()}catch{};openReportsAdmin();
};
if(typeof adminAccount==='function'){
 const _adminAccountModeration=adminAccount;
 window.adminAccount=function(...args){
  const r=_adminAccountModeration(...args);
  if(admin())setTimeout(()=>{if(document.getElementById('adminModerationShortcut'))return;const head=main.querySelector('.sectionhead');if(head)head.insertAdjacentHTML('afterend','<div id="adminModerationShortcut" class="actions" style="margin:10px 0"><button class="btn brand" onclick="openReportsAdmin()">🚨 Signalements & modération</button></div>')},0);
  return r;
 };
}
})();
