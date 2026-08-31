(()=>{
if(typeof S==='undefined'||typeof sb==='undefined')return;
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATEGORIES=[['alimentaire','Alimentation & boulangerie'],['restauration','Restaurants & cafés'],['shopping','Mode & shopping'],['beaute','Beauté & bien-être'],['maison','Maison & travaux'],['auto','Auto & mobilité'],['services','Services & professionnels'],['loisirs','Loisirs & culture'],['tourisme','Tourisme & hébergement'],['sante','Santé & paramédical'],['autre','Autre']];
const TYPES=[['promotion','Promotion / bon plan'],['invendu','Invendu'],['destockage','Déstockage'],['derniere_minute','Dernière minute']];
const _proAccountStudio=proAccount;
const mine=()=>Array.isArray(S.myBusinesses)?S.myBusinesses:[];
const myOffers=()=>Array.isArray(S.myOffers)?S.myOffers:[];
const ownBusiness=id=>mine().find(b=>b.id===id);
const ownOffer=id=>myOffers().find(o=>o.id===id&&o.source_type!=='external_public'&&o.source_type!=='admin');
const paymentReady=id=>{const a=(Array.isArray(S.paymentAccounts)?S.paymentAccounts:[]).find(x=>x.business_id===id);return !!(a?.onboarding_complete&&a?.charges_enabled)};
const priceText=o=>o?.price_label||((o?.sale_price!==null&&o?.sale_price!==undefined)?Number(o.sale_price).toLocaleString('fr-FR',{style:'currency',currency:'EUR'}):'Voir conditions');
const num=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const x=Number(String(v).replace(',','.'));return Number.isFinite(x)?x:null};
const dt=v=>{if(!v)return '';const d=new Date(v);if(Number.isNaN(d.getTime()))return '';const p=x=>String(x).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};
const iso=v=>v?new Date(v).toISOString():null;
const opts=(rows,selected)=>rows.map(([v,l])=>`<option value="${E(v)}" ${v===selected?'selected':''}>${E(l)}</option>`).join('');
function friendly(error){const m=String(error?.message||error||'Action impossible');if(/Abonnement professionnel|paid_business_plan_required/i.test(m))return 'Un forfait professionnel payant actif est requis pour publier, modifier ou réactiver un bon plan visible.';if(/merchant_payment_account_not_ready/i.test(m))return 'Le compte de paiement du commerce doit être configuré avant d’activer « Réserver et payer ».';if(/revendiqu/i.test(m))return 'La fiche du commerce doit d’abord être revendiquée et validée.';return m.replaceAll('_',' ')}
function businessOptions(selected){return mine().map(b=>`<option value="${E(b.id)}" ${b.id===selected?'selected':''}>${E(b.name)}</option>`).join('')}

window.openCreateDeal=function(businessId){
 if(!S.session){say('Connectez-vous avec votre compte professionnel pour publier un bon plan.');authModal('account');return}
 if(!mine().length)return say('Vous devez d’abord revendiquer et faire valider votre établissement.');
 const bid=ownBusiness(businessId)?.id||mine()[0].id;openEditor(null,bid);
};
window.openEditDeal=function(id){if(!S.session)return authModal('account');const o=ownOffer(id);if(!o)return say('Cette offre ne peut pas être modifiée depuis votre compte.');openEditor(o,o.business_id)};

function openEditor(o,bid){
 const edit=!!o,ready=paymentReady(bid),reservable=!!o?.reservation_enabled;
 openModal(`<h2>${edit?'✏️ Modifier':'🔥 Créer'} un bon plan</h2><div class="notice"><b>Service professionnel payant</b><br>Vous pouvez créer une offre dans n’importe quelle catégorie, même si votre établissement n’avait encore aucun bon plan. « Réserver et payer » nécessite également un compte de paiement commerçant vérifié.</div><div class="form"><label>Établissement</label><select id="dealStudioBusiness" ${edit?'disabled':''}>${businessOptions(bid)}</select><label>Catégorie</label><select id="dealStudioCategory">${opts(CATEGORIES,o?.category||'autre')}</select><label>Type d’offre</label><select id="dealStudioType">${opts(TYPES,o?.offer_type||'promotion')}</select><label>Titre *</label><input id="dealStudioTitle" maxlength="140" value="${E(o?.title||'')}" placeholder="Ex. Panier anti-gaspi du soir"><label>Description</label><textarea id="dealStudioDescription" rows="5" maxlength="3000">${E(o?.description||'')}</textarea><div class="grid"><div><label>Prix normal (€)</label><input id="dealStudioOriginal" inputmode="decimal" value="${o?.original_price??''}" placeholder="12,90"></div><div><label>Prix du bon plan (€)</label><input id="dealStudioSale" inputmode="decimal" value="${o?.sale_price??''}" placeholder="7,90"></div></div><label>Texte de prix facultatif</label><input id="dealStudioPriceLabel" maxlength="120" value="${E(o?.price_label||'')}" placeholder="Ex. -30 %, 2 achetés = 1 offert"><label>Stock / quantité disponible</label><input id="dealStudioQty" type="number" min="0" max="100000" value="${o?.quantity??''}" placeholder="Vide = illimité"><div class="grid"><div><label>Début</label><input id="dealStudioStart" type="datetime-local" value="${dt(o?.starts_at||new Date())}"></div><div><label>Fin</label><input id="dealStudioEnd" type="datetime-local" value="${dt(o?.ends_at)}"></div></div><label>Retrait avant</label><input id="dealStudioPickup" type="datetime-local" value="${dt(o?.pickup_deadline)}"><label><input id="dealStudioReservable" type="checkbox" ${reservable?'checked':''}> Activer « Réserver et payer »</label><div class="muted">${ready?'✅ Compte de paiement prêt pour cet établissement.':'⏳ Compte de paiement à configurer avant toute réservation payante.'}</div><label><input id="dealStudioActive" type="checkbox" ${o?.is_active===false?'':'checked'}> Offre visible immédiatement</label><button class="btn brand" id="dealStudioSave" onclick="saveDeal('${E(o?.id||'')}')">💾 ${edit?'Enregistrer':'Publier le bon plan'}</button></div>`)
}

window.saveDeal=async function(id){
 if(!S.session)return authModal('account');const existing=id?ownOffer(id):null;if(id&&!existing)return say('Accès refusé.');
 const businessId=existing?.business_id||$('#dealStudioBusiness')?.value,b=ownBusiness(businessId);if(!b)return say('Établissement non autorisé.');
 const title=$('#dealStudioTitle')?.value.trim()||'';if(title.length<3)return say('Ajoutez un titre plus précis.');
 const original=num($('#dealStudioOriginal')?.value),sale=num($('#dealStudioSale')?.value),rawQty=$('#dealStudioQty')?.value,quantity=rawQty===''?null:Math.max(0,Math.floor(Number(rawQty)));
 const starts=iso($('#dealStudioStart')?.value),ends=iso($('#dealStudioEnd')?.value),pickup=iso($('#dealStudioPickup')?.value),reservation=!!$('#dealStudioReservable')?.checked,isActive=!!$('#dealStudioActive')?.checked;
 if(ends&&starts&&new Date(ends)<=new Date(starts))return say('La date de fin doit être après la date de début.');
 if(reservation&&(!sale||sale<=0))return say('Un prix numérique supérieur à 0 € est nécessaire pour « Réserver et payer ».');
 if(reservation&&!paymentReady(businessId))return say('Configurez d’abord le compte de paiement de cet établissement.');
 const payload={business_id:businessId,offer_type:$('#dealStudioType')?.value||'promotion',category:$('#dealStudioCategory')?.value||'autre',title,description:$('#dealStudioDescription')?.value.trim()||null,original_price:original,sale_price:sale,price_label:$('#dealStudioPriceLabel')?.value.trim()||null,quantity:Number.isFinite(quantity)?quantity:null,starts_at:starts||new Date().toISOString(),ends_at:ends,pickup_deadline:pickup,is_active:isActive,source_type:'merchant',source_name:null,source_url:null,source_offer_key:null,source_checked_at:null,reservation_enabled:reservation,payment_required:reservation};
 const btn=$('#dealStudioSave');if(btn){btn.disabled=true;btn.textContent='Enregistrement…'}
 const q=existing?sb.from('ic_offers').update(payload).eq('id',id).select('*').single():sb.from('ic_offers').insert(payload).select('*').single();
 const {data,error}=await q;if(error){if(btn){btn.disabled=false;btn.textContent='Réessayer'}return say(friendly(error))}
 closeModal();say(existing?'Bon plan mis à jour.':'Bon plan publié.');if(typeof loadPrivate==='function')await loadPrivate();proAccount();return data;
};
window.toggleDealActive=async function(id,enabled){const o=ownOffer(id);if(!o)return say('Offre introuvable.');const {error}=await sb.from('ic_offers').update({is_active:!!enabled}).eq('id',id);if(error)return say(friendly(error));say(enabled?'Bon plan réactivé.':'Bon plan désactivé.');if(typeof loadPrivate==='function')await loadPrivate();proAccount()};

function studio(){
 if(!mine().length)return '';
 return `<div class="sectionhead"><div><h2>🔥 Studio Bons plans</h2><p>Créez promotions, invendus, déstockages et offres de dernière minute dans toutes les catégories.</p></div></div>${mine().map(b=>{const rows=myOffers().filter(o=>o.business_id===b.id&&o.source_type!=='external_public'&&o.source_type!=='admin');return `<article class="card" style="margin-bottom:12px"><div class="row between"><div><h3>${E(b.name)}</h3><div class="muted">${rows.length} bon plan${rows.length>1?'s':''} créé${rows.length>1?'s':''}</div></div><button class="btn brand" onclick="openCreateDeal('${E(b.id)}')">＋ Nouveau bon plan</button></div>${rows.length?`<div style="margin-top:10px">${rows.map(o=>`<div class="notice" style="margin-top:8px"><div class="row between"><div><b>${E(o.title)}</b><div class="muted">${E(TYPES.find(x=>x[0]===o.offer_type)?.[1]||o.offer_type)} · ${E(priceText(o))} · ${o.is_active?'🟢 visible':'⚪ désactivée'}${o.reservation_enabled?' · 💳 réservable':''}${o.ends_at&&new Date(o.ends_at)<new Date()?' · ⌛ terminée':''}</div></div><div class="actions"><button class="btn" onclick="openEditDeal('${E(o.id)}')">Modifier</button><button class="btn" onclick="toggleDealActive('${E(o.id)}',${!o.is_active})">${o.is_active?'Désactiver':'Réactiver'}</button></div></div></div>`).join('')}</div>`:'<div class="empty" style="margin-top:10px">Aucun bon plan pour cet établissement. Vous pouvez en créer un maintenant.</div>'}</article>`}).join('')}`
}
proAccount=function(){const out=_proAccountStudio();if(S.session){try{main.insertAdjacentHTML('beforeend',studio())}catch(e){console.error('Issoire Connect deal studio',e)}}return out};
})();
