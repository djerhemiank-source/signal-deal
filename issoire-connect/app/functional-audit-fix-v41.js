(()=>{
'use strict';
if(typeof window==='undefined'||typeof S==='undefined'||typeof sb==='undefined')return;
const RADII=[1,5,10,20,50];
const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'');
const byId=(arr,id)=>(arr||[]).find(x=>String(x.id)===String(id));
const businessForProduct=id=>{const p=byId(S.products,id);return p?byId(S.businesses,p.business_id):null};
const businessForOffer=id=>{const o=byId(S.offers,id);return o?byId(S.businesses,o.business_id):null};
const businessForJob=id=>{const j=byId(S.jobs,id);return j?byId(S.businesses,j.business_id):null};
const isOwn=owner=>!!(owner&&S.session?.user?.id===owner);
function friendly(err){
 const raw=String(err?.message||err||'Une erreur est survenue.'),m=raw.toLowerCase();
 if(m.includes('authentication')||m.includes('auth_required'))return 'Connectez-vous pour effectuer cette action.';
 if(m.includes('recipient not found'))return 'Ce professionnel n’a pas encore activé sa messagerie Issoire Connect.';
 if(m.includes('cannot message yourself'))return 'Vous ne pouvez pas vous envoyer un message à vous-même.';
 if(m.includes('invalid message')||m.includes('message_required'))return 'Écrivez un message avant de l’envoyer.';
 if(m.includes('offer unavailable'))return 'Cette offre n’est pas réservable en ligne actuellement.';
 if(m.includes('stock insuffisant'))return 'La quantité demandée n’est plus disponible.';
 if(m.includes('commandes et devis')||m.includes('réservations en ligne nécessitent'))return 'Ce professionnel n’a pas activé les commandes/réservations en ligne pour cette offre.';
 if(m.includes('status_transition_forbidden'))return 'Ce changement de statut n’est pas autorisé à cette étape.';
 if(m.includes('order_not_found'))return 'Commande introuvable.';
 if(m.includes('not_owner'))return 'Cette action est réservée au propriétaire de l’établissement.';
 if(m.includes('pro 360 requis'))return 'Cette fonction nécessite l’abonnement Pro 360.';
 if(m.includes('duplicate')||m.includes('23505'))return 'Cette action a déjà été enregistrée.';
 return raw;
}
function messageUnavailable(b){
 const phone=b?.phone?`<a class="btn" href="tel:${e(b.phone)}">📞 Appeler</a>`:'';
 const web=b?.website&&/^https?:\/\//i.test(b.website)?`<a class="btn brand" href="${e(b.website)}" target="_blank" rel="noopener">🌐 Site internet</a>`:'';
 openModal(`<h2>💬 Messagerie Issoire Connect</h2><div class="notice"><b>${e(b?.name||'Ce professionnel')}</b> n’a pas encore de compte destinataire relié à cette fiche.</div><p class="muted">La fiche reste consultable. Utilisez les coordonnées publiques disponibles ou, si vous représentez cet établissement, revendiquez la fiche.</p><div class="actions">${phone}${web}${!phone&&!web?'<button class="btn" onclick="closeModal()">Fermer</button>':''}</div>`);
}

// ---- Messagerie entreprise : jamais de bouton qui promet un envoi sans destinataire.
const oldMessageBusiness=window.messageBusiness;
window.messageBusiness=function(id){
 const b=byId(S.businesses,id);if(!b)return typeof say==='function'&&say('Établissement introuvable.');
 if(!b.owner_id)return messageUnavailable(b);
 if(isOwn(b.owner_id))return typeof say==='function'&&say('C’est votre propre établissement.');
 if(typeof oldMessageBusiness==='function')return oldMessageBusiness(id);
};
window.sendMessageBusiness=async function(id){
 if(!S.session)return typeof authModal==='function'?authModal('account'):null;
 const b=byId(S.businesses,id);if(!b?.owner_id)return messageUnavailable(b);
 if(isOwn(b.owner_id))return say('Vous ne pouvez pas vous envoyer un message à vous-même.');
 const body=document.getElementById('msgBody')?.value.trim()||'';if(!body)return say('Écrivez votre message.');
 const btn=document.querySelector('#modalBody button[onclick*="sendMessageBusiness"]');if(btn){btn.disabled=true;btn.textContent='Envoi…'}
 try{const {error}=await sb.rpc('ic_send_message',{p_body:body,p_business_id:id,p_classified_id:null});if(error)return say(friendly(error));closeModal();say('Message envoyé.');if(typeof loadPrivate==='function')await loadPrivate();}
 finally{if(btn){btn.disabled=false;btn.textContent='Envoyer'}}
};

// ---- Messagerie petites annonces : actif, non propriétaire, message non vide.
const oldMessageClassified=window.messageClassified;
window.messageClassified=function(id){
 const c=byId(S.classifieds,id);if(!c||c.is_active===false)return say('Cette annonce n’est plus disponible.');
 if(S.session&&c.user_id===S.session.user.id)return say('C’est votre propre annonce.');
 return typeof oldMessageClassified==='function'?oldMessageClassified(id):null;
};
window.sendMessageClassified=async function(id){
 if(!S.session)return typeof authModal==='function'?authModal('account'):null;
 const c=byId(S.classifieds,id);if(!c||c.is_active===false)return say('Cette annonce n’est plus disponible.');
 if(c.user_id===S.session.user.id)return say('C’est votre propre annonce.');
 const body=document.getElementById('msgBody')?.value.trim()||'';if(!body)return say('Écrivez votre message.');
 const {error}=await sb.rpc('ic_send_message',{p_body:body,p_business_id:null,p_classified_id:id});if(error)return say(friendly(error));closeModal();say('Message envoyé.');if(typeof loadPrivate==='function')await loadPrivate();
};
window.sendReply=async function(id){const body=document.getElementById('reply')?.value.trim()||'';if(!body)return say('Écrivez votre réponse.');const {error}=await sb.rpc('ic_reply_message',{p_message_id:id,p_body:body});if(error)return say(friendly(error));closeModal();say('Réponse envoyée.');if(typeof loadPrivate==='function')await loadPrivate();if(typeof render==='function')render();};

// ---- Offres : le bouton Réserver n’existe que si le commerçant a réellement activé la réservation.
const oldOfferCard=window.offerCard;
window.offerCard=function(o){
 let h=typeof oldOfferCard==='function'?oldOfferCard(o):'';
 const b=byId(S.businesses,o?.business_id),canReserve=o?.reservation_enabled===true&&o?.is_active!==false&&(!o.ends_at||new Date(o.ends_at)>new Date())&&(o.quantity==null||Number(o.quantity)>0);
 if(!canReserve){
   h=h.replace(/<button[^>]*onclick="reserveOffer\('([^']+)'\)"[^>]*>[^<]*<\/button>/g,b?`<button class="btn" onclick="viewBusiness('${e(b.id)}')">Voir le professionnel</button>`:'');
 }
 return h;
};
window.reserveOffer=function(id){
 if(!S.session){if(typeof requireAuth==='function')return requireAuth();return authModal('account')}
 const o=byId(S.offers,id);if(!o||o.is_active===false)return say('Cette offre n’est plus disponible.');
 if(o.reservation_enabled!==true)return say('Cette offre n’est pas réservable en ligne actuellement.');
 if(o.ends_at&&new Date(o.ends_at)<=new Date())return say('Cette offre est terminée.');
 if(o.quantity!=null&&Number(o.quantity)<=0)return say('Cette offre est épuisée.');
 openModal(`<h2>Réserver l’offre</h2><div class="form"><label>Quantité</label><input id="rq" type="number" min="1" max="${Math.max(1,Math.min(50,Number(o.quantity||50)))}" value="1"><label>Message (facultatif)</label><textarea id="rn" rows="3" placeholder="Précision pour le commerçant"></textarea><button class="btn green" onclick="confirmReserve('${e(id)}')">Confirmer la réservation</button></div>`);
};
window.confirmReserve=async function(id){const o=byId(S.offers,id),q=Number(document.getElementById('rq')?.value||1);if(!Number.isInteger(q)||q<1||q>50)return say('Quantité invalide.');if(o?.quantity!=null&&q>Number(o.quantity))return say('La quantité demandée n’est plus disponible.');const note=document.getElementById('rn')?.value.trim()||null;const {error}=await sb.rpc('ic_reserve_offer',{p_offer_id:id,p_quantity:q,p_note:note});if(error)return say(friendly(error));closeModal();say('Réservation envoyée au commerçant.');if(typeof refresh==='function')await refresh();};

// ---- Commandes / devis : message explicite si le professionnel n’a pas activé le service.
const oldOrderProduct=window.orderProduct;
window.orderProduct=function(id){
 const p=byId(S.products,id),b=p?byId(S.businesses,p.business_id):null;if(!p||p.is_active===false)return say('Ce produit ou service n’est plus disponible.');
 if(!b?.owner_id)return messageUnavailable(b);
 if(!['pro','proplus'].includes(String(b.plan||''))){
   openModal(`<h2>${p.price!=null?'Commander':'Demander un devis'}</h2><div class="notice">Les commandes/devis en ligne ne sont pas activés pour <b>${e(b.name)}</b>.</div><p>Vous pouvez néanmoins contacter le professionnel directement.</p><div class="actions"><button class="btn brand" onclick="closeModal();messageBusiness('${e(b.id)}')">💬 Contacter</button><button class="btn" onclick="closeModal()">Fermer</button></div>`);return;
 }
 return typeof oldOrderProduct==='function'?oldOrderProduct(id):null;
};
window.confirmProduct=async function(id){const p=byId(S.products,id);if(!p)return say('Produit ou service introuvable.');const q=Number(document.getElementById('pq')?.value||1);if(!Number.isInteger(q)||q<1||q>50)return say('Quantité invalide.');const note=document.getElementById('pn')?.value.trim()||null;const {error}=await sb.rpc('ic_order_product',{p_product_id:id,p_quantity:q,p_note:note});if(error)return say(friendly(error));closeModal();say(p.price==null?'Demande de devis envoyée.':'Commande envoyée.');if(typeof loadPrivate==='function')await loadPrivate();};

// ---- Emploi : pas de double candidature involontaire.
window.confirmJob=async function(id){if(!S.session)return authModal('account');const job=byId(S.jobs,id);if(!job||job.is_active===false)return say('Cette offre d’emploi n’est plus active.');const uid=S.session.user.id;const {data:existing,error:qerr}=await sb.from('ic_job_applications').select('id').eq('job_id',id).eq('applicant_id',uid).limit(1);if(qerr)return say(friendly(qerr));if(existing?.length){closeModal();return say('Vous avez déjà postulé à cette offre.');}const message=document.getElementById('jobMsg')?.value.trim()||null;const {error}=await sb.from('ic_job_applications').insert({job_id:id,applicant_id:uid,message});if(error)return say(friendly(error));closeModal();say('Candidature envoyée.');};

// ---- Statuts commandes : utiliser la RPC sécurisée déjà présente côté serveur.
window.setOrder=async function(id,status){
 const allowed=['accepted','ready','completed','cancelled'];if(!allowed.includes(status))return say('Statut invalide.');
 const {error}=await sb.rpc('ic_set_order_status',{p_order_id:id,p_status:status});if(error)return say(friendly(error));say('Statut de la commande mis à jour.');if(typeof loadPrivate==='function')await loadPrivate();if(typeof render==='function')render();
};

// ---- Saisie habitant : validations minimales avant d’écrire dans la base.
window.saveClassified=async function(){if(!S.session)return authModal('classifieds');const title=document.getElementById('ct')?.value.trim()||'',desc=document.getElementById('cd')?.value.trim()||'',raw=document.getElementById('cp')?.value||'',price=raw===''?null:Number(raw);if(title.length<3)return say('Ajoutez un titre à votre annonce.');if(raw!==''&&(!Number.isFinite(price)||price<0))return say('Prix invalide.');const {error}=await sb.from('ic_classifieds').insert({user_id:S.session.user.id,kind:document.getElementById('ck')?.value||'vente',title,description:desc||null,price,city:S.profile?.city||'Issoire'});if(error)return say(friendly(error));closeModal();say('Annonce publiée.');if(typeof refresh==='function')await refresh();};
window.saveResidentEvent=async function(){if(!S.session)return authModal('events');const title=document.getElementById('et')?.value.trim()||'',raw=document.getElementById('ed')?.value||'',place=document.getElementById('ep')?.value.trim()||'',d=new Date(raw);if(title.length<3)return say('Ajoutez un titre à l’événement.');if(!raw||Number.isNaN(d.getTime()))return say('Indiquez une date et une heure valides.');if(!place)return say('Indiquez le lieu.');const {error}=await sb.from('ic_events').insert({user_id:S.session.user.id,title,starts_at:d.toISOString(),place,description:document.getElementById('ee')?.value.trim()||null});if(error)return say(friendly(error));closeModal();say('Événement publié.');if(typeof refresh==='function')await refresh();};

// ---- Normaliser tous les sélecteurs de rayon encore produits par les anciens modules.
function normalizeRadiusSelect(sel){if(!sel)return;const vals=[...sel.options].map(o=>Number(o.value)).filter(Number.isFinite);if(!vals.some(v=>RADII.includes(v))&&!/radius|rayon|distance/i.test((sel.id||'')+' '+(sel.name||'')))return;const allowZero=vals.includes(0),cur=Number(sel.value||10);const best=RADII.includes(cur)?cur:(cur<=1?1:cur<=5?5:cur<=10?10:cur<=20?20:50);sel.innerHTML=(allowZero?'<option value="0">Toutes distances</option>':'')+RADII.map(v=>`<option value="${v}" ${v===best?'selected':''}>${v} km</option>`).join('');sel.value=String(allowZero&&cur===0?0:best);}
function syncActions(root=document){
 root.querySelectorAll?.('select').forEach(normalizeRadiusSelect);
 root.querySelectorAll?.('[onclick*="messageBusiness("]').forEach(btn=>{const m=(btn.getAttribute('onclick')||'').match(/messageBusiness\('([^']+)'\)/);const b=m?byId(S.businesses,m[1]):null;if(b&&!b.owner_id){btn.disabled=true;btn.textContent='💬 Messagerie après revendication';btn.title='Aucun compte professionnel n’est encore relié à cette fiche.'}else if(b&&isOwn(b.owner_id)){btn.disabled=true;btn.textContent='Votre établissement';}});
 root.querySelectorAll?.('[onclick*="reserveOffer("]').forEach(btn=>{const m=(btn.getAttribute('onclick')||'').match(/reserveOffer\('([^']+)'\)/),o=m?byId(S.offers,m[1]):null;if(o&&o.reservation_enabled!==true){const b=byId(S.businesses,o.business_id);if(b){btn.setAttribute('onclick',`viewBusiness('${b.id}')`);btn.textContent='Voir le professionnel';}else{btn.disabled=true;btn.textContent='Réservation indisponible';}}});
}
const obs=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)syncActions(n)});obs.observe(document.body,{childList:true,subtree:true});setTimeout(()=>syncActions(document),100);
window.icV41FunctionalAudit={version:'41.0',radii:RADII,friendlyError:friendly,syncActions};
})();
