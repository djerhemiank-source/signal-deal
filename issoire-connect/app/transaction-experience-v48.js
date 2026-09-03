(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const V='48.0';
const X={rows:[],loading:null,timer:null};
const $48=id=>document.getElementById(id);
const e48=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const euro48=v=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('fr-FR',{style:'currency',currency:'EUR'}):'—'};
const dt48=v=>{try{return v?new Date(v).toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'}):'—'}catch{return'—'}};
const STATUS={pending:'En attente',accepted:'Acceptée',ready:'Prête',completed:'Terminée',cancelled:'Annulée'};
const TYPE={order:'Commande',reservation:'Réservation',quote:'Demande de devis'};
const statusLabel=v=>STATUS[v]||v||'—';
const typeLabel=v=>TYPE[v]||v||'Transaction';

async function loadExperience(force=false){
 if(!S.session){X.rows=[];return X.rows}
 if(X.loading&&!force)return X.loading;
 X.loading=(async()=>{
   const {data,error}=await sb.rpc('ic_my_transaction_experience',{p_limit:50});
   if(error)throw error;
   X.rows=data||[];
   return X.rows;
 })();
 try{return await X.loading}finally{X.loading=null}
}

function reviewButton(r){
 if(!r.can_review)return'';
 const label=r.review_id?(r.review_verified?'⭐ Modifier mon avis vérifié':'⭐ Mettre à jour mon avis'):'⭐ Donner un avis vérifié';
 return `<button class="btn brand" onclick="openIc48VerifiedReview('${e48(r.order_id)}','${e48(r.business_id)}')">${label}</button>`;
}
function agendaButton(r){
 if(!r.can_add_agenda)return'';
 if(r.agenda_id)return `<button class="btn" onclick="go('agenda')">🗓 Voir dans mon agenda</button>`;
 return `<button class="btn" onclick="addIc48OrderToAgenda('${e48(r.order_id)}')">🗓 Ajouter le retrait à mon agenda</button>`;
}
function experienceCard(r){
 const review=r.review_id?`<span class="pill">${r.review_verified?'✅ Avis vérifié':'👤 Avis membre'}${r.review_rating?` · ${Number(r.review_rating)}/5`:''}</span>`:'';
 const deadline=r.reservation_expires_at?`<div class="notice" style="margin-top:9px"><b>🕒 Retrait au plus tard :</b> ${e48(dt48(r.reservation_expires_at))}</div>`:'';
 const actions=[reviewButton(r),agendaButton(r)].filter(Boolean).join('');
 return `<article class="card" data-ic-order="${e48(r.order_id)}" style="margin-top:9px;border-left:4px solid ${r.status==='completed'?'#188650':'#f47721'}"><div class="row between" style="gap:10px;align-items:flex-start"><div><span class="pill">${e48(typeLabel(r.order_type))}</span><h3 style="margin:7px 0 2px">${e48(r.business_name||'Professionnel')}</h3><div class="muted">${e48(r.item_label||r.business_category||'Transaction Issoire Connect')}</div></div><div style="text-align:right"><span class="status ${e48(r.status)}">${e48(statusLabel(r.status))}</span><div class="muted" style="margin-top:4px">${e48(dt48(r.updated_at))}</div></div></div>${Number(r.total)>0?`<div class="price" style="margin-top:8px">${e48(euro48(r.total))}</div>`:''}${deadline}<div style="margin-top:8px">${review}</div>${actions?`<div class="actions" style="margin-top:10px">${actions}</div>`:''}</article>`;
}

async function renderAccountExperience(){
 if(!S.session||S.page!=='account')return;
 const main=document.getElementById('main');if(!main)return;
 let host=$48('ic48TransactionExperience');
 if(!host){
   host=document.createElement('section');host.id='ic48TransactionExperience';host.style.margin='14px 0';
   const after=$48('ic47AccountMessages');
   if(after?.parentNode)after.insertAdjacentElement('afterend',host);else main.prepend(host);
 }
 host.innerHTML='<div class="card"><div class="muted">Chargement de vos achats et réservations…</div></div>';
 try{
   const rows=await loadExperience(true);
   if(!S.session||S.page!=='account'||!document.body.contains(host))return;
   const useful=rows.filter(r=>r.can_review||r.can_add_agenda).slice(0,12);
   if(!useful.length){host.remove();return}
   const completed=useful.filter(r=>r.can_review).length;
   host.innerHTML=`<div class="sectionhead" style="margin-top:0"><div><span class="pill">✅ APRÈS VOTRE TRANSACTION</span><h2 style="margin-top:7px">Achats, réservations & avis vérifiés</h2><p>${completed?`${completed} expérience(s) terminée(s) peuvent donner lieu à un avis vérifié.`:'Retrouvez ici les actions utiles liées à vos réservations.'}</p></div></div><div class="notice"><b>Un avis n’est “vérifié” qu’après une transaction réellement marquée Terminée.</b><br>Une réservation avec date limite de retrait peut aussi être ajoutée à votre agenda privé.</div><div class="cards" style="margin-top:10px">${useful.map(experienceCard).join('')}</div>`;
 }catch(err){host.innerHTML=`<div class="notice"><b>Impossible de charger le suivi de vos transactions.</b><br>${e48(err?.message||err)}</div>`}
}

async function focusOrder(orderId){
 if(!S.session)return false;
 if(S.page!=='account'&&typeof go==='function')go('account');
 for(let i=0;i<12;i++){
   if(S.page==='account')await renderAccountExperience();
   const card=[...document.querySelectorAll('[data-ic-order]')].find(el=>String(el.dataset.icOrder)===String(orderId));
   if(card){
     card.scrollIntoView({behavior:'smooth',block:'center'});
     const old=card.style.boxShadow;card.style.boxShadow='0 0 0 3px rgba(244,119,33,.35),0 10px 30px rgba(18,61,115,.15)';
     setTimeout(()=>{card.style.boxShadow=old},2600);
     return true;
   }
   await new Promise(r=>setTimeout(r,180));
 }
 return false;
}

function scheduleAccountExperience(delay=120){
 clearTimeout(X.timer);X.timer=setTimeout(()=>renderAccountExperience(),delay);
}

window.openIc48VerifiedReview=async function(orderId,businessId){
 if(!S.session)return typeof authModal==='function'?authModal('account'):null;
 try{if(window.icV47BusinessModalFix?.ensureBusiness)await window.icV47BusinessModalFix.ensureBusiness(businessId)}catch{}
 if(typeof window.openIc47ReviewForm!=='function')return typeof viewBusiness==='function'?viewBusiness(businessId):null;
 if(typeof say==='function')say('Cette transaction terminée rend votre avis vérifié.');
 return window.openIc47ReviewForm(businessId);
};

window.addIc48OrderToAgenda=async function(orderId){
 if(!S.session)return typeof authModal==='function'?authModal('account'):null;
 const {error}=await sb.rpc('ic_add_order_to_agenda',{p_order:orderId});
 if(error)return typeof say==='function'?say(error.message):null;
 if(typeof say==='function')say('Réservation ajoutée à votre agenda.');
 await loadExperience(true);
 if(S.page==='account')await renderAccountExperience();
};

function friendlyOrderError(err){
 const m=String(err?.message||err||'');
 if(m.includes('AUTH_REQUIRED'))return 'Connectez-vous pour modifier cette transaction.';
 if(m.includes('ORDER_NOT_FOUND'))return 'Transaction introuvable.';
 if(m.includes('INVALID_STATUS'))return 'Statut de transaction invalide.';
 if(m.includes('STATUS_TRANSITION_FORBIDDEN'))return 'Cette étape n’est pas autorisée depuis le statut actuel.';
 return m;
}
window.setOrder=async function(id,status){
 if(!S.session)return typeof authModal==='function'?authModal('account'):null;
 if(status==='cancelled'&&!confirm('Annuler cette commande ou réservation ?'))return;
 const {error}=await sb.rpc('ic_set_order_status',{p_order_id:id,p_status:status});
 if(error)return typeof say==='function'?say(friendlyOrderError(error)):null;
 if(typeof say==='function')say(`Statut : ${statusLabel(status)}.`);
 if(typeof loadPrivate==='function')await loadPrivate();
 X.rows=[];
 if(typeof render==='function')render();
 scheduleAccountExperience(180);
};

function proActions(o){
 const s=String(o.status||'pending');
 if(s==='pending')return `<button class="btn small" onclick="setOrder('${e48(o.id)}','accepted')">Accepter</button><button class="btn red small" onclick="setOrder('${e48(o.id)}','cancelled')">Annuler</button>`;
 if(s==='accepted')return `<button class="btn green small" onclick="setOrder('${e48(o.id)}','ready')">Prête</button><button class="btn red small" onclick="setOrder('${e48(o.id)}','cancelled')">Annuler</button>`;
 if(s==='ready')return `<button class="btn brand small" onclick="setOrder('${e48(o.id)}','completed')">✓ Terminée</button><button class="btn red small" onclick="setOrder('${e48(o.id)}','cancelled')">Annuler</button>`;
 return '';
}
window.ordersHtml=function(arr,pro=false){
 if(!Array.isArray(arr)||!arr.length)return '<div class="empty">Aucune commande ou réservation.</div>';
 return `<div class="cards">${arr.map(o=>`<article class="card"><div class="row between"><b>${e48(typeLabel(o.order_type))}</b><span class="status ${e48(o.status)}">${e48(statusLabel(o.status))}</span></div><div class="muted">${e48(dt48(o.created_at))}${o.reservation_expires_at?`<br>🕒 Retrait avant ${e48(dt48(o.reservation_expires_at))}`:''}</div>${Number(o.total)>0?`<div class="price">${e48(euro48(o.total))}</div>`:''}${o.note?`<p>${e48(o.note)}</p>`:''}${pro&&proActions(o)?`<div class="actions">${proActions(o)}</div>`:''}</article>`).join('')}</div>`;
};

const baseGo=window.go;
if(typeof baseGo==='function')window.go=function(page,...args){
 const r=baseGo.call(this,page,...args);
 if(page==='account')scheduleAccountExperience(180);
 return r;
};

const baseLoadPrivate=window.loadPrivate;
if(typeof baseLoadPrivate==='function')window.loadPrivate=async function(...args){
 const r=await baseLoadPrivate.apply(this,args);X.rows=[];if(S.page==='account')scheduleAccountExperience(120);return r;
};

const main=document.getElementById('main');
if(main){
 const observer=new MutationObserver(()=>{if(S.page==='account'&&!$48('ic48TransactionExperience'))scheduleAccountExperience(140)});
 observer.observe(main,{childList:true,subtree:false});
}
setTimeout(()=>{if(S.page==='account')scheduleAccountExperience(0)},300);

window.icV48={version:V,loadExperience,renderAccountExperience,focusOrder,statusLabel,typeLabel};
})();
