(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const _loadPrivateModeration=loadPrivate;
const _accountPageModeration=accountPage;
const _adminAccountModeration=window.adminAccount;
const _businessCardModeration=typeof businessCard==='function'?businessCard:null;
const _offerCardModeration=typeof offerCard==='function'?offerCard:null;
const _productCardModeration=typeof productCard==='function'?productCard:null;
const _classifiedCardModeration=typeof classifiedCard==='function'?classifiedCard:null;
const _jobCardModeration=typeof jobCard==='function'?jobCard:null;
const _eventCardModeration=typeof eventCard==='function'?eventCard:null;
const _viewBusinessModeration=typeof viewBusiness==='function'?viewBusiness:null;
const _openMessageThreadModeration=window.openMessageThread;
S.myReports=S.myReports||[];S.adminReports=S.adminReports||[];
const uid=()=>S.session?.user?.id||null;
const REASONS=[['spam','Spam / publicité abusive'],['fraud','Fraude ou information trompeuse'],['inappropriate','Contenu inapproprié'],['outdated','Information obsolète'],['other','Autre']];
const LABELS={business:'Commerce',offer:'Offre',product:'Produit / service',job:'Emploi',classified:'Annonce',event:'Événement',message:'Message privé'};
const disableable=t=>['business','offer','product','job','classified','event'].includes(t);

loadPrivate=async function(){
 await _loadPrivateModeration();
 if(!S.session){S.myReports=[];S.adminReports=[];return}
 const mine=await sb.from('ic_reports').select('*').eq('reporter_id',uid()).order('created_at',{ascending:false}).limit(50);
 S.myReports=Array.isArray(mine.data)?mine.data:[];
 if(S.profile?.role==='admin'){
  const a=await sb.from('ic_reports').select('*').in('status',['pending','reviewed']).order('created_at',{ascending:true}).limit(100);
  S.adminReports=Array.isArray(a.data)?a.data:[];
 }else S.adminReports=[];
};

function ownTarget(type,id){
 if(type==='business')return (S.myBusinesses||[]).some(x=>x.id===id);
 if(type==='classified')return (S.classifieds||[]).some(x=>x.id===id&&x.user_id===uid());
 if(['offer','product','job','event'].includes(type)){const row=(type==='offer'?S.offers:type==='product'?S.products:type==='job'?S.jobs:S.events||[]).find?.(x=>x.id===id);return !!row&&(S.myBusinesses||[]).some(b=>b.id===row.business_id)}
 return false;
}
function reportButton(type,id){if(!id||ownTarget(type,id))return '';return `<button class="btn" onclick="event.stopPropagation();openReport('${E(type)}','${E(id)}')">⚑ Signaler</button>`}
function withReport(html,type,id){if(!html||html.includes(`openReport('${type}','${id}')`))return html;return html.replace('</article>',`<div class="actions" style="margin-top:8px">${reportButton(type,id)}</div></article>`)}
if(_businessCardModeration)businessCard=function(x){return withReport(_businessCardModeration(x),'business',x?.id)};
if(_offerCardModeration)offerCard=function(x){return withReport(_offerCardModeration(x),'offer',x?.id)};
if(_productCardModeration)productCard=function(x){return withReport(_productCardModeration(x),'product',x?.id)};
if(_classifiedCardModeration)classifiedCard=function(x){return withReport(_classifiedCardModeration(x),'classified',x?.id)};
if(_jobCardModeration)jobCard=function(x){return withReport(_jobCardModeration(x),'job',x?.id)};
if(_eventCardModeration)eventCard=function(x){return withReport(_eventCardModeration(x),'event',x?.id)};
if(_viewBusinessModeration)viewBusiness=function(id){const out=_viewBusinessModeration(id);const b=(S.businesses||[]).find(x=>x.id===id);if(b&&modalBody&&!ownTarget('business',id)&&!modalBody.innerHTML.includes(`openReport('business','${id}')`))modalBody.insertAdjacentHTML('beforeend',`<div class="actions" style="margin-top:12px">${reportButton('business',id)}</div>`);return out};

window.openReport=function(type,id){
 if(!S.session){say('Connectez-vous pour envoyer un signalement.');authModal('account');return}
 if(ownTarget(type,id))return say('Vous ne pouvez pas signaler votre propre contenu.');
 const options=REASONS.map(([v,l])=>`<option value="${v}">${E(l)}</option>`).join('');
 openModal(`<h2>⚑ Signaler — ${E(LABELS[type]||'Contenu')}</h2><p class="muted">Le signalement est transmis à la modération Issoire Connect. Pour un message privé, seul le message signalé est joint au dossier.</p><div class="form"><label>Motif</label><select id="rpReason">${options}</select><label>Précisions (facultatif)</label><textarea id="rpDetails" rows="5" maxlength="2000" placeholder="Expliquez ce qui pose problème."></textarea><button id="rpSend" class="btn brand" onclick="submitReport('${E(type)}','${E(id)}')">Envoyer le signalement</button></div>`)
};
window.submitReport=async function(type,id){if(!S.session)return;const btn=$('#rpSend');if(btn){btn.disabled=true;btn.textContent='Envoi…'}const {data,error}=await sb.rpc('ic_submit_report',{p_target_type:type,p_target_id:id,p_reason:$('#rpReason')?.value||'other',p_details:$('#rpDetails')?.value.trim()||null});if(error){if(btn){btn.disabled=false;btn.textContent='Envoyer le signalement'}const m=String(error.message||error).replaceAll('_',' ');return say(/already reported/i.test(m)?'Vous avez déjà signalé ce contenu.':m)}const row=Array.isArray(data)?data[0]:data;S.myReports=[row,...(S.myReports||[])];closeModal();say('Signalement envoyé à la modération.')};

if(_openMessageThreadModeration)window.openMessageThread=async function(type,contextId,otherId){const out=await _openMessageThreadModeration(type,contextId,otherId);if(!S.session||!modalBody)return out;const received=(S.privateMessages||[]).filter(m=>(type==='classified'?m.classified_id===contextId:m.business_id===contextId)&&m.sender_id===otherId&&m.recipient_id===uid()).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));if(received.length){const opts=received.slice(0,20).map(m=>`<option value="${E(m.message_id)}">${E(new Date(m.created_at).toLocaleString('fr-FR'))} — ${E(String(m.body||'').slice(0,80))}</option>`).join('');modalBody.insertAdjacentHTML('beforeend',`<details style="margin-top:12px"><summary>⚑ Signaler un message reçu</summary><div class="form" style="margin-top:8px"><select id="reportMessageId">${opts}</select><button class="btn" onclick="openReport('message',$('#reportMessageId').value)">Signaler ce message</button></div></details>`)}return out};

