(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;

const esc46=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const byId=(rows,id)=>(rows||[]).find(x=>String(x?.id)===String(id));
const mergeBusiness=fresh=>{
 if(!fresh?.id)return fresh;
 const i=(S.businesses||[]).findIndex(x=>x.id===fresh.id);
 if(i>=0)Object.assign(S.businesses[i],fresh);else{S.businesses=S.businesses||[];S.businesses.push(fresh)}
 const j=(S.myBusinesses||[]).findIndex(x=>x.id===fresh.id);
 if(j>=0)Object.assign(S.myBusinesses[j],fresh);
 return i>=0?S.businesses[i]:fresh;
};

async function loadBusinessAuthority(id){
 const {data,error}=await sb.from('ic_businesses').select('id,owner_id,is_claimed,source,name,phone,website,plan,is_active').eq('id',id).maybeSingle();
 if(error)throw error;
 return mergeBusiness(data);
}
window.icV46LoadBusinessAuthority=loadBusinessAuthority;

// L'annuaire public charge beaucoup de fiches allégées. Avant d'ouvrir une fiche,
// on recharge uniquement l'autorité de contact de cette entreprise afin de ne
// jamais confondre « fiche revendiquée » et « fiche sans destinataire ».
const oldOpenDirectoryBusiness=window.openDirectoryBusiness;
if(typeof oldOpenDirectoryBusiness==='function')window.openDirectoryBusiness=async function(id){
 try{await loadBusinessAuthority(id)}catch(err){console.warn('IC V46 business authority',err?.message||err)}
 return oldOpenDirectoryBusiness(id);
};

// Même protection si une autre route ouvre directement une fiche entreprise.
const oldViewBusiness=window.viewBusiness;
if(typeof oldViewBusiness==='function')window.viewBusiness=function(id){
 const known=byId(S.businesses,id);
 if(known&&known.owner_id!==undefined)return oldViewBusiness(id);
 loadBusinessAuthority(id).then(()=>oldViewBusiness(id)).catch(()=>oldViewBusiness(id));
};

function publicContactHtml(b){
 const phone=String(b?.phone||'').trim();
 let site='';
 try{if(b?.website){const u=new URL(/^https?:\/\//i.test(b.website)?b.website:'https://'+b.website);if(/^https?:$/.test(u.protocol))site=u.href}}catch{}
 const actions=[];
 if(phone)actions.push(`<a class="btn brand" href="tel:${esc46(phone.replace(/[^\d+]/g,''))}">☎ Appeler</a>`);
 if(site)actions.push(`<a class="btn" href="${esc46(site)}" target="_blank" rel="noopener">🌐 Site internet</a>`);
 if(!b?.owner_id&&b?.source==='sirene_officiel'&&!b?.is_claimed&&typeof window.openClaimBusiness==='function')actions.push(`<button class="btn" onclick="closeModal();openClaimBusiness('${esc46(b.id)}')">🏪 C’est mon entreprise</button>`);
 return actions.join('');
}

// Un clic « message » ne doit jamais mener à un formulaire sans destinataire.
const oldMessageBusiness=window.messageBusiness;
if(typeof oldMessageBusiness==='function')window.messageBusiness=async function(id){
 let b=byId(S.businesses,id);
 if(!b||b.owner_id===undefined){try{b=await loadBusinessAuthority(id)}catch{}}
 if(!b)return typeof say==='function'?say('Établissement introuvable.'):null;
 if(!b.owner_id){
   const actions=publicContactHtml(b)||'<button class="btn" onclick="closeModal()">Fermer</button>';
   return openModal(`<h2>💬 Contacter ${esc46(b.name||'ce professionnel')}</h2><div class="notice"><b>Messagerie Issoire Connect non disponible pour cette fiche.</b><br>Aucun compte professionnel n’est encore relié à cet établissement.</div><p>Utilisez ses coordonnées publiques${b?.source==='sirene_officiel'&&!b?.is_claimed?' ou revendiquez la fiche si vous représentez cette entreprise':''}.</p><div class="actions">${actions}</div>`);
 }
 return oldMessageBusiness(id);
};

// Les anciennes cartes peuvent encore contenir un bouton de réservation alors
// que l'offre n'est pas réservable. V46 remplace ce CTA par une action honnête.
function syncReservationButtons(root=document){
 root.querySelectorAll?.('[onclick*="reserveOffer("]').forEach(btn=>{
   const m=(btn.getAttribute('onclick')||'').match(/reserveOffer\('([^']+)'\)/);if(!m)return;
   const offer=byId(S.offers,m[1]);if(!offer||offer.reservation_enabled===true)return;
   const b=byId(S.businesses,offer.business_id);
   if(b){btn.setAttribute('onclick',`viewBusiness('${b.id}')`);btn.textContent='Voir le professionnel';btn.title='Cette offre ne propose pas de réservation en ligne.'}
   else{btn.removeAttribute('onclick');btn.disabled=true;btn.textContent='Réservation indisponible'}
 });
}
const observer=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)syncReservationButtons(n)});
observer.observe(document.body,{childList:true,subtree:true});
setTimeout(()=>syncReservationButtons(document),100);

// ---------------------------------------------------------------------------
// Administration V46 : revue des fiches similaires, sans suppression automatique.
// Même nom + même adresse ne signifie pas nécessairement même entité juridique.
// ---------------------------------------------------------------------------
function relatedCount(b){return ['products','offers','jobs','messages','orders','followers','claims'].reduce((n,k)=>n+Number(b?.[k]||0),0)}
function duplicateBusinessCard(b){
 const linked=relatedCount(b),protectedRow=!!b.owner_id||!!b.is_claimed||linked>0;
 return `<article class="card" style="margin:8px 0"><div class="row between"><div><span class="pill">${protectedRow?'🔴 LIENS À PRÉSERVER':'⚪ SANS LIEN'}</span><h3 style="margin:7px 0 2px">${esc46(b.name||'Entreprise')}</h3></div><span class="pill">${esc46(b.naf_code||'NAF ?')}</span></div><div class="muted">SIRET : <b>${esc46(b.siret||'—')}</b><br>SIREN : ${esc46(b.siren||'—')}<br>Activité : ${esc46(b.category||'—')}<br>Source : ${esc46(b.source||'—')} · ${b.owner_id?'compte professionnel lié':'aucun propriétaire lié'}</div><div class="notice" style="margin-top:8px">Produits/services : <b>${Number(b.products||0)}</b> · Avantages : <b>${Number(b.offers||0)}</b> · Emplois : <b>${Number(b.jobs||0)}</b><br>Messages : <b>${Number(b.messages||0)}</b> · Commandes : <b>${Number(b.orders||0)}</b> · Abonnés : <b>${Number(b.followers||0)}</b> · Revendications : <b>${Number(b.claims||0)}</b></div></article>`;
}
async function renderDuplicateReview(){
 const host=document.getElementById('icOwnerAdminBody');if(!host)return;
 host.innerHTML='<div class="empty">Analyse des fiches similaires…</div>';
 const {data,error}=await sb.rpc('ic_admin_duplicate_business_candidates',{p_limit:150});
 if(error){host.innerHTML=`<div class="notice"><b>Impossible de charger la revue.</b><br>${esc46(error.message)}</div>`;return}
 const groups=data||[];
 host.innerHTML=`<div class="sectionhead"><div><h2>🧬 Fiches similaires à vérifier</h2><p><b>${groups.length}</b> groupe(s) avec le même nom et la même adresse.</p></div></div><div class="notice"><b>Aucune suppression automatique.</b><br>Deux fiches identiques visuellement peuvent avoir des SIRET et des activités NAF différents : exploitant, propriétaire des murs, ancienne/nouvelle société, etc. Une fiche reliée à un compte ou à de l’activité doit toujours être préservée.</div>${groups.length?groups.map(g=>{const rows=Array.isArray(g.businesses)?g.businesses:[];const sirets=new Set(rows.map(x=>x.siret).filter(Boolean));const nafs=new Set(rows.map(x=>x.naf_code).filter(Boolean));const legal=sirets.size>1?'SIRET distincts':sirets.size===1?'Même SIRET':'SIRET incomplet';const activity=nafs.size>1?'activités NAF différentes':'activité NAF identique ou proche';return `<section class="card" style="margin:12px 0;border-left:4px solid #f47721"><div class="row between"><div><span class="pill">${Number(g.candidate_count||rows.length)} FICHES</span><h3 style="margin:7px 0 2px">${esc46(g.display_name)}</h3><div class="muted">${esc46(g.display_address||'')} ${esc46(g.postal_code||'')}</div></div><span class="pill">⚠️ À VÉRIFIER</span></div><p><b>${esc46(legal)}</b> · ${esc46(activity)}.</p>${rows.map(duplicateBusinessCard).join('')}</section>`}).join(''):'<div class="empty">Aucune fiche similaire détectée.</div>'}`;
}
function injectDuplicateTab(active){
 const activity=[...document.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes("openIcOwnerAdmin('activity')"));
 if(!activity)return;
 let btn=document.getElementById('icV46DuplicateTab');
 if(!btn){btn=document.createElement('button');btn.id='icV46DuplicateTab';btn.className='btn';btn.textContent='🧬 Fiches similaires';btn.onclick=()=>window.openIcOwnerAdmin('duplicates');activity.insertAdjacentElement('afterend',btn)}
 btn.classList.toggle('brand',active==='duplicates');
 if(active==='duplicates')document.querySelectorAll("button[onclick*='openIcOwnerAdmin']").forEach(b=>{if(b.id!=='icV46DuplicateTab')b.classList.remove('brand')});
}
const oldOwnerAdmin=window.openIcOwnerAdmin;
if(typeof oldOwnerAdmin==='function')window.openIcOwnerAdmin=async function(tab='users'){
 const base=tab==='duplicates'?'businesses':tab;
 const result=await oldOwnerAdmin(base);
 injectDuplicateTab(tab);
 if(tab==='duplicates')await renderDuplicateReview();
 return result;
};

window.icV46Reliability={version:'46.0',loadBusinessAuthority,syncReservationButtons,renderDuplicateReview};
})();