function reportStatus(s){return s==='actioned'?'✅ Action prise':s==='dismissed'?'↩ Ignoré':s==='reviewed'?'👀 Examiné':'⏳ En attente'}
function myReportsSection(){const rows=S.myReports||[];return `<div class="sectionhead"><div><h2>⚑ Mes signalements</h2><p>Suivez les contenus que vous avez transmis à la modération.</p></div><span class="pill">${rows.length}</span></div>${rows.length?`<div class="cards">${rows.slice(0,10).map(r=>`<article class="card"><div class="row between"><span class="pill">${E(reportStatus(r.status))}</span><span class="muted">${E(LABELS[r.target_type]||r.target_type)}</span></div><h3>${E(r.target_label)}</h3><div class="muted">${new Date(r.created_at).toLocaleString('fr-FR')}</div>${r.admin_note?`<p>${E(r.admin_note)}</p>`:''}</article>`).join('')}</div>`:'<div class="empty">Aucun signalement envoyé.</div>'}`}

function snapshot(r){const s=r.target_snapshot||{};if(r.target_type==='message')return `<div class="notice"><b>Message signalé</b><p>${E(s.body||'')}</p><div class="muted">${s.created_at?new Date(s.created_at).toLocaleString('fr-FR'):''}</div></div>`;const bits=[];if(s.address)bits.push(s.address);if(s.city)bits.push(s.city);if(s.offer_type)bits.push(s.offer_type);if(s.kind)bits.push(s.kind);return bits.length?`<div class="muted">${E(bits.join(' · '))}</div>`:''}
function adminReportCard(r){return `<article class="card" style="margin-bottom:10px"><div class="row between"><span class="pill">${E(reportStatus(r.status))}</span><span class="pill">${E(LABELS[r.target_type]||r.target_type)}</span></div><h3>${E(r.target_label)}</h3><p><b>Motif :</b> ${E(REASONS.find(x=>x[0]===r.reason)?.[1]||r.reason)}</p>${r.details?`<div class="notice">${E(r.details)}</div>`:''}${snapshot(r)}<div class="muted" style="margin-top:6px">Signalé le ${new Date(r.created_at).toLocaleString('fr-FR')}</div><div class="actions" style="margin-top:8px"><button class="btn" onclick="reviewReport('${E(r.id)}','reviewed',false)">👀 Examiné</button><button class="btn" onclick="reviewReport('${E(r.id)}','dismissed',false)">↩ Ignorer</button>${disableable(r.target_type)?`<button class="btn brand" onclick="reviewReport('${E(r.id)}','actioned',true)">🚫 Masquer le contenu</button>`:''}</div></article>`}
window.reviewReport=function(id,status,disable){openModal(`<h2>Modération du signalement</h2><p>${disable?'Le contenu sera désactivé et ne sera plus visible publiquement.':'Le contenu restera inchangé.'}</p><div class="form"><label>Note administrative (facultatif)</label><textarea id="reportAdminNote" rows="4" maxlength="1000"></textarea><button class="btn brand" onclick="confirmReviewReport('${E(id)}','${E(status)}',${disable?'true':'false'})">Confirmer</button></div>`)};
window.confirmReviewReport=async function(id,status,disable){const {data,error}=await sb.rpc('ic_review_report',{p_report_id:id,p_status:status,p_admin_note:$('#reportAdminNote')?.value.trim()||null,p_disable_target:!!disable});if(error)return say(String(error.message||error).replaceAll('_',' '));const row=Array.isArray(data)?data[0]:data;S.adminReports=(S.adminReports||[]).filter(x=>x.id!==id);closeModal();say(disable?'Contenu masqué et signalement traité.':'Signalement mis à jour.');await refresh();return row};
function adminReportsSection(){const rows=S.adminReports||[];return `<div class="sectionhead"><div><h2>⚑ Signalements à traiter</h2><p>Modération des contenus signalés. Les conversations privées ne sont pas consultables hors d’un message explicitement signalé.</p></div><span class="pill">${rows.length}</span></div>${rows.length?rows.map(adminReportCard).join(''):'<div class="empty">Aucun signalement en attente.</div>'}`}

window.adminAccount=function(){const out=_adminAccountModeration?.();if(S.session&&S.profile?.role==='admin'){try{main.insertAdjacentHTML('beforeend',adminReportsSection())}catch(e){console.error('Issoire Connect admin moderation',e)}}return out};
accountPage=function(){const out=_accountPageModeration();if(S.session&&S.profile?.role!=='admin'){try{main.insertAdjacentHTML('beforeend',myReportsSection())}catch(e){console.error('Issoire Connect reports account',e)}}return out};
})();
